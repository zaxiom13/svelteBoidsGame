<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { 
    boids, weights, speeds, visualSettings, groupSettings, mouseSettings, 
    numGroups, BOID_COLORS, resetBoids, numBoids, doctrine 
  } from './lib/boidsStore';
  import { gameState, startGame, endGame } from './lib/gameStore';
  import { 
    TEAM, COLOR_NAMES, ARENA_W, ARENA_H, WALLS, SECTOR_W, SECTOR_H, 
    SECTOR_LABELS, SECTOR_COLS, SECTOR_ROWS, START_MORALE, 
    MORALE_RECOVERY_RATE, MORALE_DECAY_PER_POWERUP, POWERUP_TYPES
  } from './lib/constants';

  let canvas, ctx;
  
  // Camera state
  let camera = { x: ARENA_W / 2, y: ARENA_H / 2, zoom: 0.4, targetZoom: 0.4 };
  const minZoom = 0.2;
  const maxZoom = 1.5;
  
  // Mouse/touch state
  let isDragging = false, lastMousePos = { x: 0, y: 0 };
  let mouseWorldPos = { x: 0, y: 0 }, isTouching = false;
  
  // Morale tracking
  let morale = { [TEAM.PLAYER]: START_MORALE, [TEAM.AI]: START_MORALE };
  
  // Pause state
  let isPaused = false, slowMoRemaining = 0;
  
  // Power-ups state
  let activePowerups = [], powerupCooldowns = { BOMB: 0, TRACTOR: 0 };
  
  // Alerts
  let alerts = [];
  
  onMount(() => {
    ctx = canvas.getContext('2d');
    resizeCanvas();
    startGame(TEAM.PLAYER);
    
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    
    requestAnimationFrame(update);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  });
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  function screenToWorld(screenX, screenY) {
    return {
      x: (screenX - canvas.width / 2) / camera.zoom + camera.x,
      y: (screenY - canvas.height / 2) / camera.zoom + camera.y
    };
  }
  
  function handleWheel(e) {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    camera.targetZoom = Math.max(minZoom, Math.min(maxZoom, camera.targetZoom * (1 + delta)));
  }
  
  function handleMouseDown(e) {
    if (e.button === 0) {
      isDragging = true;
      lastMousePos = { x: e.clientX, y: e.clientY };
      mouseWorldPos = screenToWorld(e.clientX, e.clientY);
      isTouching = true;
    }
  }
  
  function handleMouseMove(e) {
    if (isDragging && e.shiftKey) {
      camera.x -= (e.clientX - lastMousePos.x) / camera.zoom;
      camera.y -= (e.clientY - lastMousePos.y) / camera.zoom;
      camera.x = Math.max(0, Math.min(ARENA_W, camera.x));
      camera.y = Math.max(0, Math.min(ARENA_H, camera.y));
    }
    lastMousePos = { x: e.clientX, y: e.clientY };
    mouseWorldPos = screenToWorld(e.clientX, e.clientY);
  }
  
  function handleMouseUp() {
    isDragging = false;
    isTouching = false;
  }
  
  function handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      isDragging = true;
      lastMousePos = { x: t.clientX, y: t.clientY };
      mouseWorldPos = screenToWorld(t.clientX, t.clientY);
      isTouching = true;
    }
  }
  
  function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      const t = e.touches[0];
      mouseWorldPos = screenToWorld(t.clientX, t.clientY);
      lastMousePos = { x: t.clientX, y: t.clientY };
    }
  }
  
  function handleTouchEnd() {
    isDragging = false;
    isTouching = false;
  }
  
  function togglePause() {
    isPaused = !isPaused;
    if (!isPaused) slowMoRemaining = 750;
  }
  
  function placePowerup(type) {
    if (powerupCooldowns[type] > 0) return;
    const def = POWERUP_TYPES[type];
    activePowerups.push({ ...def, x: mouseWorldPos.x, y: mouseWorldPos.y, placedAt: Date.now() });
    powerupCooldowns[type] = def.cooldown;
    morale[TEAM.PLAYER] = Math.max(0, morale[TEAM.PLAYER] - MORALE_DECAY_PER_POWERUP);
    alerts.push({ id: Date.now(), text: `${type} deployed`, time: Date.now() });
  }
  
  function countTeams() {
    const counts = { [TEAM.PLAYER]: 0, [TEAM.AI]: 0 };
    $boids.boids.forEach(b => { if (counts[b.groupIndex] !== undefined) counts[b.groupIndex]++; });
    return counts;
  }
  
  function update(timestamp) {
    if (!ctx) return;
    
    camera.zoom += (camera.targetZoom - camera.zoom) * 0.1;
    
    const dt = 16;
    Object.keys(powerupCooldowns).forEach(k => {
      if (powerupCooldowns[k] > 0) powerupCooldowns[k] = Math.max(0, powerupCooldowns[k] - dt);
    });
    
    const timeScale = slowMoRemaining > 0 ? 0.3 : 1.0;
    if (slowMoRemaining > 0) slowMoRemaining = Math.max(0, slowMoRemaining - dt);
    
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    
    // Draw arena border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4 / camera.zoom;
    ctx.strokeRect(0, 0, ARENA_W, ARENA_H);
    
    // Draw sector grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1 / camera.zoom;
    for (let col = 1; col < SECTOR_COLS; col++) {
      ctx.beginPath();
      ctx.moveTo(col * SECTOR_W, 0);
      ctx.lineTo(col * SECTOR_W, ARENA_H);
      ctx.stroke();
    }
    for (let row = 1; row < SECTOR_ROWS; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * SECTOR_H);
      ctx.lineTo(ARENA_W, row * SECTOR_H);
      ctx.stroke();
    }
    
    // Draw walls
    ctx.fillStyle = '#666';
    WALLS.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));
    
    // Update boids
    if (!isPaused && $gameState.status === 'running') {
      const boidsData = get(boids);
      const currentDoctrine = get(doctrine);
      const currentWeights = get(weights);
      
      const doctrineWeights = {
        ...currentWeights,
        cohesion: currentWeights.cohesion * (0.5 + currentDoctrine.cohesion),
        separation: currentWeights.separation * (0.5 + currentDoctrine.separation)
      };
      
      boidsData.boids.forEach(boid => {
        const mouseSettingsForBoid = boid.groupIndex === TEAM.PLAYER && isTouching 
          ? { ...$mouseSettings, position: mouseWorldPos, active: true }
          : { ...$mouseSettings, active: false };
        
        boid.update(ARENA_W, ARENA_H, boidsData, doctrineWeights, $speeds, $visualSettings, 
          { ...$groupSettings, loyaltyFactor: currentDoctrine.bravery }, mouseSettingsForBoid, []);
      });
      
      boidsData.quadtree.update(boidsData.boids);
      
      // Process power-ups
      activePowerups = activePowerups.filter(powerup => {
        const elapsed = Date.now() - powerup.placedAt;
        
        if (powerup.type === 'BOMB' && elapsed >= powerup.fuseMs) {
          boidsData.boids.forEach(boid => {
            const dx = boid.position.x - powerup.x, dy = boid.position.y - powerup.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < powerup.radius) {
              const force = (1 - dist / powerup.radius) * powerup.impulse;
              boid.velocity.x += (dx / dist) * force;
              boid.velocity.y += (dy / dist) * force;
              boid.morale = Math.max(0, boid.morale - powerup.moraleHit);
            }
          });
          return false;
        }
        
        if (powerup.type === 'TRACTOR' && elapsed < powerup.durationMs) {
          boidsData.boids.forEach(boid => {
            const dx = powerup.x - boid.position.x, dy = powerup.y - boid.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < powerup.radius) {
              boid.velocity.x += (dx / dist) * powerup.pull;
              boid.velocity.y += (dy / dist) * powerup.pull;
            }
          });
          return true;
        } else if (powerup.type === 'TRACTOR') {
          return false;
        }
        
        return true;
      });
      
      morale[TEAM.PLAYER] = Math.min(1, morale[TEAM.PLAYER] + MORALE_RECOVERY_RATE);
      morale[TEAM.AI] = Math.min(1, morale[TEAM.AI] + MORALE_RECOVERY_RATE);
      
      const teamCounts = countTeams();
      if (teamCounts[TEAM.PLAYER] === 0) endGame(TEAM.AI, false);
      else if (teamCounts[TEAM.AI] === 0) endGame(TEAM.PLAYER, false);
    }
    
    // Draw powerups
    activePowerups.forEach(powerup => {
      const elapsed = Date.now() - powerup.placedAt;
      
      if (powerup.type === 'BOMB') {
        ctx.fillStyle = powerup.color;
        ctx.globalAlpha = 0.6 + Math.sin(elapsed * 0.01) * 0.4;
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y, 15 / camera.zoom, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = powerup.color;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 2 / camera.zoom;
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y, powerup.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (powerup.type === 'TRACTOR') {
        ctx.strokeStyle = powerup.color;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 3 / camera.zoom;
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y, powerup.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = powerup.color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y, 10 / camera.zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
    
    // Draw boids
    $boids.boids.forEach(boid => {
      if (boid.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(boid.trail[0].x, boid.trail[0].y);
        for (let i = 1; i < boid.trail.length; i++) ctx.lineTo(boid.trail[i].x, boid.trail[i].y);
        ctx.strokeStyle = boid.color + '40';
        ctx.lineWidth = $visualSettings.trailWidth / camera.zoom;
        ctx.stroke();
      }
      
      const angle = Math.atan2(boid.velocity.y, boid.velocity.x);
      const size = $visualSettings.boidSize / camera.zoom;
      
      ctx.save();
      ctx.translate(boid.position.x, boid.position.y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(-size * 0.6, -size * 0.5);
      ctx.lineTo(-size * 0.6, size * 0.5);
      ctx.closePath();
      ctx.fillStyle = boid.color;
      ctx.fill();
      ctx.restore();
    });
    
    ctx.restore();
    
    drawHUD();
    alerts = alerts.filter(a => Date.now() - a.time < 3000);
    
    requestAnimationFrame(update);
  }
  
  function drawHUD() {
    const teamCounts = countTeams();
    
    // Mini-map
    const mapSize = 180, mapX = canvas.width - mapSize - 20, mapY = canvas.height - mapSize - 20;
    const mapScale = mapSize / Math.max(ARENA_W, ARENA_H);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);
    
    ctx.fillStyle = '#444';
    WALLS.forEach(w => ctx.fillRect(mapX + w.x * mapScale, mapY + w.y * mapScale, w.w * mapScale, w.h * mapScale));
    
    const viewW = (canvas.width / camera.zoom) * mapScale, viewH = (canvas.height / camera.zoom) * mapScale;
    const viewX = mapX + camera.x * mapScale - viewW / 2, viewY = mapY + camera.y * mapScale - viewH / 2;
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(viewX, viewY, viewW, viewH);
    
    // Morale bars
    const barW = 200, barH = 20, barX = 20;
    let barY = 60;
    
    ctx.font = '14px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('PLAYER MORALE', barX, barY - 5);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = morale[TEAM.PLAYER] > 0.5 ? '#00FFFF' : '#FF4500';
    ctx.fillRect(barX, barY, barW * morale[TEAM.PLAYER], barH);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    
    barY += 50;
    ctx.fillStyle = '#fff';
    ctx.fillText('AI MORALE', barX, barY - 5);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = morale[TEAM.AI] > 0.5 ? '#FF1493' : '#FF4500';
    ctx.fillRect(barX, barY, barW * morale[TEAM.AI], barH);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(barX, barY, barW, barH);
    
    barY += 40;
    ctx.font = '16px monospace';
    ctx.fillStyle = '#00FFFF';
    ctx.fillText(`PLAYER: ${teamCounts[TEAM.PLAYER]}`, barX, barY);
    barY += 25;
    ctx.fillStyle = '#FF1493';
    ctx.fillText(`AI: ${teamCounts[TEAM.AI]}`, barX, barY);
    
    // Power-up buttons
    const btnW = 80, btnH = 40;
    let btnX = 20;
    const btnY = canvas.height - 60;
    
    Object.entries(POWERUP_TYPES).forEach(([key, powerup]) => {
      const onCooldown = powerupCooldowns[key] > 0;
      ctx.fillStyle = onCooldown ? 'rgba(50, 50, 50, 0.8)' : 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = onCooldown ? '#555' : powerup.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(btnX, btnY, btnW, btnH);
      ctx.font = '12px monospace';
      ctx.fillStyle = onCooldown ? '#777' : '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(key, btnX + btnW / 2, btnY + 20);
      if (onCooldown) {
        const progress = powerupCooldowns[key] / powerup.cooldown;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(btnX, btnY + btnH - 4, btnW * (1 - progress), 4);
      }
      btnX += btnW + 10;
    });
    ctx.textAlign = 'left';
    
    // Pause button
    const pauseBtnX = canvas.width - 100, pauseBtnY = 20;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(pauseBtnX, pauseBtnY, 80, 40);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(pauseBtnX, pauseBtnY, 80, 40);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(isPaused ? 'RESUME' : 'PAUSE', pauseBtnX + 40, pauseBtnY + 25);
    ctx.textAlign = 'left';
    
    // Alerts
    let alertY = 20;
    alerts.forEach(alert => {
      const age = Date.now() - alert.time, alpha = Math.max(0, 1 - age / 3000);
      ctx.font = '14px monospace';
      ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
      ctx.textAlign = 'center';
      ctx.fillText(alert.text, canvas.width / 2, alertY);
      ctx.textAlign = 'left';
      alertY += 25;
    });
  }
  
  function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top;
    
    const pauseBtnX = canvas.width - 100, pauseBtnY = 20;
    if (x >= pauseBtnX && x <= pauseBtnX + 80 && y >= pauseBtnY && y <= pauseBtnY + 40) {
      togglePause();
      return;
    }
    
    const btnW = 80, btnH = 40;
    let btnX = 20;
    const btnY = canvas.height - 60;
    
    for (const key of Object.keys(POWERUP_TYPES)) {
      if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
        placePowerup(key);
        return;
      }
      btnX += btnW + 10;
    }
  }
</script>

<main>
  <canvas bind:this={canvas} on:click={handleCanvasClick}></canvas>
  
  {#if $gameState.status === 'finished'}
    <div class="overlay game-over">
      <div class="game-over-panel">
        <h1>MISSION {$gameState.winner === TEAM.PLAYER ? 'COMPLETE' : 'FAILED'}</h1>
        <p>
          {#if $gameState.winner === TEAM.PLAYER}
            Monoculture achieved. All swarms converted.
          {:else}
            Player swarm eliminated. AI dominance established.
          {/if}
        </p>
        <button on:click={() => window.location.reload()}>NEW MISSION</button>
      </div>
    </div>
  {/if}
  
  {#if isPaused && $gameState.status === 'running'}
    <div class="overlay pause-screen">
      <div class="tactical-briefing">
        <h2>TACTICAL BRIEFING</h2>
        <div class="doctrine-section">
          <h3>Doctrine Settings</h3>
          <label>
            Cohesion: {$doctrine.cohesion.toFixed(2)}
            <input type="range" min="0" max="1" step="0.1" bind:value={$doctrine.cohesion} />
          </label>
          <label>
            Separation: {$doctrine.separation.toFixed(2)}
            <input type="range" min="0" max="1" step="0.1" bind:value={$doctrine.separation} />
          </label>
          <label>
            Bravery: {$doctrine.bravery.toFixed(2)}
            <input type="range" min="0" max="1" step="0.1" bind:value={$doctrine.bravery} />
          </label>
        </div>
        <button class="resume-btn" on:click={togglePause}>RESUME MISSION</button>
      </div>
    </div>
  {/if}
</main>

<style>
  main { width: 100vw; height: 100vh; margin: 0; padding: 0; overflow: hidden; background: #000; }
  canvas { display: block; width: 100%; height: 100%; cursor: crosshair; }
  .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background: rgba(0, 0, 0, 0.85); z-index: 100; }
  .game-over-panel { background: rgba(0, 0, 0, 0.95); border: 2px solid #00FFFF; padding: 40px; text-align: center; font-family: monospace; }
  .game-over-panel h1 { color: #00FFFF; font-size: 36px; margin: 0 0 20px 0; }
  .game-over-panel p { color: #fff; font-size: 18px; margin: 0 0 30px 0; }
  .game-over-panel button { background: #00FFFF; color: #000; border: none; padding: 15px 30px; font-size: 16px; font-family: monospace; font-weight: bold; cursor: pointer; transition: all 0.2s; }
  .game-over-panel button:hover { background: #00DDDD; transform: scale(1.05); }
  .pause-screen { background: rgba(0, 0, 0, 0.9); }
  .tactical-briefing { background: #0a0a0a; border: 2px solid #00FFFF; padding: 30px; min-width: 400px; font-family: monospace; color: #fff; }
  .tactical-briefing h2 { color: #00FFFF; text-align: center; margin: 0 0 30px 0; font-size: 24px; }
  .tactical-briefing h3 { color: #00FFFF; font-size: 16px; margin: 0 0 15px 0; }
  .doctrine-section { margin-bottom: 30px; }
  .doctrine-section label { display: block; margin-bottom: 15px; color: #ccc; }
  .doctrine-section input[type="range"] { width: 100%; margin-top: 5px; }
  .resume-btn { width: 100%; background: #00FFFF; color: #000; border: none; padding: 15px; font-size: 16px; font-family: monospace; font-weight: bold; cursor: pointer; transition: all 0.2s; }
  .resume-btn:hover { background: #00DDDD; }
</style>
