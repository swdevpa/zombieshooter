import { ObjectPool } from '../../utils/ObjectPool.js';
import { Zombie } from './Zombie.js';
import * as THREE from 'three';

/**
 * ZombiePool manages a pool of zombie entities to optimize memory usage and performance
 * by reusing zombie objects instead of creating and destroying them frequently
 */
export class ZombiePool {
  /**
   * Create a new zombie pool
   * @param {Game} game - The game instance
   * @param {AssetLoader} assetLoader - Asset loader for textures
   * @param {number} initialSize - Initial pool size
   */
  constructor(game, assetLoader, initialSize = 20) {
    this.game = game;
    this.assetLoader = assetLoader;
    
    // Track all zombies, including active and inactive ones
    this.zombies = [];
    
    // Create object pool for zombies
    this.pool = new ObjectPool(
      // Factory function to create new zombie
      () => this.createZombie(),
      // Reset function to reset zombie state
      (zombie) => this.resetZombie(zombie),
      // Initial size
      initialSize
    );
  }
  
  /**
   * Get a zombie from the pool
   * @param {THREE.Vector3} position - Spawn position
   * @param {Object} options - Zombie options including type
   * @returns {Zombie} A zombie instance from the pool
   */
  getZombie(position, options = {}) {
    // Get a zombie from the pool
    const zombie = this.pool.get();
    
    // If zombie is undefined, the pool couldn't create a new zombie
    if (!zombie) {
      console.error('Failed to get zombie from pool');
      return null;
    }
    
    // Initialize zombie at the given position with options
    this.initializeZombie(zombie, position, options);
    
    // Add to scene if needed
    if (!zombie.container.parent && this.game.scene) {
      this.game.scene.add(zombie.container);
    }
    
    return zombie;
  }
  
  /**
   * Return a zombie to the pool
   * @param {Zombie} zombie - The zombie to release
   */
  releaseZombie(zombie) {
    // Basic validation
    if (!zombie || !zombie.isActive) return;
    
    // Hide from scene
    if (zombie.container.parent) {
      zombie.container.parent.remove(zombie.container);
    }
    
    // Return to pool
    this.pool.release(zombie);
  }
  
  /**
   * Create a new zombie object
   * @returns {Zombie} A new zombie instance
   * @private
   */
  createZombie() {
    // Create a zombie that's not yet initialized
    // Using dummy position that will be overridden when the zombie is activated
    const dummyPosition = new THREE.Vector3(0, 0, 0);
    
    // Create zombie without adding to scene yet
    const zombie = new Zombie(this.game, this.assetLoader, dummyPosition, {
      addToScene: false // Don't add to scene yet
    });
    
    // Set initial state as inactive
    zombie.isActive = false;
    
    // Add to tracking
    this.zombies.push(zombie);
    
    return zombie;
  }
  
  /**
   * Reset a zombie for reuse
   * @param {Zombie} zombie - The zombie to reset
   * @private
   */
  resetZombie(zombie) {
    // Reset health, state, and behavior
    zombie.health = 0;
    zombie.isAlive = false;
    zombie.isActive = false;
    
    // Reset visibility
    zombie.container.visible = false;
    
    // Clear pathfinding data
    if (zombie.pathfinding) {
      zombie.pathfinding.path = [];
      zombie.pathfinding.currentPathIndex = 0;
      zombie.pathfinding.pathNeedsUpdate = true;
    }
    
    // Reset animation state
    if (zombie.animation) {
      zombie.animation.currentState = 'idle';
    }
    
    // Move far away (useful for ensuring it's outside player's view)
    zombie.container.position.set(1000, 1000, 1000);
  }
  
  /**
   * Initialize a zombie with specific parameters
   * @param {Zombie} zombie - Zombie to initialize
   * @param {THREE.Vector3} position - Spawn position
   * @param {Object} options - Zombie options including type
   * @private
   */
  initializeZombie(zombie, position, options = {}) {
    // Ensure position is a Vector3
    const pos = position instanceof THREE.Vector3 
      ? position 
      : new THREE.Vector3(position.x || 0, position.y || 0, position.z || 0);
    
    // Reset position to spawn point
    zombie.container.position.copy(pos);
    
    // Set zombie type
    zombie.type = options.type || 'standard';
    
    // Initialize health based on type
    switch (zombie.type) {
      case 'runner':
        zombie.maxHealth = 80;
        zombie.speed = 2.5;
        break;
      case 'brute':
        zombie.maxHealth = 250;
        zombie.speed = 0.8;
        break;
      case 'exploder':
        zombie.maxHealth = 100;
        zombie.speed = 1.5;
        break;
      case 'spitter':
        zombie.maxHealth = 120;
        zombie.speed = 1.2;
        break;
      case 'screamer':
        zombie.maxHealth = 150;
        zombie.speed = 1.0;
        break;
      default: // standard
        zombie.maxHealth = 100;
        zombie.speed = 1.0;
    }
    
    // Set current health to maximum
    zombie.health = zombie.maxHealth;
    
    // Mark as alive and active
    zombie.isAlive = true;
    zombie.isActive = true;
    zombie.container.visible = true;
    
    // Apply any additional options
    if (options.health) zombie.health = options.health;
    if (options.speed) zombie.speed = options.speed;
    
    // Reset animation to appropriate state
    if (zombie.animation) {
      zombie.animation.play('spawn', { crossFade: 0.2 });
      
      // Queue walking animation after spawn
      setTimeout(() => {
        if (zombie.isAlive) {
          zombie.animation.play('walk', { crossFade: 0.5 });
        }
      }, 1200);
    }
  }
  
  /**
   * Get all active zombies
   * @returns {Array} Array of active zombie instances
   */
  getActiveZombies() {
    return this.pool.getActiveObjects();
  }
  
  /**
   * Get the count of active zombies
   * @returns {number} Count of active zombies
   */
  getActiveCount() {
    return this.pool.activeObjects.size;
  }
  
  /**
   * Release all zombies back to the pool
   */
  releaseAll() {
    this.pool.releaseAll();
  }
  
  /**
   * Update all active zombies
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    // Get active zombies
    const activeZombies = this.getActiveZombies();
    
    // Update each active zombie
    for (const zombie of activeZombies) {
      // Check if zombie is dead but not yet released
      if (!zombie.isAlive && zombie.isActive) {
        // Allow death animation to play before releasing
        if (zombie.timeSinceDeath === undefined) {
          zombie.timeSinceDeath = 0;
        } else {
          zombie.timeSinceDeath += deltaTime;
          
          // Release after 3 seconds to allow animation and effects to complete
          if (zombie.timeSinceDeath > 3) {
            this.releaseZombie(zombie);
          }
        }
      } else if (zombie.isActive) {
        // Normal update for active zombies
        zombie.update(deltaTime);
      }
    }
  }
} 