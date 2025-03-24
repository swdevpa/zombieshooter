export class UI {
  constructor(game) {
    this.game = game;

    // UI elements
    this.scoreElement = document.getElementById('score');
    this.waveElement = document.getElementById('wave');
    this.multiplierElement = document.getElementById('score-multiplier');
    this.highScoreElement = document.getElementById('high-score');

    // Health UI elements
    this.healthContainer = document.getElementById('health-container');
    this.healthBar = document.getElementById('health-bar');
    this.healthText = document.getElementById('health-text');
    
    // Create health icon if needed
    this.createHealthIcon();

    // Ammo UI elements
    this.ammoContainer = document.getElementById('ammo-container');
    this.ammoValueElement = document.getElementById('ammo-value');
    this.ammoMaxElement = document.getElementById('ammo-max');
    this.reloadIndicator = document.getElementById('reload-indicator');
    this.ammoReserveElement = document.getElementById('ammo-reserve');

    this.gameOverElement = document.getElementById('game-over');
    this.finalScoreElement = document.getElementById('final-score');
    this.crosshairElement = document.getElementById('crosshair');
    
    // FPS counter element
    this.fpsElement = document.getElementById('fps-counter');
    
    // Hit marker elements
    this.hitMarkerContainer = document.getElementById('hit-marker-container');
    if (!this.hitMarkerContainer) {
      this.createHitMarkerElements();
    }
    
    // Settings menu elements
    this.settingsContainer = document.getElementById('settings-menu');
    this.sensitivitySlider = document.getElementById('sensitivity-slider');
    this.sensitivityValue = document.getElementById('sensitivity-value');
    this.invertYCheckbox = document.getElementById('invert-y-checkbox');
    this.enableSmoothingCheckbox = document.getElementById('enable-smoothing-checkbox');
    this.smoothingSlider = document.getElementById('smoothing-slider');
    
    // Create settings UI elements if they don't exist
    this.createSettingsUI();
    
    // Create main menu UI elements if they don't exist
    this.createMainMenuUI();

    // Default max values (will be updated from player when it's available)
    this.defaultMaxHealth = 100;
    this.defaultMaxAmmo = 30;

    // Initialize UI with safe default values
    this.updateScore(0);
    this.updateHighScore(0);
    this.updateScoreMultiplier(1.0);
    this.updateWave(1);
    this.updateHealth(100);
    this.updateAmmo(30, 30);
    this.showCrosshair(true);
    
    // Initialize settings
    this.initializeSettings();
    
    // Score popup container
    this.scorePopupContainer = document.getElementById('score-popup-container');
    if (!this.scorePopupContainer) {
      this.createScorePopupContainer();
    }
  }

  // Update-Methode, die im Game-Loop aufgerufen wird
  update(deltaTime) {
    // Aktualisiere UI-Elemente, die kontinuierlich aktualisiert werden müssen
    if (this.game.player) {
      // Aktualisiere Gesundheit und Munition basierend auf Spielerdaten
      this.updateHealth(this.game.player.health);

      if (this.game.player.weapon) {
        this.updateAmmo(this.game.player.weapon.currentAmmo, this.game.player.weapon.maxAmmo);
      }
    }

    // Aktualisiere Score und Highscore basierend auf ScoreManager
    if (this.game.scoreManager) {
      this.updateScore(this.game.scoreManager.currentScore);
      this.updateHighScore(this.game.scoreManager.highScore);
      this.updateScoreMultiplier(this.game.scoreManager.scoreMultiplier);
    }

    // Aktualisiere Welle basierend auf ZombieManager
    if (this.game.zombieManager) {
      this.updateWave(this.game.zombieManager.currentWave);
    }

    // Andere UI-Updates könnten hier hinzugefügt werden
  }

  updateScore(score) {
    if (this.scoreElement) {
      // Animate score change
      this.scoreElement.classList.remove('score-pulse');
      void this.scoreElement.offsetWidth; // Trigger reflow
      this.scoreElement.classList.add('score-pulse');
      
      this.scoreElement.textContent = `Score: ${score}`;
    }
  }

  updateHighScore(score) {
    if (this.highScoreElement) {
      this.highScoreElement.textContent = `High Score: ${score}`;
    }
  }
  
  /**
   * Show that a new high score was achieved
   * @param {number} score - The new high score
   */
  showNewHighScore(score) {
    // Update high score display
    this.updateHighScore(score);
    
    // Create and show high score notification
    const notification = document.createElement('div');
    notification.className = 'new-high-score-notification';
    notification.textContent = 'NEW HIGH SCORE!';
    document.body.appendChild(notification);
    
    // Add notification styles if they don't exist
    let style = document.getElementById('high-score-notification-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'high-score-notification-style';
      style.textContent = `
        .new-high-score-notification {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: rgba(0, 0, 0, 0.7);
          color: #ffcc00;
          font-family: 'Arial', sans-serif;
          font-size: 36px;
          font-weight: bold;
          padding: 20px 40px;
          border-radius: 10px;
          border: 2px solid #ffcc00;
          z-index: 1000;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          animation: highScoreNotification 2s ease-in-out forwards;
        }
        @keyframes highScoreNotification {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          30% { transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Remove notification after animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 2000);
  }
  
  /**
   * Update score multiplier display
   * @param {number} multiplier - Current score multiplier
   */
  updateScoreMultiplier(multiplier) {
    if (this.multiplierElement) {
      // Format multiplier to 1 decimal place
      const formattedMultiplier = multiplier.toFixed(1);
      this.multiplierElement.textContent = `x${formattedMultiplier}`;
      
      // Change color based on multiplier value
      if (multiplier >= 4.0) {
        this.multiplierElement.style.color = '#ff3366'; // Red for high multiplier
        this.multiplierElement.style.fontSize = '22px';
      } else if (multiplier >= 3.0) {
        this.multiplierElement.style.color = '#ff9900'; // Orange
        this.multiplierElement.style.fontSize = '20px';
      } else if (multiplier >= 2.0) {
        this.multiplierElement.style.color = '#ffcc00'; // Yellow
        this.multiplierElement.style.fontSize = '19px';
      } else {
        this.multiplierElement.style.color = '#aaaaaa'; // Gray for base multiplier
        this.multiplierElement.style.fontSize = '18px';
      }
    }
  }
  
  /**
   * Show score popup at specific screen position
   * @param {number} points - Points to display
   * @param {number} x - Screen X position
   * @param {number} y - Screen Y position
   * @param {string} type - Type of score event (kill, headshot, etc.)
   * @param {number} progress - Animation progress (0-1)
   */
  showScorePopup(points, x, y, type = 'kill', progress = 0) {
    if (!this.scorePopupContainer) return;
    
    // Create popup element if it doesn't exist
    const popupId = `score-popup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let popup = document.getElementById(popupId);
    
    if (!popup) {
      popup = document.createElement('div');
      popup.id = popupId;
      popup.className = `score-popup ${type}`;
      
      // Determine text content based on type
      if (type === 'headshot') {
        popup.textContent = `+${points} HEADSHOT!`;
      } else if (type === 'wave_bonus') {
        popup.textContent = `+${points} WAVE BONUS!`;
      } else if (type === 'boss_wave') {
        popup.textContent = `+${points} BOSS WAVE BONUS!`;
      } else {
        popup.textContent = `+${points}`;
      }
      
      // Position popup
      popup.style.left = `${x}px`;
      popup.style.top = `${y}px`;
      
      // Add to container
      this.scorePopupContainer.appendChild(popup);
      
      // Remove after animation completes
      setTimeout(() => {
        if (popup.parentNode) {
          popup.parentNode.removeChild(popup);
        }
      }, 2000);
    }
  }
  
  /**
   * Show bonus message in center of screen
   * @param {string} message - Main message text
   * @param {string} details - Additional details
   */
  showBonusMessage(message, details) {
    // Create message container if it doesn't exist
    let bonusContainer = document.getElementById('bonus-message-container');
    
    if (!bonusContainer) {
      bonusContainer = document.createElement('div');
      bonusContainer.id = 'bonus-message-container';
      bonusContainer.className = 'bonus-message-container';
      document.body.appendChild(bonusContainer);
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .bonus-message-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          pointer-events: none;
        }
        .bonus-message {
          font-family: 'Arial', sans-serif;
          font-size: 48px;
          font-weight: bold;
          color: #ffcc00;
          text-shadow: 3px 3px 5px rgba(0, 0, 0, 0.7);
          text-align: center;
          white-space: nowrap;
        }
        .bonus-details {
          font-family: 'Arial', sans-serif;
          font-size: 32px;
          color: white;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
          margin-top: 10px;
          text-align: center;
        }
        .fade-in-out {
          animation: fadeInOut 2.5s ease-in-out forwards;
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; transform: scale(1.1); }
          30% { transform: scale(1); }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Clear existing messages
    bonusContainer.innerHTML = '';
    
    // Create message elements
    const messageElement = document.createElement('div');
    messageElement.className = 'bonus-message fade-in-out';
    messageElement.textContent = message;
    bonusContainer.appendChild(messageElement);
    
    if (details) {
      const detailsElement = document.createElement('div');
      detailsElement.className = 'bonus-details fade-in-out';
      detailsElement.textContent = details;
      bonusContainer.appendChild(detailsElement);
    }
    
    // Remove after animation
    setTimeout(() => {
      if (bonusContainer.parentNode) {
        bonusContainer.innerHTML = '';
      }
    }, 2500);
  }

  updateWave(wave) {
    if (this.waveElement) {
      this.waveElement.textContent = `Wave: ${wave}`;
    } else {
      // Create wave element if it doesn't exist
      this.waveElement = document.createElement('div');
      this.waveElement.id = 'wave';
      this.waveElement.className = 'wave-indicator';
      this.waveElement.textContent = `Wave: ${wave}`;
      document.body.appendChild(this.waveElement);
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .wave-indicator {
          position: absolute;
          bottom: 50px;
          right: 10px;
          font-family: 'Arial', sans-serif;
          font-size: 20px;
          font-weight: bold;
          color: white;
          text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
          z-index: 100;
        }
      `;
      document.head.appendChild(style);
    }
  }

  updateHealth(health) {
    // Get max health value safely
    const maxHealth = this.game.player?.maxHealth || this.defaultMaxHealth;
    
    // Health bar percentage
    const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));

    // Update health bar width
    if (this.healthBar) {
      this.healthBar.style.width = `${healthPercent}%`;

      // Change color based on health
      if (healthPercent > 60) {
        this.healthBar.style.backgroundColor = '#33cc33'; // Green
      } else if (healthPercent > 30) {
        this.healthBar.style.backgroundColor = '#ffcc00'; // Yellow
      } else {
        this.healthBar.style.backgroundColor = '#ff3333'; // Red
        
        // Add critical class for low health
        if (this.healthContainer) {
          this.healthContainer.classList.add('critical');
        }
      }
      
      // Remove critical class if health recovers
      if (healthPercent > 30 && this.healthContainer) {
        this.healthContainer.classList.remove('critical');
      }
    }

    // Update health text
    if (this.healthText) {
      this.healthText.textContent = Math.ceil(health);
      
      // Change text color based on health
      if (healthPercent <= 30) {
        this.healthText.style.color = '#ff3333'; // Red text for critical health
      } else {
        this.healthText.style.color = '#ffffff'; // White text for normal health
      }
    }

    // Add damage effect when taking damage
    if (this.lastHealth && health < this.lastHealth) {
      this.pulseDamageEffect();
    }
    
    // Add healing effect when gaining health
    if (this.lastHealth && health > this.lastHealth) {
      this.pulseHealingEffect();
    }

    // Store last health for comparison
    this.lastHealth = health;
  }

  pulseDamageEffect() {
    if (this.healthContainer) {
      // Add pulse and damage classes
      this.healthContainer.classList.add('pulse');
      this.healthContainer.classList.add('damage');
      
      // Remove classes after animation completes
      setTimeout(() => {
        this.healthContainer.classList.remove('pulse');
        this.healthContainer.classList.remove('damage');
      }, 300);
    }
  }
  
  pulseHealingEffect() {
    if (this.healthBar) {
      // Add healing class
      this.healthBar.classList.add('healing');
      
      // Remove healing class after animation completes
      setTimeout(() => {
        this.healthBar.classList.remove('healing');
      }, 300);
    }
  }

  /**
   * Update ammo display
   * @param {number} current - Current ammo in magazine
   * @param {number} max - Maximum ammo capacity
   * @param {number} reserve - Reserve ammo count
   */
  updateAmmo(current, max, reserve = 0) {
    // Make sure all elements exist
    if (!this.ammoValueElement || !this.ammoMaxElement || !this.ammoReserveElement) {
      return;
    }
    
    // Update main ammo counter
    this.ammoValueElement.textContent = current;
    this.ammoMaxElement.textContent = `/ ${max}`;
    
    // Update reserve ammo
    this.ammoReserveElement.textContent = reserve;
    
    // Apply visual effects based on ammo status
    if (this.ammoContainer) {
      // Clear existing classes
      this.ammoContainer.classList.remove('low-ammo', 'no-ammo', 'no-reserves');
      
      // Apply appropriate classes based on ammo state
      if (current === 0) {
        this.ammoContainer.classList.add('no-ammo');
        this.showNoAmmoIndicator();
      } else {
        this.hideNoAmmoIndicator();
        
        // Low ammo warning (25% or less)
        if (current <= Math.ceil(max * 0.25)) {
          this.ammoContainer.classList.add('low-ammo');
          
          // Pulse the ammo counter more intensely as ammo gets lower
          const intensity = 1 - (current / (max * 0.25));
          this.pulseAmmoWarning(intensity);
        }
      }
      
      // Show empty reserves warning
      if (reserve <= 0 && current < max) {
        this.ammoContainer.classList.add('no-reserves');
      }
      
      // Apply color based on ammo state
      this.colorizeAmmoCounter(current, max);
    }
    
    // Show reload indicator when empty magazine but has reserve ammo
    if (current === 0 && reserve > 0) {
      this.showReloadIndicator();
    } else if (current > 0) {
      this.hideReloadIndicator();
    }
    
    // Store previous values for animation effects
    if (this.prevAmmo !== undefined && current > this.prevAmmo) {
      this.animateAmmoIncrease();
    }
    this.prevAmmo = current;
  }
  
  /**
   * Apply color to ammo counter based on amount
   * @param {number} current - Current ammo
   * @param {number} max - Maximum ammo
   */
  colorizeAmmoCounter(current, max) {
    if (!this.ammoValueElement) return;
    
    // Calculate percentage
    const percentage = current / max;
    
    if (percentage <= 0.25) {
      // Red for low ammo
      this.ammoValueElement.style.color = '#ff3333';
    } else if (percentage <= 0.5) {
      // Orange for medium ammo
      this.ammoValueElement.style.color = '#ffaa33';
    } else {
      // White for healthy ammo
      this.ammoValueElement.style.color = '#ffffff';
    }
  }
  
  /**
   * Apply pulse warning effect to ammo counter
   * @param {number} intensity - Intensity of the effect (0-1)
   */
  pulseAmmoWarning(intensity) {
    if (!this.ammoValueElement) return;
    
    // Scale the text slightly to create a pulse effect
    const scale = 1 + (0.1 * intensity);
    this.ammoValueElement.style.transform = `scale(${scale})`;
    
    // Reset after a short delay
    setTimeout(() => {
      if (this.ammoValueElement) {
        this.ammoValueElement.style.transform = 'scale(1)';
      }
    }, 200);
  }
  
  /**
   * Animate ammo increase (e.g., when picking up ammo)
   */
  animateAmmoIncrease() {
    if (!this.ammoContainer) return;
    
    // Add temporary class for increase animation
    this.ammoContainer.classList.add('ammo-increased');
    
    // Add a small flash effect
    const flashElement = document.createElement('div');
    flashElement.className = 'ammo-flash';
    this.ammoContainer.appendChild(flashElement);
    
    // Remove after animation completes
    setTimeout(() => {
      this.ammoContainer.classList.remove('ammo-increased');
      if (flashElement && flashElement.parentNode) {
        flashElement.parentNode.removeChild(flashElement);
      }
    }, 500);
  }

  showGameOver(score) {
    this.gameOverElement.style.display = 'flex';
    this.finalScoreElement.textContent = score;
    
    // Play game over sound
    this.playUISound('ui_menu_open');
  }

  hideGameOver() {
    this.gameOverElement.style.display = 'none';
    
    // Play UI close sound
    this.playUISound('ui_menu_close');
  }

  updatePause(isPaused) {
    if (isPaused) {
      document.getElementById('pause-indicator').style.display = 'flex';
      
      // Play pause sound
      this.playUISound('ui_pause');
    } else {
      document.getElementById('pause-indicator').style.display = 'none';
      
      // Play unpause sound (same as pause)
      this.playUISound('ui_pause');
    }
  }

  showWaveMessage(waveNumber, subtitle) {
    // Create wave announcement if it doesn't exist
    let waveAnnouncement = document.getElementById('wave-announcement');
    if (!waveAnnouncement) {
      waveAnnouncement = document.createElement('div');
      waveAnnouncement.id = 'wave-announcement';
      document.body.appendChild(waveAnnouncement);
      
      // Add styles if needed
      const style = document.createElement('style');
      style.textContent = `
        #wave-announcement {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-family: 'Arial', sans-serif;
          text-align: center;
          z-index: 1000;
          pointer-events: none;
          opacity: 0;
        }
        #wave-announcement.show {
          animation: waveAnnounce 5s ease-in-out forwards;
        }
        .wave-title {
          font-size: 64px;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(255, 68, 68, 0.8), 0 0 20px rgba(255, 68, 68, 0.5);
          margin-bottom: 10px;
        }
        .wave-subtitle {
          font-size: 32px;
          text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
        }
        @keyframes waveAnnounce {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          20% { transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Create the content
    waveAnnouncement.innerHTML = `
      <div class="wave-title">WAVE ${waveNumber}</div>
      ${subtitle ? `<div class="wave-subtitle">${subtitle}</div>` : ''}
    `;
    
    // Add show class to trigger animation
    waveAnnouncement.classList.remove('show');
    void waveAnnouncement.offsetWidth; // Trigger reflow
    waveAnnouncement.classList.add('show');
    
    // Update wave indicator
    this.updateWave(waveNumber);
    
    // Play wave announcement sound
    this.playUISound('ui_wave_start');
  }

  /**
   * Show boss wave message with special styling
   * @param {number} waveNumber - The wave number
   * @param {string} subtitle - Optional subtitle
   */
  showBossWave(waveNumber, subtitle) {
    // Create a boss wave message element if it doesn't exist
    let bossWaveElement = document.getElementById('boss-wave-message');
    
    if (!bossWaveElement) {
      bossWaveElement = document.createElement('div');
      bossWaveElement.id = 'boss-wave-message';
      document.body.appendChild(bossWaveElement);
      
      // Add special styling for boss waves
      const style = document.createElement('style');
      style.textContent = `
        #boss-wave-message {
          position: fixed;
          top: 30%;
          left: 0;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          font-family: 'Impact', sans-serif;
          font-size: 48px;
          color: #ff0000;
          text-shadow: 0 0 10px #ff0000, 0 0 20px #ff0000;
          text-align: center;
          opacity: 0;
          transform: scale(0.5);
          transition: opacity 0.5s, transform 0.5s;
        }
        
        #boss-wave-message.show {
          opacity: 1;
          transform: scale(1);
        }
        
        #boss-wave-message .subtitle {
          font-size: 24px;
          margin-top: 10px;
          color: #ffffff;
          text-shadow: 0 0 5px #ff0000;
        }
        
        #boss-wave-message .warning {
          font-size: 32px;
          margin-top: 20px;
          color: #ffff00;
          text-shadow: 0 0 8px #ff4400;
          animation: pulse 1s infinite alternate;
        }
        
        @keyframes pulse {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Set the boss wave message
    bossWaveElement.innerHTML = `
      <div>BOSS WAVE ${waveNumber}</div>
      ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
      <div class="warning">PREPARE FOR BATTLE!</div>
    `;
    bossWaveElement.style.display = 'flex';
    
    // Animate the boss wave message
    bossWaveElement.classList.add('show');
    
    // Play boss wave sound if available
    if (this.game.soundManager) {
      this.game.soundManager.playSound('boss_wave');
    }
    
    // Hide the boss wave message after a longer delay (boss waves are special)
    setTimeout(() => {
      bossWaveElement.classList.remove('show');
      setTimeout(() => {
        bossWaveElement.style.display = 'none';
      }, 1000); // Animation duration
    }, 5000); // Display duration
    
    // Play boss wave announcement sound
    this.playUISound('ui_wave_start');
  }

  /**
   * Show game completion screen with statistics
   * @param {object} waveStats - Statistics for all completed waves
   */
  showGameComplete(waveStats) {
    // Create the game complete overlay if it doesn't exist
    let gameCompleteElement = document.getElementById('game-complete');
    
    if (!gameCompleteElement) {
      gameCompleteElement = document.createElement('div');
      gameCompleteElement.id = 'game-complete';
      document.body.appendChild(gameCompleteElement);
      
      // Add styling for game complete screen
      const style = document.createElement('style');
      style.textContent = `
        #game-complete {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          font-family: 'Arial', sans-serif;
          color: #ffffff;
          opacity: 0;
          transition: opacity 1s;
        }
        
        #game-complete.show {
          opacity: 1;
        }
        
        #game-complete h1 {
          font-size: 64px;
          color: #ffcc00;
          text-shadow: 0 0 10px #ff9900;
          margin-bottom: 30px;
        }
        
        #game-complete h2 {
          font-size: 36px;
          color: #ffffff;
          margin-bottom: 20px;
        }
        
        #game-complete .stats {
          margin-top: 40px;
          background-color: rgba(0, 0, 0, 0.5);
          padding: 20px;
          border-radius: 10px;
          width: 80%;
          max-width: 800px;
        }
        
        #game-complete .stats-title {
          font-size: 28px;
          margin-bottom: 15px;
          color: #ffcc00;
        }
        
        #game-complete .stat-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 18px;
        }
        
        #game-complete .button {
          margin-top: 40px;
          padding: 15px 30px;
          background-color: #ff9900;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 24px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        #game-complete .button:hover {
          background-color: #ffcc00;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Calculate total stats
    let totalZombiesKilled = 0;
    let totalZombiesSpawned = 0;
    let totalTimePlayed = 0;
    
    Object.values(waveStats).forEach(waveStat => {
      totalZombiesKilled += waveStat.zombiesKilled || 0;
      totalZombiesSpawned += waveStat.zombiesSpawned || 0;
      totalTimePlayed += waveStat.timeTaken || 0;
    });
    
    // Format time played
    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    
    // Get player score
    const playerScore = this.game.player ? this.game.player.score : 0;
    
    // Set the game complete content
    gameCompleteElement.innerHTML = `
      <h1>VICTORY!</h1>
      <h2>All Waves Completed</h2>
      
      <div class="stats">
        <div class="stats-title">Final Statistics</div>
        
        <div class="stat-item">
          <span>Total Score:</span>
          <span>${playerScore}</span>
        </div>
        
        <div class="stat-item">
          <span>Zombies Killed:</span>
          <span>${totalZombiesKilled} / ${totalZombiesSpawned}</span>
        </div>
        
        <div class="stat-item">
          <span>Accuracy:</span>
          <span>${Math.round((totalZombiesKilled / totalZombiesSpawned) * 100)}%</span>
        </div>
        
        <div class="stat-item">
          <span>Total Time Played:</span>
          <span>${formatTime(totalTimePlayed)}</span>
        </div>
        
        <div class="stat-item">
          <span>Waves Completed:</span>
          <span>${Object.keys(waveStats).length}</span>
        </div>
      </div>
      
      <button class="button" id="restart-game">Play Again</button>
    `;
    
    // Add click handler for restart button
    const restartButton = document.getElementById('restart-game');
    if (restartButton) {
      restartButton.addEventListener('click', () => {
        // Hide the game complete screen
        gameCompleteElement.classList.remove('show');
        
        // Reset the game
        setTimeout(() => {
          gameCompleteElement.style.display = 'none';
          
          // Restart the game
          if (this.game.restart) {
            this.game.restart();
          }
        }, 1000);
      });
    }
    
    // Show the game complete screen
    gameCompleteElement.style.display = 'flex';
    gameCompleteElement.classList.add('show');
    
    // Play victory sound if available
    if (this.game.soundManager) {
      this.game.soundManager.playSound('victory');
    }
    
    // Play victory sound
    this.playUISound('ui_achievement');
  }

  showCrosshair(show) {
    if (this.crosshairElement) {
      this.crosshairElement.style.display = show ? 'block' : 'none';
    }
  }

  animateCrosshair() {
    if (this.crosshairElement) {
      // Add animation class
      this.crosshairElement.classList.add('animate');
      
      // Remove class after animation completes
      setTimeout(() => {
        this.crosshairElement.classList.remove('animate');
      }, 100);
    }
  }
  
  // Create the settings UI elements if they don't exist
  createSettingsUI() {
    // Create settings container if it doesn't exist
    if (!this.settingsContainer) {
      this.settingsContainer = document.createElement('div');
      this.settingsContainer.id = 'settings-menu';
      this.settingsContainer.className = 'settings-menu hidden';
      document.body.appendChild(this.settingsContainer);
      
      // Create settings content
      const settingsContent = document.createElement('div');
      settingsContent.className = 'settings-content';
      this.settingsContainer.appendChild(settingsContent);
      
      // Title
      const title = document.createElement('h2');
      title.textContent = 'Settings';
      settingsContent.appendChild(title);
      
      // Mouse sensitivity section
      const sensitivitySection = document.createElement('div');
      sensitivitySection.className = 'settings-section';
      
      const sensitivityLabel = document.createElement('label');
      sensitivityLabel.textContent = 'Mouse Sensitivity: ';
      sensitivitySection.appendChild(sensitivityLabel);
      
      this.sensitivityValue = document.createElement('span');
      this.sensitivityValue.id = 'sensitivity-value';
      this.sensitivityValue.textContent = '1.0';
      sensitivityLabel.appendChild(this.sensitivityValue);
      
      this.sensitivitySlider = document.createElement('input');
      this.sensitivitySlider.id = 'sensitivity-slider';
      this.sensitivitySlider.type = 'range';
      this.sensitivitySlider.min = '0.1';
      this.sensitivitySlider.max = '5.0';
      this.sensitivitySlider.step = '0.1';
      this.sensitivitySlider.value = '1.0';
      sensitivitySection.appendChild(this.sensitivitySlider);
      
      settingsContent.appendChild(sensitivitySection);
      
      // Invert Y checkbox
      const invertYSection = document.createElement('div');
      invertYSection.className = 'settings-section';
      
      this.invertYCheckbox = document.createElement('input');
      this.invertYCheckbox.id = 'invert-y-checkbox';
      this.invertYCheckbox.type = 'checkbox';
      invertYSection.appendChild(this.invertYCheckbox);
      
      const invertYLabel = document.createElement('label');
      invertYLabel.htmlFor = 'invert-y-checkbox';
      invertYLabel.textContent = 'Invert Y-Axis';
      invertYSection.appendChild(invertYLabel);
      
      settingsContent.appendChild(invertYSection);
      
      // Mouse smoothing section
      const smoothingSection = document.createElement('div');
      smoothingSection.className = 'settings-section';
      
      this.enableSmoothingCheckbox = document.createElement('input');
      this.enableSmoothingCheckbox.id = 'enable-smoothing-checkbox';
      this.enableSmoothingCheckbox.type = 'checkbox';
      this.enableSmoothingCheckbox.checked = true;
      smoothingSection.appendChild(this.enableSmoothingCheckbox);
      
      const smoothingLabel = document.createElement('label');
      smoothingLabel.htmlFor = 'enable-smoothing-checkbox';
      smoothingLabel.textContent = 'Enable Mouse Smoothing';
      smoothingSection.appendChild(smoothingLabel);
      
      const smoothingSliderLabel = document.createElement('label');
      smoothingSliderLabel.textContent = 'Smoothing Amount: ';
      smoothingSection.appendChild(document.createElement('br'));
      smoothingSection.appendChild(smoothingSliderLabel);
      
      this.smoothingSlider = document.createElement('input');
      this.smoothingSlider.id = 'smoothing-slider';
      this.smoothingSlider.type = 'range';
      this.smoothingSlider.min = '0';
      this.smoothingSlider.max = '0.95';
      this.smoothingSlider.step = '0.05';
      this.smoothingSlider.value = '0.85';
      smoothingSection.appendChild(this.smoothingSlider);
      
      settingsContent.appendChild(smoothingSection);
      
      // Close button
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.className = 'settings-close-btn';
      closeButton.onclick = () => this.hideSettingsMenu();
      settingsContent.appendChild(closeButton);
      
      // Apply styles
      const style = document.createElement('style');
      style.textContent = `
        .settings-menu {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .settings-menu.hidden {
          display: none;
        }
        .settings-content {
          background-color: #222;
          color: #fff;
          padding: 20px;
          border-radius: 5px;
          min-width: 300px;
        }
        .settings-section {
          margin-bottom: 15px;
        }
        .settings-section input[type="range"] {
          width: 100%;
          margin-top: 5px;
        }
        .settings-close-btn {
          margin-top: 15px;
          padding: 8px 16px;
          background-color: #555;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }
        .settings-close-btn:hover {
          background-color: #777;
        }
        #fps-counter {
          position: absolute;
          top: 10px;
          right: 10px;
          color: white;
          font-family: monospace;
          background-color: rgba(0, 0, 0, 0.5);
          padding: 5px;
          border-radius: 3px;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Create FPS counter if it doesn't exist
    if (!this.fpsElement) {
      this.fpsElement = document.createElement('div');
      this.fpsElement.id = 'fps-counter';
      this.fpsElement.textContent = 'FPS: 0';
      document.body.appendChild(this.fpsElement);
    }
    
    // Add performance settings section
    if (!document.getElementById('performance-settings')) {
      const settingsContainer = document.getElementById('settings-menu') || this.createSettingsContainer();
      
      // Create performance settings section
      const performanceSection = document.createElement('div');
      performanceSection.id = 'performance-settings';
      performanceSection.className = 'settings-section';
      
      performanceSection.innerHTML = `
        <h3>Performance Settings</h3>
        <div class="settings-row">
          <label for="quality-dropdown">Quality Preset:</label>
          <select id="quality-dropdown">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="ultra">Ultra</option>
          </select>
        </div>
        <div class="settings-row">
          <label for="adaptive-quality-checkbox">Adaptive Quality:</label>
          <input type="checkbox" id="adaptive-quality-checkbox" checked>
        </div>
        <div class="settings-row">
          <button id="run-benchmark-button" class="settings-button">Run Benchmark</button>
        </div>
        <div class="benchmark-info" id="benchmark-info" style="display: none;">
          <p>Benchmarking in progress... <span id="benchmark-progress">0%</span></p>
        </div>
      `;
      
      settingsContainer.appendChild(performanceSection);
      
      // Add event listeners for performance settings
      const qualityDropdown = document.getElementById('quality-dropdown');
      if (qualityDropdown) {
        qualityDropdown.value = this.game.settings.qualityLevel;
        qualityDropdown.addEventListener('change', () => {
          this.game.settings.qualityLevel = qualityDropdown.value;
          this.game.applyQualitySettings();
        });
      }
      
      const adaptiveQualityCheckbox = document.getElementById('adaptive-quality-checkbox');
      if (adaptiveQualityCheckbox) {
        adaptiveQualityCheckbox.checked = this.game.settings.adaptiveQuality;
        adaptiveQualityCheckbox.addEventListener('change', () => {
          this.game.settings.adaptiveQuality = adaptiveQualityCheckbox.checked;
        });
      }
      
      const runBenchmarkButton = document.getElementById('run-benchmark-button');
      if (runBenchmarkButton) {
        runBenchmarkButton.addEventListener('click', () => {
          if (this.game.performanceOptimizer) {
            // Show benchmark info
            const benchmarkInfo = document.getElementById('benchmark-info');
            if (benchmarkInfo) {
              benchmarkInfo.style.display = 'block';
            }
            
            // Run benchmark and hide info when done
            this.game.performanceOptimizer.runBenchmark().then(() => {
              if (benchmarkInfo) {
                benchmarkInfo.style.display = 'none';
              }
              
              // Update quality dropdown to match recommended settings
              if (qualityDropdown) {
                qualityDropdown.value = this.game.settings.qualityLevel;
              }
            });
          }
        });
      }
    }
  }
  
  // Initialize settings event handlers
  initializeSettings() {
    if (this.sensitivitySlider) {
      this.sensitivitySlider.addEventListener('input', () => {
        const value = parseFloat(this.sensitivitySlider.value);
        this.game.setMouseSensitivity(value);
        this.updateSettings();
      });
    }
    
    if (this.invertYCheckbox) {
      this.invertYCheckbox.addEventListener('change', () => {
        this.game.toggleMouseYInversion();
        this.updateSettings();
      });
    }
    
    if (this.enableSmoothingCheckbox) {
      this.enableSmoothingCheckbox.addEventListener('change', () => {
        const value = this.enableSmoothingCheckbox.checked;
        const factor = parseFloat(this.smoothingSlider.value);
        this.game.setMouseSmoothing(value, factor);
        this.updateSettings();
      });
    }
    
    if (this.smoothingSlider) {
      this.smoothingSlider.addEventListener('input', () => {
        const enabled = this.enableSmoothingCheckbox.checked;
        const factor = parseFloat(this.smoothingSlider.value);
        this.game.setMouseSmoothing(enabled, factor);
        this.updateSettings();
      });
    }
    
    // Add keyboard shortcut for settings menu
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab' && event.altKey) {
        event.preventDefault(); // Prevent default Tab behavior
        this.toggleSettingsMenu();
      }
    });
    
    // Set performance settings
    const qualityDropdown = document.getElementById('quality-dropdown');
    if (qualityDropdown) {
      qualityDropdown.value = this.game.settings.qualityLevel;
    }
    
    const adaptiveQualityCheckbox = document.getElementById('adaptive-quality-checkbox');
    if (adaptiveQualityCheckbox) {
      adaptiveQualityCheckbox.checked = this.game.settings.adaptiveQuality;
    }
  }
  
  // Update settings UI based on game state
  updateSettings() {
    if (this.game.mouseLook && this.sensitivityValue) {
      this.sensitivityValue.textContent = this.game.mouseLook.sensitivityMultiplier.toFixed(1);
      
      if (this.sensitivitySlider) {
        this.sensitivitySlider.value = this.game.mouseLook.sensitivityMultiplier;
      }
      
      if (this.invertYCheckbox) {
        this.invertYCheckbox.checked = this.game.mouseLook.inverseLookY;
      }
      
      if (this.enableSmoothingCheckbox) {
        this.enableSmoothingCheckbox.checked = this.game.mouseLook.smoothing;
      }
      
      if (this.smoothingSlider) {
        this.smoothingSlider.value = this.game.mouseLook.smoothingFactor;
      }
    }
  }
  
  // Show settings menu
  showSettingsMenu() {
    this.settingsContainer.classList.add('visible');
    
    // Play UI open sound
    this.playUISound('ui_menu_open');
  }
  
  // Hide settings menu
  hideSettingsMenu() {
    this.settingsContainer.classList.remove('visible');
    
    // Play UI close sound
    this.playUISound('ui_menu_close');
  }
  
  // Toggle settings menu
  toggleSettingsMenu() {
    const isVisible = this.settingsContainer.classList.contains('visible');
    
    if (isVisible) {
      this.hideSettingsMenu();
    } else {
      this.showSettingsMenu();
    }
  }
  
  // FPS counter update
  updateFPS(fps) {
    if (this.fpsElement) {
      this.fpsElement.textContent = `FPS: ${fps}`;
      
      // Color coding based on performance
      if (fps >= 50) {
        this.fpsElement.style.color = '#77ff77'; // Green for good performance
      } else if (fps >= 30) {
        this.fpsElement.style.color = '#ffff77'; // Yellow for acceptable performance
      } else {
        this.fpsElement.style.color = '#ff7777'; // Red for poor performance
      }
    }
  }
  
  // Pause menu methods
  showPauseMenu() {
    // Simple implementation - could be enhanced with a proper menu
    if (!this.pauseContainer) {
      this.pauseContainer = document.createElement('div');
      this.pauseContainer.className = 'pause-menu';
      this.pauseContainer.innerHTML = `
        <div class="pause-content">
          <h2>Game Paused</h2>
          <p>Press ESC to resume</p>
          <button id="settings-btn">Settings</button>
        </div>
      `;
      document.body.appendChild(this.pauseContainer);
      
      // Add style
      const style = document.createElement('style');
      style.textContent = `
        .pause-menu {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(0, 0, 0, 0.7);
          z-index: 900;
        }
        .pause-content {
          background-color: #222;
          padding: 20px;
          border-radius: 5px;
          text-align: center;
          color: white;
        }
        .pause-content button {
          padding: 8px 16px;
          margin-top: 10px;
          background-color: #555;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }
        .pause-content button:hover {
          background-color: #777;
        }
      `;
      document.head.appendChild(style);
      
      // Add event listeners
      document.getElementById('settings-btn').addEventListener('click', () => {
        this.showSettingsMenu();
      });
    }
    
    this.pauseContainer.style.display = 'flex';
    
    // Play menu open sound
    this.playUISound('ui_menu_open');
  }
  
  hidePauseMenu() {
    if (this.pauseContainer) {
      this.pauseContainer.style.display = 'none';
    }
    
    // Play menu close sound 
    this.playUISound('ui_menu_close');
  }

  /**
   * Show no ammo indicator
   */
  showNoAmmoIndicator() {
    if (this.noAmmoIndicator) {
      this.noAmmoIndicator.style.display = 'block';
      this.noAmmoIndicator.classList.add('active');
      
      // Hide after 2 seconds
      setTimeout(() => {
        this.hideNoAmmoIndicator();
      }, 2000);
    }
    
    if (this.ammoContainer) {
      this.ammoContainer.classList.add('no-ammo');
      
      // Remove class after animation completes
      setTimeout(() => {
        this.ammoContainer.classList.remove('no-ammo');
      }, 500);
    }
  }

  /**
   * Hide no ammo indicator
   */
  hideNoAmmoIndicator() {
    if (this.noAmmoIndicator) {
      this.noAmmoIndicator.classList.remove('active');
      setTimeout(() => {
        if (!this.noAmmoIndicator.classList.contains('active')) {
          this.noAmmoIndicator.style.display = 'none';
        }
      }, 500); // Fade out duration
    }
  }

  /**
   * Show ammo pickup indicator
   * @param {number} amount - Amount of ammo picked up
   */
  showAmmoPickupIndicator(amount) {
    if (!this.ammoPickupIndicator) {
      // Create pickup indicator if it doesn't exist
      this.ammoPickupIndicator = document.createElement('div');
      this.ammoPickupIndicator.id = 'ammo-pickup-indicator';
      this.ammoPickupIndicator.className = 'pickup-indicator';
      document.body.appendChild(this.ammoPickupIndicator);
    }
    
    this.ammoPickupIndicator.textContent = `+${amount} Ammo`;
    this.ammoPickupIndicator.style.display = 'block';
    this.ammoPickupIndicator.classList.add('active');
    
    // Hide after animation completes
    setTimeout(() => {
      this.ammoPickupIndicator.classList.remove('active');
      setTimeout(() => {
        this.ammoPickupIndicator.style.display = 'none';
      }, 500);
    }, 2000);
    
    // Play ammo pickup sound
    if (this.game && this.game.soundManager) {
      this.game.soundManager.playSfx('player_ammo_pickup', { category: 'player' });
    }
  }

  /**
   * Create hit marker elements if they don't exist
   */
  createHitMarkerElements() {
    // Create container for hit markers
    this.hitMarkerContainer = document.getElementById('hit-marker-container');
    if (!this.hitMarkerContainer) {
      this.hitMarkerContainer = document.createElement('div');
      this.hitMarkerContainer.id = 'hit-marker-container';
      this.hitMarkerContainer.style.position = 'absolute';
      this.hitMarkerContainer.style.top = '50%';
      this.hitMarkerContainer.style.left = '50%';
      this.hitMarkerContainer.style.transform = 'translate(-50%, -50%)';
      this.hitMarkerContainer.style.pointerEvents = 'none';
      this.hitMarkerContainer.style.zIndex = '200';
      document.body.appendChild(this.hitMarkerContainer);
    }
    
    // Create hit marker
    this.hitMarker = document.createElement('div');
    this.hitMarker.id = 'hit-marker';
    this.hitMarker.style.width = '20px';
    this.hitMarker.style.height = '20px';
    this.hitMarker.style.position = 'relative';
    this.hitMarker.style.opacity = '0';
    this.hitMarker.style.transition = 'opacity 0.2s ease-out';
    
    // Create hit marker lines
    const createLine = (rotation) => {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.width = '8px';
      line.style.height = '2px';
      line.style.backgroundColor = 'white';
      line.style.top = '9px';
      line.style.left = '6px';
      line.style.transform = `rotate(${rotation}deg)`;
      line.style.transformOrigin = 'center';
      return line;
    };
    
    this.hitMarker.appendChild(createLine(45));
    this.hitMarker.appendChild(createLine(135));
    this.hitMarker.appendChild(createLine(225));
    this.hitMarker.appendChild(createLine(315));
    
    this.hitMarkerContainer.appendChild(this.hitMarker);
    
    // Create critical hit marker
    this.criticalHitMarker = document.createElement('div');
    this.criticalHitMarker.id = 'critical-hit-marker';
    this.criticalHitMarker.style.width = '24px';
    this.criticalHitMarker.style.height = '24px';
    this.criticalHitMarker.style.position = 'relative';
    this.criticalHitMarker.style.opacity = '0';
    this.criticalHitMarker.style.transition = 'opacity 0.2s ease-out';
    
    // Create critical hit marker lines
    const createCriticalLine = (rotation) => {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.width = '10px';
      line.style.height = '2px';
      line.style.backgroundColor = '#ff3333';
      line.style.top = '11px';
      line.style.left = '7px';
      line.style.transform = `rotate(${rotation}deg)`;
      line.style.transformOrigin = 'center';
      return line;
    };
    
    this.criticalHitMarker.appendChild(createCriticalLine(45));
    this.criticalHitMarker.appendChild(createCriticalLine(135));
    this.criticalHitMarker.appendChild(createCriticalLine(225));
    this.criticalHitMarker.appendChild(createCriticalLine(315));
    
    this.hitMarkerContainer.appendChild(this.criticalHitMarker);
    
    // Create kill marker
    this.killMarker = document.createElement('div');
    this.killMarker.id = 'kill-marker';
    this.killMarker.style.width = '30px';
    this.killMarker.style.height = '30px';
    this.killMarker.style.position = 'relative';
    this.killMarker.style.opacity = '0';
    this.killMarker.style.transition = 'opacity 0.2s ease-out';
    
    // Create kill marker circle
    const createKillMarkerCircle = () => {
      const circle = document.createElement('div');
      circle.style.position = 'absolute';
      circle.style.width = '30px';
      circle.style.height = '30px';
      circle.style.borderRadius = '50%';
      circle.style.border = '2px solid #ff3333';
      circle.style.top = '0';
      circle.style.left = '0';
      return circle;
    };
    
    // Create kill marker X lines
    const createKillMarkerLine = (rotation) => {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.width = '14px';
      line.style.height = '2px';
      line.style.backgroundColor = '#ff3333';
      line.style.top = '14px';
      line.style.left = '8px';
      line.style.transform = `rotate(${rotation}deg)`;
      line.style.transformOrigin = 'center';
      return line;
    };
    
    this.killMarker.appendChild(createKillMarkerCircle());
    this.killMarker.appendChild(createKillMarkerLine(45));
    this.killMarker.appendChild(createKillMarkerLine(135));
    
    this.hitMarkerContainer.appendChild(this.killMarker);
    
    // Initialize damage indicator elements
    this.initDamageIndicators();
  }

  /**
   * Initialize damage indicator elements
   */
  initDamageIndicators() {
    // Get existing damage indicator elements
    this.damageIndicatorContainer = document.getElementById('damage-indicator-container');
    this.damageVignette = document.getElementById('damage-vignette');
    this.damageFlash = document.querySelector('.damage-flash');
    
    // Create if they don't exist
    if (!this.damageIndicatorContainer) {
      this.damageIndicatorContainer = document.createElement('div');
      this.damageIndicatorContainer.id = 'damage-indicator-container';
      this.damageIndicatorContainer.style.position = 'absolute';
      this.damageIndicatorContainer.style.top = '0';
      this.damageIndicatorContainer.style.left = '0';
      this.damageIndicatorContainer.style.width = '100%';
      this.damageIndicatorContainer.style.height = '100%';
      this.damageIndicatorContainer.style.pointerEvents = 'none';
      this.damageIndicatorContainer.style.zIndex = '100';
      this.damageIndicatorContainer.style.overflow = 'hidden';
      document.body.appendChild(this.damageIndicatorContainer);
      
      this.damageVignette = document.createElement('div');
      this.damageVignette.id = 'damage-vignette';
      this.damageVignette.style.position = 'absolute';
      this.damageVignette.style.top = '0';
      this.damageVignette.style.left = '0';
      this.damageVignette.style.width = '100%';
      this.damageVignette.style.height = '100%';
      this.damageVignette.style.boxShadow = 'inset 0 0 150px rgba(255, 0, 0, 0)';
      this.damageVignette.style.transition = 'box-shadow 0.5s ease';
      this.damageVignette.style.pointerEvents = 'none';
      this.damageIndicatorContainer.appendChild(this.damageVignette);
      
      this.damageFlash = document.createElement('div');
      this.damageFlash.className = 'damage-flash';
      this.damageFlash.style.position = 'absolute';
      this.damageFlash.style.top = '0';
      this.damageFlash.style.left = '0';
      this.damageFlash.style.width = '100%';
      this.damageFlash.style.height = '100%';
      this.damageFlash.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
      this.damageFlash.style.opacity = '0';
      this.damageFlash.style.pointerEvents = 'none';
      this.damageIndicatorContainer.appendChild(this.damageFlash);
    }
    
    // Store active damage direction indicators
    this.activeDamageIndicators = [];
  }

  /**
   * Show damage flash overlay
   */
  showDamageFlash() {
    if (!this.damageFlash) return;
    
    // Remove existing active class
    this.damageFlash.classList.remove('active');
    
    // Force reflow
    void this.damageFlash.offsetWidth;
    
    // Add active class to trigger animation
    this.damageFlash.classList.add('active');
  }
  
  /**
   * Show damage vignette effect
   * @param {number} intensity - Intensity of the effect (0-1)
   */
  showDamageVignette(intensity = 1) {
    if (!this.damageVignette) return;
    
    // Ensure intensity is within range
    intensity = Math.max(0, Math.min(1, intensity));
    
    // Add active class to trigger animation
    this.damageVignette.classList.add('active');
    
    // Clear existing timeout
    if (this.damageVignetteTimeout) {
      clearTimeout(this.damageVignetteTimeout);
    }
    
    // Hide vignette after animation
    this.damageVignetteTimeout = setTimeout(() => {
      this.damageVignette.classList.remove('active');
    }, 1000);
  }
  
  /**
   * Show damage direction indicator
   * @param {number} angle - Direction angle in degrees (0 is front, 90 is right, 180 is back, 270 is left)
   */
  showDamageDirectionIndicator(angle) {
    if (!this.damageIndicatorContainer) return;
    
    // Create indicator element
    const indicator = document.createElement('div');
    indicator.className = 'damage-direction-indicator';
    
    // Calculate position based on angle (place around the edge of the screen)
    const radius = Math.min(window.innerWidth, window.innerHeight) * 0.4;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Convert angle to radians
    const angleRad = angle * (Math.PI / 180);
    
    // Calculate position
    const x = centerX + radius * Math.sin(angleRad) - 50; // Adjust for element size
    const y = centerY - radius * Math.cos(angleRad) - 50; // Adjust for element size
    
    // Set styles
    indicator.style.position = 'absolute';
    indicator.style.top = `${y}px`;
    indicator.style.left = `${x}px`;
    indicator.style.transform = `rotate(${angle}deg)`;
    
    // Add to container
    this.damageIndicatorContainer.appendChild(indicator);
    
    // Add active class to trigger animation
    setTimeout(() => {
      indicator.classList.add('active');
    }, 10);
    
    // Store indicator for cleanup
    this.activeDamageIndicators.push(indicator);
    
    // Remove after animation completes
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
      
      // Remove from active indicators
      const index = this.activeDamageIndicators.indexOf(indicator);
      if (index !== -1) {
        this.activeDamageIndicators.splice(index, 1);
      }
    }, 1000);
  }
  
  /**
   * Show full damage feedback (flash, vignette, and direction)
   * @param {number} intensity - Damage intensity (0-1)
   * @param {number} angle - Direction angle in degrees
   */
  showDamageFeedback(intensity = 1, angle = null) {
    // Show damage flash
    this.showDamageFlash();
    
    // Show damage vignette with intensity
    this.showDamageVignette(intensity);
    
    // Show direction indicator if angle is provided
    if (angle !== null) {
      this.showDamageDirectionIndicator(angle);
    }
    
    // Add screen shake effect
    this.addScreenShake(intensity * 5);
  }
  
  /**
   * Add screen shake effect
   * @param {number} intensity - Shake intensity (0-10)
   */
  addScreenShake(intensity = 5) {
    if (!this.game || !this.game.camera) return;
    
    // Store original camera position
    if (!this.originalCameraPosition) {
      this.originalCameraPosition = this.game.camera.position.clone();
    }
    
    // Clear any existing shake
    if (this.screenShakeInterval) {
      clearInterval(this.screenShakeInterval);
      this.screenShakeInterval = null;
    }
    
    // Maximum shake amount based on intensity
    const maxShake = Math.min(0.05, intensity * 0.01);
    let shakeTime = 0;
    const shakeDuration = 500; // milliseconds
    const startTime = Date.now();
    
    // Create shake interval
    this.screenShakeInterval = setInterval(() => {
      // Calculate elapsed time
      const elapsed = Date.now() - startTime;
      
      // Stop shaking after duration
      if (elapsed >= shakeDuration) {
        clearInterval(this.screenShakeInterval);
        this.screenShakeInterval = null;
        
        // Reset camera position
        if (this.game.camera && this.originalCameraPosition) {
          this.game.camera.position.copy(this.originalCameraPosition);
        }
        return;
      }
      
      // Calculate shake amount (reducing over time)
      const shakeAmount = maxShake * (1 - elapsed / shakeDuration);
      
      // Apply random offset to camera
      if (this.game.camera) {
        this.game.camera.position.x = this.originalCameraPosition.x + (Math.random() * 2 - 1) * shakeAmount;
        this.game.camera.position.y = this.originalCameraPosition.y + (Math.random() * 2 - 1) * shakeAmount;
      }
    }, 16); // ~60fps
  }

  /**
   * Show standard hit marker
   */
  showHitMarker() {
    if (!this.hitMarker) return;
    
    // Show hit marker
    this.hitMarker.style.opacity = '0.8';
    
    // Clear any existing timeout
    if (this.hitMarkerTimeout) {
      clearTimeout(this.hitMarkerTimeout);
    }
    
    // Hide after a short delay
    this.hitMarkerTimeout = setTimeout(() => {
      this.hitMarker.style.opacity = '0';
    }, 200);
  }
  
  /**
   * Show critical hit marker
   */
  showCriticalHitMarker() {
    if (!this.criticalHitMarker) return;
    
    // Show critical hit marker
    this.criticalHitMarker.style.opacity = '1';
    
    // Clear any existing timeout
    if (this.criticalHitMarkerTimeout) {
      clearTimeout(this.criticalHitMarkerTimeout);
    }
    
    // Hide after a short delay
    this.criticalHitMarkerTimeout = setTimeout(() => {
      this.criticalHitMarker.style.opacity = '0';
    }, 300);
  }
  
  /**
   * Show kill marker
   */
  showKillMarker() {
    if (!this.killMarker) return;
    
    // Show kill marker
    this.killMarker.style.opacity = '1';
    
    // Clear any existing timeout
    if (this.killMarkerTimeout) {
      clearTimeout(this.killMarkerTimeout);
    }
    
    // Hide after a delay
    this.killMarkerTimeout = setTimeout(() => {
      this.killMarker.style.opacity = '0';
    }, 400);
    
    // Animate kill marker
    this.killMarker.animate(
      [
        { transform: 'scale(0.8)' },
        { transform: 'scale(1.1)' },
        { transform: 'scale(1.0)' }
      ],
      {
        duration: 300,
        easing: 'ease-out'
      }
    );
  }

  createHealthIcon() {
    // Check if health icon already exists
    if (!document.getElementById('health-icon')) {
      // Create icon container
      const iconContainer = document.createElement('div');
      iconContainer.id = 'health-icon';
      
      // Create health icon
      const heartIcon = document.createElement('div');
      heartIcon.className = 'heart-icon';
      
      // Add to the health container
      iconContainer.appendChild(heartIcon);
      
      // Insert at the beginning of the health container
      if (this.healthContainer) {
        this.healthContainer.insertBefore(iconContainer, this.healthContainer.firstChild);
        
        // Add styles to head if not already added
        if (!document.getElementById('health-icon-styles')) {
          const style = document.createElement('style');
          style.id = 'health-icon-styles';
          style.textContent = `
            #health-icon {
              position: absolute;
              left: -30px;
              top: 50%;
              transform: translateY(-50%);
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: rgba(0, 0, 0, 0.5);
              border: 2px solid #fff;
              border-radius: 50%;
              padding: 5px;
            }
            
            .heart-icon {
              width: 100%;
              height: 100%;
              background-color: #ff3333;
              clip-path: path('M10,6 C10,6 8.5,0 5,0 C2,0 0,3 0,5 C0,8 3,11 10,16 C17,11 20,8 20,5 C20,3 18,0 15,0 C11.5,0 10,6 10,6 Z');
              animation: pulse 1.5s ease infinite;
            }
            
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); }
            }
            
            #health-container {
              position: relative;
              overflow: visible;
              margin-left: 40px;
            }
            
            #health-container.critical .heart-icon {
              animation: critical-pulse 0.8s ease infinite;
            }
            
            @keyframes critical-pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.2); opacity: 0.8; }
              100% { transform: scale(1); opacity: 1; }
            }
            
            #health-container.pulse .heart-icon {
              animation: damage-pulse 0.3s ease;
            }
            
            @keyframes damage-pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.5); }
              100% { transform: scale(1); }
            }
            
            #health-bar {
              transition: width 0.3s ease-out, background-color 0.3s ease;
            }
            
            #health-text {
              font-size: 16px;
              font-weight: bold;
              transition: color 0.3s ease;
            }
            
            #health-bar.healing {
              filter: brightness(1.5);
            }
            
            #health-container.damage {
              animation: shake 0.3s ease;
            }
            
            @keyframes shake {
              0% { transform: translateX(0); }
              25% { transform: translateX(-5px); }
              50% { transform: translateX(5px); }
              75% { transform: translateX(-5px); }
              100% { transform: translateX(0); }
            }
          `;
          document.head.appendChild(style);
        }
      }
    }
  }

  /**
   * Show reload indicator
   */
  showReloadIndicator() {
    if (this.reloadIndicator) {
      this.reloadIndicator.style.display = 'block';
      this.reloadIndicator.classList.add('active');
    }
    
    if (this.ammoContainer) {
      this.ammoContainer.classList.add('reloading');
    }
  }
  
  /**
   * Hide reload indicator
   */
  hideReloadIndicator() {
    if (this.reloadIndicator) {
      this.reloadIndicator.classList.remove('active');
      setTimeout(() => {
        if (!this.reloadIndicator.classList.contains('active')) {
          this.reloadIndicator.style.display = 'none';
        }
      }, 500); // Fade out duration
    }
    
    if (this.ammoContainer) {
      this.ammoContainer.classList.remove('reloading');
    }
  }
  
  /**
   * Animate the reload process
   */
  animateReloading() {
    if (this.ammoContainer) {
      // Add reloading class for animation
      this.ammoContainer.classList.add('reloading');
      
      // Pulse animation for the reload indicator
      if (this.reloadIndicator) {
        this.reloadIndicator.classList.add('pulse');
        
        // Remove pulse class after animation completes
        setTimeout(() => {
          this.reloadIndicator.classList.remove('pulse');
        }, 1000); // Animation duration
      }
    }
  }

  /**
   * Create main menu UI
   */
  createMainMenuUI() {
    if (!document.getElementById('main-menu')) {
      // Create main menu container
      const mainMenu = document.createElement('div');
      mainMenu.id = 'main-menu';
      
      // Add HTML content
      mainMenu.innerHTML = `
        <div class="menu-content">
          <h1>ZOMBIE WAVE SHOOTER</h1>
          <div class="menu-buttons">
            <button id="start-game">Start Game</button>
            <button id="settings-button">Settings</button>
            <div class="difficulty-selector">
              <span>Difficulty:</span>
              <div class="difficulty-options">
                <button class="difficulty-btn" data-difficulty="easy">Easy</button>
                <button class="difficulty-btn selected" data-difficulty="normal">Normal</button>
                <button class="difficulty-btn" data-difficulty="hard">Hard</button>
              </div>
            </div>
          </div>
          <div class="game-info">
            <p>Use WASD to move, mouse to aim, click to shoot, R to reload</p>
            <p>ESC to pause the game</p>
          </div>
        </div>
      `;
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        #main-menu {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(5px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .menu-content {
          background-color: rgba(40, 40, 40, 0.9);
          padding: 40px;
          border-radius: 10px;
          border: 2px solid #555;
          text-align: center;
          color: white;
          max-width: 600px;
          width: 90%;
        }
        
        .menu-content h1 {
          font-size: 36px;
          margin-bottom: 30px;
          text-shadow: 0 0 10px #f00;
          color: #fff;
        }
        
        .menu-buttons {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .menu-buttons button {
          padding: 12px 20px;
          font-size: 18px;
          background-color: #333;
          color: white;
          border: 2px solid #666;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .menu-buttons button:hover {
          background-color: #444;
          border-color: #888;
        }
        
        .difficulty-selector {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 10px;
        }
        
        .difficulty-options {
          display: flex;
          justify-content: center;
          gap: 10px;
        }
        
        .difficulty-btn {
          flex: 1;
          padding: 8px 12px !important;
          font-size: 16px !important;
          opacity: 0.7;
        }
        
        .difficulty-btn.selected {
          opacity: 1;
          border-color: #f00 !important;
          box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
        }
        
        .game-info {
          font-size: 14px;
          color: #aaa;
        }
        
        .game-info p {
          margin: 5px 0;
        }
      `;
      document.head.appendChild(style);
      
      // Append to body
      document.body.appendChild(mainMenu);
      
      // Hide main menu initially (will be shown by GameStateManager)
      mainMenu.style.display = 'none';
      
      // Add event listeners for buttons
      document.getElementById('start-game').addEventListener('click', () => {
        if (this.game.gameStateManager) {
          this.game.gameStateManager.changeState(this.game.gameStateManager.states.PLAYING);
        }
      });
      
      document.getElementById('settings-button').addEventListener('click', () => {
        this.showSettingsMenu();
      });
      
      // Add difficulty selection
      const difficultyButtons = document.querySelectorAll('.difficulty-btn');
      difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
          // Remove selected class from all buttons
          difficultyButtons.forEach(btn => btn.classList.remove('selected'));
          
          // Add selected class to clicked button
          button.classList.add('selected');
          
          // Update game difficulty
          const difficulty = button.dataset.difficulty;
          if (this.game.gameState) {
            this.game.gameState.difficulty = difficulty;
          }
          
          // Set difficulty in DifficultyManager if available
          if (this.game.difficultyManager) {
            this.game.difficultyManager.setDifficulty(difficulty);
          }
        });
      });
    }
    
    // Ensure main menu is hidden at startup
    this.hideMainMenu();
    
    // Add click sound to all button elements
    const addSoundToButtons = () => {
      const buttons = document.querySelectorAll('.button, button, .menu-item');
      
      buttons.forEach(button => {
        // Avoid adding multiple event listeners
        if (!button.hasClickSound) {
          button.addEventListener('click', () => {
            this.playUISound('ui_button_click');
          });
          
          button.addEventListener('mouseenter', () => {
            this.playUISound('ui_button_hover');
          });
          
          button.hasClickSound = true;
        }
      });
    };
    
    // Add sound to existing buttons
    addSoundToButtons();
  }
  
  /**
   * Show the main menu
   */
  showMainMenu() {
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
      mainMenu.style.display = 'flex';
    }
    
    // Hide gameplay UI
    this.updateGameplayUI(false);
  }
  
  /**
   * Hide the main menu
   */
  hideMainMenu() {
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
      mainMenu.style.display = 'none';
    }
  }
  
  /**
   * Update visibility of gameplay UI elements
   * @param {boolean} visible - Whether gameplay UI should be visible
   */
  updateGameplayUI(visible) {
    // Elements to show/hide
    const uiElements = [
      this.healthContainer,
      this.ammoContainer,
      this.crosshairElement,
      document.getElementById('score'),
      document.getElementById('wave')
    ];
    
    uiElements.forEach(element => {
      if (element) {
        element.style.display = visible ? 'flex' : 'none';
      }
    });
  }
  
  /**
   * Hide game completion screen
   */
  hideGameComplete() {
    const gameCompleteElement = document.getElementById('game-complete');
    if (gameCompleteElement) {
      gameCompleteElement.style.display = 'none';
    }
  }

  /**
   * Create container for score popups
   */
  createScorePopupContainer() {
    this.scorePopupContainer = document.createElement('div');
    this.scorePopupContainer.id = 'score-popup-container';
    this.scorePopupContainer.className = 'score-popup-container';
    document.body.appendChild(this.scorePopupContainer);
    
    // Add styles for score popups
    const style = document.createElement('style');
    style.textContent = `
      .score-popup-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 100;
        overflow: hidden;
      }
      .score-popup {
        position: absolute;
        font-family: 'Arial', sans-serif;
        font-weight: bold;
        text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.7);
        pointer-events: none;
        white-space: nowrap;
        animation: scoreFloat 2s ease-out, scoreFade 2s ease-out;
        will-change: transform, opacity;
      }
      @keyframes scoreFloat {
        0% { transform: translateY(0); }
        100% { transform: translateY(-50px); }
      }
      @keyframes scoreFade {
        0% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; }
      }
      .score-popup.kill {
        color: white;
        font-size: 20px;
      }
      .score-popup.headshot {
        color: #ff9900;
        font-size: 24px;
      }
      .score-popup.wave_bonus {
        color: #33ccff;
        font-size: 28px;
      }
      .score-popup.boss_wave {
        color: #ff3366;
        font-size: 32px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Create score UI elements if they don't exist
   */
  createScoreUI() {
    // Check if score container exists
    let scoreContainer = document.getElementById('score-container');
    
    if (!scoreContainer) {
      // Create score container
      scoreContainer = document.createElement('div');
      scoreContainer.id = 'score-container';
      scoreContainer.className = 'score-container';
      document.body.appendChild(scoreContainer);
      
      // Create score display
      this.scoreElement = document.createElement('div');
      this.scoreElement.id = 'score';
      this.scoreElement.className = 'score';
      this.scoreElement.textContent = 'Score: 0';
      scoreContainer.appendChild(this.scoreElement);
      
      // Create multiplier display
      this.multiplierElement = document.createElement('div');
      this.multiplierElement.id = 'score-multiplier';
      this.multiplierElement.className = 'score-multiplier';
      this.multiplierElement.textContent = 'x1.0';
      scoreContainer.appendChild(this.multiplierElement);
      
      // Create high score display
      this.highScoreElement = document.createElement('div');
      this.highScoreElement.id = 'high-score';
      this.highScoreElement.className = 'high-score';
      this.highScoreElement.textContent = 'High Score: 0';
      scoreContainer.appendChild(this.highScoreElement);
      
      // Add styles to head
      const style = document.createElement('style');
      style.textContent = `
        .score-container {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          z-index: 100;
          font-family: 'Arial', sans-serif;
          color: white;
          text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
        }
        .score {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .score-multiplier {
          font-size: 18px;
          color: #ffcc00;
          transition: all 0.2s ease;
        }
        .high-score {
          font-size: 16px;
          color: #aaffaa;
          margin-top: 5px;
        }
        .score-pulse {
          animation: scorePulse 0.3s ease;
        }
        @keyframes scorePulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Add sound effect method to UI class
  playUISound(soundId) {
    if (this.game && this.game.soundManager) {
      this.game.soundManager.playSfx(soundId, { category: 'ui' });
    }
  }

  setupDebugUI() {
    // Create debug controls container if it doesn't exist
    if (!this.debugContainer) {
      this.debugContainer = document.createElement('div');
      this.debugContainer.id = 'debug-controls';
      this.debugContainer.style.position = 'absolute';
      this.debugContainer.style.top = '10px';
      this.debugContainer.style.right = '10px';
      this.debugContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      this.debugContainer.style.padding = '10px';
      this.debugContainer.style.borderRadius = '5px';
      this.debugContainer.style.color = 'white';
      this.debugContainer.style.fontFamily = 'monospace';
      this.debugContainer.style.fontSize = '12px';
      this.debugContainer.style.zIndex = '1000';
      this.debugContainer.style.display = 'none'; // Hidden by default
      this.gameContainer.appendChild(this.debugContainer);
    }

    // Clear existing controls
    this.debugContainer.innerHTML = '<h3>Debug Controls</h3>';

    // FPS Display
    this.fpsDisplay = document.createElement('div');
    this.fpsDisplay.id = 'fps-display';
    this.fpsDisplay.innerHTML = 'FPS: --';
    this.debugContainer.appendChild(this.fpsDisplay);

    // Culling Toggle
    const cullingToggle = document.createElement('div');
    cullingToggle.innerHTML = '<button id="toggle-frustum-culling">Toggle Frustum Culling</button>';
    cullingToggle.querySelector('button').addEventListener('click', () => {
      if (this.game.cullingManager) {
        const enabled = !this.game.cullingManager.config.enabled;
        this.game.cullingManager.setEnabled(enabled);
        cullingToggle.querySelector('button').textContent = 
          `Toggle Frustum Culling (${enabled ? 'ON' : 'OFF'})`;
      }
    });
    this.debugContainer.appendChild(cullingToggle);
    
    // Occlusion Culling Toggle
    const occlusionToggle = document.createElement('div');
    occlusionToggle.innerHTML = '<button id="toggle-occlusion-culling">Toggle Occlusion Culling</button>';
    occlusionToggle.querySelector('button').addEventListener('click', () => {
      if (this.game.cullingManager && this.game.cullingManager.setOcclusionCullingEnabled) {
        const enabled = !this.game.cullingManager.config.occlusionCulling;
        this.game.cullingManager.setOcclusionCullingEnabled(enabled);
        occlusionToggle.querySelector('button').textContent = 
          `Toggle Occlusion Culling (${enabled ? 'ON' : 'OFF'})`;
      }
    });
    this.debugContainer.appendChild(occlusionToggle);

    // Debug Visualization Toggle
    const debugVisualizationToggle = document.createElement('div');
    debugVisualizationToggle.innerHTML = '<button id="toggle-debug-visualization">Toggle Debug Visualization</button>';
    debugVisualizationToggle.querySelector('button').addEventListener('click', () => {
      if (this.game.cullingManager) {
        const enabled = !this.game.cullingManager.config.debugMode;
        this.game.cullingManager.setDebugMode(enabled);
        debugVisualizationToggle.querySelector('button').textContent = 
          `Toggle Debug Visualization (${enabled ? 'ON' : 'OFF'})`;
      }
    });
    this.debugContainer.appendChild(debugVisualizationToggle);

    // Quality Settings
    const qualitySelect = document.createElement('div');
    qualitySelect.innerHTML = `
      <label for="quality-select">Quality: </label>
      <select id="quality-select">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="ultra">Ultra</option>
      </select>
    `;
    qualitySelect.querySelector('select').value = this.game.settings.qualityLevel;
    qualitySelect.querySelector('select').addEventListener('change', (e) => {
      this.game.settings.qualityLevel = e.target.value;
      this.game.applyQualitySettings();
    });
    this.debugContainer.appendChild(qualitySelect);

    // Toggle Debug UI Button
    if (!this.debugToggleButton) {
      this.debugToggleButton = document.createElement('button');
      this.debugToggleButton.id = 'toggle-debug-ui';
      this.debugToggleButton.textContent = 'Show Debug';
      this.debugToggleButton.style.position = 'absolute';
      this.debugToggleButton.style.top = '10px';
      this.debugToggleButton.style.right = '10px';
      this.debugToggleButton.style.zIndex = '1001';
      this.debugToggleButton.addEventListener('click', () => {
        const isVisible = this.debugContainer.style.display !== 'none';
        this.debugContainer.style.display = isVisible ? 'none' : 'block';
        this.debugToggleButton.textContent = isVisible ? 'Show Debug' : 'Hide Debug';
      });
      this.gameContainer.appendChild(this.debugToggleButton);
    }
  }

  // Update FPS display in debug UI
  updateFPSDisplay(fps) {
    if (this.fpsDisplay) {
      this.fpsDisplay.innerHTML = `FPS: ${fps.toFixed(1)}`;
      
      // Color-code based on performance
      if (fps < 30) {
        this.fpsDisplay.style.color = 'red';
      } else if (fps < 50) {
        this.fpsDisplay.style.color = 'yellow';
      } else {
        this.fpsDisplay.style.color = 'lime';
      }
    }
  }
  
  // Update quality UI when changed
  updateQualityUI(quality) {
    // Update the quality indicator in the UI
    const qualityElement = document.getElementById('quality-indicator');
    if (qualityElement) {
      qualityElement.textContent = quality.charAt(0).toUpperCase() + quality.slice(1);
    }
    
    // Update the quality dropdown
    const qualityDropdown = document.getElementById('quality-dropdown');
    if (qualityDropdown) {
      qualityDropdown.value = quality;
    }
  }
  
  /**
   * Update difficulty indicator
   * @param {string} difficultyName - Name of the difficulty 
   * @param {string} difficultyColor - Color for the difficulty indicator
   */
  updateDifficultyIndicator(difficultyName, difficultyColor) {
    // Create or get difficulty indicator
    let difficultyIndicator = document.getElementById('difficulty-indicator');
    
    if (!difficultyIndicator) {
      // Create difficulty indicator
      difficultyIndicator = document.createElement('div');
      difficultyIndicator.id = 'difficulty-indicator';
      
      // Style the indicator
      const style = document.createElement('style');
      style.textContent = `
        #difficulty-indicator {
          position: fixed;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 5px 12px;
          border-radius: 15px;
          font-size: 14px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 1000;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        
        #difficulty-indicator.fade {
          opacity: 0.3;
        }
        
        #difficulty-indicator:hover {
          opacity: 1;
        }
        
        #difficulty-indicator-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
        }
      `;
      document.head.appendChild(style);
      
      // Create color dot
      const colorDot = document.createElement('span');
      colorDot.id = 'difficulty-indicator-color';
      difficultyIndicator.appendChild(colorDot);
      
      // Create text
      const text = document.createElement('span');
      text.id = 'difficulty-indicator-text';
      difficultyIndicator.appendChild(text);
      
      // Add to document
      document.body.appendChild(difficultyIndicator);
      
      // Fade out after 5 seconds
      setTimeout(() => {
        difficultyIndicator.classList.add('fade');
      }, 5000);
      
      // Show fully when game state changes or wave changes
      document.addEventListener('wave-change', () => {
        difficultyIndicator.classList.remove('fade');
        setTimeout(() => {
          difficultyIndicator.classList.add('fade');
        }, 5000);
      });
    }
    
    // Update indicator
    const colorDot = document.getElementById('difficulty-indicator-color');
    const text = document.getElementById('difficulty-indicator-text');
    
    if (colorDot) {
      colorDot.style.backgroundColor = difficultyColor;
    }
    
    if (text) {
      text.textContent = difficultyName;
    }
    
    // Show the indicator (remove fade class temporarily)
    difficultyIndicator.classList.remove('fade');
    setTimeout(() => {
      difficultyIndicator.classList.add('fade');
    }, 5000);
  }
}
