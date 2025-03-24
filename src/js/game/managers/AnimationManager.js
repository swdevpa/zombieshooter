import * as THREE from 'three';

/**
 * AnimationManager - Handles smooth transitions between animations and animation blending
 */
export class AnimationManager {
  constructor() {
    // Animation state tracking
    this.currentState = null;
    this.targetState = null;
    this.transitionTime = 0;
    this.transitionDuration = 0.3; // Default transition duration in seconds
    
    // Animation blending weights
    this.blendWeights = {
      current: 1.0,
      target: 0.0
    };
    
    // Animation event system
    this.eventListeners = new Map();
    
    // Debug visualization
    this.debugEnabled = false;
    this.debugVisualization = null;
  }
  
  /**
   * Initialize the animation manager
   */
  init() {
    // Create debug visualization if enabled
    if (this.debugEnabled) {
      this.createDebugVisualization();
    }
  }
  
  /**
   * Start a transition to a new animation state
   * @param {string} newState - The target animation state
   * @param {number} duration - Optional custom transition duration
   */
  transitionTo(newState, duration = null) {
    if (newState === this.currentState) return;
    
    this.targetState = newState;
    this.transitionTime = 0;
    this.transitionDuration = duration || this.transitionDuration;
    
    // Reset blend weights
    this.blendWeights.current = 1.0;
    this.blendWeights.target = 0.0;
    
    // Trigger transition start event
    this.triggerEvent('transitionStart', { from: this.currentState, to: newState });
  }
  
  /**
   * Update animation blending and transitions
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    if (!this.targetState) return;
    
    // Update transition progress
    this.transitionTime += deltaTime;
    const progress = Math.min(this.transitionTime / this.transitionDuration, 1.0);
    
    // Smooth blending using ease-in-out curve
    const blendFactor = this.easeInOutCubic(progress);
    
    // Update blend weights
    this.blendWeights.current = 1.0 - blendFactor;
    this.blendWeights.target = blendFactor;
    
    // Check if transition is complete
    if (progress >= 1.0) {
      this.currentState = this.targetState;
      this.targetState = null;
      this.blendWeights.current = 0.0;
      this.blendWeights.target = 1.0;
      
      // Trigger transition complete event
      this.triggerEvent('transitionComplete', { state: this.currentState });
    }
    
    // Update debug visualization if enabled
    if (this.debugEnabled) {
      this.updateDebugVisualization();
    }
  }
  
  /**
   * Apply blended animation to a target object
   * @param {THREE.Object3D} target - The object to animate
   * @param {Object} currentPose - Current animation pose
   * @param {Object} targetPose - Target animation pose
   */
  applyBlendedPose(target, currentPose, targetPose) {
    if (!target) return;
    
    // Blend position
    target.position.lerpVectors(
      currentPose.position,
      targetPose.position,
      this.blendWeights.target
    );
    
    // Blend rotation
    target.quaternion.slerpQuaternions(
      currentPose.rotation,
      targetPose.rotation,
      this.blendWeights.target
    );
    
    // Blend scale
    target.scale.lerpVectors(
      currentPose.scale,
      targetPose.scale,
      this.blendWeights.target
    );
  }
  
  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }
  
  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }
  
  /**
   * Trigger an animation event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  triggerEvent(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => callback(data));
    }
  }
  
  /**
   * Create debug visualization
   */
  createDebugVisualization() {
    // Create a simple visualization of the current animation state
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.debugVisualization = new THREE.Mesh(geometry, material);
  }
  
  /**
   * Update debug visualization
   */
  updateDebugVisualization() {
    if (!this.debugVisualization) return;
    
    // Update visualization based on current state
    if (this.currentState) {
      this.debugVisualization.material.color.setHex(0x00ff00);
    } else if (this.targetState) {
      this.debugVisualization.material.color.setHex(0xff0000);
    } else {
      this.debugVisualization.material.color.setHex(0x0000ff);
    }
  }
  
  /**
   * Ease-in-out cubic interpolation
   * @param {number} t - Time value between 0 and 1
   * @returns {number} Interpolated value
   */
  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  /**
   * Enable or disable debug visualization
   * @param {boolean} enabled - Whether debug visualization is enabled
   */
  setDebugEnabled(enabled) {
    this.debugEnabled = enabled;
    if (enabled && !this.debugVisualization) {
      this.createDebugVisualization();
    }
  }
} 