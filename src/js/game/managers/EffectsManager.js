import * as THREE from 'three';
import { ObjectPool } from '../../utils/ObjectPool.js';

/**
 * Manages visual effects with object pooling for optimized performance
 * Centralizes effect creation and management to reduce memory allocation and GC pressure
 */
export class EffectsManager {
  /**
   * Create a new EffectsManager
   * @param {Game} game - The game instance
   * @param {AssetLoader} assetLoader - The asset loader instance
   */
  constructor(game, assetLoader) {
    this.game = game;
    this.assetLoader = assetLoader;
    this.scene = game.scene;
    
    // Initialize properties
    this.pools = {};
    this.activeEffects = [];
    this.settings = null;
    
    // Initialize the manager
    this.init();
  }
  
  /**
   * Initialize the effects manager
   */
  init() {
    // Initialize settings
    this.settings = {
      quality: 'high',
      effects: {
        muzzleFlash: {
          duration: 0.08,
          color: 0xffaa00,
          intensity: 1.5,
          radius: 2,
          particleCount: 8,
          particleColor: 0xffff00,
          particleSize: 0.08
        },
        impact: {
          duration: 1.0,
          particleCount: 12,
          particleSize: 0.05,
          colors: {
            default: 0xcccccc,
            metal: 0x888888,
            wood: 0x8b4513,
            concrete: 0x808080,
            glass: 0xffffff
          }
        }
      }
    };
    
    // Initialize pools
    this.pools = {
      muzzleFlash: new ObjectPool({
        create: () => this.createMuzzleFlashObject(),
        reset: (obj) => this.resetMuzzleFlashEffect(obj),
        initialSize: 10,
        maxSize: 20
      }),
      sparkImpact: new ObjectPool({
        create: () => this.createSparkImpactObject(),
        reset: (obj) => this.resetSparkImpactEffect(obj),
        initialSize: 20,
        maxSize: 40
      })
    };
    
    // Initialize active effects array
    this.activeEffects = [];
    
    // Set quality level
    this.setQuality(this.settings.quality);
  }
  
  /**
   * Set the quality level for effects
   * @param {string} quality - Quality level ('low', 'medium', 'high')
   */
  setQuality(quality) {
    this.settings.quality = quality;
    
    // Adjust settings based on quality
    switch (quality) {
      case 'low':
        this.settings.effects.muzzleFlash.particleCount = 4;
        this.settings.effects.impact.particleCount = 6;
        break;
      case 'medium':
        this.settings.effects.muzzleFlash.particleCount = 6;
        this.settings.effects.impact.particleCount = 9;
        break;
      case 'high':
        this.settings.effects.muzzleFlash.particleCount = 8;
        this.settings.effects.impact.particleCount = 12;
        break;
    }
  }
  
