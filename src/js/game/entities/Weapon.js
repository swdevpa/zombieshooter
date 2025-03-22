import * as THREE from 'three';
import { Bullet } from './Bullet.js';

export class Weapon {
  constructor(player, assetLoader) {
    this.player = player;
    this.game = player.game;
    this.assetLoader = assetLoader;
    
    // Weapon properties
    this.damage = 25;
    this.fireRate = 0.3; // Seconds between shots
    this.reloadTime = 2; // Seconds to reload
    this.ammoCapacity = 30;
    this.maxAmmo = this.ammoCapacity; // Alias für die UI-Klasse
    this.currentAmmo = this.ammoCapacity;
    this.isReloading = false;
    this.lastShotTime = 0;
    
    // Animation properties
    this.reloadAnimation = {
      active: false,
      startTime: 0,
      duration: this.reloadTime * 1000, // ms
      originalPosition: null,
      originalRotation: null
    };
    
    // Bullet management
    this.bullets = [];
    
    // Create container
    this.container = new THREE.Group();
    
    // Create mesh
    this.createMesh();
  }
  
  createMesh() {
    // Create a more detailed weapon model
    const barrelGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.7);
    const handleGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.15);
    const magazineGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.25);
    
    const weaponMaterial = new THREE.MeshStandardMaterial({
      map: this.assetLoader.getTexture('weapon'),
      roughness: 0.5,
      metalness: 0.7
    });
    
    // Create weapon parts
    this.barrel = new THREE.Mesh(barrelGeometry, weaponMaterial);
    this.barrel.position.set(0, 0, 0.2);
    
    this.handle = new THREE.Mesh(handleGeometry, weaponMaterial);
    this.handle.position.set(0, -0.2, -0.15);
    
    this.magazine = new THREE.Mesh(magazineGeometry, weaponMaterial);
    this.magazine.position.set(0, -0.1, -0.1);
    
    // Create weapon group
    this.mesh = new THREE.Group();
    this.mesh.add(this.barrel);
    this.mesh.add(this.handle);
    this.mesh.add(this.magazine);
    
    // Position für First-Person-View - Waffe erscheint in der unteren rechten Ecke des Bildschirms
    this.mesh.position.set(0.3, -0.3, -0.5);
    this.mesh.rotation.set(0, Math.PI/2, 0);
    
    // Waffe größer und besser sichtbar in First-Person machen
    this.mesh.scale.set(2.0, 2.0, 2.0);
    
    this.container.add(this.mesh);
    
    // Add muzzle flash light (visible only when shooting)
    this.muzzleFlash = new THREE.PointLight(0xffaa00, 1, 3);
    this.muzzleFlash.position.set(0, 0, 0.6);
    this.muzzleFlash.visible = false;
    this.mesh.add(this.muzzleFlash);
  }
  
  update(deltaTime) {
    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      
      // Update bullet
      bullet.update(deltaTime);
      
      // Remove bullet if it's dead
      if (!bullet.isAlive) {
        this.game.scene.remove(bullet.container);
        this.bullets.splice(i, 1);
      }
    }
    
    // Add subtle weapon sway/bob effect for first-person
    this.updateWeaponSway(deltaTime);
    
    // Check if reload is complete
    if (this.isReloading) {
      if (Date.now() - this.reloadStartTime >= this.reloadTime * 1000) {
        this.completeReload();
      } else {
        // Update reload animation
        this.updateReloadAnimation();
      }
    }
  }
  
  updateWeaponSway(deltaTime) {
    // Skip sway during reload animation
    if (this.isReloading) return;
    
    // Create subtle weapon sway based on time
    const time = Date.now() * 0.001;
    const swayX = Math.sin(time * 1.5) * 0.01;
    const swayY = Math.sin(time * 2) * 0.005;
    
    // Apply sway to weapon position
    this.mesh.position.x = 0.3 + swayX;
    this.mesh.position.y = -0.3 + swayY;
    
    // Apply vertical look rotation to weapon
    this.mesh.rotation.x = this.player.verticalLook * 0.5;
    
    // Add additional sway when moving
    if (this.player.moveDirection.length() > 0) {
      const walkCycle = (Date.now() % 1000) / 1000;
      const walkSway = Math.sin(walkCycle * Math.PI * 2) * 0.02;
      this.mesh.position.y -= walkSway;
    }
  }
  
  shoot() {
    const now = Date.now() / 1000;
    
    // Check if weapon can shoot
    if (this.isReloading) return false;
    if (now - this.lastShotTime < this.fireRate) return false;
    if (this.currentAmmo <= 0) {
      this.reload();
      return false;
    }
    
    // Update last shot time
    this.lastShotTime = now;
    
    // Decrease ammo
    this.currentAmmo--;
    
    // Create bullet
    this.createBullet();
    
    // Play muzzle flash effect
    this.showMuzzleFlash();
    
    // Trigger small recoil animation
    this.playRecoilAnimation();
    
    // Animate crosshair
    this.game.ui.animateCrosshair();
    
    // Update UI
    this.game.ui.updateAmmo(this.currentAmmo, this.ammoCapacity);
    
    return true;
  }
  
  createBullet() {
    // For first-person, bullets should originate from gun barrel
    // Get player position and direction
    const playerPosition = this.player.container.position.clone();
    const playerDirection = this.player.direction;
    const verticalLook = this.player.verticalLook;
    
    // Adjust bullet starting position to come from gun barrel
    const bulletPosition = new THREE.Vector3(
      playerPosition.x + Math.sin(playerDirection) * 0.5,
      playerPosition.y + 1.5, // At eye level
      playerPosition.z + Math.cos(playerDirection) * 0.5
    );
    
    // Create bullet with both horizontal and vertical direction
    const bullet = new Bullet(
      this.game, 
      this.assetLoader, 
      bulletPosition, 
      playerDirection, 
      this.damage,
      verticalLook // Vertikale Blickrichtung an Bullet übergeben
    );
    
    // Add bullet to bullets array
    this.bullets.push(bullet);
    
    // Play sound
    // this.playSound('shoot');
  }
  
  reload() {
    if (this.isReloading || this.currentAmmo === this.ammoCapacity) return;
    
    this.isReloading = true;
    this.reloadStartTime = Date.now();
    
    // Store original weapon position and rotation for animation
    this.reloadAnimation.active = true;
    this.reloadAnimation.startTime = Date.now();
    this.reloadAnimation.originalPosition = this.mesh.position.clone();
    this.reloadAnimation.originalRotation = this.mesh.rotation.clone();
    
    // Update UI to show reloading
    this.game.ui.updateAmmo('Reloading...', this.ammoCapacity);
    
    // Play sound
    // this.playSound('reload');
  }
  
  updateReloadAnimation() {
    if (!this.reloadAnimation.active) return;
    
    const elapsed = Date.now() - this.reloadAnimation.startTime;
    const progress = Math.min(elapsed / this.reloadAnimation.duration, 1);
    
    // Complex reload animation sequence
    if (progress < 0.3) {
      // Phase 1: Tilt weapon down and to the left
      const phase1Progress = progress / 0.3;
      this.mesh.rotation.x = this.reloadAnimation.originalRotation.x + (Math.PI / 6) * phase1Progress;
      this.mesh.rotation.z = this.reloadAnimation.originalRotation.z - (Math.PI / 8) * phase1Progress;
      this.mesh.position.y = this.reloadAnimation.originalPosition.y - 0.1 * phase1Progress;
    } else if (progress < 0.5) {
      // Phase 2: Remove magazine animation
      const phase2Progress = (progress - 0.3) / 0.2;
      this.magazine.position.y = -0.1 - 0.3 * phase2Progress;
    } else if (progress < 0.7) {
      // Phase 3: Insert new magazine animation
      const phase3Progress = (progress - 0.5) / 0.2;
      this.magazine.position.y = -0.4 + 0.3 * phase3Progress;
    } else {
      // Phase 4: Return to original position
      const phase4Progress = (progress - 0.7) / 0.3;
      this.mesh.rotation.x = this.reloadAnimation.originalRotation.x + (Math.PI / 6) * (1 - phase4Progress);
      this.mesh.rotation.z = this.reloadAnimation.originalRotation.z - (Math.PI / 8) * (1 - phase4Progress);
      this.mesh.position.y = this.reloadAnimation.originalPosition.y - 0.1 * (1 - phase4Progress);
    }
  }
  
  completeReload() {
    this.isReloading = false;
    this.currentAmmo = this.ammoCapacity;
    
    // Reset reload animation
    this.reloadAnimation.active = false;
    
    // Ensure magazine is back to normal position
    if (this.magazine) {
      this.magazine.position.set(0, -0.1, -0.1);
    }
    
    // Reset weapon position and rotation
    if (this.reloadAnimation.originalPosition && this.reloadAnimation.originalRotation) {
      this.mesh.position.copy(this.reloadAnimation.originalPosition);
      this.mesh.rotation.copy(this.reloadAnimation.originalRotation);
    }
    
    // Update UI
    this.game.ui.updateAmmo(this.currentAmmo, this.ammoCapacity);
  }
  
  reset() {
    // Clear bullets
    for (const bullet of this.bullets) {
      this.game.scene.remove(bullet.container);
    }
    this.bullets = [];
    
    // Reset properties
    this.currentAmmo = this.ammoCapacity;
    this.isReloading = false;
    this.lastShotTime = 0;
    
    // Reset reload animation
    this.reloadAnimation.active = false;
    
    // Reset magazine position
    if (this.magazine) {
      this.magazine.position.set(0, -0.1, -0.1);
    }
    
    // Update UI
    this.game.ui.updateAmmo(this.currentAmmo, this.ammoCapacity);
  }
  
  showMuzzleFlash() {
    // Show muzzle flash
    this.muzzleFlash.visible = true;
    
    // Hide after short delay
    setTimeout(() => {
      this.muzzleFlash.visible = false;
    }, 50);
  }
  
  playRecoilAnimation() {
    // Save original position
    const originalPosition = this.mesh.position.clone();
    
    // Apply recoil
    this.mesh.position.z += 0.1;
    
    // Restore position with slight delay
    setTimeout(() => {
      this.mesh.position.copy(originalPosition);
    }, 100);
  }
} 