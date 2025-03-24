/**
 * Manages game difficulty progression
 * Centralizes difficulty settings and scaling across the game
 */
export class DifficultyManager {
  constructor(game) {
    this.game = game;
    
    // Base difficulty levels
    this.difficultyLevels = {
      EASY: 'easy',
      NORMAL: 'normal',
      HARD: 'hard'
    };
    
    // Current chosen difficulty level
    this.currentDifficulty = this.difficultyLevels.NORMAL;
    
    // Base multipliers for each difficulty level
    this.baseMultipliers = {
      [this.difficultyLevels.EASY]: {
        zombieHealth: 0.7,
        zombieDamage: 0.6,
        zombieSpeed: 0.8,
        spawnRate: 0.7,
        specialZombieChance: 0.5,
        scoreMultiplier: 0.8
      },
      [this.difficultyLevels.NORMAL]: {
        zombieHealth: 1.0,
        zombieDamage: 1.0,
        zombieSpeed: 1.0,
        spawnRate: 1.0,
        specialZombieChance: 1.0,
        scoreMultiplier: 1.0
      },
      [this.difficultyLevels.HARD]: {
        zombieHealth: 1.4,
        zombieDamage: 1.3,
        zombieSpeed: 1.2,
        spawnRate: 1.3,
        specialZombieChance: 1.5,
        scoreMultiplier: 1.5
      }
    };
    
    // Dynamic difficulty adjustment settings
    this.dynamicDifficulty = {
      enabled: true,
      playerPerformanceWeight: 0.3, // How much player performance affects difficulty
      maxAdjustment: 0.4, // Maximum adjustment from base difficulty
      adjustmentSpeed: 0.05 // How quickly difficulty adjusts to player performance
    };
    
    // Current player performance rating (0.0 - 1.0)
    // 0.0 = struggling, 0.5 = average, 1.0 = excellent
    this.playerPerformanceRating = 0.5;
    
    // Track stats for dynamic difficulty adjustment
    this.performanceMetrics = {
      damageReceived: 0,
      zombiesKilled: 0,
      headshots: 0,
      timeSurvived: 0,
      lastUpdateTime: 0,
      metricWindow: 60, // Seconds to track metrics over
      recentDeaths: 0,
      lastResetTime: 0
    };
    
    // Wave scaling factors
    this.waveScaling = {
      healthIncreasePerWave: 0.08, // 8% more health per wave
      damageIncreasePerWave: 0.05, // 5% more damage per wave
      speedIncreasePerWave: 0.03, // 3% more speed per wave
      specialZombieChanceIncreasePerWave: 0.03, // 3% more special zombies per wave
      waveScalingCap: 30 // Stop scaling after this wave
    };
    
    // Current difficulty multipliers (calculated from base + dynamic + wave scaling)
    this.currentMultipliers = { ...this.baseMultipliers[this.currentDifficulty] };
    
    // Visual indicators
    this.difficultyColors = {
      [this.difficultyLevels.EASY]: '#4CAF50', // Green
      [this.difficultyLevels.NORMAL]: '#FFC107', // Amber
      [this.difficultyLevels.HARD]: '#F44336' // Red
    };
  }
  
  /**
   * Initialize the difficulty manager
   */
  init() {
    console.log('Initializing DifficultyManager');
    
    // Set initial difficulty from game state
    this.setDifficulty(this.game.gameState.difficulty || this.difficultyLevels.NORMAL);
    
    // Reset performance metrics
    this.resetPerformanceMetrics();
    
    return this;
  }
  
  /**
   * Set the base difficulty level
   * @param {string} difficulty - Difficulty level ('easy', 'normal', 'hard')
   */
  setDifficulty(difficulty) {
    // Validate difficulty
    if (!Object.values(this.difficultyLevels).includes(difficulty.toLowerCase())) {
      console.warn(`Invalid difficulty: ${difficulty}. Using normal.`);
      difficulty = this.difficultyLevels.NORMAL;
    }
    
    this.currentDifficulty = difficulty.toLowerCase();
    
    // Update game state
    this.game.gameState.difficulty = this.currentDifficulty;
    
    // Recalculate multipliers
    this.recalculateMultipliers();
    
    // Update other systems
    this.propagateDifficultySettings();
    
    console.log(`Difficulty set to ${this.currentDifficulty}`);
    return this;
  }
  
