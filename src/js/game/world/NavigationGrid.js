import * as THREE from 'three';

/**
 * NavigationGrid - Manages pathfinding grid for zombie AI
 * Creates and updates a grid representing walkable areas in the city
 */
export class NavigationGrid {
  constructor(game) {
    this.game = game;
    this.grid = [];
    this.gridSize = 1; // Size of each grid cell in world units
    this.width = 0;
    this.height = 0;
    this.debug = false;
    this.debugObjects = [];
  }

  /**
   * Generate navigation grid based on the city layout
   * @param {City} city - The city instance 
   */
  generate(city) {
    if (!city) {
      console.error('No city provided to NavigationGrid.generate()');
      return;
    }

    console.log('Generating navigation grid for city...');
    
    // Clear any previous grid
    this.grid = [];
    this.cleanupDebug();
    
    // Get city dimensions
    const citySize = city.citySize;
    this.width = Math.ceil(citySize / this.gridSize);
    this.height = Math.ceil(citySize / this.gridSize);
    
    console.log(`Creating navigation grid with dimensions: ${this.width}x${this.height}`);
    
    // Initialize grid with all cells walkable
    for (let z = 0; z < this.height; z++) {
      this.grid[z] = [];
      for (let x = 0; x < this.width; x++) {
        this.grid[z][x] = 1; // 1 = walkable, 0 = obstacle
      }
    }
    
    // Mark buildings and other obstacles as not walkable
    this.markObstacles(city);
    
    // Generate buffer zones around obstacles to prevent zombies from getting too close
    this.generateBufferZones();
    
    // If debug mode is enabled, visualize the grid
    if (this.debug) {
      this.visualizeGrid();
    }
    
    console.log('Navigation grid generation complete');
  }
  
  /**
   * Mark buildings and obstacles as non-walkable in the grid
   * @param {City} city - The city instance
   */
  markObstacles(city) {
    // Convert city grid to navigation grid
    for (let z = 0; z < city.citySize; z++) {
      for (let x = 0; x < city.citySize; x++) {
        const gridX = Math.floor(x / this.gridSize);
        const gridZ = Math.floor(z / this.gridSize);
        
        // Skip if outside grid boundaries
        if (gridX >= this.width || gridZ >= this.height) continue;
        
        // Check if this position is in a building
        if (city.cityGrid[z] && city.cityGrid[z][x] && city.cityGrid[z][x].type === 'building') {
          this.grid[gridZ][gridX] = 0; // Mark as obstacle
        }
      }
    }
    
    // Mark city components as obstacles (barricades, large debris, etc.)
    this.markComponentObstacles(city);
    
    // Mark level boundaries as obstacles
    this.markBoundaries(city);
  }
  
  /**
   * Mark city components that should block zombie movement
   * @param {City} city - The city instance
   */
  markComponentObstacles(city) {
    // Use collision objects from city components if available
    if (city.cityComponents && city.cityComponents.collisionObjects) {
      for (const obj of city.cityComponents.collisionObjects) {
        if (!obj.position) continue;
        
        const gridX = Math.floor(obj.position.x / this.gridSize);
        const gridZ = Math.floor(obj.position.z / this.gridSize);
        
        // Skip if outside grid boundaries
        if (gridX < 0 || gridX >= this.width || gridZ < 0 || gridZ >= this.height) continue;
        
        // Mark as obstacle with buffer zone based on object size
        const radius = obj.radius || 1;
        const bufferRadius = Math.ceil(radius / this.gridSize);
        
        for (let z = -bufferRadius; z <= bufferRadius; z++) {
          for (let x = -bufferRadius; x <= bufferRadius; x++) {
            const targetX = gridX + x;
            const targetZ = gridZ + z;
            
            // Skip if outside grid boundaries
            if (targetX < 0 || targetX >= this.width || targetZ < 0 || targetZ >= this.height) continue;
            
            this.grid[targetZ][targetX] = 0; // Mark as obstacle
          }
        }
      }
    }
    
    // Same for apocalyptic assets
    if (city.apocalypticAssets && city.apocalypticAssets.collisionObjects) {
      for (const obj of city.apocalypticAssets.collisionObjects) {
        if (!obj.position) continue;
        
        const gridX = Math.floor(obj.position.x / this.gridSize);
        const gridZ = Math.floor(obj.position.z / this.gridSize);
        
        // Skip if outside grid boundaries
        if (gridX < 0 || gridX >= this.width || gridZ < 0 || gridZ >= this.height) continue;
        
        // Mark as obstacle with buffer zone
        const radius = obj.radius || 1;
        const bufferRadius = Math.ceil(radius / this.gridSize);
        
        for (let z = -bufferRadius; z <= bufferRadius; z++) {
          for (let x = -bufferRadius; x <= bufferRadius; x++) {
            const targetX = gridX + x;
            const targetZ = gridZ + z;
            
            // Skip if outside grid boundaries
            if (targetX < 0 || targetX >= this.width || targetZ < 0 || targetZ >= this.height) continue;
            
            this.grid[targetZ][targetX] = 0; // Mark as obstacle
          }
        }
      }
    }
  }
  
