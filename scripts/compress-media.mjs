#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ASSETS_DIR = 'public/assets/projects';

// Check if ffmpeg is installed
function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Compress video files
function compressVideo(inputPath, outputPath) {
  try {
    console.log(`Compressing video: ${path.basename(inputPath)}`);
    execSync(`ffmpeg -i "${inputPath}" -c:v libx264 -crf 28 -c:a aac -b:a 128k -movflags +faststart "${outputPath}"`, { stdio: 'pipe' });
    
    const originalSize = fs.statSync(inputPath).size;
    const compressedSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ ${path.basename(inputPath)}: ${(originalSize/1024/1024).toFixed(1)}MB → ${(compressedSize/1024/1024).toFixed(1)}MB (${savings}% smaller)`);
    
    // Replace original with compressed version
    fs.unlinkSync(inputPath);
    fs.renameSync(outputPath, inputPath);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to compress ${inputPath}:`, error.message);
    // Clean up temp file if it exists
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    return false;
  }
}

// Compress image files
function compressImage(inputPath, outputPath) {
  try {
    console.log(`Compressing image: ${path.basename(inputPath)}`);
    execSync(`ffmpeg -i "${inputPath}" -vf "scale=1920:-1" -q:v 3 "${outputPath}"`, { stdio: 'pipe' });
    
    const originalSize = fs.statSync(inputPath).size;
    const compressedSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ ${path.basename(inputPath)}: ${(originalSize/1024/1024).toFixed(1)}MB → ${(compressedSize/1024/1024).toFixed(1)}MB (${savings}% smaller)`);
    
    // Replace original with compressed version
    fs.unlinkSync(inputPath);
    fs.renameSync(outputPath, inputPath);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to compress ${inputPath}:`, error.message);
    // Clean up temp file if it exists
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    return false;
  }
}

// Main compression function
function compressMedia() {
  if (!checkFFmpeg()) {
    console.error('❌ ffmpeg is not installed. Please install it first:');
    console.error('   macOS: brew install ffmpeg');
    console.error('   Ubuntu: sudo apt install ffmpeg');
    console.error('   Windows: Download from https://ffmpeg.org/');
    process.exit(1);
  }

  console.log('🔧 Starting media compression...\n');

  let totalOriginalSize = 0;
  let totalCompressedSize = 0;
  let filesProcessed = 0;

  // Walk through all project directories
  const projectDirs = fs.readdirSync(ASSETS_DIR);
  
  for (const projectDir of projectDirs) {
    const projectPath = path.join(ASSETS_DIR, projectDir);
    if (!fs.statSync(projectPath).isDirectory()) continue;

    console.log(`\n📁 Processing ${projectDir}:`);
    
    const files = fs.readdirSync(projectPath);
    
    for (const file of files) {
      const filePath = path.join(projectPath, file);
      const ext = path.extname(file).toLowerCase();
      
      if (['.mp4', '.mov', '.avi'].includes(ext)) {
        const originalSize = fs.statSync(filePath).size;
        totalOriginalSize += originalSize;
        
        if (compressVideo(filePath, filePath.replace(/\.[^/.]+$/, '_compressed.mp4'))) {
          totalCompressedSize += fs.statSync(filePath).size;
          filesProcessed++;
        }
      } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        const originalSize = fs.statSync(filePath).size;
        totalOriginalSize += originalSize;
        
        if (compressImage(filePath, filePath.replace(/\.[^/.]+$/, '_compressed.jpg'))) {
          totalCompressedSize += fs.statSync(filePath).size;
          filesProcessed++;
        }
      }
    }
  }

  console.log('\n📊 Compression Summary:');
  console.log(`Files processed: ${filesProcessed}`);
  console.log(`Original size: ${(totalOriginalSize/1024/1024).toFixed(1)}MB`);
  console.log(`Compressed size: ${(totalCompressedSize/1024/1024).toFixed(1)}MB`);
  console.log(`Total savings: ${(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100).toFixed(1)}%`);
}

compressMedia();
