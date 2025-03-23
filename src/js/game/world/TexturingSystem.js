import * as THREE from 'three';

/**
 * TexturingSystem class - Manages all environment textures and PBR materials
 * for buildings, streets, and city components with optimized texture management
 * and support for different quality levels.
 */
export class TexturingSystem {
  constructor(game, assetLoader) {
    this.game = game;
    this.assetLoader = assetLoader || game.assetLoader;
    this.assetManager = game.assetManager; // Get the AssetManager reference
    
    // Define color palettes for buildings
    this.colorPalettes = {
      residential: ['#d4b994', '#c2a587', '#b0937a', '#9e826d', '#8c7160'],
      commercial: ['#8c9db5', '#7a8a9e', '#687787', '#566470', '#445159'],
      industrial: ['#b5b5b5', '#9e9e9e', '#878787', '#707070', '#595959']
    };
    
    // Material caches for different building types and destruction levels
    this.buildingMaterials = {
      residential: {},
      commercial: {},
      industrial: {}
    };
    
    // Material caches for city components
    this.cityMaterials = {
      street: null,
      sidewalk: null,
      debris: {},
      vehicles: {},
      props: {}
    };
    
    // Material caches for apocalyptic assets
    this.apocalypticMaterials = {
      wood: null,
      metal: null,
      blood: null,
      concrete: null,
      military: null,
      fabric: null,
      plants: null,
      rustyMetal: null
    };
    
    // Texture quality setting
    this.textureQuality = 'medium'; // 'low', 'medium', 'high'
    
    // PBR material parameters
    this.materialParams = {
      residential: {
        roughness: 0.85,
        metalness: 0.05,
        bumpScale: 0.02
      },
      commercial: {
        roughness: 0.70,
        metalness: 0.15,
        bumpScale: 0.01
      },
      industrial: {
        roughness: 0.90,
        metalness: 0.30,
        bumpScale: 0.03
      },
      street: {
        roughness: 0.95,
        metalness: 0.05,
        bumpScale: 0.02
      },
      sidewalk: {
        roughness: 0.90,
        metalness: 0.05,
        bumpScale: 0.01
      }
    };
    
    // Number of shared materials created
    this.sharedMaterialCount = 0;
    
    // Initialize textures
    this.initializeTextures();
  }
  
  /**
   * Initializes all building and city textures
   */
  async initializeTextures() {
    console.log('Initializing TexturingSystem...');
    
    // Register additional needed texture types with the asset loader
    await this.registerEnvironmentTextures();
    
    // Create base material sets
    this.createBuildingMaterials();
    this.createCityMaterials();
    this.createApocalypticMaterials();
    
    console.log('TexturingSystem initialized');
  }
  
  /**
   * Registers additional textures needed for the environment
   */
  async registerEnvironmentTextures() {
    // Register building textures
    this.assetLoader.totalAssets += 9; // Adding 9 new textures
    
    await this.assetLoader._createTextureWithProgress('buildingWall', this.assetLoader.createBuildingWallTexture.bind(this.assetLoader));
    await this.assetLoader._createTextureWithProgress('buildingWallNormal', this.assetLoader.createBuildingWallNormalMap.bind(this.assetLoader));
    await this.assetLoader._createTextureWithProgress('buildingGlass', this.assetLoader.createBuildingGlassTexture.bind(this.assetLoader));
    await this.assetLoader._createTextureWithProgress('concreteWall', this.assetLoader.createConcreteWallTexture.bind(this.assetLoader));
    await this.assetLoader._createTextureWithProgress('concreteWallNormal', this.assetLoader.createConcreteWallNormalMap.bind(this.assetLoader));
    await this.assetLoader._createTextureWithProgress('metalWall', this.assetLoader.createMetalWallTexture.bind(this.assetLoader));
    await this.assetLoader._createTextureWithProgress('metalWallNormal', this.assetLoader.createMetalWallNormalMap.bind(this.assetLoader));
    await this.assetLoader._createTextureWithProgress('asphalt', this.assetLoader.createAsphaltTexture.bind(this.assetLoader));
    await this.assetLoader._createTextureWithProgress('asphaltNormal', this.assetLoader.createAsphaltNormalMap.bind(this.assetLoader));
  }
  
  /**
   * Creates all building materials based on type and destruction level
   */
  createBuildingMaterials() {
    const buildingTypes = ['residential', 'commercial', 'industrial'];
    const destructionLevels = [0, 1, 2, 3]; // Corresponds to PRISTINE, DAMAGED, etc.
    
    buildingTypes.forEach(type => {
      destructionLevels.forEach(level => {
        this.buildingMaterials[type][level] = this.createBuildingMaterial(type, level);
      });
    });
  }
  
