import * as THREE from 'three';

/**
 * DamageManager - Handles damage processing and visualization for all game entities
 * Centralizes damage calculations, hit effects, and damage visualization
 */
export class DamageManager {
  /**
   * Create a new damage manager
   * @param {Game} game - Reference to the main game
   * @param {AssetLoader} assetLoader - Asset loader for textures and sounds
   */
  constructor(game, assetLoader) {
    this.game = game;
    this.assetLoader = assetLoader;
    
    // Weapon damage modifiers
    this.weaponDamageModifiers = {
      pistol: {
        base: 10,
        head: 2.5,  // Headshot multiplier
        torso: 1.0, // Base damage multiplier
        limb: 0.7   // Limb shot multiplier
      },
      rifle: {
        base: 15,
        head: 2.5,
        torso: 1.0,
        limb: 0.7
      },
      shotgun: {
        base: 8,    // Per pellet
        head: 2.0,
        torso: 1.0,
        limb: 0.6
      },
      smg: {
        base: 8,
        head: 2.2,
        torso: 1.0,
        limb: 0.7
      },
      sniper: {
        base: 40,
        head: 3.0,
        torso: 1.0,
        limb: 0.5
      }
    };
    
    // Enemy damage resistance modifiers
    this.enemyDamageModifiers = {
      standard: 1.0,
      runner: 0.8,
      brute: 0.7,
      exploder: 1.2,
      spitter: 1.1,
      screamer: 1.0
    };
    
    // Critical hit chance modifiers
    this.criticalHitChance = {
      head: 0.5,   // 50% chance on headshot
      torso: 0.05, // 5% chance on torso
      limb: 0.02   // 2% chance on limb
    };
    
    // Damage effect properties
    this.effectsSettings = {
      bloodSprayParticleCount: 20,
      criticalBloodSprayParticleCount: 50,
      bloodColor: 0xaa0000,
      flashDuration: 0.2
    };
    
    // Active damage effects
    this.activeEffects = [];
    
    // Debug mode
    this.debugMode = false;
  }
  
  /**
   * Initialize the damage manager
   */
  init() {
    // Initialize any resources or setup needed
    console.log('DamageManager initialized');
    return this;
  }
  
  /**
   * Update active damage effects
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Remove completed effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      
      // Update effect and check if it's completed
      const isCompleted = effect.update(deltaTime);
      
      if (isCompleted) {
        // Remove effect
        this.activeEffects.splice(i, 1);
      }
    }
  }
  
  /**
   * Process weapon damage on target
   * @param {Object} weapon - The weapon being fired
   * @param {Object} target - The target being hit
   * @param {Object} hitInfo - Additional information about the hit
   * @param {string} hitInfo.hitZone - Zone that was hit (head, torso, limb)
   * @param {THREE.Vector3} hitInfo.hitPosition - Position where the hit occurred
   * @param {THREE.Vector3} hitInfo.hitNormal - Normal vector of the hit surface
   * @returns {Object} Damage information including amount and critical status
   */
  processWeaponDamage(weapon, target, hitInfo) {
    if (!weapon || !target) return { amount: 0, isCritical: false };
    
    // Extract hit information
    const { hitZone = 'torso', hitPosition, hitNormal } = hitInfo;
    
    // Get base weapon type and damage
    const weaponType = weapon.type || 'pistol';
    const baseDamage = this.getWeaponBaseDamage(weaponType);
    
    // Apply hitzone modifier
    const hitzoneModifier = this.getHitzoneModifier(weaponType, hitZone);
    
    // Apply target resistance modifier if target is a zombie
    let targetModifier = 1.0;
    if (target.options && target.options.type) {
      targetModifier = this.enemyDamageModifiers[target.options.type] || 1.0;
    }
    
    // Calculate critical hit
    const critChance = this.criticalHitChance[hitZone] || 0.05;
    const isCritical = Math.random() < critChance;
    const criticalModifier = isCritical ? 1.5 : 1.0;
    
    // Calculate final damage
    let finalDamage = baseDamage * hitzoneModifier * targetModifier * criticalModifier;
    
    // Apply weapon-specific damage variations (e.g., distance falloff)
    if (weapon.calculateDamageFalloff) {
      const falloffMultiplier = weapon.calculateDamageFalloff(hitPosition);
      finalDamage *= falloffMultiplier;
    }
    
    // Round to whole number
    finalDamage = Math.round(finalDamage);
    
    // Apply damage to target
    if (target.takeDamage) {
      target.takeDamage(finalDamage, {
        hitZone: hitZone,
        isCritical: isCritical,
        damageSource: 'player'
      });
    }
    
    // Create hit effect
    this.createHitEffect(target, hitPosition, hitZone, isCritical);
    
    // Log debug information if debug mode is enabled
    if (this.debugMode) {
      console.log(`Damage: ${finalDamage}, Weapon: ${weaponType}, Zone: ${hitZone}, Critical: ${isCritical}`);
    }
    
    // Return damage information
    return {
      amount: finalDamage,
      isCritical: isCritical,
      hitZone: hitZone
    };
  }
  
