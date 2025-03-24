/**
 * Manages the in-game tutorial system with step-by-step guidance
 */
export class TutorialManager {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.currentStepIndex = 0;
    this.completedSteps = [];
    this.skipRequested = false;
    
    // Tutorial states
    this.states = {
      INACTIVE: 'inactive',
      ACTIVE: 'active',
      COMPLETED: 'completed',
      PAUSED: 'paused'
    };
    
    this.currentState = this.states.INACTIVE;
    
    // Tutorial steps definition
    this.tutorialSteps = [
      {
        id: 'welcome',
        title: 'Welcome to Zombie Wave Shooter',
        message: 'This tutorial will guide you through the basics of the game. Press [SPACE] to continue or [ESC] to skip.',
        target: null,
        condition: () => true, // Always show this step
        action: 'press_space'
      },
      {
        id: 'movement',
        title: 'Movement Controls',
        message: 'Use [W][A][S][D] keys to move around. Try moving forward, backward, and side to side.',
        target: null,
        condition: () => this.checkMovementInput(),
        action: 'move_wasd'
      },
      {
        id: 'look',
        title: 'Look Controls',
        message: 'Move your mouse to look around. Try looking left, right, up, and down.',
        target: null,
        condition: () => this.checkLookInput(),
        action: 'look_around'
      },
      {
        id: 'sprint',
        title: 'Sprint',
        message: 'Hold [SHIFT] while moving to sprint. Try sprinting forward.',
        target: null,
        condition: () => this.checkSprintInput(),
        action: 'sprint'
      },
      {
        id: 'weapon',
        title: 'Your Weapon',
        message: 'Your weapon is shown at the bottom of the screen. You start with a pistol.',
        target: 'weapon-view',
        condition: () => true,
        action: 'press_space'
      },
      {
        id: 'shooting',
        title: 'Shooting',
        message: 'Left-click to shoot your weapon. Try shooting at the target.',
        target: null,
        condition: () => this.checkShootingInput(),
        action: 'shoot'
      },
      {
        id: 'reloading',
        title: 'Reloading',
        message: 'Press [R] to reload your weapon when low on ammo.',
        target: 'ammo-container',
        condition: () => this.checkReloadInput(),
        action: 'reload'
      },
      {
        id: 'ammo',
        title: 'Ammunition',
        message: 'Your current ammo is shown in the bottom right. The format is [CURRENT]/[MAX] ([RESERVE]).',
        target: 'ammo-container',
        condition: () => true,
        action: 'press_space'
      },
      {
        id: 'health',
        title: 'Health',
        message: 'Your health is displayed in the bottom left corner. Don\'t let it reach zero!',
        target: 'health-container',
        condition: () => true,
        action: 'press_space'
      },
      {
        id: 'zombies',
        title: 'Zombies',
        message: 'Zombies will attack in waves. Defeat all zombies in a wave to progress.',
        target: 'wave',
        condition: () => true,
        action: 'press_space'
      },
      {
        id: 'headshots',
        title: 'Headshots',
        message: 'Aim for the head to deal critical damage to zombies. Headshots are highlighted with a special hit marker.',
        target: null,
        condition: () => true,
        action: 'press_space'
      },
      {
        id: 'score',
        title: 'Score',
        message: 'Earn points by killing zombies. Headshots and quick kills increase your score multiplier.',
        target: 'score',
        condition: () => true,
        action: 'press_space'
      },
      {
        id: 'completion',
        title: 'Tutorial Complete',
        message: 'You\'ve completed the tutorial! Press [SPACE] to begin playing or access the tutorial again from the main menu.',
        target: null,
        condition: () => true,
        action: 'press_space'
      }
    ];
    
    // DOM elements for tutorial UI
    this.createTutorialUI();
    