  /**
   * Creates all city materials
   */
  createCityMaterials() {
    // Create street material
    this.cityMaterials.street = this.createCityComponentMaterial('street');
    
    // Create sidewalk material
    this.cityMaterials.sidewalk = this.createCityComponentMaterial('sidewalk');
    
    // Create debris materials
    this.cityMaterials.debris.concrete = this.createCityComponentMaterial('debris');
    
    this.cityMaterials.debris.metal = this.createCityComponentMaterial('metal');
    
    // Create vehicle materials
    this.cityMaterials.vehicles.car = this.createCityComponentMaterial('vehicle');
    
    this.cityMaterials.vehicles.rust = this.createCityComponentMaterial('rust');
    
    // Create prop materials (lampposts, signs, etc.)
    this.cityMaterials.props.metal = this.createCityComponentMaterial('prop');
  }
  
  /**
   * Create apocalyptic materials
   */
  createApocalypticMaterials() {
    // Create wood material
    this.apocalypticMaterials.wood = this.createCityComponentMaterial('wood');
    
    // Create metal material
    this.apocalypticMaterials.metal = this.createCityComponentMaterial('metal');
    
    // Create blood material
    this.apocalypticMaterials.blood = this.createCityComponentMaterial('blood');
    
    // Create concrete material
    this.apocalypticMaterials.concrete = this.createCityComponentMaterial('concrete');
    
    // Create military material
    this.apocalypticMaterials.military = this.createCityComponentMaterial('military');
    
    // Create fabric material
    this.apocalypticMaterials.fabric = this.createCityComponentMaterial('fabric');
    
    // Create plants material
    this.apocalypticMaterials.plants = this.createCityComponentMaterial('plants');
    
    // Create rusty metal material
    this.apocalypticMaterials.rustyMetal = this.createCityComponentMaterial('rustyMetal');
  }
  
  /**
   * Creates a building material with the specified parameters
   * @param {string} buildingType - Type of building (residential, commercial, industrial)
   * @param {number} destructionLevel - Level of destruction (0-3)
   * @returns {THREE.Material} The created material
   */
  createBuildingMaterial(buildingType, destructionLevel = 0) {
    // Check if we already have this material cached
    if (this.buildingMaterials[buildingType][destructionLevel]) {
      return this.buildingMaterials[buildingType][destructionLevel];
    }
    
    // Use AssetManager if available for shared materials
    if (this.assetManager) {
      const baseTexture = this.getBuildingBaseTexture(buildingType);
      const normalMap = this.getBuildingBaseNormalMap(buildingType);
      const params = this.materialParams[buildingType];
      
      // Apply destruction effects
      const destructionAmount = destructionLevel * 0.25; // 0 to 0.75
      
      // Create shared material parameters
      const materialParams = {
        type: 'standard',
        map: baseTexture,
        normalMap: normalMap,
        roughness: params.roughness + (destructionAmount * 0.3),
        metalness: params.metalness - (destructionAmount * 0.05),
        bumpScale: params.bumpScale,
        color: this.getRandomColorFromPalette(buildingType),
        // Add some variation based on destruction level
        displacementScale: destructionAmount * 0.1,
        envMapIntensity: 1.0 - (destructionAmount * 0.5)
      };
      
      // Get shared material from AssetManager
      const material = this.assetManager.getSharedMaterial(materialParams);
      
      // Cache the material
      this.buildingMaterials[buildingType][destructionLevel] = material;
      this.sharedMaterialCount++;
      
      return material;
    }
    
    // Fall back to original implementation if AssetManager is not available
    const baseTexture = this.getBuildingBaseTexture(buildingType);
    const baseNormalMap = this.getBuildingBaseNormalMap(buildingType);
    const params = this.materialParams[buildingType];
    
    // Apply destruction effects
    const destructionAmount = destructionLevel * 0.25; // 0 to 0.75
    
    // Create new material
    const material = new THREE.MeshStandardMaterial({
      map: baseTexture,
      normalMap: baseNormalMap,
      roughness: params.roughness + (destructionAmount * 0.3),
      metalness: params.metalness - (destructionAmount * 0.05),
      bumpScale: params.bumpScale,
      color: this.getRandomColorFromPalette(buildingType)
    });
    
    // Cache the material
    this.buildingMaterials[buildingType][destructionLevel] = material;
    
    return material;
  }
  
