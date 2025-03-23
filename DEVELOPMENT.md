# Development Workflow

This document outlines the development environment and workflow for the Pixel Zombie Shooter project.

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- npm (v6 or later)

### Setup
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

## Development

### Development Server
Start the development server with hot module reloading:
```
npm run dev
```

This will start a local server on port 3000 and open the game in your default browser.

### Code Formatting & Linting
The project uses ESLint and Prettier for code quality and formatting.

- Check for linting issues:
  ```
  npm run lint
  ```

- Fix linting issues automatically:
  ```
  npm run lint:fix
  ```

- Format code with Prettier:
  ```
  npm run format
  ```

- Run both linting and formatting:
  ```
  npm run check
  ```

## Project Structure

```
pixel-zombie-shooter/
├── assets/           # Static assets (if any)
├── public/           # Public files
├── src/              # Source code
│   ├── js/           # JavaScript code
│   │   ├── game/     # Game logic
│   │   │   ├── entities/  # Game entities (player, enemies)
│   │   │   ├── managers/  # Game systems (input, zombies, culling)
│   │   │   ├── ui/        # User interface components
│   │   │   └── world/     # World generation
│   │   └── utils/    # Utility functions
│   └── index.js      # Entry point
├── .eslintrc.json    # ESLint configuration
├── .prettierrc.json  # Prettier configuration
├── package.json      # Dependencies and scripts
└── vite.config.js    # Vite configuration
```

## Build & Deployment

### Building for Production
Build the project for production:
```
npm run build
```

This creates optimized files in the `dist` directory.

### Previewing the Production Build
Preview the production build locally:
```
npm run preview
```

## Asset Pipeline

The game uses a custom AssetLoader that generates textures programmatically. Future versions may support loading external assets.

### Adding New Textures
1. Create a new texture generation method in `src/js/utils/AssetLoader.js`
2. Add the texture to the creation list in the `createTextures()` method

## Performance Considerations

1. Use the CullingManager for efficient rendering
2. Dispose of unused THREE.js objects to prevent memory leaks
3. Use object pooling for frequently created/destroyed objects
4. Implement LOD (Level of Detail) for complex models
5. Consider using texture atlases for related textures 