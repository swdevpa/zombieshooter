import * as THREE from 'three';

export class AssetLoader {
  constructor() {
    this.textures = {};
    this.models = {};
    this.sounds = {};
    
    this.textureLoader = new THREE.TextureLoader();
    this.textureLoader.crossOrigin = '';
  }
  
  async loadAssets() {
    try {
      await Promise.all([
        this.loadTextures(),
      ]);
      console.log('All assets loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading assets:', error);
      throw error;
    }
  }
  
  async loadTextures() {
    const textureFiles = {
      // Map tiles
      'grass': 'assets/textures/terrain/grass.png',
      'water': 'assets/textures/terrain/water.png',
      'stone': 'assets/textures/terrain/stone.png',
      'wall': 'assets/textures/terrain/wall.png',
      'tree': 'assets/textures/terrain/tree.png',
      
      // Character
      'player': 'assets/textures/characters/player.png',
      'player_head': 'assets/textures/characters/player_head.png',
      'player_weapon': 'assets/textures/characters/player_weapon.png',
      
      // Enemies
      'zombie': 'assets/textures/characters/zombie.png',
      'zombie_head': 'assets/textures/characters/zombie_head.png',
      
      // Effects
      'bullet': 'assets/textures/effects/bullet.png',
      'blood': 'assets/textures/effects/blood.png',
      'explosion': 'assets/textures/effects/explosion.png',
    };
    
    // Bereite Texturen vor
    await this.generatePlaceholderTextures();
    
    console.log('Loading textures...');
    const startTime = performance.now();
    
    // Erstelle Fallback-Texturen im Voraus für alle Typen
    // Diese können wir sofort verwenden, während die eigentlichen Texturen laden
    const fallbackTextures = {};
    for (const [name, path] of Object.entries(textureFiles)) {
      fallbackTextures[name] = this.createFallbackTexture(name);
      // Nutze die Fallback-Textur als vorläufige Textur, während die eigentliche lädt
      this.textures[name] = fallbackTextures[name];
    }
    
    // Lade alle Texturen mit verbessertem Error-Handling
    const loadPromises = Object.entries(textureFiles).map(([name, path]) => {
      return new Promise((resolve) => {
        // Protokolliere den Ladeprozess
        console.log(`Loading texture: ${name} from ${path}`);
        
        this.textureLoader.load(
          path,
          (texture) => {
            // Konfiguriere die geladene Textur für Pixel-Art-Darstellung
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
            texture.needsUpdate = true;
            
            // Aktualisiere Textur im Cache
            this.textures[name] = texture;
            console.log(`Successfully loaded texture: ${name}`);
            resolve();
          },
          (progressEvent) => {
            // Fortschritt verarbeiten (optional)
            if (progressEvent.lengthComputable) {
              const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              console.log(`Loading ${name}: ${percentage}%`);
            }
          },
          (error) => {
            console.warn(`Error loading texture: ${path}`, error);
            console.warn(`Using fallback for: ${name}`);
            
            // Benutze die bereits erstellte Fallback-Textur
            this.textures[name] = fallbackTextures[name];
            resolve();
          }
        );
      });
    });
    
    await Promise.all(loadPromises);
    
    const endTime = performance.now();
    console.log(`Loaded all textures in ${Math.round(endTime - startTime)}ms`);
  }
  
  async generatePlaceholderTextures() {
    // Für Entwicklung erstellen wir Platzhalter-Texturen mit einfachen Farben und Mustern
    console.log('Ready to generate placeholder textures if needed');
  }
  
  createFallbackTexture(name) {
    // Erstelle einen Canvas mit einem farbigen Muster basierend auf dem Namen
    const canvas = document.createElement('canvas');
    canvas.width = 64; // Größere Auflösung für bessere Qualität
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Wähle Farbe basierend auf Namen
    let colors = {
      primary: '#FF00FF', // Standard Magenta für fehlende Texturen
      secondary: '#CCCCCC' // Hellgrau für Kontrast
    };
    
    // Setze Farben basierend auf Texturtyp
    if (name.includes('grass')) colors = { primary: '#4CAF50', secondary: '#81C784' };
    if (name.includes('water')) colors = { primary: '#2196F3', secondary: '#64B5F6' };
    if (name.includes('stone')) colors = { primary: '#9E9E9E', secondary: '#E0E0E0' };
    if (name.includes('wall')) colors = { primary: '#795548', secondary: '#A1887F' };
    if (name.includes('player')) colors = { primary: '#FFEB3B', secondary: '#FFF59D' };
    if (name.includes('zombie')) colors = { primary: '#8BC34A', secondary: '#AED581' };
    if (name.includes('bullet')) colors = { primary: '#FF5722', secondary: '#FF8A65' };
    if (name.includes('blood')) colors = { primary: '#F44336', secondary: '#E57373' };
    if (name.includes('tree')) colors = { primary: '#33691E', secondary: '#558B2F' };
    
    // Fülle Hintergrund
    ctx.fillStyle = colors.primary;
    ctx.fillRect(0, 0, 64, 64);
    
    // Wähle ein passendes Muster basierend auf Texturtyp
    if (name.includes('water')) {
      // Wellenartiges Muster für Wasser
      ctx.fillStyle = colors.secondary;
      for (let y = 0; y < 64; y += 8) {
        // Wellen-Muster
        ctx.beginPath();
        ctx.moveTo(0, y + 4 + Math.sin(y * 0.1) * 2);
        
        for (let x = 0; x < 64; x += 4) {
          ctx.lineTo(x, y + 4 + Math.sin((x + y) * 0.1) * 2);
        }
        
        ctx.lineTo(64, y);
        ctx.lineTo(0, y);
        ctx.closePath();
        ctx.fill();
      }
    } else if (name.includes('stone') || name.includes('wall')) {
      // Steinartiges Muster
      ctx.fillStyle = colors.secondary;
      for (let y = 0; y < 64; y += 16) {
        for (let x = (y % 32 === 0) ? 0 : 8; x < 64; x += 16) {
          ctx.fillRect(x, y, 8, 8);
        }
      }
    } else if (name.includes('grass')) {
      // Grasartiges Muster
      ctx.fillStyle = colors.secondary;
      for (let y = 0; y < 64; y += 8) {
        for (let x = 0; x < 64; x += 8) {
          if (Math.random() > 0.7) {
            ctx.fillRect(x, y, 2, 4); // Grashalme
          }
        }
      }
    } else if (name.includes('tree')) {
      // Baumstruktur
      ctx.fillStyle = colors.secondary;
      if (name === 'tree') { // Baumkrone
        ctx.beginPath();
        ctx.arc(32, 32, 24, 0, Math.PI * 2);
        ctx.fill();
      } else { // Baumstamm
        ctx.fillRect(24, 8, 16, 48);
      }
    } else {
      // Standard-Pixelmuster für andere Texturen
      ctx.fillStyle = colors.secondary;
      for (let y = 0; y < 64; y += 8) {
        for (let x = (y % 16 === 0) ? 0 : 8; x < 64; x += 16) {
          ctx.fillRect(x, y, 8, 8);
        }
      }
    }
    
    // Erstelle Textur aus Canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter; // Pixeliges Aussehen für Pixel-Art
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }
  
  getTexture(name) {
    if (!this.textures[name]) {
      console.warn(`Texture '${name}' not found, creating fallback on-demand`);
      this.textures[name] = this.createFallbackTexture(name);
    }
    return this.textures[name];
  }
} 