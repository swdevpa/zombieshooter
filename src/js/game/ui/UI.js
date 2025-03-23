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
        });
      });
    }
    
    // Ensure main menu is hidden at startup
    this.hideMainMenu();
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
}
