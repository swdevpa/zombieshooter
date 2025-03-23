import * as THREE from 'three';
import { ZombieModel } from './ZombieModel.js';

/**
 * ScreamerZombieModel - Zombie that can alert other zombies in a radius
 * Visually distinguished by enlarged head/mouth and emaciated body
 */
export class ScreamerZombieModel extends ZombieModel {
  constructor(assetLoader, options = {}) {
    // Call parent constructor with zombie type set to 'screamer'
    super(assetLoader, {
      zombieType: 'screamer',
      ...options
    });
  }
  
  /**
   * Create high detail model with screamer zombie characteristics
   * Screamer zombies have enlarged heads, wide mouths, and emaciated bodies
   */
  createHighDetailModel() {
    const group = new THREE.Group();
    
    // Create body - thin and frail looking
    const bodyGeometry = new THREE.BoxGeometry(0.5, 0.9, 0.35);
    const bodyMaterial = this.createBodyMaterial();
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.45;
    body.castShadow = true;
    
    // Create neck - elongated
    const neckGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.25);
    const neck = new THREE.Mesh(neckGeometry, bodyMaterial);
    neck.position.y = 1.0;
    neck.castShadow = true;
    
    // Create head - enlarged with wide mouth
    const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.5);
    const headMaterial = this.createHeadMaterial();
    
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.4;
    head.castShadow = true;
    
    // Add mouth and details
    this.addMouthAndDetails(head);
    
    // Create limbs - thin and weak looking
    const armGeometry = new THREE.BoxGeometry(0.15, 0.65, 0.15);
    const legGeometry = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.32, 0.55, 0);
    leftArm.castShadow = true;
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.32, 0.55, 0);
    rightArm.castShadow = true;
    
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.18, 0.0, 0);
    leftLeg.castShadow = true;
    
    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.18, 0.0, 0);
    rightLeg.castShadow = true;
    
    // Add parts to group
    group.add(body);
    group.add(neck);
    group.add(head);
    group.add(leftArm);
    group.add(rightArm);
    group.add(leftLeg);
    group.add(rightLeg);
    
    // Store references for animation
    this.bodyParts.body = body;
    this.bodyParts.neck = neck;
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
   * Add mouth and face details to screamer
   */
  addMouthAndDetails(head) {
    // Create gaping mouth
    const mouthGeometry = new THREE.BoxGeometry(0.3, 0.25, 0.15);
    const mouthMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x330000, // Dark red/black
    });
    
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, -0.15, 0.25);
    head.add(mouth);
    
    // Add teeth
    const toothMaterial = new THREE.MeshBasicMaterial({ color: 0xeeeeee });
    
    // Top teeth
    const topTeethGeometry = new THREE.BoxGeometry(0.25, 0.04, 0.04);
    const topTeeth = new THREE.Mesh(topTeethGeometry, toothMaterial);
    topTeeth.position.set(0, -0.03, 0.26);
    mouth.add(topTeeth);
    
    // Bottom teeth
    const bottomTeethGeometry = new THREE.BoxGeometry(0.25, 0.04, 0.04);
    const bottomTeeth = new THREE.Mesh(bottomTeethGeometry, toothMaterial);
    bottomTeeth.position.set(0, -0.2, 0.26);
    mouth.add(bottomTeeth);
    
    // Add eyes - wide and sunken
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    
    const leftEyeGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const leftEye = new THREE.Mesh(leftEyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 0.1, 0.2);
    head.add(leftEye);
    
    const rightEyeGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const rightEye = new THREE.Mesh(rightEyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 0.1, 0.2);
    head.add(rightEye);
    
    // Store references for animation
    this.mouth = mouth;
    this.eyes = [leftEye, rightEye];
  }
  
  /**
   * Create medium detail model (simplified version)
   */
  createMediumDetailModel() {
    // Create a simplified model for medium distance rendering
    const group = new THREE.Group();
    
    // Simplified body
    const bodyGeometry = new THREE.BoxGeometry(0.5, 1.3, 0.35);
    const bodyMaterial = this.createSimplifiedMaterial();
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.65;
    body.castShadow = true;
    
    // Create simplified head with mouth
    const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.5);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 1.4, 0);
    body.add(head);
    
    // Add simplified mouth
    const mouthGeometry = new THREE.BoxGeometry(0.25, 0.2, 0.2);
    const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x330000 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, -0.15, 0.2);
    head.add(mouth);
    
    // Add simplified eyes
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), eyeMaterial);
    leftEye.position.set(-0.15, 0.1, 0.2);
    head.add(leftEye);
    
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), eyeMaterial);
    rightEye.position.set(0.15, 0.1, 0.2);
    head.add(rightEye);
    
    // Simplified limbs
    const armGeometry = new THREE.BoxGeometry(0.15, 0.65, 0.15);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.32, 0.55, 0);
    leftArm.castShadow = true;
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.32, 0.55, 0);
    rightArm.castShadow = true;
    
    // Combined legs
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.6, 0.3), bodyMaterial);
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
    
    // Store reference to mouth for animation
    this.mediumDetailMouth = mouth;
    this.mediumDetailEyes = [leftEye, rightEye];
  }
  
  /**
   * Create low detail model (basic representation)
   */
  createLowDetailModel() {
    // Create extremely simplified model for far distance rendering
    const group = new THREE.Group();
    
    // Single mesh representation with large head
    const bodyGeometry = new THREE.BoxGeometry(0.5, 1.2, 0.35);
    const bodyMaterial = new THREE.MeshBasicMaterial({
      color: this.getZombieColor(),
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    
    // Add large head
    const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.5);
    const headMaterial = new THREE.MeshBasicMaterial({
      color: this.getZombieHeadColor(),
    });
    
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.3;
    
    // Add simplified mouth
    const mouthGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.15);
    const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x330000 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.z = 0.2;
    head.add(mouth);
    
    group.add(body);
    group.add(head);
    
    // Store model
    this.detailLevels.low = group;
    
    // Store reference to low detail mouth
    this.lowDetailMouth = mouth;
  }
  
  /**
   * Override update to animate mouth and eyes
   */
  update(deltaTime) {
    super.update(deltaTime);
    
    // Animate mouth opening/closing (screaming)
    const time = performance.now() / 1000;
    
    // High detail model
    if (this.mouth) {
      // Make mouth "scream" periodically
      const mouthOpenFactor = 0.7 + Math.sin(time * 1.5) * 0.3;
      this.mouth.scale.set(1, mouthOpenFactor, 1);
    }
    
    // Animate eyes
    if (this.eyes && this.eyes.length > 0) {
      for (let i = 0; i < this.eyes.length; i++) {
        const eye = this.eyes[i];
        // Pulse eyes
        const pulse = 0.9 + Math.sin(time * 2 + i) * 0.1;
        eye.scale.set(pulse, pulse, pulse);
      }
    }
    
    // Medium detail model
    if (this.mediumDetailMouth && this.detailLevels.medium.visible) {
      const mouthOpenFactor = 0.7 + Math.sin(time * 1.5) * 0.3;
      this.mediumDetailMouth.scale.set(1, mouthOpenFactor, 1);
    }
    
    // Animate medium detail eyes
    if (this.mediumDetailEyes && this.mediumDetailEyes.length > 0 && this.detailLevels.medium.visible) {
      for (let i = 0; i < this.mediumDetailEyes.length; i++) {
        const eye = this.mediumDetailEyes[i];
        const pulse = 0.9 + Math.sin(time * 2 + i) * 0.1;
        eye.scale.set(pulse, pulse, pulse);
      }
    }
    
    // Low detail model
    if (this.lowDetailMouth && this.detailLevels.low.visible) {
      const mouthOpenFactor = 0.7 + Math.sin(time * 1.5) * 0.3;
      this.lowDetailMouth.scale.set(1, mouthOpenFactor, 1);
    }
  }
  
  /**
   * Get zombie color - pale, emaciated look for screamers
   */
  getZombieColor() {
    const variation = this.options.variation || 0;
    
    // Base colors with a sickly pale tint
    const colors = [
      0x8c8273, // Pale gray-brown
      0x988d80, // Light gray
      0x8b8379, // Pale brown-gray
      0x837d74  // Dull gray
    ];
    
    return colors[variation % colors.length];
  }
  
  /**
   * Get zombie head color - slightly different from body
   */
  getZombieHeadColor() {
    const variation = this.options.variation || 0;
    
    // Base colors slightly paler than body
    const colors = [
      0x9d9283, // Pale gray-brown
      0xa89d90, // Light gray
      0x9b9389, // Pale brown-gray
      0x938d84  // Dull gray
    ];
    
    return colors[variation % colors.length];
  }
} 