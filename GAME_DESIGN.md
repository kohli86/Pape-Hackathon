# AquaGrid — Game Design Brief

## One-line pitch

A city water engineer rotates a randomly generated pipe network to reconnect a reservoir to a school and restore its clean-water supply.

## Team credit

**AquaGrid by Vector Coders.**

## SDG connection

**UN SDG 6: Clean Water and Sanitation.** The game introduces the importance of reliable water infrastructure, access to safe water, and reducing water loss. It represents these ideas through a hands-on network-routing challenge rather than a quiz.

## Player role

The player is a water-systems engineer working for a fictional city water authority. Every completed level restores the supply to a school in a different district.

## Core loop

1. Inspect a disconnected pipe network.
2. Rotate pipe sections by 90 degrees.
3. Observe which pipe sections connect to the reservoir.
4. Test the route.
5. Complete the level when water reaches the school.
6. Generate a new district and repeat.

## Core mechanics

- Straight pipes connect two opposite sides.
- Elbow pipes connect two adjacent sides.
- A connection works only when neighbouring pipe ends face each other.
- The reservoir has an east-facing outlet; the school accepts water through a south-facing entrance.
- Hints highlight the next solution pipe that is not aligned.
- The score rewards efficient rotations and deducts points for extra moves and hints.
- Reset restores the same puzzle; Next Level generates a new one.

## Procedural level generation

AquaGrid uses a randomized grid-path generator instead of a fixed list of levels.

1. Choose a board size based on the level number. It starts at 6 × 6 and grows by one row and column every three levels, up to 10 × 10.
2. Reserve the bottom-left cell for the reservoir and the top-right cell for the school.
3. Start beside the reservoir. Randomly interleave the north and east moves needed to reach the cell beside the school. This creates a valid simple path, with a different route ordering on each generation.
4. From later levels onward, add detours. A detour replaces one adjacent step with three steps around two unused neighbouring cells. This lengthens the route while keeping every pipe connected.
5. Convert each route cell into a straight pipe or elbow pipe according to the directions to its previous and next cells.
6. Scramble the route pipes. The first pipe is deliberately rotated so it does not connect to the reservoir at the start. Add decoy pipes away from the intended route.

The level counter is not capped at three. After the board reaches 10 × 10, randomized routes, detours, pipe rotations, and decoys continue to create new puzzles. Random generation can theoretically repeat a layout, but play continues without a fixed final level.

## Flow validation

The game uses **breadth-first search (BFS)** from the reservoir. It follows a connection only when the current pipe has an opening in a direction and the neighbouring pipe has the matching opposite opening. If BFS reaches the school cell, the level is solved. This validates the actual pipe layout instead of simply checking whether a player has clicked every pipe.

## Learning outcome

Players experience how the layout and condition of infrastructure affect whether water can reach a community. The educational panel introduces SDG 6 and links to the United Nations' official goal page.

## Play-test questions

- Can a new player understand how to rotate a pipe without help?
- Is the goal obvious from the reservoir and school icons?
- Does the flow highlighting make the network logic understandable?
- Is the hint useful without solving the entire level?
- Do later levels feel more challenging without becoming frustrating?


## Run rules: lives, time and score

- The player begins a run with three shared lives.
- Each level gets a countdown based on its board size and level index (minimum 50 seconds at Level 1; capped at 110 seconds).
- A failed TEST WATER FLOW action consumes one life and leaves the current puzzle and countdown unchanged. If the countdown reaches zero, the run ends immediately without first consuming a life.
- When all three lives are lost, the run ends. Restarting begins again at Level 1 with three lives and zero score.
- Successful completion awards 100 base points, 5 points per second remaining, up to 100 move-efficiency points, and a 20-point penalty for each hint used. The minimum level score is 25.
- Resetting pipe orientations does not reset the countdown, move count, or hint count.


## Run rules: lives, test attempts, and countdown

The player starts a run with three lives. Rotating pipes and watching the live network preview are safe actions. A life is deducted only when the player presses **TEST WATER FLOW** and the route has not reached the school. The player remains on the same board after a failed test, with the current timer and pipe arrangement preserved. Three failed tests end the run and restart is available from Level 1.

The level countdown is a separate hard deadline. If it reaches zero, the run ends immediately; a life is not deducted as an intermediate step. Completing a level awards points based on the remaining time, pipe-turn efficiency, and hint usage.

The illustrated community school is a visual SDG 6 feedback element. As time falls below half, below one quarter, and finally reaches zero, the tank reserve drains and the school scene changes from stable to strained, critical, and without supply. This links the timer to the real-world consequence represented by the game: interrupted access to clean water at a school.
