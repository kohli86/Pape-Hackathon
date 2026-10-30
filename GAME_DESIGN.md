# AquaGrid — Game Design Brief

## One-line pitch

A city water engineer must rotate a damaged pipe network to reconnect a reservoir to a school and restore its clean-water supply.

## SDG connection

**UN SDG 6: Clean Water and Sanitation.** The prototype introduces the importance of reliable water infrastructure, access to safe water, and reducing water loss. The game represents these ideas through a simple network-routing challenge rather than a quiz.

## Player role

The player is a water-systems engineer working for the fictional Northside Water Authority.

## Core loop

1. Inspect the disconnected pipe network.
2. Rotate pipe sections by 90 degrees.
3. Observe which pipe sections connect to the reservoir.
4. Test the route.
5. Complete the mission when water reaches the school.

## Core mechanics

- Straight pipes connect two opposite sides.
- Elbow pipes connect two adjacent sides.
- A connection only works when both neighbouring pipe ends face each other.
- The source has an east-facing outlet.
- The school accepts water from its south-facing entrance.
- Hints identify the next route pipe that is not aligned.
- The score rewards an efficient solution and deducts points for extra turns and hints.

## Prototype level: The First Drop

**Starting point:** reservoir at the bottom-left of a 6 × 6 grid.

**Destination:** Northside School at the top-right.

**Challenge:** rotate nine pipe pieces to connect the source to the destination.

**Success condition:** a continuous path of reciprocal connections reaches the school.

## Learning outcome

Players experience how small infrastructure decisions affect whether water can reach a community. The educational panel introduces SDG 6 and links to the United Nations' official goal page.

## Planned expansion

- **Level 2 — The Great Leak:** identify damaged pipe sections and minimise water loss.
- **Level 3 — Clear Before Delivery:** route water through a filter before it reaches the destination.

## Play-test questions

- Can a new player understand how to rotate a pipe without help?
- Is the goal obvious from the reservoir and school icons?
- Does the flow highlighting make the network logic understandable?
- Is the hint useful without solving the entire puzzle?
- Can the player finish the level in a few minutes?
