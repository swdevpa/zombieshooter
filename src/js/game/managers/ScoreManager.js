/**
 * Manages score tracking, multipliers, and statistics
 */
export class ScoreManager {
  constructor(game) {
    this.game = game;
    
    // Core score properties
    this.currentScore = 0;
    this.highScore = this.loadHighScore();
    
    // Multiplier system
    this.scoreMultiplier = 1.0;
    this.baseMultiplier = 1.0;
    this.multiplierDecayRate = 0.1; // How fast multiplier decays per second
    this.multiplierDecayDelay = 3000; // Milliseconds before multiplier starts decaying
    this.lastScoreTime = 0;
    this.maxMultiplier = 5.0;
    
    // Statistics tracking
    this.stats = {
      zombiesKilled: 0,
      headshots: 0,
      accuracyHits: 0,
      accuracyShots: 0,
      wavesCompleted: 0,
      damageDealt: 0,
      damageTaken: 0,
      ammoUsed: 0,
      killsByWeapon: {},
      killsByZombieType: {},
      highestMultiplier: 1.0,
      totalScore: 0
    };
    
    // Point values
    this.pointValues = {
      standard: 100,  // Standard zombie kill
      runner: 150,    // Runner zombie kill
      brute: 200,     // Brute zombie kill
      exploder: 150,  // Exploder zombie kill
      spitter: 175,   // Acid Spitter zombie kill
      screamer: 175,  // Screamer zombie kill
      headshot: 50,   // Bonus for headshots
      waveBonus: 500, // Base bonus for completing a wave
      bossMultiplier: 2.0, // Boss wave score multiplier
      noHitBonus: 100 // Bonus for completing a wave without taking damage
    };
    
    // Event indicators
    this.pendingScoreEvents = [];
  }
  
  init() {
    // Initialize manager
    console.log('ScoreManager initialized');
    
    // Load high score
    this.highScore = this.loadHighScore();
    return this;
  }
  
  /**
   * Update score multiplier and handle decay
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    // Update multiplier decay
    const currentTime = Date.now();
    if (currentTime - this.lastScoreTime > this.multiplierDecayDelay) {
      this.scoreMultiplier = Math.max(
        this.baseMultiplier,
        this.scoreMultiplier - (this.multiplierDecayRate * deltaTime)
      );
      
      // Update UI with current multiplier
      if (this.game.uiManager) {
        this.game.uiManager.updateScoreMultiplier(this.scoreMultiplier);
      }
    }
    
    // Process any pending score events
    this.processPendingScoreEvents(deltaTime);
  }
  
  /**
   * Add points to player's score
   * @param {number} points - Base points to add
   * @param {string} source - Description of score source
   * @param {object} position - Optional 3D position for visual feedback
   */
  addScore(points, source = 'score', position = null) {
    // Apply current multiplier
    const multipliedPoints = Math.floor(points * this.scoreMultiplier);
    
    // Add to current score
    this.currentScore += multipliedPoints;
    
    // Add to total stats
    this.stats.totalScore += multipliedPoints;
    
    // Reset multiplier decay timer
    this.lastScoreTime = Date.now();
    
    // Update UI
    if (this.game.uiManager) {
      this.game.uiManager.updateScore(this.currentScore);
      
      // Add score popup at position if provided
      if (position) {
        this.addScoreEvent(multipliedPoints, position, source);
      }
    }
    
    // Update high score if needed
    if (this.currentScore > this.highScore) {
      this.highScore = this.currentScore;
      this.saveHighScore();
      
      // Notify UI of new high score
      if (this.game.uiManager) {
        this.game.uiManager.showNewHighScore(this.highScore);
      }
    }
    
    return multipliedPoints;
  }
  
