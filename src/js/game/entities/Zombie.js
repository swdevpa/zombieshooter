import * as THREE from 'three';
import { ZombieFactory } from './zombies/ZombieFactory.js';

export class Zombie {
  constructor(game, assetLoader, position, options = {}) {
    this.game = game;
    this.assetLoader = assetLoader;
    
    // Process options with defaults
    this.options = {
      type: 'standard', // standard, runner, brute
      ...options
    };
    
    // Validate position or use a default
    if (!position || isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
      console.warn('Invalid position provided to Zombie constructor, using default position');
      this.position = new THREE.Vector3(0, 0, 0);
    } else {
      this.position = position.clone();
    }

    // Create zombie factory if it doesn't exist yet (singleton pattern)
    if (!game.zombieFactory) {
      game.zombieFactory = new ZombieFactory(assetLoader);
    }
    
    // Get zombie properties based on type
    const properties = game.zombieFactory.getZombieProperties(this.options.type);
    
    // Zombie properties
    this.health = properties.health;
    this.maxHealth = properties.maxHealth;
    this.damage = properties.damage;
    this.speed = properties.speed; // Units per second
    this.attackRange = properties.attackRange; // How close zombie needs to be to attack
    this.attackSpeed = properties.attackSpeed; // Seconds between attacks
    this.lastAttackTime = 0;
    this.isAlive = true;
    this.points = properties.points; // Score points for killing this zombie
    this.animationComplete = false; // Flag to track if death animation is done
    this.isMoving = false;

    // Initialize target position
    this.targetPosition = this.position.clone();

    // Pathfinding
    this.pathUpdateInterval = properties.pathUpdateInterval || 1; // Seconds between path updates
    this.lastPathUpdate = 0;
    this.path = []; // Array of positions to follow
    this.isColliding = false; // Flag if zombie is colliding with obstacles
    this.currentPathIndex = 0;
    this.stuckTime = 0; // Time spent stuck in one place
    this.stuckThreshold = 2; // If stuck for this many seconds, find new path
    this.lastPosition = this.position.clone(); // Track last position to detect being stuck

    // Strategic behavior
    this.behavior = this.getBehaviorForType(this.options.type);

    // Create container
    this.container = new THREE.Group();

    // Create zombie model using factory
    this.createZombieModel();

    // Set initial position - make sure position is safe
    this.container.position.copy(this.position);

    // Debug path visualization
    this.debugPathMarkers = [];
    this.debugPathLine = null;
    
    // Set a reference position for logging/debugging
    this.lastKnownValidPosition = this.position.clone();
  }

  /**
   * Get behavior configuration based on zombie type
   * @param {string} type - Zombie type (standard, runner, brute)
   * @returns {Object} Behavior configuration
   */
  getBehaviorForType(type) {
    // Default behaviors
    const behaviors = {
      standard: {
        pathfinding: 'direct', // Direct path to player
        flanking: false,        // Doesn't try to flank
        obstacles: 'avoid',     // Avoids obstacles
        grouping: 'loose',      // Loose grouping with other zombies
        obstacleBreakStrength: 0 // Cannot break obstacles
      },
      runner: {
        pathfinding: 'flanking', // Tries to flank the player
        flanking: true,          // Uses flanking movement
        obstacles: 'avoid',      // Avoids obstacles
        grouping: 'none',        // Doesn't group with others
        obstacleBreakStrength: 0  // Cannot break obstacles
      },
      brute: {
        pathfinding: 'direct',   // Direct path to player
        flanking: false,         // Doesn't try to flank
        obstacles: 'break',      // Can break through some obstacles
        grouping: 'tight',       // Tightly groups with other zombies
        obstacleBreakStrength: 0.5 // Can break some obstacles
      }
    };
    
    return behaviors[type] || behaviors.standard;
  }

  createZombieModel() {
    // Create model based on zombie type
    this.model = this.game.zombieFactory.createZombieModel(this.options.type);
    
    // Add model to container
    this.container.add(this.model.getContainer());
  }

