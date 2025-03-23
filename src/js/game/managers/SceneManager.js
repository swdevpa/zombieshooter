import * as THREE from 'three';

export class SceneManager {
  constructor(game) {
    this.game = game;
    this.objects = [];
    this.collidableObjects = [];
    this.cullingObjects = [];
  }

  init() {
    return this;
  }

  addObject(object) {
    this.objects.push(object);
    this.game.scene.add(object);
    return object;
  }

  addCollidableObject(object) {
    this.collidableObjects.push(object);
    if (!this.objects.includes(object)) {
      this.addObject(object);
    }
    return object;
  }

  addCullingObject(object) {
    this.cullingObjects.push(object);
    if (!this.objects.includes(object)) {
      this.addObject(object);
    }
    return object;
  }

  removeObject(object) {
    const index = this.objects.indexOf(object);
    if (index !== -1) {
      this.objects.splice(index, 1);
      this.game.scene.remove(object);
    }

    // Also remove from other arrays if present
    const collidableIndex = this.collidableObjects.indexOf(object);
    if (collidableIndex !== -1) {
      this.collidableObjects.splice(collidableIndex, 1);
    }

    const cullingIndex = this.cullingObjects.indexOf(object);
    if (cullingIndex !== -1) {
      this.cullingObjects.splice(cullingIndex, 1);
    }
  }

  getCollidableObjects() {
    return this.collidableObjects;
  }

  getCullingObjects() {
    return this.cullingObjects;
  }

  update(deltaTime) {
    // Update logic for scene objects if needed
  }

  clear() {
    // Remove all objects from the scene
    for (const object of this.objects) {
      this.game.scene.remove(object);
    }
    this.objects = [];
    this.collidableObjects = [];
    this.cullingObjects = [];
  }
} 