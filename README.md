# Astro Portfolio

A modern, responsive portfolio site built with Astro and MDX. Features a dark theme, multiple layout templates, and Google Cloud Storage media hosting.

## 🚀 Quick Start

### First Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Pull media assets:**
   ```bash
   npm run media:pull
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Visit `http://localhost:4321/astro-portfolio` to see your portfolio!

### Build & Deploy

```bash
npm run build    # Build for production
npm run preview  # Preview production build locally
```

## 📁 Project Structure

```
/
├── draft_projects/          # Your raw project folders
│   ├── project-name/
│   │   ├── image1.jpg       # Media files
│   │   └── video1.mp4
├── src/
│   ├── content/
│   │   ├── config.ts        # Content collection schema
│   │   └── projects/        # MDX project files
│   ├── components/
│   │   ├── ProjectCard.astro
│   │   └── templates/       # Layout templates
│   ├── layouts/
│   │   └── ProjectLayout.astro
│   └── pages/
│       ├── index.astro      # Portfolio grid
│       ├── projects/[slug].astro
│       ├── resume.astro
│       └── contact.astro
├── scripts/
│   ├── ingest-projects.mjs # Project media processing script
│   └── compress-media.mjs  # Media compression utilities
└── public/assets/           # Media files (synced from GCS)
```

## 🎨 Customization

### Setting Contact Information

Edit `src/pages/contact.astro`:
```javascript
const contactInfo = {
  email: "your.email@example.com",
  instagram: "https://instagram.com/yourusername",
  linkedin: "https://linkedin.com/in/yourusername"
};
```

### Setting Resume Link

Edit `src/pages/resume.astro`:
```javascript
const resumeUrl = "https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing";
```

### Theming

Customize CSS variables in any component:
```css
:root {
  --accent-color: #3b82f6;     /* Primary accent color */
  --card-radius: 0.5rem;       /* Border radius */
  --grid-gap: 1rem;            /* Grid spacing */
  --card-min-width: 300px;     /* Minimum card width */
}
```

## 📝 Content Management

### Project Templates

The system supports 5 template types:

- **`default`**: Standard layout with media grid
- **`gallery`**: Image-focused masonry layout
- **`videoFirst`**: Hero video with additional media
- **`caseStudy`**: Structured sections for technical projects
- **`minimal`**: Clean typography-focused layout

### Media Processing Scripts

```bash
# Process media from draft projects
npm run ingest

# Process specific project
npm run ingest -- --only=project-name

# Dry run (see what would happen)
npm run ingest -- --dry-run

# Force overwrite existing files
npm run ingest -- --force

# Append new media to existing project
npm run ingest -- --append --only=project-name

# Get help
npm run ingest -- --help
```

### Manual Content Creation

Create MDX files in `src/content/projects/`:

```markdown
---
title: "My Project"
blurb: "Short description"
date: "2024-01-15"
template: "default"
status: "complete"
featured: false
media:
  - type: image
    src: "/astro-portfolio/assets/projects/my-project/image.jpg"
    alt: "Project image"
links:
  - label: "GitHub"
    url: "https://github.com/user/repo"
    type: "github"
---

# My Project

Your project content here...
```

## 🛠 Development

### Adding New Templates

1. Create template component in `src/components/templates/`
2. Add template option to schema in `src/content/config.ts`
3. Update `ProjectLayout.astro` to include new template

### Extending the Schema

Edit `src/content/config.ts` to add new fields:

```typescript
schema: z.object({
  // ... existing fields
  newField: z.string().optional(),
})
```

## 📸 Media Management

This project uses Google Cloud Storage for media hosting in production while maintaining fast local development.

### Setup
1. **Configure GCS bucket:**
   ```bash
   gsutil mb gs://your-portfolio-media
   gsutil iam ch allUsers:objectViewer gs://your-portfolio-media
   ```

2. **Pull media for local development:**
   ```bash
   npm run media:pull
   ```

### Workflow
- **Local development**: Media served from `public/assets/projects/` (fast)
- **Production**: Media served from GCS (scalable)
- **Sync changes**: `npm run media:push` (upload) or `npm run media:sync` (pull + push)

### Commands
- `npm run media:pull` - Download all assets from GCS to local
- `npm run media:push` - Upload all local assets to GCS  
- `npm run media:sync` - Pull latest, then push changes
- `npm run dev:setup` - Pull assets and start dev server

### Benefits
- **Fast local dev**: Assets served locally during development
- **Clean repo**: No large media files in GitHub
- **Flexible workflow**: Easy to sync changes back and forth
- **Production optimized**: GCS delivery in production

## 📄 License

MIT License - feel free to use this for your own portfolio!