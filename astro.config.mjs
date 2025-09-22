// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  integrations: [mdx()],
  site: 'https://kotton21.github.io/astro-portfolio-fresh/', // Your GitHub Pages URL
  base: process.env.NODE_ENV === 'production' ? '/astro-portfolio-fresh/' : '/', // Only use base path in production
  vite: {
    build: {
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash][extname]'
        }
      }
    }
  }
});
