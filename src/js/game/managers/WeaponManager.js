import { Pistol } from '../entities/Pistol.js';

/**
 * Manages weapons and weapon switching
 */
export class WeaponManager {
  constructor(game, player, assetLoader) {
    this.game = game;
    this.player = player;
    this.assetLoader = assetLoader;
    
    // List of available weapons
    this.weapons = [];
    
    // Currently equipped weapon
    this.currentWeapon = null;
    this.currentWeaponIndex = 0;
    
    // Weapon switching state
    this.isSwitching = false;
    this.switchCooldown = 0.5; // seconds
    this.lastSwitchTime = 0;
    
    // Initialize manager
    this.init();
  }
  
  /**
   * Initialize the weapon manager
   */
  init() {
    // Ensure player exists before creating weapons
    if (!this.player) {
      console.error('WeaponManager initialization failed: Player not set');
      return this;
    }
    
    // Ensure assetLoader has loaded textures
    if (!this.assetLoader || !this.assetLoader.textures || !this.assetLoader.textures.weapon) {
      console.error('WeaponManager initialization failed: Weapon texture not loaded');
      return this;
    }
    
    // Create default weapons
    this.createDefaultWeapons();
    
    // Equip the first weapon
    if (this.weapons.length > 0) {
      this.equipWeapon(0);
    }
    
    return this;
  }
  
  /**
   * Create default weapons
   */
  createDefaultWeapons() {
    // Add a pistol as the starting weapon
    const pistol = new Pistol(this.player, this.assetLoader);
    this.addWeapon(pistol);
    
    // Additional weapons will be added here in the future
  }
  
  /**
   * Add a weapon to the available weapons
   * @param {Weapon} weapon - The weapon to add
   */
  addWeapon(weapon) {
    this.weapons.push(weapon);
  }
  
  /**
   * Remove a weapon from available weapons
   * @param {number} index - The index of the weapon to remove
   */
  removeWeapon(index) {
    if (index >= 0 && index < this.weapons.length) {
      // Get weapon
      const weapon = this.weapons[index];
      
      // Hide weapon mesh
      if (weapon.container) {
        weapon.container.visible = false;
      }
      
      // Remove from weapons array
      this.weapons.splice(index, 1);
      
      // If current weapon is removed, switch to another
      if (this.currentWeaponIndex === index) {
        if (this.weapons.length > 0) {
          // Switch to first available weapon
          this.equipWeapon(0);
        } else {
          // No weapons left
          this.currentWeapon = null;
          this.currentWeaponIndex = -1;
        }
      } 
      // Update currentWeaponIndex if a weapon before the current one was removed
      else if (this.currentWeaponIndex > index) {
        this.currentWeaponIndex--;
      }
    }
  }
  
  /**
   * Equip a weapon by index
   * @param {number} index - The index of the weapon to equip
   */
  equipWeapon(index) {
    if (index < 0 || index >= this.weapons.length) return;
    
    // Skip if already equipped or switching is in cooldown
    if (index === this.currentWeaponIndex || this.isSwitching) return;
    
    // Check cooldown
    const now = Date.now() / 1000;
    if (now - this.lastSwitchTime < this.switchCooldown) return;
    
    // Set switching flag
    this.isSwitching = true;
    this.lastSwitchTime = now;
    
    // Hide current weapon if it exists
    if (this.currentWeapon && this.currentWeapon.container) {
      this.currentWeapon.container.visible = false;
    }
    
    // Set new weapon
    this.currentWeaponIndex = index;
    this.currentWeapon = this.weapons[index];
    
    // Show new weapon
    if (this.currentWeapon.container) {
      this.currentWeapon.container.visible = true;
    }
    
    // Attach to player
    if (this.player.container && this.currentWeapon.container) {
      this.player.container.add(this.currentWeapon.container);
    }
    
    // Update UI
    this.updateUI();
    
    // Clear switching flag after animation time
    setTimeout(() => {
      this.isSwitching = false;
    }, this.switchCooldown * 1000);
    
    return this.currentWeapon;
  }
  
