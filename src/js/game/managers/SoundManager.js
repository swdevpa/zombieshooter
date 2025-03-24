import * as THREE from 'three';

export class SoundManager {
  constructor(game, assetLoader) {
    this.game = game;
    this.assetLoader = assetLoader;
    
    // Sound configuration
    this.config = {
      enabled: true,
      masterVolume: 1.0,
      musicVolume: 0.5,
      sfxVolume: 0.8,
      ambientVolume: 0.6,
      zombieVolume: 0.7,
      uiVolume: 0.5,
      playerVolume: 0.7,
      weaponVolume: 0.8,
      spatialAudio: true,
    };
    
    // Audio objects collections
    this.sounds = {
      music: {},
      sfx: {},
      ambient: {},
      zombie: {},
      ui: {},
      player: {},
      weapon: {}
    };
    
    // Currently playing sounds
    this.activeSounds = new Set();
    
    // Sound pools for optimization
    this.soundPools = {};
    
    // Audio listener (for 3D spatial audio)
    this.listener = null;
    
    // Audio context
    this.audioContext = null;
    
    // Sound state
    this.currentMusic = null;
    this.currentAmbient = null;
    
    // Footstep timer
    this.footstepTimer = 0;
    this.footstepInterval = 0.4; // seconds between footsteps
  }
  
  init() {
    // Create global audio listener and attach to camera
    this.listener = new THREE.AudioListener();
    if (this.game.camera) {
      this.game.camera.add(this.listener);
    }
    
    // Initialize audio context
    this.audioContext = this.listener.context;
    
    // Initialize sound pools
    this.initSoundPools();
    
    // Load all sounds
    this.loadSounds();
    
    // Setup audio context resuming on user interaction
    this.setupAudioContextResume();
    
    console.log('SoundManager initialized');
    
    return this;
  }
  