    // Tracking variables for input detection
    this.movementInputDetected = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };
    
    this.lookInputDetected = {
      horizontal: false,
      vertical: false
    };
    
    this.sprintDetected = false;
    this.shootDetected = false;
    this.reloadDetected = false;
    
    // Bind event listeners
    this.bindEventListeners();
  }
  
  /**
   * Initialize the tutorial manager
   */
  init() {
    // Add as part of game state
    if (this.game.gameStateManager) {
      // Add TUTORIAL state to GameStateManager if needed
      if (!this.game.gameStateManager.states.TUTORIAL) {
        this.game.gameStateManager.states.TUTORIAL = 'tutorial';
        this.game.gameStateManager.stateCallbacks[this.game.gameStateManager.states.TUTORIAL] = {
          enter: this.enterTutorialState.bind(this),
          exit: this.exitTutorialState.bind(this)
        };
      }
    }
    
    // Set up UI button in main menu to start tutorial
    this.setupTutorialButton();
    
    return this;
  }
  
  /**
   * Create tutorial UI elements
   */
  createTutorialUI() {
    // Create tutorial container if it doesn't exist
    let tutorialContainer = document.getElementById('tutorial-container');
    if (!tutorialContainer) {
      tutorialContainer = document.createElement('div');
      tutorialContainer.id = 'tutorial-container';
      document.body.appendChild(tutorialContainer);
      
      // Create tutorial elements
      const tutorialBox = document.createElement('div');
      tutorialBox.id = 'tutorial-box';
      tutorialContainer.appendChild(tutorialBox);
      
      const tutorialTitle = document.createElement('div');
      tutorialTitle.id = 'tutorial-title';
      tutorialBox.appendChild(tutorialTitle);
      
      const tutorialMessage = document.createElement('div');
      tutorialMessage.id = 'tutorial-message';
      tutorialBox.appendChild(tutorialMessage);
      
      const tutorialControls = document.createElement('div');
      tutorialControls.id = 'tutorial-controls';
      tutorialBox.appendChild(tutorialControls);
      
      const skipButton = document.createElement('button');
      skipButton.id = 'tutorial-skip';
      skipButton.textContent = 'Skip Tutorial';
      tutorialControls.appendChild(skipButton);
      
      const nextButton = document.createElement('div');
      nextButton.id = 'tutorial-next';
      nextButton.textContent = 'Press SPACE to continue';
      tutorialControls.appendChild(nextButton);
      
      // Create target highlight element
      const targetHighlight = document.createElement('div');
      targetHighlight.id = 'tutorial-highlight';
      document.body.appendChild(targetHighlight);
      
      // Create progress indicator
      const progressContainer = document.createElement('div');
      progressContainer.id = 'tutorial-progress';
      tutorialContainer.appendChild(progressContainer);
      
      // Add tutorial styles
      this.addTutorialStyles();
    }
    
    // Cache DOM elements
    this.tutorialContainer = document.getElementById('tutorial-container');
    this.tutorialBox = document.getElementById('tutorial-box');
    this.tutorialTitle = document.getElementById('tutorial-title');
    this.tutorialMessage = document.getElementById('tutorial-message');
    this.tutorialControls = document.getElementById('tutorial-controls');
    this.skipButton = document.getElementById('tutorial-skip');
    this.nextButton = document.getElementById('tutorial-next');
    this.targetHighlight = document.getElementById('tutorial-highlight');
    this.progressContainer = document.getElementById('tutorial-progress');
    
    // Hide tutorial UI initially
    this.hideTutorialUI();
  }
  
  /**
   * Add tutorial CSS styles
   */
  addTutorialStyles() {
    // Check if styles already exist
    if (document.getElementById('tutorial-styles')) {
      return;
    }
    
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.id = 'tutorial-styles';
    
    // Add CSS styles
    styleElement.textContent = `
      #tutorial-container {
        position: absolute;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        width: 600px;
        z-index: 1000;
        pointer-events: none;
      }
      
      #tutorial-box {
        background-color: rgba(0, 0, 0, 0.8);
        border: 2px solid #ff4500;
        border-radius: 10px;
        padding: 20px;
        color: white;
        pointer-events: auto;
      }
      
      #tutorial-title {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #ff4500;
      }
      
      #tutorial-message {
        font-size: 18px;
        margin-bottom: 20px;
        line-height: 1.4;
      }
      
      #tutorial-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      #tutorial-skip {
        background-color: #333;
        color: white;
        border: 1px solid #666;
        border-radius: 5px;
        padding: 8px 16px;
        cursor: pointer;
        pointer-events: auto;
      }
      
      #tutorial-skip:hover {
        background-color: #555;
      }
      
      #tutorial-next {
        font-size: 16px;
        color: #cccccc;
        font-style: italic;
      }
      
      #tutorial-highlight {
        position: absolute;
        border: 3px solid #ff4500;
        border-radius: 5px;
        box-shadow: 0 0 15px rgba(255, 69, 0, 0.5);
        z-index: 999;
        pointer-events: none;
        opacity: 0.7;
        animation: pulse 1.5s infinite alternate;
      }
      
      #tutorial-progress {
        display: flex;
        justify-content: center;
        margin-top: 10px;
      }
      
      .tutorial-step-indicator {
        width: 10px;
        height: 10px;
        background-color: #555;
        border-radius: 50%;
        margin: 0 5px;
      }
      
      .tutorial-step-indicator.active {
        background-color: #ff4500;
      }
      
      .tutorial-step-indicator.completed {
        background-color: #00cc00;
      }
      
      @keyframes pulse {
        0% { opacity: 0.5; }
        100% { opacity: 0.9; }
      }
      
      .tutorial-help-button {
        margin-top: 20px;
        background-color: #ff4500;
        color: white;
        border: none;
        border-radius: 5px;
        padding: 10px 20px;
        font-size: 16px;
        cursor: pointer;
      }
      
      .tutorial-help-button:hover {
        background-color: #ff6a33;
      }
      
      #help-screen {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
        color: white;
        z-index: 1001;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 50px;
        box-sizing: border-box;
      }
      
      .help-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        max-width: 800px;
        margin-top: 30px;
      }
      
      .help-section {
        margin-bottom: 20px;
      }
      
      .help-section h3 {
        color: #ff4500;
        margin-bottom: 10px;
        border-bottom: 1px solid #555;
        padding-bottom: 5px;
      }
      
      .help-control {
        display: flex;
        margin-bottom: 10px;
      }
      
      .help-key {
        background-color: #333;
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        margin-right: 10px;
        min-width: 30px;
        text-align: center;
        font-family: monospace;
      }
      
      .help-close {
        position: absolute;
        top: 20px;
        right: 20px;
        background-color: #333;
        color: white;
        border: none;
        border-radius: 5px;
        padding: 8px 16px;
        cursor: pointer;
      }
      
      .help-close:hover {
        background-color: #555;
      }
    `;
    
    // Add style element to head
    document.head.appendChild(styleElement);
  }
  
  /**
   * Bind event listeners for tutorial interaction
   */
  bindEventListeners() {
    // Space to continue
    document.addEventListener('keydown', (event) => {
      if (this.active && event.code === 'Space' && this.getCurrentStep()?.action === 'press_space') {
        this.nextStep();
      }
      
      // Detect movement inputs for tutorial steps
      this.detectMovementInput(event);
      
      // Detect reload input
      if (event.code === 'KeyR') {
        this.reloadDetected = true;
      }
    });
    
    // Detect mouse look
    document.addEventListener('mousemove', (event) => {
      if (this.active && Math.abs(event.movementX) > 5) {
        this.lookInputDetected.horizontal = true;
      }
      if (this.active && Math.abs(event.movementY) > 5) {
        this.lookInputDetected.vertical = true;
      }
    });
    
    // Detect mouse button for shooting
    document.addEventListener('mousedown', (event) => {
      if (this.active && event.button === 0) {
        this.shootDetected = true;
      }
    });
    
    // Skip button click
    if (this.skipButton) {
      this.skipButton.addEventListener('click', () => {
        this.skipTutorial();
      });
    }
    
    // ESC to skip
    document.addEventListener('keydown', (event) => {
      if (this.active && event.key === 'Escape') {
        this.skipTutorial();
      }
    });
  }
  
  /**
   * Detect movement input for tutorial steps
   */
  detectMovementInput(event) {
    if (!this.active) return;
    
    switch (event.code) {
      case 'KeyW':
        this.movementInputDetected.forward = true;
        break;
      case 'KeyS':
        this.movementInputDetected.backward = true;
        break;
      case 'KeyA':
        this.movementInputDetected.left = true;
        break;
      case 'KeyD':
        this.movementInputDetected.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        // Also need to check if moving forward for sprint
        if (this.movementInputDetected.forward) {
          this.sprintDetected = true;
        }
        break;
    }
  }
  
  /**
   * Check if movement tutorial step is completed
   */
  checkMovementInput() {
    const { forward, backward, left, right } = this.movementInputDetected;
    return forward && backward && (left || right);
  }
  
  /**
   * Check if look tutorial step is completed
   */
  checkLookInput() {
    return this.lookInputDetected.horizontal && this.lookInputDetected.vertical;
  }
  
  /**
   * Check if sprint tutorial step is completed
   */
  checkSprintInput() {
    return this.sprintDetected;
  }
  
  /**
   * Check if shooting tutorial step is completed
   */
  checkShootingInput() {
    return this.shootDetected;
  }
  
  /**
   * Check if reload tutorial step is completed
   */
  checkReloadInput() {
    return this.reloadDetected;
  }
  
  /**
   * Set up tutorial button in main menu
   */
  setupTutorialButton() {
    // Get main menu container
    const mainMenu = document.getElementById('main-menu');
    if (!mainMenu) return;
    
    // Check if button already exists
    let tutorialButton = document.getElementById('tutorial-button');
    if (!tutorialButton) {
      // Create tutorial button
      tutorialButton = document.createElement('button');
      tutorialButton.id = 'tutorial-button';
      tutorialButton.className = 'menu-button tutorial-help-button';
      tutorialButton.textContent = 'Play Tutorial';
      
      // Find a good place to insert it (after play button)
      const playButton = document.querySelector('.menu-button[data-difficulty]');
      if (playButton && playButton.parentNode) {
        playButton.parentNode.insertBefore(tutorialButton, playButton.nextSibling);
      } else {
        // If play button not found, append to main menu
        mainMenu.appendChild(tutorialButton);
      }
      
      // Add event listener
      tutorialButton.addEventListener('click', () => {
        this.startTutorial();
      });
    }
    
    // Add help button to pause menu
    this.setupHelpButton();
  }
  
  /**
   * Set up help button in pause menu
   */
  setupHelpButton() {
    // Get pause menu container
    const pauseMenu = document.getElementById('pause-menu');
    if (!pauseMenu) return;
    
    // Check if button already exists
    let helpButton = document.getElementById('help-button');
    if (!helpButton) {
      // Create help button
      helpButton = document.createElement('button');
      helpButton.id = 'help-button';
      helpButton.className = 'pause-menu-button tutorial-help-button';
      helpButton.textContent = 'Controls & Help';
      
      // Append to pause menu
      pauseMenu.appendChild(helpButton);
      
      // Add event listener
      helpButton.addEventListener('click', () => {
        this.showHelpScreen();
      });
    }
    
    // Create help screen if it doesn't exist
    this.createHelpScreen();
  }
  
  /**
   * Create help screen with game controls
   */
  createHelpScreen() {
    // Check if help screen already exists
    let helpScreen = document.getElementById('help-screen');
    if (!helpScreen) {
      // Create help screen container
      helpScreen = document.createElement('div');
      helpScreen.id = 'help-screen';
      helpScreen.style.display = 'none';
      document.body.appendChild(helpScreen);
      
      // Create title
      const title = document.createElement('h2');
      title.textContent = 'Game Controls & Help';
      helpScreen.appendChild(title);
      
      // Create help grid
      const helpGrid = document.createElement('div');
      helpGrid.className = 'help-grid';
      helpScreen.appendChild(helpGrid);
      
      // Movement section
      const movementSection = document.createElement('div');
      movementSection.className = 'help-section';
      movementSection.innerHTML = `
        <h3>Movement Controls</h3>
        <div class="help-control"><div class="help-key">W</div><div>Move Forward</div></div>
        <div class="help-control"><div class="help-key">S</div><div>Move Backward</div></div>
        <div class="help-control"><div class="help-key">A</div><div>Move Left</div></div>
        <div class="help-control"><div class="help-key">D</div><div>Move Right</div></div>
        <div class="help-control"><div class="help-key">SHIFT</div><div>Sprint</div></div>
        <div class="help-control"><div class="help-key">MOUSE</div><div>Look Around</div></div>
      `;
      helpGrid.appendChild(movementSection);
      
      // Combat section
      const combatSection = document.createElement('div');
      combatSection.className = 'help-section';
      combatSection.innerHTML = `
        <h3>Combat Controls</h3>
        <div class="help-control"><div class="help-key">LMB</div><div>Shoot</div></div>
        <div class="help-control"><div class="help-key">R</div><div>Reload Weapon</div></div>
        <div class="help-control"><div class="help-key">1-3</div><div>Switch Weapons</div></div>
        <div class="help-control"><div class="help-key">SCROLL</div><div>Cycle Weapons</div></div>
      `;
      helpGrid.appendChild(combatSection);
      
      // Game controls section
      const gameSection = document.createElement('div');
      gameSection.className = 'help-section';
      gameSection.innerHTML = `
        <h3>Game Controls</h3>
        <div class="help-control"><div class="help-key">ESC</div><div>Pause Game</div></div>
        <div class="help-control"><div class="help-key">ALT+S</div><div>Settings Menu</div></div>
        <div class="help-control"><div class="help-key">F</div><div>Toggle Flashlight</div></div>
        <div class="help-control"><div class="help-key">H</div><div>Show this Help Screen</div></div>
      `;
      helpGrid.appendChild(gameSection);
      
      // Tips section
      const tipsSection = document.createElement('div');
      tipsSection.className = 'help-section';
      tipsSection.innerHTML = `
        <h3>Combat Tips</h3>
        <p>• Aim for the head! Headshots deal critical damage</p>
        <p>• Watch your ammo count and reload when safe</p>
        <p>• Different zombie types have different behaviors</p>
        <p>• Consecutive kills increase your score multiplier</p>
        <p>• Taking damage resets your score multiplier</p>
        <p>• Special zombies have unique abilities - be prepared!</p>
      `;
      helpGrid.appendChild(tipsSection);
      
      // Create close button
      const closeButton = document.createElement('button');
      closeButton.className = 'help-close';
      closeButton.textContent = 'Close';
      closeButton.addEventListener('click', () => {
        this.hideHelpScreen();
      });
      helpScreen.appendChild(closeButton);
      
      // Also close on ESC
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && helpScreen.style.display === 'flex') {
          this.hideHelpScreen();
          event.preventDefault(); // Prevent triggering pause menu
        }
      });
      
      // Add keyboard shortcut for help (H key)
      document.addEventListener('keydown', (event) => {
        if (event.key === 'h' || event.key === 'H') {
          if (helpScreen.style.display === 'none' || helpScreen.style.display === '') {
            this.showHelpScreen();
          } else {
            this.hideHelpScreen();
          }
        }
      });
    }
  }
  
  /**
   * Show help screen
   */
  showHelpScreen() {
    const helpScreen = document.getElementById('help-screen');
    if (helpScreen) {
      helpScreen.style.display = 'flex';
      
      // Play UI sound
      if (this.game.soundManager) {
        this.game.soundManager.playUISound('menuSelect');
      }
      
      // If game is running, pause it
      if (this.game.gameStateManager && 
          this.game.gameStateManager.currentState === this.game.gameStateManager.states.PLAYING) {
        this.game.gameStateManager.changeState(this.game.gameStateManager.states.PAUSED);
      }
    }
  }
  
  /**
   * Hide help screen
   */
  hideHelpScreen() {
    const helpScreen = document.getElementById('help-screen');
    if (helpScreen) {
      helpScreen.style.display = 'none';
      
      // Play UI sound
      if (this.game.soundManager) {
        this.game.soundManager.playUISound('menuBack');
      }
    }
  }
  
  /**
   * Start the tutorial
   */
  startTutorial() {
    // Change game state to tutorial
    if (this.game.gameStateManager) {
      this.game.gameStateManager.changeState(this.game.gameStateManager.states.TUTORIAL);
    }
    
    // Set tutorial as active
    this.active = true;
    this.currentState = this.states.ACTIVE;
    this.currentStepIndex = 0;
    this.completedSteps = [];
    
    // Reset input detection
    this.resetInputDetection();
    
    // Show tutorial UI
    this.showTutorialUI();
    
    // Update progress indicators
    this.updateProgressIndicators();
    
    // Show first step
    this.showCurrentStep();
    
    // Play sound
    if (this.game.soundManager) {
      this.game.soundManager.playUISound('menuSelect');
    }
    
    console.log('Tutorial started');
  }
  
  /**
   * Skip the tutorial
   */
  skipTutorial() {
    // Set skip flag
    this.skipRequested = true;
    
    // Hide tutorial UI
    this.hideTutorialUI();
    
    // Start normal game
    if (this.game.gameStateManager) {
      this.game.gameStateManager.changeState(this.game.gameStateManager.states.PLAYING);
    }
    
    // Play sound
    if (this.game.soundManager) {
      this.game.soundManager.playUISound('menuBack');
    }
    
    console.log('Tutorial skipped');
  }
  
  /**
   * Complete the tutorial
   */
  completeTutorial() {
    // Set state to completed
    this.currentState = this.states.COMPLETED;
    
    // Hide tutorial UI after last step
    setTimeout(() => {
      this.hideTutorialUI();
      
      // Start normal game if not already
      if (this.game.gameStateManager && 
          this.game.gameStateManager.currentState !== this.game.gameStateManager.states.PLAYING) {
        this.game.gameStateManager.changeState(this.game.gameStateManager.states.PLAYING);
      }
    }, 2000);
    
    console.log('Tutorial completed');
  }
  
  /**
   * Show the current tutorial step
   */
  showCurrentStep() {
    const currentStep = this.getCurrentStep();
    if (!currentStep) return;
    
    // Update tutorial UI with current step
    this.tutorialTitle.textContent = currentStep.title;
    this.tutorialMessage.textContent = currentStep.message;
    
    // Highlight target element if specified
    if (currentStep.target) {
      this.highlightElement(currentStep.target);
    } else {
      this.hideHighlight();
    }
    
    // Update button text based on action
    switch (currentStep.action) {
      case 'press_space':
        this.nextButton.textContent = 'Press SPACE to continue';
        break;
      case 'move_wasd':
        this.nextButton.textContent = 'Try moving with WASD keys';
        break;
      case 'look_around':
        this.nextButton.textContent = 'Try looking around with your mouse';
        break;
      case 'sprint':
        this.nextButton.textContent = 'Hold SHIFT while moving to sprint';
        break;
      case 'shoot':
        this.nextButton.textContent = 'Left-click to shoot';
        break;
      case 'reload':
        this.nextButton.textContent = 'Press R to reload';
        break;
      default:
        this.nextButton.textContent = 'Press SPACE to continue';
    }
  }
  
  /**
   * Get the current tutorial step
   */
  getCurrentStep() {
    return this.tutorialSteps[this.currentStepIndex];
  }
  
  /**
   * Advance to the next tutorial step
   */
  nextStep() {
    // Add current step to completed steps
    this.completedSteps.push(this.getCurrentStep().id);
    
    // Reset input detection for next step
    this.resetInputDetection();
    
    // Increment step index
    this.currentStepIndex++;
    
    // Check if tutorial is complete
    if (this.currentStepIndex >= this.tutorialSteps.length) {
      this.completeTutorial();
      return;
    }
    
    // Show next step
    this.showCurrentStep();
    
    // Update progress indicators
    this.updateProgressIndicators();
    
    // Play sound
    if (this.game.soundManager) {
      this.game.soundManager.playUISound('menuSelect');
    }
  }
  
  /**
   * Reset input detection variables for new step
   */
  resetInputDetection() {
    this.movementInputDetected = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };
    
    this.lookInputDetected = {
      horizontal: false,
      vertical: false
    };
    
    this.sprintDetected = false;
    this.shootDetected = false;
    this.reloadDetected = false;
  }
  
  /**
   * Update the tutorial progress indicators
   */
  updateProgressIndicators() {
    // Clear existing indicators
    this.progressContainer.innerHTML = '';
    
    // Create indicators for all steps
    this.tutorialSteps.forEach((step, index) => {
      const indicator = document.createElement('div');
      indicator.className = 'tutorial-step-indicator';
      
      // Set class based on step status
      if (index === this.currentStepIndex) {
        indicator.classList.add('active');
      } else if (this.completedSteps.includes(step.id)) {
        indicator.classList.add('completed');
      }
      
      this.progressContainer.appendChild(indicator);
    });
  }
  
  /**
   * Highlight a UI element for tutorial
   */
  highlightElement(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
      this.hideHighlight();
      return;
    }
    
    // Get element position and dimensions
    const rect = element.getBoundingClientRect();
    
    // Position the highlight
    this.targetHighlight.style.display = 'block';
    this.targetHighlight.style.left = rect.left + 'px';
    this.targetHighlight.style.top = rect.top + 'px';
    this.targetHighlight.style.width = rect.width + 'px';
    this.targetHighlight.style.height = rect.height + 'px';
  }
  
  /**
   * Hide element highlight
   */
  hideHighlight() {
    if (this.targetHighlight) {
      this.targetHighlight.style.display = 'none';
    }
  }
  
  /**
   * Show tutorial UI
   */
  showTutorialUI() {
    if (this.tutorialContainer) {
      this.tutorialContainer.style.display = 'block';
    }
  }
  
  /**
   * Hide tutorial UI
   */
  hideTutorialUI() {
    if (this.tutorialContainer) {
      this.tutorialContainer.style.display = 'none';
    }
    this.hideHighlight();
  }
  
  /**
   * Enter tutorial state callback for GameStateManager
   */
  enterTutorialState(fromState) {
    // If coming from menu, start a new game in tutorial mode
    if (fromState === this.game.gameStateManager.states.MENU) {
      // Start the game with tutorial mode
      this.game.start(true); // Pass true to indicate tutorial mode
    }
    
    // Show tutorial UI
    this.startTutorial();
    
    // Request pointer lock for player controls
    this.game.requestPointerLock();
    
    // Update UI
    if (this.game.uiManager) {
      this.game.uiManager.updateGameplayUI(true);
    }
  }
  
  /**
   * Exit tutorial state callback for GameStateManager
   */
  exitTutorialState() {
    // Hide tutorial UI
    this.hideTutorialUI();
    
    // Set tutorial as inactive
    this.active = false;
    this.currentState = this.states.INACTIVE;
  }
  
  /**
   * Update method called from game loop
   */
  update(deltaTime) {
    if (!this.active) return;
    
    // Check condition for current step
    const currentStep = this.getCurrentStep();
    if (currentStep && currentStep.condition && currentStep.condition()) {
      // If condition is met, advance to next step
      if (currentStep.action !== 'press_space') {
        this.nextStep();
      }
    }
  }
} 