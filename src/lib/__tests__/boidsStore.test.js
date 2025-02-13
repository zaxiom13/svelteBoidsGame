import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { 
    weights,
    speeds,
    numBoids,
    numGroups,
    BOID_COLORS,
    visualSettings,
    groupSettings,
    uiState,
    canvasSettings,
    mouseSettings,
    boids,
    resetBoids,
    shuffleBoidGroups,
    randomizeConfiguration
} from '../boidsStore';

describe('Boids Store State Presence', () => {
    beforeEach(() => {
        // Reset to initial state
        resetBoids(50, 800, 600, 4);
    });

    describe('Store Existence', () => {
        it('should have all required stores defined', () => {
            expect(weights).toBeDefined();
            expect(speeds).toBeDefined();
            expect(numBoids).toBeDefined();
            expect(numGroups).toBeDefined();
            expect(visualSettings).toBeDefined();
            expect(groupSettings).toBeDefined();
            expect(uiState).toBeDefined();
            expect(canvasSettings).toBeDefined();
            expect(mouseSettings).toBeDefined();
            expect(boids).toBeDefined();
        });

        it('should have all required store functions defined', () => {
            expect(resetBoids).toBeDefined();
            expect(shuffleBoidGroups).toBeDefined();
            expect(randomizeConfiguration).toBeDefined();
    });

});

    describe('Initial State Structure', () => {
        it('should have correct weights structure', () => {
            const weightState = get(weights);
            expect(weightState).toHaveProperty('separation');
            expect(weightState).toHaveProperty('alignment');
            expect(weightState).toHaveProperty('cohesion');
            expect(weightState).toHaveProperty('groupRepulsion');
            expect(weightState).toHaveProperty('mouseRepulsion');
        });

        it('should have correct speeds structure', () => {
            const speedState = get(speeds);
            expect(speedState).toHaveProperty('min');
            expect(speedState).toHaveProperty('max');
            expect(speedState.max).toBeGreaterThan(speedState.min);
        });

        it('should have correct visual settings structure', () => {
            const visuals = get(visualSettings);
            expect(visuals).toHaveProperty('boidSize');
            expect(visuals).toHaveProperty('trailLength');
            expect(visuals).toHaveProperty('trailWidth');
            expect(visuals).toHaveProperty('trailOpacity');
            expect(visuals).toHaveProperty('neighborRadius');
            expect(visuals).toHaveProperty('separationRadius');
        });

        it('should have correct group settings structure', () => {
            const groups = get(groupSettings);
            expect(groups).toHaveProperty('peerPressure');
            expect(groups).toHaveProperty('peerRadius');
            expect(groups).toHaveProperty('loyaltyFactor');
        });

        it('should have correct mouse settings structure', () => {
            const mouse = get(mouseSettings);
            expect(mouse).toHaveProperty('repulsionRadius');
            expect(mouse).toHaveProperty('position');
            expect(mouse.position).toHaveProperty('x');
            expect(mouse.position).toHaveProperty('y');
            expect(mouse).toHaveProperty('active');
        });
    });

    describe('Boids Array State', () => {
        it('should create correct number of boids', () => {
            const boidsArray = get(boids);
            expect(boidsArray.boids.length).toBe(50);
        });

        it('should have boids with correct properties', () => {
            const boidsArray = get(boids);
            const firstBoid = boidsArray.boids[0];

            expect(firstBoid).toHaveProperty('position');
            expect(firstBoid.position).toHaveProperty('x');
            expect(firstBoid.position).toHaveProperty('y');
            
            expect(firstBoid).toHaveProperty('velocity');
            expect(firstBoid.velocity).toHaveProperty('x');
            expect(firstBoid.velocity).toHaveProperty('y');
            
            expect(firstBoid).toHaveProperty('groupIndex');
            expect(firstBoid).toHaveProperty('color');
            expect(firstBoid).toHaveProperty('trail');
            expect(Array.isArray(firstBoid.trail)).toBe(true);
        });

      it('should distribute boids across groups correctly', () => {
            const boidsArray = get(boids);
            const groups = boidsArray.boids.reduce((acc, boid) => {
                acc[boid.groupIndex] = (acc[boid.groupIndex] || 0) + 1;
                return acc;
            }, {});

            const groupCount = Object.keys(groups).length;
            const currentNumGroups = get(numGroups);
            expect(groupCount).toBe(currentNumGroups);
        });
    });

    describe('Color Constants', () => {
        it('should have correct number of colors defined', () => {
            expect(BOID_COLORS).toHaveLength(8);
            BOID_COLORS.forEach(color => {
                expect(color).toMatch(/^#[0-9A-F]{6}$/i);
            });
        });
    });
});
