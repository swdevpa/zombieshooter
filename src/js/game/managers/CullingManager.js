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
      debugMode: false,
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
    this.occlusionCullingActive = false;
    this.potentiallyVisibleObjects = new Set(); // Objekte nach Frustum-Culling, vor Occlusion Tests
    this.occlusionTestResults = new Map(); // Speichert Ergebnisse des letzten Tests pro Objekt
    this.occlusionQueryThrottle = 0; // Zähler für Throttling der aufwändigen Tests

    // Portal Culling
    this.portals = []; // Türen, Fenster, etc.

    // Hierarchisches Culling
    this.cullingHierarchy = {}; // Hierarchische Struktur für geschachtelte Objekte

    // Debug
    this.debugObjects = [];
    this.debugOcclusionVisualizers = [];
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
    this.game.scene.traverse((object) => {
      if (object.isMesh) {
        object.material.side = THREE.FrontSide;
      }
    });
  }

  setupOcclusionCulling() {
    // Erstelle eine spezielle Kamera für Occlusion Tests
    this.occlusionCamera = this.game.camera.clone();

    // Rendertarget für Occlusion-Tests
    const size = 512; // Höhere Auflösung für genauere Ergebnisse
    this.occlusionRenderTarget = new THREE.WebGLRenderTarget(size, size, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: true, 
      stencilBuffer: false
    });

    // Spezielles Material für Tiefeninformationen
    this.occlusionDepthMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: false,
      side: THREE.FrontSide
    });

    // GPU Readback Puffer
    this.occlusionPixelBuffer = new Uint8Array(4);

    // Identifiziere große Objekte als potentielle Verdeckungen
    this.identifyOccluders();
    
    this.occlusionCullingActive = true;
  }

  identifyOccluders() {
    // Finde große Objekte in der Szene, die potentiell andere verdecken können
    this.occluders = [];

    // Gebäude und große Strukturen als Occluder hinzufügen
    if (this.game.city && this.game.city.container) {
      this.game.city.container.traverse((child) => {
        // Nur Meshes mit signifikanter Größe als Occluder verwenden
        if (child.isMesh && child.geometry) {
          child.geometry.computeBoundingBox();
          const size = new THREE.Vector3();
          child.geometry.boundingBox.getSize(size);
          
          // Wenn das Objekt groß genug ist (z.B. ein Gebäude)
          if (size.length() > 5) {
            child.isOccluder = true;
            this.occluders.push(child);
          }
        }
      });
    }
    
    console.log(`Identified ${this.occluders.length} occluders in the scene`);
  }

  setupDebugVisualization() {
    // Erstelle Visualisierungen für Culling-Regionen
    const frustumGeometry = new THREE.BoxGeometry(1, 1, 1);
    const frustumMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });

    this.frustumHelper = new THREE.Mesh(frustumGeometry, frustumMaterial);
    this.game.scene.add(this.frustumHelper);

    // Erstelle Debug-Material für Occluder
    const occluderMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });

    // Markiere Occluder im Debug-Modus
    this.occluders.forEach((occluder) => {
      const debugObject = occluder.clone();
      debugObject.traverse((obj) => {
        if (obj.isMesh) {
          obj.material = occluderMaterial;
        }
      });
      this.debugObjects.push(debugObject);
      this.game.scene.add(debugObject);
    });
    
    // Debug-Visualisierung für Occlusion
    const occludedMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    
    const visibleMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    
    this.occludedMaterial = occludedMaterial;
    this.visibleMaterial = visibleMaterial;
  }

  update(camera) {
    // Skip if culling is disabled
    if (!this.config.enabled) return;

    // Get player position
    const playerPosition = this.game.player
      ? this.game.player.container.position.clone()
      : new THREE.Vector3();

    // Calculate frustum for view-frustum culling
    const frustum = this.calculateFrustum(camera);

    // Perform culling
    this.performCulling(frustum, playerPosition);

    // Update last player position
    this.lastPlayerPosition.copy(playerPosition);
  }

  performCulling(frustum, playerPosition) {
    // Reset potentially visible objects
    this.potentiallyVisibleObjects.clear();
    
    // Perform frustum culling if enabled
    if (this.config.frustumCulling) {
      this.performFrustumCulling(frustum, playerPosition);
    }

    // Perform occlusion culling after frustum culling
    if (this.config.occlusionCulling && this.occlusionCullingActive) {
      this.performOcclusionCulling();
    }

    // City-specific culling for buildings
    this.cullCityBuildings(frustum, playerPosition);

    // Update debug visualization if enabled
    if (this.config.debugMode) {
      this.updateDebugVisualization();
    }
  }

  calculateFrustum(camera) {
    // Create a new frustum
    const frustum = new THREE.Frustum();

    // Get the camera's view frustum
    const projScreenMatrix = new THREE.Matrix4();
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    return frustum;
  }

  performFrustumCulling(frustum, playerPosition) {
    // Skip Map-Culling, since we're using the City now

    // Zombies Culling
    this.cullingZombies(frustum, playerPosition);

    // Misc objects (Bullets, Items, Effects)
    this.cullingMiscObjects(frustum);
  }

  cullingZombies(frustum, playerPosition) {
    if (!this.game.zombieManager || !this.game.zombieManager.zombies) return;

    const viewDistanceSquared = this.config.viewDistance * this.config.viewDistance;

    this.visibleZombies.clear();

    // Zombies im Sichtbereich identifizieren
    this.game.zombieManager.zombies.forEach((zombie) => {
      if (!zombie.isAlive) {
        zombie.container.visible = true; // Tote Zombies immer anzeigen (für Animationen)
        return;
      }

      const distanceSquared = playerPosition.distanceToSquared(zombie.container.position);
      if (distanceSquared > viewDistanceSquared) {
        zombie.container.visible = false;
        return;
      }

      // Frustum-Prüfung
      const boundingSphere = new THREE.Sphere(zombie.container.position, 1.5);
      if (!frustum.intersectsSphere(boundingSphere)) {
        zombie.container.visible = false;
        return;
      }

      // Merken als potentiell sichtbar (für weitere Tests)
      this.visibleZombies.add(zombie);
      this.potentiallyVisibleObjects.add(zombie.container);
      
      // Vorläufig sichtbar machen, kann von Occlusion Culling noch geändert werden
      zombie.container.visible = true;
    });
  }

  cullingMiscObjects(frustum) {
    // Bullets
    if (this.game.player && this.game.player.weapon && this.game.player.weapon.bullets) {
      this.game.player.weapon.bullets.forEach((bullet) => {
        const boundingSphere = new THREE.Sphere(bullet.container.position, 0.5);
        const isVisible = frustum.intersectsSphere(boundingSphere);
        bullet.container.visible = isVisible;
        
        if (isVisible) {
          this.potentiallyVisibleObjects.add(bullet.container);
        }
      });
    }

    // Items und andere Objekte können hier geprüft werden
  }

  cullCityBuildings(frustum, playerPosition) {
    // Skip if city is not initialized
    if (!this.game.city || !this.game.city.container) return;

    // Get all building meshes from the city
    const buildingsGroup = this.game.city.container.children.find(
      (child) => child.isGroup && child.children.some((building) => building.isMesh)
    );

    if (!buildingsGroup) return;

    // Distance-based culling - only show buildings within view distance
    const viewDistanceSquared = this.config.viewDistance * this.config.viewDistance;

    // Process each building
    buildingsGroup.children.forEach((building) => {
      if (!building.isMesh) return;

      // Calculate distance to player
      const distanceSquared = playerPosition.distanceToSquared(building.position);

      // Frustum culling - check if building is in view frustum
      const isInFrustum =
        distanceSquared <= viewDistanceSquared && frustum.intersectsObject(building);

      // Set visibility based on frustum test
      building.visible = isInFrustum;
      
      // Add to potentially visible objects if in frustum
      if (isInFrustum) {
        this.potentiallyVisibleObjects.add(building);
      }
    });
  }

  performOcclusionCulling() {
    if (!this.occlusionCamera || this.potentiallyVisibleObjects.size === 0) return;
    
    // Throttle occlusion culling updates for performance
    this.occlusionQueryThrottle++;
    if (this.occlusionQueryThrottle % 3 !== 0) return; // Nur jeden dritten Frame
    this.occlusionQueryThrottle = 0;

    // Update Occlusion-Kamera
    this.occlusionCamera.copy(this.game.camera);

    // Nur Objekte im Occlusion-Test prüfen, die vom Frustum-Culling als sichtbar markiert wurden
    const objectsToTest = Array.from(this.potentiallyVisibleObjects);
    if (objectsToTest.length === 0) return;
    
    // Perform hierarchical Z-buffer occlusion culling
    
    // 1. Rendere Occluder in die Tiefentextur
    this.renderOccluderDepthMap();
    
    // 2. Teste jedes potentiell sichtbare Objekt gegen die Tiefenkarte
    this.testOcclusion(objectsToTest);
    
    // 3. Aktualisiere die Debug-Visualisierung für verdeckte Objekte
    if (this.config.debugMode) {
      this.updateOcclusionDebugVisualization();
    }
  }
  
  renderOccluderDepthMap() {
    // Cache materials
    const originalMaterials = new Map();
    
    // Nur Occluder rendern, Rest unsichtbar machen
    const originalVisibility = new Map();
    this.game.scene.traverse((obj) => {
      if (obj.isMesh) {
        originalVisibility.set(obj, obj.visible);
        obj.visible = obj.isOccluder === true;
        
        if (obj.isOccluder) {
          originalMaterials.set(obj, obj.material);
          obj.material = this.occlusionDepthMaterial;
        }
      }
    });
    
    // Rendere Tiefentextur
    const originalRenderTarget = this.game.renderer.getRenderTarget();
    const originalAutoClear = this.game.renderer.autoClear;
    
    this.game.renderer.setRenderTarget(this.occlusionRenderTarget);
    this.game.renderer.autoClear = true;
    this.game.renderer.clear();
    this.game.renderer.render(this.game.scene, this.occlusionCamera);
    
    // Stelle Originalzustand wieder her
    this.game.renderer.setRenderTarget(originalRenderTarget);
    this.game.renderer.autoClear = originalAutoClear;
    
    // Stelle Materialien und Sichtbarkeit wieder her
    this.game.scene.traverse((obj) => {
      if (obj.isMesh) {
        if (originalVisibility.has(obj)) {
          obj.visible = originalVisibility.get(obj);
        }
        
        if (originalMaterials.has(obj)) {
          obj.material = originalMaterials.get(obj);
        }
      }
    });
  }

  testOcclusion(objectsToTest) {
    // Verwendung eines Raycasting-basierten Ansatzes für Occlusion Tests
    // Dieses Verfahren ist effizienter als Pixelauslesen vom RenderTarget
    const raycaster = new THREE.Raycaster();
    const playerPosition = this.game.player.container.position.clone();
    playerPosition.y += 1.6; // Augenhöhe
    
    // Maximal 10 Objekte pro Frame für Occlusion testen (Performance)
    const maxObjectsPerFrame = 10;
    const objectsToTestThisFrame = objectsToTest.slice(0, maxObjectsPerFrame);
    
    // Teste jedes Objekt auf Verdeckung
    for (const object of objectsToTestThisFrame) {
      // Skip Occluder von den Tests
      if (object.isOccluder) continue;
      
      // Bestimme Testpunkte für dieses Objekt
      const testPoints = this.getObjectTestPoints(object);
      
      // Ein Objekt ist sichtbar, wenn mindestens ein Testpunkt sichtbar ist
      let isVisible = false;
      
      for (const testPoint of testPoints) {
        const direction = testPoint.clone().sub(playerPosition).normalize();
        
        // Setze Raycaster
        raycaster.set(playerPosition, direction);
        
        // Finde Schnittpunkte mit potentiellen Occludern
        const intersects = raycaster.intersectObjects(this.occluders, true);
        
        // Wenn keine Schnitte gefunden wurden, ist der Punkt sichtbar
        if (intersects.length === 0) {
          isVisible = true;
          break;
        }
        
        // Prüfe, ob der Schnitt näher ist als der Testpunkt
        const distanceToTestPoint = playerPosition.distanceTo(testPoint);
        const distanceToOccluder = intersects[0].distance;
        
        // Berücksichtige eine kleine Toleranz für numerische Genauigkeit
        if (distanceToOccluder >= distanceToTestPoint * 0.98) {
          isVisible = true;
          break;
        }
      }
      
      // Speichere Ergebnis
      this.occlusionTestResults.set(object, isVisible);
      
      // Setze Sichtbarkeit
      // Nur für Zombies und Effekte, nicht für Gebäude (die durch frustum culling gesteuert werden)
      if (object !== this.game.player.container) {
        object.visible = isVisible;
        
        // Für Zombies: Finde das Zombie-Objekt
        if (object.userData && object.userData.zombieRef) {
          const zombie = object.userData.zombieRef;
          if (zombie) {
            zombie.isOccluded = !isVisible;
          }
        }
      }
    }
  }
  
  getObjectTestPoints(object) {
    // Für jedes Objekt erstellen wir mehrere Testpunkte, um genauere Occlusion-Tests zu ermöglichen
    const points = [];
    
    // Zentrum des Objekts (Weltkoordinaten)
    const center = new THREE.Vector3();
    object.getWorldPosition(center);
    points.push(center);
    
    // Wenn das Objekt eine BoundingBox hat, nutze sie für weitere Testpunkte
    if (object.geometry && object.geometry.boundingBox) {
      const bbox = object.geometry.boundingBox.clone();
      
      // Transformiere BoundingBox in Weltkoordinaten
      bbox.applyMatrix4(object.matrixWorld);
      
      // Eckpunkte der BoundingBox
      points.push(new THREE.Vector3(bbox.min.x, bbox.min.y, bbox.min.z));
      points.push(new THREE.Vector3(bbox.max.x, bbox.min.y, bbox.min.z));
      points.push(new THREE.Vector3(bbox.min.x, bbox.max.y, bbox.min.z));
      points.push(new THREE.Vector3(bbox.max.x, bbox.max.y, bbox.min.z));
      points.push(new THREE.Vector3(bbox.min.x, bbox.min.y, bbox.max.z));
      points.push(new THREE.Vector3(bbox.max.x, bbox.min.y, bbox.max.z));
      points.push(new THREE.Vector3(bbox.min.x, bbox.max.y, bbox.max.z));
      points.push(new THREE.Vector3(bbox.max.x, bbox.max.y, bbox.max.z));
    } else {
      // Alternativ einfach ein paar Punkte um das Zentrum herum
      const radius = object.type === 'Zombie' ? 1.0 : 0.5;
      points.push(new THREE.Vector3(center.x + radius, center.y, center.z));
      points.push(new THREE.Vector3(center.x - radius, center.y, center.z));
      points.push(new THREE.Vector3(center.x, center.y + radius, center.z));
      points.push(new THREE.Vector3(center.x, center.y - radius, center.z));
      points.push(new THREE.Vector3(center.x, center.y, center.z + radius));
      points.push(new THREE.Vector3(center.x, center.y, center.z - radius));
    }
    
    return points;
  }
  
  updateOcclusionDebugVisualization() {
    // Entferne bestehende Debug-Visualisierungen
    this.debugOcclusionVisualizers.forEach(obj => this.game.scene.remove(obj));
    this.debugOcclusionVisualizers = [];
    
    // Erstelle neue Debug-Visualisierungen für Occlusion-Tests
    if (!this.occludedMaterial || !this.visibleMaterial) return;
    
    this.occlusionTestResults.forEach((isVisible, object) => {
      const debugMaterial = isVisible ? this.visibleMaterial : this.occludedMaterial;
      
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        debugMaterial
      );
      
      // Positioniere Debug-Kugel am Objekt
      const position = new THREE.Vector3();
      object.getWorldPosition(position);
      sphere.position.copy(position);
      
      this.debugOcclusionVisualizers.push(sphere);
      this.game.scene.add(sphere);
    });
  }

  performHierarchicalCulling() {
    // Hierarchisches Culling setzt voraus, dass Container-Objekte
    // ihre Children korrekt verwalten

    // Wenn ein Parent-Objekt unsichtbar ist, sollten auch alle Children unsichtbar sein
    // Dies ist mit THREE.js Gruppierung bereits automatisch der Fall

    // Optimierung: Explizite Hierarchie für komplexe verschachtelte Objekte
    Object.values(this.cullingHierarchy).forEach((hierarchy) => {
      if (!hierarchy.parent.visible) {
        hierarchy.children.forEach((child) => {
          child.visible = false;
        });
      }
    });
  }

  performDetailCulling() {
    // Delegate detail culling to the LODManager if available
    if (this.game.lodManager && this.game.lodManager.config.enabled) {
      // LODManager now handles detail level management
      return;
    }
    
    // Legacy detail culling implementation (fallback)
    // Level of Detail basierend auf Entfernung
    const playerPosition = this.game.player.container.position;

    // Zombies LOD
    this.game.zombieManager?.zombies.forEach((zombie) => {
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
      this.visibleTiles.forEach((tileKey) => {
        const [x, y] = tileKey.split(',').map(Number);
        const tile = this.game.map.tiles[y][x];
        
        if (!tile) return;
        
        const distance = new THREE.Vector3(x * 10 + 5, 0, y * 10 + 5)
          .distanceTo(playerPosition);
          
        if (distance > 50) {
          tile.setDetailLevel(0);
        } else if (distance > 25) {
          tile.setDetailLevel(1);
        } else {
          tile.setDetailLevel(2);
        }
      });
    }
  }

  performPortalCulling(frustum) {
    // Portal Culling für Türen, Fenster, etc.
    // Vereinfachte Implementation
    this.portals.forEach((portal) => {
      // Prüfe, ob Portal im Frustum liegt
      if (!frustum.intersectsObject(portal.mesh)) {
        portal.rooms.forEach((room) => {
          room.objects.forEach((obj) => {
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
        portal.rooms.forEach((room) => {
          room.objects.forEach((obj) => {
            obj.visible = true;
          });
        });
      }
    });
  }

  getPlayerRoom() {
    // Simplified room detection based on player position
    // In a real implementation this would be more complex
    if (!this.game.player || !this.game.city) return null;

    // For city implementation, we could implement room/building detection later
    // For now, just return null
    return null;
  }

  updateDebugVisualization() {
    if (!this.config.debugMode) return;

    // Update Frustum-Visualisierung
    if (this.frustumHelper) {
      // Berechne Box für Frustum basierend auf Kamera-Frustum
      const camera = this.game.camera;
      const frustum = this.calculateFrustum(camera);

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
  setEnabled(enabled) {
    this.config.enabled = enabled;

    // Mache alles sichtbar, wenn Culling deaktiviert wird
    if (!enabled) {
      this.showEverything();
    } else {
      // Sofort Culling durchführen
      const playerPosition = this.game.player
        ? this.game.player.container.position.clone()
        : new THREE.Vector3();
        
      if (this.game.camera) {
        const frustum = this.calculateFrustum(this.game.camera);
        this.performCulling(frustum, playerPosition);
      }
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
      this.game.zombieManager.zombies.forEach((zombie) => {
        zombie.container.visible = true;
      });
    }

    // Bullets
    if (this.game.player && this.game.player.weapon && this.game.player.weapon.bullets) {
      this.game.player.weapon.bullets.forEach((bullet) => {
        bullet.container.visible = true;
      });
    }
  }

  setViewDistance(distance) {
    this.config.viewDistance = distance;
    // Sofortiges Update erzwingen
    this.lastPlayerPosition.set(0, 0, 0);
    
    // Perform culling with current camera
    if (this.game.camera) {
      const playerPosition = this.game.player
        ? this.game.player.container.position.clone()
        : new THREE.Vector3();
      const frustum = this.calculateFrustum(this.game.camera);
      this.performCulling(frustum, playerPosition);
    }
  }

  setDebugMode(enabled) {
    this.config.debugMode = enabled;

    // Entferne bestehende Debug-Objekte
    this.debugObjects.forEach((obj) => {
      this.game.scene.remove(obj);
    });
    this.debugObjects = [];
    
    this.debugOcclusionVisualizers.forEach(obj => {
      this.game.scene.remove(obj);
    });
    this.debugOcclusionVisualizers = [];

    if (this.frustumHelper) {
      this.game.scene.remove(this.frustumHelper);
      this.frustumHelper = null;
    }

    // Erstelle neue Debug-Visualisierung
    if (enabled) {
      this.setupDebugVisualization();
    }
  }
  
  // Schalte Occlusion Culling ein/aus
  setOcclusionCullingEnabled(enabled) {
    this.config.occlusionCulling = enabled;
    this.occlusionCullingActive = enabled;
    
    if (!enabled) {
      // Alle Objekte nach Frustum-Culling sichtbar machen
      this.potentiallyVisibleObjects.forEach(obj => {
        obj.visible = true;
      });
    }
    
    console.log(`Occlusion culling ${enabled ? 'enabled' : 'disabled'}`);
  }
}
