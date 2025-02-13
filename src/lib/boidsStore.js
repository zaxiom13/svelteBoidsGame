import { writable, get } from 'svelte/store';
import { Boid } from './Boid.js';
import { gameState } from './gameStore';
import { BOID_COLORS } from './constants';
import { Quadtree } from './Quadtree.js';

export { BOID_COLORS };  // Re-export for backward compatibility

export const weights = writable({
    separation: 2.0,    // Increased from 1.5
    alignment: 1.5,     // Increased from 1.0
    cohesion: 1.2,      // Increased from 1.0
    groupRepulsion: 1.5, // Increased from 1.0
    mouseRepulsion: 1.0
});

export const speeds = writable({
    min: 2,
    max: 4
});

export const numBoids = writable(50);
export const numGroups = writable(4);

export const visualSettings = writable({
    boidSize: 10,
    trailLength: 20,
    trailWidth: 2,
    trailOpacity: 0.25,
    neighborRadius: 50,
    separationRadius: 25
});

export const groupSettings = writable({
    peerPressure: 0.001,
    peerRadius: 40,
    loyaltyFactor: 0.5
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

function createBoids(numBoids, canvasWidth, canvasHeight, groupCount) {
    const boids = [];
    for (let i = 0; i < numBoids; i++) {
        const x = Math.random() * canvasWidth;
        const y = Math.random() * canvasHeight;
        // Increase initial velocity range to be between min and max speed
        const speed = 2 + Math.random() * 2; // Random speed between 2 and 4
        const angle = Math.random() * Math.PI * 2; // Random angle in radians
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const groupIndex = i % groupCount;
        boids.push(new Boid(x, y, vx, vy, groupIndex, BOID_COLORS));
    }
    return boids;
}

function createBoidsAndQuadtree(numBoids, canvasWidth, canvasHeight, groupCount) {
    const boids = createBoids(numBoids, canvasWidth, canvasHeight, groupCount);
    const quadtree = new Quadtree({ x: 0, y: 0, width: canvasWidth, height: canvasHeight }, 32);
    
    // Force a full rebuild of the quadtree
    quadtree.clear();
    for (const boid of boids) {
        const inserted = quadtree.insert(boid);
    }
    
    return { boids, quadtree };
}

export const boids = writable(createBoidsAndQuadtree(get(numBoids), 800, 600, get(numGroups)));

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
             finalWinner: null
         });
     }
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
