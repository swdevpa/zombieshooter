import * as THREE from 'three';
import { ObjectPool } from './ObjectPool.js';

/**
 * AssetManager - Advanced asset management and optimization
 * 
 * This class extends the functionality of AssetLoader by providing:
 * - Progressive asset loading based on priority
 * - Dynamic texture management and unloading
 * - Texture atlasing for similar assets
 * - Asset preloading and prefetching for game scenes
 * - Memory usage tracking and optimization
 */
export class AssetManager {
  /**
   * Create a new asset manager
   * @param {AssetLoader} assetLoader - The asset loader instance
   * @param {Game} game - Game instance reference
   */
  constructor(assetLoader, game) {
    this.assetLoader = assetLoader;
    this.game = game;
    
    // Asset collections by type
    this.assets = {
      textures: new Map(),
      models: new Map(),
      sounds: new Map(),
      materials: new Map()
    };
    
    // Asset priority queues (high, medium, low)
    this.assetQueues = {
      high: [],
      medium: [],
      low: []
    };
    
    // Asset usage tracking
    this.assetUsage = new Map();
    
    // Texture atlases
    this.textureAtlases = new Map();
    
    // Material instances
    this.materialInstances = new Map();
    
    // Geometry cache
    this.geometryCache = new Map();
    
    // Loading state
    this.isLoading = false;
    this.loadingQueue = Promise.resolve();
    
    // Memory tracking
    this.memoryUsage = {
      textures: 0,
      geometries: 0,
      materials: 0,
      total: 0
    };
    
    // Configuration
    this.config = {
      maxTextureSize: 2048,
      textureUnloadTime: 60, // Seconds of non-use before unloading
      atlasSize: 2048,
      enableAtlasing: true,
      enableGeometryOptimization: true,
      useCompressedTextures: false,
      forceLowQualityTextures: false,
      materialInstancing: true,
      enableDetailMapping: true,
      logLevel: 'info' // 'debug', 'info', 'warn', 'error'
    };
    
    // Texture pools for standard sizes
    this.texturePools = {
      small: new ObjectPool(() => new THREE.CanvasTexture(document.createElement('canvas')), 20),
      medium: new ObjectPool(() => new THREE.CanvasTexture(document.createElement('canvas')), 10),
      large: new ObjectPool(() => new THREE.CanvasTexture(document.createElement('canvas')), 5)
    };
  }
  
  /**
   * Initialize the asset manager
   * @returns {Promise} Promise that resolves when initialization is complete
   */
  async init() {
    console.log('Initializing AssetManager...');
    
    // Create texture atlases
    if (this.config.enableAtlasing) {
      this.createTextureAtlases();
    }
    
    // Set up memory usage tracking
    this.setupMemoryTracking();
    
    // Process any initial asset queues
    if (this.assetQueues.high.length > 0) {
      await this.processQueue('high');
    }
    
    console.log('AssetManager initialized successfully');
    return this;
  }
  
  /**
   * Set up memory usage tracking
   */
  setupMemoryTracking() {
    // Set up memory tracking interval
    setInterval(() => {
      this.updateMemoryUsage();
    }, 10000); // Check every 10 seconds
  }
  