  /**
   * Gets the base texture for a building type
   */
  getBuildingBaseTexture(buildingType) {
    switch (buildingType) {
      case 'residential':
        return this.assetLoader.getTexture('buildingWall');
      case 'commercial':
        return this.assetLoader.getTexture('buildingGlass');
      case 'industrial':
        return this.assetLoader.getTexture('metalWall');
      default:
        return this.assetLoader.getTexture('buildingWall');
    }
  }
  
  /**
   * Gets the base normal map for a building type
   */
  getBuildingBaseNormalMap(buildingType) {
    switch (buildingType) {
      case 'residential':
        return this.assetLoader.getTexture('buildingWallNormal');
      case 'commercial':
        return this.assetLoader.getTexture('buildingWallNormal'); // Using same normal map for now
      case 'industrial':
        return this.assetLoader.getTexture('metalWallNormal');
      default:
        return this.assetLoader.getTexture('buildingWallNormal');
    }
  }
  
  /**
   * Gets the base color for a building type and destruction level
   */
  getBuildingBaseColor(buildingType, destructionLevel) {
    // Get a base color from our color palettes
    const palette = this.colorPalettes[buildingType];
    const baseColorHex = palette[Math.floor(Math.random() * palette.length)];
    
    // Convert hex to THREE.Color
    const color = new THREE.Color(baseColorHex);
    
    // Darken based on destruction level
    if (destructionLevel > 0) {
      // Darken more as destruction increases (0.2 - 0.5 range)
      const darkenAmount = 0.2 + (destructionLevel * 0.1);
      
      // Reduce RGB values to darken
      color.r = Math.max(0, color.r - darkenAmount * color.r);
      color.g = Math.max(0, color.g - darkenAmount * color.g);
      color.b = Math.max(0, color.b - darkenAmount * color.b);
    }
    
    return color;
  }
  
  /**
   * Gets the appropriate building material for a building type and destruction level
   */
  getBuildingMaterial(buildingType, destructionLevel) {
    // Validate inputs and provide fallbacks
    const validBuildingType = this.buildingMaterials.hasOwnProperty(buildingType) 
      ? buildingType 
      : 'residential';
      
    const validDestructionLevel = this.buildingMaterials[validBuildingType].hasOwnProperty(destructionLevel)
      ? destructionLevel
      : 0;
    
    return this.buildingMaterials[validBuildingType][validDestructionLevel];
  }
  
  /**
   * Gets a city material by type
   */
  getCityMaterial(type) {
    if (type === 'street') return this.cityMaterials.street;
    if (type === 'sidewalk') return this.cityMaterials.sidewalk;
    if (type === 'debris') return this.cityMaterials.debris.concrete;
    if (type === 'metal') return this.cityMaterials.debris.metal;
    if (type === 'vehicle') return this.cityMaterials.vehicles.car;
    if (type === 'prop') return this.cityMaterials.props.metal;
    
    // Default fallback
    return new THREE.MeshStandardMaterial({ color: 0xcccccc });
  }
  
  /**
   * Get a material for a specific apocalyptic asset
   * @param {string} type - Type of apocalyptic material
   * @returns {THREE.Material} Material for the asset
   */
  getApocalypticMaterial(type) {
    if (this.apocalypticMaterials[type]) {
      return this.apocalypticMaterials[type];
    }
    
    // Default fallback
    return new THREE.MeshStandardMaterial({ color: 0xcccccc });
  }
  
