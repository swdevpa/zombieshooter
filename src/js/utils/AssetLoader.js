import * as THREE from 'three';

export class AssetLoader {
  constructor() {
    this.textures = {};
    this.models = {};
    this.sounds = {};

    // Canvas size für alle Texturen
    this.textureSize = 128;

    // Asset loading tracking
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.loadingErrors = [];

    // Cache management
    this.textureCache = new Map();
    this.modelCache = new Map();
    this.soundCache = new Map();
    
    // Audio context
    this.audioContext = null;
    this.audioListener = null;
  }

  async loadAssets() {
    try {
      console.log('Starting asset loading process...');
      this.loadingErrors = [];
      this.loadedAssets = 0;

      // Register event for loading progress updates
      const progressElement = document.getElementById('loading-progress');
      if (progressElement) {
        this._updateProgressUI(0, 'Initializing...');
      }

      // Erstelle alle Texturen programmatisch statt sie zu laden
      await this.createTextures();

      // In the future, we can add more asset types here
      // await this.loadModels();
      // await this.loadSounds();

      if (this.loadingErrors.length > 0) {
        console.warn(
          `Asset loading completed with ${this.loadingErrors.length} errors:`,
          this.loadingErrors
        );
      } else {
        console.log('All assets loaded successfully!');
      }

      // Final progress update
      if (progressElement) {
        this._updateProgressUI(100, 'Complete!');
      }

      return true;
    } catch (error) {
      console.error('Critical error during asset loading:', error);
      this.loadingErrors.push({
        type: 'critical',
        message: error.message,
        stack: error.stack,
      });

      // Update UI with error
      const progressElement = document.getElementById('loading-progress');
      if (progressElement) {
        this._updateProgressUI(-1, `Error: ${error.message}`);
      }

      return false;
    }
  }

  _updateProgressUI(percentage, message) {
    const progressElement = document.getElementById('loading-progress');
    if (!progressElement) return;

    if (percentage < 0) {
      // Error state
      progressElement.innerHTML = `<div class="error">${message}</div>`;
      progressElement.style.color = 'red';
    } else {
      progressElement.textContent = `${message} (${Math.floor(percentage)}%)`;

      // If there's a progress bar element, update it
      const progressBarElement = document.getElementById('loading-bar-progress');
      if (progressBarElement) {
        progressBarElement.style.width = `${percentage}%`;
      }
    }
  }

  async createTextures() {
    console.log('Starting texture creation process...');
    const textureTimerStart = performance.now();
    
    const textures = [
      'player', 
      'playerHead',
      'weapon',
      'grass', 
      'water',
      'dirt',
      'stone',
      'wall',
      'wood',
      'tree',
      'zombie',
      'zombieHead',
      'bullet',
      'ground',
      'path',
      'muzzleFlash'  // Added muzzleFlash to the list
    ];
    
    // Create a promise for each texture
    const texturePromises = textures.map(name => 
      this._createTextureWithProgress(name, () => this[`create${name.charAt(0).toUpperCase() + name.slice(1)}Texture`]())
    );
    
    // Wait for all textures to be created
    await Promise.all(texturePromises);
    
    const textureTimerEnd = performance.now();
    console.log(`All textures created programmatically in ${(textureTimerEnd - textureTimerStart).toFixed(2)}ms:`, textures);
    
    return this.textures;
  }

  async _createTextureWithProgress(name, createFn) {
    try {
      // Update progress UI
      this._updateProgressUI(
        (this.loadedAssets / this.totalAssets) * 100,
        `Creating ${name} texture...`
      );

      // Allow a small delay for the UI to update
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Create the texture
      createFn();

      // Track progress
      this.loadedAssets++;

      // Return the texture
      return this.textures[name];
    } catch (error) {
      console.error(`Error creating ${name} texture:`, error);
      this.loadingErrors.push({
        type: 'texture',
        name: name,
        message: error.message,
        stack: error.stack,
      });

      // Create a fallback texture
      this.createFallbackTexture(name);

      // Still increment the counter to maintain progress
      this.loadedAssets++;

      return this.textures[name];
    }
  }

  // Fallback texture for error cases
  createFallbackTexture(name) {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Clear background to purple (error color)
    ctx.fillStyle = '#9b59b6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add error pattern
    ctx.fillStyle = '#8e44ad';
    for (let y = 0; y < canvas.height; y += 16) {
      for (let x = 0; x < canvas.width; x += 16) {
        if ((x + y) % 32 === 0) {
          ctx.fillRect(x, y, 16, 16);
        }
      }
    }

    // Add error text
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ERROR', canvas.width / 2, canvas.height / 2);
    ctx.fillText(name, canvas.width / 2, canvas.height / 2 + 20);

    this.textures[name] = new THREE.CanvasTexture(canvas);
    return this.textures[name];
  }

  setupTextureProperties() {
    // Setze Eigenschaften für alle Texturen
    for (const textureName in this.textures) {
      const texture = this.textures[textureName];
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.needsUpdate = true;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = false; // THREE.js Canvas Texturen sind standardmäßig umgekehrt

      // Debug-Ausgabe zur Überprüfung der Textur
      console.log(`Created texture: ${textureName}`, texture);
    }
  }

  // Player Textur
  createPlayerTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Hintergrund löschen (transparent)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Körper (blau)
    ctx.fillStyle = '#3498db';
    ctx.fillRect(canvas.width * 0.2, canvas.height * 0.3, canvas.width * 0.6, canvas.height * 0.7);

    // Arme
    ctx.fillRect(canvas.width * 0.1, canvas.height * 0.3, canvas.width * 0.1, canvas.height * 0.5);
    ctx.fillRect(canvas.width * 0.8, canvas.height * 0.3, canvas.width * 0.1, canvas.height * 0.5);

