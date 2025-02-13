import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { gameState, resetGame, moveToPlayerSelection, startGame, endGame } from '../gameStore';

// Define mock store factory outside vi.mock
const storeValues = {
    numBoids: 50,
    numGroups: 4,
    canvasSettings: { height: 600, width: 800 }
};

vi.mock('../boidsStore', () => ({
    resetBoids: vi.fn(),
    numBoids: {
        subscribe: vi.fn((fn) => {
            fn(storeValues.numBoids);
            return { unsubscribe: vi.fn() };
        }),
        set: vi.fn()
    },
    numGroups: {
        subscribe: vi.fn((fn) => {
            fn(storeValues.numGroups);
            return { unsubscribe: vi.fn() };
        }),
        set: vi.fn()
    },
    canvasSettings: {
        subscribe: vi.fn((fn) => {
            fn(storeValues.canvasSettings);
            return { unsubscribe: vi.fn() };
        }),
        set: vi.fn()
    }
}));

describe('Game State Management', () => {
    beforeEach(() => {
        resetGame();
        vi.clearAllMocks();
    });

    it('should initialize with correct default state', () => {
        const state = get(gameState);
        expect(state).toEqual({
            status: 'config',
            playerPick: null,
            winner: null,
            startTime: null,
            endTime: null,
            countdown: 3,
            isEliminated: false,
            finalWinner: null,
            showEliminationScreen: false
        });
    });

    it('should move to player selection state', () => {
        moveToPlayerSelection();
        const state = get(gameState);
        expect(state.status).toBe('start');
    });

    it('should properly start game with player pick', () => {
        startGame(2);
        const state = get(gameState);
        expect(state.status).toBe('countdown');
        expect(state.playerPick).toBe(2);
        expect(state.countdown).toBe(3);
    });

    it('should handle game end with winner', () => {
        startGame(1);
        endGame(1);
        const state = get(gameState);
        expect(state.status).toBe('finished');
        expect(state.winner).toBe(1);
        expect(state.endTime).toBeDefined();
    });

    it('should handle player elimination', () => {
        startGame(1);
        endGame(2, true);
        const state = get(gameState);
        expect(state.status).toBe('finished');
        expect(state.isEliminated).toBe(true);
        expect(state.showEliminationScreen).toBe(true);
    });

    it('should handle game end with final winner in elimination', () => {
        startGame(1);
        endGame(2, true, 3);
        const state = get(gameState);
        expect(state.finalWinner).toBe(3);
        expect(state.showEliminationScreen).toBe(false);
    });

    it('should reset game state completely', () => {
        startGame(1);
        endGame(2);
        resetGame();
        const state = get(gameState);
        expect(state).toEqual({
            status: 'config',
            playerPick: null,
            winner: null,
            startTime: null,
            endTime: null,
            countdown: 3,
            isEliminated: false,
            finalWinner: null,
            showEliminationScreen: false
        });
    });
});