<script>
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { 
    boids, weights, speeds, visualSettings, groupSettings, mouseSettings, 
    numGroups, BOID_COLORS, resetBoids, numBoids, doctrine 
  } from './lib/boidsStore';
  import { gameState, startGame, endGame } from './lib/gameStore';
  import { 
    TEAM, COLOR_NAMES, ARENA_W, ARENA_H, WALLS, DOORS, doorManager,
    SECTOR_W, SECTOR_H, SECTOR_LABELS, SECTOR_COLS, SECTOR_ROWS, 
    START_MORALE, MORALE_RECOVERY_RATE, MORALE_DECAY_PER_POWERUP, POWERUP_TYPES
  } from './lib/constants';

  let canvas, ctx;
  let canvasWidth = window.innerWidth;
  let canvasHeight = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Camera state - adjusted for square arena (3200x3200)
  let camera = { x: ARENA_W / 2, y: ARENA_H / 2, zoom: 0.25, targetZoom: 0.25 };
  // Min zoom: arena takes ~50% of screen (can zoom out more than arena size)
  const minZoom = 0.15;  // Can see arena + surrounding space
  const maxZoom = 1.8;   // Can zoom in very close
  
  // Touch state
  let touches = [];
  let lastPinchDist = null;
  let isDraggingCamera = false;
  let isPanning = false;
  let isTouchingBoids = false;
  let lastTouchPos = { x: 0, y: 0 };
  let panVelocity = { x: 0, y: 0 };
  let mouseWorldPos = { x: ARENA_W / 2, y: ARENA_H / 2 };
  
  // Game state
  let morale = { [TEAM.PLAYER]: START_MORALE, [TEAM.AI]: START_MORALE };
  let isPaused = false, slowMoRemaining = 0;
  let activePowerups = [], powerupCooldowns = { BOMB: 0, TRACTOR: 0 };
  let alerts = [];
  let animationFrameId = null;
  
  // UI state
  let showPowerupMenu = false;
  let uiScale = 1;
  let pendingPowerup = null; // def from POWERUP_TYPES
  let pendingPowerupKey = null; // 'BOMB'|'TRACTOR'
  let powerupMenuAnchor = null; // {x,y} in screen coords for contextual menu
  let longPressTimer = null;
  let isLongPressing = false;
  let lastTapTime = 0;
  let touchMoved = false;
  let initialPressPos = { x: 0, y: 0 };

  function haptic(ms = 10) {
    try { if (navigator && typeof navigator.vibrate === 'function') navigator.vibrate(ms); } catch (e) {}
  }
  
  onMount(() => {
    ctx = canvas.getContext('2d', { alpha: false });
    updateCanvasSize();
    startGame(TEAM.PLAYER);
    
    // Calculate UI scale for mobile
    uiScale = Math.min(window.innerWidth / 400, 1.2);
    
    window.addEventListener('resize', updateCanvasSize);
    setupTouchEvents();
    // Prevent context menu on right-click for smoother panning UX
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    animationFrameId = requestAnimationFrame(update);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  });
  
  function updateCanvasSize() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    canvas.width = Math.floor(canvasWidth * dpr);
    canvas.height = Math.floor(canvasHeight * dpr);
    uiScale = Math.min(window.innerWidth / 400, 1.2);
  }
  
  function setupTouchEvents() {
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    
    if (!isMobile) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('dblclick', handleDoubleClick);
      canvas.addEventListener('click', handleClick);
    }
  }
  
  function screenToWorld(screenX, screenY) {
    return {
      x: (screenX - canvasWidth / 2) / camera.zoom + camera.x,
      y: (screenY - canvasHeight / 2) / camera.zoom + camera.y
    };
  }
  
  function worldToScreen(worldX, worldY) {
    return {
      x: (worldX - camera.x) * camera.zoom + canvasWidth / 2,
      y: (worldY - camera.y) * camera.zoom + canvasHeight / 2
    };
  }
  
  function clampCamera() {
    camera.x = Math.max(0, Math.min(ARENA_W, camera.x));
    camera.y = Math.max(0, Math.min(ARENA_H, camera.y));
  }

  function zoomAtPoint(factor, screenX, screenY) {
    const before = screenToWorld(screenX, screenY);
    const newTarget = Math.max(minZoom, Math.min(maxZoom, camera.targetZoom * factor));
    camera.targetZoom = newTarget;
    // Adjust camera so that the world point under the cursor stays under the cursor after zoom
    camera.x = before.x - (screenX - canvasWidth / 2) / newTarget;
    camera.y = before.y - (screenY - canvasHeight / 2) / newTarget;
    clampCamera();
  }

  function detectDoubleTap(x, y) {
    const now = Date.now();
    if (now - lastTapTime < 300) {
      zoomAtPoint(1.6, x, y);
      haptic(8);
      lastTapTime = 0;
    } else {
      lastTapTime = now;
    }
  }

  function handleTouchStart(e) {
    e.preventDefault();
    touches = Array.from(e.touches);
    
    if (touches.length === 1) {
      const touch = touches[0];
      const x = touch.clientX;
      const y = touch.clientY;
      // Double-tap to zoom
      detectDoubleTap(x, y);
      
      // Check if touching UI elements
      if (isTouchingUI(x, y)) {
        handleUITouch(x, y);
        return;
      }
      
      // Otherwise, touch for boid influence
      lastTouchPos = { x, y };
      initialPressPos = { x, y };
      touchMoved = false;
      mouseWorldPos = screenToWorld(x, y);
      isTouchingBoids = true;

      // Prepare long-press to open powerup menu near finger (only when no pending powerup)
      if (!pendingPowerup && !showPowerupMenu) {
        if (longPressTimer) clearTimeout(longPressTimer);
        isLongPressing = false;
        longPressTimer = setTimeout(() => {
          isLongPressing = true;
          showPowerupMenu = true;
          powerupMenuAnchor = { x, y };
          haptic(8);
        }, 450);
      }
      
    } else if (touches.length === 2) {
      // Two finger pinch/pan
      isTouchingBoids = false;
      isDraggingCamera = true;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      lastPinchDist = Math.sqrt(dx * dx + dy * dy);
      
      // Center point for panning
      lastTouchPos = {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2
      };
    }
  }
  
  function handleTouchMove(e) {
    e.preventDefault();
    touches = Array.from(e.touches);
    
    if (touches.length === 1 && isTouchingBoids) {
      const touch = touches[0];
      mouseWorldPos = screenToWorld(touch.clientX, touch.clientY);
      lastTouchPos = { x: touch.clientX, y: touch.clientY };
      const mdx = lastTouchPos.x - initialPressPos.x;
      const mdy = lastTouchPos.y - initialPressPos.y;
      if (Math.hypot(mdx, mdy) > 8) {
        touchMoved = true;
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
      }
      
    } else if (touches.length === 2) {
      // Pinch zoom
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      
      // Pan camera using pinch center
      const centerX = (touches[0].clientX + touches[1].clientX) / 2;
      const centerY = (touches[0].clientY + touches[1].clientY) / 2;
      
      if (lastPinchDist) {
        const zoomDelta = (newDist - lastPinchDist) * 0.005;
        zoomAtPoint(1 + zoomDelta, centerX, centerY);
      }
      lastPinchDist = newDist;
      
      if (lastTouchPos.x && lastTouchPos.y) {
        const dx2 = centerX - lastTouchPos.x;
        const dy2 = centerY - lastTouchPos.y;
        camera.x -= dx2 / camera.zoom;
        camera.y -= dy2 / camera.zoom;
        panVelocity.x = (-dx2 / camera.zoom);
        panVelocity.y = (-dy2 / camera.zoom);
        clampCamera();
      }
      lastTouchPos = { x: centerX, y: centerY };
    }
  }
  
  function handleTouchEnd(e) {
    e.preventDefault();
    touches = Array.from(e.touches);
    
    if (touches.length === 0) {
      isTouchingBoids = false;
      isDraggingCamera = false;
      lastPinchDist = null;
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
      // Confirm placement on tap when a powerup is pending
      if (pendingPowerup && !isLongPressing && !touchMoved) {
        const world = screenToWorld(lastTouchPos.x, lastTouchPos.y);
        placePowerup(pendingPowerupKey, world.x, world.y);
        pendingPowerup = null;
        pendingPowerupKey = null;
        haptic(20);
      }
      isLongPressing = false;
      touchMoved = false;
    } else if (touches.length === 1) {
      // Switched from 2 finger to 1 finger
      lastPinchDist = null;
      isDraggingCamera = false;
      const touch = touches[0];
      lastTouchPos = { x: touch.clientX, y: touch.clientY };
      mouseWorldPos = screenToWorld(touch.clientX, touch.clientY);
      isTouchingBoids = true;
    }
  }
  
  function handleWheel(e) {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const factor = 1 + delta;
    zoomAtPoint(factor, e.clientX, e.clientY);
  }
  
  function handleMouseDown(e) {
    const x = e.clientX, y = e.clientY;
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      // Middle/right-drag or Shift+drag to pan
      isPanning = true;
      isTouchingBoids = false;
      lastTouchPos = { x, y };
      panVelocity = { x: 0, y: 0 };
      return;
    }
    if (e.button === 0) {
      if (isTouchingUI(x, y)) return;
      
      lastTouchPos = { x, y };
      mouseWorldPos = screenToWorld(x, y);
      isTouchingBoids = true;
    }
  }
  
  function handleMouseMove(e) {
    const x = e.clientX, y = e.clientY;
    
    if (isPanning) {
      const dx = x - lastTouchPos.x;
      const dy = y - lastTouchPos.y;
      camera.x -= dx / camera.zoom;
      camera.y -= dy / camera.zoom;
      panVelocity.x = (-dx / camera.zoom);
      panVelocity.y = (-dy / camera.zoom);
      clampCamera();
      lastTouchPos = { x, y };
      return;
    }
    
    if (isTouchingBoids) {
      mouseWorldPos = screenToWorld(x, y);
    }
    
    lastTouchPos = { x, y };
  }
  
  function handleMouseUp(e) {
    if (isPanning) {
      isPanning = false;
      return;
    }
    isTouchingBoids = false;
  }
  
  function handleDoubleClick(e) {
    const factor = e.shiftKey ? 1 / 1.6 : 1.6;
    zoomAtPoint(factor, e.clientX, e.clientY);
  }

  function handleClick(e) {
    const x = e.clientX, y = e.clientY;
    if (isTouchingUI(x, y)) {
      handleUITouch(x, y);
      return;
    }
    if (pendingPowerup) {
      const world = screenToWorld(x, y);
      placePowerup(pendingPowerupKey, world.x, world.y);
      pendingPowerup = null;
      pendingPowerupKey = null;
      haptic(15);
      return;
    }
    handleUITouch(x, y);
  }
  
  function isTouchingUI(x, y) {
    // Pause button (top-right)
    const pauseBtnSize = 50 * uiScale;
    const pauseBtnX = canvasWidth - pauseBtnSize - 10 * uiScale;
    const pauseBtnY = 10 * uiScale;
    if (x >= pauseBtnX && x <= pauseBtnX + pauseBtnSize && 
        y >= pauseBtnY && y <= pauseBtnY + pauseBtnSize) {
      return true;
    }
    
    // Power-up button (bottom-right on mobile, bottom-left on desktop)
    const powerBtnSize = 60 * uiScale;
    const powerBtnX = isMobile ? canvasWidth - powerBtnSize - 10 * uiScale : 10 * uiScale;
    const powerBtnY = canvasHeight - powerBtnSize - 10 * uiScale;
    if (x >= powerBtnX && x <= powerBtnX + powerBtnSize && 
        y >= powerBtnY && y <= powerBtnY + powerBtnSize) {
      return true;
    }
    
    // Power-up menu items
    if (showPowerupMenu) {
      const menuItems = Object.keys(POWERUP_TYPES);
      const itemSize = 55 * uiScale;
      const menuX = isMobile ? canvasWidth - itemSize - 10 * uiScale : 10 * uiScale;
      let menuY = canvasHeight - powerBtnSize - 20 * uiScale;
      
      for (let i = 0; i < menuItems.length; i++) {
        menuY -= itemSize + 5 * uiScale;
        if (x >= menuX && x <= menuX + itemSize && 
            y >= menuY && y <= menuY + itemSize) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  function handleUITouch(x, y) {
    // Pause button
    const pauseBtnSize = 50 * uiScale;
    const pauseBtnX = canvasWidth - pauseBtnSize - 10 * uiScale;
    const pauseBtnY = 10 * uiScale;
    if (x >= pauseBtnX && x <= pauseBtnX + pauseBtnSize && 
        y >= pauseBtnY && y <= pauseBtnY + pauseBtnSize) {
      togglePause();
      haptic(8);
      return;
    }
    
    // Power-up menu toggle
    const powerBtnSize = 60 * uiScale;
    const powerBtnX = isMobile ? canvasWidth - powerBtnSize - 10 * uiScale : 10 * uiScale;
    const powerBtnY = canvasHeight - powerBtnSize - 10 * uiScale;
    if (x >= powerBtnX && x <= powerBtnX + powerBtnSize && 
        y >= powerBtnY && y <= powerBtnY + powerBtnSize) {
      showPowerupMenu = !showPowerupMenu;
      powerupMenuAnchor = { x: powerBtnX + powerBtnSize / 2, y: powerBtnY };
      haptic(6);
      return;
    }

    // Mini-map and zoom buttons geometry (must match drawHUD)
    const padding = 10 * uiScale;
    const mapSize = isMobile ? 120 * uiScale : 150 * uiScale;
    const mapX = canvasWidth - mapSize - padding;
    const mapY = isMobile ? canvasHeight - mapSize - 80 * uiScale : 70 * uiScale;
    const mapScale = mapSize / Math.max(ARENA_W, ARENA_H);

    // Zoom +/- buttons
    const zoomBtnSize = 32 * uiScale;
    const zoomGap = 6 * uiScale;
    const zoomX = mapX + mapSize - zoomBtnSize;
    const zoomYPlus = mapY - zoomBtnSize - zoomGap;
    const zoomYMinus = zoomYPlus - zoomBtnSize - zoomGap;

    // Zoom plus
    if (x >= zoomX && x <= zoomX + zoomBtnSize && y >= zoomYPlus && y <= zoomYPlus + zoomBtnSize) {
      zoomAtPoint(1.2, canvasWidth / 2, canvasHeight / 2);
      haptic(6);
      return;
    }
    // Zoom minus
    if (x >= zoomX && x <= zoomX + zoomBtnSize && y >= zoomYMinus && y <= zoomYMinus + zoomBtnSize) {
      zoomAtPoint(1 / 1.2, canvasWidth / 2, canvasHeight / 2);
      haptic(6);
      return;
    }

    // Mini-map tap-to-pan
    if (x >= mapX && x <= mapX + mapSize && y >= mapY && y <= mapY + mapSize) {
      const worldX = (x - mapX) / mapScale;
      const worldY = (y - mapY) / mapScale;
      camera.x = Math.max(0, Math.min(ARENA_W, worldX));
      camera.y = Math.max(0, Math.min(ARENA_H, worldY));
      panVelocity = { x: 0, y: 0 };
      haptic(8);
      return;
    }
    
    // Power-up menu items
    if (showPowerupMenu) {
      const menuItems = Object.keys(POWERUP_TYPES);
      const itemSize = 55 * uiScale;
      let menuX = isMobile ? canvasWidth - itemSize - 10 * uiScale : 10 * uiScale;
      let menuY = canvasHeight - powerBtnSize - 20 * uiScale;
      if (powerupMenuAnchor) {
        menuX = Math.min(Math.max(powerupMenuAnchor.x - itemSize / 2, padding), canvasWidth - itemSize - padding);
        menuY = Math.min(powerupMenuAnchor.y - 5 * uiScale, canvasHeight - padding);
      }
      
      for (let i = 0; i < menuItems.length; i++) {
        menuY -= itemSize + 5 * uiScale;
        const key = menuItems[i];
        if (x >= menuX && x <= menuX + itemSize && 
            y >= menuY && y <= menuY + itemSize) {
          // Switch to pending placement mode with ghost
          if (powerupCooldowns[key] > 0) {
            alerts.push({ id: Date.now(), text: `${key} on cooldown`, time: Date.now() });
            return;
          }
          pendingPowerupKey = key;
          pendingPowerup = POWERUP_TYPES[key];
          showPowerupMenu = false;
          powerupMenuAnchor = null;
          alerts.push({ id: Date.now(), text: `Tap to place ${key}`, time: Date.now() });
          haptic(8);
          return;
        }
      }
    }
  }
  
  function togglePause() {
    isPaused = !isPaused;
    if (!isPaused) slowMoRemaining = 750;
  }
  
  function placePowerup(type, wx = mouseWorldPos.x, wy = mouseWorldPos.y) {
    if (powerupCooldowns[type] > 0) {
      alerts.push({ id: Date.now(), text: `${type} on cooldown`, time: Date.now() });
      return;
    }
    
    const def = POWERUP_TYPES[type];
    
    // Place at requested world position
    const targetX = wx;
    const targetY = wy;
    
    activePowerups.push({ 
      ...def, 
      x: targetX, 
      y: targetY, 
      placedAt: Date.now() 
    });
    
    powerupCooldowns[type] = def.cooldown;
    morale[TEAM.PLAYER] = Math.max(0, morale[TEAM.PLAYER] - MORALE_DECAY_PER_POWERUP);
    alerts.push({ id: Date.now(), text: `${type} deployed`, time: Date.now() });
  }
  
  function countTeams() {
    const counts = { [TEAM.PLAYER]: 0, [TEAM.AI]: 0 };
    $boids.boids.forEach(b => { 
      if (counts[b.groupIndex] !== undefined) counts[b.groupIndex]++; 
    });
    return counts;
  }
  
  function update(timestamp) {
    if (!ctx) return;
    
    camera.zoom += (camera.targetZoom - camera.zoom) * 0.15;
    // Apply pan inertia
    if (!isDraggingCamera && !isPanning) {
      if (Math.abs(panVelocity.x) > 0.001 || Math.abs(panVelocity.y) > 0.001) {
        camera.x += panVelocity.x;
        camera.y += panVelocity.y;
        clampCamera();
        panVelocity.x *= 0.90;
        panVelocity.y *= 0.90;
      } else {
        panVelocity.x = 0;
        panVelocity.y = 0;
      }
    }
    
    const dt = 16;
    Object.keys(powerupCooldowns).forEach(k => {
      if (powerupCooldowns[k] > 0) powerupCooldowns[k] = Math.max(0, powerupCooldowns[k] - dt);
    });
    
    if (slowMoRemaining > 0) slowMoRemaining = Math.max(0, slowMoRemaining - dt);
    
    // Reset transform for DPR
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    
    // Draw arena
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4 / camera.zoom;
    ctx.strokeRect(0, 0, ARENA_W, ARENA_H);
    
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
    
    // Draw static walls
    ctx.fillStyle = '#555';
    WALLS.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));
    
    // Draw doors (with animation)
    DOORS.forEach(door => {
      const openAmount = doorManager.getDoorOpenAmount(door.id);
      
      if (openAmount < 1) {
        // Door is closed or closing
        ctx.fillStyle = openAmount < 0.1 ? '#444' : `rgba(68, 68, 68, ${1 - openAmount * 0.7})`;
        
        if (door.orientation === 'horizontal') {
          // Horizontal door - slides up/down
          const slideOffset = door.h * openAmount;
          ctx.fillRect(door.x, door.y + slideOffset, door.w, door.h * (1 - openAmount));
        } else {
          // Vertical door - slides left/right
          const slideOffset = door.w * openAmount;
          ctx.fillRect(door.x + slideOffset, door.y, door.w * (1 - openAmount), door.h);
        }
      }
      
      // Draw door frame/outline
      ctx.strokeStyle = openAmount > 0.5 ? '#0F0' : '#666';
      ctx.lineWidth = 2 / camera.zoom;
      ctx.strokeRect(door.x, door.y, door.w, door.h);
    });
    
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
        const mouseSettingsForBoid = boid.groupIndex === TEAM.PLAYER && isTouchingBoids
          ? { ...$mouseSettings, position: mouseWorldPos, active: true, repulsionRadius: 120 }
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
            }
          });
          return false;
        }
        
        if (powerup.type === 'TRACTOR' && elapsed < powerup.durationMs) {
          boidsData.boids.forEach(boid => {
            const dx = powerup.x - boid.position.x, dy = powerup.y - boid.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < powerup.radius && dist > 0) {
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
        const pulse = 0.6 + Math.sin(elapsed * 0.01) * 0.4;
        ctx.fillStyle = powerup.color;
        ctx.globalAlpha = pulse;
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y, 20 / camera.zoom, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = powerup.color;
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 3 / camera.zoom;
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y, powerup.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (powerup.type === 'TRACTOR') {
        ctx.strokeStyle = powerup.color;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 4 / camera.zoom;
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y, powerup.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = powerup.color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y, 15 / camera.zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
    
    // Draw boids and small tails (3-4 points)
    $boids.boids.forEach(boid => {
      const angle = Math.atan2(boid.velocity.y, boid.velocity.x);
      const size = $visualSettings.boidSize;
      
      ctx.save();
      ctx.translate(boid.position.x, boid.position.y);
      ctx.rotate(angle);
      
      // Simple triangle shape
      ctx.beginPath();
      ctx.moveTo(size * 2, 0);
      ctx.lineTo(-size, -size);
      ctx.lineTo(-size, size);
      ctx.closePath();
      ctx.fillStyle = boid.color;
      ctx.fill();
      
      // Optional: tiny glow for visibility
      if (camera.zoom > 0.8) {
        ctx.strokeStyle = boid.color;
        ctx.lineWidth = 0.5 / camera.zoom;
        ctx.stroke();
      }
      
      ctx.restore();

      // Tail rendering: connect last few trail points with fading alpha
      const trailPoints = boid.trail || [];
      const tailCount = Math.min(trailPoints.length, $visualSettings.trailLength);
      if (tailCount >= 2) {
        ctx.save();
        ctx.globalAlpha = $visualSettings.trailOpacity;
        ctx.strokeStyle = boid.color;
        ctx.lineWidth = Math.max(0.5, $visualSettings.trailWidth / camera.zoom);
        ctx.beginPath();
        for (let i = tailCount - 1; i >= 0; i--) {
          const p = trailPoints[trailPoints.length - 1 - i];
          if (i === tailCount - 1) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.restore();
      }
    });
    
    ctx.restore();
    
    drawHUD();
    alerts = alerts.filter(a => Date.now() - a.time < 3000);
    
    animationFrameId = requestAnimationFrame(update);
  }
  
  function drawHUD() {
    const teamCounts = countTeams();
    const fontSize = Math.floor(12 * uiScale);
    const padding = 10 * uiScale;
    
    // Mini-map (bottom-right for mobile, top-right for desktop)
    const mapSize = isMobile ? 120 * uiScale : 150 * uiScale;
    const mapX = canvasWidth - mapSize - padding;
    const mapY = isMobile ? canvasHeight - mapSize - 80 * uiScale : 70 * uiScale;
    const mapScale = mapSize / Math.max(ARENA_W, ARENA_H);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);
    
    ctx.fillStyle = '#333';
    WALLS.forEach(w => ctx.fillRect(
      mapX + w.x * mapScale, 
      mapY + w.y * mapScale, 
      Math.max(1, w.w * mapScale), 
      Math.max(1, w.h * mapScale)
    ));
    
    const viewW = (canvasWidth / camera.zoom) * mapScale;
    const viewH = (canvasHeight / camera.zoom) * mapScale;
    const viewX = mapX + camera.x * mapScale - viewW / 2;
    const viewY = mapY + camera.y * mapScale - viewH / 2;
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(viewX, viewY, viewW, viewH);

    // Zoom +/- buttons near minimap (desktop and mobile)
    const zoomBtnSize = 32 * uiScale;
    const zoomGap = 6 * uiScale;
    const zoomX = mapX + mapSize - zoomBtnSize;
    const zoomYPlus = mapY - zoomBtnSize - zoomGap;
    const zoomYMinus = zoomYPlus - zoomBtnSize - zoomGap;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(zoomX, zoomYPlus, zoomBtnSize, zoomBtnSize);
    ctx.fillRect(zoomX, zoomYMinus, zoomBtnSize, zoomBtnSize);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(zoomX, zoomYPlus, zoomBtnSize, zoomBtnSize);
    ctx.strokeRect(zoomX, zoomYMinus, zoomBtnSize, zoomBtnSize);
    ctx.font = `${Math.floor(18 * uiScale)}px monospace`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', zoomX + zoomBtnSize / 2, zoomYPlus + zoomBtnSize / 2);
    ctx.fillText('−', zoomX + zoomBtnSize / 2, zoomYMinus + zoomBtnSize / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    
    // Morale bars (top-left)
    const barW = isMobile ? 120 * uiScale : 180 * uiScale;
    const barH = 15 * uiScale;
    let barY = padding;
    
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = '#aaa';
    ctx.fillText('PLAYER', padding, barY + fontSize);
    barY += fontSize + 3;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(padding, barY, barW, barH);
    ctx.fillStyle = morale[TEAM.PLAYER] > 0.5 ? '#00FFFF' : '#FF4500';
    ctx.fillRect(padding, barY, barW * morale[TEAM.PLAYER], barH);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, barY, barW, barH);
    
    ctx.font = `bold ${Math.floor(14 * uiScale)}px monospace`;
    ctx.fillStyle = '#00FFFF';
    ctx.textAlign = 'right';
    ctx.fillText(teamCounts[TEAM.PLAYER].toString(), padding + barW - 3, barY + barH - 3);
    ctx.textAlign = 'left';
    
    barY += barH + padding;
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = '#aaa';
    ctx.fillText('AI', padding, barY + fontSize);
    barY += fontSize + 3;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(padding, barY, barW, barH);
    ctx.fillStyle = morale[TEAM.AI] > 0.5 ? '#FF1493' : '#FF4500';
    ctx.fillRect(padding, barY, barW * morale[TEAM.AI], barH);
    ctx.strokeStyle = '#555';
    ctx.strokeRect(padding, barY, barW, barH);
    
    ctx.font = `bold ${Math.floor(14 * uiScale)}px monospace`;
    ctx.fillStyle = '#FF1493';
    ctx.textAlign = 'right';
    ctx.fillText(teamCounts[TEAM.AI].toString(), padding + barW - 3, barY + barH - 3);
    ctx.textAlign = 'left';
    
    // Pause button (top-right)
    const pauseBtnSize = 50 * uiScale;
    const pauseBtnX = canvasWidth - pauseBtnSize - padding;
    const pauseBtnY = padding;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(pauseBtnX, pauseBtnY, pauseBtnSize, pauseBtnSize);
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(pauseBtnX, pauseBtnY, pauseBtnSize, pauseBtnSize);
    
    ctx.font = `${Math.floor(20 * uiScale)}px monospace`;
    ctx.fillStyle = '#00FFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isPaused ? '▶' : '⏸', pauseBtnX + pauseBtnSize / 2, pauseBtnY + pauseBtnSize / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    
    // Power-up button (bottom-right for mobile, bottom-left for desktop)
    const powerBtnSize = 60 * uiScale;
    const powerBtnX = isMobile ? canvasWidth - powerBtnSize - padding : padding;
    const powerBtnY = canvasHeight - powerBtnSize - padding;
    
    ctx.fillStyle = showPowerupMenu ? 'rgba(0, 100, 100, 0.9)' : 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(powerBtnX, powerBtnY, powerBtnSize, powerBtnSize);
    ctx.strokeStyle = showPowerupMenu ? '#00FFFF' : '#666';
    ctx.lineWidth = 2;
    ctx.strokeRect(powerBtnX, powerBtnY, powerBtnSize, powerBtnSize);
    
    ctx.font = `${Math.floor(24 * uiScale)}px monospace`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', powerBtnX + powerBtnSize / 2, powerBtnY + powerBtnSize / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    
    // Power-up menu
    if (showPowerupMenu) {
      const menuItems = Object.entries(POWERUP_TYPES);
      const itemSize = 55 * uiScale;
      let menuX = isMobile ? canvasWidth - itemSize - padding : padding;
      let menuY = powerBtnY - 5 * uiScale;
      if (powerupMenuAnchor) {
        menuX = Math.min(Math.max(powerupMenuAnchor.x - itemSize / 2, padding), canvasWidth - itemSize - padding);
        menuY = Math.min(powerupMenuAnchor.y - 5 * uiScale, canvasHeight - padding);
      }
      
      menuItems.forEach(([key, powerup]) => {
        menuY -= itemSize + 5 * uiScale;
        const onCooldown = powerupCooldowns[key] > 0;
        
        ctx.fillStyle = onCooldown ? 'rgba(50, 50, 50, 0.9)' : 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(menuX, menuY, itemSize, itemSize);
        ctx.strokeStyle = onCooldown ? '#555' : powerup.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(menuX, menuY, itemSize, itemSize);
        
        ctx.font = `${Math.floor(10 * uiScale)}px monospace`;
        ctx.fillStyle = onCooldown ? '#777' : '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(key, menuX + itemSize / 2, menuY + 5);
        
        ctx.font = `${Math.floor(20 * uiScale)}px monospace`;
        ctx.textBaseline = 'middle';
        ctx.fillText(powerup.icon, menuX + itemSize / 2, menuY + itemSize * 0.6);
        
        if (onCooldown) {
          const progress = 1 - powerupCooldowns[key] / powerup.cooldown;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(menuX, menuY + itemSize - 4, itemSize * progress, 4);
        }
      });
      
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
    
    // Alerts (top-center)
    let alertY = canvasHeight * 0.15;
    alerts.forEach(alert => {
      const age = Date.now() - alert.time;
      const alpha = Math.max(0, 1 - age / 3000);
      
      ctx.font = `bold ${Math.floor(14 * uiScale)}px monospace`;
      ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
      ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(alert.text.toUpperCase(), canvasWidth / 2, alertY);
      ctx.fillText(alert.text.toUpperCase(), canvasWidth / 2, alertY);
      ctx.textAlign = 'left';
      
      alertY += 25 * uiScale;
    });
    
    // Touch indicator (only on mobile when touching)
    if (isMobile && isTouchingBoids) {
      const screenPos = worldToScreen(mouseWorldPos.x, mouseWorldPos.y);
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, 40 * uiScale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Pending powerup ghost indicator
    if (pendingPowerup) {
      const ghost = pendingPowerup;
      const radius = ghost.radius || 160;
      const screenPos = worldToScreen(mouseWorldPos.x, mouseWorldPos.y);
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = ghost.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, radius * camera.zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = ghost.color;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, 8 * uiScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
</script>

<main>
  <canvas bind:this={canvas}></canvas>
  
  {#if $gameState.status === 'finished'}
    <div class="overlay game-over">
      <div class="panel">
        <h1>MISSION {$gameState.winner === TEAM.PLAYER ? 'COMPLETE' : 'FAILED'}</h1>
        <p>
          {#if $gameState.winner === TEAM.PLAYER}
            Monoculture achieved
          {:else}
            Swarm eliminated
          {/if}
        </p>
        <button on:click={() => window.location.reload()}>NEW MISSION</button>
      </div>
    </div>
  {/if}
  
  {#if isPaused && $gameState.status === 'running'}
    <div class="overlay pause">
      <div class="panel doctrine">
        <h2>TACTICAL BRIEFING</h2>
        <div class="settings">
          <label>
            <span>Cohesion</span>
            <input type="range" min="0" max="1" step="0.1" bind:value={$doctrine.cohesion} />
            <span class="value">{$doctrine.cohesion.toFixed(1)}</span>
          </label>
          <label>
            <span>Separation</span>
            <input type="range" min="0" max="1" step="0.1" bind:value={$doctrine.separation} />
            <span class="value">{$doctrine.separation.toFixed(1)}</span>
          </label>
          <label>
            <span>Bravery</span>
            <input type="range" min="0" max="1" step="0.1" bind:value={$doctrine.bravery} />
            <span class="value">{$doctrine.bravery.toFixed(1)}</span>
          </label>
        </div>
        <button class="resume" on:click={togglePause}>RESUME</button>
      </div>
    </div>
  {/if}
</main>

<style>
  main {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #000;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
  }
  
  canvas {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
  }
  
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.9);
    z-index: 100;
    touch-action: auto;
  }
  
  .panel {
    background: #0a0a0a;
    border: 2px solid #00FFFF;
    padding: clamp(20px, 5vw, 40px);
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    font-family: monospace;
    text-align: center;
  }
  
  .panel h1 {
    color: #00FFFF;
    font-size: clamp(20px, 6vw, 36px);
    margin: 0 0 15px 0;
  }
  
  .panel h2 {
    color: #00FFFF;
    font-size: clamp(16px, 4vw, 24px);
    margin: 0 0 20px 0;
  }
  
  .panel p {
    color: #ccc;
    font-size: clamp(14px, 3.5vw, 18px);
    margin: 0 0 20px 0;
  }
  
  .panel button {
    background: #00FFFF;
    color: #000;
    border: none;
    padding: clamp(10px, 3vw, 15px) clamp(20px, 5vw, 30px);
    font-size: clamp(14px, 3.5vw, 16px);
    font-family: monospace;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    touch-action: manipulation;
    min-height: 44px;
  }
  
  .panel button:active {
    background: #00AAAA;
    transform: scale(0.95);
  }
  
  .panel.doctrine {
    min-width: min(350px, 90vw);
  }
  
  .settings {
    margin: 20px 0;
    text-align: left;
  }
  
  .settings label {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    color: #ccc;
    font-size: clamp(12px, 3vw, 14px);
  }
  
  .settings label span:first-child {
    min-width: 90px;
  }
  
  .settings label span.value {
    min-width: 30px;
    text-align: right;
    color: #00FFFF;
  }
  
  .settings input[type="range"] {
    flex: 1;
    min-width: 0;
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    background: #333;
    outline: none;
    border-radius: 3px;
  }
  
  .settings input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #00FFFF;
    cursor: pointer;
    border-radius: 50%;
  }
  
  .settings input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #00FFFF;
    cursor: pointer;
    border-radius: 50%;
    border: none;
  }
  
  .resume {
    width: 100%;
  }
</style>
