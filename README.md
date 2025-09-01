Hi everyone!
Here’s a new module for Max/MSP — a matrix-based Markov sequencer.

🌟 Features

Fully implemented in JSUI

Quickly adjust the number of steps (1 to 32), the grid updates automatically

Save and load states via JSON

Insert directly as a bpatcher from the Modules tab

Comes with a handy help file including examples

How it works
Each cell defines a weight for the transition from the current step to the next. The higher the weight, the greater the chance this transition will be chosen. The result is a “living” pattern that constantly evolves while preserving its internal logic.

Try it out, experiment, and share your feedback 
Happy patching! ✨

📥 Installation:
Download the folder KVEF.markov_seq.
Place it into the Packages directory of Max:
macOS:
Max 9 → ~/Documents/Max 9/Packages/
Max 8 → ~/Documents/Max 8/Packages/
Windows:
Max 9 → \Users\<USERNAME>\Documents\Max 9\Packages\
Max 8 → \Users\<USERNAME>\Documents\Max 8\Packages\
After restarting Max, the package will appear in File Browser → Packages → Modules.

by KVEF
