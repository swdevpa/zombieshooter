export class UI {
  constructor(game) {
    this.game = game;
    
    // UI elements
    this.scoreElement = document.getElementById('score');
    this.waveElement = document.getElementById('wave');
    this.healthElement = document.getElementById('health');
    this.ammoElement = document.getElementById('ammo');
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
    if (this.healthElement) {
      this.healthElement.textContent = `Health: ${health}`;
    }
  }
  
  updateAmmo(current, max) {
    if (this.ammoElement) {
      if (typeof current === 'string') {
        // For "Reloading..." message
        this.ammoElement.textContent = current;
      } else {
        this.ammoElement.textContent = `Ammo: ${current}/${max}`;
      }
    }
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