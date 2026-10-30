(() => {
  "use strict";

  const SIZE = 6;
  const DIRECTIONS = ["N", "E", "S", "W"];
  const DELTAS = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
  const OPPOSITE = { N: "S", E: "W", S: "N", W: "E" };
  const BASE_PORTS = {
    straight: ["N", "S"],
    elbow: ["N", "E"]
  };

  const source = { r: 5, c: 0, kind: "source", ports: ["E"] };
  const goal = { r: 0, c: 5, kind: "goal", ports: ["S"] };

  // The correct rotation is the orientation needed to connect the full route.
  // Each pipe starts one clockwise turn away, so the beginner puzzle is solvable
  // with one correct click per pipe.
  const routeDefinitions = [
    { r: 5, c: 1, type: "straight", correct: 1 },
    { r: 5, c: 2, type: "elbow", correct: 3 },
    { r: 4, c: 2, type: "straight", correct: 0 },
    { r: 3, c: 2, type: "elbow", correct: 1 },
    { r: 3, c: 3, type: "straight", correct: 1 },
    { r: 3, c: 4, type: "elbow", correct: 3 },
    { r: 2, c: 4, type: "straight", correct: 0 },
    { r: 1, c: 4, type: "elbow", correct: 1 },
    { r: 1, c: 5, type: "elbow", correct: 3 }
  ];

  const board = document.getElementById("game-board");
  const turnCount = document.getElementById("turn-count");
  const networkStatus = document.getElementById("network-status");
  const statusDot = document.getElementById("status-dot");
  const progressText = document.getElementById("progress-text");
  const progressBar = document.getElementById("progress-bar");
  const feedback = document.getElementById("feedback");
  const feedbackText = document.getElementById("feedback-text");
  const checkButton = document.getElementById("check-button");
  const hintButton = document.getElementById("hint-button");
  const resetButton = document.getElementById("reset-button");
  const successModal = document.getElementById("success-modal");
  const playAgainButton = document.getElementById("play-again-button");

  let tiles = [];
  let moves = 0;
  let hintsUsed = 0;
  let solved = false;
  let hintedKey = null;
  let flowPath = [];

  const keyOf = (r, c) => `${r},${c}`;
  const getTile = (r, c) => tiles.find(tile => tile.r === r && tile.c === c);

  function rotatePorts(ports, rotation) {
    return ports.map(direction => DIRECTIONS[(DIRECTIONS.indexOf(direction) + rotation) % 4]);
  }

  function getPorts(tile) {
    if (tile.kind === "source" || tile.kind === "goal") return tile.ports;
    return rotatePorts(BASE_PORTS[tile.type], tile.rotation);
  }

  function samePorts(first, second) {
    return first.length === second.length && first.every(direction => second.includes(direction));
  }

  function isCorrect(tile) {
    return samePorts(getPorts(tile), rotatePorts(BASE_PORTS[tile.type], tile.correct));
  }

  function createSvg(ports, wet = false) {
    const endpoints = {
      N: [50, 8, 50, 50],
      E: [50, 50, 92, 50],
      S: [50, 50, 50, 92],
      W: [8, 50, 50, 50]
    };
    const lines = ports.map(direction => {
      const [x1, y1, x2, y2] = endpoints[direction];
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
    }).join("");
    return `<svg class="pipe-svg" viewBox="0 0 100 100" aria-hidden="true">${lines}<circle cx="50" cy="50" r="8" /></svg>`;
  }

  function describePorts(ports) {
    const names = { N: "north", E: "east", S: "south", W: "west" };
    return ports.map(port => names[port]).join(" and ");
  }

  function setFeedback(message, type = "info") {
    feedback.className = `feedback${type === "info" ? "" : ` ${type}`}`;
    feedbackText.textContent = message;
    const icon = feedback.querySelector(".feedback-icon");
    icon.textContent = type === "success" ? "✓" : type === "warning" ? "!" : "i";
  }

  function renderBoard() {
    const cells = [];
    for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        const key = keyOf(r, c);
        const tile = getTile(r, c);
        const isWet = flowPath.includes(key);
        if (r === source.r && c === source.c) {
          cells.push(`<div class="cell source${isWet ? " is-wet" : ""}" aria-label="Water reservoir, row 6 column A">${createSvg(source.ports)}<span class="cell-icon">💧</span><span class="cell-label">SOURCE</span></div>`);
        } else if (r === goal.r && c === goal.c) {
          cells.push(`<div class="cell goal${isWet ? " is-wet" : ""}" aria-label="Northside School, row 1 column F">${createSvg(goal.ports)}<span class="cell-icon">⌂</span><span class="cell-label">SCHOOL</span></div>`);
        } else if (tile) {
          const expected = describePorts(rotatePorts(BASE_PORTS[tile.type], tile.correct));
          const accessible = `${tile.type} pipe, row ${r + 1}, column ${String.fromCharCode(65 + c)}. Current connections: ${describePorts(getPorts(tile))}. Click to rotate clockwise. Required connections: ${expected}.`;
          cells.push(`<button class="cell pipe${isWet ? " is-wet" : ""}${hintedKey === key ? " hinted" : ""}" type="button" data-r="${r}" data-c="${c}" aria-label="${accessible}" title="Rotate pipe clockwise">${createSvg(getPorts(tile))}</button>`);
        } else {
          cells.push(`<div class="cell empty" aria-hidden="true"></div>`);
        }
      }
    }
    board.innerHTML = cells.join("");
  }

  function findFlow() {
    const queue = [{ r: source.r, c: source.c }];
    const visited = new Set([keyOf(source.r, source.c)]);
    const previous = new Map();
    let reachedGoal = false;

    while (queue.length > 0) {
      const current = queue.shift();
      const currentKey = keyOf(current.r, current.c);
      if (current.r === goal.r && current.c === goal.c) {
        reachedGoal = true;
        break;
      }
      const currentTile = currentKey === keyOf(source.r, source.c)
        ? source
        : currentKey === keyOf(goal.r, goal.c) ? goal : getTile(current.r, current.c);
      if (!currentTile) continue;

      for (const direction of getPorts(currentTile)) {
        const [dr, dc] = DELTAS[direction];
        const nr = current.r + dr;
        const nc = current.c + dc;
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
        const nextKey = keyOf(nr, nc);
        if (visited.has(nextKey)) continue;
        const nextTile = nextKey === keyOf(source.r, source.c)
          ? source
          : nextKey === keyOf(goal.r, goal.c) ? goal : getTile(nr, nc);
        if (!nextTile || !getPorts(nextTile).includes(OPPOSITE[direction])) continue;
        visited.add(nextKey);
        previous.set(nextKey, currentKey);
        queue.push({ r: nr, c: nc });
      }
    }

    const destinationKey = keyOf(goal.r, goal.c);
    if (reachedGoal) {
      const path = [];
      let cursor = destinationKey;
      while (cursor) {
        path.unshift(cursor);
        cursor = previous.get(cursor);
      }
      return { reachedGoal: true, path, visited };
    }
    return { reachedGoal: false, path: [...visited], visited };
  }

  function updateDisplay() {
    const result = findFlow();
    flowPath = result.path;
    renderBoard();
    turnCount.textContent = String(moves).padStart(2, "0");
    const pipeReach = Math.max(0, result.visited.size - 1);
    const progress = result.reachedGoal ? 100 : Math.min(90, Math.round((pipeReach / (routeDefinitions.length + 1)) * 100));
    progressText.textContent = `${progress}%`;
    progressBar.style.width = `${progress}%`;
    if (result.reachedGoal) {
      networkStatus.textContent = "FLOWING";
      statusDot.classList.add("online");
    } else {
      networkStatus.textContent = result.visited.size > 1 ? "PARTIAL" : "OFFLINE";
      statusDot.classList.remove("online");
    }
    return result;
  }

  function rotateTile(r, c) {
    if (solved) return;
    const tile = getTile(r, c);
    if (!tile) return;
    tile.rotation = (tile.rotation + 1) % 4;
    moves += 1;
    hintedKey = null;
    const result = updateDisplay();
    if (result.reachedGoal) {
      setFeedback("A complete route is connected. Test the flow to deliver the water!", "success");
    } else if (result.visited.size > 1) {
      setFeedback(`Good connection. Water currently reaches ${result.visited.size - 1} network section${result.visited.size === 2 ? "" : "s"}. Keep building the route.`);
    } else {
      setFeedback("Pipe rotated. Look for matching openings between neighbouring sections.");
    }
  }

  function showHint() {
    if (solved) return;
    const nextTile = routeDefinitions.map(definition => getTile(definition.r, definition.c)).find(tile => !isCorrect(tile));
    if (!nextTile) {
      setFeedback("All route pipes are aligned. Press TEST WATER FLOW to complete the mission.", "success");
      return;
    }
    hintsUsed += 1;
    hintedKey = keyOf(nextTile.r, nextTile.c);
    renderBoard();
    const needed = describePorts(rotatePorts(BASE_PORTS[nextTile.type], nextTile.correct));
    setFeedback(`Hint: The highlighted pipe at row ${nextTile.r + 1}, column ${String.fromCharCode(65 + nextTile.c)} needs openings to the ${needed}.`, "warning");
  }

  function completeMission() {
    solved = true;
    checkButton.disabled = true;
    hintButton.disabled = true;
    board.querySelectorAll("button.pipe").forEach(button => { button.disabled = true; });
    const score = Math.max(60, 100 - Math.max(0, moves - routeDefinitions.length) * 3 - hintsUsed * 5);
    document.getElementById("final-turns").textContent = moves;
    document.getElementById("final-score").textContent = score;
    setFeedback("Success! Clean water has reached the school. You restored the flow.", "success");
    successModal.hidden = false;
    playAgainButton.focus();
  }

  function testFlow() {
    if (solved) return;
    const result = updateDisplay();
    if (result.reachedGoal) {
      completeMission();
    } else {
      const reached = Math.max(0, result.visited.size - 1);
      setFeedback(reached === 0
        ? "No water can leave the reservoir yet. Start by connecting the first pipe to the east."
        : `The water has reached ${reached} network section${reached === 1 ? "" : "s"}, but not the school. Find the next mismatched connection.`, "warning");
    }
  }

  function resetGame() {
    tiles = routeDefinitions.map(definition => ({
      ...definition,
      kind: "pipe",
      rotation: (definition.correct + 3) % 4,
      initialRotation: (definition.correct + 3) % 4
    }));
    moves = 0;
    hintsUsed = 0;
    solved = false;
    hintedKey = null;
    flowPath = [];
    successModal.hidden = true;
    checkButton.disabled = false;
    hintButton.disabled = false;
    setFeedback("The network is offline. Rotate the pipes to build a route.");
    updateDisplay();
  }

  board.addEventListener("click", event => {
    const button = event.target.closest("button.pipe");
    if (!button) return;
    rotateTile(Number(button.dataset.r), Number(button.dataset.c));
  });

  checkButton.addEventListener("click", testFlow);
  hintButton.addEventListener("click", showHint);
  resetButton.addEventListener("click", resetGame);
  playAgainButton.addEventListener("click", resetGame);

  resetGame();
})();
