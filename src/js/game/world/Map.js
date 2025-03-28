import * as THREE from 'three';
import { Tile, MaterialCache } from './Tile.js';

export class Map {
  constructor(game, assetLoader) {
    this.game = game;
    this.assetLoader = assetLoader;
    this.container = new THREE.Group();

    // Map dimensions
    this.width = 40;
    this.height = 40;
    this.tileSize = 1;

    // Map data
    this.tiles = [];

    // Navigation
    this.navigationGrid = [];

    // Add player position tracking for collision detection
    this.playerPosition = new THREE.Vector2(0, 0);

    // Water animation properties
    this.waterTiles = [];
    this.waterAnimationTime = 0;

    // Map generation
    this.mapTypes = ['archipelago', 'island_fortress', 'bridges', 'maze'];
    this.currentMapType = this.mapTypes[Math.floor(Math.random() * this.mapTypes.length)];

    // Chunks für Optimierung - kleinere Chunks für präziseres Culling
    this.chunkSize = 4; // Reduziert von 8 auf 4 für bessere Performance
    this.chunks = {}; // Map von Chunk-IDs zu Chunk-Objekten
    this.activeChunks = new Set(); // Aktuell aktive Chunks für schnellere Iteration

    // Vorberechnete Werte für Performance-Optimierung
    this.chunkCount = {
      x: Math.ceil(this.width / this.chunkSize),
      z: Math.ceil(this.height / this.chunkSize),
    };
  }

  generate() {
    try {
      console.log('Starting map generation...');

      // Clear any existing map
      while (this.container.children.length > 0) {
        this.container.remove(this.container.children[0]);
      }

      console.log('Cleared existing map');

      this.tiles = [];
      this.waterTiles = [];

      // Center the map
      this.container.position.set(
        (-this.width * this.tileSize) / 2,
        0,
        (-this.height * this.tileSize) / 2
      );

      console.log('Map container positioned');

      // Generate map data using a template similar to the provided image
      console.log('Generating map data...');
      this.generateMapData();
      console.log('Map data generated');

      // Create tiles based on map data
      console.log('Creating tiles...');
      this.createTiles();
      console.log('Tiles created');

      // Merge geometries for better performance
      console.log('Merging geometries...');
      this.mergeGeometriesByType();
      console.log('Geometries merged');

      // Generate navigation grid for enemy pathfinding
      console.log('Generating navigation grid...');
      this.generateNavigationGrid();
      console.log('Navigation grid generated');

      console.log('Map generation complete:', {
        tilesCreated: this.tiles.length,
        waterTiles: this.waterTiles.length,
        containerChildren: this.container.children.length,
      });
    } catch (error) {
      console.error('Error in map generation:', error);
    }
  }

  generateMapData() {
    // Create a 2D array for the map data
    this.mapData = Array(this.height)
      .fill()
      .map(() => Array(this.width).fill(0));

    // console.log(`Generating procedural map: ${this.currentMapType}`);

    // Generate base terrain by map type
    switch (this.currentMapType) {
      case 'archipelago':
        this.generateArchipelagoMap();
        break;
      case 'island_fortress':
        this.generateIslandFortressMap();
        break;
      case 'bridges':
        this.generateBridgesMap();
        break;
      case 'maze':
        this.generateMazeMap();
        break;
      default:
        this.generateArchipelagoMap();
    }

    // Add player spawn point (central safe area)
    this.addPlayerSpawn();

    // Ensure paths from spawn points to center
    this.ensurePathsToCenter();

    // Add trees and decorations
    this.addDecorations();
  }

