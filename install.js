const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Print welcome message
console.log('Installing Pixel Zombie Shooter dependencies...');

// Install npm dependencies
try {
  console.log('Installing NPM packages...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('NPM packages installed successfully!');
} catch (error) {
  console.error('Error installing NPM packages:', error.message);
  process.exit(1);
}

// Create necessary directories if they don't exist
const directories = [
  'public/assets/textures/terrain',
  'public/assets/textures/characters',
  'public/assets/textures/effects'
];

directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

console.log('Installation complete! Run "npm run dev" to start the development server.'); 