export class InputManager {
  constructor(game) {
    this.game = game;
    
    // Input state
    this.keys = {};
    this.mousePosition = { x: 0, y: 0 };
    this.isMouseDown = false;
    this.mouseSensitivity = 0.005; // Erhöht von 0.002 auf 0.005 für schnellere Reaktion
    this.isPointerLocked = false;
    this.verticalLook = 0; // Initialize vertical look angle
    
    // Bind event handlers
    this.bindEvents();
  }
  
  bindEvents() {
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Mouse events
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    // Touch events for mobile
    window.addEventListener('touchstart', this.handleTouchStart.bind(this));
    window.addEventListener('touchend', this.handleTouchEnd.bind(this));
    window.addEventListener('touchmove', this.handleTouchMove.bind(this));
    
    // Pointer lock events for FPS
    document.addEventListener('click', this.requestPointerLock.bind(this));
    document.addEventListener('pointerlockchange', this.pointerLockChange.bind(this));
    document.addEventListener('pointerlockerror', this.pointerLockError.bind(this));
    
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
        // Shoot
        if (this.game.player) {
          this.game.player.shoot();
        }
        break;
        
      case 'Escape':
        // Toggle pause
        this.togglePause();
        break;
    }
  }
  
  handleKeyUp(event) {
    // Update key state
    this.keys[event.code] = false;
    
    // Update player movement
    this.updatePlayerMovement();
  }
  
  updatePlayerMovement() {
    if (!this.game.player) return;
    
    // Get movement direction from WASD/Arrow keys
    const moveX = (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) - 
                 (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);
                 
    // Umgedrehte Z-Richtung, damit W vorwärts bewegt anstatt rückwärts
    const moveZ = (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) - 
                 (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
    
    // Update player's move direction
    this.game.player.moveDirection.set(moveX, moveZ);
  }
  
  handleMouseDown(event) {
    this.isMouseDown = true;
    
    // Left click to shoot
    if (event.button === 0) {
      if (this.game.player) {
        this.game.player.shoot();
        
        // Start continuous shooting
        this.startContinuousShooting();
      }
    }
  }
  
  handleMouseUp(event) {
    this.isMouseDown = false;
    
    // Stop continuous shooting
    this.stopContinuousShooting();
  }
  
  handleMouseMove(event) {
    if (this.isPointerLocked) {
      // In FPS mode, use movementX/Y for rotation
      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;
      
      // Entferne Dämpfung für direkte Mausreaktion - typisch für Shooter
      
      if (this.game.player) {
        // Horizontal movement rotates player (y-axis)
        this.game.player.direction -= movementX * this.mouseSensitivity;
        this.game.player.container.rotation.y = this.game.player.direction;
        
        // Vertikale Bewegung für das Auf/Ab-Sehen
        this.verticalLook = Math.max(-Math.PI/2, Math.min(Math.PI/2, 
                           this.verticalLook - movementY * this.mouseSensitivity));
        
        // Aktualisiere den Spieler mit dem vertikalen Blickwinkel
        this.game.player.verticalLook = this.verticalLook;
      }
    } else {
      // Standard mouse position tracking (for non-FPS mode)
      this.mousePosition.x = event.clientX;
      this.mousePosition.y = event.clientY;
    }
  }
  
  handleTouchStart(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.mousePosition.x = touch.clientX;
      this.mousePosition.y = touch.clientY;
      this.isMouseDown = true;
      
      // Start continuous shooting
      if (this.game.player) {
        this.startContinuousShooting();
      }
    }
  }
  
  handleTouchEnd(event) {
    this.isMouseDown = false;
    
    // Stop continuous shooting
    this.stopContinuousShooting();
  }
  
  handleTouchMove(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.mousePosition.x = touch.clientX;
      this.mousePosition.y = touch.clientY;
      
      // Update player aim
      this.updatePlayerAim();
    }
  }
  
  updatePlayerAim() {
    // In FPS mode, aiming is handled directly in handleMouseMove
    if (this.isPointerLocked) return;
    
    if (!this.game.player || !this.game.camera) return;
    
    // This is the non-FPS aiming code as fallback
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const dx = this.mousePosition.x - centerX;
    const dy = this.mousePosition.y - centerY;
    
    // Calculate angle and set player direction
    const angle = Math.atan2(dy, dx);
    const worldAngle = angle;
    
    // Always update direction to follow mouse, regardless of movement
    this.game.player.direction = worldAngle;
    this.game.player.container.rotation.y = -worldAngle; // Negative due to Three.js coordinate system
  }
  
  startContinuousShooting() {
    // Clear any existing interval
    this.stopContinuousShooting();
    
    // Set up interval to shoot continuously while mouse is down
    this.shootingInterval = setInterval(() => {
      if (this.isMouseDown && this.game.player) {
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
  
  togglePause() {
    if (this.game.isGameOver) return;
    
    this.game.gameState.isPaused = !this.game.gameState.isPaused;
    
    // Update UI
    // this.game.ui.updatePause(this.game.gameState.isPaused);
  }
  
  // Pointer lock methods for FPS mouse control
  requestPointerLock() {
    // Only request if not already locked and game is not over
    if (!this.isPointerLocked && !this.game.isGameOver) {
      document.body.requestPointerLock();
    }
  }
  
  pointerLockChange() {
    this.isPointerLocked = document.pointerLockElement === document.body;
  }
  
  pointerLockError() {
    // console.error('Pointer lock error');
  }
  
  lockPointer() {
    // Request pointer lock
    document.body.requestPointerLock = document.body.requestPointerLock || 
                                       document.body.mozRequestPointerLock ||
                                       document.body.webkitRequestPointerLock;
                                       
    // Handle errors                                   
    const pointerLockError = () => {
      // console.error('Pointer lock error');
    };
    
    document.addEventListener('pointerlockerror', pointerLockError, false);
    document.addEventListener('mozpointerlockerror', pointerLockError, false);
    document.addEventListener('webkitpointerlockerror', pointerLockError, false);
    
    // Lock the pointer
    document.body.requestPointerLock();
  }
} 