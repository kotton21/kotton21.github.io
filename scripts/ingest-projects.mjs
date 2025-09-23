#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const forceOverwrite = args.includes('--force');
const appendMode = args.includes('--append');
const skipCompression = args.includes('--skip-compression');
const onlyProjects = args.filter(arg => arg.startsWith('--only')).map(arg => arg.split('=')[1]);
const matchPattern = args.find(arg => arg.startsWith('--match'))?.split('=')[1];

// Helper functions
function log(message, type = 'info') {
  const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} ${message}`);
}

function getMediaType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 'image';
  if (['.mp4', '.webm', '.mov'].includes(ext)) return 'video';
  if (['.gif'].includes(ext)) return 'gif';
  return 'unknown';
}

function getImageFiles(files) {
  return files.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  }).sort();
}

// Compression functions
function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function compressVideo(inputPath, outputPath) {
  try {
    log(`Compressing video: ${path.basename(inputPath)}`, 'info');
    execSync(`ffmpeg -i "${inputPath}" -c:v libx264 -crf 28 -c:a aac -b:a 128k -movflags +faststart "${outputPath}"`, { stdio: 'pipe' });
    
    const originalStats = await fs.stat(inputPath);
    const compressedStats = await fs.stat(outputPath);
    const savings = ((originalStats.size - compressedStats.size) / originalStats.size * 100).toFixed(1);
    
    log(`${path.basename(inputPath)}: ${(originalStats.size/1024/1024).toFixed(1)}MB → ${(compressedStats.size/1024/1024).toFixed(1)}MB (${savings}% smaller)`, 'success');
    
    // Replace original with compressed version
    await fs.unlink(inputPath);
    await fs.rename(outputPath, inputPath);
    
    return true;
  } catch (error) {
    log(`Failed to compress ${inputPath}: ${error.message}`, 'warn');
    // Clean up temp file if it exists
    try {
      await fs.unlink(outputPath);
    } catch {}
    return false;
  }
}

async function compressImage(inputPath, outputPath) {
  try {
    log(`Compressing image: ${path.basename(inputPath)}`, 'info');
    execSync(`ffmpeg -i "${inputPath}" -vf "scale=1920:-1" -q:v 3 "${outputPath}"`, { stdio: 'pipe' });
    
    const originalStats = await fs.stat(inputPath);
    const compressedStats = await fs.stat(outputPath);
    const savings = ((originalStats.size - compressedStats.size) / originalStats.size * 100).toFixed(1);
    
    log(`${path.basename(inputPath)}: ${(originalStats.size/1024/1024).toFixed(1)}MB → ${(compressedStats.size/1024/1024).toFixed(1)}MB (${savings}% smaller)`, 'success');
    
    // Replace original with compressed version
    await fs.unlink(inputPath);
    await fs.rename(outputPath, inputPath);
    
    return true;
  } catch (error) {
    log(`Failed to compress ${inputPath}: ${error.message}`, 'warn');
    // Clean up temp file if it exists
    try {
      await fs.unlink(outputPath);
    } catch {}
    return false;
  }
}

async function compressMediaFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (['.mp4', '.mov', '.avi'].includes(ext)) {
    const tempPath = filePath.replace(/\.[^/.]+$/, '_compressed.mp4');
    return await compressVideo(filePath, tempPath);
  } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
    const tempPath = filePath.replace(/\.[^/.]+$/, '_compressed.jpg');
    return await compressImage(filePath, tempPath);
  }
  
  return false;
}

async function createGifFromImages(imagePaths, outputPath) {
  try {
    log(`Creating GIF from ${imagePaths.length} images`, 'info');
    
    // Create a temporary file list for ffmpeg
    const tempListPath = outputPath.replace('.gif', '_list.txt');
    const fileList = imagePaths.map(imgPath => `file '${imgPath}'\nduration 0.5`).join('\n');
    await fs.writeFile(tempListPath, fileList);
    
    // Create GIF with ffmpeg using simpler approach
    execSync(`ffmpeg -f concat -safe 0 -i "${tempListPath}" -vf "fps=2,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -y "${outputPath}"`, { stdio: 'pipe' });
    
    // Clean up temp file
    await fs.unlink(tempListPath);
    
    log(`Created GIF: ${path.basename(outputPath)}`, 'success');
    return true;
  } catch (error) {
    log(`Failed to create GIF: ${error.message}`, 'warn');
    // Clean up temp file on error
    try {
      await fs.unlink(tempListPath);
    } catch {}
    return false;
  }
}

