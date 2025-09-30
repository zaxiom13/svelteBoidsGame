# Changelog - Swarm Commander

## v2.0.0 - Vertical Layout & Sliding Doors (Latest)

### Major Changes

#### 🔄 Vertical Map Orientation
- **Arena rotated to portrait mode**: 1600×3200 (was 3200×2200)
- **2 columns × 4 rows** sector grid (was 4×4)
- Optimized for mobile portrait gameplay
- Better fits phone screens naturally

#### 🚪 Dynamic Sliding Door System
- **All sectors now closed by default** with sliding doors
- **5-second door cycles**:
  - Doors open for 2.5 seconds
  - Even doors (0, 2, 4...) open first half of cycle
  - Odd doors (1, 3, 5...) open second half
  - 300ms smooth open/close animation
- **Visual feedback**:
  - Closed doors: gray (#444)
  - Opening/closing: animated slide
  - Open doors: green outline (#0F0)
- **Strategic implications**:
  - Boids must wait for doors to open
  - Creates natural flow patterns
  - Prevents immediate cross-sector movement
  - Adds timing element to strategy

#### 🐜 Much Smaller Boids
- **Boid size reduced**: 4px (was 10px) - 60% smaller
- **Trail width reduced**: 1px (was 2px)
- **Trail opacity reduced**: 0.15 (was 0.25)
- **Result**: Cleaner visual with more visible swarms
- Better performance with less overdraw
- Easier to see overall patterns

#### 🔧 Fixed Corner-Sticking Issue
**Problem**: Boids were getting stuck in corners and along walls

**Solutions Implemented**:
1. **Increased detection radius**: 80px (was 50px)
2. **Added urgent avoidance zone**: 30px with 5x force
3. **Tangential escape component**:
   - When very close to wall, adds perpendicular force
   - Helps boids "slide" along walls instead of sticking
   - Rotates push vector by 90° for tangent direction
4. **Only avoid closest obstacle**:
   - Prevents conflicting forces from multiple walls
   - Finds single nearest wall and pushes away
5. **Stronger border avoidance**:
   - 60px margin (was 50px)
   - 20px urgent zone with 3x force
   - Emergency escape when at edges
6. **Door-aware collision**:
   - Closed doors treated as walls
   - Open doors allow passage
   - Real-time door state checking

**Result**: Boids now smoothly navigate around corners and through doorways

### Technical Details

#### New Constants
```javascript
// Arena dimensions
ARENA_W = 1600  // Narrow for vertical
ARENA_H = 3200  // Tall for portrait
SECTOR_W = 800
SECTOR_H = 800  // Square sectors
SECTOR_COLS = 2
SECTOR_ROWS = 4

// Door system
DOOR_WIDTH = 200
DOOR_CYCLE_MS = 5000
DOOR_OPEN_DURATION = 2500
```

#### New Classes
- **`DoorManager`**: Manages door open/close timing
  - `isDoorOpen(doorId)`: Returns boolean
  - `getDoorOpenAmount(doorId)`: Returns 0-1 for animation

#### Wall Avoidance Algorithm
```javascript
1. Find closest obstacle (wall or closed door)
2. Calculate distance to closest point
3. If distance < urgentRadius (30px):
   - Apply strong repulsion (5x force)
   - Add tangential component (prevent sticking)
4. Else if distance < detectionRadius (80px):
   - Apply normal repulsion (2x force)
5. Normalize and scale by maxForce * 4
```

#### Border Avoidance Algorithm
```javascript
1. Check distance to each border
2. If distance < urgentMargin (20px):
   - Apply 3x force multiplier
3. Else if distance < margin (60px):
   - Apply normal force
4. Push away from border
5. Normalize and scale by maxForce * 3
```

### Camera Adjustments
- **Initial zoom**: 0.45 (was 0.35) - better for vertical view
- **Min zoom**: 0.25 (was 0.15) - see full height
- **Max zoom**: 1.5 (was 1.2) - closer detail

### Visual Improvements
- Boid triangle shape: 2:1 aspect ratio for better directionality
- Optional glow when zoomed in (zoom > 0.8)
- Door frames show green when open
- Smoother sliding door animation

### Files Modified
1. **`src/lib/constants.js`**:
   - Arena dimensions updated
   - DoorManager class added
   - generateWalls() rewritten for doors
   - DOORS array exported

2. **`src/lib/Boid.js`**:
   - avoidWalls() completely rewritten
   - Door collision detection added
   - Tangential escape logic
   - Stronger forces near obstacles
   - avoidBorders() improved with urgent zones

3. **`src/lib/boidsStore.js`**:
   - Boid size reduced to 4px
   - Trail settings adjusted

4. **`src/App.svelte`**:
   - Door rendering with animation
   - Door state checking via doorManager
   - Camera bounds adjusted for vertical
   - Boid rendering improved

### Breaking Changes
- Arena dimensions changed (will affect replays/saves)
- Door system changes gameplay dynamics
- Smaller boids may affect visibility on very small screens

### Migration Notes
If you have saved game states or custom arena configs, you'll need to:
1. Update arena dimensions to new values
2. Regenerate wall/door positions
3. Adjust camera zoom presets

---

## v1.0.0 - Initial Mobile Release

### Features
- Two-team boids simulation (Player vs AI)
- Mobile-optimized touch controls
- Morale system
- Mechanistic power-ups (Bomb, Tractor Beam)
- Tactical pause screen
- Camera zoom/pan
- Mini-map HUD
- Wall avoidance (basic)
- Horizontal 4×4 sector grid

See IMPLEMENTATION_SUMMARY.md for full v1.0.0 details.
