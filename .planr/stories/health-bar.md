# Health Bar UI Implementation

## Story ID
health-bar

## Description
Create a visually appealing and informative health bar UI that displays the player's current health status prominently at the bottom left of the screen.

## Acceptance Criteria
- Health bar should be clearly visible at the bottom left of the screen
- Health should be represented visually with a colored bar
- Health value should be displayed as text
- Bar color should change based on health level (green for high, yellow for medium, red for low)
- Visual feedback when taking damage
- Visual feedback when healing
- Special effects for critical health levels

## Implementation Notes
- Use CSS for styling and animations
- Ensure health bar is responsive to different screen sizes
- Create a heart icon to represent health
- Add screen shake effect when taking damage
- Add pulsing effect for critical health

## Tasks
- [x] Create basic health bar HTML/CSS structure
- [x] Add heart icon with animations
- [x] Implement dynamic color changes based on health percentage
- [x] Add damage feedback animations
- [x] Add healing feedback animations
- [x] Add critical health state effects
- [x] Connect UI to player health system

## Dependencies
- Player class with health tracking
- UI/UiManager system

## Developer Notes
Implemented a comprehensive health bar UI with the following features:

1. **Heart Icon**: Added a heart icon using CSS clip-path to create a heart shape that pulses slowly when health is normal and rapidly when critical.

2. **Dynamic Health Bar**: 
   - Health bar width updates based on current/max health percentage
   - Color changes based on health level:
     - Green (>60%)
     - Yellow (30-60%)
     - Red (<30%)
   - Health value displayed as text that also changes color when critical

3. **Visual Feedback Effects**:
   - Damage: Screen shake effect and heart icon pulse
   - Healing: Brightness increase on the health bar
   - Critical Health: Pulsing animation on the heart icon and red text

4. **Centralized Health Management**:
   - Player -> UiManager -> UI communication flow
   - Player's takeDamage() method updates UI via UiManager
   - Comparison with previous health value to determine if damage was taken or health was gained

The health bar implementation enhances player awareness of their current status and provides immediate visual feedback on game events, improving overall user experience. 