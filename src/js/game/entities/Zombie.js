import * as THREE from 'three';

export class Zombie {
  constructor(game, assetLoader, position) {
    this.game = game;
    this.assetLoader = assetLoader;
    this.position = position.clone();
    
    // Zombie properties
    this.health = 100;
    this.maxHealth = 100;
    this.damage = 10;
    this.speed = 2; // Units per second
    this.attackRange = 0.8; // How close zombie needs to be to attack
    this.attackSpeed = 1; // Seconds between attacks
    this.lastAttackTime = 0;
    this.isAlive = true;
    this.points = 50; // Score points for killing this zombie
    this.animationComplete = false; // Flag to track if death animation is done
    
    // Pathfinding
    this.pathUpdateInterval = 1; // Seconds between path updates
    this.lastPathUpdate = 0;
    this.path = []; // Array of positions to follow
    this.isColliding = false; // Flag if zombie is colliding with obstacles
    
    // Create container
    this.container = new THREE.Group();
    
    // Create mesh
    this.createMesh();
    
    // Set initial position
    this.container.position.copy(position);
    
    // Debug path visualization
    this.debugPathMarkers = [];
  }
  
  createMesh() {
    // Create a more detailed 3D zombie model
    const bodyGeometry = new THREE.BoxGeometry(0.7, 1.1, 0.4);
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const armGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const legGeometry = new THREE.BoxGeometry(0.25, 0.6, 0.25);
    
    // Materials with pixel textures for zombie parts
    const bodyMaterial = new THREE.MeshStandardMaterial({
      map: this.assetLoader.getTexture('zombie'),
      color: 0x8BC34A, // Green tint for zombies
      roughness: 0.9,
      metalness: 0.0
    });
    
    const headMaterial = new THREE.MeshStandardMaterial({
      map: this.assetLoader.getTexture('zombie_head'),
      color: 0xAED581, // Lighter green for head
      roughness: 0.9
    });
    
    // Create body parts with slight deformation for undead look
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 0.55;
    this.body.rotation.z = THREE.MathUtils.degToRad(-5); // Slight tilt
    this.body.castShadow = true;
    
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.y = 1.35;
    this.head.rotation.z = THREE.MathUtils.degToRad(15); // Tilted head
    this.head.castShadow = true;
    
    this.leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    this.leftArm.position.set(-0.45, 0.6, 0);
    this.leftArm.rotation.z = THREE.MathUtils.degToRad(20); // Outstretched arm
    this.leftArm.castShadow = true;
    
    this.rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    this.rightArm.position.set(0.45, 0.6, 0);
    this.rightArm.rotation.z = THREE.MathUtils.degToRad(-30); // Outstretched arm
    this.rightArm.castShadow = true;
    
    this.leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    this.leftLeg.position.set(-0.2, 0.0, 0);
    this.leftLeg.castShadow = true;
    
    this.rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    this.rightLeg.position.set(0.2, 0.0, 0);
    this.rightLeg.castShadow = true;
    
    // Add all parts to the container
    this.mesh = new THREE.Group();
    this.mesh.add(this.body);
    this.mesh.add(this.head);
    this.mesh.add(this.leftArm);
    this.mesh.add(this.rightArm);
    this.mesh.add(this.leftLeg);
    this.mesh.add(this.rightLeg);
    
    this.container.add(this.mesh);
    
    // Create health bar
    this.createHealthBar();
  }
  
  createHealthBar() {
    // Create container for health bar that will always face camera
    this.healthBarContainer = new THREE.Group();
    this.healthBarContainer.position.set(0, 1, 0); // Position above zombie
    
    // Background of health bar
    const bgGeometry = new THREE.PlaneGeometry(0.6, 0.1);
    const bgMaterial = new THREE.MeshBasicMaterial({
      color: 0x333333,
      side: THREE.DoubleSide
    });
    this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
    
    // Foreground of health bar (shows current health)
    const fgGeometry = new THREE.PlaneGeometry(0.6, 0.1);
    const fgMaterial = new THREE.MeshBasicMaterial({
      color: 0x00FF00,
      side: THREE.DoubleSide
    });
    this.healthBarFg = new THREE.Mesh(fgGeometry, fgMaterial);
    this.healthBarFg.position.z = 0.01; // Slightly in front of background
    
    // Add to container
    this.healthBarContainer.add(this.healthBarBg);
    this.healthBarContainer.add(this.healthBarFg);
    
    // Add to zombie
    this.container.add(this.healthBarContainer);
  }
  
