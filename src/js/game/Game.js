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

export class Game {
  constructor(container, assetLoader) {
    this.container = container;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
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
      qualityLevel: 'high', // low, medium, high
      postProcessing: true,
      shadows: true,
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
    //this.scene.background = new THREE.Color(0x88ccee);
    //this.scene.fog = new THREE.FogExp2(0x88ccee, 0.02);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.shadowMap.enabled = this.settings.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Enable info logging for performance monitoring
    this.renderer.info.autoReset = false;
    this.container.appendChild(this.renderer.domElement);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
    // We'll add the camera to the pitchObject after this method returns

    // We'll initialize atmospheric effects in the init method instead of adding lights here
    
    // Add a simple ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x999999,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.receiveShadow = this.settings.shadows;
    this.scene.add(ground);
  }

  initManagers() {
    // Initialize UI manager
    this.uiManager = new UiManager(this);
    this.uiManager.init();

    // Initialize input manager
    this.inputManager = new InputManager(this);

    // Initialize level manager
    this.levelManager = new LevelManager(this);
    this.levelManager.init();

    // Initialize culling manager
    this.cullingManager = new CullingManager(this);
    this.cullingManager.init();
    
    // Initialize LOD manager
    this.lodManager = new LODManager(this);
    this.lodManager.init();

    // Initialize zombie manager
    this.zombieManager = new ZombieManager(this);
    
    // Initialize entity manager
    this.entityManager = new EntityManager(this);
    this.entityManager.init();
    
    // Initialize damage manager
    this.damageManager = new DamageManager(this, this.assetLoader);
    
    // Initialize weapon manager
    this.weaponManager = new WeaponManager(this);
    
    // Initialize scene manager
    this.sceneManager = new SceneManager(this);
    
    // Initialize city manager
    this.cityManager = new CityManager(this);
    
    // Initialize sound manager
    this.soundManager = new SoundManager(this, this.assetLoader);
    
    // Initialize game state manager
    this.gameStateManager = new GameStateManager(this);
    
    // Initialize score manager
    this.scoreManager = new ScoreManager(this);
  }