  // Generates an archipelago of small islands
  generateArchipelagoMap() {
    // Fill with water by default
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.mapData[y][x] = 0; // Water
      }
    }

    // Create several islands
    const numIslands = 5 + Math.floor(Math.random() * 7); // 5-11 islands

    for (let i = 0; i < numIslands; i++) {
      const islandCenterX = 5 + Math.floor(Math.random() * (this.width - 10));
      const islandCenterY = 5 + Math.floor(Math.random() * (this.height - 10));
      const islandRadius = 2 + Math.floor(Math.random() * 5); // 2-6 tiles

      // Create the island (irregular shape)
      for (let y = islandCenterY - islandRadius; y <= islandCenterY + islandRadius; y++) {
        for (let x = islandCenterX - islandRadius; x <= islandCenterX + islandRadius; x++) {
          if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
            const dx = x - islandCenterX;
            const dy = y - islandCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Add some noise to island edge
            const noiseFactor = Math.random() * 0.5 + 0.8;

            if (distance <= islandRadius * noiseFactor) {
              this.mapData[y][x] = 1; // Stone/land
            }
          }
        }
      }

      // Add some walls or structures to bigger islands
      if (islandRadius > 3) {
        const structureType = Math.floor(Math.random() * 3);

        if (structureType === 0) {
          // Small fort
          const fortSize = Math.floor(islandRadius / 2);
          for (let y = islandCenterY - fortSize; y <= islandCenterY + fortSize; y++) {
            for (let x = islandCenterX - fortSize; x <= islandCenterX + fortSize; x++) {
              if (
                y >= 0 &&
                y < this.height &&
                x >= 0 &&
                x < this.width &&
                this.mapData[y][x] === 1
              ) {
                if (
                  x === islandCenterX - fortSize ||
                  x === islandCenterX + fortSize ||
                  y === islandCenterY - fortSize ||
                  y === islandCenterY + fortSize
                ) {
                  this.mapData[y][x] = 2; // Wall
                }
              }
            }
          }
        } else if (structureType === 1) {
          // Random walls
          const numWalls = Math.floor(Math.random() * 8) + 3;
          for (let w = 0; w < numWalls; w++) {
            const wallX =
              islandCenterX + Math.floor(Math.random() * islandRadius * 2) - islandRadius;
            const wallY =
              islandCenterY + Math.floor(Math.random() * islandRadius * 2) - islandRadius;

            if (
              wallX >= 0 &&
              wallX < this.width &&
              wallY >= 0 &&
              wallY < this.height &&
              this.mapData[wallY][wallX] === 1
            ) {
              this.mapData[wallY][wallX] = 2; // Wall
            }
          }
        }
      }
    }

    // Connect some islands with bridges
    this.connectIslandsWithBridges();

    // Ensure some walkable areas at the edges for zombie spawning
    this.ensureEdgeSpawnPoints();
  }

  // Generate island fortress map with a large central island and defensive walls
  generateIslandFortressMap() {
    // Fill with water by default
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.mapData[y][x] = 0; // Water
      }
    }

    // Create central fortress island
    const islandCenterX = Math.floor(this.width / 2);
    const islandCenterY = Math.floor(this.height / 2);
    const islandRadius = 10 + Math.floor(Math.random() * 5);

    // Create the main island
    for (let y = islandCenterY - islandRadius; y <= islandCenterY + islandRadius; y++) {
      for (let x = islandCenterX - islandRadius; x <= islandCenterX + islandRadius; x++) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
          const dx = x - islandCenterX;
          const dy = y - islandCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Add some noise to island edge
          const noiseFactor = Math.random() * 0.3 + 0.9;

          if (distance <= islandRadius * noiseFactor) {
            this.mapData[y][x] = 1; // Stone/land
          }
        }
      }
    }

    // Add outer wall/fortifications
    const wallRadius = islandRadius - 2;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 32) {
      const wallX = Math.round(islandCenterX + Math.cos(angle) * wallRadius);
      const wallY = Math.round(islandCenterY + Math.sin(angle) * wallRadius);

      if (wallX >= 0 && wallX < this.width && wallY >= 0 && wallY < this.height) {
        this.mapData[wallY][wallX] = 2; // Wall
      }
    }

    // Add some internal structures
    const innerStructureRadius = wallRadius / 2;

    // Central building
    for (let y = islandCenterY - 2; y <= islandCenterY + 2; y++) {
      for (let x = islandCenterX - 2; x <= islandCenterX + 2; x++) {
        if (
          x === islandCenterX - 2 ||
          x === islandCenterX + 2 ||
          y === islandCenterY - 2 ||
          y === islandCenterY + 2
        ) {
          this.mapData[y][x] = 2; // Wall
        }
      }
    }

    // Random buildings
    const numBuildings = 3 + Math.floor(Math.random() * 5);
    for (let b = 0; b < numBuildings; b++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * innerStructureRadius;

      const buildingCenterX = Math.floor(islandCenterX + Math.cos(angle) * distance);
      const buildingCenterY = Math.floor(islandCenterY + Math.sin(angle) * distance);
      const buildingSize = 1 + Math.floor(Math.random() * 2);

      for (let y = buildingCenterY - buildingSize; y <= buildingCenterY + buildingSize; y++) {
        for (let x = buildingCenterX - buildingSize; x <= buildingCenterX + buildingSize; x++) {
          if (
            y >= 0 &&
            y < this.height &&
            x >= 0 &&
            x < this.width &&
            this.mapData[y][x] === 1 &&
            (x === buildingCenterX - buildingSize ||
              x === buildingCenterX + buildingSize ||
              y === buildingCenterY - buildingSize ||
              y === buildingCenterY + buildingSize)
          ) {
            this.mapData[y][x] = 2; // Wall
          }
        }
      }
    }

    // Add small outer islands
    const numOuterIslands = 4 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numOuterIslands; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = islandRadius + 3 + Math.floor(Math.random() * 8);

      const outerIslandCenterX = Math.floor(islandCenterX + Math.cos(angle) * distance);
      const outerIslandCenterY = Math.floor(islandCenterY + Math.sin(angle) * distance);
      const outerIslandRadius = 1 + Math.floor(Math.random() * 3);

      for (
        let y = outerIslandCenterY - outerIslandRadius;
        y <= outerIslandCenterY + outerIslandRadius;
        y++
      ) {
        for (
          let x = outerIslandCenterX - outerIslandRadius;
          x <= outerIslandCenterX + outerIslandRadius;
          x++
        ) {
          if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
            const dx = x - outerIslandCenterX;
            const dy = y - outerIslandCenterY;
            const distToCenter = Math.sqrt(dx * dx + dy * dy);

            if (distToCenter <= outerIslandRadius) {
              this.mapData[y][x] = 1; // Stone/land
            }
          }
        }
      }
    }

    // Connect main island to some outer islands
    this.connectIslandsWithBridges();

    // Ensure some walkable areas at the edges for zombie spawning
    this.ensureEdgeSpawnPoints();
  }

  // Generate map with several bridges connecting different landmasses
  generateBridgesMap() {
    // Fill with water by default
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.mapData[y][x] = 0; // Water
      }
    }

    // Create main horizontal bridge
    const bridgeWidth = 2 + Math.floor(Math.random() * 3);
    const bridgeY = Math.floor(this.height / 2);

    for (
      let y = bridgeY - Math.floor(bridgeWidth / 2);
      y <= bridgeY + Math.floor(bridgeWidth / 2);
      y++
    ) {
      for (let x = 0; x < this.width; x++) {
        if (y >= 0 && y < this.height) {
          this.mapData[y][x] = 1; // Stone path
        }
      }
    }

    // Add pillars/supports along the bridge
    for (let x = 3; x < this.width; x += 5 + Math.floor(Math.random() * 4)) {
      const pillarY1 = bridgeY - Math.floor(bridgeWidth / 2) - 1;
      const pillarY2 = bridgeY + Math.floor(bridgeWidth / 2) + 1;

      if (pillarY1 >= 0) this.mapData[pillarY1][x] = 2; // Wall
      if (pillarY2 < this.height) this.mapData[pillarY2][x] = 2; // Wall
    }

    // Create secondary vertical bridges
    const numVertBridges = 2 + Math.floor(Math.random() * 3);
    const possiblePositions = [];
    const vertBridgeWidths = []; // Array zum Speichern der Breiten der vertikalen Brücken

    // Space out the vertical bridges
    const spacing = Math.floor(this.width / (numVertBridges + 1));
    for (let i = 1; i <= numVertBridges; i++) {
      possiblePositions.push(spacing * i);
    }

    for (let i = 0; i < numVertBridges; i++) {
      const bridgeX = possiblePositions[i] + Math.floor(Math.random() * 5) - 2;
      const vertBridgeWidth = 1 + Math.floor(Math.random() * 2);
      vertBridgeWidths[i] = vertBridgeWidth; // Speichere die Breite für späteren Zugriff

      // Either full bridge or split bridge
      const bridgeType = Math.random() > 0.5 ? 'full' : 'split';

      if (bridgeType === 'full') {
        // Full bridge from top to bottom
        for (
          let x = bridgeX - Math.floor(vertBridgeWidth / 2);
          x <= bridgeX + Math.floor(vertBridgeWidth / 2);
          x++
        ) {
          for (let y = 0; y < this.height; y++) {
            if (x >= 0 && x < this.width) {
              this.mapData[y][x] = 1; // Stone path
            }
          }
        }
      } else {
        // Split bridge - doesn't fully connect
        const gap = 3 + Math.floor(Math.random() * 5);
        const gapStart = Math.floor(this.height / 2) - Math.floor(gap / 2);

        for (
          let x = bridgeX - Math.floor(vertBridgeWidth / 2);
          x <= bridgeX + Math.floor(vertBridgeWidth / 2);
          x++
        ) {
          for (let y = 0; y < this.height; y++) {
            if (x >= 0 && x < this.width && (y < gapStart || y > gapStart + gap)) {
              this.mapData[y][x] = 1; // Stone path
            }
          }
        }
      }

      // Add pillars/supports along vertical bridge
      for (let y = 3; y < this.height; y += 5 + Math.floor(Math.random() * 4)) {
        const pillarX1 = bridgeX - Math.floor(vertBridgeWidth / 2) - 1;
        const pillarX2 = bridgeX + Math.floor(vertBridgeWidth / 2) + 1;

        if (pillarX1 >= 0) this.mapData[y][pillarX1] = 2; // Wall
        if (pillarX2 < this.width) this.mapData[y][pillarX2] = 2; // Wall
      }
    }

    // Add some small islands
    const numIslands = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numIslands; i++) {
      const islandCenterX = 5 + Math.floor(Math.random() * (this.width - 10));
      const islandCenterY = 5 + Math.floor(Math.random() * (this.height - 10));
      const islandRadius = 1 + Math.floor(Math.random() * 3);

      // Avoid placing on bridges
      if (Math.abs(islandCenterY - bridgeY) < bridgeWidth + islandRadius) {
        continue;
      }

      // Check if too close to vertical bridges
      let tooCloseToVertBridge = false;
      for (let vb = 0; vb < numVertBridges; vb++) {
        const vbX = possiblePositions[vb];
        const currentVertBridgeWidth = vertBridgeWidths[vb]; // Zugriff auf die gespeicherte Breite
        if (Math.abs(islandCenterX - vbX) < currentVertBridgeWidth + islandRadius) {
          tooCloseToVertBridge = true;
          break;
        }
      }

      if (tooCloseToVertBridge) {
        continue;
      }

      // Create the island
      for (let y = islandCenterY - islandRadius; y <= islandCenterY + islandRadius; y++) {
        for (let x = islandCenterX - islandRadius; x <= islandCenterX + islandRadius; x++) {
          if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
            const dx = x - islandCenterX;
            const dy = y - islandCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= islandRadius) {
              this.mapData[y][x] = 1; // Stone/land
            }
          }
        }
      }
    }

    // Ensure some walkable areas at the edges for zombie spawning
    this.ensureEdgeSpawnPoints();
  }

  // Generate a maze-like map with walls
  generateMazeMap() {
    // Fill with ground first
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.mapData[y][x] = 1; // Stone/ground
      }
    }

    // Add a border of water, but leave some stone paths for zombie spawning
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // 75% chance of water at the edges, 25% chance of stone for spawning
        if (
          (x < 2 || x >= this.width - 2 || y < 2 || y >= this.height - 2) &&
          Math.random() < 0.75
        ) {
          this.mapData[y][x] = 0; // Water
        }
      }
    }

    // Create maze walls with some randomness
    for (let y = 4; y < this.height - 4; y += 3) {
      for (let x = 4; x < this.width - 4; x += 3) {
        // Don't add walls in central area (player spawn)
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const distToCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

        if (distToCenter < 6) continue;

        if (Math.random() < 0.7) {
          // Add random horizontal or vertical wall segment
          const isHorizontal = Math.random() > 0.5;
          const length = 2 + Math.floor(Math.random() * 5);

          for (let i = 0; i < length; i++) {
            const wallX = isHorizontal ? x + i : x;
            const wallY = isHorizontal ? y : y + i;

            if (wallX < this.width - 3 && wallY < this.height - 3) {
              this.mapData[wallY][wallX] = 2; // Wall
            }
          }
        }
      }
    }

    // Add some water patches
    const numWaterPatches = 5 + Math.floor(Math.random() * 8);
    for (let i = 0; i < numWaterPatches; i++) {
      const waterX = 5 + Math.floor(Math.random() * (this.width - 10));
      const waterY = 5 + Math.floor(Math.random() * (this.height - 10));
      const waterRadius = 1 + Math.floor(Math.random() * 3);

      // Avoid center area
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      const distToCenter = Math.sqrt(Math.pow(waterX - centerX, 2) + Math.pow(waterY - centerY, 2));

      if (distToCenter < 8) continue;

      for (let y = waterY - waterRadius; y <= waterY + waterRadius; y++) {
        for (let x = waterX - waterRadius; x <= waterX + waterRadius; x++) {
          if (y >= 2 && y < this.height - 2 && x >= 2 && x < this.width - 2) {
            const dx = x - waterX;
            const dy = y - waterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= waterRadius) {
              this.mapData[y][x] = 0; // Water
            }
          }
        }
      }
    }

    // Ensure some walkable areas at the edges for zombie spawning
    this.ensureEdgeSpawnPoints();
  }

  // Connect islands with bridges
  connectIslandsWithBridges() {
    // Identify islands (contiguous land masses)
    const islands = this.identifyIslands();

    // If there are multiple islands, connect some of them
    if (islands.length > 1) {
      // Choose number of bridges to create (at least connect all islands)
      const numBridges = Math.min(
        islands.length + 1,
        1 + Math.floor(Math.random() * Math.min(5, islands.length))
      );

      for (let b = 0; b < numBridges; b++) {
        // Find two random islands to connect
        const island1Index = Math.floor(Math.random() * islands.length);
        let island2Index;
        do {
          island2Index = Math.floor(Math.random() * islands.length);
        } while (island1Index === island2Index);

        const island1 = islands[island1Index];
        const island2 = islands[island2Index];

        // Find closest points between islands
        let minDistance = Infinity;
        let closestPoint1 = null;
        let closestPoint2 = null;

        for (const point1 of island1) {
          for (const point2 of island2) {
            const distance = Math.sqrt(
              Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
            );

            if (distance < minDistance) {
              minDistance = distance;
              closestPoint1 = point1;
              closestPoint2 = point2;
            }
          }
        }

        // Create a bridge between the closest points
        if (closestPoint1 && closestPoint2) {
          this.createBridge(closestPoint1, closestPoint2);
        }
      }
    }
  }

  // Identify all islands (contiguous land areas)
  identifyIslands() {
    const visited = Array(this.height)
      .fill()
      .map(() => Array(this.width).fill(false));
    const islands = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!visited[y][x] && this.mapData[y][x] === 1) {
          // If land and not visited
          const island = [];
          this.floodFillIsland(x, y, visited, island);

          if (island.length > 0) {
            islands.push(island);
          }
        }
      }
    }

    return islands;
  }

  // Find all connected land tiles (used for island identification)
  floodFillIsland(x, y, visited, island) {
    if (
      x < 0 ||
      x >= this.width ||
      y < 0 ||
      y >= this.height ||
      visited[y][x] ||
      this.mapData[y][x] !== 1
    ) {
      return;
    }

    visited[y][x] = true;
    island.push({ x, y });

    // Check adjacent tiles
    this.floodFillIsland(x + 1, y, visited, island);
    this.floodFillIsland(x - 1, y, visited, island);
    this.floodFillIsland(x, y + 1, visited, island);
    this.floodFillIsland(x, y - 1, visited, island);
  }

  // Create a bridge between two points
  createBridge(point1, point2) {
    // Berechne die Richtung des Pfads
    const dirX = Math.sign(point2.x - point1.x);
    const dirY = Math.sign(point2.y - point1.y);

    // Start an Punkt 1
    let x = point1.x;
    let y = point1.y;

    // Erstelle den Pfad Punkt für Punkt
    while (x !== point2.x || y !== point2.y) {
      // Setze die aktuelle Position auf Stein
      if (this.mapData[y][x] === 0) {
        // Nur, wenn aktuell Wasser ist
        this.mapData[y][x] = 4; // Pfad anstelle von Stein
      }

      // Bewege in Richtung Punkt 2
      if (x !== point2.x) {
        x += dirX;
      } else if (y !== point2.y) {
        y += dirY;
      }
    }

    // Stelle sicher, dass Endpunkt auch gesetzt ist
    if (this.mapData[point2.y][point2.x] === 0) {
      this.mapData[point2.y][point2.x] = 4; // Pfad anstelle von Stein
    }
  }

  // Add a safe spawn point for the player
  addPlayerSpawn() {
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    const spawnRadius = 3;

    // Create a safe area for player to spawn
    for (let y = centerY - spawnRadius; y <= centerY + spawnRadius; y++) {
      for (let x = centerX - spawnRadius; x <= centerX + spawnRadius; x++) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= spawnRadius) {
            this.mapData[y][x] = 1; // Make sure it's walkable land
          }
        }
      }
    }
  }

  addDecorations() {
    // Add trees around the map - mehr Bäume für eine dichtere Vegetation
    const treeCount = Math.floor(this.width * this.height * 0.03); // 3% der Karte mit Bäumen bedeckt

    // Verschiedene Baumcluster erstellen
    this.createTreeClusters(Math.floor(treeCount * 0.7)); // 70% der Bäume in Clustern

    // Einzelne Bäume für Variation
    this.createScatteredTrees(Math.floor(treeCount * 0.3)); // 30% der Bäume verstreut
  }

  // Bäume in natürlich aussehenden Clustern erstellen
  createTreeClusters(treeCount) {
    // Erstelle mehrere Cluster
    const clusterCount = Math.floor(this.width * this.height * 0.005); // 0.5% der Karte als Cluster-Zentren
    const clusterCenters = [];

    // Erstelle Cluster-Zentren
    for (let i = 0; i < clusterCount; i++) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);

      // Nur auf Land platzieren
      if (this.mapData[y][x] === 1) {
        clusterCenters.push({ x, y });
      }
    }

    // Keine Cluster? Dann abbrechen
    if (clusterCenters.length === 0) return;

    // Bäume um die Cluster herum platzieren
    for (let i = 0; i < treeCount; i++) {
      // Wähle ein zufälliges Cluster-Zentrum
      const clusterIndex = Math.floor(Math.random() * clusterCenters.length);
      const cluster = clusterCenters[clusterIndex];

      // Erzeuge Bäume mit einer Normalverteilung um das Zentrum
      const gaussianRandom = () => {
        let u = 0,
          v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      };

      // Cluster-Radius: kleine Cluster sehen natürlicher aus
      const clusterRadius = 3 + Math.random() * 3;

      // Position mit Normalverteilung um das Zentrum
      const offsetX = Math.round(gaussianRandom() * clusterRadius);
      const offsetY = Math.round(gaussianRandom() * clusterRadius);

      const treeX = Math.min(Math.max(0, cluster.x + offsetX), this.width - 1);
      const treeY = Math.min(Math.max(0, cluster.y + offsetY), this.height - 1);

      // Prüfe, ob der Platz für einen Baum geeignet ist
      this.tryPlaceTree(treeX, treeY);
    }
  }

  // Einzelne Bäume verstreut über die Karte erstellen
  createScatteredTrees(treeCount) {
    for (let i = 0; i < treeCount; i++) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);

      // Versuche einen Baum zu platzieren
      this.tryPlaceTree(x, y);
    }
  }

  // Versucht einen Baum an der angegebenen Position zu platzieren
  tryPlaceTree(x, y) {
    // Nur auf Land platzieren
    if (this.mapData[y][x] !== 1) return false;

    // Prüfe, ob genug Platz vorhanden ist
    let hasSpace = true;

    // Prüfe nur direkt angrenzende Felder für natürlichere Baumdichte
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        // Direktes Zentrum überspringen
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          // Keine Bäume neben Wänden oder anderen Bäumen
          if (this.mapData[ny][nx] === 2 || this.mapData[ny][nx] === 3) {
            hasSpace = false;
            break;
          }
        }
      }
      if (!hasSpace) break;
    }

    // Wenn genug Platz ist, platziere einen Baum
    if (hasSpace) {
      this.mapData[y][x] = 3; // Baum
      return true;
    }

    return false;
  }

  createTiles() {
    try {
      // Erstelle ein 2D-Array für die Tiles
      this.tiles = Array(this.height)
        .fill()
        .map(() => Array(this.width).fill(null));
      this.waterTiles = []; // Reset der Wassertiles

      // Sammle Geometrien für verschiedene Tile-Typen
      const geometryBatches = {
        water: [], // Wasser (transparent, muss separat gerendert werden)
        land: [], // Gras/Land
        road: [], // Straßen
        building: [], // Gebäude
        sand: [], // Sand/Strand
        bridge: [], // Brücken
        wall: [], // Wände/Barrieren
        special: [], // Spezielle Objekte (Bäume, Lampen, etc.)
        other: [], // Sonstige Objekte
      };

      // Erstelle für jede Position in der Map ein Tile
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          // Hole den Tile-Typ aus den Map-Daten
          const tileType = this.mapData[y][x] || 0;

          // Berechne Höhe für dieses Tile (kann später für Hügel verwendet werden)
          const height = 0;

          // Bestimme spezielle Features (z.B. Bäume, Lampen)
          const special = null; // Vereinfachung: Keine speziellen Features

          // Erstelle ein neues Tile
          const tile = new Tile(this.game, this.assetLoader, x, y, tileType, height, special);

          // Setze die Weltposition des Tiles
          const worldPosition = new THREE.Vector3(x * this.tileSize, 0, y * this.tileSize);

          // Füge das Tile zum Container hinzu
          this.container.add(tile.container);

          // Speichere das Tile im Array
          this.tiles[y][x] = tile;

          // Tracke Wassertiles für Animation
          if (tileType === 0) {
            this.waterTiles.push({ tile, x, y });
          }

          // Füge das Tile zum entsprechenden Chunk hinzu
          this.addTileToChunk(tile, x, y);
        }
      }

      // Füge Nahtflächen zwischen Tiles hinzu, um schwarze Lücken zu vermeiden
      this.addTileSeams();

      // Sammle Geometrien nach Typ für Batching
      this.collectGeometriesForBatching(geometryBatches);

      // Führe Geometrien zusammen und erstelle optimierte Meshes
      this.createMergedGeometries(geometryBatches);

      // Erstelle Bounding-Boxen für Chunks
      this.createChunkBoundingBoxes();

      console.log('Tiles created successfully:', {
        width: this.width,
        height: this.height,
        totalTiles: this.width * this.height,
      });
    } catch (error) {
      console.error('Error in tile creation:', error);
    }
  }

  // Fügt ein Tile zu einem Chunk hinzu, basierend auf seiner Position
  addTileToChunk(tile, tileX, tileY) {
    // Bestimme den Chunk, zu dem dieses Tile gehört
    const chunkX = Math.floor(tileX / this.chunkSize);
    const chunkZ = Math.floor(tileY / this.chunkSize); // y-Koordinate ist z in der 3D-Welt

    // Erstelle eine eindeutige ID für diesen Chunk
    const chunkID = `${chunkX},${chunkZ}`;

    // Erstelle den Chunk, falls er noch nicht existiert
    if (!this.chunks[chunkID]) {
      this.chunks[chunkID] = {
        chunkX: chunkX,
        chunkY: chunkZ, // Behalte die alte Benennung für Kompatibilität
        tiles: [],
        boundingBox: new THREE.Box3(),
      };
    }

    // Füge das Tile zum Chunk hinzu
    this.chunks[chunkID].tiles.push(tile);
  }

  // Methode zum Sammeln von Geometrien für Batching aktualisieren
  // alt: collectGeometriesForBatching
  collectGeometriesForBatching(batches) {
    try {
      console.log('Collecting geometries for batching...');

      // Iteriere über alle Tiles
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const tile = this.tiles[y][x];
          if (!tile) continue;

          const worldPosition = new THREE.Vector3(x * this.tileSize, 0, y * this.tileSize);

          // Verwende den Tile-Typ für die Kategorisierung
          switch (tile.tileType) {
            case 0: // Wasser - separat behandeln für Animation
              if (tile.detailLevels && tile.detailLevels.high && tile.detailLevels.high.water) {
                batches.water.push({
                  position: worldPosition.clone(),
                  mesh: tile.detailLevels.high.water,
                });
              }
              break;

            case 1: // Land/Gras
              if (tile.detailLevels && tile.detailLevels.high && tile.detailLevels.high.grass) {
                batches.land.push({
                  position: worldPosition.clone(),
                  mesh: tile.detailLevels.high.grass,
                });
              }
              break;

            case 2: // Wände/Barrieren
              if (tile.detailLevels && tile.detailLevels.high && tile.detailLevels.high.wall) {
                batches.wall.push({
                  position: worldPosition.clone(),
                  mesh: tile.detailLevels.high.wall,
                });
              }
              // Basis für Wände (falls vorhanden)
              if (tile.detailLevels && tile.detailLevels.high && tile.detailLevels.high.base) {
                batches.wall.push({
                  position: worldPosition.clone(),
                  mesh: tile.detailLevels.high.base,
                });
              }
              break;

            case 3: // Bäume und Vegetation
              // Boden unter dem Baum
              if (tile.detailLevels && tile.detailLevels.high && tile.detailLevels.high.ground) {
                batches.land.push({
                  position: worldPosition.clone(),
                  mesh: tile.detailLevels.high.ground,
                });
              }

              // Baumstamm und Krone als spezielle Objekte behandeln
              if (tile.detailLevels && tile.detailLevels.high) {
                // Baumstamm
                if (tile.detailLevels.high.trunk) {
                  batches.special.push({
                    position: worldPosition.clone(),
                    mesh: tile.detailLevels.high.trunk,
                    type: 'tree_trunk',
                  });
                }

                // Baumkrone
                if (tile.detailLevels.high.foliage) {
                  if (tile.detailLevels.high.foliage.isGroup) {
                    // Es ist eine Gruppe, sammle alle Kinder (die Meshes sind)
                    tile.detailLevels.high.foliage.children.forEach((childMesh) => {
                      if (childMesh.isMesh) {
                        // Position berechnen: Welt + Gruppe + Kind
                        const childPosition = worldPosition.clone();
                        childPosition.y +=
                          tile.detailLevels.high.foliage.position.y + (childMesh.position.y || 0);

                        batches.special.push({
                          position: childPosition,
                          mesh: childMesh,
                          type: 'tree_foliage',
                        });
                      }
                    });
                  } else if (tile.detailLevels.high.foliage.isMesh) {
                    batches.special.push({
                      position: worldPosition.clone(),
                      mesh: tile.detailLevels.high.foliage,
                      type: 'tree_foliage',
                    });
                  }
                }
              }
              break;

            case 4: // Pfad/Straße
              if (tile.detailLevels && tile.detailLevels.high && tile.detailLevels.high.road) {
                batches.road.push({
                  position: worldPosition.clone(),
                  mesh: tile.detailLevels.high.road,
                });
              }
              break;

            case 5: // Sand/Strand
              if (tile.detailLevels && tile.detailLevels.high && tile.detailLevels.high.sand) {
                batches.sand.push({
                  position: worldPosition.clone(),
                  mesh: tile.detailLevels.high.sand,
                });
              }
              break;

            case 6: // Brücke
              if (tile.detailLevels && tile.detailLevels.high && tile.detailLevels.high.bridge) {
                batches.bridge.push({
                  position: worldPosition.clone(),
                  mesh: tile.detailLevels.high.bridge,
                });
              }
              break;

            case 7: // Gebäude
              if (tile.detailLevels && tile.detailLevels.high && tile.detailLevels.high.building) {
                batches.building.push({
                  position: worldPosition.clone(),
                  mesh: tile.detailLevels.high.building,
                });
              }
              break;

            default:
              // Sonstige Objekte
              if (tile.detailLevels && tile.detailLevels.high) {
                // Alle anderen Meshes im high-Detail-Level
                Object.entries(tile.detailLevels.high).forEach(([key, mesh]) => {
                  if (
                    mesh &&
                    mesh.isMesh &&
                    ![
                      'water',
                      'grass',
                      'wall',
                      'base',
                      'ground',
                      'trunk',
                      'foliage',
                      'road',
                      'sand',
                      'bridge',
                      'building',
                    ].includes(key)
                  ) {
                    batches.other.push({
                      position: worldPosition.clone(),
                      mesh: mesh,
                      type: key,
                    });
                  }
                });
              }
              break;
          }

          // Spezielle Features wie Lampen, Schilder, etc. (unabhängig vom Tile-Typ)
          if (tile.detailLevels && tile.detailLevels.high) {
            // Lampen
            if (tile.detailLevels.high.lamp) {
              batches.special.push({
                position: worldPosition.clone(),
                mesh: tile.detailLevels.high.lamp,
                type: 'lamp',
              });
            }

            // Schilder
            if (tile.detailLevels.high.sign) {
              batches.special.push({
                position: worldPosition.clone(),
                mesh: tile.detailLevels.high.sign,
                type: 'sign',
              });
            }
          }
        }
      }

      console.log('Geometry collection complete', {
        waterCount: batches.water.length,
        landCount: batches.land.length,
        roadCount: batches.road.length,
        buildingCount: batches.building.length,
        wallCount: batches.wall.length,
        sandCount: batches.sand.length,
        bridgeCount: batches.bridge.length,
        specialCount: batches.special.length,
        otherCount: batches.other.length,
      });
    } catch (error) {
      console.error('Error collecting geometries:', error);
    }
  }

  // Erstelle die zusammengeführten Geometrien pro Typ
  createMergedGeometries(batches) {
    try {
      console.log('Creating merged geometries...');

      // Container für zusammengeführte Geometrien
      this.mergedGeometries = new THREE.Group();
      this.container.add(this.mergedGeometries);

      // Standard-Materialien für verschiedene Batch-Typen
      const materials = {
        water: new THREE.MeshStandardMaterial({ color: 0x3333ff, transparent: true, opacity: 0.8 }),
        land: new THREE.MeshStandardMaterial({ color: 0x33aa33 }),
        road: new THREE.MeshStandardMaterial({ color: 0x666666 }),
        building: new THREE.MeshStandardMaterial({ color: 0x995533 }),
        sand: new THREE.MeshStandardMaterial({ color: 0xeedd77 }),
        bridge: new THREE.MeshStandardMaterial({ color: 0xbbaa99 }),
        wall: new THREE.MeshStandardMaterial({ color: 0x777777 }),
        other: new THREE.MeshStandardMaterial({ color: 0xaaaaaa }),
      };

      // Instanzierte Meshes für spezielle Objekte erstellen
      this.createInstancedMeshes(batches.special);

      // Für jeden Batch-Typ eine zusammengeführte Geometrie erstellen
      for (const [type, collection] of Object.entries(batches)) {
        // Spezielle Objekte überspringen, da sie mit Instancing behandelt werden
        if (type === 'special') continue;

        if (collection.length > 0) {
          // Überprüfen, ob wir ein gültiges erstes Element haben
          if (!collection[0] || !collection[0].mesh) {
            console.warn(`Skipping invalid collection for ${type}`);
            continue;
          }

          // Verwenden des ersten Mesh als Referenz
          const refMesh = collection[0].mesh;
          if (!refMesh.geometry) {
            console.warn(`Missing geometry for type ${type}`);
            continue;
          }

          // Zusammengeführte Geometrie erstellen
          const mergedGeometry = new THREE.BufferGeometry();

          // Attribute für die zusammengeführte Geometrie
          const positions = [];
          const normals = [];
          const uvs = [];
          const indices = [];

          // Startindex für Indices
          let indexOffset = 0;

          // Alle Meshes in diesem Batch durchgehen
          collection.forEach((item) => {
            if (!item || !item.mesh || !item.mesh.geometry) {
              console.warn(`Skipping invalid mesh in collection for ${type}`);
              return;
            }

            const mesh = item.mesh;
            const position = item.position;

            // Geometrie-Attribute holen
            const posAttribute = mesh.geometry.getAttribute('position');
            if (!posAttribute) {
              console.warn(`Skipping mesh with missing position attribute for ${type}`);
              return;
            }

            const normalAttribute = mesh.geometry.getAttribute('normal');
            const uvAttribute = mesh.geometry.getAttribute('uv');

            // Matrix für Positionstransformation
            const matrix = new THREE.Matrix4().setPosition(position);
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);

            // Temporäre Vektoren
            const tempVertex = new THREE.Vector3();
            const tempNormal = new THREE.Vector3();

            // Vertex-Daten hinzufügen
            for (let i = 0; i < posAttribute.count; i++) {
              // Position
              tempVertex.fromBufferAttribute(posAttribute, i);
              tempVertex.applyMatrix4(matrix);
              positions.push(tempVertex.x, tempVertex.y, tempVertex.z);

              // Normale
              if (normalAttribute) {
                tempNormal.fromBufferAttribute(normalAttribute, i);
                tempNormal.applyMatrix3(normalMatrix);
                tempNormal.normalize();
                normals.push(tempNormal.x, tempNormal.y, tempNormal.z);
              } else {
                normals.push(0, 1, 0); // Default-Normale
              }

              // UVs
              if (uvAttribute) {
                uvs.push(uvAttribute.getX(i), uvAttribute.getY(i));
              } else {
                uvs.push(0, 0); // Default-UVs
              }
            }

            // Indices
            const indexAttribute = mesh.geometry.getIndex();
            if (indexAttribute) {
              for (let i = 0; i < indexAttribute.count; i++) {
                indices.push(indexAttribute.getX(i) + indexOffset);
              }
            } else {
              // Wenn keine Indices, generiere Dreiecke
              for (let i = 0; i < posAttribute.count; i += 3) {
                indices.push(i + indexOffset, i + 1 + indexOffset, i + 2 + indexOffset);
              }
            }

            // Offset für nächstes Mesh erhöhen
            indexOffset += posAttribute.count;

            // Original-Mesh ausblenden
            mesh.visible = false;
          });

          // Attribute setzen
          if (positions.length > 0) {
            mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
            mergedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

            if (indices.length > 0) {
              mergedGeometry.setIndex(indices);
            }

            // Material aus der Referenz oder aus den Standard-Materialien verwenden
            const material = refMesh.material || materials[type];

            // Merged Mesh erstellen
            const mergedMesh = new THREE.Mesh(mergedGeometry, material);
            mergedMesh.name = `merged_${type}`;

            // Schatten-Eigenschaften setzen
            mergedMesh.castShadow = refMesh.castShadow || false;
            mergedMesh.receiveShadow = refMesh.receiveShadow || false;

            // Zum Container hinzufügen
            this.mergedGeometries.add(mergedMesh);

            console.log(
              `Created merged geometry for ${type} with ${positions.length / 3} vertices`
            );
          }
        }
      }
    } catch (error) {
      console.error('Error creating merged geometries:', error);
    }
  }

  // Erstellt instanzierte Meshes für komplexe Objekte (Bäume, Lampen, etc.)
  createInstancedMeshes(specialCollection) {
    try {
      if (!specialCollection || specialCollection.length === 0) return;

      // Nach Typ gruppieren
      const typeGroups = {};

      // Sammle alle Objekte nach Typ
      specialCollection.forEach((item) => {
        if (!item || !item.mesh || !item.mesh.geometry) return;

        const type = item.type || 'unknown';
        if (!typeGroups[type]) {
          typeGroups[type] = {
            geometries: new Set(),
            items: [],
          };
        }

        // Geometrie hinzufügen und das Item speichern
        typeGroups[type].geometries.add(item.mesh.geometry);
        typeGroups[type].items.push(item);
      });

      // Für jeden Typ ein instanziertes Mesh erstellen
      for (const [type, group] of Object.entries(typeGroups)) {
        // Wenn mehrere verschiedene Geometrien, separat behandeln
        if (group.geometries.size > 1) {
          console.log(
            `Multiple geometry types (${group.geometries.size}) found for ${type}, creating separate merged meshes`
          );

          // Gruppieren nach Geometrie
          const geometryGroups = {};
          group.items.forEach((item) => {
            const geometryId = item.mesh.geometry.uuid;
            if (!geometryGroups[geometryId]) {
              geometryGroups[geometryId] = {
                geometry: item.mesh.geometry,
                material: item.mesh.material,
                positions: [],
              };
            }
            geometryGroups[geometryId].positions.push(item.position);
          });

          // Für jede Geometrie ein instanziertes Mesh erstellen
          for (const [geometryId, geoGroup] of Object.entries(geometryGroups)) {
            if (geoGroup.positions.length === 0) continue;

            const instancedMesh = new THREE.InstancedMesh(
              geoGroup.geometry,
              geoGroup.material,
              geoGroup.positions.length
            );

            instancedMesh.name = `instanced_${type}_${geometryId.slice(0, 5)}`;

            // Matrix für jede Instanz
            const matrix = new THREE.Matrix4();

            // Setze Positionen für Instanzen
            geoGroup.positions.forEach((position, i) => {
              matrix.setPosition(position);
              instancedMesh.setMatrixAt(i, matrix);
            });

            // Aktualisiere die Matrizen
            instancedMesh.instanceMatrix.needsUpdate = true;

            // Schatten-Eigenschaften setzen
            instancedMesh.castShadow = true;
            instancedMesh.receiveShadow = false;

            // Zum Container hinzufügen
            this.mergedGeometries.add(instancedMesh);

            console.log(
              `Created instanced mesh for ${type} (${geometryId.slice(0, 5)}) with ${geoGroup.positions.length} instances`
            );
          }
        } else if (group.geometries.size === 1) {
          // Eine gemeinsame Geometrie für alle Objekte dieses Typs
          const geometry = group.geometries.values().next().value;
          const refMesh = group.items[0].mesh;

          const instancedMesh = new THREE.InstancedMesh(
            geometry,
            refMesh.material,
            group.items.length
          );

          instancedMesh.name = `instanced_${type}`;

          // Matrix für jede Instanz
          const matrix = new THREE.Matrix4();

          // Setze Positionen für Instanzen
          group.items.forEach((item, i) => {
            matrix.setPosition(item.position);
            instancedMesh.setMatrixAt(i, matrix);
          });

          // Aktualisiere die Matrizen
          instancedMesh.instanceMatrix.needsUpdate = true;

          // Schatten-Eigenschaften setzen
          instancedMesh.castShadow = refMesh.castShadow || true;
          instancedMesh.receiveShadow = refMesh.receiveShadow || false;

          // Zum Container hinzufügen
          this.mergedGeometries.add(instancedMesh);

          console.log(`Created instanced mesh for ${type} with ${group.items.length} instances`);
        }

        // Original-Meshes ausblenden
        group.items.forEach((item) => {
          if (item.mesh) item.mesh.visible = false;
        });
      }
    } catch (error) {
      console.error('Error creating instanced meshes:', error);
    }
  }

  // Aktualisiere die Chunks für Frustum-Culling
  finalizeChunks() {
    // Erstelle Bounding-Boxen für Chunks
    for (const chunkID in this.chunks) {
      const chunk = this.chunks[chunkID];

      // Berechne Bounding-Box für diesen Chunk
      const boundingBox = new THREE.Box3();

      // Füge alle Tile-Container zu dieser Bounding-Box hinzu
      chunk.tiles.forEach((tile) => {
        const tileBox = new THREE.Box3().setFromObject(tile.container);
        boundingBox.union(tileBox);
      });

      // Speichere Bounding-Box im Chunk
      chunk.boundingBox = boundingBox;
    }
  }

  // Update-Methode für Wasser-Animation aktualisieren
  update(deltaTime) {
    // Wasser-Animation
    this.waterAnimationTime += deltaTime;

    // Wähle das zusammengeführte Wasser-Mesh
    for (let i = 0; i < this.mergedGeometries.children.length; i++) {
      const mesh = this.mergedGeometries.children[i];
      if (mesh.name.startsWith('water_')) {
        // Aktualisiere UV-Koordinaten für Wasser-Animation
        const uvAttribute = mesh.geometry.getAttribute('uv');

        // Animiere UVs für Wasserbewegung
        for (let j = 0; j < uvAttribute.count; j++) {
          // Aktuelle UV-Koordinaten
          const u = uvAttribute.getX(j);
          const v = uvAttribute.getY(j);

          // Animiere V-Koordinate basierend auf Zeit
          const animatedV = v + Math.sin(this.waterAnimationTime * 2 + u * 5) * 0.002;

          // Aktualisiere UV-Koordinate
          uvAttribute.setXY(j, u, animatedV);
        }

        // Markiere UVs als geändert
        uvAttribute.needsUpdate = true;
      }
    }

    // Alte Wasser-Animation für individuelle Tiles (falls noch aktiv)
    if (this.waterTiles && this.waterTiles.length > 0) {
      for (const waterTile of this.waterTiles) {
        if (
          waterTile.tile &&
          waterTile.tile.meshes &&
          waterTile.tile.meshes.water &&
          waterTile.tile.meshes.water.material.map
        ) {
          const texture = waterTile.tile.meshes.water.material.map;
          // Animiere Wassertextur durch Verschieben der UV-Koordinaten
          texture.offset.y =
            Math.sin(this.waterAnimationTime + waterTile.x * 0.2 + waterTile.y * 0.3) * 0.01;
        }
      }
    }
  }

  // Regenerate the map with a new random type
  regenerate() {
    // Choose a new random map type
    this.currentMapType = this.mapTypes[Math.floor(Math.random() * this.mapTypes.length)];

    // Clear existing map
    while (this.container.children.length > 0) {
      this.container.remove(this.container.children[0]);
    }

    // Generate new map
    this.generate();
  }

  // Add guaranteed spawn points on the edges of the map
  ensureEdgeSpawnPoints() {
    // Calculate how many spawn points to add per edge
    const spawnPointsPerEdge = 3 + Math.floor(Math.random() * 3); // 3-5 spawn points per edge

    // Top edge
    for (let i = 0; i < spawnPointsPerEdge; i++) {
      const x = Math.floor(this.width / (spawnPointsPerEdge + 1)) * (i + 1);
      this.mapData[0][x] = 1; // Walkable stone/ground
      this.mapData[1][x] = 1; // Make sure there's a path inward
    }

    // Bottom edge
    for (let i = 0; i < spawnPointsPerEdge; i++) {
      const x = Math.floor(this.width / (spawnPointsPerEdge + 1)) * (i + 1);
      this.mapData[this.height - 1][x] = 1; // Walkable stone/ground
      this.mapData[this.height - 2][x] = 1; // Make sure there's a path inward
    }

    // Left edge
    for (let i = 0; i < spawnPointsPerEdge; i++) {
      const y = Math.floor(this.height / (spawnPointsPerEdge + 1)) * (i + 1);
      this.mapData[y][0] = 1; // Walkable stone/ground
      this.mapData[y][1] = 1; // Make sure there's a path inward
    }

    // Right edge
    for (let i = 0; i < spawnPointsPerEdge; i++) {
      const y = Math.floor(this.height / (spawnPointsPerEdge + 1)) * (i + 1);
      this.mapData[y][this.width - 1] = 1; // Walkable stone/ground
      this.mapData[y][this.width - 2] = 1; // Make sure there's a path inward
    }
  }

  // Ensure that there's a path from spawn points to the center
  ensurePathsToCenter() {
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);

    // Get all walkable spawn points (edge points that are already stone)
    const potentialSpawnPoints = [];

    // Check perimeter for walkable points
    for (let x = 0; x < this.width; x++) {
      if (this.mapData[0][x] === 1) {
        potentialSpawnPoints.push({ x, y: 0 });
      }
      if (this.mapData[this.height - 1][x] === 1) {
        potentialSpawnPoints.push({ x, y: this.height - 1 });
      }
    }

    for (let y = 0; y < this.height; y++) {
      if (this.mapData[y][0] === 1) {
        potentialSpawnPoints.push({ x: 0, y });
      }
      if (this.mapData[y][this.width - 1] === 1) {
        potentialSpawnPoints.push({ x: this.width - 1, y });
      }
    }

    // No potential spawn points found, so no paths to create
    if (potentialSpawnPoints.length === 0) {
      return;
    }

    // Function to check if a point has a path to center
    const hasPathToCenter = (startX, startY) => {
      const visited = Array(this.height)
        .fill()
        .map(() => Array(this.width).fill(false));
      const queue = [{ x: startX, y: startY }];
      visited[startY][startX] = true;

      while (queue.length > 0) {
        const { x, y } = queue.shift();

        // Check if we reached near the center
        if (Math.abs(x - centerX) <= 1 && Math.abs(y - centerY) <= 1) {
          return true;
        }

        // Check all 4 directions
        const directions = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 },
        ];

        for (const dir of directions) {
          const newX = x + dir.dx;
          const newY = y + dir.dy;

          // Check bounds
          if (newX < 0 || newX >= this.width || newY < 0 || newY >= this.height) {
            continue;
          }

          // Check if walkable and not visited
          if (this.mapData[newY][newX] === 1 && !visited[newY][newX]) {
            visited[newY][newX] = true;
            queue.push({ x: newX, y: newY });
          }
        }
      }

      return false;
    };

    // For each potential spawn point, ensure a path to center
    for (const spawnPoint of potentialSpawnPoints) {
      if (!hasPathToCenter(spawnPoint.x, spawnPoint.y)) {
        // Need to create a path
        this.createPathToCenter(spawnPoint.x, spawnPoint.y);
      }
    }
  }

  // Create a path from a point to the center of the map
  createPathToCenter(startX, startY) {
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);

    // console.log(`Creating path from (${startX}, ${startY}) to center`);

    // Simple A* pathfinding
    // We'll use a greedy approach for simplicity
    let currentX = startX;
    let currentY = startY;

    // Counter to prevent infinite loops
    let steps = 0;
    const maxSteps = this.width + this.height;

    while (
      (Math.abs(currentX - centerX) > 1 || Math.abs(currentY - centerY) > 1) &&
      steps < maxSteps
    ) {
      steps++;

      // Calculate which direction gets us closer to the center
      const distanceX = centerX - currentX;
      const distanceY = centerY - currentY;

      // Choose whether to move on X or Y axis
      if (Math.abs(distanceX) > Math.abs(distanceY)) {
        // Move along X axis
        currentX += Math.sign(distanceX);
      } else {
        // Move along Y axis
        currentY += Math.sign(distanceY);
      }

      // Make sure we're within bounds
      currentX = Math.max(0, Math.min(currentX, this.width - 1));
      currentY = Math.max(0, Math.min(currentY, this.height - 1));

      // Set this point as walkable path (Tile-Typ 4)
      if (this.mapData[currentY][currentX] !== 1 && this.mapData[currentY][currentX] !== 4) {
        this.mapData[currentY][currentX] = 4; // Pfad/Weg
      }
    }

    if (steps >= maxSteps) {
      // console.warn("Path creation reached maximum steps");
    } else {
      // console.log(`Created path in ${steps} steps`);
    }
  }

  // Füge zusätzliche Geometrie an Kachelgrenzen hinzu, um schwarze Lücken zu vermeiden
  addTileSeams() {
    // Erstelle ein Material für die unsichtbaren Nahtflächen
    const seamMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false, // Verhindert Z-Fighting mit den eigentlichen Kacheln
    });

    // Erstelle horizontale und vertikale Nahtflächen
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const currentTileType = this.mapData[y][x];

        // Rechter Nachbar
        if (x < this.width - 1) {
          const rightNeighborType = this.mapData[y][x + 1];

          // Wenn verschiedene Tile-Typen nebeneinander liegen, füge eine Naht ein
          if (currentTileType !== rightNeighborType) {
            const seamGeometry = new THREE.PlaneGeometry(0.05, 1.05);
            seamGeometry.rotateX(-Math.PI / 2);

            const seam = new THREE.Mesh(seamGeometry, seamMaterial);
            seam.position.set(
              (x + 1) * this.tileSize,
              -0.01, // Leicht unter den Kacheln
              y * this.tileSize + this.tileSize / 2
            );

            this.container.add(seam);
          }
        }

        // Unterer Nachbar
        if (y < this.height - 1) {
          const bottomNeighborType = this.mapData[y + 1][x];

          // Wenn verschiedene Tile-Typen übereinander liegen, füge eine Naht ein
          if (currentTileType !== bottomNeighborType) {
            const seamGeometry = new THREE.PlaneGeometry(1.05, 0.05);
            seamGeometry.rotateX(-Math.PI / 2);

            const seam = new THREE.Mesh(seamGeometry, seamMaterial);
            seam.position.set(
              x * this.tileSize + this.tileSize / 2,
              -0.01, // Leicht unter den Kacheln
              (y + 1) * this.tileSize
            );

            this.container.add(seam);
          }
        }
      }
    }
  }

  // Eine zusätzliche Wasserebene unter der gesamten Karte hinzufügen
  addWaterGround() {
    const waterGroundGeometry = new THREE.PlaneGeometry(
      this.width * this.tileSize + 2,
      this.height * this.tileSize + 2
    );
    waterGroundGeometry.rotateX(-Math.PI / 2);

    const waterGroundMaterial = new THREE.MeshStandardMaterial({
      map: this.assetLoader.getTexture('ground'),
      color: 0x3498db, // Blauer Farbton für Unterwassergrund
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: true,
    });

    const waterGround = new THREE.Mesh(waterGroundGeometry, waterGroundMaterial);
    waterGround.position.set(
      (this.width * this.tileSize) / 2,
      -0.1, // Unter allen anderen Tiles
      (this.height * this.tileSize) / 2
    );
    waterGround.renderOrder = -1; // Zuerst rendern (unter allem anderen)
    waterGround.frustumCulled = false; // Nie ausblenden
    waterGround.receiveShadow = true; // Schatten empfangen

    // Wiederhole die Textur mehrfach über den Boden
    if (waterGroundMaterial.map) {
      waterGroundMaterial.map.repeat.set(this.width, this.height);
      waterGroundMaterial.map.wrapS = THREE.RepeatWrapping;
      waterGroundMaterial.map.wrapT = THREE.RepeatWrapping;
      waterGroundMaterial.map.needsUpdate = true;
    }

    this.container.add(waterGround);
  }

  getTileAt(worldX, worldZ) {
    // Convert world coordinates to grid coordinates
    const offsetX = this.container.position.x;
    const offsetZ = this.container.position.z;

    const gridX = Math.floor((worldX - offsetX) / this.tileSize);
    const gridZ = Math.floor((worldZ - offsetZ) / this.tileSize);

    if (gridX >= 0 && gridX < this.width && gridZ >= 0 && gridZ < this.height) {
      return this.tiles[gridZ][gridX];
    }

    return null;
  }

  isTileWalkable(worldX, worldZ) {
    // Konvertiere Weltkoordinaten zu Gitterkoordinaten
    const gridX = Math.floor((worldX - this.container.position.x) / this.tileSize);
    const gridZ = Math.floor((worldZ - this.container.position.z) / this.tileSize);

    // Prüfe, ob außerhalb der Grenzen
    if (gridX < 0 || gridX >= this.width || gridZ < 0 || gridZ >= this.height) {
      return false;
    }

    // Prüfe NavigationGrid
    if (
      !this.navigationGrid ||
      !this.navigationGrid[gridZ] ||
      typeof this.navigationGrid[gridZ][gridX] !== 'number'
    ) {
      // console.error(`Navigation grid inconsistency at (${gridX}, ${gridZ})!`);
      return false;
    }

    // 1 als begehbar, 0 als nicht begehbar, 2 als Puffer (begehbar, aber vermieden)
    const isWalkable = this.navigationGrid[gridZ][gridX] > 0;

    // Debugge während der Suche nach Spawn-Punkten
    if (worldX % 5 === 0 && worldZ % 5 === 0) {
      // console.log(`Checking walkable at world(${worldX.toFixed(1)}, ${worldZ.toFixed(1)}) -> grid(${gridX}, ${gridZ}): ${isWalkable ? 'WALKABLE' : 'NOT WALKABLE'}`);
    }

    return isWalkable;
  }

  generateNavigationGrid() {
    // Initialize everything as walkable
    this.navigationGrid = Array(this.height)
      .fill()
      .map(() => Array(this.width).fill(1));

    // First pass: mark non-walkable tiles directly
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Mark non-walkable tiles
        if (this.mapData[y][x] === 0 || this.mapData[y][x] === 2 || this.mapData[y][x] === 3) {
          this.navigationGrid[y][x] = 0; // Not walkable
        }
        // Pfade (Typ 4) sind begehbar und werden bevorzugt
        else if (this.mapData[y][x] === 4) {
          this.navigationGrid[y][x] = 3; // Pfade haben eine höhere Gewichtung (bevorzugt)
        }
      }
    }

    // Second pass: create safety border around water (tile type 0)
    // This will prevent zombies from walking too close to water's edge
    const safetyGrid = JSON.parse(JSON.stringify(this.navigationGrid)); // Clone the grid

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // If this is water, create a small buffer zone around it that's harder to walk on
        if (this.mapData[y][x] === 0) {
          // Water
          // Check adjacent tiles and mark them as buffer zone
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              // Skip the center tile (the water itself)
              if (dx === 0 && dy === 0) continue;

              const nx = x + dx;
              const ny = y + dy;

              // Check bounds
              if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                // If the adjacent tile is walkable, make it a buffer zone
                if (this.navigationGrid[ny][nx] === 1) {
                  safetyGrid[ny][nx] = 2; // 2 = Buffer zone, still technically walkable
                }
              }
            }
          }
        }
      }
    }

    // Apply buffer zones to navigation grid
    // We don't mark buffer zones as completely unwalkable,
    // but the zombie AI can use this to avoid water edges
    this.navigationGrid = safetyGrid;
  }

  // Merged Geometrien für bessere Performance
  mergeGeometriesByType() {
    try {
      console.log('Merging geometries by type for better performance...');

      // Kategorien für verschiedene Tile-Typen
      const batches = {
        water: [], // Wasser (transparent, muss separat gerendert werden)
        land: [], // Gras/Land
        road: [], // Straßen
        building: [], // Gebäude
        sand: [], // Sand/Strand
        bridge: [], // Brücken
        wall: [], // Wände/Barrieren
        special: [], // Spezielle Objekte (Bäume, Lampen, etc.)
        other: [], // Sonstige Objekte
      };

      // Sammle Geometrien von allen Tiles
      this.collectGeometriesForBatching(batches);

      // Erstelle zusammengeführte Geometrien nach Typ
      this.createMergedGeometries(batches);

      console.log('Geometry merging complete');
    } catch (error) {
      console.error('Error merging geometries:', error);
    }
  }

  // Hilfsmethode zur Diagnose der Karte für Debugging
  debugMap() {
    // console.log("Map Debug Information:");
    // console.log(`- Dimensions: ${this.width}x${this.height}`);
    // console.log(`- Chunk Size: ${this.chunkSize}`);
    // console.log(`- Tile Size: ${this.tileSize}`);
    // console.log(`- Chunks: ${Object.keys(this.chunks).length}`);
    // console.log(`- Total Tiles: ${this.tiles.flat().filter(Boolean).length}`);

    // Navigation grid stats
    if (this.navigationGrid) {
      let walkableTiles = 0;
      let unwalkableTiles = 0;
      let bufferTiles = 0;

      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (this.navigationGrid[y][x] === 1) {
            walkableTiles++;
          } else if (this.navigationGrid[y][x] === 0) {
            unwalkableTiles++;
          } else if (this.navigationGrid[y][x] === 2) {
            bufferTiles++;
          }
        }
      }

      // console.log(`- Navigation Grid: ${walkableTiles} walkable, ${unwalkableTiles} unwalkable, ${bufferTiles} buffer tiles`);
    } else {
      // console.error("Navigation grid not initialized!");
    }

    // Check consistency between tiles and navigation grid
    this.checkConsistency();
  }

  checkConsistency() {
    let inconsistencies = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        if (!tile || !this.navigationGrid) continue;

        // Water should be unwalkable (0), land should be walkable (1)
        if (tile.tileType === 'water' && this.navigationGrid[y][x] !== 0) {
          // console.warn(`Inconsistency at (${x},${y}): Tile type ${tile.tileType} but navigation value ${this.navigationGrid[y][x]}`);
          inconsistencies++;
        } else if (
          tile.tileType !== 'water' &&
          tile.tileType !== 'wall' &&
          tile.isWalkable &&
          this.navigationGrid[y][x] === 0
        ) {
          // console.warn(`Inconsistency at (${x},${y}): Tile type ${tile.tileType} (walkable) but navigation value 0 (unwalkable)`);
          inconsistencies++;
        }
      }
    }

    if (inconsistencies > 0) {
      // console.error(`Found ${inconsistencies} inconsistencies between tiles and navigation grid!`);
    } else {
      // console.log("Map data is consistent!");
    }
  }

  // Optimiert die Sichtbarkeit von Tiles basierend auf Kamerafrustum und Spielerposition
  optimizeVisibility(frustum, playerPosition, viewDistance) {
    // Viewdistance im Quadrat für schnellere Entfernungsprüfung
    const viewDistanceSquared = viewDistance * viewDistance;

    // Speichere aktuelle aktive Chunks für schnellere Iteration
    this.activeChunks.clear();

    // Bestimme die Chunk-Koordinaten des Spielers
    const playerChunkX = Math.floor(
      (playerPosition.x - this.container.position.x) / (this.tileSize * this.chunkSize)
    );
    const playerChunkZ = Math.floor(
      (playerPosition.z - this.container.position.z) / (this.tileSize * this.chunkSize)
    );

    // Anzahl der Chunks zu prüfen in jede Richtung, basierend auf Sichtweite
    const chunksToCheck = Math.ceil(viewDistance / (this.tileSize * this.chunkSize)) + 1;

    // Iteriere über Chunks in der Nähe des Spielers
    for (
      let chunkZ = playerChunkZ - chunksToCheck;
      chunkZ <= playerChunkZ + chunksToCheck;
      chunkZ++
    ) {
      for (
        let chunkX = playerChunkX - chunksToCheck;
        chunkX <= playerChunkX + chunksToCheck;
        chunkX++
      ) {
        // Überspringe ungültige Chunks
        if (
          chunkX < 0 ||
          chunkX >= this.chunkCount.x ||
          chunkZ < 0 ||
          chunkZ >= this.chunkCount.z
        ) {
          continue;
        }

        const chunkID = `${chunkX},${chunkZ}`;
        const chunk = this.chunks[chunkID];

        if (!chunk) continue;

        // Prüfe, ob der Chunk innerhalb der Sichtweite liegt
        // Dies ist eine grobe Prüfung, bevor wir ins Detail gehen
        const chunkCenterX =
          (chunkX * this.chunkSize + this.chunkSize / 2) * this.tileSize +
          this.container.position.x;
        const chunkCenterZ =
          (chunkZ * this.chunkSize + this.chunkSize / 2) * this.tileSize +
          this.container.position.z;

        const distanceToChunkSquared =
          Math.pow(playerPosition.x - chunkCenterX, 2) +
          Math.pow(playerPosition.z - chunkCenterZ, 2);

        // Wenn der Chunk komplett außerhalb der Sichtweite ist, überspringe ihn
        if (distanceToChunkSquared > viewDistanceSquared * 1.5) {
          // Setze alle Tiles in diesem Chunk auf unsichtbar
          this.setChunkVisibility(chunk, false);
          continue;
        }

        // Füge diesen Chunk zur Liste der aktiven Chunks hinzu
        this.activeChunks.add(chunkID);

        // Überprüfe, ob der Chunk im Frustum liegt
        // Wir verwenden die Bounding-Box des Chunks
        const chunkIsInFrustum = frustum.intersectsBox(chunk.boundingBox);

        if (!chunkIsInFrustum) {
          // Setze alle Tiles in diesem Chunk auf unsichtbar
          this.setChunkVisibility(chunk, false);
          continue;
        }

        // Der Chunk ist prinzipiell sichtbar, überprüfe einzelne Tiles
        this.processTilesInChunk(chunk, playerPosition, viewDistanceSquared);
      }
    }
  }

  // Setzt die Sichtbarkeit eines Chunks und seiner Tiles
  setChunkVisibility(chunk, isVisible) {
    chunk.tiles.forEach((tile) => {
      tile.container.visible = isVisible;
    });
  }

  // Verarbeitet die Sichtbarkeit einzelner Tiles innerhalb eines Chunks
  processTilesInChunk(chunk, playerPosition, viewDistanceSquared) {
    chunk.tiles.forEach((tile) => {
      const tileWorldPos = new THREE.Vector3();
      tile.container.getWorldPosition(tileWorldPos);

      // Distanz zum Spieler berechnen
      const distanceSquared =
        Math.pow(playerPosition.x - tileWorldPos.x, 2) +
        Math.pow(playerPosition.z - tileWorldPos.z, 2);

      // Sichtbarkeit basierend auf Entfernung setzen
      const isVisible = distanceSquared <= viewDistanceSquared;

      // Spezialfall für Wasser: Wasser in der Nähe des Spielers immer anzeigen
      // für bessere Wassereffekte und Animation
      if (tile.tileType === 0 && distanceSquared <= viewDistanceSquared * 0.7) {
        tile.container.visible = true;
      } else {
        tile.container.visible = isVisible;
      }
    });
  }

  // Erstellt Bounding-Boxen für alle Chunks zur Optimierung des Cullings
  createChunkBoundingBoxes() {
    try {
      // Für jeden Chunk eine Bounding Box erstellen
      for (const chunkId in this.chunks) {
        const chunk = this.chunks[chunkId];

        // Erstelle eine neue Bounding Box für diesen Chunk
        const min = new THREE.Vector3(Infinity, Infinity, Infinity);
        const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

        // Berechne die Min/Max-Werte basierend auf Tile-Positionen
        chunk.tiles.forEach((tile) => {
          // Hole die Position des Tiles
          const position = tile.container.position;

          // Aktualisiere Min/Max-Werte
          min.x = Math.min(min.x, position.x);
          min.y = Math.min(min.y, position.y);
          min.z = Math.min(min.z, position.z);

          max.x = Math.max(max.x, position.x + this.tileSize);
          max.y = Math.max(max.y, position.y + 3); // Höhe berücksichtigen (Annahme: max 3 Einheiten)
          max.z = Math.max(max.z, position.z + this.tileSize);
        });

        // Erstelle die Bounding Box
        chunk.boundingBox = new THREE.Box3(min, max);

        // Optional: Erstelle ein visuelles Hilfsmittel für Debugging
        if (this.game.debugMode) {
          const helper = new THREE.Box3Helper(chunk.boundingBox, 0xff0000);
          this.container.add(helper);
          chunk.boundingBoxHelper = helper;
        }
      }

      console.log(`Created bounding boxes for ${Object.keys(this.chunks).length} chunks`);
    } catch (error) {
      console.error('Error creating chunk bounding boxes:', error);
    }
  }
} // Ende der Map-Klasse
