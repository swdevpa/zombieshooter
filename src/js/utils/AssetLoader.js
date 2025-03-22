import * as THREE from 'three';

export class AssetLoader {
  constructor() {
    this.textures = {};
    this.models = {};
    this.sounds = {};
    
    // Canvas size für alle Texturen
    this.textureSize = 128;
  }
  
  async loadAssets() {
    try {
      // Erstelle alle Texturen programmatisch statt sie zu laden
      await this.createTextures();
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async createTextures() {
    const startTime = performance.now();
    
    // Erstelle alle Texturen
    this.createPlayerTexture();
    this.createPlayerHeadTexture();
    this.createWeaponTexture();
    this.createGrassTexture();
    this.createWaterTexture();
    this.createDirtTexture();
    this.createStoneTexture();
    this.createWallTexture();
    this.createWoodTexture();
    this.createTreeTexture();
    this.createZombieTexture();
    this.createZombieHeadTexture();
    this.createBulletTexture();
    this.createGroundTexture();
    this.createPathTexture();
    
    const endTime = performance.now();
    
    // Setze Eigenschaften für alle Texturen
    this.setupTextureProperties();
    
    console.log("All textures created programmatically:", Object.keys(this.textures));
    
    return true;
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
    ctx.fillRect(canvas.width * 0.25, canvas.height * 0.25, canvas.width * 0.5, canvas.height * 0.5);
    
    // Augen
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(canvas.width * 0.35, canvas.height * 0.35, canvas.width * 0.1, canvas.height * 0.1);
    ctx.fillRect(canvas.width * 0.55, canvas.height * 0.35, canvas.width * 0.1, canvas.height * 0.1);
    
    // Mund
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(canvas.width * 0.4, canvas.height * 0.5, canvas.width * 0.2, canvas.height * 0.05);
    
    // Schattierung
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(canvas.width * 0.5, canvas.height * 0.25, canvas.width * 0.25, canvas.height * 0.5);
    
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
    ctx.fillRect(canvas.width * 0.42, canvas.height * 0.22, canvas.width * 0.05, canvas.height * 0.65);
    
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
        const offsetX = (y % 32 === 0) ? 0 : 16;
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
      canvas.width * 0.5, canvas.height * 0.3, 0,
      canvas.width * 0.5, canvas.height * 0.3, canvas.width * 0.5
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
      const shade = Math.random() > 0.5 ? 
        'rgba(255, 255, 255, 0.1)' : 
        'rgba(0, 0, 0, 0.1)';
      
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
    ctx.fillRect(canvas.width * 0.35, canvas.height * 0.15, canvas.width * 0.1, canvas.height * 0.05);
    ctx.fillRect(canvas.width * 0.55, canvas.height * 0.15, canvas.width * 0.1, canvas.height * 0.05);
    
    // Mund
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(canvas.width * 0.4, canvas.height * 0.22, canvas.width * 0.2, canvas.height * 0.05);
    
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
    ctx.fillRect(canvas.width * 0.25, canvas.height * 0.25, canvas.width * 0.5, canvas.height * 0.5);
    
    // Augen (rot und blutunterlaufen)
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(canvas.width * 0.35, canvas.height * 0.35, canvas.width * 0.1, canvas.height * 0.1);
    ctx.fillRect(canvas.width * 0.55, canvas.height * 0.35, canvas.width * 0.1, canvas.height * 0.1);
    
    // Pupillen
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(canvas.width * 0.38, canvas.height * 0.38, canvas.width * 0.04, canvas.height * 0.04);
    ctx.fillRect(canvas.width * 0.58, canvas.height * 0.38, canvas.width * 0.04, canvas.height * 0.04);
    
    // Mund (blutig)
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(canvas.width * 0.35, canvas.height * 0.5, canvas.width * 0.3, canvas.height * 0.08);
    
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
    
    // Hintergrund löschen (transparent)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Metallischer Farbverlauf für die Patrone
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#D4AF37');    // Gold
    gradient.addColorStop(0.4, '#FFF8DC');  // Hellgold
    gradient.addColorStop(0.6, '#FFF8DC');  // Hellgold
    gradient.addColorStop(1, '#D4AF37');    // Gold
    
    // Hauptteil der Patrone
    ctx.fillStyle = gradient;
    ctx.fillRect(canvas.width * 0.2, canvas.height * 0.3, canvas.width * 0.6, canvas.height * 0.6);
    
    // Geschossspitze
    ctx.fillStyle = '#B87333'; // Kupfer
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.5, canvas.height * 0.1);
    ctx.lineTo(canvas.width * 0.3, canvas.height * 0.3);
    ctx.lineTo(canvas.width * 0.7, canvas.height * 0.3);
    ctx.closePath();
    ctx.fill();
    
    // Patronenboden
    ctx.fillStyle = '#8B4513'; // Dunkelbraun
    ctx.fillRect(canvas.width * 0.3, canvas.height * 0.9, canvas.width * 0.4, canvas.height * 0.1);
    
    // Zündhütchen
    ctx.fillStyle = '#C0C0C0'; // Silber
    ctx.beginPath();
    ctx.arc(canvas.width * 0.5, canvas.height * 0.95, canvas.width * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    // Glanzeffekt
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.3, canvas.height * 0.4);
    ctx.lineTo(canvas.width * 0.3, canvas.height * 0.85);
    ctx.stroke();
    
    this.textures['bullet'] = new THREE.CanvasTexture(canvas);
    return this.textures['bullet'];
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
      // Stelle sicher, dass die Textur aktualisiert wird
      this.textures[name].needsUpdate = true;
      return this.textures[name];
    } else {
      console.warn(`Texture "${name}" not found, creating generic texture instead`);
      this.textures[name] = this.createGenericTexture(name);
      return this.textures[name];
    }
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
        ctx.fillStyle = ((x / checkerSize + y / checkerSize) % 2 === 0) ? '#FF00FF' : '#000000';
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
} 