  /**
   * Get base damage for a weapon type
   * @param {string} weaponType - Type of weapon
   * @returns {number} Base damage amount
   */
  getWeaponBaseDamage(weaponType) {
    return this.weaponDamageModifiers[weaponType]?.base || 10;
  }
  
  /**
   * Get hitzone modifier for a weapon type and hit zone
   * @param {string} weaponType - Type of weapon
   * @param {string} hitZone - Zone that was hit
   * @returns {number} Damage modifier
   */
  getHitzoneModifier(weaponType, hitZone) {
    const weaponModifiers = this.weaponDamageModifiers[weaponType] || this.weaponDamageModifiers.pistol;
    return weaponModifiers[hitZone] || 1.0;
  }
  
  /**
   * Create visual hit effect based on the hit
   * @param {Object} target - The target that was hit
   * @param {THREE.Vector3} position - Position where the hit occurred
   * @param {string} hitZone - Zone that was hit
   * @param {boolean} isCritical - Whether this was a critical hit
   */
  createHitEffect(target, position, hitZone, isCritical) {
    // Use effects manager if available
    if (this.game && this.game.effectsManager) {
      this.game.effectsManager.createBloodSplatterEffect(position, hitZone, isCritical);
      return;
    }
    
    // Legacy code for creating effects if effects manager is not available
    // Create blood spray effect
    const particleCount = isCritical ? 
      this.effectsSettings.criticalBloodSprayParticleCount : 
      this.effectsSettings.bloodSprayParticleCount;
    
    // Initialize particle geometry
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    // Set all particles starting at hit position
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = position.x;
      particlePositions[i * 3 + 1] = position.y;
      particlePositions[i * 3 + 2] = position.z;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    // Create particle material
    const particleMaterial = new THREE.PointsMaterial({
      color: this.effectsSettings.bloodColor,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    // Create particle system
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    
    // Add to scene
    if (this.game && this.game.scene) {
      this.game.scene.add(particles);
    }
    
    // Setup velocity and lifetime for particles
    const velocities = [];
    const lifetimes = [];
    
    // Calculate spray direction (away from hit)
    let direction = new THREE.Vector3(0, 0, -1);
    
    // Direction from player to hit position
    if (this.game.player && this.game.player.container) {
      direction = new THREE.Vector3().subVectors(
        position,
        this.game.player.container.position
      ).normalize();
    }
    
    // Setup particles
    for (let i = 0; i < particleCount; i++) {
      // Spread factor depends on hit zone and critical
      const spreadFactor = hitZone === 'head' ? 0.3 : 0.15;
      const velocityMultiplier = hitZone === 'head' ? 1.5 : 1.0;
      
      // Base direction plus random spread
      const particleDir = direction.clone();
      particleDir.x += (Math.random() - 0.5) * spreadFactor;
      particleDir.y += (Math.random() - 0.5) * spreadFactor;
      particleDir.z += (Math.random() - 0.5) * spreadFactor;
      particleDir.normalize();
      
      // Speed depends on critical and random factor
      const speed = (0.5 + Math.random() * 0.5) * velocityMultiplier * (isCritical ? 1.5 : 1.0);
      const velocity = particleDir.multiplyScalar(speed);
      
      velocities.push(velocity);
      
      // Random lifetime between 0.3 and 0.8 seconds
      lifetimes.push(300 + Math.random() * 500);
    }
    
    // Start time
    const startTime = Date.now();
    
    // Create blood effect object
    const bloodEffect = {
      particles,
      velocities,
      lifetimes,
      startTime,
      particlePositions,
      particleCount,
      update: (deltaTime) => {
        const now = Date.now();
        const elapsedTime = now - startTime;
        let particlesAlive = false;
        
        // Update positions based on velocity and time
        for (let i = 0; i < particleCount; i++) {
          if (elapsedTime < lifetimes[i]) {
            const deltaSeconds = Math.min(elapsedTime / 1000, 0.1);
            
            // Update position with gravity
            particlePositions[i * 3] += velocities[i].x * deltaSeconds;
            particlePositions[i * 3 + 1] += velocities[i].y * deltaSeconds - 1.0 * deltaSeconds * deltaSeconds; // Gravity
            particlePositions[i * 3 + 2] += velocities[i].z * deltaSeconds;
            
            particlesAlive = true;
          } else {
            // Particle is dead, move far away
            particlePositions[i * 3] = 1000;
            particlePositions[i * 3 + 1] = 1000;
            particlePositions[i * 3 + 2] = 1000;
          }
        }
        
        // Update the buffer attribute
        particles.geometry.attributes.position.needsUpdate = true;
        
        // Update material opacity for fade-out
        particles.material.opacity = Math.max(0, 0.8 * (1 - elapsedTime / 1000));
        
        // Check if effect is complete
        if (!particlesAlive || elapsedTime >= 1000) {
          // Cleanup particles
          if (particles.parent) {
            particles.parent.remove(particles);
          }
          particleGeometry.dispose();
          particleMaterial.dispose();
          return true; // Effect is complete
        }
        
        return false; // Effect is still active
      }
    };
    
    // Add to active effects
    this.activeEffects.push(bloodEffect);
    
    // For headshots, add additional effect
    if (hitZone === 'head' && isCritical) {
      this.createHeadshotEffect(position);
    }
  }
  
  /**
   * Create special headshot effect
   * @param {THREE.Vector3} position - Position for the effect
   */
  createHeadshotEffect(position) {
    // Create a special effect for critical headshots
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    
    const headshot = new THREE.Mesh(geometry, material);
    headshot.position.copy(position);
    
    // Add to scene
    if (this.game && this.game.scene) {
      this.game.scene.add(headshot);
    }
    
    // Start time
    const startTime = Date.now();
    
    // Create headshot effect object
    const headshotEffect = {
      mesh: headshot,
      startTime,
      update: (deltaTime) => {
        const now = Date.now();
        const elapsedTime = now - startTime;
        
        if (elapsedTime < 300) {
          // Scale up and fade out
          const scale = 1 + elapsedTime / 100;
          headshot.scale.set(scale, scale, scale);
          
          headshot.material.opacity = Math.max(0, 0.8 * (1 - elapsedTime / 300));
          
          return false; // Effect is still active
        } else {
          // Cleanup effect
          if (headshot.parent) {
            headshot.parent.remove(headshot);
          }
          geometry.dispose();
          material.dispose();
          return true; // Effect is complete
        }
      }
    };
    
    // Add to active effects
    this.activeEffects.push(headshotEffect);
  }
  
  /**
   * Create explosion effect and damage entities in radius
   * @param {THREE.Vector3} position - Position of explosion
   * @param {number} radius - Radius of explosion
   * @param {number} damage - Base damage
   * @param {Object} source - Source of the explosion
   */
  createExplosion(position, radius, damage, source = null) {
    // Create visual explosion effect
    this.createExplosionEffect(position, radius);
    
    // Damage entities in radius
    this.damageEntitiesInRadius(position, radius, damage, source);
  }
  
  /**
   * Create visual explosion effect
   * @param {THREE.Vector3} position - Position of explosion
   * @param {number} radius - Radius of explosion
   */
  createExplosionEffect(position, radius) {
    // Use effects manager if available
    if (this.game && this.game.effectsManager) {
      this.game.effectsManager.createExplosionEffect(position, radius);
      return;
    }
    
    // Legacy code for creating explosion if effects manager is not available
    // Create explosion geometry
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.9
    });
    
    const explosion = new THREE.Mesh(geometry, material);
    explosion.position.copy(position);
    explosion.position.y += 0.5; // Slightly above ground
    
    // Add to scene
    if (this.game && this.game.scene) {
      this.game.scene.add(explosion);
    }
    
    // Create explosion effect object
    const explosionEffect = {
      mesh: explosion,
      startTime: Date.now(),
      duration: 800, // milliseconds
      maxScale: radius * 2, // Visual size is larger than damage radius
      update: (deltaTime) => {
        const now = Date.now();
        const elapsedTime = now - this.startTime;
        const progress = elapsedTime / this.duration;
        
        if (progress < 1.0) {
          // Expand quickly then slow down
          let scale;
          if (progress < 0.3) {
            // Fast initial expansion
            scale = this.maxScale * (progress / 0.3) * 0.8;
          } else {
            // Slower afterwards
            scale = this.maxScale * (0.8 + 0.2 * ((progress - 0.3) / 0.7));
          }
          
          explosion.scale.set(scale, scale, scale);
          
          // Color changes from orange to black
          const color = new THREE.Color();
          if (progress < 0.4) {
            // Orange to yellow
            color.setHSL(0.05 + progress * 0.05, 1.0, 0.5);
          } else {
            // Yellow to gray to black
            color.setHSL(0.1, 1.0 - (progress - 0.4) * 1.6, 0.5 - (progress - 0.4) * 0.8);
          }
          explosion.material.color = color;
          
          // Fade out
          explosion.material.opacity = 0.9 * (1 - Math.pow(progress, 2));
          
          return false; // Effect is still active
        } else {
          // Cleanup
          if (explosion.parent) {
            explosion.parent.remove(explosion);
          }
          geometry.dispose();
          material.dispose();
          return true; // Effect is complete
        }
      }
    };
    
    // Add explosion ring effect
    this.createExplosionRing(position, radius);
    
    // Add to active effects
    this.activeEffects.push(explosionEffect);
  }
  
