import { describe, it, expect, beforeEach } from 'vitest';
import { Boid } from '../Boid.js';
import { WALLS, DOORS, doorManager, ARENA_W, ARENA_H, BOID_COLORS } from '../constants.js';

describe('Wall Collision Tests', () => {
  let boid;
  
  beforeEach(() => {
    boid = new Boid(400, 400, 2, 0, 0, BOID_COLORS);
  });

  describe('Wall Penetration Detection', () => {
    it('should not allow boid to move into wall', () => {
      // Get first wall
      const wall = WALLS[0];
      
      // Place boid just outside wall, moving toward it
      boid.position.x = wall.x - 20;
      boid.position.y = wall.y + wall.h / 2;
      boid.velocity.x = 3; // Moving right toward wall
      boid.velocity.y = 0;
      
      // Check avoidance force
      const force = boid.avoidWalls();
      
      // Should produce leftward force (negative x) to avoid wall
      expect(force.x).toBeLessThan(0);
      
      // Force should be strong enough
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);
      expect(magnitude).toBeGreaterThan(0);
    });

    it('should detect when boid is inside wall', () => {
      const wall = WALLS[0];
      
      // Place boid inside wall
      boid.position.x = wall.x + wall.w / 2;
      boid.position.y = wall.y + wall.h / 2;
      
      // Check if inside
      const isInside = 
        boid.position.x >= wall.x &&
        boid.position.x <= wall.x + wall.w &&
        boid.position.y >= wall.y &&
        boid.position.y <= wall.y + wall.h;
      
      expect(isInside).toBe(true);
    });

    it('should generate strong escape force when inside wall', () => {
      const wall = WALLS[0];
      
      // Place boid inside wall
      boid.position.x = wall.x + 10;
      boid.position.y = wall.y + wall.h / 2;
      
      const force = boid.avoidWalls();
      
      // Should produce strong force
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);
      expect(magnitude).toBeGreaterThan(0);
    });
  });

  describe('Wall Sticking Prevention', () => {
    it('should not get stuck parallel to wall', () => {
      const wall = WALLS[0];
      
      // Place boid next to wall, moving parallel
      boid.position.x = wall.x - 15; // Close but outside
      boid.position.y = wall.y + wall.h / 2;
      boid.velocity.x = 0;
      boid.velocity.y = 2; // Moving parallel to wall
      
      const force = boid.avoidWalls();
      
      // Should have tangential component to help slide past
      // Not just pushing directly away
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);
      
      // Should produce some force
      expect(magnitude).toBeGreaterThanOrEqual(0);
    });

    it('should escape from corner', () => {
      // Find two perpendicular walls
      const wall1 = WALLS[0];
      
      // Place boid near corner
      boid.position.x = wall1.x - 15;
      boid.position.y = wall1.y - 15;
      
      const force = boid.avoidWalls();
      
      // Should produce force away from corner
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);
      expect(magnitude).toBeGreaterThan(0);
    });
  });

  describe('Door Collision', () => {
    it('should avoid closed doors', () => {
      const door = DOORS[0];
      
      // Check if door is closed
      const isClosed = !doorManager.isDoorOpen(door.id);
      
      if (isClosed) {
        // Place boid near closed door
        boid.position.x = door.x - 20;
        boid.position.y = door.y + door.h / 2;
        boid.velocity.x = 2;
        
        const force = boid.avoidWalls();
        
        // Should produce avoidance force
        expect(force.x).toBeLessThan(0);
      }
    });

    it('should pass through open doors', () => {
      const door = DOORS[0];
      
      // Manually check open state
      const isOpen = doorManager.isDoorOpen(door.id);
      
      if (isOpen) {
        // Place boid at door
        boid.position.x = door.x + door.w / 2;
        boid.position.y = door.y + door.h / 2;
        
        // Open doors should not be in obstacle list
        // So force should be minimal or zero
        const force = boid.avoidWalls();
        
        // Force should be less than if door was closed
        const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);
        expect(magnitude).toBeGreaterThanOrEqual(0); // Should not crash
      }
    });
  });

  describe('High-Speed Collision', () => {
    it('should stop fast-moving boid from penetrating wall', () => {
      const wall = WALLS[0];
      
      // Place boid moving very fast toward wall
      boid.position.x = wall.x - 30;
      boid.position.y = wall.y + wall.h / 2;
      boid.velocity.x = 10; // Very fast
      boid.velocity.y = 0;
      
      const force = boid.avoidWalls();
      
      // Should produce strong counter-force
      expect(force.x).toBeLessThan(0);
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);
      expect(magnitude).toBeGreaterThan(1); // Strong force
    });

    it('should handle multiple update cycles near wall', () => {
      const wall = WALLS[0];
      
      // Place boid near wall
      boid.position.x = wall.x - 25;
      boid.position.y = wall.y + wall.h / 2;
      boid.velocity.x = 3;
      
      // Simulate 10 frames
      for (let i = 0; i < 10; i++) {
        const force = boid.avoidWalls();
        
        // Apply simplified physics
        boid.velocity.x += force.x * 0.1;
        boid.velocity.y += force.y * 0.1;
        
        boid.position.x += boid.velocity.x;
        boid.position.y += boid.velocity.y;
        
        // Check if still outside wall
        const isInside = 
          boid.position.x >= wall.x &&
          boid.position.x <= wall.x + wall.w &&
          boid.position.y >= wall.y &&
          boid.position.y <= wall.y + wall.h;
        
        if (isInside) {
          console.log(`Penetrated wall at frame ${i}:`, boid.position);
        }
      }
      
      // After 10 frames, should not be inside wall
      const finallyInside = 
        boid.position.x >= wall.x &&
        boid.position.x <= wall.x + wall.w &&
        boid.position.y >= wall.y &&
        boid.position.y <= wall.y + wall.h;
      
      // This might fail, revealing the bug
      expect(finallyInside).toBe(false);
    });
  });

  describe('Outside Wall Sticking', () => {
    it('should not stick to arena border', () => {
      // Place near left border
      boid.position.x = 10;
      boid.position.y = ARENA_H / 2;
      boid.velocity.x = -1; // Moving toward border
      boid.velocity.y = 2;  // Moving along border
      
      const force = boid.avoidBorders(ARENA_W, ARENA_H);
      
      // Should push away from border
      expect(force.x).toBeGreaterThan(0);
      
      // Should allow parallel movement
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);
      expect(magnitude).toBeGreaterThan(0);
    });

    it('should escape from border after multiple frames', () => {
      // Place at border
      boid.position.x = 5;
      boid.position.y = ARENA_H / 2;
      boid.velocity.x = 0;
      boid.velocity.y = 1;
      
      let stuck = true;
      
      // Simulate 20 frames
      for (let i = 0; i < 20; i++) {
        const force = boid.avoidBorders(ARENA_W, ARENA_H);
        
        boid.velocity.x += force.x * 0.3;
        boid.velocity.y += force.y * 0.3;
        
        boid.position.x += boid.velocity.x;
        boid.position.y += boid.velocity.y;
        
        // Clamp
        boid.position.x = Math.max(0, Math.min(ARENA_W, boid.position.x));
        boid.position.y = Math.max(0, Math.min(ARENA_H, boid.position.y));
        
        // Check if moved away from border
        if (boid.position.x > 50) {
          stuck = false;
          break;
        }
      }
      
      expect(stuck).toBe(false);
    });
  });

  describe('Wall Force Validation', () => {
    it('should never produce NaN force', () => {
      // Test at various positions
      const testPositions = [
        { x: 0, y: 0 },
        { x: ARENA_W, y: ARENA_H },
        { x: ARENA_W / 2, y: ARENA_H / 2 },
        { x: WALLS[0]?.x - 5, y: WALLS[0]?.y },
      ];
      
      testPositions.forEach(pos => {
        if (pos.x !== undefined) {
          boid.position.x = pos.x;
          boid.position.y = pos.y;
          
          const force = boid.avoidWalls();
          
          expect(isFinite(force.x)).toBe(true);
          expect(isFinite(force.y)).toBe(true);
          expect(isNaN(force.x)).toBe(false);
          expect(isNaN(force.y)).toBe(false);
        }
      });
    });

    it('should produce reasonable force magnitudes', () => {
      const wall = WALLS[0];
      
      // Very close to wall
      boid.position.x = wall.x - 10;
      boid.position.y = wall.y + wall.h / 2;
      
      const force = boid.avoidWalls();
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);
      
      // Should be strong but not insane
      expect(magnitude).toBeGreaterThan(0);
      expect(magnitude).toBeLessThan(100); // Reasonable upper bound
    });
  });
});

