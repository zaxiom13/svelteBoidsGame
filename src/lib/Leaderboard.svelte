<script>
import { writable } from 'svelte/store';
import { leaderboard, clearLeaderboard } from './leaderboardStore';

export const uiState = writable({
    statsVisible: true,
    controlsVisible: true,
    leaderboardVisible: false
});

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function toggleVisibility() {
    uiState.update(state => ({
        ...state,
        leaderboardVisible: !state.leaderboardVisible
    }));
}

function handleClear() {
    if (confirm('Are you sure you want to clear all scores?')) {
        clearLeaderboard();
    }
}
</script>

<div class="leaderboard" class:hidden={!$uiState.leaderboardVisible}>
    <div class="header">
        <h2>Personal Bests</h2>
        {#if $leaderboard.length > 0}
            <button class="clear-button" on:click={handleClear}>
                Clear
            </button>
        {/if}
    </div>

    {#if $leaderboard.length === 0}
        <p class="no-scores">No personal bests yet!</p>
    {:else}
        <div class="scores">
            {#each $leaderboard as {time, groupIndex}, i}
                <div class="score-row">
                    <span class="time">{formatTime(time)}</span>
                </div>
            {/each}
        </div>
    {/if}
</div>

<button 
    class="leaderboard-toggle" 
    on:click={toggleVisibility}
    on:keydown={(e) => e.key === 'Enter' && toggleVisibility()}
    aria-label={$uiState.leaderboardVisible ? 'Hide leaderboard' : 'Show leaderboard'}
    style="--rotation: {$uiState.leaderboardVisible ? '0deg' : '180deg'}"
>
    ←
</button>

<style>
.leaderboard {
    position: fixed;
    bottom: 20px;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    padding: 20px;
    border-radius: 8px;
    color: white;
    min-width: 250px;
    transition: transform 0.3s ease;
    transform: translateX(0);
}

.leaderboard.hidden {
    transform: translateX(100%);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

h2 {
    margin: 0;
    font-size: 1.2rem;
}

.clear-button {
    background: rgba(255, 0, 0, 0.2);
    border: 1px solid rgba(255, 0, 0, 0.3);
    color: #ff6b6b;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
}

.clear-button:hover {
    background: rgba(255, 0, 0, 0.3);
}

.leaderboard-toggle {
    position: fixed;
    bottom: 20px;
    right: 290px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    z-index: 100;
    border: none;
    padding: 0;
    transition: right 0.3s ease, transform 0.3s ease;
    transform: rotate(var(--rotation));
}

.leaderboard-toggle:hover {
    background: rgba(0, 0, 0, 0.9);
}

.hidden ~ .leaderboard-toggle {
    right: 20px;
}

.scores {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.score-row {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 15px;
    align-items: center;
    padding: 5px 10px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
}

.time {
    font-family: monospace;
    font-size: 1.1rem;
}

.group {
    display: flex;
    align-items: center;
    gap: 5px;
}

.no-scores {
    text-align: center;
    opacity: 0.7;
}
</style>