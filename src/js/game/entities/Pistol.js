import * as THREE from 'three';
import { Weapon } from './Weapon.js';

/**
 * Pistol weapon implementation
 */
export class Pistol extends Weapon {
  constructor(player, assetLoader) {
    super(player, assetLoader);
    
    // Pistol specific properties
    this.name = 'Pistol';
    this.type = 'pistol';
    this.damage = 25;
    this.fireRate = 0.3; // Seconds between shots
    this.reloadTime = 2.0; // Seconds to reload
    this.ammoCapacity = 12;
    this.maxAmmo = this.ammoCapacity;
    this.currentAmmo = this.ammoCapacity;
    this.range = 40; // Pistol range in units
    
    // Pistol reserve ammo properties
    this.maxReserveAmmo = 60;
    this.reserveAmmo = this.maxReserveAmmo;
    this.reserveAmmoPerMag = 12; // How much reserve ammo counts as one magazine
    
    // Pistol has moderate accuracy
    this.spread = 0.015;
    
    // Override muzzle flash settings for pistol
    this.muzzleFlashSettings = {
      duration: 0.08, // Shorter duration for pistol
      color: 0xffaa00,
      intensity: 1.5,
      radius: 2,
      particleCount: 8,
      particleColor: 0xffff00,
      particleSize: 0.08
    };
    
    // Pistol-specific animation properties
    this.slideRecoilAmount = 0.15;
    this.slideRecoilDuration = 0.1;
    this.magazineEjectDuration = 0.3;
    this.magazineInsertDuration = 0.4;
    this.slideReleaseDuration = 0.2;
    
    // Pistol parts for animation
    this.parts = {
      slide: null,
      magazine: null,
      hammer: null
    };
    
    // Pistol-specific poses
    this.partPoses = {
      slide: this.createEmptyPose(),
      magazine: this.createEmptyPose(),
      hammer: this.createEmptyPose()
    };
    
    // Animations
    this.animations = {
      idle: {
        active: false,
        timeFactor: 1.5
      },
      shoot: {
        active: false,
        duration: 100, // ms
        startTime: 0
      },
      reload: {
        active: false,
        duration: this.reloadTime * 1000,
        startTime: 0,
        phase: 0 // 0: start, 1: eject mag, 2: insert mag, 3: chamber round
      }
    };
    
    // Initialize bullet pool
    this.initBulletPool();
    
    // Replace the default mesh with pistol specific mesh
    this.createMesh();
    
    // Start idle animation
    this.startIdleAnimation();
  }
  
  /**
   * Create pistol specific mesh
   */
  createMesh() {
    // Remove existing mesh if there is one
    if (this.mesh) {
      this.container.remove(this.mesh);
    }
    
    // Group for the entire pistol
    this.mesh = new THREE.Group();
    
    // Create a more detailed pistol model
    // Main components:
    // 1. Frame (body) of the pistol
    // 2. Slide that moves during firing
    // 3. Barrel
    // 4. Grip/handle
    // 5. Trigger
    // 6. Hammer
    // 7. Magazine
    // 8. Sights
    
    // Create materials
    const metalMaterial = new THREE.MeshStandardMaterial({
      map: this.assetLoader.getTexture('weapon'),
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.8,
    });
    
    const darkMetalMaterial = new THREE.MeshStandardMaterial({
      map: this.assetLoader.getTexture('weapon'),
      color: 0x222222,
      roughness: 0.6,
      metalness: 0.7,
    });
    
    const gripMaterial = new THREE.MeshStandardMaterial({
      map: this.assetLoader.getTexture('weapon'),
      color: 0x111111,
      roughness: 0.9,
      metalness: 0.2,
    });
    
    // Frame/body
    const frameGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.25);
    this.frame = new THREE.Mesh(frameGeometry, darkMetalMaterial);
    this.frame.position.set(0, 0, 0);
    
