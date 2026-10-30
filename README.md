# AquaGrid — Restore the Flow

AquaGrid is a beginner-friendly 2D browser puzzle game inspired by **UN Sustainable Development Goal 6: Clean Water and Sanitation**.

Players act as a city water-systems engineer. Rotate pipe sections to connect a reservoir to a school, restoring the water supply while learning why reliable water infrastructure and leak prevention matter.

## Play the game

No installation, package manager, or build step is required.

1. Download or clone this repository.
2. Open `index.html` in a modern browser (Chrome, Edge, Firefox, or Safari).
3. Click pipe sections to rotate them clockwise by 90 degrees.
4. Press **TEST WATER FLOW** when you think the route is complete.
5. Use **HINT** if you get stuck, or **RESET** to restart.

> The Google Fonts stylesheet is an optional visual enhancement. The game itself is plain HTML, CSS, and JavaScript and works without a backend.

## Controls

- **Click a pipe:** rotate it 90° clockwise.
- **Test Water Flow:** check whether water can travel from the reservoir to the school.
- **Hint:** highlight the next pipe that is not in its required orientation.
- **Reset:** restore the starting puzzle.

## Project structure

```text
aquagrid-sdg6/
├── index.html          # Page structure and game interface
├── style.css           # 2D visual design and responsive layout
├── game.js             # Pipe rotation, network traversal, hints and scoring
├── docs/
│   ├── GAME_DESIGN.md  # Game concept, mechanics and SDG connection
│   └── AI_USAGE.md    # AI-use disclosure draft; review before submission
├── README.md
└── .gitignore
```

## Publish with GitHub Pages

1. Create a new **public** repository on GitHub named `aquagrid-sdg6`.
2. Upload the files and folders in this project, keeping the same structure.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)` folder, then save.
6. Wait for GitHub Pages to publish the site. The published URL will appear in the Pages settings.

Alternatively, from a terminal in this project folder:

```bash
git init
git add .
git commit -m "Build AquaGrid first playable prototype"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/aquagrid-sdg6.git
git push -u origin main
```

Replace `YOUR-USERNAME` with the GitHub username that owns the repository.

## Current prototype scope

- One playable 6 × 6 pipe-routing level.
- Reservoir source and school destination.
- Click-to-rotate straight and elbow pipe segments.
- Network traversal that checks reciprocal pipe connections.
- Live connected-flow highlighting and delivery progress.
- Hint, reset, move counter, mission completion and score.
- Responsive layout for desktop and mobile browsers.

## Next development ideas

- Add Level 2: find and repair leaks before water is wasted.
- Add Level 3: route water through a filter before it reaches the school.
- Add sound effects, a short opening animation and a level-select screen.
- Add a short post-level fact explaining water conservation and SDG 6.
- Ask classmates to play-test the controls and record what confused them.

## SDG reference

United Nations Sustainable Development Goal 6: [Clean Water and Sanitation](https://sdgs.un.org/goals/goal6).

## Team note

This is a hackathon prototype. Review, understand, test and improve the source code as a team. Update `docs/AI_USAGE.md` to match the tools and contributions actually used by your team and the event's disclosure rules before submitting.
