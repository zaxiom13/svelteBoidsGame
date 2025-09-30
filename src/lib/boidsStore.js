import { writable, get } from 'svelte/store';
import { Boid } from './Boid.js';
import { gameState } from './gameStore';
import { BOID_COLORS, TEAM, ARENA_W, ARENA_H, WALLS } from './constants';
import { Quadtree } from './Quadtree.js';

export { BOID_COLORS };  // Re-export for backward compatibility

// Doctrine settings - can be adjusted in pause screen
export const doctrine = writable({
    cohesion: 0.6,    // 0-1 scale
    separation: 0.6,  // 0-1 scale
    bravery: 0.5      // 0-1 scale (affects defection resistance)
});

export const weights = writable({
    separation: 2.0,
    alignment: 1.5,
    cohesion: 1.2,
    groupRepulsion: 0.3,
    mouseRepulsion: 1.5
});

export const speeds = writable({
    min: 2,
    max: 4
});

export const numBoids = writable(240); // 120 per team
export const numGroups = writable(2); // Always 2 teams now

export const visualSettings = writable({
    boidSize: 10,
    trailLength: 20,
    trailWidth: 2,
    trailOpacity: 0.25,
    neighborRadius: 30, // Maximized neighbor radius for more influence
    separationRadius: 25
});

export const groupSettings = writable({
    peerPressure: 0.1, // Maximized peer pressure
    peerRadius: 50, // Maximized peer radius for more influence
    loyaltyFactor: 0 // Set to zero as requested
});

export const uiState = writable({
    statsVisible: true,
    controlsVisible: true
});

export const canvasSettings = writable({
    height: 600
});

export const mouseSettings = writable({
    repulsionRadius: 100,
    position: { x: 0, y: 0 },
    active: true
});

// Helper to check if position is inside any wall
function isInsideWall(x, y) {
    return WALLS.some(wall =>
        x >= wall.x && x <= wall.x + wall.w &&
        y >= wall.y && y <= wall.y + wall.h
    );
}

// Helper to find empty spawn position
function findEmptySpot(arenaW, arenaH, attempts = 50) {
    for (let i = 0; i < attempts; i++) {
        const x = Math.random() * (arenaW - 40) + 20;
        const y = Math.random() * (arenaH - 40) + 20;
        if (!isInsideWall(x, y)) {
            return { x, y };
        }
    }
    // Fallback: return a safe position
    return { x: arenaW / 4, y: arenaH / 4 };
}

function createBoids(numBoids, canvasWidth, canvasHeight, groupCount) {
    const boids = [];
    const boidsPerTeam = Math.floor(numBoids / 2);
    
    for (let i = 0; i < numBoids; i++) {
        const groupIndex = i < boidsPerTeam ? TEAM.PLAYER : TEAM.AI;
        
        // Spawn in different sides: Player on left, AI on right
        let pos;
        if (groupIndex === TEAM.PLAYER) {
            // Spawn player boids in left half
            pos = findEmptySpot(ARENA_W / 2, ARENA_H);
        } else {
            // Spawn AI boids in right half
            const rightPos = findEmptySpot(ARENA_W / 2, ARENA_H);
            pos = { x: rightPos.x + ARENA_W / 2, y: rightPos.y };
        }
        
        const speed = 2 + Math.random() * 2;
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        boids.push(new Boid(pos.x, pos.y, vx, vy, groupIndex, BOID_COLORS));
    }
    return boids;
}

function createBoidsAndQuadtree(numBoids, canvasWidth, canvasHeight, groupCount) {
    const boids = createBoids(numBoids, canvasWidth, canvasHeight, groupCount);
    // Use full arena dimensions for quadtree
    const quadtree = new Quadtree({ x: 0, y: 0, width: ARENA_W, height: ARENA_H }, 32);
    
    // Force a full rebuild of the quadtree
    quadtree.clear();
    for (const boid of boids) {
        const inserted = quadtree.insert(boid);
    }
    
    return { boids, quadtree };
}

export const boids = writable(createBoidsAndQuadtree(get(numBoids), ARENA_W, ARENA_H, get(numGroups)));

export function resetBoids(count, canvasWidth, canvasHeight, groupCount) {
    // Only reset game state when manually resetting boids during a running game
    const currentGameState = get(gameState);
    if (currentGameState.status === 'running' || currentGameState.status === 'countdown') {
        gameState.set({
            status: 'start',
            playerPick: null,
            winner: null,
            startTime: null,
            endTime: null,
            countdown: 3,
            isEliminated: false,
            finalWinner: null,
            showEliminationScreen: false
        });
    }

    // Validate dimensions
    // if (!canvasWidth || !canvasHeight) {
    //     console.warn('Invalid canvas dimensions, using defaults');
    //     canvasWidth = window.innerWidth * 0.8;
    //     canvasHeight = window.innerHeight * 0.8;
    // }

    const boidsData = createBoidsAndQuadtree(count, canvasWidth, canvasHeight, groupCount);
    boids.set(boidsData);
}

export function shuffleBoidGroups() {
    boids.update(current => {
        const shuffledBoids = [...current.boids];
        const groupCount = get(numGroups);

        // Randomly reassign group for each boid
        shuffledBoids.forEach(boid => {
            boid.groupIndex = Math.floor(Math.random() * groupCount);
            boid.color = BOID_COLORS[boid.groupIndex];
            boid.trail = []; // Clear trail for smoother transition
        });

        current.quadtree.update(shuffledBoids);
        return { boids: shuffledBoids, quadtree: current.quadtree };
    });
}

export function randomizeConfiguration() {
    weights.update(() => ({
        separation: Math.random() * 3,
        alignment: Math.random() * 3,
        cohesion: Math.random() * 3,
        groupRepulsion: Math.random() * 3,
        mouseRepulsion: Math.random() * 3
    }));

    speeds.update(() => ({
        min: 1 + Math.random() * 3,
        max: 4 + Math.random() * 4
    }));

    numBoids.set(20 + Math.floor(Math.random() * 180));
    numGroups.set(2 + Math.floor(Math.random() * 7));

    visualSettings.update(() => ({
        boidSize: 5 + Math.random() * 15,
        trailLength: Math.floor(Math.random() * 50),
        trailWidth: 1 + Math.random() * 4,
        trailOpacity: Math.random(),
        neighborRadius: 30 + Math.random() * 70,
        separationRadius: 15 + Math.random() * 35
    }));

    groupSettings.update(() => ({
        peerPressure: Math.random() * 0.01,
        peerRadius: 20 + Math.random() * 80,
        loyaltyFactor: Math.random()
    }));
    
    resetBoids(get(numBoids), 800, 600, get(numGroups));
}
