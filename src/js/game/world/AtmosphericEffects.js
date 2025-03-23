import * as THREE from 'three';

export class AtmosphericEffects {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    
    // Default settings
    this.settings = {
      // Fog settings
      fogEnabled: true,
      fogColor: 0x666666, // Dark grayish color
      fogDensity: 0.025,
      
      // Sky settings
      skyColor: 0x222233, // Dark blue-gray for apocalyptic feel
      
      // Lighting settings
      ambientColor: 0x444444,
      ambientIntensity: 1.2,
      
      sunColor: 0xffffaa, // Yellowish tint
      sunIntensity: 1.0,
      sunPosition: new THREE.Vector3(50, 100, 50),
      
      // Dynamic effects
      dynamicLighting: true,
      lightFlickerIntensity: 0.05,
      lightFlickerSpeed: 3.0,
      
      // Dust particles
      dustParticlesEnabled: true,
      dustParticleCount: 1000,
      dustParticleSize: 0.1,
      dustParticleColor: 0xCCCCCC,
      
      // Time of day
      timeOfDay: 'dusk', // dawn, day, dusk, night
    };
    
    // References to created effects
    this.fog = null;
    this.skybox = null;
    this.ambientLight = null;
    this.sunLight = null;
    this.dustParticles = null;
    
