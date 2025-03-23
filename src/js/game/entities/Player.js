import * as THREE from 'three';
import { WeaponManager } from '../managers/WeaponManager.js';

export class Player {
  constructor(game, assetLoader) {
    this.game = game;
    this.assetLoader = assetLoader;

    // Create container for player and weapon
    this.container = new THREE.Group();

    // Player properties
    this.speed = 5; // Increased speed for better FPS feel
    this.health = 100;
    this.maxHealth = 100;
    this.isAlive = true;

    // Direction the player is facing (in radians)
    this.direction = 0;

    // Vertical look angle
    this.verticalLook = 0;

    // Movement
    this.moveDirection = new THREE.Vector2(0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0); // Current velocity for acceleration/deceleration
    this.acceleration = 20; // Increased acceleration for more responsive controls
    this.deceleration = 10; // Deceleration per second

    // Create mesh
    this.createMesh();

    // Create weapon manager
    this.weaponManager = new WeaponManager(this.game, this, this.assetLoader);

    // Set initial position
    this.container.position.set(0, 1, 0);

    // Setup collision detection
    this.setupCollision();
  }

  init() {
    // Initialize the player
    console.log('Initializing player');
    
    // Initialize weapon manager if not already done
    if (this.weaponManager) {
      this.weaponManager.init();
    }
    
    return this;
  }

  /**
   * Sets the position of the player
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate 
   * @param {number} z - Z coordinate
   */
  setPosition(x, y, z) {
    this.container.position.set(x, y, z);
  }

