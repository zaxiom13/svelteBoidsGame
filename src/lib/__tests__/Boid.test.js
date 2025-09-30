import { describe, it, expect, vi } from 'vitest';
import { Boid } from '../Boid.js';

// Mock the boidsStore module
vi.mock('../boidsStore.js', () => ({
    BOID_COLORS: ['#FF0000', '#00FF00', '#0000FF']
}));

describe('Boid', () => {
    const mockColors = ['#FF0000', '#00FF00', '#0000FF'];
    
    it('should initialize with correct properties', () => {
        const boid = new Boid(100, 200, 1, 2, 0, mockColors);
        
        expect(boid.position).toEqual({ x: 100, y: 200 });
        expect(boid.velocity).toEqual({ x: 1, y: 2 });
        expect(boid.groupIndex).toBe(0);
        expect(boid.color).toBe(mockColors[0]);
        expect(boid.trail).toEqual([]);
        expect(boid.speedMultiplier).toBe(1);
        expect(boid.sizeMultiplier).toBe(1);
        expect(boid.strengthMultiplier).toBe(1);
        expect(boid.timeFrozen).toBe(false);
    });

    // New test for Boid Initialization with Edge Values
    it('should initialize with edge values correctly', () => {
        const boid = new Boid(Number.MAX_VALUE, Number.MIN_VALUE, Number.MAX_VALUE, Number.MIN_VALUE, 0, mockColors);
        
        expect(boid.position).toEqual({ x: Number.MAX_VALUE, y: Number.MIN_VALUE });
        expect(boid.velocity).toEqual({ x: Number.MAX_VALUE, y: Number.MIN_VALUE });
        expect(boid.groupIndex).toBe(0);
        expect(boid.color).toBe(mockColors[0]);
    });

    // New test for Boid Interaction with Multiple Powerups
    it('should handle multiple simultaneous powerup effects', () => {
        const boid = new Boid(100, 100, 1, 1, 0, mockColors);
        const effects = [
            { type: 'speed', groupIndex: 0, multiplier: 2 },
            { type: 'size', groupIndex: 0, multiplier: 1.5 },
            { type: 'strength', groupIndex: 0, multiplier: 1.2 }
        ];
        
        boid.applyPowerupEffects(effects);
        
        expect(boid.speedMultiplier).toBe(2);
        expect(boid.sizeMultiplier).toBe(1.5);
        expect(boid.strengthMultiplier).toBe(1.2);
    });

    // New test for Boid Group Switching with High Loyalty
    it('should not switch groups easily with high loyalty', () => {
        const boid = new Boid(100, 100, 0, 0, 0, mockColors);
        const quadtree = { query: vi.fn(() => []) }; // Mock quadtree
        const otherBoids = [
            new Boid(110, 110, 0, 0, 1, mockColors),
            new Boid(115, 115, 0, 0, 1, mockColors),
            new Boid(120, 120, 0, 0, 1, mockColors)
        ];
        const boidsData = { boids: otherBoids, quadtree };
        const groupSettings = {
            peerRadius: 50,
            peerPressure: 0.001, // Low peer pressure
            loyaltyFactor: 1 // High loyalty
        };

        boid.considerGroupSwitch(quadtree, groupSettings, 50);

        expect(boid.groupIndex).toBe(0); // Should not switch groups
    });

    // New test for Boid Behavior with Extreme Speed Multipliers
    it('should handle extreme speed multipliers', () => {
        const boid = new Boid(100, 100, 1, 1, 0, mockColors);
        const effects = [
            { type: 'speed', groupIndex: 0, multiplier: 10 }, // Very high speed multiplier
            { type: 'speed', groupIndex: 0, multiplier: 0.1 } // Very low speed multiplier
        ];

        boid.applyPowerupEffects(effects);

        expect(boid.speedMultiplier).toBe(0.1); // Last applied multiplier should take effect
    });

    // New test for Boid Trail Length
    it('should maintain trail length within the limit', () => {
        const boid = new Boid(100, 100, 1, 1, 0, mockColors);
        const quadtree = { query: vi.fn(() => []) }; // Mock quadtree
        const boidsData = {boids: [], quadtree}
        boid.maxTrailLength = 5; // Set a small trail length for testing

        for (let i = 0; i < 10; i++) {
            boid.update(800, 600, boidsData, { separation: 1, alignment: 1, cohesion: 1, groupRepulsion: 1, mouseRepulsion: 1 }, { min: 2, max: 4 }, { separationRadius: 25, neighborRadius: 50, trailLength: 5 }, { peerRadius: 50, peerPressure: 0.1, loyaltyFactor: 0.5 }, { active: false, position: { x: 0, y: 0 }, repulsionRadius: 100 });
        }

        expect(boid.trail.length).toBeLessThanOrEqual(5);
    });

    it('should detect powerup collision correctly', () => {
        const boid = new Boid(100, 100, 0, 0, 0, mockColors);
        const powerup = { x: 105, y: 105 };
        const powerupSize = 10;

        expect(boid.checkPowerupCollision(powerup, powerupSize, 0)).toBe(true);
        expect(boid.checkPowerupCollision(powerup, powerupSize, 1)).toBe(false);

        const farPowerup = { x: 200, y: 200 };
        expect(boid.checkPowerupCollision(farPowerup, powerupSize, 0)).toBe(false);
    });

    it('should apply powerup effects correctly', () => {
        const boid = new Boid(100, 100, 0, 0, 0, mockColors);
        const effects = [
            { type: 'speed', groupIndex: 0, multiplier: 2 },
            { type: 'size', groupIndex: 0, multiplier: 1.5 },
            { type: 'timefreeze', groupIndex: 1 }
        ];

        boid.applyPowerupEffects(effects);

        expect(boid.speedMultiplier).toBe(2);
        expect(boid.sizeMultiplier).toBe(1.5);
        expect(boid.timeFrozen).toBe(true);
    });

    it('should clamp to arena bounds (no wrapping)', () => {
        const boid = new Boid(0, 0, -1, -1, 0, mockColors);
        const quadtree = { query: vi.fn(() => []) }; // Mock quadtree
        const boidsData = {boids: [], quadtree}
        const canvasWidth = 3200;
        const canvasHeight = 3200;

        boid.update(canvasWidth, canvasHeight, boidsData,
            { separation: 1, alignment: 1, cohesion: 1, groupRepulsion: 1, mouseRepulsion: 1, wallAvoidance: 1, borderAvoidance: 1 },
            { min: 2, max: 4 },
            { separationRadius: 25, neighborRadius: 50, trailLength: 20 },
            { peerRadius: 50, peerPressure: 0.1, loyaltyFactor: 0.5 },
            { active: false, position: { x: 0, y: 0 }, repulsionRadius: 100 }
        );

        // Should be clamped within arena bounds (border avoidance pushes inward)
        expect(boid.position.x).toBeGreaterThanOrEqual(0);
        expect(boid.position.x).toBeLessThanOrEqual(canvasWidth);
        expect(boid.position.y).toBeGreaterThanOrEqual(0);
        expect(boid.position.y).toBeLessThanOrEqual(canvasHeight);
    });

    it('should calculate separation force correctly', () => {
        const boid = new Boid(100, 100, 0, 0, 0, mockColors);
        const quadtree = { query: vi.fn(() => [new Boid(90, 90, 0, 0, 0, mockColors)]) };
        const boidsData = { boids: [boid], quadtree };
        const separation = boid.separate(boidsData.quadtree, 25);

        expect(separation.x).toBeGreaterThan(0); // Should move away from close boid
        expect(separation.y).toBeGreaterThan(0);
        expect(Math.abs(separation.x)).toBeLessThanOrEqual(boid.maxForce);
        expect(Math.abs(separation.y)).toBeLessThanOrEqual(boid.maxForce);
    });

    it('should calculate alignment force correctly', () => {
        const boid = new Boid(100, 100, 0, 0, 0, mockColors);
        const quadtree = { query: vi.fn(() => [new Boid(110, 110, 2, 2, 0, mockColors), new Boid(90, 90, 2, 2, 0, mockColors)]) };
        const boidsData = { boids: [boid], quadtree };

        const alignment = boid.align(boidsData.quadtree, 50);

        expect(alignment.x).toBeGreaterThan(0); // Should align with diagonal movement
        expect(alignment.y).toBeGreaterThan(0);
        expect(Math.abs(alignment.x)).toBeLessThanOrEqual(boid.maxForce);
        expect(Math.abs(alignment.y)).toBeLessThanOrEqual(boid.maxForce);
    });

    it('should calculate cohesion force correctly', () => {
        const boid = new Boid(100, 100, 0, 0, 0, mockColors);
        const quadtree = { query: vi.fn(() => [new Boid(150, 150, 0, 0, 0, mockColors), new Boid(160, 160, 0, 0, 0, mockColors)]) };
        const boidsData = { boids: [boid], quadtree };

        const cohesion = boid.cohesion(boidsData.quadtree, 100);

        expect(cohesion.x).toBeGreaterThan(0); // Should move toward other boids
        expect(cohesion.y).toBeGreaterThan(0);
        expect(Math.abs(cohesion.x)).toBeLessThanOrEqual(boid.maxForce);
        expect(Math.abs(cohesion.y)).toBeLessThanOrEqual(boid.maxForce);
    });

    it('should calculate group repulsion correctly', () => {
        const boid = new Boid(100, 100, 0, 0, 0, mockColors);
        const quadtree = { query: vi.fn(() => [new Boid(110, 110, 0, 0, 1, mockColors), new Boid(200, 200, 0, 0, 1, mockColors)]) };
        const boidsData = { boids: [boid], quadtree };

        const repulsion = boid.groupRepulsion(boidsData.quadtree, 50);

        expect(repulsion.x).toBeLessThan(0); // Should move away from different group
        expect(repulsion.y).toBeLessThan(0);
        expect(Math.abs(repulsion.x)).toBeLessThanOrEqual(boid.maxForce);
        expect(Math.abs(repulsion.y)).toBeLessThanOrEqual(boid.maxForce);
    });

    it('should handle mouse attraction correctly for player team', () => {
        const boid = new Boid(100, 100, 0, 0, 0, mockColors); // Team 0 = PLAYER
        const mouseSettings = {
            active: true,
            position: { x: 90, y: 90 },
            repulsionRadius: 50
        };

        const force = boid.mouseRepulsion(mouseSettings);

        // Player team should be ATTRACTED (negative of repulsion)
        expect(force.x).toBeLessThan(0); // Should move toward mouse
        expect(force.y).toBeLessThan(0);
        expect(Math.abs(force.x)).toBeLessThanOrEqual(boid.maxForce);
        expect(Math.abs(force.y)).toBeLessThanOrEqual(boid.maxForce);
    });

    it('should consider group switching based on nearby boids', () => {
        const boid = new Boid(100, 100, 0, 0, 0, mockColors);
        const quadtree = {
            query: vi.fn(() => [
                new Boid(110, 110, 0, 0, 1, mockColors),
                new Boid(115, 115, 0, 0, 1, mockColors),
                new Boid(120, 120, 0, 0, 1, mockColors)
            ])
        };
        const boidsData = { boids: [boid], quadtree };
        const groupSettings = {
            peerRadius: 50,
            peerPressure: 1, // Set high to force switch
            loyaltyFactor: 0 // Set to 0 to ensure switching
        };

        boid.considerGroupSwitch(boidsData.quadtree, groupSettings, 50);

        expect(boid.groupIndex).toBe(1); // Should switch to dominant group
        expect(boid.color).toBe(mockColors[1]);
    });

    it('should handle powerup effects on group dynamics', () => {
        const boid = new Boid(100, 100, 0, 0, 0, mockColors);
        const effects = [
            { 
                type: 'regroup',
                groupIndex: 0,
                multiplier: 3.0,
                centerX: 150,
                centerY: 150
            }
        ];

        boid.applyPowerupEffects(effects);

        // Velocity should change toward center point
        expect(boid.velocity.x).toBeGreaterThan(0);
        expect(boid.velocity.y).toBeGreaterThan(0);
    });

    it('should maintain minimum speed within tolerance', () => {
        const boid = new Boid(100, 100, 0.1, 0.1, 0, mockColors);
        const quadtree = { query: vi.fn(() => []) }; // Mock quadtree
        const boidsData = {boids: [], quadtree}
        const minSpeed = 2;
        const maxSpeed = 4;
        const tolerance = 0.0001;

        boid.update(800, 600, boidsData,
            { separation: 1, alignment: 1, cohesion: 1, groupRepulsion: 1, mouseRepulsion: 1 },
            { min: minSpeed, max: maxSpeed },
            { separationRadius: 25, neighborRadius: 50, trailLength: 20 },
            { peerRadius: 50, peerPressure: 0.1, loyaltyFactor: 0.5 },
            { active: false, position: { x: 0, y: 0 }, repulsionRadius: 100 }
        );

        const speed = Math.sqrt(boid.velocity.x * boid.velocity.x + boid.velocity.y * boid.velocity.y);
        expect(speed).toBeGreaterThanOrEqual(minSpeed - tolerance);
    });

    it('should not switch groups when frozen', () => {
        const boid = new Boid(100, 100, 0, 0, 0, mockColors);
        const quadtree = { query: vi.fn(() => []) }; // Mock quadtree
        const otherBoids = [
            new Boid(110, 110, 0, 0, 1, mockColors),
            new Boid(115, 115, 0, 0, 1, mockColors),
            new Boid(120, 120, 0, 0, 1, mockColors)
        ];
        const boidsData = { boids: otherBoids, quadtree };

        // Apply timefreeze effect
        boid.applyPowerupEffects([
            { type: 'timefreeze', groupIndex: 1 }
        ]);

        // Try to switch groups
        boid.considerGroupSwitch(boidsData.quadtree, {
            peerRadius: 50,
            peerPressure: 1,
            loyaltyFactor: 0
        }, 50);

        // Position and group should remain unchanged
        expect(boid.position).toEqual({ x: 100, y: 100 });
        expect(boid.groupIndex).toBe(0);
    });

    it('should combine multiple powerup effects', () => {
        const boid = new Boid(100, 100, 1, 1, 0, mockColors);
        const effects = [
            { type: 'speed', groupIndex: 0, multiplier: 2 },
            { type: 'size', groupIndex: 0, multiplier: 1.5 },
            { type: 'strength', groupIndex: 0, multiplier: 1.2 }
        ];

        boid.applyPowerupEffects(effects);

        expect(boid.speedMultiplier).toBe(2);
        expect(boid.sizeMultiplier).toBe(1.5);
        expect(boid.strengthMultiplier).toBe(1.2);
    });

    it('should handle empty boids array gracefully', () => {
        const boid = new Boid(100, 100, 1, 1, 0, mockColors);
        const quadtree = { query: vi.fn(() => []) }; // Mock quadtree
        const boidsData = {boids: [], quadtree};

        const separation = boid.separate(boidsData.quadtree, 25);
        const alignment = boid.align(boidsData.quadtree, 50);
        const cohesion = boid.cohesion(boidsData.quadtree, 100);
        const repulsion = boid.groupRepulsion(boidsData.quadtree, 50);

        // Should return zero vectors when no other boids are present
        expect(separation).toEqual({ x: 0, y: 0 });
        expect(alignment).toEqual({ x: 0, y: 0 });
        expect(cohesion).toEqual({ x: 0, y: 0 });
        expect(repulsion).toEqual({ x: 0, y: 0 });
    });

    it('should respect maximum force limits', () => {
        const boid = new Boid(100, 100, 0, 0, 0, mockColors);
        const quadtree = { query: vi.fn(() => [new Boid(101, 101, 10, 10, 0, mockColors)]) };
        const boidsData = { boids: [boid], quadtree };

        const alignment = boid.align(boidsData.quadtree, 50);

        expect(Math.abs(alignment.x)).toBeLessThanOrEqual(boid.maxForce);
        expect(Math.abs(alignment.y)).toBeLessThanOrEqual(boid.maxForce);
    });
});
