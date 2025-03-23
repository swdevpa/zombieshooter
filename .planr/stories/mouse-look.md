# User Story: Add mouse-look controls with proper sensitivity

## Description
As a player, I want to control my view direction using the mouse with adjustable sensitivity, so that I can look around the game world in a way that feels comfortable and responsive.

## Acceptance Criteria
- Player can look around using mouse movement
- View direction is smoothly updated based on mouse input
- Mouse sensitivity can be adjusted by the player
- Vertical look angle is properly constrained (can't look too far up or down)
- Horizontal rotation has no limits (360-degree rotation)
- Mouse acceleration is handled properly for consistent aiming feel

## Developer Notes
The implementation of the mouse-look controls has been completed with the following enhancements:

1. **Enhanced Mouse Controls**:
   - Implemented configurable mouse sensitivity with a multiplier system
   - Added optional mouse smoothing for more fluid camera movement
   - Implemented Y-axis inversion option for player preference
   - Improved vertical look angle constraints to prevent camera flipping
   - Extracted mouse-look logic into dedicated methods for better code organization

2. **Settings UI**:
   - Created a comprehensive settings menu for adjusting mouse controls
   - Added sliders for fine-tuning sensitivity and smoothing amount
   - Implemented toggle switches for enabling/disabling features
   - Added keyboard shortcuts (Alt+S) for quick access to settings
   - Ensured settings persist during gameplay sessions

3. **Performance Monitoring**:
   - Added FPS counter with color-coded performance indicators
   - Implemented real-time sensitivity adjustment to test different settings
   - Optimized mouse input handling for smoother performance

4. **Integration with Existing Systems**:
   - Updated the UI manager to support the new settings interface
   - Integrated pause menu with settings access
   - Enhanced the Game class to properly handle the new mouse control system

All acceptance criteria have been met, and players can now customize their mouse controls to suit their preferences, which improves accessibility and gameplay experience. 