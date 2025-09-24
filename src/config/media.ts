// Media URL configuration for environment-based asset serving
const MEDIA_BASE_URL = import.meta.env.PROD 
  ? 'https://storage.googleapis.com/karlsbayer-portfolio-media/assets'
  : '/astro-portfolio/assets';

export { MEDIA_BASE_URL };