    // Slide
    const slideGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.4);
    this.slide = new THREE.Mesh(slideGeometry, metalMaterial);
    this.slide.position.set(0, 0.06, 0.1);
    
    // Barrel (inside the slide)
    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
    this.barrel = new THREE.Mesh(barrelGeometry, darkMetalMaterial);
    this.barrel.rotation.x = Math.PI / 2;
    this.barrel.position.set(0, 0.06, 0.15);
    
    // Grip/handle
    const gripGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.15);
    gripGeometry.translate(0, -0.15, -0.05); // Center the grip below the frame
    this.grip = new THREE.Mesh(gripGeometry, gripMaterial);
    
    // Trigger
    const triggerGeometry = new THREE.BoxGeometry(0.02, 0.05, 0.02);
    this.trigger = new THREE.Mesh(triggerGeometry, metalMaterial);
    this.trigger.position.set(0, -0.05, 0.02);
    
    // Hammer
    const hammerGeometry = new THREE.BoxGeometry(0.03, 0.05, 0.03);
    this.hammer = new THREE.Mesh(hammerGeometry, metalMaterial);
    this.hammer.position.set(0, 0.08, -0.07);
    
    // Magazine
    const magGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.12);
    this.magazine = new THREE.Mesh(magGeometry, darkMetalMaterial);
    this.magazine.position.set(0, -0.25, -0.02);
    
    // Front sight
    const frontSightGeometry = new THREE.BoxGeometry(0.02, 0.03, 0.02);
    this.frontSight = new THREE.Mesh(frontSightGeometry, darkMetalMaterial);
    this.frontSight.position.set(0, 0.13, 0.27);
    
    // Rear sight with notch
    const rearSightBaseGeometry = new THREE.BoxGeometry(0.08, 0.03, 0.02);
    this.rearSightBase = new THREE.Mesh(rearSightBaseGeometry, darkMetalMaterial);
    this.rearSightBase.position.set(0, 0.13, -0.07);
    
    // Create notch in rear sight
    const rearSightLeftGeometry = new THREE.BoxGeometry(0.03, 0.03, 0.02);
    const rearSightRightGeometry = new THREE.BoxGeometry(0.03, 0.03, 0.02);
    this.rearSightLeft = new THREE.Mesh(rearSightLeftGeometry, darkMetalMaterial);
    this.rearSightRight = new THREE.Mesh(rearSightRightGeometry, darkMetalMaterial);
    this.rearSightLeft.position.set(-0.025, 0.13, -0.07);
    this.rearSightRight.position.set(0.025, 0.13, -0.07);
    
    // Ejection port on slide
    const ejectionPortGeometry = new THREE.BoxGeometry(0.06, 0.02, 0.1);
    this.ejectionPort = new THREE.Mesh(ejectionPortGeometry, darkMetalMaterial);
    this.ejectionPort.position.set(0.04, 0.12, 0);
    
    // Add all parts to the weapon group
    this.mesh.add(this.frame);
    this.mesh.add(this.grip);
    this.mesh.add(this.trigger);
    this.mesh.add(this.hammer);
    this.mesh.add(this.magazine);
    this.slide.add(this.barrel);
    this.slide.add(this.frontSight);
    this.slide.add(this.ejectionPort);
    this.mesh.add(this.slide);
    this.mesh.add(this.rearSightBase);
    this.mesh.add(this.rearSightLeft);
    this.mesh.add(this.rearSightRight);
    
    // Position for First-Person view
    this.mesh.position.set(0.3, -0.3, -0.5);
    this.mesh.rotation.set(0, Math.PI / 2, 0);
    
    // Make weapon visible in First-Person
    this.mesh.scale.set(1.5, 1.5, 1.5);
    
    // Add to container
    this.container.add(this.mesh);
  }
  
  /**
   * Start idle animation
   */
  startIdleAnimation() {
    this.animations.idle.active = true;
  }
  
  /**
   * Update the weapon
   * @override
   */
  update(deltaTime) {
    // Call parent update
    super.update(deltaTime);
    
    // Update animations
    this.updateAnimations(deltaTime);
  }
  
  /**
   * Update pistol animations
   */
  updateAnimations(deltaTime) {
    super.updateAnimations(deltaTime);
    
    // Update part poses
    this.updatePartPoses();
    
    // Apply part animations
    this.applyPartAnimations();
  }
  
  /**
   * Update part poses from mesh
   */
  updatePartPoses() {
    if (this.parts.slide) {
      this.partPoses.slide.position.copy(this.parts.slide.position);
      this.partPoses.slide.rotation.copy(this.parts.slide.rotation);
    }
    
    if (this.parts.magazine) {
      this.partPoses.magazine.position.copy(this.parts.magazine.position);
      this.partPoses.magazine.rotation.copy(this.parts.magazine.rotation);
    }
    
    if (this.parts.hammer) {
      this.partPoses.hammer.position.copy(this.parts.hammer.position);
      this.partPoses.hammer.rotation.copy(this.parts.hammer.rotation);
    }
  }
  
  /**
   * Apply animations to pistol parts
   */
  applyPartAnimations() {
    if (!this.game.animationManager) return;
    
    const weights = this.game.animationManager.blendWeights;
    
    // Apply animations to slide
    if (this.parts.slide) {
      this.applyBlendedTransform(
        this.parts.slide,
        this.partPoses.slide,
        this.calculateSlidePose(),
        weights
      );
    }
    
    // Apply animations to magazine
    if (this.parts.magazine) {
      this.applyBlendedTransform(
        this.parts.magazine,
        this.partPoses.magazine,
        this.calculateMagazinePose(),
        weights
      );
    }
    
    // Apply animations to hammer
    if (this.parts.hammer) {
      this.applyBlendedTransform(
        this.parts.hammer,
        this.partPoses.hammer,
        this.calculateHammerPose(),
        weights
      );
    }
  }
  
  /**
   * Calculate slide pose
   */
  calculateSlidePose() {
    const pose = this.createEmptyPose();
    
    if (this.animationState.shooting) {
      const progress = Math.min(this.currentAnimationTime / this.slideRecoilDuration, 1);
      const curve = Math.sin(progress * Math.PI);
      
      // Slide recoils back
      pose.position.x = this.partPoses.slide.position.x - curve * this.slideRecoilAmount;
    }
    
    return pose;
  }
  
  /**
   * Calculate magazine pose
   */
  calculateMagazinePose() {
    const pose = this.createEmptyPose();
    
    if (this.animationState.reloading) {
      const progress = Math.min(this.currentAnimationTime / this.reloadDuration, 1);
      
      if (progress < 0.3) {
        // Magazine ejects
        const ejectProgress = progress / 0.3;
        pose.position.y = this.partPoses.magazine.position.y - ejectProgress * 0.2;
        pose.rotation.x = ejectProgress * Math.PI * 0.5;
      } else if (progress < 0.7) {
        // Magazine inserts
        const insertProgress = (progress - 0.3) / 0.4;
        pose.position.y = this.partPoses.magazine.position.y - 0.2 + insertProgress * 0.2;
        pose.rotation.x = Math.PI * 0.5 - insertProgress * Math.PI * 0.5;
      }
    }
    
    return pose;
  }
  
  /**
   * Calculate hammer pose
   */
  calculateHammerPose() {
    const pose = this.createEmptyPose();
    
    if (this.animationState.shooting) {
      const progress = Math.min(this.currentAnimationTime / this.slideRecoilDuration, 1);
      const curve = Math.sin(progress * Math.PI);
      
      // Hammer cocks back
      pose.rotation.x = curve * Math.PI * 0.5;
    }
    
    return pose;
  }
  
  /**
   * Start shooting animation
   */
  startShootAnimation() {
    super.startShootAnimation();
    
    // Play slide recoil sound
    if (this.game.soundManager) {
      this.game.soundManager.playSound('pistol_slide', this.mesh.position);
    }
  }
  
  /**
   * Start reload animation
   */
  startReloadAnimation() {
    super.startReloadAnimation();
    
    // Play magazine sounds
    if (this.game.soundManager) {
      this.game.soundManager.playSound('magazine_eject', this.mesh.position);
      
      // Play magazine insert sound after delay
      setTimeout(() => {
        this.game.soundManager.playSound('magazine_insert', this.mesh.position);
      }, this.magazineEjectDuration * 1000);
      
      // Play slide release sound after magazine insert
      setTimeout(() => {
        this.game.soundManager.playSound('slide_release', this.mesh.position);
      }, (this.magazineEjectDuration + this.magazineInsertDuration) * 1000);
    }
  }
  
  /**
   * Override updateReloadPhase to provide pistol-specific animations
   * @override
   */
  updateReloadPhase(phase, progress) {
    switch(phase) {
      case 0: // Start - tilt pistol down
        this.updateReloadPhaseStart(progress);
        break;
      case 1: // Eject magazine
        this.updateReloadPhaseEject(progress);
        break;
      case 2: // Insert new magazine
        this.updateReloadPhaseInsert(progress);
        break;
      case 3: // Chamber round and return to position
        this.updateReloadPhaseChamber(progress);
        break;
    }
  }
  
  /**
   * Update reload phase 1: Tilt gun down
   * @override
   */
  updateReloadPhaseStart(progress) {
    // Tilt gun down and slightly to the side
    const rotX = this.getPistolRotationX() - progress * 0.5;
    const rotZ = progress * 0.3;
    
    this.mesh.rotation.set(rotX, Math.PI / 2, rotZ);
    this.mesh.position.y = -0.3 - progress * 0.05;
  }
  
  /**
   * Update reload phase 2: Eject magazine
   * @override
   */
  updateReloadPhaseEject(progress) {
    // Keep gun tilted
    this.mesh.rotation.set(this.getPistolRotationX() - 0.5, Math.PI / 2, 0.3);
    
    // Ejection animation for magazine
    if (this.magazine) {
      this.magazine.position.y = -0.25 - progress * 0.2;
      this.magazine.position.z = -0.02 - progress * 0.05;
      this.magazine.visible = progress < 0.8; // Hide magazine when fully ejected
    }
  }
  
  /**
   * Update reload phase 3: Insert new magazine
   * @override
   */
  updateReloadPhaseInsert(progress) {
    // Keep gun tilted
    this.mesh.rotation.set(this.getPistolRotationX() - 0.5, Math.PI / 2, 0.3);
    
    // Show magazine and animate insertion
    if (this.magazine) {
      this.magazine.visible = true;
      this.magazine.position.y = -0.45 + progress * 0.2;
      this.magazine.position.z = -0.07 + progress * 0.05;
    }
    
    // Small weapon movement to simulate handling
    const wobble = Math.sin(progress * Math.PI * 3) * 0.01;
    this.mesh.position.y = -0.35 + wobble;
  }
  
  /**
   * Update reload phase 4: Chamber round and return to position
   * @override
   */
  updateReloadPhaseChamber(progress) {
    // Calculate smooth transition back to original position
    const rotX = this.getPistolRotationX() - 0.5 + progress * 0.5;
    const rotZ = 0.3 - progress * 0.3;
    
    this.mesh.rotation.set(rotX, Math.PI / 2, rotZ);
    this.mesh.position.y = -0.35 + progress * 0.05;
    
    // Magazine fully inserted
    if (this.magazine) {
      this.magazine.position.y = -0.25;
      this.magazine.position.z = -0.02;
    }
    
    // Slide animation (pulling back and releasing)
    if (this.slide) {
      if (progress < 0.3) {
        // Pull slide back
        this.slide.position.z = 0.1 - progress * 0.25;
        
        // Tilt hammer back
        if (this.hammer) {
          this.hammer.rotation.x = -progress * 0.5;
        }
      } else if (progress < 0.6) {
        // Hold slide back
        this.slide.position.z = 0.025;
        
        // Keep hammer back
        if (this.hammer) {
          this.hammer.rotation.x = -0.15;
        }
      } else {
        // Release slide with spring effect
        const releaseProgress = (progress - 0.6) / 0.4;
        const springEffect = Math.pow(1 - releaseProgress, 2) * Math.sin(releaseProgress * Math.PI * 2) * 0.03;
        
        this.slide.position.z = 0.1 + springEffect;
        
        // Reset hammer
        if (this.hammer) {
          this.hammer.rotation.x = -0.15 * (1 - releaseProgress);
        }
      }
    }
  }
  
  /**
   * Override finishReloadAnimation to reset pistol position
   * @override
   */
  finishReloadAnimation() {
    this.resetWeaponPosition();
    this.animations.idle.active = true;
  }
  
  /**
   * Reset weapon to neutral position
   */
  resetWeaponPosition() {
    this.mesh.position.set(0.3, -0.3, -0.5);
    this.mesh.rotation.set(this.getPistolRotationX(), Math.PI / 2, 0);
    
    if (this.slide) {
      this.slide.position.set(0, 0.06, 0.1);
    }
    
    if (this.hammer) {
      this.hammer.rotation.set(0, 0, 0);
    }
    
    if (this.magazine) {
      this.magazine.position.set(0, -0.25, -0.02);
      this.magazine.visible = true;
    }
  }
  
  /**
   * Get the current rotation X value based on player's vertical look
   */
  getPistolRotationX() {
    // Apply partial vertical look to weapon
    return this.player ? this.player.verticalLook * 0.5 : 0;
  }
  
  /**
   * Override shoot method to trigger animation
   */
  shoot() {
    const didShoot = super.shoot();
    
    if (didShoot) {
      // Start shoot animation
      this.animations.shoot.active = true;
      this.animations.shoot.startTime = Date.now();
      
      // Temporarily pause idle animation
      this.animations.idle.active = false;
      setTimeout(() => {
        this.animations.idle.active = true;
      }, this.animations.shoot.duration);
    }
    
    return didShoot;
  }
  
  /**
   * Override reload method to trigger animation
   */
  reload() {
    if (this.isReloading || this.currentAmmo === this.ammoCapacity) return;
    
    super.reload();
    
    // Sync with legacy animation system for backward compatibility
    this.animations.reload.active = false;
    this.animations.idle.active = false;
  }
  
  /**
   * Override base class playRecoilAnimation for pistol-specific recoil
   */
  playRecoilAnimation() {
    if (!this.game.camera) return;
    
    // Apply recoil to camera
    this.game.currentRecoil += this.game.recoilAmount * 0.8; // Pistol has less recoil
    
    // Animate weapon (slide back and forth)
    if (this.slide) {
      const originalPosition = this.slide.position.clone();
      
      // Move slide back
      this.slide.position.z -= 0.15;
      
      // Animate hammer with slide movement
      if (this.hammer) {
        this.hammer.rotation.x = -0.15; // Pull hammer back
      }
      
      // Return slide to original position
      setTimeout(() => {
        if (this.slide) {
          // Smooth return animation
          const startTime = Date.now();
          const duration = 100; // ms
          
          const animateSlide = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
              this.slide.position.copy(originalPosition);
              
              // Reset hammer after a slight delay for animation polish
              setTimeout(() => {
                if (this.hammer) {
                  this.hammer.rotation.x = 0;
                }
              }, 30);
              
              return;
            }
            
            const newZ = (originalPosition.z - 0.15) + (progress * 0.15);
            this.slide.position.z = newZ;
            
            requestAnimationFrame(animateSlide);
          };
          
          animateSlide();
        }
      }, 50);
    }
    
    // Barrel recoil animation
    const recoilDistance = 0.03;
    const originalBarrelPos = this.mesh.position.clone();
    
    // Move weapon backward and upward slightly
    this.mesh.position.z += recoilDistance;
    this.mesh.position.y += recoilDistance * 0.5;
    this.mesh.rotation.x -= 0.05; // Tilt up slightly
    
    // Return to original position
    setTimeout(() => {
      // Smooth return animation
      const startTime = Date.now();
      const duration = 100; // ms
      
      const animateRecoil = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress >= 1) {
          this.mesh.position.copy(originalBarrelPos);
          this.mesh.rotation.x = this.getPistolRotationX(); // Reset rotation with player look
          return;
        }
        
        // Smooth out the return
        this.mesh.position.z = originalBarrelPos.z + (recoilDistance * (1 - progress));
        this.mesh.position.y = originalBarrelPos.y + (recoilDistance * 0.5 * (1 - progress));
        this.mesh.rotation.x = this.getPistolRotationX() - (0.05 * (1 - progress));
        
        requestAnimationFrame(animateRecoil);
      };
      
      animateRecoil();
    }, 50);
  }
  
  /**
   * Get the current position of the pistol muzzle for muzzle flash effects
   * @returns {THREE.Vector3} Position of the muzzle in world space
   */
  getMuzzlePosition() {
    // If no mesh, return default position
    if (!this.mesh) {
      return this.player.container.position.clone().add(new THREE.Vector3(0, 1.6, -1));
    }
    
    // Create a position at the front of the pistol barrel
    const muzzleOffset = new THREE.Vector3(0, 0.02, -0.2); // Slightly forward from the barrel end
    
    // Create a vector to hold the world position
    const muzzlePosition = new THREE.Vector3();
    
    // Use the mesh to calculate the world position of the muzzle
    muzzlePosition.copy(muzzleOffset);
    
    // Transform the local position to world space
    this.mesh.localToWorld(muzzlePosition);
    
    return muzzlePosition;
  }
} 