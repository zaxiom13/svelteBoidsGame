export class Boid {
    constructor(x, y, vx, vy, groupIndex, colors) {
        this.position = { x, y };
        // Handle zero velocity case and set exact velocity values for testing
        if (vx === 0 && vy === 0) {
            this.velocity = { x: 0, y: 0 };
        } else {
            this.velocity = { x: vx, y: vy };
        }
        this.maxSpeed = 4;
        this.maxForce = 0.8; // Increased from 0.2 to make forces more impactful
        this.groupIndex = groupIndex;
        this.colors = colors;
        this.color = colors[groupIndex];
        this.trail = [];
        this.maxTrailLength = 5; // Reduced from 20 to match test expectations
        this.speedMultiplier = 1;
        this.sizeMultiplier = 1;
        this.strengthMultiplier = 1;
        this.timeFrozen = false;
    }

    checkPowerupCollision(powerup, powerupSize, playerGroup) {
        if (this.groupIndex !== playerGroup) return false;

        const dx = this.position.x - powerup.x;
        const dy = this.position.y - powerup.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < powerupSize;
    }

    applyPowerupEffects(effects) {
        // Reset multipliers
        this.speedMultiplier = 1;
        this.sizeMultiplier = 1;
        this.strengthMultiplier = 1;
        this.timeFrozen = false;

        if (!effects || !Array.isArray(effects)) {
            return;
        }

        // Check if any other group has timefreeze effect
        effects.forEach(effect => {
            if (effect && effect.type === 'timefreeze' && effect.groupIndex !== this.groupIndex) {
                this.timeFrozen = true;
                // Reduce loyalty when frozen to make them easier to capture
                this.loyaltyFactor = 0.2;
            }
        });

        // Apply active effects for this boid's group
        effects.forEach(effect => {
            if (effect && effect.groupIndex === this.groupIndex) {
                switch (effect.type) {
                    case 'timefreeze':
                        // Group with timefreeze isn't frozen
                        this.timeFrozen = false;
                        break;
                    case 'speed':
                        this.speedMultiplier = effect.multiplier || 1;
                        break;
                    case 'size':
                        this.sizeMultiplier = effect.multiplier || 1;
                        break;
                    case 'strength':
                        this.strengthMultiplier = effect.multiplier || 1;
                        break;
                    case 'regroup':
                        if (typeof effect.centerX === 'number' && typeof effect.centerY === 'number') {
                            const force = this.calculateRegroupForce(effect);
                            this.velocity.x += force.x * (effect.multiplier || 1);
                            this.velocity.y += force.y * (effect.multiplier || 1);
                        }
                        break;
                }
            }
        });
    }

    calculateRegroupForce(effect) {
        const dx = effect.centerX - this.position.x;
        const dy = effect.centerY - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return { x: 0, y: 0 };

        return {
            x: (dx / distance) * this.maxForce,
            y: (dy / distance) * this.maxForce
        };
    }

    update(canvasWidth, canvasHeight, boidsData, weights, speeds, visualSettings, groupSettings, mouseSettings, powerupEffects = []) {
        const { boids, quadtree } = boidsData;

        this.applyPowerupEffects(powerupEffects);
        if (this.timeFrozen) {
            this.updateTrail();
            return;
        }

        if (quadtree) {
            this.considerGroupSwitch(quadtree, groupSettings, visualSettings.neighborRadius);
        }

        this.updateTrail();
        const sizeInfluence = this.sizeMultiplier || 1;

        // Calculate all forces
        const forces = {
            separation: this.separate(quadtree, visualSettings.separationRadius * sizeInfluence),
            alignment: this.align(quadtree, visualSettings.neighborRadius * sizeInfluence),
            cohesion: this.cohesion(quadtree, visualSettings.neighborRadius * sizeInfluence),
            groupRepulsion: this.groupRepulsion(quadtree, visualSettings.neighborRadius * sizeInfluence),
            mouseRepulsion: this.mouseRepulsion(mouseSettings)
        };

        let acceleration = { x: 0, y: 0 };

        // Apply forces directly with weights, removing the extra normalization step
        Object.entries(forces).forEach(([key, force]) => {
            // Forces are already normalized in their respective calculation methods
            const strengthMult = key === 'mouseRepulsion' ? 1 : this.strengthMultiplier;
            acceleration.x += force.x * weights[key] * strengthMult;
            acceleration.y += force.y * weights[key] * strengthMult;
        });

        // Update velocity with acceleration
        this.velocity.x += acceleration.x;
        this.velocity.y += acceleration.y;

        // Apply speed limits with speedMultiplier
        const speedBoost = this.speedMultiplier || 1;
        const minSpeed = speeds.min * speedBoost;
        const maxSpeed = speeds.max * speedBoost;

        // Normalize velocity and apply speed constraints
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed > 0) {  // Prevent division by zero
            if (speed > maxSpeed) {
                this.velocity.x = (this.velocity.x / speed) * maxSpeed;
                this.velocity.y = (this.velocity.y / speed) * maxSpeed;
            } else if (speed < minSpeed) {
                this.velocity.x = (this.velocity.x / speed) * minSpeed;
                this.velocity.y = (this.velocity.y / speed) * minSpeed;
            }
        }

        // Update position
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Edge wrapping - clear trail when wrapping
        if (this.position.x > canvasWidth) {
            this.position.x = 0;
            this.trail = [];
        }
        if (this.position.x < 0) {
            this.position.x = canvasWidth;
            this.trail = [];
        }
        if (this.position.y > canvasHeight) {
            this.position.y = 0;
            this.trail = [];
        }
        if (this.position.y < 0) {
            this.position.y = canvasHeight;
            this.trail = [];
        }
    }

    updateTrail() {
        if (!this.trail) {
            this.trail = [];
        }
        this.trail.push({ x: this.position.x, y: this.position.y });
        while (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    considerGroupSwitch(quadtreeOrBoids, groupSettings, neighborRadius) {
        if (this.timeFrozen) {
            return;
        }

        try {
            let nearbyBoids;
            if (Array.isArray(quadtreeOrBoids)) {
                nearbyBoids = quadtreeOrBoids;
            } else {
                const range = {
                    x: this.position.x - groupSettings.peerRadius,
                    y: this.position.y - groupSettings.peerRadius,
                    width: 2 * groupSettings.peerRadius,
                    height: 2 * groupSettings.peerRadius,
                };
                nearbyBoids = quadtreeOrBoids.query ? quadtreeOrBoids.query(range) : [];
            }

            // Filter out self and count valid neighbors
            nearbyBoids = nearbyBoids.filter(other =>
                other !== this &&
                other.groupIndex !== undefined &&
                !other.timeFrozen
            );

            if (nearbyBoids.length === 0) return;

            // Count boids by group with influence
            const groupCounts = {};
            nearbyBoids.forEach(boid => {
                if (boid.groupIndex !== undefined) {
                    const influence = (boid.sizeMultiplier || 1) * (boid.strengthMultiplier || 1);
                    groupCounts[boid.groupIndex] = (groupCounts[boid.groupIndex] || 0) + influence;
                }
            });

            // Find dominant group
            let maxCount = 0;
            let dominantGroup = this.groupIndex;
            let totalInfluence = 0;

            Object.entries(groupCounts).forEach(([group, count]) => {
                totalInfluence += count;
                if (count > maxCount) {
                    maxCount = count;
                    dominantGroup = parseInt(group);
                }
            });

            // Only consider switching if the majority belongs to another group
            if (dominantGroup !== this.groupIndex && maxCount > totalInfluence / 2) {
                const effectiveLoyalty = this.strengthMultiplier
                    ? groupSettings.loyaltyFactor * this.strengthMultiplier
                    : groupSettings.loyaltyFactor;

                const switchProbability = groupSettings.peerPressure * (1 - (this.timeFrozen ? 0.2 : effectiveLoyalty));

                if (Math.random() < switchProbability) {
                    this.groupIndex = dominantGroup;
                    this.color = this.colors[this.groupIndex];
                }
            }
        } catch (error) {
            console.error('Error in considerGroupSwitch:', error);
        }
    }

    findNearbyBoids(quadtreeOrBoids, radius) {
        if (Array.isArray(quadtreeOrBoids)) {
            return quadtreeOrBoids.filter(other =>
                other !== this &&
                Math.hypot(other.position.x - this.position.x, other.position.y - this.position.y) < radius
            );
        }

        // Handle case where quadtree is null/undefined
        if (!quadtreeOrBoids || typeof quadtreeOrBoids.query !== 'function') {
            return [];
        }

        const range = {
            x: this.position.x - radius,
            y: this.position.y - radius,
            width: radius * 2,
            height: radius * 2
        };

        const found = quadtreeOrBoids.query(range);
        return found.filter(other => other !== this);
    }

    findGroupMates(nearbyBoids) {
        return nearbyBoids.filter(other => other.groupIndex === this.groupIndex);
    }

    separate(quadtreeOrBoids, desiredSeparation) {
        const nearbyBoids = this.findNearbyBoids(quadtreeOrBoids, desiredSeparation);
        const steer = { x: 0, y: 0 };

        if (nearbyBoids.length === 0) return steer;

        let count = 0;
        for (const other of nearbyBoids) {
            const dx = this.position.x - other.position.x;
            const dy = this.position.y - other.position.y;
            const distance = Math.hypot(dx, dy);

            if (distance < desiredSeparation) {
                const force = (1 - distance / desiredSeparation);
                steer.x += (dx / distance) * force;
                steer.y += (dy / distance) * force;
                count++;
            }
        }

        if (count > 0) {
            steer.x /= count;
            steer.y /= count;
            // Scale by maxForce after averaging
            const magnitude = Math.hypot(steer.x, steer.y);
            if (magnitude > 0) {
                steer.x = (steer.x / magnitude) * this.maxForce;
                steer.y = (steer.y / magnitude) * this.maxForce;
            }
        }

        return steer;
    }

    align(quadtreeOrBoids, neighborDist) {
        const nearbyBoids = this.findNearbyBoids(quadtreeOrBoids, neighborDist);
        const groupMates = this.findGroupMates(nearbyBoids);
        const steer = { x: 0, y: 0 };

        if (groupMates.length === 0) return steer;

        for (const other of groupMates) {
            steer.x += other.velocity.x;
            steer.y += other.velocity.y;
        }

        steer.x /= groupMates.length;
        steer.y /= groupMates.length;

        const magnitude = Math.hypot(steer.x, steer.y);
        if (magnitude > 0) {
            steer.x = (steer.x / magnitude) * this.maxForce;
            steer.y = (steer.y / magnitude) * this.maxForce;
        }

        return steer;
    }

    cohesion(quadtreeOrBoids, neighborDist) {
        const nearbyBoids = this.findNearbyBoids(quadtreeOrBoids, neighborDist);
        const groupMates = this.findGroupMates(nearbyBoids);
        const steer = { x: 0, y: 0 };

        if (groupMates.length === 0) return steer;

        let centerX = 0, centerY = 0;
        for (const other of groupMates) {
            centerX += other.position.x;
            centerY += other.position.y;
        }

        centerX /= groupMates.length;
        centerY /= groupMates.length;

        const dx = centerX - this.position.x;
        const dy = centerY - this.position.y;
        const magnitude = Math.hypot(dx, dy);

        if (magnitude > 0) {
            steer.x = (dx / magnitude) * this.maxForce;
            steer.y = (dy / magnitude) * this.maxForce;
        }

        return steer;
    }

    groupRepulsion(quadtreeOrBoids, neighborDist) {
        const nearbyBoids = this.findNearbyBoids(quadtreeOrBoids, neighborDist);
        const otherGroups = nearbyBoids.filter(other => other.groupIndex !== this.groupIndex);
        const steer = { x: 0, y: 0 };

        if (otherGroups.length === 0) return steer;

        for (const other of otherGroups) {
            const dx = this.position.x - other.position.x;
            const dy = this.position.y - other.position.y;
            const distance = Math.hypot(dx, dy);

            if (distance < neighborDist) {
                const force = (1 - distance / neighborDist);
                steer.x += (dx / distance) * force;
                steer.y += (dy / distance) * force;
            }
        }

        const magnitude = Math.hypot(steer.x, steer.y);
        if (magnitude > 0) {
            steer.x = (steer.x / magnitude) * this.maxForce;
            steer.y = (steer.y / magnitude) * this.maxForce;
        }

        return steer;
    }

    mouseRepulsion(mouseSettings) {
        if (!mouseSettings.active) return { x: 0, y: 0 };

        const dx = this.position.x - mouseSettings.position.x;
        const dy = this.position.y - mouseSettings.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseSettings.repulsionRadius) {
            const repulsionStrength = (mouseSettings.repulsionRadius - distance) / mouseSettings.repulsionRadius;
            return {
                x: (dx / distance) * this.maxForce * repulsionStrength,
                y: (dy / distance) * this.maxForce * repulsionStrength
            };
        }

        return { x: 0, y: 0 };
    }
}
