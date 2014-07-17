# leekwars-autoplay


## What does it do?

This is but a little *greasemonkey* script that adds a nice "Autoplay" button
on http://leekwars.com/garden. When pressed, this little button triggers a
cascading mess that tries to do the best possible matchmaking in order for you
to spend all your daily points in a clever manner.

All output is printed to the debug console.


### Team points

In its current state, the script supposes you only have one compo with all your
leeks in it. It'll match it against the team with the highest total level
(granting lots of XP whether you win or lose if your compo is small) as long as
you have team fight points.


### Farmer points

The script will match you against the farmer with the highest total level as
long as you have team fight points.


### Solo points

For each enemy of each of your leeks, the script will trigger two
challenges. Only the leeks you've beaten in both challenges will get the honor
of being attacked in real combat. The script stops attacking any leek that
manages to win a match. This ensures that you win as many fights as possible.



## So what?

This is a work in progress. That is the first real javascript script that I've
ever written, so I *know* it is full of code smells. Any remark will therefore
be appreciated and considered a chance to improve!

The script could be improved to handle several compos. Its ugly internal
queuing system could be cleaned. The button could be CSSified. The output log
could be shown to the user.