  setupAudioContextResume() {
    // Add click event listener to resume audio context
    const resumeAudioContext = () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('AudioContext resumed successfully');
        }).catch(err => {
          console.warn('Could not resume AudioContext:', err);
        });
      }
    };
    
    // Add event listeners to various user interactions
    ['click', 'touchstart', 'keydown'].forEach(eventType => {
      document.body.addEventListener(eventType, resumeAudioContext, { once: true });
    });
  }
  
  initSoundPools() {
    // Create pools for commonly used sounds to reduce object creation
    const poolConfigs = {
      'gunshot': 10,
      'zombieGrowl': 15,
      'zombieAttack': 8,
      'zombieDeath': 8,
      'impact': 10,
      'shell': 8,
      'footstep': 6
    };
    
    for (const [soundName, count] of Object.entries(poolConfigs)) {
      this.soundPools[soundName] = [];
      for (let i = 0; i < count; i++) {
        const sound = new THREE.Audio(this.listener);
        sound.name = soundName;
        sound.isPlaying = false;
        this.soundPools[soundName].push(sound);
      }
    }
  }
  
  update(deltaTime) {
    // Update spatial audio positions
    if (this.config.spatialAudio && this.game.player) {
      // Positions are automatically updated by Three.js since the listener
      // is attached to the camera
    }
    
    // Handle footstep sounds
    this.updateFootsteps(deltaTime);
    
    // Update any sound effects that need time-based updates
    for (const sound of this.activeSounds) {
      if (sound.isPlaying) {
        // If sound has finished, remove from active sounds
        if (!sound.source || sound.source.buffer && (sound.offset + sound.context.currentTime - sound.startTime) > sound.buffer.duration) {
          this.activeSounds.delete(sound);
          sound.isPlaying = false;
          
          // Return pooled sounds to their pools
          if (sound.name && this.soundPools[sound.name]) {
            sound.isPlaying = false;
          }
        }
      }
    }
  }
  
  updateFootsteps(deltaTime) {
    // Only play footstep sounds when player is moving
    if (this.game.player && this.game.player.isMoving && this.game.player.isGrounded) {
      this.footstepTimer += deltaTime;
      
      if (this.footstepTimer >= this.footstepInterval) {
        this.footstepTimer = 0;
        this.playFootstep();
      }
    }
  }
  
  playFootstep() {
    const surfaces = ['concrete', 'metal', 'dirt', 'wood'];
    const surfaceType = surfaces[Math.floor(Math.random() * surfaces.length)];
    
    // Randomize footstep sound
    const footstepNumber = Math.floor(Math.random() * 4) + 1; // 4 variations
    const footstepSound = `footstep_${surfaceType}_${footstepNumber}`;
    
    this.playSfx(footstepSound, { volume: 0.4 * this.config.playerVolume, category: 'player' });
  }
  
  setMasterVolume(volume) {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    this.listener.setMasterVolume(this.config.masterVolume);
  }
  
  setSfxVolume(volume) {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
    // Apply to all SFX sounds in next play
  }
  
  setMusicVolume(volume) {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    
    // Apply to currently playing music
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.currentMusic.setVolume(this.config.musicVolume * this.config.masterVolume);
    }
  }
  
  setAmbientVolume(volume) {
    this.config.ambientVolume = Math.max(0, Math.min(1, volume));
    
    // Apply to currently playing ambient
    if (this.currentAmbient && this.currentAmbient.isPlaying) {
      this.currentAmbient.setVolume(this.config.ambientVolume * this.config.masterVolume);
    }
  }
  
  setZombieVolume(volume) {
    this.config.zombieVolume = Math.max(0, Math.min(1, volume));
  }
  
  setWeaponVolume(volume) {
    this.config.weaponVolume = Math.max(0, Math.min(1, volume));
  }
  
  setPlayerVolume(volume) {
    this.config.playerVolume = Math.max(0, Math.min(1, volume));
  }
  
  setUiVolume(volume) {
    this.config.uiVolume = Math.max(0, Math.min(1, volume));
  }
  
  toggleSounds(enabled) {
    this.config.enabled = enabled;
    
    if (!enabled) {
      this.stopAll();
    }
  }
  
  async loadSounds() {
    // For now, we're using placeholder sounds
    // In a real implementation, we would load actual sound files
    this.registerSoundCatalog();
    console.log('Registered sounds with AssetLoader');
    
    // Ensure critical sounds have fallbacks for testing
    this.createCriticalSoundPlaceholders();
  }
  
  /**
   * Create placeholders for critical sounds even if they don't exist
   */
  createCriticalSoundPlaceholders() {
    // Ensure critical music tracks have placeholders
    const criticalMusic = ['music_menu', 'music_gameplay', 'music_intense'];
    criticalMusic.forEach(id => {
      if (!this.sounds.music[id]) {
        this.createPlaceholderSound(id, 'music');
      }
    });
    
    // Ensure critical ambient sounds have placeholders
    const criticalAmbient = ['ambient_city', 'ambient_wind'];
    criticalAmbient.forEach(id => {
      if (!this.sounds.ambient[id]) {
        this.createPlaceholderSound(id, 'ambient');
      }
    });
    
    // Ensure critical UI sounds have placeholders
    const criticalUI = ['ui_button_hover', 'ui_button_click', 'ui_pause', 'ui_countdown'];
    criticalUI.forEach(id => {
      if (!this.sounds.ui[id]) {
        this.createPlaceholderSound(id, 'ui');
      }
    });
  }
  
  registerSoundCatalog() {
    // Define all sounds the game will use
    const soundCatalog = {
      // Music
      music: [
        { id: 'music_menu', url: 'sounds/music/menu_theme.mp3' },
        { id: 'music_gameplay', url: 'sounds/music/gameplay.mp3' },
        { id: 'music_intense', url: 'sounds/music/intense_combat.mp3' },
        { id: 'music_gameover', url: 'sounds/music/game_over.mp3' },
        { id: 'music_victory', url: 'sounds/music/victory.mp3' }
      ],
      
      // Ambient
      ambient: [
        { id: 'ambient_city', url: 'sounds/ambient/city_ambience.mp3' },
        { id: 'ambient_wind', url: 'sounds/ambient/wind.mp3' },
        { id: 'ambient_distant_zombies', url: 'sounds/ambient/distant_zombies.mp3' }
      ],
      
      // Weapon sounds
      weapon: [
        { id: 'pistol_shot', url: 'sounds/weapons/pistol_shot.mp3' },
        { id: 'pistol_empty', url: 'sounds/weapons/pistol_empty.mp3' },
        { id: 'pistol_reload_start', url: 'sounds/weapons/pistol_reload_start.mp3' },
        { id: 'pistol_reload_eject', url: 'sounds/weapons/pistol_reload_eject.mp3' },
        { id: 'pistol_reload_insert', url: 'sounds/weapons/pistol_reload_insert.mp3' },
        { id: 'pistol_reload_finish', url: 'sounds/weapons/pistol_reload_finish.mp3' },
        { id: 'shell_casing', url: 'sounds/weapons/shell_casing.mp3' },
        { id: 'bullet_impact_wall', url: 'sounds/weapons/bullet_impact_wall.mp3' },
        { id: 'bullet_impact_metal', url: 'sounds/weapons/bullet_impact_metal.mp3' },
        { id: 'bullet_impact_zombie', url: 'sounds/weapons/bullet_impact_zombie.mp3' },
        { id: 'bullet_flyby', url: 'sounds/weapons/bullet_flyby.mp3' }
      ],
      
      // Zombie sounds
      zombie: [
        // Standard zombie
        { id: 'zombie_standard_growl', url: 'sounds/zombies/standard_growl.mp3' },
        { id: 'zombie_standard_attack', url: 'sounds/zombies/standard_attack.mp3' },
        { id: 'zombie_standard_death', url: 'sounds/zombies/standard_death.mp3' },
        
        // Runner zombie
        { id: 'zombie_runner_growl', url: 'sounds/zombies/runner_growl.mp3' },
        { id: 'zombie_runner_attack', url: 'sounds/zombies/runner_attack.mp3' },
        { id: 'zombie_runner_death', url: 'sounds/zombies/runner_death.mp3' },
        
        // Brute zombie
        { id: 'zombie_brute_growl', url: 'sounds/zombies/brute_growl.mp3' },
        { id: 'zombie_brute_attack', url: 'sounds/zombies/brute_attack.mp3' },
        { id: 'zombie_brute_death', url: 'sounds/zombies/brute_death.mp3' },
        
        // Exploder zombie
        { id: 'zombie_exploder_growl', url: 'sounds/zombies/exploder_growl.mp3' },
        { id: 'zombie_exploder_warning', url: 'sounds/zombies/exploder_warning.mp3' },
        { id: 'zombie_exploder_explosion', url: 'sounds/zombies/exploder_explosion.mp3' },
        
        // Spitter zombie
        { id: 'zombie_spitter_growl', url: 'sounds/zombies/spitter_growl.mp3' },
        { id: 'zombie_spitter_attack', url: 'sounds/zombies/spitter_attack.mp3' },
        { id: 'zombie_spitter_death', url: 'sounds/zombies/spitter_death.mp3' },
        
        // Screamer zombie
        { id: 'zombie_screamer_growl', url: 'sounds/zombies/screamer_growl.mp3' },
        { id: 'zombie_screamer_scream', url: 'sounds/zombies/screamer_scream.mp3' },
        { id: 'zombie_screamer_death', url: 'sounds/zombies/screamer_death.mp3' }
      ],
      
      // Player sounds
      player: [
        { id: 'player_damage', url: 'sounds/player/damage.mp3' },
        { id: 'player_death', url: 'sounds/player/death.mp3' },
        { id: 'player_heal', url: 'sounds/player/heal.mp3' },
        { id: 'player_ammo_pickup', url: 'sounds/player/ammo_pickup.mp3' },
        
        // Footsteps
        { id: 'footstep_concrete_1', url: 'sounds/player/footstep_concrete_1.mp3' },
        { id: 'footstep_concrete_2', url: 'sounds/player/footstep_concrete_2.mp3' },
        { id: 'footstep_concrete_3', url: 'sounds/player/footstep_concrete_3.mp3' },
        { id: 'footstep_concrete_4', url: 'sounds/player/footstep_concrete_4.mp3' },
        
        { id: 'footstep_metal_1', url: 'sounds/player/footstep_metal_1.mp3' },
        { id: 'footstep_metal_2', url: 'sounds/player/footstep_metal_2.mp3' },
        { id: 'footstep_metal_3', url: 'sounds/player/footstep_metal_3.mp3' },
        { id: 'footstep_metal_4', url: 'sounds/player/footstep_metal_4.mp3' },
        
        { id: 'footstep_dirt_1', url: 'sounds/player/footstep_dirt_1.mp3' },
        { id: 'footstep_dirt_2', url: 'sounds/player/footstep_dirt_2.mp3' },
        { id: 'footstep_dirt_3', url: 'sounds/player/footstep_dirt_3.mp3' },
        { id: 'footstep_dirt_4', url: 'sounds/player/footstep_dirt_4.mp3' },
        
        { id: 'footstep_wood_1', url: 'sounds/player/footstep_wood_1.mp3' },
        { id: 'footstep_wood_2', url: 'sounds/player/footstep_wood_2.mp3' },
        { id: 'footstep_wood_3', url: 'sounds/player/footstep_wood_3.mp3' },
        { id: 'footstep_wood_4', url: 'sounds/player/footstep_wood_4.mp3' }
      ],
      
      // UI sounds
      ui: [
        { id: 'ui_button_click', url: 'sounds/ui/button_click.mp3' },
        { id: 'ui_button_hover', url: 'sounds/ui/button_hover.mp3' },
        { id: 'ui_menu_open', url: 'sounds/ui/menu_open.mp3' },
        { id: 'ui_menu_close', url: 'sounds/ui/menu_close.mp3' },
        { id: 'ui_achievement', url: 'sounds/ui/achievement.mp3' },
        { id: 'ui_wave_complete', url: 'sounds/ui/wave_complete.mp3' },
        { id: 'ui_wave_start', url: 'sounds/ui/wave_start.mp3' },
        { id: 'ui_pause', url: 'sounds/ui/pause.mp3' },
        { id: 'ui_countdown', url: 'sounds/ui/countdown.mp3' }
      ]
    };
    
    // Register all sounds with asset loader
    for (const category in soundCatalog) {
      for (const sound of soundCatalog[category]) {
        // Create a prefixed sound ID to avoid collisions
        const prefixedId = `${category}_${sound.id}`;
        
        // In a real implementation, we would load the sound files
        // For this demo, we'll create placeholder sounds
        this.createPlaceholderSound(prefixedId, category);
      }
    }
  }
  
  createPlaceholderSound(id, category) {
    // This method would create a placeholder oscillator-based sound when
    // sound assets aren't available for development
    
    // For now, just register the sound ID
    if (!this.sounds[category]) {
      this.sounds[category] = {};
    }
    
    // Create a dummy buffer for testing (1 second of silence)
    const buffer = this.audioContext.createBuffer(
      2, // stereo
      this.audioContext.sampleRate, // 1 second of audio
      this.audioContext.sampleRate
    );
    
    // Store the buffer
    this.sounds[category][id] = buffer;
    
    // Log that we created a placeholder
    console.log(`Created placeholder sound: ${id} (${category})`);
  }
  
  getFromPool(soundName) {
    // Get a sound from the pool
    if (!this.soundPools[soundName]) return null;
    
    // Find a sound that is not playing
    for (let sound of this.soundPools[soundName]) {
      if (!sound.isPlaying) {
        sound.isPlaying = true;
        return sound;
      }
    }
    
    // If all sounds are playing, return the oldest one (first in array)
    if (this.soundPools[soundName].length > 0) {
      const sound = this.soundPools[soundName][0];
      sound.isPlaying = true;
      return sound;
    }
    
    return null;
  }
  
  // Basic methods for playing sounds
  playMusic(key, options = {}) {
    if (!this.config.enabled) return null;
    
    // Try to resume AudioContext if suspended
    this.ensureAudioContext();
    
    // Set default options
    const musicOptions = {
      volume: this.getMusicVolume(),
      loop: true,
      fadeIn: false,
      fadeTime: 2.0,
      ...options
    };
    
    // Stop current music if playing
    if (this.currentMusic) {
      this.fadeOut(this.currentMusic, 1.0);
      this.activeSounds.delete(this.currentMusic);
    }
    
    // Create audio object
    const music = new THREE.Audio(this.listener);
    
    // Get audio buffer for the key
    const buffer = this.getSoundBuffer(key);
    
    if (buffer) {
      music.setBuffer(buffer);
      music.setLoop(musicOptions.loop);
      music.setVolume(0); // Start at 0 for fade-in
      music.play();
      
      // Fade in if needed
      if (musicOptions.fadeIn) {
        try {
          this.fadeIn(music, musicOptions.volume, musicOptions.fadeTime);
        } catch (error) {
          console.error("Error during music fade-in:", error);
          // Fallback to direct volume setting
          music.setVolume(musicOptions.volume);
        }
      } else {
        music.setVolume(musicOptions.volume);
      }
      
      // Update current music
      this.currentMusic = music;
      this.activeSounds.add(music);
      
      return music;
    } else {
      console.warn(`Music not found: ${key}`);
      return null;
    }
  }
  
  playSfx(key, options = {}) {
    if (!this.config.enabled) return null;
    
    // Try to resume AudioContext if suspended
    this.ensureAudioContext();
    
    // Set default options
    const sfxOptions = {
      volume: this.config.sfxVolume,
      spatial: false,
      position: null,
      pooled: false,
      loop: false,
      ...options
    };
    
    // Determine which category to use
    const categoryToUse = options.category || 'sfx';
    
    // Check if we need to prefix the key with the category
    let keyToUse = key;
    if (!key.startsWith(categoryToUse + '_')) {
      keyToUse = `${categoryToUse}_${key}`;
    }
    
    // Get the sound buffer
    const buffer = this.sounds[categoryToUse] ? this.sounds[categoryToUse][keyToUse] : null;
    
    if (buffer) {
      let sound;
      
      if (sfxOptions.pooled) {
        // Get from object pool
        sound = this.getFromPool(keyToUse);
      } else {
        // Create new instance
        if (sfxOptions.spatial && this.game.audioListener) {
          sound = new THREE.PositionalAudio(this.game.audioListener);
        } else {
          sound = new THREE.Audio(this.game.audioListener);
        }
        
        sound.setBuffer(buffer);
        sound.setVolume(sfxOptions.volume);
        sound.setLoop(sfxOptions.loop);
      }
      
      // Set position if spatial audio
      if (sound instanceof THREE.PositionalAudio && sfxOptions.position) {
        sound.position.copy(sfxOptions.position);
        
        // Set additional positional audio properties
        if (sound instanceof THREE.PositionalAudio) {
          sound.setRefDistance(5);
          sound.setMaxDistance(100);
          sound.setRolloffFactor(1);
          sound.setDistanceModel('exponential');
        }
      }
      
      sound.play();
      
      // Add to active sounds
      if (!sfxOptions.pooled) {
        this.activeSounds.add(sound);
      }
      
      return sound;
    } else {
      console.warn(`Sound not found: ${key} in category ${categoryToUse}`);
      return null;
    }
  }
  
  playAmbient(key, options = {}) {
    if (!this.config.enabled) return null;
    
    // Try to resume AudioContext if suspended
    this.ensureAudioContext();
    
    // Set default options
    const ambientOptions = {
      volume: this.config.ambientVolume * this.config.masterVolume,
      loop: true,
      fadeIn: true,
      fadeTime: 3.0,
      ...options
    };
    
    // Stop current ambient if playing
    if (this.currentAmbient) {
      this.fadeOut(this.currentAmbient, 2.0);
      this.activeSounds.delete(this.currentAmbient);
    }
    
    // Create new audio object
    const ambient = new THREE.Audio(this.listener);
    
    // Get buffer from our loaded sounds
    const buffer = this.getSoundBuffer(key);
    
    if (buffer) {
      ambient.setBuffer(buffer);
      ambient.setLoop(ambientOptions.loop);
      ambient.setVolume(0); // Start at 0 for fade-in
      ambient.play();
      
      // Fade in if needed
      if (ambientOptions.fadeIn) {
        try {
          this.fadeIn(ambient, ambientOptions.volume, ambientOptions.fadeTime);
        } catch (error) {
          console.error("Error during ambient fade-in:", error);
          // Fallback to direct volume setting
          ambient.setVolume(ambientOptions.volume);
        }
      } else {
        ambient.setVolume(ambientOptions.volume);
      }
      
      // Update current ambient
      this.currentAmbient = ambient;
      this.activeSounds.add(ambient);
      
      return ambient;
    } else {
      console.warn(`Ambient sound not found: ${key}`);
      return null;
    }
  }
  
  fadeIn(sound, targetVolume, fadeTime = 1.0) {
    if (!sound) return;
    
    try {
      // Check if sound has the gain property (it might be a placeholder)
      if (!sound.gain) {
        // For THREE.Audio objects, we need to access gain through getGain()
        if (typeof sound.getGain === 'function') {
          const gainNode = sound.getGain();
          if (gainNode && typeof gainNode.gain.setValueAtTime === 'function') {
            const startTime = this.audioContext.currentTime;
            const endTime = startTime + fadeTime;
            
            // Use exponential ramp for more natural volume change
            gainNode.gain.setValueAtTime(0.01, startTime); // Start from a small value, not 0
            gainNode.gain.exponentialRampToValueAtTime(targetVolume, endTime);
          } else {
            // Fallback if gain functions aren't available
            if (typeof sound.setVolume === 'function') {
              sound.setVolume(targetVolume);
            }
          }
        } else {
          // For placeholder sounds, just set volume directly
          if (typeof sound.setVolume === 'function') {
            sound.setVolume(targetVolume);
          }
        }
        return;
      }
      
      const startTime = this.audioContext.currentTime;
      const endTime = startTime + fadeTime;
      
      // Check if the gain methods exist
      if (sound.gain && typeof sound.gain.setValueAtTime === 'function' && 
          typeof sound.gain.exponentialRampToValueAtTime === 'function') {
        // Use exponential ramp for more natural volume change
        sound.gain.setValueAtTime(0.01, startTime); // Start from a small value, not 0
        sound.gain.exponentialRampToValueAtTime(targetVolume, endTime);
      } else {
        // Fallback to direct volume setting
        if (typeof sound.setVolume === 'function') {
          sound.setVolume(targetVolume);
        }
      }
    } catch (error) {
      console.warn("Error during fade-in, setting volume directly:", error);
      // Fallback to direct volume setting
      if (typeof sound.setVolume === 'function') {
        sound.setVolume(targetVolume);
      }
    }
  }
  
  fadeOut(sound, fadeTime) {
    if (!sound || !sound.isPlaying) return;
    
    // Check if sound has the gain property (it might be a placeholder)
    if (!sound.gain) {
      // For THREE.Audio objects, we need to access gain through getGain()
      if (sound.getGain) {
        const gainNode = sound.getGain();
        const startTime = this.audioContext.currentTime;
        const endTime = startTime + fadeTime;
        
        // Current volume
        const currentVolume = sound.getVolume();
        
        // Use exponential ramp for more natural volume change
        gainNode.gain.setValueAtTime(Math.max(currentVolume, 0.01), startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);
        
        // Schedule stop after fade
        setTimeout(() => {
          if (sound.isPlaying) sound.stop();
        }, fadeTime * 1000);
      } else {
        // For placeholder sounds, just stop directly
        sound.stop();
      }
      return;
    }
    
    const startTime = this.audioContext.currentTime;
    const endTime = startTime + fadeTime;
    
    sound.gain.setValueAtTime(sound.gain.value, startTime);
    sound.gain.exponentialRampToValueAtTime(0.001, endTime);
    
    // Schedule stop after fade completes
    setTimeout(() => {
      if (sound.isPlaying) {
        sound.stop();
      }
    }, fadeTime * 1000);
  }
  
  stopAll() {
    // Stop all active sounds
    for (const sound of this.activeSounds) {
      if (sound.isPlaying) {
        sound.stop();
      }
    }
    
    // Clear active sounds
    this.activeSounds.clear();
    
    // Clear current music and ambient
    this.currentMusic = null;
    this.currentAmbient = null;
    
    console.log('Stopped all sounds');
  }
  
  pauseAll() {
    // Pause all active sounds
    for (const sound of this.activeSounds) {
      if (sound.isPlaying) {
        sound.pause();
      }
    }
  }
  
  resumeAll() {
    // Resume all paused sounds
    for (const sound of this.activeSounds) {
      if (!sound.isPlaying) {
        sound.play();
      }
    }
  }
  
  // Add this new method
  ensureAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      console.log('Attempting to resume AudioContext...');
      this.audioContext.resume().catch(err => {
        console.warn('Could not resume AudioContext:', err);
      });
    }
  }
  
  /**
   * Get sound buffer for a specific key
   * @param {string} key - Sound identifier
   * @returns {AudioBuffer|null} Sound buffer or null if not found
   */
  getSoundBuffer(key) {
    // Try to find in different sound categories
    if (this.sounds.music && this.sounds.music[key]) {
      return this.sounds.music[key];
    }
    
    if (this.sounds.sfx && this.sounds.sfx[key]) {
      return this.sounds.sfx[key];
    }
    
    if (this.sounds.ambient && this.sounds.ambient[key]) {
      return this.sounds.ambient[key];
    }
    
    if (this.sounds.zombie && this.sounds.zombie[key]) {
      return this.sounds.zombie[key];
    }
    
    if (this.sounds.ui && this.sounds.ui[key]) {
      return this.sounds.ui[key];
    }
    
    if (this.sounds.player && this.sounds.player[key]) {
      return this.sounds.player[key];
    }
    
    if (this.sounds.weapon && this.sounds.weapon[key]) {
      return this.sounds.weapon[key];
    }
    
    return null;
  }

  /**
   * Get the effective music volume considering master volume
   * @returns {number} Effective music volume
   */
  getMusicVolume() {
    return this.config.musicVolume * this.config.masterVolume;
  }
} 