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

    // New wave progression system
    this.waveProgression = {
      bossWaveInterval: 5, // Boss wave every X waves
      maxWave: 30, // Maximum wave number (game win condition)
      waveStats: {}, // Statistics for each wave
      currentWaveStartTime: 0, // Track when wave started
      killedThisWave: 0, // Zombies killed in current wave
      waveModifiers: [], // Active modifiers for current wave
      difficultyMultiplier: 1.0, // Scales with game difficulty
    };

    // Wave modifiers collection
    this.availableModifiers = {
      'fast': { name: 'Frenzy', description: 'Zombies move 50% faster', speedMultiplier: 1.5 },
      'tough': { name: 'Resilient', description: 'Zombies have 50% more health', healthMultiplier: 1.5 },
      'horde': { name: 'Horde', description: 'Double zombie spawn count', countMultiplier: 2.0 },
      'healing': { name: 'Regenerating', description: 'Zombies slowly regenerate health', regenRate: 5 },
      'explosive': { name: 'Volatile', description: 'Zombies explode on death', explosionRadius: 3 }
    };

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

    // Update game state
    if (this.game.gameState) {
      this.game.gameState.wave = waveNumber;
    }

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
    
    // Set up new wave stats tracking
    this.setupWaveStats(waveNumber);
    
    // Apply wave modifiers based on wave number
    this.setupWaveModifiers(waveNumber);
    
    // Calculate number of zombies for this wave
    this.calculateZombiesForWave(waveNumber);
    
    // Show wave start message
    this.showWaveStartMessage(waveNumber);
    
    // Start spawning zombies
    this.isSpawning = true;
    this.spawnNextZombie();
    
    console.log(`Starting wave ${waveNumber} with ${this.zombiesRemaining} zombies`);
  }

  /**
   * Calculate the number of zombies for the current wave
   * @param {number} waveNumber - The current wave number
   */
  calculateZombiesForWave(waveNumber) {
    // Base number of zombies with progressive scaling
    let baseZombies = this.zombiesPerWave + Math.floor(waveNumber * 2.5);
    
    // Apply difficulty multiplier
    baseZombies = Math.ceil(baseZombies * this.waveProgression.difficultyMultiplier);
    
    // Apply horde modifier if active
    if (this.hasWaveModifier('horde')) {
      baseZombies = Math.ceil(baseZombies * this.availableModifiers.horde.countMultiplier);
    }
    
    // Check if this is a boss wave
    if (this.isBossWave(waveNumber)) {
      // Boss waves have special multipliers
      baseZombies = Math.floor(baseZombies * 0.7); // Fewer total zombies
    }
    
    // Cap at reasonable maximum based on difficulty and wave number
    const maxZombiesPerWave = 50 + (waveNumber * 5);
    this.zombiesRemaining = Math.min(baseZombies, maxZombiesPerWave);
    
    // Increase maximum concurrent zombies as waves progress
    this.maxZombies = 15 + Math.min(waveNumber * 2, 35);
  }

  /**
   * Setup wave stats tracking for the current wave
   * @param {number} waveNumber - The current wave number
   */
  setupWaveStats(waveNumber) {
    this.waveProgression.waveStats[waveNumber] = {
      startTime: performance.now(),
      zombiesSpawned: 0,
      zombiesKilled: 0,
      timeTaken: 0,
      completed: false,
      modifiers: []
    };
    
    this.waveProgression.currentWaveStartTime = performance.now();
    this.waveProgression.killedThisWave = 0;
  }

  /**
   * Apply wave modifiers based on wave number and randomization
   * @param {number} waveNumber - The current wave number
   */
  setupWaveModifiers(waveNumber) {
    // Clear previous wave modifiers
    this.waveProgression.waveModifiers = [];
    
    // Boss waves have their own special modifiers
    if (this.isBossWave(waveNumber)) {
      this.setupBossWaveModifiers(waveNumber);
      return;
    }
    
    // Chance of having modifiers increases with wave number
    const modifierChance = Math.min(0.2 + (waveNumber * 0.05), 0.8);
    
    if (Math.random() < modifierChance) {
      // Determine how many modifiers to apply (1-2)
      const modifierCount = Math.random() < 0.3 ? 2 : 1;
      
      // Get available modifier keys
      const modifierKeys = Object.keys(this.availableModifiers);
      
      // Apply random modifiers
      for (let i = 0; i < modifierCount; i++) {
        // Avoid duplicate modifiers
        let availableModifiers = modifierKeys.filter(
          mod => !this.waveProgression.waveModifiers.includes(mod)
        );
        
        if (availableModifiers.length > 0) {
          const selectedModifier = availableModifiers[
            Math.floor(Math.random() * availableModifiers.length)
          ];
          
          this.waveProgression.waveModifiers.push(selectedModifier);
          
          // Add to wave stats
          this.waveProgression.waveStats[waveNumber].modifiers.push(selectedModifier);
        }
      }
    }
    
    // Log active modifiers
    if (this.waveProgression.waveModifiers.length > 0) {
      console.log(`Wave ${waveNumber} modifiers:`, this.waveProgression.waveModifiers);
    }
  }

  /**
   * Setup special modifiers for boss waves
   * @param {number} waveNumber - The boss wave number
   */
  setupBossWaveModifiers(waveNumber) {
    // Boss wave number (1st boss = 1, 2nd boss = 2, etc.)
    const bossNumber = Math.floor(waveNumber / this.waveProgression.bossWaveInterval);
    
    // Different boss waves have different combinations of modifiers
    switch (bossNumber % 3) {
      case 0: // First boss type - tank zombies
        this.waveProgression.waveModifiers.push('tough');
        break;
      case 1: // Second boss type - fast zombies
        this.waveProgression.waveModifiers.push('fast');
        break;
      case 2: // Third boss type - explosive zombies
        this.waveProgression.waveModifiers.push('explosive');
        break;
    }
    
    // Higher level bosses get multiple modifiers
    if (bossNumber >= 3) {
      this.waveProgression.waveModifiers.push('healing');
    }
    
    // Add to wave stats
    this.waveProgression.waveStats[waveNumber].modifiers = [...this.waveProgression.waveModifiers];
    
    console.log(`Boss wave ${waveNumber} modifiers:`, this.waveProgression.waveModifiers);
  }

  /**
   * Set the game difficulty level
   * @param {string} difficulty - Difficulty level ('easy', 'normal', 'hard')
   */
  setDifficulty(difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        this.waveProgression.difficultyMultiplier = 0.7;
        this.zombiesPerWave = 8;
        break;
      case 'hard':
        this.waveProgression.difficultyMultiplier = 1.4;
        this.zombiesPerWave = 15;
        break;
      case 'normal':
      default:
        this.waveProgression.difficultyMultiplier = 1.0;
        this.zombiesPerWave = 10;
        break;
    }
    
    console.log(`Difficulty set to ${difficulty} (multiplier: ${this.waveProgression.difficultyMultiplier})`);
  }

  /**
   * Check if the current wave is a boss wave
   * @param {number} waveNumber - The wave number to check
   * @returns {boolean} - True if this is a boss wave
   */
  isBossWave(waveNumber) {
    return waveNumber % this.waveProgression.bossWaveInterval === 0;
  }

  /**
   * Check if a specific wave modifier is active
   * @param {string} modifierKey - The modifier key to check for
   * @returns {boolean} - True if the modifier is active
   */
  hasWaveModifier(modifierKey) {
    return this.waveProgression.waveModifiers.includes(modifierKey);
  }

  /**
   * Get a subtitle for the wave based on type and modifiers
   * @param {number} waveNumber - The current wave number
   * @returns {string} - A subtitle for the wave
   */
  getWaveSubtitle(waveNumber) {
    // Check if this is a boss wave
    if (this.isBossWave(waveNumber)) {
      return `BOSS WAVE - Prepare for a challenge!`;
    }
    
    // If we have modifiers, display them instead
    if (this.waveProgression.waveModifiers.length > 0) {
      const modifierNames = this.waveProgression.waveModifiers.map(
        key => this.availableModifiers[key].name
      );
      
      return `Special wave: ${modifierNames.join(', ')}`;
    }
    
    // Otherwise use standard subtitles
    const subtitles = [
      "They're Coming...",
      "Stay Alert!",
      "Keep Fighting!",
      "Don't Give Up!",
      "They're Getting Stronger!",
      "Fight for Survival!",
      "They're Everywhere!",
      "No Mercy!",
      "The Horde Approaches...",
      "Prepare for Battle!"
    ];
    
    // Select based on wave number or randomly for higher waves
    if (waveNumber <= 10) {
      return subtitles[waveNumber - 1];
    } else {
      return subtitles[Math.floor(Math.random() * subtitles.length)];
    }
  }

  /**
   * Show wave start message with special formatting for boss waves
   * @param {number} waveNumber - The wave number to display
   */
  showWaveStartMessage(waveNumber) {
    // Get subtitle for this wave
    const subtitle = this.getWaveSubtitle(waveNumber);
    
    // Check if UI manager exists
    if (this.game.uiManager) {
      if (this.isBossWave(waveNumber)) {
        // Boss waves get special UI treatment
        this.game.uiManager.showBossWave(waveNumber, subtitle);
      } else {
        // Normal wave message
        this.game.uiManager.showWaveMessage(waveNumber, subtitle);
      }
    }
  }

  /**
   * Spawn a single zombie and queue the next spawn
   */
  spawnNextZombie() {
    if (!this.isSpawning || this.zombiesRemaining <= 0) return;
    
    // Get current active zombie count
    const activeZombieCount = this.zombies.filter(zombie => zombie.isAlive).length;
    
    // Only spawn if below max zombies and we have remaining zombies to spawn
    if (activeZombieCount < this.maxZombies && this.zombiesRemaining > 0) {
      // Determine zombie type based on wave number
      const zombieType = this.getRandomZombieType();
      
      // Spawn the zombie
      this.spawnZombie(zombieType);
      
      // Decrease remaining count
      this.zombiesRemaining--;
    }
    
    // Schedule next spawn based on difficulty and current count
    const baseDelay = 1000; // 1 second base delay
    const waveModifier = Math.max(0.5, 1 - (this.currentWave * 0.05)); // Waves get faster
    const countModifier = Math.max(0.5, 1 - (activeZombieCount / this.maxZombies)); // Spawn slower if near max
    
    const nextSpawnDelay = baseDelay * waveModifier * countModifier;
    
    // Schedule next spawn
    setTimeout(() => this.spawnNextZombie(), nextSpawnDelay);
    
    // If this is the last zombie, check if wave is complete
    if (this.zombiesRemaining <= 0) {
      this.checkWaveComplete();
    }
  }

  /**
   * Get a random zombie type based on current wave
   * @returns {string} - The zombie type to spawn
   */
  getRandomZombieType() {
    // Check if this is a boss wave
    if (this.isBossWave(this.currentWave)) {
      // In boss waves, higher chance of special zombies
      const bossWaveTypes = this.zombieFactory.getBossWaveZombieTypes(this.currentWave, 1);
      return bossWaveTypes[0];
    }
    
    // Use ZombieFactory to determine types for current wave
    const types = this.zombieFactory.getZombieTypesForWave(this.currentWave, 1);
    return types[0]; // Return the single type from the array
  }

  /**
   * Check if the current wave is complete and trigger next wave
   */
  checkWaveComplete() {
    // Wait for all zombies to be killed
    const zombieCheckInterval = setInterval(() => {
      if (this.zombies.filter(zombie => zombie.isAlive).length === 0) {
        // Wave is complete, stop checking
        clearInterval(zombieCheckInterval);
        
        // Trigger wave complete
        this.onWaveComplete();
      }
    }, 1000);
  }

  spawnZombies() {
    // This method is now deprecated in favor of spawnNextZombie
    // which handles spawning in a more controlled, sequential manner
    console.warn('spawnZombies() is deprecated, use spawnNextZombie() instead');
    this.spawnNextZombie();
  }

  /**
   * Spawn a zombie of the specified type at a valid spawn point
   * @param {string} type - The type of zombie to spawn (standard, runner, brute)
   * @returns {Zombie} - The spawned zombie instance
   */
  spawnZombie(type = 'standard') {
    // Don't spawn if no spawn points
    if (this.spawnPoints.length === 0) {
      console.warn('No valid spawn points to spawn zombie');
      return null;
    }
    
    // Select a random spawn point
    const spawnIndex = Math.floor(Math.random() * this.spawnPoints.length);
    const spawnPoint = this.spawnPoints[spawnIndex];
    
    try {
      // Create the zombie
      const zombie = new Zombie(this.game, this.assetLoader, spawnPoint, { type });
      
      // Apply wave modifiers
      this.applyWaveModifiersToZombie(zombie);
      
      // Add to the scene
      this.game.scene.add(zombie.container);
      
      // Add to zombies array
      this.zombies.push(zombie);
      
      // Create spawn effect
      this.createSpawnEffect(spawnPoint);
      
      // Track zombie spawn in wave stats
      if (this.waveProgression.waveStats[this.currentWave]) {
        this.waveProgression.waveStats[this.currentWave].zombiesSpawned++;
      }
      
      // Update game state
      if (this.game.gameState) {
        this.game.gameState.zombiesSpawned++;
      }
      
      console.log(`Spawned ${type} zombie at ${spawnPoint.x.toFixed(2)}, ${spawnPoint.y.toFixed(2)}, ${spawnPoint.z.toFixed(2)}`);
      
      return zombie;
    } catch (error) {
      console.error('Error spawning zombie:', error);
      return null;
    }
  }

  /**
   * Create a visual effect at the spawn point
   * @param {THREE.Vector3} position - The position to create the effect
   */
  createSpawnEffect(position) {
    // Create a simple particle effect
    const particleCount = 15;
    const particles = [];
    
    // Create particle geometry
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    // Create particle material
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x331111,
      size: 0.2,
      transparent: true,
      opacity: 0.8
    });
    
    // Set initial positions
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = position.x;
      positions[i3 + 1] = position.y + 0.1;
      positions[i3 + 2] = position.z;
      
      // Create particle data
      particles.push({
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 2,
          (Math.random() - 0.5) * 2
        ),
        lifetime: 1 + Math.random()
      });
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create particle system
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    this.game.scene.add(particleSystem);
    
    // Update particles
    let elapsed = 0;
    const updateInterval = 1/60; // 60fps
    
    const updateParticles = () => {
      elapsed += updateInterval;
      
      // Update positions
      let anyAlive = false;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const particle = particles[i];
        
        // Check if particle is still alive
        if (elapsed < particle.lifetime) {
          anyAlive = true;
          
          // Update position
          positions[i3] += particle.velocity.x * updateInterval;
          positions[i3 + 1] += particle.velocity.y * updateInterval;
          positions[i3 + 2] += particle.velocity.z * updateInterval;
          
          // Add gravity
          particle.velocity.y -= 3 * updateInterval;
          
          // Fade out
          particleMaterial.opacity = Math.max(0, 0.8 * (1 - (elapsed / particle.lifetime)));
        }
      }
      
      // Update buffer attribute
      particleGeometry.attributes.position.needsUpdate = true;
      
      // Continue if any particles are alive
      if (anyAlive) {
        setTimeout(updateParticles, updateInterval * 1000);
      } else {
        // Clean up
        this.game.scene.remove(particleSystem);
        particleGeometry.dispose();
        particleMaterial.dispose();
      }
    };
    
    // Start updating
    setTimeout(updateParticles, updateInterval * 1000);
  }

  update(deltaTime) {
    // Update existing zombies
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const zombie = this.zombies[i];
      
      // Remove dead zombies after their animation completes
      if (!zombie.isAlive && zombie.animationComplete) {
        // Remove from scene
        this.game.scene.remove(zombie.container);
        
        // Dispose of resources
        zombie.dispose();
        
        // Remove from array
        this.zombies.splice(i, 1);
        
        continue;
      }
      
      // Performance optimization: fully update zombies near the player,
      // simplified update for distant zombies
      if (this.shouldFullyUpdate(zombie)) {
        zombie.update(deltaTime);
      } else {
        this.simplifiedUpdate(zombie, deltaTime);
      }
    }
    
    // If wave is complete and all zombies are dead, start next wave
    if (!this.isSpawning && this.zombies.length === 0 && !this.isWaveTransitioning) {
      this.prepareNextWave();
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
    console.log(`Wave ${this.currentWave} completed!`);
    
    // Stop spawning
    this.isSpawning = false;
    
    // Calculate time taken for the wave
    const timeTaken = (performance.now() - this.waveProgression.currentWaveStartTime) / 1000;
    
    // Update wave stats
    if (this.waveProgression.waveStats[this.currentWave]) {
      this.waveProgression.waveStats[this.currentWave].timeTaken = timeTaken;
      this.waveProgression.waveStats[this.currentWave].completed = true;
    }
    
    // Award wave completion bonus
    this.awardWaveCompletionBonus();
    
    // Log wave statistics
    console.log(`Wave ${this.currentWave} statistics:`, 
      this.waveProgression.waveStats[this.currentWave]);
    
    // Check for game completion
    if (this.currentWave >= this.waveProgression.maxWave) {
      this.onGameComplete();
      return;
    }
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

  /**
   * Prepare for the next wave with a delay
   */
  prepareNextWave() {
    // Set transitioning flag to prevent multiple calls
    this.isWaveTransitioning = true;
    
    // Show wave complete message if UI manager exists
    if (this.game.uiManager) {
      this.game.uiManager.showWaveComplete(this.currentWave);
    }
    
    // Determine delay based on wave type
    let delay = 5000; // 5 seconds between normal waves
    
    // Longer delay after boss waves
    if (this.isBossWave(this.currentWave)) {
      delay = 10000; // 10 seconds after boss waves
    }
    
    // Wait before starting next wave
    setTimeout(() => {
      // Start next wave
      this.startNewWave(this.currentWave + 1);
      
      // Reset transitioning flag
      this.isWaveTransitioning = false;
    }, delay);
  }

  /**
   * Apply wave modifiers to a zombie
   * @param {Zombie} zombie - The zombie to modify
   */
  applyWaveModifiersToZombie(zombie) {
    // Apply active wave modifiers
    for (const modifier of this.waveProgression.waveModifiers) {
      const modData = this.availableModifiers[modifier];
      
      if (!modData) continue;
      
      // Apply modifier effects
      if (modData.speedMultiplier) {
        zombie.speed *= modData.speedMultiplier;
      }
      
      if (modData.healthMultiplier) {
        zombie.health *= modData.healthMultiplier;
        zombie.maxHealth *= modData.healthMultiplier;
      }
      
      if (modData.regenRate) {
        zombie.healthRegen = modData.regenRate;
      }
      
      if (modData.explosionRadius) {
        zombie.explodeOnDeath = true;
        zombie.explosionRadius = modData.explosionRadius;
      }
    }
    
    // Boss wave zombies get slight health boost regardless of modifiers
    if (this.isBossWave(this.currentWave)) {
      zombie.health *= 1.2;
      zombie.maxHealth *= 1.2;
    }
  }

  /**
   * Handle game completion after final wave
   */
  onGameComplete() {
    console.log('All waves completed! Game won!');
    
    // Use game state manager if available
    if (this.game.gameStateManager) {
      this.game.gameStateManager.changeState(this.game.gameStateManager.states.VICTORY);
    } else {
      // Fallback to old behavior
      // Update game state
      if (this.game.gameState) {
        this.game.gameState.status = 'won';
      }
      
      // Show game complete UI if available
      if (this.game.uiManager) {
        this.game.uiManager.showGameComplete(this.waveProgression.waveStats);
      }
    }
  }

  /**
   * Award bonus points and items for completing a wave
   */
  awardWaveCompletionBonus() {
    if (!this.game.player) return;
    
    // Calculate wave bonus based on wave number and difficulty
    const baseBonus = this.currentWave * 100;
    const difficultyBonus = Math.floor(baseBonus * this.waveProgression.difficultyMultiplier);
    
    // Additional bonus for boss waves
    const bossMultiplier = this.isBossWave(this.currentWave) ? 2 : 1;
    const totalBonus = difficultyBonus * bossMultiplier;
    
    // Add score to player
    this.game.player.addScore(totalBonus);
    
    // Show bonus message
    if (this.game.uiManager) {
      this.game.uiManager.showBonusMessage(
        `Wave ${this.currentWave} Completed!`, 
        `+${totalBonus} bonus points`
      );
    }
    
    // Boss waves have a chance for health pack
    if (this.isBossWave(this.currentWave) && Math.random() < 0.7) {
      // Spawn health pack near player if entity manager exists
      if (this.game.entityManager) {
        this.game.entityManager.spawnHealthPack(this.game.player.position);
      }
    }
    
    // Spawn ammo pickups for weapon
    if (this.game.entityManager && Math.random() < 0.8) {
      const pickupCount = this.isBossWave(this.currentWave) ? 3 : 1;
      this.game.entityManager.spawnAmmoPickups(pickupCount);
    }
  }

  /**
   * Record zombie kill in wave statistics
   * @param {Zombie} zombie - The killed zombie
   */
  recordZombieKill(zombie) {
    // Increment stats counters
    if (this.waveProgression.waveStats[this.currentWave]) {
      this.waveProgression.waveStats[this.currentWave].zombiesKilled++;
    }
    
    this.waveProgression.killedThisWave++;
    
    // Update game state
    if (this.game.gameState) {
      this.game.gameState.zombiesKilled++;
    }
    
    // Check for zombie explosion on death
    if (zombie.explodeOnDeath) {
      this.triggerZombieExplosion(zombie);
    }
  }

  /**
   * Trigger explosion effect for zombies with explosive modifier
   * @param {Zombie} zombie - The zombie that's exploding
   */
  triggerZombieExplosion(zombie) {
    // Create explosion effect
    if (this.game.effectsManager) {
      this.game.effectsManager.createExplosion(zombie.position, {
        radius: zombie.explosionRadius || 3
      });
    }
    
    // Deal damage to nearby entities including player
    const radius = zombie.explosionRadius || 3;
    const explosionPos = zombie.position.clone();
    
    // Damage nearby zombies
    for (const otherZombie of this.zombies) {
      // Skip the exploding zombie and already dead zombies
      if (otherZombie === zombie || !otherZombie.isAlive) continue;
      
      const distance = otherZombie.position.distanceTo(explosionPos);
      
      if (distance <= radius) {
        // Calculate damage based on distance (more damage closer to explosion)
        const damage = Math.ceil(50 * (1 - (distance / radius)));
        otherZombie.takeDamage(damage);
      }
    }
    
    // Damage player if nearby
    if (this.game.player) {
      const playerDistance = this.game.player.position.distanceTo(explosionPos);
      
      if (playerDistance <= radius) {
        const playerDamage = Math.ceil(25 * (1 - (playerDistance / radius)));
        this.game.player.takeDamage(playerDamage);
      }
    }
  }

  /**
   * Process weapon damage on a specific zombie
   * @param {Zombie} zombie - The zombie to damage
   * @param {Object} weapon - The weapon dealing damage
   * @param {Object} hitInfo - Information about the hit
   * @param {string} hitInfo.hitZone - Zone that was hit (head, torso, limb)
   * @param {THREE.Vector3} hitInfo.hitPosition - Position where the hit occurred
   * @param {boolean} hitInfo.isCritical - Whether this was a critical hit 
   * @returns {Object} Damage information
   */
  processZombieDamage(zombie, weapon, hitInfo) {
    if (!zombie || !zombie.isAlive) return { success: false };
    
    // Get base damage from weapon
    const baseDamage = weapon.damage || 10;
    
    // Extract hit information
    const { hitZone = 'torso', hitPosition, isCritical = false } = hitInfo;
    
    // Apply damage to zombie
    const success = zombie.takeDamage(baseDamage, {
      hitZone,
      isCritical,
      damageSource: 'player'
    });
    
    // Return result
    return {
      success,
      zombie,
      damage: baseDamage,
      hitZone,
      isCritical,
      killConfirmed: !zombie.isAlive
    };
  }
  
  /**
   * Damage all zombies in radius
   * @param {THREE.Vector3} position - Center position
   * @param {number} radius - Damage radius
   * @param {number} damage - Base damage
   * @param {Object} source - Source entity to exclude from damage
   */
  damageZombiesInRadius(position, radius, damage, source = null) {
    for (const zombie of this.zombies) {
      // Skip if not alive or is the source
      if (!zombie.isAlive || zombie === source) continue;
      
      // Calculate distance to explosion
      const distance = zombie.container.position.distanceTo(position);
      
      // Apply damage if in radius
      if (distance <= radius) {
        // Calculate damage based on distance (more damage closer to center)
        const damageMultiplier = 1 - (distance / radius);
        const finalDamage = Math.round(damage * damageMultiplier);
        
        // Apply damage
        zombie.takeDamage(finalDamage, {
          hitZone: 'torso', // Default to torso for explosions
          isCritical: false,
          damageSource: 'explosion'
        });
      }
    }
  }
  
  /**
   * Alert zombies in radius
   * @param {THREE.Vector3} position - Center position
   * @param {number} radius - Alert radius
   * @param {Object} source - Source entity
   */
  alertZombiesInRadius(position, radius, source = null) {
    for (const zombie of this.zombies) {
      // Skip if not alive or is the source
      if (!zombie.isAlive || zombie === source) continue;
      
      // Calculate distance
      const distance = zombie.container.position.distanceTo(position);
      
      // Alert if in radius
      if (distance <= radius) {
        // Force path recalculation in zombie to make it more alert
        if (zombie.findPathToPlayer) {
          zombie.findPathToPlayer();
        }
      }
    }
  }
}