  /**
   * Switch to the next weapon
   */
  nextWeapon() {
    if (this.weapons.length <= 1) return;
    
    const nextIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
    return this.equipWeapon(nextIndex);
  }
  
  /**
   * Switch to the previous weapon
   */
  previousWeapon() {
    if (this.weapons.length <= 1) return;
    
    const prevIndex = (this.currentWeaponIndex - 1 + this.weapons.length) % this.weapons.length;
    return this.equipWeapon(prevIndex);
  }
  
  /**
   * Get the current weapon
   * @returns {Weapon} The current weapon
   */
  getCurrentWeapon() {
    return this.currentWeapon;
  }
  
  /**
   * Shoot the current weapon
   * @returns {boolean} Whether the weapon was fired
   */
  shoot() {
    if (!this.currentWeapon) return false;
    
    // Try to shoot the weapon
    const didShoot = this.currentWeapon.shoot();
    
    // If shot was successful, add muzzle flash lighting effect
    if (didShoot && this.game.lightingManager) {
      // Get the position of the weapon muzzle
      const muzzlePosition = this.currentWeapon.getMuzzlePosition();
      
      if (muzzlePosition) {
        // Activate muzzle flash light at the position
        this.game.lightingManager.activateMuzzleFlash(muzzlePosition);
      }
    }
    
    return didShoot;
  }
  
  /**
   * Reload the current weapon
   */
  reload() {
    if (!this.currentWeapon) return;
    
    // Don't allow reload if already reloading
    if (this.currentWeapon.isReloading) return;
    
    // Don't reload if ammo is full
    if (this.currentWeapon.currentAmmo === this.currentWeapon.ammoCapacity) return;
    
    // Call weapon reload method
    this.currentWeapon.reload();
    
    // Update UI immediately to show empty magazine
    this.updateUI();
  }
  
  /**
   * Update all weapons
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Update current weapon
    if (this.currentWeapon) {
      this.currentWeapon.update(deltaTime);
    }
  }
  
  /**
   * Update UI with current weapon info
   */
  updateUI() {
    if (!this.game.uiManager || !this.currentWeapon) return;
    
    // Update ammo display with reserve ammo
    this.game.uiManager.updateAmmo(
      this.currentWeapon.currentAmmo, 
      this.currentWeapon.ammoCapacity,
      this.currentWeapon.reserveAmmo
    );
    
    // Show reload indicators
    if (this.currentWeapon.isReloading) {
      this.game.uiManager.showReloadIndicator();
    } else {
      this.game.uiManager.hideReloadIndicator();
    }
  }
  
  /**
   * Reset all weapons to initial state
   */
  reset() {
    // Reset all weapons
    this.weapons.forEach(weapon => {
      weapon.reset();
    });
    
    // Equip the first weapon
    if (this.weapons.length > 0) {
      this.equipWeapon(0);
    }
  }
  
  /**
   * Add ammo to the current weapon
   * @param {number} amount - Amount of ammo to add
   * @returns {boolean} Whether ammo was successfully added
   */
  addAmmo(amount) {
    if (!this.currentWeapon) return false;
    
    // Add ammo to reserve
    const ammoAdded = this.currentWeapon.addReserveAmmo(amount);
    
    // Update UI
    this.updateUI();
    
    return ammoAdded > 0;
  }
  
  /**
   * Create an ammo pickup in the world
   * @param {THREE.Vector3} position - Position to place the ammo pickup
   * @param {number} amount - Amount of ammo in the pickup
   * @returns {AmmoPickup} The created ammo pickup
   */
  createAmmoPickup(position, amount = 20) {
    // Create ammo pickup object (if AmmoPickup class exists)
    if (this.game.entityManager && typeof this.game.entityManager.createAmmoPickup === 'function') {
      return this.game.entityManager.createAmmoPickup(position, amount);
    }
    
    console.warn('EntityManager or createAmmoPickup method not found');
    return null;
  }
} 