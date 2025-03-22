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
    this.createBulletTexture();
    
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
    
    // Basis-Holzfarbe
    ctx.fillStyle = '#D2691E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Holzmaserung
    const planks = 8;
    const plankHeight = canvas.height / planks;
    
    for (let i = 0; i < planks; i++) {
      const y = i * plankHeight;
      
      // Plankenbasis mit Variationen
      const baseR = 180 + Math.floor(Math.random() * 20);
      const baseG = 100 + Math.floor(Math.random() * 20);
      const baseB = 30 + Math.floor(Math.random() * 20);
      
      ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
      ctx.fillRect(0, y, canvas.width, plankHeight - 1);
      
      // Plankenspalt
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(0, y + plankHeight - 1, canvas.width, 1);
      
      // Holzmaserung für jede Planke
      for (let j = 0; j < 5; j++) {
        const lineY = y + j * (plankHeight / 5) + Math.random() * 3;
        ctx.strokeStyle = `rgba(${baseR - 40}, ${baseG - 40}, ${baseB - 20}, 0.5)`;
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        
        // Geschwungene Maserungslinie
        let prevX = 0;
        for (let x = 20; x < canvas.width; x += 20) {
          const newY = lineY + (Math.random() * 4 - 2);
          ctx.lineTo(x, newY);
          prevX = x;
        }
        
        ctx.stroke();
      }
      
      // Astlöcher
      if (Math.random() > 0.7) {
        const knots = Math.floor(Math.random() * 2) + 1;
        for (let k = 0; k < knots; k++) {
          const knotX = Math.random() * canvas.width;
          const knotY = y + Math.random() * plankHeight;
          const knotSize = 2 + Math.random() * 6;
          
          // Dunkler äußerer Ring
          ctx.fillStyle = '#5D4037';
          ctx.beginPath();
          ctx.arc(knotX, knotY, knotSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Innerer Teil
          ctx.fillStyle = '#8B4513';
          ctx.beginPath();
          ctx.arc(knotX, knotY, knotSize * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    this.textures['wood'] = new THREE.CanvasTexture(canvas);
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
    
    // Stamm (unten)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(canvas.width * 0.4, canvas.height * 0.6, canvas.width * 0.2, canvas.height * 0.4);
    
    // Stamm Maserung
    for (let i = 0; i < 5; i++) {
      const y = canvas.height * 0.6 + i * (canvas.height * 0.4 / 5);
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.4, y);
      ctx.lineTo(canvas.width * 0.6, y);
      ctx.stroke();
    }
    
    // Baumkrone (oben)
    ctx.fillStyle = '#2ecc71';
    
    // Mehrere Ebenen für die Baumkrone
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.2, canvas.height * 0.6);
    ctx.lineTo(canvas.width * 0.5, canvas.height * 0.1);
    ctx.lineTo(canvas.width * 0.8, canvas.height * 0.6);
    ctx.closePath();
    ctx.fill();
    
    // Mittlere Ebene
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.25, canvas.height * 0.5);
    ctx.lineTo(canvas.width * 0.5, canvas.height * 0.15);
    ctx.lineTo(canvas.width * 0.75, canvas.height * 0.5);
    ctx.closePath();
    ctx.fill();
    
    // Topebene
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.3, canvas.height * 0.4);
    ctx.lineTo(canvas.width * 0.5, canvas.height * 0.1);
    ctx.lineTo(canvas.width * 0.7, canvas.height * 0.4);
    ctx.closePath();
    ctx.fill();
    
    // Highlights in den Blättern
    for (let i = 0; i < 30; i++) {
      const x = canvas.width * 0.3 + Math.random() * canvas.width * 0.4;
      const y = canvas.height * 0.1 + Math.random() * canvas.height * 0.4;
      
      if (y < canvas.height * 0.6) { // Nur innerhalb der Baumkrone
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    this.textures['tree'] = new THREE.CanvasTexture(canvas);
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