import * as THREE from 'three';
import { Player } from './entities/Player.js';
import { ZombieManager } from './managers/ZombieManager.js';
import { InputManager } from './managers/InputManager.js';
import { Map } from './world/Map.js';
import { PixelFilter } from '../utils/PixelFilter.js';
import { UI } from './ui/UI.js';

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
    
    // Sichtbarkeits-Optimierung
    this.viewDistance = 50; // Sichtweite in Spieleinheiten
    this.cullingEnabled = true; // Culling aktivieren/deaktivieren
    this.lastPlayerPosition = new THREE.Vector3(); // Letzte Position für Culling-Updates
    this.cullingUpdateThreshold = 5; // Minimale Bewegung für Culling-Update
    this.cullingUpdateFrequency = 0.2; // Sekunden zwischen Culling-Updates
    this.cullingTimer = 0; // Timer für Culling-Updates
    this.visibleTiles = new Set(); // Set der aktuell sichtbaren Tiles
    
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
    
    document.body.appendChild(this.renderer.domElement);
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
    
    // Position will be set in updateCamera method
    this.camera.position.set(0, 1.6, 0);
    this.camera.lookAt(0, 1.6, -1);
  }
  
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Erhöhte Ambient-Helligkeit für weniger Schattenkomplexität
    this.scene.add(ambientLight);
    
    // Add directional light with shadows for 3D effect
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6); // Reduzierte Intensität
    directionalLight.position.set(50, 200, 100);
    directionalLight.castShadow = true;
    
    // Optimierte Schatten-Einstellungen für bessere Performance
    directionalLight.shadow.mapSize.width = 1024; // Reduzierte Auflösung von 2048 auf 1024
    directionalLight.shadow.mapSize.height = 1024; // Reduzierte Auflösung von 2048 auf 1024
    directionalLight.shadow.camera.near = 10; // Erhöht um Präzision zu fokussieren
    directionalLight.shadow.camera.far = 200; // Verringert für bessere Shadow-Map-Nutzung
    directionalLight.shadow.bias = -0.002; // Angepasst für weniger Shadow Acne
    
    // Reduzierte Shadow-Kamera Größe für bessere Auflösung und Performance
    const shadowSize = 60; // Reduziert von 100
    directionalLight.shadow.camera.left = -shadowSize;
    directionalLight.shadow.camera.right = shadowSize;
    directionalLight.shadow.camera.top = shadowSize;
    directionalLight.shadow.camera.bottom = -shadowSize;
    
    // Shadow-Blurriness für weichere Schatten mit weniger visuellen Artefakten
    directionalLight.shadow.radius = 2;
    
    this.scene.add(directionalLight);
    this.mainLight = directionalLight; // Für einfachen Zugriff speichern
    
    // Add a secondary light for better illumination - keine Schatten für dieses Licht
    const secondaryLight = new THREE.DirectionalLight(0xffffff, 0.3);
    secondaryLight.position.set(-30, 100, -50);
    this.scene.add(secondaryLight);
    
    // Add a ground plane
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x404040,
      roughness: 0.8,
      metalness: 0.1
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.ground.position.y = -0.15; // Unter der Map, um schwarze Lücken zu vermeiden
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    
    // Add fog for atmosphere - weniger dicht für bessere Sichtbarkeit
    this.scene.fog = new THREE.Fog(0x87CEEB, 30, 350);
  }
  
  setupMap() {
    this.map = new Map(this, this.assetLoader);
    this.map.generate();
    console.log("Map setup complete");
    
    // Debugging-Informationen für die Map
    this.map.debugMap();
    this.scene.add(this.map.container);
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
    
    // Culling-Optimierung
    this.updateCulling(deltaTime);
    
    // Check if wave is complete
    this.checkWaveCompletion();
  }
  
  render() {
    // Aktualisiere FPS-Zähler
    this.updateFPSCounter();
    
    // Aktualisiere Matrizen vor dem Rendern
    this.scene.updateMatrixWorld(true);
    
    // Stelle sicher, dass der Renderer korrekt initialisiert ist
    this.renderer.clear();
    
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
      console.log(`Wave ${this.gameState.wave} complete!`);
      
      // Setze Flag, dass wir gerade eine Wellenabschluss-Verarbeitung durchführen
      this.isProcessingWaveCompletion = true;
      
      // Increment wave counter
      this.gameState.wave++;
      
      // Show wave message
      this.ui.showWaveMessage(this.gameState.wave);
      
      console.log(`Preparing next wave: ${this.gameState.wave}`);
      
      // Wait 3 seconds before starting the next wave
      setTimeout(() => {
        this.zombieManager.startNewWave(this.gameState.wave);
        
        // Setze Flag zurück, sodass die nächste Welle überprüft werden kann
        setTimeout(() => {
          this.isProcessingWaveCompletion = false;
        }, 5000); // Mindestens 5 Sekunden zwischen Wellenabschluss-Checks
      }, 3000);
    }
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
  
  // Neue Methode für Culling-Update
  updateCulling(deltaTime) {
    if (!this.cullingEnabled || !this.player || !this.map) return;
    
    // Aktualisiere Timer
    this.cullingTimer += deltaTime;
    
    // Berechne Distanz zur letzten Position, bei der Culling aktualisiert wurde
    const distanceToLastUpdate = this.player.container.position.distanceTo(this.lastPlayerPosition);
    
    // Aktualisiere Culling nur, wenn sich Spieler genug bewegt hat oder Timer abgelaufen ist
    if (distanceToLastUpdate > this.cullingUpdateThreshold || this.cullingTimer >= this.cullingUpdateFrequency) {
      // Position für nächstes Update merken
      this.lastPlayerPosition.copy(this.player.container.position);
      this.cullingTimer = 0;
      
      // Führe Culling durch
      this.performCulling();
    }
  }
  
  // Bestimmt, welche Elemente sichtbar sein sollten
  performCulling() {
    if (!this.map || !this.player) return;
    
    const playerPosition = this.player.container.position;
    const viewDistanceSquared = this.viewDistance * this.viewDistance;
    const previouslyVisible = new Set(this.visibleTiles);
    this.visibleTiles.clear();
    
    // Kamera-Frustum für genauere Sichtbarkeitsbestimmung
    this.camera.updateMatrixWorld(true);
    const frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(
        this.camera.projectionMatrix,
        this.camera.matrixWorldInverse
      )
    );
    
    // Nutze die Chunk-basierte Optimierung der Karte
    this.map.optimizeVisibility(frustum, playerPosition, this.viewDistance);
    
    // Da die Sichtbarkeit der Tiles jetzt in der Map-Klasse verwaltet wird,
    // sammeln wir nur noch die sichtbaren Tile-Koordinaten für die Zombie-Optimierung
    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const tile = this.map.tiles[y][x];
        if (!tile || !tile.container.visible) continue;
        
        // Speichere sichtbare Tiles
        this.visibleTiles.add(`${x},${y}`);
      }
    }
    
    // Optimiere Zombies - Zeige nur Zombies in der Nähe sichtbarer Tiles
    if (this.zombieManager && this.zombieManager.zombies) {
      this.zombieManager.zombies.forEach(zombie => {
        const zombiePosition = zombie.container.position;
        
        // Immer sichtbar für sehr nahe Zombies
        const distanceToPlayer = zombiePosition.distanceTo(playerPosition);
        if (distanceToPlayer < 10) {
          zombie.container.visible = true;
          return;
        }
        
        // Prüfe, ob Zombie in der Nähe eines sichtbaren Tiles ist
        const zombieTileX = Math.floor((zombiePosition.x - this.map.container.position.x) / this.map.tileSize);
        const zombieTileZ = Math.floor((zombiePosition.z - this.map.container.position.z) / this.map.tileSize);
        
        // Check surrounding tiles (3x3 area)
        let isNearVisibleTile = false;
        for (let dz = -1; dz <= 1; dz++) {
          for (let dx = -1; dx <= 1; dx++) {
            const tileKey = `${zombieTileX + dx},${zombieTileZ + dz}`;
            if (this.visibleTiles.has(tileKey)) {
              isNearVisibleTile = true;
              break;
            }
          }
          if (isNearVisibleTile) break;
        }
        
        zombie.container.visible = isNearVisibleTile;
      });
    }
  }
  
  // Methode zum Einstellen der Sichtweite
  setViewDistance(distance) {
    this.viewDistance = distance;
    // Sofortiges Update erzwingen
    this.lastPlayerPosition.set(0, 0, 0);
    this.performCulling();
  }
  
  // Culling ein-/ausschalten
  setCullingEnabled(enabled) {
    this.cullingEnabled = enabled;
    
    // Wenn deaktiviert, alles sichtbar machen
    if (!this.cullingEnabled && this.map) {
      for (let y = 0; y < this.map.height; y++) {
        for (let x = 0; x < this.map.width; x++) {
          if (this.map.tiles[y] && this.map.tiles[y][x]) {
            this.map.tiles[y][x].container.visible = true;
          }
        }
      }
      
      // Alle Zombies sichtbar machen
      if (this.zombieManager && this.zombieManager.zombies) {
        this.zombieManager.zombies.forEach(zombie => {
          zombie.container.visible = true;
        });
      }
    } else if (this.cullingEnabled) {
      // Wenn aktiviert, sofort culling durchführen
      this.performCulling();
    }
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