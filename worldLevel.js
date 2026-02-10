/*
WorldLevel.js (Example 5)

WorldLevel wraps ONE level object from levels.json and provides:
- Theme colours (background/platform/blob)
- Physics parameters that influence the player (gravity, jump velocity)
- Spawn position for the player (start)
- An array of Platform instances
- A couple of helpers to size the canvas to fit the geometry

This is directly inspired by your original blob sketch’s responsibilities: 
- parse JSON
- map platforms array
- apply theme + physics
- infer canvas size

Expected JSON shape for each level (from your provided file): 
{
  "name": "Intro Steps",
  "gravity": 0.65,
  "jumpV": -11.0,
  "theme": { "bg":"...", "platform":"...", "blob":"..." },
  "start": { "x":80, "y":220, "r":26 },
  "platforms": [ {x,y,w,h}, ... ]
}
*/

class WorldLevel {
  constructor(levelJson) {
    // A readable label for HUD.
    this.name = levelJson.name || "Level";

    // Theme defaults + override with JSON.
    this.theme = Object.assign(
      { bg: "#F0F0F0", platform: "#C8C8C8", blob: "#1478FF" },
      levelJson.theme || {},
    );

    // Physics knobs (the blob player will read these).
    this.gravity = levelJson.gravity ?? 0.65;
    this.jumpV = levelJson.jumpV ?? -11.0;

    // Player spawn data.
    // Use optional chaining so levels can omit fields safely.
    this.start = {
      x: levelJson.start?.x ?? 80,
      y: levelJson.start?.y ?? 180,
      r: levelJson.start?.r ?? 26,
    };

    // Goal position (where player needs to reach to complete level).
    this.goal = {
      x: levelJson.goalX ?? 0,
      y: levelJson.goalY ?? 0,
      r: levelJson.goalRadius ?? 20,
    };

    // Generate or use static platforms.
    let platformsArray = levelJson.platforms || [];
    if (levelJson.levelType === "generated" && levelJson.generationParams) {
      platformsArray = this.generatePlatforms(levelJson.generationParams);
    }

    // Convert raw platform objects into Platform instances.
    this.platforms = platformsArray.map((p) => new Platform(p));
  }

  /*
  Generate platforms dynamically using arrays and loops based on parameters.
  */
  generatePlatforms(params) {
    const platforms = [];

    // 1. Ground platform
    platforms.push({
      x: 0,
      y: params.groundY,
      w: params.groundWidth,
      h: 36,
    });

    // 2. Stair pattern - generate ascending steps
    if (params.stairCount > 0) {
      for (let i = 0; i < params.stairCount; i++) {
        const platformX =
          params.stairStart + i * (params.stairWidth + params.gapWidth);
        const platformY = params.groundY - (i + 1) * params.stairHeight;

        platforms.push({
          x: platformX,
          y: platformY,
          w: params.stairWidth,
          h: 12,
        });
      }
    }

    // 3. Obstacle patterns using loops
    if (params.obstacles && params.obstacles.length > 0) {
      for (const obstacle of params.obstacles) {
        if (obstacle.type === "floating") {
          // Floating platforms in a horizontal line
          for (let i = 0; i < obstacle.count; i++) {
            platforms.push({
              x: obstacle.startX + i * obstacle.spacing,
              y: obstacle.offsetY,
              w: 50,
              h: 12,
            });
          }
        } else if (obstacle.type === "diagonal") {
          // Diagonal stepping pattern
          for (let i = 0; i < obstacle.count; i++) {
            platforms.push({
              x: obstacle.startX + i * obstacle.spacing,
              y: obstacle.offsetY - i * 40,
              w: 60,
              h: 12,
            });
          }
        }
      }
    }

    return platforms;
  }

  /*
  If you want the canvas to fit the world, you can infer width/height by
  finding the maximum x+w and y+h across all platforms.
  */
  inferWidth(defaultW = 640) {
    if (!this.platforms.length) return defaultW;
    return max(this.platforms.map((p) => p.x + p.w));
  }

  inferHeight(defaultH = 360) {
    if (!this.platforms.length) return defaultH;
    return max(this.platforms.map((p) => p.y + p.h));
  }

  /*
  Draw only the world (background + platforms + goal).
  The player draws itself separately, after the world is drawn.
  */
  drawWorld() {
    background(color(this.theme.bg));
    for (const p of this.platforms) {
      p.draw(color(this.theme.platform));
    }

    // Draw goal indicator
    this.drawGoal();
  }

  /*
  Draw the goal as a pulsing circle.
  */
  drawGoal() {
    // Pulsing effect based on time
    const pulse = 1 + 0.3 * sin(frameCount * 0.05);
    const size = this.goal.r * pulse;

    push();
    noFill();
    strokeWeight(3);
    stroke(255, 150, 0);
    circle(this.goal.x, this.goal.y, size * 2);

    // Inner circle
    stroke(255, 200, 100);
    strokeWeight(1);
    circle(this.goal.x, this.goal.y, size);
    pop();
  }
}
