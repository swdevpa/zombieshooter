import * as THREE from 'three';

/**
 * BuildingGenerator class - Responsible for procedurally generating building meshes
 * with various types, styles, and details for a post-apocalyptic cityscape.
 * Now supports Level of Detail (LOD) for performance optimization.
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
    
    // LOD options
    this.lodLevels = {
      HIGH: 2,   // High detail - full details, all windows, decorations
      MEDIUM: 1, // Medium detail - simplified windows, reduced decorations
      LOW: 0     // Low detail - basic shape, minimal details, simplified textures
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
   * Create a building with multiple LOD levels
   * @param {Object} options - Building configuration options
   * @returns {Object} Building object with container and LOD meshes
   */
  createBuilding(options) {
    const width = options.width || 10;
    const depth = options.depth || 10;
    const height = options.height || 20;
    const buildingType = options.type || this.buildingTypes.RESIDENTIAL;
    const destructionLevel = options.destructionLevel || this.destructionLevels.PRISTINE;
    
    // Create building container
    const building = {
      container: new THREE.Group(),
      detailLevels: {
        high: new THREE.Group(),
        medium: new THREE.Group(),
        low: new THREE.Group()
      },
      currentDetailLevel: this.lodLevels.HIGH,
      setDetailLevel: function(level) {
        // Hide current LOD level
        Object.values(this.detailLevels).forEach(group => {
          group.visible = false;
        });
        
        // Show the requested LOD level
        switch(level) {
          case 0: // LOW
            this.detailLevels.low.visible = true;
            this.currentDetailLevel = 0;
            break;
          case 1: // MEDIUM
            this.detailLevels.medium.visible = true;
            this.currentDetailLevel = 1;
            break;
          case 2: // HIGH
          default:
            this.detailLevels.high.visible = true;
            this.currentDetailLevel = 2;
            break;
        }
      }
    };
    
    // Create the high detail version
    this.createHighDetailBuilding(
      building.detailLevels.high, 
      width, 
      depth, 
      height, 
      buildingType, 
      destructionLevel
    );
    
    // Create the medium detail version
    this.createMediumDetailBuilding(
      building.detailLevels.medium, 
      width, 
      depth, 
      height, 
      buildingType, 
      destructionLevel
    );
    
    // Create the low detail version
    this.createLowDetailBuilding(
      building.detailLevels.low, 
      width, 
      depth, 
      height, 
      buildingType, 
      destructionLevel
    );
    
    // Add detail levels to container
    building.container.add(
      building.detailLevels.high,
      building.detailLevels.medium,
      building.detailLevels.low
    );
    
    // Initially show only high detail version
    building.setDetailLevel(this.lodLevels.HIGH);
    
    return building;
  }
  
  /**
   * Create a high detail building
   */
  createHighDetailBuilding(group, width, depth, height, type, destructionLevel) {
    switch (type) {
      case this.buildingTypes.COMMERCIAL:
        this.createCommercialBuilding(group, width, depth, height, destructionLevel);
        break;
      case this.buildingTypes.INDUSTRIAL:
        this.createIndustrialBuilding(group, width, depth, height, destructionLevel);
        break;
      case this.buildingTypes.RESIDENTIAL:
      default:
        this.createResidentialBuilding(group, width, depth, height, destructionLevel);
        break;
    }
  }
  
  /**
   * Create a medium detail building (simplified version)
   */
  createMediumDetailBuilding(group, width, depth, height, type, destructionLevel) {
    // Create building base with fewer details
    const buildingGeo = this.createBuildingGeometry(width, height, depth, {
      simplify: true, // Simplified geometry
      cornerDetails: false // No corner details
    });
    
    // Create materials for this building
    const materials = this.createMaterials(type, destructionLevel);
    
    // Create the building mesh
    const buildingMesh = new THREE.Mesh(buildingGeo, materials.walls);
    buildingMesh.castShadow = true;
    buildingMesh.receiveShadow = true;
    group.add(buildingMesh);
    
    // Add simplified windows (fewer in number than high detail)
    let windowPositions;
    switch (type) {
      case this.buildingTypes.COMMERCIAL:
        windowPositions = this.generateWindowPositions(width, depth, height, type, {
          windowDensity: 0.6 // Fewer windows
        });
        break;
      case this.buildingTypes.INDUSTRIAL:
        windowPositions = this.generateWindowPositions(width, depth, height, type, {
          windowDensity: 0.5 // Fewer windows
        });
        break;
      case this.buildingTypes.RESIDENTIAL:
      default:
        windowPositions = this.generateWindowPositions(width, depth, height, type, {
          windowDensity: 0.6 // Fewer windows
        });
        break;
    }
    
    // Create fewer windows with simplified materials
    this.createWindows(windowPositions, destructionLevel, group, {
      simplified: true // Simplified window models
    });
    
    // Add minimal details based on building type
    switch (type) {
      case this.buildingTypes.COMMERCIAL:
        // No additional details for medium LOD
        break;
      case this.buildingTypes.INDUSTRIAL:
        // Add only essential industrial details
        this.createIndustrialDetails(width, depth, height, group, {
          simplify: true // Simplified industrial details
        });
        break;
      case this.buildingTypes.RESIDENTIAL:
        // No balconies for medium LOD
        break;
    }
    
    // Apply damage if needed
    if (destructionLevel > this.destructionLevels.PRISTINE) {
      this.applyDamage(group, destructionLevel, {
        simplify: true // Simplified damage
      });
    }
  }
  
  /**
   * Create a low detail building (very simplified version)
   */
  createLowDetailBuilding(group, width, depth, height, type, destructionLevel) {
    // Create simplified building geometry
    const buildingGeo = this.createBuildingGeometry(width, height, depth, {
      simplify: true,
      cornerDetails: false,
      noDivisions: true // No facade divisions for low detail
    });
    
    // Create simplified materials with lower resolution textures
    const materials = this.createMaterials(type, destructionLevel, {
      lowDetail: true // Simplified textures for low detail
    });
    
    // Create the building mesh
    const buildingMesh = new THREE.Mesh(buildingGeo, materials.walls);
    buildingMesh.castShadow = true;
    buildingMesh.receiveShadow = true;
    group.add(buildingMesh);
    
    // For low detail, we add facade texture instead of actual windows
    // Just add a few highlight elements to suggest windows
    if (type !== this.buildingTypes.INDUSTRIAL) {
      const windowPositions = this.generateWindowPositions(width, depth, height, type, {
        windowDensity: 0.3 // Very few windows
      });
      
      // Create only a handful of window representations for visual interest
      this.createWindows(windowPositions.slice(0, 5), destructionLevel, group, {
        simplified: true,
        mergeGeometry: true // Merge window geometries for better performance
      });
    }
    
    // Only add major damage for visual effect if heavily damaged
    if (destructionLevel >= this.destructionLevels.HEAVILY_DAMAGED) {
      this.applyDamage(group, destructionLevel, {
        simplify: true,
        majorOnly: true // Only major damage features
      });
    }
  }

  // Override the existing methods to accept additional LOD parameters

  generateWindowPositions(width, depth, height, type, lodOptions = {}) {
    // Use existing method but adjust density based on LOD options
    const windowDensity = lodOptions.windowDensity || 1.0;
    
    // ... existing window position generation code ...
    // Just adjust the number of windows based on density
    
    // For now, let's use a simplified version of the existing method
    const positions = [];
    
    // Base values for different building types
    let spacingX, spacingY, offsetX, offsetY, rows, cols;
    
    switch (type) {
      case this.buildingTypes.COMMERCIAL:
        spacingX = 2.5;
        spacingY = 3;
        offsetX = 1.5;
        offsetY = 3;
        break;
      case this.buildingTypes.INDUSTRIAL:
        spacingX = 4;
        spacingY = 4;
        offsetX = 2;
        offsetY = 4;
        break;
      case this.buildingTypes.RESIDENTIAL:
      default:
        spacingX = 2;
        spacingY = 2.5;
        offsetX = 1;
        offsetY = 3;
        break;
    }
    
    // Adjust window density based on LOD
    spacingX /= windowDensity;
    spacingY /= windowDensity;
    
    // Calculate number of rows and columns
    rows = Math.floor((height - offsetY) / spacingY);
    cols = Math.floor((width - offsetX * 2) / spacingX) * 2 + 
           Math.floor((depth - offsetX * 2) / spacingX) * 2;
    
    // Add window positions
    // Front face
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < Math.floor((width - offsetX * 2) / spacingX); col++) {
        positions.push({
          position: new THREE.Vector3(
            offsetX + col * spacingX - width / 2 + spacingX / 2,
            offsetY + row * spacingY,
            depth / 2 + 0.1
          ),
          rotation: new THREE.Euler(0, 0, 0),
          face: 'front'
        });
      }
    }
    
    // Back face
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < Math.floor((width - offsetX * 2) / spacingX); col++) {
        positions.push({
          position: new THREE.Vector3(
            offsetX + col * spacingX - width / 2 + spacingX / 2,
            offsetY + row * spacingY,
            -depth / 2 - 0.1
          ),
          rotation: new THREE.Euler(0, Math.PI, 0),
          face: 'back'
        });
      }
    }
    
    // Left face
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < Math.floor((depth - offsetX * 2) / spacingX); col++) {
        positions.push({
          position: new THREE.Vector3(
            -width / 2 - 0.1,
            offsetY + row * spacingY,
            offsetX + col * spacingX - depth / 2 + spacingX / 2
          ),
          rotation: new THREE.Euler(0, -Math.PI / 2, 0),
          face: 'left'
        });
      }
    }
    
    // Right face
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < Math.floor((depth - offsetX * 2) / spacingX); col++) {
        positions.push({
          position: new THREE.Vector3(
            width / 2 + 0.1,
            offsetY + row * spacingY,
            offsetX + col * spacingX - depth / 2 + spacingX / 2
          ),
          rotation: new THREE.Euler(0, Math.PI / 2, 0),
          face: 'right'
        });
      }
    }
    
    return positions;
  }
    
  createWindows(windowPositions, destructionLevel, targetGroup, options = {}) {
    const group = targetGroup || new THREE.Group();
    const simplified = options.simplified || false;
    const mergeGeometry = options.mergeGeometry || false;
    
    // If we're merging geometry for performance, set up merged window approach
    if (mergeGeometry) {
      const windowGeometry = new THREE.BoxGeometry(1, 1, 0.1);
      const windowMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.2
      });
      
      // Create a single merged geometry
      const mergedGeometry = new THREE.BufferGeometry();
      const positions = [];
      const normals = [];
      const uvs = [];
      
      // Add each window to the merged geometry
      windowPositions.forEach(windowData => {
        const windowMatrix = new THREE.Matrix4();
        windowMatrix.makeRotationFromEuler(windowData.rotation);
        windowMatrix.setPosition(windowData.position);
        
        // Add transformed vertices, normals, UVs to merged arrays
        const tempGeometry = windowGeometry.clone().applyMatrix4(windowMatrix);
        
        const positionAttr = tempGeometry.getAttribute('position');
        const normalAttr = tempGeometry.getAttribute('normal');
        const uvAttr = tempGeometry.getAttribute('uv');
        
        for (let i = 0; i < positionAttr.count; i++) {
          positions.push(
            positionAttr.getX(i),
            positionAttr.getY(i),
            positionAttr.getZ(i)
          );
          
          normals.push(
            normalAttr.getX(i),
            normalAttr.getY(i),
            normalAttr.getZ(i)
          );
          
          uvs.push(
            uvAttr.getX(i),
            uvAttr.getY(i)
          );
        }
        
        tempGeometry.dispose();
      });
      
      // Create the merged geometry
      mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      mergedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      
      // Create mesh with merged geometry
      const mergedWindows = new THREE.Mesh(mergedGeometry, windowMaterial);
      mergedWindows.castShadow = true;
      mergedWindows.receiveShadow = true;
      
      group.add(mergedWindows);
      
      return group;
    }
    
    // For individual windows (high/medium detail)
    let windowTemplate;
    
    // Use simplified window for medium/low detail
    if (simplified) {
      // Simple box geometry for windows
      windowTemplate = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 0.1),
        new THREE.MeshStandardMaterial({ 
          color: 0x333333,
          metalness: 0.8,
          roughness: 0.2
        })
      );
    } else {
      // Use detailed window template for high detail
      if (!this.templates.window) {
        this.initializeTemplates();
      }
      windowTemplate = this.templates.window.clone();
    }
    
    // Place windows
    for (let i = 0; i < windowPositions.length; i++) {
      const windowData = windowPositions[i];
      
      // Skip some windows when damaged
      if (destructionLevel > this.destructionLevels.PRISTINE) {
        // For damaged buildings, randomly skip windows to create damage effect
        if (Math.random() < 0.2 * destructionLevel) continue;
      }
      
      const window = windowTemplate.clone();
      window.position.copy(windowData.position);
      window.rotation.copy(windowData.rotation);
      
      // Scale window
      if (simplified) {
        window.scale.set(1.5, 1.8, 0.1);
      }
      
      group.add(window);
    }
    
    return group;
  }
  
  createBuildingGeometry(width, height, depth, options = {}) {
    // Cache key for geometry - include LOD options
    const simplified = options.simplify || false;
    const noCorners = options.cornerDetails === false;
    const noDivisions = options.noDivisions || false;
    
    const cacheKey = `${width}_${height}_${depth}_${simplified ? 'simple' : 'detailed'}_${noCorners ? 'noCorner' : 'corner'}_${noDivisions ? 'noDiv' : 'div'}`;
    
    // Check cache first
    if (this.geometries[cacheKey]) {
      return this.geometries[cacheKey].clone();
    }
    
    // Create new geometry
    const geometry = this._createBuildingGeometryInternal(width, height, depth, options);
    
    // Store in cache
    this.geometries[cacheKey] = geometry.clone();
    
    return geometry;
  }
  
  _createBuildingGeometryInternal(width, height, depth, options = {}) {
    const simplified = options.simplify || false;
    const noCorners = options.cornerDetails === false;
    const noDivisions = options.noDivisions || false;
    
    if (simplified) {
      // Simple box geometry for low/medium detail
      return new THREE.BoxGeometry(width, height, depth);
    }
    
    // Detailed geometry for high detail level
    // ... existing detailed geometry generation ...
    
    // Return the full detail geometry from existing implementation
    return new THREE.BoxGeometry(width, height, depth);
  }
  
  // Update materials creation to support LOD options
  createMaterials(buildingType, destructionLevel, options = {}) {
    const lowDetail = options.lowDetail || false;
    
    // Cache key for materials - include LOD options
    const cacheKey = `${buildingType}_${destructionLevel}_${lowDetail ? 'low' : 'high'}`;
    
    // Check cache first
    if (this.materials[cacheKey]) {
      return {
        wall: this.materials[cacheKey].walls.clone(),
        window: this.materials[cacheKey].windows.clone(),
        roof: this.materials[cacheKey].roof.clone()
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
  applyDamage(buildingGroup, destructionLevel, options = {}) {
    const simplify = options.simplify || false;
    const majorOnly = options.majorOnly || false;
    
    // Skip minor damage for simplified models
    if (simplify && majorOnly) {
      // Only apply major damage for low LOD
      if (destructionLevel >= this.destructionLevels.HEAVILY_DAMAGED) {
        this.applyMajorDamage(buildingGroup, { simplify: true });
      }
      return;
    }
    
    // For medium LOD, apply simplified damage
    if (simplify) {
      switch (destructionLevel) {
        case this.destructionLevels.DAMAGED:
          this.applyMinorDamage(buildingGroup, { simplify: true });
          break;
        case this.destructionLevels.HEAVILY_DAMAGED:
          this.applyMajorDamage(buildingGroup, { simplify: true });
          break;
        case this.destructionLevels.PARTIALLY_COLLAPSED:
          this.applyPartialCollapse(buildingGroup, { simplify: true });
          break;
      }
      return;
    }
    
    // For high LOD, use full damage detail
    switch (destructionLevel) {
      case this.destructionLevels.DAMAGED:
        this.applyMinorDamage(buildingGroup);
        break;
      case this.destructionLevels.HEAVILY_DAMAGED:
        this.applyMinorDamage(buildingGroup);
        this.applyMajorDamage(buildingGroup);
        break;
      case this.destructionLevels.PARTIALLY_COLLAPSED:
        this.applyMinorDamage(buildingGroup);
        this.applyMajorDamage(buildingGroup);
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

  createBuildingGeometry(width, height, depth, options) {
    const { 
      windowsX = 3, 
      windowsY = 4, 
      hasRoof = true, 
      destructionLevel = 0 
    } = options || {};
    
    // Use optimized geometry if texturing system is available
    if (this.game.texturingSystem) {
      // Create a unique key for this geometry configuration
      const geometryKey = `building_${width}_${height}_${depth}_${windowsX}_${windowsY}_${hasRoof}_${destructionLevel}`;
      
      // Use getOptimizedGeometry to create or retrieve cached geometry
      return this.game.texturingSystem.getOptimizedGeometry(geometryKey, () => {
        return this._createBuildingGeometryInternal(width, height, depth, options);
      });
    }
    
    // Fall back to direct creation
    return this._createBuildingGeometryInternal(width, height, depth, options);
  }

  // Internal method to actually create the geometry
  _createBuildingGeometryInternal(width, height, depth, options) {
    const { 
      windowsX = 3, 
      windowsY = 4, 
      hasRoof = true, 
      destructionLevel = 0 
    } = options || {};
    
    // Clone existing code here from the current implementation
    // Note: This is a simplified placeholder - you'd copy your actual implementation here
    const geometry = new THREE.BoxGeometry(width, height, depth);
    
    // Apply destruction to geometry if needed
    if (destructionLevel > 0) {
      this.applyDestructionToGeometry(geometry, destructionLevel);
    }
    
    return geometry;
  }
} 