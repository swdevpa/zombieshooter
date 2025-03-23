import * as THREE from 'three';

/**
 * ZombieTextureAtlas - Manages generation and caching of zombie textures
 * Creates procedural textures for zombie models when needed
 */
export class ZombieTextureAtlas {
  constructor() {
    // Store textures in cache
    this.textureCache = {
      standard: {},
      runner: {},
      brute: {}
    };
    
    // Default texture resolution
    this.textureResolution = 256;
  }
  
  /**
   * Get or create texture for zombie body
   * @param {string} type - Zombie type (standard, runner, brute)
   * @param {number} variation - Variation of zombie (0-3)
   * @returns {THREE.Texture} Generated texture
   */
  getBodyTexture(type = 'standard', variation = 0) {
    const key = `body_${variation}`;
    
    // Check if texture exists in cache
    if (this.textureCache[type] && this.textureCache[type][key]) {
      return this.textureCache[type][key];
    }
    
    // Create new texture
    const texture = this.generateBodyTexture(type, variation);
    
    // Store in cache
    if (!this.textureCache[type]) {
      this.textureCache[type] = {};
    }
    this.textureCache[type][key] = texture;
    
    return texture;
  }
  
  /**
   * Get or create texture for zombie head
   * @param {string} type - Zombie type (standard, runner, brute)
   * @param {number} variation - Variation of zombie (0-3)
   * @returns {THREE.Texture} Generated texture
   */
  getHeadTexture(type = 'standard', variation = 0) {
    const key = `head_${variation}`;
    
    // Check if texture exists in cache
    if (this.textureCache[type] && this.textureCache[type][key]) {
      return this.textureCache[type][key];
    }
    
    // Create new texture
    const texture = this.generateHeadTexture(type, variation);
    
    // Store in cache
    if (!this.textureCache[type]) {
      this.textureCache[type] = {};
    }
    this.textureCache[type][key] = texture;
    
    return texture;
  }
  
  /**
   * Generate procedural body texture
   */
  generateBodyTexture(type, variation) {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureResolution;
    canvas.height = this.textureResolution;
    
    const ctx = canvas.getContext('2d');
    
    // Base color based on zombie type
    let baseColor;
    switch (type) {
      case 'runner':
        baseColor = '#aed581'; // Lighter green
        break;
      case 'brute':
        baseColor = '#558b2f'; // Darker green
        break;
      case 'standard':
      default:
        baseColor = '#8bc34a'; // Standard green
        break;
    }
    
    // Fill with base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add details based on variation
    this.addBodyDetails(ctx, type, variation);
    
    // Add damage and decay
    this.addZombieDecay(ctx, type);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
  }
  
  /**
   * Generate procedural head texture
   */
  generateHeadTexture(type, variation) {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureResolution;
    canvas.height = this.textureResolution;
    
    const ctx = canvas.getContext('2d');
    
    // Base color based on zombie type, but slightly paler for face
    let baseColor;
    switch (type) {
      case 'runner':
        baseColor = '#c5e1a5'; // Paler green
        break;
      case 'brute':
        baseColor = '#689f38'; // Slightly paler than body
        break;
      case 'standard':
      default:
        baseColor = '#9ccc65'; // Paler green
        break;
    }
    
    // Fill with base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add face details based on variation
    this.addFaceDetails(ctx, type, variation);
    
    // Add damage and decay
    this.addZombieDecay(ctx, type);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
  }
  
  /**
   * Add body details to texture
   */
  addBodyDetails(ctx, type, variation) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Add tears and damage to clothing
    ctx.fillStyle = '#4b4b4b'; // Dark color for tears
    
    // Different tear patterns based on variation
    for (let i = 0; i < 10 + variation * 5; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 5 + Math.random() * 15;
      
      // Random tear shape
      if (Math.random() > 0.5) {
        ctx.fillRect(x, y, size, size / 3);
      } else {
        ctx.fillRect(x, y, size / 3, size);
      }
    }
    
    // Add blood stains
    ctx.fillStyle = 'rgba(153, 0, 0, 0.7)'; // Dark red with transparency
    