  update(deltaTime) {
    if (!this.isAlive) {
      // Only update animation for dead zombies
      if (this.model) {
        this.model.update(deltaTime);
      }
      return;
    }

    // Check if zombie is stuck
    this.checkIfStuck(deltaTime);

    // Update pathfinding
    this.updatePathfinding(deltaTime);

    // Update movement based on path
    this.updateMovement(deltaTime);

    // Update attack logic
    this.updateAttack();

    // Update model animations
    if (this.model) {
      // Update animation state based on zombie behavior
      if (this.isMoving) {
        this.model.setAnimationState('walking');
      } else if (this.model.animation.state === 'walking') {
        this.model.setAnimationState('idle');
      }
      
      // Update model (handles animations)
      this.model.update(deltaTime);
      
      // Update health bar
      this.model.updateHealthBar(this.health, this.maxHealth);
    }
  }

  /**
   * Check if zombie is stuck and handle accordingly
   * @param {number} deltaTime - Time since last frame
   */
  checkIfStuck(deltaTime) {
    // Calculate distance moved since last check
    const currentPos = this.container.position.clone();
    const distanceMoved = currentPos.distanceTo(this.lastPosition);
    
    // If barely moving but should be moving, increment stuck timer
    if (distanceMoved < 0.05 && this.isMoving) {
      this.stuckTime += deltaTime;
      
      // If stuck for too long, find a new path
      if (this.stuckTime > this.stuckThreshold) {
        this.forcePathRecalculation();
        this.stuckTime = 0;
      }
    } else {
      // Reset stuck timer if moving properly
      this.stuckTime = 0;
    }
    
    // Update last position
    this.lastPosition.copy(currentPos);
  }