  /**
   * Update all active effects
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Update active effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const { effect, type } = this.activeEffects[i];
      
      // Update effect
      if (effect.update) {
        const isComplete = effect.update(deltaTime);
        
        if (isComplete) {
          // Remove effect from active effects
          this.activeEffects.splice(i, 1);
          
          // Return to pool
          switch (type) {
            case 'muzzleFlash':
              this.resetMuzzleFlashEffect(effect);
              this.pools.muzzleFlash.release(effect);
              break;
            case 'sparkImpact':
              this.resetSparkImpactEffect(effect);
              this.pools.sparkImpact.release(effect);
              break;
            // ... handle other effect types ...
          }
        }
      }
      
      // Update particle systems
      if (effect.particleSystem) {
        const positions = effect.particleSystem.geometry.attributes.position.array;
        const velocities = effect.particleSystem.geometry.attributes.velocity.array;
        const lifetimes = effect.particleSystem.geometry.attributes.lifetime.array;
        
        let hasActiveParticles = false;
        
        for (let i = 0; i < positions.length; i += 3) {
          // Update position
          positions[i] += velocities[i] * deltaTime;
          positions[i + 1] += velocities[i + 1] * deltaTime;
          positions[i + 2] += velocities[i + 2] * deltaTime;
          
          // Update lifetime
          const particleIndex = i / 3;
          lifetimes[particleIndex] -= deltaTime * 1000; // Convert to milliseconds
          
          if (lifetimes[particleIndex] > 0) {
            hasActiveParticles = true;
          } else {
            // Reset particle
            positions[i] = effect.position.x;
            positions[i + 1] = effect.position.y;
            positions[i + 2] = effect.position.z;
            
            // Random spread around direction/normal
            const spread = type === 'muzzleFlash' ? 0.2 : 0.5;
            const direction = type === 'muzzleFlash' ? effect.direction : effect.normal;
            const particleDir = direction.clone();
            particleDir.x += (Math.random() - 0.5) * spread;
            particleDir.y += (Math.random() - 0.5) * spread;
            particleDir.z += (Math.random() - 0.5) * spread;
            particleDir.normalize();
            
            // Set new velocity
            const speed = type === 'muzzleFlash' ? 
              0.5 + Math.random() * 0.5 : 
              0.3 + Math.random() * 0.3;
            velocities[i] = particleDir.x * speed;
            velocities[i + 1] = particleDir.y * speed;
            velocities[i + 2] = particleDir.z * speed;
            
            // Set new lifetime
            lifetimes[particleIndex] = type === 'muzzleFlash' ?
              200 + Math.random() * 300 : // 200-500ms for muzzle flash
              300 + Math.random() * 400;  // 300-700ms for impact
          }
        }
        
        // Update geometry attributes
        effect.particleSystem.geometry.attributes.position.needsUpdate = true;
        effect.particleSystem.geometry.attributes.lifetime.needsUpdate = true;
        
        // Remove particle system if no active particles
        if (!hasActiveParticles) {
          this.scene.remove(effect.particleSystem);
          effect.particleSystem.geometry.dispose();
          effect.particleSystem.material.dispose();
          effect.particleSystem = null;
        }
      }
      
      // Update light intensity
      if (effect.light) {
        const elapsed = Date.now() - effect.startTime;
        const progress = elapsed / effect.duration;
        
        if (progress < 1) {
          // Fade out light
          effect.light.intensity = effect.settings.intensity * (1 - progress);
        } else {
          // Remove light
          this.scene.remove(effect.light);
          effect.light.dispose();
          effect.light = null;
        }
      }
    }
  }
  
  /**
   * Create a blood splatter effect
   * @param {THREE.Vector3} position - Position of the effect
   * @param {string} hitZone - Zone that was hit (head, torso, limb)
   * @param {boolean} isCritical - Whether this was a critical hit
   * @returns {Object} The effect object
   */
  createBloodSplatterEffect(position, hitZone = 'torso', isCritical = false) {
    // Get effect from pool
    const effect = this.pools.bloodSplatter.get();
    
    // Configure the effect
    effect.position.copy(position);
    effect.isCritical = isCritical;
    effect.hitZone = hitZone;
    
    // Determine particle count based on hit type
    effect.particleCount = isCritical ? 
      this.settings.bloodSplatter.criticalParticleCount : 
      this.settings.bloodSplatter.particleCount;
    
    // Initialize velocities based on hit zone
    const spreadFactor = hitZone === 'head' ? 0.3 : 0.15;
    const velocityMultiplier = hitZone === 'head' ? 1.5 : 1.0;
    
    // Calculate direction (away from player if available)
    let direction = new THREE.Vector3(0, 0, -1);
    if (this.game.player && this.game.player.container) {
      direction = new THREE.Vector3().subVectors(
        position,
        this.game.player.container.position
      ).normalize();
    }
    
    // Setup particles
    for (let i = 0; i < effect.particleCount; i++) {
      // Base direction plus random spread
      const particleDir = direction.clone();
      particleDir.x += (Math.random() - 0.5) * spreadFactor;
      particleDir.y += (Math.random() - 0.5) * spreadFactor;
      particleDir.z += (Math.random() - 0.5) * spreadFactor;
      particleDir.normalize();
      
      // Speed based on critical and random factor
      const speed = (0.5 + Math.random() * 0.5) * velocityMultiplier * (isCritical ? 1.5 : 1.0);
      
      // Set velocity
      effect.velocities[i].copy(particleDir).multiplyScalar(speed);
      
      // Random lifetime between 0.3 and 0.8 seconds
      effect.lifetimes[i] = 300 + Math.random() * 500;
      
      // Set initial position
      const i3 = i * 3;
      effect.positions[i3] = position.x;
      effect.positions[i3 + 1] = position.y;
      effect.positions[i3 + 2] = position.z;
    }
    
    // Update buffer attribute
    effect.geometry.attributes.position.needsUpdate = true;
    
    // Reset state
    effect.startTime = Date.now();
    effect.isActive = true;
    
    // Add to scene if needed
    if (!effect.mesh.parent) {
      this.scene.add(effect.mesh);
    }
    
    // Track active effect
    this.activeEffects.push({
      effect,
      type: 'bloodSplatter'
    });
    
    return effect;
  }
  
