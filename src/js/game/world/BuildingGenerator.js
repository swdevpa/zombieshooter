import * as THREE from 'three';

/**
 * BuildingGenerator class - Responsible for procedurally generating building meshes
 * with various types, styles, and details for a post-apocalyptic cityscape.
 */
export class BuildingGenerator {
  constructor(game) {
    this.game = game;
    
    // Building types configuration
    this.buildingTypes = {
      RESIDENTIAL: 'residential',
      COMMERCIAL: 'commercial',
      INDUSTRIAL: 'industrial'
    };
    
    // Destruction levels
    this.destructionLevels = {
      PRISTINE: 0,      // No damage
      DAMAGED: 1,       // Some damage (broken windows, cracks)
      HEAVILY_DAMAGED: 2, // Major structural damage
      PARTIALLY_COLLAPSED: 3 // Partial collapse
    };
    
    // Materials cache for performance
    this.materials = {};
    
    // Geometry cache for performance
    this.geometries = {};
    
    // Window/door templates for instancing
    this.templates = {};
    
    // Color palettes for different building types
    this.colorPalettes = {
      residential: [
        0xc4a59f, // Light brown
        0xbfb0a3, // Taupe
        0xe5d7c3, // Cream
        0xd6c9ac, // Beige
        0xa79c93  // Gray-brown
      ],
      commercial: [
        0x7d8491, // Gray
        0x62727b, // Blue-gray
        0x90A4AE, // Light blue-gray
        0xCFD8DC, // Very light gray
        0x5f6a72  // Dark gray
      ],
      industrial: [
        0x8d8d8d, // Medium gray
        0xa56a57, // Brick red
        0x737373, // Dark gray
        0x959595, // Light gray
        0x6b5c52  // Brown
      ]
    };
    
    // Initialize component templates and material caches
    this.initializeTemplates();
  }
  
  /**
   * Initialize building component templates and material caches
   */
  initializeTemplates() {
    // Initialize materials cache for each building type
    for (const type in this.buildingTypes) {
      const buildingType = this.buildingTypes[type];
      this.materials[buildingType] = {};
      
      // Create materials for each destruction level
      for (const level in this.destructionLevels) {
        const destructionLevel = this.destructionLevels[level];
        this.materials[buildingType][destructionLevel] = this.createMaterials(buildingType, destructionLevel);
      }
    }
    
    // Create window geometry templates
    this.geometries.window = new THREE.BoxGeometry(0.5, 1.0, 0.1);
    this.geometries.door = new THREE.BoxGeometry(1.0, 2.0, 0.1);
    this.geometries.balcony = new THREE.BoxGeometry(1.5, 0.2, 1.0);
    
    // Create instancing templates
    this.templates.window = new THREE.InstancedMesh(
      this.geometries.window,
      new THREE.MeshStandardMaterial({ color: 0x80b3c4, metalness: 0.8, roughness: 0.1 }),
      100 // Maximum number of instances per building
    );
    
    this.templates.damagedWindow = new THREE.InstancedMesh(
      this.geometries.window,
      new THREE.MeshStandardMaterial({ color: 0x2c2c2c, metalness: 0.5, roughness: 0.6 }),
      100
    );
  }
  
  /**
   * Create materials for a specific building type and destruction level
   * @param {string} buildingType - Type of building
   * @param {number} destructionLevel - Level of destruction
   * @returns {Object} - Materials for each part of the building
   */
  createMaterials(buildingType, destructionLevel) {
    // Use the texturing system if available, otherwise fall back to basic materials
    if (this.game.texturingSystem) {
      return {
        walls: this.game.texturingSystem.getBuildingMaterial(buildingType, destructionLevel),
        windows: new THREE.MeshStandardMaterial({
          color: 0x90caf9,
          transparent: true,
          opacity: 0.7,
          roughness: 0.1,
          metalness: 0.8
        }),
        roof: this.game.texturingSystem.getBuildingMaterial(buildingType, destructionLevel)
      };
    }
    
    // Legacy fallback material creation (used until texturing system is ready)
    const colorPalette = this.colorPalettes[buildingType];
    const colorIndex = Math.floor(Math.random() * colorPalette.length);
    let wallColor = colorPalette[colorIndex];
    
    // Adjust color for destruction level
    if (destructionLevel > 0) {
      const darkenAmount = 0.2 + (destructionLevel * 0.1); // 0.2 to 0.5 darkening
      wallColor = this.darkenColor(wallColor, darkenAmount);
    }
    
    return {
      walls: new THREE.MeshStandardMaterial({ 
        color: wallColor, 
        roughness: 0.7 + (destructionLevel * 0.1),
        metalness: Math.max(0, 0.2 - (destructionLevel * 0.05))
      }),
      windows: new THREE.MeshStandardMaterial({
        color: 0x90caf9,
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
        metalness: 0.8
      }),
      roof: new THREE.MeshStandardMaterial({ 
        color: this.darkenColor(wallColor, 0.3), 
        roughness: 0.8,
        metalness: 0.1
      })
    };
  }
  