  createMesh() {
    // In first-person mode, we don't need to render the player's mesh
    // but we'll create a very simple one for debugging and potential third-person view

    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2288ff,
      roughness: 0.7,
      metalness: 0.3,
    });

    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 0.6; // Half of the body height
    this.body.castShadow = true;

    // Create a head mesh
    const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa88,
      roughness: 0.7,
      metalness: 0.1,
    });

    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.y = 1.4; // Body height + half of head height
    this.head.castShadow = true;

    // Add parts to the group
    this.mesh = new THREE.Group();
    this.mesh.add(this.body);
    this.mesh.add(this.head);

    // Add mesh to container
    this.container.add(this.mesh);

    // Hide mesh in first-person mode
    this.mesh.visible = false;
  }

  setupCollision() {
    // Create collision body for the player
    this.collisionRadius = 0.3; // Player collision radius

    // Create collision geometry for visualization (debug only)
    const collisionGeometry = new THREE.SphereGeometry(this.collisionRadius, 8, 8);
    const collisionMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });

    this.collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
    this.collisionMesh.position.y = 1; // Position at player's center
    this.container.add(this.collisionMesh);

    // Hide collision mesh by default - only for debugging
    this.collisionMesh.visible = false;
    
    // Collision flags
    this.isColliding = false;
    this.lastCollisionObject = null;
  }

  update(deltaTime) {
    if (!this.isAlive) return;

    // Update movement
    this.updateMovement(deltaTime);

    // Update weapon manager
    if (this.weaponManager) {
      this.weaponManager.update(deltaTime);
    }

    // Update the player direction based on camera rotation
    if (this.game.camera) {
      // Extract the y-rotation from camera quaternion
      const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(
        this.game.camera.quaternion
      );
      cameraDirection.y = 0; // Ignore vertical component
      cameraDirection.normalize();

      this.direction = Math.atan2(cameraDirection.x, cameraDirection.z);
      this.container.rotation.y = this.direction;

      // Extract vertical look angle from camera
      this.verticalLook = this.game.camera.rotation.x;
    }
  }

  updateMovement(deltaTime) {
    // Handle movement relative to camera direction
    if (this.moveDirection.x !== 0 || this.moveDirection.y !== 0) {
      // Get camera look direction (ignoring vertical component)
      const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(
        this.game.camera.quaternion
      );
      cameraDirection.y = 0;
      cameraDirection.normalize();

      // Get right vector from camera (perpendicular to look direction)
      const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.game.camera.quaternion);
      cameraRight.y = 0;
      cameraRight.normalize();

      // Calculate movement direction in world space
      const moveX = this.moveDirection.x;
      const moveZ = this.moveDirection.y;

      // Create acceleration vector based on camera orientation
      let accelerationVector = new THREE.Vector3(0, 0, 0);

      // Forward/backward acceleration (along camera direction)
      if (moveZ !== 0) {
        accelerationVector.add(cameraDirection.clone().multiplyScalar(moveZ));
      }

      // Left/right acceleration (along camera right vector)
      if (moveX !== 0) {
        accelerationVector.add(cameraRight.clone().multiplyScalar(moveX));
      }

      // Normalize and apply acceleration
      if (accelerationVector.length() > 0) {
        accelerationVector.normalize();
        accelerationVector.multiplyScalar(this.acceleration);

        this.velocity.x += accelerationVector.x * deltaTime;
        this.velocity.z += accelerationVector.z * deltaTime;
      }
    } else {
      // Apply deceleration when not moving
      const currentSpeed = Math.sqrt(
        this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z
      );
      if (currentSpeed > 0) {
        const decelerationFactor = Math.min((this.deceleration * deltaTime) / currentSpeed, 1);
        this.velocity.x *= 1 - decelerationFactor;
        this.velocity.z *= 1 - decelerationFactor;

        // Stop completely if very slow
        if (Math.abs(this.velocity.x) < 0.01 && Math.abs(this.velocity.z) < 0.01) {
          this.velocity.x = 0;
          this.velocity.z = 0;
        }
      }
    }

    // Limit maximum speed
    const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    if (speed > this.speed) {
      this.velocity.x = (this.velocity.x / speed) * this.speed;
      this.velocity.z = (this.velocity.z / speed) * this.speed;
    }

    // Store previous position for collision detection
    const previousPosition = this.container.position.clone();

    // Move player
    this.container.position.x += this.velocity.x * deltaTime;
    this.container.position.z += this.velocity.z * deltaTime;

    // Keep player on the ground
    this.container.position.y = 1; // Player height (from ground)

    // Check boundaries and collisions
    this.checkBounds();
    this.checkCollisions(previousPosition);
  }

  checkCollisions(previousPosition) {
    // Basic collision detection with scene objects
    if (!this.game.scene) return;

    // Reset collision flag
    this.isColliding = false;

    // Collect collidable objects - more efficiently
    const collidables = [];
    
    // Check if we have access to city buildings
    if (this.game.city && this.game.city.container) {
      this.game.city.container.traverse((object) => {
        // Only check meshes that can be collided with
        if (object.isMesh && object !== this.container && object !== this.collisionMesh 
            && object.geometry && object.geometry.boundingBox) {
          collidables.push(object);
        }
      });
    } else {
      // If city is not available, fall back to scene traversal
      this.game.scene.traverse((object) => {
        // Only check meshes with the collidable flag or meshes that represent buildings/obstacles
        if ((object.isCollidable || (object.isMesh && object.name.includes('building'))) 
            && object !== this.container && object !== this.collisionMesh) {
          collidables.push(object);
        }
      });
    }

    // Check for collisions
    const playerPos = this.container.position.clone();
    playerPos.y += 1; // Center of player
    
    // Check collisions with city components
    if (this.game.city && this.game.city.checkComponentCollision) {
      const componentCollision = this.game.city.checkComponentCollision(playerPos, this.collisionRadius);
      if (componentCollision) {
        // Collision with city component detected
        this.isColliding = true;
        
        // Revert to previous position
        this.container.position.copy(previousPosition);
        
        // Add some bounce-back effect
        this.velocity.multiplyScalar(-0.3);
        
        return true;
      }
    }
    
    // Use raycasting for more precise collision detection
    const directions = [
      new THREE.Vector3(1, 0, 0),   // Right
      new THREE.Vector3(-1, 0, 0),  // Left
      new THREE.Vector3(0, 0, 1),   // Forward
      new THREE.Vector3(0, 0, -1),  // Backward
      new THREE.Vector3(1, 0, 1).normalize(),    // Forward-Right
      new THREE.Vector3(-1, 0, 1).normalize(),   // Forward-Left
      new THREE.Vector3(1, 0, -1).normalize(),   // Backward-Right
      new THREE.Vector3(-1, 0, -1).normalize(),  // Backward-Left
    ];
    
    const raycaster = new THREE.Raycaster();
    const collisionDistance = this.collisionRadius + 0.1; // Add small buffer
    
    for (const direction of directions) {
      raycaster.set(playerPos, direction);
      const intersects = raycaster.intersectObjects(collidables);
      
      if (intersects.length > 0 && intersects[0].distance < collisionDistance) {
        // Collision detected
        this.isColliding = true;
        this.lastCollisionObject = intersects[0].object;
        
        // Revert to previous position
        this.container.position.copy(previousPosition);
        
        // Zero out velocity in collision direction
        const dot = this.velocity.dot(new THREE.Vector3(direction.x, 0, direction.z));
        if (dot > 0) {
          const velChange = direction.clone().multiplyScalar(dot);
          this.velocity.sub(velChange);
        }
        
        return true;
      }
    }
    
    // Also check for direct mesh collisions as backup
    for (const object of collidables) {
      if (this.checkObjectCollision(object)) {
        // Collision detected
        this.isColliding = true;
        this.lastCollisionObject = object;
        
        // Revert to previous position
        this.container.position.copy(previousPosition);
        this.velocity.set(0, 0, 0);
        
        return true;
      }
    }
    
    return false;
  }

  checkObjectCollision(object) {
    // Simple sphere-box collision detection
    const playerPos = this.container.position.clone();
    playerPos.y += 1; // Center of player

    // Get object world position and size
    const objectPos = new THREE.Vector3();
    const objectSize = new THREE.Vector3();

    if (object.geometry && object.geometry.boundingBox) {
      // Use object's bounding box if available
      object.geometry.boundingBox.getSize(objectSize);
      objectSize.multiply(object.scale);

      // Get world position
      object.getWorldPosition(objectPos);
      
      // Adjust position to center of bounding box
      objectPos.add(new THREE.Vector3(
        objectSize.x / 2,
        objectSize.y / 2,
        objectSize.z / 2
      ));

      // Calculate half extents of the bounding box
      const halfExtents = objectSize.clone().multiplyScalar(0.5);
      
      // Calculate the closest point on the box to the sphere
      const closestPoint = new THREE.Vector3();
      
      // For each axis (x, y, z)
      for (let i = 0; i < 3; i++) {
        // Clamp sphere center to box bounds
        closestPoint.setComponent(
          i,
          Math.max(
            objectPos.getComponent(i) - halfExtents.getComponent(i),
            Math.min(playerPos.getComponent(i), objectPos.getComponent(i) + halfExtents.getComponent(i))
          )
        );
      }
      
      // Calculate distance from sphere center to closest point
      const distance = playerPos.distanceTo(closestPoint);
      
      // If distance is less than sphere radius, we have a collision
      return distance < this.collisionRadius;
    }
    
    return false;
  }

  checkBounds() {
    // Prevent the player from going out of bounds
    const minBounds = -50; // Minimum X/Z coordinate
    const maxBounds = 150;  // Maximum X/Z coordinate
    
    let isOutOfBounds = false;
    
    // Check X bounds
    if (this.container.position.x < minBounds) {
      this.container.position.x = minBounds;
      this.velocity.x = 0;
      isOutOfBounds = true;
    } else if (this.container.position.x > maxBounds) {
      this.container.position.x = maxBounds;
      this.velocity.x = 0;
      isOutOfBounds = true;
    }
    
    // Check Z bounds
    if (this.container.position.z < minBounds) {
      this.container.position.z = minBounds;
      this.velocity.z = 0;
      isOutOfBounds = true;
    } else if (this.container.position.z > maxBounds) {
      this.container.position.z = maxBounds;
      this.velocity.z = 0;
      isOutOfBounds = true;
    }
    
    return isOutOfBounds;
  }

  takeDamage(amount) {
    if (!this.isAlive) return;

    this.health -= amount;

    // Update UI
    if (this.game.uiManager) {
      this.game.uiManager.updateHealth(this.health);
    }

    // Check if player died
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }

  die() {
    this.isAlive = false;

    // Visual feedback
    this.mesh.material.color.set(0xff0000); // Turn red
    this.mesh.rotation.x = Math.PI / 2; // Fall over

    // Game over
    this.game.gameOver();
  }

  reset() {
    // Reset player health
    this.health = this.maxHealth;
    this.isAlive = true;

    // Reset position to center of city
    this.container.position.set(0, 1, 0);

    // Reset velocity
    this.velocity.set(0, 0, 0);

    // Reset weapon manager
    if (this.weaponManager) {
      this.weaponManager.reset();
    }

    // Update UI
    if (this.game.uiManager) {
      this.game.uiManager.updateHealth(this.health);
    }
  }

  shoot() {
    if (!this.isAlive || !this.weaponManager) return false;
    
    // Use the weapon manager to shoot
    const didShoot = this.weaponManager.shoot();
    
    // If shot was successful, trigger camera recoil
    if (didShoot && this.game) {
      // Apply recoil to camera
      if (typeof this.game.applyCameraRecoil === 'function') {
        this.game.applyCameraRecoil();
      }
      
      // Animate crosshair
      if (this.game.uiManager) {
        this.game.uiManager.animateCrosshair();
      }
    }
    
    return didShoot;
  }

  reload() {
    if (!this.isAlive || !this.weaponManager) return;
    
    // Use the weapon manager to reload
    this.weaponManager.reload();
  }

  nextWeapon() {
    if (!this.isAlive || !this.weaponManager) return;
    
    // Use the weapon manager to switch weapons
    return this.weaponManager.nextWeapon();
  }

  previousWeapon() {
    if (!this.isAlive || !this.weaponManager) return;
    
    // Use the weapon manager to switch weapons
    return this.weaponManager.previousWeapon();
  }
}
