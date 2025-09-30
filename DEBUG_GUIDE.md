# Debug Guide - Swarm Commander

## Quick Diagnosis

### Issue: Boids Not Visible

**Open Browser Console (F12)**

#### Check 1: Are boids spawning?
```javascript
// In console:
console.log('Total boids:', $boids.boids.length);
console.log('Player boids:', $boids.boids.filter(b => b.groupIndex === 0).length);
console.log('AI boids:', $boids.boids.filter(b => b.groupIndex === 1).length);
```

**Expected**: 240 total (120 player, 120 AI)

#### Check 2: Where are boids?
```javascript
// Sample first 5 boids
$boids.boids.slice(0, 5).forEach((b, i) => {
    console.log(`Boid ${i}:`, {
        x: b.position.x.toFixed(1),
        y: b.position.y.toFixed(1),
        team: b.groupIndex === 0 ? 'PLAYER' : 'AI',
        inBounds: b.position.x >= 0 && b.position.x <= 1600 && 
                  b.position.y >= 0 && b.position.y <= 3200
    });
});
```

**Expected**:
- Player: y between 0-800 (top sectors)
- AI: y between 2400-3200 (bottom sectors)
- x between 0-1600 for all
- inBounds: true for all

#### Check 3: Are positions valid?
```javascript
// Check for NaN or Infinity
const invalid = $boids.boids.filter(b => 
    !isFinite(b.position.x) || 
    !isFinite(b.position.y) ||
    !isFinite(b.velocity.x) ||
    !isFinite(b.velocity.y)
);

console.log('Invalid boids:', invalid.length);
if (invalid.length > 0) {
    console.error('Found invalid boids:', invalid);
}
```

**Expected**: 0 invalid boids

#### Check 4: Camera position
```javascript
// Check camera
console.log('Camera:', {
    x: camera.x,
    y: camera.y,
    zoom: camera.zoom,
    canSeeBoids: camera.y >= 0 && camera.y <= 3200
});
```

**Expected**:
- x: ~800 (center)
- y: ~1600 (middle of vertical map)
- zoom: 0.25-1.5

---

## Issue: Boids "Snapping" or Disappearing

### Console Warnings to Watch

If you see these, there's a problem:

```
⚠️ Invalid velocity detected, resetting: { x: NaN, y: 3.2 }
```
**Cause**: Force calculation created NaN
**Fix**: Already handled, but indicates upstream issue

```
⚠️ Invalid force from wallAvoidance: { x: Infinity, y: 0 }
```
**Cause**: Division by zero in wall avoidance
**Fix**: Check wall positions

```
❌ Invalid position detected, resetting: { x: NaN, y: 512.3 }
```
**Cause**: Critical - velocity was NaN
**Fix**: Boid reset to center, investigate force sources

### Live Monitoring

```javascript
// Track boid movements for 5 seconds
let snapCount = 0;
const tracker = setInterval(() => {
    $boids.boids.forEach(b => {
        const speed = Math.sqrt(b.velocity.x**2 + b.velocity.y**2);
        if (speed > 20) { // Abnormally fast
            snapCount++;
            console.warn('Boid moving too fast:', {
                speed: speed.toFixed(2),
                pos: b.position,
                vel: b.velocity
            });
        }
    });
}, 100);

setTimeout(() => {
    clearInterval(tracker);
    console.log(`Detected ${snapCount} snap events in 5s`);
}, 5000);
```

**Expected**: 0 snap events

---

## Issue: Power-ups Not Deploying at Touch

### Check Touch Position

```javascript
// Monitor touch/mouse position
canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const worldPos = screenToWorld(touch.clientX, touch.clientY);
    console.log('Touch at:', {
        screen: { x: touch.clientX, y: touch.clientY },
        world: worldPos
    });
});
```

### Verify Power-up Placement

```javascript
// After deploying a power-up:
console.log('Active power-ups:', activePowerups.map(p => ({
    type: p.type,
    x: p.x.toFixed(1),
    y: p.y.toFixed(1),
    age: Date.now() - p.placedAt
})));
```

**Expected**: Power-up x/y matches your touch world position

---

## Visual Debug Overlay

Add to `App.svelte` temporarily for debugging:

```javascript
// Inside drawHUD() function
if (true) { // Debug mode
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    
    // Draw boid positions as dots
    $boids.boids.forEach(b => {
        ctx.fillStyle = b.groupIndex === 0 ? '#0FF' : '#F0F';
        ctx.beginPath();
        ctx.arc(b.position.x, b.position.y, 10 / camera.zoom, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw spawn zones
    ctx.strokeStyle = '#0F0';
    ctx.lineWidth = 2 / camera.zoom;
    ctx.strokeRect(0, 0, ARENA_W, SECTOR_H); // Player zone (top)
    ctx.strokeRect(0, 3 * SECTOR_H, ARENA_W, SECTOR_H); // AI zone (bottom)
    
    ctx.restore();
}
```

