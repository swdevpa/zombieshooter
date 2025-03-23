# Implement First-Person Camera Controls

## Description

Implement basic first-person camera controls for the zombie shooter game, including mouse look, WASD movement, and pointer lock functionality to create an immersive FPS experience.

## Acceptance Criteria

- [x] Implement pointer lock functionality with click-to-play overlay
- [x] Mouse movement controls camera view (horizontal and vertical)
- [x] WASD/Arrow keys move the player relative to camera direction
- [x] Camera follows player position at eye level
- [x] Add basic collision detection
- [x] Implement weapon recoil effect
- [x] Add head bobbing while moving
- [x] Camera system properly integrates with player actions (shooting, moving)

## Implementation Details

The first-person camera implementation uses the following components:

1. **Pointer Lock API**: Mouse cursor is locked to the game window for continuous camera control
2. **Camera Hierarchy**:
   - YawObject (horizontal rotation)
     - PitchObject (vertical rotation)
       - Camera
3. **Movement System**:
   - Player movement is relative to camera direction
   - WASD/Arrow keys translate to forward/backward/left/right in camera space
4. **Camera Effects**:
   - Head bobbing while moving
   - Weapon recoil on shooting
5. **Collision Detection**:
   - Simple sphere-based collision detection
   - Prevents walking through objects

## Developer Notes

1. Added collision detection system to Player class using a simple sphere-based approach.
2. Improved player movement code to use camera direction for WASD controls.
3. Implemented camera effects for better immersion:
   - Added head bobbing effect while moving
   - Added recoil effect when shooting
4. Modified the InputManager to work with the first-person camera system, removing redundant code.
5. Updated click-to-play overlay to show controls and provide clear instructions.

The implementation follows standard FPS control schemes with smooth movement and camera handling. The movement system uses acceleration and deceleration for more natural-feeling controls.

## Future Improvements

- Add jump functionality
- Implement sprinting
- Add crouch mechanism
- Improve collision detection with more precise hitboxes
- Add camera effects for damage/low health 