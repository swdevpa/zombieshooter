/**
 * Object pooling utility for efficiently reusing frequently created/destroyed objects
 * This helps reduce garbage collection and improve performance
 */
export class ObjectPool {
  /**
   * Create a new object pool
   * @param {Function} createFn - Factory function to create new objects
   * @param {Function} resetFn - Function to reset objects before reuse
   * @param {number} initialSize - Initial pool size
   */
  constructor(createFn, resetFn = null, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.activeObjects = new Set();
    
    // Pre-populate the pool
    this.expand(initialSize);
  }

  /**
   * Expand the pool by creating new objects
   * @param {number} count - Number of objects to add
   */
  expand(count) {
    for (let i = 0; i < count; i++) {
      const obj = this.createFn();
      obj.isActive = false;
      this.pool.push(obj);
    }
  }

  /**
   * Get an object from the pool
   * @param {Function} setupFn - Function to set up the object
   * @returns {Object} The activated object
   */
  get(setupFn = null) {
    // Find an inactive object in the pool
    let obj = this.pool.find(obj => !obj.isActive);
    
    // If no inactive objects, expand the pool
    if (!obj) {
      this.expand(Math.ceil(this.pool.length * 0.5)); // Expand by 50%
      obj = this.pool.find(obj => !obj.isActive);
    }
    
    // Mark as active
    obj.isActive = true;
    this.activeObjects.add(obj);
    
    // Set up the object if a setup function was provided
    if (setupFn) {
      setupFn(obj);
    }
    
    return obj;
  }

  /**
   * Return an object to the pool
   * @param {Object} obj - The object to return
   */
  release(obj) {
    if (this.activeObjects.has(obj)) {
      obj.isActive = false;
      this.activeObjects.delete(obj);
      
      // Call the reset function if provided
      if (this.resetFn) {
        this.resetFn(obj);
      } else if (typeof obj.reset === 'function') {
        // Fallback to object's reset method
        obj.reset();
      }
    }
  }

  /**
   * Release all active objects
   */
  releaseAll() {
    this.activeObjects.forEach(obj => {
      obj.isActive = false;
      
      // Call the reset function if provided
      if (this.resetFn) {
        this.resetFn(obj);
      } else if (typeof obj.reset === 'function') {
        // Fallback to object's reset method
        obj.reset();
      }
    });
    
    this.activeObjects.clear();
  }

  /**
   * Get a list of all active objects
   * @returns {Array} Array of active objects
   */
  getActiveObjects() {
    return Array.from(this.activeObjects);
  }

  /**
   * Get the number of active objects
   * @returns {number} Count of active objects
   */
  getActiveCount() {
    return this.activeObjects.size;
  }

  /**
   * Get the total pool size
   * @returns {number} Total pool size
   */
  getTotalCount() {
    return this.pool.length;
  }
}
