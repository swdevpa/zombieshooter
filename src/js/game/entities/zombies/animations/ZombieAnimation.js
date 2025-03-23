import * as THREE from 'three';

/**
 * ZombieAnimation - Handles animations for zombie models
 * Supports walking, attacking, damage, and death animations
 */
export class ZombieAnimation {
  constructor(zombie) {
    this.zombie = zombie;
    
    // Animation state
    this.state = 'idle'; // idle, walking, attacking, hit, headshot, limb_hit, dying, dead
    this.animationTime = 0;
    this.animationSpeed = 1.0;
    
    // Animation properties
    this.walkCycleSpeed = 1.5; // Steps per second
    this.attackDuration = 0.6; // Seconds for attack animation
    this.damageDuration = 0.3; // Seconds for damage animation
    this.headShotDuration = 0.5; // Seconds for headshot animation
    this.limbHitDuration = 0.4; // Seconds for limb hit animation
    this.deathDuration = 2.0;  // Seconds for death animation
    this.currentAnimationTime = 0;
    
    // Limb references from zombie model
    this.bodyParts = {
      body: null,
      head: null,
      leftArm: null,
      rightArm: null,
      leftLeg: null,
      rightLeg: null
    };
    
    // Original positions and rotations
    this.originalTransforms = {
      body: { position: new THREE.Vector3(), rotation: new THREE.Euler() },
      head: { position: new THREE.Vector3(), rotation: new THREE.Euler() },
      leftArm: { position: new THREE.Vector3(), rotation: new THREE.Euler() },
      rightArm: { position: new THREE.Vector3(), rotation: new THREE.Euler() },
      leftLeg: { position: new THREE.Vector3(), rotation: new THREE.Euler() },
      rightLeg: { position: new THREE.Vector3(), rotation: new THREE.Euler() }
    };
    
    // Animation playback state
    this.animationStateTime = 0;
    this.animationComplete = false;
    
    // Auto-return to idle after timed animations
    this.autoReturnStates = ['hit', 'headshot', 'limb_hit', 'attacking'];
  }
  
  /**
   * Initialize animation system with references to zombie body parts
   */
  init(bodyParts) {
    this.bodyParts = bodyParts;
    
    // Store original transforms
    if (this.bodyParts.body) {
      this.originalTransforms.body.position.copy(this.bodyParts.body.position);
      this.originalTransforms.body.rotation.copy(this.bodyParts.body.rotation);
    }
    
    if (this.bodyParts.head) {
      this.originalTransforms.head.position.copy(this.bodyParts.head.position);
      this.originalTransforms.head.rotation.copy(this.bodyParts.head.rotation);
    }
    
    if (this.bodyParts.leftArm) {
      this.originalTransforms.leftArm.position.copy(this.bodyParts.leftArm.position);
      this.originalTransforms.leftArm.rotation.copy(this.bodyParts.leftArm.rotation);
    }
    
    if (this.bodyParts.rightArm) {
      this.originalTransforms.rightArm.position.copy(this.bodyParts.rightArm.position);
      this.originalTransforms.rightArm.rotation.copy(this.bodyParts.rightArm.rotation);
    }
    
    if (this.bodyParts.leftLeg) {
      this.originalTransforms.leftLeg.position.copy(this.bodyParts.leftLeg.position);
      this.originalTransforms.leftLeg.rotation.copy(this.bodyParts.leftLeg.rotation);
    }
    
    if (this.bodyParts.rightLeg) {
      this.originalTransforms.rightLeg.position.copy(this.bodyParts.rightLeg.position);
      this.originalTransforms.rightLeg.rotation.copy(this.bodyParts.rightLeg.rotation);
    }
  }
  
  /**
   * Update animation state based on zombie behavior
   */
  update(deltaTime) {
    // Update animation time
    this.animationTime += deltaTime * this.animationSpeed;
    this.animationStateTime += deltaTime;
    
    // Check if temporary animations should return to idle
    if (this.autoReturnStates.includes(this.state)) {
      const duration = this.getStateDuration(this.state);
      
      if (this.animationStateTime >= duration) {
        this.setState('idle');
      }
    }
    
    // Don't animate if body parts aren't available
    if (!this.bodyParts.body) return;
    
    // Apply animation based on current state
    switch (this.state) {
      case 'idle':
        this.animateIdle();
        break;
      case 'walking':
        this.animateWalking();
        break;
      case 'attacking':
        this.animateAttacking();
        break;
      case 'hit':
        this.animateHit();
        break;
      case 'headshot':
        this.animateHeadshot();
        break;
      case 'limb_hit':
        this.animateLimbHit();
        break;
      case 'dying':
        this.animateDying();
        break;
      case 'dead':
        this.animateDead();
        break;
    }
  }
  
