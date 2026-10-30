(() => {
  "use strict";

  const DIRECTIONS = ["N", "E", "S", "W"];
  const DELTAS = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
  const OPPOSITE = { N: "S", E: "W", S: "N", W: "E" };
  const BASE_PORTS = {
    straight: ["N", "S"],
    elbow: ["N", "E"]
  };
  const DISTRICTS = [
    "Northside", "Riverside", "Old Quarter", "Greenfield", "Eastbank",
    "Hillview", "Lakeside", "Meadow Park", "Southgate", "Brookhaven"
  ];

  const board = document.getElementById("game-board");
  const boardAxis = document.getElementById("board-axis");
  const boardSideLabels = document.getElementById("board-side-labels");
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
  const nextLevelButton = document.getElementById("play-again-button");
  const gameOverModal = document.getElementById("game-over-modal");
  const restartRunButton = document.getElementById("restart-run-button");
  const timeLeftDisplay = document.getElementById("time-left");
  const timerMetric = document.getElementById("timer-metric");
  const livesDisplay = document.getElementById("lives-left");
  const livesCaption = document.getElementById("lives-caption");
  const totalScoreDisplay = document.getElementById("total-score");
  const schoolScene = document.getElementById("school-scene");
  const schoolIllustration = document.getElementById("school-illustration");
  const schoolStatus = document.getElementById("school-status");
  const schoolStatusCaption = document.getElementById("school-status-caption");
  const schoolStatusDetail = document.getElementById("school-status-detail");
  const schoolArtReserve = document.getElementById("school-art-reserve");
  const schoolArtReserveFill = document.getElementById("school-art-reserve-fill");
  const schoolArtState = document.getElementById("school-art-state");
  const hintCountDisplay = document.getElementById("hint-count");
  const hintUsage = document.getElementById("hint-usage");
  const schoolReserveFill = document.getElementById("school-reserve-fill");

  const levelNumber = document.getElementById("level-number");
  const districtNumber = document.getElementById("district-number");
  const districtName = document.getElementById("district-name");
  const gridSizeLabel = document.getElementById("grid-size-label");
  const difficultyTag = document.getElementById("difficulty-tag");
  const goalName = document.getElementById("goal-name");
  const successTitle = document.getElementById("success-title");
  const successDescription = document.getElementById("success-description");

  let level = 1;
  let size = 6;
  let source;
  let goal;
  let tiles = [];
  let tileMap = new Map();
  let solutionKeys = new Set();
  let solutionTiles = [];
  let moves = 0;
  let optimalMoves = 0;
  let hintsUsed = 0;
  let solved = false;
  let hintedKey = null;
  let flowPath = [];
  let activeDistrict = "Northside";
  let lives = 3;
  let totalScore = 0;
  let levelTimeLimit = 50;
  let timeRemaining = 50;
  let timerDeadline = 0;
  let timerInterval = null;
  let gameOver = false;
  const HINT_LIMIT = 3;
  const HINT_PENALTY = 20;

  const keyOf = (r, c) => `${r},${c}`;
  const getTile = (r, c) => tileMap.get(keyOf(r, c));
  const randomInt = max => Math.floor(Math.random() * max);

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = randomInt(i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

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
    if (!tile || !tile.onSolution) return true;
    return samePorts(getPorts(tile), tile.targetPorts);
  }

  function directionBetween(from, to) {
    if (to.r < from.r) return "N";
    if (to.c > from.c) return "E";
    if (to.r > from.r) return "S";
    return "W";
  }

  function keyToPoint(key) {
    const [r, c] = key.split(",").map(Number);
    return { r, c };
  }

  function createRandomRoute() {
    // Begin with a randomized shortest route: the north and east moves are
    // shuffled, so every level gets a different valid path without needless
    // complexity in the opening missions.
    const start = { r: size - 1, c: 1 };
    const path = [start];
    let northMoves = size - 2;
    let eastMoves = size - 2;

    while (northMoves > 0 || eastMoves > 0) {
      const moveNorth = northMoves > 0 && (eastMoves === 0 || Math.random() < 0.5);
      const last = path[path.length - 1];
      if (moveNorth) {
        path.push({ r: last.r - 1, c: last.c });
        northMoves -= 1;
      } else {
        path.push({ r: last.r, c: last.c + 1 });
        eastMoves -= 1;
      }
    }

    // Add small, non-repeating detours as the level number rises. Each detour
    // replaces one edge with a three-edge route around a neighbouring grid cell.
    const used = new Set(path.map(point => keyOf(point.r, point.c)));
    const requestedDetours = Math.min(12, Math.floor((level - 1) / 2));
    let addedDetours = 0;
    let attempts = 0;

    while (addedDetours < requestedDetours && attempts < requestedDetours * 50) {
      attempts += 1;
      const edgeIndex = randomInt(path.length - 1);
      const first = path[edgeIndex];
      const second = path[edgeIndex + 1];
      const dr = second.r - first.r;
      const dc = second.c - first.c;
      const perpendiculars = dr === 0
        ? [{ r: -1, c: 0 }, { r: 1, c: 0 }]
        : [{ r: 0, c: -1 }, { r: 0, c: 1 }];

      for (const offset of shuffle(perpendiculars)) {
        const detourA = { r: first.r + offset.r, c: first.c + offset.c };
        const detourB = { r: second.r + offset.r, c: second.c + offset.c };
        const detourAKey = keyOf(detourA.r, detourA.c);
        const detourBKey = keyOf(detourB.r, detourB.c);
        const inBounds = point => point.r >= 0 && point.r < size && point.c >= 0 && point.c < size;
        if (!inBounds(detourA) || !inBounds(detourB)) continue;
        if (used.has(detourAKey) || used.has(detourBKey)) continue;
        if (blockedSpecialCell(detourA.r, detourA.c) || blockedSpecialCell(detourB.r, detourB.c)) continue;

        path.splice(edgeIndex + 1, 0, detourA, detourB);
        used.add(detourAKey);
        used.add(detourBKey);
        addedDetours += 1;
        break;
      }
    }

    return path;
  }

  function requiredPipe(path, index) {
    const point = path[index];
    const previous = index === 0 ? source : path[index - 1];
    const next = index === path.length - 1 ? goal : path[index + 1];
    const requiredPorts = [directionBetween(point, previous), directionBetween(point, next)];
    const type = (OPPOSITE[requiredPorts[0]] === requiredPorts[1]) ? "straight" : "elbow";
    let correct = 0;
    for (let rotation = 0; rotation < 4; rotation += 1) {
      if (samePorts(rotatePorts(BASE_PORTS[type], rotation), requiredPorts)) {
        correct = rotation;
        break;
      }
    }
    return { r: point.r, c: point.c, type, correct, targetPorts: requiredPorts };
  }

  function createPuzzle() {
    optimalMoves = 0;
    size = Math.min(10, 6 + Math.floor((level - 1) / 3));
    source = { r: size - 1, c: 0, kind: "source", ports: ["E"] };
    goal = { r: 0, c: size - 1, kind: "goal", ports: ["S"] };

    const path = createRandomRoute();
    solutionTiles = path.map((_, index) => requiredPipe(path, index));
    solutionKeys = new Set(solutionTiles.map(tile => keyOf(tile.r, tile.c)));

    // Early levels use one clockwise move per solution pipe. Later levels
    // scramble each pipe by one, two, or three clockwise clicks.
    const maxScramble = level === 1 ? 1 : level <= 3 ? 2 : 3;
    tiles = solutionTiles.map(tile => {
      const scramble = 1 + randomInt(maxScramble);
      const initialRotation = (tile.correct - scramble + 4) % 4;
      return {
        ...tile,
        kind: "pipe",
        onSolution: true,
        rotation: initialRotation,
        initialRotation
      };
    });

    // Keep the first pipe disconnected from the reservoir at the start of each
    // level. This guarantees that a freshly generated puzzle cannot begin solved.
    const firstSolutionTile = tiles.find(tile => tile.r === solutionTiles[0].r && tile.c === solutionTiles[0].c);
    const blockedStartRotations = [0, 1, 2, 3].filter(rotation =>
      rotation !== firstSolutionTile.correct && !rotatePorts(BASE_PORTS[firstSolutionTile.type], rotation).includes("W")
    );
    if (blockedStartRotations.length > 0) {
      firstSolutionTile.rotation = blockedStartRotations[randomInt(blockedStartRotations.length)];
      firstSolutionTile.initialRotation = firstSolutionTile.rotation;
    }

    // Decoys are placed at least one empty cell away from the intended route,
    // so they add visual challenge without breaking the guaranteed solution.
    const decoyCount = Math.min(18, Math.floor((level - 1) / 2));
    const candidates = [];
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        const key = keyOf(r, c);
        if (blockedSpecialCell(r, c) || solutionKeys.has(key)) continue;
        const nextToSolution = DIRECTIONS.some(direction => {
          const [dr, dc] = DELTAS[direction];
          return solutionKeys.has(keyOf(r + dr, c + dc));
        });
        if (!nextToSolution) candidates.push({ r, c });
      }
    }

    for (const point of shuffle(candidates).slice(0, decoyCount)) {
      const type = randomInt(2) === 0 ? "straight" : "elbow";
      const rotation = randomInt(4);
      tiles.push({
        ...point,
        kind: "pipe",
        type,
        rotation,
        initialRotation: rotation,
        correct: null,
        targetPorts: [],
        onSolution: false
      });
    }

    tileMap = new Map(tiles.map(tile => [keyOf(tile.r, tile.c), tile]));
    activeDistrict = DISTRICTS[(level - 1) % DISTRICTS.length];
    optimalMoves = tiles.filter(tile => tile.onSolution).reduce((sum, tile) => {
      const clockwiseTurns = (tile.correct - tile.initialRotation + 4) % 4;
      return sum + clockwiseTurns;
    }, 0);
  }

  function blockedSpecialCell(r, c) {
    return (r === source.r && c === source.c) || (r === goal.r && c === goal.c);
  }

  function createSvg(ports) {
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

  function formatTime(seconds) {
    const safeSeconds = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  function timeLimitForLevel() {
    // Larger boards and later levels receive more time, up to a 110-second cap.
    return Math.min(110, 50 + (size - 6) * 8 + Math.min(30, level - 1));
  }

  function updateSchoolCondition() {
    const ratio = levelTimeLimit > 0 ? Math.max(0, Math.min(1, timeRemaining / levelTimeLimit)) : 1;
    let state;
    let label;
    let caption;
    let reserve;

    if (ratio <= 0) {
      state = "empty";
      label = "SUPPLY LOST";
      caption = "The school has run out of water. The community is at risk.";
      reserve = 0;
    } else if (ratio <= 0.25) {
      state = "critical";
      label = "SCHOOL AT RISK";
      caption = "Emergency reserves are almost empty. Restore the flow now.";
      reserve = 18;
    } else if (ratio <= 0.5) {
      state = "strained";
      label = "SUPPLY FALLING";
      caption = "Water pressure is dropping and the school is rationing its supply.";
      reserve = 55;
    } else {
      state = "healthy";
      label = "SUPPLY STABLE";
      caption = "The school has a steady supply of clean water.";
      reserve = 100;
    }

    schoolScene.classList.remove("scene-healthy", "scene-strained", "scene-critical", "scene-empty");
    schoolScene.classList.add(`scene-${state}`);

    // Use three separate illustrated scenes rather than tinting one image.
    // The timer chooses the artwork; the empty state reuses the critical scene
    // because the run ends immediately when the countdown reaches zero.
    const imageState = state === "empty" ? "critical" : state;
    const sceneImages = {
      healthy: "school-stable.webp",
      strained: "school-strained.webp",
      critical: "school-critical.webp"
    };
    if (schoolIllustration && schoolIllustration.getAttribute("data-scene") !== imageState) {
      schoolIllustration.classList.add("is-switching");
      schoolIllustration.addEventListener("load", () => {
        schoolIllustration.classList.remove("is-switching");
      }, { once: true });
      schoolIllustration.setAttribute("data-scene", imageState);
      schoolIllustration.setAttribute("src", sceneImages[imageState]);
      schoolIllustration.setAttribute("alt", imageState === "healthy"
        ? "Healthy community school with students, a full water tank and clean flowing water"
        : imageState === "strained"
          ? "Community school in warm warning light as the water tank level falls"
          : "Community school during a water shortage with a nearly empty tank and worried students");
    }
    schoolStatus.textContent = label;
    schoolStatusCaption.textContent = caption;
    schoolStatusDetail.textContent = `RESERVE LEVEL: ${reserve}%`;
    schoolReserveFill.style.width = `${reserve}%`;
    // Update the overlaid reserve gauge and the CSS scene state. The illustration
    // itself transitions from vibrant to sun-faded as the school runs low on water.
    schoolArtReserve.textContent = `${reserve}%`;
    schoolArtReserveFill.style.width = `${reserve}%`;
    schoolArtState.textContent = state === "healthy" ? "WATER SECURE" : state === "strained" ? "CONSERVE WATER" : state === "critical" ? "EMERGENCY SUPPLY" : "SUPPLY LOST";
    schoolScene.setAttribute("aria-label", `Community school water condition: ${label.toLowerCase()}, reserve ${reserve} percent`);
  }

  function updateRunHud() {
    timeLeftDisplay.textContent = formatTime(timeRemaining);
    timerMetric.classList.toggle("timer-warning", timeRemaining <= 10);
    livesDisplay.textContent = lives > 0 ? "♥ ".repeat(lives).trim() : "— — —";
    livesCaption.textContent = `${lives} / 3 left`;
    totalScoreDisplay.textContent = totalScore.toLocaleString();
    updateSchoolCondition();
  }

  function stopTimer() {
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    timerDeadline = 0;
  }

  function startTimer() {
    stopTimer();
    levelTimeLimit = timeLimitForLevel();
    timeRemaining = levelTimeLimit;
    timerDeadline = Date.now() + levelTimeLimit * 1000;
    updateRunHud();
    timerInterval = setInterval(tickTimer, 250);
  }

  function tickTimer() {
    if (solved || gameOver || !timerDeadline) return;
    timeRemaining = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
    updateRunHud();
    if (timeRemaining <= 0) handleTimeFailure();
  }

  function calculateLevelScore() {
    const timeBonus = timeRemaining * 5;
    const extraMoves = Math.max(0, moves - optimalMoves);
    const efficiencyBonus = Math.max(0, 100 - extraMoves * 5);
    const hintPenalty = hintsUsed * HINT_PENALTY;
    const points = Math.max(25, 100 + timeBonus + efficiencyBonus - hintPenalty);
    return { timeBonus, efficiencyBonus, hintPenalty, points };
  }

  function disableGameplay() {
    checkButton.disabled = true;
    hintButton.disabled = true;
    resetButton.disabled = true;
    board.querySelectorAll("button.pipe").forEach(button => { button.disabled = true; });
  }

  function enableGameplay() {
    checkButton.disabled = false;
    resetButton.disabled = false;
    updateHintUsage();
  }

  function startFreshAttempt(message) {
    moves = 0;
    hintsUsed = 0;
    updateHintUsage();
    solved = false;
    hintedKey = null;
    flowPath = [];
    successModal.hidden = true;
    gameOverModal.hidden = true;
    createPuzzle();
    updateLevelLabels();
    enableGameplay();
    setFeedback(message, "warning");
    updateDisplay();
    startTimer();
  }

  function endRun(reason) {
    if (gameOver) return;
    stopTimer();
    gameOver = true;
    disableGameplay();
    document.getElementById("game-over-level").textContent = level;
    document.getElementById("game-over-score").textContent = totalScore.toLocaleString();
    document.getElementById("game-over-title").textContent = reason.title;
    document.getElementById("game-over-description").textContent = reason.description;
    gameOverModal.hidden = false;
    restartRunButton.focus();
    setFeedback(reason.description, "warning");
  }

  function handleTimeFailure() {
    if (solved || gameOver) return;
    stopTimer();
    timeRemaining = 0;
    updateRunHud();
    // Time expiry ends the run immediately; it does not consume a life first.
    endRun({
      title: "Time ran out!",
      description: "The countdown reached zero and the school’s water supply was lost. This run has ended immediately. Restart at Level 1 with three fresh lives."
    });
  }

  function handleFailedWaterTest() {
    lives = Math.max(0, lives - 1);
    updateRunHud();
    if (lives === 0) {
      endRun({
        title: "The network went dry.",
        description: "Three TEST WATER FLOW attempts failed. All three lives are used. Restart at Level 1 with a fresh run."
      });
      return;
    }
    setFeedback(`Water-flow test failed. You lost 1 life. ${lives} ${lives === 1 ? "life" : "lives"} remain. Your pipes and timer are unchanged — adjust the network and try again.`, "warning");
  }

  function restartRun() {
    stopTimer();
    level = 1;
    lives = 3;
    totalScore = 0;
    gameOver = false;
    successModal.hidden = true;
    gameOverModal.hidden = true;
    startFreshAttempt("New run started. You have 3 lives. Only a failed TEST WATER FLOW costs a life; the timer reaching zero ends the run.");
    updateRunHud();
  }

  function updateLevelLabels() {
    const difficulty = level <= 3 ? "STARTER" : level <= 6 ? "STANDARD" : level <= 9 ? "CHALLENGE" : "EXPERT";
    levelNumber.textContent = `LEVEL ${String(level).padStart(2, "0")}`;
    districtNumber.textContent = `District ${String(level).padStart(2, "0")}`;
    districtName.textContent = activeDistrict;
    gridSizeLabel.textContent = `${size} × ${size} GRID`;
    difficultyTag.textContent = difficulty;
    goalName.textContent = `${activeDistrict.toUpperCase()} SCHOOL`;
    board.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
    boardAxis.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
    boardAxis.innerHTML = Array.from({ length: size }, (_, index) => `<span>${String.fromCharCode(65 + index)}</span>`).join("");
    boardSideLabels.innerHTML = Array.from({ length: size }, (_, index) => `<span>${String(index + 1).padStart(2, "0")}</span>`).join("");
  }

  function renderBoard() {
    const cells = [];
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        const key = keyOf(r, c);
        const tile = getTile(r, c);
        const isWet = flowPath.includes(key);
        if (r === source.r && c === source.c) {
          cells.push(`<div class="cell source${isWet ? " is-wet" : ""}" aria-label="Water reservoir, row ${r + 1} column ${c + 1}">${createSvg(source.ports)}<span class="cell-icon">💧</span><span class="cell-label">SOURCE</span></div>`);
        } else if (r === goal.r && c === goal.c) {
          cells.push(`<div class="cell goal${isWet ? " is-wet" : ""}" aria-label="${activeDistrict} School, row ${r + 1} column ${c + 1}">${createSvg(goal.ports)}<span class="cell-icon">⌂</span><span class="cell-label">SCHOOL</span></div>`);
        } else if (tile) {
          const accessible = `${tile.type} pipe, row ${r + 1}, column ${String.fromCharCode(65 + c)}. Current connections: ${describePorts(getPorts(tile))}. Click to rotate clockwise.`;
          cells.push(`<button class="cell pipe${isWet ? " is-wet" : ""}${hintedKey === key ? " hinted" : ""}${tile.onSolution ? " solution-pipe" : " decoy-pipe"}" type="button" data-r="${r}" data-c="${c}" aria-label="${accessible}" title="Rotate pipe clockwise">${createSvg(getPorts(tile))}</button>`);
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

    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
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
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
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

    let routeReached = 0;
    for (const key of solutionKeys) {
      if (result.visited.has(key)) routeReached += 1;
    }
    const progress = result.reachedGoal ? 100 : Math.min(96, Math.round((routeReached / Math.max(1, solutionTiles.length)) * 100));
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
    if (solved || gameOver) return;
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
      setFeedback("Pipe rotated. Match the openings between neighbouring sections.");
    }
  }

  function updateHintUsage() {
    hintCountDisplay.textContent = `${hintsUsed} / ${HINT_LIMIT}`;
    hintUsage.classList.toggle("hint-limit-reached", hintsUsed >= HINT_LIMIT);
    hintButton.disabled = solved || gameOver || hintsUsed >= HINT_LIMIT;
    hintButton.setAttribute("aria-label", `Use hint. ${HINT_LIMIT - hintsUsed} hints remaining. Each hint deducts ${HINT_PENALTY} points.`);
  }

  function showHint() {
    if (solved || gameOver) return;
    if (hintsUsed >= HINT_LIMIT) {
      setFeedback(`You have used all ${HINT_LIMIT} hints for this level. Each hint costs ${HINT_PENALTY} points.`, "warning");
      updateHintUsage();
      return;
    }
    const nextTile = solutionTiles.map(definition => getTile(definition.r, definition.c)).find(tile => !isCorrect(tile));
    if (!nextTile) {
      setFeedback("All route pipes are aligned. Press TEST WATER FLOW to complete this level.", "success");
      return;
    }
    hintsUsed += 1;
    updateHintUsage();
    hintedKey = keyOf(nextTile.r, nextTile.c);
    renderBoard();
    const needed = describePorts(nextTile.targetPorts);
    setFeedback(`Hint: The highlighted pipe at row ${nextTile.r + 1}, column ${String.fromCharCode(65 + nextTile.c)} needs openings to the ${needed}.`, "warning");
  }

  function completeLevel() {
    solved = true;
    stopTimer();
    disableGameplay();
    const scoreBreakdown = calculateLevelScore();
    totalScore += scoreBreakdown.points;
    updateRunHud();
    document.getElementById("final-turns").textContent = moves;
    document.getElementById("final-time-bonus").textContent = `+${scoreBreakdown.timeBonus}`;
    document.getElementById("final-level-score").textContent = scoreBreakdown.points.toLocaleString();
    document.getElementById("final-total-score").textContent = totalScore.toLocaleString();
    successTitle.textContent = `Level ${level} complete!`;
    successDescription.textContent = `Clean water has reached ${activeDistrict} School. You earned 100 base points, ${scoreBreakdown.timeBonus} time-bonus points, and an efficiency bonus of ${scoreBreakdown.efficiencyBonus}; hints cost ${scoreBreakdown.hintPenalty} points.`;
    setFeedback(`Success! +${scoreBreakdown.points} points. The next district is ready.`, "success");
    successModal.hidden = false;
    nextLevelButton.focus();
  }

  function testFlow() {
    if (solved || gameOver) return;
    const result = updateDisplay();
    if (result.reachedGoal) {
      completeLevel();
      return;
    }
    // Rotating pipes and seeing partial water flow are safe. Only an explicit
    // failed TEST WATER FLOW action costs one life.
    handleFailedWaterTest();
  }

  function resetLevel() {
    if (gameOver || solved) return;
    tiles.forEach(tile => { tile.rotation = tile.initialRotation; });
    // Keep move and hint counts: Reset must not erase scoring penalties.
    hintedKey = null;
    flowPath = [];
    successModal.hidden = true;
    enableGameplay();
    setFeedback("Pipe layout restored. Your timer, move count, and hint count keep running.");
    updateDisplay();
  }

  function startNextLevel() {
    if (gameOver) return;
    level += 1;
    startFreshAttempt(`District ${String(level).padStart(2, "0")} is offline. Build the route, then test the water flow before time runs out.`);
  }

  board.addEventListener("click", event => {
    const button = event.target.closest("button.pipe");
    if (!button) return;
    rotateTile(Number(button.dataset.r), Number(button.dataset.c));
  });

  checkButton.addEventListener("click", testFlow);
  hintButton.addEventListener("click", showHint);
  resetButton.addEventListener("click", resetLevel);
  nextLevelButton.addEventListener("click", startNextLevel);
  restartRunButton.addEventListener("click", restartRun);

  createPuzzle();
  updateLevelLabels();
  resetLevel();
  startTimer();
  updateRunHud();
})();
