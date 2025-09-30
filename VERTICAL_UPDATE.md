# Vertical Layout & Sliding Doors Update

## 🎮 What Changed

### 1. **Map is Now Vertical (Portrait Mode)** ✅
- **Old**: 3200×2200 horizontal (landscape)
- **New**: 1600×3200 vertical (portrait)
- **Why**: Better for mobile phone gameplay
- **Sectors**: 2 columns × 4 rows (A1-B1, A2-B2, A3-B3, A4-B4)

### 2. **Sliding Doors Replace Static Tunnels** ✅
- **Every sector is now closed** by default
- **Doors open and close periodically** (5-second cycles)
- **Timing strategy**:
  - Even doors (0, 2, 4...) open during first 2.5s
  - Odd doors (1, 3, 5...) open during next 2.5s
  - 300ms smooth slide animation
- **Visual cues**:
  - Closed: Gray solid door
  - Opening: Sliding animation
  - Open: Green outline frame
  - Closing: Sliding back
- **Gameplay impact**:
  - Must wait for doors to pass between sectors
  - Creates natural "waves" of boid movement
  - Strategic timing matters
  - Can trap/separate enemy swarms

### 3. **Boids Are Much Smaller** ✅
- **Old size**: 10 pixels
- **New size**: 4 pixels (60% smaller!)
- **Why**:
  - See more boids at once
  - Less visual clutter
  - Better swarm patterns visible
  - Improved performance
- **Other adjustments**:
  - Thinner trails (1px vs 2px)
  - Lower trail opacity (0.15 vs 0.25)
  - Cleaner, sharper triangle shape

### 4. **Fixed Corner-Sticking Bug** ✅

#### The Problem
Boids were getting stuck in corners and edges:
- Would cluster in corners and vibrate
- Couldn't escape tight spaces
- Got trapped between walls
- Looked like they were "glued" to walls

#### The Solution
Complete rewrite of wall avoidance logic:

**A. Closest Obstacle Only**
- Old: Avoided all nearby walls (conflicting forces)
- New: Find single closest wall/door and avoid it
- Result: Clear escape direction

**B. Urgent Avoidance Zone**
```
Distance < 30px → EMERGENCY MODE
- 5x stronger force
- Adds tangential component (slides along wall)
- Prevents direct collision
```

**C. Tangential Escape**
- When very close, adds perpendicular force
- Rotates push vector by 90 degrees
- Helps boids "slide" past corners
- Like adding friction/guide rails

**D. Door Awareness**
- Closed doors = solid walls (avoid)
- Open doors = passable (ignore)
- Real-time door state checking
- Boids wait at closed doors naturally

**E. Stronger Border Forces**
```
Distance < 20px from edge → 3x force
Distance < 60px from edge → normal force
```

**Result**: Boids smoothly navigate corners, wait at doors, flow through when open!

### 5. **Camera Adjusted for Vertical View** ✅
- **Starting zoom**: 0.45 (was 0.35) - fits portrait better
- **Min zoom**: 0.25 - can see full vertical map
- **Max zoom**: 1.5 - can get closer detail
- Pinch/wheel zoom still works perfectly

## 🎯 How to Play with New Features

### Strategy Tips

#### Door Timing
- **Watch door cycles** - green outline = open
- **Time your attacks** when enemy doors close
- **Regroup when your doors close** for safety
- **Split enemy** by catching them in different sectors

#### Vertical Navigation
- **Top sectors** (A1, B1) = Player spawn area
- **Bottom sectors** (A4, B4) = AI spawn area
- **Middle sectors** (A2-B2, A3-B3) = contested zone
- Use two-finger pan to navigate quickly

#### Small Boids
- **Zoom in** to see individual boids clearly
- **Zoom out** to see swarm patterns
- **Watch colors**: Cyan = yours, Pink = AI
- Touch indicator shows your influence radius

### Door Cycle Cheat Sheet
```
0.0 - 2.5s: Even doors OPEN  (doors 0, 2, 4, 6, 8, 10)
2.5 - 5.0s: Odd doors OPEN   (doors 1, 3, 5, 7, 9, 11)
[repeat]
```

## 🐛 Bug Fixes

### Corner-Sticking (FIXED)
**Before**:
- Boids cluster in corners
- Can't escape walls
- Vibrate in place
- Get trapped

**After**:
- Smooth corner navigation
- Clear escape paths
- Natural wall sliding
- No more traps!

### Testing Checklist ✓
- [x] Boids avoid walls smoothly
- [x] No corner-sticking
- [x] Boids wait at closed doors
- [x] Boids pass through open doors
- [x] Small boids are visible
- [x] Camera fits vertical map
- [x] Touch controls still work
- [x] Power-ups deploy correctly
- [x] Pause screen accessible
- [x] Game flows naturally

## 📱 Mobile Performance

### Improvements
- **Smaller boids** = less overdraw = better FPS
- **Vertical layout** = natural phone orientation
- **Door system** = controlled boid flow = fewer collision checks
- **Optimized avoidance** = faster calculations

### Expected Performance
- **Modern phones** (2020+): 60 FPS smooth
- **Mid-range phones** (2018+): 45-60 FPS
- **Older phones**: 30+ FPS (acceptable)

## 🔧 Technical Summary

### Files Changed
1. **constants.js**: Arena dimensions, door system, DoorManager class
2. **Boid.js**: Complete avoidance rewrite, door awareness
3. **boidsStore.js**: Smaller boid size, reduced trail
4. **App.svelte**: Door rendering, animation, camera adjustment

### New Exports
```javascript
import { 
  DOORS,           // Array of door positions
  doorManager,     // DoorManager instance
  DOOR_WIDTH,      // 200px
  DOOR_CYCLE_MS,   // 5000ms
  DOOR_OPEN_DURATION // 2500ms
} from './lib/constants';
```

### Key Algorithms

**Wall Avoidance**:
1. Find closest obstacle (walls + closed doors)
2. Calculate distance
3. If < 30px: emergency force + tangent
4. Else if < 80px: normal avoidance
5. Normalize and apply

**Door Animation**:
```javascript
openAmount = doorManager.getDoorOpenAmount(doorId);
// Returns 0.0 (closed) to 1.0 (open)
// Use for slide animation offset
```

## 🚀 What's Next?

### Potential Future Enhancements
- [ ] Door control power-up (lock/unlock doors)
- [ ] Different door types (one-way, timed, etc.)
- [ ] Sector objectives (capture and hold)
- [ ] Vertical sector indicators on sides
- [ ] Door opening sound effects
- [ ] Haptic feedback when doors open/close
- [ ] Advanced AI that uses door timing

## 🎮 Play Now!

```bash
npm run dev
# Desktop: http://localhost:5173
# Mobile: http://[your-ip]:5173
```

**Tip**: Play in portrait mode for best experience!

---

**Questions?** Check MOBILE_TESTING.md or MOBILE_CONTROLS.md
