#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Get all media files in public/assets/projects
async function getAllMediaFiles() {
  const assetsDir = path.join(projectRoot, 'public', 'assets', 'projects');
  const mediaFiles = [];
  
  try {
    const projects = await fs.readdir(assetsDir);
    
    for (const project of projects) {
      const projectPath = path.join(assetsDir, project);
      const stat = await fs.stat(projectPath);
      
      if (stat.isDirectory()) {
        const files = await fs.readdir(projectPath);
        for (const file of files) {
          const filePath = path.join(projectPath, file);
          const fileStat = await fs.stat(filePath);
          
          if (fileStat.isFile()) {
            const relativePath = path.relative(path.join(projectRoot, 'public'), filePath);
            mediaFiles.push({
              project,
              filename: file,
              fullPath: filePath,
              relativePath: `/${relativePath}`,
              size: fileStat.size
            });
          }
        }
      }
    }
  } catch (error) {
    log(`Error reading assets directory: ${error.message}`, 'red');
    return [];
  }
  
  return mediaFiles;
}

// Get all referenced media files from content
async function getReferencedMediaFiles() {
  const referencedFiles = new Set();
  
  // Search in MDX files
  const contentDir = path.join(projectRoot, 'src', 'content', 'projects');
  
  try {
    const mdxFiles = await fs.readdir(contentDir);
    
    for (const mdxFile of mdxFiles) {
      if (mdxFile.endsWith('.mdx')) {
        const filePath = path.join(contentDir, mdxFile);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Find all asset references
        const assetMatches = content.match(/\/astro-portfolio\/assets\/projects\/[^"'\s)]+/g);
        if (assetMatches) {
          assetMatches.forEach(match => {
            referencedFiles.add(match);
          });
        }
      }
    }
  } catch (error) {
    log(`Error reading content files: ${error.message}`, 'red');
  }
  
  return referencedFiles;
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Ask user for confirmation
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

// Ensure unused directory exists
async function ensureUnusedDir() {
  const unusedDir = path.join(projectRoot, 'draft_projects', 'unused');
  try {
    await fs.access(unusedDir);
  } catch {
    await fs.mkdir(unusedDir, { recursive: true });
    log(`📁 Created unused directory: ${unusedDir}`, 'cyan');
  }
  return unusedDir;
}

// Main function
async function main() {
  log('🔍 Scanning for unused media files...', 'cyan');
  
  const allMediaFiles = await getAllMediaFiles();
  const referencedFiles = await getReferencedMediaFiles();
  
  log(`\n📊 Found ${allMediaFiles.length} total media files`, 'blue');
  log(`📊 Found ${referencedFiles.size} referenced files`, 'blue');
  
  // Debug: show some referenced files
  if (referencedFiles.size > 0) {
    log(`\n🔍 Sample referenced files:`, 'cyan');
    Array.from(referencedFiles).slice(0, 5).forEach(file => {
      log(`  • ${file}`, 'cyan');
    });
  }
  
  // Find unused files
  const unusedFiles = allMediaFiles.filter(file => {
    // Check if this file is referenced
    const isReferenced = Array.from(referencedFiles).some(refPath => {
      return refPath.includes(file.filename);
    });
    return !isReferenced;
  });
  
  if (unusedFiles.length === 0) {
    log('\n✅ No unused media files found!', 'green');
    return;
  }
  
  log(`\n🗑️  Found ${unusedFiles.length} unused media files:`, 'yellow');
  
  // Group by project
  const unusedByProject = {};
  let totalSize = 0;
  
  unusedFiles.forEach(file => {
    if (!unusedByProject[file.project]) {
      unusedByProject[file.project] = [];
    }
    unusedByProject[file.project].push(file);
    totalSize += file.size;
  });
  
  // Display unused files
  for (const [project, files] of Object.entries(unusedByProject)) {
    log(`\n📁 ${project}:`, 'magenta');
    files.forEach(file => {
      log(`  • ${file.filename} (${formatFileSize(file.size)})`, 'red');
    });
  }
  
  log(`\n💾 Total size to be moved: ${formatFileSize(totalSize)}`, 'yellow');
  
  // Ask for confirmation
  const shouldPurge = await askConfirmation('\n❓ Do you want to move these unused files to draft_projects/unused? (y/N): ');
  
  if (!shouldPurge) {
    log('\n❌ Purge cancelled.', 'yellow');
    return;
  }
  
  // Ensure unused directory exists
  const unusedDir = await ensureUnusedDir();
  
  // Move files
  log('\n📦 Moving unused files to draft_projects/unused...', 'yellow');
  let movedCount = 0;
  let movedSize = 0;
  
  for (const file of unusedFiles) {
    try {
      // Create subdirectory structure in unused folder
      const projectUnusedDir = path.join(unusedDir, file.project);
      await fs.mkdir(projectUnusedDir, { recursive: true });
      
      // Move file to unused directory
      const targetPath = path.join(projectUnusedDir, file.filename);
      await fs.rename(file.fullPath, targetPath);
      
      log(`  ✅ Moved: ${file.project}/${file.filename}`, 'green');
      movedCount++;
      movedSize += file.size;
    } catch (error) {
      log(`  ❌ Failed to move ${file.filename}: ${error.message}`, 'red');
    }
  }
  
  log(`\n🎉 Purge complete!`, 'green');
  log(`📊 Moved ${movedCount} files to draft_projects/unused`, 'green');
  log(`💾 Freed ${formatFileSize(movedSize)} of space`, 'green');
  log(`\n💡 Files can be restored by moving them back from draft_projects/unused/`, 'cyan');
}

// Run the script
main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
