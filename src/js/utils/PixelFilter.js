import * as THREE from 'three';

export class PixelFilter {
  constructor(renderer, scene, camera, resolution = 3) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.resolution = resolution; // Higher value = more pixelated
    
    this.setupRenderTarget();
    this.setupPostProcess();
  }
  
  setupRenderTarget() {
    // Get renderer size
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    
    // Create a render target with lower resolution
    this.renderTarget = new THREE.WebGLRenderTarget(
      size.width / this.resolution,
      size.height / this.resolution,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        stencilBuffer: false,
        depthBuffer: true,
        type: THREE.UnsignedByteType,
        encoding: THREE.sRGBEncoding,
        samples: 4
      }
    );
    
    // Create a second render target for temporal smoothing
    this.prevRenderTarget = new THREE.WebGLRenderTarget(
      size.width / this.resolution,
      size.height / this.resolution,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        stencilBuffer: false,
        depthBuffer: true,
        type: THREE.UnsignedByteType,
        encoding: THREE.sRGBEncoding,
        samples: 4
      }
    );
    
    // Factor for temporal smoothing (0-1, higher = less smoothing)
    this.temporalSmoothingFactor = 0.6;
  }
  
  setupPostProcess() {
    // Create ortho camera
    this.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    // Create scene
    this.postScene = new THREE.Scene();
    
    // Create temporal smoothing material
    const smoothingMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tCurrent: { value: this.renderTarget.texture },
        tPrevious: { value: this.prevRenderTarget.texture },
        blendFactor: { value: this.temporalSmoothingFactor }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tCurrent;
        uniform sampler2D tPrevious;
        uniform float blendFactor;
        varying vec2 vUv;
        
        void main() {
          vec4 current = texture2D(tCurrent, vUv);
          vec4 previous = texture2D(tPrevious, vUv);
          gl_FragColor = mix(previous, current, blendFactor);
        }
      `
    });
    
    // Create quad with the temporal smoothing material
    this.quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      smoothingMaterial
    );
    this.postScene.add(this.quad);
  }
  
  render() {
    // First render to the low-res render target
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    
    // Apply temporal smoothing
    const temp = this.renderTarget;
    this.renderTarget = this.prevRenderTarget;
    this.prevRenderTarget = temp;
    
    // Update the uniforms
    this.quad.material.uniforms.tCurrent.value = this.prevRenderTarget.texture;
    this.quad.material.uniforms.tPrevious.value = this.renderTarget.texture;
    
    // Render to screen with temporal smoothing
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postScene, this.orthoCamera);
  }
  
  resize() {
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    
    this.renderTarget.setSize(
      size.width / this.resolution,
      size.height / this.resolution
    );
    
    this.prevRenderTarget.setSize(
      size.width / this.resolution,
      size.height / this.resolution
    );
  }
} 