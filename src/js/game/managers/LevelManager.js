import { City } from '../world/City.js';

export class LevelManager {
  constructor(game) {
    this.game = game;
    this.currentLevel = 0;
    this.city = null;
    this.levelData = {
      1: {
        name: 'Downtown',
        difficulty: 'easy',
        zombieSpawnRate: 5,
        maxZombies: 20,
        waveCount: 3,
        citySize: {
          width: 500,
          height: 500,
        },
        buildings: {
          minCount: 15,
          maxCount: 25,
          minHeight: 10,
          maxHeight: 50,
        },
      },
      2: {
        name: 'Commercial District',
        difficulty: 'medium',
        zombieSpawnRate: 7,
        maxZombies: 30,
        waveCount: 5,
        citySize: {
          width: 600,
          height: 600,
        },
        buildings: {
          minCount: 20,
          maxCount: 35,
          minHeight: 20,
          maxHeight: 70,
        },
      },
      3: {
        name: 'Downtown',
        difficulty: 'hard',
        zombieSpawnRate: 10,
        maxZombies: 50,
        waveCount: 7,
        citySize: {
          width: 700,
          height: 700,
        },
        buildings: {
          minCount: 30,
          maxCount: 50,
          minHeight: 30,
          maxHeight: 100,
        },
      },
    };
  }

  init() {
    console.log('LevelManager initialized');
    // Default to level 1 when game starts
    this.currentLevel = 1;
    // Additional initialization can be added here if needed
  }

  async loadLevel(levelNumber) {
    if (!this.levelData[levelNumber]) {
      console.error(`Level ${levelNumber} does not exist!`);
      return false;
    }

    this.currentLevel = levelNumber;
    const levelConfig = this.levelData[levelNumber];

    // Clear any existing level
    this.clearCurrentLevel();

    // Create new city based on level data
    this.city = new City(this.game, levelConfig);
    await this.city.generate();

    // Add city to the scene
    this.game.scene.add(this.city.cityGroup);
    
    // IMPORTANT: Set the city reference on the game object
    this.game.city = this.city;

    // Set player position at the start position
    if (this.game.player) {
      const startPosition = this.city.getPlayerStartPosition();
      this.game.player.container.position.copy(startPosition);
    }

    // Configure zombie manager with level settings
    if (this.game.zombieManager) {
      this.game.zombieManager.configure({
        spawnRate: levelConfig.zombieSpawnRate,
        maxZombies: levelConfig.maxZombies,
        waveCount: levelConfig.waveCount,
      });
    }

    // Notify UI of level change
    if (this.game.uiManager && this.game.uiManager.ui) {
      this.game.uiManager.updateWave(1); // Start at wave 1
    }

    console.log(`Level ${levelNumber} (${levelConfig.name}) loaded successfully.`);
    return true;
  }

  clearCurrentLevel() {
    // Remove current city if it exists
    if (this.city && this.city.cityGroup) {
      this.game.scene.remove(this.city.cityGroup);
      // Clean up resources
      this.city.dispose();
    }

    // Reset any level-specific state
    this.city = null;
    
    // Also clear reference on game object
    this.game.city = null;
  }

  getCurrentLevelData() {
    return this.levelData[this.currentLevel];
  }

  nextLevel() {
    const nextLevelNumber = this.currentLevel + 1;
    if (this.levelData[nextLevelNumber]) {
      return this.loadLevel(nextLevelNumber);
    } else {
      console.log('No more levels available. Game complete!');
      return false;
    }
  }

  restartCurrentLevel() {
    return this.loadLevel(this.currentLevel);
  }
}
