import * as THREE from 'three';

/**
 * Bullet class that represents a projectile fired from a weapon
 */
export class Bullet {
  /**
   * Create a new bullet instance
   * @param {number} damage - Damage this bullet deals
   * @param {AssetLoader} assetLoader - Asset loader instance
   */
  constructor(damage, assetLoader) {
    this.isAlive = false;
    this.damage = damage || 10;
    this.speed = 20; // Units per second
    this.maxLifetime = 3; // Maximum seconds bullet can travel
    this.lifetime = 0;
    this.distanceTraveled = 0;
    this.assetLoader = assetLoader;
    
    // Create container for bullet and effects
    this.container = new THREE.Group();
    
    // Create bullet mesh
    this.createBulletMesh();
    
    // Create raycaster for more precise collision detection
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = this.speed * 0.05; // Short range for continuous checking
    
    // Properties for tracking
    this.direction = new THREE.Vector3(0, 0, -1);
    this.previousPosition = new THREE.Vector3();
    
    // Track targets
    this.zombies = [];
    this.environmentObjects = [];
    
    // Initialize particles for trail effect
    this.particles = [];
  }
  
  /**
   * Create the bullet mesh
   */
  createBulletMesh() {
    // Main bullet
    const bulletGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8);
    bulletGeometry.rotateX(Math.PI / 2); // Rotate to align with forward direction
    
