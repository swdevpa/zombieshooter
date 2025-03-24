import * as THREE from 'three';
import { ZombieFactory } from './zombies/ZombieFactory.js';

export class Zombie {
  constructor(game, assetLoader, position, options = {}) {
    this.game = game;
    this.assetLoader = assetLoader;
    
    // Process options with defaults
    this.options = {
      type: 'standard', // standard, runner, brute, exploder, spitter, screamer
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

    // Special effects
    this.healthRegen = 0; // Health regeneration per second (set by modifiers)
    
    // Exploder zombie properties
    this.explodeOnDeath = this.options.type === 'exploder'; // Always explode if exploder type
    this.explosionDamage = properties.explosionDamage || 30; // Damage caused by explosion
    this.explosionRadius = properties.explosionRadius || 3; // Radius of explosion
    
    // Spitter zombie properties
    this.canSpitAcid = this.options.type === 'spitter';
    this.projectileDamage = properties.projectileDamage || 12;
    this.projectileSpeed = properties.projectileSpeed || 10.0;
    this.acidDuration = properties.acidDuration || 3.0;
    this.lastSpitTime = 0;
    this.spitCooldown = 3.0; // Seconds between acid attacks
    
    // Screamer zombie properties
    this.canScream = this.options.type === 'screamer';
    this.screamRadius = properties.screamRadius || 15.0;
    this.screamCooldown = properties.screamCooldown || 8.0;
    this.lastScreamTime = 0;
    this.hasScreamed = false; // Track if zombie has performed initial scream
    
    // Visual effect objects
    this.specialEffects = [];

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

    // Add reference to zombie in container userData
    this.container.userData.zombieRef = this;

    // Create zombie model using factory
    this.createZombieModel();

    // Set initial position - make sure position is safe
    this.container.position.copy(this.position);

    // Debug path visualization
    this.debugPathMarkers = [];
    this.debugPathLine = null;
    
    // Set a reference position for logging/debugging
    this.lastKnownValidPosition = this.position.clone();

    // Track if zombie is occluded (hidden by buildings)
    this.isOccluded = false;
  }

  /**
   * Get behavior configuration based on zombie type
   * @param {string} type - Zombie type (standard, runner, brute, exploder, spitter, screamer)
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
      },
      exploder: {
        pathfinding: 'direct',   // Direct path to player
        flanking: false,         // Doesn't try to flank
        obstacles: 'avoid',      // Avoids obstacles
        grouping: 'tight',       // Tightly groups to maximize explosion effect
        obstacleBreakStrength: 0.1 // Can break weak obstacles when exploding
      },
      spitter: {
        pathfinding: 'distance', // Tries to maintain optimal attack distance
        flanking: true,          // Uses flanking to get good shot angles
        obstacles: 'avoid',      // Avoids obstacles
        grouping: 'loose',       // Loose grouping
        obstacleBreakStrength: 0, // Cannot break obstacles
        preferredDistance: 4.0    // Optimal distance for acid attacks
      },
      screamer: {
        pathfinding: 'support',  // Stays near other zombies to maximize scream effect
        flanking: false,         // Doesn't try to flank
        obstacles: 'avoid',      // Avoids obstacles
        grouping: 'command',     // Tries to be in the middle of zombie groups
        obstacleBreakStrength: 0  // Cannot break obstacles
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
      // Update death animation/timer
      this.updateDeath(deltaTime);
      return;
    }
    
    // Skip updates for occluded zombies to improve performance
    // Except pathfinding - we want zombies to still navigate around buildings
    if (this.isOccluded && !this.isAttacking && this.distanceToPlayer > 10) {
      // Still update path at a reduced rate for occluded zombies
      this.pathUpdateTimer += deltaTime;
      if (this.pathUpdateTimer > this.pathUpdateInterval * 3) { // 3x slower updates for occluded zombies
        this.pathUpdateTimer = 0;
        this.updatePath();
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
    this.updateAttack(deltaTime);

    // Handle special abilities based on zombie type
    this.updateSpecialAbilities(deltaTime);

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

    // Apply health regeneration if active
    if (this.healthRegen > 0) {
      this.regenerateHealth(deltaTime);
    }
    
    // Update special effects
    this.updateSpecialEffects(deltaTime);
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

  updateAttack(deltaTime) {
    if (!this.isAlive || !this.game.player) return;
    
    const time = performance.now() / 1000;
    
    // Check if player is in attack range
    const playerPosition = this.game.player.container.position;
    const zombiePosition = this.container.position;
    const distanceToPlayer = zombiePosition.distanceTo(playerPosition);
    
    // For spitters, prefer to use acid attack at range rather than getting close
    if (this.canSpitAcid && distanceToPlayer < this.attackRange && distanceToPlayer > 2.0) {
      // Handle in updateSpecialAbilities - don't try to get closer
      return;
    }
    
    // For standard melee attacks, need to be close to player
    if (distanceToPlayer <= this.attackRange) {
      // Face the player
      this.rotateTowardsPlayer(deltaTime);
      
      // Attack if cooldown has passed
      if (time - this.lastAttackTime > this.attackSpeed) {
        this.attackPlayer();
        this.lastAttackTime = time;
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

  /**
   * Take damage from player or other sources
   * @param {number} amount - Amount of damage to take
   * @param {Object} options - Additional options for damage
   * @param {string} options.hitZone - The zone that was hit (head, torso, limb)
   * @param {boolean} options.isCritical - Whether this was a critical hit
   * @param {string} options.damageSource - Source of the damage (player, explosion, etc.)
   * @returns {boolean} Whether the zombie is still alive
   */
  takeDamage(amount, options = {}) {
    // Default options
    const { 
      hitZone = 'torso', 
      isCritical = false, 
      damageSource = 'player' 
    } = options;
    
    if (!this.isAlive) return false;
    
    // Apply damage with hit zone modifiers
    let actualDamage = amount;
    
    // Apply hit zone modifiers
    if (hitZone === 'head') {
      actualDamage *= 2.5; // Headshots do extra damage
      
      // If this is a headshot with enough damage, instant kill
      if (actualDamage > this.health * 0.7) {
        actualDamage = this.health; // Ensure death
      }
    } else if (hitZone === 'limb') {
      actualDamage *= 0.7; // Limb shots do less damage
    }
    
    // Apply zombie type-specific modifiers
    if (this.options.type === 'brute') {
      actualDamage *= 0.7; // Brutes are more resistant
    } else if (this.options.type === 'runner') {
      actualDamage *= 0.8; // Runners are slightly resistant
    } else if (this.options.type === 'exploder') {
      actualDamage *= 1.2; // Exploders are more vulnerable
    } else if (this.options.type === 'spitter') {
      actualDamage *= 1.1; // Spitters are slightly vulnerable
    }
    
    // Apply critical hit modifier
    if (isCritical) {
      actualDamage *= 1.5;
    }
    
    // Round to whole number
    actualDamage = Math.round(actualDamage);
    
    // Reduce health
    this.health = Math.max(0, this.health - actualDamage);
    
    // Update and show health bar
    if (this.model) {
      this.model.showDamage();
      this.model.updateHealthBar(this.health, this.maxHealth);
    }
    
    // Play damage animation
    this.playDamageAnimation(hitZone, isCritical);
    
    // Check if dead
    if (this.health <= 0 && this.isAlive) {
      this.die();
      
      // Record kill in ZombieManager
      if (this.game && this.game.zombieManager) {
        this.game.zombieManager.recordZombieKill(this);
      }
      
      return false;
    }
    
    // Alert nearby zombies based on damage amount and source
    if (this.game && this.game.zombieManager) {
      const alertRadius = this.options.type === 'screamer' ? 20 : 8;
      this.game.zombieManager.alertZombiesInRadius(this.position.clone(), alertRadius, this);
    }
    
    return true;
  }

  /**
   * Play appropriate damage animation based on hit zone
   * @param {string} hitZone - The zone that was hit
   * @param {boolean} isCritical - Whether this was a critical hit
   */
  playDamageAnimation(hitZone = 'torso', isCritical = false) {
    if (!this.model || !this.isAlive) return;
    
    // Don't interrupt death animation
    if (this.model.animation && this.model.animation.state === 'dying') return;
    
    // Play different animations based on hit zone
    if (hitZone === 'head') {
      // Head shot reaction
      this.model.setAnimationState('headshot');
      
      // Special reaction for critical headshots
      if (isCritical) {
        this.createHeadshotEffect(this.position.clone().add(new THREE.Vector3(0, 1.7, 0)));
      }
    } else if (hitZone === 'limb') {
      // Limb shot reaction
      this.model.setAnimationState('limb_hit');
    } else {
      // Default torso reaction
      this.model.setAnimationState('hit');
    }
    
    // Create blood spray effect at hit position
    const hitPosition = this.position.clone();
    hitPosition.y += (hitZone === 'head') ? 1.7 : 
                     (hitZone === 'limb') ? 0.8 : 1.2;
    
    // Offset position slightly based on look direction
    const lookDir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.container.quaternion);
    hitPosition.add(lookDir.multiplyScalar(-0.1)); // Slightly behind zombie
    
    this.createBloodSprayEffect(hitPosition, hitZone, isCritical);
    
    // Flash zombie red briefly using ZombieModel's damage flash
    if (this.model.setDamageFlash) {
      this.model.setDamageFlash(true);
      
      // Clear any existing flash timeout
      if (this.damageFlashTimeout) {
        clearTimeout(this.damageFlashTimeout);
      }
      
      // Reset damage flash after a short time
      this.damageFlashTimeout = setTimeout(() => {
        if (this.model && this.model.setDamageFlash) {
          this.model.setDamageFlash(false);
        }
      }, 200);
    }
  }
  
