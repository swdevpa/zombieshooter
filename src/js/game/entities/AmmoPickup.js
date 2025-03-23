import * as THREE from 'three';

/**
 * AmmoPickup entity for adding ammo to the player's weapon
 */
export class AmmoPickup {
  /**
   * Create a new ammo pickup
   * @param {Object} params - Initialization parameters
   * @param {THREE.Vector3} params.position - Position in the world
   * @param {number} params.amount - Amount of ammo in the pickup
   * @param {Game} params.game - Game instance
   * @param {AssetLoader} params.assetLoader - Asset loader
   */
  constructor(params) {
    this.position = params.position || new THREE.Vector3(0, 0, 0);
    this.amount = params.amount || 20;
    this.game = params.game;
    this.assetLoader = params.assetLoader;
    
    // Pickup properties
    this.radius = 0.5; // Collision radius
    this.active = true;
    this.respawnTime = 30; // Seconds until respawn
    this.shouldRespawn = true;
    
    // Create mesh
    this.createMesh();
    
    // Add to scene
    if (params.scene) {
      this.addToScene(params.scene);
    }
  }
  
  /**
   * Create the ammo pickup mesh
   */
  createMesh() {
    // Create a container for the pickup
    this.container = new THREE.Group();
    this.container.position.copy(this.position);
    
    // Create the ammo box mesh
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.2);
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x777777,
      metalness: 0.7,
      roughness: 0.3
    });
    this.boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    
    // Create ammo casing meshes
    const bulletGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 8);
    const bulletMaterial = new THREE.MeshStandardMaterial({
      color: 0xccaa00,
      metalness: 0.8,
      roughness: 0.2
    });
    
    // Add several bullet casings
    this.bullets = [];
    for (let i = 0; i < 5; i++) {
      const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
      bullet.rotation.x = Math.PI / 2;
      bullet.position.set(
        (Math.random() - 0.5) * 0.3,
        0.2,
        (Math.random() - 0.5) * 0.1
      );
      this.bullets.push(bullet);
      this.container.add(bullet);
    }
    
    // Add the box to the container
    this.container.add(this.boxMesh);
    
    // Add a floating animation
    this.floatHeight = 0;
    this.rotationSpeed = 1;
  }
  
  /**
   * Add the pickup to a scene
   * @param {THREE.Scene} scene - Scene to add to
   */
  addToScene(scene) {
    if (this.container && !this.container.parent) {
      scene.add(this.container);
    }
  }
  
  /**
   * Remove the pickup from a scene
   * @param {THREE.Scene} scene - Scene to remove from
   */
  removeFromScene(scene) {
    if (this.container && this.container.parent === scene) {
      scene.remove(this.container);
    }
  }
  
  /**
   * Update the pickup
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    if (!this.active || !this.container) return;
    
    // Floating animation
    this.floatHeight += deltaTime * 2;
    this.container.position.y = this.position.y + Math.sin(this.floatHeight) * 0.2;
    
    // Rotation animation
    this.container.rotation.y += deltaTime * this.rotationSpeed;
    
    // Check for player collision
    if (this.game && this.game.player) {
      const playerDistance = this.position.distanceTo(this.game.player.position);
      
      // If player is close enough, pick up the ammo
      if (playerDistance < this.radius + this.game.player.radius) {
        this.pickup();
      }
    }
  }
  
  /**
   * Pick up the ammo
   */
  pickup() {
    if (!this.active) return;
    
    // Add ammo to player's weapon
    if (this.game && this.game.player && this.game.player.weaponManager) {
      const ammoAdded = this.game.player.weaponManager.addAmmo(this.amount);
      
      // If successfully added, deactivate pickup
      if (ammoAdded) {
        this.deactivate();
        
        // Play pickup sound if available
        // this.playPickupSound();
        
        // Schedule respawn if needed
        if (this.shouldRespawn) {
          setTimeout(() => this.respawn(), this.respawnTime * 1000);
        }
      }
    }
  }
  
  /**
   * Deactivate the pickup
   */
  deactivate() {
    this.active = false;
    
    // Hide the mesh
    if (this.container) {
      this.container.visible = false;
    }
  }
  
  /**
   * Respawn the pickup
   */
  respawn() {
    this.active = true;
    
    // Show the mesh
    if (this.container) {
      this.container.visible = true;
    }
  }
  
  /**
   * Reset the pickup to initial state
   */
  reset() {
    this.active = true;
    this.floatHeight = 0;
    
    // Reset position
    if (this.container) {
      this.container.position.copy(this.position);
      this.container.visible = true;
    }
  }
} 