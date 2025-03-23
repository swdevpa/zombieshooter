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
    this.cityMaterials.street = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: this.materialParams.street.roughness,
      metalness: this.materialParams.street.metalness
    });
    
    // Create sidewalk material
    this.cityMaterials.sidewalk = new THREE.MeshStandardMaterial({
      color: 0x9e9e9e,
      roughness: 0.85,
      metalness: 0.05
    });
    
    // Create debris materials
    this.cityMaterials.debris.concrete = new THREE.MeshStandardMaterial({
      color: 0x9e9e9e,
      roughness: 0.9,
      metalness: 0.1
    });
    
    this.cityMaterials.debris.metal = new THREE.MeshStandardMaterial({
      color: 0x777777,
      roughness: 0.7,
      metalness: 0.4
    });
    
    // Create vehicle materials
    this.cityMaterials.vehicles.car = new THREE.MeshStandardMaterial({
      color: 0x546e7a,
      roughness: 0.7,
      metalness: 0.3
    });
    
    this.cityMaterials.vehicles.rust = new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      roughness: 0.8,
      metalness: 0.2
    });
    
    // Create prop materials (lampposts, signs, etc.)
    this.cityMaterials.props.metal = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.6,
      metalness: 0.5
    });
  }
  
  /**
   * Create apocalyptic materials
   */
  createApocalypticMaterials() {
    // Create wood material
    this.apocalypticMaterials.wood = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown
      roughness: 0.9,
      metalness: 0.1
    });
    
    // Create metal material
    this.apocalypticMaterials.metal = new THREE.MeshStandardMaterial({
      color: 0x7F7F7F, // Gray
      roughness: 0.7,
      metalness: 0.5,
      flatShading: true
    });
    
    // Create blood material
    this.apocalypticMaterials.blood = new THREE.MeshStandardMaterial({
      color: 0x8B0000, // Dark red
      roughness: 1.0,
      metalness: 0.0,
      transparent: true,
      opacity: 0.9
    });
    
    // Create concrete material
    this.apocalypticMaterials.concrete = new THREE.MeshStandardMaterial({
      color: 0x9E9E9E, // Gray
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });
    
    // Create military material
    this.apocalypticMaterials.military = new THREE.MeshStandardMaterial({
      color: 0x4B5320, // Olive drab
      roughness: 0.8,
      metalness: 0.2
    });
    
    // Create fabric material
    this.apocalypticMaterials.fabric = new THREE.MeshStandardMaterial({
      color: 0x5D4037, // Brown
      roughness: 1.0,
      metalness: 0.0
    });
    
    // Create plants material
    this.apocalypticMaterials.plants = new THREE.MeshStandardMaterial({
      color: 0x33691E, // Dark green
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    // Create rusty metal material
    this.apocalypticMaterials.rustyMetal = new THREE.MeshStandardMaterial({
      color: 0x8D6E63, // Rust brown
      roughness: 0.8,
      metalness: 0.3,
      flatShading: true
    });
  }
  
  /**
   * Creates a building material based on type and destruction level
   */
  createBuildingMaterial(buildingType, destructionLevel) {
    // Get base texture based on building type
    const baseTexture = this.getBuildingBaseTexture(buildingType);
    const baseNormalMap = this.getBuildingBaseNormalMap(buildingType);
    
    // Get color based on building type with destructive level adjustments
    const baseColor = this.getBuildingBaseColor(buildingType, destructionLevel);
    
    // Adjust roughness and metalness based on destruction level
    const roughnessAdjustment = Math.min(0.3, destructionLevel * 0.1);
    const metalnessReduction = Math.min(0.05, destructionLevel * 0.02);
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      map: baseTexture,
      normalMap: baseNormalMap,
      color: baseColor,
      roughness: this.materialParams[buildingType].roughness + roughnessAdjustment,
      metalness: Math.max(0, this.materialParams[buildingType].metalness - metalnessReduction),
      bumpScale: this.materialParams[buildingType].bumpScale
    });
    
    // Add dirt and damage overlays based on destruction level
    if (destructionLevel > 0) {
      // Future enhancement: Add overlay textures for damage
    }
    
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
   * Updates texture quality based on performance settings
   */
  updateTextureQuality(quality) {
    this.textureQuality = quality;
    
    // Update texture filtering based on quality
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
    // Dispose building materials
    for (const type in this.buildingMaterials) {
      for (const level in this.buildingMaterials[type]) {
        if (this.buildingMaterials[type][level]) {
          this.buildingMaterials[type][level].dispose();
        }
      }
    }
    
    // Dispose city materials
    for (const type in this.cityMaterials) {
      if (typeof this.cityMaterials[type] === 'object' && !Array.isArray(this.cityMaterials[type])) {
        for (const subtype in this.cityMaterials[type]) {
          if (this.cityMaterials[type][subtype]) {
            this.cityMaterials[type][subtype].dispose();
          }
        }
      } else if (this.cityMaterials[type]) {
        this.cityMaterials[type].dispose();
      }
    }
    
    // Dispose apocalyptic materials
    for (const type in this.apocalypticMaterials) {
      if (this.apocalypticMaterials[type]) {
        this.apocalypticMaterials[type].dispose();
      }
    }
    
    console.log('TexturingSystem materials disposed');
  }
} 