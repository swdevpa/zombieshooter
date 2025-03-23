# Story: Implement Ammo Management

**ID:** ammo-management

## Description
Implement a comprehensive ammo management system that expands upon the existing weapon system. This feature will add reserve ammo, different ammo types, and pickup mechanics to enhance gameplay.

## Acceptance Criteria
- [x] Each weapon should track both magazine ammo (currentAmmo) and reserve ammo (reserveAmmo)
- [x] Add reserveAmmo property to the Weapon class with appropriate maximum limits
- [x] Update reload mechanics to consume reserve ammo when reloading
- [x] Display reserve ammo in the UI next to the current magazine ammo
- [x] Prevent reloading when reserve ammo is empty
- [x] Add ammo pickup functionality in the game world
- [x] Ensure the UI properly reflects all ammo states (magazine, reserve, reloading)
- [x] Add visual and audio feedback for low ammo, empty magazine, and empty reserves

## Technical Implementation Notes
- Extend the Weapon class to include reserveAmmo property and related logic
- Modify the reload system to consume reserve ammo
- Update the UI to display both current and reserve ammo
- Create ammo pickup entities and collision detection
- Implement reserve ammo limits based on weapon type

## Developer Notes
- Implementing a flexible ammo management system with magazine and reserve ammo tracking
- Enhancing the reload system to use reserve ammo appropriately
- Adding UI updates to show both magazine and reserve ammo counts
- Creating ammo pickup entities to refill reserve ammo during gameplay 