  /**
   * Get the current difficulty color
   * @returns {string} The CSS color for the current difficulty
   */
  getDifficultyColor() {
    return this.difficultyColors[this.currentDifficulty] || this.difficultyColors[this.difficultyLevels.NORMAL];
  }
  
  /**
   * Get the difficulty name formatted for display
   * @returns {string} Formatted difficulty name
   */
  getDifficultyDisplayName() {
    // Capitalize first letter
    return this.currentDifficulty.charAt(0).toUpperCase() + this.currentDifficulty.slice(1);
  }
  
  /**
   * Reset performance metrics for dynamic difficulty adjustment
   */
  resetPerformanceMetrics() {
    this.performanceMetrics = {
      damageReceived: 0,
      zombiesKilled: 0,
      headshots: 0,
      timeSurvived: 0,
      lastUpdateTime: performance.now(),
      metricWindow: 60,
      recentDeaths: 0,
      lastResetTime: performance.now()
    };
    
    // Reset to medium performance
    this.playerPerformanceRating = 0.5;
  }
  
  /**
   * Update game systems with current difficulty settings
   */
  propagateDifficultySettings() {
    // Update zombie manager with difficulty settings
    if (this.game.zombieManager) {
      // Set the base difficulty multiplier
      this.game.zombieManager.setDifficulty(this.currentDifficulty);
      
      // Update with more specific multipliers
      this.game.zombieManager.updateDifficultyMultipliers({
        health: this.currentMultipliers.zombieHealth,
        damage: this.currentMultipliers.zombieDamage,
        speed: this.currentMultipliers.zombieSpeed,
        spawnRate: this.currentMultipliers.spawnRate,
        specialZombieChance: this.currentMultipliers.specialZombieChance
      });
    }
    
    // Update score manager
    if (this.game.scoreManager) {
      this.game.scoreManager.setScoreMultiplier(this.currentMultipliers.scoreMultiplier);
    }
    
    // Update UI with difficulty indicator
    if (this.game.uiManager) {
      this.game.uiManager.updateDifficultyIndicator(
        this.getDifficultyDisplayName(),
        this.getDifficultyColor()
      );
    }
  }
  
  /**
   * Calculate difficulty based on current wave
   * @param {number} wave - Current wave number
   */
  updateForWave(wave) {
    // Calculate wave scaling factor (capped at waveScalingCap)
    const effectiveWave = Math.min(wave - 1, this.waveScaling.waveScalingCap);
    
    // Recalculate with wave scaling
    this.recalculateMultipliers(effectiveWave);
    
    // Update other systems
    this.propagateDifficultySettings();
    
    console.log(`Updated difficulty for wave ${wave}`);
  }
  
  /**
   * Record a zombie kill for performance tracking
   * @param {Object} zombie - The killed zombie
   * @param {boolean} isHeadshot - Whether the kill was a headshot
   */
  recordZombieKill(zombie, isHeadshot = false) {
    this.performanceMetrics.zombiesKilled++;
    
    if (isHeadshot) {
      this.performanceMetrics.headshots++;
    }
    
    // Update player performance rating periodically
    this.updatePerformanceRating();
  }
  
  /**
   * Record damage received by player for performance tracking
   * @param {number} amount - Amount of damage received
   */
  recordDamageReceived(amount) {
    this.performanceMetrics.damageReceived += amount;
    
    // Update player performance rating
    this.updatePerformanceRating();
  }
  
  /**
   * Record player death for performance tracking
   */
  recordPlayerDeath() {
    this.performanceMetrics.recentDeaths++;
    
    // Update player performance rating (death has a significant impact)
    this.playerPerformanceRating = Math.max(0.1, this.playerPerformanceRating - 0.2);
    this.updatePerformanceRating();
  }
  
