import * as THREE from 'three';
import { Weapon } from './Weapon.js';

export class Player {
  constructor(game, assetLoader) {
    this.game = game;
    this.assetLoader = assetLoader;
    
    // Create container for player and weapon
    this.container = new THREE.Group();
    
    // Player properties
    this.speed = 2; // Units per second
    this.health = 100;
    this.maxHealth = 100;
    this.isAlive = true;
    
    // Direction the player is facing (in radians)
    this.direction = 0;
    
    // Vertikaler Blickwinkel
    this.verticalLook = 0;
    
    // Movement
    this.moveDirection = new THREE.Vector2(0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0); // Aktuelle Geschwindigkeit für Beschleunigung/Verzögerung
    this.acceleration = 4; // Beschleunigung pro Sekunde
    this.deceleration = 8; // Verzögerung pro Sekunde
    
    // Create mesh
    this.createMesh();
    
    // Create weapon
    this.weapon = new Weapon(this, this.assetLoader);
    this.container.add(this.weapon.container);
  }
  
  createMesh() {
    // Create a more detailed 3D model for the player character
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const legGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    
    // Materials with pixel textures for body parts
    const bodyMaterial = new THREE.MeshStandardMaterial({
      map: this.assetLoader.getTexture('player'),
      roughness: 0.8,
      metalness: 0.2
    });
    
    const headMaterial = new THREE.MeshStandardMaterial({
      map: this.assetLoader.getTexture('player_head'),
      roughness: 0.8
    });
    
    // Create body parts
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 0.6;
    this.body.castShadow = true;
    
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.y = 1.4;
    this.head.castShadow = true;
    
    this.leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    this.leftArm.position.set(-0.4, 0.7, 0);
    this.leftArm.castShadow = true;
    
    this.rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    this.rightArm.position.set(0.4, 0.7, 0);
    this.rightArm.castShadow = true;
    
    this.leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    this.leftLeg.position.set(-0.2, 0.0, 0);
    this.leftLeg.castShadow = true;
    
    this.rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    this.rightLeg.position.set(0.2, 0.0, 0);
    this.rightLeg.castShadow = true;
    
    // Add all parts to the container
    this.mesh = new THREE.Group();
    this.mesh.add(this.body);
    this.mesh.add(this.head);
    this.mesh.add(this.leftArm);
    this.mesh.add(this.rightArm);
    this.mesh.add(this.leftLeg);
    this.mesh.add(this.rightLeg);
    
    this.container.add(this.mesh);
    
    // Set initial position
    this.container.position.set(0, 0, 0);
  }
  
  update(deltaTime) {
    if (!this.isAlive) return;
    
    // Update movement
    this.updateMovement(deltaTime);
    
    // Update weapon
    this.weapon.update(deltaTime);
    
    // Check if player is out of bounds and adjust
    this.checkBounds();
    
    // In first-person mode, the player mesh should not be visible
    // Only show mesh in third-person or when dead
    this.mesh.visible = !this.isAlive;
    
    // Die Waffe ist unabhängig vom Player-Mesh immer sichtbar
    if (this.weapon && this.weapon.mesh) {
      this.weapon.mesh.visible = true;
    }
  }
  
  updateMovement(deltaTime) {
    // Zielgeschwindigkeit basierend auf Eingabe berechnen
    const targetVelocity = new THREE.Vector3(0, 0, 0);
    
    // Only calculate target velocity if we have direction input
    if (this.moveDirection.length() > 0) {
      // Normalize move direction
      this.moveDirection.normalize();
      
      // Get forward and right vectors relative to the camera
      const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.game.camera.quaternion);
      cameraForward.y = 0; // Keep movement on x-z plane
      cameraForward.normalize();
      
      const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.game.camera.quaternion);
      cameraRight.y = 0; // Keep movement on x-z plane
      cameraRight.normalize();
      