    // For dynamic effects
    this.clock = new THREE.Clock();
    this.originalIntensities = {};
  }
  
  init() {
    console.log('Initializing atmospheric effects...');
    
    // Apply effects based on quality settings
    this.applyQualitySettings();
    
    // Setup fog
    this.setupFog();
    
    // Setup sky
    this.setupSky();
    
    // Setup lighting
    this.setupLighting();
    
    // Setup dust particles
    if (this.settings.dustParticlesEnabled) {
      this.setupDustParticles();
    }
    
    // Apply time of day preset
    this.applyTimeOfDayPreset(this.settings.timeOfDay);
    
    console.log('Atmospheric effects initialized');
    return this;
  }
  
  applyQualitySettings() {
    const quality = this.game.settings.qualityLevel;
    
    switch (quality) {
      case 'low':
        this.settings.fogDensity = 0.04; // Higher density (shorter view distance)
        this.settings.dustParticlesEnabled = false;
        this.settings.dynamicLighting = false;
        break;
      case 'medium':
        this.settings.fogDensity = 0.03;
        this.settings.dustParticleCount = 500;
        this.settings.dynamicLighting = true;
        break;
      case 'high':
        this.settings.fogDensity = 0.025;
        this.settings.dustParticleCount = 1000;
        this.settings.dynamicLighting = true;
        break;
    }
  }
  
  setupFog() {
    if (this.settings.fogEnabled) {
      // Remove existing fog if any
      if (this.scene.fog) {
        this.scene.fog = null;
      }
      
      // Create exponential fog (more realistic for city environment)
      this.fog = new THREE.FogExp2(
        this.settings.fogColor,
        this.settings.fogDensity
      );
      this.scene.fog = this.fog;
      
      // Match scene background to fog color for consistency
      this.scene.background = new THREE.Color(this.settings.skyColor);
    }
  }
  
  setupSky() {
    // Create a skybox or skydome for more immersion
    // Using a simple color for now, but can be enhanced with actual skybox textures
    this.scene.background = new THREE.Color(this.settings.skyColor);
    
    // For high quality setting, we could add a more detailed sky with clouds
    if (this.game.settings.qualityLevel === 'high') {
      // Future enhancement: Add proper skybox with textures
    }
  }
  
  setupLighting() {
    // Clear existing lights
    if (this.ambientLight) this.scene.remove(this.ambientLight);
    if (this.sunLight) this.scene.remove(this.sunLight);
    
    // Create ambient light for overall scene illumination
    this.ambientLight = new THREE.AmbientLight(
      this.settings.ambientColor,
      this.settings.ambientIntensity
    );
    this.scene.add(this.ambientLight);
    
    // Create directional light to simulate sun
    this.sunLight = new THREE.DirectionalLight(
      this.settings.sunColor,
      this.settings.sunIntensity
    );
    this.sunLight.position.copy(this.settings.sunPosition);
    
    // Setup shadows for sun light
    if (this.game.settings.shadows) {
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = 2048;
      this.sunLight.shadow.mapSize.height = 2048;
      this.sunLight.shadow.camera.near = 0.5;
      this.sunLight.shadow.camera.far = 500;
      
      // Set shadow camera frustum to cover the city
      const citySize = this.game.city?.citySize || 100;
      this.sunLight.shadow.camera.left = -citySize/2;
      this.sunLight.shadow.camera.right = citySize/2;
      this.sunLight.shadow.camera.top = citySize/2;
      this.sunLight.shadow.camera.bottom = -citySize/2;
    }
    
    this.scene.add(this.sunLight);
    
    // Store original intensities for flickering effect
    this.originalIntensities = {
      ambient: this.settings.ambientIntensity,
      sun: this.settings.sunIntensity
    };
  }
  
  setupDustParticles() {
    // Create a particle system for dust floating in the air
    const particles = new THREE.BufferGeometry();
    const citySize = this.game.city?.citySize || 100;
    
    // Create positions for particles
    const positions = new Float32Array(this.settings.dustParticleCount * 3);
    
    for (let i = 0; i < this.settings.dustParticleCount; i++) {
      const i3 = i * 3;
      // Random positions within city bounds but higher up in the air
      positions[i3] = (Math.random() - 0.5) * citySize;
      positions[i3 + 1] = Math.random() * 30 + 2; // From 2 to 32 units above ground
      positions[i3 + 2] = (Math.random() - 0.5) * citySize;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create material for dust particles
    const particleMaterial = new THREE.PointsMaterial({
      color: this.settings.dustParticleColor,
      size: this.settings.dustParticleSize,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    // Create particle system
    this.dustParticles = new THREE.Points(particles, particleMaterial);
    this.scene.add(this.dustParticles);
  }
  
  applyTimeOfDayPreset(timeOfDay) {
    switch (timeOfDay) {
      case 'dawn':
        this.settings.fogColor = 0xcc9966;
        this.settings.skyColor = 0xdd9988;
        this.settings.ambientColor = 0x997766;
        this.settings.ambientIntensity = 1.0;
        this.settings.sunColor = 0xffcc88;
        this.settings.sunIntensity = 0.8;
        this.settings.sunPosition = new THREE.Vector3(50, 20, 50);
        break;
        
      case 'day':
        this.settings.fogColor = 0x888888;
        this.settings.skyColor = 0x667788;
        this.settings.ambientColor = 0x666666;
        this.settings.ambientIntensity = 1.2;
        this.settings.sunColor = 0xffffcc;
        this.settings.sunIntensity = 1.0;
        this.settings.sunPosition = new THREE.Vector3(50, 100, 50);
        break;
        
      case 'dusk':
        this.settings.fogColor = 0x554444;
        this.settings.skyColor = 0x442233;
        this.settings.ambientColor = 0x443333;
        this.settings.ambientIntensity = 0.9;
        this.settings.sunColor = 0xff7744;
        this.settings.sunIntensity = 0.7;
        this.settings.sunPosition = new THREE.Vector3(-50, 15, -50);
        break;
        
      case 'night':
        this.settings.fogColor = 0x222233;
        this.settings.skyColor = 0x111122;
        this.settings.ambientColor = 0x222233;
        this.settings.ambientIntensity = 0.6;
        this.settings.sunColor = 0x334455; // Moonlight
        this.settings.sunIntensity = 0.3;
        this.settings.sunPosition = new THREE.Vector3(-50, 40, -50);
        break;
    }
    
    // Apply the new settings
    this.setupFog();
    this.setupSky();
    
    // Update existing lights with new settings
    if (this.ambientLight) {
      this.ambientLight.color.set(this.settings.ambientColor);
      this.ambientLight.intensity = this.settings.ambientIntensity;
    }
    
    if (this.sunLight) {
      this.sunLight.color.set(this.settings.sunColor);
      this.sunLight.intensity = this.settings.sunIntensity;
      this.sunLight.position.copy(this.settings.sunPosition);
    }
    
    // Store updated original intensities
    this.originalIntensities = {
      ambient: this.settings.ambientIntensity,
      sun: this.settings.sunIntensity
    };
  }
  
  /**
   * Sets a preset for time of day and applies all visual effects
   * @param {string} preset - The preset name ('dawn', 'day', 'dusk', 'night')
   */
  setPreset(preset) {
    // Apply the preset settings
    this.applyTimeOfDayPreset(preset);
    
    // Update the time of day setting
    this.settings.timeOfDay = preset;
    
    // Update all visual components
    this.setupFog();
    this.setupSky();
    this.setupLighting();
    
    // If dust particles are enabled, update them
    if (this.settings.dustParticlesEnabled && this.dustParticles) {
      // Remove existing particles
      this.scene.remove(this.dustParticles);
      // Setup new particles with updated settings
      this.setupDustParticles();
    }
    
    return this;
  }
  
  update(deltaTime) {
    // Skip if paused
    if (this.game.paused) return;
    
    // Update dynamic lighting effects
    if (this.settings.dynamicLighting) {
      this.updateDynamicLighting(deltaTime);
    }
    
    // Update dust particles
    if (this.dustParticles) {
      this.updateDustParticles(deltaTime);
    }
  }
  
  updateDynamicLighting(deltaTime) {
    // Add subtle flicker to lights for atmosphere
    if (this.ambientLight && this.sunLight) {
      const time = this.clock.getElapsedTime();
      
      // Calculate flicker based on sine waves of different frequencies
      const flicker = Math.sin(time * this.settings.lightFlickerSpeed) * 
                      Math.sin(time * this.settings.lightFlickerSpeed * 0.5) * 
                      this.settings.lightFlickerIntensity;
      
      // Apply flicker to lights
      this.ambientLight.intensity = this.originalIntensities.ambient * (1 + flicker);
      this.sunLight.intensity = this.originalIntensities.sun * (1 + flicker * 0.5);
    }
  }
  
  updateDustParticles(deltaTime) {
    // Slowly move dust particles for atmospheric effect
    if (this.dustParticles) {
      const positions = this.dustParticles.geometry.attributes.position.array;
      const time = this.clock.getElapsedTime();
      
      for (let i = 0; i < this.settings.dustParticleCount; i++) {
        const i3 = i * 3;
        
        // Subtle movement based on sine waves and particle position
        positions[i3] += Math.sin(time + positions[i3 + 1] * 0.1) * 0.01;
        positions[i3 + 1] += Math.cos(time + positions[i3] * 0.1) * 0.005;
        positions[i3 + 2] += Math.sin(time * 0.8 + positions[i3 + 2] * 0.1) * 0.01;
        
        // Keep particles within bounds
        const citySize = this.game.city?.citySize || 100;
        const halfSize = citySize / 2;
        
        // Wrap around when particles leave the city area
        if (positions[i3] < -halfSize) positions[i3] = halfSize;
        if (positions[i3] > halfSize) positions[i3] = -halfSize;
        
        // Keep particles from going too high or too low
        if (positions[i3 + 1] < 2) positions[i3 + 1] = 30;
        if (positions[i3 + 1] > 32) positions[i3 + 1] = 2;
        
        if (positions[i3 + 2] < -halfSize) positions[i3 + 2] = halfSize;
        if (positions[i3 + 2] > halfSize) positions[i3 + 2] = -halfSize;
      }
      
      // Mark positions for update
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }
  }
  
  // Method to change time of day
  setTimeOfDay(timeOfDay) {
    if (['dawn', 'day', 'dusk', 'night'].includes(timeOfDay)) {
      this.settings.timeOfDay = timeOfDay;
      this.applyTimeOfDayPreset(timeOfDay);
    }
  }
  
  // Method to set fog density
  setFogDensity(density) {
    this.settings.fogDensity = density;
    if (this.fog) {
      this.fog.density = density;
    }
  }
  
  // Clean up resources
  dispose() {
    if (this.dustParticles) {
      this.scene.remove(this.dustParticles);
      this.dustParticles.geometry.dispose();
      this.dustParticles.material.dispose();
      this.dustParticles = null;
    }
    
    // Note: We don't remove lights as they might be referenced elsewhere
    console.log('Atmospheric effects resources disposed');
  }
} 