  /**
   * Update the player performance rating based on recent metrics
   */
  updatePerformanceRating() {
    const now = performance.now();
    const deltaTime = (now - this.performanceMetrics.lastUpdateTime) / 1000;
    
    // Only update every second
    if (deltaTime < 1) return;
    
    // Update time survived
    this.performanceMetrics.timeSurvived += deltaTime;
    this.performanceMetrics.lastUpdateTime = now;
    
    // Check if we need to reset the window
    if (now - this.performanceMetrics.lastResetTime > this.performanceMetrics.metricWindow * 1000) {
      // Calculate performance rating based on metrics
      let rating = 0.5; // Start at average
      
      // Factor in kills per minute
      const killsPerMinute = (this.performanceMetrics.zombiesKilled / this.performanceMetrics.timeSurvived) * 60;
      rating += Math.min(0.25, killsPerMinute / 40); // Max bonus at 40 kills per minute
      
      // Factor in headshot ratio
      if (this.performanceMetrics.zombiesKilled > 0) {
        const headshotRatio = this.performanceMetrics.headshots / this.performanceMetrics.zombiesKilled;
        rating += headshotRatio * 0.1; // Up to 0.1 bonus for all headshots
      }
      
      // Factor in damage received per minute
      const damagePerMinute = (this.performanceMetrics.damageReceived / this.performanceMetrics.timeSurvived) * 60;
      rating -= Math.min(0.3, damagePerMinute / 100); // Max penalty at 100 damage per minute
      
      // Factor in deaths heavily
      rating -= this.performanceMetrics.recentDeaths * 0.15;
      
      // Clamp rating between 0 and 1
      rating = Math.max(0, Math.min(1, rating));
      
      // Smooth transition to new rating
      this.playerPerformanceRating = this.playerPerformanceRating * 0.7 + rating * 0.3;
      
      // Reset metrics for next window
      this.resetPerformanceMetrics();
      
      // Recalculate difficulty with new performance rating
      this.recalculateMultipliers();
      
      // Propagate updated settings
      this.propagateDifficultySettings();
    }
  }
  
  /**
   * Recalculate all difficulty multipliers based on current settings
   * @param {number} wave - Current wave number (0-indexed)
   */
  recalculateMultipliers(wave = 0) {
    // Get base multipliers for current difficulty
    const baseMultipliers = this.baseMultipliers[this.currentDifficulty];
    
    // Calculate dynamic adjustment based on player performance
    let dynamicAdjustment = 0;
    if (this.dynamicDifficulty.enabled) {
      // Map performance rating 0-1 to adjustment -max to +max
      // 0.5 (average) = no adjustment
      dynamicAdjustment = (this.playerPerformanceRating - 0.5) * 2 * this.dynamicDifficulty.maxAdjustment;
    }
    
    // Calculate wave scaling
    const waveHealthScale = 1 + (wave * this.waveScaling.healthIncreasePerWave);
    const waveDamageScale = 1 + (wave * this.waveScaling.damageIncreasePerWave);
    const waveSpeedScale = 1 + (wave * this.waveScaling.speedIncreasePerWave);
    const waveSpecialScale = 1 + (wave * this.waveScaling.specialZombieChanceIncreasePerWave);
    
    // Calculate final multipliers
    this.currentMultipliers = {
      zombieHealth: baseMultipliers.zombieHealth * (1 + dynamicAdjustment) * waveHealthScale,
      zombieDamage: baseMultipliers.zombieDamage * (1 + dynamicAdjustment) * waveDamageScale,
      zombieSpeed: baseMultipliers.zombieSpeed * (1 + dynamicAdjustment * 0.5) * waveSpeedScale, // Speed scales less with dynamic difficulty
      spawnRate: baseMultipliers.spawnRate * (1 + dynamicAdjustment * 0.7),
      specialZombieChance: baseMultipliers.specialZombieChance * (1 + dynamicAdjustment * 0.3) * waveSpecialScale,
      scoreMultiplier: baseMultipliers.scoreMultiplier
    };
    
    // Log the current difficulty state
    console.log('Current difficulty multipliers:', {
      difficulty: this.currentDifficulty,
      wave,
      performance: this.playerPerformanceRating.toFixed(2),
      dynamicAdjustment: dynamicAdjustment.toFixed(2),
      multipliers: {
        health: this.currentMultipliers.zombieHealth.toFixed(2),
        damage: this.currentMultipliers.zombieDamage.toFixed(2),
        speed: this.currentMultipliers.zombieSpeed.toFixed(2),
        spawnRate: this.currentMultipliers.spawnRate.toFixed(2),
        specialChance: this.currentMultipliers.specialZombieChance.toFixed(2)
      }
    });
  }
  
