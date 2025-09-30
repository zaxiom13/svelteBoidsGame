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

// Arena configuration - VERTICAL orientation (portrait) - TWICE AS WIDE
export const ARENA_W = 3200;  // 2x wider (was 1600)
export const ARENA_H = 3200;  // Square arena
export const SECTOR_W = 800;
export const SECTOR_H = 800;  // Square sectors
export const SECTOR_COLS = 4;  // 4 columns (was 2)
export const SECTOR_ROWS = 4;  // 4 rows

// Generate sector labels (A1, A2, B1, B2, etc.)
export const SECTOR_LABELS = [];
for (let row = 0; row < SECTOR_ROWS; row++) {
    for (let col = 0; col < SECTOR_COLS; col++) {
        const label = String.fromCharCode(65 + row) + (col + 1);
        SECTOR_LABELS.push(label);
    }
}

// Wall configuration - create silo/prison layout with SLIDING DOORS
export const WALL_THICKNESS = 40;
export const DOOR_WIDTH = 200;  // Width of the door opening
export const DOOR_CYCLE_MS = 5000;  // 5 seconds per cycle
export const DOOR_OPEN_DURATION = 2500;  // Door stays open for 2.5s

// Door state management
export class DoorManager {
    constructor() {
        this.doors = [];
        this.startTime = Date.now();
    }
    
    // Check if a door is currently open
    isDoorOpen(doorId) {
        const elapsed = (Date.now() - this.startTime) % DOOR_CYCLE_MS;
        // Doors alternate: even doors open first half, odd doors open second half
        const isEvenCycle = elapsed < DOOR_CYCLE_MS / 2;
        const cycleProgress = elapsed % (DOOR_CYCLE_MS / 2);
        const isOpenPhase = cycleProgress < DOOR_OPEN_DURATION;
        
        const isEvenDoor = doorId % 2 === 0;
        return isEvenDoor ? (isEvenCycle && isOpenPhase) : (!isEvenCycle && isOpenPhase);
    }
    
    // Get door open percentage (0 = closed, 1 = fully open) for animation
    getDoorOpenAmount(doorId) {
        const elapsed = (Date.now() - this.startTime) % DOOR_CYCLE_MS;
        const isEvenCycle = elapsed < DOOR_CYCLE_MS / 2;
        const cycleProgress = elapsed % (DOOR_CYCLE_MS / 2);
        
        const isEvenDoor = doorId % 2 === 0;
        const shouldBeOpen = isEvenDoor ? isEvenCycle : !isEvenCycle;
        
        if (!shouldBeOpen) return 0;
        
        const openDuration = DOOR_OPEN_DURATION;
        const transitionTime = 300; // 300ms to open/close
        
        if (cycleProgress < transitionTime) {
            // Opening
            return cycleProgress / transitionTime;
        } else if (cycleProgress < openDuration - transitionTime) {
            // Fully open
            return 1;
        } else if (cycleProgress < openDuration) {
            // Closing
            return 1 - (cycleProgress - (openDuration - transitionTime)) / transitionTime;
        }
        
        return 0;
    }
}

// Generate walls with door positions
export function generateWalls() {
    const staticWalls = [];
    const doors = [];
    let doorId = 0;
    
    // Vertical walls (dividers between columns)
    for (let col = 1; col < SECTOR_COLS; col++) {
        const wallX = col * SECTOR_W - WALL_THICKNESS / 2;
        
        for (let row = 0; row < SECTOR_ROWS; row++) {
            const y = row * SECTOR_H;
            const doorY = y + SECTOR_H / 2 - DOOR_WIDTH / 2;
            
            // Wall segment above door
            if (doorY > y) {
                staticWalls.push({
                    x: wallX,
                    y: y,
                    w: WALL_THICKNESS,
                    h: doorY - y,
                    isStatic: true
                });
            }
            
            // Door position (dynamic)
            doors.push({
                id: doorId++,
                x: wallX,
                y: doorY,
                w: WALL_THICKNESS,
                h: DOOR_WIDTH,
                orientation: 'vertical',
                isStatic: false
            });
            
            // Wall segment below door
            const belowY = doorY + DOOR_WIDTH;
            if (belowY < y + SECTOR_H) {
                staticWalls.push({
                    x: wallX,
                    y: belowY,
                    w: WALL_THICKNESS,
                    h: y + SECTOR_H - belowY,
                    isStatic: true
                });
            }
        }
    }
    
    // Horizontal walls (between rows) - all have doors
    for (let row = 1; row < SECTOR_ROWS; row++) {
        const y = row * SECTOR_H - WALL_THICKNESS / 2;
        
        for (let col = 0; col < SECTOR_COLS; col++) {
            const x = col * SECTOR_W;
            const doorX = x + SECTOR_W / 2 - DOOR_WIDTH / 2;
            
            // Wall segment left of door
            if (doorX > x) {
                staticWalls.push({
                    x: x,
                    y: y,
                    w: doorX - x,
                    h: WALL_THICKNESS,
                    isStatic: true
                });
            }
            
            // Door position (dynamic)
            doors.push({
                id: doorId++,
                x: doorX,
                y: y,
                w: DOOR_WIDTH,
                h: WALL_THICKNESS,
                orientation: 'horizontal',
                isStatic: false
            });
            
            // Wall segment right of door
            const rightX = doorX + DOOR_WIDTH;
            if (rightX < x + SECTOR_W) {
                staticWalls.push({
                    x: rightX,
                    y: y,
                    w: x + SECTOR_W - rightX,
                    h: WALL_THICKNESS,
                    isStatic: true
                });
            }
        }
    }
    
    return { staticWalls, doors };
}

const wallData = generateWalls();
export const WALLS = wallData.staticWalls;
export const DOORS = wallData.doors;
export const doorManager = new DoorManager();

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