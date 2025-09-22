#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const isScanOnly = args.includes('--scan-only');
const isDryRun = args.includes('--dry-run');
const forceOverwrite = args.includes('--force');
const onlyProjects = args.filter(arg => arg.startsWith('--only')).map(arg => arg.split('=')[1]);
const matchPattern = args.find(arg => arg.startsWith('--match'))?.split('=')[1];
const sinceDate = args.find(arg => arg.startsWith('--since'))?.split('=')[1];

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

function parseDescription(content) {
  const lines = content.split('\n');
  const frontmatter = {};
  let description = '';
  let inFrontmatter = false;
  
  // Check for YAML frontmatter
  if (lines[0]?.startsWith('title:')) {
    inFrontmatter = true;
    for (const line of lines) {
      if (line.trim() === '') {
        inFrontmatter = false;
        continue;
      }
      if (inFrontmatter) {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          frontmatter[key.trim()] = valueParts.join(':').trim();
        }
      } else {
        description += line + '\n';
      }
    }
  } else {
    description = content;
  }
  
  return { frontmatter, description: description.trim() };
}

function extractLinks(text) {
  const links = [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const githubRegex = /github\.com\/[^\s]+/g;
  const instagramRegex = /instagram\.com\/[^\s]+/g;
  
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[1];
    let type = 'other';
    let label = url;
    
    if (url.includes('github.com')) {
      type = 'github';
      label = 'GitHub';
    } else if (url.includes('instagram.com')) {
      type = 'instagram';
      label = 'Instagram';
    }
    
    links.push({ label, url, type });
  }
  
  return links;
}

async function scanProject(folderPath, folderName) {
  try {
    const files = await fs.readdir(folderPath);
    const descriptionFile = files.find(f => f === 'description.md');
    
    if (!descriptionFile) {
      log(`No description.md found in ${folderName}`, 'warn');
      return null;
    }
    
    const descriptionPath = path.join(folderPath, descriptionFile);
    const descriptionContent = await fs.readFile(descriptionPath, 'utf-8');
    const { frontmatter, description } = parseDescription(descriptionContent);
    
    // Get media files
    const mediaFiles = files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov', '.gif'].includes(ext);
    }).sort();
    
    const media = mediaFiles.map(file => ({
      type: getMediaType(file),
      src: `/assets/projects/${folderName}/${file}`,
      alt: `${folderName} - ${file}`,
      caption: ''
    }));
    
    // Extract links from description
    const links = extractLinks(description);
    
    // Determine template based on content (respect existing template if specified)
    let template = frontmatter.template || 'default';
    if (!frontmatter.template) {
      // Only auto-assign template if not manually specified
      if (media.length > 5 && media.filter(m => m.type === 'image').length > 3) {
        template = 'gallery';
      } else if (media.filter(m => m.type === 'video').length > 0) {
        template = 'videoFirst';
      } else if (description.includes('github.com') || description.includes('technical')) {
        template = 'caseStudy';
      } else if (media.length === 0) {
        template = 'minimal';
      }
    }
    
    return {
      slug: folderName,
      title: frontmatter.title || folderName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      blurb: frontmatter.blurb || '',
      description: description,
      date: frontmatter.date || '', // Placeholder as requested
      sortOrder: frontmatter.sortOrder || undefined, // Custom sorting priority
      thumbnail: media.length > 0 ? media[0].src : undefined,
      media: media,
      links: links,
      template: template,
      status: description.toLowerCase().includes('wip') ? 'wip' : (description.length < 50 ? 'draft' : 'complete'),
      featured: false
    };
  } catch (error) {
    log(`Error scanning ${folderName}: ${error.message}`, 'error');
    return null;
  }
}