  /**
   * Create blood spray effect at hit position
   * @param {Vector3} position - Position for blood effect
   * @param {string} hitZone - The zone that was hit
   * @param {boolean} isCritical - Whether this was a critical hit
   */
  createBloodSprayEffect(position, hitZone = 'torso', isCritical = false) {
    // Create particle system for blood spray
    const particleCount = isCritical ? 50 : 20;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    // Initial position (all at impact point)
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = position.x;
      particlePositions[i * 3 + 1] = position.y;
      particlePositions[i * 3 + 2] = position.z;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    // Create particle material
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xaa0000,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    // Create particle system
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    
    // Add to scene
    if (this.game && this.game.scene) {
      this.game.scene.add(particles);
    }
    
    // Calculate spray direction (away from player)
    const playerPosition = this.game?.player?.container?.position || new THREE.Vector3(0, 0, 0);
    const direction = new THREE.Vector3().subVectors(position, playerPosition).normalize();
    
    // Setup velocity and lifetime for particles
    const velocities = [];
    const lifetimes = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Spread factor depends on hit zone and critical
      const spreadFactor = hitZone === 'head' ? 0.3 : 0.15;
      const velocityMultiplier = hitZone === 'head' ? 1.5 : 1.0;
      
      // Base direction plus random spread
      const particleDir = direction.clone();
      particleDir.x += (Math.random() - 0.5) * spreadFactor;
      particleDir.y += (Math.random() - 0.5) * spreadFactor;
      particleDir.z += (Math.random() - 0.5) * spreadFactor;
      particleDir.normalize();
      
      // Speed depends on critical and random factor
      const speed = (0.5 + Math.random() * 0.5) * velocityMultiplier * (isCritical ? 1.5 : 1.0);
      const velocity = particleDir.multiplyScalar(speed);
      
      velocities.push(velocity);
      
      // Random lifetime between 0.3 and 0.8 seconds
      lifetimes.push(300 + Math.random() * 500);
    }
    
