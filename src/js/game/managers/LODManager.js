import * as THREE from 'three';

/**
 * LODManager - Manages Level of Detail (LOD) for game objects
 * Dynamically adjusts mesh complexity based on distance from the camera
 */
export class LODManager {
  constructor(game) {
    this.game = game;
    
    // Configuration for LOD
    this.config = {
      enabled: true,
      
      // Distance thresholds for different LOD levels (units in world space)
      thresholds: {
        buildings: {
          low: 40,    // Switch to low detail beyond this distance
          medium: 25  // Switch to medium detail beyond this distance (high detail below this)
        },
        zombies: {
          low: 30,    // Switch to low detail beyond this distance
          medium: 15  // Switch to medium detail beyond this distance (high detail below this)
        },
        environment: {
          low: 50,    // Switch to low detail beyond this distance
          medium: 30  // Switch to medium detail beyond this distance (high detail below this)
        }
      },
      
      // Hysteresis values to prevent rapid LOD switching (percentage of threshold)
      hysteresis: 0.1,
      
      // Update frequency to limit how often LOD checks are performed
      updateFrequency: 0.2,  // Seconds between LOD updates
      updateThreshold: 3,    // Minimum player movement to trigger update
      
      // Debug settings
      debugMode: false,
      debugColors: {
        high: 0x00ff00,    // Green for high detail
        medium: 0xffff00,  // Yellow for medium detail
        low: 0xff0000      // Red for low detail
      }
    };
    
    // Internal state
    this.lastUpdateTime = 0;
    this.lastPlayerPosition = new THREE.Vector3();
    this.currentQualityPreset = 'medium';
    
    // Debug visualization
    this.debugObjects = [];
    this.debugVisible = false;
  }
  
  /**
   * Initialize the LOD Manager
   */
  init() {
    console.log('Initializing LOD Manager');
    
    // Adjust thresholds based on current quality settings
    this.applyQualitySettings();
    
    // Store initial player position
    if (this.game.player) {
      this.lastPlayerPosition.copy(this.game.player.container.position);
    }
    
    // Setup debug visualization if enabled
    if (this.config.debugMode) {
      this.setupDebugVisualization();
    }
  }
  
  /**
   * Update LOD levels for all managed objects
   */
  update(deltaTime) {
    if (!this.config.enabled || !this.game.player) return;
    
    // Check if it's time to update LOD levels
    const currentTime = this.game.clock.getElapsedTime();
    if (currentTime - this.lastUpdateTime < this.config.updateFrequency) return;
    
    const playerPosition = this.game.player.container.position;
    
    // Check if player has moved enough to warrant an update
    if (playerPosition.distanceTo(this.lastPlayerPosition) < this.config.updateThreshold) return;
    
    // Update LOD for different object types
    this.updateBuildingsLOD(playerPosition);
    this.updateZombiesLOD(playerPosition);
    this.updateEnvironmentLOD(playerPosition);
    
    // Update debug visualization if enabled
    if (this.config.debugMode && this.debugVisible) {
      this.updateDebugVisualization();
    }
    
    // Store state for next update
    this.lastUpdateTime = currentTime;
    this.lastPlayerPosition.copy(playerPosition);
  }
  
  /**
   * Update LOD for all buildings
   */
  updateBuildingsLOD(playerPosition) {
    if (!this.game.city || !this.game.city.buildings) return;
    
    const thresholds = this.config.thresholds.buildings;
    const hysteresis = this.config.hysteresis;
    
    // Process all buildings
    this.game.city.buildings.forEach(building => {
      if (!building.container.visible) return;
      
      const distance = building.container.position.distanceTo(playerPosition);
      const currentLevel = building.currentDetailLevel || 2;
      
      // Apply thresholds with hysteresis to prevent frequent switching
      let newLevel = currentLevel;
      
      if (distance > thresholds.low * (currentLevel === 0 ? (1 - hysteresis) : 1)) {
        newLevel = 0; // Low detail
      } else if (distance > thresholds.medium * (currentLevel === 1 ? (1 - hysteresis) : 1)) {
        newLevel = 1; // Medium detail
      } else {
        newLevel = 2; // High detail
      }
      
      // Update detail level if changed
      if (newLevel !== currentLevel && typeof building.setDetailLevel === 'function') {
        building.setDetailLevel(newLevel);
      }
    });
  }
  
