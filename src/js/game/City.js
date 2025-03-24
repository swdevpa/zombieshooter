import * as THREE from 'three';

export class City {
  constructor(game) {
    this.game = game;
    this.container = new THREE.Group();

    // City dimensions and settings
    this.citySize = 100; // Size of the city (width and length)
    this.blockSize = 10; // Size of a city block
    this.streetWidth = 4; // Width of streets
    this.buildingMargin = 1; // Margin between buildings and streets
    this.maxBuildingHeight = 30; // Maximum building height
    this.minBuildingHeight = 5; // Minimum building height

    // Building properties - using brighter colors for debugging
    this.buildingColors = [
      0xff5555, // Bright Red
      0x55ff55, // Bright Green
      0x5555ff, // Bright Blue
      0xffff55, // Bright Yellow
      0xff55ff, // Bright Magenta
    ];

    // City grid for optimization
    this.cityGrid = []; // 2D grid to store building data
  }

  // ... existing code ...

  createGround() {
    // Create ground plane with bright color for debugging
    const groundGeometry = new THREE.PlaneGeometry(this.citySize, this.citySize);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0xff8800, // Bright orange for visibility
      side: THREE.DoubleSide, // Make sure it's visible from both sides
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);

    // Rotate and position ground
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01; // Slightly below buildings to avoid z-fighting

    // Make the ground bigger for debugging
    ground.scale.set(1.5, 1.5, 1.5);

    // Add to container
    this.container.add(ground);
  }

  createStreets() {
    // Create street mesh using bright colors for debugging
    const streetMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff, // Bright cyan for streets
      side: THREE.DoubleSide,
    });

    const streets = new THREE.Group();

    // Calculate number of blocks
    const numBlocks = Math.floor(this.citySize / (this.blockSize + this.streetWidth));

    // Create horizontal streets
    for (let i = 0; i <= numBlocks; i++) {
      const position = i * (this.blockSize + this.streetWidth);

      // Skip if outside city bounds
      if (position >= this.citySize) continue;

      const horizontalStreet = new THREE.Mesh(
        new THREE.BoxGeometry(this.citySize, 0.2, this.streetWidth),
        streetMaterial
      );

      horizontalStreet.position.set(
        this.citySize / 2,
        0.1, // Slightly above ground for z-fighting
        position + this.streetWidth / 2
      );

      streets.add(horizontalStreet);
    }

    // Create vertical streets
    for (let i = 0; i <= numBlocks; i++) {
      const position = i * (this.blockSize + this.streetWidth);

      // Skip if outside city bounds
      if (position >= this.citySize) continue;

      const verticalStreet = new THREE.Mesh(
        new THREE.BoxGeometry(this.streetWidth, 0.2, this.citySize),
        streetMaterial
      );

      verticalStreet.position.set(
        position + this.streetWidth / 2,
        0.1, // Slightly above ground for z-fighting
        this.citySize / 2
      );

      streets.add(verticalStreet);
    }

    this.container.add(streets);
  }

  createBuildings() {
    // Group all buildings for better organization
    const buildingsGroup = new THREE.Group();

    // ... rest of the method as before ...

    // Second pass - create building meshes with brighter materials
    buildingsByBlock.forEach((building, blockId) => {
      const width = building.maxX - building.minX + 1;
      const depth = building.maxZ - building.minZ + 1;
      const height = building.height;

      // Create building geometry
      const buildingGeometry = new THREE.BoxGeometry(width, height, depth);

      // Random building color from palette - brighter for debugging
      const colorIndex = Math.floor(Math.random() * this.buildingColors.length);
      const color = this.buildingColors[colorIndex];

      const buildingMaterial = new THREE.MeshBasicMaterial({
        color: color,
        wireframe: Math.random() > 0.7, // Some buildings as wireframe for variety
      });

      const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);

      // Position building
      buildingMesh.position.set(building.minX + width / 2, height / 2, building.minZ + depth / 2);

      // Add to group
      buildingsGroup.add(buildingMesh);
    });

    this.container.add(buildingsGroup);
  }

  generate() {
    console.log('Generating city...');

    // Clear any existing elements
    while (this.container.children.length > 0) {
      this.container.remove(this.container.children[0]);
    }

    // Initialize city grid
    this.initializeCityGrid();

    // Create ground
    this.createGround();

    // Create streets
    this.createStreets();

    // Create buildings
    this.createBuildings();
    
    // Generate city components (sidewalks, props, debris, vehicles)
    this.generateCityComponents();
    
    // Generate apocalyptic assets (barricades, gore, wreckage, etc.)
    this.generateApocalypticAssets();
    
    // Generate level boundaries
    this.generateLevelBoundaries();

    // For debugging, don't center the city - keep it at origin
    console.log('City generation complete');

    return this.container;
  }
}
