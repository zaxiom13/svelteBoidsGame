<script>
import { fade } from 'svelte/transition';
import { activePowerupEffects } from './powerupStore';

$: latestPowerup = $activePowerupEffects[$activePowerupEffects.length - 1];
</script>

{#if latestPowerup}
<div class="powerup-notification" transition:fade={{ duration: 300 }}>
    <div class="powerup-icon" style="--color: {latestPowerup.color}">
        {#if latestPowerup.type === 'timefreeze'}
            ⌛
        {:else if latestPowerup.type === 'speed'}
            ⚡
        {:else if latestPowerup.type === 'size'}
            📏
        {:else if latestPowerup.type === 'strength'}
            💪
        {/if}
    </div>
    <div class="powerup-text">
        {latestPowerup.type.charAt(0).toUpperCase() + latestPowerup.type.slice(1)} Boost!
    </div>
</div>
{/if}

<style>
.powerup-notification {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 1rem 2rem;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    z-index: 1000;
    border: 2px solid var(--color);
    box-shadow: 0 0 20px var(--color);
    pointer-events: none;
}

.powerup-icon {
    font-size: 2rem;
    color: var(--color);
}

.powerup-text {
    font-size: 1.5rem;
    font-weight: bold;
    text-shadow: 0 0 10px var(--color);
}
</style>