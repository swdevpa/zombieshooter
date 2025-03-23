/**
 * Object pooling utility for efficiently reusing frequently created/destroyed objects
 * This helps reduce garbage collection and improve performance
 */
export class ObjectPool {
  /**
   * Create a new object pool
   * @param {Function} factory - Factory function to create new objects
   * @param {Function} reset - Function to reset objects to their initial state
   * @param {number} initialSize - Initial pool size
   */
  constructor(factory, reset, initialSize = 20) {
    this.factory = factory;
    this.reset = reset;
    this.pool = [];
    this.activeObjects = new Set();

    // Initialize pool with initial objects
    this.expand(initialSize);
  }

  /**
   * Get an object from the pool or create a new one if needed
   * @param {...any} args - Arguments to pass to the factory or reset function
   * @returns {Object} The requested object
   */
  get(...args) {
    // Get an available object from the pool or create a new one
    let object;

    if (this.pool.length > 0) {
      object = this.pool.pop();
      this.reset(object, ...args);
    } else {
      object = this.factory(...args);
    }

    // Add to active objects
    this.activeObjects.add(object);

    return object;
  }

  /**
   * Return an object to the pool
   * @param {Object} object - The object to return to the pool
   */
  release(object) {
    if (this.activeObjects.has(object)) {
      this.activeObjects.delete(object);
      this.pool.push(object);
    }
  }

  /**
   * Release all active objects back to the pool
   */
  releaseAll() {
    this.activeObjects.forEach((object) => {
      this.pool.push(object);
    });

    this.activeObjects.clear();
  }

  /**
   * Expand the pool by creating new objects
   * @param {number} count - Number of objects to add to the pool
   */
  expand(count) {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.factory());
    }
  }

  /**
   * Clear the pool and release all resources
   */
  clear() {
    this.pool = [];
    this.activeObjects.clear();
  }

  /**
   * Get the number of available objects in the pool
   * @returns {number} The number of available objects
   */
  get availableCount() {
    return this.pool.length;
  }

  /**
   * Get the number of active objects
   * @returns {number} The number of active objects
   */
  get activeCount() {
    return this.activeObjects.size;
  }

  /**
   * Get the total number of objects (available + active)
   * @returns {number} The total number of objects
   */
  get totalCount() {
    return this.pool.length + this.activeObjects.size;
  }

  /**
   * Get all active objects as an array
   * @returns {Array} Array of active objects
   */
  getActiveObjects() {
    return Array.from(this.activeObjects);
  }
}
