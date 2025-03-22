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
    
    this.gameOverElement = document.getElementById('game-over');
    this.finalScoreElement = document.getElementById('final-score');
    this.crosshairElement = document.getElementById('crosshair');
    
    // Initialize UI
    this.updateScore(0);
    this.updateWave(1);
    this.updateHealth(100);
    this.updateAmmo(30, 30);
    this.showCrosshair(true);
  }
  
  // Update-Methode, die im Game-Loop aufgerufen wird
  update(deltaTime) {
    // Aktualisiere UI-Elemente, die kontinuierlich aktualisiert werden müssen
    if (this.game.player) {
      // Aktualisiere Gesundheit und Munition basierend auf Spielerdaten
      this.updateHealth(this.game.player.health);
      
      if (this.game.player.weapon) {
        this.updateAmmo(
          this.game.player.weapon.currentAmmo, 
          this.game.player.weapon.maxAmmo
        );
      }
    }
    
    // Aktualisiere Score basierend auf Game-State
    this.updateScore(this.game.gameState.score);
    
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
    // Health bar percentage
    const healthPercent = Math.max(0, Math.min(100, health / this.game.player.maxHealth * 100));
    
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
    if (!this.healthContainer) return;
    
    // Add and remove pulse class to create animation effect
    this.healthContainer.style.boxShadow = '0 0 10px 2px #ff0000';
    
    setTimeout(() => {
      this.healthContainer.style.boxShadow = 'none';
    }, 300);
  }
  
  updateAmmo(current, max) {
    if (this.ammoValueElement && this.ammoMaxElement && this.reloadIndicator) {
      if (typeof current === 'string' && current === 'Reloading...') {
        // Show reloading indicator
        this.ammoValueElement.style.display = 'none';
        this.ammoMaxElement.style.display = 'none';
        this.reloadIndicator.style.display = 'block';
        
        // Add reload animation
        this.animateReloading();
      } else {
        // Show ammo count
        this.ammoValueElement.style.display = 'block';
        this.ammoMaxElement.style.display = 'block';
        this.reloadIndicator.style.display = 'none';
        
        // Update ammo values
        this.ammoValueElement.textContent = current;
        this.ammoMaxElement.textContent = `/ ${max}`;
        
        // Change color based on ammo
        if (current / max <= 0.25) {
          this.ammoValueElement.style.color = '#ff3333'; // Red when low ammo
        } else {
          this.ammoValueElement.style.color = 'white';
        }
      }
    }
  }
  
  animateReloading() {
    // Implement a simple reload animation for the UI
    let dots = 0;
    const maxDots = 3;
    this.reloadAnimInterval = setInterval(() => {
      dots = (dots % maxDots) + 1;
      this.reloadIndicator.textContent = `RELOADING${''.padEnd(dots, '.')}`;
    }, 300);
    
    // Clear interval when reload completes (after weapon's reload time)
    setTimeout(() => {
      clearInterval(this.reloadAnimInterval);
    }, this.game.player.weapon.reloadTime * 1000);
  }
  
  showGameOver(score) {
    if (this.gameOverElement) {
      this.gameOverElement.style.display = 'block';
    }
    
    if (this.finalScoreElement) {
      this.finalScoreElement.textContent = `Score: ${score}`;
    }
  }
  
  hideGameOver() {
    if (this.gameOverElement) {
      this.gameOverElement.style.display = 'none';
    }
  }
  
  updatePause(isPaused) {
    // Could add a pause overlay here
    if (isPaused) {
      // Show pause overlay
    } else {
      // Hide pause overlay
    }
  }
  
  showWaveMessage(waveNumber) {
    // Create or get wave message element
    let waveMessageElement = document.getElementById('wave-message');
    if (!waveMessageElement) {
      waveMessageElement = document.createElement('div');
      waveMessageElement.id = 'wave-message';
      waveMessageElement.style.position = 'absolute';
      waveMessageElement.style.top = '50%';
      waveMessageElement.style.left = '50%';
      waveMessageElement.style.transform = 'translate(-50%, -50%)';
      waveMessageElement.style.color = '#ff0000';
      waveMessageElement.style.fontSize = '36px';
      waveMessageElement.style.fontWeight = 'bold';
      waveMessageElement.style.textShadow = '2px 2px 4px #000000';
      waveMessageElement.style.zIndex = '999';
      waveMessageElement.style.textAlign = 'center';
      waveMessageElement.style.transition = 'opacity 0.5s';
      document.body.appendChild(waveMessageElement);
    }
    
    // Set message content
    waveMessageElement.textContent = `Wave ${waveNumber}`;
    waveMessageElement.style.opacity = '1';
    
    // Hide message after 2 seconds
    setTimeout(() => {
      waveMessageElement.style.opacity = '0';
    }, 2000);
  }
  
  showCrosshair(show) {
    if (this.crosshairElement) {
      this.crosshairElement.style.display = show ? 'block' : 'none';
    }
  }
  
  // Methode, um das Fadenkreuz zu animieren, z.B. bei Schuss
  animateCrosshair() {
    if (!this.crosshairElement) return;
    
    // Speichere ursprüngliche Größe des äußeren Fadenkreuzes
    const outerCrosshair = document.getElementById('crosshair-outer');
    if (!outerCrosshair) return;
    
    // Erweitere kurz beim Schießen
    outerCrosshair.style.width = '24px';
    outerCrosshair.style.height = '24px';
    
    // Zurück zur normalen Größe nach kurzer Zeit
    setTimeout(() => {
      outerCrosshair.style.width = '20px';
      outerCrosshair.style.height = '20px';
    }, 100);
  }
} 