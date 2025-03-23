import { UI } from '../ui/UI.js';

export class UiManager {
  constructor(game) {
    this.game = game;
    this.ui = null;
  }

  init() {
    // Initialize the UI
    this.ui = new UI(this.game);
    return this;
  }

  update(deltaTime) {
    if (this.ui) {
      this.ui.update(deltaTime);
    }
  }

  // Health UI
  updateHealth(health) {
    if (this.ui) {
      this.ui.updateHealth(health);
    }
  }

  // Ammo UI
  updateAmmo(current, max, reserve = 0) {
    if (this.ui) {
      this.ui.updateAmmo(current, max, reserve);
    }
  }

  // Score UI
  updateScore(score) {
    if (this.ui) {
      this.ui.updateScore(score);
    }
  }

  // Wave UI
  updateWave(wave) {
    if (this.ui) {
      this.ui.updateWave(wave);
    }
  }

  showWaveMessage(waveNumber) {
    if (this.ui) {
      this.ui.showWaveMessage(waveNumber);
    }
  }

  /**
   * Show wave message with subtitle
   * @param {string} message - The main wave message
   * @param {string} subtitle - The subtitle message
   */
  showWaveMessage(message, subtitle) {
    if (this.ui) {
      this.ui.showWaveMessage(message, subtitle);
    }
  }

  /**
   * Show wave complete message
   * @param {number} waveNumber - The completed wave number
   */
  showWaveComplete(waveNumber) {
    if (this.ui) {
      this.ui.showWaveComplete(waveNumber);
    }
  }

  /**
   * Show boss wave message
   * @param {number} waveNumber - The boss wave number
   * @param {string} subtitle - Subtitle for the wave
   */
  showBossWave(waveNumber, subtitle) {
    if (this.ui) {
      this.ui.showBossWave(waveNumber, subtitle);
    }
  }

  /**
   * Show wave message
   * @param {number} waveNumber - The wave number
   * @param {string} subtitle - Subtitle for the wave
   */
  showWaveMessage(waveNumber, subtitle) {
    if (this.ui) {
      this.ui.showWaveMessage(waveNumber, subtitle);
    }
  }

  /**
   * Show game completion screen with statistics
   * @param {object} waveStats - Statistics for all completed waves
   */
  showGameComplete(waveStats) {
    if (this.ui) {
      this.ui.showGameComplete(waveStats);
    }
  }

  /**
   * Show bonus message
   * @param {string} message - The main message
   * @param {string} details - Additional details
   */
  showBonusMessage(message, details) {
    if (this.ui) {
      this.ui.showBonusMessage(message, details);
    }
  }

  // Game state UI
  showGameOver(score) {
    if (this.ui) {
      this.ui.showGameOver(score);
    }
  }

  hideGameOver() {
    if (this.ui) {
      this.ui.hideGameOver();
    }
  }

  updatePause(isPaused) {
    if (this.ui) {
      this.ui.updatePause(isPaused);
    }
  }

  // FPS display
  updateFPS(fps) {
    if (this.ui) {
      this.ui.updateFPS(fps);
    } else {
      // Fallback if UI isn't initialized
      console.log(`FPS: ${fps}`);
    }
  }

  // Pause menu
  showPauseMenu() {
    if (this.ui) {
      this.ui.showPauseMenu();
    } else {
      console.log('Pause menu shown');
    }
  }

  hidePauseMenu() {
    if (this.ui) {
      this.ui.hidePauseMenu();
    } else {
      console.log('Pause menu hidden');
    }
  }

  // Game over menu
  showGameOverMenu(score) {
    if (this.ui) {
      this.ui.showGameOver(score);
    }
  }

  // Crosshair management
  showCrosshair(show) {
    if (this.ui) {
      this.ui.showCrosshair(show);
    }
  }

  animateCrosshair() {
    if (this.ui) {
      this.ui.animateCrosshair();
    }
  }
  
  // Settings UI
  updateSettings() {
    if (this.ui) {
      this.ui.updateSettings();
    }
  }
  
  showSettingsMenu() {
    if (this.ui) {
      this.ui.showSettingsMenu();
    }
  }
  
  hideSettingsMenu() {
    if (this.ui) {
      this.ui.hideSettingsMenu();
    }
  }

  /**
   * Update UI with current weapon info
   */
  updateUI() {
    if (!this.game.uiManager || !this.currentWeapon) return;
    
    // Update ammo display
    this.game.uiManager.updateAmmo(
      this.currentWeapon.currentAmmo, 
      this.currentWeapon.ammoCapacity
    );
    
    // You could add additional UI elements to show reload status
    // For example:
    if (this.currentWeapon.isReloading) {
      this.game.uiManager.showReloadIndicator();
    } else {
      this.game.uiManager.hideReloadIndicator();
    }
  }

  // Add reload indicator methods
  showReloadIndicator() {
    if (this.ui) {
      this.ui.showReloadIndicator();
    }
  }
  
  hideReloadIndicator() {
    if (this.ui) {
      this.ui.hideReloadIndicator();
    }
  }
  
  animateReloading() {
    if (this.ui) {
      this.ui.animateReloading();
    }
  }

  /**
   * Show no ammo indicator
   */
  showNoAmmoIndicator() {
    if (this.ui) {
      this.ui.showNoAmmoIndicator();
    }
  }

  /**
   * Hide no ammo indicator
   */
  hideNoAmmoIndicator() {
    if (this.ui) {
      this.ui.hideNoAmmoIndicator();
    }
  }

  /**
   * Show ammo pickup indicator
   * @param {number} amount - Amount of ammo picked up
   */
  showAmmoPickupIndicator(amount) {
    if (this.ui) {
      this.ui.showAmmoPickupIndicator(amount);
    }
  }

  // Hit indicator methods
  showHitMarker() {
    if (this.ui) {
      this.ui.showHitMarker();
    }
  }
  
  showCriticalHitMarker() {
    if (this.ui) {
      this.ui.showCriticalHitMarker();
    }
  }
  
  showKillMarker() {
    if (this.ui) {
      this.ui.showKillMarker();
    }
  }
}
