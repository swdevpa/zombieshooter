import { StandardZombieModel } from './models/StandardZombieModel.js';
import { RunnerZombieModel } from './models/RunnerZombieModel.js';
import { BruteZombieModel } from './models/BruteZombieModel.js';
import { ExploderZombieModel } from './models/ExploderZombieModel.js';
import { SpitterZombieModel } from './models/SpitterZombieModel.js';
import { ScreamerZombieModel } from './models/ScreamerZombieModel.js';

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
      brute: {},
      exploder: {},
      spitter: {},
      screamer: {}
    };
  }
  
  /**
   * Create a zombie model of the specified type
   * @param {string} type - Type of zombie to create (standard, runner, brute, exploder, spitter, screamer)
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
        
      case 'exploder':
        zombieModel = new ExploderZombieModel(this.assetLoader, finalOptions);
        break;
        
      case 'spitter':
        zombieModel = new SpitterZombieModel(this.assetLoader, finalOptions);
        break;
        
      case 'screamer':
        zombieModel = new ScreamerZombieModel(this.assetLoader, finalOptions);
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
      },
      exploder: {
        health: 80,
        maxHealth: 80,
        damage: 15,  // Direct damage
        speed: 1.8,
        attackRange: 0.8,
        attackSpeed: 1.2,
        points: 125,
        explosionDamage: 30, // Explosion damage
        explosionRadius: 3.0 // Explosion radius
      },
      spitter: {
        health: 90,
        maxHealth: 90,
        damage: 7,  // Direct physical damage
        speed: 1.7,
        attackRange: 5.0, // Can attack from distance
        attackSpeed: 2.0, // Slower attack rate
        points: 100,
        projectileDamage: 12, // Acid projectile damage
        projectileSpeed: 10.0, // Acid projectile speed
        acidDuration: 3.0 // Duration of acid effects
      },
      screamer: {
        health: 60,
        maxHealth: 60,
        damage: 6,  // Direct damage (weak)
        speed: 1.5,
        attackRange: 0.6,
        attackSpeed: 1.0,
        points: 150,
        screamRadius: 15.0, // Radius for alerting other zombies
        screamCooldown: 8.0 // Seconds between screams
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
    const runnerProbability = Math.min(0.05 + (wave * 0.02), 0.3);
    const bruteProbability = Math.min(0.02 + (wave * 0.015), 0.25);
    
    // Special zombie types appear later in the game and have lower probabilities
    const exploderProbability = wave >= 3 ? Math.min(0.01 + ((wave - 3) * 0.015), 0.2) : 0;
    const spitterProbability = wave >= 5 ? Math.min(0.01 + ((wave - 5) * 0.01), 0.15) : 0;
    const screamerProbability = wave >= 7 ? Math.min(0.01 + ((wave - 7) * 0.005), 0.1) : 0;
    
    // Generate zombie types
    for (let i = 0; i < count; i++) {
      const random = Math.random();
      let totalProb = 0;
      
      // Check each type in order of priority
      if (random < (totalProb += screamerProbability)) {
        types.push('screamer');
      } else if (random < (totalProb += spitterProbability)) {
        types.push('spitter');
      } else if (random < (totalProb += exploderProbability)) {
        types.push('exploder');
      } else if (random < (totalProb += bruteProbability)) {
        types.push('brute');
      } else if (random < (totalProb += runnerProbability)) {
        types.push('runner');
      } else {
        types.push('standard');
      }
    }
    
    return types;
  }

  /**
   * Get zombie types for boss waves
   * @param {number} wave - Current wave number
   * @param {number} count - Number of zombies to generate
   * @returns {Array} Array of zombie type strings
   */
  getBossWaveZombieTypes(wave, count) {
    const types = [];
    const bossWaveNumber = Math.floor(wave / 5); // Boss wave counter (first boss = 1, etc.)
    
    // Different boss waves have different zombie type distributions
    let bruteProbability, runnerProbability, exploderProbability, spitterProbability, screamerProbability;
    
    switch (bossWaveNumber % 5) {
      case 0: // First boss type - more brutes
        bruteProbability = 0.5;
        runnerProbability = 0.2;
        exploderProbability = 0.1;
        spitterProbability = 0.05;
        screamerProbability = 0.05;
        break;
      case 1: // Second boss type - more runners
        bruteProbability = 0.2;
        runnerProbability = 0.5;
        exploderProbability = 0.1;
        spitterProbability = 0.1;
        screamerProbability = 0.05;
        break;
      case 2: // Third boss type - explosive wave
        bruteProbability = 0.2;
        runnerProbability = 0.1;
        exploderProbability = 0.5;
        spitterProbability = 0.1;
        screamerProbability = 0.05;
        break;
      case 3: // Fourth boss type - acid wave
        bruteProbability = 0.1;
        runnerProbability = 0.1;
        exploderProbability = 0.1;
        spitterProbability = 0.5;
        screamerProbability = 0.1;
        break;
      case 4: // Fifth boss type - screamer wave
        bruteProbability = 0.1;
        runnerProbability = 0.1;
        exploderProbability = 0.1;
        spitterProbability = 0.1;
        screamerProbability = 0.4;
        break;
      default:
        bruteProbability = 0.2;
        runnerProbability = 0.2;
        exploderProbability = 0.2;
        spitterProbability = 0.2;
        screamerProbability = 0.1;
    }
    
    // After wave 15, start mixing multiple special types in boss waves
    if (wave >= 15) {
      // Further specialize later boss waves with more challenging combinations
      bruteProbability += 0.05;
      
      // After wave 20, more emphasis on special types
      if (wave >= 20) {
        exploderProbability += 0.1;
        spitterProbability += 0.05;
        screamerProbability += 0.05;
        // Reduce standard zombies in later waves
        runnerProbability -= 0.05;
      }
    }
    
    // Generate zombie types
    for (let i = 0; i < count; i++) {
      const random = Math.random();
      let totalProb = 0;
      
      // Check each type in order of priority
      if (random < (totalProb += screamerProbability)) {
        types.push('screamer');
      } else if (random < (totalProb += spitterProbability)) {
        types.push('spitter');
      } else if (random < (totalProb += exploderProbability)) {
        types.push('exploder');
      } else if (random < (totalProb += bruteProbability)) {
        types.push('brute');
      } else if (random < (totalProb += runnerProbability)) {
        types.push('runner');
      } else {
        types.push('standard');
      }
    }
    
    return types;
  }
} 