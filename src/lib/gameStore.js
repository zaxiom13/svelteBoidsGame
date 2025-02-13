import { writable, get } from 'svelte/store';
import { resetBoids, numBoids, numGroups, canvasSettings } from './boidsStore';

export const gameState = writable({
    status: 'config', // 'config', 'start', 'countdown', 'running', 'finished'
    playerPick: null,
    winner: null,
    startTime: null,
    endTime: null,
    countdown: 3,
    isEliminated: false,
    finalWinner: null,
    showEliminationScreen: false
});

export function resetGame() {
    gameState.set({
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
}

export function moveToPlayerSelection() {
    gameState.update(state => ({
        ...state,
        status: 'start'
    }));
}

export function startGame(pickedGroup) {
    const currentNumBoids = get(numBoids);
    const currentNumGroups = get(numGroups);
    const canvas = document.querySelector('canvas');
    
    // Reset boids using actual canvas dimensions
    resetBoids(currentNumBoids, canvas.width, canvas.height, currentNumGroups);

    gameState.update(state => ({
        ...state,
        status: 'countdown',
        playerPick: pickedGroup,
        countdown: 3
    }));

    // Start countdown
    const countdownInterval = setInterval(() => {
        gameState.update(state => {
            if (state.countdown > 1) {
                return { ...state, countdown: state.countdown - 1 };
            } else {
                clearInterval(countdownInterval);
                return {
                    ...state,
                    status: 'running',
                    countdown: 0,
                    startTime: Date.now()
                };
            }
        });
    }, 1000);
}

export function endGame(winningGroup, isEliminated = false, finalWinner = null) {
    gameState.update(state => ({
        ...state,
        status: 'finished',  // Always set to finished when endGame is called
        winner: winningGroup,
        endTime: Date.now(),
        isEliminated,
        finalWinner,
        showEliminationScreen: isEliminated && finalWinner === null
    }));
}