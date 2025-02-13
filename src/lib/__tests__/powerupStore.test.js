import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { 
    powerupSettings, 
    activePowerups, 
    activePowerupEffects, 
    isTimeFrozen,
    spawnPowerup,
    removePowerup,
    addPowerupEffect
} from '../powerupStore';

describe('Powerup System', () => {
    beforeEach(() => {
        // Reset all stores to initial state
        activePowerups.set([]);
        activePowerupEffects.set([]);
        isTimeFrozen.set(false);
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize with correct default settings', () => {
        const settings = get(powerupSettings);
        expect(settings).toMatchObject({
            spawnInterval: 2000,
            duration: 5000,
            size: 15
        });
        expect(settings.effects).toHaveLength(4);
    });

    it('should spawn powerup at valid position', () => {
        const canvasWidth = 800;
        const canvasHeight = 600;
        spawnPowerup(canvasWidth, canvasHeight);
        
        const powerups = get(activePowerups);
        expect(powerups).toHaveLength(1);
        
        const powerup = powerups[0];
        expect(powerup.x).toBeGreaterThanOrEqual(20);
        expect(powerup.x).toBeLessThanOrEqual(canvasWidth - 20);
        expect(powerup.y).toBeGreaterThanOrEqual(20);
        expect(powerup.y).toBeLessThanOrEqual(canvasHeight - 20);
    });

    it('should not spawn powerup if effects are active', () => {
        activePowerupEffects.set([{ type: 'speed', groupIndex: 0 }]);
        spawnPowerup(800, 600);
        
        const powerups = get(activePowerups);
        expect(powerups).toHaveLength(0);
    });

    it('should remove powerup after duration', () => {
        spawnPowerup(800, 600);
        expect(get(activePowerups)).toHaveLength(1);
        
        vi.advanceTimersByTime(5000);
        expect(get(activePowerups)).toHaveLength(0);
    });

    it('should properly add powerup effect', () => {
        const effect = {
            type: 'speed',
            multiplier: 2,
            color: '#FF0000'
        };
        
        addPowerupEffect(0, effect);
        
        const effects = get(activePowerupEffects);
        expect(effects).toHaveLength(1);
        expect(effects[0]).toMatchObject({
            type: 'speed',
            groupIndex: 0,
            multiplier: 2
        });
    });

    it('should handle timefreeze effect correctly', () => {
        const effect = {
            type: 'timefreeze',
            multiplier: 0,
            color: '#00FFFF'
        };
        
        addPowerupEffect(0, effect);
        expect(get(isTimeFrozen)).toBe(true);
        
        vi.advanceTimersByTime(5000);
        expect(get(isTimeFrozen)).toBe(false);
    });

    it('should clear powerup effects after duration', () => {
        const effect = {
            type: 'speed',
            multiplier: 2,
            color: '#FF0000'
        };
        
        addPowerupEffect(0, effect);
        expect(get(activePowerupEffects)).toHaveLength(1);
        
        vi.advanceTimersByTime(5000);
        expect(get(activePowerupEffects)).toHaveLength(0);
    });

    it('should remove all powerups when effect is added', () => {
        spawnPowerup(800, 600);
        spawnPowerup(800, 600);
        expect(get(activePowerups)).toHaveLength(2);
        
        addPowerupEffect(0, { type: 'speed', multiplier: 2 });
        expect(get(activePowerups)).toHaveLength(0);
    });

    it('should support multiple simultaneous effects', () => {
        addPowerupEffect(0, { type: 'speed', multiplier: 2 });
        addPowerupEffect(0, { type: 'size', multiplier: 1.5 });
        
        const effects = get(activePowerupEffects);
        expect(effects).toHaveLength(2);
        expect(effects.map(e => e.type)).toEqual(['speed', 'size']);
    });

    it('should include regroup effect properties', () => {
        const effect = {
            type: 'regroup',
            multiplier: 3.0,
            separationMultiplier: 0,
            cohesionMultiplier: 4.0,
            color: '#9932CC'
        };
        
        addPowerupEffect(0, effect);
        
        const effects = get(activePowerupEffects);
        expect(effects[0]).toMatchObject({
            type: 'regroup',
            separationMultiplier: 0,
            cohesionMultiplier: 4.0
        });
    });
});