  /**
   * Get animation duration for a specific state
   * @param {string} state - Animation state
   * @returns {number} Duration in seconds
   */
  getStateDuration(state) {
    switch (state) {
      case 'attacking': return this.attackDuration;
      case 'hit': return this.damageDuration;
      case 'headshot': return this.headShotDuration;
      case 'limb_hit': return this.limbHitDuration;
      case 'dying': return this.deathDuration;
      default: return 0;
    }
  }
  
  /**
   * Change animation state
   */
  setState(newState) {
    // Skip if already in this state
    if (newState === this.state) return;
    
    // Reset body parts to original positions when changing states
    this.resetBodyParts();
    
    // Set new state
    this.state = newState;
    
    // Reset state timer
    this.animationStateTime = 0;
    this.animationComplete = false;
  }
  
  /**
   * Idle animation - subtle swaying motion
   */
  animateIdle() {
    if (!this.hasRequiredParts()) return;
    
    const time = this.animationTime;
    const swayAmount = 0.05;
    
    // Subtle body sway
    this.bodyParts.body.rotation.z = this.originalTransforms.body.rotation.z + 
      Math.sin(time * 0.8) * swayAmount;
    
    // Head movement
    this.bodyParts.head.rotation.z = this.originalTransforms.head.rotation.z + 
      Math.sin(time * 0.7) * swayAmount * 1.5;
    
    // Arms hanging and swaying slightly
    this.bodyParts.leftArm.rotation.z = this.originalTransforms.leftArm.rotation.z + 
      Math.sin(time * 0.9) * swayAmount;
    this.bodyParts.rightArm.rotation.z = this.originalTransforms.rightArm.rotation.z + 
      Math.sin(time * 0.9 + 0.5) * swayAmount;
  }
  
  /**
   * Walking animation - alternating leg movements with arm swinging
   */
  animateWalking() {
    if (!this.hasRequiredParts()) return;
    
    const time = this.animationTime;
    const walkCycle = time * this.walkCycleSpeed * Math.PI;
    const legAmount = 0.4; // Leg rotation amount
    const armAmount = 0.3; // Arm swing amount
    
    // Body tilts slightly with each step
    this.bodyParts.body.rotation.z = this.originalTransforms.body.rotation.z + 
      Math.sin(walkCycle * 2) * 0.05;
    
    // Head bobs slightly
    this.bodyParts.head.rotation.z = this.originalTransforms.head.rotation.z + 
      Math.sin(walkCycle * 2) * 0.1;
    
    // Legs alternate forward and backward
    this.bodyParts.leftLeg.rotation.x = Math.sin(walkCycle) * legAmount;
    this.bodyParts.rightLeg.rotation.x = Math.sin(walkCycle + Math.PI) * legAmount;
    
    // Arms swing opposite to legs
    this.bodyParts.leftArm.rotation.x = Math.sin(walkCycle + Math.PI) * armAmount;
    this.bodyParts.rightArm.rotation.x = Math.sin(walkCycle) * armAmount;
  }
  
  /**
   * Attacking animation - lunging forward with arms outstretched
   */
  animateAttacking() {
    if (!this.hasRequiredParts()) return;
    
    const progress = Math.min(this.currentAnimationTime / this.attackDuration, 1);
    const returnPhase = progress > 0.6; // Return to normal pose after 60% of animation
    
    // Attack progress from 0 to 1, then back to 0
    const attackProgress = returnPhase ? 
      1 - ((progress - 0.6) / 0.4) : // Return phase (0.6 to 1.0) mapped to 1.0 to 0
      progress / 0.6; // Attack phase (0 to 0.6) mapped to 0 to 1.0
    
    // Lunge forward
    this.bodyParts.body.rotation.x = attackProgress * 0.2;
    
    // Head looks up slightly during attack
    this.bodyParts.head.rotation.x = attackProgress * -0.3;
    
    // Arms reach forward during attack
    this.bodyParts.leftArm.rotation.x = this.originalTransforms.leftArm.rotation.x + 
      attackProgress * 0.8;
    this.bodyParts.rightArm.rotation.x = this.originalTransforms.rightArm.rotation.x + 
      attackProgress * 0.8;
    
    // Complete attack animation cycle
    if (progress >= 1) {
      this.setState('idle');
    }
  }
  
