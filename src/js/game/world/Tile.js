import * as THREE from 'three';

// MaterialCache-Klasse für Wiederverwendung von Materialien
export class MaterialCache {
  constructor(assetLoader) {
    this.assetLoader = assetLoader;
    this.materials = {};
    this.initialized = false;

    // Material-Referenzen
    this.materialRefs = {
      water: null,
      grass: null,
      land: null,
      wall: null,
      tree: null,
      wallBase: null,
      ground: null,
      trunk: null,
      foliage: null,
      path: null,
    };

    // Initialize cache
    this.initialize();
  }

  initialize() {
    if (this.initialized) return;

    // console.log("Initializing material cache with textures");

    // Create water material
    this.createWaterMaterial();

    // Create land material
    this.createLandMaterial();

    // Create wall material
    this.createWallMaterial();

    // Create tree material
    this.createTreeMaterial();

    // Create additional materials for more complex structures
    this.createWallBaseMaterial();
    this.createTreeDetailMaterials();

    // Create path material
    this.createPathMaterial();

    this.initialized = true;
  }

  createWaterMaterial() {
    // Get water texture from asset loader
    const waterTexture = this.assetLoader.getTexture('water');

    if (waterTexture) {
      // console.log("Water texture loaded successfully");

      // Create water material
      const waterMaterial = new THREE.MeshStandardMaterial({
        map: waterTexture,
        color: 0x1a75ff,
        transparent: true,
        opacity: 0.8,
        roughness: 0.2,
        metalness: 0.1,
      });

      this.materials['water'] = waterMaterial;
      this.materialRefs.water = waterMaterial;
    } else {
      // console.warn("Water texture could not be loaded!");

      // Create fallback water material
      const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a75ff,
        transparent: true,
        opacity: 0.8,
      });