  /**
   * Record a zombie kill and award points
   * @param {Object} zombie - The zombie that was killed
   * @param {boolean} isHeadshot - Whether kill was a headshot
   */
  recordZombieKill(zombie, isHeadshot = false) {
    // Determine base score from zombie type
    const zombieType = zombie.type || 'standard';
    const baseScore = this.pointValues[zombieType] || this.pointValues.standard;
    
    // Add headshot bonus if applicable
    const headshotBonus = isHeadshot ? this.pointValues.headshot : 0;
    
    // Track statistics
    this.stats.zombiesKilled++;
    if (isHeadshot) this.stats.headshots++;
    
    // Track kills by zombie type
    if (!this.stats.killsByZombieType[zombieType]) {
      this.stats.killsByZombieType[zombieType] = 0;
    }
    this.stats.killsByZombieType[zombieType]++;
    
    // Track kills by current weapon
    if (this.game.player && this.game.player.weapon) {
      const weaponType = this.game.player.weapon.type;
      if (!this.stats.killsByWeapon[weaponType]) {
        this.stats.killsByWeapon[weaponType] = 0;
      }
      this.stats.killsByWeapon[weaponType]++;
    }
    
    // Increase multiplier for each kill
    this.increaseMultiplier(0.1);
    
    // Add score with position for visual feedback
    return this.addScore(baseScore + headshotBonus, 
      isHeadshot ? 'headshot' : 'kill', 
      zombie.mesh ? zombie.mesh.position : null);
  }
  
  /**
   * Increase the score multiplier
   * @param {number} amount - Amount to increase multiplier by
   */
  increaseMultiplier(amount) {
    this.scoreMultiplier = Math.min(this.maxMultiplier, this.scoreMultiplier + amount);
    
    // Update highest multiplier stat
    if (this.scoreMultiplier > this.stats.highestMultiplier) {
      this.stats.highestMultiplier = this.scoreMultiplier;
    }
    
    // Update UI
    if (this.game.uiManager) {
      this.game.uiManager.updateScoreMultiplier(this.scoreMultiplier);
    }
  }
  
  /**
   * Award bonus points for completing a wave
   * @param {number} waveNumber - The completed wave number
   * @param {boolean} noHitBonus - Whether to award no-hit bonus
   */
  awardWaveCompletionBonus(waveNumber, noHitBonus = false) {
    // Calculate base wave bonus (increases with wave number)
    const baseBonus = this.pointValues.waveBonus * waveNumber;
    
    // Apply boss wave multiplier if applicable
    const isBossWave = this.game.zombieManager.isBossWave(waveNumber);
    const multiplier = isBossWave ? this.pointValues.bossMultiplier : 1.0;
    
    // Calculate final bonus
    let bonus = baseBonus * multiplier;
    
    // Add no-hit bonus if player didn't take damage during wave
    if (noHitBonus) {
      bonus += this.pointValues.noHitBonus * waveNumber;
    }
    
    // Increase stats
    this.stats.wavesCompleted++;
    
    // Add wave completion bonus to score
    this.addScore(bonus, isBossWave ? 'boss_wave' : 'wave_bonus');
    
    // Show wave bonus message
    if (this.game.uiManager) {
      this.game.uiManager.showBonusMessage(
        isBossWave ? 'BOSS WAVE COMPLETED!' : 'WAVE COMPLETED!',
        `+${bonus} POINTS`
      );
    }
    
    return bonus;
  }
  
  /**
   * Record a weapon shot fired for accuracy tracking
   * @param {boolean} hit - Whether the shot hit a zombie
   */
  recordShot(hit = false) {
    this.stats.accuracyShots++;
    if (hit) {
      this.stats.accuracyHits++;
    }
    this.stats.ammoUsed++;
  }
  
  /**
   * Record damage dealt to zombies
   * @param {number} damage - Amount of damage dealt
   */
  recordDamageDealt(damage) {
    this.stats.damageDealt += damage;
  }
  
  /**
   * Record damage taken by player
   * @param {number} damage - Amount of damage taken
   */
  recordDamageTaken(damage) {
    this.stats.damageTaken += damage;
    
    // Reset multiplier when taking damage
    this.scoreMultiplier = this.baseMultiplier;
    
    // Update UI
    if (this.game.uiManager) {
      this.game.uiManager.updateScoreMultiplier(this.scoreMultiplier);
    }
  }
  
