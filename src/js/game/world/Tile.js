import * as THREE from 'three';

// Statische Material-Cache für optimierte Materialwiederverwendung
export class MaterialCache {
  static materials = {
    water: {
      combined: null // Vereinfachtes Wassermaterial statt 3 separater Materialien
    },
    land: null,
    wall: null,
    wallBase: null,
    ground: null,
    trunk: null,
    foliage: null,
    grass: null
  };
  
  static initialize(assetLoader) {
    console.log("Initializing material cache with textures");
    
    // Vereinfachtes Wassermaterial - nur eine Schicht statt drei
    this.materials.water.combined = new THREE.MeshStandardMaterial({
      map: assetLoader.getTexture('water'),
      transparent: true,
      opacity: 0.9,
      color: 0x4d94ff,
      side: THREE.DoubleSide,
      roughness: 0.3,
      metalness: 0.1,
      depthWrite: true,
      depthTest: true
    });
    
    // Stelle sicher, dass die Textur richtig geladen ist
    if (this.materials.water.combined.map) {
      this.materials.water.combined.map.anisotropy = 4; // Reduziert von 16
      this.materials.water.combined.map.wrapS = THREE.RepeatWrapping;
      this.materials.water.combined.map.wrapT = THREE.RepeatWrapping;
      this.materials.water.combined.map.repeat.set(1, 1);
      this.materials.water.combined.map.needsUpdate = true;
      console.log("Water texture loaded successfully");
    } else {
      console.warn("Water texture could not be loaded!");
    }
    
    // Land/Stein Material
    this.materials.land = new THREE.MeshStandardMaterial({
      map: assetLoader.getTexture('grass'),
      roughness: 0.8,
      metalness: 0.0,
      side: THREE.FrontSide
    });
    
    if (this.materials.land.map) {
      this.materials.land.map.anisotropy = 4;
      this.materials.land.map.wrapS = THREE.RepeatWrapping;
      this.materials.land.map.wrapT = THREE.RepeatWrapping;
      this.materials.land.map.repeat.set(1, 1);
      this.materials.land.map.needsUpdate = true;
      console.log("Grass texture for land loaded successfully");
    } else {
      console.warn("Grass texture for land could not be loaded!");
    }
    
    // Wand-Materialien
    this.materials.wall = new THREE.MeshStandardMaterial({
      map: assetLoader.getTexture('wall'),
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.FrontSide
    });
    
    if (this.materials.wall.map) {
      this.materials.wall.map.anisotropy = 4;
      this.materials.wall.map.wrapS = THREE.RepeatWrapping;
      this.materials.wall.map.wrapT = THREE.RepeatWrapping;
      this.materials.wall.map.repeat.set(1, 1);
      this.materials.wall.map.needsUpdate = true;
      console.log("Wall texture loaded successfully");
    } else {
      console.warn("Wall texture could not be loaded!");
    }
    
    this.materials.wallBase = new THREE.MeshStandardMaterial({
      map: assetLoader.getTexture('stone'),
      roughness: 0.8,
      metalness: 0.0,
      side: THREE.FrontSide
    });
    
    if (this.materials.wallBase.map) {
      this.materials.wallBase.map.anisotropy = 4;
      this.materials.wallBase.map.wrapS = THREE.RepeatWrapping;
      this.materials.wallBase.map.wrapT = THREE.RepeatWrapping;
      this.materials.wallBase.map.repeat.set(1, 1);
      this.materials.wallBase.map.needsUpdate = true;
    }
    
    // Baum-Materialien
    this.materials.ground = new THREE.MeshStandardMaterial({
      map: assetLoader.getTexture('grass'),
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.FrontSide
    });
    
    if (this.materials.ground.map) {
      this.materials.ground.map.anisotropy = 4;
      this.materials.ground.map.wrapS = THREE.RepeatWrapping;
      this.materials.ground.map.wrapT = THREE.RepeatWrapping;
      this.materials.ground.map.repeat.set(1, 1);
      this.materials.ground.map.needsUpdate = true;
      console.log("Grass texture loaded successfully");
    } else {
      console.warn("Grass texture could not be loaded!");
    }
    
    this.materials.trunk = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.9,
      metalness: 0.0
    });
    
    this.materials.foliage = new THREE.MeshStandardMaterial({
      map: assetLoader.getTexture('tree'),
      roughness: 0.8,
      metalness: 0.0
    });
    
    if (this.materials.foliage.map) {
      this.materials.foliage.map.anisotropy = 4;
      this.materials.foliage.map.wrapS = THREE.RepeatWrapping;
      this.materials.foliage.map.wrapT = THREE.RepeatWrapping;
      this.materials.foliage.map.repeat.set(1, 1);
      this.materials.foliage.map.needsUpdate = true;
      console.log("Tree texture loaded successfully");
    } else {
      console.warn("Tree texture could not be loaded!");
    }
    
    // Gras-Material
    this.materials.grass = new THREE.MeshStandardMaterial({
      map: assetLoader.getTexture('grass'),
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.FrontSide
    });
    
    if (this.materials.grass.map) {
      this.materials.grass.map.anisotropy = 4;
      this.materials.grass.map.wrapS = THREE.RepeatWrapping;
      this.materials.grass.map.wrapT = THREE.RepeatWrapping;
      this.materials.grass.map.repeat.set(1, 1);
      this.materials.grass.map.needsUpdate = true;
    }
    
    // Prüfe, ob alle Materialien korrekt erstellt wurden
    this.validateMaterials();
  }
  
  static validateMaterials() {
    // Prüfe alle Materialien und gib Warnungen aus, wenn Probleme bestehen
    for (const [key, material] of Object.entries(this.materials)) {
      if (key === 'water') {
        if (!material.combined) {
          console.warn(`Material 'water.combined' is missing or invalid`);
        } else if (!material.combined.map) {
          console.warn(`Material 'water.combined' has no texture`);
        }
      } else if (!material) {
        console.warn(`Material '${key}' is missing or invalid`);
      } else if (key !== 'trunk' && !material.map) {
        console.warn(`Material '${key}' has no texture`);
      }
    }
  }
  
  static getMaterial(type) {
    const material = type === 'water' ? this.materials.water.combined : this.materials[type];
    
    if (!material) {
      console.warn(`Material '${type}' not found in cache`);
      // Erzeuge ein einfarbiges Fallback-Material
      return new THREE.MeshStandardMaterial({
        color: this.getFallbackColor(type),
        roughness: 0.8,
        metalness: 0.0
      });
    }
    
    return material;
  }
  
  static getFallbackColor(type) {
    // Wähle eine passende Farbe basierend auf dem Materialtyp
    switch (type) {
      case 'water': return 0x4d94ff; // Blau
      case 'land': case 'wallBase': return 0x9E9E9E; // Grau
      case 'wall': return 0x795548; // Braun
      case 'ground': case 'grass': return 0x4CAF50; // Grün
      case 'trunk': return 0x8B4513; // Braun
      case 'foliage': return 0x33691E; // Dunkelgrün
      default: return 0xCCCCCC; // Hellgrau als Default
    }
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
    if (!MaterialCache.materials.water.combined) {
      MaterialCache.initialize(assetLoader);
    }
    
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
        this.meshes.water = new THREE.Mesh(baseGeometry, MaterialCache.getMaterial('water'));
        this.meshes.water.position.y = -0.04; // Mittlere Position
        this.meshes.water.receiveShadow = true;
        this.container.add(this.meshes.water);
        
        // Deaktiviere Frustum-Culling für Wasser (verhindert Ausblenden bei Kamerabewegungen)
        this.container.frustumCulled = false;
        this.meshes.water.frustumCulled = false;
        break;
        
      case 1: // Land/Stein
        this.meshes.land = new THREE.Mesh(baseGeometry, MaterialCache.getMaterial('land'));
        this.meshes.land.receiveShadow = true;
        this.container.add(this.meshes.land);
        break;
        
      case 2: // Wand
        // Für Wände eine Box erstellen
        const wallGeometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Stelle sicher, dass die UVs für den Würfel korrekt sind
        this.fixCubeUVs(wallGeometry);
        
        this.meshes.wall = new THREE.Mesh(wallGeometry, MaterialCache.getMaterial('wall'));
        this.meshes.wall.position.y = 0.5; // Position der Box, damit sie auf dem Boden steht
        this.meshes.wall.castShadow = true;
        this.meshes.wall.receiveShadow = true;
        
        // Basisebene unter der Wand
        this.meshes.base = new THREE.Mesh(baseGeometry, MaterialCache.getMaterial('wallBase'));
        this.meshes.base.position.y = -0.01; // Leicht unter der Wandbasis, um Z-Fighting zu vermeiden
        this.meshes.base.receiveShadow = true;
        
        this.container.add(this.meshes.wall);
        this.container.add(this.meshes.base);
        break;
        
      case 3: // Baum
        // Basisebene für den Baum
        this.meshes.ground = new THREE.Mesh(baseGeometry, MaterialCache.getMaterial('ground'));
        this.meshes.ground.receiveShadow = true;
        
        // Baumstamm
        const trunkGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
        this.fixCubeUVs(trunkGeometry);
        
        this.meshes.trunk = new THREE.Mesh(trunkGeometry, MaterialCache.getMaterial('trunk'));
        this.meshes.trunk.position.y = 0.4; // Halbe Höhe des Stamms
        this.meshes.trunk.castShadow = true;
        this.meshes.trunk.receiveShadow = true;
        
        // Baumkrone
        const foliageGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        this.fixCubeUVs(foliageGeometry);
        
        this.meshes.foliage = new THREE.Mesh(foliageGeometry, MaterialCache.getMaterial('foliage'));
        this.meshes.foliage.position.y = 1.0; // Position über dem Stamm
        this.meshes.foliage.castShadow = true;
        this.meshes.foliage.receiveShadow = true;
        
        this.container.add(this.meshes.ground);
        this.container.add(this.meshes.trunk);
        this.container.add(this.meshes.foliage);
        break;
        
      default: // Gras oder Fallback
        this.meshes.grass = new THREE.Mesh(baseGeometry, MaterialCache.getMaterial('grass'));
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