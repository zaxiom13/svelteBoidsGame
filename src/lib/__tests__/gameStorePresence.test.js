import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { gameState, resetGame, moveToPlayerSelection, startGame, endGame } from '../gameStore';

describe('Game State Store Presence', () => {
    describe('Store Functions', () => {
        it('should have all required functions defined', () => {
            expect(resetGame).toBeTypeOf('function');
            expect(moveToPlayerSelection).toBeTypeOf('function');
            expect(startGame).toBeTypeOf('function');
            expect(endGame).toBeTypeOf('function');
        });
    });

    describe('Game State Structure', () => {
        it('should have all required state properties', () => {
            const state = get(gameState);
            expect(state).toHaveProperty('status');
            expect(state).toHaveProperty('playerPick');
            expect(state).toHaveProperty('winner');
            expect(state).toHaveProperty('startTime');
            expect(state).toHaveProperty('endTime');
            expect(state).toHaveProperty('countdown');
            expect(state).toHaveProperty('isEliminated');
            expect(state).toHaveProperty('finalWinner');
        });

        it('should have valid status values', () => {
            const validStatuses = ['config', 'start', 'countdown', 'running', 'finished'];
            const state = get(gameState);
            expect(validStatuses).toContain(state.status);
        });
    });

    describe('Initial State Values', () => {
        beforeEach(() => {
            resetGame();
        });

        it('should have correct initial values', () => {
            const state = get(gameState);
            expect(state.status).toBe('config');
            expect(state.playerPick).toBeNull();
            expect(state.winner).toBeNull();
            expect(state.startTime).toBeNull();
            expect(state.endTime).toBeNull();
            expect(state.countdown).toBe(3);
            expect(state.isEliminated).toBe(false);
            expect(state.finalWinner).toBeNull();
        });
    });

    describe('State Transitions', () => {
        beforeEach(() => {
            resetGame();
        });

        it('should properly initialize player selection state', () => {
            moveToPlayerSelection();
            const state = get(gameState);
            expect(state.status).toBe('start');
        });

        it('should properly initialize game start state', () => {
            startGame(1);
            const state = get(gameState);
            expect(state.status).toBe('countdown');
            expect(state.playerPick).toBe(1);
            expect(state.countdown).toBe(3);
        });

        it('should properly initialize game end state', () => {
            endGame(1);
            const state = get(gameState);
            expect(state.status).toBe('finished');
            expect(state.winner).toBe(1);
            expect(state.endTime).toBeDefined();
        });

        it('should handle elimination state correctly', () => {
            endGame(2, true, 3);
            const state = get(gameState);
            expect(state.isEliminated).toBe(true);
            expect(state.finalWinner).toBe(3);
        });
    });
});