  /**
   * Create an explosion effect
   * @param {THREE.Vector3} position - Position of the explosion
   * @param {number} radius - Radius of the explosion
   * @returns {Object} The effect object
   */
  createExplosionEffect(position, radius = 3) {
    // Get effect from pool
    const effect = this.pools.explosion.get();
    
    // Configure the effect
    effect.position.copy(position);
    effect.radius = radius;
    effect.maxScale = radius * 2;
    
    // Position the mesh
    effect.mesh.position.copy(position);
    effect.mesh.position.y += 0.5; // Slightly above ground
    effect.mesh.scale.set(0.1, 0.1, 0.1); // Start small
    
    // Reset state
    effect.startTime = Date.now();
    effect.duration = 800; // milliseconds
    effect.isActive = true;
    
    // Reset material
    effect.mesh.material.opacity = 0.9;
    effect.mesh.material.color.setHex(0xff3300);
    
    // Add to scene if needed
    if (!effect.mesh.parent) {
      this.scene.add(effect.mesh);
    }
    
    // Create ring effect
    this.createExplosionRingEffect(position, radius);
    
    // Track active effect
    this.activeEffects.push({
      effect,
      type: 'explosion'
    });
    
    return effect;
  }
  
  /**
   * Create explosion ring effect
   * @param {THREE.Vector3} position - Position of the explosion
   * @param {number} radius - Radius of the explosion
   * @returns {Object} The effect object
   */
  createExplosionRingEffect(position, radius = 3) {
    // Get effect from pool
    const ringEffect = this.pools.explosion.get();
    
    // Configure ring
    ringEffect.position.copy(position);
    ringEffect.position.y = 0.1; // Just above ground
    ringEffect.rotation.x = -Math.PI / 2; // Flat on ground
    ringEffect.maxScale = radius * 3;
    ringEffect.mesh.scale.set(0.1, 0.1, 0.1); // Start small
    
    // Reset ring material
    ringEffect.mesh.material.opacity = 0.7;
    ringEffect.mesh.material.color.setHex(0xff8800);
    
    // Reset state
    ringEffect.startTime = Date.now();
    ringEffect.duration = 600; // milliseconds
    ringEffect.isActive = true;
    
    // Add to scene if needed
    if (!ringEffect.mesh.parent) {
      this.scene.add(ringEffect.mesh);
    }
    
    // Track active effect
    this.activeEffects.push({
      effect: ringEffect,
      type: 'explosion'
    });
    
    return ringEffect;
  }
  
  /**
   * Create spark impact effect (for bullet hits on non-zombie objects)
   * @param {THREE.Vector3} position - Position of impact
   * @param {THREE.Vector3} normal - Surface normal at impact point
   * @returns {Object} The effect object
   */
  createSparkImpactEffect(position, normal) {
    // Get effect from pool
    const effect = this.pools.sparkImpact.get();
    
    // Configure the effect
    effect.position.copy(position);
    
    // Setup particles based on normal direction
    for (let i = 0; i < effect.particleCount; i++) {
      // Calculate velocity away from impact
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
      
      // Ensure velocity points away from the surface
      if (velocity.dot(normal) < 0) {
        velocity.reflect(normal);
      }
      
      // Set random speed
      velocity.multiplyScalar(1 + Math.random() * 3);
      
      // Update particle
      const particle = effect.particles[i];
      
      // Position at impact point with slight variation
      particle.mesh.position.copy(position);
      particle.mesh.position.x += (Math.random() - 0.5) * 0.05;
      particle.mesh.position.y += (Math.random() - 0.5) * 0.05;
      particle.mesh.position.z += (Math.random() - 0.5) * 0.05;
      
      // Set velocity and other properties
      particle.velocity.copy(velocity);
      particle.lifetime = 0;
      particle.maxLifetime = 0.2 + Math.random() * 0.3; // 0.2-0.5 seconds
      particle.mesh.visible = true;
    }
    
    // Create smoke puff
    effect.smokeMesh.position.copy(position);
    effect.smokeMesh.position.add(normal.clone().multiplyScalar(0.05));
    effect.smokeMesh.scale.set(1, 1, 1);
    effect.smokeMesh.material.opacity = 0.4;
    effect.smokeMesh.visible = true;
    
    // Reset state
    effect.startTime = Date.now();
    effect.isActive = true;
    
    // Add particles to scene if needed
    for (const particle of effect.particles) {
      if (!particle.mesh.parent) {
        this.scene.add(particle.mesh);
      }
    }
    
    // Add smoke to scene if needed
    if (!effect.smokeMesh.parent) {
      this.scene.add(effect.smokeMesh);
    }
    
    // Track active effect
    this.activeEffects.push({
      effect,
      type: 'sparkImpact'
    });
    
    return effect;
  }
  