      this.materials['water'] = waterMaterial;
      this.materialRefs.water = waterMaterial;
    }
  }

  createLandMaterial() {
    // Get grass texture from asset loader
    const grassTexture = this.assetLoader.getTexture('grass');

    if (grassTexture) {
      // console.log("Grass texture for land loaded successfully");

      // Create grass material
      const grassMaterial = new THREE.MeshStandardMaterial({
        map: grassTexture,
        color: 0x7cfc00,
        roughness: 0.8,
        metalness: 0.1,
      });

      this.materials['grass'] = grassMaterial;
      this.materialRefs.grass = grassMaterial;

      // Auch als 'land' speichern
      this.materials['land'] = grassMaterial;
      this.materialRefs.land = grassMaterial;
    } else {
      // console.warn("Grass texture for land could not be loaded!");

      // Create fallback grass material
      const grassMaterial = new THREE.MeshStandardMaterial({
        color: 0x7cfc00,
      });

      this.materials['grass'] = grassMaterial;
      this.materialRefs.grass = grassMaterial;

      // Auch als 'land' speichern
      this.materials['land'] = grassMaterial;
      this.materialRefs.land = grassMaterial;
    }
  }

  createWallMaterial() {
    // Get wall texture from asset loader
    const wallTexture = this.assetLoader.getTexture('wall');

    if (wallTexture) {
      // console.log("Wall texture loaded successfully");

      // Create wall material
      const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        color: 0x808080,
        roughness: 0.9,
        metalness: 0.2,
      });

      this.materials['wall'] = wallMaterial;
      this.materialRefs.wall = wallMaterial;
    } else {
      // console.warn("Wall texture could not be loaded!");

      // Create fallback wall material
      const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
      });

      this.materials['wall'] = wallMaterial;
      this.materialRefs.wall = wallMaterial;
    }
  }

  createTreeMaterial() {
    // Get tree texture from asset loader
    const treeTexture = this.assetLoader.getTexture('tree');

    if (treeTexture) {
      // console.log("Tree texture loaded successfully");

      // Create tree material
      const treeMaterial = new THREE.MeshStandardMaterial({
        map: treeTexture,
        color: 0x228b22,
        transparent: true,
        alphaTest: 0.5,
        roughness: 0.8,
        metalness: 0.1,
      });

      this.materials['tree'] = treeMaterial;
      this.materialRefs.tree = treeMaterial;
    } else {
      // console.warn("Tree texture could not be loaded!");

      // Create fallback tree material
      const treeMaterial = new THREE.MeshStandardMaterial({
        color: 0x228b22,
      });

      this.materials['tree'] = treeMaterial;
      this.materialRefs.tree = treeMaterial;
    }
  }

  // Neue Methode für zusätzliche Materialien
  createWallBaseMaterial() {
    // Wall base material
    const wallBaseTexture = this.assetLoader.getTexture('stone');
    const wallBaseMaterial = new THREE.MeshStandardMaterial({
      map: wallBaseTexture || null,
      color: 0x6d6d6d,
      roughness: 0.9,
      metalness: 0.1,
    });

    this.materials['wallBase'] = wallBaseMaterial;
    this.materialRefs.wallBase = wallBaseMaterial;
  }

  // Materialien für Baumdetails
  createTreeDetailMaterials() {
    // Ground material under trees
    const groundTexture = this.assetLoader.getTexture('dirt');
    const groundMaterial = new THREE.MeshStandardMaterial({
      map: groundTexture || null,
      color: 0x8b4513,
      roughness: 0.9,
      metalness: 0.1,
      normalScale: new THREE.Vector2(0.5, 0.5), // Leichte Oberflächentextur
    });

    // Tree trunk - Verwendung von Holztextur
    const trunkTexture = this.assetLoader.getTexture('wood');
    const trunkMaterial = new THREE.MeshStandardMaterial({
      map: trunkTexture || null,
      color: 0x8b4513,
      roughness: 0.85,
      metalness: 0.0,
      bumpMap: trunkTexture || null, // Textur auch als Bump Map verwenden
      bumpScale: 0.05, // Subtile Hervorhebungen
      aoMapIntensity: 0.8, // Ambient Occlusion
      displacementScale: 0.05,
    });

    // Tree foliage - Verbesserte Blättertextur
    const foliageTexture = this.assetLoader.getTexture('tree');
    const foliageMaterial = new THREE.MeshStandardMaterial({
      map: foliageTexture || null,
      color: 0x2d8a32, // Leicht gedunkeltes Grün
      roughness: 0.9, // Blätter sind nicht glänzend
      metalness: 0.0, // Keine metallischen Eigenschaften
      alphaTest: 0.7, // Scharfe Kanten für Blätter
      side: THREE.DoubleSide, // Beidseitig rendern
      flatShading: true, // Für einen stilisierteren Look
      // Emission für subtilen Lichteffekt in den Blättern
      emissive: 0x0a2a0a,
      emissiveIntensity: 0.1,
    });

    // Speichere alle Materialien
    this.materials['ground'] = groundMaterial;
    this.materialRefs.ground = groundMaterial;

    this.materials['trunk'] = trunkMaterial;
    this.materialRefs.trunk = trunkMaterial;

    this.materials['foliage'] = foliageMaterial;
    this.materialRefs.foliage = foliageMaterial;
  }

  // Pfad-Material erstellen
  createPathMaterial() {
    const pathTexture = this.assetLoader.getTexture('path');
    const pathMaterial = new THREE.MeshStandardMaterial({
      map: pathTexture || null,
      color: 0xd2b48c, // Sandfarbe für Pfade
      roughness: 0.8,
      metalness: 0.1,
    });

    this.materials['path'] = pathMaterial;
    this.materialRefs.path = pathMaterial;
  }

  // Get a material from the cache
  getMaterial(key) {
    // Special case for water.combined (water animation may use this)
    if (key === 'water.combined') {
      // Return combined water material if exists
      if (this.materials['water.combined']) {
        if (this.materials['water.combined'].map) {
          return this.materials['water.combined'];
        } else {
          // console.warn(`Material 'water.combined' has no texture`);
        }
      } else {
        // console.warn(`Material 'water.combined' is missing or invalid`);
      }
    }

    // Return material from cache if exists
    if (this.materials[key]) {
      if (this.materials[key].map) {
        return this.materials[key];
      } else {
        // console.warn(`Material '${key}' has no texture`);
      }
    }

    // Return fallback material for known types
    if (this.materialRefs[key]) {
      return this.materialRefs[key];
    }

    // console.warn(`Material '${type}' not found in cache`);
    return new THREE.MeshStandardMaterial({ color: 0xff00ff }); // Magenta as error color
  }
}

export class Tile {
  constructor(game, assetLoader, x, z, tileType, height = 1, special = null) {
    this.game = game;
    this.assetLoader = assetLoader;
    this.x = x;
    this.z = z;
    this.tileType = tileType;
    this.height = height;
    this.special = special;

    // Level of Detail (LOD) System
    this.currentDetailLevel = 'high'; // high, medium, low
    this.detailLevels = {
      high: {}, // Detaillierte Meshes für nahe Kamera
      medium: {}, // Mittlere Detailstufe
      low: {}, // Niedrige Detailstufe für weit entfernte Objekte
    };

    // Create container for this tile
    this.container = new THREE.Group();

    // Position container in the world
    this.container.position.set(x, 0, z);

    // Create the visual representation
    this.createMesh();
  }