    // Start time
    const startTime = Date.now();
    
    // Update function for particles
    const updateParticles = () => {
      const now = Date.now();
      const elapsedTime = now - startTime;
      let particlesAlive = false;
      
      // Update positions based on velocity and time
      for (let i = 0; i < particleCount; i++) {
        if (elapsedTime < lifetimes[i]) {
          const deltaSeconds = Math.min(elapsedTime / 1000, 0.1);
          
          // Update position
          particlePositions[i * 3] += velocities[i].x * deltaSeconds;
          particlePositions[i * 3 + 1] += velocities[i].y * deltaSeconds - 1.0 * deltaSeconds * deltaSeconds; // Gravity
          particlePositions[i * 3 + 2] += velocities[i].z * deltaSeconds;
          
          particlesAlive = true;
        } else {
          // Particle is dead, move far away
          particlePositions[i * 3] = 1000;
          particlePositions[i * 3 + 1] = 1000;
          particlePositions[i * 3 + 2] = 1000;
        }
      }
      
      // Update the buffer attribute
      particles.geometry.attributes.position.needsUpdate = true;
      
      // Update material opacity for fade-out
      particles.material.opacity = Math.max(0, 0.8 * (1 - elapsedTime / 1000));
      
      if (particlesAlive && elapsedTime < 1000) {
        // Continue updating
        requestAnimationFrame(updateParticles);
      } else {
        // Cleanup particles
        if (particles.parent) {
          particles.parent.remove(particles);
        }
        particleGeometry.dispose();
        particleMaterial.dispose();
      }
    };
    