async function processProject(folderPath, folderName) {
  try {
    const files = await fs.readdir(folderPath);
    
    // Get all media files in root folder
    const mediaFiles = files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov', '.gif'].includes(ext);
    }).sort();
    
    // Find subfolders
    const subfolders = [];
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        subfolders.push(file);
      }
    }
    
    return {
      slug: folderName,
      mediaFiles,
      subfolders
    };
  } catch (error) {
    log(`Error processing ${folderName}: ${error.message}`, 'error');
    return null;
  }
}

async function processProjectMedia(projectData, folderPath) {
  if (isDryRun) {
    log(`[DRY RUN] Would process project: ${projectData.slug}`, 'info');
    return;
  }
  
  const { slug, mediaFiles, subfolders } = projectData;
  const targetDir = path.join(projectRoot, 'public', 'assets', 'projects', slug);
  
  try {
    // Check if project already exists
    const targetExists = await fs.access(targetDir).then(() => true).catch(() => false);
    
    if (targetExists && !forceOverwrite && !appendMode) {
      log(`Project ${slug} already exists. Use --force to overwrite or --append to add files.`, 'warn');
      return;
    }
    
    if (appendMode && !targetExists) {
      log(`Project ${slug} doesn't exist yet. Use without --append to create it first.`, 'warn');
      return;
    }
    
    // Create target directory
    await fs.mkdir(targetDir, { recursive: true });
    
    // Check if ffmpeg is available for compression
    const canCompress = !skipCompression && checkFFmpeg();
    if (!skipCompression && !canCompress) {
      log('ffmpeg not found. Media files will be copied without compression. Use --skip-compression to suppress this warning.', 'warn');
    }
    
    // Process media files in root folder
    for (const mediaFile of mediaFiles) {
      const sourceFile = path.join(folderPath, mediaFile);
      const targetFile = path.join(targetDir, mediaFile);
      
      // In append mode, skip files that already exist
      if (appendMode) {
        const fileExists = await fs.access(targetFile).then(() => true).catch(() => false);
        if (fileExists) {
          log(`Skipping existing file: ${mediaFile}`, 'info');
          continue;
        }
      }
      
      try {
        // Copy the file
        await fs.copyFile(sourceFile, targetFile);
        log(`Copied ${mediaFile}`, 'success');
        
        // Compress if enabled and ffmpeg is available
        if (canCompress) {
          const compressed = await compressMediaFile(targetFile);
          if (compressed) {
            log(`Compressed ${mediaFile}`, 'success');
          }
        }
      } catch (error) {
        log(`Failed to copy ${mediaFile}: ${error.message}`, 'warn');
      }
    }
    
    // Process subfolders - create GIFs from image sequences
    for (const subfolder of subfolders) {
      const subfolderPath = path.join(folderPath, subfolder);
      const subfolderFiles = await fs.readdir(subfolderPath);
      const imageFiles = getImageFiles(subfolderFiles);
      
      if (imageFiles.length > 1) {
        // Create GIF from image sequence
        const gifName = `${subfolder}.gif`;
        const gifPath = path.join(targetDir, gifName);
        
        // In append mode, skip if GIF already exists
        if (appendMode) {
          const gifExists = await fs.access(gifPath).then(() => true).catch(() => false);
          if (gifExists) {
            log(`Skipping existing GIF: ${gifName}`, 'info');
            continue;
          }
        }
        
        const imagePaths = imageFiles.map(img => path.join(subfolderPath, img));
        
        if (canCompress) {
          await createGifFromImages(imagePaths, gifPath);
        } else {
          log(`Skipping GIF creation for ${subfolder} (ffmpeg not available)`, 'warn');
        }
      } else if (imageFiles.length === 1) {
        // Single image - just copy it
        const sourceFile = path.join(subfolderPath, imageFiles[0]);
        const targetFile = path.join(targetDir, `${subfolder}_${imageFiles[0]}`);
        
        // In append mode, skip if file already exists
        if (appendMode) {
          const fileExists = await fs.access(targetFile).then(() => true).catch(() => false);
          if (fileExists) {
            log(`Skipping existing file: ${subfolder}/${imageFiles[0]}`, 'info');
            continue;
          }
        }
        
        try {
          await fs.copyFile(sourceFile, targetFile);
          log(`Copied ${subfolder}/${imageFiles[0]}`, 'success');
          
          if (canCompress) {
            const compressed = await compressMediaFile(targetFile);
            if (compressed) {
              log(`Compressed ${subfolder}/${imageFiles[0]}`, 'success');
            }
          }
        } catch (error) {
          log(`Failed to copy ${subfolder}/${imageFiles[0]}: ${error.message}`, 'warn');
        }
      }
    }
    
    log(`✅ Processed project: ${slug}`, 'success');
    
  } catch (error) {
    log(`Error processing ${slug}: ${error.message}`, 'error');
  }
}