  /**
   * Create zombie spawn effect
   * @param {THREE.Vector3} position - Position of spawn
   * @returns {Object} The effect object
   */
  createZombieSpawnEffect(position) {
    // Get effect from pool
    const effect = this.pools.zombieSpawn.get();
    
    // Configure the effect
    effect.position.copy(position);
    
    // Setup particles
    for (let i = 0; i < effect.particleCount; i++) {
      const i3 = i * 3;
      effect.positions[i3] = position.x;
      effect.positions[i3 + 1] = position.y + 0.1;
      effect.positions[i3 + 2] = position.z;
      
      // Create velocity
      effect.particles[i].velocity.set(
        (Math.random() - 0.5) * 2,
        Math.random() * 2,
        (Math.random() - 0.5) * 2
      );
      
      // Set lifetime
      effect.particles[i].lifetime = 1 + Math.random();
    }
    
    // Update buffer attribute
    effect.geometry.attributes.position.needsUpdate = true;
    
    // Reset material
    effect.mesh.material.opacity = 0.8;
    
    // Reset state
    effect.startTime = Date.now();
    effect.elapsed = 0;
    effect.isActive = true;
    
    // Add to scene if needed
    if (!effect.mesh.parent) {
      this.scene.add(effect.mesh);
    }
    
    // Track active effect
    this.activeEffects.push({
      effect,
      type: 'zombieSpawn'
    });
    
    return effect;
  }
  
  /**
   * Create muzzle flash object for the pool
   * @returns {Object} The muzzle flash effect object
   */
  createMuzzleFlashObject() {
    const effect = {
      position: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      settings: null,
      startTime: 0,
      duration: 0,
      isActive: false,
      mesh: new THREE.Group(),
      light: null,
      particleSystem: null,
      
      update(deltaTime) {
        const elapsed = Date.now() - this.startTime;
        return elapsed >= this.duration;
      }
    };
    
    return effect;
  }
  
  /**
   * Reset a muzzle flash effect
   * @param {Object} effect - The effect to reset
   */
  resetMuzzleFlashEffect(effect) {
    effect.position.set(0, 0, 0);
    effect.direction.set(0, 0, -1);
    effect.settings = null;
    effect.startTime = 0;
    effect.duration = 0;
    effect.isActive = false;
    
    // Remove from scene if present
    if (effect.mesh.parent) {
      effect.mesh.parent.remove(effect.mesh);
    }
    if (effect.light && effect.light.parent) {
      effect.light.parent.remove(effect.light);
    }
    if (effect.particleSystem && effect.particleSystem.parent) {
      effect.particleSystem.parent.remove(effect.particleSystem);
    }
  }
  
  /**
   * Create a spark impact object for the pool
   * @returns {Object} The spark impact effect object
   */
  createSparkImpactObject() {
    const effect = {
      position: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      materialType: 'default',
      startTime: 0,
      duration: 0,
      isActive: false,
      mesh: new THREE.Group(),
      particleSystem: null,
      
      update(deltaTime) {
        const elapsed = Date.now() - this.startTime;
        return elapsed >= this.duration;
      }
    };
    
    return effect;
  }
  
  /**
   * Reset a spark impact effect
   * @param {Object} effect - The effect to reset
   */
  resetSparkImpactEffect(effect) {
    effect.position.set(0, 0, 0);
    effect.normal.set(0, 1, 0);
    effect.materialType = 'default';
    effect.startTime = 0;
    effect.duration = 0;
    effect.isActive = false;
    
    // Remove from scene if present
    if (effect.mesh.parent) {
      effect.mesh.parent.remove(effect.mesh);
    }
    if (effect.particleSystem && effect.particleSystem.parent) {
      effect.particleSystem.parent.remove(effect.particleSystem);
    }
  }
  
