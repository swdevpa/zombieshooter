import * as THREE from 'three';
import { Zombie } from '../entities/Zombie.js';
import { ZombieFactory } from '../entities/zombies/ZombieFactory.js';
import { ZombieTextureAtlas } from '../../utils/ZombieTextureAtlas.js';
import { ZombiePool } from '../entities/ZombiePool.js';

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
    this.tutorialMode = false; // Flag for tutorial mode

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
    
    // Initialize zombie pool for object reuse
    this.zombiePool = null;
  }
  
  /**
   * Initialize the zombie manager
   */
  init() {
    console.log('Initializing ZombieManager with object pooling');
    
    // Create zombie pool
    this.zombiePool = new ZombiePool(this.game, this.assetLoader, 50);
    
    return this;
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
    
    // Update difficulty settings for this wave
    if (this.game.difficultyManager) {
      this.game.difficultyManager.updateForWave(waveNumber);
    }
    
    // Calculate number of zombies for this wave
    const totalZombies = this.calculateZombiesForWave(waveNumber);
    this.zombiesRemaining = totalZombies;
    
    // Set max zombies based on difficulty and wave
    if (this.game.difficultyManager) {
      this.maxZombies = this.game.difficultyManager.getMaxZombies(waveNumber);
    } else {
      // Fallback if no DifficultyManager
      this.maxZombies = 15 + Math.min(waveNumber * 2, 35);
    }

    // Update debug visualization
    this.visualizeSpawnPoints();
    
    // Set up new wave stats tracking
    this.setupWaveStats(waveNumber);
    
    // Apply wave modifiers based on wave number
    this.setupWaveModifiers(waveNumber);
    
    // Show wave start message
    this.showWaveStartMessage(waveNumber);
    
    // Start spawning zombies
    this.isSpawning = true;
    this.spawnNextZombie();
    
    console.log(`Starting wave ${waveNumber} with ${this.zombiesRemaining} zombies`);
  }

  /**
   * Calculate the number of zombies to spawn for a wave
   * @param {number} waveNumber - The wave number to calculate for
   * @returns {number} - The total number of zombies for this wave
   */
  calculateZombiesForWave(waveNumber) {
    // Use DifficultyManager if available
    if (this.game.difficultyManager) {
      return this.game.difficultyManager.getZombiesPerWave(waveNumber);
    }
    
    // Legacy calculation if DifficultyManager not available
    // Base number of zombies plus scaling
    let baseZombies = this.zombiesPerWave;
    
    // Increase by 5 zombies per wave
    let additionalZombies = (waveNumber - 1) * 5;
    
    // Apply difficulty multiplier
    let totalZombies = Math.floor((baseZombies + additionalZombies) * this.waveProgression.difficultyMultiplier);
    
    // Boss waves get extra zombies
    if (this.isBossWave(waveNumber)) {
      totalZombies = Math.floor(totalZombies * 1.5);
    }
    
    console.log(`Wave ${waveNumber}: Spawning ${totalZombies} zombies`);
    return totalZombies;
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
   * Update difficulty multipliers with detailed settings from DifficultyManager
   * @param {Object} multipliers - Object containing multiplier values
   */
  updateDifficultyMultipliers(multipliers) {
    // Store multipliers for reference
    this.difficultyMultipliers = multipliers;
    
    // Update zombie spawn count based on difficulty
    if (multipliers.spawnRate) {
      // Adjust zombiesPerWave based on spawnRate multiplier
      this.zombiesPerWave = Math.round(this.zombiesPerWave * multipliers.spawnRate);
    }
    
    console.log(`ZombieManager updated with difficulty multipliers:`, multipliers);
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
   * Get a random zombie type based on current wave and difficulty
   * @returns {string} - Type of zombie to spawn
   */
  getRandomZombieType() {
    // Use DifficultyManager if available
    if (this.game.difficultyManager) {
      return this.game.difficultyManager.getRandomZombieType(this.currentWave);
    }
    
    // Legacy implementation if DifficultyManager not available
    // Base percentages for each zombie type
    const chances = {
      standard: 60,
      runner: 20,
      brute: 15,
      exploder: 0,
      acid_spitter: 0,
      screamer: 0
    };
    
    // Adjust based on wave number
    if (this.currentWave >= 5) {
      chances.standard -= 10;
      chances.exploder = 5;
      chances.acid_spitter = 5;
    }
    
    if (this.currentWave >= 10) {
      chances.standard -= 10;
      chances.exploder += 5;
      chances.acid_spitter += 5;
      chances.screamer = 5;
    }
    
    // Random weighted selection
    const roll = Math.random() * 100;
    let cumulativeChance = 0;
    
    for (const [type, chance] of Object.entries(chances)) {
      cumulativeChance += chance;
      if (roll < cumulativeChance) {
        return type;
      }
    }
    
    return 'standard'; // Fallback
  }

  /**
   * Check if the current wave is complete and trigger next wave
   */
  checkWaveComplete() {
    // Wait for all zombies to be killed
    if (this.zombies.filter(zombie => zombie.isAlive).length === 0) {
      // Wave is complete
      console.log(`Wave ${this.currentWave} complete`);
      
      // Award wave completion bonus
      this.awardWaveCompletionBonus();
      
      // Record wave stats
      this.recordWaveStats();
      
      // Check if all waves are complete
      if (this.currentWave >= this.waveCount) {
        console.log('All waves complete!');
        this.onGameComplete();
        return;
      }
      
      // Prepare for the next wave
      this.prepareNextWave();
    }
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
    // Check if maximum concurrent zombies limit reached
    if (this.zombies.length >= this.maxZombies) {
      return null;
    }

    // Get a random spawn point
    const spawnPoint = this.getRandomSpawnPoint();
    if (!spawnPoint) {
      console.warn('No valid spawn points available');
      return null;
    }

    // Create options for this zombie
    const options = {
      position: spawnPoint, // Already a THREE.Vector3 from getRandomSpawnPoint
      health: 100, // Base health
      damage: 10,  // Base damage
      speed: 1.0,  // Base speed
      type: type
    };
    
    // Apply difficulty multipliers if available
    if (this.game.difficultyManager) {
      const typeMultipliers = this.game.difficultyManager.getZombieTypeMultipliers(type);
      
      options.health *= typeMultipliers.zombieHealth;
      options.damage *= typeMultipliers.zombieDamage;
      options.speed *= typeMultipliers.zombieSpeed;
    } else {
      // Apply wave modifiers if no DifficultyManager
      this.applyWaveModifiersToOptions(options);
    }

    try {
      // Get a zombie from the pool
      const zombie = this.zombiePool.getZombie(options.position, options);
      
      // Add to zombies array if not already there
      if (!this.zombies.includes(zombie)) {
        this.zombies.push(zombie);
      }
      
      // Create spawn effect
      this.createSpawnEffect(options.position);
      
      // Track zombie spawn in wave stats
      if (this.waveProgression.waveStats[this.currentWave]) {
        this.waveProgression.waveStats[this.currentWave].zombiesSpawned++;
      }
      
      // Update game state
      if (this.game.gameState) {
        this.game.gameState.zombiesSpawned++;
      }
      
      console.log(`Spawned ${type} zombie at ${options.position.x.toFixed(2)}, ${options.position.y.toFixed(2)}, ${options.position.z.toFixed(2)}`);
      
      return zombie;
    } catch (error) {
      console.error('Error spawning zombie:', error);
      return null;
    }
  }
  
  /**
   * Apply wave modifiers to zombie options
   * @param {Object} options - Zombie options object
   * @returns {Object} - Modified options
   */
  applyWaveModifiersToOptions(options) {
    // Make a copy of the options to modify
    const modifiedOptions = { ...options };
    
    // Apply active modifiers
    for (const modifier of this.waveProgression.waveModifiers) {
      const modifierConfig = this.availableModifiers[modifier];
      
      if (modifierConfig) {
        // Apply health multiplier if present
        if (modifierConfig.healthMultiplier) {
          modifiedOptions.healthMultiplier = modifierConfig.healthMultiplier;
        }
        
        // Apply speed multiplier if present
        if (modifierConfig.speedMultiplier) {
          modifiedOptions.speedMultiplier = modifierConfig.speedMultiplier;
        }
        
        // Apply regeneration if present
        if (modifierConfig.regenRate) {
          modifiedOptions.regenerates = true;
          modifiedOptions.regenRate = modifierConfig.regenRate;
        }
        
        // Apply explosion if present
        if (modifierConfig.explosionRadius) {
          modifiedOptions.explodes = true;
          modifiedOptions.explosionRadius = modifierConfig.explosionRadius;
        }
      }
    }
    
    return modifiedOptions;
  }
  
  /**
   * Create spawn effect using effects manager if available
   * @param {THREE.Vector3} position - Spawn position
   */
  createSpawnEffect(position) {
    // Use effects manager if available
    if (this.game.effectsManager) {
      this.game.effectsManager.createZombieSpawnEffect(position);
      return;
    }
    
    // Fallback to legacy effect code
    // ... existing createSpawnEffect code ...
  }
  
  /**
   * Handle zombie death with pooling
   * @param {Zombie} zombie - The zombie that died
   * @param {Object} options - Death options (e.g., explode)
   */
  handleZombieDeath(zombie, options = {}) {
    if (!zombie || !zombie.isAlive) return;
    
    // Mark as dead but don't release immediately (allow for death animation)
    zombie.isAlive = false;
    zombie.timeSinceDeath = 0;
    
    // Handle explosion if zombie explodes
    if (zombie.explodes) {
      this.createExplosionEffect(zombie.container.position.clone(), zombie.explosionRadius);
    }
    
    // Update stats
    this.waveProgression.killedThisWave++;
    
    // Update score
    if (this.game.scoreManager) {
      // Calculate score based on zombie type
      let score = 100; // Base score
      
      switch (zombie.type) {
        case 'runner': score = 150; break;
        case 'brute': score = 250; break;
        case 'exploder': score = 200; break;
        case 'spitter': score = 200; break;
        case 'screamer': score = 300; break;
      }
      
      // Critical hits (headshots) give bonus
      if (options.isCritical) {
        score *= 1.5;
      }
      
      this.game.scoreManager.addScore(score, options.isCritical);
    }
    
    // Check if wave is complete
    this.checkWaveComplete();
  }
  
  /**
   * Create explosion effect using effects manager if available
   * @param {THREE.Vector3} position - Explosion position
   * @param {number} radius - Explosion radius
   */
  createExplosionEffect(position, radius) {
    // Use effects manager if available
    if (this.game.effectsManager) {
      this.game.effectsManager.createExplosionEffect(position, radius);
      return;
    }
    
    // Fallback to legacy effect code
    // ... existing explosion effect code ...
  }
  
  /**
   * Update method called each frame
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    // Use zombie pool's update method if available
    if (this.zombiePool) {
      this.zombiePool.update(deltaTime);
    } else {
      // Legacy update code for zombies not using pooling
      // ... existing update code for zombies ...
    }
    
    // Update wave stats
    if (this.isSpawning && this.waveProgression.currentWaveStartTime > 0) {
      const waveStats = this.waveProgression.waveStats[this.currentWave];
      if (waveStats) {
        waveStats.duration = (Date.now() - this.waveProgression.currentWaveStartTime) / 1000;
      }
    }
  }
  
  /**
   * Clean up and release all zombies
   */
  cleanup() {
    // Release all zombies back to the pool
    if (this.zombiePool) {
      this.zombiePool.releaseAll();
      this.zombies = [];
    }
  }
  
  /**
   * Get count of active zombies
   * @returns {number} Number of active zombies
   */
  getActiveZombieCount() {
    if (this.zombiePool) {
      return this.zombiePool.getActiveCount();
    }
    
    // Fallback to legacy count method
    return this.zombies.filter(zombie => zombie.isAlive).length;
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
    // Start wave delay timer
    const nextWave = this.currentWave + 1;
    console.log(`Preparing for wave ${nextWave}`);
    
    // Show wave complete message
    if (this.game.ui) {
      this.game.ui.showWaveCompleteMessage(this.currentWave);
    }
    
    // Pause between waves
    const waveDelay = 5000; // 5 seconds
    setTimeout(() => {
      // Start next wave
      this.startNewWave(nextWave);
    }, waveDelay);
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
   * Award completion bonus for current wave
   */
  awardWaveCompletionBonus() {
    // Calculate if player didn't take damage in this wave
    const damageFree = this.waveProgression.waveStats[this.currentWave] && 
                       this.waveProgression.waveStats[this.currentWave].damageTaken === 0;
    
    // Award points through score manager
    if (this.game.scoreManager) {
      this.game.scoreManager.awardWaveCompletionBonus(this.currentWave, damageFree);
    }
    
    // Determine wave bonus type for UI feedback
    const isBossWave = this.isBossWave(this.currentWave);
    
    // Show wave complete message
    if (this.game.uiManager) {
      const message = isBossWave ? 'BOSS WAVE COMPLETED!' : 'WAVE COMPLETED!';
      this.game.uiManager.showBonusMessage(message, 'GET READY FOR NEXT WAVE');
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
    
    // Check if zombie is dead
    if (zombie.health <= 0 && !zombie.isDead) {
      zombie.isDead = true;
      
      // Award points through ScoreManager
      if (this.game.scoreManager) {
        this.game.scoreManager.recordZombieKill(
          zombie, 
          hitInfo && hitInfo.hitLocation === 'head'
        );
      }
      
      // Record kill for wave stats
      this.waveProgression.killedThisWave++;
      
      // Handle special effects based on wave modifiers
      if (this.hasWaveModifier('explosive')) {
        this.triggerZombieExplosion(zombie);
      }
      
      // Handle death animation
      this.handleZombieDeath(zombie);
    }
    
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

  /**
   * Record statistics for the current wave
   */
  recordWaveStats() {
    // Stop spawning
    this.isSpawning = false;
    
    // Calculate time taken for the wave
    const timeTaken = (performance.now() - this.waveProgression.currentWaveStartTime) / 1000;
    
    // Update wave stats
    if (this.waveProgression.waveStats[this.currentWave]) {
      this.waveProgression.waveStats[this.currentWave].timeTaken = timeTaken;
      this.waveProgression.waveStats[this.currentWave].completed = true;
      this.waveProgression.waveStats[this.currentWave].zombiesKilled = this.waveProgression.killedThisWave;
    }
    
    // Log wave statistics
    console.log(`Wave ${this.currentWave} statistics:`, 
      this.waveProgression.waveStats[this.currentWave]);
  }

  /**
   * Get a random spawn point
   * @returns {THREE.Vector3|null} - Random spawn point or null if none available
   */
  getRandomSpawnPoint() {
    if (this.spawnPoints.length === 0) {
      console.warn('No spawn points available');
      this.findFallbackSpawnPoint();
      
      if (this.spawnPoints.length === 0) {
        return null;
      }
    }
    
    // Select a random spawn point
    const spawnIndex = Math.floor(Math.random() * this.spawnPoints.length);
    return this.spawnPoints[spawnIndex].clone();
  }

  /**
   * Set tutorial mode for zombie spawning
   * @param {boolean} enabled - Whether tutorial mode is enabled
   */
  setTutorialMode(enabled) {
    this.tutorialMode = enabled;
    
    if (enabled) {
      // In tutorial mode, we only spawn a few zombies for practice
      this.maxZombies = 3;
      this.zombiesPerWave = 3;
      this.currentWave = 1;
      this.zombiesRemaining = 3;
      
      // Spawn only standard zombies in tutorial mode
      setTimeout(() => {
        // Spawn one zombie every few seconds
        this.spawnZombie('standard');
        
        setTimeout(() => {
          if (this.tutorialMode) this.spawnZombie('standard');
        }, 15000); // 15 seconds later
        
        setTimeout(() => {
          if (this.tutorialMode) this.spawnZombie('standard');
        }, 30000); // 30 seconds later
      }, 5000); // Wait 5 seconds before first spawn
      
      console.log('ZombieManager: Tutorial mode enabled');
    } else {
      // Reset to normal values when exiting tutorial mode
      this.maxZombies = 20;
      this.zombiesPerWave = 10;
      this.startSpawning(); // Resume normal spawning
      
      console.log('ZombieManager: Tutorial mode disabled');
    }
    
    return this;
  }
}
