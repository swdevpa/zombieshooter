export class InputManager {
  constructor(game) {
    this.game = game;

    // Input state
    this.keys = {};
    this.mousePosition = { x: 0, y: 0 };
    this.isMouseDown = false;
    this.isShooting = false;
    this.shootingInterval = null;

    // Bind event handlers
    this.bindEvents();
  }

  bindEvents() {
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Mouse events for shooting
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Mouse wheel for weapon switching
    window.addEventListener('wheel', this.handleMouseWheel.bind(this));

    // Prevent context menu on right click
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handleKeyDown(event) {
    // Store key state
    this.keys[event.code] = true;

    // Update player movement
    this.updatePlayerMovement();

    // Special key handlers
    switch (event.code) {
      case 'KeyR':
        // Reload weapon
        if (this.game.player) {
          this.game.player.reload();
        }
        break;

      case 'Space':
        // Alternative shoot method with spacebar
        if (this.game.player) {
          this.game.player.shoot();
        }
        break;
        
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
        // Switch weapons with number keys
        if (this.game.player && this.game.player.weaponManager) {
          const weaponIndex = parseInt(event.code.replace('Digit', '')) - 1;
          this.game.player.weaponManager.equipWeapon(weaponIndex);
        }
        break;
        
      case 'KeyQ':
        // Previous weapon
        if (this.game.player) {
          this.game.player.previousWeapon();
        }
        break;
        
      case 'KeyE':
        // Next weapon
        if (this.game.player) {
          this.game.player.nextWeapon();
        }
        break;
        
      case 'KeyT':
        // Toggle debug visibility
        if (this.game.player && this.game.player.collisionMesh) {
          this.game.player.collisionMesh.visible = !this.game.player.collisionMesh.visible;
        }
        break;
        
      case 'KeyP':
        // Toggle pause with P key
        if (!event.altKey && this.game.togglePause) {
          this.game.togglePause();
        }
        
        // Toggle pathfinding debug with Alt+P
        if (event.altKey && this.game.togglePathfindingDebug) {
          this.game.togglePathfindingDebug();
        }
        break;
        
      case 'KeyB':
        // Toggle boundary visibility with B key
        if (this.game.city) {
          if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
            // Shift+B to toggle boundary debug mode
            const isDebugEnabled = this.game.city.toggleBoundaryDebug();
            console.log(`Boundary debug mode: ${isDebugEnabled ? 'enabled' : 'disabled'}`);
          } else {
            // B to toggle boundary visibility
            const isVisible = this.game.city.toggleBoundaryVisibility();
            console.log(`Boundaries: ${isVisible ? 'visible' : 'hidden'}`);
          }
        }
        break;
    }
  }

  handleKeyUp(event) {
    // Update key state
    this.keys[event.code] = false;

    // Update player movement
    this.updatePlayerMovement();
  }
  
  handleMouseWheel(event) {
    // Only handle if game is running and not paused
    if (!this.game.running || this.game.paused || !this.game.pointerLocked) return;
    
    // Switch weapons with mouse wheel
    if (this.game.player) {
      if (event.deltaY < 0) {
        // Scroll up - previous weapon
        this.game.player.previousWeapon();
      } else if (event.deltaY > 0) {
        // Scroll down - next weapon
        this.game.player.nextWeapon();
      }
    }
  }

  updatePlayerMovement() {
    if (!this.game.player) return;

    // Get movement direction from WASD/Arrow keys
    const moveX =
      (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) -
      (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);

    const moveZ =
      (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) -
      (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);

    // Update player's move direction (relative to camera will be handled in player movement code)
    this.game.player.moveDirection.set(moveX, moveZ);
  }

  handleMouseDown(event) {
    // Only handle actions if the game is running and pointer is locked
    if (!this.game.pointerLocked || this.game.paused || !this.game.running) return;

    // Left click to shoot
    if (event.button === 0) {
      this.isMouseDown = true;
      if (this.game.player) {
        this.isShooting = true;
        this.game.player.shoot();

        // Start continuous shooting
        this.startContinuousShooting();
      }
    }
    
    // Right click for alternate action (e.g., aim, melee, etc.)
    if (event.button === 2) {
      // Placeholder for future functionality
      // For example: this.game.player.performAlternateAction();
    }
  }

  handleMouseUp(event) {
    // Left click released
    if (event.button === 0) {
      this.isMouseDown = false;
      this.isShooting = false;
      this.stopContinuousShooting();
    }
  }

  startContinuousShooting() {
    // Clear any existing interval
    this.stopContinuousShooting();

    // Set up interval to shoot continuously while mouse is down
    this.shootingInterval = setInterval(() => {
      if (this.isShooting && this.game.player && this.game.pointerLocked && !this.game.paused) {
        this.game.player.shoot();
      }
    }, 100); // Shoot every 100ms
  }

  stopContinuousShooting() {
    if (this.shootingInterval) {
      clearInterval(this.shootingInterval);
      this.shootingInterval = null;
    }
  }

  // Called by the game loop to update inputs
  update(deltaTime) {
    // Nothing to do here for now, since inputs are event-driven
  }
}
