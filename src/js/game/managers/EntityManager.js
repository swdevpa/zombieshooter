import { AmmoPickup } from '../entities/AmmoPickup.js';
import * as THREE from 'three';

/**
 * Manages game entities like pickups, obstacles, etc.
 */
export class EntityManager {
  /**
   * Create a new entity manager
   * @param {Game} game - Game instance
   */
  constructor(game) {
    this.game = game;
    
    // Entity collections
    this.entities = [];
    this.pickups = [];
    
    // Scene reference
    this.scene = game ? game.scene : null;
  }
  
  /**
   * Initialize the entity manager
   */
  init() {
    // Initialize collections
    this.entities = [];
    this.pickups = [];
    
    return this;
  }
  
  /**
   * Update all entities
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    // Update all entities
    this.entities.forEach(entity => {
      if (entity.update) {
        entity.update(deltaTime);
      }
    });
    
    // Update pickups
    this.pickups.forEach(pickup => {
      if (pickup.update) {
        pickup.update(deltaTime);
      }
    });
  }
  
  /**
   * Create an ammo pickup
   * @param {THREE.Vector3} position - Position for the pickup
   * @param {number} amount - Amount of ammo
   * @returns {AmmoPickup} The created ammo pickup
   */
  createAmmoPickup(position, amount = 20) {
    const pickup = new AmmoPickup({
      position: position || new THREE.Vector3(0, 0.5, 0),
      amount: amount,
      game: this.game,
      assetLoader: this.game ? this.game.assetLoader : null,
      scene: this.scene
    });
    
    // Add to collection
    this.pickups.push(pickup);
    
    return pickup;
  }
  
  /**
   * Spawn random ammo pickups in the city
   * @param {number} count - Number of pickups to spawn
   */
  spawnAmmoPickups(count = 5) {
    // Clear existing pickups
    this.removeAllPickups();
    
    // If no city exists, can't spawn
    if (!this.game.levelManager || !this.game.levelManager.city) {
      console.warn('Cannot spawn ammo pickups: No city found');
      return;
    }
    
    const city = this.game.levelManager.city;
    const citySize = city.size || 100;
    const maxTries = count * 3;
    let pickupsCreated = 0;
    let tryCount = 0;
    
    // Try to create requested amount of pickups
    while (pickupsCreated < count && tryCount < maxTries) {
      tryCount++;
      
      // Generate random position within city
      const x = (Math.random() - 0.5) * citySize;
      const z = (Math.random() - 0.5) * citySize;
      
      // Use raycasting to find the ground position
      const raycaster = new THREE.Raycaster();
      raycaster.set(
        new THREE.Vector3(x, 50, z), // Start high above
        new THREE.Vector3(0, -1, 0)  // Cast downward
      );
      
      // Check for ground intersection
      const intersects = raycaster.intersectObjects(this.scene.children, true);
      if (intersects.length > 0) {
        // Found a valid position - place pickup slightly above ground
        const position = new THREE.Vector3(x, intersects[0].point.y + 0.5, z);
        
        // Check if too close to a building or other obstacle
        if (!this.isPositionValid(position)) {
          continue;
        }
        
        // Create pickup
        this.createAmmoPickup(position, 20 + Math.floor(Math.random() * 20));
        pickupsCreated++;
      }
    }
    
    console.log(`Created ${pickupsCreated} ammo pickups`);
  }
  
  /**
   * Check if a position is valid for a pickup (not inside a building)
   * @param {THREE.Vector3} position - Position to check
   * @returns {boolean} Whether the position is valid
   */
  isPositionValid(position) {
    // No game or city, consider position valid
    if (!this.game || !this.game.levelManager || !this.game.levelManager.city) {
      return true;
    }
    
    // Check if inside any building
    const buildings = this.game.levelManager.city.buildings || [];
    for (const building of buildings) {
      if (building.containsPoint && building.containsPoint(position)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Remove all pickups
   */
  removeAllPickups() {
    // Remove pickups from scene
    this.pickups.forEach(pickup => {
      if (pickup.removeFromScene && this.scene) {
        pickup.removeFromScene(this.scene);
      }
    });
    
    // Clear array
    this.pickups = [];
  }
  
  /**
   * Reset all entities
   */
  reset() {
    // Reset all entities
    this.entities.forEach(entity => {
      if (entity.reset) {
        entity.reset();
      }
    });
    
    // Reset all pickups
    this.pickups.forEach(pickup => {
      if (pickup.reset) {
        pickup.reset();
      }
    });
  }
} 