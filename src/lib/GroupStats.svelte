<script>
import { BOID_COLORS, COLOR_NAMES } from './constants';
import { uiState, numGroups } from './boidsStore';
import { gameState } from './gameStore';
import { flip } from 'svelte/animate';
import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

export let groupCounts = {};

function toggleVisibility() {
    uiState.update(state => ({
        ...state,
        statsVisible: !state.statsVisible
    }));
}

$: sortedGroups = Array.from({ length: $numGroups }, (_, i) => ({
    groupIndex: i,
    count: groupCounts[i] || 0,
    color: BOID_COLORS[i],
    name: COLOR_NAMES[BOID_COLORS[i]],
    isEliminated: (groupCounts[i] || 0) === 0
}))
.sort((a, b) => {
    // Sort eliminated teams to the bottom
    if (a.isEliminated && !b.isEliminated) return 1;
    if (!a.isEliminated && b.isEliminated) return -1;
    return b.count - a.count;
});

$: total = Object.values(groupCounts).reduce((a, b) => a + b, 0);
</script>

<div class="group-stats" class:hidden={!$uiState.statsVisible}>
    {#each sortedGroups as {groupIndex, count, color, name, isEliminated}, index (groupIndex)}
        <div animate:flip={{duration: 300}}>
            {#if index > 0 && !isEliminated && sortedGroups[index - 1].isEliminated}
                <div class="elimination-separator"></div>
            {/if}
            <div 
                class="group-stat" 
                class:eliminated={isEliminated}
                style="--color: {color}"
            >
                <div class="group-label">
                    {name} {groupIndex === $gameState.playerPick ? '(Your Pick)' : ''}
                    {#if isEliminated}<span class="eliminated-text">Eliminated</span>{/if}
                </div>
                <div 
                    class="count-bar" 
                    style="--percentage: {(count / total * 100)}%"
                >
                    {count}
                </div>
            </div>
        </div>
    {/each}
</div>

<button 
    class="stats-toggle" 
    on:click={toggleVisibility}
    on:keydown={(e) => e.key === 'Enter' && toggleVisibility()}
    aria-label={$uiState.statsVisible ? 'Hide stats' : 'Show stats'}
    style="--rotation: {$uiState.statsVisible ? '0deg' : '180deg'}"
>
    ←
</button>

<style>
.group-stats {
    position: fixed;
    top: 20px;
    left: 0;
    background: rgba(0, 0, 0, 0.8);
    padding: 20px;
    border-radius: 8px;
    color: white;
    min-width: 200px;
    transition: transform 0.3s ease;
    transform: translateX(0);
}

.group-stats.hidden {
    transform: translateX(-100%);
}

.stats-toggle {
    position: fixed;
    top: 20px;
    left: 240px;
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
    transition: left 0.3s ease, transform 0.3s ease;
    transform: rotate(var(--rotation));
}

.stats-toggle:hover {
    background: rgba(0, 0, 0, 0.9);
}

.hidden ~ .stats-toggle {
    left: 20px;
}

.group-stat {
    margin-bottom: 10px;
    opacity: 1;
    transform: none;
}

.group-label {
    color: var(--color);
    margin-bottom: 4px;
    font-size: 0.9em;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.count-bar {
    height: 24px;
    background: var(--color);
    width: var(--percentage);
    min-width: 40px;
    transition: width 0.3s ease;
    display: flex;
    align-items: center;
    padding: 0 8px;
    border-radius: 4px;
    font-weight: bold;
}

.elimination-separator {
    height: 2px;
    background: rgba(255, 255, 255, 0.2);
    margin: 15px 0;
    border-radius: 1px;
}

.group-stat.eliminated {
    opacity: 0.5;
}

.eliminated .count-bar {
    background: #666;
    color: #ccc;
}

.eliminated-text {
    font-size: 0.8em;
    color: #999;
    font-style: italic;
}
</style>