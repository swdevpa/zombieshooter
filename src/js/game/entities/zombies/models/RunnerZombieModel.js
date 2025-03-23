import * as THREE from 'three';
import { ZombieModel } from './ZombieModel.js';

/**
 * RunnerZombieModel - Faster, thinner zombie model
 * These zombies are faster but have less health
 */
export class RunnerZombieModel extends ZombieModel {
  constructor(assetLoader, options = {}) {
    // Call parent constructor with zombie type set to 'runner'
    super(assetLoader, {
      zombieType: 'runner',
      ...options
    });
  }
  
  /**
   * Create high detail model with runner zombie characteristics
   * Runner zombies are thinner and more agile looking
   */
  createHighDetailModel() {
    const group = new THREE.Group();
    
    // Create body - runner zombie has thinner proportions
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.35);
    const bodyMaterial = this.createBodyMaterial();
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.rotation.z = THREE.MathUtils.degToRad(-8); // More hunched forward
    body.castShadow = true;
    
    // Create head - smaller head
    const headGeometry = new THREE.BoxGeometry(0.45, 0.45, 0.45);
    const headMaterial = this.createHeadMaterial();
    
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.4;
    head.rotation.z = THREE.MathUtils.degToRad(25); // More aggressively tilted
    head.castShadow = true;
    
    // Create limbs - thinner, longer arms and legs
    const armGeometry = new THREE.BoxGeometry(0.15, 0.8, 0.15);
    const legGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.35, 0.6, 0);
    leftArm.rotation.z = THREE.MathUtils.degToRad(30); // More outstretched
    leftArm.castShadow = true;
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.35, 0.6, 0);
    rightArm.rotation.z = THREE.MathUtils.degToRad(-40); // More outstretched
    rightArm.castShadow = true;
    
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.18, 0.0, 0);
    leftLeg.castShadow = true;
    
    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.18, 0.0, 0);
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
    
    // Create health bar
    this.createHealthBar(group);
    
    // Store model
    this.detailLevels.high = group;
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
      case 0: // Athletic wear
        const shirtGeometry = new THREE.BoxGeometry(0.65, 0.5, 0.4);
        const shirt = new THREE.Mesh(shirtGeometry, clothMaterial);
        shirt.position.y = 0.85;
        shirt.position.z = -0.01;
        
        const shortsGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.36);
        const shorts = new THREE.Mesh(shortsGeometry, clothMaterial);
        shorts.position.y = 0.3;
        shorts.position.z = -0.01;
        
        group.add(shirt);
        group.add(shorts);
        break;
        
      case 1: // Hoodie
        const hoodieGeometry = new THREE.BoxGeometry(0.65, 0.6, 0.4);
        const hoodie = new THREE.Mesh(hoodieGeometry, clothMaterial);
        hoodie.position.y = 0.85;
        hoodie.position.z = -0.01;
        
        const hoodGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.3);
        const hood = new THREE.Mesh(hoodGeometry, clothMaterial);
        hood.position.y = 1.45;
        hood.position.z = -0.1;
        
        group.add(hoodie);
        group.add(hood);
        break;
        
      case 2: // Jogger
        const jacketGeometry = new THREE.BoxGeometry(0.65, 0.5, 0.4);
        const jacketMaterial = new THREE.MeshStandardMaterial({
          color: 0x2196f3, // Blue
          roughness: 0.8
        });
        const jacket = new THREE.Mesh(jacketGeometry, jacketMaterial);
        jacket.position.y = 0.85;
        jacket.position.z = -0.01;
        
        const pantsGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.36);
        const pants = new THREE.Mesh(pantsGeometry, clothMaterial);
        pants.position.y = 0.25;
        pants.position.z = -0.01;
        
        group.add(jacket);
        group.add(pants);
        break;
        
      case 3: // Track athlete
        const tankTopGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.38);
        const tankTopMaterial = new THREE.MeshStandardMaterial({
          color: 0xf44336, // Red
          roughness: 0.8
        });
        const tankTop = new THREE.Mesh(tankTopGeometry, tankTopMaterial);
        tankTop.position.y = 0.9;
        tankTop.position.z = -0.01;
        
        const numberGeometry = new THREE.PlaneGeometry(0.2, 0.2);
        const numberMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.9
        });
        const number = new THREE.Mesh(numberGeometry, numberMaterial);
        number.position.z = 0.18;
        number.position.y = 0.9;
        
        group.add(tankTop);
        group.add(number);
        break;
    }
  }
  
  /**
   * Get clothing color based on variation
   */
  getClothingColor(variation) {
    // Different clothing colors for variations
    const colors = [
      0x03a9f4, // Light blue
      0x673ab7, // Deep purple
      0x000000, // Black
      0x757575  // Gray
    ];
    
    return new THREE.Color(colors[variation]);
  }
  
  /**
   * Randomize the zombie's appearance slightly
   */
  randomizeAppearance() {
    if (!this.bodyParts.body) return;
    
    // Runner zombies have more aggressive, frantic postures
    
    // Randomize body tilt - more hunched forward
    this.bodyParts.body.rotation.z += (Math.random() * 0.3 - 0.15);
    this.bodyParts.body.rotation.x = Math.random() * 0.3; // Lean forward
    
    // Randomize head tilt - more aggressive head position
    if (this.bodyParts.head) {
      this.bodyParts.head.rotation.z += (Math.random() * 0.4 - 0.2);
      this.bodyParts.head.rotation.y = (Math.random() * 0.7 - 0.35);
    }
    
    // Randomize arm positions - more exaggerated
    if (this.bodyParts.leftArm) {
      this.bodyParts.leftArm.rotation.z += (Math.random() * 0.5 - 0.25);
      this.bodyParts.leftArm.rotation.x = (Math.random() * 0.5 - 0.25);
    }
    
    if (this.bodyParts.rightArm) {
      this.bodyParts.rightArm.rotation.z += (Math.random() * 0.5 - 0.25);
      this.bodyParts.rightArm.rotation.x = (Math.random() * 0.5 - 0.25);
    }
    
    // Runner zombies are slightly thinner and taller
    const scaleVariation = 0.85 + Math.random() * 0.2; // 0.85 to 1.05
    this.container.scale.set(
      scaleVariation * 0.9,  // Thinner
      scaleVariation * 1.05, // Taller
      scaleVariation * 0.9   // Thinner
    );
  }
  
  /**
   * Override animation speeds for runner zombies
   * They should move faster and have quicker animations
   */
  init() {
    // Call parent init first
    super.init();
    
    // Runner zombies have faster animations
    if (this.animation) {
      this.animation.walkCycleSpeed = 2.5; // Faster walking animation
      this.animation.attackDuration = 0.5; // Quicker attack
      this.animation.damageDuration = 0.25; // Quicker damage reaction
    }
    
    return this.container;
  }
} 