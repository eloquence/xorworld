# xorworld

A tiny three.js experiment. No random numbers are involved (unless you click randomize!).
The grid is constructed initially with each value set to 1. Then, every cell
is XOR'd to its left neighbor. This operation is run repeatedly, and
complexity emerges - similar to cellular automata, but the operation is carried
forward cell by cell, rather than being applied against the whole grid in its
previous state.

Play with it at https://eloquence.github.io/xorworld - uses WebGL and local storage,
tested w/ desktop Firefox and Chrome.
