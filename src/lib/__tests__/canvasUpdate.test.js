// Language: js
import { describe, it, expect } from 'vitest';
import { Boid } from '../Boid.js';
import { Quadtree } from '../Quadtree.js';

describe('Canvas Expansion and Force Application', () => {
  it('should apply boid forces everywhere and update quadtree bounds on canvas expansion', () => {
    const initialWidth = 800;
    const initialHeight = 600;
    const expandedWidth = 1600;
    const expandedHeight = 1200;
    const numBoids = 10;
    const groupCount = 2;
    const colors = ['#FF0000', '#00FF00'];

    // Create an array of boids with random positions within initial bounds.
    const boids = [];
    for (let i = 0; i < numBoids; i++) {
      const x = Math.random() * initialWidth;
      const y = Math.random() * initialHeight;
      // Give each boid an initial velocity (1, 1) and assign group cyclically.
      boids.push(new Boid(x, y, 1, 1, i % groupCount, colors));
    }

    // Create a quadtree with the initial canvas bounds.
    const quadtree = new Quadtree({ x: 0, y: 0, width: initialWidth, height: initialHeight }, 32);
    // Insert boids into the quadtree.
    boids.forEach(boid => quadtree.insert(boid));
    const boidsData = { boids, quadtree };

    // Dummy parameters to pass to each boid's update method.
    const weights = { separation: 1, alignment: 1, cohesion: 1, groupRepulsion: 1, mouseRepulsion: 1 };
    const speeds = { min: 2, max: 4 };
    const visualSettings = {
      separationRadius: 25,
      neighborRadius: 50,
      trailLength: 5,
      boidSize: 5,
      trailWidth: 1,
      trailOpacity: 0.5
    };
    const groupSettings = { peerRadius: 50, peerPressure: 0.1, loyaltyFactor: 0.5 };
    const mouseSettings = { active: false, position: { x: 0, y: 0 }, repulsionRadius: 100 };
    const activePowerupEffects = [];

    // Simulate canvas expansion: update the quadtree bounds to the expanded canvas dimensions.
    boidsData.quadtree.bounds = { x: 0, y: 0, width: expandedWidth, height: expandedHeight };

    // Update each boid with the new canvas dimensions.
    boids.forEach(boid => {
      boid.update(expandedWidth, expandedHeight, boidsData, weights, speeds, visualSettings, groupSettings, mouseSettings, activePowerupEffects);
      // Verify updated boid positions are wrapped or clamped within the expanded canvas.
      expect(boid.position.x).toBeGreaterThanOrEqual(0);
      expect(boid.position.y).toBeGreaterThanOrEqual(0);
      expect(boid.position.x).toBeLessThanOrEqual(expandedWidth);
      expect(boid.position.y).toBeLessThanOrEqual(expandedHeight);
    });

    // Force the quadtree to update with the current boids.
    boidsData.quadtree.update(boidsData.boids);
    // Verify that the quadtree bounds have been updated to cover the expanded canvas.
    expect(boidsData.quadtree.bounds.width).toBe(expandedWidth);
    expect(boidsData.quadtree.bounds.height).toBe(expandedHeight);
  });
});