  /**
   * Get current multipliers for a specific zombie type
   * @param {string} zombieType - Type of zombie
   * @returns {Object} Multipliers for the zombie type
   */
  getZombieTypeMultipliers(zombieType) {
    // Apply type-specific adjustments on top of base multipliers
    const typeMultipliers = { ...this.currentMultipliers };
    
    // Adjust multipliers based on zombie type
    switch (zombieType) {
      case 'runner':
        typeMultipliers.zombieHealth *= 0.7; // Less health
        typeMultipliers.zombieSpeed *= 1.5; // Much faster
        typeMultipliers.zombieDamage *= 0.8; // Less damage
        break;
        
      case 'brute':
        typeMultipliers.zombieHealth *= 2.5; // Much more health
        typeMultipliers.zombieSpeed *= 0.7; // Slower
        typeMultipliers.zombieDamage *= 1.7; // More damage
        break;
        
      case 'exploder':
        typeMultipliers.zombieHealth *= 1.2; // More health
        typeMultipliers.zombieSpeed *= 0.9; // Slightly slower
        typeMultipliers.zombieDamage *= 2.0; // Much more damage (explosion)
        break;
        
      case 'acid_spitter':
        typeMultipliers.zombieHealth *= 0.9; // Less health
        typeMultipliers.zombieSpeed *= 0.8; // Slower
        typeMultipliers.zombieDamage *= 1.3; // More damage (acid)
        break;
        
      case 'screamer':
        typeMultipliers.zombieHealth *= 0.8; // Less health
        typeMultipliers.zombieSpeed *= 1.1; // Faster
        typeMultipliers.zombieDamage *= 0.7; // Less direct damage (but can alert others)
        break;
        
      // Default 'standard' zombie uses base multipliers
      default:
        break;
    }
    
    return typeMultipliers;
  }
  
  /**
   * Get a weighted random zombie type based on current difficulty
   * @returns {string} The selected zombie type
   */
  getRandomZombieType(wave) {
    // Base chances for each zombie type at normal difficulty
    const baseChances = {
      standard: 60,
      runner: 15,
      brute: 10,
      exploder: 5,
      acid_spitter: 5,
      screamer: 5
    };
    
    // Adjust chances based on wave number and difficulty
    let adjustedChances = { ...baseChances };
    
    // More special zombies in later waves
    const specialZombieBonus = Math.min(40, wave * 2); // Up to 40% reduction in standard zombies
    
    // Reduce standard chance and distribute to specials
    adjustedChances.standard = Math.max(20, adjustedChances.standard - specialZombieBonus);
    
    // Calculate remaining points to distribute
    const pointsToDistribute = specialZombieBonus;
    
    // Define how to distribute special points based on difficulty
    const distribution = {
      [this.difficultyLevels.EASY]: {
        runner: 0.4, // Runners are easier to deal with
        brute: 0.1, // Fewer brutes on easy
        exploder: 0.1,
        acid_spitter: 0.2,
        screamer: 0.2
      },
      [this.difficultyLevels.NORMAL]: {
        runner: 0.3,
        brute: 0.2,
        exploder: 0.2,
        acid_spitter: 0.15,
        screamer: 0.15
      },
      [this.difficultyLevels.HARD]: {
        runner: 0.15, // Fewer runners on hard
        brute: 0.3, // More brutes and exploders on hard
        exploder: 0.25,
        acid_spitter: 0.2,
        screamer: 0.1
      }
    };
    
    // Get distribution for current difficulty
    const currentDistribution = distribution[this.currentDifficulty];
    
    // Distribute points to special zombies
    for (const [type, ratio] of Object.entries(currentDistribution)) {
      adjustedChances[type] += pointsToDistribute * ratio;
    }
    
    // Calculate total for normalization
    const total = Object.values(adjustedChances).reduce((sum, chance) => sum + chance, 0);
    
    // Normalize to probability (0-1)
    const normalizedChances = {};
    let accumulator = 0;
    
    for (const [type, chance] of Object.entries(adjustedChances)) {
      normalizedChances[type] = {
        probability: chance / total,
        range: {
          min: accumulator,
          max: accumulator + (chance / total)
        }
      };
      
      accumulator += chance / total;
    }
    
    // Generate random number between 0 and 1
    const random = Math.random();
    
    // Find the selected type
    for (const [type, data] of Object.entries(normalizedChances)) {
      if (random >= data.range.min && random < data.range.max) {
        return type;
      }
    }
    
    // Fallback to standard
    return 'standard';
  }
  
