// Swarm Commander - Two team setup
export const TEAM = {
    PLAYER: 0,
    AI: 1
};

export const BOID_COLORS = ['#00FFFF', '#FF1493']; // Cyan for player, Pink for AI

export const COLOR_NAMES = {
    '#00FFFF': 'Player Swarm',
    '#FF1493': 'AI Swarm'
};

// Arena configuration - larger map with sectors
export const ARENA_W = 3200;
export const ARENA_H = 2200;
export const SECTOR_W = 800;
export const SECTOR_H = 550;
export const SECTOR_COLS = 4;
export const SECTOR_ROWS = 4;

// Generate sector labels (A1, A2, B1, B2, etc.)
export const SECTOR_LABELS = [];
for (let row = 0; row < SECTOR_ROWS; row++) {
    for (let col = 0; col < SECTOR_COLS; col++) {
        const label = String.fromCharCode(65 + row) + (col + 1);
        SECTOR_LABELS.push(label);
    }
}

// Wall configuration - create silo/prison layout with tunnels
export const WALL_THICKNESS = 40;
export const TUNNEL_WIDTH = 180;

// Generate walls for silo grid
export function generateWalls() {
    const walls = [];
    
    // Vertical walls (with tunnels)
    for (let col = 1; col < SECTOR_COLS; col++) {
        const x = col * SECTOR_W - WALL_THICKNESS / 2;
        // Create wall segments with tunnels
        for (let row = 0; row < SECTOR_ROWS; row++) {
            const y = row * SECTOR_H;
            const tunnelY = y + SECTOR_H / 2 - TUNNEL_WIDTH / 2;
            
            // Wall segment above tunnel
            if (tunnelY > y) {
                walls.push({
                    x: x,
                    y: y,
                    w: WALL_THICKNESS,
                    h: tunnelY - y
                });
            }
            
            // Wall segment below tunnel
            const belowY = tunnelY + TUNNEL_WIDTH;
            if (belowY < y + SECTOR_H) {
                walls.push({
                    x: x,
                    y: belowY,
                    w: WALL_THICKNESS,
                    h: y + SECTOR_H - belowY
                });
            }
        }
    }
    
    // Horizontal walls (with tunnels)
    for (let row = 1; row < SECTOR_ROWS; row++) {
        const y = row * SECTOR_H - WALL_THICKNESS / 2;
        // Create wall segments with tunnels
        for (let col = 0; col < SECTOR_COLS; col++) {
            const x = col * SECTOR_W;
            const tunnelX = x + SECTOR_W / 2 - TUNNEL_WIDTH / 2;
            
            // Wall segment left of tunnel
            if (tunnelX > x) {
                walls.push({
                    x: x,
                    y: y,
                    w: tunnelX - x,
                    h: WALL_THICKNESS
                });
            }
            
            // Wall segment right of tunnel
            const rightX = tunnelX + TUNNEL_WIDTH;
            if (rightX < x + SECTOR_W) {
                walls.push({
                    x: rightX,
                    y: y,
                    w: x + SECTOR_W - rightX,
                    h: WALL_THICKNESS
                });
            }
        }
    }
    
    return walls;
}

export const WALLS = generateWalls();

// Morale system constants
export const START_MORALE = 0.75;
export const MORALE_DECAY_PER_POWERUP = 0.05;
export const MORALE_RECOVERY_RATE = 0.001; // per frame
export const DEFECTION_THRESHOLD = 0.3;

// Power-up constants (mechanistic)
export const POWERUP_TYPES = {
    BOMB: {
        type: 'BOMB',
        color: '#FF4500',
        icon: '💣',
        fuseMs: 1500,
        radius: 200,
        impulse: 4.0,
        moraleHit: 0.02,
        cooldown: 4000
    },
    TRACTOR: {
        type: 'TRACTOR',
        color: '#4169E1',
        icon: '🧲',
        durationMs: 2000,
        radius: 220,
        pull: 0.2,
        moraleHit: 0.01,
        cooldown: 3500
    }
};