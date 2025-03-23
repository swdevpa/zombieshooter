import * as THREE from 'three';
import { Game } from './game/Game.js';
import { AssetLoader } from './utils/AssetLoader.js';
import { PixelFilter } from './utils/PixelFilter.js';

// Global variables
let game;
const assetLoader = new AssetLoader();

// Initialize the game when assets are loaded
async function init() {
  try {
    console.log('Starting game initialization...');

    // Load assets
    await assetLoader.loadAssets();

    // Hide loading screen
    document.getElementById('loading').style.display = 'none';

    // Get the game container element
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
      // If container doesn't exist, create it
      const container = document.createElement('div');
      container.id = 'game-container';
      document.body.appendChild(container);
      
      // Initialize game with container
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
    game.init();
    console.log('Game initialization complete, starting animation loop');

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
    console.error('Error initializing game:', error);
    document.getElementById('loading').textContent =
      `Error loading game: ${error.message}. Please refresh.`;
    document.getElementById('loading').style.color = 'red';
  }
}

// Animation loop
function animate() {
  try {
    // Schedule next frame
    requestAnimationFrame(animate);

    if (!game) {
      console.warn('Game object not initialized yet');
      return;
    }

    // Check if DOM is still accessible
    if (!document.body) {
      console.error('Document body not accessible');
      return;
    }

    // Check if renderer is attached to DOM
    if (game.renderer && game.renderer.domElement && !game.renderer.domElement.parentNode) {
      console.error('Renderer not attached to DOM');
      // Try reattaching
      try {
        document.body.appendChild(game.renderer.domElement);
        console.log('Reattached renderer to DOM');
      } catch (attachError) {
        console.error('Failed to reattach renderer:', attachError);
      }
    }

    // Only update if game exists
    if (game) {
      try {
        game.update();
      } catch (updateError) {
        console.error('Detailed update error:', updateError, updateError.stack);
      }

      try {
        game.render();
      } catch (renderError) {
        console.error('Detailed render error:', renderError, renderError.stack);
      }
    }
  } catch (error) {
    console.error('Critical error in animation loop:', error, error.stack);

    // Try to recover by re-initializing if severe error
    if (error instanceof TypeError && error.message.includes('undefined')) {
      console.warn('Attempting to recover from undefined error...');
      // No need to re-initialize the entire game, as it would likely recreate the error
    }
  }
}

// Start initializing the game
init();
