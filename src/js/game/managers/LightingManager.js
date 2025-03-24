import * as THREE from 'three';

export class LightingManager {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    
    // Light collections
    this.pointLights = [];
    this.spotLights = [];
    this.emergencyLights = [];
    
    // Lighting settings
    this.settings = {
      enabled: true,
      shadows: true,
      dynamicLighting: true,
      
      // Shadow map settings
      shadowMapSize: 1024,
      shadowRadius: 3,
      
      // Global lighting settings
      globalIntensityMultiplier: 1.0,
      
      // Player flashlight
      flashlightEnabled: false,
      flashlightColor: 0xffffff,
      flashlightIntensity: 1.5,
      flashlightDistance: 15,
      flashlightAngle: Math.PI / 6,
      flashlightPenumbra: 0.5,
      
      // Emergency lights
      emergencyLightColor: 0xff4444,
      emergencyLightIntensity: 1.0,
      emergencyLightDistance: 10,
      emergencyLightFlickerSpeed: 4.0,
      emergencyLightFlickerIntensity: 0.4,
      
      // Light culling
      cullingEnabled: true,
      cullingDistance: 50,
      
      // Light map baking (for low-end devices)
      useLightMaps: false,
      
      // Max lights to render
      maxVisiblePointLights: 20,
      maxVisibleSpotLights: 10
    };
    
    // References to key lights
    this.flashlight = null;
    this.muzzleFlash = null;
    
    // For light animations
    this.clock = new THREE.Clock();
    this.lightAnimations = {};
    
