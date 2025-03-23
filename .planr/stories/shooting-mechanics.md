# Shooting Mechanics

## Description
Implement shooting mechanics with raycasting for the zombie shooter game. This system will handle the physics of bullets, hit detection, and visual effects when firing weapons.

## Requirements
- Implement raycasting from the weapon for accurate hit detection
- Add bullet physics with proper trajectory and speed
- Create hit effects for different surface types (zombies, walls, etc.)
- Add visual feedback when shooting (muzzle flash, recoil)
- Integrate with damage system for zombies
- Ensure proper collision detection with the environment

## Acceptance Criteria
- [x] Bullets follow realistic trajectories based on weapon type
- [x] Shooting uses raycasting for immediate hit detection
- [x] Hit effects appear at the point of impact
- [x] Zombies take damage when hit
- [x] Muzzle flash and weapon recoil occur when firing
- [x] Bullet collision detection with environment objects works correctly
- [x] Performance remains smooth even when firing multiple shots

## Developer Notes
- Starting implementation of shooting mechanics by extending the existing weapon system.
- Enhanced the Weapon class with raycasting for accurate hit detection
- Improved the Bullet class with particle effects, streaking, and realistic motion
- Added weapon-specific spread and recoil mechanics for the Pistol
- Implemented different hit effects based on the surface type (blood for zombies, sparks/smoke for environment)
- Added muzzle flash light and particle effects for visual feedback
- Optimized bullet performance with object pooling and efficient collision detection
- Used raycasting for immediate hit detection while maintaining bullet visual effects
- Added detailed animation and physics for bullet impacts 