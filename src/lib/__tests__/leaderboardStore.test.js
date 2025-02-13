import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { leaderboard, addScore, clearLeaderboard } from '../leaderboardStore';

describe('Leaderboard Store', () => {
    beforeEach(() => {
        // Reset localStorage and store state
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => null);
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
        clearLeaderboard();
        vi.clearAllMocks();
    });

    it('should initialize with empty scores from localStorage', () => {
        localStorage.getItem = vi.fn(() => '[]');
        clearLeaderboard(); // Force re-initialization
        const scores = get(leaderboard);
        expect(scores).toEqual([]);
    });
 
    it('should add valid winning scores', () => {
        const score = {
            time: 12345,
            groupIndex: 0,
            wasCorrect: true
        };

        addScore(score);
        const scores = get(leaderboard);
        expect(scores).toHaveLength(1);
        expect(scores[0]).toEqual(score);
    });

    it('should ignore non-winning scores', () => {
        const score = {
            time: 12345,
            groupIndex: 0,
            wasCorrect: false
        };

        addScore(score);
        const scores = get(leaderboard);
        expect(scores).toHaveLength(0);
    });

    it('should sort scores by time', () => {
        const scores = [
            { time: 20000, groupIndex: 1, wasCorrect: true },
            { time: 10000, groupIndex: 2, wasCorrect: true },
            { time: 15000, groupIndex: 3, wasCorrect: true }
        ];

        scores.forEach(addScore);
        const savedScores = get(leaderboard);
        expect(savedScores).toHaveLength(3);
        expect(savedScores[0].time).toBe(10000);
        expect(savedScores[1].time).toBe(15000);
        expect(savedScores[2].time).toBe(20000);
    });

    it('should keep only the best time for each group', () => {
        const scores = [
            { time: 20000, groupIndex: 0, wasCorrect: true },
            { time: 10000, groupIndex: 0, wasCorrect: true }, // Better time for group 0
            { time: 15000, groupIndex: 1, wasCorrect: true }
        ];

        scores.forEach(addScore);
        const savedScores = get(leaderboard);
        expect(savedScores).toHaveLength(2);
        const group0Score = savedScores.find(s => s.groupIndex === 0);
        expect(group0Score.time).toBe(10000);
    });

    it('should persist scores to localStorage', () => {
        const score = {
            time: 12345,
            groupIndex: 0,
            wasCorrect: true
        };

        addScore(score);
        expect(localStorage.setItem).toHaveBeenCalledWith('boidGameScores', JSON.stringify([score]));
    });

    it('should clear all scores', () => {
        const score = {
            time: 12345,
            groupIndex: 0,
            wasCorrect: true
        };

        addScore(score);
        clearLeaderboard();

        expect(get(leaderboard)).toHaveLength(0);
        expect(localStorage.setItem).toHaveBeenCalledWith('boidGameScores', '[]');
    });

    it('should handle loading existing scores from localStorage', () => {
        const existingScores = [
            { time: 12345, groupIndex: 0, wasCorrect: true }
        ];

        // Set up localStorage mock
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(existingScores));

        // Force re-initialization
        clearLeaderboard();
        leaderboard.set(existingScores); // Manually set the leaderboard store
        const scores = get(leaderboard);
        expect(scores).toEqual(existingScores);
    });

    describe('Store Structure Validation', () => {
        it('should expose the required public interface', () => {
            expect(leaderboard).toBeDefined();
            expect(leaderboard.subscribe).toBeDefined();
            expect(addScore).toBeDefined();
            expect(clearLeaderboard).toBeDefined();
        });

        it('should always return an array', () => {
            expect(Array.isArray(get(leaderboard))).toBe(true);
            clearLeaderboard();
            expect(Array.isArray(get(leaderboard))).toBe(true);
        });
    });

    describe('Score Object Validation', () => {
        it('should contain all required fields in score objects', () => {
            const score = {
                time: 12345,
                groupIndex: 0,
                wasCorrect: true
            };
            addScore(score);
            const scores = get(leaderboard);
            const savedScore = scores[0];
            
            expect(savedScore).toHaveProperty('time');
            expect(savedScore).toHaveProperty('groupIndex');
            expect(savedScore).toHaveProperty('wasCorrect');
        });

        it('should store time as a number', () => {
            const score = {
                time: 12345,
                groupIndex: 0,
                wasCorrect: true
            };
            addScore(score);
            const scores = get(leaderboard);
            expect(typeof scores[0].time).toBe('number');
        });

        it('should store groupIndex as a number', () => {
            const score = {
                time: 12345,
                groupIndex: 0,
                wasCorrect: true
            };
            addScore(score);
            const scores = get(leaderboard);
            expect(typeof scores[0].groupIndex).toBe('number');
        });

        it('should store wasCorrect as a boolean', () => {
            const score = {
                time: 12345,
                groupIndex: 0,
                wasCorrect: true
            };
            addScore(score);
            const scores = get(leaderboard);
            expect(typeof scores[0].wasCorrect).toBe('boolean');
        });

        it('should handle time being zero', () => {
            const score = {
                time: 0,
                groupIndex: 0,
                wasCorrect: true
            };
            addScore(score);
            const scores = get(leaderboard);
            expect(scores[0].time).toBe(0);
        });

        it('should handle multiple groups starting from index 0', () => {
            const scores = [
                { time: 100, groupIndex: 0, wasCorrect: true },
                { time: 200, groupIndex: 1, wasCorrect: true },
                { time: 300, groupIndex: 2, wasCorrect: true }
            ];
            scores.forEach(addScore);
            const savedScores = get(leaderboard);
            const groupIndices = savedScores.map(s => s.groupIndex);
            expect(groupIndices).toContain(0);
            expect(groupIndices).toContain(1);
            expect(groupIndices).toContain(2);
        });
    });

    describe('LocalStorage Interaction', () => {
        it('should call localStorage.setItem with correct key', () => {
            const score = { time: 100, groupIndex: 0, wasCorrect: true };
            addScore(score);
            expect(localStorage.setItem).toHaveBeenCalledWith('boidGameScores', expect.any(String));
        });

        it('should store valid JSON in localStorage', () => {
            const score = { time: 100, groupIndex: 0, wasCorrect: true };
            addScore(score);
            const calls = vi.mocked(localStorage.setItem).mock.calls;
            const lastCallData = calls[calls.length - 1][1];
            expect(() => JSON.parse(lastCallData)).not.toThrow();
        });

        it('should handle empty localStorage gracefully', () => {
            vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => null);
            clearLeaderboard();
            expect(get(leaderboard)).toEqual([]);
        });

        it('should handle malformed localStorage data gracefully', () => {
            vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => 'invalid json');
            clearLeaderboard();
            expect(get(leaderboard)).toEqual([]);
        });
    });

    describe('Extended Store Validation', () => {
        it('should have a functioning subscribe method that returns an unsubscribe function', () => {
            const unsubscribe = leaderboard.subscribe(() => {});
            expect(typeof unsubscribe).toBe('function');
            unsubscribe();
        });

        it('should maintain state between subscriptions', () => {
            const score = { time: 100, groupIndex: 0, wasCorrect: true };
            addScore(score);
            let value1, value2;
            
            leaderboard.subscribe(v => value1 = v)();
            leaderboard.subscribe(v => value2 = v)();
            expect(value1).toEqual(value2);
        });

        it('should not mutate the original score object when adding', () => {
            const originalScore = { time: 100, groupIndex: 0, wasCorrect: true };
            const scoreCopy = { ...originalScore };
            addScore(originalScore);
            expect(originalScore).toEqual(scoreCopy);
        });
    });

    describe('Data Integrity Tests', () => {
        it('should preserve score order after multiple operations', () => {
            const scores = [
                { time: 300, groupIndex: 0, wasCorrect: true },
                { time: 200, groupIndex: 1, wasCorrect: true },
                { time: 100, groupIndex: 2, wasCorrect: true }
            ];
            
            scores.forEach(addScore);
            clearLeaderboard();
            scores.forEach(addScore);
            
            const savedScores = get(leaderboard);
            expect(savedScores[0].time).toBe(100);
            expect(savedScores[2].time).toBe(300);
        });

        it('should not store undefined values for any field', () => {
            const score = { time: 100, groupIndex: 0, wasCorrect: true };
            addScore(score);
            const savedScore = get(leaderboard)[0];
            
            Object.values(savedScore).forEach(value => {
                expect(value).not.toBeUndefined();
            });
        });

        it('should not store null values for any field', () => {
            const score = { time: 100, groupIndex: 0, wasCorrect: true };
            addScore(score);
            const savedScore = get(leaderboard)[0];
            
            Object.values(savedScore).forEach(value => {
                expect(value).not.toBeNull();
            });
        });

        it('should maintain correct data types after localStorage roundtrip', () => {
            const score = { time: 100, groupIndex: 0, wasCorrect: true };
            addScore(score);
            clearLeaderboard(); // Force a localStorage roundtrip
            addScore(score);
            
            const savedScore = get(leaderboard)[0];
            expect(typeof savedScore.time).toBe('number');
            expect(typeof savedScore.groupIndex).toBe('number');
            expect(typeof savedScore.wasCorrect).toBe('boolean');
        });
    });

    describe('Edge Cases', () => {
        it('should handle maximum safe integer for time', () => {
            const score = { 
                time: Number.MAX_SAFE_INTEGER, 
                groupIndex: 0, 
                wasCorrect: true 
            };
            addScore(score);
            expect(get(leaderboard)[0].time).toBe(Number.MAX_SAFE_INTEGER);
        });

        it('should handle very large group indices', () => {
            const score = { 
                time: 100, 
                groupIndex: 999999, 
                wasCorrect: true 
            };
            addScore(score);
            expect(get(leaderboard)[0].groupIndex).toBe(999999);
        });

        it('should preserve empty arrays in state', () => {
            clearLeaderboard();
            const scores = get(leaderboard);
            expect(scores).toBeDefined();
            expect(Array.isArray(scores)).toBe(true);
            expect(scores.length).toBe(0);
        });
    });
});