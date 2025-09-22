import { defineCollection, z } from 'astro:content';

const projectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    // Core required fields
    title: z.string(),
    blurb: z.string().optional(), // Short description for cards
    description: z.string(), // Main project description
    
    // Date handling (manual specification)
    date: z.string().optional(), // Any text format (e.g., "2024", "Spring 2024", "January 2024")
    
    // Sorting priority (lower numbers appear first)
    sortOrder: z.number().optional(), // Used for custom ordering, fallback to slug if not provided
    
    // Media & assets
    thumbnail: z.string().optional(), // Path to thumbnail image
    media: z.array(z.object({
      type: z.enum(['image', 'video', 'gif']),
      src: z.string(),
      alt: z.string().optional(),
      caption: z.string().optional()
    })).optional(),
    
    // External links
    links: z.array(z.object({
      label: z.string(),
      url: z.string().url(),
      type: z.enum(['github', 'instagram', 'website', 'other']).optional()
    })).optional(),
    
    // Layout template
    template: z.enum(['default', 'gallery', 'videoFirst', 'caseStudy', 'minimal']).default('default'),
    
    // Template-specific fields (discriminated union)
    heroVideo: z.string().optional(), // For videoFirst template
    galleryImages: z.array(z.string()).optional(), // For gallery template
    caseStudySections: z.array(z.object({
      title: z.string(),
      content: z.string()
    })).optional(), // For caseStudy template
    
    // Status & metadata
    status: z.enum(['complete', 'wip', 'draft']).default('complete'),
    featured: z.boolean().default(false)
  })
});

export const collections = {
  projects: projectsCollection
};
