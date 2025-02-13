<script>
import { gameState } from './gameStore';
import { isTimeFrozen } from './powerupStore';
import { onMount, onDestroy } from 'svelte';

let elapsedTime = 0;
let lastUpdateTime = 0;
let timerInterval;

onMount(() => {
    lastUpdateTime = Date.now();
    timerInterval = setInterval(() => {
        if ($gameState.status === 'running' && !$isTimeFrozen) {
            const currentTime = Date.now();
            elapsedTime += currentTime - lastUpdateTime;
            lastUpdateTime = currentTime;
        } else {
            lastUpdateTime = Date.now(); // Reset last update time when paused
        }
    }, 100);
});

onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
});

$: minutes = Math.floor(elapsedTime / 60000);
$: seconds = Math.floor((elapsedTime % 60000) / 1000);
$: milliseconds = Math.floor((elapsedTime % 1000) / 100);
$: timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
</script>

<div class="timer" class:frozen={$isTimeFrozen}>
    {timeDisplay}
</div>

<style>
.timer {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 24px;
    font-family: monospace;
    z-index: 90;
    pointer-events: none;
    transition: color 0.3s ease;
}

.timer.frozen {
    color: #00FFFF;
    text-shadow: 0 0 10px #00FFFF;
}
</style>