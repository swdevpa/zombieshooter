import * as THREE from 'three';
import { ZombieAnimation } from '../animations/ZombieAnimation.js';

/**
 * Base class for all zombie models
 * Handles common zombie model functionality and integration with the animation system
 */
export class ZombieModel {
  constructor(assetLoader, options = {}) {
    this.assetLoader = assetLoader;
    
    // Options with defaults
    this.options = {
      detailLevel: 2, // 0 = low, 1 = medium, 2 = high
      zombieType: 'standard', // standard, runner, brute
      variation: 0, // Used for appearance variations within a type
      ...options
    };
    
    // Model properties
    this.container = new THREE.Group();
    this.detailLevels = {
      high: null,   // Level 2 - Full model
      medium: null, // Level 1 - Simplified model
      low: null     // Level 0 - Basic representation
    };
    
    // Body parts for animation
    this.bodyParts = {
      body: null,
      head: null,
      leftArm: null,
      rightArm: null,
      leftLeg: null,
      rightLeg: null
    };
    
    // Animation system
    this.animation = new ZombieAnimation(this);
    
    // Health bar components
    this.healthBarBackground = null;
    this.healthBar = null;
  }
  
  /**
   * Initialize the zombie model
   */
  init() {
    // Create models for each detail level
    this.createHighDetailModel();
    this.createMediumDetailModel();
    this.createLowDetailModel();
    
    // Set initial detail level
    this.setDetailLevel(this.options.detailLevel);
    
    // Initialize animation system with references to body parts
    this.animation.init(this.bodyParts);
    
    return this.container;
  }
  
