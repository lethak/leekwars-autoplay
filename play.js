// ==UserScript==
// @name        Autoplay
// @namespace   leekwars
// @include     http://leekwars.com/garden
// @version     1
// ==/UserScript==

function main() {
    /* Constants */

    var TIME_DELAY = 6000;



    /* Global state */

    var leekAction = [];
    var soloFights = {};
    var prcTimeout = null;



    /* Queue manipulation */

    function enqueue(fun) {
        leekAction.push(fun);
        schedule();
    }

    function proceed() {
        prcTimeout = null;
        if (leekAction.length > 0) {
            leekAction.shift()();
            schedule();
        }
    }

    function schedule() {
        if (prcTimeout == null) {
            prcTimeout = setTimeout(proceed, TIME_DELAY);
        }
    }


    /* API abuse */

    function getReport(mLeek, eLeek, report, callback) {
        $.get("/report/" + report, function(data) {
            var as = data.match(/alive[^\n]*href='\/leek\/[^']*'/g).map(function(m) { return m.match("href='/leek/(.*)'")[1]; });
            var res = 1 + (as.indexOf(mLeek) != -1 ? 1 : 0) - (as.indexOf(eLeek) != -1 ? 1 : 0);
            callback(res);
        });
    }

    function challengeLeek(mLeek, eLeek, callback) {
        console.log("[challengeLeek] " + mLeek + " vs " + eLeek);
        ajax('garden_update', {leek_id: mLeek, challenge_id: eLeek}, function(data) {
            if (!isNaN(parseInt(data))) {
                enqueue(function() { getReport(mLeek, eLeek, data, callback); });
            } else {
                console.error("[challengeLeek] API call returned: " + data);
            }
        });
    }

    function attackLeek(mLeek, eLeek, callback) {
        console.log("[attackLeek] " + mLeek + " vs " + eLeek);
        ajax('garden_update', {leek_id: mLeek, enemy_id: eLeek}, function(data) {
            if (!isNaN(parseInt(data))) {
                enqueue(function() { getReport(mLeek, eLeek, data, callback); });
            } else {
                console.error("[attackLeek] API call returned: " + data);
            }
        });
    }

    function attackGroup(eGroup, callback) {
        console.log("[attackGroup] " + _myCompo + " vs " + eGroup);
        ajax('garden_update', {my_team: _myCompo, target_team: eGroup}, function(data) {
            if (!isNaN(parseInt(data))) {
                callback();
            } else {
                console.error("[attackGroup] API call returned: " + data);
            }
        });
    }

    function attackFarmer(eFarmer, callback) {
        console.log("[attackFarmer] me vs " + eFarmer);
        ajax('garden_update', {target_farmer: eFarmer}, function(data) {
            if (!isNaN(parseInt(data))) {
                callback();
            } else {
                console.error("[attackFarmer] API call returned: " + data);
            }
        });
    }



    /* Fight methods */

    function soloFight(mLeek, eLeek, c) {
        if (c > 0) {
            challengeLeek(mLeek, eLeek, function(score) {
                if (score == 2) {
                    enqueue(function() { soloFight(mLeek, eLeek, (c - 1)); });
                } else {
                    console.warn("[soloFight] lost challenge against " + eLeek + ": aborting");
                }
            });
        } else if (soloFights[mLeek] > 0) {
            soloFights[mLeek] -= 1;
            attackLeek(mLeek, eLeek, function(score) {
                if (score == 2) {
                    enqueue(function() { soloFight(mLeek, eLeek, 0); });
                } else {
                    console.error("[soloFight] lost attack against " + eLeek + ": aborting");
                }
            });
        }
    }

    function groupFight(eGroup, a) {
        if (a > 0) {
            attackGroup(eGroup, function() {
                enqueue(function() { groupFight(eGroup, a - 1); });
            });
        }
    }

    function farmerFight(eFarmer, a) {
        if (a > 0) {
            attackFarmer(eFarmer, function() {
                enqueue(function() { farmerFight(eFarmer, a - 1); });
            });
        }
    }



    /* Garden extraction */

    function getMyLeeks() {
        var itType = XPathResult.UNORDERED_NODE_ITERATOR_TYPE;
        var expr   = "//div[contains(@class,'myleek')]/@id";
        var mLeeks = document.evaluate(expr, document, null, itType, null);
        var leek   = mLeeks.iterateNext();
        var res    = [];

        while (leek) {
            res.push(leek.value);
            leek = mLeeks.iterateNext();
        }

        return res;
    }

    function getLeekEnemies(leek) {
        var itType = XPathResult.UNORDERED_NODE_ITERATOR_TYPE;
        var expr   = "//div[contains(@class,'enemies') and @leek='" + leek + "']//div[contains(@class,'enemy')]/@id";
        var eLeeks = document.evaluate(expr, document, null, itType, null);
        var leek   = eLeeks.iterateNext();
        var res    = [];

        while (leek) {
            res.push(leek.value);
            leek = eLeeks.iterateNext();
        }

        return res;
    }

    function getBestGroup() {
        var expr = "//div[contains(@class,'enemies-compos')]/div[contains(@class,'enemyCompo')]";
        var node = document.evaluate(expr, document, null, XPathResult.ANY_TYPE, null);
        var maxL = 0;
        var best = 0;
        var comp = node.iterateNext();

        while (comp) {
            var levl = parseInt(comp.textContent.match(/Niveau total [0-9]*/)[0].match(/ [0-9]*$/)[0]);
            if (levl > maxL) {
                maxL = levl;
                best = comp.id;
            }
            comp = node.iterateNext();
        }

        return parseInt(best);
    }

    function getBestFarmer() {
        var expr = "//div[@id='farmers']/div[contains(@class,'farmer')]";
        var node = document.evaluate(expr, document, null, XPathResult.ANY_TYPE, null);
        var maxL = 0;
        var best = 0;
        var farm = node.iterateNext();

        while (farm) {
            var levl = parseInt(farm.textContent.match(/Niveau total [0-9]*/)[0].match(/ [0-9]*$/)[0]);
            if (levl > maxL) {
                maxL = levl;
                best = farm.id;
            }
            farm = node.iterateNext();
        }

        return parseInt(best);
    }

    function getRemainingSoloFights(leek) {
        var expr = "//div[@id='enemies']/div[@id='" + leek + "']/span[contains(@class,'fights')]";
        var node = document.evaluate(expr, document, null, XPathResult.ANY_TYPE, null);
        return parseInt(node.iterateNext().textContent);
    }

    function getRemainingGroupFights() {
        var expr = "//div[@id='tab-team']/span[contains(@class,'fights')]";
        var node = document.evaluate(expr, document, null, XPathResult.ANY_TYPE, null);
        return parseInt(node.iterateNext().textContent);
    }

    function getRemainingFarmerFights() {
        var expr = "//div[@id='tab-farmer']/span[contains(@class,'fights')]";
        var node = document.evaluate(expr, document, null, XPathResult.ANY_TYPE, null);
        return parseInt(node.iterateNext().textContent);
    }



    /* Main stuff */

    function enqueueSoloFight(m, e, c) {
        enqueue(function() { soloFight(m, e, c); });
    }

    function autoPlay() {
        enqueue(function() {  groupFight(getBestGroup(),  getRemainingGroupFights());  });
        enqueue(function() { farmerFight(getBestFarmer(), getRemainingFarmerFights()); });

        var mLeeks = getMyLeeks();
        for (var i = 0; i < mLeeks.length; i++) {
            var mLeek = mLeeks[i];
            soloFights[mLeek] = getRemainingSoloFights(mLeek);
            var eLeeks = getLeekEnemies(mLeek);
            for (var j = 0; j < eLeeks.length; j++) {
                var eLeek = eLeeks[j];
                enqueueSoloFight(mLeek, eLeek, 2);
            }
        }
    }

    function addAutoPlayButton() {
        var buttonContainer = document.createElement('div');
        buttonContainer.innerHTML = '<button id="autoPlayButton" type="button">Autoplay!</button>';
        buttonContainer.setAttribute('id', 'buttonContainer');
        buttonContainer.setAttribute('style', 'margin: auto');
        var garden = document.getElementById("garden-right");
        garden.insertBefore(buttonContainer, garden.firstChild);
        document.getElementById("autoPlayButton").addEventListener("click", autoPlay, false);
    }

    addAutoPlayButton();
}



/* Injection */

function exec(fn) {
    var script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = '(' + fn + ')();';
    document.body.appendChild(script); // run the script
    document.body.removeChild(script); // clean up
}

window.addEventListener("load", function() {
    exec(main);
}, false);
