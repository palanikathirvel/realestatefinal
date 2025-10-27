/**
 * Utility functions for handling property images
 */

/**
 * Get the image source URL from a property image
 * Handles both string URLs and object images with url property
 * @param {string|object} img - The image (string URL or object with url property)
 * @returns {string} The image URL
 */
export const getImageSrc = (img) => {
  if (!img) return 'https://via.placeholder.com/300x200?text=No+Image';

  if (typeof img === 'object' && img.base64) return img.base64;

  const src = typeof img === 'object' ? (img.url || img.name || img.filename) : img;

  if (!src) return 'https://via.placeholder.com/300x200?text=No+Image';

  // If it's already a full URL or base64, return it
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }

  // Otherwise, construct the full URL using the API base URL
  const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.split('/api')[0] : 'http://localhost:5000';
  return `${baseUrl}/uploads/${src}`;
};

/**
 * Get the video source URL from a property video
 * Handles base64 strings and objects with base64 property
 * @param {string|object} video - The video (base64 string or object with base64 property)
 * @returns {string} The video URL or placeholder
 */
export const getVideoSrc = (video) => {
  if (!video) return 'https://via.placeholder.com/300x200?text=No+Video';

  console.log('Processing video:', typeof video, video);

  // If it's a base64 string, assume MP4 format
  if (typeof video === 'string' && video.startsWith('data:video/')) {
    console.log('Video is base64 data URL');
    return video;
  }

  // If it's an object with base64 property
  if (typeof video === 'object' && video.base64) {
    const mimeType = video.mimeType || 'video/mp4';
    console.log('Video is object with base64, mimeType:', mimeType);

    // Check if base64 already includes data URL prefix
    if (video.base64.startsWith('data:video/')) {
      console.log('Video base64 already has data URL prefix');
      return video.base64;
    }

    return `data:${mimeType};base64,${video.base64}`;
  }

  // If it's a plain base64 string, assume MP4
  if (typeof video === 'string' && /^[A-Za-z0-9+/=]+$/.test(video)) {
    console.log('Video is plain base64 string');
    return `data:video/mp4;base64,${video}`;
  }

  // If it's an object with url property (fallback to URL handling like images)
  const src = typeof video === 'object' ? (video.url || video.name || video.filename) : video;
  if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
    console.log('Video is URL:', src);
    return src;
  }

  // Otherwise, construct the full URL using the API base URL (for uploaded videos)
  const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.split('/api')[0] : 'http://localhost:5000';
  const fullUrl = `${baseUrl}/uploads/${src}`;
  console.log('Constructed video URL:', fullUrl);
  return fullUrl;
};

/**
 * Get the first image from a property's images array
 * @param {Array} images - Array of property images
 * @returns {string} The first image URL or placeholder
 */
export const getFirstImage = (images) => {
  if (!images || images.length === 0) {
    return 'https://via.placeholder.com/300x200?text=No+Image';
  }

  return getImageSrc(images[0]);
};
