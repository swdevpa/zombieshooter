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

    // Create city
    this.city = new City(this.game, this.buildingGenerator, this.texturingSystem);
    await this.city.init();
    
    return this;
  }

  generateCity(citySize = 10, difficulty = 'normal') {
    if (!this.city) {
      console.error('City not initialized');
      return;
    }
    
    // Generate city with the specified parameters
    this.city.generate(citySize, difficulty);
    
    // Apply atmospheric effects
    this.applyAtmosphericEffects();
    
    return this.city;
  }
  
  applyAtmosphericEffects(timeOfDay = 'dusk') {
    if (!this.atmosphericEffects) {
      console.error('Atmospheric effects not initialized');
      return;
    }
    
    this.atmosphericEffects.apply(timeOfDay);
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