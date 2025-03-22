import * as THREE from 'three';

export class CullingManager {
  constructor(game) {
    this.game = game;
    
    // Culling-Konfiguration
    this.config = {
      enabled: true,
      viewDistance: 50, // Sichtweite in Spieleinheiten
      frustumCulling: true,
      occlusionCulling: true,
      backfaceCulling: true,
      detailCulling: true,
      portalCulling: true,
      hierarchicalCulling: true,
      
      // Performance-Einstellungen
      updateFrequency: 0.2, // Sekunden zwischen Culling-Updates
      updateThreshold: 5, // Minimale Bewegung für Culling-Update
      
      // Debug
      debugMode: false
    };
    
    // Interne Zustandsvariablen
    this.lastUpdateTime = 0;
    this.lastPlayerPosition = new THREE.Vector3();
    this.visibleTiles = new Set();
    this.visibleZombies = new Set();
    this.visibleObjects = new Set();
    
    // Occlusion Culling
    this.occluders = []; // Liste aller Objekte, die andere verdecken können
    this.occlusionCamera = null;
    this.occlusionRenderTarget = null;
    this.occlusionDepthMaterial = null;
    
    // Portal Culling
    this.portals = []; // Türen, Fenster, etc.
    
    // Hierarchisches Culling
    this.cullingHierarchy = {}; // Hierarchische Struktur für geschachtelte Objekte
    
    // Debug
    this.debugObjects = [];
  }
  
  init() {
    // Aktiviere Backface Culling im Renderer
    if (this.config.backfaceCulling) {
      this.setupBackfaceCulling();
    }
    
    // Setup für Occlusion Culling
    if (this.config.occlusionCulling) {
      this.setupOcclusionCulling();
    }
    
    // Kopiere initiale Spielerposition
    if (this.game.player) {
      this.lastPlayerPosition.copy(this.game.player.container.position);
    }
    
    // Debug-Visualisierung einrichten
    if (this.config.debugMode) {
      this.setupDebugVisualization();
    }
  }
  
  setupBackfaceCulling() {
    // Stelle sicher, dass Backface Culling aktiviert ist
    this.game.scene.traverse(object => {
      if (object.isMesh) {
        object.material.side = THREE.FrontSide;
      }
    });
  }
  