    // Schattierung
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(canvas.width * 0.6, canvas.height * 0.3, canvas.width * 0.2, canvas.height * 0.7);

    // Kopf wird separat gerendert

    this.textures['player'] = new THREE.CanvasTexture(canvas);
    return this.textures['player'];
  }

  // Player Kopf Textur
  createPlayerHeadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Hintergrund löschen (transparent)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gesicht (hautfarben)
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(
      canvas.width * 0.25,
      canvas.height * 0.25,
      canvas.width * 0.5,
      canvas.height * 0.5
    );

    // Augen
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(
      canvas.width * 0.35,
      canvas.height * 0.35,
      canvas.width * 0.1,
      canvas.height * 0.1
    );
    ctx.fillRect(
      canvas.width * 0.55,
      canvas.height * 0.35,
      canvas.width * 0.1,
      canvas.height * 0.1
    );

    // Mund
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(canvas.width * 0.4, canvas.height * 0.5, canvas.width * 0.2, canvas.height * 0.05);

    // Schattierung
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(
      canvas.width * 0.5,
      canvas.height * 0.25,
      canvas.width * 0.25,
      canvas.height * 0.5
    );

    this.textures['playerHead'] = new THREE.CanvasTexture(canvas);
    return this.textures['playerHead'];
  }

  // Waffen Textur
  createWeaponTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Hintergrund löschen (transparent)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Waffe (grau)
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(canvas.width * 0.4, canvas.height * 0.2, canvas.width * 0.2, canvas.height * 0.7);

    // Waffengriff
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(canvas.width * 0.4, canvas.height * 0.7, canvas.width * 0.2, canvas.height * 0.2);

    // Schattierung
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(canvas.width * 0.5, canvas.height * 0.2, canvas.width * 0.1, canvas.height * 0.7);

    // Highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(
      canvas.width * 0.42,
      canvas.height * 0.22,
      canvas.width * 0.05,
      canvas.height * 0.65
    );

    this.textures['weapon'] = new THREE.CanvasTexture(canvas);
    return this.textures['weapon'];
  }

  // Gras Textur
  createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Basis-Grasfarbe
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grasmuster hinzufügen
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 2 + Math.random() * 4;

      ctx.fillStyle = Math.random() > 0.5 ? '#27ae60' : '#3498db';
      ctx.fillRect(x, y, size, size);
    }

    // Textur aufrauen
    for (let y = 0; y < canvas.height; y += 4) {
      for (let x = 0; x < canvas.width; x += 4) {
        if (Math.random() > 0.8) {
          const shade = Math.floor(Math.random() * 30);
          ctx.fillStyle = `rgba(0, 0, 0, 0.${shade})`;
          ctx.fillRect(x, y, 4, 4);
        }
      }
    }

    this.textures['grass'] = new THREE.CanvasTexture(canvas);
    return this.textures['grass'];
  }

  // Wasser Textur
  createWaterTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Basis-Wasserfarbe
    ctx.fillStyle = '#3498db';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Wasserwellen hinzufügen
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const width = 10 + Math.random() * 20;
      const height = 2 + Math.random() * 4;

      ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
      ctx.beginPath();
      ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Highlights/Glitzer
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 1 + Math.random() * 2;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    this.textures['water'] = new THREE.CanvasTexture(canvas);
    return this.textures['water'];
  }

  // Erde Textur
  createDirtTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Basis-Erdfarbe
    ctx.fillStyle = '#795548';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Erde-Texturen hinzufügen
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 1 + Math.random() * 3;
      const color = Math.random() > 0.5 ? '#5D4037' : '#8D6E63';

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    this.textures['dirt'] = new THREE.CanvasTexture(canvas);
    return this.textures['dirt'];
  }

  // Stein Textur
  createStoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Basis-Steinfarbe
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Steinmuster
    for (let y = 0; y < canvas.height; y += 16) {
      for (let x = 0; x < canvas.width; x += 32) {
        const offsetX = y % 32 === 0 ? 0 : 16;
        const width = 30;
        const height = 14;

        ctx.fillStyle = Math.random() > 0.5 ? '#95a5a6' : '#7f8c8d';
        ctx.fillRect(x + offsetX, y, width, height);

        // Steinrahmen
        ctx.strokeStyle = '#6c7a7a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + offsetX, y, width, height);
      }
    }

    // Risse im Stein
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const length = 5 + Math.random() * 15;
      const angle = Math.random() * Math.PI * 2;

      ctx.strokeStyle = '#6c7a7a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }

    this.textures['stone'] = new THREE.CanvasTexture(canvas);
    return this.textures['stone'];
  }

  // Wand Textur
  createWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Basis-Wandfarbe
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Backsteinmuster
    const brickHeight = 16;
    const brickWidth = 32;

    for (let y = 0; y < canvas.height; y += brickHeight) {
      const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);

      for (let x = 0; x < canvas.width; x += brickWidth) {
        // Variiere die Steinfarbe leicht
        const r = 180 + Math.floor(Math.random() * 30);
        const g = 120 + Math.floor(Math.random() * 30);
        const b = 100 + Math.floor(Math.random() * 30);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x + offset, y, brickWidth - 2, brickHeight - 2);

        // Mörtel
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(x + offset, y + brickHeight - 2, brickWidth - 2, 2);
        ctx.fillRect(x + offset + brickWidth - 2, y, 2, brickHeight - 2);
      }
    }

    this.textures['wall'] = new THREE.CanvasTexture(canvas);
    return this.textures['wall'];
  }

  // Holz Textur
  createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Hintergrund - Basisfarbe für Holz
    ctx.fillStyle = '#8B4513'; // Grundfarbe für Holz (SaddleBrown)
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Woodgrain-Effekt durch wellenförmige Linien erzeugen
    for (let i = 0; i < 20; i++) {
      // Amplitude der Wellen (Stärke der Holzmaserung)
      const amplitude = 5 + Math.random() * 8;
      // Frequenz der Wellen (wie eng die Holzmaserung ist)
      const frequency = 0.01 + Math.random() * 0.04;
      // Versatz für die Wellen
      const offset = Math.random() * canvas.height;
      // Breite der Maserung
      const lineWidth = 1 + Math.random() * 3;

      // Farbe der Maserung - leicht variieren für realistischeren Look
      const brightness = 0.7 + Math.random() * 0.3; // 70-100% Helligkeit
      const r = Math.floor(139 * brightness); // Basis ist RGB von SaddleBrown (139, 69, 19)
      const g = Math.floor(69 * brightness);
      const b = Math.floor(19 * brightness);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;
      ctx.lineWidth = lineWidth;

      // Zeichne gewellte Linie für Maserungseffekt
      ctx.beginPath();

      for (let x = 0; x < canvas.width; x++) {
        const y = offset + amplitude * Math.sin(x * frequency);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }

    // Knoteneffekte im Holz hinzufügen
    for (let i = 0; i < 3; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 5 + Math.random() * 10;

      // Dunklerer Außenring
      const darkGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      darkGradient.addColorStop(0, 'rgba(80, 40, 10, 0.1)');
      darkGradient.addColorStop(0.7, 'rgba(80, 40, 10, 0.8)');
      darkGradient.addColorStop(1, 'rgba(80, 40, 10, 0)');

      ctx.fillStyle = darkGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Hellerer Innenring
      const lightGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.6);
      lightGradient.addColorStop(0, 'rgba(160, 100, 50, 0.8)');
      lightGradient.addColorStop(1, 'rgba(160, 100, 50, 0)');

      ctx.fillStyle = lightGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rinde-ähnliche Textur durch vertikale unregelmäßige Linien
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * canvas.width;
      const length = 5 + Math.random() * 30;
      const width = 1 + Math.random() * 3;

      ctx.strokeStyle = `rgba(50, 25, 0, ${0.3 + Math.random() * 0.3})`;
      ctx.lineWidth = width;

      ctx.beginPath();
      ctx.moveTo(x, Math.random() * canvas.height);
      ctx.lineTo(x + (Math.random() * 10 - 5), Math.random() * canvas.height);
      ctx.stroke();
    }

    this.textures['wood'] = new THREE.CanvasTexture(canvas);
    this.textures['wood'].wrapS = THREE.RepeatWrapping;
    this.textures['wood'].wrapT = THREE.RepeatWrapping;
    return this.textures['wood'];
  }

  // Baum Textur
  createTreeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Hintergrund löschen (transparent)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gradient für realistischeres Grün
    const foliageGradient = ctx.createRadialGradient(
      canvas.width * 0.5,
      canvas.height * 0.3,
      0,
      canvas.width * 0.5,
      canvas.height * 0.3,
      canvas.width * 0.5
    );
    foliageGradient.addColorStop(0, '#2ecc71'); // Helles Grün in der Mitte
    foliageGradient.addColorStop(0.7, '#27ae60'); // Mittleres Grün
    foliageGradient.addColorStop(1, '#145a32'); // Dunkles Grün an den Rändern

    // Zeichne ein reichhaltigeres Blattmuster
    ctx.fillStyle = foliageGradient;
    ctx.beginPath();
    ctx.arc(canvas.width * 0.5, canvas.height * 0.3, canvas.width * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Füge etwas Textur und Details hinzu
    for (let i = 0; i < 300; i++) {
      // Zufällige Position innerhalb des Baumes
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * canvas.width * 0.3;
      const x = canvas.width * 0.5 + Math.cos(angle) * distance;
      const y = canvas.height * 0.3 + Math.sin(angle) * distance;

      // Abwechselnd hellere und dunklere Punkte für Textur
      const shade = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Zeichne einige dunklere Bereiche für Tiefe
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * canvas.width * 0.2;
      const x = canvas.width * 0.5 + Math.cos(angle) * distance;
      const y = canvas.height * 0.3 + Math.sin(angle) * distance;
      const size = 5 + Math.random() * 15;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Zeichne einige hellere Bereiche für Sonnenlicht
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * canvas.width * 0.25;
      const x = canvas.width * 0.5 + Math.cos(angle) * distance;
      const y = canvas.height * 0.3 + Math.sin(angle) * distance;
      const size = 5 + Math.random() * 10;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    this.textures['tree'] = new THREE.CanvasTexture(canvas);
    this.textures['tree'].wrapS = THREE.RepeatWrapping;
    this.textures['tree'].wrapT = THREE.RepeatWrapping;
    return this.textures['tree'];
  }

  // Zombie Textur
  createZombieTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Hintergrund löschen (transparent)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Körper (grün)
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(canvas.width * 0.2, canvas.height * 0.3, canvas.width * 0.6, canvas.height * 0.7);

    // Arme
    ctx.fillRect(canvas.width * 0.1, canvas.height * 0.3, canvas.width * 0.1, canvas.height * 0.5);
    ctx.fillRect(canvas.width * 0.8, canvas.height * 0.3, canvas.width * 0.1, canvas.height * 0.5);

    // Schattierung
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(canvas.width * 0.6, canvas.height * 0.3, canvas.width * 0.2, canvas.height * 0.7);

    // Kopf
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(canvas.width * 0.3, canvas.height * 0.1, canvas.width * 0.4, canvas.height * 0.2);

    // Augen
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(
      canvas.width * 0.35,
      canvas.height * 0.15,
      canvas.width * 0.1,
      canvas.height * 0.05
    );
    ctx.fillRect(
      canvas.width * 0.55,
      canvas.height * 0.15,
      canvas.width * 0.1,
      canvas.height * 0.05
    );

    // Mund
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(
      canvas.width * 0.4,
      canvas.height * 0.22,
      canvas.width * 0.2,
      canvas.height * 0.05
    );

    // Blutflecken/Wunden
    for (let i = 0; i < 10; i++) {
      const x = canvas.width * 0.2 + Math.random() * canvas.width * 0.6;
      const y = canvas.height * 0.3 + Math.random() * canvas.height * 0.7;
      const size = 2 + Math.random() * 5;

      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    this.textures['zombie'] = new THREE.CanvasTexture(canvas);
    return this.textures['zombie'];
  }

  // Zombie Kopf Textur
  createZombieHeadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Hintergrund löschen (transparent)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gesicht (zombiegrün)
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(
      canvas.width * 0.25,
      canvas.height * 0.25,
      canvas.width * 0.5,
      canvas.height * 0.5
    );

    // Augen (rot und blutunterlaufen)
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(
      canvas.width * 0.35,
      canvas.height * 0.35,
      canvas.width * 0.1,
      canvas.height * 0.1
    );
    ctx.fillRect(
      canvas.width * 0.55,
      canvas.height * 0.35,
      canvas.width * 0.1,
      canvas.height * 0.1
    );

    // Pupillen
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(
      canvas.width * 0.38,
      canvas.height * 0.38,
      canvas.width * 0.04,
      canvas.height * 0.04
    );
    ctx.fillRect(
      canvas.width * 0.58,
      canvas.height * 0.38,
      canvas.width * 0.04,
      canvas.height * 0.04
    );

    // Mund (blutig)
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(
      canvas.width * 0.35,
      canvas.height * 0.5,
      canvas.width * 0.3,
      canvas.height * 0.08
    );

    // Zähne
    for (let i = 0; i < 4; i++) {
      const x = canvas.width * (0.35 + 0.075 * i);
      ctx.fillStyle = '#ecf0f1';
      ctx.fillRect(x, canvas.height * 0.5, canvas.width * 0.05, canvas.height * 0.05);
    }

    // Blutflecken/Wunden im Gesicht
    for (let i = 0; i < 5; i++) {
      const x = canvas.width * 0.25 + Math.random() * canvas.width * 0.5;
      const y = canvas.height * 0.25 + Math.random() * canvas.height * 0.5;
      const size = 1 + Math.random() * 3;

      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Verrottungseffekte
    for (let i = 0; i < 3; i++) {
      const x = canvas.width * 0.25 + Math.random() * canvas.width * 0.5;
      const y = canvas.height * 0.25 + Math.random() * canvas.height * 0.5;
      const size = 3 + Math.random() * 5;

      ctx.fillStyle = '#7f8c8d';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    this.textures['zombieHead'] = new THREE.CanvasTexture(canvas);
    return this.textures['zombieHead'];
  }

  createBulletTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');
    
    // Hintergrund transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Bullet-Body (Patronenhülse)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Gradient für metallischen Look
    const gradient = ctx.createLinearGradient(centerX - 15, centerY, centerX + 15, centerY);
    gradient.addColorStop(0, '#BCA282');     // Dunkles Messing
    gradient.addColorStop(0.3, '#FFD700');   // Gold/Messing
    gradient.addColorStop(0.7, '#BCA282');   // Dunkles Messing
    gradient.addColorStop(1, '#FFD700');     // Gold/Messing
    
    // Patrone zeichnen
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Spitze (Geschoss)
    const bulletGradient = ctx.createLinearGradient(centerX - 8, centerY, centerX + 8, centerY);
    bulletGradient.addColorStop(0, '#777');
    bulletGradient.addColorStop(0.5, '#AAA');
    bulletGradient.addColorStop(1, '#777');
    
    ctx.fillStyle = bulletGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Glanzlichter
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    
    this.textures['bullet'] = new THREE.CanvasTexture(canvas);
    return this.textures['bullet'];
  }
  
  /**
   * Creates a muzzle flash texture for weapon effects
   * @returns {THREE.Texture} The created texture
   */
  createMuzzleFlashTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');
    
    // Clear background to transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 4;
    
    // Create radial gradient for the flash
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius * 1.5
    );
    
    // Bright center fading to transparent
    gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');    // Bright yellow-white center
    gradient.addColorStop(0.2, 'rgba(255, 200, 50, 0.9)');  // Orange-yellow
    gradient.addColorStop(0.5, 'rgba(255, 100, 20, 0.6)');  // Orange-red
    gradient.addColorStop(1, 'rgba(200, 50, 0, 0)');       // Transparent red edge
    
    // Draw the main flash circle
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add some random "sparks" around the main flash
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = radius * (0.7 + Math.random() * 0.6);
      const sparkX = centerX + Math.cos(angle) * distance;
      const sparkY = centerY + Math.sin(angle) * distance;
      const sparkSize = 1 + Math.random() * 3;
      
      // Vary the spark color
      const alpha = 0.4 + Math.random() * 0.6;
      ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 0, ${alpha})`;
      
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add a few longer streaks/rays
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const length = radius * (1 + Math.random() * 0.5);
      const width = 3 + Math.random() * 5;
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      
      // Create gradient for the ray
      const rayGradient = ctx.createLinearGradient(0, 0, length, 0);
      rayGradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
      rayGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
      
      ctx.fillStyle = rayGradient;
      ctx.beginPath();
      ctx.moveTo(0, -width/2);
      ctx.lineTo(length, 0);
      ctx.lineTo(0, width/2);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }
    
    this.textures['muzzleFlash'] = new THREE.CanvasTexture(canvas);
    this.textures['muzzleFlash'].transparent = true;
    
    return this.textures['muzzleFlash'];
  }

  // Boden Textur
  createGroundTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Basis-Bodenfarbe
    ctx.fillStyle = '#8B4513'; // Braun als Grundfarbe
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Verschiedene Bodenmuster erstellen

    // Feiner Sand/Staub
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 0.5 + Math.random() * 1.5;
      const color = Math.random() > 0.5 ? '#A0522D' : '#CD853F';

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Kleine Steine
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 1 + Math.random() * 3;

      ctx.fillStyle = '#7f8c8d';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Strukturlinien hinzufügen
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const length = 10 + Math.random() * 20;
      const angle = Math.random() * Math.PI * 2;

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }

    this.textures['ground'] = new THREE.CanvasTexture(canvas);
    return this.textures['ground'];
  }

  // Pfad/Straßen Textur
  createPathTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Basis-Pfadfarbe
    ctx.fillStyle = '#D2B48C'; // Sandfarbe für Pfade
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Pfadstruktur hinzufügen - horizontale Linien
    for (let y = 0; y < canvas.height; y += 8) {
      ctx.strokeStyle = 'rgba(101, 67, 33, 0.3)'; // Dunkelbrauner Verlauf
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Unregelmäßige Strukturen
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 0.5 + Math.random() * 2;

      // Variiere die Farben leicht für natürlicheres Aussehen
      const brightness = 0.7 + Math.random() * 0.3;
      ctx.fillStyle = `rgba(180, 150, 100, ${brightness})`;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Kleine Steine hinzufügen
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 1 + Math.random() * 2;

      ctx.fillStyle = '#A9A9A9'; // Steingrau
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fußspuren/Reifenspuren Effekt
    for (let i = 0; i < 3; i++) {
      const startX = Math.random() * canvas.width;
      const startY = Math.random() * canvas.height;
      const length = 30 + Math.random() * 50;
      const angle = Math.random() * Math.PI * 2;
      const width = 2 + Math.random() * 3;

      ctx.strokeStyle = 'rgba(120, 100, 80, 0.4)';
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(startX, startY);

      // Leicht geschwungene Spur
      const segments = 5;
      for (let j = 1; j <= segments; j++) {
        const t = j / segments;
        const waveX = Math.sin(t * Math.PI * 2) * 3;
        const x = startX + Math.cos(angle) * length * t + waveX;
        const y = startY + Math.sin(angle) * length * t;
        ctx.lineTo(x, y);
      }

      ctx.stroke();
    }

    this.textures['path'] = new THREE.CanvasTexture(canvas);
    return this.textures['path'];
  }

  getTexture(name) {
    if (this.textures[name]) {
      return this.textures[name];
    } else {
      console.warn(`Texture '${name}' not found, using fallback`);
      return this.createFallbackTexture(name);
    }
  }
  
  /**
   * Register an externally created texture with the asset loader
   * @param {string} name - The name to register the texture under
   * @param {THREE.Texture} texture - The texture to register
   * @returns {THREE.Texture} - The registered texture
   */
  registerTexture(name, texture) {
    if (!name || !texture) {
      console.error('Cannot register texture: Invalid name or texture object');
      return null;
    }
    
    // Store the texture in the textures map
    this.textures[name] = texture;
    
    // Apply standard texture properties
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    
    console.log(`Registered external texture: ${name}`);
    return texture;
  }

  createGenericTexture(name) {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Zeichne einen auffälligen checkerboard-Hintergrund für fehlende Texturen
    const checkerSize = this.textureSize / 8;
    for (let y = 0; y < canvas.height; y += checkerSize) {
      for (let x = 0; x < canvas.width; x += checkerSize) {
        ctx.fillStyle = (x / checkerSize + y / checkerSize) % 2 === 0 ? '#FF00FF' : '#000000';
        ctx.fillRect(x, y, checkerSize, checkerSize);
      }
    }

    // Texturname als Text hinzufügen
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Missing: ${name}`, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;

    return texture;
  }

  // New methods for asset management

  // Clear caches to free memory
  clearCaches() {
    // Dispose of textures
    for (const texture of this.textureCache.values()) {
      texture.dispose();
    }
    this.textureCache.clear();

    // Clear other caches
    this.modelCache.clear();
    this.soundCache.clear();

    console.log('Asset caches cleared');
  }

  // Preload specific assets for a level or scene
  async preloadAssetsForScene(sceneId) {
    console.log(`Preloading assets for scene: ${sceneId}`);
    // In the future, this could load specific assets needed for a particular scene
    return true;
  }

  // Building wall texture
  createBuildingWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Base color
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Brick pattern
    ctx.fillStyle = '#d3d3d3';
    const brickWidth = 16;
    const brickHeight = 8;
    
    for (let y = 0; y < canvas.height; y += brickHeight) {
      const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
      for (let x = 0; x < canvas.width + brickWidth; x += brickWidth) {
        ctx.fillRect(x + offset - brickWidth/2, y, brickWidth - 1, brickHeight - 1);
      }
    }

    // Add some noise for texture
    this._addNoiseToCanvas(ctx, canvas.width, canvas.height, 10);

    this.textures['buildingWall'] = new THREE.CanvasTexture(canvas);
    return this.textures['buildingWall'];
  }

  // Building wall normal map
  createBuildingWallNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Default normal pointing outward (RGB: 128, 128, 255)
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Brick pattern with subtle normal variation
    const brickWidth = 16;
    const brickHeight = 8;
    
    for (let y = 0; y < canvas.height; y += brickHeight) {
      const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
      for (let x = 0; x < canvas.width + brickWidth; x += brickWidth) {
        // Brick edges - slight darkness for inward normal
        ctx.fillStyle = '#7878f0';
        ctx.fillRect(x + offset - brickWidth/2, y, brickWidth, 1);
        ctx.fillRect(x + offset - brickWidth/2, y, 1, brickHeight);
        
        // Brick center - slight brightness for outward normal
        ctx.fillStyle = '#8888ff';
        ctx.fillRect(x + offset - brickWidth/2 + 2, y + 2, brickWidth - 4, brickHeight - 4);
      }
    }

    this.textures['buildingWallNormal'] = new THREE.CanvasTexture(canvas);
    return this.textures['buildingWallNormal'];
  }

  // Building glass texture
  createBuildingGlassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Base color (blue-ish glass)
    ctx.fillStyle = '#a7c8e7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Window pattern
    const windowSize = 16;
    const gap = 4;
    
    ctx.fillStyle = '#87a8c7';
    for (let y = 0; y < canvas.height; y += windowSize + gap) {
      for (let x = 0; x < canvas.width; x += windowSize + gap) {
        ctx.fillRect(x, y, windowSize, windowSize);
      }
    }

    // Horizontal reflections
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let y = 8; y < canvas.height; y += windowSize + gap) {
      ctx.fillRect(0, y, canvas.width, 2);
    }

    this.textures['buildingGlass'] = new THREE.CanvasTexture(canvas);
    return this.textures['buildingGlass'];
  }

  // Concrete wall texture
  createConcreteWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Base concrete color
    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise pattern for concrete texture
    this._addNoiseToCanvas(ctx, canvas.width, canvas.height, 20);
    
    // Add some cracks
    ctx.strokeStyle = '#909090';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const x1 = Math.random() * canvas.width;
      const y1 = Math.random() * canvas.height;
      const x2 = x1 + (Math.random() * 20 - 10);
      const y2 = y1 + (Math.random() * 20 - 10);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    this.textures['concreteWall'] = new THREE.CanvasTexture(canvas);
    return this.textures['concreteWall'];
  }

  // Concrete wall normal map
  createConcreteWallNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Default normal pointing outward (RGB: 128, 128, 255)
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle normal variations for concrete
    for (let y = 0; y < canvas.height; y += 4) {
      for (let x = 0; x < canvas.width; x += 4) {
        // Random normal variation
        const variation = Math.floor(Math.random() * 10) - 5;
        const r = 128 + variation;
        const g = 128 + variation;
        const b = 255;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, y, 4, 4);
      }
    }

    // Add some deeper cracks in the normal map
    ctx.strokeStyle = '#7878f0';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const x1 = Math.random() * canvas.width;
      const y1 = Math.random() * canvas.height;
      const x2 = x1 + (Math.random() * 20 - 10);
      const y2 = y1 + (Math.random() * 20 - 10);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    this.textures['concreteWallNormal'] = new THREE.CanvasTexture(canvas);
    return this.textures['concreteWallNormal'];
  }

  // Metal wall texture
  createMetalWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Base metal color
    ctx.fillStyle = '#8c8c8c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Metal panel pattern
    const panelWidth = 32;
    const panelHeight = 16;
    
    for (let y = 0; y < canvas.height; y += panelHeight) {
      for (let x = 0; x < canvas.width; x += panelWidth) {
        ctx.fillStyle = '#7a7a7a';
        ctx.fillRect(x, y, panelWidth - 1, panelHeight - 1);
        
        // Add panel border
        ctx.fillStyle = '#686868';
        ctx.fillRect(x, y, panelWidth, 1);
        ctx.fillRect(x, y, 1, panelHeight);
        
        // Add some wear and scratches
        ctx.fillStyle = '#989898';
        for (let i = 0; i < 3; i++) {
          const scratchX = x + Math.random() * (panelWidth - 5);
          const scratchY = y + Math.random() * (panelHeight - 2);
          const scratchLength = Math.random() * 8 + 2;
          ctx.fillRect(scratchX, scratchY, scratchLength, 1);
        }
      }
    }

    // Add some shine spots
    ctx.fillStyle = 'rgba(200, 200, 200, 0.1)';
    for (let i = 0; i < 10; i++) {
      const shineX = Math.random() * canvas.width;
      const shineY = Math.random() * canvas.height;
      const shineSize = Math.random() * 10 + 5;
      ctx.beginPath();
      ctx.arc(shineX, shineY, shineSize, 0, Math.PI * 2);
      ctx.fill();
    }

    this.textures['metalWall'] = new THREE.CanvasTexture(canvas);
    return this.textures['metalWall'];
  }

  // Metal wall normal map
  createMetalWallNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Default normal pointing outward (RGB: 128, 128, 255)
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Metal panel pattern in normal map
    const panelWidth = 32;
    const panelHeight = 16;
    
    for (let y = 0; y < canvas.height; y += panelHeight) {
      for (let x = 0; x < canvas.width; x += panelWidth) {
        // Panel edges - slightly inward normal
        ctx.fillStyle = '#7878f0';
        ctx.fillRect(x, y, panelWidth, 1);
        ctx.fillRect(x, y, 1, panelHeight);
        
        // Panel center - slightly outward normal
        ctx.fillStyle = '#8888ff';
        ctx.fillRect(x + 2, y + 2, panelWidth - 4, panelHeight - 4);
        
        // Add some dents and bumps
        for (let i = 0; i < 3; i++) {
          const bumpX = x + Math.random() * (panelWidth - 8);
          const bumpY = y + Math.random() * (panelHeight - 8);
          const bumpSize = Math.random() * 4 + 2;
          
          // Random bump or dent
          const bumpType = Math.random() > 0.5;
          ctx.fillStyle = bumpType ? '#9090ff' : '#7070f0';
          
          ctx.beginPath();
          ctx.arc(bumpX, bumpY, bumpSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    this.textures['metalWallNormal'] = new THREE.CanvasTexture(canvas);
    return this.textures['metalWallNormal'];
  }

  // Asphalt texture
  createAsphaltTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Base asphalt color
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise for asphalt texture
    this._addNoiseToCanvas(ctx, canvas.width, canvas.height, 15, '#3a3a3a');

    // Add cracks
    ctx.strokeStyle = '#252525';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const x1 = Math.random() * canvas.width;
      const y1 = Math.random() * canvas.height;
      const x2 = x1 + (Math.random() * 30 - 15);
      const y2 = y1 + (Math.random() * 30 - 15);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Add some small pebbles
    for (let i = 0; i < 50; i++) {
      const pebbleX = Math.random() * canvas.width;
      const pebbleY = Math.random() * canvas.height;
      const pebbleSize = Math.random() * 2 + 1;
      const gray = Math.floor(Math.random() * 30 + 50);
      
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
      ctx.beginPath();
      ctx.arc(pebbleX, pebbleY, pebbleSize, 0, Math.PI * 2);
      ctx.fill();
    }

    this.textures['asphalt'] = new THREE.CanvasTexture(canvas);
    return this.textures['asphalt'];
  }

  // Asphalt normal map
  createAsphaltNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureSize;
    canvas.height = this.textureSize;
    const ctx = canvas.getContext('2d');

    // Default normal pointing outward (RGB: 128, 128, 255)
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle normal variations for asphalt texture
    for (let y = 0; y < canvas.height; y += 2) {
      for (let x = 0; x < canvas.width; x += 2) {
        // Random normal variation
        const variation = Math.floor(Math.random() * 8) - 4;
        const r = 128 + variation;
        const g = 128 + variation;
        const b = 255;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // Add cracks in the normal map
    ctx.strokeStyle = '#7878f0';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const x1 = Math.random() * canvas.width;
      const y1 = Math.random() * canvas.height;
      const x2 = x1 + (Math.random() * 30 - 15);
      const y2 = y1 + (Math.random() * 30 - 15);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Add some bumps for pebbles
    for (let i = 0; i < 50; i++) {
      const pebbleX = Math.random() * canvas.width;
      const pebbleY = Math.random() * canvas.height;
      const pebbleSize = Math.random() * 2 + 1;
      
      ctx.fillStyle = '#8888ff'; // Slightly higher bump
      ctx.beginPath();
      ctx.arc(pebbleX, pebbleY, pebbleSize, 0, Math.PI * 2);
      ctx.fill();
    }

    this.textures['asphaltNormal'] = new THREE.CanvasTexture(canvas);
    return this.textures['asphaltNormal'];
  }

  // Utility to add noise to a canvas context
  _addNoiseToCanvas(ctx, width, height, intensity = 10, color = null) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      if (color) {
        // Parse the color to RGB
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        // Apply the color with random noise
        const noise = Math.random() * intensity - (intensity / 2);
        data[i] = Math.max(0, Math.min(255, r + noise));
        data[i + 1] = Math.max(0, Math.min(255, g + noise));
        data[i + 2] = Math.max(0, Math.min(255, b + noise));
      } else {
        // Apply random noise to existing colors
        const noise = Math.random() * intensity - (intensity / 2);
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  // Sound loading methods
  async loadSound(name, url, options = {}) {
    const category = options.category || 'sfx';
    
    try {
      // Update progress UI
      this._updateProgressUI(
        (this.loadedAssets / this.totalAssets) * 100,
        `Loading sound: ${name}...`
      );
      
      // Check if already loaded
      if (this.soundCache.has(name)) {
        this.loadedAssets++;
        return this.soundCache.get(name);
      }
      
      // Create a placeholder buffer for development
      // In a production environment, this would load from url instead
      const buffer = await this._createPlaceholderAudioBuffer(name, options);
      
      // Store the sound
      if (!this.sounds[category]) {
        this.sounds[category] = {};
      }
      this.sounds[category][name] = buffer;
      
      // Cache the sound
      this.soundCache.set(name, buffer);
      
      // Track progress
      this.loadedAssets++;
      
      return buffer;
    } catch (error) {
      console.error(`Error loading sound ${name}:`, error);
      this.loadingErrors.push({
        type: 'sound',
        name,
        url,
        message: error.message,
        stack: error.stack,
      });
      
      // Create error sound
      const errorBuffer = this._createErrorAudioBuffer();
      
      // Store the error sound
      if (!this.sounds[category]) {
        this.sounds[category] = {};
      }
      this.sounds[category][name] = errorBuffer;
      
      // Track progress
      this.loadedAssets++;
      
      return errorBuffer;
    }
  }
  
  async _createPlaceholderAudioBuffer(name, options = {}) {
    // Create audio context if not exists
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Create a short buffer for development
    const duration = options.duration || 1.0; // 1 second
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);
    
    // Generate different sounds based on the name/category
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // Fill with sounds based on category
    if (name.includes('music')) {
      // Music - low frequency sine wave
      this._generateTone(leftChannel, rightChannel, 220, 0.2, sampleRate, duration);
    } else if (name.includes('ambient')) {
      // Ambient - noise-based sound
      this._generateNoise(leftChannel, rightChannel, 0.05, sampleRate, duration);
    } else if (name.includes('footstep')) {
      // Footstep - short click
      this._generateClick(leftChannel, rightChannel, 0.4, sampleRate, 0.1);
    } else if (name.includes('zombie')) {
      // Zombie sounds - lower frequency noise
      this._generateNoise(leftChannel, rightChannel, 0.3, sampleRate, 0.4);
      this._applyLowPass(leftChannel, rightChannel, 0.5);
    } else if (name.includes('ui')) {
      // UI sounds - high pitched beep
      this._generateTone(leftChannel, rightChannel, 880, 0.2, sampleRate, 0.2);
    } else if (name.includes('pistol') || name.includes('shot')) {
      // Gun sounds - sharp noise burst
      this._generateNoise(leftChannel, rightChannel, 0.9, sampleRate, 0.2);
      this._applyEnvelope(leftChannel, rightChannel, 0.01, 0.05);
    } else if (name.includes('reload')) {
      // Reload sounds - mechanical clicks
      this._generateClick(leftChannel, rightChannel, 0.7, sampleRate, 0.2);
    } else if (name.includes('explosion')) {
      // Explosion - louder, longer noise
      this._generateNoise(leftChannel, rightChannel, 0.9, sampleRate, 0.5);
      this._applyEnvelope(leftChannel, rightChannel, 0.01, 0.4);
      this._applyLowPass(leftChannel, rightChannel, 0.7);
    } else {
      // Default - white noise
      this._generateNoise(leftChannel, rightChannel, 0.3, sampleRate, 0.3);
    }
    
    return buffer;
  }
  
  _generateTone(leftChannel, rightChannel, frequency, gain, sampleRate, duration) {
    const numSamples = sampleRate * duration;
    
    for (let i = 0; i < numSamples; i++) {
      const value = Math.sin(2 * Math.PI * frequency * i / sampleRate) * gain;
      leftChannel[i] = value;
      rightChannel[i] = value;
    }
    
    // Apply fade out
    this._applyFadeOut(leftChannel, rightChannel, sampleRate, duration, 0.1);
  }
  
  _generateNoise(leftChannel, rightChannel, gain, sampleRate, duration) {
    const numSamples = sampleRate * duration;
    
    for (let i = 0; i < numSamples; i++) {
      const value = (Math.random() * 2 - 1) * gain;
      leftChannel[i] = value;
      rightChannel[i] = value;
    }
    
    // Apply fade out
    this._applyFadeOut(leftChannel, rightChannel, sampleRate, duration, 0.1);
  }
  
  _generateClick(leftChannel, rightChannel, gain, sampleRate, duration) {
    const numSamples = sampleRate * duration;
    
    // Initial impulse
    leftChannel[0] = gain;
    rightChannel[0] = gain;
    
    // Rapid decay
    for (let i = 1; i < numSamples; i++) {
      const decay = Math.exp(-i / (sampleRate * 0.01));
      leftChannel[i] = (Math.random() * 0.1 - 0.05 + gain) * decay;
      rightChannel[i] = (Math.random() * 0.1 - 0.05 + gain) * decay;
    }
  }
  
  _applyEnvelope(leftChannel, rightChannel, attackTime, decayTime) {
    const numSamples = leftChannel.length;
    const attackSamples = Math.floor(numSamples * attackTime);
    const decaySamples = Math.floor(numSamples * decayTime);
    
    // Attack phase
    for (let i = 0; i < attackSamples; i++) {
      const gain = i / attackSamples;
      leftChannel[i] *= gain;
      rightChannel[i] *= gain;
    }
    
    // Decay phase
    for (let i = numSamples - decaySamples; i < numSamples; i++) {
      const gain = (numSamples - i) / decaySamples;
      leftChannel[i] *= gain;
      rightChannel[i] *= gain;
    }
  }
  
  _applyLowPass(leftChannel, rightChannel, cutoff) {
    let lastL = 0;
    let lastR = 0;
    
    for (let i = 0; i < leftChannel.length; i++) {
      lastL = lastL + cutoff * (leftChannel[i] - lastL);
      lastR = lastR + cutoff * (rightChannel[i] - lastR);
      leftChannel[i] = lastL;
      rightChannel[i] = lastR;
    }
  }
  
  _applyFadeOut(leftChannel, rightChannel, sampleRate, duration, fadeTime) {
    const fadeStartSample = sampleRate * (duration - fadeTime);
    const fadeSamples = sampleRate * fadeTime;
    
    for (let i = fadeStartSample; i < leftChannel.length; i++) {
      const gain = (leftChannel.length - i) / fadeSamples;
      leftChannel[i] *= gain;
      rightChannel[i] *= gain;
    }
  }
  
  _createErrorAudioBuffer() {
    // Create audio context if not exists
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Create a short error beep
    const duration = 0.5; // 0.5 seconds
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // Error sound - alternating frequency
    for (let i = 0; i < sampleRate * duration; i++) {
      const freq = 440 + Math.sin(i / 1000) * 220;
      const value = Math.sin(2 * Math.PI * freq * i / sampleRate) * 0.3;
      leftChannel[i] = value;
      rightChannel[i] = value;
    }
    
    return buffer;
  }
  
  setAudioListener(listener) {
    this.audioListener = listener;
    // If we have an audio context from the listener, use it
    if (listener && listener.context) {
      this.audioContext = listener.context;
    }
  }
  
  registerSound(name, buffer, category = 'sfx') {
    // Store the sound
    if (!this.sounds[category]) {
      this.sounds[category] = {};
    }
    this.sounds[category][name] = buffer;
    
    // Cache the sound
    this.soundCache.set(name, buffer);
    
    return buffer;
  }
  
  getSound(name, category = 'sfx') {
    if (this.sounds[category] && this.sounds[category][name]) {
      return this.sounds[category][name];
    }
    
    console.warn(`Sound not found: ${name} in category ${category}`);
    return null;
  }
}
