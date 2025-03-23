import * as THREE from 'three';
import { Game } from './game/Game.js';
import { AssetLoader } from './utils/AssetLoader.js';
import { AssetManager } from './utils/AssetManager.js';
import { PixelFilter } from './utils/PixelFilter.js';

// Global variables
let game;
const assetLoader = new AssetLoader();
let assetManager;

// Initialize the game when assets are loaded
async function init() {
  try {
    console.log('Starting game initialization...');

    // Create asset manager for optimized asset handling
    assetManager = new AssetManager(assetLoader, null);
    await assetManager.init();
    console.log('Asset Manager initialized');

    // Load assets with optimization
    await assetLoader.loadAssets();
    
    // Track asset loading completion
    console.log('Assets loaded successfully');
    
    // Add asset memory tracking to console
    if (assetManager) {
      assetManager.updateMemoryUsage();
      console.log(`Initial memory usage: ${assetManager.memoryUsage.total}MB (textures: ${assetManager.memoryUsage.textures}MB)`);
    }

    // Hide loading screen
    document.getElementById('loading').style.display = 'none';

    // Get the game container element
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
      // If container doesn't exist, create it
      const container = document.createElement('div');
      container.id = 'game-container';
      document.body.appendChild(container);
      
      // Initialize game with container and asset management
      game = new Game(container, assetLoader);
    } else {
      // Initialize game with existing container
      game = new Game(gameContainer, assetLoader);
    }

    // Add window error handler for debugging
    window.addEventListener('error', function (e) {
      console.error('Global error caught:', e.message, e.filename, e.lineno);
      alert(`Error: ${e.message} at ${e.filename}:${e.lineno}`);
    });

    console.log('Game object created, initializing...');
    
    // Initialize and start the game
    await game.init();
    console.log('Game initialization complete, starting animation loop');

    // Add keyboard shortcut to optimize memory (Shift+M)
    window.addEventListener('keydown', function(e) {
      if (e.key === 'M' && e.shiftKey) {
        console.log('Manual memory optimization triggered');
        if (game && game.assetManager) {
          game.assetManager.performMemoryOptimization();
        }
      }
    });

    // Start animation loop
    animate();

    // Add event listener for restart button
    document.getElementById('restart').addEventListener('click', () => {
      if (game.gameStateManager) {
        game.gameStateManager.changeState(game.gameStateManager.states.PLAYING);
      } else {
        // Fallback for older code
        document.getElementById('game-over').style.display = 'none';
        game.restart();
      }
    });
  } catch (error) {
    console.error('Error during game initialization:', error);
    alert('Failed to initialize game: ' + error.message);
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  if (game && game.running) {
    game.update();
  }
}

// Initialize the game when the window loads
window.addEventListener('load', init);
