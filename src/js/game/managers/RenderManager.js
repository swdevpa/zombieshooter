import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

/**
 * Manages the render pipeline, optimizations, and post-processing effects
 */
export class RenderManager {
  /**
   * Creates a new RenderManager
   * @param {Game} game - The game instance
   */
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.camera = game.camera;
    this.renderer = game.renderer;
    
    // Initialize properties
    this.composer = null;
    this.renderPass = null;
    this.effectPasses = {};
    
    // Performance metrics
    this.metrics = {
      drawCalls: 0,
      triangles: 0,
      frameTimes: {
        total: 0,
        scene: 0,
        culling: 0,
        postProcessing: 0,
      },
      resolution: {
        current: new THREE.Vector2(1, 1),
        target: new THREE.Vector2(1, 1),
        scaling: 1.0
      }
    };
    
    // Render settings
    this.settings = {
      postProcessingEnabled: true,
      dynamicResolutionEnabled: false,
      targetFrameTime: 16.67, // 60 FPS
      minResolutionScale: 0.5,
      maxResolutionScale: 1.0,
      adaptationRate: 0.1,
      renderQueueSorting: true,
      transparentSort: true,
      batchingEnabled: true,
      debugModeEnabled: false
    };
    
    // Performance markers for timing render stages
    this.perfMarkers = {
      frameStart: 0,
      cullingStart: 0,
      cullingEnd: 0,
      renderStart: 0,
      renderEnd: 0,
      postProcessStart: 0,
      postProcessEnd: 0,
      frameEnd: 0
    };
    
    // Initialize debug helpers
    this.debugHelpers = {
      stats: null,
      drawCallVisualizer: null,
      renderOrderHelper: null
    };
    
    // Objects with shared materials for batching
    this.batchGroups = {
      buildings: [],
      zombies: [],
      environment: [],
      effects: []
    };
    
    // Rendering order for transparent objects
    this.transparentObjects = [];
    