  /**
   * Create high detail model (to be implemented by subclasses)
   */
  createHighDetailModel() {
    // Base implementation creates a placeholder model
    const group = new THREE.Group();
    
    // Create body
    const bodyGeometry = new THREE.BoxGeometry(0.7, 1.1, 0.4);
    const bodyMaterial = this.createBodyMaterial();
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.55;
    body.castShadow = true;
    
    // Create head
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMaterial = this.createHeadMaterial();
    
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.35;
    head.castShadow = true;
    
    // Create limbs
    const armGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const legGeometry = new THREE.BoxGeometry(0.25, 0.6, 0.25);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.45, 0.6, 0);
    leftArm.castShadow = true;
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.45, 0.6, 0);
    rightArm.castShadow = true;
    
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.2, 0.0, 0);
    leftLeg.castShadow = true;
    
    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.2, 0.0, 0);
    rightLeg.castShadow = true;
    
    // Add parts to group
    group.add(body);
    group.add(head);
    group.add(leftArm);
    group.add(rightArm);
    group.add(leftLeg);
    group.add(rightLeg);
    
    // Store references for animation
    this.bodyParts.body = body;
    this.bodyParts.head = head;
    this.bodyParts.leftArm = leftArm;
    this.bodyParts.rightArm = rightArm;
    this.bodyParts.leftLeg = leftLeg;
    this.bodyParts.rightLeg = rightLeg;
    
    // Create health bar
    this.createHealthBar(group);
    
    // Store model
    this.detailLevels.high = group;
  }
  
  /**
   * Create medium detail model (simplified version)
   */
  createMediumDetailModel() {
    // Create a simplified model for medium distance rendering
    const group = new THREE.Group();
    
    // Simplified body (combines body and head)
    const bodyGeometry = new THREE.BoxGeometry(0.7, 1.6, 0.4);
    const bodyMaterial = this.createSimplifiedMaterial();
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    body.castShadow = true;
    
    // Simplified limbs
    const armGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.45, 0.6, 0);
    leftArm.castShadow = true;
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.45, 0.6, 0);
    rightArm.castShadow = true;
    
    // Combined legs
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.4), bodyMaterial);
    legs.position.y = 0;
    legs.castShadow = true;
    
    // Add parts to group
    group.add(body);
    group.add(leftArm);
    group.add(rightArm);
    group.add(legs);
    
    // Create simplified health bar
    this.createSimplifiedHealthBar(group);
    
    // Store model
    this.detailLevels.medium = group;
  }
  
  /**
   * Create low detail model (basic representation)
   */
  createLowDetailModel() {
    // Create extremely simplified model for far distance rendering
    const group = new THREE.Group();
    
    // Single mesh representation
    const geometry = new THREE.BoxGeometry(0.7, 1.8, 0.4);
    const material = new THREE.MeshBasicMaterial({
      color: this.getZombieColor(),
    });
    
    const zombieMesh = new THREE.Mesh(geometry, material);
    zombieMesh.position.y = 0.9;
    zombieMesh.castShadow = true;
    
    group.add(zombieMesh);
    
    // No health bar for low detail
    
    // Store model
    this.detailLevels.low = group;
  }
  
  /**
   * Create body material with appropriate textures
   */
  createBodyMaterial() {
    // Check if textures are available
    if (this.assetLoader && this.assetLoader.getTexture('zombie')) {
      return new THREE.MeshStandardMaterial({
        map: this.assetLoader.getTexture('zombie'),
        color: this.getZombieColor(),
        roughness: 0.9,
        metalness: 0.0
      });
    } else {
      // Fallback material if texture isn't available
      return new THREE.MeshStandardMaterial({
        color: this.getZombieColor(),
        roughness: 0.9,
        metalness: 0.0
      });
    }
  }
  
  /**
   * Create head material with appropriate textures
   */
  createHeadMaterial() {
    // Check if textures are available
    if (this.assetLoader && this.assetLoader.getTexture('zombieHead')) {
      return new THREE.MeshStandardMaterial({
        map: this.assetLoader.getTexture('zombieHead'),
        color: this.getZombieHeadColor(),
        roughness: 0.9
      });
    } else {
      // Fallback material if texture isn't available
      return new THREE.MeshStandardMaterial({
        color: this.getZombieHeadColor(),
        roughness: 0.9
      });
    }
  }
  
  /**
   * Create simplified material for medium detail level
   */
  createSimplifiedMaterial() {
    // Simplified material with less features for better performance
    if (this.assetLoader && this.assetLoader.getTexture('zombie')) {
      return new THREE.MeshLambertMaterial({
        map: this.assetLoader.getTexture('zombie'),
        color: this.getZombieColor()
      });
    } else {
      return new THREE.MeshLambertMaterial({
        color: this.getZombieColor()
      });
    }
  }
  
  /**
   * Get base zombie color based on type and variation
   */
  getZombieColor() {
    // Different zombie types have different base colors
    switch (this.options.zombieType) {
      case 'runner':
        return new THREE.Color(0xaed581); // Lighter, more yellowish green
      case 'brute':
        return new THREE.Color(0x558b2f); // Darker, more intense green
      case 'standard':
      default:
        return new THREE.Color(0x8bc34a); // Standard zombie green
    }
  }
  
  /**
   * Get zombie head color (usually slightly different than body)
   */
  getZombieHeadColor() {
    // Head color is usually a bit lighter than body
    const bodyColor = this.getZombieColor();
    const headColor = bodyColor.clone();
    headColor.r = Math.min(headColor.r * 1.1, 1.0);
    headColor.g = Math.min(headColor.g * 1.1, 1.0);
    headColor.b = Math.min(headColor.b * 1.1, 1.0);
    return headColor;
  }
  
  /**
   * Create health bar for high detail model
   */
  createHealthBar(parent) {
    const barWidth = 0.8;
    const barHeight = 0.1;
    
    // Create background
    const barGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
    const barBackgroundMaterial = new THREE.MeshBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.7
    });
    
    this.healthBarBackground = new THREE.Mesh(barGeometry, barBackgroundMaterial);
    this.healthBarBackground.position.y = 2.0;
    
    // Create foreground (actual health indicator)
    const healthBarMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.9
    });
    
    this.healthBar = new THREE.Mesh(barGeometry, healthBarMaterial);
    this.healthBar.position.y = 2.0;
    this.healthBar.position.z = 0.01; // Slightly in front of background
    
    // Initial scale (full health)
    this.healthBar.scale.x = 1.0;
    
    // Add to parent
    parent.add(this.healthBarBackground);
    parent.add(this.healthBar);
  }
  
  /**
   * Create simplified health bar for medium detail
   */
  createSimplifiedHealthBar(parent) {
    // Simplified version with less geometry
    const barWidth = 0.8;
    const barHeight = 0.1;
    
    const barGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
    const barBackgroundMaterial = new THREE.MeshBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.7
    });
    
    const healthBarMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.9
    });
    
    this.healthBarBackground = new THREE.Mesh(barGeometry, barBackgroundMaterial);
    this.healthBarBackground.position.y = 2.0;
    
    this.healthBar = new THREE.Mesh(barGeometry, healthBarMaterial);
    this.healthBar.position.y = 2.0;
    this.healthBar.position.z = 0.01;
    this.healthBar.scale.x = 1.0;
    
    parent.add(this.healthBarBackground);
    parent.add(this.healthBar);
  }
  
  /**
   * Update health bar display
   */
  updateHealthBar(health, maxHealth) {
    if (!this.healthBar) return;
    
    const healthPercent = Math.max(0, Math.min(health / maxHealth, 1));
    const barWidth = 0.8; // Should match the width set in createHealthBar
    
    // Update the scale and position of the health bar
    this.healthBar.scale.x = healthPercent;
    
    // Adjust position so bar shrinks from right to left
    this.healthBar.position.x = -(barWidth * (1 - healthPercent)) / 2;
  }
  
  /**
   * Set the detail level of the model (0=low, 1=medium, 2=high)
   */
  setDetailLevel(level) {
    // Clear current model from container
    while (this.container.children.length > 0) {
      this.container.remove(this.container.children[0]);
    }
    
    // Add appropriate detail level model
    let modelToUse;
    switch (level) {
      case 0:
        modelToUse = this.detailLevels.low;
        break;
      case 1:
        modelToUse = this.detailLevels.medium;
        break;
      case 2:
      default:
        modelToUse = this.detailLevels.high;
        break;
    }
    
    if (modelToUse) {
      this.container.add(modelToUse);
    }
  }
  
  /**
   * Update the model (called each frame)
   */
  update(deltaTime) {
    // Update animation system
    this.animation.update(deltaTime);
  }
  
  /**
   * Set animation state
   */
  setAnimationState(state) {
    this.animation.setState(state);
  }
  
  /**
   * Get container object for adding to scene
   */
  getContainer() {
    return this.container;
  }
} 