  setupOcclusionCulling() {
    // Erstelle eine spezielle Kamera für Occlusion Tests
    this.occlusionCamera = this.game.camera.clone();
    
    // Rendertarget für Occlusion-Tests
    const size = 256; // Niedrige Auflösung für Performance
    this.occlusionRenderTarget = new THREE.WebGLRenderTarget(size, size, {
      format: THREE.RedFormat,
      type: THREE.UnsignedByteType
    });
    
    // Spezielles Material für Tiefeninformationen
    this.occlusionDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking
    });
    
    // Identifiziere große Objekte als potentielle Verdeckungen
    this.identifyOccluders();
  }
  
  identifyOccluders() {
    // Finde große Objekte in der Szene, die potentiell andere verdecken können
    this.occluders = [];
    
    // Gebäude und große Strukturen als Occluder hinzufügen
    if (this.game.map && this.game.map.tiles) {
      for (let y = 0; y < this.game.map.height; y++) {
        for (let x = 0; x < this.game.map.width; x++) {
          const tile = this.game.map.tiles[y][x];
          if (tile && tile.height > 1) {
            // Hohe Tiles wie Gebäude sind gute Occluder
            this.occluders.push(tile.container);
          }
        }
      }
    }
  }
  
  setupDebugVisualization() {
    // Erstelle Visualisierungen für Culling-Regionen
    const frustumGeometry = new THREE.BoxGeometry(1, 1, 1);
    const frustumMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.3 
    });
    
    this.frustumHelper = new THREE.Mesh(frustumGeometry, frustumMaterial);
    this.game.scene.add(this.frustumHelper);
    
    // Erstelle Debug-Material für Occluder
    const occluderMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.3 
    });
    
    // Markiere Occluder im Debug-Modus
    this.occluders.forEach(occluder => {
      const debugObject = occluder.clone();
      debugObject.traverse(obj => {
        if (obj.isMesh) {
          obj.material = occluderMaterial;
        }
      });
      this.debugObjects.push(debugObject);
      this.game.scene.add(debugObject);
    });
  }
  
  update(deltaTime) {
    if (!this.config.enabled || !this.game.player) return;
    
    // Überprüfe, ob ein Update erforderlich ist
    this.lastUpdateTime += deltaTime;
    
    const playerPosition = this.game.player.container.position;
    const distanceToLastUpdate = playerPosition.distanceTo(this.lastPlayerPosition);
    
    // Update nur wenn nötig (Spieler hat sich bewegt oder Timer abgelaufen)
    if (distanceToLastUpdate > this.config.updateThreshold || 
        this.lastUpdateTime >= this.config.updateFrequency) {
      
      // Position für nächstes Update merken
      this.lastPlayerPosition.copy(playerPosition);
      this.lastUpdateTime = 0;
      
      // Führe verschiedene Culling-Techniken aus
      this.performCulling();
    }
    
    // Update Debug-Visualisierungen
    if (this.config.debugMode) {
      this.updateDebugVisualization();
    }
  }
  
  performCulling() {
    // Erstelle Frustum für View Frustum Culling
    const frustum = this.calculateFrustum();
    
    // Führe Frustum Culling durch
    if (this.config.frustumCulling) {
      this.performFrustumCulling(frustum);
    }
    
    // Führe Occlusion Culling durch
    if (this.config.occlusionCulling) {
      this.performOcclusionCulling();
    }
    
    // Hierarchisches Culling (Berücksichtigt Parent-Child Beziehungen)
    if (this.config.hierarchicalCulling) {
      this.performHierarchicalCulling();
    }
    
    // Detail Culling (LOD)
    if (this.config.detailCulling) {
      this.performDetailCulling();
    }
    
    // Portal Culling
    if (this.config.portalCulling) {
      this.performPortalCulling(frustum);
    }
  }
  
  calculateFrustum() {
    // Kamera-Frustum erstellen
    this.game.camera.updateMatrixWorld(true);
    const frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(
        this.game.camera.projectionMatrix,
        this.game.camera.matrixWorldInverse
      )
    );
    return frustum;
  }
  
  performFrustumCulling(frustum) {
    // Map-Culling delegieren
    if (this.game.map) {
      this.game.map.optimizeVisibility(frustum, this.game.player.container.position, this.config.viewDistance);
    }
    
    // Zombies Culling
    this.cullingZombies(frustum);
    
    // Andere Objekte (Bullets, Items, Effekte)
    this.cullingMiscObjects(frustum);
  }
  
  cullingZombies(frustum) {
    if (!this.game.zombieManager || !this.game.zombieManager.zombies) return;
    
    const playerPosition = this.game.player.container.position;
    const viewDistanceSquared = this.config.viewDistance * this.config.viewDistance;
    
    this.visibleZombies.clear();
    
    // Zombies im Sichtbereich identifizieren
    this.game.zombieManager.zombies.forEach(zombie => {
      if (!zombie.isAlive) {
        zombie.container.visible = true; // Tote Zombies immer anzeigen (für Animationen)
        return;
      }
      
      const zombiePosition = zombie.container.position;
      
      // Immer sichtbar für sehr nahe Zombies
      const distanceToPlayer = zombiePosition.distanceTo(playerPosition);
      if (distanceToPlayer < 10) {
        zombie.container.visible = true;
        this.visibleZombies.add(zombie);
        return;
      }
      
      // Distanzprüfung
      const distanceSquared = zombiePosition.distanceToSquared(playerPosition);
      if (distanceSquared > viewDistanceSquared) {
        zombie.container.visible = false;
        return;
      }
      
      // Frustum-Prüfung
      const boundingSphere = new THREE.Sphere(zombiePosition, 1.5);
      if (!frustum.intersectsSphere(boundingSphere)) {
        zombie.container.visible = false;
        return;
      }
      
      // Merken als potentiell sichtbar (für weitere Tests)
      this.visibleZombies.add(zombie);
      zombie.container.visible = true;
    });
  }
  
  cullingMiscObjects(frustum) {
    // Bullets
    if (this.game.player && this.game.player.weapon && this.game.player.weapon.bullets) {
      this.game.player.weapon.bullets.forEach(bullet => {
        const boundingSphere = new THREE.Sphere(bullet.container.position, 0.5);
        bullet.container.visible = frustum.intersectsSphere(boundingSphere);
      });
    }
    
    // Items und andere Objekte können hier geprüft werden
  }
  
  performOcclusionCulling() {
    if (!this.occlusionCamera || this.visibleZombies.size === 0) return;
    
    // Update Occlusion-Kamera
    this.occlusionCamera.copy(this.game.camera);
    
    // Rendere Occluder in die Tiefentextur
    const originalMaterials = new Map();
    
    // Setup Szene für Occlusion-Test
    this.occluders.forEach(occluder => {
      occluder.traverse(obj => {
        if (obj.isMesh && obj.material) {
          originalMaterials.set(obj, obj.material);
          obj.material = this.occlusionDepthMaterial;
        }
      });
    });
    
    // Rendere Tiefentextur
    const originalRenderTarget = this.game.renderer.getRenderTarget();
    this.game.renderer.setRenderTarget(this.occlusionRenderTarget);
    this.game.renderer.clear();
    this.game.renderer.render(this.game.scene, this.occlusionCamera);
    this.game.renderer.setRenderTarget(originalRenderTarget);
    
    // Stelle Materialien wieder her
    this.occluders.forEach(occluder => {
      occluder.traverse(obj => {
        if (originalMaterials.has(obj)) {
          obj.material = originalMaterials.get(obj);
        }
      });
    });
    
    // Teste sichtbare Zombies auf Verdeckung
    this.testOcclusion();
  }
  
  testOcclusion() {
    // Hier würde man die Pixeldaten aus dem RenderTarget auslesen
    // und für jedes Objekt prüfen, ob es verdeckt ist
    
    // Vereinfachte Implementation: Raycast-basierte Occlusion
    const raycaster = new THREE.Raycaster();
    const playerPosition = this.game.player.container.position.clone();
    playerPosition.y += 1.6; // Augenhöhe
    
    // Prüfe jedes potentiell sichtbare Objekt
    this.visibleZombies.forEach(zombie => {
      const zombiePosition = zombie.container.position.clone();
      zombiePosition.y += 1.0; // Mittelpunkt des Zombies
      
      // Richtungsvektor vom Spieler zum Zombie
      const direction = zombiePosition.clone().sub(playerPosition).normalize();
      
      // Setze Raycaster
      raycaster.set(playerPosition, direction);
      
      // Finde Schnittpunkte mit Occludern
      const intersects = raycaster.intersectObjects(this.occluders, true);
      
      // Wenn ein Occluder zwischen Spieler und Zombie ist, ist der Zombie verdeckt
      if (intersects.length > 0) {
        const distanceToZombie = playerPosition.distanceTo(zombiePosition);
        const distanceToOccluder = intersects[0].distance;
        
        if (distanceToOccluder < distanceToZombie * 0.95) { // 5% Toleranz
          zombie.container.visible = false;
        }
      }
    });
  }
  
  performHierarchicalCulling() {
    // Hierarchisches Culling setzt voraus, dass Container-Objekte 
    // ihre Children korrekt verwalten
    
    // Wenn ein Parent-Objekt unsichtbar ist, sollten auch alle Children unsichtbar sein
    // Dies ist mit THREE.js Gruppierung bereits automatisch der Fall
    
    // Optimierung: Explizite Hierarchie für komplexe verschachtelte Objekte
    Object.values(this.cullingHierarchy).forEach(hierarchy => {
      if (!hierarchy.parent.visible) {
        hierarchy.children.forEach(child => {
          child.visible = false;
        });
      }
    });
  }
  
  performDetailCulling() {
    // Level of Detail basierend auf Entfernung
    const playerPosition = this.game.player.container.position;
    
    // Zombies LOD
    this.game.zombieManager?.zombies.forEach(zombie => {
      if (!zombie.container.visible) return;
      
      const distance = zombie.container.position.distanceTo(playerPosition);
      
      // Skaliere Detail basierend auf Entfernung
      if (distance > 30) {
        // Niedrigste Detail-Stufe
        zombie.setDetailLevel(0);
      } else if (distance > 15) {
        // Mittlere Detail-Stufe
        zombie.setDetailLevel(1);
      } else {
        // Höchste Detail-Stufe
        zombie.setDetailLevel(2);
      }
    });
    
    // Map-Tiles LOD
    if (this.game.map && this.game.map.tiles) {
      this.visibleTiles.forEach(tileKey => {
        const [x, y] = tileKey.split(',').map(Number);
        const tile = this.game.map.tiles[y][x];
        
        if (tile && tile.container.visible) {
          const tilePos = new THREE.Vector3();
          tile.container.getWorldPosition(tilePos);
          const distance = tilePos.distanceTo(playerPosition);
          
          // Skaliere Detail basierend auf Entfernung
          if (distance > 25) {
            tile.setDetailLevel(0);
          } else if (distance > 15) {
            tile.setDetailLevel(1);
          } else {
            tile.setDetailLevel(2);
          }
        }
      });
    }
  }
  
  performPortalCulling(frustum) {
    // Portal Culling für Türen, Fenster, etc.
    // Vereinfachte Implementation
    this.portals.forEach(portal => {
      // Prüfe, ob Portal im Frustum liegt
      if (!frustum.intersectsObject(portal.mesh)) {
        portal.rooms.forEach(room => {
          room.objects.forEach(obj => {
            obj.visible = false;
          });
        });
        return;
      }
      
      // Prüfe, ob Spieler im selben Raum wie das Portal ist
      const playerRoom = this.getPlayerRoom();
      
      if (playerRoom && portal.rooms.includes(playerRoom)) {
        // Portal ist sichtbar und Spieler ist im gleichen Raum
        // Mache verbundene Räume sichtbar
        portal.rooms.forEach(room => {
          room.objects.forEach(obj => {
            obj.visible = true;
          });
        });
      }
    });
  }
  
  getPlayerRoom() {
    // Vereinfachte Raumerkennung basierend auf Spielerposition
    // In einer realen Implementation würde dies komplexer sein
    if (!this.game.player || !this.game.map) return null;
    
    const playerPosition = this.game.player.container.position;
    const tileX = Math.floor((playerPosition.x - this.game.map.container.position.x) / this.game.map.tileSize);
    const tileZ = Math.floor((playerPosition.z - this.game.map.container.position.z) / this.game.map.tileSize);
    
    // Räume könnten beispielsweise als zusammenhängende Regionen definiert sein
    return this.game.map.getRoomAt?.(tileX, tileZ) || null;
  }
  
  updateDebugVisualization() {
    if (!this.config.debugMode) return;
    
    // Update Frustum-Visualisierung
    if (this.frustumHelper) {
      // Berechne Box für Frustum basierend auf Kamera-Frustum
      const camera = this.game.camera;
      const frustum = this.calculateFrustum();
      
      // Einfache Approximation des Frustums als Box
      const near = camera.near;
      const far = this.config.viewDistance;
      const tanFov = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
      const nearHeight = 2 * near * tanFov;
      const nearWidth = nearHeight * camera.aspect;
      const farHeight = 2 * far * tanFov;
      const farWidth = farHeight * camera.aspect;
      
      // Setze Box-Geometrie
      this.frustumHelper.scale.set(farWidth, farHeight, far - near);
      this.frustumHelper.position.copy(camera.position);
      this.frustumHelper.position.z -= (far - near) / 2;
      this.frustumHelper.quaternion.copy(camera.quaternion);
    }
  }
  
  // Hilfsmethoden zur Steuerung des Cullings
  setCullingEnabled(enabled) {
    this.config.enabled = enabled;
    
    // Mache alles sichtbar, wenn Culling deaktiviert wird
    if (!enabled) {
      this.showEverything();
    } else {
      // Sofort Culling durchführen
      this.performCulling();
    }
  }
  
  showEverything() {
    // Setze alle Objekte auf sichtbar
    
    // Map-Tiles
    if (this.game.map && this.game.map.tiles) {
      for (let y = 0; y < this.game.map.height; y++) {
        for (let x = 0; x < this.game.map.width; x++) {
          if (this.game.map.tiles[y] && this.game.map.tiles[y][x]) {
            this.game.map.tiles[y][x].container.visible = true;
          }
        }
      }
    }
    
    // Zombies
    if (this.game.zombieManager && this.game.zombieManager.zombies) {
      this.game.zombieManager.zombies.forEach(zombie => {
        zombie.container.visible = true;
      });
    }
    
    // Bullets
    if (this.game.player && this.game.player.weapon && this.game.player.weapon.bullets) {
      this.game.player.weapon.bullets.forEach(bullet => {
        bullet.container.visible = true;
      });
    }
  }
  
  setViewDistance(distance) {
    this.config.viewDistance = distance;
    // Sofortiges Update erzwingen
    this.lastPlayerPosition.set(0, 0, 0);
    this.performCulling();
  }
  
  setDebugMode(enabled) {
    this.config.debugMode = enabled;
    
    // Entferne bestehende Debug-Objekte
    this.debugObjects.forEach(obj => {
      this.game.scene.remove(obj);
    });
    this.debugObjects = [];
    
    if (this.frustumHelper) {
      this.game.scene.remove(this.frustumHelper);
      this.frustumHelper = null;
    }
    
    // Erstelle neue Debug-Visualisierung
    if (enabled) {
      this.setupDebugVisualization();
    }
  }
} 