  /**
   * Update LOD for all zombies
   */
  updateZombiesLOD(playerPosition) {
    if (!this.game.zombieManager || !this.game.zombieManager.zombies) return;
    
    const thresholds = this.config.thresholds.zombies;
    const hysteresis = this.config.hysteresis;
    
    // Process all zombies
    this.game.zombieManager.zombies.forEach(zombie => {
      if (!zombie.container.visible) return;
      
      const distance = zombie.container.position.distanceTo(playerPosition);
      const currentLevel = zombie.currentDetailLevel || 2;
      
      // Apply thresholds with hysteresis to prevent frequent switching
      let newLevel = currentLevel;
      
      if (distance > thresholds.low * (currentLevel === 0 ? (1 - hysteresis) : 1)) {
        newLevel = 0; // Low detail
      } else if (distance > thresholds.medium * (currentLevel === 1 ? (1 - hysteresis) : 1)) {
        newLevel = 1; // Medium detail
      } else {
        newLevel = 2; // High detail
      }
      
      // Update detail level if changed
      if (newLevel !== currentLevel && typeof zombie.setDetailLevel === 'function') {
        zombie.setDetailLevel(newLevel);
      }
    });
  }
  
  /**
   * Update LOD for environmental assets
   */
  updateEnvironmentLOD(playerPosition) {
    if (!this.game.city || !this.game.city.cityComponents) return;
    
    const thresholds = this.config.thresholds.environment;
    const hysteresis = this.config.hysteresis;
    
    // Process all city components with LOD support
    if (typeof this.game.city.cityComponents.updateLOD === 'function') {
      this.game.city.cityComponents.updateLOD(playerPosition, thresholds, hysteresis);
    }
    
    // Process apocalyptic assets if available
    if (this.game.city.apocalypticAssets && 
        typeof this.game.city.apocalypticAssets.updateLOD === 'function') {
      this.game.city.apocalypticAssets.updateLOD(playerPosition, thresholds, hysteresis);
    }
  }
  