  /**
   * Create explosion ring effect
   * @param {THREE.Vector3} position - Position of explosion
   * @param {number} radius - Radius of explosion
   */
  createExplosionRing(position, radius) {
    // Use effects manager if available
    if (this.game && this.game.effectsManager) {
      // Already handled by the explosion effect
      return;
    }
    
    // Legacy code for creating explosion ring if effects manager is not available
    // Create ring geometry
    const ringGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2; // Flat on ground
    ring.position.copy(position);
    ring.position.y = 0.1; // Just above ground
    
    // Add to scene
    if (this.game && this.game.scene) {
      this.game.scene.add(ring);
    }
    
    // Create ring effect object
    const ringEffect = {
      mesh: ring,
      startTime: Date.now(),
      duration: 600, // milliseconds
      maxScale: radius * 3,
      update: (deltaTime) => {
        const now = Date.now();
        const elapsedTime = now - this.startTime;
        const progress = elapsedTime / this.duration;
        
        if (progress < 1.0) {
          // Expand quickly
          const scale = this.maxScale * progress;
          ring.scale.set(scale, scale, scale);
          
          // Fade out
          ring.material.opacity = 0.7 * (1 - progress);
          
          return false; // Effect is still active
        } else {
          // Cleanup
          if (ring.parent) {
            ring.parent.remove(ring);
          }
          ringGeometry.dispose();
          ringMaterial.dispose();
          return true; // Effect is complete
        }
      }
    };
    
    // Add to active effects
    this.activeEffects.push(ringEffect);
  }
  
