import * as THREE from 'three';
import { ZombieModel } from './ZombieModel.js';

/**
 * BruteZombieModel - Larger, stronger zombie model
 * These zombies are slower but have more health and deal more damage
 */
export class BruteZombieModel extends ZombieModel {
  constructor(assetLoader, options = {}) {
    // Call parent constructor with zombie type set to 'brute'
    super(assetLoader, {
      zombieType: 'brute',
      ...options
    });
  }
  
  /**
   * Create high detail model with brute zombie characteristics
   * Brute zombies are larger, bulkier, and more intimidating
   */
  createHighDetailModel() {
    const group = new THREE.Group();
    
    // Create body - brute zombie has wider, bulkier proportions
    const bodyGeometry = new THREE.BoxGeometry(1.0, 1.3, 0.6);
    const bodyMaterial = this.createBodyMaterial();
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.65;
    body.rotation.z = THREE.MathUtils.degToRad(-3); // Slight tilt
    body.castShadow = true;
    
    // Create head - larger, more intimidating head
    const headGeometry = new THREE.BoxGeometry(0.7, 0.6, 0.6);
    const headMaterial = this.createHeadMaterial();
    
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.6;
    head.rotation.z = THREE.MathUtils.degToRad(10);
    head.castShadow = true;
    
    // Create limbs - thicker, more powerful arms and legs
    const armGeometry = new THREE.BoxGeometry(0.3, 0.9, 0.3);
    const legGeometry = new THREE.BoxGeometry(0.35, 0.7, 0.35);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.65, 0.7, 0);
    leftArm.rotation.z = THREE.MathUtils.degToRad(15);
    leftArm.castShadow = true;
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.65, 0.7, 0);
    rightArm.rotation.z = THREE.MathUtils.degToRad(-15);
    rightArm.castShadow = true;
    
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.3, 0.0, 0);
    leftLeg.castShadow = true;
    
    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.3, 0.0, 0);
    rightLeg.castShadow = true;
    
    // Add random clothing/details depending on variation
    this.addDetails(group, body, head, leftArm, rightArm, leftLeg, rightLeg);
    
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
    
    // Add some randomization to the zombie's appearance
    this.randomizeAppearance();
    
    // Create health bar - positioned higher for taller brute
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
    
    // Simplified body
    const bodyGeometry = new THREE.BoxGeometry(1.0, 1.8, 0.6);
    const bodyMaterial = this.createSimplifiedMaterial();
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.9;
    body.castShadow = true;
    
    // Simplified limbs
    const armGeometry = new THREE.BoxGeometry(0.3, 0.9, 0.3);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.65, 0.7, 0);
    leftArm.rotation.z = THREE.MathUtils.degToRad(15);
    leftArm.castShadow = true;
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.65, 0.7, 0);
    rightArm.rotation.z = THREE.MathUtils.degToRad(-15);
    rightArm.castShadow = true;
    
    // Combined legs
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.5), bodyMaterial);
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
    
    // Single mesh representation - larger for brute
    const geometry = new THREE.BoxGeometry(1.0, 2.0, 0.6);
    const material = new THREE.MeshBasicMaterial({
      color: this.getZombieColor(),
    });
    
    const zombieMesh = new THREE.Mesh(geometry, material);
    zombieMesh.position.y = 1.0;
    zombieMesh.castShadow = true;
    
    group.add(zombieMesh);
    
    // No health bar for low detail
    
    // Store model
    this.detailLevels.low = group;
  }
  
  /**
   * Add clothing and detail elements based on variation
   */
  addDetails(group, body, head, leftArm, rightArm, leftLeg, rightLeg) {
    const variation = this.options.variation % 4; // 4 different variations
    
    // Create materials
    const clothMaterial = new THREE.MeshStandardMaterial({
      color: this.getClothingColor(variation),
      roughness: 0.8,
      metalness: 0.0
    });
    
    // Add different details based on variation
    switch (variation) {
      case 0: // Security guard/bouncer
        const jacketGeometry = new THREE.BoxGeometry(1.05, 0.8, 0.65);
        const jacket = new THREE.Mesh(jacketGeometry, clothMaterial);
        jacket.position.y = 0.8;
        jacket.position.z = -0.01;
        
        const badgeGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.1);
        const badgeMaterial = new THREE.MeshStandardMaterial({
          color: 0xffeb3b, // Yellow badge
          roughness: 0.5,
          metalness: 0.5
        });
        const badge = new THREE.Mesh(badgeGeometry, badgeMaterial);
        badge.position.set(0.4, 1.2, 0.35);
        
        group.add(jacket);
        group.add(badge);
        break;
        
      case 1: // Football player
        const jerseyGeometry = new THREE.BoxGeometry(1.05, 0.7, 0.65);
        const jerseyMaterial = new THREE.MeshStandardMaterial({
          color: 0xf44336, // Red
          roughness: 0.8
        });
        const jersey = new THREE.Mesh(jerseyGeometry, jerseyMaterial);
        jersey.position.y = 0.85;
        jersey.position.z = -0.01;
        
        const shoulderPadLeftGeometry = new THREE.BoxGeometry(0.4, 0.25, 0.4);
        const shoulderPadLeft = new THREE.Mesh(shoulderPadLeftGeometry, jerseyMaterial);
        shoulderPadLeft.position.set(-0.6, 1.1, 0);
        
        const shoulderPadRightGeometry = new THREE.BoxGeometry(0.4, 0.25, 0.4);
        const shoulderPadRight = new THREE.Mesh(shoulderPadRightGeometry, jerseyMaterial);
        shoulderPadRight.position.set(0.6, 1.1, 0);
        
        group.add(jersey);
        group.add(shoulderPadLeft);
        group.add(shoulderPadRight);
        break;
        
      case 2: // Construction worker with hard hat
        const overallsGeometry = new THREE.BoxGeometry(1.05, 1.5, 0.65);
        const overalls = new THREE.Mesh(overallsGeometry, clothMaterial);
        overalls.position.y = 0.6;
        overalls.position.z = -0.01;
        
        const hatGeometry = new THREE.BoxGeometry(0.75, 0.2, 0.7);
        const hatMaterial = new THREE.MeshStandardMaterial({
          color: 0xf57f17, // Orange
          roughness: 0.8
        });
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.y = 1.9;
        
        group.add(overalls);
        group.add(hat);
        break;
        
      case 3: // Military with armor
        const vestGeometry = new THREE.BoxGeometry(1.1, 0.9, 0.7);
        const vestMaterial = new THREE.MeshStandardMaterial({
          color: 0x004d40, // Dark green
          roughness: 0.9
        });
        const vest = new THREE.Mesh(vestGeometry, vestMaterial);
        vest.position.y = 0.8;
        
        const helmetGeometry = new THREE.BoxGeometry(0.75, 0.3, 0.7);
        const helmet = new THREE.Mesh(helmetGeometry, vestMaterial);
        helmet.position.y = 1.85;
        
        group.add(vest);
        group.add(helmet);
        break;
    }
  }
  
  /**
   * Create health bar for high detail model
   * Override to position higher for taller brute
   */
  createHealthBar(parent) {
    const barWidth = 1.0; // Wider health bar for brute
    const barHeight = 0.12;
    
    // Create background
    const barGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
    const barBackgroundMaterial = new THREE.MeshBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.7
    });
    
    this.healthBarBackground = new THREE.Mesh(barGeometry, barBackgroundMaterial);
    this.healthBarBackground.position.y = 2.4; // Higher position for taller brute
    
    // Create foreground (actual health indicator)
    const healthBarMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.9
    });
    
    this.healthBar = new THREE.Mesh(barGeometry, healthBarMaterial);
    this.healthBar.position.y = 2.4; // Higher position
    this.healthBar.position.z = 0.01; // Slightly in front of background
    
    // Initial scale (full health)
    this.healthBar.scale.x = 1.0;
    
    // Add to parent
    parent.add(this.healthBarBackground);
    parent.add(this.healthBar);
  }
  
  /**
   * Get clothing color based on variation
   */
  getClothingColor(variation) {
    // Different clothing colors for variations
    const colors = [
      0x263238, // Very dark blue (security)
      0x827717, // Olive (football)
      0x4e342e, // Brown (construction)
      0x33691e  // Dark green (military)
    ];
    
    return new THREE.Color(colors[variation]);
  }
  
  /**
   * Randomize the zombie's appearance slightly
   */
  randomizeAppearance() {
    if (!this.bodyParts.body) return;
    
    // Brutes have less randomization - more imposing stable stance
    
    // Subtle body tilt
    this.bodyParts.body.rotation.z += (Math.random() * 0.1 - 0.05);
    
    // Subtle head tilt
    if (this.bodyParts.head) {
      this.bodyParts.head.rotation.z += (Math.random() * 0.15 - 0.075);
      this.bodyParts.head.rotation.y = (Math.random() * 0.3 - 0.15);
    }
    
    // Randomize arm positions
    if (this.bodyParts.leftArm) {
      this.bodyParts.leftArm.rotation.z += (Math.random() * 0.2 - 0.1);
    }
    
    if (this.bodyParts.rightArm) {
      this.bodyParts.rightArm.rotation.z += (Math.random() * 0.2 - 0.1);
    }
    
    // Brute zombies are larger overall
    const scaleVariation = 1.1 + Math.random() * 0.2; // 1.1 to 1.3
    this.container.scale.set(scaleVariation, scaleVariation, scaleVariation);
  }
  
  /**
   * Override animation speeds for brute zombies
   * They should move slower but hit harder
   */
  init() {
    // Call parent init first
    super.init();
    
    // Brute zombies have slower animations
    if (this.animation) {
      this.animation.walkCycleSpeed = 1.0; // Slower walking animation
      this.animation.attackDuration = 0.8; // Slower but more powerful attack
      this.animation.damageDuration = 0.4; // More resilient to damage
    }
    
    return this.container;
  }
} 