async function ingestProject(projectData, folderPath) {
  if (isDryRun) {
    log(`[DRY RUN] Would ingest project: ${projectData.title}`, 'info');
    return;
  }
  
  const { slug, media } = projectData;
  const targetDir = path.join(projectRoot, 'public', 'assets', 'projects', slug);
  const contentDir = path.join(projectRoot, 'src', 'content', 'projects');
  const mdxPath = path.join(contentDir, `${slug}.mdx`);
  
  try {
    // Create target directory
    await fs.mkdir(targetDir, { recursive: true });
    
    // Copy media files
    for (const mediaItem of media) {
      const sourceFile = path.join(folderPath, path.basename(mediaItem.src));
      const targetFile = path.join(targetDir, path.basename(mediaItem.src));
      
      try {
        await fs.copyFile(sourceFile, targetFile);
        log(`Copied ${path.basename(mediaItem.src)}`, 'success');
      } catch (error) {
        log(`Failed to copy ${path.basename(mediaItem.src)}: ${error.message}`, 'warn');
      }
    }
    
    // Generate MDX content
    const frontmatter = `---
title: "${projectData.title.replace(/"/g, '\\"')}"
blurb: "${projectData.blurb || ''}"
description: "${projectData.description.replace(/"/g, '\\"')}"
date: "${projectData.date || ''}"
sortOrder: ${projectData.sortOrder || ''}
thumbnail: "${projectData.thumbnail || ''}"
template: "${projectData.template}"
status: "${projectData.status}"
featured: ${projectData.featured}
media: ${media.length > 0 ? `
${media.map(m => `  - type: ${m.type}
    src: "${m.src}"
    alt: "${m.alt}"
    caption: "${m.caption || ''}"`).join('\n')}` : '[]'}
links: ${projectData.links && projectData.links.length > 0 ? `
${projectData.links.map(l => `  - label: "${l.label}"
    url: "${l.url}"
    type: "${l.type || 'other'}"`).join('\n')}` : '[]'}
---

${projectData.description}
`;

    // Check if MDX already exists
    const mdxExists = await fs.access(mdxPath).then(() => true).catch(() => false);
    
    if (mdxExists && !forceOverwrite) {
      log(`MDX file already exists for ${slug}. Use --force to overwrite.`, 'warn');
      return;
    }
    
    // Write MDX file
    await fs.writeFile(mdxPath, frontmatter);
    log(`Created MDX file: ${slug}.mdx`, 'success');
    
  } catch (error) {
    log(`Error ingesting ${slug}: ${error.message}`, 'error');
  }
}

async function main() {
  log('Starting project ingestion...', 'info');
  
  const draftProjectsDir = path.join(projectRoot, 'draft_projects');
  
  try {
    const folders = await fs.readdir(draftProjectsDir);
    const projectFolders = folders.filter(f => {
      const folderPath = path.join(draftProjectsDir, f);
      return fs.stat(folderPath).then(stats => stats.isDirectory()).catch(() => false);
    });
    
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
      
      const projectData = await scanProject(folderPath, folder);
      if (projectData) {
        projects.push({ data: projectData, path: folderPath });
      }
    }
    
    if (isScanOnly) {
      log('\n=== SCAN RESULTS ===', 'info');
      projects.forEach(({ data }) => {
        log(`\nProject: ${data.title}`, 'info');
        log(`  Slug: ${data.slug}`, 'info');
        log(`  Template: ${data.template}`, 'info');
        log(`  Status: ${data.status}`, 'info');
        log(`  Media: ${data.media.length} files`, 'info');
        log(`  Links: ${data.links.length} links`, 'info');
        if (data.blurb) log(`  Blurb: ${data.blurb}`, 'info');
      });
      
      log('\n=== TEMPLATE RECOMMENDATIONS ===', 'info');
      const templateCounts = projects.reduce((acc, { data }) => {
        acc[data.template] = (acc[data.template] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(templateCounts).forEach(([template, count]) => {
        log(`${template}: ${count} projects`, 'info');
      });
      
    } else {
      log(`\nIngesting ${projects.length} projects...`, 'info');
      
      for (const { data, path } of projects) {
        await ingestProject(data, path);
      }
      
      log(`\n✅ Successfully processed ${projects.length} projects!`, 'success');
      log('Run `npm run dev` to see your portfolio.', 'info');
    }
    
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Project Ingest Script

Usage:
  npm run scan                    # Scan projects and show recommendations
  npm run ingest                  # Ingest all projects
  npm run ingest -- --only=arcade # Ingest specific project(s)
  npm run ingest -- --dry-run     # Show what would be done without writing
  npm run ingest -- --force       # Overwrite existing MDX files

Options:
  --scan-only                     # Only scan, don't write files
  --dry-run                       # Show what would be done
  --force                         # Overwrite existing MDX files
  --only=<name>                   # Only process specific project(s)
  --match="<pattern>"             # Only process projects matching pattern
  --since="<YYYY-MM-DD>"          # Only process projects modified since date
  --help, -h                      # Show this help
`);
  process.exit(0);
}

main().catch(console.error);
