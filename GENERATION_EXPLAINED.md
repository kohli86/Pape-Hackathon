# How AquaGrid creates endless levels

AquaGrid does not read puzzles from a list. JavaScript builds a fresh puzzle whenever the player selects **NEXT LEVEL**.

## 1. Pick a board size

The first level uses a 6 × 6 board. The game adds one row and one column every three levels until the board reaches 10 × 10.

## 2. Make a route

The reservoir sits in the bottom-left corner and the school sits in the top-right corner. The generator starts in the cell beside the reservoir. It must move north and east until it reaches the cell beside the school.

The order of those moves is randomized. For example, one route might move north, east, north, east; another might move east, east, north, north. Both routes reach the destination, but the pipe layouts are different.

## 3. Add detours on harder levels

From Level 3 onward, the generator can replace a direct step with a small three-step detour around two unused cells. For example:

```text
Before:  A ─── B

After:   A
          │
          └───┐
              B
```

The exact detour direction depends on which neighbouring cells are free. Each detour adds two pipe sections and keeps the route connected.

## 4. Turn the route into pipe pieces

For each cell on the route, JavaScript checks the previous and next cells:

- If the pipe must connect opposite directions, it becomes a straight pipe.
- If it must connect two neighbouring directions, it becomes an elbow pipe.

The game stores the correct pipe orientation internally, then rotates the visible pipe away from that orientation to scramble the puzzle. The first pipe is always disconnected from the reservoir at the start, so the level does not begin completed.

## 5. Add decoys

As levels increase, extra straight and elbow pipes appear in empty spaces. They do not touch the intended route, so they cannot break its guaranteed solution. They make it harder to focus on the correct pieces.

## 6. Check the player's solution with BFS

When the player presses **TEST WATER FLOW**, the game runs Breadth-First Search (BFS):

1. Put the reservoir in a queue.
2. Look at each opening in the current pipe.
3. Move to a neighbouring cell only when that pipe has the matching opposite opening.
4. Mark each reached cell so it is not visited repeatedly.
5. Continue until there are no more connected cells or the school is reached.

If BFS reaches the school, the player wins the level. This checks the actual pipe connections, not simply whether all the pieces were clicked.

## Does “endless” mean infinite unique boards?

The level counter has no final level and the generator can keep producing new puzzles. The board size tops out at 10 × 10, while routes, detours, rotations and decoy placements keep being randomized. Because random generators can theoretically repeat an output, this means **endless playable levels**, not a mathematical guarantee that every single layout will be unique forever.

## Judge-ready explanation

> “AquaGrid uses procedural generation. Every time a new level starts, JavaScript creates a randomized route from the reservoir to the school, adds difficulty through detours and decoy pipes, and converts the route into straight and elbow pieces. We then use Breadth-First Search to validate the player's pipe connections. This means the game is not limited to a fixed set of levels: it generates new puzzles continuously.”


## Timed runs and scoring

Every run begins with three lives. A countdown is assigned to each level using the current board size and level number:

`min(110, 50 + (boardSize - 6) × 8 + min(30, level - 1))` seconds.

If time expires, a life is removed and the same level is generated again with a new randomized puzzle. When no lives remain, the run-over screen offers a restart from Level 1. A new run resets lives to three and total score to zero.

On level completion, the game adds the following points to the run total:

- 100 base points;
- 5 points per second remaining on the timer;
- up to 100 move-efficiency points, decreasing by 5 for each rotation beyond the generated optimal move count;
- 20 points deducted per hint.

The level award cannot fall below 25 points. Resetting pipe orientations does not refill the timer or erase move/hint counts.
