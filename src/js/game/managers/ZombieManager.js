import * as THREE from 'three';
import { Zombie } from '../entities/Zombie.js';

export class ZombieManager {
  constructor(game, assetLoader) {
    this.game = game;
    this.assetLoader = assetLoader;
    
    // Zombie management
    this.zombies = [];
    this.maxZombies = 20; // Maximum zombies allowed at once
    this.zombiesPerWave = 10; // Base number of zombies per wave
    this.zombiesRemaining = 0;
    this.isSpawning = false;
    
    // Spawn points will be determined when the map is loaded
    this.spawnPoints = [];
    
    // Debug visualization
    this.debugMode = false; // Set to true to show spawn points
    this.debugMarkers = [];
  }
  
  init() {
    // Called when map is loaded to setup spawn points
    this.determineSpawnPoints();
    
    // Check for debug mode
    if (window.location.search.includes('debug=true')) {
      this.debugMode = true;
      console.log("Zombie manager debug mode enabled");
    }
  }
  
  // Create visual markers for spawn points in debug mode
  visualizeSpawnPoints() {
    if (!this.debugMode) return;
    
    // Clear previous markers
    for (const marker of this.debugMarkers) {
      this.game.scene.remove(marker);
    }
    this.debugMarkers = [];
    
    // Create new markers
    for (const spawnPoint of this.spawnPoints) {
      const geometry = new THREE.SphereGeometry(0.3, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.copy(spawnPoint);
      marker.position.y = 0.5; // Lift slightly above ground
      
      this.game.scene.add(marker);
      this.debugMarkers.push(marker);
    }
    
    console.log(`Visualized ${this.spawnPoints.length} spawn points`);
  }
  
  determineSpawnPoints() {
    // Clear existing spawn points
    this.spawnPoints = [];
    
    // Create spawn points around the edges of the map
    const mapWidth = this.game.map.width;
    const mapHeight = this.game.map.height;
    const tileSize = this.game.map.tileSize;
    const mapOffsetX = this.game.map.container.position.x;
    const mapOffsetZ = this.game.map.container.position.z;
    
    // Check edges with finer spacing to find more potential spawn points
    // Check every tile instead of every 5 tiles
    for (let x = 0; x < mapWidth; x++) {
      // Top edge
      this.addSpawnPoint(
        mapOffsetX + x * tileSize,
        mapOffsetZ
      );
      
      // Bottom edge
      this.addSpawnPoint(
        mapOffsetX + x * tileSize,
        mapOffsetZ + (mapHeight - 1) * tileSize
      );
    }
    
    for (let z = 0; z < mapHeight; z++) {
      // Left edge
      this.addSpawnPoint(
        mapOffsetX,
        mapOffsetZ + z * tileSize
      );
      
      // Right edge
      this.addSpawnPoint(
        mapOffsetX + (mapWidth - 1) * tileSize,
        mapOffsetZ + z * tileSize
      );
    }
    
    // If we found no spawn points, also check one tile in from the edges
    if (this.spawnPoints.length === 0) {
      for (let x = 1; x < mapWidth - 1; x++) {
        // One in from top
        this.addSpawnPoint(
          mapOffsetX + x * tileSize,
          mapOffsetZ + 1 * tileSize
        );
        
        // One in from bottom
        this.addSpawnPoint(
          mapOffsetX + x * tileSize,
          mapOffsetZ + (mapHeight - 2) * tileSize
        );
      }
      
      for (let z = 1; z < mapHeight - 1; z++) {
        // One in from left
        this.addSpawnPoint(
          mapOffsetX + 1 * tileSize,
          mapOffsetZ + z * tileSize
        );
        
        // One in from right
        this.addSpawnPoint(
          mapOffsetX + (mapWidth - 2) * tileSize,
          mapOffsetZ + z * tileSize
        );
      }
    }
    
    // If we still found no spawn points, check random positions inside the map
    if (this.spawnPoints.length === 0) {
      console.warn("No spawn points found at edges, trying random positions");
      for (let i = 0; i < 100; i++) {
        const randomX = Math.floor(Math.random() * (mapWidth - 4)) + 2;
        const randomZ = Math.floor(Math.random() * (mapHeight - 4)) + 2;
        
        this.addSpawnPoint(
          mapOffsetX + randomX * tileSize,
          mapOffsetZ + randomZ * tileSize
        );
      }
    }
    
    console.log(`Found ${this.spawnPoints.length} valid spawn points`);
    
    // Visualize spawn points in debug mode
    this.visualizeSpawnPoints();
  }
  
  addSpawnPoint(x, z) {
    // Check if position is walkable
    if (this.game.map.isTileWalkable(x, z)) {
      // Additional check to make sure spawn point is not too close to water
      // Check a radius around the spawn point to ensure zombies won't immediately walk into water
      const safeRadius = 1.0; // Safety radius around spawn point
      const checkPoints = [
        { x: x + safeRadius, z: z + safeRadius },
        { x: x + safeRadius, z: z - safeRadius },
        { x: x - safeRadius, z: z + safeRadius },
        { x: x - safeRadius, z: z - safeRadius },
        { x: x + safeRadius, z: z },
        { x: x - safeRadius, z: z },
        { x: x, z: z + safeRadius },
        { x: x, z: z - safeRadius }
      ];
      
      // Count how many surrounding points are walkable
      let walkablePoints = 0;
      for (const point of checkPoints) {
        if (this.game.map.isTileWalkable(point.x, point.z)) {
          walkablePoints++;
        }
      }
      
      // Only add spawn point if at least 6 of 8 surrounding points are walkable
      // This ensures zombies spawn on solid land, not near water edges
      if (walkablePoints >= 6) {
        this.spawnPoints.push(new THREE.Vector3(x, 0, z));
      }
    }
  }
  
  // Validate that spawn points have a valid path to the player
  validateSpawnPoints() {
    // Get player position on grid
    const playerPos = this.game.player.container.position;
    const mapOffsetX = this.game.map.container.position.x;
    const mapOffsetZ = this.game.map.container.position.z;
    const tileSize = this.game.map.tileSize;
    
    const playerGridX = Math.floor((playerPos.x - mapOffsetX) / tileSize);
    const playerGridZ = Math.floor((playerPos.z - mapOffsetZ) / tileSize);
    
    console.log(`Player position on grid: (${playerGridX}, ${playerGridZ})`);
    
    // Calculate which tiles are reachable from the player's position
    const grid = this.game.map.navigationGrid;
    if (!grid) {
      console.error("Navigation grid is undefined!");
      return;
    }
    
    const width = this.game.map.width;
    const height = this.game.map.height;
    
    // Initialize reachability map
    const reachable = Array(height).fill().map(() => Array(width).fill(false));
    
    // Check if player is on a valid tile
    if (playerGridX < 0 || playerGridX >= width || playerGridZ < 0 || playerGridZ >= height) {
      console.warn("Player is outside the grid bounds!");
      return;
    }
    
    if (grid[playerGridZ][playerGridX] === 0) {
      console.warn("Player is on a non-walkable tile!");
      return;
    }
    
    // Debug output for grid around player
    console.log("Grid values around player:");
    for(let z = Math.max(0, playerGridZ-1); z <= Math.min(height-1, playerGridZ+1); z++) {
      let rowStr = "";
      for(let x = Math.max(0, playerGridX-1); x <= Math.min(width-1, playerGridX+1); x++) {
        rowStr += `(${x},${z}):${grid[z][x]} `;
      }
      console.log(rowStr);
    }
    
    // Using a simple BFS to find reachable areas from player
    const queue = [{x: playerGridX, z: playerGridZ}];
    reachable[playerGridZ][playerGridX] = true;
    
    // BFS to mark all reachable cells
    while (queue.length > 0) {
      const current = queue.shift();
      const {x, z} = current;
      
      // Check all 4 directions
      const directions = [
        {dx: 1, dz: 0},
        {dx: -1, dz: 0},
        {dx: 0, dz: 1},
        {dx: 0, dz: -1}
      ];
      
      for (const dir of directions) {
        const newX = x + dir.dx;
        const newZ = z + dir.dz;
        
        // Check bounds
        if (newX < 0 || newX >= this.game.map.width || newZ < 0 || newZ >= this.game.map.height) {
          continue;
        }
        
        // Check if walkable and not visited
        if (grid[newZ][newX] === 1 && !reachable[newZ][newX]) {
          reachable[newZ][newX] = true;
          queue.push({x: newX, z: newZ});
        }
      }
    }
    
    // Check each spawn point if it's reachable from player
    const validSpawnPoints = [];
    
    for (const point of this.spawnPoints) {
      // Convert spawn point to grid coordinates
      const gridX = Math.floor((point.x - mapOffsetX) / tileSize);
      const gridZ = Math.floor((point.z - mapOffsetZ) / tileSize);
      
      // Check if this spawn point is in a valid grid cell
      if (gridX < 0 || gridX >= this.game.map.width || gridZ < 0 || gridZ >= this.game.map.height) {
        continue;
      }
      
      // Check if this point is reachable from player
      if (reachable[gridZ][gridX]) {
        validSpawnPoints.push(point);
      }
    }
    
    // Update spawn points to only include valid ones
    this.spawnPoints = validSpawnPoints;
    console.log(`Validated spawn points: ${this.spawnPoints.length} valid out of original spawn points`);
  }
  
  startNewWave(waveNumber) {
    if (this.isSpawning) return;
    
    console.log(`===== STARTING NEW WAVE ${waveNumber} =====`);
    
    // Always recalculate spawn points for new waves
    // This ensures they work with procedural maps
    this.determineSpawnPoints();
    
    // Validate spawn points to ensure they have a path to player
    this.validateSpawnPoints();
    
    // If no spawn points were found, create a fallback spawn point
    if (this.spawnPoints.length === 0) {
      console.error("No valid spawn points found! Using fallback spawn point");
      // Use a point far from the player as a fallback
      const playerPos = this.game.player.container.position;
      
      // Try several directions until we find a walkable tile
      const directions = [
        {x: 15, z: 0},
        {x: -15, z: 0},
        {x: 0, z: 15},
        {x: 0, z: -15},
        {x: 10, z: 10},
        {x: -10, z: 10},
        {x: 10, z: -10},
        {x: -10, z: -10}
      ];
      
      let foundWalkable = false;
      
      for (const dir of directions) {
        const testPos = new THREE.Vector3(
          playerPos.x + dir.x,
          0,
          playerPos.z + dir.z
        );
        
        if (this.game.map.isTileWalkable(testPos.x, testPos.z)) {
          this.spawnPoints.push(testPos);
          foundWalkable = true;
          console.log("Found walkable fallback spawn point");
          break;
        }
      }
      
      // Last resort - just create a spawn point and hope for the best
      if (!foundWalkable) {
        const fallbackPos = new THREE.Vector3(
          playerPos.x + 15,
          0,
          playerPos.z + 15
        );
        this.spawnPoints.push(fallbackPos);
        console.warn("Using non-walkable fallback spawn point as last resort");
      }
    }
    
    // Update debug visualization 
    this.visualizeSpawnPoints();
    
    console.log(`Spawn Points available: ${this.spawnPoints.length}`);
    
    this.isSpawning = true;
    
    // Calculate zombies for this wave
    // Cap the maximum number of zombies per wave to prevent overwhelming numbers
    const baseZombies = this.zombiesPerWave;
    const extraZombies = Math.min((waveNumber - 1) * 5, 50); // Cap extra zombies at 50
    this.zombiesRemaining = baseZombies + extraZombies;
    
    console.log(`Starting wave ${waveNumber} with ${this.zombiesRemaining} zombies`);
    
    // Update game state
    this.game.gameState.zombiesSpawned = 0;
    this.game.gameState.zombiesKilled = 0; // Reset zombies killed counter for new wave
    
    // Start spawning
    this.spawnZombies();
  }
  
  spawnZombies() {
    // Set spawning flag
    this.isSpawning = true;
    
    console.log(`Starting zombie spawning with ${this.zombiesRemaining} zombies to spawn.`);
    
    // Spawn mit größerer Verzögerung, damit Zombies mehr Zeit haben
    const spawnInterval = setInterval(() => {
      // Stop if no more zombies to spawn or we hit the max
      if (this.zombiesRemaining <= 0 || this.zombies.length >= this.maxZombies) {
        clearInterval(spawnInterval);
        this.isSpawning = false;
        console.log(`Spawn complete. Remaining: ${this.zombiesRemaining}, active: ${this.zombies.length}`);
        return;
      }
      
      // Spawn a zombie
      this.spawnZombie();
      this.zombiesRemaining--;
      this.game.gameState.zombiesSpawned++;
      
      // Debug-Ausgabe
      console.log(`Zombie spawned (${this.zombies.length} active, ${this.zombiesRemaining} remaining, spawned: ${this.game.gameState.zombiesSpawned})`);
      
    }, 2000); // Spawn a zombie every 2 seconds instead of 1 second
  }
  
  spawnZombie() {
    // Pick a random spawn point
    const spawnPointIndex = Math.floor(Math.random() * this.spawnPoints.length);
    const spawnPosition = this.spawnPoints[spawnPointIndex].clone();
    
    // Create zombie
    const zombie = new Zombie(this.game, this.assetLoader, spawnPosition);
    
    // Add to game
    this.game.scene.add(zombie.container);
    this.zombies.push(zombie);
  }
  
  update(deltaTime) {
    // Update all zombies
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const zombie = this.zombies[i];
      
      // Update zombie
      zombie.update(deltaTime);
      
      // Remove zombie if it's dead and animation is done
      if (!zombie.isAlive && zombie.animationComplete) {
        this.zombies.splice(i, 1);
      }
    }
  }
  
