import * as THREE from 'three';

export class PerformanceMonitor {
  constructor(game) {
    this.game = game;

    // Performance metrics
    this.metrics = {
      fps: {
        current: 0,
        min: Infinity,
        max: 0,
        average: 0,
        samples: [],
      },
      frameTime: {
        current: 0,
        min: Infinity,
        max: 0,
        average: 0,
        samples: [],
      },
      memory: {
        total: 0,
        used: 0,
        limit: 0,
      },
      assets: {
        textures: 0,
        geometries: 0,
        materials: 0,
        total: 0
      },
      drawCalls: 0,
      triangles: 0,
      textures: 0,
      programs: 0,
    };

    // Configuration
    this.config = {
      enabled: true,
      overlayEnabled: false,
      sampleSize: 100,
      updateInterval: 500, // ms
      logInterval: 10000, // ms
      memoryEnabled: true,
    };

    // Timing
    this.lastUpdateTime = 0;
    this.lastLogTime = 0;
    this.frameCount = 0;

    // Create overlay
    this.overlay = null;
    this.createOverlay();
  }

  createOverlay() {
    // Create DOM elements for performance overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'performance-overlay';
    this.overlay.style.position = 'absolute';
    this.overlay.style.top = '10px';
    this.overlay.style.right = '10px';
    this.overlay.style.padding = '10px';
    this.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.overlay.style.color = 'white';
    this.overlay.style.fontFamily = 'monospace';
    this.overlay.style.fontSize = '12px';
    this.overlay.style.borderRadius = '5px';
    this.overlay.style.zIndex = '1000';
    this.overlay.style.display = this.config.overlayEnabled ? 'block' : 'none';

    // Add metrics to overlay
    this.overlay.innerHTML = `
      <div>FPS: <span id="fps-current">0</span> (<span id="fps-min">0</span>-<span id="fps-max">0</span>, avg: <span id="fps-avg">0</span>)</div>
      <div>Frame Time: <span id="frame-time-current">0</span>ms (<span id="frame-time-min">0</span>-<span id="frame-time-max">0</span>, avg: <span id="frame-time-avg">0</span>)</div>
      <div>Draw Calls: <span id="draw-calls">0</span></div>
      <div>Triangles: <span id="triangles">0</span></div>
      <div>Memory: <span id="memory-used">0</span>MB / <span id="memory-total">0</span>MB</div>
      <div>Asset Memory: <span id="asset-memory">0</span>MB (<span id="texture-memory">0</span>MB textures)</div>
      <div>Shared Materials: <span id="shared-materials">0</span></div>
      <div>
        <button id="toggle-overlay" style="background: #333; color: white; border: 1px solid #555; padding: 2px 5px; margin-top: 5px; cursor: pointer;">Hide</button>
        <button id="optimize-memory" style="background: #333; color: white; border: 1px solid #555; padding: 2px 5px; margin-top: 5px; cursor: pointer;">Optimize</button>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(this.overlay);

    // Add event listener to toggle button
    const toggleButton = document.getElementById('toggle-overlay');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        this.toggleOverlay();
      });
    }
    
    // Add event listener to optimize button
    const optimizeButton = document.getElementById('optimize-memory');
    if (optimizeButton) {
      optimizeButton.addEventListener('click', () => {
        if (this.game && this.game.assetManager) {
          console.log('Manual memory optimization triggered');
          this.game.assetManager.performMemoryOptimization();
        }
      });
    }

    // Add keyboard shortcut (F8) to toggle overlay
    document.addEventListener('keydown', (event) => {
      if (event.key === 'F8') {
        this.toggleOverlay();
      }
    });
  }

  toggleOverlay() {
    this.config.overlayEnabled = !this.config.overlayEnabled;
    this.overlay.style.display = this.config.overlayEnabled ? 'block' : 'none';

    // Update button text
    const toggleButton = document.getElementById('toggle-overlay');
    if (toggleButton) {
      toggleButton.textContent = this.config.overlayEnabled ? 'Hide' : 'Show';
    }
  }

  update(deltaTime) {
    if (!this.config.enabled) return;

    this.frameCount++;
    const now = performance.now();

    // Calculate FPS and frame time
    this.calculateMetrics(deltaTime, now);
    
    // Get asset memory usage from AssetManager
    this.updateAssetMemoryMetrics();

    // Update overlay if it's time
    if (now - this.lastUpdateTime > this.config.updateInterval) {
      this.updateOverlay();
      this.lastUpdateTime = now;
    }

    // Log to console if it's time
    if (now - this.lastLogTime > this.config.logInterval) {
      this.logMetrics();
      this.lastLogTime = now;
    }
  }

  calculateMetrics(deltaTime, now) {
    // Calculate FPS
    const fps = 1 / deltaTime;
    this.metrics.fps.current = Math.round(fps);
    this.metrics.fps.min = Math.min(this.metrics.fps.min, this.metrics.fps.current);
    this.metrics.fps.max = Math.max(this.metrics.fps.max, this.metrics.fps.current);

    // Track samples for average (rolling window)
    this.metrics.fps.samples.push(this.metrics.fps.current);
    if (this.metrics.fps.samples.length > this.config.sampleSize) {
      this.metrics.fps.samples.shift();
    }

    // Calculate average FPS
    const sum = this.metrics.fps.samples.reduce((a, b) => a + b, 0);
    this.metrics.fps.average = Math.round(sum / this.metrics.fps.samples.length);

    // Calculate frame time in milliseconds
    const frameTime = deltaTime * 1000;
    this.metrics.frameTime.current = Math.round(frameTime * 100) / 100;
    this.metrics.frameTime.min = Math.min(
      this.metrics.frameTime.min,
      this.metrics.frameTime.current
    );
    this.metrics.frameTime.max = Math.max(
      this.metrics.frameTime.max,
      this.metrics.frameTime.current
    );

    // Track samples for average (rolling window)
    this.metrics.frameTime.samples.push(this.metrics.frameTime.current);
    if (this.metrics.frameTime.samples.length > this.config.sampleSize) {
      this.metrics.frameTime.samples.shift();
    }

    // Calculate average frame time
    const frameTimeSum = this.metrics.frameTime.samples.reduce((a, b) => a + b, 0);
    this.metrics.frameTime.average =
      Math.round((frameTimeSum / this.metrics.frameTime.samples.length) * 100) / 100;

    // Get renderer info
    if (this.game.renderer) {
      const info = this.game.renderer.info;
      this.metrics.drawCalls = info.render.calls;
      this.metrics.triangles = info.render.triangles;
      this.metrics.textures = info.memory ? info.memory.textures : 0;
      this.metrics.programs = info.programs ? info.programs.length : 0;
    }

    // Get memory info if available
    if (this.config.memoryEnabled && window.performance && window.performance.memory) {
      const memory = window.performance.memory;
      this.metrics.memory.total = Math.round(memory.totalJSHeapSize / (1024 * 1024));
      this.metrics.memory.used = Math.round(memory.usedJSHeapSize / (1024 * 1024));
      this.metrics.memory.limit = Math.round(memory.jsHeapSizeLimit / (1024 * 1024));
    }
  }

  updateAssetMemoryMetrics() {
    if (this.game && this.game.assetManager) {
      const assetManager = this.game.assetManager;
      
      // Copy memory usage data
      this.metrics.assets.textures = assetManager.memoryUsage.textures;
      this.metrics.assets.geometries = assetManager.memoryUsage.geometries;
      this.metrics.assets.materials = assetManager.memoryUsage.materials;
      this.metrics.assets.total = assetManager.memoryUsage.total;
      
      // Track shared material count
      if (this.game.texturingSystem) {
        this.metrics.assets.sharedMaterials = this.game.texturingSystem.sharedMaterialCount || 0;
      }
    }
  }

  updateOverlay() {
    if (!this.config.overlayEnabled) return;

    // Update FPS
    const fpsCurrentEl = document.getElementById('fps-current');
    const fpsMinEl = document.getElementById('fps-min');
    const fpsMaxEl = document.getElementById('fps-max');
    const fpsAvgEl = document.getElementById('fps-avg');

    if (fpsCurrentEl) fpsCurrentEl.textContent = this.metrics.fps.current;
    if (fpsMinEl)
      fpsMinEl.textContent = this.metrics.fps.min === Infinity ? 0 : this.metrics.fps.min;
    if (fpsMaxEl) fpsMaxEl.textContent = this.metrics.fps.max;
    if (fpsAvgEl) fpsAvgEl.textContent = this.metrics.fps.average;

    // Update frame time
    const frameTimeCurrentEl = document.getElementById('frame-time-current');
    const frameTimeMinEl = document.getElementById('frame-time-min');
    const frameTimeMaxEl = document.getElementById('frame-time-max');
    const frameTimeAvgEl = document.getElementById('frame-time-avg');

    if (frameTimeCurrentEl) frameTimeCurrentEl.textContent = this.metrics.frameTime.current;
    if (frameTimeMinEl)
      frameTimeMinEl.textContent =
        this.metrics.frameTime.min === Infinity ? 0 : this.metrics.frameTime.min;
    if (frameTimeMaxEl) frameTimeMaxEl.textContent = this.metrics.frameTime.max;
    if (frameTimeAvgEl) frameTimeAvgEl.textContent = this.metrics.frameTime.average;

    // Update renderer stats
    const drawCallsEl = document.getElementById('draw-calls');
    const trianglesEl = document.getElementById('triangles');

    if (drawCallsEl) drawCallsEl.textContent = this.metrics.drawCalls;
    if (trianglesEl) trianglesEl.textContent = this.metrics.triangles;

    // Update memory stats
    const memoryUsedEl = document.getElementById('memory-used');
    const memoryTotalEl = document.getElementById('memory-total');

    if (memoryUsedEl) memoryUsedEl.textContent = this.metrics.memory.used;
    if (memoryTotalEl) memoryTotalEl.textContent = this.metrics.memory.total;
    
    // Update asset memory stats
    const assetMemoryEl = document.getElementById('asset-memory');
    const textureMemoryEl = document.getElementById('texture-memory');
    const sharedMaterialsEl = document.getElementById('shared-materials');
    
    if (assetMemoryEl) assetMemoryEl.textContent = this.metrics.assets.total;
    if (textureMemoryEl) textureMemoryEl.textContent = this.metrics.assets.textures;
    if (sharedMaterialsEl) sharedMaterialsEl.textContent = this.metrics.assets.sharedMaterials || 0;
  }

  logMetrics() {
    console.log(`
Performance Report:
------------------
FPS: ${this.metrics.fps.current} (min: ${this.metrics.fps.min === Infinity ? 0 : this.metrics.fps.min}, max: ${this.metrics.fps.max}, avg: ${this.metrics.fps.average})
Frame Time: ${this.metrics.frameTime.current}ms (min: ${this.metrics.frameTime.min === Infinity ? 0 : this.metrics.frameTime.min}, max: ${this.metrics.frameTime.max}, avg: ${this.metrics.frameTime.average})
Draw Calls: ${this.metrics.drawCalls}
Triangles: ${this.metrics.triangles}
Memory: ${this.metrics.memory.used}MB / ${this.metrics.memory.total}MB
Asset Memory: ${this.metrics.assets.total}MB (textures: ${this.metrics.assets.textures}MB)
    `);
  }

  reset() {
    this.metrics.fps.min = Infinity;
    this.metrics.fps.max = 0;
    this.metrics.fps.average = 0;
    this.metrics.fps.samples = [];

    this.metrics.frameTime.min = Infinity;
    this.metrics.frameTime.max = 0;
    this.metrics.frameTime.average = 0;
    this.metrics.frameTime.samples = [];

    this.frameCount = 0;
  }

  setEnabled(enabled) {
    this.config.enabled = enabled;
    if (!enabled) {
      this.config.overlayEnabled = false;
      this.overlay.style.display = 'none';
    }
  }
}
