import * as THREE from 'three';
import { Zombie } from '../entities/Zombie.js';
import { ZombieFactory } from '../entities/zombies/ZombieFactory.js';
import { ZombieTextureAtlas } from '../../utils/ZombieTextureAtlas.js';

export class ZombieManager {
  constructor(game, assetLoader) {
    this.game = game;
    this.assetLoader = assetLoader;

    // Zombie management
    this.zombies = [];
    this.maxZombies = 20; // Maximum zombies allowed at once
    this.zombiesPerWave = 10; // Base number of zombies per wave
    this.zombiesRemaining = 0;
    this.isSpawning = false;
    this.currentWave = 1;

    // Spawn points will be determined when the city is loaded
    this.spawnPoints = [];

    // Debug visualization
    this.debugMode = false; // Set to true to show spawn points
    this.debugMarkers = [];
    
    // Create zombie factory
    this.zombieFactory = new ZombieFactory(assetLoader);
    
    // Create texture atlas for zombies
    this.textureAtlas = new ZombieTextureAtlas();
  }

  init() {
    // Called when city is loaded to setup spawn points
    this.determineSpawnPoints();

    // Check for debug mode
    if (window.location.search.includes('debug=true')) {
      this.debugMode = true;
    }
    
    // Register textures with asset loader
    this.registerZombieTextures();
  }
  
  /**
   * Register procedurally generated zombie textures with asset loader
   */
  registerZombieTextures() {
    // Create body textures for each zombie type
    ['standard', 'runner', 'brute'].forEach(type => {
      for (let variation = 0; variation < 4; variation++) {
        const bodyTexture = this.textureAtlas.getBodyTexture(type, variation);
        const headTexture = this.textureAtlas.getHeadTexture(type, variation);
        
        // Register with asset loader
        this.assetLoader.registerTexture(`zombie_${type}_${variation}_body`, bodyTexture);
        this.assetLoader.registerTexture(`zombie_${type}_${variation}_head`, headTexture);
      }
    });
  }

  configure(config) {
    // Update zombie manager configuration based on level settings
    if (config.spawnRate) {
      // Adjust spawn rate
      this.spawnRate = config.spawnRate;
    }
    
    if (config.maxZombies) {
      // Set maximum zombies allowed at once
      this.maxZombies = config.maxZombies;
    }
    
    if (config.waveCount) {
      // Set the number of waves for this level
      this.waveCount = config.waveCount;
    }
    
    console.log(`ZombieManager configured: spawnRate=${this.spawnRate}, maxZombies=${this.maxZombies}, waveCount=${this.waveCount}`);
  }

  // Create visual markers for spawn points in debug mode
  visualizeSpawnPoints() {
    if (!this.debugMode) return;

    // Clear previous markers
    for (const marker of this.debugMarkers) {
      this.game.scene.remove(marker);
    }
    this.debugMarkers = [];

    // Create new markers
    for (const spawnPoint of this.spawnPoints) {
      const geometry = new THREE.SphereGeometry(0.3, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.copy(spawnPoint);
      marker.position.y = 0.5; // Lift slightly above ground

      this.game.scene.add(marker);
      this.debugMarkers.push(marker);
    }
  }

  determineSpawnPoints() {
    // Clear existing spawn points
    this.spawnPoints = [];

    // Check if city exists and has citySize before trying to use it
    if (!this.game.city || typeof this.game.city.citySize === 'undefined') {
      console.warn('City not initialized yet, using default spawn points');
      // Create some default spawn points in a circle around the origin
      const radius = 20; // Default radius
      const numPoints = 20; // Number of points around the circle
      
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        this.addSpawnPoint(x, z);
      }
      
      return;
    }

    // Create spawn points around the edges of the city
    const citySize = this.game.city.citySize;
    const cityOffsetX = this.game.city.container.position.x;
    const cityOffsetZ = this.game.city.container.position.z;

    // Number of spawn points per edge
    const spawnPointsPerEdge = 20;
    const spacing = citySize / spawnPointsPerEdge;

    // Add spawn points along the edges
    for (let i = 0; i < spawnPointsPerEdge; i++) {
      const offset = i * spacing;

      // Top edge
      this.addSpawnPoint(cityOffsetX + offset, cityOffsetZ);

      // Bottom edge
      this.addSpawnPoint(cityOffsetX + offset, cityOffsetZ + citySize - 1);

      // Left edge
      this.addSpawnPoint(cityOffsetX, cityOffsetZ + offset);

      // Right edge
      this.addSpawnPoint(cityOffsetX + citySize - 1, cityOffsetZ + offset);
    }

    console.log(`Generated ${this.spawnPoints.length} spawn points`);

    // Validate spawn points (can be skipped for the initial city implementation)
    // this.validateSpawnPoints();

    // Visualize spawn points if in debug mode
    this.visualizeSpawnPoints();
  }