  /**
   * Animate standard hit (torso hit)
   */
  animateHit() {
    if (!this.bodyParts.body || !this.bodyParts.head) return;
    
    // Calculate animation progress (0 to 1)
    const progress = Math.min(this.animationStateTime / this.damageDuration, 1);
    
    // Animation curve for more realistic movement
    const curve = Math.sin(progress * Math.PI);
    
    // Body reacts to impact
    this.bodyParts.body.rotation.x = curve * 0.2; // Bend back slightly
    this.bodyParts.body.rotation.z = curve * 0.15; // Twist sideways
    
    // Head reacts to body movement
    this.bodyParts.head.rotation.x = curve * -0.3; // Head bend forward in reaction
    
    // Arms move outward
    if (this.bodyParts.leftArm) {
      this.bodyParts.leftArm.rotation.z = this.originalTransforms.leftArm.rotation.z + curve * 0.3;
    }
    
    if (this.bodyParts.rightArm) {
      this.bodyParts.rightArm.rotation.z = this.originalTransforms.rightArm.rotation.z - curve * 0.3;
    }
  }
  
  /**
   * Animate headshot reaction
   */
  animateHeadshot() {
    if (!this.bodyParts.head) return;
    
    // Calculate animation progress (0 to 1)
    const progress = Math.min(this.animationStateTime / this.headShotDuration, 1);
    
    // Animation curve for more realistic movement
    const curve = Math.sin(progress * Math.PI);
    
    // Head reacts violently to headshot
    this.bodyParts.head.rotation.z = curve * 0.7; // Head snaps sideways
    this.bodyParts.head.rotation.x = curve * 0.5; // Head snaps back
    
    // Body follows head movement with delay
    if (this.bodyParts.body) {
      const bodyCurve = Math.sin(Math.max(0, progress - 0.1) * Math.PI);
      this.bodyParts.body.rotation.z = bodyCurve * 0.3;
      this.bodyParts.body.rotation.x = bodyCurve * 0.2;
    }
    
    // Arms move up in reaction
    if (this.bodyParts.leftArm) {
      this.bodyParts.leftArm.rotation.x = this.originalTransforms.leftArm.rotation.x + curve * 0.5;
    }
    
    if (this.bodyParts.rightArm) {
      this.bodyParts.rightArm.rotation.x = this.originalTransforms.rightArm.rotation.x + curve * 0.4;
    }
  }
  
  /**
   * Animate limb hit reaction
   */
  animateLimbHit() {
    // Calculate animation progress (0 to 1)
    const progress = Math.min(this.animationStateTime / this.limbHitDuration, 1);
    
    // Animation curve for more realistic movement
    const curve = Math.sin(progress * Math.PI);
    
    // Random choice between left and right limb (based on animation time)
    const isLeftSide = Math.floor(this.animationTime * 7) % 2 === 0;
    
    if (isLeftSide) {
      // Left side hit
      if (this.bodyParts.leftArm) {
        this.bodyParts.leftArm.rotation.z = this.originalTransforms.leftArm.rotation.z + curve * 0.6;
        this.bodyParts.leftArm.rotation.x = this.originalTransforms.leftArm.rotation.x + curve * 0.3;
      }
      
      if (this.bodyParts.leftLeg) {
        this.bodyParts.leftLeg.rotation.x = this.originalTransforms.leftLeg.rotation.x + curve * 0.4;
      }
      
      // Body leans slightly away from hit
      if (this.bodyParts.body) {
        this.bodyParts.body.rotation.z = curve * -0.15;
      }
    } else {
      // Right side hit
      if (this.bodyParts.rightArm) {
        this.bodyParts.rightArm.rotation.z = this.originalTransforms.rightArm.rotation.z - curve * 0.6;
        this.bodyParts.rightArm.rotation.x = this.originalTransforms.rightArm.rotation.x + curve * 0.3;
      }
      
      if (this.bodyParts.rightLeg) {
        this.bodyParts.rightLeg.rotation.x = this.originalTransforms.rightLeg.rotation.x + curve * 0.4;
      }
      
      // Body leans slightly away from hit
      if (this.bodyParts.body) {
        this.bodyParts.body.rotation.z = curve * 0.15;
      }
    }
  }
  
