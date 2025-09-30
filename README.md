# Swarm Commander

A tactical boids-based strategy game inspired by Ender's Game, where you command a swarm against an AI opponent through subtle influence and mechanistic power-ups.

## Game Concept

**Swarm Commander** pits you against an AI in a battle for swarm dominance. Victory comes through achieving a monoculture—converting all boids to your team through defection mechanics. Your swarm isn't fully under your control; they follow their own rules first, and you simply tilt the balance.

### Core Mechanics

- **Two Teams**: Player (Cyan) vs AI (Pink)
- **Mutual Defection**: Boids can switch teams based on peer pressure and morale
- **Morale System**: Using power-ups decreases your morale, affecting defection resistance
- **Win Condition**: Achieve monoculture (all boids on one team) or eliminate the enemy

### Controls

#### Desktop
- **Left Click & Hold**: Attract your boids (player boids only respond)
- **Shift + Drag**: Pan camera around the arena
- **Mouse Wheel**: Zoom in/out
- **Click Power-up Buttons**: Deploy bombs or tractor beams (with friendly fire risk)
- **PAUSE Button**: Open tactical briefing to adjust doctrine

#### Mobile (Touch)
- **Tap & Hold**: Attract your boids (shows cyan touch indicator)
- **Two-Finger Pinch**: Zoom in/out
- **Two-Finger Drag**: Pan camera around arena
- **Tap Power-up Button** (⚡ bottom-right): Open power-up menu
- **Tap Power-up Icon**: Deploy bomb or tractor beam at screen center
- **Tap Pause Button** (⏸ top-right): Open tactical briefing

### Game Features

#### Large Arena with Sectors
- 3200×2200 world divided into 4×4 sectors (A1-D4)
- Silo/prison layout with walls and tunnels
- Boids avoid walls and borders naturally

#### Camera System
- Smooth zoom: from full-map overview to single-sector detail
- Pinch-to-zoom and wheel zoom support
- Mini-map HUD shows walls/geometry and current view

#### Tactical Pause Screen
- **Doctrine Toggles**: Adjust Cohesion, Separation, and Bravery
  - **Cohesion**: How strongly boids stick together
  - **Separation**: How much boids avoid crowding
  - **Bravery**: Resistance to defection
- **Unpause Ramp**: 0.75s slow-motion on resume for smooth re-entry

#### Mechanistic Power-ups
- **BOMB**: Timed fuse → radial impulse blast (affects both teams!)
- **TRACTOR BEAM**: Temporary pull field (lasts 2 seconds)
- Each power-up has cooldowns and reduces your morale

#### Military HUD
- Morale bars for both teams
- Team counts (Player vs AI)
- Mini-map with camera view indicator
- Alert notifications
- Power-up buttons with cooldown indicators

### PRD Features Implemented

✅ **Transform arena**: Silo/prison grid layout with walls and tunnels  
✅ **Camera system**: Pinch-zoom, pan, mini-map HUD  
✅ **Two teams**: Player vs AI with monoculture win condition  
✅ **Morale system**: Tied to power-up usage  
✅ **Mechanistic power-ups**: Bomb and Tractor Beam with friendly fire  
✅ **Tactical pause**: Doctrine toggles (Cohesion/Separation/Bravery)  
✅ **Player-only influence**: Touch/tap only attracts player boids  
✅ **Unpause ramp**: 0.75s slow-mo on resume  
✅ **Ender's Game aesthetic**: Top-down military HUD, clean interface  

### Technical Stack

- **Svelte** + **Vite** for fast reactive UI
- **Canvas 2D API** for rendering
- **Boids Algorithm** with wall avoidance and defection mechanics
- **Quadtree** spatial indexing for performance

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Test on mobile (use local network IP shown in terminal)
# e.g., http://192.168.x.x:5173

# Run tests
npm test

# Build for production
npm run build
```

## Mobile Testing

The game is fully optimized for mobile! See [MOBILE_TESTING.md](./MOBILE_TESTING.md) for:
- Touch gesture controls
- UI testing checklist
- Performance tips
- Troubleshooting guide

**Quick Mobile Test:**
1. Start dev server: `npm run dev`
2. Note the network URL (e.g., `http://192.168.1.x:5173`)
3. Open that URL on your phone (same WiFi network)
4. Use touch gestures to play!

## Game Design Notes

The tension in Swarm Commander comes from:

1. **Limited control**: You nudge, you don't command directly
2. **Morale trade-off**: Power-ups help tactically but hurt loyalty
3. **Friendly fire**: Bombs and beams affect both teams equally
4. **Peer pressure**: Outnumbered boids may defect to the stronger side
5. **Spatial strategy**: Walls and tunnels create choke points and flow control

The game loop lasts 3-4 minutes, with quick, intense matches that reward both micro (local influence) and macro (doctrine + power-up timing) play.

## License

MIT