async function main() {
  log('Starting project media processing...', 'info');
  
  const draftProjectsDir = path.join(projectRoot, 'draft_projects');
  
  try {
    const folders = await fs.readdir(draftProjectsDir);
    const projectFolders = [];
    
    // Filter to only directories
    for (const folder of folders) {
      const folderPath = path.join(draftProjectsDir, folder);
      const stats = await fs.stat(folderPath);
      if (stats.isDirectory()) {
        projectFolders.push(folder);
      }
    }
    
    // Filter projects based on arguments
    let filteredFolders = projectFolders;
    
    if (onlyProjects.length > 0) {
      filteredFolders = projectFolders.filter(f => onlyProjects.includes(f));
    }
    
    if (matchPattern) {
      const regex = new RegExp(matchPattern);
      filteredFolders = filteredFolders.filter(f => regex.test(f));
    }
    
    log(`Found ${filteredFolders.length} project folders to process`, 'info');
    
    const projects = [];
    
    for (const folder of filteredFolders) {
      const folderPath = path.join(draftProjectsDir, folder);
      
      // Skip empty folders
      const files = await fs.readdir(folderPath).catch(() => []);
      if (files.length === 0) {
        log(`Skipping empty folder: ${folder}`, 'warn');
        continue;
      }
      
      const projectData = await processProject(folderPath, folder);
      if (projectData) {
        projects.push({ data: projectData, path: folderPath });
      }
    }
    
    if (isDryRun) {
      log('\n=== DRY RUN RESULTS ===', 'info');
      projects.forEach(({ data }) => {
        log(`\nProject: ${data.slug}`, 'info');
        log(`  Media files: ${data.mediaFiles.length}`, 'info');
        log(`  Subfolders: ${data.subfolders.length}`, 'info');
        data.subfolders.forEach(subfolder => {
          log(`    - ${subfolder}`, 'info');
        });
      });
    } else {
      log(`\nProcessing ${projects.length} projects...`, 'info');
      
      for (const { data, path } of projects) {
        await processProjectMedia(data, path);
      }
      
      log(`\n✅ Successfully processed ${projects.length} projects!`, 'success');
      log('Media files are now available in public/assets/projects/', 'info');
    }
    
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Project Media Processing Script

Usage:
  npm run ingest                   # Process all projects with compression
  npm run ingest -- --only=arcade # Process specific project(s)
  npm run ingest -- --dry-run     # Show what would be done without writing
  npm run ingest -- --append      # Add new files to existing projects
  npm run ingest -- --skip-compression # Skip media compression

Options:
  --dry-run                       # Show what would be done
  --force                         # Overwrite existing projects
  --append                        # Add new files to existing projects (skip existing files)
  --skip-compression              # Skip media compression (requires ffmpeg)
  --only=<name>                   # Only process specific project(s)
  --match="<pattern>"             # Only process projects matching pattern
  --help, -h                      # Show this help

What it does:
  - Copies media files from draft_projects/ to public/assets/projects/
  - Compresses images and videos using ffmpeg
  - Creates GIFs from image sequences in subfolders
  - No description.md files required
  - Append mode: Only adds new files, skips existing ones

Media Compression:
  - Videos: Compressed with H.264 (CRF 28) and AAC audio
  - Images: Resized to max 1920px width with quality optimization
  - GIFs: Created from image sequences at 2fps, 800px max width
  - Requires ffmpeg to be installed
  - Use --skip-compression to disable
`);
  process.exit(0);
}

main().catch(console.error);
