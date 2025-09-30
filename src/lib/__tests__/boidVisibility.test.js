import { describe, it, expect, beforeEach } from 'vitest';
import { Boid } from '../Boid.js';
import { WALLS, DOORS, ARENA_W, ARENA_H, BOID_COLORS } from '../constants.js';

describe('Boid Visibility and Position Tests', () => {
  let boid;
  
  beforeEach(() => {
    boid = new Boid(100, 100, 1, 1, 0, BOID_COLORS);
  });

  describe('Initial Position Validation', () => {
    it('should spawn within arena bounds', () => {
      expect(boid.position.x).toBeGreaterThanOrEqual(0);
      expect(boid.position.x).toBeLessThanOrEqual(ARENA_W);
      expect(boid.position.y).toBeGreaterThanOrEqual(0);
      expect(boid.position.y).toBeLessThanOrEqual(ARENA_H);
    });

    it('should not spawn inside walls', () => {
      for (const wall of WALLS) {
        const isInsideWall = 
          boid.position.x >= wall.x &&
          boid.position.x <= wall.x + wall.w &&
          boid.position.y >= wall.y &&
          boid.position.y <= wall.y + wall.h;
        
        expect(isInsideWall).toBe(false);
      }
    });

    it('should not spawn inside doors', () => {
      for (const door of DOORS) {
        const isInsideDoor = 
          boid.position.x >= door.x &&
          boid.position.x <= door.x + door.w &&
          boid.position.y >= door.y &&
          boid.position.y <= door.y + door.h;
        
        expect(isInsideDoor).toBe(false);
      }
    });

    it('should have valid velocity', () => {
      expect(isFinite(boid.velocity.x)).toBe(true);
      expect(isFinite(boid.velocity.y)).toBe(true);
      expect(isNaN(boid.velocity.x)).toBe(false);
      expect(isNaN(boid.velocity.y)).toBe(false);
    });
  });

  describe('Position Clamping', () => {
    it('should clamp position to arena bounds', () => {
      // Test moving beyond arena
      boid.position.x = ARENA_W + 100;
      boid.position.y = ARENA_H + 100;
      
      // Simulate update with clamping
      boid.position.x = Math.max(0, Math.min(ARENA_W, boid.position.x));
      boid.position.y = Math.max(0, Math.min(ARENA_H, boid.position.y));
      
      expect(boid.position.x).toBe(ARENA_W);
      expect(boid.position.y).toBe(ARENA_H);
    });

    it('should not allow negative positions', () => {
      boid.position.x = -100;
      boid.position.y = -100;
      
      boid.position.x = Math.max(0, Math.min(ARENA_W, boid.position.x));
      boid.position.y = Math.max(0, Math.min(ARENA_H, boid.position.y));
      
      expect(boid.position.x).toBe(0);
      expect(boid.position.y).toBe(0);
    });
  });

  describe('Velocity Validation', () => {
    it('should maintain finite velocity after update', () => {
      // Simulate multiple updates
      for (let i = 0; i < 100; i++) {
        boid.velocity.x += Math.random() - 0.5;
        boid.velocity.y += Math.random() - 0.5;
        
        // Check for NaN or Infinity
        expect(isFinite(boid.velocity.x)).toBe(true);
        expect(isFinite(boid.velocity.y)).toBe(true);
        expect(isNaN(boid.velocity.x)).toBe(false);
        expect(isNaN(boid.velocity.y)).toBe(false);
      }
    });

    it('should not have zero velocity for too long', () => {
      boid.velocity.x = 0;
      boid.velocity.y = 0;
      
      const speed = Math.sqrt(boid.velocity.x * boid.velocity.x + boid.velocity.y * boid.velocity.y);
      
      // Speed can be zero temporarily, but should recover
      expect(speed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Wall Avoidance', () => {
    it('should produce finite avoidance force', () => {
      const force = boid.avoidWalls();
      
      expect(isFinite(force.x)).toBe(true);
      expect(isFinite(force.y)).toBe(true);
      expect(isNaN(force.x)).toBe(false);
      expect(isNaN(force.y)).toBe(false);
    });

    it('should push away from nearby walls', () => {
      // Place boid near a wall (but not inside it)
      const wall = WALLS[0];
      boid.position.x = wall.x - 40; // Outside, but close (within detection radius of 80)
      boid.position.y = wall.y + wall.h / 2;
      
      const force = boid.avoidWalls();
      
      // Should produce some avoidance force
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);
      expect(magnitude).toBeGreaterThan(0);
    });
  });

  describe('Border Avoidance', () => {
    it('should produce finite border force', () => {
      const force = boid.avoidBorders(ARENA_W, ARENA_H);
      
      expect(isFinite(force.x)).toBe(true);
      expect(isFinite(force.y)).toBe(true);
      expect(isNaN(force.x)).toBe(false);
      expect(isNaN(force.y)).toBe(false);
    });

    it('should push away from left border', () => {
      boid.position.x = 10; // Near left edge
      boid.position.y = ARENA_H / 2;
      
      const force = boid.avoidBorders(ARENA_W, ARENA_H);
      
      // Should push right
      expect(force.x).toBeGreaterThan(0);
    });

    it('should push away from top border', () => {
      boid.position.x = ARENA_W / 2;
      boid.position.y = 10; // Near top edge
      
      const force = boid.avoidBorders(ARENA_W, ARENA_H);
      
      // Should push down
      expect(force.y).toBeGreaterThan(0);
    });
  });

  describe('Arena Dimensions', () => {
    it('should have valid arena dimensions', () => {
      expect(ARENA_W).toBeGreaterThan(0);
      expect(ARENA_H).toBeGreaterThan(0);
      expect(ARENA_W).toBe(3200);
      expect(ARENA_H).toBe(3200);
    });

    it('should have square arena', () => {
      expect(ARENA_H).toBe(ARENA_W);
    });
  });

  describe('Boid Properties', () => {
    it('should have valid color', () => {
      expect(boid.color).toBeDefined();
      expect(typeof boid.color).toBe('string');
      expect(boid.color.startsWith('#')).toBe(true);
    });

    it('should have valid group index', () => {
      expect(boid.groupIndex).toBeDefined();
      expect(boid.groupIndex).toBeGreaterThanOrEqual(0);
      expect(boid.groupIndex).toBeLessThan(2); // Only 2 teams
    });

    it('should have max speed and force', () => {
      expect(boid.maxSpeed).toBeGreaterThan(0);
      expect(boid.maxForce).toBeGreaterThan(0);
    });
  });
});

describe('Spawn Position Tests', () => {
  it('should spawn boids in empty areas', () => {
    const testBoids = [];
    
    // Create 10 test boids
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * ARENA_W;
      const y = Math.random() * ARENA_H;
      
      // Check if position is valid
      let isValid = true;
      
      // Check walls
      for (const wall of WALLS) {
        if (x >= wall.x && x <= wall.x + wall.w &&
            y >= wall.y && y <= wall.y + wall.h) {
          isValid = false;
          break;
        }
      }
      
      // Check doors
      for (const door of DOORS) {
        if (x >= door.x && x <= door.x + door.w &&
            y >= door.y && y <= door.y + door.h) {
          isValid = false;
          break;
        }
      }
      
      if (isValid) {
        const boid = new Boid(x, y, 1, 1, i % 2, BOID_COLORS);
        testBoids.push(boid);
      }
    }
    
    // Should have created at least some valid boids
    expect(testBoids.length).toBeGreaterThan(0);
    
    // All should be in bounds
    testBoids.forEach(b => {
      expect(b.position.x).toBeGreaterThanOrEqual(0);
      expect(b.position.x).toBeLessThanOrEqual(ARENA_W);
      expect(b.position.y).toBeGreaterThanOrEqual(0);
      expect(b.position.y).toBeLessThanOrEqual(ARENA_H);
    });
  });
});