  addSpawnPoint(x, z) {
    // Create spawn point at the specified position
    const position = new THREE.Vector3(x, 0, z);

    // Add some random variation to prevent zombies from spawning at exact same spots
    position.x += (Math.random() - 0.5) * 2;
    position.z += (Math.random() - 0.5) * 2;

    // Set Y position to ground level (0 for now)
    position.y = 0;

    this.spawnPoints.push(position);
  }

  // Validate that spawn points have a valid path to the player
  validateSpawnPoints() {
    // Skip validation if no navigation grid
    if (!this.game.navigationGrid) {
      console.log('Navigation grid not available, skipping spawn point validation');
      return;
    }

    console.log('Validating spawn points for valid paths to player...');
    
    // Keep track of valid spawn points
    const validSpawnPoints = [];
    
    // Get player position
    if (!this.game.player || !this.game.player.container) {
      console.warn('Player not initialized, cannot validate spawn points');
      return;
    }
    
    const playerPos = this.game.player.container.position.clone();
    playerPos.y = 0; // Keep on ground level
    
    // Check each spawn point
    for (const spawnPoint of this.spawnPoints) {
      // First check if the spawn point itself is walkable
      const isWalkable = this.game.navigationGrid.isWalkable(spawnPoint);
      
      if (isWalkable) {
        // Try to find a path from spawn point to player
        const path = this.game.navigationGrid.findPath(spawnPoint, playerPos);
        
        // If path exists, add to valid spawn points
        if (path && path.length > 0) {
          validSpawnPoints.push(spawnPoint);
        }
      }
    }
    
    // Update spawn points with only valid ones
    if (validSpawnPoints.length > 0) {
      console.log(`Found ${validSpawnPoints.length} valid spawn points out of ${this.spawnPoints.length}`);
      this.spawnPoints = validSpawnPoints;
    } else {
      console.warn('No valid spawn points found, keeping original spawn points');
    }
  }

  // Method to start spawning zombies (called from Game.start)
  startSpawning() {
    console.log('Starting zombie spawning');
    // Start with wave 1
    this.startNewWave(1);
  }

  startNewWave(waveNumber) {
    if (this.isSpawning) return;
    
    // Store the current wave number
    this.currentWave = waveNumber;

    // Always recalculate spawn points for new waves
    // This ensures they work with procedural maps
    this.determineSpawnPoints();

    // Validate spawn points to ensure they have a path to player
    this.validateSpawnPoints();

    // If no spawn points were found, create a fallback spawn point
    if (this.spawnPoints.length === 0) {
      this.findFallbackSpawnPoint();
    }

    // Update debug visualization
    this.visualizeSpawnPoints();

    // Calculate zombies for this wave
    // Cap the maximum number of zombies per wave to prevent overwhelming numbers
    const baseZombies = this.zombiesPerWave;
    const extraZombies = Math.min((waveNumber - 1) * 5, 50); // Cap extra zombies at 50
    this.zombiesRemaining = baseZombies + extraZombies;

    // Initialize gameState if it doesn't exist
    if (!this.game.gameState) {
      console.warn('Game state not initialized, creating it now');
      this.game.gameState = {
        zombiesSpawned: 0,
        zombiesKilled: 0,
        wave: 1,
        score: 0
      };
    }

    // Update game state
    this.game.gameState.zombiesSpawned = 0;
    this.game.gameState.zombiesKilled = 0; // Reset zombies killed counter for new wave
    this.game.gameState.wave = waveNumber;

    // Start spawning
    this.spawnZombies();
  }