  /**
   * Damage entities within a radius
   * @param {THREE.Vector3} position - Center position
   * @param {number} radius - Damage radius
   * @param {number} damage - Base damage
   * @param {Object} source - Source of the damage (entity to exclude)
   */
  damageEntitiesInRadius(position, radius, damage, source = null) {
    // Damage player if in range
    if (this.game.player && this.game.player.isAlive) {
      const distanceToPlayer = position.distanceTo(this.game.player.container.position);
      
      if (distanceToPlayer <= radius) {
        // Calculate damage based on distance (more damage closer to center)
        const damageMultiplier = 1 - (distanceToPlayer / radius);
        const playerDamage = Math.round(damage * damageMultiplier);
        
        // Apply damage to player with source position
        this.game.player.takeDamage(playerDamage, {
          sourcePosition: position.clone(),
          damageType: 'explosion',
          damageSource: source
        });
      }
    }
    
    // Damage zombies if in range
    if (this.game.zombieManager) {
      this.game.zombieManager.damageZombiesInRadius(
        position,
        radius,
        damage,
        source
      );
    }
    
    // TODO: Damage destructible environment objects
  }
  
  /**
   * Set debug mode
   * @param {boolean} enabled - Whether debug mode should be enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
  
  /**
   * Determine hit zone based on mesh name and hit position
   * @param {THREE.Object3D} object - The object that was hit
   * @param {THREE.Vector3} position - Position where the hit occurred
   * @returns {string} Hit zone (head, torso, limb)
   */
  determineHitZone(object, position) {
    // Check object name first
    const objectName = object.name.toLowerCase();
    
    if (objectName.includes('head')) {
      return 'head';
    } else if (objectName.includes('arm') || objectName.includes('leg') || 
              objectName.includes('hand') || objectName.includes('foot')) {
      return 'limb';
    }
    
    // If no specific name match, try to determine by position
    // This assumes a standard humanoid model
    
    // Find zombie reference to get its position
    let zombieObject = null;
    let currentObject = object;
    
    while (currentObject) {
      if (currentObject.userData && currentObject.userData.zombieRef) {
        zombieObject = currentObject.userData.zombieRef;
        break;
      }
      
      currentObject = currentObject.parent;
    }
    
    if (zombieObject) {
      // Get zombie position
      const zombiePos = zombieObject.container.position.clone();
      
      // Calculate relative height of hit
      const relativeHeight = (position.y - zombiePos.y);
      
      // Check height to determine zone
      if (relativeHeight > 1.5) {
        return 'head';
      } else if (relativeHeight < 0.8) {
        return 'limb';
      }
    }
    
    // Default fallback
    return 'torso';
  }
  