  /**
   * Mark level boundaries as non-walkable
   * @param {City} city - The city instance
   */
  markBoundaries(city) {
    // Create a buffer zone around the edges of the city
    const bufferSize = 2; // Grid cells
    
    // Mark the edges of the grid as non-walkable
    for (let z = 0; z < this.height; z++) {
      for (let x = 0; x < this.width; x++) {
        if (x < bufferSize || x >= this.width - bufferSize || 
            z < bufferSize || z >= this.height - bufferSize) {
          this.grid[z][x] = 0; // Mark as obstacle
        }
      }
    }
  }
  
  /**
   * Generate buffer zones around obstacles
   * This prevents zombies from getting too close to walls
   */
  generateBufferZones() {
    // Create a copy of the original grid
    const originalGrid = [];
    for (let z = 0; z < this.height; z++) {
      originalGrid[z] = [...this.grid[z]];
    }
    
    // Add one-cell buffer around all obstacles
    for (let z = 0; z < this.height; z++) {
      for (let x = 0; x < this.width; x++) {
        if (originalGrid[z][x] === 0) {
          // For each obstacle, create a small buffer zone
          for (let bz = -1; bz <= 1; bz++) {
            for (let bx = -1; bx <= 1; bx++) {
              const targetX = x + bx;
              const targetZ = z + bz;
              
              // Skip if outside grid boundaries
              if (targetX < 0 || targetX >= this.width || targetZ < 0 || targetZ >= this.height) continue;
              
              this.grid[targetZ][targetX] = 0; // Mark as obstacle
            }
          }
        }
      }
    }
  }
  
  /**
   * Check if a position is walkable
   * @param {THREE.Vector3} position - The world position to check
   * @returns {boolean} True if position is walkable
   */
  isWalkable(position) {
    // Convert world position to grid coordinates
    const gridX = Math.floor(position.x / this.gridSize);
    const gridZ = Math.floor(position.z / this.gridSize);
    
    // Check if position is outside grid boundaries
    if (gridX < 0 || gridX >= this.width || gridZ < 0 || gridZ >= this.height) {
      return false; // Outside grid is not walkable
    }
    
    // Return walkability value from grid
    return this.grid[gridZ][gridX] === 1;
  }
  
  /**
   * Get cell value at grid coordinates
   * @param {number} x - Grid x coordinate
   * @param {number} z - Grid z coordinate
   * @returns {number} 1 if walkable, 0 if obstacle
   */
  getCell(x, z) {
    // Check if coordinates are valid
    if (x < 0 || x >= this.width || z < 0 || z >= this.height) {
      return 0; // Outside grid is not walkable
    }
    
    return this.grid[z][x];
  }
  
  /**
   * Toggle debug visualization
   */
  toggleDebug() {
    this.debug = !this.debug;
    
    if (this.debug) {
      this.visualizeGrid();
    } else {
      this.cleanupDebug();
    }
    
    return this.debug;
  }
  