    // Start update loop
    requestAnimationFrame(updateParticles);
  }
  
  /**
   * Create headshot effect
   * @param {Vector3} position - Position for headshot effect
   */
  createHeadshotEffect(position) {
    // Create a special effect for critical headshots
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    
    const headshot = new THREE.Mesh(geometry, material);
    headshot.position.copy(position);
    
    // Add to scene
    if (this.game && this.game.scene) {
      this.game.scene.add(headshot);
    }
    
    // Start time
    const startTime = Date.now();
    
    // Update function for headshot effect
    const updateHeadshot = () => {
      const now = Date.now();
      const elapsedTime = now - startTime;
      
      if (elapsedTime < 300) {
        // Scale up and fade out
        const scale = 1 + elapsedTime / 100;
        headshot.scale.set(scale, scale, scale);
        
        headshot.material.opacity = Math.max(0, 0.8 * (1 - elapsedTime / 300));
        
        // Continue updating
        requestAnimationFrame(updateHeadshot);
      } else {
        // Cleanup effect
        if (headshot.parent) {
          headshot.parent.remove(headshot);
        }
        geometry.dispose();
        material.dispose();
      }
    };
    
    // Start update loop
    requestAnimationFrame(updateHeadshot);
  }

  /**
   * Handle zombie death
   */
  die() {
    this.isAlive = false;
    
    // Stop zombie movement
    this.isMoving = false;
    
    // Play death animation
    this.playDeathAnimation();
    
    // Handle exploder zombie death explosion
    if (this.explodeOnDeath) {
      // Small delay before explosion
      setTimeout(() => {
        this.explode();
      }, 500);
    }
    
    // Remove from navigation grid if needed
    if (this.game.navigationGrid) {
      this.game.navigationGrid.removeEntity(this);
    }
  }
  
  /**
   * Exploder zombie explosion
   */
  explode() {
    const explosionPosition = this.container.position.clone();
    
    // Create explosion effect
    this.createExplosionEffect(explosionPosition);
    
    // Damage nearby entities
    this.damageNearbyEntities(explosionPosition);
    
    // Play explosion sound
    // TODO: Add sound effect
  }
  
  /**
   * Create explosion visual effect
   */
  createExplosionEffect(position) {
    // Create explosion geometry
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.9
    });
    
    const explosion = new THREE.Mesh(geometry, material);
    explosion.position.copy(position);
    explosion.position.y += 0.5; // Center of zombie
    
    // Add to scene
    this.game.scene.add(explosion);
    
    // Add to game effects for animation
    this.game.effects = this.game.effects || [];
    this.game.effects.push({
      mesh: explosion,
      type: 'explosion',
      startTime: performance.now() / 1000,
      duration: 0.8,
      maxScale: this.explosionRadius * 2, // Visual radius is larger than damage radius
      update: (deltaTime, time) => {
        // Get age
        const age = time - this.startTime;
        const progress = age / this.duration;
        
        // Expand quickly then slow down
        let scale;
        if (progress < 0.3) {
          // Fast initial expansion
          scale = this.maxScale * (progress / 0.3) * 0.8;
        } else {
          // Slower afterwards
          scale = this.maxScale * (0.8 + 0.2 * ((progress - 0.3) / 0.7));
        }
        
        explosion.scale.set(scale, scale, scale);
        
        // Color changes from orange to black
        const color = new THREE.Color();
        if (progress < 0.4) {
          // Orange to yellow
          color.setHSL(0.05 + progress * 0.05, 1.0, 0.5);
        } else {
          // Yellow to gray to black
          color.setHSL(0.1, 1.0 - (progress - 0.4) * 1.6, 0.5 - (progress - 0.4) * 0.8);
        }
        explosion.material.color = color;
        
        // Fade out
        explosion.material.opacity = 0.9 * (1 - Math.pow(progress, 2));
        
        // Remove when done
        if (progress >= 1.0) {
          this.game.scene.remove(explosion);
          return true; // Signal to remove from array
        }
        
        return false; // Keep updating
      }
    });
    
    // Create shockwave ring
    const ringGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2; // Flat on ground
    ring.position.copy(position);
    ring.position.y = 0.1; // Just above ground
    
    // Add to scene
    this.game.scene.add(ring);
    
    // Add to game effects
    this.game.effects.push({
      mesh: ring,
      type: 'explosion_ring',
      startTime: performance.now() / 1000,
      duration: 0.6,
      maxScale: this.explosionRadius * 3,
      update: (deltaTime, time) => {
        const age = time - this.startTime;
        const progress = age / this.duration;
        
        // Expand quickly
        const scale = this.maxScale * progress;
        ring.scale.set(scale, scale, scale);
        
        // Fade out
        ring.material.opacity = 0.7 * (1 - progress);
        
        // Remove when done
        if (progress >= 1.0) {
          this.game.scene.remove(ring);
          return true;
        }
        
        return false;
      }
    });
  }
  
  /**
   * Damage entities near explosion
   */
  damageNearbyEntities(position) {
    // Damage player if in range
    const distanceToPlayer = position.distanceTo(this.game.player.container.position);
    if (distanceToPlayer <= this.explosionRadius) {
      // Calculate damage based on distance (more damage closer to explosion)
      const damageMultiplier = 1 - (distanceToPlayer / this.explosionRadius);
      const damage = this.explosionDamage * damageMultiplier;
      
      // Apply damage to player
      this.game.player.takeDamage(damage);
    }
    
    // Damage other zombies if in range (friendly fire)
    if (this.game.zombieManager) {
      this.game.zombieManager.damageZombiesInRadius(
        position,
        this.explosionRadius,
        this.explosionDamage * 0.5, // Reduced damage to other zombies
        this // Don't damage self
      );
    }
    
    // TODO: Damage destructible environment objects
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

  /**
   * Apply health regeneration based on regen rate
   * @param {number} deltaTime - Time since last frame in seconds
   */
  regenerateHealth(deltaTime) {
    if (this.health < this.maxHealth) {
      // Calculate health to regenerate
      const regenAmount = this.healthRegen * deltaTime;
      
      // Apply regeneration
      this.health = Math.min(this.health + regenAmount, this.maxHealth);
      
      // Update health bar if visible
      this.updateHealthBar();
    }
  }

  /**
   * Update special abilities based on zombie type
   */
  updateSpecialAbilities(deltaTime) {
    const time = performance.now() / 1000;
    
    // Handle screamer zombie scream ability
    if (this.canScream) {
      // Check if enough time has passed since last scream
      if (time - this.lastScreamTime > this.screamCooldown) {
        // Only scream if player is nearby or hasn't screamed yet
        const distanceToPlayer = this.container.position.distanceTo(this.game.player.container.position);
        
        if (!this.hasScreamed || distanceToPlayer < this.screamRadius * 0.7) {
          this.scream();
          this.lastScreamTime = time;
          this.hasScreamed = true;
        }
      }
    }
    
    // Handle spitter zombie acid attacks
    if (this.canSpitAcid) {
      // Only spit if cooldown has passed
      if (time - this.lastSpitTime > this.spitCooldown) {
        // Check if player is in range but not too close
        const distanceToPlayer = this.container.position.distanceTo(this.game.player.container.position);
        
        if (distanceToPlayer < this.attackRange && distanceToPlayer > 2.0) {
          // We have line of sight and good range - spit acid
          this.spitAcid();
          this.lastSpitTime = time;
        }
      }
    }
  }
  
  /**
   * Screamer zombie's scream ability
   * Alerts nearby zombies and draws them to player
   */
  scream() {
    // Play scream animation
    if (this.model) {
      this.model.setAnimationState('screaming');
    }
    
    // Play scream sound
    // TODO: Add sound effect
    
    // Create visual effect for scream
    this.createScreamEffect();
    
    // Alert nearby zombies
    if (this.game.zombieManager) {
      this.game.zombieManager.alertZombiesInRadius(
        this.container.position, 
        this.screamRadius, 
        this
      );
    }
  }
  
  /**
   * Create visual effect for screamer's scream
   */
  createScreamEffect() {
    // Create ripple effect to visualize scream radius
    const geometry = new THREE.RingGeometry(0.5, 0.6, 32);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2; // Flat on ground
    ring.position.y = 0.1; // Slightly above ground
    
    this.container.add(ring);
    
    // Add to special effects for animation
    this.specialEffects.push({
      mesh: ring,
      type: 'scream',
      startTime: performance.now() / 1000,
      duration: 2.0,
      initialScale: 0.5,
      targetScale: this.screamRadius
    });
  }
  
  /**
   * Spitter zombie's acid attack
   */
  spitAcid() {
    // Get direction to player
    const playerPosition = this.game.player.container.position.clone();
    const zombiePosition = this.container.position.clone();
    const direction = new THREE.Vector3().subVectors(playerPosition, zombiePosition).normalize();
    
    // Adjust aim slightly upward for arcing effect
    direction.y += 0.2;
    
    // Play spit animation
    if (this.model) {
      this.model.setAnimationState('spitting');
    }
    
    // Create and launch acid projectile
    this.createAcidProjectile(direction);
    
    // TODO: Add sound effect
  }
  
  /**
   * Create acid projectile
   */
  createAcidProjectile(direction) {
    // Create projectile geometry
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    
    // Glowing green material for acid
    const material = new THREE.MeshBasicMaterial({
      color: 0x39ff14,
      transparent: true,
      opacity: 0.8
    });
    
    const projectile = new THREE.Mesh(geometry, material);
    
    // Position at zombie's head/mouth
    projectile.position.copy(this.container.position);
    projectile.position.y += 1.3; // Adjust to mouth height
    projectile.position.z += 0.3; // Slightly in front of head
    
    // Add to scene
    this.game.scene.add(projectile);
    
    // Create trail effect for projectile
    const trail = this.createAcidTrail();
    projectile.add(trail);
    
    // Add projectile data to game's projectiles list for update
    this.game.projectiles = this.game.projectiles || [];
    this.game.projectiles.push({
      mesh: projectile,
      direction: direction.clone(),
      speed: this.projectileSpeed,
      damage: this.projectileDamage,
      type: 'acid',
      owner: this,
      trail: trail,
      startTime: performance.now() / 1000,
      duration: 3.0, // Max seconds before despawning
      update: (deltaTime) => {
        // Move projectile
        projectile.position.addScaledVector(direction, this.projectileSpeed * deltaTime);
        
        // Apply gravity
        direction.y -= 0.5 * deltaTime;
        
        // Check for collision with player
        const distanceToPlayer = projectile.position.distanceTo(this.game.player.container.position);
        if (distanceToPlayer < 0.5) {
          // Hit player
          this.game.player.takeDamage(this.projectileDamage);
          this.createAcidSplash(projectile.position);
          
          // Remove projectile
          this.game.scene.remove(projectile);
          return true; // Signal to remove from array
        }
        
        // Check for collision with environment
        const raycaster = new THREE.Raycaster(
          projectile.position.clone(),
          direction.clone().normalize(),
          0,
          0.2
        );
        
        const intersects = raycaster.intersectObjects(this.game.colliders || [], true);
        if (intersects.length > 0) {
          // Hit environment
          this.createAcidSplash(projectile.position);
          
          // Remove projectile
          this.game.scene.remove(projectile);
          return true; // Signal to remove from array
        }
        
        // Check lifetime
        if (performance.now() / 1000 - this.startTime > this.duration) {
          // Remove if too old
          this.game.scene.remove(projectile);
          return true;
        }
        
        return false; // Keep updating
      }
    });
  }
  
  /**
   * Create trail effect for acid projectile
   */
  createAcidTrail() {
    // Create trail
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({
      color: 0x39ff14,
      transparent: true,
      opacity: 0.5
    });
    
    // Create points array for trail
    const points = [];
    for (let i = 0; i < 20; i++) {
      points.push(new THREE.Vector3(0, 0, -i * 0.03));
    }
    
    trailGeometry.setFromPoints(points);
    const trail = new THREE.Line(trailGeometry, trailMaterial);
    
    return trail;
  }
  
  /**
   * Create acid splash effect on impact
   */
  createAcidSplash(position) {
    // Create splash effect
    const geometry = new THREE.CircleGeometry(0.5, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0x39ff14,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const splash = new THREE.Mesh(geometry, material);
    splash.position.copy(position);
    splash.rotation.x = -Math.PI / 2; // Flat on ground/wall
    
    // Add to scene
    this.game.scene.add(splash);
    
    // Add to game effects for animation and cleanup
    this.game.effects = this.game.effects || [];
    this.game.effects.push({
      mesh: splash,
      type: 'acid_splash',
      startTime: performance.now() / 1000,
      duration: this.acidDuration,
      damageInterval: 0.5, // Damage player every 0.5 seconds if standing in acid
      lastDamageTime: 0,
      damageRadius: 0.5,
      damage: this.projectileDamage * 0.5,
      update: (deltaTime, time) => {
        // Fade out over time
        const age = time - this.startTime;
        const opacity = 0.7 * (1 - age / this.duration);
        splash.material.opacity = opacity;
        
        // Grow slightly
        splash.scale.set(1 + age, 1 + age, 1);
        
        // Damage player if they're standing in acid
        if (time - this.lastDamageTime > this.damageInterval) {
          const distanceToPlayer = splash.position.distanceTo(this.game.player.container.position);
          if (distanceToPlayer < this.damageRadius) {
            this.game.player.takeDamage(this.damage * deltaTime);
            this.lastDamageTime = time;
          }
        }
        
        // Remove if too old
        if (age > this.duration) {
          this.game.scene.remove(splash);
          return true; // Signal to remove from array
        }
        
        return false; // Keep updating
      }
    });
  }
  
  /**
   * Update special visual effects
   */
  updateSpecialEffects(deltaTime) {
    const time = performance.now() / 1000;
    
    // Update and remove completed effects
    for (let i = this.specialEffects.length - 1; i >= 0; i--) {
      const effect = this.specialEffects[i];
      const age = time - effect.startTime;
      
      switch (effect.type) {
        case 'scream':
          // Expand ring outward
          const scale = effect.initialScale + (effect.targetScale - effect.initialScale) * (age / effect.duration);
          effect.mesh.scale.set(scale, scale, scale);
          
          // Fade out
          if (effect.mesh.material) {
            effect.mesh.material.opacity = 0.7 * (1 - age / effect.duration);
          }
          break;
        
        // Add other effect types as needed
      }
      
      // Remove old effects
      if (age > effect.duration) {
        this.container.remove(effect.mesh);
        this.specialEffects.splice(i, 1);
      }
    }
  }

  /**
   * Initialize or re-initialize a zombie for reuse from the pool
   * @param {THREE.Vector3} position - Position to place the zombie
   * @param {Object} options - Zombie configuration options
   */
  initialize(position, options = {}) {
    // Set position
    this.container.position.copy(position);
    
    // Set default type if not specified
    this.type = options.type || 'standard';
    
    // Initialize health based on type
    switch (this.type) {
      case 'runner':
        this.maxHealth = 80;
        this.speed = 2.5;
        break;
      case 'brute':
        this.maxHealth = 250;
        this.speed = 0.8;
        break;
      case 'exploder':
        this.maxHealth = 100;
        this.speed = 1.5;
        break;
      case 'spitter':
        this.maxHealth = 120;
        this.speed = 1.2;
        break;
      case 'screamer':
        this.maxHealth = 150;
        this.speed = 1.0;
        break;
      default: // standard
        this.maxHealth = 100;
        this.speed = 1.0;
    }
    
    // Set current health to maximum
    this.health = this.maxHealth;
    
    // Reset damage state
    this.timeSinceDamage = 0;
    this.lastDamageTime = 0;
    this.attackCooldown = 0;
    this.stunned = false;
    this.stunTime = 0;
    
    // Reset pathfinding state
    if (this.pathfinding) {
      this.pathfinding.path = [];
      this.pathfinding.currentPathIndex = 0;
      this.pathfinding.pathNeedsUpdate = true;
      this.pathfinding.lastPathUpdateTime = 0;
    }
    
    // Reset animation state
    if (this.model && this.model.setAnimationState) {
      this.model.setAnimationState('idle');
    }
    
    // Reset special effects
    this.regenerates = options.regenerates || false;
    this.explodes = options.explodes || false;
    this.explosionRadius = options.explosionRadius || 3;
    this.spits = options.spits || false;
    this.screams = options.screams || false;
    
    // Reset visibility and state
    this.container.visible = true;
    this.isAlive = true;
    this.isActive = true;
    
    // Reset timers
    this.timeSinceDeath = undefined;
    
    // Apply any other options
    if (options.health) this.health = options.health;
    if (options.speed) this.speed = options.speed;
    
    // Apply modifiers if provided
    if (options.healthMultiplier) this.health *= options.healthMultiplier;
    if (options.speedMultiplier) this.speed *= options.speedMultiplier;
    
    // Play spawn animation if available
    if (this.model && this.model.playAnimation) {
      this.model.playAnimation('spawn');
      
      // Queue walking animation after spawn
      setTimeout(() => {
        if (this.isAlive) {
          this.model.playAnimation('walk');
        }
      }, 1200);
    }
    
    return this;
  }

  /**
   * Reset zombie for object pooling
   */
  reset() {
    // Reset state
    this.health = 0;
    this.isAlive = false;
    this.isActive = false;
    
    // Reset visibility
    this.container.visible = false;
    
    // Move far away to ensure it's not in the player's view
    this.container.position.set(1000, 1000, 1000);
    
    // Stop all animations
    if (this.model && this.model.stopAllAnimations) {
      this.model.stopAllAnimations();
    }
  }
}
