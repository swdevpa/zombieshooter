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
    // Load assets
    await assetLoader.loadAssets();
    
    // Hide loading screen
    document.getElementById('loading').style.display = 'none';
    
    // Initialize game
    game = new Game(assetLoader);
    game.init();
    
    // Start animation loop
    animate();
    
    // Add event listener for restart button
    document.getElementById('restart').addEventListener('click', () => {
      document.getElementById('game-over').style.display = 'none';
      game.restart();
    });
  } catch (error) {
    // console.error('Error initializing game:', error);
    document.getElementById('loading').textContent = 'Error loading game. Please refresh.';
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  if (game) {
    game.update();
    game.render();
  }
}

// Start initializing the game
init(); 