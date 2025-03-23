# User Story: Damage System for Zombies

## Description
As a player, I want zombies to take damage in a realistic and satisfying way, including different effects based on hit location and zombie type, so that combat feels more immersive and strategic.

## Acceptance Criteria
- Zombies should react visibly when taking damage (animations, particle effects)
- Different damage should be applied based on hit location (headshots should do more damage)
- Different zombie types should have appropriate damage resistances/vulnerabilities
- Damage effects should include blood splatter and impact visuals
- Hit markers/indicators should appear for successful hits
- Visual feedback should show approximate remaining health for zombies
- Zombies should have appropriate animations for different damage states
- Critical hits (headshots) should have distinct visual and audio feedback
- Performance optimization for handling many damage events simultaneously

## Technical Notes
- Implement a DamageManager class to centralize damage calculations and effects
- Update the Zombie class to handle taking damage and showing appropriate feedback
- Create a visual hit indicator system for player feedback
- Optimize particle effects for performance
- Ensure damage system works with all current zombie types

## Definition of Done
- All acceptance criteria implemented and functional
- Performance tested with large numbers of zombies
- Integrated with existing shooting mechanics
- Code follows project style and is well documented

## Developer Notes
### Implementation Details
- Created a new DamageManager class to centralize damage calculations, hit detection, and visual effects
- Added specific damage animations for different hit zones in ZombieAnimation class:
  - headshot - Violent head reaction with body follow-through  
  - limb_hit - Limb-specific reaction with randomized left/right variations
  - hit - Standard torso hit reaction
- Enhanced ZombieModel class with damage visualization:
  - Added damage flash effect that temporarily colors the zombie red when hit
  - Implemented a system to show health bars briefly after damage
  - Created smooth transitions between normal and damaged states
- Updated Weapon class to work with the DamageManager:
  - Modified performRaycastShot to detect hit zones and process damage through managers
  - Added fallback systems when DamageManager isn't available
- Added detailed hit zone detection:
  - Based on object name (head, limb, torso)
  - Positional detection as fallback when names aren't clear
- Implemented damage modifiers:
  - Weapon-specific base damage
  - Hit zone multipliers (2.5x for head, 0.7x for limbs)
  - Zombie type resistances (brutes more resistant, exploders more vulnerable)
  - Critical hit chance based on hit zone

### Challenges and Solutions
- Integrating with existing zombie code required careful examination of the class structure
- Visual feedback needed to be both noticeable and not overwhelming - solved by using temporary effects
- Ensuring proper animation transitions was challenging - implemented state management with auto-return
- Performance considerations were important - optimized by centralizing effects and using appropriate culling
- Ensured backward compatibility by providing fallback methods when DamageManager isn't available 