  /**
   * Create a building mesh based on specifications
   * @param {Object} options - Building options (type, size, position, etc.)
   * @returns {THREE.Group} - Building mesh group
   */
  createBuilding(options) {
    const {
      type = this.buildingTypes.RESIDENTIAL,
      width = 5,
      depth = 5,
      height = 10,
      position = { x: 0, y: 0, z: 0 },
      destructionLevel = this.destructionLevels.PRISTINE,
      blockId = "0_0"
    } = options;
    
    // Building container group
    const buildingGroup = new THREE.Group();
    buildingGroup.name = `building_${blockId}_${type}`;
    
    // Switch based on building type
    switch (type) {
      case this.buildingTypes.RESIDENTIAL:
        this.createResidentialBuilding(buildingGroup, width, depth, height, destructionLevel);
        break;
      case this.buildingTypes.COMMERCIAL:
        this.createCommercialBuilding(buildingGroup, width, depth, height, destructionLevel);
        break;
      case this.buildingTypes.INDUSTRIAL:
        this.createIndustrialBuilding(buildingGroup, width, depth, height, destructionLevel);
        break;
      default:
        this.createResidentialBuilding(buildingGroup, width, depth, height, destructionLevel);
    }
    
    // Apply damage based on destruction level
    if (destructionLevel > 0) {
      this.applyDamage(buildingGroup, destructionLevel);
    }
    
    // Position the building
    buildingGroup.position.set(position.x, position.y, position.z);
    
    // Mark building for collision detection
    buildingGroup.isCollidable = true;
    
    // Add bounding box information for collision
    buildingGroup.collisionBox = new THREE.Box3();
    buildingGroup.collisionBox.setFromObject(buildingGroup);
    
    return buildingGroup;
  }
  
  /**
   * Create a residential building with appropriate details
   * @param {THREE.Group} group - The group to add building parts to
   * @param {number} width - Building width
   * @param {number} depth - Building depth
   * @param {number} height - Building height
   * @param {number} destructionLevel - Level of destruction
   */
  createResidentialBuilding(group, width, depth, height, destructionLevel) {
    const materials = this.materials[this.buildingTypes.RESIDENTIAL][destructionLevel];
    
    // Main structure
    const mainGeometry = new THREE.BoxGeometry(width, height, depth);
    const mainMesh = new THREE.Mesh(mainGeometry, materials.walls);
    mainMesh.position.y = height / 2;
    
    // Add roof (slightly extended from main building)
    const roofWidth = width + 0.5;
    const roofDepth = depth + 0.5;
    const roofHeight = 0.5;
    const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
    const roofMesh = new THREE.Mesh(roofGeometry, materials.roof);
    roofMesh.position.y = height + roofHeight / 2;
    
    // Add windows
    const windowPositions = this.generateWindowPositions(width, depth, height, 'residential');
    const windowsGroup = this.createWindows(windowPositions, destructionLevel);
    
    // Add entrance
    const entranceGeometry = new THREE.BoxGeometry(1.2, 2.2, 0.1);
    const entranceMesh = new THREE.Mesh(entranceGeometry, materials.windows);
    
    // Position entrance on a random wall
    const wallChoice = Math.floor(Math.random() * 4);
    switch (wallChoice) {
      case 0: // Front
        entranceMesh.position.set(0, 1.1, depth / 2 + 0.05);
        entranceMesh.rotation.y = 0;
        break;
      case 1: // Right
        entranceMesh.position.set(width / 2 + 0.05, 1.1, 0);
        entranceMesh.rotation.y = Math.PI / 2;
        break;
      case 2: // Back
        entranceMesh.position.set(0, 1.1, -depth / 2 - 0.05);
        entranceMesh.rotation.y = Math.PI;
        break;
      case 3: // Left
        entranceMesh.position.set(-width / 2 - 0.05, 1.1, 0);
        entranceMesh.rotation.y = -Math.PI / 2;
        break;
    }
    
    // Add details (random balconies for some residential buildings)
    if (Math.random() > 0.6 && height > 6) {
      const balconiesGroup = this.createBalconies(width, depth, height);
      group.add(balconiesGroup);
    }
    
    // Add all elements to the building group
    group.add(mainMesh);
    group.add(roofMesh);
    group.add(windowsGroup);
    group.add(entranceMesh);
  }
  
