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
    
    // Current and target poses for blending
    this.currentPose = this.createEmptyPose();
    this.targetPose = this.createEmptyPose();
  }
  
  /**
   * Create an empty pose object
   */
  createEmptyPose() {
    return {
      body: { position: new THREE.Vector3(), rotation: new THREE.Euler(), scale: new THREE.Vector3(1, 1, 1) },
      head: { position: new THREE.Vector3(), rotation: new THREE.Euler(), scale: new THREE.Vector3(1, 1, 1) },
      leftArm: { position: new THREE.Vector3(), rotation: new THREE.Euler(), scale: new THREE.Vector3(1, 1, 1) },
      rightArm: { position: new THREE.Vector3(), rotation: new THREE.Euler(), scale: new THREE.Vector3(1, 1, 1) },
      leftLeg: { position: new THREE.Vector3(), rotation: new THREE.Euler(), scale: new THREE.Vector3(1, 1, 1) },
      rightLeg: { position: new THREE.Vector3(), rotation: new THREE.Euler(), scale: new THREE.Vector3(1, 1, 1) }
    };
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
    
    // Initialize current pose with original transforms
    this.updateCurrentPose();
  }
  
  /**
   * Update current pose from body parts
   */
  updateCurrentPose() {
    if (this.bodyParts.body) {
      this.currentPose.body.position.copy(this.bodyParts.body.position);
      this.currentPose.body.rotation.copy(this.bodyParts.body.rotation);
      this.currentPose.body.scale.copy(this.bodyParts.body.scale);
    }
    
    if (this.bodyParts.head) {
      this.currentPose.head.position.copy(this.bodyParts.head.position);
      this.currentPose.head.rotation.copy(this.bodyParts.head.rotation);
      this.currentPose.head.scale.copy(this.bodyParts.head.scale);
    }
    
    if (this.bodyParts.leftArm) {
      this.currentPose.leftArm.position.copy(this.bodyParts.leftArm.position);
      this.currentPose.leftArm.rotation.copy(this.bodyParts.leftArm.rotation);
      this.currentPose.leftArm.scale.copy(this.bodyParts.leftArm.scale);
    }
    
    if (this.bodyParts.rightArm) {
      this.currentPose.rightArm.position.copy(this.bodyParts.rightArm.position);
      this.currentPose.rightArm.rotation.copy(this.bodyParts.rightArm.rotation);
      this.currentPose.rightArm.scale.copy(this.bodyParts.rightArm.scale);
    }
    
    if (this.bodyParts.leftLeg) {
      this.currentPose.leftLeg.position.copy(this.bodyParts.leftLeg.position);
      this.currentPose.leftLeg.rotation.copy(this.bodyParts.leftLeg.rotation);
      this.currentPose.leftLeg.scale.copy(this.bodyParts.leftLeg.scale);
    }
    
    if (this.bodyParts.rightLeg) {
      this.currentPose.rightLeg.position.copy(this.bodyParts.rightLeg.position);
      this.currentPose.rightLeg.rotation.copy(this.bodyParts.rightLeg.rotation);
      this.currentPose.rightLeg.scale.copy(this.bodyParts.rightLeg.scale);
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
    
    // Update current pose
    this.updateCurrentPose();
    
    // Calculate target pose based on current state
    switch (this.state) {
      case 'idle':
        this.calculateIdlePose();
        break;
      case 'walking':
        this.calculateWalkingPose();
        break;
      case 'attacking':
        this.calculateAttackingPose();
        break;
      case 'hit':
        this.calculateHitPose();
        break;
      case 'headshot':
        this.calculateHeadshotPose();
        break;
      case 'limb_hit':
        this.calculateLimbHitPose();
        break;
      case 'dying':
        this.calculateDyingPose();
        break;
      case 'dead':
        this.calculateDeadPose();
        break;
    }
    
    // Apply blended pose to body parts
    this.applyBlendedPose();
  }
  
  /**
   * Apply blended pose to body parts
   */
  applyBlendedPose() {
    if (!this.bodyParts.body) return;
    
    // Get blend weights from animation manager
    const weights = this.zombie.game.animationManager.blendWeights;
    
    // Apply blended pose to each body part
    this.applyBlendedTransform(this.bodyParts.body, this.currentPose.body, this.targetPose.body, weights);
    this.applyBlendedTransform(this.bodyParts.head, this.currentPose.head, this.targetPose.head, weights);
    this.applyBlendedTransform(this.bodyParts.leftArm, this.currentPose.leftArm, this.targetPose.leftArm, weights);
    this.applyBlendedTransform(this.bodyParts.rightArm, this.currentPose.rightArm, this.targetPose.rightArm, weights);
    this.applyBlendedTransform(this.bodyParts.leftLeg, this.currentPose.leftLeg, this.targetPose.leftLeg, weights);
    this.applyBlendedTransform(this.bodyParts.rightLeg, this.currentPose.rightLeg, this.targetPose.rightLeg, weights);
  }
  
  /**
   * Apply blended transform to a body part
   */
  applyBlendedTransform(part, current, target, weights) {
    if (!part) return;
    
    // Blend position
    part.position.lerpVectors(
      current.position,
      target.position,
      weights.target
    );
    
    // Blend rotation
    part.quaternion.slerpQuaternions(
      new THREE.Quaternion().setFromEuler(current.rotation),
      new THREE.Quaternion().setFromEuler(target.rotation),
      weights.target
    );
    
    // Blend scale
    part.scale.lerpVectors(
      current.scale,
      target.scale,
      weights.target
    );
  }
  
  /**
   * Calculate idle pose
   */
  calculateIdlePose() {
    const time = this.animationTime;
    const swayAmount = 0.05;
    
    // Calculate target pose for idle animation
    this.targetPose.body.rotation.z = this.originalTransforms.body.rotation.z + 
      Math.sin(time * 0.8) * swayAmount;
    
    this.targetPose.head.rotation.z = this.originalTransforms.head.rotation.z + 
      Math.sin(time * 0.7) * swayAmount * 1.5;
    
    this.targetPose.leftArm.rotation.z = this.originalTransforms.leftArm.rotation.z + 
      Math.sin(time * 0.9) * swayAmount;
    this.targetPose.rightArm.rotation.z = this.originalTransforms.rightArm.rotation.z + 
      Math.sin(time * 0.9 + 0.5) * swayAmount;
  }
  
  /**
   * Calculate walking pose
   */
  calculateWalkingPose() {
    const time = this.animationTime;
    const walkCycle = time * this.walkCycleSpeed * Math.PI;
    const legAmount = 0.4;
    const armAmount = 0.3;
    
    // Calculate target pose for walking animation
    this.targetPose.body.rotation.z = this.originalTransforms.body.rotation.z + 
      Math.sin(walkCycle * 2) * 0.05;
    
    this.targetPose.head.rotation.z = this.originalTransforms.head.rotation.z + 
      Math.sin(walkCycle * 2) * 0.1;
    
    this.targetPose.leftLeg.rotation.x = Math.sin(walkCycle) * legAmount;
    this.targetPose.rightLeg.rotation.x = Math.sin(walkCycle + Math.PI) * legAmount;
    
    this.targetPose.leftArm.rotation.x = Math.sin(walkCycle + Math.PI) * armAmount;
    this.targetPose.rightArm.rotation.x = Math.sin(walkCycle) * armAmount;
  }
  
  /**
   * Calculate attacking pose
   */
  calculateAttackingPose() {
    const progress = Math.min(this.currentAnimationTime / this.attackDuration, 1);
    const returnPhase = progress > 0.6;
    
    const attackProgress = returnPhase ? 
      1 - ((progress - 0.6) / 0.4) :
      progress / 0.6;
    
    // Calculate target pose for attack animation
    this.targetPose.body.rotation.x = attackProgress * 0.2;
    this.targetPose.head.rotation.x = attackProgress * -0.3;
    
    this.targetPose.leftArm.rotation.x = this.originalTransforms.leftArm.rotation.x + 
      attackProgress * 0.8;
    this.targetPose.rightArm.rotation.x = this.originalTransforms.rightArm.rotation.x + 
      attackProgress * 0.8;
  }
  
  /**
   * Calculate hit pose
   */
  calculateHitPose() {
    const progress = Math.min(this.animationStateTime / this.damageDuration, 1);
    const curve = Math.sin(progress * Math.PI);
    
    // Calculate target pose for hit animation
    this.targetPose.body.rotation.x = curve * 0.2;
    this.targetPose.body.rotation.z = curve * 0.15;
    
    this.targetPose.head.rotation.x = curve * -0.3;
    
    this.targetPose.leftArm.rotation.z = this.originalTransforms.leftArm.rotation.z + curve * 0.3;
    this.targetPose.rightArm.rotation.z = this.originalTransforms.rightArm.rotation.z - curve * 0.3;
  }
  
  /**
   * Calculate headshot pose
   */
  calculateHeadshotPose() {
    const progress = Math.min(this.animationStateTime / this.headShotDuration, 1);
    const curve = Math.sin(progress * Math.PI);
    
    // Calculate target pose for headshot animation
    this.targetPose.head.rotation.z = curve * 0.7;
    this.targetPose.head.rotation.x = curve * 0.5;
    
    const bodyCurve = Math.sin(Math.max(0, progress - 0.1) * Math.PI);
    this.targetPose.body.rotation.z = bodyCurve * 0.3;
    this.targetPose.body.rotation.x = bodyCurve * 0.2;
    
    this.targetPose.leftArm.rotation.x = this.originalTransforms.leftArm.rotation.x + curve * 0.5;
    this.targetPose.rightArm.rotation.x = this.originalTransforms.rightArm.rotation.x + curve * 0.4;
  }
  
  /**
   * Calculate limb hit pose
   */
  calculateLimbHitPose() {
    const progress = Math.min(this.animationStateTime / this.limbHitDuration, 1);
    const curve = Math.sin(progress * Math.PI);
    const isLeftSide = Math.floor(this.animationTime * 7) % 2 === 0;
    
    // Calculate target pose for limb hit animation
    if (isLeftSide) {
      this.targetPose.leftArm.rotation.z = this.originalTransforms.leftArm.rotation.z + curve * 0.6;
      this.targetPose.leftArm.rotation.x = this.originalTransforms.leftArm.rotation.x + curve * 0.3;
      
      this.targetPose.leftLeg.rotation.x = this.originalTransforms.leftLeg.rotation.x + curve * 0.4;
      
      this.targetPose.body.rotation.z = curve * -0.15;
    } else {
      this.targetPose.rightArm.rotation.z = this.originalTransforms.rightArm.rotation.z - curve * 0.6;
      this.targetPose.rightArm.rotation.x = this.originalTransforms.rightArm.rotation.x + curve * 0.3;
      
      this.targetPose.rightLeg.rotation.x = this.originalTransforms.rightLeg.rotation.x + curve * 0.4;
      
      this.targetPose.body.rotation.z = curve * 0.15;
    }
  }
  
  /**
   * Calculate dying pose
   */
  calculateDyingPose() {
    const progress = Math.min(this.currentAnimationTime / this.deathDuration, 1);
    
    // Calculate target pose for dying animation
    this.targetPose.body.rotation.x = progress * 1.5;
    this.targetPose.body.position.y = this.originalTransforms.body.position.y - progress * 0.8;
    
    this.targetPose.head.rotation.x = progress * 0.7;
    
    this.targetPose.leftArm.rotation.z = this.originalTransforms.leftArm.rotation.z - progress * 0.5;
    this.targetPose.rightArm.rotation.z = this.originalTransforms.rightArm.rotation.z + progress * 0.5;
    
    this.targetPose.leftLeg.rotation.x = -progress * 0.8;
    this.targetPose.rightLeg.rotation.x = -progress * 0.6;
  }
  
  /**
   * Calculate dead pose
   */
  calculateDeadPose() {
    // Set final pose for dead state
    this.targetPose.body.rotation.x = 1.5;
    this.targetPose.body.position.y = this.originalTransforms.body.position.y - 0.8;
    
    this.targetPose.head.rotation.x = 0.7;
    
    this.targetPose.leftArm.rotation.z = this.originalTransforms.leftArm.rotation.z - 0.5;
    this.targetPose.rightArm.rotation.z = this.originalTransforms.rightArm.rotation.z + 0.5;
    
    this.targetPose.leftLeg.rotation.x = -0.8;
    this.targetPose.rightLeg.rotation.x = -0.6;
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
    
    // Trigger state change event
    if (this.zombie.game.animationManager) {
      this.zombie.game.animationManager.triggerEvent('zombieStateChange', {
        zombie: this.zombie,
        state: newState
      });
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