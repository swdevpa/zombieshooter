export class UI {
  constructor(game) {
    this.game = game;

    // UI elements
    this.scoreElement = document.getElementById('score');
    this.waveElement = document.getElementById('wave');

    // Health UI elements
    this.healthContainer = document.getElementById('health-container');
    this.healthBar = document.getElementById('health-bar');
    this.healthText = document.getElementById('health-text');

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
    
    // Settings menu elements
    this.settingsContainer = document.getElementById('settings-menu');
    this.sensitivitySlider = document.getElementById('sensitivity-slider');
    this.sensitivityValue = document.getElementById('sensitivity-value');
    this.invertYCheckbox = document.getElementById('invert-y-checkbox');
    this.enableSmoothingCheckbox = document.getElementById('enable-smoothing-checkbox');
    this.smoothingSlider = document.getElementById('smoothing-slider');
    
    // Create settings UI elements if they don't exist
    this.createSettingsUI();

    // Default max values (will be updated from player when it's available)
    this.defaultMaxHealth = 100;
    this.defaultMaxAmmo = 30;

    // Initialize UI with safe default values
    this.updateScore(0);
    this.updateWave(1);
    this.updateHealth(100);
    this.updateAmmo(30, 30);
    this.showCrosshair(true);
    
    // Initialize settings
    this.initializeSettings();
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

    // Aktualisiere Score basierend auf Game-State
    this.updateScore(this.game.gameState?.score || this.game.score || 0);

    // Andere UI-Updates könnten hier hinzugefügt werden
  }

  updateScore(score) {
    if (this.scoreElement) {
      this.scoreElement.textContent = `Score: ${score}`;
    }
  }

  updateWave(wave) {
    if (this.waveElement) {
      this.waveElement.textContent = `Wave: ${wave}`;
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
      }
    }

    // Update health text
    if (this.healthText) {
      this.healthText.textContent = Math.ceil(health);
    }

    // Pulse effect when taking damage
    if (this.lastHealth && health < this.lastHealth) {
      this.pulseHealthBar();
    }

    // Store last health for comparison
    this.lastHealth = health;
  }

  pulseHealthBar() {
    if (this.healthContainer) {
      // Add pulse class
      this.healthContainer.classList.add('pulse');
      
      // Remove pulse class after animation completes
      setTimeout(() => {
        this.healthContainer.classList.remove('pulse');
      }, 300);
    }
  }

  /**
   * Update ammo display
   * @param {number} current - Current ammo in magazine
   * @param {number} max - Maximum ammo in magazine
   * @param {number} reserve - Reserve ammo count
   */
  updateAmmo(current, max, reserve = 0) {
    if (this.ammoValueElement) {
      this.ammoValueElement.textContent = current;
    }
    
    if (this.ammoMaxElement) {
      this.ammoMaxElement.textContent = `/ ${max}`;
    }
    
    // Update reserve ammo if element exists
    if (this.ammoReserveElement) {
      this.ammoReserveElement.textContent = reserve;
    }
    
    // Show warning when ammo is low
    if (this.ammoContainer) {
      if (current <= Math.ceil(max * 0.25)) {
        this.ammoContainer.classList.add('low-ammo');
      } else {
        this.ammoContainer.classList.remove('low-ammo');
      }
      
      // Show empty reserves warning
      if (reserve <= 0) {
        this.ammoContainer.classList.add('no-reserves');
      } else {
        this.ammoContainer.classList.remove('no-reserves');
      }
    }
    
    // Show reload indicator when empty
    if (this.reloadIndicator && current === 0 && reserve > 0) {
      this.showReloadIndicator();
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

  showGameOver(score) {
    if (this.gameOverElement) {
      this.gameOverElement.style.display = 'flex';
      
      if (this.finalScoreElement) {
        this.finalScoreElement.textContent = score;
      }
    }
  }

  hideGameOver() {
    if (this.gameOverElement) {
      this.gameOverElement.style.display = 'none';
    }
  }

  updatePause(isPaused) {
    // Update UI based on pause state
    if (isPaused) {
      this.showPauseMenu();
    } else {
      this.hidePauseMenu();
    }
  }

  showWaveMessage(waveNumber, subtitle) {
    // Create a wave message element if it doesn't exist
    let waveMessageElement = document.getElementById('wave-message');
    
    if (!waveMessageElement) {
      waveMessageElement = document.createElement('div');
      waveMessageElement.id = 'wave-message';
      document.body.appendChild(waveMessageElement);
    }
    
    // Set the wave message
    waveMessageElement.innerHTML = `
      <div>WAVE ${waveNumber}</div>
      ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
    `;
    waveMessageElement.style.display = 'flex';
    
    // Animate the wave message
    waveMessageElement.classList.add('show');
    
    // Hide the wave message after a delay
    setTimeout(() => {
      waveMessageElement.classList.remove('show');
      setTimeout(() => {
        waveMessageElement.style.display = 'none';
      }, 1000); // Animation duration
    }, 3000); // Display duration
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
    if (this.settingsContainer) {
      this.settingsContainer.classList.remove('hidden');
      this.updateSettings(); // Ensure UI is in sync with current settings
    }
  }
  
  // Hide settings menu
  hideSettingsMenu() {
    if (this.settingsContainer) {
      this.settingsContainer.classList.add('hidden');
    }
  }
  
  // Toggle settings menu
  toggleSettingsMenu() {
    if (this.settingsContainer) {
      if (this.settingsContainer.classList.contains('hidden')) {
        this.showSettingsMenu();
      } else {
        this.hideSettingsMenu();
      }
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
  }
  
  hidePauseMenu() {
    if (this.pauseContainer) {
      this.pauseContainer.style.display = 'none';
    }
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
  }
}
