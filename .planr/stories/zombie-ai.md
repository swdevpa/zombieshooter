# Story: Implement basic zombie AI with pathfinding

## Goals

- Implement a robust AI system for zombies that uses pathfinding to navigate through the city
- Ensure zombies can navigate around obstacles and buildings to reach the player
- Implement different AI behaviors based on zombie types (standard, runner, brute)
- Optimize pathfinding for performance with many zombies

## Acceptance Criteria

- Zombies should use A* or similar pathfinding algorithm to navigate through the city
- Zombies should be able to detect and avoid obstacles while pursuing the player
- Different zombie types should have distinct movement behaviors:
  - Standard zombies: Normal speed, direct approach
  - Runner zombies: Faster speed, may use flanking maneuvers
  - Brute zombies: Slower, may break through obstacles/barricades
- Pathfinding calculations should be optimized for performance
- Zombies should recalculate paths periodically or when blocked
- Include debug visualization options for pathfinding

## Technical Details

- Implement or optimize the existing A* pathfinding algorithm in the Zombie class
- Create a navigation grid that represents walkable areas in the city
- Update collision detection to handle zombie-environment interactions
- Implement throttling for pathfinding updates (not all zombies need full updates each frame)
- Add debug visualization options for paths and target positions

## Developer Notes

Implemented a comprehensive zombie AI pathfinding system with the following features:

1. Created a new NavigationGrid class that:
   - Generates a walkable grid based on city layout
   - Marks buildings, obstacles, and level boundaries as non-walkable
   - Implements A* pathfinding algorithm for optimal path finding
   - Includes buffer zones around obstacles to prevent zombies from getting too close
   - Provides debug visualization for the navigation grid

2. Enhanced the Zombie class with:
   - Type-specific behaviors for standard, runner, and brute zombies
   - Flanking movement for runner zombies that attack from angles
   - Obstacle-breaking abilities for brute zombies
   - Different movement speeds and turning speeds for each zombie type
   - Improved collision response with sliding along obstacles
   - Better path visualization for debugging

3. Updated the ZombieManager to:
   - Validate spawn points using the navigation grid
   - Ensure zombies only spawn in valid locations with paths to the player
   - Optimize zombie spawning with type-specific behaviors

4. Added debug options that can be toggled with Alt+P to visualize:
   - The navigation grid showing walkable and non-walkable areas
   - Individual zombie paths with different colors for each zombie type
   - Current path points and target positions

5. Performance optimizations:
   - Implemented path simplification to reduce unnecessary waypoints
   - Added throttling for pathfinding calculations
   - Zombies only recalculate paths periodically or when stuck
   - Created stuck detection to help zombies find alternative paths

This implementation creates more intelligent and engaging zombie behavior with zombies that can navigate around obstacles, use flanking maneuvers, and display type-specific behaviors, making the gameplay more dynamic and challenging. 