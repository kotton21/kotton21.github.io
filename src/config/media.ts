// Media URL configuration for environment-based asset serving
// Use GCS for both production builds and preview mode (which serves built files)
// In dev mode, assets are served from /assets since base is set to /
const MEDIA_BASE_URL = (import.meta.env.PROD || import.meta.env.MODE === 'preview')
  ? 'https://storage.googleapis.com/karlsbayer-portfolio-media/assets'
  : '/assets';

export { MEDIA_BASE_URL };