  /**
   * Update memory usage statistics
   */
  updateMemoryUsage() {
    let textureMemory = 0;
    let geometryMemory = 0;
    let materialMemory = 0;
    
    // Calculate approximate texture memory
    for (const [name, metadata] of this.assets.textures) {
      if (metadata.texture) {
        const width = metadata.texture.image ? metadata.texture.image.width : 0;
        const height = metadata.texture.image ? metadata.texture.image.height : 0;
        // Estimate 4 bytes per pixel (RGBA)
        textureMemory += width * height * 4;
      }
    }
    
    // Calculate approximate geometry memory
    for (const [name, geometry] of this.geometryCache) {
      if (geometry.attributes && geometry.attributes.position) {
        geometryMemory += geometry.attributes.position.array.length * 4; // Float32Array, 4 bytes per element
      }
      if (geometry.index) {
        geometryMemory += geometry.index.array.length * 2; // Uint16Array, 2 bytes per element
      }
    }
    
    // Calculate approximate material memory
    for (const [name, material] of this.materialInstances) {
      // Rough estimate - each material takes about 1KB plus its textures
      materialMemory += 1024;
    }
    
    // Update memory usage statistics
    this.memoryUsage = {
      textures: Math.round(textureMemory / (1024 * 1024)), // MB
      geometries: Math.round(geometryMemory / (1024 * 1024)), // MB
      materials: Math.round(materialMemory / (1024 * 1024)), // MB
      total: Math.round((textureMemory + geometryMemory + materialMemory) / (1024 * 1024)) // MB
    };
    
    if (this.config.logLevel === 'debug') {
      console.log('Memory usage:', this.memoryUsage);
    }
    
    // Check if memory usage is too high and take action if needed
    if (this.memoryUsage.total > 500) { // 500MB as an example threshold
      this.performMemoryOptimization();
    }
  }
  
  /**
   * Perform memory optimization when memory usage is high
   */
  performMemoryOptimization() {
    console.warn('Memory usage is high, performing optimization...');
    
    // Unload unused textures
    this.unloadUnusedTextures();
    
    // Unload unused geometries
    this.unloadUnusedGeometries();
    
    // Force a garbage collection hint (not guaranteed to run)
    if (window.gc) {
      window.gc();
    }
  }
  
  /**
   * Create texture atlases for optimized rendering
   */
  createTextureAtlases() {
    // Create texture atlas for common textures
    const commonAtlas = document.createElement('canvas');
    commonAtlas.width = this.config.atlasSize;
    commonAtlas.height = this.config.atlasSize;
    const ctx = commonAtlas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, commonAtlas.width, commonAtlas.height);
    
    // Store the atlas texture
    const atlasTexture = new THREE.CanvasTexture(commonAtlas);
    atlasTexture.minFilter = THREE.LinearMipmapLinearFilter;
    atlasTexture.magFilter = THREE.LinearFilter;
    atlasTexture.wrapS = THREE.RepeatWrapping;
    atlasTexture.wrapT = THREE.RepeatWrapping;
    atlasTexture.needsUpdate = true;
    