  /**
   * Force path recalculation when stuck
   */
  forcePathRecalculation() {
    // Clear the current path
    this.path = [];
    this.currentPathIndex = 0;
    
    // Find a new path with some randomness
    if (this.game.player && this.game.player.isAlive) {
      const playerPos = this.game.player.container.position.clone();
      
      // If this is a flanking zombie, add some randomness to target position
      if (this.behavior.flanking) {
        const flankAngle = Math.random() * Math.PI * 2;
        const flankDistance = 5 + Math.random() * 5;
        
        playerPos.x += Math.cos(flankAngle) * flankDistance;
        playerPos.z += Math.sin(flankAngle) * flankDistance;
      }
      
      // Use pathfinding to get a new path
      this.findPathToPosition(playerPos);
    }
    
    // If still no path, try a random direction
    if (this.path.length === 0) {
      const randomDirection = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        0,
        (Math.random() - 0.5) * 10
      );
      
      const randomTarget = this.container.position.clone().add(randomDirection);
      this.path = [randomTarget];
    }
  }

  updatePathfinding(deltaTime) {
    this.lastPathUpdate += deltaTime;

    // Update path if enough time has passed since last update
    if (this.lastPathUpdate >= this.pathUpdateInterval) {
      // Only recalculate if player exists
      if (this.game.player && this.game.player.isAlive) {
        this.findPathToPlayer();
      }
      this.lastPathUpdate = 0;
    }
  }

  findPathToPlayer() {
    if (!this.game.player || !this.game.player.isAlive) {
      this.path = [];
      return;
    }

    // Get player position
    const playerPos = this.game.player.container.position.clone();
    playerPos.y = 0; // Keep on ground level
    
    // Get current position
    const currentPos = this.container.position.clone();
    currentPos.y = 0; // Keep on ground level
    
    // Use navigation grid if available
    if (this.game.navigationGrid) {
      // Apply behavior modifiers
      let targetPos = playerPos;
      
      // For runner zombies (flanking behavior), try to attack from a different angle
      if (this.options.type === 'runner') {
        // Calculate distance to player
        const distanceToPlayer = currentPos.distanceTo(playerPos);
        
        // Only try to flank if not too close to player
        if (distanceToPlayer > 10) {
          // Calculate a flanking position
          const angle = Math.random() * Math.PI * 2; // Random angle
          const flankDistance = 5 + Math.random() * 5; // Random distance
          
          // Add flanking offset to player position
          targetPos = playerPos.clone();
          targetPos.x += Math.cos(angle) * flankDistance;
          targetPos.z += Math.sin(angle) * flankDistance;
        }
      }
      
      // Find path using navigation grid
      const path = this.game.navigationGrid.findPath(currentPos, targetPos);
      
      // If path found, use it
      if (path && path.length > 0) {
        // Apply path simplification for better movement
        this.path = this.game.navigationGrid.simplifyPath(path);
        this.currentPathIndex = 0;
        this.targetPosition = this.path[0];
      } else {
        // If no path found, use direct path as fallback
        this.path = [playerPos];
        this.targetPosition = playerPos;
      }
      
      // Visualize path if debug is enabled
      if (this.game.debugPathfinding) {
        this.visualizePath();
      }
      
      return;
    }
    
    // Legacy fallback if no navigation grid is available
    // Use a direct path to the player
    this.path = [playerPos];
    this.targetPosition = playerPos;
  }

  /**
   * Find path to a specific position using NavigationGrid
   * @param {THREE.Vector3} targetPos - Target position
   */
  findPathToPosition(targetPos) {
    // Check if navigation grid exists
    if (!this.game.navigationGrid) {
      console.warn('Navigation grid not initialized, using direct path');
      this.path = [targetPos.clone()];
      return;
    }
    
    // Get current position
    const currentPos = this.container.position.clone();
    currentPos.y = 0; // Keep on ground level
    
    // Find path using navigation grid
    const path = this.game.navigationGrid.findPath(currentPos, targetPos);
    
    // If path was found, use it
    if (path && path.length > 0) {
      // Simplify path to remove unnecessary waypoints
      this.path = this.game.navigationGrid.simplifyPath(path);
      this.currentPathIndex = 0;
      this.targetPosition = this.path[0];
    } else {
      // If no path found, use direct path as fallback
      this.path = [targetPos.clone()];
      this.currentPathIndex = 0;
      this.targetPosition = this.path[0];
    }
    
    // Visualize path if debug is enabled
    if (this.game.debugPathfinding) {
      this.visualizePath();
    }
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
   * @param {number} mapOffsetX - Map X offset
   * @param {number} mapOffsetZ - Map Z offset
   * @param {number} tileSize - Size of each tile
   * @returns {Array} Array of Vector3 positions for the path
   */
  reconstructPath(cameFrom, current, mapOffsetX, mapOffsetZ, tileSize) {
    const path = [];
    
    // Build path from target back to start
    while (cameFrom.has(current)) {
      const [x, z] = current.split(',').map(Number);
      
      // Convert grid coordinates to world position
      const worldX = x * tileSize + mapOffsetX;
      const worldZ = z * tileSize + mapOffsetZ;
      
      path.push(new THREE.Vector3(worldX, 0, worldZ));
      
      current = cameFrom.get(current);
    }
    
    // Reverse to get path from start to target
    return path.reverse();
  }

  updateMovement(deltaTime) {
    if (!this.isAlive || this.path.length === 0) {
      this.isMoving = false;
      return;
    }

    // Get current target from path
    if (this.currentPathIndex < this.path.length) {
      this.targetPosition = this.path[this.currentPathIndex];
    } else {
      // If we've reached the end of the path, get the last point
      this.targetPosition = this.path[this.path.length - 1];
    }

    // Calculate direction to target
    const direction = new THREE.Vector3();
    direction.subVectors(this.targetPosition, this.container.position);
    direction.y = 0; // Keep on ground level

    // Distance to target
    const distance = direction.length();

    // If very close to current target point, move to next point in path
    if (distance < 0.5 && this.currentPathIndex < this.path.length - 1) {
      this.currentPathIndex++;
      return;
    }

    // If we're not moving (too close to target), stop here
    if (distance < 0.1) {
      this.isMoving = false;
      return;
    }

    // Normalize direction
    direction.normalize();

    // Calculate movement step based on speed and delta time
    // Apply type-specific speed modifications
    let adjustedSpeed = this.speed;
    
    // Runner zombies move faster when further from player
    if (this.options.type === 'runner') {
      const distanceToPlayer = this.container.position.distanceTo(this.game.player.container.position);
      if (distanceToPlayer > 10) {
        adjustedSpeed *= 1.2; // Move faster when flanking
      }
    }
    
    // Brute zombies slow down when turning
    if (this.options.type === 'brute') {
      // Calculate angle between current direction and target direction
      const currentDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(this.container.quaternion);
      const angleToTarget = currentDirection.angleTo(direction);
      
      // Slow down when turning sharply
      if (angleToTarget > Math.PI / 4) {
        adjustedSpeed *= 0.7; // Significant slow down for sharp turns
      }
    }
    
    const movementSpeed = adjustedSpeed * deltaTime;
    const step = direction.multiplyScalar(movementSpeed);

    // Calculate new position
    const newPosition = this.container.position.clone().add(step);

    // Store current position in case we need to revert
    const originalPosition = this.container.position.clone();
    
    // Check if new position is walkable based on zombie type
    let canMove = true;
    
    // Check collision with the city
    if (this.game.city) {
      // Check if position is in a building
      const inBuilding = this.game.city.isPositionInBuilding(newPosition);
      
      // Check collision with city components
      const componentCollision = this.game.city.checkComponentCollision(newPosition, 0.4);
      
      // Brutes can break through some obstacles
      if (this.options.type === 'brute' && this.behavior.obstacles === 'break') {
        // Brutes can move through destructible obstacles randomly
        if (componentCollision && Math.random() < this.behavior.obstacleBreakStrength) {
          // Allow movement through obstacle
          canMove = !inBuilding; // Still can't go through buildings
          
          // TODO: Add obstacle destruction effect here
        } else {
          canMove = !inBuilding && !componentCollision;
        }
      } else {
        // Standard and runner zombies must avoid all obstacles
        canMove = !inBuilding && !componentCollision;
      }
    }
    
    // Check collision with navigation grid
    if (canMove && this.game.navigationGrid) {
      canMove = this.game.navigationGrid.isWalkable(newPosition);
    }

    // If position is valid, update it
    if (canMove) {
      this.container.position.copy(newPosition);
      this.position.copy(newPosition);
      this.isMoving = true;
      this.isColliding = false;
    } else {
      // Collision detected, update flag and try to slide along obstacles
      this.isColliding = true;
      
      // Try sliding along obstacles (collision response)
      this.handleCollisionResponse(originalPosition, direction, movementSpeed);
    }
    
    // Rotate zombie to face movement direction
    if (this.isMoving) {
      // Different turning speeds for different zombie types
      let rotationSpeed = 5;
      
      if (this.options.type === 'runner') {
        rotationSpeed = 8; // Runners turn quickly
      } else if (this.options.type === 'brute') {
        rotationSpeed = 3; // Brutes turn slowly
      }
      
      this.rotateTowardsDirection(direction, deltaTime, rotationSpeed);
    } else {
      // If not moving but player is close, rotate towards player
      this.rotateTowardsPlayer(deltaTime);
    }
  }
  
  /**
   * Rotate zombie towards a specific direction
   * @param {THREE.Vector3} direction - Direction to rotate towards
   * @param {number} deltaTime - Time since last frame
   * @param {number} speed - Rotation speed
   */
  rotateTowardsDirection(direction, deltaTime, speed = 5) {
    // Calculate target rotation based on direction
    const targetRotation = Math.atan2(direction.x, direction.z);
    
    // Get current rotation
    const currentRotation = this.container.rotation.y;
    
    // Calculate the shortest rotation path
    let delta = targetRotation - currentRotation;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    
    // Apply rotation with smoothing
    const rotationSpeed = speed * deltaTime;
    this.container.rotation.y += delta * rotationSpeed;
  }
  
  /**
   * Rotate zombie towards player
   * @param {number} deltaTime - Time since last frame
   */
  rotateTowardsPlayer(deltaTime) {
    if (!this.game.player || !this.game.player.isAlive) return;
    
    // Get direction to player
    const playerDirection = new THREE.Vector3();
    playerDirection.subVectors(
      this.game.player.container.position,
      this.container.position
    );
    playerDirection.y = 0; // Keep on ground level
    
    // Only rotate if player is within range
    if (playerDirection.length() < 20) {
      playerDirection.normalize();
      
      // Different rotation speeds based on zombie type
      let rotationSpeed = 3;
      
      if (this.options.type === 'runner') {
        rotationSpeed = 5; // Runners are more responsive
      } else if (this.options.type === 'brute') {
        rotationSpeed = 2; // Brutes turn slowly
      }
      
      this.rotateTowardsDirection(playerDirection, deltaTime, rotationSpeed);
    }
  }
  
  /**
   * Handle collision response by sliding along obstacles
   * @param {THREE.Vector3} originalPosition - Original position before collision
   * @param {THREE.Vector3} direction - Attempted movement direction
   * @param {number} movementSpeed - Speed of attempted movement
   */
  handleCollisionResponse(originalPosition, direction, movementSpeed) {
    // Try to slide horizontally (X-axis)
    const horizontalStep = new THREE.Vector3(direction.x, 0, 0).normalize().multiplyScalar(movementSpeed);
    const horizontalPosition = originalPosition.clone().add(horizontalStep);
    
    // Check if horizontal movement is valid
    let horizontalValid = true;
    
    if (this.game.city) {
      horizontalValid = !this.game.city.isPositionInBuilding(horizontalPosition) && 
                       !this.game.city.checkComponentCollision(horizontalPosition, 0.4);
    }
    
    if (horizontalValid && this.game.navigationGrid) {
      horizontalValid = this.game.navigationGrid.isWalkable(horizontalPosition);
    }
    
    // Try to slide vertically (Z-axis)
    const verticalStep = new THREE.Vector3(0, 0, direction.z).normalize().multiplyScalar(movementSpeed);
    const verticalPosition = originalPosition.clone().add(verticalStep);
    
    // Check if vertical movement is valid
    let verticalValid = true;
    
    if (this.game.city) {
      verticalValid = !this.game.city.isPositionInBuilding(verticalPosition) && 
                     !this.game.city.checkComponentCollision(verticalPosition, 0.4);
    }
    
    if (verticalValid && this.game.navigationGrid) {
      verticalValid = this.game.navigationGrid.isWalkable(verticalPosition);
    }
    
    // Apply the valid movement, prioritizing the larger component
    if (horizontalValid && Math.abs(direction.x) >= Math.abs(direction.z)) {
      this.container.position.copy(horizontalPosition);
      this.position.copy(horizontalPosition);
      this.isMoving = true;
    } else if (verticalValid) {
      this.container.position.copy(verticalPosition);
      this.position.copy(verticalPosition);
      this.isMoving = true;
    } else {
      // If both fail, stay in place
      this.isMoving = false;
    }
  }

  updateCollisionFeedback() {
    // Visual feedback when colliding
    if (this.model && this.isColliding) {
      // Change color or add other visual feedback
      // For now, we'll skip this as the sliding movement provides enough feedback
    }
  }

  visualizePath() {
    // Clean up previous debug visualization
    for (const marker of this.debugPathMarkers) {
      this.game.scene.remove(marker);
    }
    
    if (this.debugPathLine) {
      this.game.scene.remove(this.debugPathLine);
    }
    
    this.debugPathMarkers = [];
    this.debugPathLine = null;
    
    // Skip if path is empty or debug is disabled
    if (!this.path || this.path.length === 0 || !this.game.debugPathfinding) return;
    
    // Create markers for each point in path
    for (let i = 0; i < this.path.length; i++) {
      const point = this.path[i];
      
      // Create marker
      const geometry = new THREE.SphereGeometry(0.1, 8, 8);
      const material = new THREE.MeshBasicMaterial({ 
        color: i === this.currentPathIndex ? 0xff0000 : 0x00ff00 
      });
      const marker = new THREE.Mesh(geometry, material);
      
      // Position marker
      marker.position.copy(point);
      marker.position.y = 0.1; // Lift slightly above ground
      
      // Add to scene
      this.game.scene.add(marker);
      this.debugPathMarkers.push(marker);
    }
    
    // Create line visualization
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = [];
    
    // Add zombie's current position as the first point
    linePositions.push(
      this.container.position.x,
      this.container.position.y + 0.1,
      this.container.position.z
    );
    
    // Add all path points
    for (const point of this.path) {
      linePositions.push(
        point.x,
        point.y + 0.1,
        point.z
      );
    }
    
    // Create line geometry
    lineGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(linePositions, 3)
    );
    
    // Create line material based on zombie type
    let lineColor = 0xffff00; // Yellow for standard
    
    if (this.options.type === 'runner') {
      lineColor = 0x00ffff; // Cyan for runners
    } else if (this.options.type === 'brute') {
      lineColor = 0xff0000; // Red for brutes
    }
    
    const lineMaterial = new THREE.LineBasicMaterial({ color: lineColor });
    
    // Create line
    this.debugPathLine = new THREE.Line(lineGeometry, lineMaterial);
    
    // Add to scene
    this.game.scene.add(this.debugPathLine);
  }

  isPositionWalkable(position, radius) {
    // Use game.navigationGrid if available
    if (this.game.navigationGrid) {
      return this.game.navigationGrid.isWalkable(position);
    }
    
    // If no navigation grid, use legacy collision checks
    const centerWalkable = !this.game.city.isPositionInBuilding(position) && 
                         !this.game.city.checkComponentCollision(position, radius);
    
    return centerWalkable;
  }

  updateAttack() {
    if (!this.isAlive || !this.game.player || !this.game.player.isAlive) return;
    
    // Check if player is in range for attack
    const distanceToPlayer = this.container.position.distanceTo(this.game.player.container.position);
    
    if (distanceToPlayer <= this.attackRange) {
      const currentTime = performance.now() / 1000;
      
      // Check if enough time has passed since last attack
      if (currentTime - this.lastAttackTime >= this.attackSpeed) {
        this.attackPlayer();
        this.lastAttackTime = currentTime;
      }
    }
  }

  attackPlayer() {
    if (!this.game.player || !this.game.player.isAlive) return;
    
    // Apply damage to player
    this.game.player.takeDamage(this.damage);
    
    // Play attack animation
    this.playAttackAnimation();
  }

  playAttackAnimation() {
    if (this.model) {
      this.model.setAnimationState('attacking');
    }
  }

  takeDamage(amount) {
    if (!this.isAlive) return;
    
    // Reduce health
    this.health -= amount;
    
    // Play damage animation/feedback
    this.playDamageAnimation();
    
    // Check if zombie is dead
    if (this.health <= 0) {
      this.health = 0;
      this.die();
      
      // Update game state
      if (this.game.gameState) {
        this.game.gameState.zombiesKilled++;
        this.game.gameState.score += this.points;
      }
    }
  }

  playDamageAnimation() {
    if (this.model) {
      // Play hit animation
      this.model.showDamageEffect();
    }
  }

  die() {
    this.isAlive = false;
    
    // Play death animation
    this.playDeathAnimation();
    
    // Clean up debug visualization
    for (const marker of this.debugPathMarkers) {
      this.game.scene.remove(marker);
    }
    
    if (this.debugPathLine) {
      this.game.scene.remove(this.debugPathLine);
    }
    
    this.debugPathMarkers = [];
    this.debugPathLine = null;
  }

  playDeathAnimation() {
    if (this.model) {
      this.model.setAnimationState('dying');
    }
  }

  logPosition() {
    console.log(`Zombie position: x=${this.container.position.x.toFixed(2)}, y=${this.container.position.y.toFixed(2)}, z=${this.container.position.z.toFixed(2)}`);
  }
  
  /**
   * Clean up when zombie is removed
   */
  dispose() {
    // Clean up debug visualization
    for (const marker of this.debugPathMarkers) {
      this.game.scene.remove(marker);
    }
    
    if (this.debugPathLine) {
      this.game.scene.remove(this.debugPathLine);
    }
    
    this.debugPathMarkers = [];
    this.debugPathLine = null;
    
    // Clean up model
    if (this.model) {
      this.model.dispose();
    }
  }
}
