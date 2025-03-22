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
      for (let i = 0; i < 100; i++) {
        const randomX = Math.floor(Math.random() * (mapWidth - 4)) + 2;
        const randomZ = Math.floor(Math.random() * (mapHeight - 4)) + 2;
        
        this.addSpawnPoint(
          mapOffsetX + randomX * tileSize,
          mapOffsetZ + randomZ * tileSize
        );
      }
    }
    
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
    
    // Calculate which tiles are reachable from the player's position
    const grid = this.game.map.navigationGrid;
    if (!grid) {
      return;
    }
    
    const width = this.game.map.width;
    const height = this.game.map.height;
    
    // Initialize reachability map
    const reachable = Array(height).fill().map(() => Array(width).fill(false));
    
    // Check if player is on a valid tile
    if (playerGridX < 0 || playerGridX >= width || playerGridZ < 0 || playerGridZ >= height) {
      return;
    }
    
    if (grid[playerGridZ][playerGridX] === 0) {
      return;
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
  }
  
  startNewWave(waveNumber) {
    if (this.isSpawning) return;
    
    // Always recalculate spawn points for new waves
    // This ensures they work with procedural maps
    this.determineSpawnPoints();
    
    // Validate spawn points to ensure they have a path to player
    this.validateSpawnPoints();
    
    // If no spawn points were found, create a fallback spawn point
    if (this.spawnPoints.length === 0) {
      this.findFallbackSpawnPoint();
    }
    
    // Update debug visualization 
    this.visualizeSpawnPoints();
    
    // Calculate zombies for this wave
    // Cap the maximum number of zombies per wave to prevent overwhelming numbers
    const baseZombies = this.zombiesPerWave;
    const extraZombies = Math.min((waveNumber - 1) * 5, 50); // Cap extra zombies at 50
    this.zombiesRemaining = baseZombies + extraZombies;
    
    // Update game state
    this.game.gameState.zombiesSpawned = 0;
    this.game.gameState.zombiesKilled = 0; // Reset zombies killed counter for new wave
    
    // Start spawning
    this.spawnZombies();
  }
  
  spawnZombies() {
    // Set spawning flag
    this.isSpawning = true;
    
    // Spawn mit größerer Verzögerung, damit Zombies mehr Zeit haben
    const spawnInterval = setInterval(() => {
      // Stop if no more zombies to spawn or we hit the max
      if (this.zombiesRemaining <= 0 || this.zombies.length >= this.maxZombies) {
        clearInterval(spawnInterval);
        this.isSpawning = false;
        return;
      }
      
      // Spawn a zombie
      this.spawnZombie();
      this.zombiesRemaining--;
      this.game.gameState.zombiesSpawned++;
      
    }, 2000); // Spawn a zombie every 2 seconds instead of 1 second
  }
  
  spawnZombie() {
    // Check if we have any spawn points
    if (this.spawnPoints.length === 0) {
      console.warn("No spawn points available. Attempting to create fallback spawn points.");
      this.determineSpawnPoints();
      
      // Still no spawn points? Use a fallback position
      if (this.spawnPoints.length === 0) {
        console.warn("Failed to create spawn points. Using fallback position.");
        const fallbackPosition = new THREE.Vector3(
          Math.random() * 20 - 10,
          0,
          Math.random() * 20 - 10
        );
        
        const zombie = new Zombie(this.game, this.assetLoader, fallbackPosition);
        this.game.scene.add(zombie.container);
        this.zombies.push(zombie);
        return;
      }
    }
    
    // Pick a random spawn point
    const spawnPointIndex = Math.floor(Math.random() * this.spawnPoints.length);
    
    // Safety check: verify the spawn point is a valid Vector3
    if (!this.spawnPoints[spawnPointIndex] || !this.spawnPoints[spawnPointIndex].clone) {
      console.error("Invalid spawn point at index", spawnPointIndex, this.spawnPoints[spawnPointIndex]);
      // Use a fallback position
      const fallbackPosition = new THREE.Vector3(
        Math.random() * 20 - 10,
        0,
        Math.random() * 20 - 10
      );
      
      const zombie = new Zombie(this.game, this.assetLoader, fallbackPosition);
      this.game.scene.add(zombie.container);
      this.zombies.push(zombie);
      return;
    }
    
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
    if (Math.random() < 0.01) { // Nicht zu häufig loggen
      return false;
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
      return true;
    }
    
    return false;
  }
  
  findFallbackSpawnPoint() {
    // Try to find any walkable point far from the player as a last resort
    const mapWidth = this.game.map.width;
    const mapHeight = this.game.map.height;
    
    // Try corners first
    const corners = [
      { x: -mapWidth / 2 + 2, z: -mapHeight / 2 + 2 },
      { x: mapWidth / 2 - 2, z: -mapHeight / 2 + 2 },
      { x: -mapWidth / 2 + 2, z: mapHeight / 2 - 2 },
      { x: mapWidth / 2 - 2, z: mapHeight / 2 - 2 }
    ];
    
    for (const corner of corners) {
      if (this.isWalkableSpawnPoint(corner.x, corner.z)) {
        this.spawnPoints.push(corner);
        return;
      }
    }
    
    // If no corners work, try any position
    for (let i = 0; i < 100; i++) {
      const x = (Math.random() * mapWidth) - mapWidth / 2;
      const z = (Math.random() * mapHeight) - mapHeight / 2;
      
      if (this.isWalkableSpawnPoint(x, z)) {
        this.spawnPoints.push({ x, z });
        return;
      }
    }
    
    // If all else fails, use a non-walkable point
    this.spawnPoints.push({ x: mapWidth / 2 - 2, z: mapHeight / 2 - 2 });
  }
  
  isWalkableSpawnPoint(x, z) {
    // Get player position on the grid
    const playerPosition = this.game.player.container.position;
    const mapWidth = this.game.map.width;
    const mapHeight = this.game.map.height;
    
    const playerGridX = Math.floor(playerPosition.x + mapWidth / 2);
    const playerGridZ = Math.floor(playerPosition.z + mapHeight / 2);
    
    // Check if position is walkable using the navigation grid
    const gridX = Math.floor(x + mapWidth / 2);
    const gridZ = Math.floor(z + mapHeight / 2);
    
    if (!this.game.map.navigationGrid) {
      return false;
    }
    
    // Check if position is within grid bounds
    if (gridX < 0 || gridX >= mapWidth || gridZ < 0 || gridZ >= mapHeight) {
      return false;
    }
    
    // Check if the tile is walkable (1 = walkable, 0 = unwalkable)
    if (this.game.map.navigationGrid[gridZ][gridX] === 0) {
      return false;
    }
    
    if (this.debugMode) {
      const surroundingValues = [];
      
      for (let dy = -1; dy <= 1; dy++) {
        let rowStr = "";
        for (let dx = -1; dx <= 1; dx++) {
          const checkX = playerGridX + dx;
          const checkZ = playerGridZ + dy;
          if (checkX >= 0 && checkX < mapWidth && checkZ >= 0 && checkZ < mapHeight) {
            rowStr += ` ${this.game.map.navigationGrid[checkZ][checkX]}`;
          } else {
            rowStr += " X";
          }
        }
        surroundingValues.push(rowStr);
      }
    }
    
    // Check if the tile is far enough from the player (at least 10 units)
    const distance = Math.sqrt(
      Math.pow(playerPosition.x - x, 2) + 
      Math.pow(playerPosition.z - z, 2)
    );
    
    const minSpawnDistance = 15; // Minimum distance from player to spawn
    
    return this.game.map.navigationGrid[gridZ][gridX] > 0 && distance >= minSpawnDistance;
  }
} 