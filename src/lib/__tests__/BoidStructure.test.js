import { describe, it, expect } from 'vitest';
import { Boid } from '../Boid';

describe('Boid Class Structure', () => {
    describe('Instance Structure', () => {
        it('should have all required properties', () => {
            const boid = new Boid(100, 200, 1, 2, 0, ['#FF0000']);
            
            // Core properties
            expect(boid).toHaveProperty('position');
            expect(boid).toHaveProperty('velocity');
            expect(boid).toHaveProperty('maxSpeed');
            expect(boid).toHaveProperty('maxForce');
            expect(boid).toHaveProperty('groupIndex');
            expect(boid).toHaveProperty('color');
            expect(boid).toHaveProperty('trail');
            expect(boid).toHaveProperty('maxTrailLength');
            
            // Powerup-related properties
            expect(boid).toHaveProperty('speedMultiplier');
            expect(boid).toHaveProperty('sizeMultiplier');
            expect(boid).toHaveProperty('strengthMultiplier');
            expect(boid).toHaveProperty('timeFrozen');
        });
    });

    describe('Method Presence', () => {
        it('should have all required behavioral methods', () => {
            const boid = new Boid(100, 200, 1, 2, 0, ['#FF0000']);
            
            // Core behavior methods
            expect(boid.update).toBeTypeOf('function');
            expect(boid.separate).toBeTypeOf('function');
            expect(boid.align).toBeTypeOf('function');
            expect(boid.cohesion).toBeTypeOf('function');
            expect(boid.groupRepulsion).toBeTypeOf('function');
            expect(boid.mouseRepulsion).toBeTypeOf('function');
            
            // Group dynamics methods
            expect(boid.considerGroupSwitch).toBeTypeOf('function');
            
            // Powerup methods
            expect(boid.checkPowerupCollision).toBeTypeOf('function');
            expect(boid.applyPowerupEffects).toBeTypeOf('function');
            expect(boid.calculateRegroupForce).toBeTypeOf('function');
        });
    });

    describe('Vector Operations', () => {
        it('should maintain valid vector structures', () => {
            const boid = new Boid(100, 200, 1, 2, 0, ['#FF0000']);
            
            // Check position vector
            expect(boid.position.x).toBeTypeOf('number');
            expect(boid.position.y).toBeTypeOf('number');
            
            // Check velocity vector
            expect(boid.velocity.x).toBeTypeOf('number');
            expect(boid.velocity.y).toBeTypeOf('number');
        });

        it('should have valid force outputs', () => {
            const boid = new Boid(100, 200, 1, 2, 0, ['#FF0000']);
            const otherBoids = [new Boid(110, 210, 1, 2, 0, ['#FF0000'])];
            
            // Test all force calculations return valid vectors
            const separation = boid.separate(otherBoids, 25);
            expect(separation).toHaveProperty('x');
            expect(separation).toHaveProperty('y');
            
            const alignment = boid.align(otherBoids, 50);
            expect(alignment).toHaveProperty('x');
            expect(alignment).toHaveProperty('y');
            
            const cohesion = boid.cohesion(otherBoids, 50);
            expect(cohesion).toHaveProperty('x');
            expect(cohesion).toHaveProperty('y');
            
            const repulsion = boid.groupRepulsion(otherBoids, 50);
            expect(repulsion).toHaveProperty('x');
            expect(repulsion).toHaveProperty('y');
        });
    });

    describe('Trail Management', () => {
        it('should maintain trail array structure', () => {
            const boid = new Boid(100, 200, 1, 2, 0, ['#FF0000']);
            expect(Array.isArray(boid.trail)).toBe(true);
            
            // Verify trail points structure after movement
            boid.update(800, 600, [], 
                { separation: 1, alignment: 1, cohesion: 1, groupRepulsion: 1 },
                { min: 2, max: 4 },
                { separationRadius: 25, neighborRadius: 50, trailLength: 5 },
                { peerRadius: 50, peerPressure: 0.1, loyaltyFactor: 0.5 },
                { active: false, position: { x: 0, y: 0 }, repulsionRadius: 100 }
            );
            
            if (boid.trail.length > 0) {
                expect(boid.trail[0]).toHaveProperty('x');
                expect(boid.trail[0]).toHaveProperty('y');
            }
        });
    });
});