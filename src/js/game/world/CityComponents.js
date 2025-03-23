import * as THREE from 'three';

/**
 * CityComponents class - Manages all modular components for the city environment
 * including sidewalks, street props, debris, abandoned vehicles, and other urban features.
 * Optimized with instancing for better performance.
 */
export class CityComponents {
  constructor(game, city) {
    this.game = game;
    this.city = city;
    
    // Container for all city components
    this.container = new THREE.Group();
    this.container.name = 'cityComponents';
    
    // Component groups for organization
    this.sidewalks = new THREE.Group();
    this.streetProps = new THREE.Group();
    this.debris = new THREE.Group();
    this.vehicles = new THREE.Group();
    
    // Add component groups to container
    this.container.add(this.sidewalks);
    this.container.add(this.streetProps);
    this.container.add(this.debris);
    this.container.add(this.vehicles);
    
    // Materials cache
    this.materials = {
      sidewalk: this.game.texturingSystem ? 
        this.game.texturingSystem.getCityMaterial('sidewalk') : 
        new THREE.MeshStandardMaterial({ 
          color: 0x9e9e9e, 
          roughness: 0.8, 
          metalness: 0.1
        }),
      lamppost: new THREE.MeshStandardMaterial({ 
        color: 0x333333, 
        roughness: 0.7, 
        metalness: 0.3
      }),
      trafficLight: new THREE.MeshStandardMaterial({ 
        color: 0x222222, 
        roughness: 0.6, 
        metalness: 0.4
      }),
      hydrant: new THREE.MeshStandardMaterial({ 
        color: 0xc62828, 
        roughness: 0.7, 
        metalness: 0.2
      }),
      debris: this.game.texturingSystem ? 
        this.game.texturingSystem.getCityMaterial('debris') : 
        new THREE.MeshStandardMaterial({ 
          color: 0x757575, 
          roughness: 0.9, 
          metalness: 0.1
        }),
      vehicle: this.game.texturingSystem ? 
        this.game.texturingSystem.getCityMaterial('vehicle') : 
        new THREE.MeshStandardMaterial({ 
          color: 0x546e7a, 
          roughness: 0.7, 
          metalness: 0.3
        })
    };
    
    // Collision meshes (invisible to player, used for collision detection)
    this.collisionObjects = [];
    
    // City parameters
    this.streetWidth = city.streetWidth;
    this.blockSize = city.blockSize;
    this.citySize = city.citySize;
    this.sidewalkWidth = 1.0; // Width of sidewalks
    
    // Component density settings (adjust for performance vs. detail)
    this.streetPropDensity = 0.3; // Props per block
    this.debrisDensity = 0.5;     // Debris piles per block
    this.vehicleDensity = 0.2;    // Vehicles per block
    
    // Geometries
    this.initGeometries();
    
    // Instance counters (for optimized rendering)
    this.instanceCounts = {
      lamppost: 0,
      trafficLight: 0,
      hydrant: 0,
      debris: 0,
      vehicle: 0
    };
    
    // Maximum instances (pre-allocate for instanced meshes)
    this.maxInstances = {
      lamppost: 200,
      trafficLight: 100,
      hydrant: 100,
      debris: 300,
      vehicle: 100
    };
    
    // Instanced meshes
    this.instancedMeshes = {};
    this.initInstancedMeshes();
  }
  
