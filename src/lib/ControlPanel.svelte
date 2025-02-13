<script>
import { weights, speeds, numBoids, numGroups, visualSettings, groupSettings, canvasSettings, mouseSettings, shuffleBoidGroups, randomizeConfiguration } from './boidsStore';
import { moveToPlayerSelection } from './gameStore';
import { powerupSettings } from './powerupStore';

let expandedSections = {
    behavior: false,
    groups: false,
    speed: false,
    visual: false,
    groupDynamics: false,
    mouse: false,
    powerups: false
};

function handleSubmit() {
    moveToPlayerSelection();
}

function toggleSection(section) {
    expandedSections[section] = !expandedSections[section];
}

</script>

<div class="control-panel">
    <div class="content-container">
        <h1>Game Settings</h1>
        
        <div class="panel-layout">
            <div class="settings-section">
                <div class="help-text">Configure the settings below, then start the game to pick your team!</div>
                
                <div class="panel-content">
                    <div class="slider-group">
                        <div class="section">
                            <button class="section-header" on:click={() => toggleSection('groups')}>
                                Teams {expandedSections.groups ? '▼' : '▶'}
                            </button>
                            {#if expandedSections.groups}
                            <div class="section-content">
                                <label title="How many teams compete in the game">
                                    Number of Teams ({$numGroups})
                                    <input type="range" min="2" max="8" step="1" 
                                        bind:value={$numGroups}>
                                </label>

                                <label title="How much teams avoid mixing with other teams">
                                    Team Repulsion ({$weights.groupRepulsion})
                                    <input type="range" min="0" max="3" step="0.1" 
                                        bind:value={$weights.groupRepulsion}>
                                </label>
                            </div>
                            {/if}
                        </div>

                        <div class="section">
                            <button class="section-header" on:click={() => toggleSection('behavior')}>
                                Behavior {expandedSections.behavior ? '▼' : '▶'}
                            </button>
                            {#if expandedSections.behavior}
                            <div class="section-content">
                                <label title="How much boids avoid each other">
                                    Separation ({$weights.separation})
                                    <input type="range" min="0" max="3" step="0.1" 
                                        bind:value={$weights.separation}>
                                </label>
                                
                                <label title="How much boids match direction with neighbors">
                                    Alignment ({$weights.alignment})
                                    <input type="range" min="0" max="3" step="0.1" 
                                        bind:value={$weights.alignment}>
                                </label>
                                
                                <label title="How much boids stay close to their group">
                                    Cohesion ({$weights.cohesion})
                                    <input type="range" min="0" max="3" step="0.1" 
                                        bind:value={$weights.cohesion}>
                                </label>
                            </div>
                            {/if}
                        </div>

                        <div class="section">
                            <button class="section-header" on:click={() => toggleSection('groupDynamics')}>
                                Team Dynamics {expandedSections.groupDynamics ? '▼' : '▶'}
                            </button>
                            {#if expandedSections.groupDynamics}
                            <div class="section-content">
                                <label title="How likely boids are to switch teams when outnumbered">
                                    Peer Pressure ({$groupSettings.peerPressure.toFixed(3)})
                                    <input type="range" min="0" max="0.01" step="0.001" 
                                        bind:value={$groupSettings.peerPressure}>
                                </label>

                                <label title="How far boids look for team influence">
                                    Influence Range ({$groupSettings.peerRadius})
                                    <input type="range" min="20" max="100" step="5" 
                                        bind:value={$groupSettings.peerRadius}>
                                </label>

                                <label title="How resistant boids are to switching teams">
                                    Team Loyalty ({$groupSettings.loyaltyFactor.toFixed(2)})
                                    <input type="range" min="0" max="1" step="0.05" 
                                        bind:value={$groupSettings.loyaltyFactor}>
                                </label>
                            </div>
                            {/if}
                        </div>

                        <div class="section">
                            <button class="section-header" on:click={() => toggleSection('speed')}>
                                Movement {expandedSections.speed ? '▼' : '▶'}
                            </button>
                            {#if expandedSections.speed}
                            <div class="section-content">
                                <label title="Minimum speed boids can move">
                                    Min Speed ({$speeds.min})
                                    <input type="range" min="0" max="10" step="0.5" 
                                        bind:value={$speeds.min}>
                                </label>

                                <label title="Maximum speed boids can move">
                                    Max Speed ({$speeds.max})
                                    <input type="range" min="0" max="10" step="0.5" 
                                        bind:value={$speeds.max}>
                                </label>

                                <label title="Number of boids in the simulation">
                                    Population ({$numBoids})
                                    <input type="range" min="20" max="200" step="10" 
                                        bind:value={$numBoids}>
                                </label>
                            </div>
                            {/if}
                        </div>

                        <div class="section">
                            <button class="section-header" on:click={() => toggleSection('visual')}>
                                Visual {expandedSections.visual ? '▼' : '▶'}
                            </button>
                            {#if expandedSections.visual}
                            <div class="section-content">
                                <label title="Size of each boid">
                                    Boid Size ({$visualSettings.boidSize})
                                    <input type="range" min="5" max="20" step="1" 
                                        bind:value={$visualSettings.boidSize}>
                                </label>

                                <label title="Length of the trail behind each boid">
                                    Trail Length ({$visualSettings.trailLength})
                                    <input type="range" min="0" max="50" step="1" 
                                        bind:value={$visualSettings.trailLength}>
                                </label>

                                <label title="Width of the trail behind each boid">
                                    Trail Width ({$visualSettings.trailWidth})
                                    <input type="range" min="1" max="5" step="0.5" 
                                        bind:value={$visualSettings.trailWidth}>
                                </label>

                                <label title="Opacity of the trail behind each boid">
                                    Trail Opacity ({$visualSettings.trailOpacity})
                                    <input type="range" min="0" max="1" step="0.05" 
                                        bind:value={$visualSettings.trailOpacity}>
                                </label>
                            </div>
                            {/if}
                        </div>

                        <div class="section">
                            <button class="section-header" on:click={() => toggleSection('mouse')}>
                                Mouse Interaction {expandedSections.mouse ? '▼' : '▶'}
                            </button>
                            {#if expandedSections.mouse}
                            <div class="section-content">
                                <label class="checkbox-label" title="Enable/disable mouse repulsion">
                                    <input type="checkbox" bind:checked={$mouseSettings.active}>
                                    Enable Mouse Repulsion
                                </label>

                                <label title="How strongly boids are repelled by the mouse">
                                    Repulsion Strength ({$weights.mouseRepulsion.toFixed(1)})
                                    <input type="range" min="0" max="3" step="0.1" 
                                        bind:value={$weights.mouseRepulsion}>
                                </label>

                                <label title="How far boids detect the mouse">
                                    Detection Range ({$mouseSettings.repulsionRadius})
                                    <input type="range" min="20" max="200" step="10" 
                                        bind:value={$mouseSettings.repulsionRadius}>
                                </label>
                            </div>
                            {/if}
                        </div>

                        <div class="section">
                            <button class="section-header" on:click={() => toggleSection('powerups')}>
                                Powerups {expandedSections.powerups ? '▼' : '▶'}
                            </button>
                            {#if expandedSections.powerups}
                            <div class="section-content">
                                <label title="How often powerups spawn (in milliseconds)">
                                    Spawn Interval ({$powerupSettings.spawnInterval}ms)
                                    <input type="range" min="1000" max="5000" step="500" 
                                        bind:value={$powerupSettings.spawnInterval}>
                                </label>

                                <label title="How long powerups stay on screen">
                                    Duration ({$powerupSettings.duration}ms)
                                    <input type="range" min="3000" max="10000" step="1000" 
                                        bind:value={$powerupSettings.duration}>
                                </label>

                                <label title="Size of powerup items">
                                    Size ({$powerupSettings.size})
                                    <input type="range" min="10" max="30" step="5" 
                                        bind:value={$powerupSettings.size}>
                                </label>
                            </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="controls-section">
                <button class="submit-button" on:click={handleSubmit}>
                    Start Game
                </button>
                <button class="shuffle-button" on:click={randomizeConfiguration}>
                    Randomize All Settings
                </button>
            </div>
        </div>
    </div>
</div>

<style>
.control-panel {
    background: rgba(0, 0, 0, 0.8);
    padding: 20px;
    color: black;
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    overflow: hidden;
    box-sizing: border-box;
}

.content-container {
    width: 100%;
    max-width: 1200px;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    box-sizing: border-box;
}

.panel-layout {
    display: flex;
    gap: 20px;
    flex: 1;
    min-height: 0;
    height: calc(100% - 60px); /* Subtract space for header */
    overflow: hidden;
}

.settings-section {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.controls-section {
    width: 200px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    height: fit-content;
}

.panel-content {
    overflow-y: auto;
    overflow-x: hidden;
    height: calc(100% - 40px); /* Subtract space for help text */
    padding: 0 12px 0 16px;
    direction: rtl;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.6) transparent;
    box-sizing: border-box;
}

.panel-content > * {
    direction: ltr;
}

.panel-content::-webkit-scrollbar {
    width: 8px;
    margin-right: 4px;
}

.panel-content::-webkit-scrollbar-track {
    background: transparent;
    margin: 4px;
}

.panel-content::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.6);
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: padding-box;
}

.slider-group {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 0 0 20px 0; /* Add padding to prevent last item from touching bottom */
    width: 100%;
}

label {
    display: flex;
    flex-direction: column;
    gap: 8px;
    opacity: 0.9;
    cursor: help;
}

input[type="range"] {
    width: 100%;
    accent-color: #4CAF50;
}

.section-header {
    width: 100%;
    text-align: left;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: black;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
    box-sizing: border-box;
}

.section-header:hover {
    background: rgba(255, 255, 255, 0.15);
}

.section {
    min-width: 0;
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.3);
    margin: 0; /* Reset any default margins */
    overflow: hidden;
}

.section-content {
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
    box-sizing: border-box;
}

.submit-button {
    width: 100%;
    padding: 15px;
    background: #4CAF50;
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    font-size: 1.2em;
    font-weight: bold;
    transition: all 0.2s ease;
}

.submit-button:hover {
    background: #45a049;
}

.help-text {
    text-align: center;
    font-size: 0.9em;
    opacity: 0.7;
    margin: 0 0 10px 0;
    flex-shrink: 0;
}

h1 {
    text-align: center;
    margin: 0 0 10px 0;
    color: black;
    font-size: 2em;
    flex-shrink: 0;
}

.shuffle-button {
    width: 100%;
    padding: 10px;
    background: linear-gradient(45deg, #7158e2, #5f48c2);
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    font-size: 1em;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: bold;
}

.shuffle-button:hover {
    background: linear-gradient(45deg, #8168f2, #6f58d2);
    transform: translateY(-1px);
}

.checkbox-label {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
}

.checkbox-label input[type="checkbox"] {
    width: auto;
}
</style>