  /**
   * Create a commercial building with appropriate details
   * @param {THREE.Group} group - The group to add building parts to
   * @param {number} width - Building width
   * @param {number} depth - Building depth
   * @param {number} height - Building height
   * @param {number} destructionLevel - Level of destruction
   */
  createCommercialBuilding(group, width, depth, height, destructionLevel) {
    const materials = this.materials[this.buildingTypes.COMMERCIAL][destructionLevel];
    
    // Main structure
    const mainGeometry = new THREE.BoxGeometry(width, height, depth);
    const mainMesh = new THREE.Mesh(mainGeometry, materials.walls);
    mainMesh.position.y = height / 2;
    
    // Flat roof for commercial buildings
    const roofGeometry = new THREE.BoxGeometry(width, 0.3, depth);
    const roofMesh = new THREE.Mesh(roofGeometry, materials.roof);
    roofMesh.position.y = height + 0.15;
    
    // Add windows (commercial buildings have larger, more regular windows)
    const windowPositions = this.generateWindowPositions(width, depth, height, 'commercial');
    const windowsGroup = this.createWindows(windowPositions, destructionLevel);
    
    // Add storefront
    const storefrontHeight = 3;
    const storefrontGeometry = new THREE.BoxGeometry(width - 0.5, storefrontHeight, 0.1);
    const storefrontMaterial = new THREE.MeshStandardMaterial({
      color: 0x80b3c4,
      metalness: 0.8,
      roughness: 0.1,
      transparent: true,
      opacity: 0.7
    });
    const storefrontMesh = new THREE.Mesh(storefrontGeometry, storefrontMaterial);
    storefrontMesh.position.set(0, storefrontHeight / 2, depth / 2 + 0.05);
    
    // Add storefront frame
    const frameGeometry = new THREE.BoxGeometry(width, 0.3, 0.2);
    const frameMesh = new THREE.Mesh(frameGeometry, materials.windows);
    frameMesh.position.set(0, storefrontHeight + 0.15, depth / 2 + 0.05);
    
    // Add all elements to the building group
    group.add(mainMesh);
    group.add(roofMesh);
    group.add(windowsGroup);
    group.add(storefrontMesh);
    group.add(frameMesh);
  }
  
  /**
   * Create an industrial building with appropriate details
   * @param {THREE.Group} group - The group to add building parts to
   * @param {number} width - Building width
   * @param {number} depth - Building depth
   * @param {number} height - Building height
   * @param {number} destructionLevel - Level of destruction
   */
  createIndustrialBuilding(group, width, depth, height, destructionLevel) {
    const materials = this.materials[this.buildingTypes.INDUSTRIAL][destructionLevel];
    
    // Main structure (typically wider and shorter than other buildings)
    const mainGeometry = new THREE.BoxGeometry(width, height, depth);
    const mainMesh = new THREE.Mesh(mainGeometry, materials.walls);
    mainMesh.position.y = height / 2;
    
    // Industrial buildings often have shed roofs
    const roofGeometry = new THREE.BoxGeometry(width + 0.3, 0.5, depth + 0.3);
    const roofMesh = new THREE.Mesh(roofGeometry, materials.roof);
    roofMesh.position.y = height + 0.25;
    
    // Add fewer windows for industrial buildings
    const windowPositions = this.generateWindowPositions(width, depth, height, 'industrial');
    const windowsGroup = this.createWindows(windowPositions, destructionLevel);
    
    // Add large entrance door (for vehicles/machinery)
    const doorWidth = 3;
    const doorHeight = 4;
    const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, 0.1);
    const doorMesh = new THREE.Mesh(doorGeometry, materials.windows);
    doorMesh.position.set(0, doorHeight / 2, depth / 2 + 0.05);
    
