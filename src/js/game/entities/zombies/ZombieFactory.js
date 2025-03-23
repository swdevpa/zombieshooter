import { StandardZombieModel } from './models/StandardZombieModel.js';
import { RunnerZombieModel } from './models/RunnerZombieModel.js';
import { BruteZombieModel } from './models/BruteZombieModel.js';

/**
 * ZombieFactory - Creates and manages different types of zombie models
 * Handles zombie type creation and variation selection
 */
export class ZombieFactory {
  constructor(assetLoader) {
    this.assetLoader = assetLoader;
    
    // Zombie model cache - reuse models with the same parameters
    this.modelCache = {
      standard: {},
      runner: {},
      brute: {}
    };
  }
  
  /**
   * Create a zombie model of the specified type
   * @param {string} type - Type of zombie to create (standard, runner, brute)
   * @param {object} options - Additional options for the zombie model
   * @returns {ZombieModel} The created zombie model
   */
  createZombieModel(type = 'standard', options = {}) {
    // Default options
    const defaultOptions = {
      detailLevel: 2,
      variation: Math.floor(Math.random() * 4) // Random variation
    };
    
    // Merge with provided options
    const finalOptions = {
      ...defaultOptions,
      ...options
    };
    
    // Create the appropriate zombie type
    let zombieModel;
    
    switch (type.toLowerCase()) {
      case 'runner':
        zombieModel = new RunnerZombieModel(this.assetLoader, finalOptions);
        break;
        
      case 'brute':
        zombieModel = new BruteZombieModel(this.assetLoader, finalOptions);
        break;
        
      case 'standard':
      default:
        zombieModel = new StandardZombieModel(this.assetLoader, finalOptions);
        break;
    }
    
    // Initialize the model
    zombieModel.init();
    
    return zombieModel;
  }
  
  /**
   * Get zombie properties based on type
   * Used by Zombie class to configure behavior
   */
  getZombieProperties(type = 'standard') {
    // Base properties for different zombie types
    const properties = {
      standard: {
        health: 100,
        maxHealth: 100,
        damage: 10,
        speed: 2.0,
        attackRange: 0.8,
        attackSpeed: 1.0,
        points: 50
      },
      runner: {
        health: 70,
        maxHealth: 70,
        damage: 8,
        speed: 4.0,
        attackRange: 0.7,
        attackSpeed: 0.7,
        points: 75
      },
      brute: {
        health: 200,
        maxHealth: 200,
        damage: 20,
        speed: 1.2,
        attackRange: 1.0,
        attackSpeed: 1.5,
        points: 100
      }
    };
    
    // Return properties for requested type or standard if not found
    return properties[type.toLowerCase()] || properties.standard;
  }
  
  /**
   * Get a mix of zombie types for a wave
   * @param {number} wave - Current wave number
   * @param {number} count - Number of zombies to generate
   * @returns {Array} Array of zombie type strings
   */
  getZombieTypesForWave(wave, count) {
    const types = [];
    
    // Calculate probabilities based on wave number
    const runnerProbability = Math.min(0.05 + (wave * 0.03), 0.4);
    const bruteProbability = Math.min(0.02 + (wave * 0.02), 0.3);
    
    // Generate zombie types
    for (let i = 0; i < count; i++) {
      const random = Math.random();
      
      if (random < bruteProbability) {
        types.push('brute');
      } else if (random < bruteProbability + runnerProbability) {
        types.push('runner');
      } else {
        types.push('standard');
      }
    }
    
    return types;
  }
} 