  spawnZombies() {
    // Set spawning flag
    this.isSpawning = true;

    // Initialize gameState if needed
    if (!this.game.gameState) {
      console.warn('Game state not initialized, creating it now');
      this.game.gameState = {
        zombiesSpawned: 0,
        zombiesKilled: 0,
        wave: 1,
        score: 0
      };
    }

    // Get zombie types for this wave
    const zombieTypes = this.zombieFactory.getZombieTypesForWave(
      this.currentWave, 
      this.zombiesRemaining
    );

    // Spawn mit größerer Verzögerung, damit Zombies mehr Zeit haben
    const spawnInterval = setInterval(() => {
      // Stop if no more zombies to spawn or we hit the max
      if (this.zombiesRemaining <= 0 || this.zombies.length >= this.maxZombies) {
        clearInterval(spawnInterval);
        this.isSpawning = false;
        return;
      }

      // Spawn a zombie with type based on the pre-calculated array
      const zombieType = zombieTypes[this.zombiesRemaining - 1] || 'standard';
      this.spawnZombie(zombieType);
      this.zombiesRemaining--;
      this.game.gameState.zombiesSpawned++;
    }, 2000); // Spawn a zombie every 2 seconds instead of 1 second
  }

  spawnZombie(type = 'standard') {
    // Skip if at max zombies
    if (this.zombies.length >= this.maxZombies) {
      return null;
    }

    // Check if we have spawn points
    if (this.spawnPoints.length === 0) {
      console.warn('No spawn points available');
      this.determineSpawnPoints();
      return null;
    }

    // Select a random spawn point
    const spawnIndex = Math.floor(Math.random() * this.spawnPoints.length);
    const spawnPoint = this.spawnPoints[spawnIndex];

    // Validate the spawn point with navigation grid
    let isValidSpawn = true;
    if (this.game.navigationGrid) {
      isValidSpawn = this.game.navigationGrid.isWalkable(spawnPoint);
    }

    // Skip if spawn point is not valid
    if (!isValidSpawn) {
      console.warn(`Invalid spawn point at ${spawnPoint.x}, ${spawnPoint.z}`);
      return null;
    }

    // Create a new zombie
    const zombie = new Zombie(this.game, this.assetLoader, spawnPoint, { type });

    // Add to zombies array
    this.zombies.push(zombie);

    // Add to scene
    this.game.scene.add(zombie.container);

    // Update tracking counters
    this.zombiesRemaining--;
    if (this.game.gameState) {
      this.game.gameState.zombiesSpawned++;
    }

    return zombie;
  }

  update(deltaTime) {
    // For performance, limit the number of updates based on current detail level
    let updateCount = 0;
    const maxUpdatesPerFrame = 20; // Limit number of full updates

    // Update each zombie's position and actions
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const zombie = this.zombies[i];

      // If zombie is dead and animation is complete, remove it
      if (!zombie.isAlive && zombie.animationComplete) {
        // Remove from scene
        this.game.scene.remove(zombie.container);
        // Remove from array
        this.zombies.splice(i, 1);
        continue;
      }

      // Full update for zombies that are close to player or in view
      if (updateCount < maxUpdatesPerFrame && this.shouldFullyUpdate(zombie)) {
        zombie.update(deltaTime);
        updateCount++;
      } else {
        // Simplified update for distant zombies (pathfinding only)
        this.simplifiedUpdate(zombie, deltaTime);
      }
    }

