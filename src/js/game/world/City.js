import * as THREE from 'three';
import { BuildingGenerator } from './BuildingGenerator.js';
import { CityComponents } from './CityComponents.js';
import { ApocalypticAssets } from './ApocalypticAssets.js';
import { LevelBoundary } from './LevelBoundary.js';

export class City {
  constructor(game, config) {
    this.game = game;
    this.config = config || {};
    
    // Create a group to hold all city elements
    this.container = new THREE.Group();
    this.cityGroup = this.container; // Add cityGroup alias for compatibility with LevelManager
    
    // City dimensions and settings
    this.citySize = config?.citySize?.width || 100; // Size of the city (width and length)
    this.blockSize = 10; // Size of a city block
    this.streetWidth = 4; // Width of streets
    this.buildingMargin = 1; // Margin between buildings and streets
    this.maxBuildingHeight = config?.buildings?.maxHeight || 30; // Maximum building height
    this.minBuildingHeight = config?.buildings?.minHeight || 5; // Minimum building height

    // Building properties
    this.buildingColors = [
      0x777777, // Gray
      0x888888, // Light Gray
      0x555555, // Dark Gray
      0x666666, // Medium Gray
      0x999999, // Very Light Gray
    ];

    // City grid for optimization
    this.cityGrid = []; // 2D grid to store building data
    
    // Player start position (center of the city, on the ground)
    this.playerStartPosition = new THREE.Vector3(this.citySize / 2, 1.7, this.citySize / 2);
    
    // Create building generator
    this.buildingGenerator = new BuildingGenerator(game);
    
    // Create city components manager
    this.cityComponents = new CityComponents(game, this);
    
    // Create apocalyptic assets manager
    this.apocalypticAssets = new ApocalypticAssets(game, this);
    
    // Create level boundary manager
    this.levelBoundary = new LevelBoundary(game, this);
  }

  // Method to get player start position
  getPlayerStartPosition() {
    return this.playerStartPosition;
  }
  
