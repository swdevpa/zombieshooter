import * as THREE from 'three';
import { Bullet } from './Bullet.js';
import { ObjectPool } from 'utils/ObjectPool.js';

/**
 * Base weapon class
 */
export class Weapon {
  /**
   * Create a new weapon
   * @param {Player} player - The player using this weapon
   * @param {AssetLoader} assetLoader - Asset loader instance
   */
  constructor(player, assetLoader) {
    this.player = player;
    this.game = player ? player.game : null;
    this.assetLoader = assetLoader;
    
    // Set default weapon properties
    this.name = 'Base Weapon';
    this.type = 'weapon';
    this.damage = 10;
    this.fireRate = 0.5; // Seconds between shots
    this.reloadTime = 2.0; // Seconds to reload
    this.ammoCapacity = 30;
    this.maxAmmo = this.ammoCapacity;
    this.currentAmmo = this.ammoCapacity;
    
    // Reserve ammo properties
    this.maxReserveAmmo = 90;
    this.reserveAmmo = this.maxReserveAmmo;
    this.reserveAmmoPerMag = 30; // How much reserve ammo counts as one magazine
    
    this.range = 30; // Maximum effective range
    this.spread = 0.01; // Bullet spread factor
    this.isReloading = false;
    this.lastFireTime = 0;
    
    // Create a container for the weapon
    this.container = new THREE.Group();
    
    // Create basic weapon mesh
    this.createMesh();
    
    // Configure raycaster for hit detection
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = this.range;
    
    // Track hit markers for cleanup
    this.hitMarkers = [];
    
    // Animation state
    this.animationState = {
      idle: false,
      shooting: false,
      reloading: false
    };

    // Enhanced reload animation system
    this.reloadAnimationSystem = {
      active: false,
      startTime: 0,
      duration: this.reloadTime * 1000, // Convert to milliseconds
      progress: 0,
      phase: 0,
      phases: [
        { name: 'start', duration: 0.2 }, // Start animation (lower weapon)
        { name: 'ejectMag', duration: 0.3 }, // Eject magazine
        { name: 'insertMag', duration: 0.3 }, // Insert new magazine
        { name: 'chamberRound', duration: 0.2 } // Chamber round and return to position
      ]
    };
  }
  
  /**
   * Initialize object pool for bullets
   */
  initBulletPool() {
    // Create a pool of bullets to reuse
    this.bulletPool = new ObjectPool(
      () => new Bullet(this.damage, this.assetLoader),
      bullet => bullet.reset(),
      10 // Initial pool size
    );
  }
  
  /**
   * Add weapon to scene
   * @param {Scene} scene - Three.js scene
   */
  addToScene(scene) {
    scene.add(this.container);
  }
  
  /**
   * Remove weapon from scene
   * @param {Scene} scene - Three.js scene
   */
  removeFromScene(scene) {
    scene.remove(this.container);
  }
  
  /**
   * Create basic weapon mesh
   * Override in specific weapon implementations
   */
  createMesh() {
    // Basic weapon mesh (placeholder)
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
    const material = new THREE.MeshBasicMaterial({ color: 0x555555 });
    this.mesh = new THREE.Mesh(geometry, material);
    
    // Position for First-Person view
    this.mesh.position.set(0.3, -0.3, -0.5);
    this.mesh.rotation.set(0, Math.PI / 2, 0);
    
    this.container.add(this.mesh);
  }
  
  /**
   * Update the weapon
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    // Update bullets from the pool that are active
    if (this.bulletPool) {
      this.bulletPool.getActiveObjects().forEach(bullet => {
        bullet.update(deltaTime);
      });
    }
    
    // Update weapon specific animations and effects
    this.updateWeaponState(deltaTime);
    
    // Clean up hit markers that have faded
    this.cleanupHitMarkers();
  }
  
  /**
   * Update weapon state and animations
   * Override in specific weapon implementations for custom animations
   * @param {number} deltaTime - Time since last update
   */
  updateWeaponState(deltaTime) {
    // Basic weapon idle animation
    if (this.animationState.idle && !this.animationState.shooting && !this.animationState.reloading) {
      // Simple idle bobbing animation
      if (this.mesh) {
        const time = Date.now() * 0.001;
        const amplitude = 0.003;
        this.mesh.position.y = -0.3 + Math.sin(time) * amplitude;
      }
    }

    // Update reload animation if active
    if (this.reloadAnimationSystem.active) {
      this.updateReloadAnimation();
    }
  }
  