  /**
   * Create muzzle flash effect
   * @param {THREE.Vector3} position - Position of the muzzle
   * @param {THREE.Vector3} direction - Direction the weapon is pointing
   * @param {Object} settings - Effect settings
   * @returns {Object} The effect object
   */
  createMuzzleFlashEffect(position, direction, settings) {
    // Get effect from pool
    const effect = this.pools.muzzleFlash.get();
    
    // Configure the effect
    effect.position.copy(position);
    effect.direction.copy(direction);
    effect.settings = settings;
    
    // Position the mesh
    effect.mesh.position.copy(position);
    
    // Reset state
    effect.startTime = Date.now();
    effect.duration = settings.duration * 1000; // Convert to milliseconds
    effect.isActive = true;
    
    // Create dynamic light
    effect.light = new THREE.PointLight(
      settings.color,
      settings.intensity,
      settings.radius
    );
    effect.light.position.copy(position);
    this.scene.add(effect.light);
    
    // Create particle system
    const particleCount = settings.particleCount;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      // Random spread around direction
      const spread = 0.2;
      const particleDir = direction.clone();
      particleDir.x += (Math.random() - 0.5) * spread;
      particleDir.y += (Math.random() - 0.5) * spread;
      particleDir.z += (Math.random() - 0.5) * spread;
      particleDir.normalize();
      
      // Set velocity
      const speed = 0.5 + Math.random() * 0.5;
      velocities[i * 3] = particleDir.x * speed;
      velocities[i * 3 + 1] = particleDir.y * speed;
      velocities[i * 3 + 2] = particleDir.z * speed;
      
      // Set position
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      
      // Set lifetime
      lifetimes[i] = 200 + Math.random() * 300; // 200-500ms
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    particleGeometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: settings.particleColor,
      size: settings.particleSize,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    effect.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(effect.particleSystem);
    
    // Track active effect
    this.activeEffects.push({
      effect,
      type: 'muzzleFlash'
    });
    
    return effect;
  }
  
