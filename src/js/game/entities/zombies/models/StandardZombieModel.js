import * as THREE from 'three';
import { ZombieModel } from './ZombieModel.js';

/**
 * StandardZombieModel - Regular zombie model with balanced stats
 */
export class StandardZombieModel extends ZombieModel {
  constructor(assetLoader, options = {}) {
    // Call parent constructor with zombie type set to 'standard'
    super(assetLoader, {
      zombieType: 'standard',
      ...options
    });
  }
  
  /**
   * Create high detail model with standard zombie characteristics
   */
  createHighDetailModel() {
    const group = new THREE.Group();
    
    // Create body - standard zombie has average proportions
    const bodyGeometry = new THREE.BoxGeometry(0.7, 1.1, 0.4);
    const bodyMaterial = this.createBodyMaterial();
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.55;
    body.rotation.z = THREE.MathUtils.degToRad(-5); // Slight tilt
    body.castShadow = true;
    
    // Create head - standard zombie has normal head size
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMaterial = this.createHeadMaterial();
    
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.35;
    head.rotation.z = THREE.MathUtils.degToRad(15); // Tilted head for undead look
    head.castShadow = true;
    
    // Create limbs - standard zombie has normal proportions
    const armGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const legGeometry = new THREE.BoxGeometry(0.25, 0.6, 0.25);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.45, 0.6, 0);
    leftArm.rotation.z = THREE.MathUtils.degToRad(20); // Outstretched arm
    leftArm.castShadow = true;
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.45, 0.6, 0);
    rightArm.rotation.z = THREE.MathUtils.degToRad(-30); // Outstretched arm
    rightArm.castShadow = true;
    
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.2, 0.0, 0);
    leftLeg.castShadow = true;
    
    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.2, 0.0, 0);
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
      case 0: // Ragged shirt
        const shirtGeometry = new THREE.BoxGeometry(0.75, 0.6, 0.45);
        const shirt = new THREE.Mesh(shirtGeometry, clothMaterial);
        shirt.position.y = 0.8;
        shirt.position.z = -0.01; // Slightly behind to avoid z-fighting
        group.add(shirt);
        break;
        
      case 1: // Torn pants
        const pantsGeometry = new THREE.BoxGeometry(0.6, 0.7, 0.42);
        const pants = new THREE.Mesh(pantsGeometry, clothMaterial);
        pants.position.y = 0.25;
        pants.position.z = -0.01;
        group.add(pants);
        break;
        
      case 2: // Office worker with tie
        const torsoGeometry = new THREE.BoxGeometry(0.75, 0.7, 0.45);
        const torso = new THREE.Mesh(torsoGeometry, clothMaterial);
        torso.position.y = 0.7;
        torso.position.z = -0.01;
        
        const tieGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.1);
        const tieMaterial = new THREE.MeshStandardMaterial({
          color: 0x880000,
          roughness: 0.5
        });
        const tie = new THREE.Mesh(tieGeometry, tieMaterial);
        tie.position.y = 0.6;
        tie.position.z = 0.22;
        
        group.add(torso);
        group.add(tie);
        break;
        
      case 3: // Construction worker with helmet
        const helmetGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.6);
        const helmetMaterial = new THREE.MeshStandardMaterial({
          color: 0xffeb3b, // Yellow helmet
          roughness: 0.5
        });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = 1.7;
        
        group.add(helmet);
        break;
    }
  }
  
  /**
   * Get clothing color based on variation
   */
  getClothingColor(variation) {
    // Different clothing colors for variations
    const colors = [
      0x607d8b, // Blue-gray
      0x795548, // Brown
      0x455a64, // Dark blue-gray
      0x5d4037  // Dark brown
    ];
    
    return new THREE.Color(colors[variation]);
  }
  
  /**
   * Randomize the zombie's appearance slightly
   */
  randomizeAppearance() {
    if (!this.bodyParts.body) return;
    
    // Randomize body tilt
    this.bodyParts.body.rotation.z += (Math.random() * 0.2 - 0.1);
    
    // Randomize head tilt
    if (this.bodyParts.head) {
      this.bodyParts.head.rotation.z += (Math.random() * 0.3 - 0.15);
      this.bodyParts.head.rotation.y = (Math.random() * 0.5 - 0.25);
    }
    
    // Randomize arm positions
    if (this.bodyParts.leftArm) {
      this.bodyParts.leftArm.rotation.z += (Math.random() * 0.4 - 0.2);
      this.bodyParts.leftArm.rotation.x = (Math.random() * 0.3 - 0.15);
    }
    
    if (this.bodyParts.rightArm) {
      this.bodyParts.rightArm.rotation.z += (Math.random() * 0.4 - 0.2);
      this.bodyParts.rightArm.rotation.x = (Math.random() * 0.3 - 0.15);
    }
    
    // Slightly randomize scale
    const scaleVariation = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
    this.container.scale.set(scaleVariation, scaleVariation, scaleVariation);
  }
} 