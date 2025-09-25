#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_NAME = 'laser_pottery';
const PROJECT_TITLE = 'Laser Pottery';
const PROJECT_BLURB = 'Experimental pottery techniques using laser cutting and engraving';
const PROJECT_DATE = '2017-2018';
const PROJECT_SORT_ORDER = 3;
const PROJECT_STATUS = 'complete';
const PROJECT_FEATURED = false;

// Paths
const ASSETS_DIR = path.join(__dirname, '..', 'public', 'assets', 'projects', PROJECT_NAME);
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'content', 'projects', `${PROJECT_NAME}.mdx`);

// Supported media extensions
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm'];

function getMediaType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
  return null;
}

function generateAltText(filename) {
  return `${PROJECT_NAME} - ${filename}`;
}

function generateMDXContent(files) {
  // Sort files by name (which should be chronological based on timestamps)
  const sortedFiles = files.sort();
  
  // Find the first image for thumbnail
  const thumbnailFile = sortedFiles.find(file => getMediaType(file) === 'image');
  const thumbnail = thumbnailFile ? `/astro-portfolio/assets/projects/${PROJECT_NAME}/${thumbnailFile}` : '';
  
  // Generate media entries
  const mediaEntries = sortedFiles.map(filename => {
    const mediaType = getMediaType(filename);
    if (!mediaType) return null;
    
    return `  - type: ${mediaType}
    src: "/astro-portfolio/assets/projects/${PROJECT_NAME}/${filename}"
    alt: "${generateAltText(filename)}"
    caption: "${filename}"`;
  }).filter(Boolean);
  
  // Generate the MDX content
  const mdxContent = `---
title: "${PROJECT_TITLE}"
blurb: "${PROJECT_BLURB}"
date: "${PROJECT_DATE}"
sortOrder: ${PROJECT_SORT_ORDER}
thumbnail: "${thumbnail}"
template: "gallery"
status: "${PROJECT_STATUS}"
featured: ${PROJECT_FEATURED}
media:
${mediaEntries.join('\n')}
links: []
---

# ${PROJECT_TITLE}

${PROJECT_BLURB}

This project explores the intersection of traditional pottery techniques with modern laser cutting and engraving technology. The laser allows for precise patterns and textures that would be difficult to achieve by hand.

## Process

The laser pottery process involves:
- Creating ceramic pieces using traditional throwing or hand-building techniques
- Designing patterns digitally for laser cutting/engraving
- Using a laser cutter to create precise cuts or surface engravings
- Firing the pieces with traditional ceramic glazes

## Results

The combination of organic ceramic forms with precise laser-cut patterns creates unique pieces that blend traditional craftsmanship with modern technology.
`;

  return mdxContent;
}

function main() {
  try {
    // Check if assets directory exists
    if (!fs.existsSync(ASSETS_DIR)) {
      console.error(`Assets directory not found: ${ASSETS_DIR}`);
      process.exit(1);
    }
    
    // Read all files in the assets directory
    const files = fs.readdirSync(ASSETS_DIR)
      .filter(file => {
        const mediaType = getMediaType(file);
        return mediaType !== null;
      });
    
    if (files.length === 0) {
      console.error(`No media files found in ${ASSETS_DIR}`);
      process.exit(1);
    }
    
    console.log(`Found ${files.length} media files:`);
    files.forEach(file => {
      const mediaType = getMediaType(file);
      console.log(`  ${mediaType}: ${file}`);
    });
    
    // Generate MDX content
    const mdxContent = generateMDXContent(files);
    
    // Write to output file
    fs.writeFileSync(OUTPUT_FILE, mdxContent);
    
    console.log(`\n✅ Generated gallery MDX file: ${OUTPUT_FILE}`);
    console.log(`📁 Contains ${files.length} media items`);
    
  } catch (error) {
    console.error('Error generating gallery:', error);
    process.exit(1);
  }
}

// Run the script
main();
