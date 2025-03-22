import * as THREE from 'three';

export class Bullet {
  constructor(game, assetLoader, position, direction, damage, verticalLook = 0) {
    this.game = game;
    this.assetLoader = assetLoader;
    this.position = position.clone();
    this.direction = direction;
    this.verticalLook = verticalLook;
    this.damage = damage;
    
    // Bullet properties
    this.speed = 15; // Units per second
    this.lifespan = 2; // Seconds
    this.isAlive = true;
    this.creationTime = Date.now();
    
    // Create mesh
    this.createMesh();
    
    // Set velocity based on direction for FPS, including vertical component
    this.velocity = new THREE.Vector3(
      Math.sin(this.direction) * this.speed,
      Math.sin(this.verticalLook) * this.speed, // Vertikale Geschwindigkeitskomponente
      Math.cos(this.direction) * this.speed
    );
  }
  
  createMesh() {
    // Create a more realistic bullet
    const bulletGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8);
    const bulletMaterial = new THREE.MeshStandardMaterial({
      map: this.assetLoader.getTexture('bullet'),
      color: 0xFFD700,
      emissive: 0xFFA500,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    
    this.mesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    // Rotate cylinder to align with direction
    this.mesh.rotation.x = Math.PI / 2;
    
    // Create tracer effect
    const tracerGeometry = new THREE.CylinderGeometry(0.01, 0.01, 1.5, 8);
    const tracerMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFF00,
      transparent: true,
      opacity: 0.7
    });
    
    this.tracer = new THREE.Mesh(tracerGeometry, tracerMaterial);
    this.tracer.rotation.x = Math.PI / 2;
    this.tracer.position.z = -0.7; // Behind bullet
    
    // Add light to bullet
    this.light = new THREE.PointLight(0xFFFF00, 0.8, 2);
    this.light.position.set(0, 0, 0);
    
    // Container for bullet and effects
    this.container = new THREE.Group();
    this.container.add(this.mesh);
    this.container.add(this.tracer);
    this.container.add(this.light);
    
    // Position and rotate container
    this.container.position.copy(this.position);
    this.container.rotation.y = -this.direction;
    
    // Rotate bullet container on x axis for vertical aim
    this.container.rotation.x = -this.verticalLook;
    
    // Add to scene
    this.game.scene.add(this.container);
  }
  
  update(deltaTime) {
    // Check if bullet should be destroyed based on lifespan
    if (Date.now() - this.creationTime > this.lifespan * 1000) {
      this.destroy();
      return;
    }
    
    // Move bullet
    const movement = new THREE.Vector3(
      this.velocity.x * deltaTime,
      this.velocity.y * deltaTime,
      this.velocity.z * deltaTime
    );
    
    this.container.position.add(movement);
    
    // Update position for collision detection
    this.position.copy(this.container.position);
    
    // Check collision with map boundaries
    if (this.checkMapBoundaries()) return;
    
    // Check collision with zombies
    if (this.checkZombieCollisions()) return;
    
    // Check collision with walls
    this.checkWallCollisions();
  }
  
  checkMapBoundaries() {
    // Get map dimensions
    const mapWidth = this.game.map.width * this.game.map.tileSize;
    const mapHeight = this.game.map.height * this.game.map.tileSize;
    
    // Get map position
    const mapOffsetX = this.game.map.container.position.x;
    const mapOffsetZ = this.game.map.container.position.z;
    
    // Check if bullet is out of bounds
    if (this.container.position.x < mapOffsetX ||
        this.container.position.x > mapOffsetX + mapWidth ||
        this.container.position.z < mapOffsetZ ||
        this.container.position.z > mapOffsetZ + mapHeight) {
      this.destroy();
      return true;
    }
    return false;
  }
  
  checkZombieCollisions() {
    // Check collision with zombies
    if (this.game.zombieManager) {
      for (const zombie of this.game.zombieManager.zombies) {
        if (!zombie.isAlive) continue;
        
        // Simple distance-based collision detection
        const distance = this.container.position.distanceTo(zombie.container.position);
        
        // If bullet is close enough to zombie, count as hit
        if (distance < 1.5) {
          zombie.takeDamage(this.damage);
          this.destroy();
          return true;
        }
      }
    }
    return false;
  }
  
  checkWallCollisions() {
    // Get the tile at bullet position
    const tile = this.game.map.getTileAt(this.container.position.x, this.container.position.z);
    
    // Check if tile is a wall or other blocking object
    if (tile && (tile.type === 'wall' || tile.type === 'tree')) {
      this.destroy();
    }
  }
  
  destroy() {
    if (!this.isAlive) return;
    
    this.isAlive = false;
    
    // Remove from scene
    this.game.scene.remove(this.container);
    
    // Optional: Add impact particle effect here
    this.createImpactEffect();
  }
  
  createImpactEffect() {
    // Create simple impact effect
    const impactGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const impactMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFF00,
      transparent: true,
      opacity: 0.7
    });
    
    const impact = new THREE.Mesh(impactGeometry, impactMaterial);
    impact.position.copy(this.position);
    
    this.game.scene.add(impact);
    
    // Animate impact effect - expand and fade
    const expandAndFade = () => {
      impact.scale.multiplyScalar(1.1);
      impact.material.opacity -= 0.1;
      
      if (impact.material.opacity <= 0) {
        this.game.scene.remove(impact);
      } else {
        setTimeout(expandAndFade, 20);
      }
    };
    
    setTimeout(expandAndFade, 20);
  }
} 