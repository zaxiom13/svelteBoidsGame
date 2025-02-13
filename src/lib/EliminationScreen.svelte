<script>
import { BOID_COLORS } from './boidsStore';
import { gameState } from './gameStore';

export function continueSpectating() {
    gameState.update(state => ({
        ...state,
        showEliminationScreen: false
    }));
}

function playAgain() {
    gameState.update(state => ({
        ...state,
        status: 'config'
    }));
}
</script>

<div class="elimination-screen">
    <h1>Your Team Was Eliminated!</h1>
    
    <div class="group-circle eliminated" style="--color: {BOID_COLORS[$gameState.playerPick]}">
        Group {$gameState.playerPick + 1}
    </div>

    <div class="buttons">
        <button class="play-again" on:click={playAgain}>
            Play Again
        </button>
        <button class="spectate" on:click={continueSpectating}>
            Continue Spectating
        </button>
    </div>
</div>

<style>
.elimination-screen {
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
    color: #ff6b6b;
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
    margin: 2rem 0;
    color: var(--color);
}

.group-circle.eliminated {
    border-style: dashed;
    opacity: 0.5;
}

.buttons {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
}

button {
    padding: 1rem 2rem;
    font-size: 1.2rem;
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: background 0.2s;
}

.play-again {
    background: #4CAF50;
}

.play-again:hover {
    background: #45a049;
}

.spectate {
    background: #666;
}

.spectate:hover {
    background: #555;
}

@keyframes pop {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
}
</style>