import * as THREE from 'three';
import { ZombieModel } from './ZombieModel.js';

/**
 * ExploderZombieModel - Zombie that explodes on death
 * Visually distinct with bloated appearance and unstable features
 */
export class ExploderZombieModel extends ZombieModel {
  constructor(assetLoader, options = {}) {
    // Call parent constructor with zombie type set to 'exploder'
    super(assetLoader, {
      zombieType: 'exploder',
      ...options
    });
  }
  
  /**
   * Create high detail model with exploder zombie characteristics
   * Exploder zombies have bloated, unstable appearances with visible explosive material
   */
  createHighDetailModel() {
    const group = new THREE.Group();
    
    // Create body - bloated and unstable looking
    const bodyGeometry = new THREE.BoxGeometry(0.9, 1.0, 0.7);
    const bodyMaterial = this.createBodyMaterial();
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    
    // Create head - slightly small head on bloated body
    const headGeometry = new THREE.BoxGeometry(0.45, 0.45, 0.45);
    const headMaterial = this.createHeadMaterial();
    
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.25;
    head.castShadow = true;
    
    // Create limbs - thin arms and legs contrasting with bloated body
    const armGeometry = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    const legGeometry = new THREE.BoxGeometry(0.22, 0.5, 0.22);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.54, 0.55, 0);
    leftArm.castShadow = true;
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.54, 0.55, 0);
    rightArm.castShadow = true;
    
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.22, 0.0, 0);
    leftLeg.castShadow = true;
    
    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.22, 0.0, 0);
    rightLeg.castShadow = true;
    
    // Add explosive details
    this.addExplosiveDetails(group, body);
    
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
   * Add visible explosive details to the zombie's body
   */
  addExplosiveDetails(group, body) {
    // Create glowing/pulsing effect for the zombie's "volatile" parts
    const explosiveGeometry = new THREE.SphereGeometry(0.35, 8, 8);
    const explosiveMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x8fce00, // Toxic green
      transparent: true,
      opacity: 0.6
    });
    
    // Add multiple small spheres to create bulging effect
    for (let i = 0; i < 4; i++) {
      const bulge = new THREE.Mesh(explosiveGeometry, explosiveMaterial);
      
      // Position randomly on torso
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.2 + Math.random() * 0.2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.random() * 0.5 - 0.2;
      
      bulge.position.set(x, y, z);
      bulge.scale.set(0.5 + Math.random() * 0.3, 0.5 + Math.random() * 0.3, 0.5 + Math.random() * 0.3);
      
      // Add glow effect
      body.add(bulge);
      
      // Store reference for animation
      if (!this.explosiveBulges) {
        this.explosiveBulges = [];
      }
      this.explosiveBulges.push(bulge);
    }
    
    // Create veins on body
    const veinMaterial = new THREE.MeshBasicMaterial({
      color: 0x8fce00,
      transparent: true,
      opacity: 0.7
    });
    
    for (let i = 0; i < 5; i++) {
      const veinGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.05);
      const vein = new THREE.Mesh(veinGeometry, veinMaterial);
      
      // Random position on body
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.35;
      vein.position.set(
        Math.cos(angle) * radius,
        Math.random() * 0.5 - 0.2,
        Math.sin(angle) * radius
      );
      
      // Random rotation
      vein.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      body.add(vein);
    }
  }
  
  /**
   * Create medium detail model (simplified version)
   */
  createMediumDetailModel() {
    // Create a simplified model for medium distance rendering
    const group = new THREE.Group();
    
    // Simplified body
    const bodyGeometry = new THREE.BoxGeometry(0.9, 1.5, 0.7);
    const bodyMaterial = this.createSimplifiedMaterial();
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.75;
    body.castShadow = true;
    
    // Add simplified explosive effect
    const glowGeometry = new THREE.SphereGeometry(0.45, 6, 6);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x8fce00,
      transparent: true,
      opacity: 0.4
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(0, 0, 0);
    body.add(glow);
    
    // Simplified limbs
    const armGeometry = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.54, 0.55, 0);
    leftArm.castShadow = true;
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.54, 0.55, 0);
    rightArm.castShadow = true;
    
    // Combined legs
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.5, 0.4), bodyMaterial);
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
    const geometry = new THREE.BoxGeometry(0.9, 1.8, 0.7);
    const material = new THREE.MeshBasicMaterial({
      color: this.getZombieColor(),
    });
    
    const zombieMesh = new THREE.Mesh(geometry, material);
    zombieMesh.position.y = 0.9;
    zombieMesh.castShadow = true;
    
    // Add simple glow effect
    const glowGeometry = new THREE.SphereGeometry(0.5, 4, 4);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x8fce00,
      transparent: true,
      opacity: 0.3
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    zombieMesh.add(glow);
    
    group.add(zombieMesh);
    
    // Store model
    this.detailLevels.low = group;
  }
  
  /**
   * Get zombie color - greenish tint for exploder zombies
   */
  getZombieColor() {
    const variation = this.options.variation || 0;
    
    // Base colors with a greenish-yellow tint
    const colors = [
      0x6e7f4e, // Olive green with yellow
      0x788349, // Moss green with yellow
      0x645f38, // Brown-green
      0x707341  // Dull green-yellow
    ];
    
    return colors[variation % colors.length];
  }
  
  /**
   * Override update to add pulsing effect for explosive parts
   */
  update(deltaTime) {
    super.update(deltaTime);
    
    // Pulse the explosive bulges
    if (this.explosiveBulges && this.explosiveBulges.length > 0) {
      const time = performance.now() / 1000;
      
      for (let i = 0; i < this.explosiveBulges.length; i++) {
        const bulge = this.explosiveBulges[i];
        // Create irregular pulsing effect
        const pulse = 0.8 + Math.sin(time * 2 + i) * 0.2;
        bulge.scale.set(pulse, pulse, pulse);
        
        // Fluctuate opacity
        if (bulge.material) {
          bulge.material.opacity = 0.4 + Math.sin(time * 3 + i * 0.7) * 0.2;
        }
      }
    }
  }
} 