import { describe, it, expect } from 'vitest';
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

describe('Powerup System Presence', () => {
    describe('Store Existence', () => {
        it('should have all required stores defined', () => {
            expect(powerupSettings).toBeDefined();
            expect(activePowerups).toBeDefined();
            expect(activePowerupEffects).toBeDefined();
            expect(isTimeFrozen).toBeDefined();
        });

        it('should have all required functions defined', () => {
            expect(spawnPowerup).toBeTypeOf('function');
            expect(removePowerup).toBeTypeOf('function');
            expect(addPowerupEffect).toBeTypeOf('function');
        });
    });

    describe('Powerup Settings Structure', () => {
        it('should have correct settings properties', () => {
            const settings = get(powerupSettings);
            expect(settings).toHaveProperty('spawnInterval');
            expect(settings).toHaveProperty('duration');
            expect(settings).toHaveProperty('size');
            expect(settings).toHaveProperty('effects');
        });

        it('should have correctly structured effects', () => {
            const settings = get(powerupSettings);
            expect(Array.isArray(settings.effects)).toBe(true);
            
            settings.effects.forEach(effect => {
                expect(effect).toHaveProperty('type');
                expect(effect).toHaveProperty('color');
                expect(effect).toHaveProperty('multiplier');
            });
        });

        it('should have all required powerup types', () => {
            const settings = get(powerupSettings);
            const types = settings.effects.map(e => e.type);
            
            expect(types).toContain('timefreeze');
            expect(types).toContain('size');
            expect(types).toContain('strength');
            expect(types).toContain('regroup');
        });

        it('should have valid color values for effects', () => {
            const settings = get(powerupSettings);
            settings.effects.forEach(effect => {
                expect(effect.color).toMatch(/^#[0-9A-F]{6}$/i);
            });
        });
    });

    describe('Active Powerups Structure', () => {
        it('should initialize with empty arrays', () => {
            expect(get(activePowerups)).toEqual([]);
            expect(get(activePowerupEffects)).toEqual([]);
        });

        it('should have correct powerup properties when spawned', () => {
            spawnPowerup(800, 600);
            const powerups = get(activePowerups);
            
            if (powerups.length > 0) {
                const powerup = powerups[0];
                expect(powerup).toHaveProperty('x');
                expect(powerup).toHaveProperty('y');
                expect(powerup).toHaveProperty('type');
                expect(powerup).toHaveProperty('color');
                expect(powerup).toHaveProperty('multiplier');
                expect(powerup).toHaveProperty('createdAt');
            }
        });
    });

    describe('Time Freeze State', () => {
        it('should initialize as false', () => {
            expect(get(isTimeFrozen)).toBe(false);
        });
    });

    describe('Effect Application Structure', () => {
        it('should properly structure effect when added', () => {
            const effect = {
                type: 'speed',
                multiplier: 2,
                color: '#FF0000',
                groupIndex: 0
            };
            
            addPowerupEffect(0, effect);
            const effects = get(activePowerupEffects);
            
            if (effects.length > 0) {
                const addedEffect = effects[0];
                expect(addedEffect).toHaveProperty('type');
                expect(addedEffect).toHaveProperty('multiplier');
                expect(addedEffect).toHaveProperty('groupIndex');
                expect(addedEffect).toHaveProperty('startTime');
            }
        });

        it('should have valid regroup effect structure', () => {
            const settings = get(powerupSettings);
            const regroupEffect = settings.effects.find(e => e.type === 'regroup');
            
            expect(regroupEffect).toHaveProperty('separationMultiplier');
            expect(regroupEffect).toHaveProperty('cohesionMultiplier');
            expect(regroupEffect.multiplier).toBeGreaterThan(1);
        });
    });
});