# Weapon System

## Description
Create a modular weapon system framework for the zombie shooter game. This system should support different types of weapons, each with unique properties like damage, fire rate, and reload time.

## Requirements
- Implement a base Weapon class that can be extended for specific weapon types
- Support different weapon properties (damage, fire rate, reload time, ammo capacity)
- Create at least one weapon type (pistol) as a starting weapon
- Implement weapon switching mechanism for future expansion
- Ensure proper integration with player controls, UI, and game state

## Acceptance Criteria
- [x] Base Weapon class with extensible functionality
- [x] At least one functional weapon implementation
- [x] Proper weapon properties and stats
- [x] Weapon switching mechanism (for future weapons)
- [x] UI integration showing current weapon and ammo
- [ ] Sound effects for shooting and reloading

## Developer Notes
- Starting the implementation of the weapon system. The basic structure already exists with the Weapon class, but it needs to be enhanced to support different weapon types and properties.
- Created a modular weapon system with a base Weapon class and a Pistol implementation
- Implemented WeaponManager for handling weapon switching and management
- Updated the Player class to use the weapon manager instead of a direct weapon reference
- Added support for switching weapons with number keys (1-5) and mouse wheel
- The weapon system now supports different weapon types with unique properties, animations, and behaviors
- Reload animations and shooting mechanics are properly implemented
- UI integration for showing ammo is complete 