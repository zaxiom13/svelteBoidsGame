<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { boids, weights, speeds, visualSettings, groupSettings, mouseSettings, numGroups, BOID_COLORS, resetBoids, numBoids } from './lib/boidsStore';
  import { gameState, endGame } from './lib/gameStore';
  import { addScore } from './lib/leaderboardStore';
  import { COLOR_NAMES } from './lib/constants';
  import ControlPanel from './lib/ControlPanel.svelte';
  import StartScreen from './lib/StartScreen.svelte';
  import GameOverScreen from './lib/GameOverScreen.svelte';
  import GroupStats from './lib/GroupStats.svelte';
  import Timer from './lib/Timer.svelte';
  import Leaderboard from './lib/Leaderboard.svelte';
  import Countdown from './lib/Countdown.svelte';
  import { powerupSettings, activePowerups, activePowerupEffects, spawnPowerup, removePowerup, addPowerupEffect } from './lib/powerupStore';
  import PowerupNotification from './lib/PowerupNotification.svelte';
  import EliminationScreen from './lib/EliminationScreen.svelte';
  
  let canvas;
  let ctx;
  let lastGroupCounts = {};
  let dominantColor = '#000000';
  let powerupSpawnInterval;
  
  onMount(() => {
      ctx = canvas.getContext('2d');
      resizeCanvas();
      resetBoids(get(numBoids), canvas.width, canvas.height, get(numGroups));
      window.addEventListener('resize', resizeCanvas);
      requestAnimationFrame(update);
  });

  // Add a proper $: reactive statement for game state
  $: {
      if ($gameState.status === 'running') {
          if (!powerupSpawnInterval) {
              powerupSpawnInterval = setInterval(() => {
                  spawnPowerup(canvas.width, canvas.height);
              }, $powerupSettings.spawnInterval);
          }
      } else if (powerupSpawnInterval) {
          clearInterval(powerupSpawnInterval);
          powerupSpawnInterval = null;
      }
  }

  function countGroups() {
      const counts = {};
      $boids.boids.forEach(boid => {
          counts[boid.groupIndex] = (counts[boid.groupIndex] || 0) + 1;
      });
      return counts;
  }
  
  function getDominantGroup(counts) {
      let maxCount = 0;
      let dominantGroup = 0;
      let totalBoids = 0;
      
      // First pass: count total boids and find max
      Object.entries(counts).forEach(([group, count]) => {
          totalBoids += count;
          if (count > maxCount) {
              maxCount = count;
              dominantGroup = parseInt(group);
          }
      });

      // Only consider it dominant if it actually has boids
      if (maxCount === 0) {
          return { group: null, ratio: 0 };
      }

      return { 
          group: dominantGroup, 
          ratio: maxCount / totalBoids,
          totalBoids 
      };
  }
  
  function checkForWinner(groupCounts) {
      // Clean up any zero-count groups
      Object.keys(groupCounts).forEach(key => {
          if (groupCounts[key] === 0) {
              delete groupCounts[key];
          }
      });

      // Get active groups
      const activeGroups = Object.keys(groupCounts)
          .map(g => parseInt(g))
          .filter(g => groupCounts[g] > 0);
      
      // First check if player's pick has been eliminated
      if ($gameState.playerPick !== null && !groupCounts[$gameState.playerPick]) {
          // Update game state to indicate player elimination without ending the game
          if (!$gameState.isEliminated) {
              gameState.update(state => ({
                  ...state,
                  isEliminated: true,
                  showEliminationScreen: true
              }));
          }
          
          // Only end the game if there's a final winner
          if (activeGroups.length === 1) {
              endGame($gameState.playerPick, true, activeGroups[0]);
              return null;
          }
      }

      // Check if any group has absolute dominance
      const { group, ratio, totalBoids } = getDominantGroup(groupCounts);
      
      // Only declare winner if there are actually boids and one group has them all
      if (totalBoids > 0 && ratio === 1) {
          const playerWon = group === $gameState.playerPick;
          if (playerWon) {
              addScore({
                  time: Date.now() - $gameState.startTime,
                  groupIndex: group,
                  wasCorrect: true
              });
          }
          endGame(group, false);
          return group;
      }
      return null;
  }
  
  function resizeCanvas() {
      canvas.width = window.innerWidth * 0.8;
      canvas.height = window.innerHeight * 0.8;
      
      // Only update quadtree bounds without resetting boids
      if ($boids.quadtree) {
          $boids.quadtree.bounds = {
              x: 0,
              y: 0,
              width: canvas.width,
              height: canvas.height
          };
          
          // Update quadtree with existing boids
          $boids.quadtree.clear();
          for (const boid of $boids.boids) {
              // Keep boids within new canvas bounds
              if (boid.position.x > canvas.width) boid.position.x = canvas.width;
              if (boid.position.y > canvas.height) boid.position.y = canvas.height;
              $boids.quadtree.insert(boid);
          }
      }
  }

  function drawFish(x, y, vx, vy, color, size, isSelectedGroup, powerupGlow) {
      const angle = Math.atan2(vy, vx);
  
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
  
      // Draw powerup glow effect
      if (powerupGlow) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 15;
          ctx.globalAlpha = 0.7;
          
          // Extra glow for powerup effect
          ctx.beginPath();
          ctx.moveTo(-size * 1.8, 0);
          ctx.lineTo(-size * 1.2, -size * 1.2);
          ctx.lineTo(size * 1.8, 0);
          ctx.lineTo(-size * 1.2, size * 1.2);
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
          
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
      }

      // Draw halo for selected group
      if (isSelectedGroup) {
          ctx.beginPath();
          ctx.moveTo(-size * 1.5, 0);
          ctx.lineTo(-size, -size);
          ctx.lineTo(size * 1.5, 0);
          ctx.lineTo(-size, size);
          ctx.closePath();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.3;
          ctx.stroke();
          ctx.globalAlpha = 1;
      }
  
      // Draw fish body
      ctx.beginPath();
      ctx.moveTo(-size, 0);
      ctx.lineTo(-size/2, -size/2);
      ctx.lineTo(size, 0);
      ctx.lineTo(-size/2, size/2);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
  
      ctx.restore();
  }

  function handleMouseMove(event) {
      const rect = canvas.getBoundingClientRect();
      $mouseSettings.position = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
      };
  }
  
  function update() {
        if (!ctx) return;

        // Calculate background color based on dominant group
        if ($gameState.status === 'running') {
            const currentGroups = countGroups();
            const { group, ratio } = getDominantGroup(currentGroups);
            const targetColor = BOID_COLORS[group] + '33'; // 20% opacity version of color
            dominantColor = targetColor;
            lastGroupCounts = currentGroups;
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Only update boid positions if game is running
        if ($gameState.status === 'running') {
            const boidsData = get(boids);
            boidsData.boids.forEach(boid => {
                boid.update(canvas.width, canvas.height, boidsData, $weights, $speeds, $visualSettings, $groupSettings, $mouseSettings, $activePowerupEffects);
            });
            boidsData.quadtree.update(boidsData.boids);
        }

        // Draw powerups
        if ($gameState.status === 'running') {
            $activePowerups.forEach(powerup => {
                ctx.save();

                // Draw glow effect
                ctx.shadowColor = powerup.color;
                ctx.shadowBlur = 15;

                // Draw rotating square
                const size = $powerupSettings.size;
                const rotation = (Date.now() - powerup.createdAt) * 0.003;

                ctx.translate(powerup.x, powerup.y);
                ctx.rotate(rotation);

                // Inner square
                ctx.fillStyle = powerup.color;
                ctx.fillRect(-size / 2, -size / 2, size, size);

                // Outer rotating square
                ctx.strokeStyle = powerup.color;
                ctx.lineWidth = 2;
                const outerSize = size * 1.5;
                ctx.strokeRect(-outerSize / 2, -outerSize / 2, outerSize, outerSize);

                // Icon based on powerup type
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.rotate(-rotation); // Un-rotate for the icon
                const icon = powerup.type === 'speed' ? '⚡' :
                    powerup.type === 'size' ? '📏' : '💪';
                ctx.fillText(icon, 0, 0);

                ctx.restore();

                // Check for collisions with player's group boids
                $boids.boids.forEach(boid => {
                    if (boid.checkPowerupCollision(powerup, size, $gameState.playerPick)) {
                        removePowerup(powerup);
                        addPowerupEffect($gameState.playerPick, powerup);
                    }
                });
            });
        }

        // Always draw boids and trails, even when paused
        $boids.boids.forEach(boid => {
            // Draw trail
            if (boid.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(boid.trail[0].x, boid.trail[0].y);
                for (let i = 1; i < boid.trail.length; i++) {
                    ctx.lineTo(boid.trail[i].x, boid.trail[i].y);
                }
                const opacity = Math.floor($visualSettings.trailOpacity * 255).toString(16).padStart(2, '0');
                ctx.strokeStyle = boid.color + opacity;
                ctx.lineWidth = $visualSettings.trailWidth;
                ctx.stroke();
            }

            // Check if boid has any active powerup effects
            const hasPowerup = $activePowerupEffects.some(effect =>
                effect.groupIndex === boid.groupIndex
            );

            // Draw fish with size multiplier and powerup glow
            const effectiveSize = $visualSettings.boidSize * (boid.sizeMultiplier || 1);
            drawFish(
                boid.position.x,
                boid.position.y,
                boid.velocity.x,
                boid.velocity.y,
                boid.color,
                effectiveSize,
                $gameState.status === 'running' && boid.groupIndex === $gameState.playerPick,
                hasPowerup
            );
        });

        // Update group counts and check for winner
        if ($gameState.status === 'running') {
            const winner = checkForWinner(lastGroupCounts);
            if (winner !== null) {
                endGame(winner);
            }
        }

        requestAnimationFrame(update);
    }
  </script>
  
  <main style="--background-color: {dominantColor}" on:mousemove={handleMouseMove}>
      <canvas bind:this={canvas} style="border: 4px solid {dominantColor ? dominantColor.slice(0, -2) : '#000'}"></canvas>
      
      {#if $gameState.status === 'running'}
          <div class="titlebar" style="--color: {BOID_COLORS[$gameState.playerPick]}">
              {#if $gameState.isEliminated && !$gameState.showEliminationScreen}
                  <span class="spectator">Spectating</span>
              {:else if !$gameState.isEliminated}
                  Your Team: {COLOR_NAMES[BOID_COLORS[$gameState.playerPick]]}
              {/if}
          </div>
      {/if}
  
      {#if $gameState.status === 'config'}
          <div class="control-container config-mode">
              <ControlPanel />
          </div>
      {:else if $gameState.status === 'start'}
          <div class="control-container">
              <StartScreen />
          </div>
      {:else if $gameState.status === 'countdown'}
          <Countdown />
      {:else if $gameState.status === 'finished'}
          <GameOverScreen />
      {/if}
  
      {#if $gameState.status === 'running' && $gameState.showEliminationScreen}
          <EliminationScreen />
      {/if}
  
      {#if $gameState.status === 'running'}
          <GroupStats groupCounts={lastGroupCounts} />
          <Timer />
      {/if}
      <Leaderboard />
      <PowerupNotification />
  </main>
  
  <style>
  main {
      position: relative;
      width: 100%;
      height: 100%;
      background-color: var(--background-color);
      transition: background-color 1s ease;
      display: flex;
      justify-content: center;
      align-items: center;
  }

  canvas {
      display: block;
      background-color: transparent;
      box-sizing: border-box;
  }

  .titlebar {
      position: fixed;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: var(--color);
      padding: 10px 20px;
      border-radius: 0 0 8px 8px;
      font-size: 18px;
      font-weight: bold;
      z-index: 100;
  }
  
  /* Control Container Styles */
  .control-container {
      position: absolute; /* Use absolute positioning for overlay */
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%); /* Center the container */
      width: 80%; /* Adjust width as needed */
      max-width: 600px; /* Set a maximum width */
      display: flex;
      flex-direction: column; /* Stack ControlPanel and StartScreen vertically */
      align-items: center; /* Center content horizontally */
      gap: 20px; /* Space between ControlPanel and StartScreen */
      pointer-events: auto; /* Enable interactions */
      z-index: 10; /* Ensure controls are above the canvas */
  }
  
  /* Control Panel Styles */
  .control-container > :global(.control-panel) {
      background-color: rgba(255, 255, 255, 0.9);
      border: 1px solid #ccc;
      padding: 20px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      width: 100%; /* Take full width of the container */
      box-sizing: border-box; /* Include padding and border in the width */
      display: grid; /* Or flex, depending on your ControlPanel's content */
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); /* Responsive columns */
      gap: 10px;
      /* Customize scrollbar for Firefox */
      scrollbar-color: black rgba(0, 0, 0, 0.1);
      scrollbar-width: thick;
      /* Customize scrollbar for Webkit browsers */
      &::-webkit-scrollbar {
          width: 28px;
          height: 28px;
      }
      &::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
      }
      &::-webkit-scrollbar-thumb {
          background-color: black;
          border-radius: 4px;
      }
  }
  
  /* Start Screen Styles */
  .control-container > :global(.start-screen) {
      background-color: rgba(240, 240, 240, 0.9);
      border: 1px solid #ddd;
      padding: 20px;
      border-radius: 8px;
      text-align: center;  /* Center the content */
      width: 100%;
      box-sizing: border-box;
  }
  
  /* Player Selection Styles (inside StartScreen) */
  .control-container > :global(.start-screen .player-selection) {
      display: flex;
      flex-wrap: wrap; /* Allow buttons to wrap */
      justify-content: center; /* Center buttons horizontally */
      gap: 10px; /* Space between buttons */
      margin-top: 15px;
  }
  
  /* Group Button Styles */
  .control-container > :global(.start-screen .group-button) {
      padding: 10px 20px;
      font-size: 16px;
      border: 2px solid #ccc;
      border-radius: 5px;
      background-color: white;
      cursor: pointer;
      transition: background-color 0.3s, border-color 0.3s;
  }
  .control-container > :global(.start-screen .group-button:hover){
     background-color: #f0f0f0;
      border-color: #999;
  }
  
  /* Responsive adjustments (optional, but recommended) */
  @media (max-width: 768px) {
      .control-container {
          width: 95%; /* Wider on smaller screens */
      }
  }

  .config-mode {
      background: rgba(0, 0, 0, 0.85);
      width: 100%;
      height: 100%;
      max-width: none;
      display: flex;
      justify-content: center;
      align-items: center;
  }

  .config-mode :global(.control-panel) {
      max-width: 1200px;
  }

  .spectator {
      color: #fff;
      font-style: italic;
      opacity: 0.8;
  }
  </style>
