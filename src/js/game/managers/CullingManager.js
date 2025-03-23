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
    const size = 256; // Niedrige Auflösung für Performance
    this.occlusionRenderTarget = new THREE.WebGLRenderTarget(size, size, {
      format: THREE.RedFormat,
      type: THREE.UnsignedByteType,
    });

    // Spezielles Material für Tiefeninformationen
    this.occlusionDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
    });

    // Identifiziere große Objekte als potentielle Verdeckungen
    this.identifyOccluders();
  }

  identifyOccluders() {
    // Finde große Objekte in der Szene, die potentiell andere verdecken können
    this.occluders = [];

    // Gebäude und große Strukturen als Occluder hinzufügen
    if (this.game.city && this.game.city.container) {
      this.game.city.container.children.forEach((child) => {
        if (child.isGroup && child.children.some((building) => building.isMesh)) {
          this.occluders.push(child);
        }
      });
    }
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
    // Perform frustum culling if enabled
    if (this.config.frustumCulling) {
      this.performFrustumCulling(frustum, playerPosition);
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
      zombie.container.visible = true;
    });
  }

  cullingMiscObjects(frustum) {
    // Bullets
    if (this.game.player && this.game.player.weapon && this.game.player.weapon.bullets) {
      this.game.player.weapon.bullets.forEach((bullet) => {
        const boundingSphere = new THREE.Sphere(bullet.container.position, 0.5);
        bullet.container.visible = frustum.intersectsSphere(boundingSphere);
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
    });
  }

  performOcclusionCulling() {
    if (!this.occlusionCamera || this.visibleZombies.size === 0) return;

    // Update Occlusion-Kamera
    this.occlusionCamera.copy(this.game.camera);

    // Rendere Occluder in die Tiefentextur
    const originalMaterials = new Map();

    // Setup Szene für Occlusion-Test
    this.occluders.forEach((occluder) => {
      occluder.traverse((obj) => {
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
    this.occluders.forEach((occluder) => {
      occluder.traverse((obj) => {
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
    this.visibleZombies.forEach((zombie) => {
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

        if (distanceToOccluder < distanceToZombie * 0.95) {
          // 5% Toleranz
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
    Object.values(this.cullingHierarchy).forEach((hierarchy) => {
      if (!hierarchy.parent.visible) {
        hierarchy.children.forEach((child) => {
          child.visible = false;
        });
      }
    });
  }

  performDetailCulling() {
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
    this.performCulling();
  }

  setDebugMode(enabled) {
    this.config.debugMode = enabled;

    // Entferne bestehende Debug-Objekte
    this.debugObjects.forEach((obj) => {
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