  update(deltaTime) {
    if (!this.isAlive) return;
    
    // Debug info
    if (Math.random() < 0.01) { // Log nur bei 1% der Updates, um die Konsole nicht zu überfluten
      console.log(`Zombie position: ${this.container.position.x.toFixed(2)}, ${this.container.position.z.toFixed(2)}, isAlive: ${this.isAlive}, path length: ${this.path.length}`);
    }
    
    // Update health bar to face camera
    this.updateHealthBar();
    
    // Pathfinding and movement
    this.updatePathfinding(deltaTime);
    
    // Update movement
    this.updateMovement(deltaTime);
    
    // Attack player if in range
    this.updateAttack();
    
    // Debug visualization
    if (this.game.zombieManager.debugMode) {
      this.visualizePath();
    }
  }
  
  updateHealthBar() {
    // Make health bar face camera
    if (this.game.camera) {
      this.healthBarContainer.lookAt(this.game.camera.position);
    }
    
    // Update health bar scale based on current health
    const healthPercent = this.health / this.maxHealth;
    this.healthBarFg.scale.x = healthPercent;
    
    // Adjust position so it scales from left to right
    this.healthBarFg.position.x = (1 - healthPercent) * -0.3;
    
    // Update color based on health
    if (healthPercent > 0.6) {
      this.healthBarFg.material.color.set(0x00FF00); // Green
    } else if (healthPercent > 0.3) {
      this.healthBarFg.material.color.set(0xFFFF00); // Yellow
    } else {
      this.healthBarFg.material.color.set(0xFF0000); // Red
    }
  }
  
  updatePathfinding(deltaTime) {
    // Update pathfinding at regular intervals
    const now = Date.now();
    if (now - this.lastPathUpdate > this.pathUpdateInterval * 1000) {
      this.lastPathUpdate = now;
      
      // Find path to player
      if (this.game.player && this.game.player.isAlive) {
        this.findPathToPlayer();
      }
    }
    
    // Set target position to next path point or directly to player if no path
    if (this.path.length > 0) {
      // Get next point in path
      this.targetPosition = this.path[0];
      
      // Check if we've reached the current target point
      const distanceToTarget = this.container.position.distanceTo(this.targetPosition);
      if (distanceToTarget < 0.5) { // If close enough to this point
        this.path.shift(); // Remove the first point from path
      }
    } else if (this.game.player && this.game.player.isAlive) {
      // Direct line to player as fallback
      this.targetPosition = this.game.player.container.position.clone();
    }
  }
  