      // Calculate movement vector based on camera orientation
      const moveVector = new THREE.Vector3();
      moveVector.addScaledVector(cameraForward, this.moveDirection.y);
      moveVector.addScaledVector(cameraRight, this.moveDirection.x);
      moveVector.normalize();
      
      // Set target velocity based on move direction and speed
      targetVelocity.copy(moveVector).multiplyScalar(this.speed);
      
      // Animate legs while walking
      const walkCycle = (Date.now() % 1000) / 1000;
      const legRotation = Math.sin(walkCycle * Math.PI * 2) * 0.4;
      
      this.leftLeg.rotation.x = -legRotation;
      this.rightLeg.rotation.x = legRotation;
      this.leftArm.rotation.x = legRotation;
      this.rightArm.rotation.x = -legRotation;
    } else {
      // Reset leg positions when not moving
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
    }
    
    // Geschwindigkeit mittels Beschleunigung/Verzögerung anpassen
    const acceleration = this.moveDirection.length() > 0 ? this.acceleration : this.deceleration;
    
    // Für jede Komponente der Geschwindigkeit
    ['x', 'z'].forEach(axis => {
      const diff = targetVelocity[axis] - this.velocity[axis];
      // Bewege die Geschwindigkeit in Richtung des Ziels mit der Beschleunigung/Verzögerung
      if (Math.abs(diff) < acceleration * deltaTime) {
        this.velocity[axis] = targetVelocity[axis];
      } else if (diff > 0) {
        this.velocity[axis] += acceleration * deltaTime;
      } else if (diff < 0) {
        this.velocity[axis] -= acceleration * deltaTime;
      }
    });
    
    // Aktuelle Geschwindigkeit anwenden
    this.container.position.x += this.velocity.x * deltaTime;
    this.container.position.z += this.velocity.z * deltaTime;
    
    // Update map position for collision detection
    this.game.map.playerPosition.x = this.container.position.x;
    this.game.map.playerPosition.z = this.container.position.z;
  }
  
  checkBounds() {
    // Get map dimensions
    const mapWidth = this.game.map.width * this.game.map.tileSize;
    const mapHeight = this.game.map.height * this.game.map.tileSize;
    
    // Get map position
    const mapOffsetX = this.game.map.container.position.x;
    const mapOffsetZ = this.game.map.container.position.z;
    
    // Check bounds
    if (this.container.position.x < mapOffsetX) {
      this.container.position.x = mapOffsetX;
    } else if (this.container.position.x > mapOffsetX + mapWidth) {
      this.container.position.x = mapOffsetX + mapWidth;
    }
    
    if (this.container.position.z < mapOffsetZ) {
      this.container.position.z = mapOffsetZ;
    } else if (this.container.position.z > mapOffsetZ + mapHeight) {
      this.container.position.z = mapOffsetZ + mapHeight;
    }
  }
  
  takeDamage(amount) {
    if (!this.isAlive) return;
    
    this.health -= amount;
    
    // Update UI
    this.game.ui.updateHealth(this.health);
    
    // Check if player died
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }
  
  die() {
    this.isAlive = false;
    
    // Visual feedback
    this.mesh.material.color.set(0xFF0000); // Turn red
    this.mesh.rotation.x = Math.PI / 2; // Fall over
    
    // Game over
    this.game.gameOver();
  }
  
  reset() {
    // Reset player properties
    this.health = this.maxHealth;
    this.isAlive = true;
    
    // Reset position
    this.container.position.set(0, 0, 0);
    
    // Reset visual state
    this.mesh.material.color.set(0xFFFFFF);
    this.mesh.rotation.x = 0;
    
    // Reset weapon
    this.weapon.reset();
    
    // Update UI
    this.game.ui.updateHealth(this.health);
  }
  
  shoot() {
    if (!this.isAlive) return;
    
    this.weapon.shoot();
  }
  
  reload() {
    if (!this.isAlive) return;
    
    this.weapon.reload();
  }
} 