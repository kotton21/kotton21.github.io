// Media URL configuration for environment-based asset serving
// Use GCS for both production builds and preview mode (which serves built files)
const MEDIA_BASE_URL = (import.meta.env.PROD || import.meta.env.MODE === 'preview')
  ? 'https://storage.googleapis.com/karlsbayer-portfolio-media/assets'
  : '/astro-portfolio/assets';

export { MEDIA_BASE_URL };