  setupEvents() {
    // Handle window resize
    window.addEventListener('resize', this.onResize.bind(this), false);

    // Setup pointer lock events
    document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this), false);
    document.addEventListener('pointerlockerror', this.onPointerLockError.bind(this), false);

    // Setup click-to-play
    const container = this.container || document.body;
    container.addEventListener('click', () => {
      // Only request pointer lock if the game is actually running
      if (!this.gameOver && !document.pointerLockElement) {
        this.requestPointerLock();
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
      if (this.paused && !this.gameOver) {
        this.unpause();
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
      this.weaponManager = new WeaponManager(this, this.player, this.assetLoader);
      this.weaponManager.init();

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

      // Initialize atmospheric effects
      this.atmosphericEffects = new AtmosphericEffects(this, this.assetLoader);
      this.atmosphericEffects.init();
      this.atmosphericEffects.setPreset('dusk');
      
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

      // Apply quality settings
      this.applyQualitySettings();

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

      // Play background music and ambient sounds when game starts
      if (this.soundManager) {
        this.soundManager.playMusic('music_menu');
        this.soundManager.playAmbient('ambient_city');
      }

      // Set up UI
      this.ui = new UI(this, this.container);
      await this.ui.init();
      
      // Set up debug UI
      if (this.ui && this.ui.setupDebugUI) {
        this.ui.setupDebugUI();
      }

      // Return for chaining
      return this;
    } catch (error) {
      console.error("Error during game initialization:", error);
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
          
          // Make sure it has a bounding box for collision detection
          if (object.geometry && !object.geometry.boundingBox) {
            object.geometry.computeBoundingBox();
          }
        }
      }
    });

    console.log('Collidable objects marked in city');
  }

  start() {
    this.running = true;
    this.paused = false;
    this.gameOver = false;
    this.score = 0;

    // Reset game state
    this.gameState = {
      status: 'playing',
      zombiesSpawned: 0,
      zombiesKilled: 0,
      wave: 1,
      score: 0,
      difficulty: this.gameState?.difficulty || 'normal'
    };

    // Reset player
    if (this.player) {
      this.player.reset();
    }

    // Reset score for new game
    if (this.scoreManager) {
      this.scoreManager.resetScore();
    }

    // Start zombie spawning
    this.zombieManager.startSpawning();
    
    // Spawn ammo pickups
    if (this.entityManager) {
      this.entityManager.spawnAmmoPickups(8);
    }

    // Reset performance monitoring
    this.performanceMonitor.reset();

    // Start game loop
    this.lastTime = performance.now();
    this.animate();
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
    // Nicht aktualisieren, wenn das Spiel pausiert oder beendet ist
    if (this.paused || this.gameOver) return;

    // Delta-Zeit berechnen
    const rawDeltaTime = this.clock.getDelta();

    // Framerate-Begrenzung anwenden
    if (this.settings.limitFPS) {
      // Minimale Zeit, die zwischen Frames vergehen sollte
      const minDeltaTime = 1 / this.settings.targetFPS;
      
      // Warten, wenn wir zu schnell sind
      if (rawDeltaTime < minDeltaTime) {
        const waitTime = (minDeltaTime - rawDeltaTime) * 1000;
        // Hier könnten wir einen setTimeout verwenden, aber das würde den Game-Loop unterbrechen
        // Stattdessen stellen wir einfach fest, dass wir zu schnell sind
        this.performanceMonitor.logFrameLimitDelay(waitTime);
        return; // Skip diesen Frame
      }
    }

    // Maximal erlaubte Delta-Zeit, um Probleme mit großen Lücken zu vermeiden (z.B. nach Tab-Wechsel)
    const deltaTime = Math.min(rawDeltaTime, 0.1);
    
    // Zeit für die FPS-Berechnung aktualisieren
    this.updateFPS(deltaTime);

    // Performance-Monitoring starten
    this.performanceMonitor.startFrame();

    // Eingaben verarbeiten
    this.performanceMonitor.startSection('input');
    if (this.inputManager) {
      this.inputManager.update(deltaTime);
    }
    this.performanceMonitor.endSection('input');

    // Physik und Bewegung aktualisieren
    this.performanceMonitor.startSection('physics');
    if (this.player) {
      this.player.update(deltaTime);
    }
    this.performanceMonitor.endSection('physics');

    // Maus-Kamera-Bewegung aktualisieren
    this.performanceMonitor.startSection('camera');
    this.updateMouseLook(deltaTime);
    this.updateCameraRecoil(deltaTime);
    this.updateCameraHeadBob(deltaTime);
    this.updateCamera();
    this.performanceMonitor.endSection('camera');
    
    // LOD-System aktualisieren
    this.performanceMonitor.startSection('lod');
    if (this.lodManager) {
      this.lodManager.update(deltaTime);
    }
    this.performanceMonitor.endSection('lod');

    // Culling aktualisieren (nach LOD, um von aktuellen LOD-Leveln zu profitieren)
    this.performanceMonitor.startSection('culling');
    if (this.cullingManager) {
      this.cullingManager.update(this.camera);
    }
    this.performanceMonitor.endSection('culling');
    
    // Entities aktualisieren
    this.performanceMonitor.startSection('entities');
    if (this.entityManager) {
      this.entityManager.update(deltaTime);
    }
    this.performanceMonitor.endSection('entities');
    
    // Zombies aktualisieren
    this.performanceMonitor.startSection('zombies');
    if (this.zombieManager) {
      this.zombieManager.update(deltaTime);
    }
    this.performanceMonitor.endSection('zombies');
    
    // Waffen aktualisieren
    this.performanceMonitor.startSection('weapons');
    if (this.weaponManager) {
      this.weaponManager.update(deltaTime);
    }
    this.performanceMonitor.endSection('weapons');
    
    // UI aktualisieren
    this.performanceMonitor.startSection('ui');
    if (this.uiManager) {
      this.uiManager.update(deltaTime);
    }
    this.performanceMonitor.endSection('ui');
    
    // Physik aktualisieren
    this.performanceMonitor.startSection('physics');
    if (this.physicsManager) {
      this.physicsManager.update(deltaTime);
    }
    this.performanceMonitor.endSection('physics');
    
    // Nachladen
    this.performanceMonitor.startSection('reload');
    if (this.inputManager && this.inputManager.isReloadPressed() && this.weaponManager) {
      this.weaponManager.reload();
    }
    this.performanceMonitor.endSection('reload');
    
    // Schiessen
    this.performanceMonitor.startSection('shooting');
    if (this.inputManager && this.inputManager.isShootPressed() && this.weaponManager) {
      this.weaponManager.shoot();
    }
    this.performanceMonitor.endSection('shooting');
    
    // Leistungsüberwachung beenden
    this.performanceMonitor.endFrame();
    
    // Nächsten Frame anfordern
    requestAnimationFrame(this.animate.bind(this));
  }

  animate() {
    // Schedule next frame
    this.frameTiming.frameId = requestAnimationFrame(this.animate.bind(this));

    // Get current time
    const now = performance.now();

    // Calculate deltaTime in seconds (cap at 100ms to avoid huge jumps)
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Store actual frame timing for performance monitor
    this.frameTiming.deltaTime = deltaTime;

    // Check if we need to limit FPS
    if (this.settings.limitFPS) {
      const frameTime = now - this.frameTiming.frameStartTime;

      // If frame processed too quickly, delay to maintain target FPS
      if (frameTime < this.frameTiming.frameTimeTarget) {
        // Skip rendering this frame and wait until next one
        return;
      }

      // Update frame start time for next limit check
      this.frameTiming.frameStartTime = now;
    }

    // Reset renderer info for new frame
    this.renderer.info.reset();

    // Update game state
    this.update(deltaTime);

    // Render scene
    this.render();
  }

  render() {
    try {
      // Only render if we have required objects
      if (!this.scene || !this.camera || !this.renderer) {
        console.warn('Cannot render: missing required objects');
        return;
      }
      
      // Validate scene objects before rendering to prevent null errors
      this.validateSceneObjects(this.scene);
      
      // Render scene with camera
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('Error during rendering:', error);
      // Try to recover by revalidating the scene
      this.validateSceneObjects(this.scene);
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

    // Default to high quality
    let shadowMapSize = 2048;
    let shadowDist = 50;
    let viewDistance = 100;
    let maxZombies = 50;
    let effectDetail = 1.0;
    let textureQuality = 'high';
    let enableOcclusionCulling = true;

    switch (qualityLevel) {
      case 'low':
        shadowMapSize = 512;
        shadowDist = 20;
        viewDistance = 40;
        maxZombies = 15;
        effectDetail = 0.3;
        textureQuality = 'low';
        enableOcclusionCulling = false; // Disabled on low-end hardware
        break;
      case 'medium':
        shadowMapSize = 1024;
        shadowDist = 35;
        viewDistance = 70;
        maxZombies = 30;
        effectDetail = 0.7;
        textureQuality = 'medium';
        enableOcclusionCulling = true;
        break;
      case 'high':
        shadowMapSize = 2048;
        shadowDist = 50;
        viewDistance = 100;
        maxZombies = 50;
        effectDetail = 1.0;
        textureQuality = 'high';
        enableOcclusionCulling = true;
        break;
      case 'ultra':
        shadowMapSize = 4096;
        shadowDist = 100;
        viewDistance = 150;
        maxZombies = 100;
        effectDetail = 1.5;
        textureQuality = 'ultra';
        enableOcclusionCulling = true;
        break;
    }

    // Apply shadow settings
    if (this.settings.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.directionalLight.castShadow = true;
      this.directionalLight.shadow.mapSize.width = shadowMapSize;
      this.directionalLight.shadow.mapSize.height = shadowMapSize;
      this.directionalLight.shadow.camera.near = 0.5;
      this.directionalLight.shadow.camera.far = shadowDist;
      this.directionalLight.shadow.camera.left = -shadowDist;
      this.directionalLight.shadow.camera.right = shadowDist;
      this.directionalLight.shadow.camera.top = shadowDist;
      this.directionalLight.shadow.camera.bottom = -shadowDist;
    } else {
      this.renderer.shadowMap.enabled = false;
      this.directionalLight.castShadow = false;
    }

    // Apply culling settings
    if (this.cullingManager) {
      this.cullingManager.setViewDistance(viewDistance);
      this.cullingManager.setEnabled(this.settings.cullingEnabled);
      
      // Update occlusion culling based on quality settings
      if (this.cullingManager.setOcclusionCullingEnabled) {
        this.cullingManager.setOcclusionCullingEnabled(enableOcclusionCulling);
      }
    }

    // Apply zombie spawn limits
    if (this.zombieManager) {
      this.zombieManager.setMaxZombies(maxZombies);
    }

    // Apply texturing quality
    if (this.texturingSystem) {
      this.texturingSystem.setQuality(textureQuality);
    }

    // Apply effect detail level
    if (this.atmosphericEffects) {
      this.atmosphericEffects.setEffectDetail(effectDetail);
    }

    // Apply quality settings to the asset manager
    if (this.assetManager) {
      this.assetManager.applyQualitySettings(this.settings.qualityLevel);
    }

    // Update LOD settings
    if (this.lodManager) {
      this.lodManager.applyQualitySettings(qualityLevel);
    }

    console.log(`Applied ${qualityLevel} quality settings`);
  }

  setFrameLimit(enabled, targetFPS = 60) {
    this.settings.limitFPS = enabled;
    this.settings.targetFPS = targetFPS;
    this.frameTiming.frameTimeTarget = 1000 / targetFPS;
  }

  dispose() {
    console.log('Disposing game resources...');

    // Stop the animation loop
    if (this.frameTiming.frameId !== null) {
      cancelAnimationFrame(this.frameTiming.frameId);
      this.frameTiming.frameId = null;
    }

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

    // Dispose of zombie manager
    if (this.zombieManager) {
      this.zombieManager.dispose();
      this.zombieManager = null;
    }

    // Dispose of entity manager
    if (this.entityManager) {
      this.entityManager.dispose();
      this.entityManager = null;
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
}