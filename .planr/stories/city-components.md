# Story: Design modular city components (streets, buildings, etc.)

## Description
Create a modular system for the city environment that includes streets, sidewalks, street props (lampposts, traffic lights, etc.), rubble, and other urban features. This will enhance the apocalyptic atmosphere and provide a more immersive environment for the game.

## Acceptance Criteria
- Implement sidewalks adjacent to roads
- Add street props (lampposts, traffic lights, fire hydrants, etc.)
- Create rubble and debris piles to reflect the apocalyptic setting
- Design abandoned vehicles (cars, buses, etc.) for street decoration
- Ensure all components are properly optimized with instancing where appropriate
- Implement proper collision detection for all new components
- Make components reusable and configurable

## Technical Approach
1. Create a CityComponents class to manage all modular components
2. Implement component factories for each type of city element
3. Use THREE.InstancedMesh for repetitive elements
4. Ensure components can be placed procedurally
5. Add collision data for player movement
6. Implement proper LOD (Level of Detail) for distant components

## Developer Notes
Implemented a comprehensive CityComponents class that manages the creation and rendering of modular city elements:

- Created sidewalks alongside all streets with proper positioning and scale
- Implemented street props including lampposts, traffic lights, and fire hydrants using THREE.InstancedMesh for performance optimization
- Added randomly placed debris piles throughout the city to enhance the apocalyptic atmosphere
- Created abandoned vehicles (cars and buses) placed on streets with proper orientation and collision detection
- Integrated collision detection for all components with the player movement system
- Implemented a density control system to adjust the number of props and optimize performance
- Used Matrix4 transformations for efficient instance placement with randomization for variation
- Added integration with the City class and updated the Player class to check for collisions with city components 