    // Add industrial details (smokestacks, tanks, etc.)
    if (Math.random() > 0.5) {
      const detailsGroup = this.createIndustrialDetails(width, depth, height);
      group.add(detailsGroup);
    }
    
    // Add all elements to the building group
    group.add(mainMesh);
    group.add(roofMesh);
    group.add(windowsGroup);
    group.add(doorMesh);
  }
  
  /**
   * Generate appropriate window positions based on building dimensions and type
   * @param {number} width - Building width
   * @param {number} depth - Building depth
   * @param {number} height - Building height
   * @param {string} type - Building type
   * @returns {Array} - Array of window position objects
   */
  generateWindowPositions(width, depth, height, type) {
    const windows = [];
    const floorHeight = 3;
    const numFloors = Math.floor(height / floorHeight);
    
    // Window spacing and size parameters vary by building type
    let windowSpacingX, windowSpacingZ, windowProbability;
    
    switch (type) {
      case 'residential':
        windowSpacingX = 2;
        windowSpacingZ = 2;
        windowProbability = 0.85;
        break;
      case 'commercial':
        windowSpacingX = 2.5;
        windowSpacingZ = 3;
        windowProbability = 0.9;
        break;
      case 'industrial':
        windowSpacingX = 4;
        windowSpacingZ = 4;
        windowProbability = 0.6;
        break;
      default:
        windowSpacingX = 2;
        windowSpacingZ = 2;
        windowProbability = 0.8;
    }
    
    // Calculate number of windows per wall
    const windowsPerWallX = Math.max(1, Math.floor(width / windowSpacingX));
    const windowsPerWallZ = Math.max(1, Math.floor(depth / windowSpacingZ));
    
    // Spacing adjustments for centering
    const adjustX = (width - (windowsPerWallX - 1) * windowSpacingX) / 2;
    const adjustZ = (depth - (windowsPerWallZ - 1) * windowSpacingZ) / 2;
    
    // Add windows for each floor
    for (let floor = 0; floor < numFloors; floor++) {
      const y = floor * floorHeight + floorHeight / 2;
      
      // Skip ground floor for some buildings (except for commercial)
      if (floor === 0 && type !== 'commercial' && Math.random() > 0.5) continue;
      
      // Front wall windows (z+)
      for (let i = 0; i < windowsPerWallX; i++) {
        if (Math.random() < windowProbability) {
          const x = -width / 2 + adjustX + i * windowSpacingX;
          windows.push({
            position: new THREE.Vector3(x, y, depth / 2 + 0.05),
            rotation: new THREE.Euler(0, 0, 0)
          });
        }
      }
      
      // Back wall windows (z-)
      for (let i = 0; i < windowsPerWallX; i++) {
        if (Math.random() < windowProbability) {
          const x = -width / 2 + adjustX + i * windowSpacingX;
          windows.push({
            position: new THREE.Vector3(x, y, -depth / 2 - 0.05),
            rotation: new THREE.Euler(0, Math.PI, 0)
          });
        }
      }
      
      // Right wall windows (x+)
      for (let i = 0; i < windowsPerWallZ; i++) {
        if (Math.random() < windowProbability) {
          const z = -depth / 2 + adjustZ + i * windowSpacingZ;
          windows.push({
            position: new THREE.Vector3(width / 2 + 0.05, y, z),
            rotation: new THREE.Euler(0, Math.PI / 2, 0)
          });
        }
      }
      
      // Left wall windows (x-)
      for (let i = 0; i < windowsPerWallZ; i++) {
        if (Math.random() < windowProbability) {
          const z = -depth / 2 + adjustZ + i * windowSpacingZ;
          windows.push({
            position: new THREE.Vector3(-width / 2 - 0.05, y, z),
            rotation: new THREE.Euler(0, -Math.PI / 2, 0)
          });
        }
      }
    }
    
    return windows;
  }
  
  /**
   * Create window meshes for a building
   * @param {Array} windowPositions - Array of window position objects
   * @param {number} destructionLevel - Level of destruction
   * @returns {THREE.Group} - Group containing all window meshes
   */
  createWindows(windowPositions, destructionLevel) {
    const windowsGroup = new THREE.Group();
    
    // Create individual window meshes (could be optimized with instancing)
    windowPositions.forEach((windowData, index) => {
      // For damaged buildings, some windows will be broken
      const isDamaged = destructionLevel > 0 && Math.random() < destructionLevel * 0.3;
      
      // Create window geometry and material
      const windowGeometry = this.geometries.window.clone();
      const windowMaterial = isDamaged
        ? new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.2, roughness: 0.8 })
        : new THREE.MeshStandardMaterial({ color: 0x80b3c4, metalness: 0.8, roughness: 0.1 });
      
      const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
      windowMesh.position.copy(windowData.position);
      windowMesh.rotation.copy(windowData.rotation);
      
      windowsGroup.add(windowMesh);
    });
    
    return windowsGroup;
  }
  
  /**
   * Create balconies for residential buildings
   * @param {number} width - Building width
   * @param {number} depth - Building depth
   * @param {number} height - Building height
   * @returns {THREE.Group} - Group containing balcony meshes
   */
  createBalconies(width, depth, height) {
    const balconiesGroup = new THREE.Group();
    const floorHeight = 3;
    const numFloors = Math.floor(height / floorHeight);
    
    // Add balconies to random floors (skip ground floor)
    for (let floor = 1; floor < numFloors; floor++) {
      if (Math.random() > 0.6) continue; // Skip some floors
      
      const y = floor * floorHeight;
      
      // Choose a random wall
      const wall = Math.floor(Math.random() * 4);
      
      // Balcony dimensions
      const balconyWidth = 1.5;
      const balconyDepth = 1.0;
      const balconyHeight = 0.2;
      
      // Create balcony base
      const baseGeometry = new THREE.BoxGeometry(balconyWidth, balconyHeight, balconyDepth);
      const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.8 });
      const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
      
      // Create balcony railing
      const railingGeometry = new THREE.BoxGeometry(balconyWidth, 1.0, 0.05);
      const railingMaterial = new THREE.MeshStandardMaterial({ color: 0x7e7e7e, roughness: 0.7 });
      const frontRailing = new THREE.Mesh(railingGeometry, railingMaterial);
      frontRailing.position.z = balconyDepth / 2 - 0.025;
      frontRailing.position.y = 0.5;
      
      // Side railings
      const sideRailingGeometry = new THREE.BoxGeometry(0.05, 1.0, balconyDepth);
      const leftRailing = new THREE.Mesh(sideRailingGeometry, railingMaterial);
      leftRailing.position.x = -balconyWidth / 2 + 0.025;
      leftRailing.position.y = 0.5;
      
      const rightRailing = new THREE.Mesh(sideRailingGeometry, railingMaterial);
      rightRailing.position.x = balconyWidth / 2 - 0.025;
      rightRailing.position.y = 0.5;
      
      // Create balcony group
      const balconyGroup = new THREE.Group();
      balconyGroup.add(baseMesh);
      balconyGroup.add(frontRailing);
      balconyGroup.add(leftRailing);
      balconyGroup.add(rightRailing);
      
      // Position balcony based on wall choice
      switch (wall) {
        case 0: // Front
          balconyGroup.position.set(
            (Math.random() - 0.5) * (width - balconyWidth),
            y,
            depth / 2 + balconyDepth / 2
          );
          break;
        case 1: // Right
          balconyGroup.rotation.y = Math.PI / 2;
          balconyGroup.position.set(
            width / 2 + balconyDepth / 2,
            y,
            (Math.random() - 0.5) * (depth - balconyWidth)
          );
          break;
        case 2: // Back
          balconyGroup.rotation.y = Math.PI;
          balconyGroup.position.set(
            (Math.random() - 0.5) * (width - balconyWidth),
            y,
            -depth / 2 - balconyDepth / 2
          );
          break;
        case 3: // Left
          balconyGroup.rotation.y = -Math.PI / 2;
          balconyGroup.position.set(
            -width / 2 - balconyDepth / 2,
            y,
            (Math.random() - 0.5) * (depth - balconyWidth)
          );
          break;
      }
      
      balconiesGroup.add(balconyGroup);
    }
    
    return balconiesGroup;
  }
  
  /**
   * Create industrial details like smokestacks, tanks, etc.
   * @param {number} width - Building width
   * @param {number} depth - Building depth
   * @param {number} height - Building height
   * @returns {THREE.Group} - Group containing industrial detail meshes
   */
  createIndustrialDetails(width, depth, height) {
    const detailsGroup = new THREE.Group();
    
    // Add smokestacks
    if (Math.random() > 0.5) {
      const numStacks = 1 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < numStacks; i++) {
        const stackRadius = 0.5 + Math.random() * 0.5;
        const stackHeight = 2 + Math.random() * 3;
        const stackGeometry = new THREE.CylinderGeometry(stackRadius, stackRadius, stackHeight, 8);
        const stackMaterial = new THREE.MeshStandardMaterial({
          color: 0x555555,
          roughness: 0.8,
          metalness: 0.2
        });
        
        const stackMesh = new THREE.Mesh(stackGeometry, stackMaterial);
        stackMesh.position.set(
          (Math.random() - 0.5) * (width - 2 * stackRadius),
          height + stackHeight / 2,
          (Math.random() - 0.5) * (depth - 2 * stackRadius)
        );
        
        detailsGroup.add(stackMesh);
      }
    }
    
    // Add tanks
    if (Math.random() > 0.6) {
      const numTanks = 1 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < numTanks; i++) {
        const tankRadius = 1 + Math.random() * 1;
        const tankHeight = 2 + Math.random() * 2;
        const tankGeometry = new THREE.CylinderGeometry(tankRadius, tankRadius, tankHeight, 12);
        const tankMaterial = new THREE.MeshStandardMaterial({
          color: Math.random() > 0.5 ? 0x999999 : 0x8c5e3c,
          roughness: 0.6,
          metalness: 0.4
        });
        
        const tankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
        
        // Place tanks on the roof or beside the building
        if (Math.random() > 0.5) {
          // On roof
          tankMesh.position.set(
            (Math.random() - 0.5) * (width - 2 * tankRadius),
            height + tankHeight / 2,
            (Math.random() - 0.5) * (depth - 2 * tankRadius)
          );
        } else {
          // Beside building
          const side = Math.floor(Math.random() * 4);
          switch (side) {
            case 0: // Front
              tankMesh.position.set(
                (Math.random() - 0.5) * width,
                tankHeight / 2,
                depth / 2 + tankRadius + 0.5
              );
              break;
            case 1: // Right
              tankMesh.position.set(
                width / 2 + tankRadius + 0.5,
                tankHeight / 2,
                (Math.random() - 0.5) * depth
              );
              break;
            case 2: // Back
              tankMesh.position.set(
                (Math.random() - 0.5) * width,
                tankHeight / 2,
                -depth / 2 - tankRadius - 0.5
              );
              break;
            case 3: // Left
              tankMesh.position.set(
                -width / 2 - tankRadius - 0.5,
                tankHeight / 2,
                (Math.random() - 0.5) * depth
              );
              break;
          }
        }
        
        detailsGroup.add(tankMesh);
      }
    }
    
    return detailsGroup;
  }
  
  /**
   * Apply damage effects to a building based on destruction level
   * @param {THREE.Group} buildingGroup - The building group to modify
   * @param {number} destructionLevel - Level of destruction (1-3)
   */
  applyDamage(buildingGroup, destructionLevel) {
    // Apply damage based on severity
    switch (destructionLevel) {
      case this.destructionLevels.DAMAGED:
        // Minor damage - broken windows, surface damage
        this.applyMinorDamage(buildingGroup);
        break;
      case this.destructionLevels.HEAVILY_DAMAGED:
        // Major damage - structural cracks, missing parts
        this.applyMajorDamage(buildingGroup);
        break;
      case this.destructionLevels.PARTIALLY_COLLAPSED:
        // Partial collapse - significant structural failure
        this.applyPartialCollapse(buildingGroup);
        break;
    }
  }
  
  /**
   * Apply minor damage (level 1) to a building
   * @param {THREE.Group} buildingGroup - Building group to modify
   */
  applyMinorDamage(buildingGroup) {
    // Randomly break windows
    buildingGroup.traverse((child) => {
      if (child.isMesh && child.name.includes('window')) {
        if (Math.random() < 0.4) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.2,
            roughness: 0.8
          });
        }
      }
    });
    
    // Add cracks to walls (could be done with textures or displacement maps)
  }
  
  /**
   * Apply major damage (level 2) to a building
   * @param {THREE.Group} buildingGroup - Building group to modify
   */
  applyMajorDamage(buildingGroup) {
    // Apply minor damage first
    this.applyMinorDamage(buildingGroup);
    
    // Find main building mesh
    let mainMesh = null;
    buildingGroup.traverse((child) => {
      if (child.isMesh && !child.name.includes('window') && !child.name.includes('roof')) {
        mainMesh = child;
      }
    });
    
    if (mainMesh) {
      // Create "holes" in the building by adding damaged sections
      const geometry = mainMesh.geometry;
      const position = mainMesh.position.clone();
      const width = geometry.parameters.width;
      const height = geometry.parameters.height;
      const depth = geometry.parameters.depth;
      
      // Add damage elements - could be more sophisticated with custom geometry
      const damageGeometry = new THREE.BoxGeometry(
        Math.min(2, width * 0.3),
        Math.min(2, height * 0.3),
        depth * 0.6
      );
      const damageMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 1.0,
        metalness: 0.0
      });
      
      const damageMesh = new THREE.Mesh(damageGeometry, damageMaterial);
      
      // Position damage on a random wall
      const side = Math.floor(Math.random() * 4);
      const y = (Math.random() - 0.3) * height;
      
      switch (side) {
        case 0: // Front
          damageMesh.position.set(
            (Math.random() - 0.5) * width * 0.6,
            y,
            depth / 2 - depth * 0.3
          );
          break;
        case 1: // Right
          damageMesh.position.set(
            width / 2 - width * 0.3,
            y,
            (Math.random() - 0.5) * depth * 0.6
          );
          break;
        case 2: // Back
          damageMesh.position.set(
            (Math.random() - 0.5) * width * 0.6,
            y,
            -depth / 2 + depth * 0.3
          );
          break;
        case 3: // Left
          damageMesh.position.set(
            -width / 2 + width * 0.3,
            y,
            (Math.random() - 0.5) * depth * 0.6
          );
          break;
      }
      
      buildingGroup.add(damageMesh);
    }
  }
  
  /**
   * Apply partial collapse (level 3) to a building
   * @param {THREE.Group} buildingGroup - Building group to modify
   */
  applyPartialCollapse(buildingGroup) {
    // Apply major damage first
    this.applyMajorDamage(buildingGroup);
    
    // Find main building mesh
    let mainMesh = null;
    buildingGroup.traverse((child) => {
      if (child.isMesh && !child.name.includes('window') && !child.name.includes('roof')) {
        mainMesh = child;
      }
    });
    
    if (mainMesh) {
      // Create a "collapsed" section by modifying the main building geometry
      const geometry = mainMesh.geometry;
      const width = geometry.parameters.width;
      const height = geometry.parameters.height;
      const depth = geometry.parameters.depth;
      
      // Determine which part of the building has collapsed
      const collapseSide = Math.floor(Math.random() * 4);
      const collapseAmount = height * (0.3 + Math.random() * 0.3); // 30-60% of height
      
      // Create rubble pile at the base of the collapsed section
      const rubbleGeometry = new THREE.BoxGeometry(
        width * 0.7,
        collapseAmount * 0.4,
        depth * 0.7
      );
      const rubbleMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 1.0,
        metalness: 0.0
      });
      
      const rubbleMesh = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
      rubbleMesh.position.y = collapseAmount * 0.2;
      
      switch (collapseSide) {
        case 0: // Front right corner
          rubbleMesh.position.x = width * 0.25;
          rubbleMesh.position.z = depth * 0.25;
          break;
        case 1: // Back right corner
          rubbleMesh.position.x = width * 0.25;
          rubbleMesh.position.z = -depth * 0.25;
          break;
        case 2: // Back left corner
          rubbleMesh.position.x = -width * 0.25;
          rubbleMesh.position.z = -depth * 0.25;
          break;
        case 3: // Front left corner
          rubbleMesh.position.x = -width * 0.25;
          rubbleMesh.position.z = depth * 0.25;
          break;
      }
      
      buildingGroup.add(rubbleMesh);
      
      // Option: Replace main building with a "damaged" version
      // This could be done by creating a custom geometry for the partially collapsed building
    }
  }
  
  /**
   * Utility function to darken a color
   * @param {number} color - Color in hex format
   * @param {number} amount - Amount to darken (0-1)
   * @returns {number} - Darkened color in hex format
   */
  darkenColor(color, amount) {
    const r = (color >> 16) & 255;
    const g = (color >> 8) & 255;
    const b = color & 255;
    
    const newR = Math.max(0, Math.floor(r * (1 - amount)));
    const newG = Math.max(0, Math.floor(g * (1 - amount)));
    const newB = Math.max(0, Math.floor(b * (1 - amount)));
    
    return (newR << 16) | (newG << 8) | newB;
  }
} 