  // Method to clean up resources
  dispose() {
    // Clean up geometries, materials, etc.
    this.buildingGenerator = null;
    
    // Dispose city components
    if (this.cityComponents) {
      this.cityComponents.dispose();
      this.cityComponents = null;
    }
    
    // Dispose apocalyptic assets
    if (this.apocalypticAssets) {
      this.apocalypticAssets.dispose();
      this.apocalypticAssets = null;
    }
    
    // Dispose level boundaries
    if (this.levelBoundary) {
      this.levelBoundary.dispose();
      this.levelBoundary = null;
    }
    
    console.log('City resources disposed');
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
  
  // Generate all city components
  generateCityComponents() {
    console.log('Adding city components...');
    
    // Generate components using CityComponents class
    const componentsContainer = this.cityComponents.generate();
    
    // Add to main city container
    this.container.add(componentsContainer);
  }
  
  // Generate all apocalyptic assets
  generateApocalypticAssets() {
    console.log('Adding apocalyptic assets...');
    
    // Generate assets using ApocalypticAssets class
    const assetsContainer = this.apocalypticAssets.generate();
    
    // Add to main city container
    this.container.add(assetsContainer);
  }
  
  // Generate level boundaries
  generateLevelBoundaries() {
    console.log('Adding level boundaries...');
    
    // Generate boundaries using LevelBoundary class
    const boundariesContainer = this.levelBoundary.generate();
    
    // Add to main city container
    this.container.add(boundariesContainer);
  }
  
  // Check if a player collides with any city component
  checkComponentCollision(position, radius = 0.5) {
    if (!this.cityComponents) return false;
    
    // Check city components collisions
    const componentCollision = this.cityComponents.checkCollision(position, radius);
    
    // Check apocalyptic assets collisions
    const assetCollision = this.apocalypticAssets ? this.apocalypticAssets.checkCollision(position, radius) : false;
    
    // Check level boundary collisions
    const boundaryCollision = this.levelBoundary ? this.levelBoundary.checkCollision(position, radius) : false;
    
    // Check for player proximity to boundaries (for warning effects)
    if (this.levelBoundary) {
      this.levelBoundary.checkPlayerProximity(position, 5);
    }
    
    return componentCollision || assetCollision || boundaryCollision;
  }
  
  // Check if a player is near the boundary (for UI feedback)
  isPlayerNearBoundary(position, distance = 5) {
    if (!this.levelBoundary) return false;
    return this.levelBoundary.checkPlayerProximity(position, distance);
  }
  
  // Toggle boundary visibility (for debugging)
  toggleBoundaryVisibility() {
    if (!this.levelBoundary) return false;
    return this.levelBoundary.toggleVisibility();
  }
  
  // Toggle boundary debug helpers
  toggleBoundaryDebug() {
    if (!this.levelBoundary) return false;
    return this.levelBoundary.toggleDebug();
  }

  initializeCityGrid() {
    this.cityGrid = [];

    // Calculate number of blocks
    const numBlocks = Math.floor(this.citySize / (this.blockSize + this.streetWidth));

    // Initialize grid with empty cells
    for (let z = 0; z < this.citySize; z++) {
      this.cityGrid[z] = [];
      for (let x = 0; x < this.citySize; x++) {
        this.cityGrid[z][x] = {
          type: 'empty',
          height: 0,
        };
      }
    }

    // Mark streets in grid
    for (let i = 0; i <= numBlocks; i++) {
      const position = i * (this.blockSize + this.streetWidth);

      // Skip if outside city bounds
      if (position >= this.citySize) continue;

      // Horizontal street
      for (let x = 0; x < this.citySize; x++) {
        for (let z = position; z < position + this.streetWidth && z < this.citySize; z++) {
          if (x < this.citySize && z < this.citySize) {
            this.cityGrid[z][x].type = 'street';
          }
        }
      }

      // Vertical street
      for (let z = 0; z < this.citySize; z++) {
        for (let x = position; x < position + this.streetWidth && x < this.citySize; x++) {
          if (x < this.citySize && z < this.citySize) {
            this.cityGrid[z][x].type = 'street';
          }
        }
      }
    }

    // Mark building areas
    for (let blockZ = 0; blockZ < numBlocks; blockZ++) {
      for (let blockX = 0; blockX < numBlocks; blockX++) {
        const startX = blockX * (this.blockSize + this.streetWidth) + this.streetWidth;
        const startZ = blockZ * (this.blockSize + this.streetWidth) + this.streetWidth;
        const endX = Math.min(startX + this.blockSize, this.citySize);
        const endZ = Math.min(startZ + this.blockSize, this.citySize);

        // Randomly determine if this block should be a single large building or multiple small ones
        const isSingleBuilding = Math.random() > 0.7;

        if (isSingleBuilding) {
          // Single large building with margin
          const buildingStartX = startX + this.buildingMargin;
          const buildingStartZ = startZ + this.buildingMargin;
          const buildingEndX = endX - this.buildingMargin;
          const buildingEndZ = endZ - this.buildingMargin;
          const buildingHeight =
            this.minBuildingHeight +
            Math.random() * (this.maxBuildingHeight - this.minBuildingHeight);

          for (let z = buildingStartZ; z < buildingEndZ; z++) {
            for (let x = buildingStartX; x < buildingEndX; x++) {
              if (x < this.citySize && z < this.citySize) {
                this.cityGrid[z][x].type = 'building';
                this.cityGrid[z][x].height = buildingHeight;
                this.cityGrid[z][x].blockId = `${blockX}_${blockZ}`;
              }
            }
          }
        } else {
          // Multiple smaller buildings
          const subBlockSize = this.blockSize / 2;

          for (let subZ = 0; subZ < 2; subZ++) {
            for (let subX = 0; subX < 2; subX++) {
              // Skip some sub-blocks to create variety
              if (Math.random() < 0.2) continue;

              const subStartX = startX + subX * subBlockSize + this.buildingMargin;
              const subStartZ = startZ + subZ * subBlockSize + this.buildingMargin;
              const subEndX = Math.min(
                startX + (subX + 1) * subBlockSize - this.buildingMargin,
                this.citySize
              );
              const subEndZ = Math.min(
                startZ + (subZ + 1) * subBlockSize - this.buildingMargin,
                this.citySize
              );
              const buildingHeight =
                this.minBuildingHeight +
                Math.random() * (this.maxBuildingHeight - this.minBuildingHeight);

              for (let z = subStartZ; z < subEndZ; z++) {
                for (let x = subStartX; x < subEndX; x++) {
                  if (x < this.citySize && z < this.citySize) {
                    this.cityGrid[z][x].type = 'building';
                    this.cityGrid[z][x].height = buildingHeight;
                    this.cityGrid[z][x].blockId = `${blockX}_${blockZ}_${subX}_${subZ}`;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  createGround() {
    // Create ground plane with bright color for debugging
    const groundGeometry = new THREE.PlaneGeometry(this.citySize * 2, this.citySize * 2); // Make it larger
    const groundMaterial = new THREE.MeshBasicMaterial({
      // Use MeshBasicMaterial to ignore lighting
      color: 0xff8800, // Bright orange for visibility
      side: THREE.DoubleSide, // Make sure it's visible from both sides
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);

    // Rotate and position ground
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01; // Slightly below buildings to avoid z-fighting

    // Add to container
    this.container.add(ground);

    // Add a helper for debugging - red sphere at origin
    const originHelper = new THREE.Mesh(
      new THREE.SphereGeometry(3, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    originHelper.position.set(0, 5, 0);
    this.container.add(originHelper);

    // Add more debug helpers - axis lines
    const axisHelper = new THREE.AxesHelper(20);
    this.container.add(axisHelper);
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
    console.log('Creating buildings...');
    
    // Group all buildings for better organization and collision detection
    const buildingsGroup = new THREE.Group();
    buildingsGroup.name = 'buildings';
    
    // Calculate number of blocks
    const numBlocks = Math.floor(this.citySize / (this.blockSize + this.streetWidth));
    
    // Set up building properties for each block
    const buildings = [];
    
    for (let blockZ = 0; blockZ < numBlocks; blockZ++) {
      for (let blockX = 0; blockX < numBlocks; blockX++) {
        // Starting position of this block (bottom-left corner)
        const blockStartX = blockX * (this.blockSize + this.streetWidth) + this.streetWidth;
        const blockStartZ = blockZ * (this.blockSize + this.streetWidth) + this.streetWidth;
        
        // Number of buildings to create in this block
        const numBuildingsInBlock = Math.floor(Math.random() * 3) + 1; // 1 to 3 buildings per block
        
        // Create buildings in this block
        for (let i = 0; i < numBuildingsInBlock; i++) {
          // Determine building size (make sure it fits within the block)
          const buildingWidth = Math.min(
            Math.max(2, Math.floor(Math.random() * (this.blockSize - 2 * this.buildingMargin)) + 2),
            this.blockSize - 2 * this.buildingMargin
          );
          
          const buildingDepth = Math.min(
            Math.max(2, Math.floor(Math.random() * (this.blockSize - 2 * this.buildingMargin)) + 2),
            this.blockSize - 2 * this.buildingMargin
          );
          
          // Calculate available space
          const availableWidth = this.blockSize - 2 * this.buildingMargin;
          const availableDepth = this.blockSize - 2 * this.buildingMargin;
          
          // Ensure buildings don't exceed block boundaries
          if (buildingWidth > availableWidth || buildingDepth > availableDepth) continue;
          
          // Randomize position within available space
          const posX = blockStartX + this.buildingMargin + Math.random() * (availableWidth - buildingWidth);
          const posZ = blockStartZ + this.buildingMargin + Math.random() * (availableDepth - buildingDepth);
          
          // Randomize height (taller buildings near center for skyline effect)
          const distanceFromCenter = Math.sqrt(
            Math.pow(blockX - numBlocks / 2, 2) + Math.pow(blockZ - numBlocks / 2, 2)
          );
          
          const heightFactor = 1 - Math.min(1, distanceFromCenter / (numBlocks / 2));
          const buildingHeight = 
            this.minBuildingHeight + 
            heightFactor * (this.maxBuildingHeight - this.minBuildingHeight) * Math.random();
          
          // Choose building type based on position in city
          let buildingType;
          // City center has more commercial buildings
          if (distanceFromCenter < numBlocks * 0.2) {
            buildingType = Math.random() > 0.6 
              ? this.buildingGenerator.buildingTypes.COMMERCIAL 
              : this.buildingGenerator.buildingTypes.RESIDENTIAL;
          }
          // Mid-area has mixed buildings
          else if (distanceFromCenter < numBlocks * 0.6) {
            const rand = Math.random();
            if (rand < 0.6) {
              buildingType = this.buildingGenerator.buildingTypes.RESIDENTIAL;
            } else if (rand < 0.8) {
              buildingType = this.buildingGenerator.buildingTypes.COMMERCIAL;
            } else {
              buildingType = this.buildingGenerator.buildingTypes.INDUSTRIAL;
            }
          }
          // Outer area has more industrial and residential
          else {
            buildingType = Math.random() > 0.3 
              ? this.buildingGenerator.buildingTypes.RESIDENTIAL 
              : this.buildingGenerator.buildingTypes.INDUSTRIAL;
          }
          
          // Randomize destruction level (more destruction in outer areas)
          const destructionProbability = 0.1 + (distanceFromCenter / numBlocks) * 0.6;
          let destructionLevel = this.buildingGenerator.destructionLevels.PRISTINE;
          
          if (Math.random() < destructionProbability) {
            const damageRand = Math.random();
            if (damageRand < 0.5) {
              destructionLevel = this.buildingGenerator.destructionLevels.DAMAGED;
            } else if (damageRand < 0.8) {
              destructionLevel = this.buildingGenerator.destructionLevels.HEAVILY_DAMAGED;
            } else {
              destructionLevel = this.buildingGenerator.destructionLevels.PARTIALLY_COLLAPSED;
            }
          }
          
          // Create building with BuildingGenerator
          const buildingMesh = this.buildingGenerator.createBuilding({
            type: buildingType,
            width: buildingWidth,
            depth: buildingDepth,
            height: buildingHeight,
            position: { x: posX + buildingWidth / 2, y: 0, z: posZ + buildingDepth / 2 },
            destructionLevel: destructionLevel,
            blockId: `${blockX}_${blockZ}_${i}`
          });
          
          // Add building container to group
          buildingsGroup.add(buildingMesh.container);
          
          // Update building data for city grid
          buildings.push({
            x: posX,
            z: posZ,
            width: buildingWidth,
            depth: buildingDepth,
            height: buildingHeight,
            block: { x: blockX, z: blockZ },
            mesh: buildingMesh
          });
          
          // Mark building in grid
          this.markBuildingInGrid({
            x: posX,
            z: posZ,
            width: buildingWidth,
            depth: buildingDepth,
            height: buildingHeight,
            block: { x: blockX, z: blockZ }
          });
        }
      }
    }
    
    // Add all buildings to container
    this.container.add(buildingsGroup);
    console.log(`Created ${buildings.length} buildings`);
  }
  
  markBuildingInGrid(building) {
    // Convert world coordinates to grid indices
    const startX = Math.floor(building.x);
    const endX = Math.floor(building.x + building.width);
    const startZ = Math.floor(building.z);
    const endZ = Math.floor(building.z + building.depth);
    
    // Mark grid cells as occupied by this building
    for (let z = startZ; z <= endZ && z < this.citySize; z++) {
      for (let x = startX; x <= endX && x < this.citySize; x++) {
        if (this.cityGrid[z] && this.cityGrid[z][x]) {
          this.cityGrid[z][x] = {
            type: 'building',
            height: building.height,
            buildingId: `${building.block.x}_${building.block.z}`
          };
        }
      }
    }
  }
  
  // Check if a given world position is inside a building
  isPositionInBuilding(position) {
    if (!this.cityGrid) return false;
    
    // Convert world position to grid indices
    const gridX = Math.floor(position.x);
    const gridZ = Math.floor(position.z);
    
    // Check if position is valid and contains a building
    if (gridX >= 0 && gridX < this.citySize && gridZ >= 0 && gridZ < this.citySize) {
      return this.cityGrid[gridZ] && 
             this.cityGrid[gridZ][gridX] && 
             this.cityGrid[gridZ][gridX].type === 'building';
    }
    
    return false;
  }

  update(deltaTime) {
    // Update components if needed
    if (this.cityComponents) {
      this.cityComponents.update(deltaTime);
    }
    
    // Update apocalyptic assets (fire animations, etc.)
    if (this.apocalypticAssets) {
      this.apocalypticAssets.update(deltaTime);
    }
  }

  regenerate() {
    console.log('Regenerating city...');

    // Remove existing city elements from container
    while (this.container.children.length > 0) {
      this.container.remove(this.container.children[0]);
    }

    // Generate new city
    this.generate();

    console.log('City regeneration complete');
  }
}
