/**
 * Manages game state transitions (menu, game, pause, death)
 */
export class GameStateManager {
  constructor(game) {
    this.game = game;
    
    // Game states
    this.states = {
      MENU: 'menu',
      PLAYING: 'playing',
      PAUSED: 'paused',
      GAME_OVER: 'gameover',
      VICTORY: 'victory'
    };
    
    // Current state
    this.currentState = this.states.MENU;
    
    // State transition callbacks
    this.stateCallbacks = {
      [this.states.MENU]: {
        enter: this.enterMenuState.bind(this),
        exit: this.exitMenuState.bind(this)
      },
      [this.states.PLAYING]: {
        enter: this.enterPlayingState.bind(this),
        exit: this.exitPlayingState.bind(this)
      },
      [this.states.PAUSED]: {
        enter: this.enterPausedState.bind(this),
        exit: this.exitPausedState.bind(this)
      },
      [this.states.GAME_OVER]: {
        enter: this.enterGameOverState.bind(this),
        exit: this.exitGameOverState.bind(this)
      },
      [this.states.VICTORY]: {
        enter: this.enterVictoryState.bind(this),
        exit: this.exitVictoryState.bind(this)
      }
    };
    
    // Listen for events that might trigger state changes
    this.setupEventListeners();
  }
  
  init() {
    // Initialize with menu state
    this.changeState(this.states.MENU);
    return this;
  }
  
  /**
   * Set up event listeners for key state change events
   */
  setupEventListeners() {
    // Add event listeners for buttons
    document.addEventListener('keydown', (event) => {
      // ESC key to toggle pause
      if (event.key === 'Escape' && this.currentState === this.states.PLAYING) {
        this.changeState(this.states.PAUSED);
      } else if (event.key === 'Escape' && this.currentState === this.states.PAUSED) {
        this.changeState(this.states.PLAYING);
      }
    });
    
    // Listen for restart button click in game over screen
    const restartButton = document.getElementById('restart');
    if (restartButton) {
      restartButton.addEventListener('click', () => {
        if (this.currentState === this.states.GAME_OVER) {
          this.changeState(this.states.PLAYING);
        }
      });
    }
  }
  
  /**
   * Change to a new game state with proper transitions
   * @param {string} newState - The state to change to
   */
  changeState(newState) {
    // Don't change if already in this state
    if (this.currentState === newState) return;
    
    console.log(`Changing game state: ${this.currentState} -> ${newState}`);
    
    // Execute exit callback for current state
    if (this.stateCallbacks[this.currentState]?.exit) {
      this.stateCallbacks[this.currentState].exit();
    }
    
    // Update state
    const oldState = this.currentState;
    this.currentState = newState;
    
    // Update game.gameState status
    this.game.gameState.status = newState;
    
    // Execute enter callback for new state
    if (this.stateCallbacks[this.currentState]?.enter) {
      this.stateCallbacks[this.currentState].enter(oldState);
    }
  }
  
  /**
   * Menu state callbacks
   */
  enterMenuState(fromState) {
    // Show main menu UI
    if (this.game.uiManager) {
      this.game.uiManager.showMainMenu();
    }
    
    // Make sure pointer lock is released
    document.exitPointerLock();
    
    // Pause game systems
    this.game.running = false;
  }
  
  exitMenuState() {
    // Hide main menu
    if (this.game.uiManager) {
      this.game.uiManager.hideMainMenu();
    }
  }
  
  /**
   * Playing state callbacks
   */
  enterPlayingState(fromState) {
    // If coming from menu or game over, start fresh game
    if (fromState === this.states.MENU || fromState === this.states.GAME_OVER) {
      this.game.start();
    } 
    // If resuming from pause, just unpause
    else if (fromState === this.states.PAUSED) {
      this.game.unpause();
    }
    
    // Request pointer lock for player controls
    this.game.requestPointerLock();
    
    // Update UI
    if (this.game.uiManager) {
      this.game.uiManager.updateGameplayUI(true);
    }
  }
  
  exitPlayingState() {
    // Common actions when leaving playing state
    if (this.game.zombieManager) {
      // Don't stop spawning when pausing, only for game over/menu
      if (this.currentState !== this.states.PAUSED) {
        this.game.zombieManager.stopSpawning();
      }
    }
  }
  
  /**
   * Paused state callbacks
   */
  enterPausedState() {
    // Pause game
    this.game.paused = true;
    
    // Show pause menu
    if (this.game.uiManager) {
      this.game.uiManager.showPauseMenu();
    }
    
    // Release pointer lock
    document.exitPointerLock();
  }
  
  exitPausedState() {
    // Hide pause menu
    if (this.game.uiManager) {
      this.game.uiManager.hidePauseMenu();
    }
    
    // Unpause game
    this.game.paused = false;
  }
  
  /**
   * Game over state callbacks
   */
  enterGameOverState() {
    // Show game over UI with final score
    if (this.game.uiManager && this.game.scoreManager) {
      this.game.uiManager.showGameOver(this.game.scoreManager.currentScore);
    }
    
    // Stop all game systems
    this.game.running = false;
    
    // Release pointer lock
    document.exitPointerLock();
  }
  
  exitGameOverState() {
    // Hide game over screen
    if (this.game.uiManager) {
      this.game.uiManager.hideGameOver();
    }
    
    // Reset game over flag
    this.game.gameOver = false;
  }
  
  /**
   * Victory state callbacks
   */
  enterVictoryState() {
    // Show victory screen with game statistics
    if (this.game.uiManager && this.game.scoreManager) {
      // Get all wave stats from zombie manager
      const waveStats = this.game.zombieManager?.waveProgression.waveStats || {};
      
      // Add score statistics
      const scoreStats = this.game.scoreManager.getStats();
      
      // Show game completion screen with combined stats
      this.game.uiManager.showGameComplete({
        ...scoreStats,
        waves: waveStats
      });
    }
    
    // Stop all game systems
    this.game.running = false;
    
    // Release pointer lock
    document.exitPointerLock();
  }
  
  exitVictoryState() {
    // Hide victory screen
    if (this.game.uiManager) {
      this.game.uiManager.hideGameComplete();
    }
  }
  
  /**
   * Check if game is in a specific state
   * @param {string} state - State to check
   * @returns {boolean} True if game is in specified state
   */
  isInState(state) {
    return this.currentState === state;
  }
  
  /**
   * Update method called each frame
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    // State-specific updates can be added here
    // Currently no continuous updates needed for state management
  }
} 