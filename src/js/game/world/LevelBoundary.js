import * as THREE from 'three';

/**
 * LevelBoundary class - Creates and manages physical boundaries around the game world
 * These boundaries prevent players from leaving the playable area and provide visual feedback
 */
export class LevelBoundary {
  constructor(game, city) {
    this.game = game;
    this.city = city;
    
    // Container for all boundary objects
    this.container = new THREE.Group();
    this.container.name = 'levelBoundaries';
    
    // Boundary settings
    this.boundaryHeight = 15;       // Height of boundary walls
    this.boundaryThickness = 2;     // Thickness of boundary walls
    this.boundaryPadding = 5;       // Extra space outside city edge
    this.isVisible = true;          // Visibility toggle for debugging
    
    // Visual settings
    this.useInstancing = true;      // Use instanced meshes for performance
    this.segmentLength = 10;        // Length of each boundary segment
    this.segments = [];             // Store segments for collision detection
    
    // Materials
    this.materials = {
      wall: new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide
      }),
      warningStripe: new THREE.MeshStandardMaterial({
        color: 0xFFAA00,
        roughness: 0.7,
        metalness: 0.1,
        emissive: 0x553300,
        emissiveIntensity: 0.2,
        side: THREE.DoubleSide
      })
    };
    
    // Geometries
    this.geometries = {
      // Will be initialized in generate()
    };
    
    // Store collision objects
    this.collisionObjects = [];
    
    // Debug helpers
    this.debugEnabled = false;
    this.debugHelpers = new THREE.Group();
    this.debugHelpers.name = 'boundaryDebugHelpers';
    this.container.add(this.debugHelpers);
  }
  
  /**
   * Generate all boundary objects
   * @returns {THREE.Group} Container with all boundary objects
   */
  generate() {
    console.log('Generating level boundaries...');
    
    // Clear any existing boundaries
    while (this.container.children.length > 0) {
      this.container.remove(this.container.children[0]);
    }
    this.segments = [];
    this.collisionObjects = [];
    
    // Add debug helpers group back
    this.container.add(this.debugHelpers);
    
    // Initialize geometries
    this.initGeometries();
    
    // Generate the four walls
    this.generateBoundaryWalls();
    
    // Generate corner posts
    this.generateCornerPosts();
    
    // Add warning signs/decorations
    this.addWarningDecorations();
    
    // Ensure visibility state is applied
    this.setVisibility(this.isVisible);
    
    console.log(`Level boundaries generated (${this.segments.length} segments)`);
    return this.container;
  }
  
  /**
   * Initialize geometries for boundary objects
   */
  initGeometries() {
    // Wall segment geometry
    this.geometries.wall = new THREE.BoxGeometry(
      this.segmentLength,
      this.boundaryHeight,
      this.boundaryThickness
    );
    
    // Corner post geometry
    this.geometries.cornerPost = new THREE.BoxGeometry(
      this.boundaryThickness * 2,
      this.boundaryHeight * 1.2,
      this.boundaryThickness * 2
    );
    
    // Warning stripe geometry
    this.geometries.warningStripe = new THREE.PlaneGeometry(
      this.segmentLength,
      this.boundaryHeight / 5
    );
  }
  
  /**
   * Generate boundary walls around the city
   */
  generateBoundaryWalls() {
    const citySize = this.city.citySize;
    const totalWidth = citySize + (this.boundaryPadding * 2);
    const totalDepth = citySize + (this.boundaryPadding * 2);
    
    // Calculate number of segments needed for each side
    const segmentsX = Math.ceil(totalWidth / this.segmentLength);
    const segmentsZ = Math.ceil(totalDepth / this.segmentLength);
    
    // Adjust segment length to fit perfectly
    const adjustedSegmentLengthX = totalWidth / segmentsX;
    const adjustedSegmentLengthZ = totalDepth / segmentsZ;
    
    // Create instanced meshes if enabled
    if (this.useInstancing) {
      // Create instanced mesh for X-oriented walls (north and south)
      const xWallsCount = segmentsX * 2;
      const xInstancedMesh = new THREE.InstancedMesh(
        this.geometries.wall,
        this.materials.wall,
        xWallsCount
      );
      xInstancedMesh.name = 'xWalls';
      
      // Create instanced mesh for Z-oriented walls (east and west)
      const zWallsCount = segmentsZ * 2;
      const zInstancedMesh = new THREE.InstancedMesh(
        this.geometries.wall,
        this.materials.wall,
        zWallsCount
      );
      zInstancedMesh.name = 'zWalls';
      
      // Set up transformation matrix
      const matrix = new THREE.Matrix4();
      let xInstanceIndex = 0;
      let zInstanceIndex = 0;
      
      // Generate North wall (X-axis, Z = min)
      for (let x = 0; x < segmentsX; x++) {
        const posX = (x * adjustedSegmentLengthX) - (totalWidth / 2) + (adjustedSegmentLengthX / 2);
        const posZ = -(totalDepth / 2);
        
        matrix.makeTranslation(posX, this.boundaryHeight / 2, posZ);
        xInstancedMesh.setMatrixAt(xInstanceIndex, matrix);
        
        // Add to segments for collision detection
        this.addBoundarySegment('north', posX, 0, posZ, adjustedSegmentLengthX, this.boundaryHeight, this.boundaryThickness, 0);
        
        xInstanceIndex++;
      }
      
      // Generate South wall (X-axis, Z = max)
      for (let x = 0; x < segmentsX; x++) {
        const posX = (x * adjustedSegmentLengthX) - (totalWidth / 2) + (adjustedSegmentLengthX / 2);
        const posZ = (totalDepth / 2);
        
        matrix.makeTranslation(posX, this.boundaryHeight / 2, posZ);
        xInstancedMesh.setMatrixAt(xInstanceIndex, matrix);
        
        // Add to segments for collision detection
        this.addBoundarySegment('south', posX, 0, posZ, adjustedSegmentLengthX, this.boundaryHeight, this.boundaryThickness, 0);
        
        xInstanceIndex++;
      }
      
      // Generate East wall (Z-axis, X = max)
      for (let z = 0; z < segmentsZ; z++) {
        const posX = (totalWidth / 2);
        const posZ = (z * adjustedSegmentLengthZ) - (totalDepth / 2) + (adjustedSegmentLengthZ / 2);
        
        matrix.makeRotationY(Math.PI / 2);
        matrix.setPosition(posX, this.boundaryHeight / 2, posZ);
        zInstancedMesh.setMatrixAt(zInstanceIndex, matrix);
        
        // Add to segments for collision detection
        this.addBoundarySegment('east', posX, 0, posZ, this.boundaryThickness, this.boundaryHeight, adjustedSegmentLengthZ, Math.PI / 2);
        
        zInstanceIndex++;
      }
      
      // Generate West wall (Z-axis, X = min)
      for (let z = 0; z < segmentsZ; z++) {
        const posX = -(totalWidth / 2);
        const posZ = (z * adjustedSegmentLengthZ) - (totalDepth / 2) + (adjustedSegmentLengthZ / 2);
        
        matrix.makeRotationY(Math.PI / 2);
        matrix.setPosition(posX, this.boundaryHeight / 2, posZ);
        zInstancedMesh.setMatrixAt(zInstanceIndex, matrix);
        
        // Add to segments for collision detection
        this.addBoundarySegment('west', posX, 0, posZ, this.boundaryThickness, this.boundaryHeight, adjustedSegmentLengthZ, Math.PI / 2);
        
        zInstanceIndex++;
      }
      
      // Need to update the instanceMatrix buffer
      xInstancedMesh.instanceMatrix.needsUpdate = true;
      zInstancedMesh.instanceMatrix.needsUpdate = true;
      
      // Add to container
      this.container.add(xInstancedMesh);
      this.container.add(zInstancedMesh);
      
      // Add to collision objects
      this.collisionObjects.push(xInstancedMesh, zInstancedMesh);
    } else {
      // Non-instanced approach (slower but simpler)
      this.generateNonInstancedWalls(segmentsX, segmentsZ, adjustedSegmentLengthX, adjustedSegmentLengthZ, totalWidth, totalDepth);
    }
  }
  
  /**
   * Generate walls without instancing (fallback method)
   */
  generateNonInstancedWalls(segmentsX, segmentsZ, segmentLengthX, segmentLengthZ, totalWidth, totalDepth) {
    // Create wall groups
    const northWall = new THREE.Group();
    const southWall = new THREE.Group();
    const eastWall = new THREE.Group();
    const westWall = new THREE.Group();
    
    northWall.name = 'northWall';
    southWall.name = 'southWall';
    eastWall.name = 'eastWall';
    westWall.name = 'westWall';
    
    // Generate North wall (X-axis, Z = min)
    for (let x = 0; x < segmentsX; x++) {
      const posX = (x * segmentLengthX) - (totalWidth / 2) + (segmentLengthX / 2);
      const posZ = -(totalDepth / 2);
      
      const wall = new THREE.Mesh(this.geometries.wall, this.materials.wall);
      wall.position.set(posX, this.boundaryHeight / 2, posZ);
      northWall.add(wall);
      
      // Add to segments for collision detection
      this.addBoundarySegment('north', posX, 0, posZ, segmentLengthX, this.boundaryHeight, this.boundaryThickness, 0);
      
      // Add to collision objects
      this.collisionObjects.push(wall);
    }
    
    // Generate South wall (X-axis, Z = max)
    for (let x = 0; x < segmentsX; x++) {
      const posX = (x * segmentLengthX) - (totalWidth / 2) + (segmentLengthX / 2);
      const posZ = (totalDepth / 2);
      
      const wall = new THREE.Mesh(this.geometries.wall, this.materials.wall);
      wall.position.set(posX, this.boundaryHeight / 2, posZ);
      southWall.add(wall);
      
      // Add to segments for collision detection
      this.addBoundarySegment('south', posX, 0, posZ, segmentLengthX, this.boundaryHeight, this.boundaryThickness, 0);
      
      // Add to collision objects
      this.collisionObjects.push(wall);
    }
    
    // Generate East wall (Z-axis, X = max)
    for (let z = 0; z < segmentsZ; z++) {
      const posX = (totalWidth / 2);
      const posZ = (z * segmentLengthZ) - (totalDepth / 2) + (segmentLengthZ / 2);
      
      const wall = new THREE.Mesh(this.geometries.wall, this.materials.wall);
      wall.position.set(posX, this.boundaryHeight / 2, posZ);
      wall.rotation.y = Math.PI / 2;
      eastWall.add(wall);
      
      // Add to segments for collision detection
      this.addBoundarySegment('east', posX, 0, posZ, this.boundaryThickness, this.boundaryHeight, segmentLengthZ, Math.PI / 2);
      
      // Add to collision objects
      this.collisionObjects.push(wall);
    }
    
    // Generate West wall (Z-axis, X = min)
    for (let z = 0; z < segmentsZ; z++) {
      const posX = -(totalWidth / 2);
      const posZ = (z * segmentLengthZ) - (totalDepth / 2) + (segmentLengthZ / 2);
      
      const wall = new THREE.Mesh(this.geometries.wall, this.materials.wall);
      wall.position.set(posX, this.boundaryHeight / 2, posZ);
      wall.rotation.y = Math.PI / 2;
      westWall.add(wall);
      
      // Add to segments for collision detection
      this.addBoundarySegment('west', posX, 0, posZ, this.boundaryThickness, this.boundaryHeight, segmentLengthZ, Math.PI / 2);
      
      // Add to collision objects
      this.collisionObjects.push(wall);
    }
    
    // Add walls to container
    this.container.add(northWall, southWall, eastWall, westWall);
  }
  
  /**
   * Generate corner posts at the four corners of the boundary
   */
  generateCornerPosts() {
    const totalWidth = this.city.citySize + (this.boundaryPadding * 2);
    const totalDepth = this.city.citySize + (this.boundaryPadding * 2);
    const halfWidth = totalWidth / 2;
    const halfDepth = totalDepth / 2;
    
    // Create corner posts
    const cornerNE = new THREE.Mesh(this.geometries.cornerPost, this.materials.wall);
    cornerNE.position.set(halfWidth, this.boundaryHeight * 0.6, -halfDepth);
    
    const cornerNW = new THREE.Mesh(this.geometries.cornerPost, this.materials.wall);
    cornerNW.position.set(-halfWidth, this.boundaryHeight * 0.6, -halfDepth);
    
    const cornerSE = new THREE.Mesh(this.geometries.cornerPost, this.materials.wall);
    cornerSE.position.set(halfWidth, this.boundaryHeight * 0.6, halfDepth);
    
    const cornerSW = new THREE.Mesh(this.geometries.cornerPost, this.materials.wall);
    cornerSW.position.set(-halfWidth, this.boundaryHeight * 0.6, halfDepth);
    
    // Add to container
    this.container.add(cornerNE, cornerNW, cornerSE, cornerSW);
    
    // Add to collision objects
    this.collisionObjects.push(cornerNE, cornerNW, cornerSE, cornerSW);
  }
  
  /**
   * Add warning decorations to boundary walls
   */
  addWarningDecorations() {
    const totalWidth = this.city.citySize + (this.boundaryPadding * 2);
    const totalDepth = this.city.citySize + (this.boundaryPadding * 2);
    
    // Calculate number of warning stripes (fewer than wall segments)
    const stripeSpacing = this.segmentLength * 2; // One stripe every 2 segments
    const stripesX = Math.ceil(totalWidth / stripeSpacing);
    const stripesZ = Math.ceil(totalDepth / stripeSpacing);
    
    // Create warning stripes using instanced mesh for performance
    const stripeCount = (stripesX + stripesZ) * 2;
    const stripeInstancedMesh = new THREE.InstancedMesh(
      this.geometries.warningStripe,
      this.materials.warningStripe,
      stripeCount
    );
    stripeInstancedMesh.name = 'warningStripes';
    
    // Set up transformation matrix
    const matrix = new THREE.Matrix4();
    let stripeIndex = 0;
    
    // Place warning stripes on north and south walls
    for (let x = 0; x < stripesX; x++) {
      const posX = (x * stripeSpacing) - (totalWidth / 2) + (stripeSpacing / 2);
      const height = this.boundaryHeight * 0.7; // Position at 70% of wall height
      
      // North wall stripe
      matrix.makeRotationX(Math.PI / 2);
      matrix.setPosition(posX, height, -totalDepth / 2 + 0.1);
      stripeInstancedMesh.setMatrixAt(stripeIndex++, matrix);
      
      // South wall stripe
      matrix.makeRotationX(-Math.PI / 2);
      matrix.setPosition(posX, height, totalDepth / 2 - 0.1);
      stripeInstancedMesh.setMatrixAt(stripeIndex++, matrix);
    }
    
    // Place warning stripes on east and west walls
    for (let z = 0; z < stripesZ; z++) {
      const posZ = (z * stripeSpacing) - (totalDepth / 2) + (stripeSpacing / 2);
      const height = this.boundaryHeight * 0.7; // Position at 70% of wall height
      
      // East wall stripe
      matrix.makeRotationY(Math.PI / 2);
      matrix.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      matrix.setPosition(totalWidth / 2 - 0.1, height, posZ);
      stripeInstancedMesh.setMatrixAt(stripeIndex++, matrix);
      
      // West wall stripe
      matrix.makeRotationY(-Math.PI / 2);
      matrix.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      matrix.setPosition(-totalWidth / 2 + 0.1, height, posZ);
      stripeInstancedMesh.setMatrixAt(stripeIndex++, matrix);
    }
    
    // Update the instance matrix
    stripeInstancedMesh.instanceMatrix.needsUpdate = true;
    
    // Add to container
    this.container.add(stripeInstancedMesh);
  }
  
  /**
   * Add a boundary segment to the segments array for collision detection
   */
  addBoundarySegment(name, x, y, z, width, height, depth, rotation) {
    const segment = {
      name: name,
      position: new THREE.Vector3(x, y, z),
      size: new THREE.Vector3(width, height, depth),
      rotation: rotation,
      // Create a bounding box for efficient collision detection
      boundingBox: new THREE.Box3(
        new THREE.Vector3(
          x - (rotation === 0 ? width / 2 : depth / 2),
          y,
          z - (rotation === 0 ? depth / 2 : width / 2)
        ),
        new THREE.Vector3(
          x + (rotation === 0 ? width / 2 : depth / 2),
          y + height,
          z + (rotation === 0 ? depth / 2 : width / 2)
        )
      )
    };
    
    this.segments.push(segment);
    
    // Add debug visualization if enabled
    if (this.debugEnabled) {
      const boxHelper = new THREE.Box3Helper(segment.boundingBox, 0xff0000);
      this.debugHelpers.add(boxHelper);
    }
    
    return segment;
  }
  
  /**
   * Check if a position collides with any boundary
   * @param {THREE.Vector3} position - Position to check
   * @param {number} radius - Collision radius
   * @returns {boolean} Whether a collision occurred
   */
  checkCollision(position, radius = 0.5) {
    // Skip collision detection if boundaries are disabled
    if (!this.isVisible) return false;
    
    // Check collision with each segment's bounding box
    for (const segment of this.segments) {
      // Create a sphere for the player
      const sphere = new THREE.Sphere(position, radius);
      
      // Check for sphere-box intersection
      if (sphere.intersectsBox(segment.boundingBox)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if player is near a boundary and trigger feedback
   * @param {THREE.Vector3} playerPosition - Current player position
   * @param {number} nearDistance - Distance to trigger "near boundary" feedback
   * @returns {boolean} Whether player is near a boundary
   */
  checkPlayerProximity(playerPosition, nearDistance = 5) {
    // Skip if boundaries are disabled
    if (!this.isVisible) return false;
    
    // Minimum distance to any boundary
    let minDistance = Infinity;
    
    for (const segment of this.segments) {
      // Calculate distance to this segment's bounding box
      const distance = segment.boundingBox.distanceToPoint(playerPosition);
      minDistance = Math.min(minDistance, distance);
      
      // If within near distance, trigger feedback
      if (distance < nearDistance) {
        this.triggerProximityFeedback(distance / nearDistance);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Trigger visual feedback when player approaches boundary
   * @param {number} proximityFactor - How close player is (0 = touching, 1 = at nearDistance)
   */
  triggerProximityFeedback(proximityFactor) {
    // Adjust warning stripe brightness based on proximity
    const emissiveIntensity = 0.2 + (1 - proximityFactor) * 0.8; // 0.2 to 1.0
    this.materials.warningStripe.emissiveIntensity = emissiveIntensity;
  }
  
  /**
   * Set visibility of the boundary objects
   * @param {boolean} visible - Whether boundaries should be visible
   */
  setVisibility(visible) {
    this.isVisible = visible;
    this.container.visible = visible;
  }
  
  /**
   * Toggle boundary visibility
   * @returns {boolean} New visibility state
   */
  toggleVisibility() {
    this.setVisibility(!this.isVisible);
    return this.isVisible;
  }
  
  /**
   * Toggle debug helpers visibility
   * @returns {boolean} New debug state
   */
  toggleDebug() {
    this.debugEnabled = !this.debugEnabled;
    this.debugHelpers.visible = this.debugEnabled;
    
    // If enabling debug, regenerate helpers
    if (this.debugEnabled) {
      // Clear existing helpers
      while (this.debugHelpers.children.length > 0) {
        this.debugHelpers.remove(this.debugHelpers.children[0]);
      }
      
      // Add box helpers for all segments
      for (const segment of this.segments) {
        const boxHelper = new THREE.Box3Helper(segment.boundingBox, 0xff0000);
        this.debugHelpers.add(boxHelper);
      }
    }
    
    return this.debugEnabled;
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Dispose of geometries
    Object.values(this.geometries).forEach(geometry => {
      if (geometry && geometry.dispose) {
        geometry.dispose();
      }
    });
    
    // Dispose of materials
    Object.values(this.materials).forEach(material => {
      if (material && material.dispose) {
        material.dispose();
      }
    });
    
    // Clear arrays
    this.segments = [];
    this.collisionObjects = [];
    
    console.log('LevelBoundary resources disposed');
  }
} 