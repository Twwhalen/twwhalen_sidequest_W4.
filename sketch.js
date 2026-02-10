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

function preload() {
  // Load the level data from disk before setup runs.
  data = loadJSON("levels.json");
}

function setup() {
  // Create the player once (it will be respawned per level).
  player = new BlobPlayer();

  // Load the first level.
  loadLevel(0);

  // Simple shared style setup.
  noStroke();
  textFont("sans-serif");
  textSize(14);
  textAlign(CENTER, CENTER);
}

function draw() {
  // If game is complete, show end screen
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

  // 5) HUD
  textAlign(LEFT);
  fill(0);
  textSize(14);
  text(world.name, 10, 18);
  text(`Level ${levelIndex + 1} / ${data.levels.length}`, 10, 36);
  text("Move: A/D or ←/→ • Jump: Space/W/↑ • Next: N", 10, 54);
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
If so, automatically load the next level.
*/
function checkGoal() {
  const dx = player.x - world.goal.x;
  const dy = player.y - world.goal.y;
  const distance = sqrt(dx * dx + dy * dy);

  // If player is close enough to goal, advance to next level
  if (distance < player.r + world.goal.r) {
    levelIndex++;
    if (levelIndex >= data.levels.length) {
      // All levels complete!
      gameComplete = true;
    } else {
      loadLevel(levelIndex);
    }
  }
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
  text(`You conquered all ${data.levels.length} levels!`, width / 2, height / 2);

  textSize(18);
  fill(150, 200, 255);
  text("Press R to restart or N to play a specific level", width / 2, height / 2 + 80);
}

function keyPressed() {
  // If game is complete, handle end screen input
  if (gameComplete) {
    if (key === "r" || key === "R") {
      gameComplete = false;
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
}
