# Rendering Loop with Performance Monitoring

## Description
Optimize the game's rendering loop and implement performance monitoring tools to ensure the game runs smoothly across different hardware configurations.

## Acceptance Criteria
- [ ] Implement detailed FPS monitoring with min/max/average values
- [ ] Add frame time tracking to identify performance bottlenecks
- [ ] Implement View Frustum Culling to only render objects in the camera's view
- [ ] Create a performance overlay with real-time statistics
- [ ] Implement object pooling for frequently created/destroyed objects
- [ ] Add frame limiting options to balance performance and quality
- [ ] Optimize the render loop timing to handle varying frame rates
- [ ] Include memory usage monitoring

## Implementation Notes
The rendering loop optimization should:
- Maintain consistent frame rates across different hardware
- Only render objects visible to the player (View Frustum Culling)
- Provide detailed performance metrics to identify bottlenecks
- Balance quality and performance with configurable settings
- Handle variable deltaTime for physics and animations

## Developer Notes
- Start with implementing detailed FPS monitoring
- Add View Frustum Culling as it's the most effective optimization for 3D scenes
- Create a toggleable performance overlay
- Implement object pooling for bullets and effects 