    // Store the atlas
    this.textureAtlases.set('common', {
      texture: atlasTexture,
      canvas: commonAtlas,
      context: ctx,
      regions: new Map(),
      nextX: 0,
      nextY: 0,
      rowHeight: 0
    });
  }
  
  /**
   * Request assets to be loaded with priority
   * @param {Array} assetDescriptors - Array of asset descriptors
   * @param {string} priority - Priority level ('high', 'medium', 'low')
   * @returns {Promise} Promise that resolves when assets are loaded
   */
  requestAssets(assetDescriptors, priority = 'medium') {
    // Add assets to the appropriate queue
    this.assetQueues[priority].push(...assetDescriptors);
    
    // Start processing the queue if not already loading
    if (!this.isLoading) {
      return this.processQueue(priority);
    }
    
    // Return the current loading queue
    return this.loadingQueue;
  }
  
  /**
   * Process asset loading queue
   * @param {string} priority - Priority level to start with
   * @returns {Promise} Promise that resolves when queue is processed
   */
  async processQueue(priority) {
    this.isLoading = true;
    
    try {
      // Process queues in priority order
      for (const p of ['high', 'medium', 'low']) {
        if (p !== priority && priority !== 'all') continue;
        
        while (this.assetQueues[p].length > 0) {
          const asset = this.assetQueues[p].shift();
          await this.loadAsset(asset);
        }
      }
    } finally {
      this.isLoading = false;
    }
    
    return Promise.resolve();
  }
  
  /**
   * Load a single asset
   * @param {Object} assetDescriptor - Description of the asset to load
   * @returns {Promise} Promise that resolves when asset is loaded
   */
  async loadAsset(assetDescriptor) {
    const { type, name, path, options } = assetDescriptor;
    
    switch (type) {
      case 'texture':
        return this.loadTexture(name, path, options);
      case 'model':
        return this.loadModel(name, path, options);
      case 'sound':
        return this.loadSound(name, path, options);
      default:
        console.warn(`Unknown asset type: ${type}`);
        return Promise.resolve();
    }
  }
  
  /**
   * Load a texture asset
   * @param {string} name - Asset name
   * @param {string} path - Asset path or data URL
   * @param {Object} options - Loading options
   * @returns {Promise<THREE.Texture>} The loaded texture
   */
  async loadTexture(name, path, options = {}) {
    // Check if already loaded
    if (this.assets.textures.has(name)) {
      this.touchAsset(name);
      return this.assets.textures.get(name).texture;
    }
    
    // Use assetLoader to create or load the texture
    const texture = await this.assetLoader.getTexture(name);
    
    // Apply texture options
    if (texture) {
      if (options.filter) {
        texture.minFilter = options.filter;
        texture.magFilter = options.filter;
      }
      
      if (options.wrap) {
        texture.wrapS = options.wrap;
        texture.wrapT = options.wrap;
      }
      
      // Apply anisotropy if available
      if (this.game && this.game.renderer) {
        const maxAnisotropy = this.game.renderer.capabilities.getMaxAnisotropy();
        texture.anisotropy = options.anisotropy || maxAnisotropy;
      }
      
      texture.needsUpdate = true;
    }
    
    // Store the texture in our assets map
    this.assets.textures.set(name, {
      texture,
      options,
      lastUsed: Date.now(),
      priority: options.priority || 'medium'
    });
    
    // Track memory usage
    this.updateTextureMemoryUsage(texture);
    
    // Touch the asset to mark it as used
    this.touchAsset(name);
    
    return texture;
  }
  
  /**
   * Load a 3D model asset
   * @param {string} name - Asset name
   * @param {string} path - Asset path
   * @param {Object} options - Loading options
   * @returns {Promise<Object>} The loaded model
   */
  async loadModel(name, path, options = {}) {
    // Not implemented yet - for future use
    return Promise.resolve(null);
  }
  
  /**
   * Load a sound asset
   * @param {string} name - Asset name
   * @param {string} path - Asset path
   * @param {Object} options - Loading options
   * @returns {Promise<AudioBuffer>} The loaded sound
   */
  async loadSound(name, path, options = {}) {
    // Not implemented yet - for future use
    return Promise.resolve(null);
  }
  
  /**
   * Mark an asset as being used
   * @param {string} name - Asset name
   */
  touchAsset(name) {
    // Update last used timestamp
    for (const type of Object.keys(this.assets)) {
      if (this.assets[type].has(name)) {
        const asset = this.assets[type].get(name);
        asset.lastUsed = Date.now();
        
        // Track usage
        if (!this.assetUsage.has(name)) {
          this.assetUsage.set(name, 0);
        }
        this.assetUsage.set(name, this.assetUsage.get(name) + 1);
      }
    }
  }
  
  /**
   * Calculate texture memory usage
   * @param {THREE.Texture} texture - The texture to measure
   */
  updateTextureMemoryUsage(texture) {
    if (!texture || !texture.image) return;
    
    const width = texture.image.width;
    const height = texture.image.height;
    
    // Calculate memory in bytes (4 bytes per pixel for RGBA)
    const memory = width * height * 4;
    
    // Add to total texture memory
    this.memoryUsage.textures += memory / (1024 * 1024); // Convert to MB
    this.memoryUsage.total += memory / (1024 * 1024); // Convert to MB
  }
  
  /**
   * Unload textures that haven't been used recently
   */
  unloadUnusedTextures() {
    const now = Date.now();
    let unloadCount = 0;
    
    for (const [name, metadata] of this.assets.textures) {
      // Skip high priority textures
      if (metadata.priority === 'high') continue;
      
      // Check if texture hasn't been used for a while
      if (now - metadata.lastUsed > this.config.textureUnloadTime * 1000) {
        // Dispose the texture to free memory
        if (metadata.texture && metadata.texture.dispose) {
          metadata.texture.dispose();
          this.assets.textures.delete(name);
          unloadCount++;
          
          console.log(`Unloaded unused texture: ${name}`);
        }
      }
    }
    
    if (unloadCount > 0) {
      console.log(`Unloaded ${unloadCount} unused textures`);
    }
  }
  
  /**
   * Unload geometries that haven't been used recently
   */
  unloadUnusedGeometries() {
    const now = Date.now();
    let unloadCount = 0;
    
    for (const [name, metadata] of this.geometryCache) {
      // Check if this geometry is marked as persistent
      if (metadata.persistent) continue;
      
      // Check if geometry hasn't been used for a while
      if (now - metadata.lastUsed > this.config.textureUnloadTime * 1000) {
        // Dispose the geometry to free memory
        if (metadata.geometry && metadata.geometry.dispose) {
          metadata.geometry.dispose();
          this.geometryCache.delete(name);
          unloadCount++;
          
          console.log(`Unloaded unused geometry: ${name}`);
        }
      }
    }
    
    if (unloadCount > 0) {
      console.log(`Unloaded ${unloadCount} unused geometries`);
    }
  }
  
  /**
   * Create an optimized shared material with the given parameters
   * @param {Object} params - Material parameters
   * @returns {THREE.Material} The created or cached material
   */
  getSharedMaterial(params) {
    // Create a hash key from the parameters
    const key = JSON.stringify(params);
    
    // Check if we already have this material
    if (this.materialInstances.has(key)) {
      return this.materialInstances.get(key);
    }
    
    // Create the material
    let material;
    
    if (params.type === 'basic') {
      material = new THREE.MeshBasicMaterial(params);
    } else if (params.type === 'phong') {
      material = new THREE.MeshPhongMaterial(params);
    } else if (params.type === 'standard') {
      material = new THREE.MeshStandardMaterial(params);
    } else if (params.type === 'physical') {
      material = new THREE.MeshPhysicalMaterial(params);
    } else {
      material = new THREE.MeshStandardMaterial(params);
    }
    
    // Cache the material
    this.materialInstances.set(key, material);
    
    return material;
  }
  
  /**
   * Create a geometry with built-in optimization
   * @param {Function} createFn - Function that creates the geometry
   * @param {string} key - Cache key
   * @returns {THREE.BufferGeometry} The created or cached geometry
   */
  getOptimizedGeometry(createFn, key) {
    // Check if we already have this geometry
    if (this.geometryCache.has(key)) {
      // Update last used time
      this.geometryCache.get(key).lastUsed = Date.now();
      return this.geometryCache.get(key).geometry;
    }
    
    // Create the geometry
    const geometry = createFn();
    
    if (this.config.enableGeometryOptimization) {
      // Optimize the geometry
      if (geometry.attributes.position && !geometry.attributes.normal) {
        geometry.computeVertexNormals();
      }
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
    }
    
    // Cache the geometry
    this.geometryCache.set(key, {
      geometry,
      lastUsed: Date.now(),
      persistent: false
    });
    
    return geometry;
  }
  
  /**
   * Preload assets needed for a specific game scene
   * @param {string} sceneName - Name of the scene
   * @returns {Promise} Promise that resolves when preloading is complete
   */
  async preloadScene(sceneName) {
    console.log(`Preloading assets for scene: ${sceneName}`);
    
    let assets = [];
    
    // Determine which assets to preload based on scene name
    switch (sceneName) {
      case 'city':
        assets = [
          { type: 'texture', name: 'buildingWall', priority: 'high' },
          { type: 'texture', name: 'buildingGlass', priority: 'high' },
          { type: 'texture', name: 'road', priority: 'high' },
          { type: 'texture', name: 'sidewalk', priority: 'high' },
          { type: 'texture', name: 'zombie', priority: 'high' },
          { type: 'texture', name: 'weapon', priority: 'high' },
          { type: 'texture', name: 'muzzleFlash', priority: 'high' }
        ];
        break;
      case 'menu':
        assets = [
          { type: 'texture', name: 'menuBackground', priority: 'high' },
          { type: 'texture', name: 'button', priority: 'high' }
        ];
        break;
      default:
        console.warn(`No preload configuration for scene: ${sceneName}`);
        return Promise.resolve();
    }
    
    // Request assets with high priority
    return this.requestAssets(assets, 'high');
  }
  
  /**
   * Apply texture compression to reduce memory usage
   * @param {THREE.Texture} texture - The texture to compress
   * @param {Object} options - Compression options
   * @returns {THREE.Texture} The compressed texture
   */
  compressTexture(texture, options = {}) {
    const {
      maxSize = this.config.maxTextureSize,
      quality = 'medium', // 'low', 'medium', 'high'
      priority = 'medium' // 'low', 'medium', 'high'
    } = options;
    
    // Skip compression for high priority textures if quality is high
    if (priority === 'high' && quality === 'high') {
      return texture;
    }
    
    // If texture has no image, return as is
    if (!texture || !texture.image) {
      return texture;
    }
    
    // Check if texture needs resizing
    const originalWidth = texture.image.width;
    const originalHeight = texture.image.height;
    
    // Determine target size based on quality and priority
    let targetSize = maxSize;
    if (quality === 'low') {
      targetSize = priority === 'high' ? 512 : 256;
    } else if (quality === 'medium') {
      targetSize = priority === 'high' ? 1024 : 512;
    }
    
    // Check if texture needs resizing
    if (originalWidth <= targetSize && originalHeight <= targetSize) {
      return texture; // No need to resize
    }
    
    console.log(`Compressing texture: ${originalWidth}x${originalHeight} -> max ${targetSize}px`);
    
    // Calculate new dimensions, maintaining aspect ratio
    let newWidth, newHeight;
    if (originalWidth > originalHeight) {
      newWidth = targetSize;
      newHeight = Math.floor(originalHeight * (targetSize / originalWidth));
    } else {
      newHeight = targetSize;
      newWidth = Math.floor(originalWidth * (targetSize / originalHeight));
    }
    
    // Create a canvas for resizing
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw the original texture to the canvas, resizing it
    ctx.drawImage(texture.image, 0, 0, newWidth, newHeight);
    
    // Create a new texture from the resized image
    const compressedTexture = new THREE.CanvasTexture(canvas);
    
    // Copy properties from original texture
    compressedTexture.wrapS = texture.wrapS;
    compressedTexture.wrapT = texture.wrapT;
    compressedTexture.magFilter = texture.magFilter;
    compressedTexture.minFilter = texture.minFilter;
    compressedTexture.encoding = texture.encoding;
    compressedTexture.colorSpace = texture.colorSpace;
    
    // Update memory usage estimate
    const oldMemory = originalWidth * originalHeight * 4;
    const newMemory = newWidth * newHeight * 4;
    const saved = (oldMemory - newMemory) / (1024 * 1024);
    
    console.log(`Texture compressed: saved ~${saved.toFixed(2)}MB of memory`);
    
    return compressedTexture;
  }
  
  /**
   * Apply compression to all textures based on quality settings
   * @param {string} quality - Quality level ('low', 'medium', 'high')
   */
  compressAllTextures(quality = 'medium') {
    console.log(`Compressing all textures with quality: ${quality}...`);
    
    let totalSaved = 0;
    let compressedCount = 0;
    
    // Compress textures in the asset loader
    if (this.assetLoader && this.assetLoader.textures) {
      for (const textureName in this.assetLoader.textures) {
        const texture = this.assetLoader.textures[textureName];
        
        // Skip already compressed textures
        if (texture.isCompressed) continue;
        
        // Determine priority based on texture name
        let priority = 'medium';
        
        // Essential game textures get high priority
        if (textureName.includes('weapon') || 
            textureName.includes('zombie') || 
            textureName.includes('player') ||
            textureName.includes('ui')) {
          priority = 'high';
        }
        
        // Less important textures get low priority
        if (textureName.includes('debris') || 
            textureName.includes('background') ||
            textureName.includes('detail')) {
          priority = 'low';
        }
        
        // Compress the texture
        const originalMemory = texture.image ? texture.image.width * texture.image.height * 4 : 0;
        
        const compressedTexture = this.compressTexture(texture, { 
          quality, 
          priority 
        });
        
        // If texture was actually compressed
        if (compressedTexture !== texture) {
          // Calculate memory saved
          const newMemory = compressedTexture.image ? 
            compressedTexture.image.width * compressedTexture.image.height * 4 : 0;
          
          const saved = (originalMemory - newMemory) / (1024 * 1024);
          totalSaved += saved;
          compressedCount++;
          
          // Replace the texture
          this.assetLoader.textures[textureName] = compressedTexture;
          compressedTexture.isCompressed = true;
        }
      }
    }
    
    console.log(`Texture compression complete: compressed ${compressedCount} textures, saved ~${totalSaved.toFixed(2)}MB of memory`);
    
    // Update memory usage
    this.updateMemoryUsage();
  }
  
  /**
   * Apply quality settings to all textures
   * @param {string} quality - Quality level ('low', 'medium', 'high')
   */
  applyQualitySettings(quality) {
    this.config.forceLowQualityTextures = quality === 'low';
    
    // Compress textures based on quality level
    this.compressAllTextures(quality);
    
    // Apply filtering settings to all textures
    const filtering = this.getFilteringByQuality(quality);
    
    // Apply to all textures
    for (const [name, metadata] of this.assets.textures) {
      if (metadata.texture) {
        metadata.texture.minFilter = filtering.minFilter;
        metadata.texture.magFilter = filtering.magFilter;
        metadata.texture.needsUpdate = true;
      }
    }
    
    // Apply to all textures in the asset loader
    if (this.assetLoader && this.assetLoader.textures) {
      for (const textureName in this.assetLoader.textures) {
        const texture = this.assetLoader.textures[textureName];
        texture.minFilter = filtering.minFilter;
        texture.magFilter = filtering.magFilter;
        texture.needsUpdate = true;
      }
    }
    
    console.log(`Applied ${quality} quality settings to textures`);
  }
  
  /**
   * Get texture filtering based on quality level
   * @param {string} quality - Quality level ('low', 'medium', 'high')
   * @returns {Object} Filtering settings
   */
  getFilteringByQuality(quality) {
    switch (quality) {
      case 'low':
        return {
          minFilter: THREE.NearestFilter,
          magFilter: THREE.NearestFilter
        };
      case 'medium':
        return {
          minFilter: THREE.LinearMipmapNearestFilter,
          magFilter: THREE.LinearFilter
        };
      case 'high':
        return {
          minFilter: THREE.LinearMipmapLinearFilter,
          magFilter: THREE.LinearFilter
        };
      default:
        return {
          minFilter: THREE.LinearMipmapNearestFilter,
          magFilter: THREE.LinearFilter
        };
    }
  }
  
  /**
   * Clean up and dispose all assets
   */
  dispose() {
    console.log('Disposing all asset manager resources...');
    
    // Dispose textures
    for (const [name, metadata] of this.assets.textures) {
      if (metadata.texture && metadata.texture.dispose) {
        metadata.texture.dispose();
      }
    }
    this.assets.textures.clear();
    
    // Dispose geometries
    for (const [name, metadata] of this.geometryCache) {
      if (metadata.geometry && metadata.geometry.dispose) {
        metadata.geometry.dispose();
      }
    }
    this.geometryCache.clear();
    
    // Dispose materials
    for (const [key, material] of this.materialInstances) {
      if (material && material.dispose) {
        material.dispose();
      }
    }
    this.materialInstances.clear();
    
    // Clear atlas textures
    for (const [name, atlas] of this.textureAtlases) {
      if (atlas.texture && atlas.texture.dispose) {
        atlas.texture.dispose();
      }
    }
    this.textureAtlases.clear();
    
    // Clear asset queues
    this.assetQueues.high = [];
    this.assetQueues.medium = [];
    this.assetQueues.low = [];
    
    console.log('All asset manager resources disposed');
  }
} 