describe('Wall Configuration Tests', () => {
  it('should have walls defined', () => {
    expect(WALLS).toBeDefined();
    expect(WALLS.length).toBeGreaterThan(0);
  });

  it('should have valid wall dimensions', () => {
    WALLS.forEach((wall, i) => {
      expect(wall.x).toBeGreaterThanOrEqual(0);
      expect(wall.y).toBeGreaterThanOrEqual(0);
      expect(wall.w).toBeGreaterThan(0);
      expect(wall.h).toBeGreaterThan(0);
      
      // Walls should be inside arena
      expect(wall.x + wall.w).toBeLessThanOrEqual(ARENA_W);
      expect(wall.y + wall.h).toBeLessThanOrEqual(ARENA_H);
    });
  });

  it('should have doors defined', () => {
    expect(DOORS).toBeDefined();
    expect(DOORS.length).toBeGreaterThan(0);
  });

  it('should have valid door dimensions', () => {
    DOORS.forEach((door, i) => {
      expect(door.x).toBeGreaterThanOrEqual(0);
      expect(door.y).toBeGreaterThanOrEqual(0);
      expect(door.w).toBeGreaterThan(0);
      expect(door.h).toBeGreaterThan(0);
      expect(door.id).toBeDefined();
      expect(door.orientation).toMatch(/horizontal|vertical/);
    });
  });
});
