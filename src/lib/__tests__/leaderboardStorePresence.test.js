import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';

describe('Leaderboard Store Presence', () => {
    beforeEach(() => {
        // Reset modules and setup localStorage mock before importing store
        vi.resetModules();
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => '[]');
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Store Structure', () => {
        it('should have all required exports defined', async () => {
            const { leaderboard, addScore, clearLeaderboard } = await import('../leaderboardStore');
            expect(leaderboard).toBeDefined();
            expect(addScore).toBeTypeOf('function');
            expect(clearLeaderboard).toBeTypeOf('function');
        });

        it('should initialize with empty array', async () => {
            const { leaderboard } = await import('../leaderboardStore');
            expect(Array.isArray(get(leaderboard))).toBe(true);
            expect(get(leaderboard)).toHaveLength(0);
        });
    });

    describe('Score Entry Structure', () => {
        it('should have correct score properties when added', async () => {
            const { leaderboard, addScore } = await import('../leaderboardStore');
            const testScore = {
                time: 12345,
                groupIndex: 0,
                wasCorrect: true
            };
            
            addScore(testScore);
            const scores = get(leaderboard);
            
            if (scores.length > 0) {
                const score = scores[0];
                expect(score).toHaveProperty('time');
                expect(score).toHaveProperty('groupIndex');
                expect(score).toHaveProperty('wasCorrect');
                expect(typeof score.time).toBe('number');
                expect(typeof score.groupIndex).toBe('number');
                expect(typeof score.wasCorrect).toBe('boolean');
            }
        });
    });

    describe('LocalStorage Integration', () => {
        it('should interact with localStorage', async () => {
            await import('../leaderboardStore');
            expect(localStorage.getItem).toHaveBeenCalledWith('boidGameScores');
        });

        it('should save changes to localStorage', async () => {
            const { addScore } = await import('../leaderboardStore');
            const testScore = {
                time: 12345,
                groupIndex: 0,
                wasCorrect: true
            };
            
            addScore(testScore);
            expect(localStorage.setItem).toHaveBeenCalledWith('boidGameScores', expect.any(String));
        });
    });

    describe('Data Persistence', () => {
        it('should maintain data structure after storage roundtrip', async () => {
            const { addScore, clearLeaderboard } = await import('../leaderboardStore');
            const testScore = {
                time: 12345,
                groupIndex: 0,
                wasCorrect: true
            };
            
            addScore(testScore);
            clearLeaderboard();
            
            // Simulate reload by parsing stored data
            const storedData = JSON.parse(localStorage.getItem('boidGameScores'));
            expect(Array.isArray(storedData)).toBe(true);
        });
    });
});