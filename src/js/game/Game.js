import * as THREE from 'three';
import { Player } from './entities/Player.js';
import { ZombieManager } from './managers/ZombieManager.js';
import { InputManager } from './managers/InputManager.js';
import { Map } from './world/Map.js';
import { PixelFilter } from '../utils/PixelFilter.js';
import { UI } from './ui/UI.js';
import { CullingManager } from './managers/CullingManager.js';

export class Game {
  constructor(assetLoader) {
    this.assetLoader = assetLoader;
    this.clock = new THREE.Clock();
    this.isGameOver = false;
    this.score = 0;
    this.wave = 1;
    
    // Game state
    this.gameState = {
      isPaused: false,
      score: 0,
      wave: 1,
      zombiesKilled: 0,
      zombiesSpawned: 0
    };
    
    // Wellenverarbeitung
    this.isProcessingWaveCompletion = false;
    
    // Camera smoothing
    this.cameraPosition = new THREE.Vector3();
    this.cameraLookAt = new THREE.Vector3();
    this.cameraSmoothing = 0.8; // Höherer Wert = weniger Smoothing (0-1)
    
    // FPS-Anzeige
    this.fpsCounter = {
      element: null,
      frames: 0,
      lastTime: 0,
      fps: 0,
      updateInterval: 500 // Aktualisierung alle 500ms
    };
  }
  
  init() {
    // Setup renderer
    this.setupRenderer();
    
    // Setup camera
    this.setupCamera();
    
    // Setup scene
    this.setupScene();
    
    // Setup map
    this.setupMap();
    
    // Setup player
    this.setupPlayer();
    
    // Setup zombie manager
    this.setupZombieManager();
    
    // Setup input manager
    this.setupInputManager();
    
    // Setup UI
    this.setupUI();
    
    // Setup culling manager
    this.setupCullingManager();
    
    // Setup pixel filter for retro look
    this.setupPixelFilter();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup FPS counter
    this.setupFPSCounter();
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Start the game
    this.start();
  }
  
