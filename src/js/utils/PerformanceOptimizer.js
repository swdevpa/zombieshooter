import * as THREE from 'three';

/**
 * Manages performance optimization throughout the game
 * Automatically adjusts settings based on device capabilities and runtime performance
 */
export class PerformanceOptimizer {
  /**
   * Create a new PerformanceOptimizer
   * @param {Game} game - Reference to the main game object
   */
  constructor(game) {
    this.game = game;
    
    // Store references to other managers for optimization
    this.renderManager = game.renderManager;
    this.cullingManager = game.cullingManager;
    this.lodManager = game.lodManager;
    this.assetManager = game.assetManager;
    this.performanceMonitor = game.performanceMonitor;
    
    // Configuration settings
    this.config = {
      enabled: true,
      autoOptimizeEnabled: true,
      benchmarkEnabled: false,
      optimizeInterval: 5000, // ms between optimization checks
      adaptationSpeed: 0.2,   // How quickly to adjust settings (0-1)
      targetFPS: 60,
      minAcceptableFPS: 30,
      memoryThreshold: 0.8,   // Percentage of memory usage that triggers optimization
      memoryCheckInterval: 30000 // ms between memory optimizations
    };
    
    // Performance metrics tracking
    this.metrics = {
      fpsHistory: [],
      frametimeHistory: [],
      memoryHistory: [],
      drawCallsHistory: [],
      lastOptimizeTime: 0,
      lastMemoryCheckTime: 0,
      benchmarkResults: null,
      bottlenecks: {
        cpu: false,
        gpu: false,
        memory: false
      }
    };
    
    // Define quality presets with weightings
    this.qualityParameters = {
      shadowResolution: { weight: 0.8, min: 512, max: 4096 },
      shadowDistance: { weight: 0.7, min: 20, max: 100 },
      textureQuality: { weight: 0.6, min: 0.25, max: 1.0 },
      drawDistance: { weight: 0.9, min: 50, max: 300 },
      lodDistance: { weight: 0.5, min: 5, max: 40 },
      maxParticles: { weight: 0.4, min: 50, max: 1000 },
      maxZombies: { weight: 0.7, min: 20, max: 100 }
    };
    
    // Current values of quality parameters
    this.currentQuality = {};
    
    // Initialize quality parameters to medium
    this.initializeQualityParameters();
    
    // Hardware detection results
    this.hardware = {
      detected: false,
      gpu: 'unknown',
      isMobile: this.detectMobile(),
      memory: this.detectMemory(),
      cores: this.detectCPUCores()
    };
    
    // Cache for optimization results
    this.optimizationCache = new Map();
    
    // Debug mode
    this.isDebugMode = false;
    
    // Create debug UI
    this.debugUI = this.createDebugUI();
    
    // Register for keyboard events
    this.registerKeyboardEvents();
    
    console.log('[PerformanceOptimizer] Initialized');
  }
  
  /**
   * Initialize quality parameters based on initial quality level
   */
  initializeQualityParameters() {
    // Set initial values based on current quality level
    const qualityLevel = this.game.settings.qualityLevel;
    const qualityScale = this.getQualityScale(qualityLevel);
    
    // Set each parameter based on quality scale (0-1)
    Object.keys(this.qualityParameters).forEach(param => {
      const min = this.qualityParameters[param].min;
      const max = this.qualityParameters[param].max;
      this.currentQuality[param] = min + (max - min) * qualityScale;
    });
  }
  
  /**
   * Get a quality scale (0-1) based on named quality level
   * @param {string} level - Quality level name
   * @returns {number} Scale factor from 0-1
   */
  getQualityScale(level) {
    switch(level) {
      case 'low': return 0.0;
      case 'medium': return 0.33;
      case 'high': return 0.67;
      case 'ultra': return 1.0;
      default: return 0.5;
    }
  }
  
  /**
   * Attempt to detect if running on mobile device
   * @returns {boolean} True if likely a mobile device
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  /**
   * Detect available memory if possible
   * @returns {number|null} Memory in MB or null if not detectable
   */
  detectMemory() {
    if (navigator.deviceMemory) {
      return navigator.deviceMemory * 1024; // Convert GB to MB
    }
    return null;
  }
  