  createMesh() {
    // Für jede Detailstufe die passenden Meshes erzeugen
    switch (this.tileType) {
      case 0: // Wasser
        this.createWaterMesh();
        break;
      case 1: // Land/Stein
        this.createLandMesh();
        break;
      case 2: // Wand/Mauer
        this.createWallMesh();
        break;
      case 3: // Baum
        this.createTreeMesh();
        break;
      case 4: // Pfad/Weg
        this.createRoadMesh();
        break;
      case 5: // Sand/Strand
        this.createSandMesh();
        break;
      case 6: // Brücke
        this.createBridgeMesh();
        break;
      case 7: // Gebäude
        this.createBuildingMesh();
        break;
      default:
        // Falls unbekannter Typ, erstelle ein einfaches Standard-Mesh
        this.createDefaultMesh();
    }
  }

  // Erstellt Wasser-Mesh mit Animation
  createWaterMesh() {
    // HIGH DETAIL
    const waterGeometryHigh = new THREE.PlaneGeometry(1, 1, 4, 4);
    const waterMaterialHigh = new THREE.MeshStandardMaterial({
      color: 0x3366ff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    const waterMeshHigh = new THREE.Mesh(waterGeometryHigh, waterMaterialHigh);
    waterMeshHigh.rotation.x = -Math.PI / 2;
    waterMeshHigh.position.y = -0.1; // Leicht unter Normalniveau für besseren visuellen Effekt

    this.detailLevels.high.water = waterMeshHigh;

    // MEDIUM DETAIL
    const waterGeometryMedium = new THREE.PlaneGeometry(1, 1, 2, 2);
    const waterMaterialMedium = new THREE.MeshStandardMaterial({
      color: 0x3366ff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    const waterMeshMedium = new THREE.Mesh(waterGeometryMedium, waterMaterialMedium);
    waterMeshMedium.rotation.x = -Math.PI / 2;
    waterMeshMedium.position.y = -0.1;
    waterMeshMedium.visible = false;

    this.detailLevels.medium.water = waterMeshMedium;

    // LOW DETAIL
    const waterGeometryLow = new THREE.PlaneGeometry(1, 1, 1, 1);
    const waterMaterialLow = new THREE.MeshStandardMaterial({
      color: 0x3366ff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });

    const waterMeshLow = new THREE.Mesh(waterGeometryLow, waterMaterialLow);
    waterMeshLow.rotation.x = -Math.PI / 2;
    waterMeshLow.position.y = -0.1;
    waterMeshLow.visible = false;

    this.detailLevels.low.water = waterMeshLow;
  }

  // Erstellt Land/Stein-Mesh
  createLandMesh() {
    // HIGH DETAIL
    const landGeometryHigh = new THREE.BoxGeometry(1, 0.2 + this.height, 1);
    const landMaterialHigh = new THREE.MeshStandardMaterial({
      color: 0x44aa44,
      flatShading: true,
    });

    const landMeshHigh = new THREE.Mesh(landGeometryHigh, landMaterialHigh);
    landMeshHigh.position.y = -0.1 + this.height / 2;
    landMeshHigh.castShadow = true;
    landMeshHigh.receiveShadow = true;

    this.detailLevels.high.grass = landMeshHigh;

    // MEDIUM DETAIL
    const landGeometryMedium = new THREE.BoxGeometry(1, 0.2 + this.height, 1);
    const landMaterialMedium = new THREE.MeshStandardMaterial({
      color: 0x44aa44,
      flatShading: false,
    });

    const landMeshMedium = new THREE.Mesh(landGeometryMedium, landMaterialMedium);
    landMeshMedium.position.y = -0.1 + this.height / 2;
    landMeshMedium.castShadow = false;
    landMeshMedium.receiveShadow = true;
    landMeshMedium.visible = false;

    this.detailLevels.medium.grass = landMeshMedium;

    // LOW DETAIL
    const landGeometryLow = new THREE.BoxGeometry(1, 0.2 + this.height, 1);
    const landMaterialLow = new THREE.MeshBasicMaterial({
      color: 0x44aa44,
    });

    const landMeshLow = new THREE.Mesh(landGeometryLow, landMaterialLow);
    landMeshLow.position.y = -0.1 + this.height / 2;
    landMeshLow.castShadow = false;
    landMeshLow.receiveShadow = false;
    landMeshLow.visible = false;

    this.detailLevels.low.grass = landMeshLow;
  }

  // Erstellt Wand/Mauer-Mesh
  createWallMesh() {
    // HIGH DETAIL - Basis
    const baseGeometryHigh = new THREE.BoxGeometry(1, 0.2, 1);
    const baseMaterialHigh = new THREE.MeshStandardMaterial({
      color: 0x888888,
      flatShading: true,
    });

    const baseMeshHigh = new THREE.Mesh(baseGeometryHigh, baseMaterialHigh);
    baseMeshHigh.position.y = -0.1 + 0.1;
    baseMeshHigh.castShadow = true;
    baseMeshHigh.receiveShadow = true;

    this.detailLevels.high.base = baseMeshHigh;

    // HIGH DETAIL - Wand
    const wallGeometryHigh = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const wallMaterialHigh = new THREE.MeshStandardMaterial({
      color: 0x666666,
      flatShading: true,
    });

    const wallMeshHigh = new THREE.Mesh(wallGeometryHigh, wallMaterialHigh);
    wallMeshHigh.position.y = 0.2 + 0.4;
    wallMeshHigh.castShadow = true;
    wallMeshHigh.receiveShadow = true;

    this.detailLevels.high.wall = wallMeshHigh;

    // MEDIUM DETAIL
    const combinedGeometryMedium = new THREE.BoxGeometry(0.9, 1.0, 0.9);
    const combinedMaterialMedium = new THREE.MeshStandardMaterial({
      color: 0x666666,
    });

    const combinedMeshMedium = new THREE.Mesh(combinedGeometryMedium, combinedMaterialMedium);
    combinedMeshMedium.position.y = 0.4;
    combinedMeshMedium.castShadow = true;
    combinedMeshMedium.receiveShadow = true;
    combinedMeshMedium.visible = false;

    this.detailLevels.medium.wall = combinedMeshMedium;

    // LOW DETAIL
    const combinedGeometryLow = new THREE.BoxGeometry(0.9, 1.0, 0.9);
    const combinedMaterialLow = new THREE.MeshBasicMaterial({
      color: 0x666666,
    });

    const combinedMeshLow = new THREE.Mesh(combinedGeometryLow, combinedMaterialLow);
    combinedMeshLow.position.y = 0.4;
    combinedMeshLow.castShadow = false;
    combinedMeshLow.receiveShadow = false;
    combinedMeshLow.visible = false;

    this.detailLevels.low.wall = combinedMeshLow;
  }

  // Erstellt ein Standard-Mesh für unbekannte Tile-Typen
  createDefaultMesh() {
    // HIGH DETAIL
    const defaultGeometryHigh = new THREE.BoxGeometry(1, 0.2, 1);
    const defaultMaterialHigh = new THREE.MeshStandardMaterial({
      color: 0xcccccc, // Grau
      flatShading: true,
    });

    const defaultMeshHigh = new THREE.Mesh(defaultGeometryHigh, defaultMaterialHigh);
    defaultMeshHigh.position.y = -0.1 + 0.1;
    defaultMeshHigh.castShadow = true;
    defaultMeshHigh.receiveShadow = true;

    this.detailLevels.high.default = defaultMeshHigh;

    // MEDIUM DETAIL
    const defaultGeometryMedium = new THREE.BoxGeometry(1, 0.2, 1);
    const defaultMaterialMedium = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      flatShading: false,
    });

    const defaultMeshMedium = new THREE.Mesh(defaultGeometryMedium, defaultMaterialMedium);
    defaultMeshMedium.position.y = -0.1 + 0.1;
    defaultMeshMedium.castShadow = false;
    defaultMeshMedium.receiveShadow = true;
    defaultMeshMedium.visible = false;

    this.detailLevels.medium.default = defaultMeshMedium;

    // LOW DETAIL
    const defaultGeometryLow = new THREE.BoxGeometry(1, 0.2, 1);
    const defaultMaterialLow = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
    });

    const defaultMeshLow = new THREE.Mesh(defaultGeometryLow, defaultMaterialLow);
    defaultMeshLow.position.y = -0.1 + 0.1;
    defaultMeshLow.castShadow = false;
    defaultMeshLow.receiveShadow = false;
    defaultMeshLow.visible = false;

    this.detailLevels.low.default = defaultMeshLow;
  }

