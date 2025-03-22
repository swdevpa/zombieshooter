const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Main installation function
async function install() {
  // console.log('Installing Pixel Zombie Shooter dependencies...');
  
  // Install NPM packages
  try {
    // console.log('Installing NPM packages...');
    await runCommand('npm', ['install']);
    // console.log('NPM packages installed successfully!');
  } catch (error) {
    // console.error('Error installing NPM packages:', error.message);
    process.exit(1);
  }
  
  // Create necessary directories
  createDirectories();
  
  // Installation complete message
  // console.log('Installation complete! Run "npm run dev" to start the development server.');
}

// Create necessary directories if they don't exist
function createDirectories() {
  const dirs = [
    'assets',
    'assets/textures',
    'assets/models',
    'assets/audio'
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      // console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Run command helper function
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit' });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

// Run installation
install(); 