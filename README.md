# xorworld

A tiny three.js experiment. No random numbers are involved (unless you click randomize!).
Generation 652207 says hello:

![](https://eloquence.github.io/xorworld/example.png)


The grid is constructed initially with each value set to 1. Then, every cell
is XOR'd to its left neighbor, or to its right one if "flip" is toggled.
This operation is run repeatedly, and complexity emerges - similar to cellular
automata, but the operation is carried forward cell by cell, rather than being
applied against the whole grid in its previous state.

The colors simply highlight cells that haven't changed state for a while. We retain
a history of up to 20 previous states.

Play with it at https://eloquence.github.io/xorworld - uses WebGL and local storage,
tested w/ desktop Firefox and Chrome.

The music, if you turn it on, is the [Alice Band Mix of "Life in Mono"](https://soundcloud.com/jzerenidis/mono-formica-blues-11-life-in-mono-alice-band-mix).