  setupRenderer() {
    console.log("Setting up renderer...");
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, // Anti-Aliasing aktivieren für bessere Qualität
      powerPreference: 'high-performance', // Bessere Performance
      logarithmicDepthBuffer: true, // Verbessert Z-fighting bei entfernten Objekten
      precision: 'highp', // Hohe Präzision für bessere Darstellung
      stencil: true, // Aktiviere Stencil-Buffer
      depth: true, // Aktiviere Tiefenpuffer
      premultipliedAlpha: true, // Wichtig für korrekte Transparenz-Darstellung
      preserveDrawingBuffer: true // Verhindert Flackern bei transparenten Objekten
    });
    
    console.log("WebGLRenderer created");
    
    // Überprüfe, ob WebGL verfügbar ist
    try {
      const gl = this.renderer.getContext();
      console.log("WebGL context:", {
        renderer: this.renderer,
        glContext: gl ? "Available" : "Not available",
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER)
      });
    } catch (e) {
      console.error("Error checking WebGL context:", e);
    }
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    // Optimierte Schatten-Einstellungen
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap; // Weniger aufwändig als PCFSoftShadowMap
    this.renderer.shadowMap.autoUpdate = false; // Manuelles Update von Schatten
    this.renderer.shadowMap.needsUpdate = true; // Initial update
    
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; // Aktualisiert für neuere Three.js-Versionen
    this.renderer.gammaFactor = 2.2; // Standard-Gammawert
    this.renderer.setClearColor(0x87CEEB, 1); // Hintergrundfarbe explizit setzen
    this.renderer.sortObjects = true; // Aktiviere Objekt-Sortierung für korrekte Transparenz
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; // Verbesserte Farbdarstellung
    this.renderer.toneMappingExposure = 1.0;
    
    // Render-Statistiken für Performance-Diagnose
    // Verhindert fehlende Elemente aufgrund von Timeouts
    this.renderer.info.autoReset = true;
    
    // Renderer-Element zum DOM hinzufügen
    document.body.appendChild(this.renderer.domElement);
    console.log("Renderer domElement added to body", {
      domElement: this.renderer.domElement,
      width: this.renderer.domElement.width,
      height: this.renderer.domElement.height,
      style: this.renderer.domElement.style
    });
  }
  
  setupCamera() {
    // Setup perspective camera with FPS-friendly FOV
    const aspectRatio = window.innerWidth / window.innerHeight;
    
    this.camera = new THREE.PerspectiveCamera(
      75,                     // Field of view - reduziert für weniger Verzerrung
      aspectRatio,            // Aspect ratio
      0.01,                   // Near clipping plane - kleinerer Wert gegen Flickering
      500                     // Far clipping plane - reduziert für bessere Tiefenpräzision
    );
    
    // Position the camera higher and further back for initial view
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);
    
    console.log("Camera setup:", {
      position: this.camera.position.clone(),
      lookAt: new THREE.Vector3(0, 0, 0),
      fov: this.camera.fov
    });
  }
  
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // Erhöhte Helligkeit für bessere Sichtbarkeit
    this.scene.add(ambientLight);
    
    // Add directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(50, 200, 100); // Position weit oben für maximale Ausleuchtung
    directionalLight.castShadow = true;
    
    // Optimierte Schatteneinstellungen
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 10;
    directionalLight.shadow.camera.far = 400;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    
    this.scene.add(directionalLight);
    
    // Füge ein Hemisphere-Licht hinzu für realistischeres Umgebungslicht
    const hemisphereLight = new THREE.HemisphereLight(0xFFFFFF, 0x444444, 1.0);
    this.scene.add(hemisphereLight);
    
    // Optionaler Fog-Effekt (auskommentiert, kann aktiviert werden wenn gewünscht)
    // this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.01); // Subtiler Nebel für Tiefenwirkung
    
    console.log("Scene setup complete with lights", {
      ambientLight: ambientLight,
      directionalLight: directionalLight,
      hemisphereLight: hemisphereLight,
      sceneChildren: this.scene.children.length
    });
    
    // Füge Debug-Objekte hinzu, um zu testen, ob die Rendering-Pipeline funktioniert
    this.addDebugObjects();
  }
  
  // Debug-Funktion, um sicherzustellen, dass das Rendering grundsätzlich funktioniert
  addDebugObjects() {
    // Erstelle einen großen Boden für Orientierung
    const gridHelper = new THREE.GridHelper(100, 20, 0xff0000, 0x444444);
    this.scene.add(gridHelper);
    
    // Farbige Würfel in der Nähe der Kamera
    const cubeSize = 1;
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    
    // Roter Würfel bei (0,0,0)
    const redMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const redCube = new THREE.Mesh(cubeGeometry, redMaterial);
    redCube.position.set(0, 0.5, 0);
    this.scene.add(redCube);
    
    // Grüner Würfel bei (5,0,0)
    const greenMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const greenCube = new THREE.Mesh(cubeGeometry, greenMaterial);
    greenCube.position.set(5, 0.5, 0);
    this.scene.add(greenCube);
    
    // Blauer Würfel bei (0,0,5)
    const blueMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const blueCube = new THREE.Mesh(cubeGeometry, blueMaterial);
    blueCube.position.set(0, 0.5, 5);
    this.scene.add(blueCube);
    
    // Große Sphere bei (0,5,0) - sollte immer sichtbar sein
    const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
    const yellowMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const sphere = new THREE.Mesh(sphereGeometry, yellowMaterial);
    sphere.position.set(0, 3, -5);
    this.scene.add(sphere);
    
    console.log("Debug objects added to scene", {
      gridHelper: gridHelper,
      redCube: redCube, 
      greenCube: greenCube,
      blueCube: blueCube,
      sphere: sphere
    });
  }
  
  setupMap() {
    this.map = new Map(this, this.assetLoader);
    this.scene.add(this.map.container);
    
    // Debug-Informationen
    console.log("Setup map with container:", {
      mapContainerPosition: this.map.container.position,
      mapContainerRotation: this.map.container.rotation,
      mapContainerChildren: this.map.container.children.length
    });
    
    this.map.generate();
    
    // Debug nach der Map-Generierung
    console.log("Map generated:", {
      mapContainerChildren: this.map.container.children.length,
      tiles: this.map.tiles.length
    });
  }
  
  setupPlayer() {
    this.player = new Player(this, this.assetLoader);
    this.scene.add(this.player.container);
  }
  
  setupZombieManager() {
    this.zombieManager = new ZombieManager(this, this.assetLoader);
  }
  
  setupInputManager() {
    this.inputManager = new InputManager(this);
  }
  
  setupUI() {
    this.ui = new UI(this);
  }
  
  setupPixelFilter() {
    // Pixel-Filter komplett deaktiviert
    this.pixelFilter = null;
  }
  
  setupEventListeners() {
    // Game-specific event listeners
  }
  
  onWindowResize() {
    const aspectRatio = window.innerWidth / window.innerHeight;
    
    // Update camera for new aspect ratio
    this.camera.aspect = aspectRatio;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Pixel-Filter entfernt, kein resize mehr nötig
  }
  
  start() {
    this.clock.start();
    this.isGameOver = false;
    this.gameState.wave = 1;
    this.gameState.score = 0;
    this.gameState.zombiesKilled = 0;
    this.gameState.zombiesSpawned = 0;
    this.isProcessingWaveCompletion = false;
    
    // Start spawning zombies
    this.zombieManager.startNewWave(this.gameState.wave);
    
    // Update UI
    this.ui.updateWave(this.gameState.wave);
    this.ui.updateScore(this.gameState.score);
  }
  
  update() {
    if (this.isGameOver || this.gameState.isPaused) return;
    
    const deltaTime = this.clock.getDelta();
    
    // Aktualisiere Schatten nur alle 0.5 Sekunden oder wenn Spieler sich bewegt hat
    this.shadowUpdateTimer = (this.shadowUpdateTimer || 0) + deltaTime;
    if (this.shadowUpdateTimer > 0.5) {
      this.shadowUpdateTimer = 0;
      this.renderer.shadowMap.needsUpdate = true;
    }
    
    // Update player
    this.player.update(deltaTime);
    
    // Update zombies
    this.zombieManager.update(deltaTime);
    
    // Update UI
    this.ui.update(deltaTime);
    
    // Update camera
    this.updateCamera(deltaTime);
    
    // Update map (z.B. für Wasser-Animation)
    this.map.update(deltaTime);
    
    // Update culling manager
    this.cullingManager.update(deltaTime);
    
    // Check if wave is complete
    this.checkWaveCompletion();
    
    // Debug-Information für die ersten Frames
    if (this.frameCount === undefined) {
      this.frameCount = 0;
    }
    
    if (this.frameCount < 10) {
      console.log(`Frame ${this.frameCount} update:`, {
        playerPos: this.player ? this.player.container.position.clone() : null,
        cameraPos: this.camera.position.clone(),
        sceneChildren: this.scene.children.length,
        mapChildren: this.map.container.children.length
      });
      this.frameCount++;
    }
  }
  
  render() {
    // Aktualisiere FPS-Zähler
    this.updateFPSCounter();
    
    // Aktualisiere Matrizen vor dem Rendern
    this.scene.updateMatrixWorld(true);
    
    // Stelle sicher, dass der Renderer korrekt initialisiert ist
    this.renderer.clear();
    
    // Debug für die ersten Frames
    if (this.frameCount < 10) {
      console.log(`Frame ${this.frameCount} render:`, {
        cameraPosition: this.camera.position.clone(),
        cameraQuaternion: this.camera.quaternion.clone(),
        sceneBackground: this.scene.background,
        rendererInfo: this.renderer.info.render
      });
    }
    
    // Szene rendern
    this.renderer.render(this.scene, this.camera);
  }
  
  updateCamera(deltaTime) {
    if (this.player) {
      // First Person Camera - Position inside player's head
      const playerPosition = this.player.container.position;
      const playerRotation = this.player.container.rotation;
      
      // Target camera position
      const targetPosition = new THREE.Vector3(
        playerPosition.x,
        playerPosition.y + 1.6, // Eye level
        playerPosition.z
      );
      
      // Target look position
      const targetLookAt = new THREE.Vector3();
      
      // Erstelle einen Richtungsvektor für die Kamera
      // Horizontale Rotation (links/rechts)
      const directionX = Math.sin(playerRotation.y);
      const directionZ = Math.cos(playerRotation.y);
      
      // Vertikale Rotation (oben/unten) - berechne den vertikalen Versatz
      const verticalOffset = Math.tan(this.player.verticalLook);
      
      // Kombiniere horizontale und vertikale Blickrichtung
      targetLookAt.x = playerPosition.x + directionX;
      targetLookAt.y = playerPosition.y + 1.6 + verticalOffset; // Augenhöhe + vertikaler Versatz
      targetLookAt.z = playerPosition.z + directionZ;
      
      // Reduziertes Smoothing für weniger Flackern
      this.cameraPosition.lerp(targetPosition, 1.0); // Smoothing deaktiviert
      this.cameraLookAt.lerp(targetLookAt, 1.0); // Smoothing deaktiviert
      
      // Apply the position to the camera
      this.camera.position.copy(this.cameraPosition);
      this.camera.lookAt(this.cameraLookAt);
      
      // Aktualisiere die Projektionsmatrix, um sicherzustellen, dass die Kamera korrekt rendert
      this.camera.updateProjectionMatrix();
      this.camera.updateMatrixWorld();
    }
  }
  
  checkWaveCompletion() {
    // Verhindere mehrfache Wellenüberprüfungen, indem wir prüfen, ob bereits eine Wellenabschluss-Verarbeitung läuft
    if (this.isProcessingWaveCompletion) {
      return;
    }

    if (this.zombieManager.isWaveComplete()) {
      this.completeWave();
    }
  }
  
  completeWave() {
    // Increment wave
    this.gameState.wave++;
    this.isProcessingWaveCompletion = true;
    
    // Update UI
    this.ui.updateWave(this.gameState.wave);
    
    // Delay next wave
    setTimeout(() => {
      this.prepareNextWave();
    }, 3000);
  }
  
  prepareNextWave() {
    // Show wave message
    this.ui.showWaveMessage(this.gameState.wave);
    
    // Start next wave
    this.zombieManager.startNewWave(this.gameState.wave);
    
    // Reset processing flag
    this.isProcessingWaveCompletion = false;
  }
  
  addScore(points) {
    this.gameState.score += points;
    this.ui.updateScore(this.gameState.score);
  }
  
  gameOver() {
    this.isGameOver = true;
    
    // Show game over screen
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('final-score').textContent = `Score: ${this.gameState.score}`;
  }
  
  restart() {
    // Reset game state
    this.gameState = {
      isPaused: false,
      score: 0,
      wave: 1,
      zombiesKilled: 0,
      zombiesSpawned: 0
    };
    
    // Generate a new procedural map
    this.map.regenerate();
    
    // Reset player
    this.player.reset();
    
    // Clear zombies
    this.zombieManager.clearAllZombies();
    
    // Start new game
    this.start();
  }
  
  setupCullingManager() {
    // Erstelle und initialisiere den CullingManager
    this.cullingManager = new CullingManager(this);
    this.cullingManager.init();
    
    // Debug-Modus kann über URL-Parameter aktiviert werden
    if (window.location.search.includes('debug=true')) {
      this.cullingManager.setDebugMode(true);
    }
    
    console.log("Culling Manager initialized");
  }
  
  // FPS-Zähler einrichten
  setupFPSCounter() {
    // Erstelle das FPS-Anzeigeelement
    const fpsElement = document.createElement('div');
    fpsElement.id = 'fps-counter';
    fpsElement.style.position = 'fixed';
    fpsElement.style.top = '10px';
    fpsElement.style.right = '10px';
    fpsElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    fpsElement.style.color = '#0f0'; // Grüner Text
    fpsElement.style.padding = '5px 10px';
    fpsElement.style.borderRadius = '3px';
    fpsElement.style.fontFamily = 'monospace';
    fpsElement.style.fontSize = '16px';
    fpsElement.style.zIndex = '1000'; // Über allem anderen
    document.body.appendChild(fpsElement);
    
    this.fpsCounter.element = fpsElement;
    this.fpsCounter.lastTime = performance.now();
  }
  
  // FPS-Zähler aktualisieren
  updateFPSCounter() {
    // Frames zählen
    this.fpsCounter.frames++;
    
    // Aktuelle Zeit
    const currentTime = performance.now();
    const elapsed = currentTime - this.fpsCounter.lastTime;
    
    // FPS-Wert berechnen und anzeigen, wenn das Intervall erreicht ist
    if (elapsed >= this.fpsCounter.updateInterval) {
      this.fpsCounter.fps = Math.round((this.fpsCounter.frames * 1000) / elapsed);
      
      // Zusätzliche Performance-Statistiken
      let rendererStats = '';
      if (this.renderer && this.renderer.info) {
        const info = this.renderer.info;
        rendererStats = `
          <br>Geometrien: ${info.memory.geometries}
          <br>Texturen: ${info.memory.textures}
          <br>Dreiecke: ${info.render.triangles}
          <br>Calls: ${info.render.calls}
        `;
      }
      
      // FPS anzeigen
      this.fpsCounter.element.innerHTML = `FPS: ${this.fpsCounter.fps}${rendererStats}`;
      
      // Zurücksetzen
      this.fpsCounter.frames = 0;
      this.fpsCounter.lastTime = currentTime;
    }
  }
} 