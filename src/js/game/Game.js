import * as THREE from 'three';
import { Player } from './entities/Player.js';
import { ZombieManager } from './managers/ZombieManager.js';
import { InputManager } from './managers/InputManager.js';
import { Map } from './world/Map.js';
import { City } from './world/City.js';
import { PixelFilter } from '../utils/PixelFilter.js';
import { UI } from './ui/UI.js';
import { CullingManager } from './managers/CullingManager.js';
import { LODManager } from './managers/LODManager.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { AssetLoader } from '../utils/AssetLoader.js';
import { AssetManager } from '../utils/AssetManager.js';
import { UiManager } from './managers/UiManager.js';
import { LevelManager } from './managers/LevelManager.js';
import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';
import { EntityManager } from './managers/EntityManager.js';
import { TexturingSystem } from './world/TexturingSystem.js';
import { BuildingGenerator } from './world/BuildingGenerator.js';
import { AtmosphericEffects } from './world/AtmosphericEffects.js';
import { SceneManager } from './managers/SceneManager.js';
import { CityManager } from './managers/CityManager.js';
import { WeaponManager } from './managers/WeaponManager.js';
import { SoundManager } from './managers/SoundManager.js';
import { NavigationGrid } from './world/NavigationGrid.js';
import { DamageManager } from './managers/DamageManager.js';
import { GameStateManager } from './managers/GameStateManager.js';
import { ScoreManager } from './managers/ScoreManager.js';
import { RenderManager } from './managers/RenderManager.js';
import { EffectsManager } from './managers/EffectsManager.js';
import { AnimationManager } from './managers/AnimationManager.js';
import { LightingManager } from './managers/LightingManager.js';
import { DifficultyManager } from './managers/DifficultyManager.js';
import { TutorialManager } from './managers/TutorialManager.js';
import { PerformanceOptimizer } from '../utils/PerformanceOptimizer.js';

export class Game {
  constructor(container, assetLoader) {
    this.container = container;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    // Debug flag for rendering troubleshooting
    this.debugMode = true;
    
    // Save the asset loader from parameter
    this.assetLoader = assetLoader || new AssetLoader();
    
    // Create asset manager for advanced asset handling
    this.assetManager = new AssetManager(this.assetLoader, this);

    // Initialize clock for delta time calculation
    this.clock = new THREE.Clock();

    // Game properties
    this.running = false;
    this.paused = false;
    this.gameOver = false;
    this.score = 0;

    // Game state for tracking game progress and statistics
    this.gameState = {
      status: 'idle', // 'idle', 'playing', 'gameover', 'paused'
      zombiesSpawned: 0,
      zombiesKilled: 0,
      wave: 1,
      score: 0,
      difficulty: 'normal' // 'easy', 'normal', 'hard'
    };

    // Performance settings
    this.settings = {
      limitFPS: false,
      targetFPS: 60,
      frameLimitDelta: 1000 / 60, // ms per frame at 60 FPS
      cullingEnabled: true,
      qualityLevel: 'high', // low, medium, high, ultra
      postProcessing: true,
      shadows: true,
      adaptiveQuality: true  // New setting for adaptive quality
    };

    // Mouse look controls
    this.mouseLook = {
      enabled: true,
      sensitivity: 0.002, // Base sensitivity
      sensitivityMultiplier: 1.0, // User adjustable multiplier
      smoothing: true, // Whether to apply smoothing
      smoothingFactor: 0.85, // 0 = no smoothing, 1 = infinite smoothing
      inverseLookY: false, // Invert Y-axis
      currentMovement: new THREE.Vector2(0, 0), // Current smoothed movement
      rawMovement: new THREE.Vector2(0, 0) // Raw input from mouse
    };
    
    this.pitchObject = new THREE.Object3D(); // For vertical look
    this.yawObject = new THREE.Object3D(); // For horizontal look
    
    // Recoil effect
    this.recoilAmount = 0.03;
    this.recoilRecovery = 5;
    this.currentRecoil = 0;
    
    // Camera physics
    this.cameraOffset = new THREE.Vector3(0, 1.7, 0); // Eye height
    this.cameraHeadBob = {
      enabled: true,
      amplitude: 0.05,
      frequency: 10,
      value: 0,
      lastStep: 0,
    };

    // Initialize animation manager
    this.animationManager = new AnimationManager();

    // Initialize Three.js components
    this.initThree();
    
    // Add camera to pitch object
    this.pitchObject.add(this.camera);
    
    // Add objects to scene
    this.yawObject.add(this.pitchObject);
    this.scene.add(this.yawObject);

    // Initialize managers
    this.initManagers();

    // Initialize player and camera
    this.player = null;

    // Set up events
    this.setupEvents();

    // Pointer lock state
    this.pointerLocked = false;

    // FPS counter
    this.fpsCounter = {
      frames: 0,
      lastTime: 0,
      value: 0,
    };

    // Performance monitor
    this.performanceMonitor = new PerformanceMonitor(this);

    // Frame timing
    this.frameTiming = {
      lastFrameTime: 0,
      deltaTime: 0,
      frameId: null,
      frameTimeTarget: this.settings.frameLimitDelta,
      frameStartTime: 0,
    };

    // Setup game systems
    this.setupSystems();
  }