    // Create materials for bullet
    const bulletMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      emissive: 0x888888,
      metalness: 0.8,
      roughness: 0.2
    });
    
    this.mesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
    this.container.add(this.mesh);
    
    // Add streak effect (motion blur)
    const streakGeometry = new THREE.CylinderGeometry(0.004, 0.004, 0.25, 8);
    streakGeometry.rotateX(Math.PI / 2);
    
    const streakMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa22,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    this.streak = new THREE.Mesh(streakGeometry, streakMaterial);
    this.streak.position.z = 0.075; // Position behind bullet
    this.container.add(this.streak);
    
    // Add tracer effect (to make bullet more visible)
    const tracerGeometry = new THREE.SphereGeometry(0.015, 8, 8);
    const tracerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    this.tracer = new THREE.Mesh(tracerGeometry, tracerMaterial);
    this.container.add(this.tracer);
  }
  
  /**
   * Initialize particle trail
   */
  initParticleTrail() {
    // Create particles for trail effect
    const particleCount = 10;
    const particleGeometry = new THREE.SphereGeometry(0.01, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
      particle.scale.set(0.7 + Math.random() * 0.5, 0.7 + Math.random() * 0.5, 0.7 + Math.random() * 0.5);
      particle.visible = false;
      
      // Add to scene
      if (this.scene) {
        this.scene.add(particle);
      }
      
      // Track particle
      this.particles.push({
        mesh: particle,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.5, // 0.5-1 second lifetime
        speed: this.speed * (0.2 + Math.random() * 0.3), // Speed relative to bullet
        offset: new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05
        )
      });
    }
  }
  
  /**
   * Initialize the bullet with given parameters
   * @param {Vector3} position - Starting position
   * @param {Vector3} direction - Direction of travel (normalized)
   * @param {Quaternion} quaternion - Orientation for the bullet
   * @param {Scene} scene - Three.js scene to add the bullet to
   * @param {Array} zombies - Array of zombie objects for collision
   * @param {Array} environmentObjects - Array of environment objects for collision
   */
  init(position, direction, quaternion, scene, zombies, environmentObjects) {
    this.isAlive = true;
    this.lifetime = 0;
    this.distanceTraveled = 0;
    this.scene = scene;
    this.zombies = zombies || [];
    this.environmentObjects = environmentObjects || [];
    
    // Set direction and position
    this.direction.copy(direction).normalize();
    this.container.position.copy(position);
    this.previousPosition.copy(position);
    
    // Apply orientation
    this.container.quaternion.copy(quaternion);
    
    // Add to scene
    if (scene && !this.container.parent) {
      scene.add(this.container);
    }
    
    // Make sure bullet and effects are visible
    this.container.visible = true;
    this.mesh.visible = true;
    this.streak.visible = true;
    this.tracer.visible = true;
    
    // Initialize particles if not already done
    if (this.particles.length === 0) {
      this.initParticleTrail();
    }
    
    // Reset particles
    this.particles.forEach(particle => {
      particle.life = 0;
      particle.mesh.visible = false;
    });
  }
  
  /**
   * Update bullet state
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    if (!this.isAlive) return;
    
    // Update lifetime and check if exceeded max lifetime
    this.lifetime += deltaTime;
    if (this.lifetime >= this.maxLifetime) {
      this.kill();
      return;
    }
    
    // Store previous position for trail and collision calculations
    this.previousPosition.copy(this.container.position);
    
    // Move bullet forward
    const moveDist = this.speed * deltaTime;
    this.distanceTraveled += moveDist;
    
    this.container.translateZ(-moveDist); // Move in local z direction
    
    // Rotate streak and tracer for visual effect
    if (this.streak) {
      this.streak.rotation.z += deltaTime * 10;
    }
    
    if (this.tracer) {
      this.tracer.scale.set(
        0.8 + Math.sin(this.lifetime * 10) * 0.2,
        0.8 + Math.sin(this.lifetime * 10) * 0.2,
        0.8 + Math.sin(this.lifetime * 10) * 0.2
      );
    }
    
    // Update particle trail
    this.updateParticles(deltaTime);
    
    // Check for collisions using raycasting (more precise)
    this.checkRaycastCollisions();
  }
  
  /**
   * Update particle trail
   * @param {number} deltaTime - Time since last update in seconds
   */
  updateParticles(deltaTime) {
    // Randomly emit particles
    if (Math.random() < 0.5) {
      // Find an available particle
      const availableParticles = this.particles.filter(p => !p.mesh.visible);
      if (availableParticles.length > 0) {
        const particle = availableParticles[Math.floor(Math.random() * availableParticles.length)];
        
        // Position slightly behind bullet with random offset
        particle.mesh.position.copy(this.container.position);
        particle.mesh.position.x += particle.offset.x;
        particle.mesh.position.y += particle.offset.y;
        particle.mesh.position.z += particle.offset.z;
        
        // Reset life and make visible
        particle.life = 0;
        particle.mesh.visible = true;
        particle.mesh.material.opacity = 0.8;
      }
    }
    
    // Update existing particles
    this.particles.forEach(particle => {
      if (particle.mesh.visible) {
        // Age particle
        particle.life += deltaTime;
        
        // Fade out as it ages
        const lifeRatio = particle.life / particle.maxLife;
        particle.mesh.material.opacity = 0.8 * (1 - lifeRatio);
        
        // Scale down as it ages
        const scale = 1 - lifeRatio * 0.7;
        particle.mesh.scale.set(scale, scale, scale);
        
        // Kill if exceeded lifetime
        if (particle.life >= particle.maxLife) {
          particle.mesh.visible = false;
        }
      }
    });
  }
  
  /**
   * Check for collisions using raycasting
   */
  checkRaycastCollisions() {
    // Set up raycaster from previous position to current position
    const rayDirection = new THREE.Vector3()
      .subVectors(this.container.position, this.previousPosition)
      .normalize();
    
    this.raycaster.set(this.previousPosition, rayDirection);
    this.raycaster.far = this.container.position.distanceTo(this.previousPosition);
    
    // Check for zombie hits
    const zombieHits = [];
    for (const zombie of this.zombies) {
      if (zombie.isAlive && zombie.mesh) {
        const hitboxes = [zombie.mesh]; // Use zombie mesh as hitbox
        const intersects = this.raycaster.intersectObjects(hitboxes, true);
        
        if (intersects.length > 0) {
          zombieHits.push({
            zombie,
            distance: intersects[0].distance,
            point: intersects[0].point,
            normal: intersects[0].face ? intersects[0].face.normal : new THREE.Vector3(0, 0, 1)
          });
        }
      }
    }
    
    // Check for environment hits
    const environmentHits = this.raycaster.intersectObjects(this.environmentObjects, true);
    
    // Process hits (closest hit first)
    const allHits = [...zombieHits, ...environmentHits].sort((a, b) => a.distance - b.distance);
    
    if (allHits.length > 0) {
      const hit = allHits[0];
      
      if (hit.zombie) {
        // Hit a zombie
        hit.zombie.takeDamage(this.damage);
        this.createImpactEffect(hit.point, hit.normal, true);
      } else {
        // Hit environment
        this.createImpactEffect(hit.point, hit.normal, false);
      }
      
      // Kill bullet on impact
      this.kill();
    }
  }
  
  /**
   * Create impact effect
   * @param {Vector3} position - Impact position
   * @param {Vector3} normal - Surface normal at impact point
   * @param {boolean} isZombie - Whether the hit was on a zombie
   */
  createImpactEffect(position, normal, isZombie) {
    if (!this.scene) return;
    
    if (isZombie) {
      // Blood splatter for zombie hit
      
      // Create blood particles
      const particleCount = 8 + Math.floor(Math.random() * 5);
      const particles = [];
      
      for (let i = 0; i < particleCount; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({
          color: 0xbb0000,
          transparent: true,
          opacity: 0.8
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Position at impact point with slight variation
        particle.position.copy(position);
        particle.position.x += (Math.random() - 0.5) * 0.1;
        particle.position.y += (Math.random() - 0.5) * 0.1;
        particle.position.z += (Math.random() - 0.5) * 0.1;
        
        // Calculate random velocity away from impact
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        );
        
        // Ensure velocity points away from the surface
        if (velocity.dot(normal) < 0) {
          velocity.reflect(normal);
        }
        
        velocity.multiplyScalar(1 + Math.random() * 2); // Random speed
        
        // Add to scene
        this.scene.add(particle);
        
        // Track particle for animation
        particles.push({
          mesh: particle,
          velocity: velocity,
          gravity: new THREE.Vector3(0, -9.8, 0),
          lifetime: 0,
          maxLifetime: 0.5 + Math.random() * 0.5 // 0.5-1 second
        });
      }
      
      // Animate blood particles
      const startTime = Date.now();
      const animateBloodParticles = () => {
        const now = Date.now();
        const deltaTime = Math.min((now - startTime) / 1000, 0.1);
        let allDone = true;
        
        for (const particle of particles) {
          // Update lifetime
          particle.lifetime += deltaTime;
          
          // Check if particle is still alive
          if (particle.lifetime < particle.maxLifetime) {
            allDone = false;
            
            // Update position
            particle.velocity.add(particle.gravity.clone().multiplyScalar(deltaTime));
            particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
            
            // Fade out
            const t = particle.lifetime / particle.maxLifetime;
            particle.mesh.material.opacity = 0.8 * (1 - t);
            
            // Slow down as time passes
            particle.velocity.multiplyScalar(0.95);
          } else {
            // Remove particle
            this.scene.remove(particle.mesh);
            
            // Clean up resources
            if (particle.mesh.geometry) particle.mesh.geometry.dispose();
            if (particle.mesh.material) particle.mesh.material.dispose();
          }
        }
        
        // Continue animation if particles still alive
        if (!allDone) {
          requestAnimationFrame(animateBloodParticles);
        }
      };
      
      // Start animation
      animateBloodParticles();
      
    } else {
      // Spark/impact effect for environment hit
      
      // Create main impact sprite
      const impactTexture = this.assetLoader.getTexture('impact') || 
                           new THREE.TextureLoader().load('../assets/textures/impact.png');
      
      const impactMaterial = new THREE.SpriteMaterial({
        map: impactTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });
      
      const impactSprite = new THREE.Sprite(impactMaterial);
      impactSprite.scale.set(0.2, 0.2, 1);
      impactSprite.position.copy(position);
      impactSprite.position.add(normal.clone().multiplyScalar(0.01)); // Offset slightly to prevent z-fighting
      
      // Random rotation
      impactSprite.material.rotation = Math.random() * Math.PI;
      
      this.scene.add(impactSprite);
      
      // Create spark particles
      const particleCount = 5 + Math.floor(Math.random() * 5);
      const particles = [];
      
      for (let i = 0; i < particleCount; i++) {
        const sparkGeometry = new THREE.SphereGeometry(0.02, 4, 4);
        const sparkMaterial = new THREE.MeshBasicMaterial({
          color: 0xffcc00,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending
        });
        
        const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
        
        // Position at impact point
        spark.position.copy(position);
        
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
        
        velocity.multiplyScalar(1 + Math.random() * 3); // Random speed
        
        // Add to scene
        this.scene.add(spark);
        
        // Track particle for animation
        particles.push({
          mesh: spark,
          velocity: velocity,
          gravity: new THREE.Vector3(0, -9.8, 0),
          lifetime: 0,
          maxLifetime: 0.2 + Math.random() * 0.3 // 0.2-0.5 second
        });
      }
      
      // Create smoke puff
      const smokeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const smokeMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaaaaa,
        transparent: true,
        opacity: 0.4
      });
      
      const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
      smoke.position.copy(position);
      smoke.position.add(normal.clone().multiplyScalar(0.05));
      this.scene.add(smoke);
      
      // Animate impact effect
      const startTime = Date.now();
      const animateImpact = () => {
        const now = Date.now();
        const deltaTime = Math.min((now - startTime) / 1000, 0.1);
        const elapsed = (now - startTime) / 1000;
        let particlesActive = false;
        
        // Fade out impact sprite
        if (impactSprite.parent) {
          const impactDuration = 0.2; // seconds
          if (elapsed < impactDuration) {
            impactSprite.material.opacity = 0.9 * (1 - elapsed / impactDuration);
            impactSprite.scale.set(0.2 + elapsed * 0.1, 0.2 + elapsed * 0.1, 1);
          } else {
            this.scene.remove(impactSprite);
            impactSprite.material.dispose();
          }
        }
        
        // Animate smoke
        if (smoke.parent) {
          const smokeDuration = 1.0; // seconds
          if (elapsed < smokeDuration) {
            smoke.material.opacity = 0.4 * (1 - elapsed / smokeDuration);
            smoke.scale.set(1 + elapsed * 2, 1 + elapsed * 2, 1 + elapsed * 2);
          } else {
            this.scene.remove(smoke);
            smoke.geometry.dispose();
            smoke.material.dispose();
          }
        }
        
        // Animate spark particles
        for (const particle of particles) {
          // Update lifetime
          particle.lifetime += deltaTime;
          
          // Check if particle is still alive
          if (particle.lifetime < particle.maxLifetime) {
            particlesActive = true;
            
            // Update position
            particle.velocity.add(particle.gravity.clone().multiplyScalar(deltaTime));
            particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
            
            // Fade out
            const t = particle.lifetime / particle.maxLifetime;
            particle.mesh.material.opacity = 0.8 * (1 - t);
            
            // Shrink as time passes
            const scale = 1 - t * 0.8;
            particle.mesh.scale.set(scale, scale, scale);
          } else {
            // Remove particle
            this.scene.remove(particle.mesh);
            
            // Clean up resources
            if (particle.mesh.geometry) particle.mesh.geometry.dispose();
            if (particle.mesh.material) particle.mesh.material.dispose();
          }
        }
        
        // Continue animation if effects still active
        if (elapsed < 1.0 || particlesActive) {
          requestAnimationFrame(animateImpact);
        }
      };
      
      // Start animation
      animateImpact();
    }
  }
  
  /**
   * Deactivate the bullet
   */
  kill() {
    this.isAlive = false;
    
    // Hide the bullet
    this.container.visible = false;
    
    // Clean up particles
    this.particles.forEach(particle => {
      if (particle.mesh) {
        particle.mesh.visible = false;
      }
    });
  }
  
  /**
   * Reset the bullet
   */
  reset() {
    this.isAlive = false;
    this.lifetime = 0;
    this.distanceTraveled = 0;
    
    // Hide bullet and effects
    this.container.visible = false;
    
    if (this.mesh) this.mesh.visible = false;
    if (this.streak) this.streak.visible = false;
    if (this.tracer) this.tracer.visible = false;
    
    // Reset particles
    this.particles.forEach(particle => {
      if (particle.mesh) {
        particle.mesh.visible = false;
      }
    });
    
    // Remove from scene if it was added
    if (this.scene && this.container.parent === this.scene) {
      this.scene.remove(this.container);
    }
  }
  
  /**
   * Clean up resources when bullet is no longer needed
   */
  dispose() {
    // Clean up meshes and materials
    if (this.mesh) {
      if (this.mesh.geometry) this.mesh.geometry.dispose();
      if (this.mesh.material) this.mesh.material.dispose();
    }
    
    if (this.streak) {
      if (this.streak.geometry) this.streak.geometry.dispose();
      if (this.streak.material) this.streak.material.dispose();
    }
    
    if (this.tracer) {
      if (this.tracer.geometry) this.tracer.geometry.dispose();
      if (this.tracer.material) this.tracer.material.dispose();
    }
    
    // Clean up particles
    this.particles.forEach(particle => {
      if (particle.mesh) {
        if (particle.mesh.parent) {
          particle.mesh.parent.remove(particle.mesh);
        }
        if (particle.mesh.geometry) particle.mesh.geometry.dispose();
        if (particle.mesh.material) particle.mesh.material.dispose();
      }
    });
    
    this.particles = [];
    
    // Remove container from scene
    if (this.scene && this.container.parent === this.scene) {
      this.scene.remove(this.container);
    }
  }
}