  /**
   * Process damage to a zombie from a weapon
   * @param {Zombie} zombie - The zombie being hit
   * @param {Object} damageInfo - Information about the damage
   * @param {number} damageInfo.baseDamage - Base damage amount
   * @param {string} damageInfo.zombieType - Type of zombie
   * @param {string} damageInfo.hitZone - Zone that was hit
   * @param {boolean} damageInfo.isCritical - Whether this was a critical hit
   * @returns {Object} Damage result info
   */
  damageZombie(zombie, damageInfo, position, normal) {
    const { baseDamage, zombieType, hitZone, isCritical } = damageInfo;
    
    // Apply resistances based on zombie type
    const typeResistance = this.enemyDamageModifiers[zombieType] || 1.0;
    
    // Apply hit zone multiplier
    const zoneMultiplier = 
      hitZone === 'head' ? 2.5 : 
      hitZone === 'limb' ? 0.7 : 
      1.0;
    
    // Apply critical hit bonus
    const criticalMultiplier = isCritical ? 1.5 : 1.0;
    
    // Calculate final damage
    const finalDamage = Math.round(baseDamage * typeResistance * zoneMultiplier * criticalMultiplier);
    
    // Apply damage to zombie
    const isAlive = zombie.takeDamage(finalDamage, {
      hitZone: hitZone,
      isCritical: isCritical,
      damageSource: 'player'
    });
    
    // Create hit effect
    this.createHitEffect(zombie, position, hitZone, isCritical);
    
    // Return damage information
    return {
      damage: finalDamage,
      isAlive: isAlive,
      isCritical: isCritical,
      hitZone: hitZone
    };
  }
  
  /**
   * Apply damage to a zombie
   * @param {Object} zombie - The zombie to damage
   * @param {number} amount - Damage amount 
   * @param {string} hitZone - Zone that was hit (head, body, limbs)
   * @param {boolean} displayOnly - If true, just display damage without applying it
   * @returns {boolean} - True if the zombie was killed
   */
  applyDamageToZombie(zombie, amount, hitZone = 'body', displayOnly = false) {
    if (!zombie) return false;
    
    // Apply damage multiplier based on hit zone
    let finalDamage = amount;
    
    switch (hitZone) {
      case 'head':
        finalDamage *= this.damageMultipliers.headshot;
        break;
      case 'limb':
        finalDamage *= this.damageMultipliers.limb;
        break;
      default: // 'body'
        finalDamage *= this.damageMultipliers.body;
        break;
    }
    
    // Display damage effect
    this.showDamageEffect(zombie, finalDamage, hitZone);
    
    // Return early if this is display only
    if (displayOnly) return false;
    
    // Apply damage to zombie
    const wasKilled = zombie.applyDamage(finalDamage);
    
    // Handle kill
    if (wasKilled) {
      // Track zombie kill in difficulty manager
      if (this.game.difficultyManager) {
        this.game.difficultyManager.recordZombieKill(zombie, hitZone === 'head');
      }
      
      // Add score for kill
      if (this.game.scoreManager) {
        const scoreAmount = this.getScoreForKill(zombie.type, hitZone === 'head');
        this.game.scoreManager.addScore(scoreAmount, zombie.container.position, hitZone === 'head' ? 'headshot' : 'kill');
      }
    }
    
    return wasKilled;
  }
} 