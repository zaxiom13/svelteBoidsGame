class Quadtree {
    constructor(bounds, capacity) {
        this.bounds = bounds;
        this.capacity = capacity;
        this.boids = [];
        this.divided = false;
        this.isDirty = false;
    }

    clear() {
        this.boids = [];
        if (this.divided) {
            this.northwest = null;
            this.northeast = null;
            this.southwest = null;
            this.southeast = null;
            this.divided = false;
        }
    }

    subdivide() {
        if (this.divided) return;
        
        const { x, y, width, height } = this.bounds;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        
        this.northwest = new Quadtree(
            { x, y, width: halfWidth, height: halfHeight },
            this.capacity
        );
        this.northeast = new Quadtree(
            { x: x + halfWidth, y, width: halfWidth, height: halfHeight },
            this.capacity
        );
        this.southwest = new Quadtree(
            { x, y: y + halfHeight, width: halfWidth, height: halfHeight },
            this.capacity
        );
        this.southeast = new Quadtree(
            { x: x + halfWidth, y: y + halfHeight, width: halfWidth, height: halfHeight },
            this.capacity
        );
        
        this.divided = true;
        
        // Redistribute existing boids
        const currentBoids = [...this.boids];
        this.boids = [];
        
        for (const boid of currentBoids) {
            const quadrant = this.getQuadrant(boid);
            this[quadrant].insert(boid);
        }
    }

    getQuadrant(boid) {
        const { x, y, width, height } = this.bounds;
        const midX = x + width / 2;
        const midY = y + height / 2;
        const pos = boid.position;

        if (pos.x < midX) {
            if (pos.y < midY) return 'northwest';
            return 'southwest';
        } else {
            if (pos.y < midY) return 'northeast';
            return 'southeast';
        }
    }

    insertIntoChildren(boid) {
        const quadrant = this.getQuadrant(boid);
        return this[quadrant].insert(boid);
    }

    insert(boid) {
        if (!this.boundsContain(boid.position)) {
            return false;
        }

        if (!this.divided) {
            if (this.boids.length < this.capacity) {
                this.boids.push(boid);
                return true;
            }
            this.subdivide();
        }

        return this.insertIntoChildren(boid);
    }

    query(range, found = []) {
        if (!this.boundsIntersect(range)) {
            return found;
        }

        for (const boid of this.boids) {
            if (this.rangeContains(range, boid.position)) {
                found.push(boid);
            }
        }

        if (this.divided) {
            this.northwest.query(range, found);
            this.northeast.query(range, found);
            this.southwest.query(range, found);
            this.southeast.query(range, found);
        }

        return found;
    }

    boundsContain(point) {
        return (
            point.x >= this.bounds.x &&
            point.x < this.bounds.x + this.bounds.width &&
            point.y >= this.bounds.y &&
            point.y < this.bounds.y + this.bounds.height
        );
    }

    boundsIntersect(range) {
        return !(
            range.x >= this.bounds.x + this.bounds.width ||
            range.x + range.width <= this.bounds.x ||
            range.y >= this.bounds.y + this.bounds.height ||
            range.y + range.height <= this.bounds.y
        );
    }

    rangeContains(range, point) {
        return (
            point.x >= range.x &&
            point.x < range.x + range.width &&
            point.y >= range.y &&
            point.y < range.y + range.height
        );
    }

    update(boids) {
        // Always do a full rebuild to ensure consistency
        this.clear();
        
        for (const boid of boids) {
            this.insert(boid);
        }
    }
}

export { Quadtree };
