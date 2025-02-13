<script>
import { BOID_COLORS } from './boidsStore';
import { startGame } from './gameStore';
import { numGroups } from './boidsStore';

function handlePickGroup(groupIndex) {
    startGame(groupIndex);
}
</script>

<div class="start-screen">
    <h1>Choose Your Team!</h1>
    <p class="description">Each team has been configured with the settings you chose. Watch them compete and see if your team comes out on top!</p>
    
    <div class="group-picks">
        {#each BOID_COLORS.slice(0, $numGroups) as color, i}
            <button 
                class="group-pick" 
                style="--color: {color}"
                on:click={() => handlePickGroup(i)}
            >
                <span class="group-label">Group {i + 1}</span>
                <div class="fish-preview" style="--color: {color}">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M4,12 L8,8 L20,12 L8,16 Z" fill="currentColor"/>
                    </svg>
                </div>
            </button>
        {/each}
    </div>
</div>

<style>
.start-screen {
    padding: 40px;
    text-align: center;
    background: rgba(0, 0, 0, 0.9);
    border-radius: 12px;
    max-width: 800px;
    margin: 0 auto;
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: white;
}

.description {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    color: black;
    line-height: 1.6;
}

.group-picks {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1.5rem;
    justify-content: center;
    padding: 1rem;
}

.group-pick {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border: 2px solid var(--color);
    background: rgba(255, 255, 255, 0.05);
    color: var(--color);
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 12px;
}

.group-pick:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.group-label {
    font-weight: bold;
}

.fish-preview {
    color: var(--color);
    transform: scale(1.5);
    transition: transform 0.3s ease;
}

.group-pick:hover .fish-preview {
    transform: scale(1.8);
}
</style>