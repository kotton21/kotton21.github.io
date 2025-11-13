import { MEDIA_BASE_URL } from '../config/media';

/**
 * Helper function to get the full media URL
 * Handles both dev mode (/assets) and production (GCS) URLs
 */
export function getMediaUrl(src: string): string {
	// If src already starts with http or is a full URL, return as-is
	if (src.startsWith('http') || src.startsWith('//')) {
		return src;
	}
	// If src starts with /astro-portfolio/assets, replace with MEDIA_BASE_URL
	if (src.startsWith('/astro-portfolio/assets')) {
		return src.replace('/astro-portfolio/assets', MEDIA_BASE_URL);
	}
	// If src starts with /assets, handle based on mode
	if (src.startsWith('/assets')) {
		// In dev mode, MEDIA_BASE_URL is /assets, so return path as-is
		if (MEDIA_BASE_URL === '/assets') {
			return src;
		}
		// In prod mode, replace /assets with GCS base URL
		return src.replace('/assets', MEDIA_BASE_URL);
	}
	// Otherwise, prepend MEDIA_BASE_URL
	return `${MEDIA_BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
}