  /**
   * Detect CPU cores if possible
   * @returns {number} Number of logical cores
   */
  detectCPUCores() {
    return navigator.hardwareConcurrency || 4; // Default to 4 if not available
  }
  
  /**
   * Create debug UI elements
   * @returns {HTMLElement} The debug UI container
   */
  createDebugUI() {
    const container = document.createElement('div');
    container.id = 'performance-optimizer-debug';
    container.style.position = 'absolute';
    container.style.bottom = '10px';
    container.style.left = '10px';
    container.style.padding = '10px';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    container.style.color = 'white';
    container.style.fontFamily = 'monospace';
    container.style.fontSize = '12px';
    container.style.borderRadius = '5px';
    container.style.zIndex = '1000';
    container.style.display = 'none';
    
    container.innerHTML = `
      <div>Performance Optimizer Debug</div>
      <div>Auto-optimize: <span id="auto-optimize-status">ON</span> (F9 to toggle)</div>
      <div>Detected bottleneck: <span id="bottleneck">None</span></div>
      <div>Last optimization: <span id="last-optimize">Never</span></div>
      <div>Hardware:</div>
      <div>- Mobile: <span id="is-mobile">Unknown</span></div>
      <div>- Memory: <span id="memory">Unknown</span></div>
      <div>- Cores: <span id="cores">Unknown</span></div>
      <div>Quality Parameters:</div>
      <div id="quality-params"></div>
      <div>
        <button id="run-benchmark" style="background: #333; color: white; border: 1px solid #555; padding: 2px 5px; margin-top: 5px; cursor: pointer;">Run Benchmark</button>
        <button id="force-optimize" style="background: #333; color: white; border: 1px solid #555; padding: 2px 5px; margin-top: 5px; cursor: pointer;">Force Optimize</button>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // Add event listeners
    const benchmarkButton = document.getElementById('run-benchmark');
    if (benchmarkButton) {
      benchmarkButton.addEventListener('click', () => this.runBenchmark());
    }
    
    const optimizeButton = document.getElementById('force-optimize');
    if (optimizeButton) {
      optimizeButton.addEventListener('click', () => this.optimize(true));
    }
    
    return container;
  }
  
  /**
   * Register keyboard event listeners
   */
  registerKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
      // Toggle debug UI with F9
      if (event.key === 'F9') {
        this.toggleDebugMode();
      }
      
      // Toggle auto-optimization with F10
      if (event.key === 'F10') {
        this.toggleAutoOptimize();
      }
    });
  }
  
  /**
   * Toggle debug mode on/off
   */
  toggleDebugMode() {
    this.isDebugMode = !this.isDebugMode;
    this.debugUI.style.display = this.isDebugMode ? 'block' : 'none';
    console.log(`[PerformanceOptimizer] Debug mode ${this.isDebugMode ? 'enabled' : 'disabled'}`);
    
    if (this.isDebugMode) {
      this.updateDebugUI();
    }
  }
  
  /**
   * Toggle auto-optimization on/off
   */
  toggleAutoOptimize() {
    this.config.autoOptimizeEnabled = !this.config.autoOptimizeEnabled;
    console.log(`[PerformanceOptimizer] Auto-optimization ${this.config.autoOptimizeEnabled ? 'enabled' : 'disabled'}`);
    
    const statusEl = document.getElementById('auto-optimize-status');
    if (statusEl) {
      statusEl.textContent = this.config.autoOptimizeEnabled ? 'ON' : 'OFF';
    }
  }
  
  /**
   * Update the debug UI with current information
   */
  updateDebugUI() {
    if (!this.isDebugMode) return;
    
    // Update bottleneck info
    const bottleneckEl = document.getElementById('bottleneck');
    if (bottleneckEl) {
      let bottleneckText = 'None';
      if (this.metrics.bottlenecks.cpu) bottleneckText = 'CPU';
      if (this.metrics.bottlenecks.gpu) bottleneckText = 'GPU';
      if (this.metrics.bottlenecks.memory) bottleneckText = 'Memory';
      bottleneckEl.textContent = bottleneckText;
    }
    
    // Update hardware info
    const isMobileEl = document.getElementById('is-mobile');
    if (isMobileEl) {
      isMobileEl.textContent = this.hardware.isMobile ? 'Yes' : 'No';
    }
    
    const memoryEl = document.getElementById('memory');
    if (memoryEl) {
      memoryEl.textContent = this.hardware.memory ? `${this.hardware.memory} MB` : 'Unknown';
    }
    
    const coresEl = document.getElementById('cores');
    if (coresEl) {
      coresEl.textContent = this.hardware.cores;
    }
    
    // Update last optimize time
    const lastOptimizeEl = document.getElementById('last-optimize');
    if (lastOptimizeEl) {
      if (this.metrics.lastOptimizeTime > 0) {
        const seconds = Math.round((Date.now() - this.metrics.lastOptimizeTime) / 1000);
        lastOptimizeEl.textContent = `${seconds}s ago`;
      } else {
        lastOptimizeEl.textContent = 'Never';
      }
    }
    
    // Update quality parameters
    const qualityParamsEl = document.getElementById('quality-params');
    if (qualityParamsEl) {
      let html = '';
      Object.keys(this.currentQuality).forEach(param => {
        let value = this.currentQuality[param];
        // Format value nicely
        if (value >= 100) {
          value = Math.round(value);
        } else {
          value = Math.round(value * 100) / 100;
        }
        html += `<div>- ${param}: ${value}</div>`;
      });
      qualityParamsEl.innerHTML = html;
    }
  }
  
  /**
   * Run a full benchmark to determine optimal settings
   */
  async runBenchmark() {
    if (this.config.benchmarkEnabled) {
      console.log('[PerformanceOptimizer] Benchmark already running');
      return;
    }
    
    console.log('[PerformanceOptimizer] Starting benchmark');
    this.config.benchmarkEnabled = true;
    
    // Show benchmark UI
    // TODO: Create a nicer benchmark UI
    alert('Benchmark starting. This will take a few seconds.');
    
    // Reset metrics
    this.metrics.fpsHistory = [];
    this.metrics.frametimeHistory = [];
    this.metrics.drawCallsHistory = [];
    
    // Store original quality settings to restore later
    const originalQuality = this.game.settings.qualityLevel;
    
    // Run tests at different quality levels
    const results = {};
    const qualities = ['low', 'medium', 'high', 'ultra'];
    
    for (const quality of qualities) {
      // Set quality level
      this.game.settings.qualityLevel = quality;
      this.game.applyQualitySettings();
      
      // Wait for things to stabilize
      await this.wait(1000);
      
      // Reset metrics again to clear transition data
      this.metrics.fpsHistory = [];
      this.metrics.frametimeHistory = [];
      
      // Collect data for a few seconds
      await this.wait(3000);
      
      // Calculate average FPS and frametime
      const avgFPS = this.calculateAverageValue(this.metrics.fpsHistory);
      const avgFrametime = this.calculateAverageValue(this.metrics.frametimeHistory);
      
      // Store results
      results[quality] = {
        fps: avgFPS,
        frametime: avgFrametime
      };
      
      console.log(`[Benchmark] ${quality}: ${avgFPS.toFixed(1)} FPS, ${avgFrametime.toFixed(2)}ms`);
    }
    
    // Analyze results to find optimal quality
    const optimalQuality = this.determineOptimalQuality(results);
    
    // Restore original quality
    this.game.settings.qualityLevel = originalQuality;
    this.game.applyQualitySettings();
    
    // Recommend optimal quality
    console.log(`[Benchmark] Optimal quality level: ${optimalQuality}`);
    
    // Ask user if they want to apply the recommended settings
    if (confirm(`Benchmark complete. Recommended quality: ${optimalQuality}. Apply these settings?`)) {
      this.game.settings.qualityLevel = optimalQuality;
      this.game.applyQualitySettings();
      // Initialize quality parameters based on new setting
      this.initializeQualityParameters();
    }
    
    // Store benchmark results
    this.metrics.benchmarkResults = {
      results,
      optimalQuality,
      timestamp: Date.now()
    };
    
    this.config.benchmarkEnabled = false;
  }
  
  /**
   * Determine optimal quality level from benchmark results
   * @param {Object} results - Benchmark results
   * @returns {string} Optimal quality level
   */
  determineOptimalQuality(results) {
    // Target 60 FPS with some headroom
    const targetFPS = 55;
    
    // Find highest quality that exceeds target FPS
    const qualities = ['ultra', 'high', 'medium', 'low'];
    
    for (const quality of qualities) {
      if (results[quality].fps >= targetFPS) {
        return quality;
      }
    }
    
    // If none hit target, return low
    return 'low';
  }
  
  /**
   * Calculate average value from an array
   * @param {Array<number>} values - Array of values
   * @returns {number} Average value
   */
  calculateAverageValue(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  
  /**
   * Wait for a specified number of milliseconds
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} Promise that resolves after the wait
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Update performance metrics - call this every frame
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    if (!this.config.enabled) return;
    
    // Skip if benchmarking
    if (this.config.benchmarkEnabled) return;
    
    const now = performance.now();
    
    // Get metrics from performance monitor
    if (this.performanceMonitor) {
      const metrics = this.performanceMonitor.metrics;
      
      // Store historical data
      this.metrics.fpsHistory.push(metrics.fps.current);
      this.metrics.frametimeHistory.push(metrics.frameTime.current);
      this.metrics.memoryHistory.push(metrics.memory.used);
      this.metrics.drawCallsHistory.push(metrics.drawCalls);
      
      // Limit history size
      if (this.metrics.fpsHistory.length > 100) {
        this.metrics.fpsHistory.shift();
        this.metrics.frametimeHistory.shift();
        this.metrics.memoryHistory.shift();
        this.metrics.drawCallsHistory.shift();
      }
    }
    
    // Check if it's time for auto-optimization
    if (this.config.autoOptimizeEnabled && now - this.metrics.lastOptimizeTime > this.config.optimizeInterval) {
      this.optimize();
    }
    
    // Check if it's time for memory optimization
    if (now - this.metrics.lastMemoryCheckTime > this.config.memoryCheckInterval) {
      this.checkMemoryUsage();
      this.metrics.lastMemoryCheckTime = now;
    }
    
    // Update debug UI if visible
    if (this.isDebugMode) {
      this.updateDebugUI();
    }
  }
  
  /**
   * Run optimization routine to improve performance if needed
   * @param {boolean} force - Force optimization even if not needed
   */
  optimize(force = false) {
    // Skip if disabled or benchmarking
    if (!this.config.enabled || this.config.benchmarkEnabled) return;
    
    console.log('[PerformanceOptimizer] Running optimization pass');
    
    // Get current performance metrics
    const avgFPS = this.calculateAverageValue(this.metrics.fpsHistory);
    const avgFrametime = this.calculateAverageValue(this.metrics.frametimeHistory);
    
    // Check if optimization is needed
    const needsOptimization = force || avgFPS < this.config.minAcceptableFPS;
    
    if (!needsOptimization && !force) {
      console.log('[PerformanceOptimizer] Performance is good, no optimization needed');
      return;
    }
    
    // Identify bottlenecks
    this.identifyBottlenecks();
    
    // Apply optimizations based on bottlenecks
    if (this.metrics.bottlenecks.gpu) {
      this.optimizeForGPU(avgFPS);
    }
    
    if (this.metrics.bottlenecks.cpu) {
      this.optimizeForCPU(avgFPS);
    }
    
    if (this.metrics.bottlenecks.memory) {
      this.optimizeForMemory();
    }
    
    // Apply any updated settings to the game
    this.applyOptimizedSettings();
    
    // Update timestamp
    this.metrics.lastOptimizeTime = performance.now();
  }
  
  /**
   * Identify performance bottlenecks
   */
  identifyBottlenecks() {
    // Reset bottleneck flags
    this.metrics.bottlenecks.cpu = false;
    this.metrics.bottlenecks.gpu = false;
    this.metrics.bottlenecks.memory = false;
    
    // Calculate average metrics
    const avgFPS = this.calculateAverageValue(this.metrics.fpsHistory);
    const avgFrametime = this.calculateAverageValue(this.metrics.frametimeHistory);
    const avgDrawCalls = this.calculateAverageValue(this.metrics.drawCallsHistory);
    
    // Check for high draw calls (indicates GPU bottleneck)
    const drawCallThreshold = 1000; // Arbitrary threshold
    if (avgDrawCalls > drawCallThreshold) {
      this.metrics.bottlenecks.gpu = true;
    }
    
    // Check for high memory usage
    if (this.performanceMonitor && this.performanceMonitor.metrics.memory.used > 0) {
      const memoryUsageRatio = this.performanceMonitor.metrics.memory.used / 
                              (this.performanceMonitor.metrics.memory.total || 4096); // Default to 4GB if total unknown
      
      if (memoryUsageRatio > this.config.memoryThreshold) {
        this.metrics.bottlenecks.memory = true;
      }
    }
    
    // If neither GPU nor memory is a bottleneck, assume CPU
    if (!this.metrics.bottlenecks.gpu && !this.metrics.bottlenecks.memory && avgFPS < this.config.targetFPS) {
      this.metrics.bottlenecks.cpu = true;
    }
    
    console.log(`[PerformanceOptimizer] Bottlenecks - CPU: ${this.metrics.bottlenecks.cpu}, GPU: ${this.metrics.bottlenecks.gpu}, Memory: ${this.metrics.bottlenecks.memory}`);
  }
  
  /**
   * Optimize for GPU bottleneck
   * @param {number} currentFPS - Current FPS
   */
  optimizeForGPU(currentFPS) {
    console.log('[PerformanceOptimizer] Optimizing for GPU bottleneck');
    
    // Calculate desired improvement factor
    const targetFPS = this.config.targetFPS;
    const improvementNeeded = Math.max(1, targetFPS / currentFPS);
    
    // Reduce parameters that affect GPU performance
    this.adjustParameter('shadowResolution', 1 / improvementNeeded);
    this.adjustParameter('textureQuality', 1 / Math.sqrt(improvementNeeded));
    
    // If very low FPS, also reduce draw distance
    if (improvementNeeded > 1.5) {
      this.adjustParameter('drawDistance', 1 / improvementNeeded);
      this.adjustParameter('maxParticles', 1 / improvementNeeded);
    }
  }
  
  /**
   * Optimize for CPU bottleneck
   * @param {number} currentFPS - Current FPS
   */
  optimizeForCPU(currentFPS) {
    console.log('[PerformanceOptimizer] Optimizing for CPU bottleneck');
    
    // Calculate desired improvement factor
    const targetFPS = this.config.targetFPS;
    const improvementNeeded = Math.max(1, targetFPS / currentFPS);
    
    // Reduce parameters that affect CPU performance
    this.adjustParameter('lodDistance', 1 / improvementNeeded);
    this.adjustParameter('maxZombies', 1 / Math.sqrt(improvementNeeded));
  }
  
  /**
   * Optimize for memory usage bottleneck
   */
  optimizeForMemory() {
    console.log('[PerformanceOptimizer] Optimizing for memory bottleneck');
    
    // Trigger asset manager garbage collection
    if (this.assetManager) {
      this.assetManager.performMemoryOptimization();
    }
    
    // Reduce texture quality to save memory
    this.adjustParameter('textureQuality', 0.8);
    
    // Reduce max zombies to save memory
    this.adjustParameter('maxZombies', 0.8);
  }
  
  /**
   * Adjust a quality parameter by a factor
   * @param {string} parameter - Parameter name
   * @param {number} factor - Adjustment factor (1 = no change, <1 = reduce, >1 = increase)
   */
  adjustParameter(parameter, factor) {
    if (!this.currentQuality[parameter]) return;
    
    const paramInfo = this.qualityParameters[parameter];
    
    if (!paramInfo) return;
    
    // Apply adjustment with weighting
    const adjustmentFactor = 1 + (factor - 1) * this.config.adaptationSpeed * paramInfo.weight;
    
    // Calculate new value
    let newValue = this.currentQuality[parameter] * adjustmentFactor;
    
    // Clamp to min/max
    newValue = Math.max(paramInfo.min, Math.min(paramInfo.max, newValue));
    
    // Update value
    this.currentQuality[parameter] = newValue;
    
    console.log(`[PerformanceOptimizer] Adjusted ${parameter} from ${this.currentQuality[parameter]} to ${newValue}`);
  }
  
  /**
   * Apply optimized settings to the game
   */
  applyOptimizedSettings() {
    // Apply settings to various managers
    
    // Update LOD distances if LOD manager exists
    if (this.lodManager) {
      this.lodManager.setLODDistances(
        this.currentQuality.lodDistance * 0.4,  // First level
        this.currentQuality.lodDistance          // Second level
      );
    }
    
    // Update culling settings if culling manager exists
    if (this.cullingManager) {
      this.cullingManager.setViewDistance(this.currentQuality.drawDistance);
      
      // Only do expensive occlusion culling on higher-end devices
      this.cullingManager.setOcclusionCullingEnabled(
        this.currentQuality.drawDistance > this.qualityParameters.drawDistance.min * 1.5
      );
    }
    
    // Update max zombies if zombie manager exists
    if (this.game.zombieManager) {
      this.game.zombieManager.setMaxZombies(Math.round(this.currentQuality.maxZombies));
    }
    
    // Update shadows if lighting manager exists
    if (this.game.lightingManager) {
      this.game.lightingManager.setShadowResolution(Math.round(this.currentQuality.shadowResolution));
      this.game.lightingManager.setShadowDistance(this.currentQuality.shadowDistance);
    }
    
    // Update texture quality if asset manager exists
    if (this.assetManager) {
      this.assetManager.setTextureQualityScale(this.currentQuality.textureQuality);
    }
    
    // Update particles if effects manager exists
    if (this.game.effectsManager) {
      this.game.effectsManager.setMaxParticles(Math.round(this.currentQuality.maxParticles));
    }
    
    console.log('[PerformanceOptimizer] Applied optimized settings');
  }
  
  /**
   * Check memory usage and optimize if needed
   */
  checkMemoryUsage() {
    if (!this.performanceMonitor) return;
    
    const memoryMetrics = this.performanceMonitor.metrics.memory;
    
    // If memory usage ratio is high, trigger optimization
    if (memoryMetrics.total > 0) {
      const memoryUsageRatio = memoryMetrics.used / memoryMetrics.total;
      
      if (memoryUsageRatio > this.config.memoryThreshold) {
        console.log(`[PerformanceOptimizer] High memory usage detected: ${memoryUsageRatio.toFixed(2)}%, optimizing`);
        
        // Set memory bottleneck flag
        this.metrics.bottlenecks.memory = true;
        
        // Run memory-specific optimizations
        this.optimizeForMemory();
        
        // Apply updated settings
        this.applyOptimizedSettings();
      }
    }
  }
  
  /**
   * Enable or disable the PerformanceOptimizer
   * @param {boolean} enabled - Whether to enable the optimizer
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;
    
    if (!enabled) {
      this.debugUI.style.display = 'none';
      this.isDebugMode = false;
    }
  }
  
  /**
   * Clean up resources used by the PerformanceOptimizer
   */
  dispose() {
    // Remove debug UI
    if (this.debugUI && this.debugUI.parentNode) {
      this.debugUI.parentNode.removeChild(this.debugUI);
    }
    
    // Remove event listeners
    document.removeEventListener('keydown', this.registerKeyboardEvents);
    
    console.log('[PerformanceOptimizer] Disposed');
  }
} 