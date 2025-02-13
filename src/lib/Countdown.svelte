<script>
import { gameState } from './gameStore';
</script>

{#if $gameState.status === 'countdown'}
<div class="countdown">
    <div class="number">{$gameState.countdown}</div>
</div>
{/if}

<style>
.countdown {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    z-index: 1000;
}

.number {
    font-size: 120px;
    color: white;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
}
</style>