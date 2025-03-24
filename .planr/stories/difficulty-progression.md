# Difficulty Progression

## Story
Implement a comprehensive difficulty progression system that scales the challenge based on player performance, chosen difficulty setting, and current wave number.

## Acceptance Criteria
- [x] Create a DifficultyManager class to centralize difficulty handling
- [x] Implement three base difficulty levels (Easy, Normal, Hard) with appropriate settings
- [x] Add dynamic difficulty adjustment based on player performance
- [x] Scale zombie stats (health, speed, damage) based on difficulty and wave number
- [x] Adjust spawn rates and zombie type distribution based on difficulty
- [x] Add visual indicators for current difficulty level
- [x] Create UI settings for difficulty adjustment
- [x] Balance the game across all difficulty levels

## Implementation Notes
The difficulty progression system should:
- Make initial waves accessible to all players
- Progressively increase challenge as waves advance
- Provide appropriate challenge based on selected difficulty
- Scale enemies intelligently without becoming overwhelming
- Provide visual feedback about the current challenge level

## Developer Notes
Implemented a comprehensive difficulty progression system with the following components:

1. Created a DifficultyManager class that centralizes all difficulty-related settings, including:
   - Base multipliers for each difficulty level (Easy, Normal, Hard)
   - Dynamic difficulty adjustment based on player performance
   - Wave-based difficulty scaling
   - Type-specific zombie adjustments

2. Added player performance tracking:
   - Monitors player damage taken, zombies killed, headshot ratio, and deaths
   - Adjusts difficulty in real-time based on player performance
   - Provides appropriate challenge for varying skill levels

3. Implemented wave-based difficulty progression:
   - Zombies gain more health, damage, and speed as waves progress
   - Special zombie types become more common in later waves
   - Boss waves receive appropriate difficulty adjustments

4. Added visual feedback:
   - Difficulty indicator shows current difficulty level with appropriate color
   - Indicator appears on wave changes and fades when not needed

5. Integrated with existing systems:
   - Connected to ZombieManager for zombie stats and spawning
   - Updated ScoreManager for difficulty-based score multipliers
   - Enhanced damage system to factor in difficulty settings

6. Balanced difficulty levels:
   - Easy: Fewer zombies, less health, slower movement for more casual players
   - Normal: Balanced challenge with moderate progression
   - Hard: More zombies, increased health and damage, more special types

The difficulty system provides an adaptive challenge that scales with both player skill and wave progression, keeping the game engaging for players of all skill levels. 