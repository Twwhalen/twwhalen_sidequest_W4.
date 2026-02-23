/*
Week 4 — Example 5: Example 5: Blob Platformer (JSON + Classes)
Course: GBDA302
Instructors: Dr. Karen Cochrane and David Han
Date: Feb. 5, 2026

This file orchestrates everything:
- load JSON in preload()
- create WorldLevel from JSON
- create BlobPlayer
- update + draw each frame
- handle input events (jump, optional next level)

This matches the structure of the original blob sketch from Week 2 but moves
details into classes.
*/

let data; // raw JSON data
let levelIndex = 0;

let world; // WorldLevel instance (current level)
let player; // BlobPlayer instance

let gameComplete = false; // Track if all levels are beaten
let gameState = "playing"; // "playing", "won", "lost"
let levelStartTime = 0;
let levelTimeLimit = null;

function preload() {
  // Load the level data from disk before setup runs.
  data = loadJSON("levels.json");
}

function setup() {
  // Create the player once (it will be respawned per level).
  player = new BlobPlayer();

  // Set larger canvas
  createCanvas(900, 600);

  // Load the first level.
  loadLevel(0);

  // Simple shared style setup.
  noStroke();
  textFont("sans-serif");
  textSize(14);
  textAlign(CENTER, CENTER);
}

function draw() {
  // If game state is won or lost, show result screen
  if (gameState === "won") {
    drawWinScreen();
    return;
  }
  if (gameState === "lost") {
    drawLoseScreen();
    return;
  }

  // If all levels complete, show end screen
  if (gameComplete) {
    drawEndScreen();
    return;
  }

  // 1) Draw the world (background + platforms + goal)
  world.drawWorld();

  // 2) Update and draw the player on top of the world
  player.update(world.platforms);
  player.draw(world.theme.blob);

  // 3) Check if player fell off the bottom (respawn)
  checkFall();

  // 4) Check if player reached the goal
  checkGoal();

  // 5) Check if time ran out (for bonus level)
  if (levelTimeLimit !== null) {
    checkTimeLimit();
  }

  // 6) HUD
  textAlign(LEFT);
  fill(0);
  textSize(14);
  text(world.name, 10, 18);
  text(`Level ${levelIndex + 1} / ${data.levels.length}`, 10, 36);
  text("Move: A/D or ←/→ • Jump: Space/W/↑ • Next: N", 10, 54);

  // 7) Timer display for bonus level
  if (levelTimeLimit !== null) {
    const elapsed = (millis() - levelStartTime) / 1000;
    const remaining = max(0, levelTimeLimit - elapsed);
    fill(255, 0, 0);
    textSize(24);
    textAlign(RIGHT);
    text(`Time: ${remaining.toFixed(1)}s`, width - 20, 40);
  }
}

/*
Check if player fell off the bottom of the screen.
If so, respawn at level start.
*/
function checkFall() {
  // If player falls below the screen, respawn
  if (player.y > height + 100) {
    player.spawnFromLevel(world);
  }
}

/*
Check if player has reached the goal.
If so, automatically load the next level or mark as won.
*/
function checkGoal() {
  const dx = player.x - world.goal.x;
  const dy = player.y - world.goal.y;
  const distance = sqrt(dx * dx + dy * dy);

  // If player is close enough to goal, advance to next level
  if (distance < player.r + world.goal.r) {
    levelIndex++;
    if (levelIndex >= data.levels.length) {
      // All levels complete - show win screen
      gameState = "won";
    } else {
      loadLevel(levelIndex);
    }
  }
}

/*
Check if time ran out on bonus level.
*/
function checkTimeLimit() {
  const elapsed = (millis() - levelStartTime) / 1000;
  if (elapsed > levelTimeLimit) {
    gameState = "lost";
  }
}

/*
Draw the win screen.
*/
function drawWinScreen() {
  background(50, 200, 50);

  fill(255);
  textSize(64);
  textAlign(CENTER, CENTER);
  text("🎉 CONGRATULATIONS! 🎉", width / 2, height / 2 - 100);

  textSize(32);
  fill(255, 255, 200);
  text("You completed all levels!", width / 2, height / 2);

  textSize(18);
  fill(255);
  text("Press R to restart", width / 2, height / 2 + 80);
}

/*
Draw the lose screen (time ran out).
*/
function drawLoseScreen() {
  background(200, 50, 50);

  fill(255);
  textSize(64);
  textAlign(CENTER, CENTER);
  text("⏰ TIME'S UP! ⏰", width / 2, height / 2 - 100);

  textSize(32);
  fill(255, 255, 200);
  text("Better luck next time!", width / 2, height / 2);

  textSize(18);
  fill(255);
  text("Press R to restart or N to retry this level", width / 2, height / 2 + 80);
}

/*
Draw the end game screen when all levels are beaten.
*/
function drawEndScreen() {
  background(20, 20, 40);

  fill(255);
  textSize(64);
  textAlign(CENTER, CENTER);
  text("🎉 YOU WIN! 🎉", width / 2, height / 2 - 100);

  textSize(32);
  fill(200, 255, 100);
  text(
    `You conquered all ${data.levels.length} levels!`,
    width / 2,
    height / 2,
  );

  textSize(18);
  fill(150, 200, 255);
  text(
    "Press R to restart or N to play a specific level",
    width / 2,
    height / 2 + 80,
  );
}

function keyPressed() {
  // If game state is won or lost, handle result screen input
  if (gameState === "won") {
    if (key === "r" || key === "R") {
      gameState = "playing";
      levelIndex = 0;
      loadLevel(0);
    }
    return;
  }

  if (gameState === "lost") {
    if (key === "r" || key === "R") {
      gameState = "playing";
      levelIndex = 0;
      loadLevel(0);
    }
    if (key === "n" || key === "N") {
      gameState = "playing";
      loadLevel(levelIndex);
    }
    return;
  }

  // If game is complete, handle end screen input
  if (gameComplete) {
    if (key === "r" || key === "R") {
      gameComplete = false;
      gameState = "playing";
      levelIndex = 0;
      loadLevel(0);
    }
    return;
  }

  // Jump keys
  if (key === " " || key === "W" || key === "w" || keyCode === UP_ARROW) {
    player.jump();
  }

  // Optional: cycle levels with N (as with the earlier examples)
  if (key === "n" || key === "N") {
    const next = (levelIndex + 1) % data.levels.length;
    gameComplete = false;
    gameState = "playing";
    levelIndex = next;
    loadLevel(next);
  }
}

/*
Load a level by index:
- create a WorldLevel instance from JSON
- resize canvas based on inferred geometry
- spawn player using level start + physics
*/
function loadLevel(i) {
  levelIndex = i;

  // Create the world object from the JSON level object.
  world = new WorldLevel(data.levels[levelIndex]);

  // Fit canvas to world geometry (or defaults if needed).
  const W = world.inferWidth(900);
  const H = world.inferHeight(560);
  resizeCanvas(W, H);

  // Apply level settings + respawn.
  player.spawnFromLevel(world);

  // Reset game state and set timer if this level has a time limit
  gameState = "playing";
  levelStartTime = millis();
  levelTimeLimit = data.levels[levelIndex].timeLimit || null;
}