    // Create renderer overlay for debug info
    this.debugOverlay = this.createDebugOverlay();
  }
  
  /**
   * Initialize the render pipeline
   */
  init() {
    // Set up post-processing pipeline
    this.initPostProcessing();
    
    // Set up debug visualization if needed
    if (this.settings.debugModeEnabled) {
      this.initDebugTools();
    }
    
    console.log('[RenderManager] Initialized with settings:', this.settings);
    
    // Register event handlers
    window.addEventListener('resize', () => this.onResize());
  }
  
  /**
   * Initialize post-processing effects
   */
  initPostProcessing() {
    // Create effect composer
    this.composer = new EffectComposer(this.renderer);
    
    // Create render pass
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    
    // Create FXAA pass (anti-aliasing)
    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.uniforms['resolution'].value.set(
      1 / (window.innerWidth * this.renderer.getPixelRatio()),
      1 / (window.innerHeight * this.renderer.getPixelRatio())
    );
    fxaaPass.renderToScreen = true;
    this.effectPasses.fxaa = fxaaPass;
    this.composer.addPass(fxaaPass);
    
    // Create bloom pass for glow effects
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5,  // strength
      0.4,  // radius
      0.85  // threshold
    );
    this.effectPasses.bloom = bloomPass;
    this.composer.addPass(bloomPass);
    
    // Apply quality preset
    this.applyQualityPreset(this.game.settings.qualityLevel);
  }
  
  /**
   * Create a debug overlay for render info
   * @returns {HTMLElement} The debug overlay element
   */
  createDebugOverlay() {
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '80px';
    overlay.style.right = '10px';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.color = 'white';
    overlay.style.padding = '10px';
    overlay.style.fontFamily = 'monospace';
    overlay.style.fontSize = '12px';
    overlay.style.zIndex = '1000';
    overlay.style.pointerEvents = 'none';
    overlay.style.display = this.settings.debugModeEnabled ? 'block' : 'none';
    
    overlay.innerHTML = `
      <div>Render Stats</div>
      <div>Draw Calls: <span id="rm-draw-calls">0</span></div>
      <div>Triangles: <span id="rm-triangles">0</span></div>
      <div>Resolution Scale: <span id="rm-resolution-scale">100%</span></div>
      <div>Frame Time:</div>
      <div>- Total: <span id="rm-frametime-total">0</span>ms</div>
      <div>- Scene: <span id="rm-frametime-scene">0</span>ms</div>
      <div>- Culling: <span id="rm-frametime-culling">0</span>ms</div>
      <div>- Post-Processing: <span id="rm-frametime-post">0</span>ms</div>
    `;
    
    document.body.appendChild(overlay);
    return overlay;
  }
  
  /**
   * Initialize debug visualization tools
   */
  initDebugTools() {
    console.log('[RenderManager] Debug mode enabled');
  }
  
  /**
   * Handle window resize events
   */
  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Update composer
    if (this.composer) {
      this.composer.setSize(width, height);
      
      // Update FXAA resolution
      if (this.effectPasses.fxaa) {
        this.effectPasses.fxaa.uniforms['resolution'].value.set(
          1 / (width * this.renderer.getPixelRatio()),
          1 / (height * this.renderer.getPixelRatio())
        );
      }
    }
  }
  
  /**
   * Sort objects for optimal rendering
   * @param {boolean} forceSort - Whether to force sort all objects
   */
  sortRenderQueue(forceSort = false) {
    if (!this.settings.renderQueueSorting && !forceSort) return;
    
    // Sort opaque objects front-to-back
    this.scene.children.forEach(child => {
      if (child.isMesh && !child.material.transparent) {
        child.renderOrder = child.position.distanceTo(this.camera.position);
      }
    });
    
    // Update transparent objects list if needed
    if (forceSort || this.transparentObjects.length === 0) {
      this.transparentObjects = [];
      this.scene.traverse(object => {
        if (object.isMesh && object.material && object.material.transparent) {
          this.transparentObjects.push(object);
        }
      });
    }
    
    // Sort transparent objects back-to-front
    if (this.settings.transparentSort) {
      const cameraPosition = this.camera.position;
      this.transparentObjects.sort((a, b) => {
        return b.position.distanceTo(cameraPosition) - a.position.distanceTo(cameraPosition);
      });
      
      // Set render order
      this.transparentObjects.forEach((object, index) => {
        object.renderOrder = 1000 + index; // Start after opaque objects
      });
    }
  }
  
  /**
   * Update dynamic resolution scaling based on frame time
   * @param {number} deltaTime - Time since last frame in seconds
   */
  updateDynamicResolution(deltaTime) {
    if (!this.settings.dynamicResolutionEnabled) return;
    
    // Get current frame time in ms
    const frameTime = deltaTime * 1000;
    
    // Calculate target resolution scale
    if (frameTime > this.settings.targetFrameTime * 1.1) {
      // Frame time too high, reduce resolution
      this.metrics.resolution.target.set(
        Math.max(this.metrics.resolution.scaling - this.settings.adaptationRate, this.settings.minResolutionScale),
        Math.max(this.metrics.resolution.scaling - this.settings.adaptationRate, this.settings.minResolutionScale)
      );
    } else if (frameTime < this.settings.targetFrameTime * 0.8) {
      // Frame time good, increase resolution if possible
      this.metrics.resolution.target.set(
        Math.min(this.metrics.resolution.scaling + this.settings.adaptationRate * 0.5, this.settings.maxResolutionScale),
        Math.min(this.metrics.resolution.scaling + this.settings.adaptationRate * 0.5, this.settings.maxResolutionScale)
      );
    }
    
    // Smooth transition to target
    this.metrics.resolution.scaling = THREE.MathUtils.lerp(
      this.metrics.resolution.scaling,
      this.metrics.resolution.target.x,
      0.05
    );
    
    // Apply resolution scale
    if (Math.abs(this.metrics.resolution.current.x - this.metrics.resolution.scaling) > 0.01) {
      this.metrics.resolution.current.set(this.metrics.resolution.scaling, this.metrics.resolution.scaling);
      
      // Update renderer and composer
      const pixelRatio = this.renderer.getPixelRatio();
      const renderWidth = Math.floor(window.innerWidth * this.metrics.resolution.current.x);
      const renderHeight = Math.floor(window.innerHeight * this.metrics.resolution.current.y);
      
      this.renderer.setSize(renderWidth, renderHeight, false);
      if (this.composer) {
        this.composer.setSize(renderWidth, renderHeight);
      }
      
      // Update debug overlay
      const scaleElement = document.getElementById('rm-resolution-scale');
      if (scaleElement) {
        scaleElement.textContent = `${Math.round(this.metrics.resolution.current.x * 100)}%`;
      }
    }
  }
  
  /**
   * Apply quality preset settings
   * @param {string} qualityLevel - Quality level ('low', 'medium', 'high', 'ultra')
   */
  applyQualityPreset(qualityLevel) {
    switch (qualityLevel) {
      case 'low':
        this.settings.postProcessingEnabled = false;
        this.settings.dynamicResolutionEnabled = true;
        this.settings.minResolutionScale = 0.5;
        this.settings.maxResolutionScale = 0.75;
        this.settings.renderQueueSorting = false;
        break;
        
      case 'medium':
        this.settings.postProcessingEnabled = true;
        this.settings.dynamicResolutionEnabled = true;
        this.settings.minResolutionScale = 0.65;
        this.settings.maxResolutionScale = 0.9;
        this.settings.renderQueueSorting = true;
        
        // Reduce bloom intensity
        if (this.effectPasses.bloom) {
          this.effectPasses.bloom.strength = 0.3;
          this.effectPasses.bloom.radius = 0.3;
        }
        break;
        
      case 'high':
        this.settings.postProcessingEnabled = true;
        this.settings.dynamicResolutionEnabled = true;
        this.settings.minResolutionScale = 0.8;
        this.settings.maxResolutionScale = 1.0;
        this.settings.renderQueueSorting = true;
        
        // Standard bloom
        if (this.effectPasses.bloom) {
          this.effectPasses.bloom.strength = 0.5;
          this.effectPasses.bloom.radius = 0.4;
        }
        break;
        
      case 'ultra':
        this.settings.postProcessingEnabled = true;
        this.settings.dynamicResolutionEnabled = false;
        this.settings.minResolutionScale = 1.0;
        this.settings.maxResolutionScale = 1.0;
        this.settings.renderQueueSorting = true;
        
        // Enhanced bloom
        if (this.effectPasses.bloom) {
          this.effectPasses.bloom.strength = 0.7;
          this.effectPasses.bloom.radius = 0.5;
        }
        break;
    }
    
    // Apply post-processing settings
    this.updatePostProcessingState();
    
    console.log(`[RenderManager] Applied quality preset: ${qualityLevel}`);
  }
  
  /**
   * Enable or disable post-processing effects
   */
  updatePostProcessingState() {
    if (this.effectPasses.bloom) {
      this.effectPasses.bloom.enabled = this.settings.postProcessingEnabled;
    }
    
    if (this.effectPasses.fxaa) {
      this.effectPasses.fxaa.enabled = this.settings.postProcessingEnabled;
    }
  }
  
  /**
   * Update render statistics and debug information
   */
  updateMetrics() {
    // Get information from renderer
    const info = this.renderer.info;
    this.metrics.drawCalls = info.render.calls;
    this.metrics.triangles = info.render.triangles;
    
    // Calculate frame times
    this.metrics.frameTimes.total = this.perfMarkers.frameEnd - this.perfMarkers.frameStart;
    this.metrics.frameTimes.culling = this.perfMarkers.cullingEnd - this.perfMarkers.cullingStart;
    this.metrics.frameTimes.scene = this.perfMarkers.renderEnd - this.perfMarkers.renderStart;
    this.metrics.frameTimes.postProcessing = 
      this.settings.postProcessingEnabled ? this.perfMarkers.postProcessEnd - this.perfMarkers.postProcessStart : 0;
    
    // Update debug overlay if enabled
    if (this.settings.debugModeEnabled) {
      this.updateDebugOverlay();
    }
  }
  
  /**
   * Update the debug overlay with current metrics
   */
  updateDebugOverlay() {
    // Only update if debug mode is enabled
    if (!this.settings.debugModeEnabled) return;
    
    const drawCallsEl = document.getElementById('rm-draw-calls');
    const trianglesEl = document.getElementById('rm-triangles');
    const frametimeTotalEl = document.getElementById('rm-frametime-total');
    const frametimeSceneEl = document.getElementById('rm-frametime-scene');
    const frametimeCullingEl = document.getElementById('rm-frametime-culling');
    const frametimePostEl = document.getElementById('rm-frametime-post');
    
    if (drawCallsEl) drawCallsEl.textContent = this.metrics.drawCalls;
    if (trianglesEl) trianglesEl.textContent = this.metrics.triangles.toLocaleString();
    if (frametimeTotalEl) frametimeTotalEl.textContent = this.metrics.frameTimes.total.toFixed(2);
    if (frametimeSceneEl) frametimeSceneEl.textContent = this.metrics.frameTimes.scene.toFixed(2);
    if (frametimeCullingEl) frametimeCullingEl.textContent = this.metrics.frameTimes.culling.toFixed(2);
    if (frametimePostEl) frametimePostEl.textContent = this.metrics.frameTimes.postProcessing.toFixed(2);
  }
  
  /**
   * Set debug mode state
   * @param {boolean} enabled - Whether debug mode should be enabled
   */
  setDebugMode(enabled) {
    this.settings.debugModeEnabled = enabled;
    
    // Update debug overlay visibility
    if (this.debugOverlay) {
      this.debugOverlay.style.display = enabled ? 'block' : 'none';
    }
    
    // Initialize or destroy debug tools
    if (enabled && !this.debugHelpers.stats) {
      this.initDebugTools();
    }
    
    console.log(`[RenderManager] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Toggle debug mode
   */
  toggleDebugMode() {
    this.setDebugMode(!this.settings.debugModeEnabled);
  }
  
  /**
   * Render the scene - called from the game loop
   * @param {number} deltaTime - Time since last frame in seconds
   */
  render(deltaTime) {
    // Start frame timing
    this.perfMarkers.frameStart = performance.now();
    
    // Skip dynamic resolution updates if game isn't running properly
    if (this.game.running) {
      // Update render settings based on performance
      this.updateDynamicResolution(deltaTime);
      
      // Sort render queue for optimal performance
      this.sortRenderQueue();
    }
    
    // Mark culling start
    this.perfMarkers.cullingStart = performance.now();
    
    // Perform culling if enabled
    if (this.game.cullingManager && this.game.settings.cullingEnabled) {
      this.game.cullingManager.update(deltaTime);
    }
    
    // Mark culling end
    this.perfMarkers.cullingEnd = performance.now();
    
    // Reset renderer info for new frame
    this.renderer.info.reset();
    
    // Mark render start
    this.perfMarkers.renderStart = performance.now();
    
    try {
      // Verify that the scene and camera are valid
      if (!this.scene || !this.camera) {
        console.error('[RenderManager] Cannot render: missing scene or camera');
        return;
      }
      
      // Render scene with or without post-processing
      if (this.settings.postProcessingEnabled && this.composer) {
        // Mark post-processing start
        this.perfMarkers.postProcessStart = performance.now();
        
        // Render with post-processing
        this.composer.render(deltaTime);
        
        // Mark post-processing end
        this.perfMarkers.postProcessEnd = performance.now();
      } else {
        // Render without post-processing
        this.renderer.render(this.scene, this.camera);
        
        // No post-processing used
        this.perfMarkers.postProcessStart = this.perfMarkers.renderStart;
        this.perfMarkers.postProcessEnd = this.perfMarkers.postProcessStart;
      }
      
      // Mark render end
      this.perfMarkers.renderEnd = performance.now();
    } catch (error) {
      console.error('[RenderManager] Error during rendering:', error);
      
      // Try a direct render as fallback
      try {
        this.renderer.render(this.scene, this.camera);
      } catch (fallbackError) {
        console.error('[RenderManager] Critical render error:', fallbackError);
      }
    }
    
    // Mark frame end
    this.perfMarkers.frameEnd = performance.now();
    
    // Update metrics after rendering
    this.updateMetrics();
  }
  
  /**
   * Dispose of resources used by the RenderManager
   */
  dispose() {
    // Clean up post-processing
    if (this.composer) {
      this.composer.passes.forEach(pass => {
        if (pass.dispose) pass.dispose();
      });
    }
    
    // Remove debug overlay
    if (this.debugOverlay && this.debugOverlay.parentNode) {
      this.debugOverlay.parentNode.removeChild(this.debugOverlay);
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.onResize);
    
    console.log('[RenderManager] Resources disposed');
  }
} 