  /**
   * Damaged animation - flinching back
   */
  animateDamaged(deltaTime) {
    if (!this.hasRequiredParts()) return;
    
    const progress = Math.min(this.currentAnimationTime / this.damageDuration, 1);
    
    // Flinch backward
    this.bodyParts.body.rotation.x = -progress * 0.2 * Math.sin(progress * Math.PI);
    
    // Head jerks back
    this.bodyParts.head.rotation.x = -progress * 0.4 * Math.sin(progress * Math.PI);
    
    // Arms raise slightly in reaction
    this.bodyParts.leftArm.rotation.z = this.originalTransforms.leftArm.rotation.z - 
      progress * 0.3 * Math.sin(progress * Math.PI);
    this.bodyParts.rightArm.rotation.z = this.originalTransforms.rightArm.rotation.z - 
      progress * 0.3 * Math.sin(progress * Math.PI);
    
    // Return to previous state when complete
    if (progress >= 1) {
      this.setState(this.zombie.isMoving ? 'walking' : 'idle');
    }
  }
  
  /**
   * Dying animation - collapsing to the ground
   */
  animateDying() {
    if (!this.hasRequiredParts()) return;
    
    const progress = Math.min(this.currentAnimationTime / this.deathDuration, 1);
    
    // Body falls forward
    this.bodyParts.body.rotation.x = progress * 1.5;
    this.bodyParts.body.position.y = this.originalTransforms.body.position.y - 
      progress * 0.8;
    
    // Head slumps forward
    this.bodyParts.head.rotation.x = progress * 0.7;
    
    // Arms go limp
    this.bodyParts.leftArm.rotation.z = this.originalTransforms.leftArm.rotation.z - 
      progress * 0.5;
    this.bodyParts.rightArm.rotation.z = this.originalTransforms.rightArm.rotation.z + 
      progress * 0.5;
    
    // Legs collapse
    this.bodyParts.leftLeg.rotation.x = -progress * 0.8;
    this.bodyParts.rightLeg.rotation.x = -progress * 0.6;
    
    // Transition to dead state when complete
    if (progress >= 1) {
      this.setState('dead');
    }
  }
  
  /**
   * Dead animation - static pose with subtle movement from wind
   */
  animateDead() {
    // No additional animation needed, the body stays in final death pose
    // Could add subtle wind effect here if desired
  }
  
  /**
   * Reset all animations to default pose
   */
  resetPose() {
    if (!this.hasRequiredParts()) return;
    
    // Reset body parts to original positions and rotations
    if (this.bodyParts.body) {
      this.bodyParts.body.position.copy(this.originalTransforms.body.position);
      this.bodyParts.body.rotation.copy(this.originalTransforms.body.rotation);
    }
    
    if (this.bodyParts.head) {
      this.bodyParts.head.position.copy(this.originalTransforms.head.position);
      this.bodyParts.head.rotation.copy(this.originalTransforms.head.rotation);
    }
    
    if (this.bodyParts.leftArm) {
      this.bodyParts.leftArm.position.copy(this.originalTransforms.leftArm.position);
      this.bodyParts.leftArm.rotation.copy(this.originalTransforms.leftArm.rotation);
    }
    
    if (this.bodyParts.rightArm) {
      this.bodyParts.rightArm.position.copy(this.originalTransforms.rightArm.position);
      this.bodyParts.rightArm.rotation.copy(this.originalTransforms.rightArm.rotation);
    }
    
    if (this.bodyParts.leftLeg) {
      this.bodyParts.leftLeg.position.copy(this.originalTransforms.leftLeg.position);
      this.bodyParts.leftLeg.rotation.copy(this.originalTransforms.leftLeg.rotation);
    }
    
    if (this.bodyParts.rightLeg) {
      this.bodyParts.rightLeg.position.copy(this.originalTransforms.rightLeg.position);
      this.bodyParts.rightLeg.rotation.copy(this.originalTransforms.rightLeg.rotation);
    }
  }
  
  /**
   * Check if the zombie model has all required parts for animation
   */
  hasRequiredParts() {
    return this.bodyParts.body && this.bodyParts.head && 
           this.bodyParts.leftArm && this.bodyParts.rightArm &&
           this.bodyParts.leftLeg && this.bodyParts.rightLeg;
  }
} 