  /**
   * Creates a material for a city component like streets, sidewalks, etc.
   * @param {string} componentType - Type of city component
   * @returns {THREE.Material} The created material
   */
  createCityComponentMaterial(componentType) {
    // Check if we already have this material cached
    if (this.cityMaterials[componentType]) {
      return this.cityMaterials[componentType];
    }
    
    // Use AssetManager if available for shared materials
    if (this.assetManager && this.materialParams[componentType]) {
      const params = this.materialParams[componentType];
      let baseTexture;
      
      switch (componentType) {
        case 'street':
          baseTexture = this.assetLoader.getTexture('road');
          break;
        case 'sidewalk':
          baseTexture = this.assetLoader.getTexture('concrete');
          break;
        default:
          baseTexture = this.assetLoader.getTexture('concrete');
      }
      
      // Create shared material parameters
      const materialParams = {
        type: 'standard',
        map: baseTexture,
        roughness: params.roughness,
        metalness: params.metalness,
        bumpScale: params.bumpScale,
        color: 0xffffff
      };
      
      // Get shared material from AssetManager
      const material = this.assetManager.getSharedMaterial(materialParams);
      
      // Cache the material
      this.cityMaterials[componentType] = material;
      
      return material;
    }
    
    // Fall back to original implementation
    let baseTexture;
    const params = this.materialParams[componentType] || {
      roughness: 0.9,
      metalness: 0.1,
      bumpScale: 0.01
    };
    
    switch (componentType) {
      case 'street':
        baseTexture = this.assetLoader.getTexture('road');
        break;
      case 'sidewalk':
        baseTexture = this.assetLoader.getTexture('concrete');
        break;
      default:
        baseTexture = this.assetLoader.getTexture('concrete');
    }
    
    // Create new material
    const material = new THREE.MeshStandardMaterial({
      map: baseTexture,
      roughness: params.roughness,
      metalness: params.metalness,
      bumpScale: params.bumpScale
    });
    
    // Cache the material
    this.cityMaterials[componentType] = material;
    
    return material;
  }
  
  /**
   * Get optimized geometry with caching
   * @param {string} key - Geometry key for caching
   * @param {Function} createFn - Function to create geometry if not cached
   * @returns {THREE.BufferGeometry} The geometry
   */
  getOptimizedGeometry(key, createFn) {
    // Use AssetManager if available for shared geometries
    if (this.assetManager) {
      return this.assetManager.getOptimizedGeometry(createFn, key);
    }
    
    // Fall back to direct creation
    return createFn();
  }
  
  /**
   * Updates texture quality based on performance settings
   */
  updateTextureQuality(quality) {
    this.textureQuality = quality;
    
    // If AssetManager is available, let it handle quality settings
    if (this.assetManager) {
      this.assetManager.applyQualitySettings(quality);
      console.log(`Texture quality updated to: ${quality} via AssetManager`);
      return;
    }
    
    // Otherwise use the old implementation
    const filtering = this.getFilteringByQuality(quality);
    
    // Apply to all textures
    for (const textureName in this.assetLoader.textures) {
      const texture = this.assetLoader.textures[textureName];
      texture.magFilter = filtering.magFilter;
      texture.minFilter = filtering.minFilter;
      texture.needsUpdate = true;
    }
    
    console.log(`Texture quality updated to: ${quality}`);
  }
  
  /**
   * Gets texture filtering settings based on quality level
   */
  getFilteringByQuality(quality) {
    switch (quality) {
      case 'low':
        return {
          magFilter: THREE.NearestFilter,
          minFilter: THREE.NearestFilter
        };
      case 'medium':
        return {
          magFilter: THREE.LinearFilter,
          minFilter: THREE.LinearMipmapNearestFilter
        };
      case 'high':
        return {
          magFilter: THREE.LinearFilter,
          minFilter: THREE.LinearMipmapLinearFilter
        };
      default:
        return {
          magFilter: THREE.LinearFilter,
          minFilter: THREE.LinearMipmapNearestFilter
        };
    }
  }
  
  /**
   * Disposes of all materials to free memory
   */
  dispose() {
    console.log('Disposing TexturingSystem materials');
    
    // Dispose building materials
    for (const type in this.buildingMaterials) {
      for (const level in this.buildingMaterials[type]) {
        if (this.buildingMaterials[type][level] && this.buildingMaterials[type][level].dispose) {
          this.buildingMaterials[type][level].dispose();
        }
      }
    }
    
    // Dispose city materials
    for (const type in this.cityMaterials) {
      if (typeof this.cityMaterials[type] === 'object' && !Array.isArray(this.cityMaterials[type])) {
        for (const subtype in this.cityMaterials[type]) {
          if (this.cityMaterials[type][subtype] && this.cityMaterials[type][subtype].dispose) {
            this.cityMaterials[type][subtype].dispose();
          }
        }
      } else if (this.cityMaterials[type] && this.cityMaterials[type].dispose) {
        this.cityMaterials[type].dispose();
      }
    }
    
    // Dispose apocalyptic materials
    for (const type in this.apocalypticMaterials) {
      if (this.apocalypticMaterials[type] && this.apocalypticMaterials[type].dispose) {
        this.apocalypticMaterials[type].dispose();
      }
    }
    
    // Log shared material stats if using AssetManager
    if (this.assetManager) {
      console.log(`Shared material count: ${this.sharedMaterialCount}`);
    }
    
    console.log('TexturingSystem materials disposed');
  }
} 