  findPathToPlayer() {
    if (!this.game.player || !this.game.player.isAlive) {
      this.path = [];
      return;
    }
    
    // Convert world positions to grid coordinates
    const mapOffsetX = this.game.map.container.position.x;
    const mapOffsetZ = this.game.map.container.position.z;
    const tileSize = this.game.map.tileSize;
    
    const zombieGridX = Math.floor((this.container.position.x - mapOffsetX) / tileSize);
    const zombieGridZ = Math.floor((this.container.position.z - mapOffsetZ) / tileSize);
    
    const playerPos = this.game.player.container.position;
    const playerGridX = Math.floor((playerPos.x - mapOffsetX) / tileSize);
    const playerGridZ = Math.floor((playerPos.z - mapOffsetZ) / tileSize);
    
    // Get reference to navigation grid
    const grid = this.game.map.navigationGrid;
    if (!grid) {
      console.error("Navigation grid is undefined!");
      // Fallback to direct path
      this.path = [playerPos.clone()];
      return;
    }
    
    const width = this.game.map.width;
    const height = this.game.map.height;
    
    // Boundary check for zombie and player positions
    if (zombieGridX < 0 || zombieGridX >= width || zombieGridZ < 0 || zombieGridZ >= height ||
        playerGridX < 0 || playerGridX >= width || playerGridZ < 0 || playerGridZ >= height) {
      console.warn("Zombie or player outside grid bounds - using direct path");
      this.path = [playerPos.clone()];
      return;
    }
    
    // Check if both zombie and player are on walkable tiles
    if (grid[zombieGridZ][zombieGridX] === 0 || grid[playerGridZ][playerGridX] === 0) {
      this.path = [playerPos.clone()];
      return;
    }
    
    // Check if we're already close to player, don't need pathfinding then
    const distanceToPlayer = Math.sqrt(
      Math.pow(playerGridX - zombieGridX, 2) + 
      Math.pow(playerGridZ - zombieGridZ, 2)
    );
    
    if (distanceToPlayer <= 2) {
      // Just set a direct path
      this.path = [playerPos.clone()];
      return;
    }
    
    // Implementation of A* pathfinding with awareness of buffer zones
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();
    
    // Cost maps
    const gScore = new Map(); // Cost from start to current
    const fScore = new Map(); // Estimated total cost (g + heuristic)
    
    // Initialize start node
    const startNode = `${zombieGridX},${zombieGridZ}`;
    const goalNode = `${playerGridX},${playerGridZ}`;
    
    gScore.set(startNode, 0);
    fScore.set(startNode, this.heuristic(zombieGridX, zombieGridZ, playerGridX, playerGridZ));
    
    openSet.push({
      node: startNode,
      f: fScore.get(startNode)
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
      if (current === goalNode) {
        // Reconstruct path
        this.path = this.reconstructPath(cameFrom, current, mapOffsetX, mapOffsetZ, tileSize);
        return;
      }
      
      closedSet.add(current);
      
      // Parse current node coordinates
      const [currentX, currentZ] = current.split(',').map(Number);
      
      // Check all neighbors
      const neighbors = [
        { x: currentX + 1, z: currentZ },
        { x: currentX - 1, z: currentZ },
        { x: currentX, z: currentZ + 1 },
        { x: currentX, z: currentZ - 1 }
      ];
      
      for (const neighbor of neighbors) {
        // Skip if out of bounds
        if (neighbor.x < 0 || neighbor.x >= width || 
            neighbor.z < 0 || neighbor.z >= height) {
          continue;
        }
        
        // Skip if not walkable
        if (grid[neighbor.z][neighbor.x] === 0) {
          continue;
        }
        
        const neighborNode = `${neighbor.x},${neighbor.z}`;
        
        // Skip if in closed set
        if (closedSet.has(neighborNode)) {
          continue;
        }
        
        // Calculate movement cost - higher for buffer zones (2) to make zombies
        // prefer solid ground (1) when possible
        const movementCost = grid[neighbor.z][neighbor.x] === 2 ? 5 : 1;
        const tentativeGScore = gScore.get(current) + movementCost;
        
        // Check if node is in open set
        const inOpenSet = openSet.some(item => item.node === neighborNode);
        
        // If not in open set or has better path
        if (!inOpenSet || tentativeGScore < gScore.get(neighborNode)) {
          // Update path
          cameFrom.set(neighborNode, current);
          gScore.set(neighborNode, tentativeGScore);
          fScore.set(neighborNode, tentativeGScore + 
                     this.heuristic(neighbor.x, neighbor.z, playerGridX, playerGridZ));
          
          // Add to open set if not there
          if (!inOpenSet) {
            openSet.push({
              node: neighborNode,
              f: fScore.get(neighborNode)
            });
          }
        }
      }
    }
    
    // If we get here, no path was found - fall back to direct line
    this.path = [playerPos.clone()];
    
    // Add this line for debugging
    if (this.game.zombieManager.debugMode) {
      console.log(`Zombie path created with ${this.path.length} points`);
    }
  }
  
  // Manhattan distance heuristic
  heuristic(x1, z1, x2, z2) {
    return Math.abs(x1 - x2) + Math.abs(z1 - z2);
  }
  
  // Reconstruct path from A* results
  reconstructPath(cameFrom, current, mapOffsetX, mapOffsetZ, tileSize) {
    const path = [];
    
    // Convert goal to world coordinates and add to path
    const playerPos = this.game.player.container.position.clone();
    path.unshift(playerPos);
    
    // Don't need the full path to the player, just a few steps
    // This creates smoother zombie movement and they'll recalculate frequently anyway
    let steps = 0;
    const maxSteps = 8; // Limit path length
    
    while (cameFrom.has(current) && steps < maxSteps) {
      current = cameFrom.get(current);
      steps++;
      
      // Convert grid coordinates to world coordinates
      const [x, z] = current.split(',').map(Number);
      const worldX = mapOffsetX + (x + 0.5) * tileSize; // Center of tile
      const worldZ = mapOffsetZ + (z + 0.5) * tileSize;
      
      path.unshift(new THREE.Vector3(worldX, 0, worldZ));
    }
    
    return path;
  }
  
  updateMovement(deltaTime) {
    // Skip if zombie is not alive
    if (!this.isAlive) return;
    
    // Get the player position
    const playerPosition = this.game.player.container.position;
    const distanceToPlayer = this.container.position.distanceTo(playerPosition);
    
    // Debugging
    if (Math.random() < 0.005) {
      console.log(`Zombie movement: distance to player ${distanceToPlayer.toFixed(2)}, attack range: ${this.attackRange}, target: ${this.targetPosition ? this.targetPosition.x.toFixed(2) + ',' + this.targetPosition.z.toFixed(2) : 'none'}`);
    }
    
    // Check if zombie is close enough to attack
    if (distanceToPlayer <= this.attackRange) {
      this.updateAttack();
      return; // Don't move if attacking
    }
    
    // Move toward next path point or player
    let targetPosition;
    
    if (this.path.length > 0) {
      // Move toward next path point
      targetPosition = this.path[0];
      
      // Calculate distance to next path point
      const distanceToTarget = this.container.position.distanceTo(targetPosition);
      
      // If close enough to path point, remove it and move to next point
      if (distanceToTarget < 0.5) {
        this.path.shift();
        return; // Skip this frame to recalculate path
      }
    } else {
      // Direct path to player if no path points
      targetPosition = playerPosition;
    }
    
    // Calculate direction to target
    const direction = new THREE.Vector3();
    direction.subVectors(targetPosition, this.container.position).normalize();
    
    // Apply movement
    const moveDistance = this.speed * deltaTime;
    const newPosition = new THREE.Vector3();
    newPosition.copy(this.container.position);
    newPosition.addScaledVector(direction, moveDistance);
    
    // Check if new position is walkable
    if (this.isPositionWalkable(newPosition, 0.3)) {
      this.container.position.copy(newPosition);
      
      // Update rotation to face movement direction
      if (direction.length() > 0.1) {
        const targetRotation = Math.atan2(direction.x, direction.z);
        
        // Smooth rotation (lerp)
        const currentRotation = this.container.rotation.y;
        this.container.rotation.y = THREE.MathUtils.lerp(
          currentRotation,
          targetRotation,
          5 * deltaTime
        );
      }
      
      // Animate zombie walk - shuffling motion
      const walkSpeed = 1.5; // slower than player for shambling effect
      const walkCycle = (Date.now() % 1000) / 1000 * walkSpeed;
      const legRotation = Math.sin(walkCycle * Math.PI * 2) * 0.3;
      const armRotationOffset = Math.cos(walkCycle * Math.PI) * 0.2;
      
      // Apply zombie shambling animation
      this.leftLeg.rotation.x = -legRotation;
      this.rightLeg.rotation.x = legRotation;
      
      // Arms stretched out with slight movement
      this.leftArm.rotation.x = 0.3 + armRotationOffset;
      this.rightArm.rotation.x = 0.3 - armRotationOffset;
      
      // Head bobbing slightly
      this.head.rotation.z = THREE.MathUtils.degToRad(15) + Math.sin(walkCycle * Math.PI) * 0.1;
      
      this.isColliding = false;
    } else {
      // Mark as colliding to handle obstacle avoidance
      this.isColliding = true;
      
      // Try to move only on X axis
      newPosition.copy(this.container.position);
      newPosition.x += direction.x * moveDistance;
      
      if (this.isPositionWalkable(newPosition, 0.3)) {
        this.container.position.copy(newPosition);
        this.isColliding = false;
      } else {
        // Try to move only on Z axis
        newPosition.copy(this.container.position);
        newPosition.z += direction.z * moveDistance;
        
        if (this.isPositionWalkable(newPosition, 0.3)) {
          this.container.position.copy(newPosition);
          this.isColliding = false;
        }
      }
    }
    
    // Update collision visual feedback
    this.updateCollisionFeedback();
  }
  
  updateCollisionFeedback() {
    if (this.isColliding) {
      // Show zombie is stuck by changing color
      this.mesh.children.forEach(child => {
        child.material.color.set(0xAA5500); // Orange tint
      });
    } else {
      // Restore normal color
      this.mesh.children.forEach(child => {
        child.material.color.set(0x8BC34A); // Normal green tint
      });
    }
  }
  
  visualizePath() {
    // Clear old markers
    for (const marker of this.debugPathMarkers) {
      this.game.scene.remove(marker);
    }
    this.debugPathMarkers = [];
    
    // Create new markers for the path
    for (let i = 0; i < this.path.length; i++) {
      const point = this.path[i];
      
      const markerGeometry = new THREE.SphereGeometry(0.1, 4, 4);
      const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      
      marker.position.copy(point);
      marker.position.y = 0.2; // Slightly above ground
      
      this.game.scene.add(marker);
      this.debugPathMarkers.push(marker);
    }
  }
  
  // Helper method to check if a position is walkable with a collision radius
  isPositionWalkable(position, radius) {
    // Check center point first - must always be walkable
    const centerWalkable = this.game.map.isTileWalkable(position.x, position.z);
    
    // Debugging: Manchmal die Walkable-Prüfung ausgeben
    if (Math.random() < 0.002) {
      console.log(`Zombie walkable check at (${position.x.toFixed(2)}, ${position.z.toFixed(2)}): ${centerWalkable}`);
    }
    
    if (!centerWalkable) {
      return false;
    }
    
    // Very small radius, just check center
    if (radius < 0.2) {
      return true;
    }
    
    // For normal movement, check more points around the zombie
    // Check a grid of points around the center to ensure most of the zombie is on walkable terrain
    const checkPoints = [];
    
    // Main corners
    checkPoints.push({ x: position.x + radius, z: position.z + radius });
    checkPoints.push({ x: position.x + radius, z: position.z - radius });
    checkPoints.push({ x: position.x - radius, z: position.z + radius });
    checkPoints.push({ x: position.x - radius, z: position.z - radius });
    
    // Mid-points on edges
    checkPoints.push({ x: position.x + radius, z: position.z });
    checkPoints.push({ x: position.x - radius, z: position.z });
    checkPoints.push({ x: position.x, z: position.z + radius });
    checkPoints.push({ x: position.x, z: position.z - radius });
    
    // Count how many points are walkable
    let walkablePoints = 0;
    for (const point of checkPoints) {
      if (this.game.map.isTileWalkable(point.x, point.z)) {
        walkablePoints++;
      }
    }
    
    // Weniger streng sein: nur 50% der Punkte müssen begehbar sein (4 von 8)
    return walkablePoints >= 4;
  }
  
  updateAttack() {
    if (!this.game.player || !this.game.player.isAlive) return;
    
    // Calculate distance to player
    const distanceToPlayer = this.container.position.distanceTo(
      this.game.player.container.position
    );
    
    // If player is in attack range, attack
    if (distanceToPlayer <= this.attackRange) {
      const now = Date.now();
      if (now - this.lastAttackTime > this.attackSpeed * 1000) {
        this.lastAttackTime = now;
        this.attackPlayer();
      }
    }
  }
  
  attackPlayer() {
    if (this.game.player && this.game.player.isAlive) {
      this.game.player.takeDamage(this.damage);
      
      // Visual feedback for attack
      this.playAttackAnimation();
    }
  }
  
  playAttackAnimation() {
    // Simple attack animation - flash red
    this.mesh.children.forEach(child => {
      const originalColor = child.material.color.clone();
      child.material.color.set(0xFF0000);
      
      setTimeout(() => {
        if (this.isAlive) {
          child.material.color.copy(originalColor);
        }
      }, 200);
    });
  }
  
  takeDamage(amount) {
    if (!this.isAlive) return;
    
    // Log damage for debugging
    console.log(`Zombie taking damage: ${amount}`);
    
    this.health -= amount;
    
    // Visual feedback
    this.playDamageAnimation();
    
    // Update health bar immediately
    this.updateHealthBar();
    
    // Check if zombie died
    if (this.health <= 0) {
      this.health = 0;
      this.die();
      
      // Update game stats
      if (this.game.gameState) {
        this.game.gameState.zombiesKilled++;
        this.game.gameState.score += this.points;
        this.game.ui.updateScore(this.game.gameState.score);
      }
    }
  }
  
  playDamageAnimation() {
    // Simple damage animation - flash white
    this.mesh.children.forEach(child => {
      const originalColor = child.material.color.clone();
      child.material.color.set(0xFFFFFF);
      
      setTimeout(() => {
        if (this.isAlive) {
          child.material.color.copy(originalColor);
        }
      }, 100);
    });
  }
  
  die() {
    this.isAlive = false;
    
    // Add score for killing zombie
    this.game.addScore(this.points);
    
    // Visual death animation
    this.playDeathAnimation();
    
    // Remove zombie after death animation
    setTimeout(() => {
      this.game.scene.remove(this.container);
    }, 1000);
  }
  
  playDeathAnimation() {
    // Rotate the entire mesh group to fall over
    this.mesh.rotation.x = Math.PI / 2;
    this.mesh.position.y = 0.2; // Lower position to lie on ground
    
    // Hide health bar
    this.healthBarContainer.visible = false;
    
    // Fade out
    const fadeOut = () => {
      this.mesh.children.forEach(child => {
        const opacity = child.material.opacity - 0.05;
        if (opacity > 0) {
          child.material.opacity = opacity;
          setTimeout(fadeOut, 50);
        } else {
          // Mark animation as complete when opacity reaches 0
          this.animationComplete = true;
        }
      });
    };
    
    this.mesh.children.forEach(child => {
      child.material.transparent = true;
    });
    setTimeout(fadeOut, 500);
  }

  logPosition() {
    // Debug-Methode - Entferne in der Produktion
    // console.log(`Zombie position: ${this.container.position.x.toFixed(2)}, ${this.container.position.z.toFixed(2)}, isAlive: ${this.isAlive}, path length: ${this.path.length}`);
  }

  findPath() {
    // Wenn keine Navigation-Grid vorhanden ist, abbrechen
    if (!this.game.map.navigationGrid) {
      // console.error("Navigation grid is undefined!");
      return;
    }
    
    // Positionen in Grid-Koordinaten umrechnen
    const startX = Math.floor(this.container.position.x + this.game.map.width / 2);
    const startY = Math.floor(this.container.position.z + this.game.map.height / 2);
    
    const playerX = Math.floor(this.game.player.container.position.x + this.game.map.width / 2);
    const playerY = Math.floor(this.game.player.container.position.z + this.game.map.height / 2);
    
    // Prüfen, ob Start- und Zielpunkt innerhalb der Grenzen liegen
    if (startX < 0 || startX >= this.game.map.width || startY < 0 || startY >= this.game.map.height ||
        playerX < 0 || playerX >= this.game.map.width || playerY < 0 || playerY >= this.game.map.height) {
      
      // Direkte Pfadsuche verwenden, wenn außerhalb der Grenzen
      // console.warn("Zombie or player outside grid bounds - using direct path");
      this.createDirectPath();
      return;
    }
  }

  createPathDebug() {
    // Debug-Methode - Entferne in der Produktion
    // console.log(`Zombie path created with ${this.path.length} points`);
  }

  logMovement() {
    // Debug-Methode - Entferne in der Produktion
    // const distanceToPlayer = this.container.position.distanceTo(this.game.player.container.position);
    // console.log(`Zombie movement: distance to player ${distanceToPlayer.toFixed(2)}, attack range: ${this.attackRange}, target: ${this.targetPosition ? this.targetPosition.x.toFixed(2) + ',' + this.targetPosition.z.toFixed(2) : 'none'}`);
  }

  logWalkableCheck(position, centerWalkable) {
    console.log(`Position walkable check: ${position.x.toFixed(2)}, ${position.z.toFixed(2)}, center: ${centerWalkable}`);
  }
} 