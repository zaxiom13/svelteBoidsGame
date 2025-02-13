import { writable } from 'svelte/store';

// Load saved scores and eliminations from localStorage
const savedScores = JSON.parse(localStorage.getItem('boidGameScores') || '[]');

export const leaderboard = writable(savedScores);

// Subscribe to changes and save to localStorage
leaderboard.subscribe(scores => {
    localStorage.setItem('boidGameScores', JSON.stringify(scores));
});


export function addScore(score) {
    // Only add score if player won (wasCorrect is true)
    if (!score.wasCorrect) return;

    leaderboard.update(scores => {
        const newScores = [...scores, score]
            .sort((a, b) => a.time - b.time)
            // Filter to keep only the best time for each unique group
            .filter((score, index, self) => 
                index === self.findIndex(s => s.groupIndex === score.groupIndex)
            );
        return newScores;
    });
}

// clear leaderboard
export function clearLeaderboard() {
    leaderboard.set([]);
}
