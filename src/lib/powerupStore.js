import { writable, get } from 'svelte/store';

export const powerupSettings = writable({
    spawnInterval: 2000, // Reduced from 3000 to 2000 for more frequent powerups
    duration: 5000, // how long powerups stay on screen
    size: 15, // size of powerup squares
    effects: [
        {
            type: 'timefreeze',
            color: '#00FFFF',
            multiplier: 0 // This will be used to zero out other groups' movement
        },
        {
            type: 'size',
            color: '#FF1493',
            multiplier: 2.0 // Increased from 1.5 for more noticeable size effect
        },
        {
            type: 'strength',
            color: '#00FF00',
            multiplier: 2.5 // Increased from 1.5 for stronger influence
        },
        {
            type: 'regroup',
            color: '#9932CC', // Purple color for regroup
            multiplier: 3.0, // Strength of the regrouping force
            separationMultiplier: 0, // Set separation to zero for tighter grouping
            cohesionMultiplier: 4.0  // Increase cohesion for stronger regrouping
        }
    ]
});

export const activePowerups = writable([]);
export const activePowerupEffects = writable([]);
export const isTimeFrozen = writable(false);

export function spawnPowerup(canvasWidth, canvasHeight) {
    // Don't spawn if there are any active effects
    if (get(activePowerupEffects).length > 0) {
        return;
    }
    
    const settings = get(powerupSettings);
    const effect = settings.effects[Math.floor(Math.random() * settings.effects.length)];
    
    const powerup = {
        x: Math.random() * (canvasWidth - 40) + 20, // Keep away from edges
        y: Math.random() * (canvasHeight - 40) + 20,
        type: effect.type,
        color: effect.color,
        multiplier: effect.multiplier,
        createdAt: Date.now()
    };
    
    activePowerups.update(powerups => [...powerups, powerup]);
    
    // Remove powerup after duration
    setTimeout(() => {
        activePowerups.update(powerups => 
            powerups.filter(p => p !== powerup)
        );
    }, settings.duration);
}

export function removePowerup(powerup) {
    activePowerups.update(powerups => 
        powerups.filter(p => p !== powerup)
    );
}

export function addPowerupEffect(boidGroup, effect) {
    // remove all powerups from screen
    activePowerups.set([]);
    
    const powerupEffect = {
        ...effect,
        groupIndex: boidGroup,
        startTime: Date.now(),
        centerX: window.innerWidth / 2,
        centerY: window.innerHeight / 2,
        // Include these properties if they exist in the effect
        separationMultiplier: effect.separationMultiplier !== undefined ? effect.separationMultiplier : 1,
        cohesionMultiplier: effect.cohesionMultiplier !== undefined ? effect.cohesionMultiplier : 1
    };
    
    // Update timefreeze state
    if (effect.type === 'timefreeze') {
        isTimeFrozen.set(true);
    }
    
    activePowerupEffects.update(effects => [...effects, powerupEffect]);
    
    // Remove effect after duration
    setTimeout(() => {
        activePowerupEffects.update(effects => 
            effects.filter(e => e !== powerupEffect)
        );
        // Reset timefreeze state
        if (effect.type === 'timefreeze') {
            isTimeFrozen.set(false);
        }
    }, 5000); // Effects last 5 seconds
}