  /**
   * Visualize the navigation grid
   */
  visualizeGrid() {
    // Clean up any existing debug objects
    this.cleanupDebug();
    
    // Create a geometry for walkable and non-walkable cells
    const walkableGeometry = new THREE.BoxGeometry(this.gridSize * 0.9, 0.1, this.gridSize * 0.9);
    const obstacleGeometry = new THREE.BoxGeometry(this.gridSize * 0.9, 0.2, this.gridSize * 0.9);
    
    // Create materials
    const walkableMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3 });
    const obstacleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
    
    // Create debug container
    this.debugContainer = new THREE.Group();
    this.debugContainer.name = "NavigationGridDebug";
    
    // Create a debug object for each cell
    for (let z = 0; z < this.height; z++) {
      for (let x = 0; x < this.width; x++) {
        const isWalkable = this.grid[z][x] === 1;
        
        // Create cell visualization
        const mesh = new THREE.Mesh(
          isWalkable ? walkableGeometry : obstacleGeometry,
          isWalkable ? walkableMaterial : obstacleMaterial
        );
        
        // Position at cell center
        mesh.position.set(
          x * this.gridSize + this.gridSize / 2, 
          isWalkable ? 0.05 : 0.1, 
          z * this.gridSize + this.gridSize / 2
        );
        
        // Add to debug container
        this.debugContainer.add(mesh);
        this.debugObjects.push(mesh);
      }
    }
    
    // Add debug container to scene
    this.game.scene.add(this.debugContainer);
  }
  
  /**
   * Clean up debug visualization objects
   */
  cleanupDebug() {
    // Remove debug container from scene if it exists
    if (this.debugContainer) {
      this.game.scene.remove(this.debugContainer);
      this.debugContainer = null;
    }
    
    // Clear debug objects array
    this.debugObjects = [];
  }
  
  /**
   * Find path from start to target position using A* algorithm
   * @param {THREE.Vector3} start - Start position in world coordinates
   * @param {THREE.Vector3} target - Target position in world coordinates
   * @returns {Array} Array of Vector3 positions representing the path
   */
  findPath(start, target) {
    // Convert world positions to grid coordinates
    const startX = Math.floor(start.x / this.gridSize);
    const startZ = Math.floor(start.z / this.gridSize);
    const targetX = Math.floor(target.x / this.gridSize);
    const targetZ = Math.floor(target.z / this.gridSize);
    
    // Check if start or target positions are outside grid or not walkable
    if (startX < 0 || startX >= this.width || startZ < 0 || startZ >= this.height ||
        targetX < 0 || targetX >= this.width || targetZ < 0 || targetZ >= this.height) {
      return []; // Return empty path
    }
    
    if (this.grid[startZ][startX] === 0 || this.grid[targetZ][targetX] === 0) {
      return []; // Start or target is not walkable
    }
    
    // A* pathfinding implementation
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();
    
    // Cost maps
    const gScore = new Map(); // Cost from start to current
    const fScore = new Map(); // Estimated total cost (g + heuristic)
    
    // Initialize start node
    const startNode = `${startX},${startZ}`;
    const targetNode = `${targetX},${targetZ}`;
    
    gScore.set(startNode, 0);
    fScore.set(startNode, this.heuristic(startX, startZ, targetX, targetZ));
    
    openSet.push({
      node: startNode,
      f: fScore.get(startNode),
    });
    
    // Maximum number of iterations to prevent infinite loops
    const maxIterations = 200;
    let iterations = 0;
    
    // A* search
    while (openSet.length > 0 && iterations < maxIterations) {
      iterations++;
      
      // Sort open set by f-score and get node with lowest value
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift().node;
      
      // Check if we reached the goal
      if (current === targetNode) {
        // Reconstruct path
        return this.reconstructPath(cameFrom, current);
      }
      
      // Add current node to closed set
      closedSet.add(current);
      
      // Get current node coordinates
      const [currentX, currentZ] = current.split(',').map(Number);
      
      // Check all neighbors
      const neighbors = this.getNeighbors(currentX, currentZ);
      
      for (const neighbor of neighbors) {
        const [neighborX, neighborZ] = neighbor;
        const neighborNode = `${neighborX},${neighborZ}`;
        
        // Skip if neighbor is in closed set
        if (closedSet.has(neighborNode)) continue;
        
        // Calculate tentative g score
        const tentativeGScore = gScore.get(current) + 1;
        
        // Check if this path is better than previous ones
        if (!gScore.has(neighborNode) || tentativeGScore < gScore.get(neighborNode)) {
          // This is a better path, record it
          cameFrom.set(neighborNode, current);
          gScore.set(neighborNode, tentativeGScore);
          fScore.set(neighborNode, tentativeGScore + this.heuristic(neighborX, neighborZ, targetX, targetZ));
          
          // Add to open set if not already there
          if (!openSet.some(item => item.node === neighborNode)) {
            openSet.push({
              node: neighborNode,
              f: fScore.get(neighborNode),
            });
          }
        }
      }
    }
    
    // No path found
    return [];
  }
  
  /**
   * Get walkable neighbors for a grid position
   * @param {number} x - Grid x coordinate
   * @param {number} z - Grid z coordinate
   * @returns {Array} Array of [x, z] coordinates for walkable neighbors
   */
  getNeighbors(x, z) {
    const neighbors = [];
    
    // Check all 8 directions (including diagonals)
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1], // Cardinal directions
      [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonals
    ];
    
    for (const [dx, dz] of directions) {
      const newX = x + dx;
      const newZ = z + dz;
      
      // Skip if outside grid boundaries
      if (newX < 0 || newX >= this.width || newZ < 0 || newZ >= this.height) continue;
      
      // Skip if not walkable
      if (this.grid[newZ][newX] === 0) continue;
      
      // Skip diagonals if they pass through obstacles (prevent corner cutting)
      if (dx !== 0 && dz !== 0) {
        // Make sure adjacent cells are walkable for diagonal movement
        if (this.grid[z][newX] === 0 || this.grid[newZ][x] === 0) continue;
      }
      
      neighbors.push([newX, newZ]);
    }
    
    return neighbors;
  }
  
  /**
   * Heuristic function for A* (Manhattan distance)
   * @param {number} x1 - Start x
   * @param {number} z1 - Start z
   * @param {number} x2 - Target x
   * @param {number} z2 - Target z
   * @returns {number} Heuristic distance
   */
  heuristic(x1, z1, x2, z2) {
    // Manhattan distance
    return Math.abs(x2 - x1) + Math.abs(z2 - z1);
  }
  
  /**
   * Reconstruct path from A* result
   * @param {Map} cameFrom - Map of node relationships
   * @param {string} current - Current node
   * @returns {Array} Array of Vector3 positions
   */
  reconstructPath(cameFrom, current) {
    const path = [];
    
    // Get world position of target node
    const [x, z] = current.split(',').map(Number);
    path.push(new THREE.Vector3(
      x * this.gridSize + this.gridSize / 2,
      0, // Y-coordinate (on ground)
      z * this.gridSize + this.gridSize / 2
    ));
    
    // Trace back from target to start
    while (cameFrom.has(current)) {
      current = cameFrom.get(current);
      const [nodeX, nodeZ] = current.split(',').map(Number);
      
      // Insert at start of array to get path from start to end
      path.unshift(new THREE.Vector3(
        nodeX * this.gridSize + this.gridSize / 2,
        0, // Y-coordinate (on ground)
        nodeZ * this.gridSize + this.gridSize / 2
      ));
    }
    
    // Remove the first node (starting position)
    path.shift();
    
    return path;
  }
  
  /**
   * Simplify path by removing redundant points
   * @param {Array} path - Original path array
   * @returns {Array} Simplified path
   */
  simplifyPath(path) {
    if (path.length <= 2) return path;
    
    const result = [path[0]];
    let currentDirection = null;
    
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const current = path[i];
      
      // Calculate direction vector
      const direction = new THREE.Vector2(
        current.x - prev.x,
        current.z - prev.z
      ).normalize();
      
      if (!currentDirection) {
        currentDirection = direction;
      } else {
        // If direction changes significantly, add a waypoint
        const dot = currentDirection.dot(direction);
        if (dot < 0.9) { // Threshold for direction change (about 25 degrees)
          result.push(prev);
          currentDirection = direction;
        }
      }
      
      // Always add the last point
      if (i === path.length - 1) {
        result.push(current);
      }
    }
    
    return result;
  }
  
  /**
   * Clean up resources when no longer needed
   */
  dispose() {
    this.cleanupDebug();
    this.grid = [];
  }
} 