  /**
   * Fire the weapon
   * @returns {boolean} Whether the shot was fired
   */
  shoot() {
    // Check if we can shoot
    const now = Date.now() / 1000; // Current time in seconds
    if (
      this.isReloading ||
      now - this.lastFireTime < this.fireRate ||
      this.currentAmmo <= 0
    ) {
      if (this.currentAmmo <= 0) {
        // Auto-reload when empty
        this.reload();
      }
      return false;
    }
    
    // Update last fire time
    this.lastFireTime = now;
    
    // Decrease ammo
    this.currentAmmo--;
    
    // Show muzzle flash
    this.showMuzzleFlash();
    
    // Play recoil animation
    this.playRecoilAnimation();
    
    // Perform raycast to check for immediate hits
    const hit = this.performRaycastShot();
    
    // If we're not using the raycast shot or it didn't hit anything, create a visible bullet
    if (!hit) {
      this.createBullet();
    }
    
    return true;
  }
  
  /**
   * Create a visible bullet
   */
  createBullet() {
    if (!this.bulletPool) return;
    
    // Get bullet from pool
    const bullet = this.bulletPool.get();
    
    // Calculate direction with spread
    const direction = new THREE.Vector3(0, 0, -1);
    
    // Add random spread to direction
    const spread = this.spread;
    direction.x += (Math.random() - 0.5) * spread * 2;
    direction.y += (Math.random() - 0.5) * spread * 2;
    
    // Transform direction to world space
    const worldDirection = direction.clone();
    this.container.getWorldQuaternion(new THREE.Quaternion()).multiply(
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0))
    ).multiply(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), worldDirection)
    );
    
    // Get world position of weapon muzzle
    const muzzlePosition = new THREE.Vector3();
    if (this.barrel) {
      // If we have a barrel, use its world position for muzzle
      this.barrel.getWorldPosition(muzzlePosition);
      // Move position slightly forward from barrel
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.barrel.getWorldQuaternion(new THREE.Quaternion()));
      muzzlePosition.add(forward.multiplyScalar(0.25));
    } else {
      // Fallback to weapon position
      this.container.getWorldPosition(muzzlePosition);
      muzzlePosition.z -= 0.5; // Move forward from weapon
    }
    
    // Initialize bullet
    bullet.init(
      muzzlePosition,
      direction.normalize(),
      this.container.getWorldQuaternion(new THREE.Quaternion()),
      this.game ? this.game.scene : null,
      this.game ? this.game.zombies : [],
      this.game ? this.game.environmentObjects : []
    );
  }
  
  /**
   * Perform raycast shooting
   * @returns {boolean} Whether the raycast hit something
   */
  performRaycastShot() {
    // Check if game and camera exist
    if (!this.game || !this.game.camera) return false;
    
    // Get camera direction
    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(this.game.camera.quaternion);
    
    // Add spread to direction
    const spread = this.spread;
    cameraDirection.x += (Math.random() - 0.5) * spread * 2;
    cameraDirection.y += (Math.random() - 0.5) * spread * 2;
    cameraDirection.z += (Math.random() - 0.5) * spread * 2;
    cameraDirection.normalize();
    
    // Set raycast origin to camera position
    this.raycaster.set(this.game.camera.position.clone(), cameraDirection);
    
    // Get all objects in the scene
    const objects = [];
    this.game.scene.traverse((object) => {
      if (object.isMesh && object !== this.mesh) {
        objects.push(object);
      }
    });
    
    // Find intersections
    const intersects = this.raycaster.intersectObjects(objects, true);
    
    if (intersects.length > 0) {
      // Get first intersection
      const intersection = intersects[0];
      const object = intersection.object;
      
      // Hit position and normal
      const position = intersection.point.clone();
      const normal = intersection.face ? intersection.face.normal.clone() : new THREE.Vector3(0, 1, 0);
      
      // Transform normal from object to world space
      normal.transformDirection(object.matrixWorld);
      
      // Find zombie parent of hit object
      let zombieObject = null;
      let currentObject = object;
      
      // Traverse up parent hierarchy to find a zombie
      while (currentObject) {
        if (currentObject.userData && currentObject.userData.zombieRef) {
          zombieObject = currentObject.userData.zombieRef;
          break;
        }
        
        // Try parent
        currentObject = currentObject.parent;
      }
      
      if (zombieObject) {
        // We hit a zombie!
        
        // Determine hit zone based on the object that was hit
        let hitZone = 'torso'; // Default hit zone
        
        // Check object name for hit zone hints
        const objectName = object.name.toLowerCase();
        if (objectName.includes('head')) {
          hitZone = 'head';
        } else if (objectName.includes('arm') || objectName.includes('leg') || 
                  objectName.includes('hand') || objectName.includes('foot')) {
          hitZone = 'limb';
        }
        
        // Use DamageManager if available
        if (this.game.damageManager) {
          // Process the hit through the damage manager
          this.game.damageManager.processWeaponDamage(
            this, // weapon
            zombieObject, // target
            {
              hitZone: hitZone,
              hitPosition: position,
              hitNormal: normal
            }
          );
        } else if (this.game.zombieManager) {
          // Fallback to ZombieManager if available
          this.game.zombieManager.processZombieDamage(
            zombieObject,
            this,
            {
              hitZone: hitZone,
              hitPosition: position,
              isCritical: hitZone === 'head' ? Math.random() < 0.5 : Math.random() < 0.05
            }
          );
        } else {
          // Direct damage application fallback
          const isCritical = hitZone === 'head' ? Math.random() < 0.5 : Math.random() < 0.05;
          
          zombieObject.takeDamage(this.damage, {
            hitZone,
            isCritical,
            damageSource: 'player'
          });
          
          // Create hit effect
          this.createHitEffect(position, normal, true);
        }
        
        return true;
      } else {
        // We hit an environment object, create hit effect
        this.createHitEffect(position, normal, false);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Create visual hit effect
   * @param {Vector3} position - World position of hit
   * @param {Vector3} normal - Surface normal at hit point
   * @param {boolean} isZombie - Whether hit was on a zombie
   */
  createHitEffect(position, normal, isZombie) {
    if (!this.game || !this.game.scene) return;
    
    if (isZombie) {
      // Blood splatter effect for zombies
      const bloodMaterial = new THREE.SpriteMaterial({
        map: this.assetLoader.getTexture('blood') || new THREE.TextureLoader().load('../assets/textures/blood.png'),
        color: 0xff0000,
        transparent: true,
        opacity: 0.9
      });
      
      const blood = new THREE.Sprite(bloodMaterial);
      blood.scale.set(0.5, 0.5, 1);
      blood.position.copy(position);
      
      // Add slight offset along normal to prevent z-fighting
      blood.position.add(normal.clone().multiplyScalar(0.05));
      
      // Random rotation
      blood.material.rotation = Math.random() * Math.PI * 2;
      
      // Random scale variation
      const scale = 0.3 + Math.random() * 0.4;
      blood.scale.set(scale, scale, 1);
      
      // Add to scene
      this.game.scene.add(blood);
      
      // Track for cleanup
      this.hitMarkers.push({
        marker: blood,
        createdAt: Date.now(),
        lifetime: 2000 + Math.random() * 1000 // 2-3 seconds
      });
      
    } else {
      // Impact effect for environment (smoke, sparks)
      const impactMaterial = new THREE.SpriteMaterial({
        map: this.assetLoader.getTexture('impact') || new THREE.TextureLoader().load('../assets/textures/impact.png'),
        color: 0xdddddd,
        transparent: true,
        opacity: 0.8
      });
      
      const impact = new THREE.Sprite(impactMaterial);
      impact.scale.set(0.2, 0.2, 1);
      impact.position.copy(position);
      
      // Add slight offset along normal to prevent z-fighting
      impact.position.add(normal.clone().multiplyScalar(0.01));
      
      // Random rotation
      impact.material.rotation = Math.random() * Math.PI * 2;
      
      // Add to scene
      this.game.scene.add(impact);
      
      // Track for cleanup
      this.hitMarkers.push({
        marker: impact,
        createdAt: Date.now(),
        lifetime: 1000 + Math.random() * 500 // 1-1.5 seconds
      });
    }
  }
  
  /**
   * Clean up hit markers
   */
  cleanupHitMarkers() {
    const now = Date.now();
    const markersToRemove = [];
    
    // Find markers to remove
    for (let i = 0; i < this.hitMarkers.length; i++) {
      const marker = this.hitMarkers[i];
      const age = now - marker.createdAt;
      
      if (age > marker.lifetime) {
        markersToRemove.push(i);
        
        // Fade out effect
        if (marker.marker.material) {
          marker.marker.material.opacity = Math.max(0, 1 - (age / marker.lifetime));
        }
      }
    }
    
    // Remove markers from scene and array (backwards to not affect indices)
    for (let i = markersToRemove.length - 1; i >= 0; i--) {
      const index = markersToRemove[i];
      const marker = this.hitMarkers[index];
      
      if (marker.marker && this.game && this.game.scene) {
        this.game.scene.remove(marker.marker);
        
        // Dispose of geometry and material to prevent memory leaks
        if (marker.marker.geometry) marker.marker.geometry.dispose();
        if (marker.marker.material) marker.marker.material.dispose();
      }
      
      this.hitMarkers.splice(index, 1);
    }
  }
  
  /**
   * Show muzzle flash effect
   */
  showMuzzleFlash() {
    if (this.muzzleFlash) {
      this.muzzleFlash.visible = true;
      
      // Random flicker effect
      this.muzzleFlash.intensity = 2 + Math.random() * 1;
      
      // Hide after short delay
      setTimeout(() => {
        if (this.muzzleFlash) {
          this.muzzleFlash.visible = false;
        }
      }, 50);
    }
  }
  
  /**
   * Play recoil animation
   * Override in specific weapon implementations
   */
  playRecoilAnimation() {
    if (!this.game.camera) return;
    
    // Add recoil to camera
    this.game.currentRecoil += this.game.recoilAmount;
  }
  
  /**
   * Reload the weapon
   */
  reload() {
    // Don't reload if already reloading
    if (this.isReloading) return;
    
    // Don't reload if ammo is full
    if (this.currentAmmo === this.ammoCapacity) return;
    
    // Don't reload if reserve ammo is empty
    if (this.reserveAmmo <= 0) {
      // Play empty click sound or provide feedback
      if (this.game && this.game.uiManager) {
        this.game.uiManager.showNoAmmoIndicator();
      }
      return;
    }
    
    this.isReloading = true;
    
    // Start reload animation state
    this.animationState.reloading = true;
    this.animationState.idle = false;
    
    // Initialize reload animation system
    this.reloadAnimationSystem.active = true;
    this.reloadAnimationSystem.startTime = Date.now();
    this.reloadAnimationSystem.progress = 0;
    this.reloadAnimationSystem.phase = 0;
    
    // Trigger UI reload animations
    if (this.game && this.game.uiManager) {
      this.game.uiManager.showReloadIndicator();
      this.game.uiManager.animateReloading();
    }
    
    // After reload time, restore ammo from reserve
    setTimeout(() => {
      const ammoNeeded = this.ammoCapacity - this.currentAmmo;
      const ammoAvailable = Math.min(ammoNeeded, this.reserveAmmo);
      
      this.reserveAmmo -= ammoAvailable;
      this.currentAmmo += ammoAvailable;
      
      this.isReloading = false;
      
      // End reload animation state
      this.animationState.reloading = false;
      this.animationState.idle = true;
      this.reloadAnimationSystem.active = false;
      
      // Update UI
      if (this.game && this.game.uiManager) {
        this.game.uiManager.updateAmmo(this.currentAmmo, this.ammoCapacity, this.reserveAmmo);
        this.game.uiManager.hideReloadIndicator();
      }
    }, this.reloadTime * 1000);
  }
  
  /**
   * Position the weapon for first-person view
   * @param {Camera} camera - Three.js camera
   */
  positionForFPV(camera) {
    if (!camera) return;
    
    // Make the weapon follow the camera
    this.container.position.copy(camera.position);
    
    // Apply weapon-specific positioning
    this.updateWeaponPosition(camera);
  }
  
  /**
   * Update weapon position based on player movement and looking
   * @param {Camera} camera - Three.js camera
   */
  updateWeaponPosition(camera) {
    // Base implementation - can be overridden in weapon subclasses
    // This function can be used to add weapon sway, bob, etc.
  }
  
  /**
   * Reset the weapon
   */
  reset() {
    this.currentAmmo = this.ammoCapacity;
    this.reserveAmmo = this.maxReserveAmmo;
    this.isReloading = false;
    this.animationState.reloading = false;
    this.animationState.shooting = false;
    this.animationState.idle = true;
    this.reloadAnimationSystem.active = false;
    
    // Clean up any active hit markers
    this.hitMarkers.forEach(marker => {
      if (marker.parent) {
        marker.parent.remove(marker);
      }
    });
    this.hitMarkers = [];
  }

  /**
   * Update reload animation based on current phase
   * This provides a base implementation that weapons can override or extend
   */
  updateReloadAnimation() {
    if (!this.reloadAnimationSystem.active) return;
    
    const now = Date.now();
    const elapsed = now - this.reloadAnimationSystem.startTime;
    const totalDuration = this.reloadAnimationSystem.duration;
    
    // Calculate overall progress (0 to 1)
    this.reloadAnimationSystem.progress = Math.min(elapsed / totalDuration, 1.0);
    
    // Determine current phase based on progress
    let phaseStartTime = 0;
    let currentPhase = 0;
    let phaseProgress = 0;
    
    // Calculate which phase we're in and the progress within that phase
    for (let i = 0; i < this.reloadAnimationSystem.phases.length; i++) {
      const phase = this.reloadAnimationSystem.phases[i];
      const phaseDuration = phase.duration * totalDuration;
      
      if (elapsed >= phaseStartTime && elapsed < phaseStartTime + phaseDuration) {
        currentPhase = i;
        phaseProgress = (elapsed - phaseStartTime) / phaseDuration;
        break;
      }
      
      phaseStartTime += phaseDuration;
    }
    
    // Update current phase
    this.reloadAnimationSystem.phase = currentPhase;
    
    // Call the appropriate phase update method
    this.updateReloadPhase(currentPhase, phaseProgress);
    
    // Check if reload animation is complete
    if (this.reloadAnimationSystem.progress >= 1.0) {
      // Animation complete, reset properties if needed
      this.finishReloadAnimation();
    }
  }
  
  /**
   * Update a specific reload phase (to be overridden by specific weapons)
   * @param {number} phase - Current reload phase (0-3)
   * @param {number} progress - Progress through the current phase (0-1)
   */
  updateReloadPhase(phase, progress) {
    // Base implementation provides a generic animation
    // Weapon-specific classes should override this for custom animations
    
    switch(phase) {
      case 0: // Start - lower weapon
        this.updateReloadPhaseStart(progress);
        break;
      case 1: // Eject magazine
        this.updateReloadPhaseEject(progress);
        break;
      case 2: // Insert magazine
        this.updateReloadPhaseInsert(progress);
        break;
      case 3: // Chamber round and return
        this.updateReloadPhaseChamber(progress);
        break;
    }
  }
  
  /**
   * Update reload start phase - lower weapon
   * @param {number} progress - Progress through this phase (0-1)
   */
  updateReloadPhaseStart(progress) {
    // Generic implementation - tilt weapon downward
    if (this.mesh) {
      // Tilt down slightly
      this.mesh.rotation.x = progress * 0.3;
      this.mesh.position.y = -0.3 - progress * 0.1;
    }
  }
  
  /**
   * Update reload eject phase - remove magazine
   * @param {number} progress - Progress through this phase (0-1)
   */
  updateReloadPhaseEject(progress) {
    // Generic implementation - no specific animation in base class
    // Keep weapon tilted
    if (this.mesh) {
      this.mesh.rotation.x = 0.3;
      this.mesh.position.y = -0.4;
    }
  }
  
  /**
   * Update reload insert phase - insert new magazine
   * @param {number} progress - Progress through this phase (0-1)
   */
  updateReloadPhaseInsert(progress) {
    // Generic implementation - no specific animation in base class
    // Small weapon movement to simulate handling
    if (this.mesh) {
      const wobble = Math.sin(progress * Math.PI * 2) * 0.02;
      this.mesh.position.y = -0.4 + wobble;
    }
  }
  
  /**
   * Update reload chamber phase - chamber round and return to position
   * @param {number} progress - Progress through this phase (0-1)
   */
  updateReloadPhaseChamber(progress) {
    // Generic implementation - return to original position
    if (this.mesh) {
      this.mesh.rotation.x = 0.3 * (1 - progress);
      this.mesh.position.y = -0.4 + progress * 0.1;
    }
  }
  
  /**
   * Called when reload animation is finished
   */
  finishReloadAnimation() {
    // Reset weapon position if needed
    if (this.mesh) {
      this.mesh.rotation.x = 0;
      this.mesh.position.y = -0.3;
    }
  }

  /**
   * Add ammo to reserve
   * @param {number} amount - Amount of ammo to add
   * @returns {number} Amount of ammo actually added
   */
  addReserveAmmo(amount) {
    const oldReserveAmmo = this.reserveAmmo;
    this.reserveAmmo = Math.min(this.maxReserveAmmo, this.reserveAmmo + amount);
    
    // Return the amount actually added
    const ammoAdded = this.reserveAmmo - oldReserveAmmo;
    
    // Update UI
    if (this.game && this.game.uiManager) {
      this.game.uiManager.updateAmmo(this.currentAmmo, this.ammoCapacity, this.reserveAmmo);
      
      // Show ammo pickup notification
      if (ammoAdded > 0) {
        this.game.uiManager.showAmmoPickupIndicator(ammoAdded);
      }
    }
    
    return ammoAdded;
  }
}