  /**
   * Initialize geometries for components
   */
  initGeometries() {
    // Sidewalk geometry
    this.geometries = {
      sidewalk: new THREE.BoxGeometry(1, 0.3, 1), // Will be scaled for each segment
      
      // Street props
      lamppost: new THREE.CylinderGeometry(0.1, 0.2, 5, 8),
      lampHead: new THREE.BoxGeometry(0.8, 0.3, 0.5),
      trafficLight: new THREE.BoxGeometry(0.4, 1.0, 0.4),
      trafficLightArm: new THREE.BoxGeometry(1.2, 0.2, 0.2),
      hydrant: new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8),
      hydrantTop: new THREE.CylinderGeometry(0.15, 0.15, 0.2, 8),
      
      // Debris
      debrisSmall: new THREE.BoxGeometry(0.5, 0.3, 0.5),
      debrisMedium: new THREE.BoxGeometry(1.0, 0.4, 1.0),
      debrisLarge: new THREE.BoxGeometry(1.5, 0.5, 1.5),
      
      // Vehicles
      carBase: new THREE.BoxGeometry(2.0, 0.7, 4.5),
      carTop: new THREE.BoxGeometry(1.8, 0.8, 2.5),
      busBase: new THREE.BoxGeometry(2.5, 1.0, 8.0),
      busTop: new THREE.BoxGeometry(2.5, 1.5, 8.0)
    };
  }
  
  /**
   * Initialize instanced meshes for optimized rendering
   */
  initInstancedMeshes() {
    // Create instanced meshes for repetitive elements
    this.instancedMeshes = {
      lamppost: new THREE.InstancedMesh(
        this.geometries.lamppost,
        this.materials.lamppost,
        this.maxInstances.lamppost
      ),
      trafficLight: new THREE.InstancedMesh(
        this.geometries.trafficLight,
        this.materials.trafficLight,
        this.maxInstances.trafficLight
      ),
      hydrant: new THREE.InstancedMesh(
        this.geometries.hydrant,
        this.materials.hydrant,
        this.maxInstances.hydrant
      ),
      debrisSmall: new THREE.InstancedMesh(
        this.geometries.debrisSmall,
        this.materials.debris,
        this.maxInstances.debris
      ),
      debrisMedium: new THREE.InstancedMesh(
        this.geometries.debrisMedium,
        this.materials.debris,
        this.maxInstances.debris
      ),
      vehicle: new THREE.InstancedMesh(
        this.geometries.carBase,
        this.materials.vehicle,
        this.maxInstances.vehicle
      )
    };
    
    // Add instanced meshes to their respective groups
    this.streetProps.add(this.instancedMeshes.lamppost);
    this.streetProps.add(this.instancedMeshes.trafficLight);
    this.streetProps.add(this.instancedMeshes.hydrant);
    this.debris.add(this.instancedMeshes.debrisSmall);
    this.debris.add(this.instancedMeshes.debrisMedium);
    this.vehicles.add(this.instancedMeshes.vehicle);
    
    // Set initial visibility to hide 
    Object.values(this.instancedMeshes).forEach(mesh => {
      mesh.count = 0; // Start with zero visible instances
    });
  }
  
  /**
   * Generate all city components
   * @returns {THREE.Group} Container with all generated components
   */
  generate() {
    console.log('Generating city components...');
    
    // Reset instance counters
    this.resetInstanceCounters();
    
    // Generate sidewalks
    this.generateSidewalks();
    
    // Generate street props
    this.generateStreetProps();
    
    // Generate debris
    this.generateDebris();
    
    // Generate abandoned vehicles
    this.generateVehicles();
    
    // Update instance counts for all instanced meshes
    this.updateInstanceCounts();
    
    console.log('City components generation complete');
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
    this.instancedMeshes.lamppost.count = this.instanceCounts.lamppost;
    this.instancedMeshes.trafficLight.count = this.instanceCounts.trafficLight;
    this.instancedMeshes.hydrant.count = this.instanceCounts.hydrant;
    this.instancedMeshes.debrisSmall.count = this.instanceCounts.debris;
    this.instancedMeshes.debrisMedium.count = this.instanceCounts.debris;
    this.instancedMeshes.vehicle.count = this.instanceCounts.vehicle;
  }
  
  /**
   * Generate sidewalks along streets
   */
  generateSidewalks() {
    // Calculate number of blocks
    const numBlocks = Math.floor(this.citySize / (this.blockSize + this.streetWidth));
    
    // Create sidewalk material with texture
    const sidewalkMaterial = this.materials.sidewalk;
    
    // Group for all sidewalks
    const sidewalksGroup = new THREE.Group();
    
    // Create horizontal sidewalks
    for (let i = 0; i <= numBlocks; i++) {
      const streetPos = i * (this.blockSize + this.streetWidth);
      
      // Skip if outside city bounds
      if (streetPos >= this.citySize) continue;
      
      // Create sidewalks on both sides of the street
      for (let side = -1; side <= 1; side += 2) {
        const sidewalkPos = streetPos + (side * (this.streetWidth / 2 + this.sidewalkWidth / 2));
        
        // Skip if outside city bounds
        if (sidewalkPos < 0 || sidewalkPos >= this.citySize) continue;
        
        // Create sidewalk geometry
        const sidewalk = new THREE.Mesh(
          this.geometries.sidewalk.clone(),
          sidewalkMaterial
        );
        
        // Scale and position sidewalk
        sidewalk.scale.set(this.citySize, 1, this.sidewalkWidth);
        sidewalk.position.set(
          this.citySize / 2,
          0.15, // Slightly above streets
          sidewalkPos
        );
        
        sidewalksGroup.add(sidewalk);
      }
    }
    
    // Create vertical sidewalks
    for (let i = 0; i <= numBlocks; i++) {
      const streetPos = i * (this.blockSize + this.streetWidth);
      
      // Skip if outside city bounds
      if (streetPos >= this.citySize) continue;
      
      // Create sidewalks on both sides of the street
      for (let side = -1; side <= 1; side += 2) {
        const sidewalkPos = streetPos + (side * (this.streetWidth / 2 + this.sidewalkWidth / 2));
        
        // Skip if outside city bounds
        if (sidewalkPos < 0 || sidewalkPos >= this.citySize) continue;
        
        // Create sidewalk geometry
        const sidewalk = new THREE.Mesh(
          this.geometries.sidewalk.clone(),
          sidewalkMaterial
        );
        
        // Scale and position sidewalk
        sidewalk.scale.set(this.sidewalkWidth, 1, this.citySize);
        sidewalk.position.set(
          sidewalkPos,
          0.15, // Slightly above streets
          this.citySize / 2
        );
        
        sidewalksGroup.add(sidewalk);
      }
    }
    
    // Add sidewalks group to main container
    this.sidewalks.add(sidewalksGroup);
  }
  
  /**
   * Generate street props like lampposts, traffic lights, fire hydrants
   */
  generateStreetProps() {
    // Calculate number of blocks
    const numBlocks = Math.floor(this.citySize / (this.blockSize + this.streetWidth));
    
    // Create street props at intersections and along streets
    for (let blockZ = 0; blockZ <= numBlocks; blockZ++) {
      for (let blockX = 0; blockX <= numBlocks; blockX++) {
        // Calculate street intersection position
        const intersectionX = blockX * (this.blockSize + this.streetWidth) + this.streetWidth / 2;
        const intersectionZ = blockZ * (this.blockSize + this.streetWidth) + this.streetWidth / 2;
        
        // Skip if outside city bounds
        if (intersectionX >= this.citySize || intersectionZ >= this.citySize) continue;
        
        // Place traffic light at intersection (25% chance)
        if (Math.random() < 0.25) {
          this.createTrafficLight(intersectionX, intersectionZ);
        }
        
        // Place lampposts along streets
        this.placeLampposts(blockX, blockZ);
        
        // Place fire hydrants along sidewalks
        this.placeFireHydrants(blockX, blockZ);
      }
    }
  }
  
  /**
   * Place lampposts along streets
   * @param {number} blockX - X block index
   * @param {number} blockZ - Z block index
   */
  placeLampposts(blockX, blockZ) {
    // Calculate block position
    const blockStartX = blockX * (this.blockSize + this.streetWidth) + this.streetWidth;
    const blockStartZ = blockZ * (this.blockSize + this.streetWidth) + this.streetWidth;
    
    // Skip if outside city bounds
    if (blockStartX >= this.citySize || blockStartZ >= this.citySize) return;
    
    // Place lampposts at corners of blocks
    const cornerPositions = [
      { x: blockStartX, z: blockStartZ },
      { x: blockStartX + this.blockSize, z: blockStartZ },
      { x: blockStartX, z: blockStartZ + this.blockSize },
      { x: blockStartX + this.blockSize, z: blockStartZ + this.blockSize }
    ];
    
    // Place lampposts at some corners (70% chance)
    cornerPositions.forEach(pos => {
      if (Math.random() < 0.7 && 
          pos.x < this.citySize && 
          pos.z < this.citySize) {
        
        // Add variation to position (align with sidewalk)
        const offsetX = (Math.random() < 0.5) ? -this.sidewalkWidth/2 : this.sidewalkWidth/2;
        const offsetZ = (Math.random() < 0.5) ? -this.sidewalkWidth/2 : this.sidewalkWidth/2;
        
        this.createLamppost(pos.x + offsetX, pos.z + offsetZ);
      }
    });
  }
  
  /**
   * Place fire hydrants along sidewalks
   * @param {number} blockX - X block index
   * @param {number} blockZ - Z block index
   */
  placeFireHydrants(blockX, blockZ) {
    // Calculate block perimeter
    const blockStartX = blockX * (this.blockSize + this.streetWidth) + this.streetWidth;
    const blockStartZ = blockZ * (this.blockSize + this.streetWidth) + this.streetWidth;
    const blockEndX = blockStartX + this.blockSize;
    const blockEndZ = blockStartZ + this.blockSize;
    
    // Skip if outside city bounds
    if (blockStartX >= this.citySize || blockStartZ >= this.citySize) return;
    
    // Place hydrants along block perimeter (15% chance per side)
    if (Math.random() < 0.15) {
      const x = blockStartX + Math.random() * this.blockSize;
      const z = blockStartZ - this.sidewalkWidth/2;
      if (z >= 0) this.createFireHydrant(x, z);
    }
    
    if (Math.random() < 0.15) {
      const x = blockEndX + this.sidewalkWidth/2;
      const z = blockStartZ + Math.random() * this.blockSize;
      if (x < this.citySize) this.createFireHydrant(x, z);
    }
    
    if (Math.random() < 0.15) {
      const x = blockStartX + Math.random() * this.blockSize;
      const z = blockEndZ + this.sidewalkWidth/2;
      if (z < this.citySize) this.createFireHydrant(x, z);
    }
    
    if (Math.random() < 0.15) {
      const x = blockStartX - this.sidewalkWidth/2;
      const z = blockStartZ + Math.random() * this.blockSize;
      if (x >= 0) this.createFireHydrant(x, z);
    }
  }
  
  /**
   * Create a lamppost at the specified position
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   */
  createLamppost(x, z) {
    if (this.instanceCounts.lamppost >= this.maxInstances.lamppost) return;
    
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3(x, 2.5, z); // Half height of lamppost
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    
    matrix.compose(position, rotation, scale);
    this.instancedMeshes.lamppost.setMatrixAt(this.instanceCounts.lamppost, matrix);
    
    // Create lamp head
    const headMatrix = new THREE.Matrix4();
    const headPosition = new THREE.Vector3(x, 5.0, z); // Top of lamppost
    headMatrix.compose(headPosition, rotation, scale);
    
    // Add collision object
    const collisionBox = new THREE.Box3(
      new THREE.Vector3(x - 0.2, 0, z - 0.2),
      new THREE.Vector3(x + 0.2, 5, z + 0.2)
    );
    this.collisionObjects.push(collisionBox);
    
    this.instanceCounts.lamppost++;
  }
  
  /**
   * Create a traffic light at the specified position
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   */
  createTrafficLight(x, z) {
    if (this.instanceCounts.trafficLight >= this.maxInstances.trafficLight) return;
    
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3(x, 2.0, z);
    
    // Randomly rotate to face street direction
    const rotation = new THREE.Quaternion();
    rotation.setFromAxisAngle(
      new THREE.Vector3(0, 1, 0), 
      Math.floor(Math.random() * 4) * Math.PI / 2
    );
    
    const scale = new THREE.Vector3(1, 1, 1);
    
    matrix.compose(position, rotation, scale);
    this.instancedMeshes.trafficLight.setMatrixAt(this.instanceCounts.trafficLight, matrix);
    
    // Add collision object
    const collisionBox = new THREE.Box3(
      new THREE.Vector3(x - 0.3, 0, z - 0.3),
      new THREE.Vector3(x + 0.3, 4, z + 0.3)
    );
    this.collisionObjects.push(collisionBox);
    
    this.instanceCounts.trafficLight++;
  }
  
  /**
   * Create a fire hydrant at the specified position
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   */
  createFireHydrant(x, z) {
    if (this.instanceCounts.hydrant >= this.maxInstances.hydrant) return;
    
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3(x, 0.4, z); // Half height of hydrant
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    
    matrix.compose(position, rotation, scale);
    this.instancedMeshes.hydrant.setMatrixAt(this.instanceCounts.hydrant, matrix);
    
    // Add collision object
    const collisionBox = new THREE.Box3(
      new THREE.Vector3(x - 0.25, 0, z - 0.25),
      new THREE.Vector3(x + 0.25, 0.8, z + 0.25)
    );
    this.collisionObjects.push(collisionBox);
    
    this.instanceCounts.hydrant++;
  }
  
  /**
   * Generate debris piles throughout the city
   */
  generateDebris() {
    // Calculate number of blocks
    const numBlocks = Math.floor(this.citySize / (this.blockSize + this.streetWidth));
    
    // Create debris in random locations
    const totalDebris = Math.floor(numBlocks * numBlocks * this.debrisDensity);
    
    for (let i = 0; i < totalDebris; i++) {
      // Random position within city bounds
      const x = Math.random() * this.citySize;
      const z = Math.random() * this.citySize;
      
      // Skip if position is inside a building
      if (this.city.isPositionInBuilding({ x, y: 0, z })) continue;
      
      // Create debris pile
      this.createDebrisPile(x, z);
    }
  }
  
  /**
   * Create a debris pile at the specified position
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   */
  createDebrisPile(x, z) {
    if (this.instanceCounts.debris >= this.maxInstances.debris) return;
    
    // Randomly choose between small and medium debris
    const debrisType = Math.random() < 0.7 ? 'debrisSmall' : 'debrisMedium';
    const height = debrisType === 'debrisSmall' ? 0.15 : 0.2;
    
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3(x, height, z);
    
    // Random rotation for variety
    const rotation = new THREE.Quaternion();
    rotation.setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      Math.random() * Math.PI * 2
    );
    
    // Random scale for variety (0.8 to 1.2)
    const scale = new THREE.Vector3(
      0.8 + Math.random() * 0.4,
      0.8 + Math.random() * 0.4,
      0.8 + Math.random() * 0.4
    );
    
    matrix.compose(position, rotation, scale);
    this.instancedMeshes[debrisType].setMatrixAt(this.instanceCounts.debris, matrix);
    
    // 30% chance to add collision for larger debris piles
    if (debrisType === 'debrisMedium' && Math.random() < 0.3) {
      const size = 0.5 * Math.max(scale.x, scale.z);
      const collisionBox = new THREE.Box3(
        new THREE.Vector3(x - size, 0, z - size),
        new THREE.Vector3(x + size, height * 2 * scale.y, z + size)
      );
      this.collisionObjects.push(collisionBox);
    }
    
    this.instanceCounts.debris++;
  }
  
  /**
   * Generate abandoned vehicles throughout the city
   */
  generateVehicles() {
    // Calculate number of blocks
    const numBlocks = Math.floor(this.citySize / (this.blockSize + this.streetWidth));
    
    // Create vehicles in streets
    for (let blockZ = 0; blockZ < numBlocks; blockZ++) {
      for (let blockX = 0; blockX < numBlocks; blockX++) {
        // Skip most blocks (based on density)
        if (Math.random() > this.vehicleDensity) continue;
        
        // Calculate street position
        const streetX = blockX * (this.blockSize + this.streetWidth) + this.streetWidth / 2;
        const streetZ = blockZ * (this.blockSize + this.streetWidth) + this.streetWidth / 2;
        
        // Skip if outside city bounds
        if (streetX >= this.citySize || streetZ >= this.citySize) continue;
        
        // Randomly place vehicle on horizontal or vertical street
        if (Math.random() < 0.5) {
          // Horizontal street (random position along block)
          const x = blockX * (this.blockSize + this.streetWidth) + 
                   this.streetWidth + Math.random() * this.blockSize;
          const z = streetZ;
          
          // Only create if in bounds
          if (x < this.citySize) {
            this.createVehicle(x, z, true);
          }
        } else {
          // Vertical street (random position along block)
          const x = streetX;
          const z = blockZ * (this.blockSize + this.streetWidth) +
                   this.streetWidth + Math.random() * this.blockSize;
          
          // Only create if in bounds
          if (z < this.citySize) {
            this.createVehicle(x, z, false);
          }
        }
      }
    }
  }
  
  /**
   * Create an abandoned vehicle at the specified position
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {boolean} isHorizontal - Whether the vehicle is on a horizontal street
   */
  createVehicle(x, z, isHorizontal) {
    if (this.instanceCounts.vehicle >= this.maxInstances.vehicle) return;
    
    // 80% cars, 20% buses
    const isBus = Math.random() < 0.2;
    const vehicleLength = isBus ? 8.0 : 4.5;
    const vehicleWidth = isBus ? 2.5 : 2.0;
    const vehicleHeight = isBus ? 2.5 : 1.5;
    
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3(x, vehicleHeight / 2, z);
    
    // Set rotation based on street direction with some variation
    const rotation = new THREE.Quaternion();
    const baseRotation = isHorizontal ? Math.PI / 2 : 0;
    // Add slight variation to rotation (±15°)
    const rotationVariation = (Math.random() - 0.5) * Math.PI / 6;
    rotation.setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      baseRotation + rotationVariation
    );
    
    // Scale to match vehicle size
    const scale = new THREE.Vector3(
      vehicleWidth / 2.0,
      vehicleHeight / 0.7,
      vehicleLength / 4.5
    );
    
    matrix.compose(position, rotation, scale);
    this.instancedMeshes.vehicle.setMatrixAt(this.instanceCounts.vehicle, matrix);
    
    // Add collision object
    // Calculate bounding box based on rotation
    const angleRad = baseRotation + rotationVariation;
    const sinAngle = Math.sin(angleRad);
    const cosAngle = Math.cos(angleRad);
    
    // Calculate rotated dimensions
    const rotatedWidth = Math.abs(vehicleWidth * cosAngle) + Math.abs(vehicleLength * sinAngle);
    const rotatedLength = Math.abs(vehicleWidth * sinAngle) + Math.abs(vehicleLength * cosAngle);
    
    const collisionBox = new THREE.Box3(
      new THREE.Vector3(x - rotatedWidth/2, 0, z - rotatedLength/2),
      new THREE.Vector3(x + rotatedWidth/2, vehicleHeight, z + rotatedLength/2)
    );
    this.collisionObjects.push(collisionBox);
    
    this.instanceCounts.vehicle++;
  }
  
  /**
   * Checks if a position collides with any city component
   * @param {THREE.Vector3} position - Position to check
   * @param {number} radius - Collision radius
   * @returns {boolean} - True if collision detected
   */
  checkCollision(position, radius = 0.5) {
    // Create a sphere representing the player
    const playerSphere = new THREE.Sphere(position, radius);
    
    // Check against all collision objects
    for (const collider of this.collisionObjects) {
      if (collider.intersectsSphere(playerSphere)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Update any animated components or states
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    // Future implementation for animating components (traffic lights, etc.)
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Clean up geometries, materials, etc.
    // This is a stub - implement proper cleanup if needed
    console.log('City components resources disposed');
  }
} 