import { Quadtree } from '../Quadtree';
import { Boid } from '../Boid';
import { describe, it, expect } from 'vitest';

describe('Quadtree', () => {
    it('should insert and query boids', () => {
        const bounds = { x: 0, y: 0, width: 100, height: 100 };
        const quadtree = new Quadtree(bounds, 4);
        const boid1 = new Boid(10, 10, 0, 0, 0, ['#fff']);
        const boid2 = new Boid(90, 90, 0, 0, 0, ['#fff']);
        const boid3 = new Boid(15, 15, 0, 0, 0, ['#fff']);

        quadtree.insert(boid1);
        quadtree.insert(boid2);
        quadtree.insert(boid3);

        const range = { x: 0, y: 0, width: 20, height: 20 };
        const foundBoids = quadtree.query(range);

        expect(foundBoids).toContain(boid1);
        expect(foundBoids).not.toContain(boid2);
        expect(foundBoids).toContain(boid3);
    });

    it('should subdivide when capacity is exceeded', () => {
        const bounds = { x: 0, y: 0, width: 100, height: 100 };
        const quadtree = new Quadtree(bounds, 2);
        const boid1 = new Boid(10, 10, 0, 0, 0, ['#fff']);
        const boid2 = new Boid(90, 90, 0, 0, 0, ['#fff']);
        const boid3 = new Boid(15, 15, 0, 0, 0, ['#fff']);

        quadtree.insert(boid1);
        quadtree.insert(boid2);
        expect(quadtree.divided).toBe(false);
        quadtree.insert(boid3);
        expect(quadtree.divided).toBe(true);
    });
     it('should not insert boids outside of bounds', () => {
        const bounds = { x: 0, y: 0, width: 100, height: 100 };
        const quadtree = new Quadtree(bounds, 4);
        const boid1 = new Boid(-10, -10, 0, 0, 0, ['#fff']);
        const boid2 = new Boid(110, 110, 0, 0, 0, ['#fff']);

        expect(quadtree.insert(boid1)).toBe(false);
        expect(quadtree.insert(boid2)).toBe(false);
    });

    it('should perform comparably or better than naive approach for range queries', () => {
        const bounds = { x: 0, y: 0, width: 1000, height: 1000 };
        const quadtree = new Quadtree(bounds, 4);
        const boids = [];
        
        // Create 1000 random boids
        for (let i = 0; i < 1000; i++) {
            boids.push(new Boid(
                Math.random() * bounds.width,
                Math.random() * bounds.height,
                0, 0, 0, ['#fff']
            ));
        }

        // Measure quadtree performance
        const startQuadtree = performance.now();
        quadtree.update(boids);
        for (const boid of boids) {
            const range = { 
                x: boid.position.x - 50, 
                y: boid.position.y - 50, 
                width: 100, 
                height: 100 
            };
            quadtree.query(range);
        }
        const endQuadtree = performance.now();
        const quadtreeTime = endQuadtree - startQuadtree;

        // Measure naive approach performance
        const startNaive = performance.now();
        for (const boid of boids) {
            const range = { 
                x: boid.position.x - 50, 
                y: boid.position.y - 50, 
                width: 100, 
                height: 100 
            };
            boids.filter(other => 
                other.position.x >= range.x && 
                other.position.x < range.x + range.width &&
                other.position.y >= range.y && 
                other.position.y < range.y + range.height
            );
        }
        const endNaive = performance.now();
        const naiveTime = endNaive - startNaive;

        console.log(`Quadtree time: ${quadtreeTime}ms`);
        console.log(`Naive time: ${naiveTime}ms`);
        
        // In small synthetic cases, quadtree can be within the same order of magnitude.
        // Ensure it's not significantly slower, and ideally faster.
        expect(quadtreeTime).toBeLessThanOrEqual(naiveTime * 1.5);
    });
});
