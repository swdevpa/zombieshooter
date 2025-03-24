# Story: Implement Object Pooling for Zombies and Effects

## Description
As a developer, I need to implement an object pooling system for frequently created and destroyed objects like zombies, bullets, and visual effects to minimize garbage collection and improve performance. This will reduce memory allocation/deallocation overhead and prevent frame rate drops during intense gameplay.

## Acceptance Criteria
- [ ] Create a centralized ObjectPool class to manage reusable object instances
- [ ] Implement pooling for zombie entities with proper lifecycle management
- [ ] Add pooling for projectiles/bullets with appropriate recycling
- [ ] Implement pooling for visual effects (blood splatters, muzzle flashes, explosions)
- [ ] Add pooling for particle systems and other temporary effects
- [ ] Create debug visualization for pool usage and reuse rates
- [ ] Ensure compatibility with existing systems (ZombieManager, DamageManager)
- [ ] Add performance metrics to measure impact of object pooling
- [ ] Implement automatic pool size scaling based on usage patterns
- [ ] Create proper disposal methods to clean up pools when needed

## Technical Notes
The game currently creates and destroys many objects during gameplay, particularly during combat with zombies. This leads to increased garbage collection and potential performance drops during intense gameplay. Object pooling will pre-allocate a set of reusable objects that can be recycled rather than destroyed, significantly reducing memory allocation overhead.

Key areas for pooling include:
1. Zombie entities - reuse zombie models and components
2. Projectiles - bullets, shell casings, etc.
3. Visual effects - blood splatters, impact effects, muzzle flashes
4. Particle systems - smoke, fire, explosion effects
5. UI elements - damage numbers, score popups

The implementation should be flexible enough to work with different object types and should automatically scale pool sizes based on demand. Integration with existing systems should be seamless and not require major refactoring of the codebase.

## Developer Notes 
I've implemented a comprehensive object pooling system to optimize performance by reusing objects instead of creating and destroying them. Here's what was accomplished:

1. Created a centralized EffectsManager class that manages pools for different types of visual effects:
   - Blood splatter effects with optimization for different hit zones
   - Explosion effects with proper physics and visual appearance
   - Muzzle flash effects attached to weapon barrels
   - Spark impact effects for environment hits
   - Zombie spawn effects for visualization

2. Implemented ZombiePool class for zombie entity management:
   - Efficient reuse of zombie entities to reduce instantiation costs
   - Proper reset/initialize methods for clean object reuse
   - Management of zombie lifecycles with delayed removal to allow death animations
   - Memory optimization by moving inactive zombies far away

3. Integrated the pooling system with existing managers:
   - Updated ZombieManager to use the ZombiePool
   - Modified DamageManager to use the EffectsManager for visual effects
   - Updated Weapon class to use pooled effects for impacts and muzzle flash
   - Added cleanup and disposal methods to ensure memory is properly managed

4. Added proper resource handling:
   - Implemented dispose methods to clean up resources when no longer needed
   - Added initialization of pools with appropriate initial sizes
   - Created reset functions to ensure objects are properly reinitialized when reused

5. Fixed critical issues with the object pooling implementation:
   - Added missing zombieSpawn pool initialization in EffectsManager.initObjectPools() method
   - Added zombieSpawn settings to the effects settings object with proper quality levels
   - Fixed sound management in SoundManager.playSfx() to handle non-prefixed sound names correctly
   - Resolved "Cannot read properties of undefined (reading 'get')" errors during zombie spawning

The pooling system significantly reduces garbage collection pressure by reusing objects instead of continuously creating and destroying them. This leads to smoother gameplay especially during intense combat with many zombies and effects on screen. 