  // Erstellt Pfad/Straßen-Mesh
  createRoadMesh() {
    // HIGH DETAIL
    const roadGeometryHigh = new THREE.BoxGeometry(1, 0.15, 1);
    const roadMaterialHigh = new THREE.MeshStandardMaterial({
      color: 0xd2b48c, // Sandfarbe für Pfade
      roughness: 0.8,
      metalness: 0.1,
    });

    const roadMeshHigh = new THREE.Mesh(roadGeometryHigh, roadMaterialHigh);
    roadMeshHigh.position.y = -0.1 + 0.075;
    roadMeshHigh.castShadow = false;
    roadMeshHigh.receiveShadow = true;

    this.detailLevels.high.road = roadMeshHigh;

    // MEDIUM DETAIL
    const roadGeometryMedium = new THREE.BoxGeometry(1, 0.15, 1);
    const roadMaterialMedium = new THREE.MeshStandardMaterial({
      color: 0xd2b48c,
      roughness: 0.8,
      metalness: 0.1,
    });

    const roadMeshMedium = new THREE.Mesh(roadGeometryMedium, roadMaterialMedium);
    roadMeshMedium.position.y = -0.1 + 0.075;
    roadMeshMedium.castShadow = false;
    roadMeshMedium.receiveShadow = true;
    roadMeshMedium.visible = false;

    this.detailLevels.medium.road = roadMeshMedium;

    // LOW DETAIL
    const roadGeometryLow = new THREE.BoxGeometry(1, 0.15, 1);
    const roadMaterialLow = new THREE.MeshBasicMaterial({
      color: 0xd2b48c,
    });

    const roadMeshLow = new THREE.Mesh(roadGeometryLow, roadMaterialLow);
    roadMeshLow.position.y = -0.1 + 0.075;
    roadMeshLow.castShadow = false;
    roadMeshLow.receiveShadow = false;
    roadMeshLow.visible = false;

    this.detailLevels.low.road = roadMeshLow;
  }