  /**
   * Create impact effect
   * @param {THREE.Vector3} position - Position of impact
   * @param {THREE.Vector3} normal - Surface normal at impact point
   * @param {string} materialType - Type of material hit
   * @returns {Object} The effect object
   */
  createImpactEffect(position, normal, materialType) {
    // Get effect from pool
    const effect = this.pools.sparkImpact.get();
    
    // Configure the effect
    effect.position.copy(position);
    effect.normal.copy(normal);
    effect.materialType = materialType;
    
    // Position the mesh
    effect.mesh.position.copy(position);
    
    // Reset state
    effect.startTime = Date.now();
    effect.duration = 1000; // 1 second duration
    effect.isActive = true;
    
    // Create impact decal
    const decalGeometry = new THREE.PlaneGeometry(0.2, 0.2);
    const decalMaterial = new THREE.MeshBasicMaterial({
      color: this.getImpactColor(materialType),
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const decal = new THREE.Mesh(decalGeometry, decalMaterial);
    decal.position.copy(position);
    decal.lookAt(position.clone().add(normal));
    effect.mesh.add(decal);
    
    // Create particle system
    const particleCount = 12;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      // Random spread around normal
      const spread = 0.5;
      const particleDir = normal.clone();
      particleDir.x += (Math.random() - 0.5) * spread;
      particleDir.y += (Math.random() - 0.5) * spread;
      particleDir.z += (Math.random() - 0.5) * spread;
      particleDir.normalize();
      
      // Set velocity
      const speed = 0.3 + Math.random() * 0.3;
      velocities[i * 3] = particleDir.x * speed;
      velocities[i * 3 + 1] = particleDir.y * speed;
      velocities[i * 3 + 2] = particleDir.z * speed;
      
      // Set position
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      
      // Set lifetime
      lifetimes[i] = 300 + Math.random() * 400; // 300-700ms
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    particleGeometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: this.getImpactColor(materialType),
      size: 0.05,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    effect.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(effect.particleSystem);
    
    // Track active effect
    this.activeEffects.push({
      effect,
      type: 'sparkImpact'
    });
    
    return effect;
  }
  
  /**
   * Get the color for an impact effect based on material type
   * @param {string} materialType - Type of material hit
   * @returns {number} The color as a hex value
   */
  getImpactColor(materialType) {
    return this.settings.effects.impact.colors[materialType] || 
           this.settings.effects.impact.colors.default;
  }
  
  // Factory methods for creating pool objects
  
  /**
   * Create a blood splatter effect object for pooling
   * @returns {Object} Blood splatter effect object
   */
  createBloodSplatterObject() {
    const maxParticles = this.settings.bloodSplatter.criticalParticleCount;
    
    // Create geometry with max possible size
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create material
    const material = new THREE.PointsMaterial({
      color: this.settings.bloodSplatter.color,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    // Create mesh
    const mesh = new THREE.Points(geometry, material);
    
    // Create effect object
    const effect = {
      mesh,
      geometry,
      positions,
      particleCount: maxParticles,
      velocities: Array(maxParticles).fill().map(() => new THREE.Vector3()),
      lifetimes: Array(maxParticles).fill(0),
      position: new THREE.Vector3(),
      startTime: 0,
      isActive: false,
      isCritical: false,
      hitZone: 'torso',
      
      // Update method for animation
      update: (deltaTime) => {
        const now = Date.now();
        const elapsedTime = now - effect.startTime;
        let particlesAlive = false;
        
        // Update positions based on velocity and time
        for (let i = 0; i < effect.particleCount; i++) {
          if (elapsedTime < effect.lifetimes[i]) {
            particlesAlive = true;
            
            const deltaSeconds = Math.min(elapsedTime / 1000, 0.1);
            const i3 = i * 3;
            
            // Update position with gravity
            effect.positions[i3] += effect.velocities[i].x * deltaSeconds;
            effect.positions[i3 + 1] += effect.velocities[i].y * deltaSeconds - 1.0 * deltaSeconds * deltaSeconds;
            effect.positions[i3 + 2] += effect.velocities[i].z * deltaSeconds;
          } else {
            // Move inactive particles far away
            const i3 = i * 3;
            effect.positions[i3] = 1000;
            effect.positions[i3 + 1] = 1000;
            effect.positions[i3 + 2] = 1000;
          }
        }
        
        // Update buffer attribute
        effect.geometry.attributes.position.needsUpdate = true;
        
        // Update material opacity for fade-out
        effect.mesh.material.opacity = Math.max(0, 0.8 * (1 - elapsedTime / 1000));
        
        // Effect is complete when all particles are dead or time exceeds 1 second
        return !particlesAlive || elapsedTime >= 1000;
      }
    };
    
    return effect;
  }
  
  /**
   * Reset a blood splatter effect for reuse
   * @param {Object} effect - The effect to reset
   */
  resetBloodSplatterEffect(effect) {
    // Move all particles far away
    for (let i = 0; i < effect.particleCount; i++) {
      const i3 = i * 3;
      effect.positions[i3] = 1000;
      effect.positions[i3 + 1] = 1000;
      effect.positions[i3 + 2] = 1000;
    }
    
    // Update geometry
    effect.geometry.attributes.position.needsUpdate = true;
    
    // Reset properties
    effect.isActive = false;
    effect.startTime = 0;
    effect.mesh.material.opacity = 0;
    
    // Remove from scene
    if (effect.mesh.parent) {
      effect.mesh.parent.remove(effect.mesh);
    }
  }
  
  /**
   * Create an explosion effect object for pooling
   * @returns {Object} Explosion effect object
   */
  createExplosionObject() {
    // Create explosion geometry
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.9
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Create effect object
    const effect = {
      mesh,
      position: new THREE.Vector3(),
      radius: 3,
      maxScale: 6,
      startTime: 0,
      duration: 800, // milliseconds
      isActive: false,
      
      // Update method for animation
      update: (deltaTime) => {
        const now = Date.now();
        const elapsedTime = now - effect.startTime;
        const progress = elapsedTime / effect.duration;
        
        if (progress < 1.0) {
          // Expand quickly then slow down
          let scale;
          if (progress < 0.3) {
            // Fast initial expansion
            scale = effect.maxScale * (progress / 0.3) * 0.8;
          } else {
            // Slower afterwards
            scale = effect.maxScale * (0.8 + 0.2 * ((progress - 0.3) / 0.7));
          }
          
          effect.mesh.scale.set(scale, scale, scale);
          
          // Color changes from orange to black
          const color = new THREE.Color();
          if (progress < 0.4) {
            // Orange to yellow
            color.setHSL(0.05 + progress * 0.05, 1.0, 0.5);
          } else {
            // Yellow to gray to black
            color.setHSL(0.1, 1.0 - (progress - 0.4) * 1.6, 0.5 - (progress - 0.4) * 0.8);
          }
          effect.mesh.material.color = color;
          
          // Fade out
          effect.mesh.material.opacity = 0.9 * (1 - Math.pow(progress, 2));
          
          return false; // Effect still active
        } else {
          return true; // Effect complete
        }
      }
    };
    
    return effect;
  }
  
  /**
   * Reset an explosion effect for reuse
   * @param {Object} effect - The effect to reset
   */
  resetExplosionEffect(effect) {
    // Reset properties
    effect.isActive = false;
    effect.startTime = 0;
    effect.mesh.material.opacity = 0;
    
    // Remove from scene
    if (effect.mesh.parent) {
      effect.mesh.parent.remove(effect.mesh);
    }
  }
  
  /**
   * Create a zombie spawn effect object for pooling
   * @returns {Object} Zombie spawn effect object
   */
  createZombieSpawnObject() {
    const particleCount = this.settings.zombieSpawn.particleCount;
    
    // Create particle geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create particle material
    const material = new THREE.PointsMaterial({
      color: this.settings.zombieSpawn.color,
      size: 0.2,
      transparent: true,
      opacity: 0.8
    });
    
    // Create particles
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        velocity: new THREE.Vector3(),
        lifetime: 0
      });
    }
    
    // Create mesh
    const mesh = new THREE.Points(geometry, material);
    
    // Create effect object
    const effect = {
      mesh,
      geometry,
      particles,
      positions,
      particleCount,
      position: new THREE.Vector3(),
      startTime: 0,
      elapsed: 0,
      isActive: false,
      
      // Update method for animation
      update: (deltaTime) => {
        effect.elapsed += deltaTime;
        
        // Update positions
        let anyAlive = false;
        
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          const particle = effect.particles[i];
          
          // Check if particle is still alive
          if (effect.elapsed < particle.lifetime) {
            anyAlive = true;
            
            // Update position
            effect.positions[i3] += particle.velocity.x * deltaTime;
            effect.positions[i3 + 1] += particle.velocity.y * deltaTime;
            effect.positions[i3 + 2] += particle.velocity.z * deltaTime;
            
            // Add gravity
            particle.velocity.y -= 3 * deltaTime;
          }
        }
        
        // Update buffer attribute
        effect.geometry.attributes.position.needsUpdate = true;
        
        // Fade out
        effect.mesh.material.opacity = Math.max(0, 0.8 * (1 - (effect.elapsed / 2)));
        
        // Effect is complete when all particles are dead
        return !anyAlive || effect.elapsed >= 2;
      }
    };
    
    return effect;
  }
  