  clearAllZombies() {
    // Remove all zombies from the scene
    for (const zombie of this.zombies) {
      this.game.scene.remove(zombie.container);
    }
    
    // Clear array
    this.zombies = [];
    this.zombiesRemaining = 0;
    this.isSpawning = false;
  }
  
  isWaveComplete() {
    // Für Debugging: Ausgabe des Wellen-Status
    if (Math.random() < 0.01) { // Nicht zu häufig loggen
      console.log(`Wave status: ${this.zombiesRemaining} remaining, isSpawning: ${this.isSpawning}, zombies killed: ${this.game.gameState.zombiesKilled}/${this.game.gameState.zombiesSpawned}`);
    }
    
    // Wave is complete when all zombies are spawned and killed
    const allZombiesSpawned = this.zombiesRemaining === 0 && !this.isSpawning;
    
    // Geändert: Prüfe, ob nur aktuelle Wellenzombies gezählt werden
    const allZombiesKilled = this.game.gameState.zombiesKilled === this.game.gameState.zombiesSpawned;
    
    // Zusätzliche Bedingung: Es müssen mindestens 5 Zombies gespawnt worden sein,
    // bevor eine Welle als abgeschlossen gelten kann (verhindert zu schnellen Abschluss)
    const enoughZombiesSpawned = this.game.gameState.zombiesSpawned >= 5;
    
    // Zusätzliche Bedingung: Welle kann nicht abgeschlossen sein, wenn keine Zombies gespawnt wurden
    if (this.game.gameState.zombiesSpawned === 0) {
      return false;
    }
    
    if (allZombiesSpawned && allZombiesKilled && enoughZombiesSpawned) {
      console.log(`Wave complete: ${this.game.gameState.zombiesKilled}/${this.game.gameState.zombiesSpawned} zombies killed`);
      return true;
    }
    
    return false;
  }
} 