    for (let i = 0; i < 5 + variation * 2; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 10 + Math.random() * 30;
      
      // Create blood splatter
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add drip effect
      if (Math.random() > 0.5) {
        const dripLength = size + Math.random() * 50;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.random() * 10 - 5, y + dripLength);
        ctx.lineWidth = 3 + Math.random() * 5;
        ctx.strokeStyle = 'rgba(153, 0, 0, 0.7)';
        ctx.stroke();
      }
    }
    
    // Add dirt and grime
    ctx.fillStyle = 'rgba(74, 45, 27, 0.3)'; // Brown with transparency
    
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 5 + Math.random() * 20;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * Add face details to texture
   */
  addFaceDetails(ctx, type, variation) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Draw eyes
    ctx.fillStyle = '#800000'; // Dark red eyes
    
    // Left eye
    const leftEyeX = width * 0.3;
    const eyeY = height * 0.4;
    const eyeWidth = width * 0.15;
    const eyeHeight = height * 0.05;
    
    ctx.fillRect(leftEyeX, eyeY, eyeWidth, eyeHeight);
    
    // Right eye
    const rightEyeX = width * 0.55;
    ctx.fillRect(rightEyeX, eyeY, eyeWidth, eyeHeight);
    
    // Draw mouth - jagged and open
    ctx.fillStyle = '#4d0000'; // Dark red/black
    ctx.beginPath();
    ctx.moveTo(width * 0.3, height * 0.6);
    
    // Jagged mouth with random points
    let x = width * 0.3;
    const mouthEnd = width * 0.7;
    const mouthY = height * 0.6;
    const teethHeight = height * 0.15;
    
    while (x < mouthEnd) {
      // Draw jagged teeth
      x += width * 0.05;
      ctx.lineTo(x, mouthY - Math.random() * teethHeight);
      
      x += width * 0.05;
      if (x < mouthEnd) {
        ctx.lineTo(x, mouthY + Math.random() * teethHeight);
      }
    }
    
    ctx.lineTo(mouthEnd, mouthY);
    ctx.lineTo(mouthEnd, mouthY + height * 0.1);
    ctx.lineTo(width * 0.3, mouthY + height * 0.1);
    ctx.closePath();
    ctx.fill();
    
    // Add blood from mouth
    ctx.fillStyle = 'rgba(153, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.moveTo(width * 0.4, mouthY + height * 0.1);
    ctx.lineTo(width * 0.45, mouthY + height * 0.25);
    ctx.lineTo(width * 0.5, mouthY + height * 0.1);
    ctx.fill();
    
    // Add wound details based on type
    if (type === 'brute') {
      // Brutes have more scars and wounds
      this.addScars(ctx, 5);
    } else if (type === 'runner') {
      // Runners have fewer but more distinct wounds
      this.addScars(ctx, 2);
    } else {
      // Standard zombies have average wounds
      this.addScars(ctx, 3);
    }
  }
  
  /**
   * Add scars to face
   */
  addScars(ctx, count) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    ctx.strokeStyle = '#aa0000';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < count; i++) {
      const x1 = Math.random() * width;
      const y1 = Math.random() * height;
      const length = 20 + Math.random() * 40;
      const angle = Math.random() * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(
        x1 + Math.cos(angle) * length,
        y1 + Math.sin(angle) * length
      );
      ctx.stroke();
    }
  }
  
  /**
   * Add decay effects common to all zombie textures
   */
  addZombieDecay(ctx, type) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Add discoloration patches
    ctx.fillStyle = 'rgba(90, 120, 70, 0.5)'; // Green/gray with transparency
    
    // Different types have different decay levels
    let patchCount = 10;
    if (type === 'runner') {
      patchCount = 5; // Less decay (fresher zombies)
    } else if (type === 'brute') {
      patchCount = 15; // More decay
    }
    
    for (let i = 0; i < patchCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 10 + Math.random() * 30;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add texture noise for a more detailed, gritty look
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Add random noise to pixels
    for (let i = 0; i < data.length; i += 4) {
      // Vary each pixel by a small amount
      const noise = Math.random() * 20 - 10;
      
      data[i] = Math.max(0, Math.min(255, data[i] + noise)); // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  /**
   * Create a texture atlas containing all zombie variations
   * This can be used instead of individual textures for better performance
   */
  createTextureAtlas() {
    // This would combine all textures into a single atlas
    // Not implemented yet - would be a performance optimization
  }
  
  /**
   * Generate normal map for zombie textures
   * Adds depth to the texture for more realistic rendering
   */
  generateNormalMap(baseTexture) {
    // This would generate a normal map from the base texture
    // Not implemented yet - would enhance visual quality
  }
} 