  /**
   * Reset a zombie spawn effect for reuse
   * @param {Object} effect - The effect to reset
   */
  resetZombieSpawnEffect(effect) {
    // Reset properties
    effect.isActive = false;
    effect.startTime = 0;
    effect.elapsed = 0;
    effect.mesh.material.opacity = 0;
    
    // Remove from scene
    if (effect.mesh.parent) {
      effect.mesh.parent.remove(effect.mesh);
    }
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Clean up active effects
    for (const { effect, type } of this.activeEffects) {
      // Remove from scene
      if (effect.mesh && effect.mesh.parent) {
        effect.mesh.parent.remove(effect.mesh);
      }
      if (effect.light && effect.light.parent) {
        effect.light.parent.remove(effect.light);
      }
      if (effect.particleSystem && effect.particleSystem.parent) {
        effect.particleSystem.parent.remove(effect.particleSystem);
      }
      
      // Dispose of geometries and materials
      if (effect.mesh) {
        effect.mesh.traverse((child) => {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
      
      if (effect.particleSystem) {
        effect.particleSystem.geometry.dispose();
        effect.particleSystem.material.dispose();
      }
      
      if (effect.light) {
        effect.light.dispose();
      }
      
      // Return to pool
      switch (type) {
        case 'muzzleFlash':
          this.resetMuzzleFlashEffect(effect);
          this.pools.muzzleFlash.release(effect);
          break;
        case 'sparkImpact':
          this.resetSparkImpactEffect(effect);
          this.pools.sparkImpact.release(effect);
          break;
        // ... handle other effect types ...
      }
    }
    
    // Clear active effects
    this.activeEffects = [];
    
    // Clean up pools
    for (const pool of Object.values(this.pools)) {
      pool.dispose();
    }
    
    // Clear pools
    this.pools = {};
  }
} 