  /**
   * Queue a score event for visual feedback
   * @param {number} points - Points awarded
   * @param {object} position - 3D position for popup
   * @param {string} type - Type of score event
   */
  addScoreEvent(points, position, type = 'score') {
    this.pendingScoreEvents.push({
      points,
      position: position.clone ? position.clone() : { x: position.x, y: position.y, z: position.z },
      type,
      time: 0,
      duration: 2, // Display time in seconds
      active: true
    });
  }
  
  /**
   * Process and display pending score events
   * @param {number} deltaTime - Time since last frame in seconds
   */
  processPendingScoreEvents(deltaTime) {
    // Update event timers
    for (let i = 0; i < this.pendingScoreEvents.length; i++) {
      const event = this.pendingScoreEvents[i];
      
      if (event.active) {
        event.time += deltaTime;
        
        // Calculate event position in screen space
        if (this.game.camera && event.position) {
          // Convert 3D position to screen position
          const screenPosition = this.worldToScreen(event.position);
          
          // Display score popup if in view
          if (screenPosition && this.game.uiManager) {
            this.game.uiManager.showScorePopup(
              event.points, 
              screenPosition.x, 
              screenPosition.y,
              event.type,
              event.time / event.duration
            );
          }
        }
        
        // Deactivate after duration
        if (event.time >= event.duration) {
          event.active = false;
        }
      }
    }
    
    // Remove inactive events
    this.pendingScoreEvents = this.pendingScoreEvents.filter(event => event.active);
  }
  
  /**
   * Convert world position to screen coordinates
   * @param {object} position - World position to convert
   * @returns {object} Screen coordinates {x, y}
   */
  worldToScreen(position) {
    if (!this.game.camera) return null;
    
    const vector = new THREE.Vector3(position.x, position.y, position.z);
    
    // Project 3D position to 2D screen
    vector.project(this.game.camera);
    
    return {
      x: (vector.x * 0.5 + 0.5) * window.innerWidth,
      y: (-vector.y * 0.5 + 0.5) * window.innerHeight
    };
  }
  
  /**
   * Reset score for a new game
   */
  resetScore() {
    this.currentScore = 0;
    this.scoreMultiplier = this.baseMultiplier;
    this.lastScoreTime = 0;
    
    // Reset statistics
    this.stats = {
      zombiesKilled: 0,
      headshots: 0,
      accuracyHits: 0,
      accuracyShots: 0,
      wavesCompleted: 0,
      damageDealt: 0,
      damageTaken: 0,
      ammoUsed: 0,
      killsByWeapon: {},
      killsByZombieType: {},
      highestMultiplier: 1.0,
      totalScore: 0
    };
    
    // Update UI
    if (this.game.uiManager) {
      this.game.uiManager.updateScore(this.currentScore);
      this.game.uiManager.updateScoreMultiplier(this.scoreMultiplier);
    }
  }
  
  /**
   * Get current statistics for display
   * @returns {object} Current statistics for game
   */
  getStats() {
    // Calculate accuracy percentage
    const accuracy = this.stats.accuracyShots > 0 
      ? Math.round((this.stats.accuracyHits / this.stats.accuracyShots) * 100) 
      : 0;
    
    return {
      ...this.stats,
      accuracy,
      currentScore: this.currentScore,
      highScore: this.highScore
    };
  }
  
  /**
   * Save high score to local storage
   */
  saveHighScore() {
    try {
      localStorage.setItem('zombieShooterHighScore', this.highScore.toString());
    } catch (e) {
      console.error('Unable to save high score to localStorage', e);
    }
  }
  
  /**
   * Load high score from local storage
   * @returns {number} High score or 0 if not found
   */
  loadHighScore() {
    try {
      const savedScore = localStorage.getItem('zombieShooterHighScore');
      return savedScore ? parseInt(savedScore, 10) : 0;
    } catch (e) {
      console.error('Unable to load high score from localStorage', e);
      return 0;
    }
  }
} 