  // Setzt die aktuelle Detailstufe
  setDetailLevel(level) {
    if (level === this.currentDetailLevel) return;

    // Aktuelle Meshes ausblenden
    Object.values(this.detailLevels[this.currentDetailLevel]).forEach((mesh) => {
      if (mesh) mesh.visible = false;
    });

    // Neue Meshes einblenden
    Object.values(this.detailLevels[level]).forEach((mesh) => {
      if (mesh) mesh.visible = true;
    });

    this.currentDetailLevel = level;
  }

  // Hilfsmethode, um UV-Koordinaten für korrekte Texturierung zu fixieren
  fixUVs(geometry) {
    const uvAttribute = geometry.getAttribute('uv');

    if (uvAttribute) {
      for (let i = 0; i < uvAttribute.count; i++) {
        // Stelle sicher, dass die UV-Koordinaten zwischen 0 und 1 liegen
        const u = Math.max(0, Math.min(1, uvAttribute.getX(i)));
        const v = Math.max(0, Math.min(1, uvAttribute.getY(i)));

        uvAttribute.setXY(i, u, v);
      }

      uvAttribute.needsUpdate = true;
    }
  }

  // Hilfsmethode, um UV-Koordinaten für korrekte Texturierung von Würfeln zu fixieren
  fixCubeUVs(geometry) {
    const uvAttribute = geometry.getAttribute('uv');

    if (uvAttribute) {
      // BoxGeometry hat 6 Seiten mit je 4 Vertices (2 Dreiecke pro Seite)
      // Für jede Seite wollen wir die UVs so setzen, dass die Textur korrekt gemappt wird

      // Koordinaten für jede Seite des Würfels
      const faceUVs = [
        // Vorne
        [0, 0, 1, 0, 0, 1, 1, 1],
        // Hinten
        [0, 0, 1, 0, 0, 1, 1, 1],
        // Oben
        [0, 0, 1, 0, 0, 1, 1, 1],
        // Unten
        [0, 0, 1, 0, 0, 1, 1, 1],
        // Rechts
        [0, 0, 1, 0, 0, 1, 1, 1],
        // Links
        [0, 0, 1, 0, 0, 1, 1, 1],
      ];

      // Wir haben 6 Seiten mit je 4 Vertices (= 24 Vertices)
      for (let face = 0; face < 6; face++) {
        for (let vertex = 0; vertex < 4; vertex++) {
          const vertexIndex = face * 4 + vertex;
          const uvIndex = vertex * 2;

          if (vertexIndex < uvAttribute.count) {
            uvAttribute.setXY(vertexIndex, faceUVs[face][uvIndex], faceUVs[face][uvIndex + 1]);
          }
        }
      }

      uvAttribute.needsUpdate = true;
    }
  }
}