  /**
   * Get appropriate spawn rate for current difficulty and wave
   * @param {number} wave - Current wave number
   * @returns {number} - Spawn rate in zombies per second
   */
  getSpawnRate(wave) {
    // Base spawn rate increases with wave number
    const baseSpawnRate = 0.5 + (wave * 0.1);
    
    // Apply difficulty multiplier
    return baseSpawnRate * this.currentMultipliers.spawnRate;
  }
  
  /**
   * Get maximum zombies allowed for current difficulty and wave
   * @param {number} wave - Current wave number
   * @returns {number} - Maximum zombies alive at once
   */
  getMaxZombies(wave) {
    // Base max zombies increases with wave number
    const baseMaxZombies = 10 + (wave * 2);
    
    // Adjust by difficulty (more zombies at once on higher difficulties)
    let difficultyMultiplier = 1.0;
    switch (this.currentDifficulty) {
      case this.difficultyLevels.EASY:
        difficultyMultiplier = 0.7;
        break;
      case this.difficultyLevels.HARD:
        difficultyMultiplier = 1.5;
        break;
      default:
        difficultyMultiplier = 1.0;
    }
    
    // Calculate with performance adjustment - better players get more zombies
    const performanceAdjustment = this.dynamicDifficulty.enabled 
      ? (this.playerPerformanceRating - 0.5) * 10 
      : 0;
    
    return Math.floor(
      (baseMaxZombies * difficultyMultiplier) + performanceAdjustment
    );
  }
  
  /**
   * Get the total number of zombies for a wave
   * @param {number} wave - Current wave number
   * @returns {number} - Total number of zombies to spawn in the wave
   */
  getZombiesPerWave(wave) {
    // Base number of zombies per wave
    const baseZombiesPerWave = 10 + (wave * 5);
    
    // Adjust by difficulty
    let difficultyMultiplier = 1.0;
    switch (this.currentDifficulty) {
      case this.difficultyLevels.EASY:
        difficultyMultiplier = 0.7;
        break;
      case this.difficultyLevels.HARD:
        difficultyMultiplier = 1.3;
        break;
      default:
        difficultyMultiplier = 1.0;
    }
    
    // Calculate final amount
    return Math.floor(baseZombiesPerWave * difficultyMultiplier);
  }
  
  /**
   * Update difficulty-related UI elements
   */
  updateUI() {
    if (this.game.uiManager) {
      this.game.uiManager.updateDifficultyIndicator(
        this.getDifficultyDisplayName(),
        this.getDifficultyColor()
      );
    }
  }
  
  /**
   * Dispose of the difficulty manager
   */
  dispose() {
    // Reset any resources or event listeners
    console.log('Disposing DifficultyManager');
  }
} 