    // Check if wave is complete
    if (!this.isSpawning && this.isWaveComplete()) {
      this.onWaveComplete();
    }
  }

  shouldFullyUpdate(zombie) {
    // Check if zombie is close to player or in view frustum
    if (!this.game.player || !this.game.camera) return false;

    const distanceToPlayer = zombie.container.position.distanceTo(this.game.player.container.position);
    
    // Always fully update zombies close to player
    if (distanceToPlayer < 20) return true;
    
    // Check if zombie is in view frustum
    if (!this.game.frustum) return false;
    
    // Create a sphere around the zombie for frustum checking
    const sphere = new THREE.Sphere(zombie.container.position, 1);
    
    // Return true if zombie is in view frustum
    return this.game.frustum.intersectsSphere(sphere);
  }

  simplifiedUpdate(zombie, deltaTime) {
    // Just update pathfinding for zombies not in view
    zombie.updatePathfinding(deltaTime);
    
    // Update position, but with simplified physics
    if (zombie.path.length > 0) {
      const targetPosition = zombie.path[0];
      const direction = new THREE.Vector3()
        .subVectors(targetPosition, zombie.container.position)
        .normalize();
      
      // Move zombie toward target at reduced speed
      zombie.container.position.add(
        direction.multiplyScalar(zombie.speed * 0.5 * deltaTime)
      );
      
      // Look at target
      zombie.container.lookAt(targetPosition);
      
      // Check if we've reached the current target point
      const distanceToTarget = zombie.container.position.distanceTo(targetPosition);
      if (distanceToTarget < 0.5) {
        zombie.path.shift(); // Remove the first point from path
      }
    }
  }

  clearAllZombies() {
    // Remove all zombies from the scene
    for (const zombie of this.zombies) {
      this.game.scene.remove(zombie.container);
    }

    // Clear zombies array
    this.zombies = [];
  }

  isWaveComplete() {
    // Wave is complete if no zombies are alive and none are waiting to spawn
    const noLivingZombies = this.zombies.every(zombie => !zombie.isAlive);
    const noWaitingZombies = this.zombiesRemaining <= 0;

    if (noLivingZombies && noWaitingZombies) {
      console.log('Wave complete!');
      return true;
    }
    return false;
  }

  onWaveComplete() {
    // End of wave logic
    console.log(`Wave ${this.currentWave} complete!`);

    // Update game state
    if (this.game.gameState) {
      this.game.gameState.score += 100 * this.currentWave; // Bonus for completing wave
    }

    // Start next wave after a delay
    setTimeout(() => {
      this.startNewWave(this.currentWave + 1);
    }, 5000); // 5 second break between waves
  }

  findFallbackSpawnPoint() {
    console.log('Finding fallback spawn points...');
    // Create a circle of spawn points around the player at a safe distance
    if (!this.game.player) {
      console.warn('No player found for fallback spawn points. Using origin.');
      
      // Create spawn points in a circle around the origin
      const radius = 20;
      const numPoints = 10;
      
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        this.addSpawnPoint(x, z);
      }
      
      return;
    }
    
    // Create spawn points in a circle around the player
    const playerPos = this.game.player.container.position;
    const safeRadius = 25; // Distance from player
    const numPoints = 15;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const x = playerPos.x + Math.cos(angle) * safeRadius;
      const z = playerPos.z + Math.sin(angle) * safeRadius;
      
      // Check if this position is walkable
      if (this.isWalkableSpawnPoint(x, z)) {
        this.addSpawnPoint(x, z);
      }
    }
    
    console.log(`Created ${this.spawnPoints.length} fallback spawn points`);
  }

  isWalkableSpawnPoint(x, z) {
    // Check if this is a valid position for a zombie to spawn
    // For now, just use a basic ground level check
    
    // Check if this point is inside a building
    if (this.game.city && this.game.city.isPositionInBuilding(x, z)) {
      return false;
    }
    
    // Check if this point is outside the city bounds
    if (this.game.city) {
      const citySize = this.game.city.citySize;
      const cityOffsetX = this.game.city.container.position.x;
      const cityOffsetZ = this.game.city.container.position.z;
      
      if (x < cityOffsetX || x > cityOffsetX + citySize ||
          z < cityOffsetZ || z > cityOffsetZ + citySize) {
        return false;
      }
    }
    
    return true;
  }
}
