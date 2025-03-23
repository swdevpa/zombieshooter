# Add sound effects and basic music

## Description
Implement a comprehensive sound system with weapon sounds, zombie sounds, environmental effects, UI feedback sounds, and background music.

## Acceptance Criteria
- Implement a SoundManager that handles all audio in the game
- Add weapon sounds for shooting, reloading, and empty magazine clicks
- Add zombie sounds for different types (standard, runner, brute, etc.)
- Include ambient environmental sounds for atmosphere
- Add UI feedback sounds (button clicks, notifications)
- Implement background music that can change based on game state
- Include sound effects for player actions (walking, taking damage)
- Implement volume controls for music and sound effects
- Ensure proper audio positioning for 3D spatial sounds
- Optimize audio performance with pooling for common sounds

## Resources
N/A

## Dependencies
- Completed UI system
- Weapon system implementation
- Zombie system implementation

## Developer Notes
Implemented a comprehensive sound system with the following features:

1. **SoundManager Class**:
   - Centralized sound management with volume controls for different categories
   - Sound pooling for commonly used effects to improve performance
   - Spatial audio support using Three.js PositionalAudio
   - Methods for playing/pausing/stopping sounds with various options
   - Fade-in/fade-out effects for smooth transitions
   - Support for different sound categories (music, sfx, ambient, weapon, zombie, player, UI)

2. **AssetLoader Integration**:
   - Added sound loading and caching support to AssetLoader
   - Implemented placeholder sound generation for development
   - Created different audio profiles for different sound types (weapons, ambient, zombies, etc.)

3. **Weapon Sound Effects**:
   - Added gunshot sounds with spatial positioning
   - Implemented multi-phase reload sounds (start, eject, insert, finish)
   - Added empty click sound for weapons without ammo
   - Added bullet impact sounds with material-based variations

4. **Zombie Sound Effects**:
   - Added type-specific sounds for different zombie variants
   - Implemented growl, attack, and death sounds with spatial audio
   - Added special sounds for exploder warning and explosion
   - Added screamer death sound with effects on other zombies

5. **Player Sound Effects**:
   - Added damage and death sounds
   - Implemented footstep system with different surface types
   - Added healing and ammo pickup sounds

6. **UI Sound Effects**:
   - Added button click and hover sounds
   - Implemented menu open/close sounds
   - Added wave announcement and completion sounds
   - Added pause/unpause sound effects

7. **Music and Ambient System**:
   - Added background music that changes based on game state
   - Implemented ambient environmental sounds
   - Created smooth transitions between tracks with fade effects

8. **Performance Optimization**:
   - Implemented sound pooling for frequently used sounds
   - Added distance-based playback for growls and other recurring sounds
   - Optimized spatial audio to control number of concurrent sounds

Overall, the sound system significantly enhances the game's atmosphere and provides valuable feedback to the player through audio cues. 