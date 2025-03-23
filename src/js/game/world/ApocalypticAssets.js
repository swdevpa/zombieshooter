import * as THREE from 'three';

/**
 * ApocalypticAssets class - Procedurally generates various apocalyptic-themed assets
 * for enhancing the post-apocalyptic atmosphere of the game world.
 */
export class ApocalypticAssets {
  constructor(game, city) {
    this.game = game;
    this.city = city;
    
    // Container for all apocalyptic assets
    this.container = new THREE.Group();
    this.container.name = 'apocalypticAssets';
    
    // Component groups for organization
    this.barricades = new THREE.Group();
    this.gore = new THREE.Group();
    this.wreckage = new THREE.Group();
    this.militaryItems = new THREE.Group();
    this.foliage = new THREE.Group();
    this.fireAndSmoke = new THREE.Group();
    
    // Add component groups to container
    this.container.add(this.barricades);
    this.container.add(this.gore);
    this.container.add(this.wreckage);
    this.container.add(this.militaryItems);
    this.container.add(this.foliage);
    this.container.add(this.fireAndSmoke);
    
    // Collision meshes
    this.collisionObjects = [];
    
    // Materials cache
    this.materials = {
      // Basic materials
      wood: new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9, metalness: 0.1 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x7F7F7F, roughness: 0.7, metalness: 0.5 }),
      blood: new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 1.0, metalness: 0.0 }),
      concrete: new THREE.MeshStandardMaterial({ color: 0x9E9E9E, roughness: 0.9, metalness: 0.1 }),
      military: new THREE.MeshStandardMaterial({ color: 0x4B5320, roughness: 0.8, metalness: 0.2 }),
      fabric: new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 1.0, metalness: 0.0 }),
      plants: new THREE.MeshStandardMaterial({ color: 0x33691E, roughness: 0.9, metalness: 0.0 }),
      rustyMetal: new THREE.MeshStandardMaterial({ color: 0x8D6E63, roughness: 0.8, metalness: 0.3 })
    };
    
    // Use texturing system if available
    if (this.game.texturingSystem) {
      this.materials = {
        wood: this.game.texturingSystem.getApocalypticMaterial('wood'),
        metal: this.game.texturingSystem.getApocalypticMaterial('metal'),
        blood: this.game.texturingSystem.getApocalypticMaterial('blood'),
        concrete: this.game.texturingSystem.getApocalypticMaterial('concrete'),
        military: this.game.texturingSystem.getApocalypticMaterial('military'),
        fabric: this.game.texturingSystem.getApocalypticMaterial('fabric'),
        plants: this.game.texturingSystem.getApocalypticMaterial('plants'),
        rustyMetal: this.game.texturingSystem.getApocalypticMaterial('rustyMetal')
      };
    }
    
    // Geometries
    this.initGeometries();
    
    // Instance counters for performance
    this.instanceCounts = {
      barricade: 0,
      bloodPool: 0,
      corpse: 0,
      militaryBarrier: 0,
      militaryCrate: 0,
      wreckPiece: 0,
      plant: 0,
      fireEmber: 0
    };
    
    // Maximum instances (pre-allocate for instanced meshes)
    this.maxInstances = {
      barricade: 100,
      bloodPool: 200,
      corpse: 100,
      militaryBarrier: 50,
      militaryCrate: 50,
      wreckPiece: 200,
      plant: 300,
      fireEmber: 150
    };
    
    // Instanced meshes
    this.instancedMeshes = {};
    this.initInstancedMeshes();
  }
  
  /**
   * Initialize geometries for apocalyptic assets
   */
  initGeometries() {
    this.geometries = {
      // Barricades
      woodenPlank: new THREE.BoxGeometry(0.2, 0.05, 1.0),
      woodenBoardLarge: new THREE.BoxGeometry(1.5, 0.08, 0.3),
      metalSheet: new THREE.BoxGeometry(1.0, 0.02, 1.0),
      barricadePost: new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8),
      
      // Gore
      bloodPool: new THREE.CircleGeometry(0.5, 16),
      bodyPart: new THREE.CapsuleGeometry(0.15, 0.4, 4, 8),
      
      // Wreckage
      concretePiece: new THREE.BoxGeometry(0.4, 0.2, 0.3),
      concreteRubble: new THREE.DodecahedronGeometry(0.3, 0),
      metalPipe: new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8),
      metalDebris: new THREE.BoxGeometry(0.3, 0.05, 0.3),
      
      // Military items
      militaryBarrier: new THREE.BoxGeometry(1.0, 1.0, 0.5),
      militaryCrate: new THREE.BoxGeometry(0.8, 0.6, 0.8),
      sandbag: new THREE.BoxGeometry(0.4, 0.25, 0.2),
      
      // Foliage
      weed: new THREE.PlaneGeometry(0.5, 0.5),
      ivyStrand: new THREE.PlaneGeometry(0.3, 1.0),
      smallBush: new THREE.SphereGeometry(0.3, 8, 8),
      
      // Fire and smoke
      ember: new THREE.SphereGeometry(0.05, 8, 8),
      smokeParticle: new THREE.PlaneGeometry(0.5, 0.5)
    };
  }
  
  /**
   * Initialize instanced meshes for optimized rendering
   */
  initInstancedMeshes() {
    // Create instanced meshes for repetitive elements
    this.instancedMeshes = {
      // Barricades
      woodenPlank: new THREE.InstancedMesh(
        this.geometries.woodenPlank,
        this.materials.wood,
        this.maxInstances.barricade
      ),
      metalSheet: new THREE.InstancedMesh(
        this.geometries.metalSheet,
        this.materials.metal,
        this.maxInstances.barricade
      ),
      
      // Gore
      bloodPool: new THREE.InstancedMesh(
        this.geometries.bloodPool,
        this.materials.blood,
        this.maxInstances.bloodPool
      ),
      bodyPart: new THREE.InstancedMesh(
        this.geometries.bodyPart,
        this.materials.fabric,
        this.maxInstances.corpse
      ),
      
      // Wreckage
      concretePiece: new THREE.InstancedMesh(
        this.geometries.concretePiece,
        this.materials.concrete,
        this.maxInstances.wreckPiece
      ),
      metalPipe: new THREE.InstancedMesh(
        this.geometries.metalPipe,
        this.materials.rustyMetal,
        this.maxInstances.wreckPiece
      ),
      
      // Military items
      militaryBarrier: new THREE.InstancedMesh(
        this.geometries.militaryBarrier,
        this.materials.military,
        this.maxInstances.militaryBarrier
      ),
      militaryCrate: new THREE.InstancedMesh(
        this.geometries.militaryCrate,
        this.materials.military,
        this.maxInstances.militaryCrate
      ),
      
      // Plants
      weed: new THREE.InstancedMesh(
        this.geometries.weed,
        this.materials.plants,
        this.maxInstances.plant
      ),
      
      // Fire
      ember: new THREE.InstancedMesh(
        this.geometries.ember,
        new THREE.MeshBasicMaterial({ color: 0xFF4500 }),
        this.maxInstances.fireEmber
      )
    };
    
    // Add instanced meshes to their respective groups
    this.barricades.add(this.instancedMeshes.woodenPlank);
    this.barricades.add(this.instancedMeshes.metalSheet);
    
    this.gore.add(this.instancedMeshes.bloodPool);
    this.gore.add(this.instancedMeshes.bodyPart);
    
    this.wreckage.add(this.instancedMeshes.concretePiece);
    this.wreckage.add(this.instancedMeshes.metalPipe);
    
    this.militaryItems.add(this.instancedMeshes.militaryBarrier);
    this.militaryItems.add(this.instancedMeshes.militaryCrate);
    
    this.foliage.add(this.instancedMeshes.weed);
    
    this.fireAndSmoke.add(this.instancedMeshes.ember);
    
    // Set initial visibility to hide 
    Object.values(this.instancedMeshes).forEach(mesh => {
      mesh.count = 0; // Start with zero visible instances
    });
  }
  
  /**
   * Generate all apocalyptic assets
   * @returns {THREE.Group} Container with all generated assets
   */
  generate() {
    console.log('Generating apocalyptic assets...');
    
    // Reset instance counters
    this.resetInstanceCounters();
    
    // Generate barricades
    this.generateBarricades();
    
    // Generate gore
    this.generateGore();
    
    // Generate building wreckage
    this.generateWreckage();
    
    // Generate military checkpoints
    this.generateMilitaryCheckpoints();
    
    // Generate overgrown foliage
    this.generateFoliage();
    
    // Generate fire and smoke
    this.generateFireAndSmoke();
    
    // Update instance counts for all instanced meshes
    this.updateInstanceCounts();
    
    console.log('Apocalyptic assets generation complete');
    return this.container;
  }
  
  /**
   * Reset all instance counters
   */
  resetInstanceCounters() {
    for (const key in this.instanceCounts) {
      this.instanceCounts[key] = 0;
    }
  }
  
  /**
   * Update instance counts for all instanced meshes
   */
  updateInstanceCounts() {
    // Set the count property of each instanced mesh based on actual instances created
    for (const [key, mesh] of Object.entries(this.instancedMeshes)) {
      const category = this.getMeshCategory(key);
      if (category) {
        mesh.count = this.instanceCounts[category];
      }
    }
  }
  
  /**
   * Get the category for a given mesh type
   * @param {string} meshType - Type of mesh
   * @returns {string} Category name
   */
  getMeshCategory(meshType) {
    if (['woodenPlank', 'metalSheet'].includes(meshType)) return 'barricade';
    if (['bloodPool'].includes(meshType)) return 'bloodPool';
    if (['bodyPart'].includes(meshType)) return 'corpse';
    if (['militaryBarrier'].includes(meshType)) return 'militaryBarrier';
    if (['militaryCrate'].includes(meshType)) return 'militaryCrate';
    if (['concretePiece', 'metalPipe'].includes(meshType)) return 'wreckPiece';
    if (['weed'].includes(meshType)) return 'plant';
    if (['ember'].includes(meshType)) return 'fireEmber';
    return null;
  }
  
  /**
   * Generate barricades for doorways and windows
   */
  generateBarricades() {
    // Iterate through city grid
    const cityGrid = this.city.cityGrid;
    if (!cityGrid || !cityGrid.length) return;
    
    // Calculate number of blocks
    const numBlocks = Math.floor(this.city.citySize / (this.city.blockSize + this.city.streetWidth));
    
    // For each block, place barricades near buildings
    for (let blockZ = 0; blockZ < numBlocks; blockZ++) {
      for (let blockX = 0; blockX < numBlocks; blockX++) {
        // Calculate block boundaries
        const startX = blockX * (this.city.blockSize + this.city.streetWidth) + this.city.streetWidth;
        const startZ = blockZ * (this.city.blockSize + this.city.streetWidth) + this.city.streetWidth;
        const endX = Math.min(startX + this.city.blockSize, this.city.citySize);
        const endZ = Math.min(startZ + this.city.blockSize, this.city.citySize);
        
        // Determine number of barricades for this block
        const barricadesCount = Math.floor(Math.random() * 4) + 2; // 2-5 barricades per block
        
        // Place barricades
        for (let i = 0; i < barricadesCount; i++) {
          // Find a valid position near building
          let validPosition = false;
          let x, z;
          let attempts = 0;
          
          while (!validPosition && attempts < 10) {
            x = startX + Math.random() * (endX - startX);
            z = startZ + Math.random() * (endZ - startZ);
            
            // Check if near a building but not inside
            const isNearBuilding = this.isNearBuilding(x, z);
            if (isNearBuilding) {
              validPosition = true;
            }
            
            attempts++;
          }
          
          if (validPosition) {
            this.createBarricade(x, z);
          }
        }
      }
    }
  }
  
  /**
   * Create a barricade at the specified position
   * @param {number} x - X position
   * @param {number} z - Z position
   */
  createBarricade(x, z) {
    // Determine barricade type
    const barricadeType = Math.random() < 0.6 ? 'wooden' : 'metal';
    const rotation = Math.random() * Math.PI * 2; // Random rotation
    const matrix = new THREE.Matrix4();
    
    if (barricadeType === 'wooden') {
      // Create wooden barricade with planks
      const plankCount = Math.floor(Math.random() * 3) + 3; // 3-5 planks
      const width = 1.2 + Math.random() * 0.8; // 1.2-2.0 width
      const height = 1.5 + Math.random() * 0.5; // 1.5-2.0 height
      
      for (let i = 0; i < plankCount; i++) {
        const plankPosition = new THREE.Vector3(
          x + (Math.random() * 0.3 - 0.15), // Slight x variation
          0.5 + (i / plankCount) * height, // Distribute vertically
          z + (Math.random() * 0.3 - 0.15) // Slight z variation
        );
        
        // Scale and rotate the plank
        const plankRotation = rotation + (Math.random() * 0.3 - 0.15); // Slight rotation variation
        const plankScale = new THREE.Vector3(
          1.0,
          1.0,
          width / this.geometries.woodenPlank.parameters.depth // Scale to desired width
        );
        
        matrix.compose(
          plankPosition,
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, plankRotation, Math.random() * 0.2 - 0.1)),
          plankScale
        );
        
        // Set instance matrix
        this.instancedMeshes.woodenPlank.setMatrixAt(
          this.instanceCounts.barricade++,
          matrix
        );
        
        // Add collision object
        this.collisionObjects.push({
          position: plankPosition.clone(),
          radius: width / 2
        });
      }
    } else {
      // Create metal barricade
      const sheetPosition = new THREE.Vector3(x, 0.7, z);
      const sheetScale = new THREE.Vector3(
        1.0 + Math.random() * 0.5, // 1.0-1.5 width
        1.0,
        1.0 + Math.random() * 0.5 // 1.0-1.5 depth
      );
      
      matrix.compose(
        sheetPosition,
        new THREE.Quaternion().setFromEuler(new THREE.Euler(
          Math.random() * 0.2 - 0.1, // Slight x tilt
          rotation,
          Math.random() * 0.2 - 0.1 // Slight z tilt
        )),
        sheetScale
      );
      
      // Set instance matrix
      this.instancedMeshes.metalSheet.setMatrixAt(
        this.instanceCounts.barricade++,
        matrix
      );
      
      // Add collision object
      this.collisionObjects.push({
        position: sheetPosition.clone(),
        radius: Math.max(sheetScale.x, sheetScale.z) / 2
      });
    }
  }
  
  /**
   * Generate gore (blood pools, bodies) throughout the city
   */
  generateGore() {
    // Iterate through the city with a sparse distribution
    for (let z = 0; z < this.city.citySize; z += 5) {
      for (let x = 0; x < this.city.citySize; x += 5) {
        // Only place with low probability
        if (Math.random() < 0.15) {
          // Make sure it's not inside a building or on a street
          if (!this.isInBuilding(x, z) && !this.isOnStreet(x, z)) {
            this.createGoreScene(x, z);
          }
        }
      }
    }
  }
  
  /**
   * Create a gore scene at the specified position
   * @param {number} x - X position
   * @param {number} z - Z position
   */
  createGoreScene(x, z) {
    const matrix = new THREE.Matrix4();
    const bloodPosition = new THREE.Vector3(x, 0.02, z); // Slightly above ground
    
    // Create blood pool
    matrix.compose(
      bloodPosition,
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.random() * Math.PI * 2)),
      new THREE.Vector3(
        0.5 + Math.random() * 1.0, // 0.5-1.5 scale for x
        0.5 + Math.random() * 1.0, // 0.5-1.5 scale for y
        1.0 // No scale for z (it's a flat circle)
      )
    );
    
    this.instancedMeshes.bloodPool.setMatrixAt(
      this.instanceCounts.bloodPool++,
      matrix
    );
    
    // 50% chance to add body parts
    if (Math.random() < 0.5) {
      const partCount = Math.floor(Math.random() * 3) + 1; // 1-3 body parts
      
      for (let i = 0; i < partCount; i++) {
        const partPosition = new THREE.Vector3(
          x + (Math.random() * 0.6 - 0.3), // Offset from center
          0.1, // Slightly above ground
          z + (Math.random() * 0.6 - 0.3) // Offset from center
        );
        
        matrix.compose(
          partPosition,
          new THREE.Quaternion().setFromEuler(new THREE.Euler(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          )),
          new THREE.Vector3(1, 1, 1)
        );
        
        this.instancedMeshes.bodyPart.setMatrixAt(
          this.instanceCounts.corpse++,
          matrix
        );
      }
    }
  }
  
  /**
   * Generate building wreckage (concrete pieces, rebar, etc.)
   */
  generateWreckage() {
    // Total number of wreckage piles
    const wreckagePileCount = Math.floor(this.city.citySize / 5);
    
    // Place wreckage piles
    for (let i = 0; i < wreckagePileCount; i++) {
      // Find random position
      const x = Math.random() * this.city.citySize;
      const z = Math.random() * this.city.citySize;
      
      // Skip if in building or on street
      if (this.isInBuilding(x, z) || this.isOnStreet(x, z)) continue;
      
      // Create wreckage pile
      this.createWreckagePile(x, z);
    }
  }
  
  /**
   * Create a wreckage pile at the specified position
   * @param {number} x - X position
   * @param {number} z - Z position
   */
  createWreckagePile(x, z) {
    const matrix = new THREE.Matrix4();
    const pileSize = Math.random() < 0.3 ? 'large' : 'medium';
    const pieceCount = pileSize === 'large' ? 
      Math.floor(Math.random() * 10) + 15 : // 15-25 pieces for large pile
      Math.floor(Math.random() * 5) + 5;    // 5-10 pieces for medium pile
    
    const pileRadius = pileSize === 'large' ? 2.5 : 1.5;
    
    // Create pile of concrete and metal debris
    for (let i = 0; i < pieceCount; i++) {
      // Distribute pieces within pile radius
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * pileRadius;
      const pieceX = x + Math.cos(angle) * distance;
      const pieceZ = z + Math.sin(angle) * distance;
      
      // Randomize height within pile
      const pieceY = Math.random() * (pileSize === 'large' ? 1.0 : 0.5);
      
      // Decide between concrete or metal
      const isConcrete = Math.random() < 0.7; // 70% concrete, 30% metal
      
      if (isConcrete) {
        // Add concrete piece
        matrix.compose(
          new THREE.Vector3(pieceX, pieceY, pieceZ),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          )),
          new THREE.Vector3(
            0.8 + Math.random() * 0.4,
            0.8 + Math.random() * 0.4,
            0.8 + Math.random() * 0.4
          )
        );
        
        this.instancedMeshes.concretePiece.setMatrixAt(
          this.instanceCounts.wreckPiece++,
          matrix
        );
      } else {
        // Add metal piece (pipe, rebar, etc.)
        matrix.compose(
          new THREE.Vector3(pieceX, pieceY, pieceZ),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          )),
          new THREE.Vector3(
            1.0,
            0.8 + Math.random() * 1.2, // Varied length
            1.0
          )
        );
        
        this.instancedMeshes.metalPipe.setMatrixAt(
          this.instanceCounts.wreckPiece++,
          matrix
        );
      }
    }
    
    // Add collision for the entire pile
    this.collisionObjects.push({
      position: new THREE.Vector3(x, 0, z),
      radius: pileRadius * 0.8 // Slightly smaller than visual size
    });
  }
  
  /**
   * Generate military checkpoints around the city
   */
  generateMilitaryCheckpoints() {
    // Number of checkpoints
    const checkpointCount = Math.floor(this.city.citySize / 20) + 2; // Scale with city size
    
    // Place checkpoints at strategic locations (intersections, city entrances)
    for (let i = 0; i < checkpointCount; i++) {
      // Find location on street
      let x, z;
      let validPosition = false;
      let attempts = 0;
      
      while (!validPosition && attempts < 20) {
        x = Math.random() * this.city.citySize;
        z = Math.random() * this.city.citySize;
        
        if (this.isOnStreet(x, z)) {
          validPosition = true;
        }
        
        attempts++;
      }
      
      if (validPosition) {
        this.createMilitaryCheckpoint(x, z);
      }
    }
  }
  
  /**
   * Create a military checkpoint at the specified position
   * @param {number} x - X position
   * @param {number} z - Z position
   */
  createMilitaryCheckpoint(x, z) {
    const matrix = new THREE.Matrix4();
    
    // Determine orientation (on street)
    const isHorizontal = Math.random() < 0.5;
    const rotation = isHorizontal ? 0 : Math.PI / 2;
    
    // Create barriers
    const barrierCount = Math.floor(Math.random() * 2) + 2; // 2-3 barriers
    const spacing = 2.0;
    
    for (let i = 0; i < barrierCount; i++) {
      // Position barriers in a line
      const barrierX = isHorizontal ? x + (i - barrierCount/2) * spacing : x;
      const barrierZ = isHorizontal ? z : z + (i - barrierCount/2) * spacing;
      
      matrix.compose(
        new THREE.Vector3(barrierX, 0.5, barrierZ),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotation, 0)),
        new THREE.Vector3(1.0, 1.0, 1.0)
      );
      
      this.instancedMeshes.militaryBarrier.setMatrixAt(
        this.instanceCounts.militaryBarrier++,
        matrix
      );
      
      // Add collision
      this.collisionObjects.push({
        position: new THREE.Vector3(barrierX, 0.5, barrierZ),
        radius: 0.7
      });
    }
    
    // Add crates near the barriers
    const crateCount = Math.floor(Math.random() * 3) + 1; // 1-3 crates
    
    for (let i = 0; i < crateCount; i++) {
      // Position crates near the checkpoint
      const crateX = x + (Math.random() * 4 - 2);
      const crateZ = z + (Math.random() * 4 - 2);
      
      matrix.compose(
        new THREE.Vector3(crateX, 0.3, crateZ),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.random() * Math.PI, 0)),
        new THREE.Vector3(1.0, 1.0, 1.0)
      );
      
      this.instancedMeshes.militaryCrate.setMatrixAt(
        this.instanceCounts.militaryCrate++,
        matrix
      );
      
      // Add collision
      this.collisionObjects.push({
        position: new THREE.Vector3(crateX, 0.3, crateZ),
        radius: 0.5
      });
    }
  }
  
  /**
   * Generate overgrown foliage (weeds, ivy on buildings)
   */
  generateFoliage() {
    // Generate weeds throughout the city
    const weedCount = Math.floor(this.city.citySize * 5); // Scale with city size
    
    for (let i = 0; i < weedCount; i++) {
      // Find random position
      const x = Math.random() * this.city.citySize;
      const z = Math.random() * this.city.citySize;
      
      // Skip if in building
      if (this.isInBuilding(x, z)) continue;
      
      // Create weed
      this.createWeed(x, z);
    }
  }
  
  /**
   * Create a weed at the specified position
   * @param {number} x - X position
   * @param {number} z - Z position
   */
  createWeed(x, z) {
    const matrix = new THREE.Matrix4();
    
    // Weed position slightly above ground
    const weedPosition = new THREE.Vector3(x, 0.25, z);
    
    // Create weed with random rotation and scale
    matrix.compose(
      weedPosition,
      new THREE.Quaternion().setFromEuler(new THREE.Euler(
        -Math.PI / 2, // Rotate to face up
        Math.random() * Math.PI * 2, // Random rotation
        0
      )),
      new THREE.Vector3(
        0.8 + Math.random() * 0.4, // 0.8-1.2 scale
        0.8 + Math.random() * 0.4, // 0.8-1.2 scale
        1.0
      )
    );
    
    this.instancedMeshes.weed.setMatrixAt(
      this.instanceCounts.plant++,
      matrix
    );
  }
  
  /**
   * Generate fire and smoke effects
   */
  generateFireAndSmoke() {
    // Number of fire spots
    const fireSpotCount = Math.floor(this.city.citySize / 10);
    
    // Place fire spots
    for (let i = 0; i < fireSpotCount; i++) {
      // Find random position
      const x = Math.random() * this.city.citySize;
      const z = Math.random() * this.city.citySize;
      
      // Skip if in building or on street
      if (this.isInBuilding(x, z) || this.isOnStreet(x, z)) continue;
      
      // Create fire spot
      this.createFireSpot(x, z);
    }
  }
  
  /**
   * Create a fire spot at the specified position
   * @param {number} x - X position
   * @param {number} z - Z position
   */
  createFireSpot(x, z) {
    const matrix = new THREE.Matrix4();
    
    // Number of embers
    const emberCount = Math.floor(Math.random() * 10) + 5; // 5-15 embers
    
    // Create embers
    for (let i = 0; i < emberCount; i++) {
      // Distribute embers around center
      const emberX = x + (Math.random() * 0.6 - 0.3);
      const emberZ = z + (Math.random() * 0.6 - 0.3);
      const emberY = 0.05 + Math.random() * 0.2; // Height variation
      
      matrix.compose(
        new THREE.Vector3(emberX, emberY, emberZ),
        new THREE.Quaternion(),
        new THREE.Vector3(1.0, 1.0, 1.0)
      );
      
      this.instancedMeshes.ember.setMatrixAt(
        this.instanceCounts.fireEmber++,
        matrix
      );
    }
  }
  
  /**
   * Check if a position is near a building
   * @param {number} x - X position
   * @param {number} z - Z position
   * @returns {boolean} True if near building
   */
  isNearBuilding(x, z) {
    // Convert to grid coordinates
    const gridX = Math.floor(x);
    const gridZ = Math.floor(z);
    
    // Check surrounding grid cells
    for (let zOffset = -1; zOffset <= 1; zOffset++) {
      for (let xOffset = -1; xOffset <= 1; xOffset++) {
        const checkZ = gridZ + zOffset;
        const checkX = gridX + xOffset;
        
        // Skip out of bounds
        if (checkZ < 0 || checkZ >= this.city.cityGrid.length ||
            checkX < 0 || checkX >= this.city.cityGrid[0].length) {
          continue;
        }
        
        // If any surrounding cell is a building, return true
        if (this.city.cityGrid[checkZ][checkX].type === 'building') {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check if a position is inside a building
   * @param {number} x - X position
   * @param {number} z - Z position
   * @returns {boolean} True if inside building
   */
  isInBuilding(x, z) {
    // Convert to grid coordinates
    const gridX = Math.floor(x);
    const gridZ = Math.floor(z);
    
    // Check grid cell
    if (gridZ >= 0 && gridZ < this.city.cityGrid.length &&
        gridX >= 0 && gridX < this.city.cityGrid[0].length) {
      return this.city.cityGrid[gridZ][gridX].type === 'building';
    }
    
    return false;
  }
  
  /**
   * Check if a position is on a street
   * @param {number} x - X position
   * @param {number} z - Z position
   * @returns {boolean} True if on street
   */
  isOnStreet(x, z) {
    // Convert to grid coordinates
    const gridX = Math.floor(x);
    const gridZ = Math.floor(z);
    
    // Check grid cell
    if (gridZ >= 0 && gridZ < this.city.cityGrid.length &&
        gridX >= 0 && gridX < this.city.cityGrid[0].length) {
      return this.city.cityGrid[gridZ][gridX].type === 'street';
    }
    
    return false;
  }
  
  /**
   * Check if player collides with any apocalyptic assets
   * @param {THREE.Vector3} position - Player position
   * @param {number} radius - Player collision radius
   * @returns {boolean} True if collision detected
   */
  checkCollision(position, radius = 0.5) {
    // Check against all collision objects
    for (const obj of this.collisionObjects) {
      const distance = position.distanceTo(obj.position);
      if (distance < (radius + obj.radius)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Update apocalyptic assets (animations, effects)
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    // Animate fire embers (flicker)
    if (this.instancedMeshes.ember && this.instancedMeshes.ember.count > 0) {
      // Update each ember
      const emberMaterial = this.instancedMeshes.ember.material;
      
      // Flicker fire color
      const r = 1.0 + Math.sin(performance.now() * 0.01) * 0.2;
      const g = 0.5 + Math.sin(performance.now() * 0.02) * 0.1;
      emberMaterial.color.setRGB(r, g, 0);
    }
  }
  
  /**
   * Dispose of resources
   */
  dispose() {
    // Dispose of geometries
    for (const key in this.geometries) {
      this.geometries[key].dispose();
    }
    
    // Dispose of materials
    for (const key in this.materials) {
      this.materials[key].dispose();
    }
    
    // Dispose of instanced meshes
    for (const key in this.instancedMeshes) {
      this.instancedMeshes[key].geometry.dispose();
      this.instancedMeshes[key].material.dispose();
    }
    
    // Clear arrays
    this.collisionObjects = [];
    this.instanceCounts = {};
    
    console.log('Apocalyptic assets resources disposed');
  }
} 