---

## Test Mode Commands

### Force Respawn
```javascript
// Reset all boids to safe positions
resetBoids(240, ARENA_W, ARENA_H, 2);
console.log('✅ Boids respawned');
```

### Teleport Camera
```javascript
// View player spawn area
camera.x = ARENA_W / 2;
camera.y = SECTOR_H / 2;
camera.zoom = 0.6;
console.log('📷 Viewing player spawn');

// View AI spawn area
camera.x = ARENA_W / 2;
camera.y = 3.5 * SECTOR_H;
camera.zoom = 0.6;
console.log('📷 Viewing AI spawn');
```

### Check Walls & Doors
```javascript
console.log('Walls:', WALLS.length);
console.log('Doors:', DOORS.length);

// Check door states
DOORS.forEach((door, i) => {
    console.log(`Door ${i}:`, {
        id: door.id,
        open: doorManager.isDoorOpen(door.id),
        openAmount: doorManager.getDoorOpenAmount(door.id).toFixed(2),
        pos: `(${door.x}, ${door.y})`,
        orientation: door.orientation
    });
});
```

---

## Performance Profiling

### Check Frame Rate
```javascript
let frames = 0;
let lastTime = performance.now();

const fpsChecker = setInterval(() => {
    const now = performance.now();
    const fps = (frames * 1000 / (now - lastTime)).toFixed(1);
    console.log(`FPS: ${fps}`);
    frames = 0;
    lastTime = now;
}, 1000);

// In update loop, add: frames++;

// Stop after 10 seconds
setTimeout(() => clearInterval(fpsChecker), 10000);
```

**Target**: 30-60 FPS

### Check Update Time
```javascript
// In update() function, add:
const startTime = performance.now();

// ... all update logic ...

const updateTime = performance.now() - startTime;
if (updateTime > 16) { // Slower than 60fps
    console.warn(`Slow frame: ${updateTime.toFixed(2)}ms`);
}
```

---

## Common Issues & Fixes

### Issue: "Boids stuck in corners"
```javascript
// Check wall avoidance force
$boids.boids.filter(b => 
    b.position.x < 100 || b.position.x > ARENA_W - 100 ||
    b.position.y < 100 || b.position.y > ARENA_H - 100
).forEach(b => {
    const force = b.avoidWalls();
    console.log('Corner boid force:', force);
});
```
**Should see**: Non-zero force pushing away from walls

### Issue: "Doors not working"
```javascript
// Check door timing
const now = Date.now();
console.log('Door cycle position:', (now - doorManager.startTime) % 5000);
// Should cycle 0-5000ms
```

### Issue: "Can't zoom"
```javascript
console.log('Zoom state:', {
    current: camera.zoom,
    target: camera.targetZoom,
    min: minZoom,
    max: maxZoom
});
// target should change on pinch/wheel
```

---

## Emergency Reset

If everything is broken:

```javascript
// Nuclear option - reload page
window.location.reload();
```

Or restart dev server:
```bash
# Ctrl+C to stop
npm run dev
```

---

## Reporting Bugs

When reporting issues, include:

1. **Console output**: Copy all warnings/errors
2. **Boid count**: Run `console.log($boids.boids.length)`
3. **Camera state**: Run camera check above
4. **Browser**: Chrome/Safari/Firefox + version
5. **Device**: Desktop/Mobile + screen size
6. **Steps to reproduce**: What did you do before it broke?

Example bug report:
```
Issue: Boids disappeared after 30 seconds

Console output:
⚠️ Invalid velocity detected, resetting: {x: NaN, y: 2.1}
⚠️ Invalid velocity detected, resetting: {x: NaN, y: 1.8}

Boid count: 240 → 180 → 0

Camera: {x: 800, y: 1600, zoom: 0.5}

Browser: Chrome 120 on iPhone 13

Steps:
1. Started game
2. Deployed 3 bombs rapidly
3. Zoomed in
4. Boids vanished
```

---

## Success Indicators ✅

Your game is working correctly if:
- ✅ All 240 boids visible at start
- ✅ No console warnings during 5min gameplay
- ✅ Boids move smoothly (no snapping)
- ✅ Power-ups deploy at touch location
- ✅ Doors open/close on schedule
- ✅ 30+ FPS maintained
- ✅ Camera controls responsive
- ✅ Win/lose conditions trigger correctly

---

Need more help? Check:
- `BUGFIX_SUMMARY.md` - Recent fixes
- `MOBILE_TESTING.md` - Mobile-specific tests
- `VERTICAL_UPDATE.md` - Latest changes
