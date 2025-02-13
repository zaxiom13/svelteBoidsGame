<script>
import { BOID_COLORS } from './boidsStore';
import { gameState, resetGame } from './gameStore';

$: gameDuration = $gameState.endTime - $gameState.startTime;
$: minutes = Math.floor(gameDuration / 60000);
$: seconds = ((gameDuration % 60000) / 1000).toFixed(1);
$: timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
$: didWin = $gameState.playerPick === $gameState.winner && !$gameState.isEliminated;
</script>

{#if $gameState.finalWinner !== null || !$gameState.isEliminated}
<div class="game-over">
    <h1>
        {#if $gameState.finalWinner !== null}
            {$gameState.finalWinner === $gameState.playerPick ? 'Your Team Won!' : 'Game Over'}
        {:else if !$gameState.isEliminated}
            {didWin ? 'You Won!' : 'Game Over'}
        {/if}
    </h1>
    
    <div class="result">
        {#if $gameState.finalWinner !== null}
            <div class="group-result">
                <h2>Winner</h2>
                <div class="group-circle" style="--color: {BOID_COLORS[$gameState.finalWinner]}">
                    Group {$gameState.finalWinner + 1}
                </div>
            </div>
        {:else if !$gameState.isEliminated}
            <div class="group-result">
                <h2>Winning Group</h2>
                <div class="group-circle" style="--color: {BOID_COLORS[$gameState.winner]}">
                    Group {$gameState.winner + 1}
                </div>
            </div>
        {/if}

        <div class="group-result">
            <h2>Your Pick</h2>
            <div class="group-circle eliminated={$gameState.isEliminated}" style="--color: {BOID_COLORS[$gameState.playerPick]}">
                Group {$gameState.playerPick + 1}
            </div>
        </div>
    </div>

    <p class="time">
        {#if $gameState.finalWinner !== null}
            Final Time: {timeString}
        {:else}
            Time: {timeString}
        {/if}
    </p>
    
    <button class="play-again" on:click={resetGame}>
        Play Again
    </button>
</div>
{/if}

<style>
.game-over {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    z-index: 1000;
}

h1 {
    font-size: 3rem;
    margin-bottom: 2rem;
    animation: pop 0.5s ease-out;
}

.result {
    display: flex;
    gap: 3rem;
    margin-bottom: 2rem;
}

.group-result {
    text-align: center;
}

.group-circle {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 3px solid var(--color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    margin-top: 1rem;
    color: var(--color);
    animation: pulse 2s infinite;
}

.time {
    font-size: 1.5rem;
    margin-bottom: 2rem;
}

.play-again {
    padding: 1rem 2rem;
    font-size: 1.2rem;
    background: #4CAF50;
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: background 0.2s;
}

.play-again:hover {
    background: #45a049;
}

@keyframes pop {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.group-circle.eliminated {
    border-style: dashed;
    opacity: 0.5;
}
</style>