import * as THREE from 'three';

// MaterialCache-Klasse für Wiederverwendung von Materialien
export class MaterialCache {
  constructor(assetLoader) {
    this.assetLoader = assetLoader;
    this.materials = {};
    this.initialized = false;
    
    // Material-Referenzen
    this.materialRefs = {
      'water': null,
      'grass': null,
      'land': null,
      'wall': null,
      'tree': null,
      'wallBase': null,
      'ground': null,
      'trunk': null,
      'foliage': null
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
        metalness: 0.1
      });
      
      this.materials['water'] = waterMaterial;
      this.materialRefs.water = waterMaterial;
    } else {
      // console.warn("Water texture could not be loaded!");
      
      // Create fallback water material
      const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a75ff,
        transparent: true,
        opacity: 0.8
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
        metalness: 0.1
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
        color: 0x7cfc00
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
        metalness: 0.2
      });
      
      this.materials['wall'] = wallMaterial;
      this.materialRefs.wall = wallMaterial;
    } else {
      // console.warn("Wall texture could not be loaded!");
      
      // Create fallback wall material
      const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080
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
        color: 0x228B22,
        transparent: true,
        alphaTest: 0.5,
        roughness: 0.8,
        metalness: 0.1
      });
      
      this.materials['tree'] = treeMaterial;
      this.materialRefs.tree = treeMaterial;
    } else {
      // console.warn("Tree texture could not be loaded!");
      
      // Create fallback tree material
      const treeMaterial = new THREE.MeshStandardMaterial({
        color: 0x228B22
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
      metalness: 0.1
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
      color: 0x8B4513,
      roughness: 0.9,
      metalness: 0.1
    });
    
    // Tree trunk
    const trunkTexture = this.assetLoader.getTexture('wood');
    const trunkMaterial = new THREE.MeshStandardMaterial({
      map: trunkTexture || null,
      color: 0x8B4513,
      roughness: 0.9,
      metalness: 0.1
    });
    
    // Tree foliage
    const foliageTexture = this.assetLoader.getTexture('tree');
    const foliageMaterial = new THREE.MeshStandardMaterial({
      map: foliageTexture || null,
      color: 0x228B22,
      roughness: 0.8,
      metalness: 0.1
    });
    
    // Speichere alle Materialien
    this.materials['ground'] = groundMaterial;
    this.materialRefs.ground = groundMaterial;
    
    this.materials['trunk'] = trunkMaterial;
    this.materialRefs.trunk = trunkMaterial;
    
    this.materials['foliage'] = foliageMaterial;
    this.materialRefs.foliage = foliageMaterial;
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
  constructor(assetLoader, tileType) {
    this.assetLoader = assetLoader;
    this.tileType = tileType;
    
    // Container für das Tile
    this.container = new THREE.Group();
    
    // Objekte des Tiles
    this.meshes = {};
    
    // Stelle sicher, dass der Material-Cache initialisiert ist
    this.materialCache = new MaterialCache(assetLoader);
    
    // Erzeuge das Tile basierend auf dem Typ
    this.createMesh();
  }
  
  createMesh() {
    // Basisfläche für alle Tile-Typen - leicht vergrößert, um Lücken zu vermeiden
    const baseGeometry = new THREE.PlaneGeometry(1.02, 1.02); // Überlappung von 0.02 Einheiten
    baseGeometry.rotateX(-Math.PI / 2); // Horizontal ausrichten
    
    // Stelle sicher, dass die UV-Koordinaten korrekt sind
    this.fixUVs(baseGeometry);
    
    // Verschiedene Materialien basierend auf dem Tile-Typ
    switch (this.tileType) {
      case 0: // Wasser - vereinfachte Version mit nur einem Mesh statt drei
        this.meshes.water = new THREE.Mesh(baseGeometry, this.materialCache.getMaterial('water'));
        this.meshes.water.position.y = -0.04; // Mittlere Position
        this.meshes.water.receiveShadow = true;
        this.container.add(this.meshes.water);
        
        // Deaktiviere Frustum-Culling für Wasser (verhindert Ausblenden bei Kamerabewegungen)
        this.container.frustumCulled = false;
        this.meshes.water.frustumCulled = false;
        break;
        
      case 1: // Land/Stein
        this.meshes.land = new THREE.Mesh(baseGeometry, this.materialCache.getMaterial('land'));
        this.meshes.land.receiveShadow = true;
        this.container.add(this.meshes.land);
        break;
        
      case 2: // Wand
        // Für Wände eine Box erstellen
        const wallGeometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Stelle sicher, dass die UVs für den Würfel korrekt sind
        this.fixCubeUVs(wallGeometry);
        
        this.meshes.wall = new THREE.Mesh(wallGeometry, this.materialCache.getMaterial('wall'));
        this.meshes.wall.position.y = 0.5; // Position der Box, damit sie auf dem Boden steht
        this.meshes.wall.castShadow = true;
        this.meshes.wall.receiveShadow = true;
        
        // Basisebene unter der Wand
        this.meshes.base = new THREE.Mesh(baseGeometry, this.materialCache.getMaterial('wallBase'));
        this.meshes.base.position.y = -0.01; // Leicht unter der Wandbasis, um Z-Fighting zu vermeiden
        this.meshes.base.receiveShadow = true;
        
        this.container.add(this.meshes.wall);
        this.container.add(this.meshes.base);
        break;
        
      case 3: // Baum
        // Basisebene für den Baum
        this.meshes.ground = new THREE.Mesh(baseGeometry, this.materialCache.getMaterial('ground'));
        this.meshes.ground.receiveShadow = true;
        
        // Baumstamm
        const trunkGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
        this.fixCubeUVs(trunkGeometry);
        
        this.meshes.trunk = new THREE.Mesh(trunkGeometry, this.materialCache.getMaterial('trunk'));
        this.meshes.trunk.position.y = 0.4; // Halbe Höhe des Stamms
        this.meshes.trunk.castShadow = true;
        this.meshes.trunk.receiveShadow = true;
        
        // Baumkrone
        const foliageGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        this.fixCubeUVs(foliageGeometry);
        
        this.meshes.foliage = new THREE.Mesh(foliageGeometry, this.materialCache.getMaterial('foliage'));
        this.meshes.foliage.position.y = 1.0; // Position über dem Stamm
        this.meshes.foliage.castShadow = true;
        this.meshes.foliage.receiveShadow = true;
        
        this.container.add(this.meshes.ground);
        this.container.add(this.meshes.trunk);
        this.container.add(this.meshes.foliage);
        break;
        
      default: // Gras oder Fallback
        this.meshes.grass = new THREE.Mesh(baseGeometry, this.materialCache.getMaterial('grass'));
        this.meshes.grass.receiveShadow = true;
        this.container.add(this.meshes.grass);
    }
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
        [0, 0, 1, 0, 0, 1, 1, 1]
      ];
      
      // Wir haben 6 Seiten mit je 4 Vertices (= 24 Vertices)
      for (let face = 0; face < 6; face++) {
        for (let vertex = 0; vertex < 4; vertex++) {
          const vertexIndex = face * 4 + vertex;
          const uvIndex = vertex * 2;
          
          if (vertexIndex < uvAttribute.count) {
            uvAttribute.setXY(
              vertexIndex,
              faceUVs[face][uvIndex],
              faceUVs[face][uvIndex + 1]
            );
          }
        }
      }
      
      uvAttribute.needsUpdate = true;
    }
  }
} 