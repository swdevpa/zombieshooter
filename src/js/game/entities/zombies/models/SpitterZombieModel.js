import * as THREE from 'three';
import { ZombieModel } from './ZombieModel.js';

/**
 * SpitterZombieModel - Zombie that can attack from a distance with acid projectiles
 * Visually distinguished by elongated neck and acid sacs
 */
export class SpitterZombieModel extends ZombieModel {
  constructor(assetLoader, options = {}) {
    // Call parent constructor with zombie type set to 'spitter'
    super(assetLoader, {
      zombieType: 'spitter',
      ...options
    });
  }
  
  /**
   * Create high detail model with spitter zombie characteristics
   * Spitter zombies have elongated necks and visible acid sacs
   */
  createHighDetailModel() {
    const group = new THREE.Group();
    
    // Create body - thin and hunched
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.0, 0.4);
    const bodyMaterial = this.createBodyMaterial();
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.rotation.x = THREE.MathUtils.degToRad(15); // Hunched forward
    body.castShadow = true;
    
    // Create elongated neck
    const neckGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.2);
    const neck = new THREE.Mesh(neckGeometry, bodyMaterial);
    neck.position.y = 1.0;
    neck.position.z = 0.1; // Shifted forward due to hunching
    neck.castShadow = true;
    
    // Create head - slightly elongated to accommodate acid spitting
    const headGeometry = new THREE.BoxGeometry(0.4, 0.5, 0.6); // Extended forward
    const headMaterial = this.createHeadMaterial();
    
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.35;
    head.position.z = 0.2; // Extended forward for spitting
    head.rotation.x = THREE.MathUtils.degToRad(-30); // Tilted to face forward/down
    head.castShadow = true;
    
    // Create acid sac bulges on neck/head
    this.addAcidSacs(head, neck);
    
    // Create limbs - thin and wiry
    const armGeometry = new THREE.BoxGeometry(0.15, 0.7, 0.15);
    const legGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.38, 0.6, 0);
    leftArm.castShadow = true;
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.38, 0.6, 0);
    rightArm.castShadow = true;
    
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.2, 0.0, 0);
    leftLeg.castShadow = true;
    
    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.2, 0.0, 0);
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
   * Add acid sacs to the spitter model
   */
  addAcidSacs(head, neck) {
    // Create acid sac material
    const acidMaterial = new THREE.MeshBasicMaterial({
      color: 0x39ff14, // Bright green
      transparent: true,
      opacity: 0.8
    });
    
    // Add main acid sac to throat
    const throatSacGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const throatSac = new THREE.Mesh(throatSacGeometry, acidMaterial);
    throatSac.position.set(0, -0.1, 0.2);
    neck.add(throatSac);
    
    // Add smaller acid sacs to head
    const smallSacGeometry = new THREE.SphereGeometry(0.08, 6, 6);
    
    // Cheek sacs
    const leftCheekSac = new THREE.Mesh(smallSacGeometry, acidMaterial);
    leftCheekSac.position.set(-0.15, -0.05, 0.25);
    head.add(leftCheekSac);
    
    const rightCheekSac = new THREE.Mesh(smallSacGeometry, acidMaterial);
    rightCheekSac.position.set(0.15, -0.05, 0.25);
    head.add(rightCheekSac);
    
    // Add dripping effect
    const dripGeometry = new THREE.CylinderGeometry(0.02, 0.01, 0.1, 6);
    const dripMaterial = new THREE.MeshBasicMaterial({
      color: 0x39ff14,
      transparent: true,
      opacity: 0.7
    });
    
    const drip = new THREE.Mesh(dripGeometry, dripMaterial);
    drip.position.set(0, -0.1, 0.32);
    head.add(drip);
    
    // Store references for animation/pulsing
    this.acidSacs = [throatSac, leftCheekSac, rightCheekSac];
    this.acidDrip = drip;
  }
  
  /**
   * Create medium detail model (simplified version)
   */
  createMediumDetailModel() {
    // Create a simplified model for medium distance rendering
    const group = new THREE.Group();
    
    // Simplified body and head
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.4);
    const bodyMaterial = this.createSimplifiedMaterial();
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.75;
    body.rotation.x = THREE.MathUtils.degToRad(10);
    body.castShadow = true;
    
    // Create extended head
    const headGeometry = new THREE.BoxGeometry(0.4, 0.5, 0.6);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 1.35, 0.2);
    head.rotation.x = THREE.MathUtils.degToRad(-20);
    body.add(head);
    
    // Add simplified acid effect
    const acidGeometry = new THREE.SphereGeometry(0.15, 6, 6);
    const acidMaterial = new THREE.MeshBasicMaterial({
      color: 0x39ff14,
      transparent: true,
      opacity: 0.7
    });
    
    const acid = new THREE.Mesh(acidGeometry, acidMaterial);
    acid.position.set(0, 1.25, 0.3);
    group.add(acid);
    
    // Simplified limbs
    const armGeometry = new THREE.BoxGeometry(0.15, 0.7, 0.15);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.38, 0.6, 0);
    leftArm.castShadow = true;
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.38, 0.6, 0);
    rightArm.castShadow = true;
    
    // Combined legs
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.3), bodyMaterial);
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
    
    // Store reference to acid for animation
    this.mediumDetailAcid = acid;
  }
  
  /**
   * Create low detail model (basic representation)
   */
  createLowDetailModel() {
    // Create extremely simplified model for far distance rendering
    const group = new THREE.Group();
    
    // Single mesh representation
    const geometry = new THREE.BoxGeometry(0.6, 1.8, 0.4);
    const material = new THREE.MeshBasicMaterial({
      color: this.getZombieColor(),
    });
    
    const zombieMesh = new THREE.Mesh(geometry, material);
    zombieMesh.position.y = 0.9;
    zombieMesh.rotation.x = THREE.MathUtils.degToRad(10);
    zombieMesh.castShadow = true;
    
    // Add simplified acid indicator
    const acidGeometry = new THREE.SphereGeometry(0.12, 4, 4);
    const acidMaterial = new THREE.MeshBasicMaterial({
      color: 0x39ff14,
      transparent: true,
      opacity: 0.6
    });
    
    const acid = new THREE.Mesh(acidGeometry, acidMaterial);
    acid.position.set(0, 0.4, 0.2);
    zombieMesh.add(acid);
    
    group.add(zombieMesh);
    
    // Store model
    this.detailLevels.low = group;
  }
  
  /**
   * Override update to animate acid sacs and drip
   */
  update(deltaTime) {
    super.update(deltaTime);
    
    // Animate acid sacs
    if (this.acidSacs && this.acidSacs.length > 0) {
      const time = performance.now() / 1000;
      
      // Pulse each acid sac with slightly different timing
      for (let i = 0; i < this.acidSacs.length; i++) {
        const sac = this.acidSacs[i];
        const pulse = 0.9 + Math.sin(time * (1.5 + i * 0.3)) * 0.15;
        sac.scale.set(pulse, pulse, pulse);
        
        // Adjust opacity
        if (sac.material) {
          sac.material.opacity = 0.7 + Math.sin(time * 2 + i) * 0.15;
        }
      }
      
      // Animate acid drip 
      if (this.acidDrip) {
        // Make it grow and shrink
        const dripScale = 0.8 + Math.sin(time * 3) * 0.2;
        this.acidDrip.scale.set(1, dripScale, 1);
      }
    }
    
    // Animate medium detail acid if visible
    if (this.mediumDetailAcid && this.detailLevels.medium.visible) {
      const time = performance.now() / 1000;
      const pulse = 0.9 + Math.sin(time * 1.5) * 0.15;
      this.mediumDetailAcid.scale.set(pulse, pulse, pulse);
    }
  }
  
  /**
   * Get zombie color - greenish tint for spitter zombies
   */
  getZombieColor() {
    const variation = this.options.variation || 0;
    
    // Base colors with a sickly green tint
    const colors = [
      0x5a645c, // Greenish gray
      0x4e574f, // Darker green-gray
      0x556855, // Olive green
      0x495045  // Darker olive
    ];
    
    return colors[variation % colors.length];
  }
} 