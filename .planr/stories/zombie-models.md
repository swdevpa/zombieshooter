# Story: Design zombie character models and animations

## Description
Create detailed zombie character models with a variety of appearances and a comprehensive animation system. The zombies should have an unsettling, undead appearance suitable for an apocalyptic setting. The models should support different detail levels for performance optimization.

## Acceptance Criteria
- Design at least 3 different zombie types with unique visual characteristics
- Implement a detailed base zombie model with proper proportions and textures
- Create realistic walking, attacking, damage, and death animations
- Implement a Level of Detail (LOD) system with 3 detail levels for performance
- Ensure animations are smooth and properly aligned with zombie behavior
- Support randomization of zombie appearance for variety
- Ensure zombie models align with the game's art style
- All models should work with the existing zombie AI and physics

## Technical Considerations
- Use Three.js geometry and materials to create zombie models
- Implement skeletal animations for realistic movement
- Create texture atlas for zombie models to optimize rendering
- Ensure LOD system integrates with the existing performance optimization pipeline
- Animation system should be performance-efficient and support multiple simultaneous animations

## Developer Notes 
Implemented a comprehensive zombie model system with three distinct zombie types:

1. **Standard Zombie Model**:
   - Balanced health, speed, and damage
   - Medium proportions with slight hunching
   - Four appearance variations including casual, business, medical, and utility workers
   - Full LOD support with high, medium, and low detail models

2. **Runner Zombie Model**:
   - Faster speed, lower health, standard damage
   - Thinner proportions with aggressive posture
   - Four appearance variations including athletic wear, hoodie, joggers, and track athletes
   - Faster animation speeds for more aggressive movement

3. **Brute Zombie Model**:
   - Higher health, higher damage, slower speed
   - Larger, bulkier proportions with intimidating stance
   - Four appearance variations including security guard, football player, construction worker, and military
   - Higher positioned health bar due to increased height

Added a **ZombieFactory** class that:
- Creates and initializes zombies of different types
- Provides dynamic zombie type selection based on wave number
- Returns appropriate properties for each zombie type
- Implements a caching system to reuse models with the same parameters

Created a **ZombieTextureAtlas** for:
- Procedurally generating textures for zombie bodies and faces
- Supporting multiple zombie types with unique coloration and details
- Adding realistic decay effects, wounds, and blood splatters
- Caching textures for performance optimization

Enhanced the **Zombie** class to:
- Support different zombie types via factory creation
- Adjust properties (health, speed, damage) based on type
- Coordinate animations with current zombie state (walking, attacking, damaged)

Updated the **ZombieManager** to:
- Register procedurally generated textures with the asset loader
- Determine appropriate zombie types for each wave
- Provide performance optimization for distant zombies through frustum culling
- Track and manage wave completion

Implemented a frustum culling system in the Game class to optimize zombie rendering by:
- Only fully updating zombies within the player's view frustum
- Using simplified updates for distant zombies
- Tracking zombies that need detailed animations vs. those that can use simplified movement 