  /**
   * Setup debug visualization for LOD levels
   */
  setupDebugVisualization() {
    // Clear any existing debug objects
    this.clearDebugVisualization();
    
    // Create distance indicator rings
    const ringGeometry = new THREE.RingGeometry(1, 1.2, 32);
    
    // Zombies thresholds
    const zombieLowMaterial = new THREE.MeshBasicMaterial({
      color: this.config.debugColors.low,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    
    const zombieMediumMaterial = new THREE.MeshBasicMaterial({
      color: this.config.debugColors.medium,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    
    const zombieLowRing = new THREE.Mesh(
      new THREE.RingGeometry(this.config.thresholds.zombies.low, this.config.thresholds.zombies.low + 0.5, 32),
      zombieLowMaterial
    );
    zombieLowRing.rotation.x = Math.PI / 2;
    zombieLowRing.position.y = 0.1;
    
    const zombieMediumRing = new THREE.Mesh(
      new THREE.RingGeometry(this.config.thresholds.zombies.medium, this.config.thresholds.zombies.medium + 0.5, 32),
      zombieMediumMaterial
    );
    zombieMediumRing.rotation.x = Math.PI / 2;
    zombieMediumRing.position.y = 0.1;
    
    this.debugObjects.push(zombieLowRing);
    this.debugObjects.push(zombieMediumRing);
    
    // Add debug objects to scene
    this.debugObjects.forEach(obj => {
      this.game.scene.add(obj);
    });
    
    this.debugVisible = true;
  }
  
  /**
   * Clear debug visualization objects
   */
  clearDebugVisualization() {
    this.debugObjects.forEach(obj => {
      this.game.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    
    this.debugObjects = [];
    this.debugVisible = false;
  }
  
  /**
   * Update debug visualization to follow player
   */
  updateDebugVisualization() {
    if (!this.game.player) return;
    
    const playerPosition = this.game.player.container.position.clone();
    playerPosition.y = 0.1; // Slightly above ground
    
    this.debugObjects.forEach(obj => {
      obj.position.x = playerPosition.x;
      obj.position.z = playerPosition.z;
    });
  }
  
  /**
   * Toggle debug visualization
   */
  toggleDebugVisualization() {
    if (this.debugVisible) {
      this.clearDebugVisualization();
    } else {
      this.setupDebugVisualization();
    }
    
    return this.debugVisible;
  }
  
  /**
   * Apply quality presets to LOD thresholds
   */
  applyQualitySettings(qualityPreset = null) {
    // Use provided preset or current game quality setting
    const preset = qualityPreset || this.game.qualityPreset || 'medium';
    this.currentQualityPreset = preset;
    
    // Adjust LOD thresholds based on quality settings
    switch (preset) {
      case 'low':
        // Lower quality = larger thresholds (switch to low detail sooner)
        this.config.thresholds.buildings.low = 30;
        this.config.thresholds.buildings.medium = 15;
        this.config.thresholds.zombies.low = 20;
        this.config.thresholds.zombies.medium = 10;
        this.config.thresholds.environment.low = 40;
        this.config.thresholds.environment.medium = 20;
        break;
        
      case 'medium':
        // Medium quality = default thresholds
        this.config.thresholds.buildings.low = 40;
        this.config.thresholds.buildings.medium = 25;
        this.config.thresholds.zombies.low = 30;
        this.config.thresholds.zombies.medium = 15;
        this.config.thresholds.environment.low = 50;
        this.config.thresholds.environment.medium = 30;
        break;
        
      case 'high':
        // High quality = smaller thresholds (maintain high detail longer)
        this.config.thresholds.buildings.low = 60;
        this.config.thresholds.buildings.medium = 40;
        this.config.thresholds.zombies.low = 45;
        this.config.thresholds.zombies.medium = 25;
        this.config.thresholds.environment.low = 70;
        this.config.thresholds.environment.medium = 45;
        break;
        
      case 'ultra':
        // Ultra quality = even smaller thresholds
        this.config.thresholds.buildings.low = 80;
        this.config.thresholds.buildings.medium = 50;
        this.config.thresholds.zombies.low = 60;
        this.config.thresholds.zombies.medium = 35;
        this.config.thresholds.environment.low = 100;
        this.config.thresholds.environment.medium = 60;
        break;
    }
    
    // Update frequency adjustments
    if (preset === 'low') {
      this.config.updateFrequency = 0.5; // Less frequent updates for low-end devices
    } else if (preset === 'ultra') {
      this.config.updateFrequency = 0.1; // More frequent updates for high-end devices
    } else {
      this.config.updateFrequency = 0.2; // Default update frequency
    }
    
    console.log(`Applied ${preset} quality settings to LOD Manager`);
  }
  
  /**
   * Toggle LOD system on/off
   */
  setEnabled(enabled) {
    const wasEnabled = this.config.enabled;
    this.config.enabled = enabled;
    
    console.log(`LOD System ${enabled ? 'enabled' : 'disabled'}`);
    
    // If turning on from disabled state, force an immediate update
    if (!wasEnabled && enabled) {
      this.forceUpdate();
    }
    
    // If turning off, set everything to high detail
    if (!enabled) {
      this.setAllToHighestDetail();
    }
    
    return this.config.enabled;
  }
  
  /**
   * Set all objects to highest detail level
   */
  setAllToHighestDetail() {
    // Buildings
    if (this.game.city && this.game.city.buildings) {
      this.game.city.buildings.forEach(building => {
        if (typeof building.setDetailLevel === 'function') {
          building.setDetailLevel(2);
        }
      });
    }
    
    // Zombies
    if (this.game.zombieManager && this.game.zombieManager.zombies) {
      this.game.zombieManager.zombies.forEach(zombie => {
        if (typeof zombie.setDetailLevel === 'function') {
          zombie.setDetailLevel(2);
        }
      });
    }
    
    // Environment
    if (this.game.city && this.game.city.cityComponents && 
        typeof this.game.city.cityComponents.setHighestDetailLevel === 'function') {
      this.game.city.cityComponents.setHighestDetailLevel();
    }
    
    if (this.game.city && this.game.city.apocalypticAssets && 
        typeof this.game.city.apocalypticAssets.setHighestDetailLevel === 'function') {
      this.game.city.apocalypticAssets.setHighestDetailLevel();
    }
  }
  
  /**
   * Force immediate LOD update regardless of timing
   */
  forceUpdate() {
    if (!this.config.enabled || !this.game.player) return;
    
    const playerPosition = this.game.player.container.position;
    
    this.updateBuildingsLOD(playerPosition);
    this.updateZombiesLOD(playerPosition);
    this.updateEnvironmentLOD(playerPosition);
    
    this.lastUpdateTime = this.game.clock.getElapsedTime();
    this.lastPlayerPosition.copy(playerPosition);
    
    console.log('Forced LOD update complete');
  }
  
  /**
   * Set debug mode
   */
  setDebugMode(enabled) {
    this.config.debugMode = enabled;
    
    if (enabled) {
      console.log('LOD Debug mode enabled');
      if (!this.debugVisible) {
        this.setupDebugVisualization();
      }
    } else {
      console.log('LOD Debug mode disabled');
      if (this.debugVisible) {
        this.clearDebugVisualization();
      }
    }
    
    return this.config.debugMode;
  }
} 