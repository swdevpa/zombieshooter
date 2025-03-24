import * as THREE from 'three';
import { City } from '../world/City.js';
import { BuildingGenerator } from '../world/BuildingGenerator.js';
import { TexturingSystem } from '../world/TexturingSystem.js';
import { AtmosphericEffects } from '../world/AtmosphericEffects.js';

export class CityManager {
  constructor(game) {
    this.game = game;
    this.city = null;
    this.buildingGenerator = null;
    this.texturingSystem = null;
    this.atmosphericEffects = null;
  }

  async init() {
    // Initialize systems
    this.texturingSystem = new TexturingSystem(this.game);
    await this.texturingSystem.init();

    this.buildingGenerator = new BuildingGenerator(this.game, this.texturingSystem);
    this.buildingGenerator.init();

    this.atmosphericEffects = new AtmosphericEffects(this.game);
    this.atmosphericEffects.init();

    // Create city with the correct configuration parameters
    this.city = new City(this.game, {
      citySize: {
        width: 100,
        height: 100
      },
      buildings: {
        maxHeight: 20,
        minHeight: 5
      }
    });
    
    // Initialize the city by generating it
    this.generateCity();
    
    return this;
  }

  generateCity(citySize = 10, difficulty = 'normal') {
    if (!this.city) {
      console.error('City not initialized');
      return;
    }
    
    // Generate city using the updated method
    const cityContainer = this.city.generate();
    
    // Add the city container to the game scene if not already added
    if (this.game.scene && cityContainer) {
      // Check if the container is already in the scene to avoid duplicates
      const existingIndex = this.game.scene.children.findIndex(child => child === cityContainer);
      if (existingIndex === -1) {
        this.game.scene.add(cityContainer);
      }
    }
    
    // Apply atmospheric effects
    this.applyAtmosphericEffects();
    
    return this.city;
  }
  
  applyAtmosphericEffects(timeOfDay = 'dusk') {
    if (!this.atmosphericEffects) {
      console.error('Atmospheric effects not initialized');
      return;
    }
    
    this.atmosphericEffects.applyTimeOfDayPreset(timeOfDay);
  }
  
  getCity() {
    return this.city;
  }
  
  getNavigationGrid() {
    if (!this.city) {
      console.error('City not initialized');
      return null;
    }
    
    return this.city.navigationGrid;
  }
  
  update(deltaTime) {
    if (this.city) {
      this.city.update(deltaTime);
    }
    
    if (this.atmosphericEffects) {
      this.atmosphericEffects.update(deltaTime);
    }
  }
  
  reset() {
    if (this.city) {
      this.city.reset();
    }
  }
} 