  initThree() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x333333); // Dark gray background for visibility

    // Create renderer with focus on compatibility
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
      stencil: true,
      depth: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.shadowMap.enabled = this.settings.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Enable info logging for performance monitoring
    this.renderer.info.autoReset = false;
    this.container.appendChild(this.renderer.domElement);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.1, 1000);
    // Initialize camera position higher up to see more of the scene
    this.camera.position.set(0, 5, 0);
    this.camera.lookAt(10, 0, 10);
    
    // Add default lighting until atmospheric effects are initialized
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    
    // Add a debug ground plane with bright color
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x22FF22, // Bright green for visibility
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.receiveShadow = this.settings.shadows;
    this.scene.add(ground);
    
    // Add debug sphere
    const debugSphere = new THREE.Mesh(
      new THREE.SphereGeometry(5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    debugSphere.position.set(10, 10, 10);
    this.scene.add(debugSphere);
  }

  initManagers() {
    // Create input manager
    this.inputManager = new InputManager(this);
    
    // Create scene manager
    this.sceneManager = new SceneManager(this);
    
    // Create city manager
    this.cityManager = new CityManager(this);
    
    // Create game state manager
    this.gameStateManager = new GameStateManager(this);
    
    // Create entity manager
    this.entityManager = new EntityManager(this);
    
    // Create UI manager
    this.uiManager = new UiManager(this);
    
    // Create level manager
    this.levelManager = new LevelManager(this);
    
    // Create culling manager
    this.cullingManager = new CullingManager(this);
    
    // Create LOD manager
    this.lodManager = new LODManager(this);
    
    // Weapon manager will be properly initialized in init() after player is created
    
    // Create damage manager
    this.damageManager = new DamageManager(this, this.assetLoader);
    
    // Create score manager
    this.scoreManager = new ScoreManager(this);
    
    // Create sound manager
    this.soundManager = new SoundManager(this);
    
    // Create render manager
    this.renderManager = new RenderManager(this);
    
    // Create effects manager for object pooling of visual effects
    this.effectsManager = new EffectsManager(this, this.assetLoader);
    
    // Create lighting manager for advanced lighting effects
    this.lightingManager = new LightingManager(this);
    
    // Create difficulty manager
    this.difficultyManager = new DifficultyManager(this);
    
    // Create tutorial manager
    this.tutorialManager = new TutorialManager(this);
    
    // Initialize performance optimizer
    this.performanceOptimizer = new PerformanceOptimizer(this);
  }

  setupEvents() {
    // Handle window resize
    window.addEventListener('resize', this.onResize.bind(this), false);

    // Setup pointer lock events
    document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this), false);
    document.addEventListener('pointerlockerror', this.onPointerLockError.bind(this), false);

    // Setup click-to-play
    const container = this.container || document.body;
    const clickToPlay = document.getElementById('click-to-play');
    
    if (clickToPlay) {
      clickToPlay.addEventListener('click', (event) => {
        event.preventDefault();
        
        // Make sure audio context is resumed
        if (this.soundManager && this.soundManager.audioContext) {
          this.soundManager.ensureAudioContext();
        }
        
        // Start the game if it's not already running
        if (!this.running) {
          // Show a direct render first to ensure something is visible
          if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
          }
          
          // Now proceed with game state change
          if (this.gameStateManager) {
            this.gameStateManager.changeState(this.gameStateManager.states.PLAYING);
          } else {
            this.start();
          }
        }
        
        // Request pointer lock AFTER ensuring rendering works
        setTimeout(() => {
          if (!document.pointerLockElement) {
            this.requestPointerLock();
          }
        }, 500);
      });
    }

    // Handle clicks anywhere for pointer lock when game is running
    container.addEventListener('click', () => {
      // Show something before pointer lock to ensure rendering works
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
      
      // Only request pointer lock if the game is running and not paused
      if (this.running && !this.paused && !this.gameOver && !document.pointerLockElement) {
        // Delay pointer lock slightly to ensure rendering first
        setTimeout(() => {
          this.requestPointerLock();
        }, 100);
        
        // Also ensure audio context is running
        if (this.soundManager && this.soundManager.audioContext) {
          this.soundManager.ensureAudioContext();
        }
      }
    });

    // Setup mouse movement for camera control
    document.addEventListener('mousemove', this.onMouseMove.bind(this), false);

    // Setup keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      // Escape key to pause
      if (event.key === 'Escape') {
        this.togglePause();
      }

      // Performance shortcuts - F7 to cycle quality settings
      if (event.key === 'F7') {
        this.togglePerformanceSettings();
      }
      
      // Settings shortcut - Alt+S to open settings menu
      if (event.key === 's' && event.altKey) {
        event.preventDefault();
        if (this.uiManager) {
          if (this.paused) {
            this.uiManager.showSettingsMenu();
          } else {
            // Pause game first, then show settings
            this.pause();
            this.uiManager.showSettingsMenu();
          }
        }
      }

      // Alt+L to toggle LOD debug visualization
      if (event.key === 'l' && event.altKey) {
        if (this.lodManager) {
          this.lodManager.toggleDebugVisualization();
        }
      }
    });
  }

  requestPointerLock() {
    // Request pointer lock on the renderer's canvas
    this.renderer.domElement.requestPointerLock =
      this.renderer.domElement.requestPointerLock ||
      this.renderer.domElement.mozRequestPointerLock ||
      this.renderer.domElement.webkitRequestPointerLock;

    this.renderer.domElement.requestPointerLock();
  }

  onPointerLockChange() {
    this.pointerLocked =
      document.pointerLockElement === this.renderer.domElement ||
      document.mozPointerLockElement === this.renderer.domElement ||
      document.webkitPointerLockElement === this.renderer.domElement;

    // Show/hide click-to-play overlay
    const clickToPlay = document.getElementById('click-to-play');
    if (clickToPlay) {
      clickToPlay.style.display = this.pointerLocked ? 'none' : 'flex';
    }

    // Pause/unpause game based on pointer lock
    if (this.pointerLocked) {
      if (this.paused && !this.gameOver && this.running) {
        this.unpause();
      } else if (!this.running && this.gameStateManager) {
        // Start the game if it's not running
        this.gameStateManager.changeState(this.gameStateManager.states.PLAYING);
      }
    } else {
      if (!this.paused && this.running && !this.gameOver) {
        this.pause();
      }
    }
  }

  onPointerLockError() {
    console.error('Error obtaining pointer lock');
  }

  onMouseMove(event) {
    if (!this.pointerLocked || this.paused || !this.running || !this.mouseLook.enabled) return;

    // Calculate mouse movement
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    // Store raw movement for smoothing
    this.mouseLook.rawMovement.set(
      movementX * this.mouseLook.sensitivity * this.mouseLook.sensitivityMultiplier,
      movementY * this.mouseLook.sensitivity * this.mouseLook.sensitivityMultiplier * (this.mouseLook.inverseLookY ? -1 : 1)
    );
    
    // Apply movement immediately if smoothing is disabled
    if (!this.mouseLook.smoothing) {
      this.applyMouseLook(this.mouseLook.rawMovement.x, this.mouseLook.rawMovement.y);
    }
  }
  
  updateMouseLook(deltaTime) {
    if (!this.mouseLook.enabled || !this.mouseLook.smoothing) return;
    
    // Apply smoothing to mouse movement
    this.mouseLook.currentMovement.lerp(this.mouseLook.rawMovement, 1 - this.mouseLook.smoothingFactor);
    
    // Apply the smoothed movement
    this.applyMouseLook(this.mouseLook.currentMovement.x, this.mouseLook.currentMovement.y);
    
    // Reset raw movement to prevent continued motion when mouse stops
    this.mouseLook.rawMovement.set(0, 0);
  }
  
  applyMouseLook(movementX, movementY) {
    // Apply to camera rotation
    this.yawObject.rotation.y -= movementX;
    this.pitchObject.rotation.x -= movementY;

    // Clamp vertical look angle
    this.pitchObject.rotation.x = Math.max(
      -Math.PI / 2 + 0.1, // Look straight up (with small buffer to prevent flipping)
      Math.min(Math.PI / 2 - 0.1, this.pitchObject.rotation.x) // Look straight down (with small buffer)
    );
  }

  setMouseSensitivity(value) {
    // Set sensitivity multiplier (1.0 = default, higher = more sensitive)
    this.mouseLook.sensitivityMultiplier = Math.max(0.1, Math.min(5.0, value));
    console.log(`Mouse sensitivity set to: ${this.mouseLook.sensitivityMultiplier.toFixed(2)}x`);
    
    // Update UI if available
    if (this.uiManager && this.uiManager.updateSettings) {
      this.uiManager.updateSettings();
    }
    
    return this.mouseLook.sensitivityMultiplier;
  }
  
  toggleMouseYInversion() {
    this.mouseLook.inverseLookY = !this.mouseLook.inverseLookY;
    console.log(`Mouse Y inversion: ${this.mouseLook.inverseLookY ? 'ON' : 'OFF'}`);
    
    // Update UI if available
    if (this.uiManager && this.uiManager.updateSettings) {
      this.uiManager.updateSettings();
    }
    
    return this.mouseLook.inverseLookY;
  }
  
  setMouseSmoothing(enabled, factor = null) {
    this.mouseLook.smoothing = enabled;
    
    if (factor !== null) {
      this.mouseLook.smoothingFactor = Math.max(0, Math.min(0.95, factor));
    }
    
    console.log(`Mouse smoothing: ${this.mouseLook.smoothing ? 'ON' : 'OFF'}, Factor: ${this.mouseLook.smoothingFactor.toFixed(2)}`);
    
    // Update UI if available
    if (this.uiManager && this.uiManager.updateSettings) {
      this.uiManager.updateSettings();
    }
    
    return {
      enabled: this.mouseLook.smoothing,
      factor: this.mouseLook.smoothingFactor
    };
  }

  applyCameraRecoil() {
    this.currentRecoil = this.recoilAmount;
  }

  updateCameraRecoil(deltaTime) {
    if (this.currentRecoil > 0) {
      // Apply recoil to the camera pitch
      this.pitchObject.rotation.x -= this.currentRecoil;

      // Recover from recoil
      this.currentRecoil -= this.recoilRecovery * deltaTime;
      if (this.currentRecoil < 0) {
        this.currentRecoil = 0;
      }
    }
  }

  updateCameraHeadBob(deltaTime) {
    if (!this.cameraHeadBob.enabled || !this.player) return;

    // Calculate player movement speed
    const speed = Math.sqrt(
      this.player.velocity.x * this.player.velocity.x +
        this.player.velocity.z * this.player.velocity.z
    );

    if (speed > 0.1) {
      // Calculate head bob based on movement
      this.cameraHeadBob.value += deltaTime * this.cameraHeadBob.frequency;
      const headBobOffset =
        Math.sin(this.cameraHeadBob.value) *
        this.cameraHeadBob.amplitude *
        (speed / this.player.speed);

      // Apply to camera position
      this.camera.position.y = this.cameraOffset.y + headBobOffset;
    } else {
      // Gradually return to normal position
      this.camera.position.y = this.cameraOffset.y;
    }
  }

  updateCamera() {
    if (!this.player) return;

    // Update camera position to follow player
    this.yawObject.position.copy(this.player.container.position);
    this.yawObject.position.y += this.cameraOffset.y;

    // Set camera position relative to yaw/pitch objects
    this.camera.position.set(0, 0, 0);
  }

  async init() {
    console.log("Game initialization started");
    if (this.initialized) return Promise.resolve();

    try {
      // Render a test frame immediately to check rendering works
      this.renderer.render(this.scene, this.camera);
      console.log("Initial render test successful");
      
      // Initialize asset manager first
      await this.assetManager.init();
      
      // Load assets using the asset manager
      await this.assetLoader.loadAssets();
      console.log('Assets loaded successfully');
      
      // Initialize texturing system
      this.texturingSystem = new TexturingSystem(this, this.assetLoader);
      
      // Initialize scene manager
      this.sceneManager = new SceneManager(this);
      
      // Create city manager
      this.cityManager = new CityManager(this, this.assetLoader);

      // Initialize sound manager
      this.soundManager = new SoundManager(this, this.assetLoader);
      this.soundManager.init();

      // Preload city scene assets
      await this.assetManager.preloadScene('city');

      // Create player
      this.player = new Player(this, this.assetLoader);
      this.player.init();
      this.player.setPosition(10, 0, 10);
      this.scene.add(this.player.container);

      // Initialize weapon manager
      if (!this.weaponManager) {
        this.weaponManager = new WeaponManager(this, this.player, this.assetLoader);
        this.weaponManager.init();
      }

      // Create city
      this.city = new City(this, {
        citySize: {
          width: 100,
          height: 100
        },
        buildings: {
          maxHeight: 20,
          minHeight: 5
        }
      });
      
      const cityContainer = this.city.generate();
      this.scene.add(cityContainer);
      
      // Render a frame now to verify city is visible
      this.renderer.render(this.scene, this.camera);

      // Initialize atmospheric effects
      this.atmosphericEffects = new AtmosphericEffects(this, this.assetLoader);
      this.atmosphericEffects.init();
      this.atmosphericEffects.setPreset('dusk');
      
      // Initialize lighting manager
      this.lightingManager = new LightingManager(this);
      this.lightingManager.init();
      
      // Set up building lights - get all buildings from the city
      if (this.lightingManager && cityContainer) {
        // Find building objects in the city container
        const buildings = [];
        cityContainer.traverse((object) => {
          if (object.isMesh && object.name.toLowerCase().includes('building')) {
            buildings.push(object);
          }
        });
        
        // Setup emergency lights on buildings
        if (buildings.length > 0) {
          this.lightingManager.setupBuildingLights(buildings);
        }
        
        // Find street lights in the city container
        const streetLights = [];
        cityContainer.traverse((object) => {
          if (object.isMesh && (object.name.toLowerCase().includes('light') || object.name.toLowerCase().includes('lamp'))) {
            streetLights.push(object);
          }
        });
        
        // Setup street lights
        if (streetLights.length > 0) {
          this.lightingManager.setupStreetLights(streetLights);
        }
      }
      
      // Create navigation grid for the city
      this.navigationGrid = new NavigationGrid(this);
      this.navigationGrid.generate(this.city);
      
      // Debug options for pathfinding
      this.debugPathfinding = false;

      // Position player at city start location
      const playerStartPos = this.city.getPlayerStartPosition();
      this.player.setPosition(playerStartPos.x, playerStartPos.y, playerStartPos.z);

      // Create zombie manager
      this.zombieManager = new ZombieManager(this, this.assetLoader);
      this.zombieManager.init();

      // Mark interactable and collidable objects
      this.markCollidableObjects();
      
      // Initialize UI
      this.uiManager.init();

      // Setup culling
      this.setupFrustumCulling();

      // Apply initial quality settings
      this.applyQualitySettings();
      
      // Render a frame after everything is loaded but before benchmark
      this.renderer.render(this.scene, this.camera);
      
      // Set up UI
      this.ui = new UI(this, this.container);
      await this.ui.init();
      
      // Set up debug UI
      if (this.ui && this.ui.setupDebugUI) {
        this.ui.setupDebugUI();
      }
      
      // We'll initialize audio only after user interaction
      this.setupAudioInitialization();

      // Initialize managers
      if (this.inputManager) this.inputManager.init();
      if (this.sceneManager) this.sceneManager.init();
      if (this.gameStateManager) this.gameStateManager.init();
      if (this.entityManager) this.entityManager.init();
      if (this.uiManager) this.uiManager.init();
      if (this.levelManager) this.levelManager.init();
      
      // Initialize managers that might be dependencies for others
      if (this.renderManager) this.renderManager.init();
      if (this.effectsManager) this.effectsManager.init();
      if (this.lightingManager) this.lightingManager.init();
      if (this.lodManager) this.lodManager.init();
      if (this.cullingManager) this.cullingManager.init();
      
      // Initialize managers that might depend on others
      if (this.cityManager) await this.cityManager.init();
      if (this.weaponManager) this.weaponManager.init();
      if (this.damageManager) this.damageManager.init();
      if (this.scoreManager) this.scoreManager.init();
      if (this.soundManager) this.soundManager.init();
      if (this.difficultyManager) this.difficultyManager.init();
      if (this.tutorialManager) this.tutorialManager.init();
      
      // Auto-detect optimal settings if enabled
      if (this.settings.adaptiveQuality && this.performanceOptimizer) {
        // First apply a safe default
        this.settings.qualityLevel = 'medium';
        this.applyQualitySettings();
        
        // Then run the benchmark after a longer delay to let the game fully initialize
        setTimeout(() => {
          this.performanceOptimizer.runBenchmark();
        }, 5000); // Run benchmark after 5 seconds to give time for scene to load completely
      }

      console.log('Game initialized');
      
      // Trigger a resize to ensure everything is properly sized
      this.onResize();

      // Show main menu instead of just starting the game
      if (this.gameStateManager) {
        // Game will start from the menu, not automatically
        this.running = false;
      } else {
        // Fall back to old behavior if state manager not available
        this.start();
      }
      
      // Add SoundManager initialization
      if (this.soundManager) {
        this.soundManager.init();
        // Share the audio listener with the asset loader
        if (this.soundManager.listener) {
          this.assetLoader.setAudioListener(this.soundManager.listener);
        }
      }

      // Make sure user sees the initial scene
      this.renderer.render(this.scene, this.camera);

      this.initialized = true;
      return Promise.resolve();
    } catch (error) {
      console.error("Error initializing game:", error);
      return Promise.reject(error);
    }
  }

  // Mark objects in the city as collidable for collision detection
  markCollidableObjects() {
    if (!this.city || !this.city.container) {
      console.warn('City not available for collision marking');
      return;
    }

    // Traverse city container and mark buildings/objects as collidable
    this.city.container.traverse((object) => {
      // Mark meshes as collidable
      if (object.isMesh) {
        // Check if it's a building or obstacle (not ground or decorative element)
        const isGround = object.position.y < 0.5;
        const name = object.name.toLowerCase();
        const isDecorative = name.includes('light') || name.includes('lamp') || name.includes('decoration');
        
        if (!isGround && !isDecorative) {
          object.isCollidable = true;
          
          // Make sure it has a bounding box for collision detection and valid geometry
          if (object.geometry && !object.geometry.boundingBox) {
            // Check if geometry has valid position attributes before computing bounding box
            const posAttr = object.geometry.getAttribute('position');
            if (posAttr && posAttr.count > 0) {
              // Check for NaN values in position attribute
              let hasNaN = false;
              for (let i = 0; i < Math.min(10, posAttr.count * 3); i++) {
                if (isNaN(posAttr.array[i])) {
                  hasNaN = true;
                  break;
                }
              }
              
              if (!hasNaN) {
                try {
                  object.geometry.computeBoundingBox();
                } catch (error) {
                  console.warn(`Error computing bounding box for ${object.name}:`, error);
                }
              } else {
                console.warn('Skipping bounding box computation for object with NaN in geometry:', object.name);
              }
            } else {
              console.warn('Skipping bounding box computation for object with invalid geometry:', object.name);
            }
          }
        }
      }
    });

    console.log('Collidable objects marked in city');
  }

  /**
   * Start a new game
   */
  start(tutorialMode = false) {
    console.log("Starting game", tutorialMode ? "in tutorial mode" : "");
    
    // Set game state to playing
    if (this.gameStateManager) {
      this.gameStateManager.currentState = this.gameStateManager.states.PLAYING;
      this.gameState.status = 'playing';
    }
    
    // Create a new level if needed
    if (this.levelManager) {
      this.levelManager.resetLevel();
    }
    
    // Initialize player
    this.initializePlayer();
    
    // Update UI
    if (this.uiManager) {
      this.uiManager.updateGameplayUI(true);
    }
    
    // Start zombie spawning if not in tutorial mode
    if (this.zombieManager && !tutorialMode) {
      this.zombieManager.startSpawning();
    } else if (this.zombieManager && tutorialMode) {
      // In tutorial mode, we'll start with just a few zombies for practice
      this.zombieManager.setTutorialMode(true);
    }
    
    // Update difficulty UI
    if (this.difficultyManager) {
      this.difficultyManager.updateUI();
    }
    
    console.log('Game started successfully' + (tutorialMode ? ' in tutorial mode' : ''));
  }

  // Method to initialize or reset player state
  initializePlayer() {
    if (!this.player) {
      console.warn("Player not created yet, creating now");
      this.player = new Player(this, this.assetLoader);
      this.player.init();
      this.scene.add(this.player.container);
    } else {
      // Reset player state
      console.log("Resetting player state");
      this.player.reset();
      
      // Position player at city start location if available
      if (this.city) {
        const playerStartPos = this.city.getPlayerStartPosition();
        this.player.setPosition(playerStartPos.x, playerStartPos.y, playerStartPos.z);
      } else {
        this.player.setPosition(10, 0, 10);
      }
    }
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
  }

  pause() {
    if (!this.paused) {
      this.paused = true;
      
      // We use GameStateManager now instead of directly calling UI
      // Leave this for backward compatibility
      if (!this.gameStateManager) {
        this.uiManager.showPauseMenu();
      }
    }
  }

  unpause() {
    if (this.paused) {
      this.paused = false;
      
      // We use GameStateManager now instead of directly calling UI
      // Leave this for backward compatibility
      if (!this.gameStateManager) {
        this.uiManager.hidePauseMenu();
      }
    }
  }

  togglePause() {
    this.paused = !this.paused;
    
    if (this.paused) {
      this.pause();
      
      // Pause all sounds
      if (this.soundManager) {
        this.soundManager.pauseAll();
      }
    } else {
      this.unpause();
      
      // Resume all sounds
      if (this.soundManager) {
        this.soundManager.resumeAll();
      }
    }
    
    return this.paused;
  }

  gameOverState() {
    this.gameOver = true;
    this.running = false;
    
    // Play game over music
    if (this.soundManager) {
      this.soundManager.playMusic('music_gameover', { fadeIn: true, fadeTime: 3.0 });
    }
    
    // Show game over screen
    if (this.uiManager) {
      this.uiManager.showGameOver(this.score);
    }
    
    // Release pointer lock
    document.exitPointerLock();
  }

  restart() {
    // Use state manager if available
    if (this.gameStateManager) {
      this.gameStateManager.changeState(this.gameStateManager.states.PLAYING);
    } else {
      // Fall back to old behavior
      this.gameOver = false;
      this.start();
    }
  }

  updateFPS(deltaTime) {
    // Update FPS only once per second
    this.fpsUpdateTime += deltaTime;
    
    if (this.fpsUpdateTime > 1) {
      this.fpsUpdateTime = 0;
      this.currentFPS = Math.round(1 / (deltaTime || 0.016));
      
      // Update UI if available
      if (this.ui && this.ui.updateFPSDisplay) {
        this.ui.updateFPSDisplay(this.currentFPS);
      }
    }
  }

  update(time) {
    // Calculate delta time
    const now = performance.now();
    const deltaTime = Math.min((now - this.frameTiming.lastFrameTime) / 1000, 0.1); // Cap at 100ms to prevent large jumps
    this.frameTiming.lastFrameTime = now;

    // Store raw delta for calculations that need it (like FPS counter)
    const rawDeltaTime = deltaTime;

    // Update FPS counter
    this.updateFPS(rawDeltaTime);

    // Update performance monitor
    this.performanceMonitor.update(deltaTime, this.fpsCounter.value);

    // Skip update if game is paused or over
    if (!this.running || this.paused || this.gameOver) {
      requestAnimationFrame(this.animate.bind(this));
      return;
    }

    // Update player 
    if (this.player) {
      this.player.update(deltaTime);
    }

    // Update other game systems
    if (this.zombieManager) {
      this.zombieManager.update(deltaTime);
    }

    if (this.inputManager) {
      this.inputManager.update(deltaTime);
    }

    // Update mouse look
    this.updateMouseLook(deltaTime);

    // Update recoil effect
    this.updateCameraRecoil(deltaTime);

    // Update head bobbing
    this.updateCameraHeadBob(deltaTime);

    // Update camera position
    this.updateCamera();

    // Update UI through UI manager
    if (this.uiManager) {
      this.uiManager.update(deltaTime);
    }
    
    // Update texturing system
    if (this.texturingSystem) {
      this.texturingSystem.update(deltaTime);
    }

    // Update weapon manager
    if (this.weaponManager) {
      this.weaponManager.update(deltaTime);
    }

    // Update sound manager
    if (this.soundManager) {
      this.soundManager.update(deltaTime);
    }

    // Update game state manager
    if (this.gameStateManager) {
      this.gameStateManager.update(deltaTime);
    }

    // Update culling system
    if (this.cullingManager && this.settings.cullingEnabled && this.camera) {
      // Check if camera matrices are initialized
      if (this.camera.projectionMatrix && this.camera.matrixWorldInverse) {
        this.cullingManager.update(this.camera);
      }
    }

    // Update LOD system
    if (this.lodManager) {
      this.lodManager.update(deltaTime, this.camera);
    }

    // Update entity manager
    if (this.entityManager) {
      this.entityManager.update(deltaTime);
    }

    // Update effects manager
    if (this.effectsManager) {
      this.effectsManager.update(deltaTime);
    }

    // Update atmospheric effects
    if (this.atmosphericEffects) {
      this.atmosphericEffects.update(deltaTime);
    }

    // Update lighting effects
    if (this.lightingManager) {
      this.lightingManager.update(deltaTime);
    }
    
    // Update tutorial manager
    if (this.tutorialManager) {
      this.tutorialManager.update(deltaTime);
    }

    // Update performance optimizer
    if (this.performanceOptimizer) {
      this.performanceOptimizer.update(deltaTime);
    }

    // Continue animation loop
    requestAnimationFrame(this.animate.bind(this));
  }

  animate() {
    // Request next frame
    this.frameTiming.frameId = requestAnimationFrame(this.animate.bind(this));
    
    // Calculate delta time
    const now = performance.now();
    this.frameTiming.deltaTime = (now - this.frameTiming.lastFrameTime) / 1000;
    this.frameTiming.lastFrameTime = now;
    
    // Apply frame rate limiting if enabled
    if (this.settings.limitFPS) {
      // If not enough time has passed since last frame, skip update
      const frameTime = now - this.frameTiming.frameStartTime;
      if (frameTime < this.frameTiming.frameTimeTarget) {
        return;
      }
      this.frameTiming.frameStartTime = now;
    }
    
    // Update FPS counter
    this.updateFPS(this.frameTiming.deltaTime);
    
    // Update game state if running
    if (this.running && !this.paused) {
      this.update(now);
    }
    
    // Always render - even if game is paused or not running
    // This ensures we see something during initialization
    this.render();
    
    // Update performance monitor
    if (this.performanceMonitor) {
      this.performanceMonitor.update(this.frameTiming.deltaTime);
    }
    
    // Update performance optimizer
    if (this.performanceOptimizer) {
      this.performanceOptimizer.update(this.frameTiming.deltaTime);
    }
  }

  render() {
    // Only render if the game is running or we're explicitly forcing render for debugging
    if (!this.running && !this.gameStateManager) return;

    try {
      // Direct renderer approach for maximum compatibility
      if (this.scene && this.camera && this.renderer) {
        // Force render without any post-processing or effects
        this.renderer.render(this.scene, this.camera);
        
        // If RenderManager is initialized and we're not in benchmark mode, use it
        if (this.renderManager && !this.performanceOptimizer?.config?.benchmarkEnabled) {
          this.renderManager.render(this.clock.getDelta());
        }
      } else {
        console.warn('Cannot render: missing scene, camera, or renderer');
      }
    } catch (error) {
      console.error('Error during rendering:', error);
      
      // Last resort direct render
      try {
        this.renderer.render(this.scene, this.camera);
      } catch (fallbackError) {
        console.error('Critical rendering error:', fallbackError);
      }
    }
  }

  /**
   * Validates all objects in the scene to ensure there are no null objects
   * that could cause rendering errors
   * @param {THREE.Object3D} object - The object to validate (usually the scene)
   */
  validateSceneObjects(object) {
    if (!object) return;
    
    // Create a safe copy of children to iterate through
    const children = object.children ? [...object.children] : [];
    
    // Check each child
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      
      // If the child is null or undefined, remove it
      if (!child) {
        console.warn('Removed null object from scene graph');
        object.children.splice(i, 1);
        continue;
      }
      
      // Ensure critical properties exist
      if (child.visible === null || child.visible === undefined) {
        console.warn('Fixed null visible property on scene object');
        child.visible = true;
      }
      
      // Make sure parent reference is correct
      if (child.parent !== object) {
        console.warn('Fixed incorrect parent reference in scene object');
        child.parent = object;
      }
      
      // Ensure matrix properties exist
      if (!child.matrix) {
        console.warn('Fixed missing matrix on scene object');
        child.matrix = new THREE.Matrix4();
      }
      
      if (!child.matrixWorld) {
        console.warn('Fixed missing matrixWorld on scene object');
        child.matrixWorld = new THREE.Matrix4();
      }
      
      // Fix material if it's null but needed
      if (child.isMesh && !child.material) {
        console.warn('Fixed null material on mesh');
        child.material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
      }
      
      // Check all object3D properties needed for rendering
      if (typeof child.raycast !== 'function') {
        console.warn('Fixed missing raycast method on object');
        child.raycast = function() {};
      }
      
      // Fix any issues with geometry
      if (child.isMesh && (!child.geometry || child.geometry.disposed)) {
        console.warn('Fixed null or disposed geometry on mesh');
        child.geometry = new THREE.BoxGeometry(1, 1, 1);
      }
      
      // Ensure children array exists
      if (!child.children) {
        console.warn('Fixed missing children array on object');
        child.children = [];
      }
      
      // Recursively validate the child's children
      this.validateSceneObjects(child);
    }
  }

  // Performance toggles

  togglePerformanceSettings() {
    // Cycle through quality settings
    const qualities = ['low', 'medium', 'high', 'ultra'];
    let currentIndex = qualities.indexOf(this.settings.qualityLevel);
    currentIndex = (currentIndex + 1) % qualities.length;
    this.settings.qualityLevel = qualities[currentIndex];
    
    // Apply the new settings
    this.applyQualitySettings();
    
    // Update UI if available
    if (this.uiManager) {
      this.uiManager.updateQualityUI(this.settings.qualityLevel);
    }
    
    // Re-setup systems with new quality settings
    this.setupSystems();
    
    return `Quality: ${this.settings.qualityLevel}`;
  }

  applyQualitySettings() {
    const qualityLevel = this.settings.qualityLevel;
    
    console.log(`Applying quality settings: ${qualityLevel}`);
    
    // Apply different settings based on quality level
    switch (qualityLevel) {
      case 'low':
        // Renderer settings
        this.renderer.setPixelRatio(window.devicePixelRatio > 1 ? 1 : window.devicePixelRatio);
        this.renderer.shadowMap.enabled = false;
        
        // Apply to render manager if available
        if (this.renderManager) {
          this.renderManager.applyQualityPreset('low');
        }
        
        // Apply to lighting manager if available
        if (this.lightingManager) {
          this.lightingManager.applyQualitySettings();
        }
        
        // Apply to performance optimizer if available
        if (this.performanceOptimizer) {
          this.performanceOptimizer.initializeQualityParameters();
        }
        
        // ... rest of low quality settings ...
        break;
        
      case 'medium':
        // Renderer settings
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        
        // Apply to render manager if available
        if (this.renderManager) {
          this.renderManager.applyQualityPreset('medium');
        }
        
        // Apply to lighting manager if available
        if (this.lightingManager) {
          this.lightingManager.applyQualitySettings();
        }
        
        // Apply to performance optimizer if available
        if (this.performanceOptimizer) {
          this.performanceOptimizer.initializeQualityParameters();
        }
        
        // ... rest of medium quality settings ...
        break;
        
      case 'high':
        // Renderer settings
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Apply to render manager if available
        if (this.renderManager) {
          this.renderManager.applyQualityPreset('high');
        }
        
        // Apply to lighting manager if available
        if (this.lightingManager) {
          this.lightingManager.applyQualitySettings();
        }
        
        // Apply to performance optimizer if available
        if (this.performanceOptimizer) {
          this.performanceOptimizer.initializeQualityParameters();
        }
        
        // ... rest of high quality settings ...
        break;
        
      case 'ultra':
        // Renderer settings
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Apply to render manager if available
        if (this.renderManager) {
          this.renderManager.applyQualityPreset('ultra');
        }
        
        // Apply to lighting manager if available
        if (this.lightingManager) {
          this.lightingManager.applyQualitySettings();
        }
        
        // Apply to performance optimizer if available
        if (this.performanceOptimizer) {
          this.performanceOptimizer.initializeQualityParameters();
        }
        
        // ... rest of ultra quality settings ...
        break;
    }
    
    // Force renderer to update
    this.onResize();
    
    // ... rest of applyQualitySettings method ...
  }

  setFrameLimit(enabled, targetFPS = 60) {
    this.settings.limitFPS = enabled;
    this.settings.targetFPS = targetFPS;
    this.frameTiming.frameTimeTarget = 1000 / targetFPS;
  }

  dispose() {
    console.log('Disposing game resources...');
    
    // Stop animation loop
    if (this.frameTiming.frameId !== null) {
      cancelAnimationFrame(this.frameTiming.frameId);
      this.frameTiming.frameId = null;
    }
    
    // Dispose of managers
    if (this.inputManager) this.inputManager.dispose();
    if (this.sceneManager) this.sceneManager.dispose();
    if (this.entityManager) this.entityManager.dispose();
    if (this.zombieManager) this.zombieManager.dispose();
    if (this.weaponManager) this.weaponManager.dispose();
    if (this.uiManager) this.uiManager.dispose();
    if (this.levelManager) this.levelManager.dispose();
    if (this.cullingManager) this.cullingManager.dispose();
    if (this.lodManager) this.lodManager.dispose();
    if (this.damageManager) this.damageManager.dispose();
    if (this.scoreManager) this.scoreManager.dispose();
    if (this.gameStateManager) this.gameStateManager.dispose();
    if (this.soundManager) this.soundManager.dispose();
    if (this.renderManager) this.renderManager.dispose();
    if (this.effectsManager) this.effectsManager.dispose();
    if (this.lightingManager) this.lightingManager.dispose();
    if (this.animationManager) this.animationManager.dispose();
    if (this.difficultyManager) this.difficultyManager.dispose();
    if (this.tutorialManager) this.tutorialManager.dispose();
    if (this.performanceOptimizer) this.performanceOptimizer.dispose();
    
    // Dispose atmospheric effects
    if (this.atmosphericEffects) {
      this.atmosphericEffects.dispose();
      this.atmosphericEffects = null;
    }

    // Dispose of city resources
    if (this.city) {
      this.city.dispose();
      this.city = null;
    }

    // Dispose of player resources
    if (this.player) {
      this.player.dispose();
      this.player = null;
    }

    // Remove event listeners
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('pointerlockerror', this.onPointerLockError);
    document.removeEventListener('mousemove', this.onMouseMove);

    console.log('Game resources disposed');
  }

  // Setup game systems
  setupSystems() {
    // Setup culling
    if (!this.frustum) {
      this.setupFrustumCulling();
    }

    // Setup or update object data for efficient rendering and culling
    if (this.cullingManager) {
      // Initialize occluders list (mainly buildings)
      this.scene.traverse((object) => {
        if (object.isMesh && object.userData && object.userData.type === 'building') {
          object.isOccluder = true;
        }
      });

      // Refresh culling manager
      this.cullingManager.identifyOccluders();
      
      // Enable occlusion culling based on quality settings
      const enableOcclusion = this.settings.qualityLevel !== 'low';
      if (this.cullingManager.setOcclusionCullingEnabled) {
        this.cullingManager.setOcclusionCullingEnabled(enableOcclusion);
      }
    }

    // Setup user interface if needed
    if (this.ui) {
      this.ui.setupDebugUI();
    }
  }
  
  // Setup frustum culling for performance optimization
  setupFrustumCulling() {
    this.frustum = new THREE.Frustum();
    this.frustumMatrix = new THREE.Matrix4();
  }

  // Update frustum for culling
  updateFrustum() {
    if (!this.camera) return;
    
    // Update the frustum culling matrix
    this.frustumMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.frustumMatrix);
  }

  /**
   * Toggle pathfinding debug visualization
   * Shows/hides the navigation grid and zombie paths
   */
  togglePathfindingDebug() {
    this.debugPathfinding = !this.debugPathfinding;
    
    // Toggle navigation grid visualization
    if (this.navigationGrid) {
      this.navigationGrid.toggleDebug();
    }
    
    // Refresh zombie path visualization
    if (this.zombieManager && this.zombieManager.zombies) {
      for (const zombie of this.zombieManager.zombies) {
        if (this.debugPathfinding) {
          zombie.visualizePath();
        } else {
          // Clear visualization
          for (const marker of zombie.debugPathMarkers) {
            this.scene.remove(marker);
          }
          
          if (zombie.debugPathLine) {
            this.scene.remove(zombie.debugPathLine);
          }
          
          zombie.debugPathMarkers = [];
          zombie.debugPathLine = null;
        }
      }
    }
    
    console.log(`Pathfinding debug ${this.debugPathfinding ? 'enabled' : 'disabled'}`);
    return this.debugPathfinding;
  }

  /**
   * Apply damage to the player
   * @param {number} amount - Amount of damage to apply
   * @param {THREE.Vector3} sourcePosition - Position where damage came from
   */
  applyPlayerDamage(amount, sourcePosition) {
    if (!this.player || this.gameOver) return;
    
    // Apply damage to player
    this.player.applyDamage(amount);
    
    // Show damage indicator in UI
    if (this.uiManager) {
      this.uiManager.showHealthChange(-amount);
      this.uiManager.updateHealth(this.player.health, this.player.maxHealth);
      
      // Show directional indicator if source position provided
      if (sourcePosition) {
        this.uiManager.showDamageIndicator(sourcePosition);
      }
      
      // Add screen shake proportional to damage
      this.uiManager.addScreenShake(amount * 0.2);
    }
    
    // Track damage in difficulty manager
    if (this.difficultyManager) {
      this.difficultyManager.recordDamageReceived(amount);
    }
    
    // Update score multiplier - taking damage reduces multiplier
    if (this.scoreManager) {
      this.scoreManager.reduceMultiplier();
    }
    
    // Check for death
    if (this.player.health <= 0) {
      this.playerDeath();
    }
  }

  /**
   * Handle player death
   */
  playerDeath() {
    console.log('Player died');
    
    // Set game over state
    this.gameOver = true;
    
    // Notify difficulty manager
    if (this.difficultyManager) {
      this.difficultyManager.recordPlayerDeath();
    }
    
    // Stop zombie spawning
    if (this.zombieManager) {
      this.zombieManager.stopSpawning();
    }
    
    // Change game state
    if (this.gameStateManager) {
      this.gameStateManager.changeState(this.gameStateManager.states.GAME_OVER);
    }
  }

  setupAudioInitialization() {
    if (!this.soundManager || !this.soundManager.audioContext) return;
    
    // Function to start audio
    const startAudio = () => {
      // Resume AudioContext
      if (this.soundManager.audioContext.state === 'suspended') {
        this.soundManager.audioContext.resume().then(() => {
          console.log('AudioContext resumed successfully');
          
          // Play background music and ambient sounds
          try {
            this.soundManager.playMusic('music_menu');
            this.soundManager.playAmbient('ambient_city');
          } catch (error) {
            console.error('Error playing audio:', error);
          }
        }).catch(err => {
          console.error('Failed to resume AudioContext:', err);
        });
      } else {
        // AudioContext is already running
        try {
          this.soundManager.playMusic('music_menu');
          this.soundManager.playAmbient('ambient_city');
        } catch (error) {
          console.error('Error playing audio:', error);
        }
      }
      
      // Remove event listeners once audio is started
      document.removeEventListener('click', startAudio);
      document.removeEventListener('keydown', startAudio);
      document.removeEventListener('touchstart', startAudio);
    };
    
    // Add event listeners for user interaction
    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);
    document.addEventListener('touchstart', startAudio);
    
    console.log('Audio will start after user interaction');
  }
}