    // Debug helpers
    this.debugMode = false;
    this.lightHelpers = [];
  }
  
  init() {
    console.log('Initializing LightingManager...');
    
    // Apply quality settings
    this.applyQualitySettings();
    
    // Setup player flashlight
    this.setupFlashlight();
    
    // Setup muzzle flash light for weapon
    this.setupMuzzleFlash();
    
    console.log('LightingManager initialized');
    return this;
  }
  
  applyQualitySettings() {
    const quality = this.game.settings.qualityLevel;
    
    switch (quality) {
      case 'low':
        this.settings.shadows = false;
        this.settings.shadowMapSize = 512;
        this.settings.cullingDistance = 30;
        this.settings.maxVisiblePointLights = 5;
        this.settings.maxVisibleSpotLights = 3;
        this.settings.useLightMaps = true;
        this.settings.dynamicLighting = false;
        break;
        
      case 'medium':
        this.settings.shadows = true;
        this.settings.shadowMapSize = 1024;
        this.settings.cullingDistance = 40;
        this.settings.maxVisiblePointLights = 10;
        this.settings.maxVisibleSpotLights = 5;
        this.settings.useLightMaps = false;
        this.settings.dynamicLighting = true;
        break;
        
      case 'high':
        this.settings.shadows = true;
        this.settings.shadowMapSize = 2048;
        this.settings.cullingDistance = 50;
        this.settings.maxVisiblePointLights = 20;
        this.settings.maxVisibleSpotLights = 10;
        this.settings.useLightMaps = false;
        this.settings.dynamicLighting = true;
        break;
    }
    
    // Apply shadow settings to renderer
    if (this.game.renderer) {
      this.game.renderer.shadowMap.enabled = this.settings.shadows;
    }
  }
  
  setupFlashlight() {
    // Remove existing flashlight if any
    if (this.flashlight) {
      this.scene.remove(this.flashlight);
      this.flashlight = null;
    }
    
    // Create new flashlight (spotlight)
    this.flashlight = new THREE.SpotLight(
      this.settings.flashlightColor,
      this.settings.flashlightIntensity,
      this.settings.flashlightDistance,
      this.settings.flashlightAngle,
      this.settings.flashlightPenumbra,
      2
    );
    
    // Setup flashlight position and orientation
    this.flashlight.position.set(0, 0, 0);
    this.flashlight.target.position.set(0, 0, -1);
    
    // Setup shadows for flashlight
    if (this.settings.shadows) {
      this.flashlight.castShadow = true;
      this.flashlight.shadow.mapSize.width = this.settings.shadowMapSize;
      this.flashlight.shadow.mapSize.height = this.settings.shadowMapSize;
      this.flashlight.shadow.camera.near = 0.5;
      this.flashlight.shadow.camera.far = this.settings.flashlightDistance;
      this.flashlight.shadow.radius = this.settings.shadowRadius;
    }
    
    // Add flashlight and target to scene but disable initially
    this.scene.add(this.flashlight);
    this.scene.add(this.flashlight.target);
    this.flashlight.visible = this.settings.flashlightEnabled;
    
    // Create helper for debug mode
    if (this.debugMode) {
      const helper = new THREE.SpotLightHelper(this.flashlight);
      this.scene.add(helper);
      this.lightHelpers.push(helper);
    }
  }
  
  setupMuzzleFlash() {
    // Create muzzle flash light (point light)
    this.muzzleFlash = new THREE.PointLight(0xffcc77, 3, 5);
    this.muzzleFlash.position.set(0, 0, 0);
    this.muzzleFlash.visible = false;
    
    this.scene.add(this.muzzleFlash);
    
    // Attach animation to the muzzle flash
    this.lightAnimations.muzzleFlash = {
      duration: 0.1,
      timer: 0,
      active: false,
      update: (deltaTime) => {
        if (!this.lightAnimations.muzzleFlash.active) return;
        
        this.lightAnimations.muzzleFlash.timer += deltaTime;
        const progress = this.lightAnimations.muzzleFlash.timer / this.lightAnimations.muzzleFlash.duration;
        
        if (progress >= 1) {
          this.muzzleFlash.visible = false;
          this.lightAnimations.muzzleFlash.active = false;
          this.lightAnimations.muzzleFlash.timer = 0;
        } else {
          // Fade out intensity
          this.muzzleFlash.intensity = 3 * (1 - progress);
        }
      }
    };
  }
  
  createPointLight(params = {}) {
    const {
      color = 0xffffff,
      intensity = 1,
      distance = 10,
      position = { x: 0, y: 0, z: 0 },
      castShadow = this.settings.shadows,
      helper = this.debugMode
    } = params;
    
    // Create light
    const light = new THREE.PointLight(color, intensity, distance);
    light.position.set(position.x, position.y, position.z);
    
    // Setup shadows
    light.castShadow = castShadow;
    if (castShadow) {
      light.shadow.mapSize.width = this.settings.shadowMapSize;
      light.shadow.mapSize.height = this.settings.shadowMapSize;
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = distance;
      light.shadow.radius = this.settings.shadowRadius;
    }
    
    // Add to scene and collection
    this.scene.add(light);
    this.pointLights.push(light);
    
    // Create helper if in debug mode
    if (helper) {
      const pointLightHelper = new THREE.PointLightHelper(light);
      this.scene.add(pointLightHelper);
      this.lightHelpers.push(pointLightHelper);
    }
    
    return light;
  }
  
  createSpotLight(params = {}) {
    const {
      color = 0xffffff,
      intensity = 1,
      distance = 15,
      angle = Math.PI / 4,
      penumbra = 0.5,
      position = { x: 0, y: 0, z: 0 },
      target = { x: 0, y: 0, z: 0 },
      castShadow = this.settings.shadows,
      helper = this.debugMode
    } = params;
    
    // Create light
    const light = new THREE.SpotLight(color, intensity, distance, angle, penumbra);
    light.position.set(position.x, position.y, position.z);
    light.target.position.set(target.x, target.y, target.z);
    
    // Setup shadows
    light.castShadow = castShadow;
    if (castShadow) {
      light.shadow.mapSize.width = this.settings.shadowMapSize;
      light.shadow.mapSize.height = this.settings.shadowMapSize;
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = distance;
      light.shadow.radius = this.settings.shadowRadius;
    }
    
    // Add to scene and collection
    this.scene.add(light);
    this.scene.add(light.target);
    this.spotLights.push(light);
    
    // Create helper if in debug mode
    if (helper) {
      const spotLightHelper = new THREE.SpotLightHelper(light);
      this.scene.add(spotLightHelper);
      this.lightHelpers.push(spotLightHelper);
    }
    
    return light;
  }
  
  createEmergencyLight(params = {}) {
    const {
      color = this.settings.emergencyLightColor,
      intensity = this.settings.emergencyLightIntensity,
      distance = this.settings.emergencyLightDistance,
      position = { x: 0, y: 0, z: 0 },
      direction = { x: 0, y: -1, z: 0 },
      flickerSpeed = this.settings.emergencyLightFlickerSpeed,
      flickerIntensity = this.settings.emergencyLightFlickerIntensity
    } = params;
    
    // Create spotlight for emergency light
    const light = this.createSpotLight({
      color,
      intensity,
      distance,
      angle: Math.PI / 4,
      penumbra: 0.7,
      position,
      target: {
        x: position.x + direction.x,
        y: position.y + direction.y,
        z: position.z + direction.z
      }
    });
    
    // Add to emergency lights collection with flicker parameters
    const emergencyLight = {
      light,
      baseIntensity: intensity,
      flickerSpeed,
      flickerIntensity,
      phase: Math.random() * Math.PI * 2 // Random starting phase
    };
    
    this.emergencyLights.push(emergencyLight);
    
    return light;
  }
  
  toggleFlashlight() {
    if (!this.flashlight) return;
    
    this.settings.flashlightEnabled = !this.settings.flashlightEnabled;
    this.flashlight.visible = this.settings.flashlightEnabled;
    
    // Play flashlight toggle sound
    if (this.game.soundManager) {
      const soundName = this.settings.flashlightEnabled ? 'flashlightOn' : 'flashlightOff';
      this.game.soundManager.playSound(soundName);
    }
    
    return this.settings.flashlightEnabled;
  }
  
  activateMuzzleFlash(position) {
    if (!this.muzzleFlash) return;
    
    // Position the muzzle flash at the weapon position
    this.muzzleFlash.position.copy(position);
    
    // Make it visible and reset animation
    this.muzzleFlash.visible = true;
    this.muzzleFlash.intensity = 3;
    this.lightAnimations.muzzleFlash.timer = 0;
    this.lightAnimations.muzzleFlash.active = true;
  }
  
  update(deltaTime) {
    if (!this.settings.enabled) return;
    
    // Update player flashlight position and direction
    this.updateFlashlight();
    
    // Update light animations
    this.updateLightAnimations(deltaTime);
    
    // Update emergency lights (flicker effect)
    if (this.settings.dynamicLighting) {
      this.updateEmergencyLights(deltaTime);
    }
    
    // Update light culling
    if (this.settings.cullingEnabled) {
      this.updateLightCulling();
    }
    
    // Update debug helpers if enabled
    if (this.debugMode) {
      this.updateLightHelpers();
    }
  }
  
  updateFlashlight() {
    if (!this.flashlight || !this.settings.flashlightEnabled) return;
    
    const camera = this.game.camera;
    if (!camera) return;
    
    // Position the flashlight at the camera position with slight offset
    const vector = new THREE.Vector3(0.3, -0.2, 0.5);
    vector.applyQuaternion(camera.quaternion);
    this.flashlight.position.copy(camera.position).add(vector);
    
    // Point the flashlight in the camera's direction
    const targetPos = new THREE.Vector3(0, 0, -1);
    targetPos.applyQuaternion(camera.quaternion);
    targetPos.add(camera.position);
    this.flashlight.target.position.copy(targetPos);
  }
  
  updateLightAnimations(deltaTime) {
    // Update all registered light animations
    for (const key in this.lightAnimations) {
      if (this.lightAnimations[key].update && this.lightAnimations[key].active) {
        this.lightAnimations[key].update(deltaTime);
      }
    }
  }
  
  updateEmergencyLights(deltaTime) {
    const time = this.clock.getElapsedTime();
    
    for (const emergencyLight of this.emergencyLights) {
      // Generate flicker effect with sin wave and noise
      const flicker = Math.sin(time * emergencyLight.flickerSpeed + emergencyLight.phase);
      const noise = Math.random() * 0.2;
      
      // Calculate new intensity with flicker and noise
      const flickerAmount = emergencyLight.flickerIntensity * (flicker + noise);
      const newIntensity = emergencyLight.baseIntensity * (1 + flickerAmount);
      
      // Apply new intensity
      emergencyLight.light.intensity = Math.max(0, newIntensity);
    }
  }
  
  updateLightCulling() {
    const camera = this.game.camera;
    if (!camera) return;
    
    const cameraPosition = camera.position;
    let visiblePointLights = 0;
    let visibleSpotLights = 0;
    
    // Cull point lights
    for (const light of this.pointLights) {
      if (!light) continue;
      
      // Calculate distance to camera
      const distance = light.position.distanceTo(cameraPosition);
      
      // Determine if the light should be visible
      const shouldBeVisible = 
        distance <= this.settings.cullingDistance && 
        visiblePointLights < this.settings.maxVisiblePointLights;
      
      // Set visibility
      if (light.visible !== shouldBeVisible) {
        light.visible = shouldBeVisible;
      }
      
      if (shouldBeVisible) {
        visiblePointLights++;
      }
    }
    
    // Cull spot lights (except player flashlight)
    for (const light of this.spotLights) {
      if (!light || light === this.flashlight) continue;
      
      // Calculate distance to camera
      const distance = light.position.distanceTo(cameraPosition);
      
      // Determine if the light should be visible
      const shouldBeVisible = 
        distance <= this.settings.cullingDistance && 
        visibleSpotLights < this.settings.maxVisibleSpotLights;
      
      // Set visibility
      if (light.visible !== shouldBeVisible) {
        light.visible = shouldBeVisible;
      }
      
      if (shouldBeVisible) {
        visibleSpotLights++;
      }
    }
  }
  
  updateLightHelpers() {
    // Update all light helpers
    for (const helper of this.lightHelpers) {
      if (helper && helper.update) {
        helper.update();
      }
    }
  }
  
  setupBuildingLights(buildings) {
    if (!buildings || !buildings.length) return;
    
    // Add emergency lights to some buildings
    for (const building of buildings) {
      if (!building || Math.random() > 0.3) continue; // Only 30% of buildings get lights
      
      // Get the building bounds
      const bbox = new THREE.Box3().setFromObject(building);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      
      // Determine number of lights based on building size
      const numLights = Math.floor(Math.random() * 3) + 1; // 1-3 lights per building
      
      // Add emergency lights
      for (let i = 0; i < numLights; i++) {
        // Calculate position on the building
        const x = bbox.min.x + Math.random() * size.x;
        const z = bbox.min.z + Math.random() * size.z;
        const y = bbox.min.y + size.y * (0.5 + Math.random() * 0.4); // Upper half of the building
        
        // Determine light direction - point down and slightly outward
        const centerX = bbox.min.x + size.x / 2;
        const centerZ = bbox.min.z + size.z / 2;
        
        const dirX = (x - centerX) * 0.5; // Outward X component
        const dirY = -1; // Downward
        const dirZ = (z - centerZ) * 0.5; // Outward Z component
        
        // Normalize direction
        const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
        const normalizedDir = {
          x: dirX / length,
          y: dirY / length, 
          z: dirZ / length
        };
        
        // Create the emergency light
        this.createEmergencyLight({
          position: { x, y, z },
          direction: normalizedDir,
          flickerSpeed: 2 + Math.random() * 4, // Random flicker speed between 2-6
          flickerIntensity: 0.3 + Math.random() * 0.4 // Random intensity between 0.3-0.7
        });
      }
    }
  }
  
  setupStreetLights(streetLights) {
    if (!streetLights || !streetLights.length) return;
    
    for (const streetLight of streetLights) {
      if (!streetLight) continue;
      
      // Get position of the street light
      const position = new THREE.Vector3();
      streetLight.getWorldPosition(position);
      
      // Add light at the top of the street light
      position.y += 4; // Assuming street light is about 4 units tall
      
      // Create spot light pointing downward
      this.createSpotLight({
        position: { 
          x: position.x, 
          y: position.y, 
          z: position.z 
        },
        target: { 
          x: position.x, 
          y: position.y - 5, 
          z: position.z 
        },
        color: 0xffffaa, // Yellowish light
        intensity: 1.5,
        distance: 15,
        angle: Math.PI / 6,
        penumbra: 0.8
      });
    }
  }
  
  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    
    // Remove existing helpers
    for (const helper of this.lightHelpers) {
      this.scene.remove(helper);
    }
    this.lightHelpers = [];
    
    // If debug mode is now on, create new helpers
    if (this.debugMode) {
      // Add helper for flashlight
      if (this.flashlight) {
        const flashlightHelper = new THREE.SpotLightHelper(this.flashlight);
        this.scene.add(flashlightHelper);
        this.lightHelpers.push(flashlightHelper);
      }
      
      // Add helpers for point lights
      for (const light of this.pointLights) {
        const pointLightHelper = new THREE.PointLightHelper(light);
        this.scene.add(pointLightHelper);
        this.lightHelpers.push(pointLightHelper);
      }
      
      // Add helpers for spot lights
      for (const light of this.spotLights) {
        if (light !== this.flashlight) {
          const spotLightHelper = new THREE.SpotLightHelper(light);
          this.scene.add(spotLightHelper);
          this.lightHelpers.push(spotLightHelper);
        }
      }
    }
    
    return this.debugMode;
  }
  
  dispose() {
    // Remove all lights from scene
    if (this.flashlight) {
      this.scene.remove(this.flashlight);
      this.scene.remove(this.flashlight.target);
    }
    
    if (this.muzzleFlash) {
      this.scene.remove(this.muzzleFlash);
    }
    
    for (const light of this.pointLights) {
      this.scene.remove(light);
    }
    
    for (const light of this.spotLights) {
      this.scene.remove(light);
      this.scene.remove(light.target);
    }
    
    // Remove all helpers
    for (const helper of this.lightHelpers) {
      this.scene.remove(helper);
    }
    
    // Clear arrays
    this.pointLights = [];
    this.spotLights = [];
    this.emergencyLights = [];
    this.lightHelpers = [];
    
    // Clear references
    this.flashlight = null;
    this.muzzleFlash = null;
  }
} 