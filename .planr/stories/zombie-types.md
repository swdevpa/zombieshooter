# Add different zombie types with varied behaviors

## Description
Enhance the zombie system by implementing and expanding different zombie types with varied behaviors, appearances, and abilities to provide a more dynamic and challenging gameplay experience.

## Acceptance Criteria
- [x] Improve the existing zombie types (standard, runner, brute) with more unique visual characteristics
- [x] Implement an Exploder zombie type that explodes on death, damaging nearby entities
- [x] Implement an Acid Spitter zombie type that can attack from a distance
- [x] Implement a Screamer zombie type that can alert other zombies in a radius
- [x] Each zombie type should have unique animation behaviors appropriate to their type
- [x] Each zombie type should have appropriate sound effects
- [x] New zombie types should be properly integrated into the wave progression system
- [x] Visual indicators for special zombie types should be clear to player
- [x] Balance the spawn rates and difficulty progression for different zombie types

## Technical Notes
- Extend the ZombieFactory class to support new zombie types
- Create new model classes for each new zombie type
- Implement specialized attack behaviors in the Zombie class
- Add special abilities like acid projectiles and explosion effects
- Update the ZombieManager to handle new zombie types in wave progression

## Developer Notes
Implemented three new zombie types with unique abilities and behaviors:

1. **Exploder Zombie**:
   - Designed with a bloated, unstable appearance featuring glowing green bulges
   - Explodes on death, dealing damage in a radius to the player and other zombies
   - Visual explosion effect with expanding sphere and shockwave ring
   - Balanced with lower health than standard zombies

2. **Acid Spitter Zombie**:
   - Distinctive elongated neck and acid sacs on head/throat
   - Attacks from distance by spitting acid projectiles
   - Acid pools remain on the ground, causing damage over time
   - Prefers to maintain distance from player for optimal attacks

3. **Screamer Zombie**:
   - Designed with enlarged head, wide mouth, and emaciated body
   - Can emit a scream that alerts nearby zombies to player's position
   - Scream creates a visual indicator and temporarily increases other zombies' speed
   - Balanced with lower health and damage compared to standard zombies

All zombie types were integrated into the ZombieFactory and wave progression system with balanced spawn rates. Earlier waves feature mostly standard zombies, with special types gradually introduced as waves progress. Boss waves now feature specialized distributions of zombie types.

Special abilities:
- Implemented projectile system for acid spit with trail effects and splash damage
- Added explosion damage system with radius-based falloff
- Created scream ability that affects other zombies' behavior
- Added visual effects for all special abilities

Animation and effects:
- Each zombie type has unique animations (spitting, screaming, etc.)
- Visual indicators clearly signal special abilities to players
- Special zombies are immediately identifiable by their distinctive appearances 