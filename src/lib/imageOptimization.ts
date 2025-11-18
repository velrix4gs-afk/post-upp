// Image optimization utilities for responsive, optimized images with WebP/AVIF support

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  resize?: 'contain' | 'cover' | 'fill';
}

/**
 * Generate Supabase storage transformation URL
 * https://supabase.com/docs/guides/storage/serving/image-transformations
 */
export const getOptimizedImageUrl = (
  storageUrl: string,
  options: ImageTransformOptions = {}
): string => {
  if (!storageUrl || !storageUrl.includes('supabase')) {
    return storageUrl;
  }

  const { width, height, quality = 80, format = 'webp', resize = 'cover' } = options;

  try {
    const url = new URL(storageUrl);
    const params = new URLSearchParams();

    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    params.append('quality', quality.toString());
    params.append('format', format);
    params.append('resize', resize);

    url.search = params.toString();
    return url.toString();
  } catch {
    return storageUrl;
  }
};

/**
 * Generate srcset for responsive images
 */
export const generateSrcSet = (
  storageUrl: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string => {
  return widths
    .map(width => {
      const url = getOptimizedImageUrl(storageUrl, { width, format: 'webp' });
      return `${url} ${width}w`;
    })
    .join(', ');
};

/**
 * Generate picture element sources with WebP/AVIF fallback
 */
export const generatePictureSources = (
  storageUrl: string,
  width?: number
): Array<{ srcSet: string; type: string }> => {
  return [
    {
      srcSet: getOptimizedImageUrl(storageUrl, { width, format: 'avif' }),
      type: 'image/avif'
    },
    {
      srcSet: getOptimizedImageUrl(storageUrl, { width, format: 'webp' }),
      type: 'image/webp'
    }
  ];
};

/**
 * Check if browser supports modern image formats
 */
export const getSupportedFormat = (): 'avif' | 'webp' | 'jpeg' => {
  const canvas = document.createElement('canvas');
  
  if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
    return 'avif';
  }
  
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'webp';
  }
  
  return 'jpeg';
};

/**
 * Preload critical images
 */
export const preloadImage = (src: string, as: 'image' = 'image') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = src;
  document.head.appendChild(link);
};

/**
 * Lazy load images with Intersection Observer
 */
export const lazyLoadImages = (selector: string = 'img[loading="lazy"]') => {
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading supported
    return;
  }

  // Fallback for older browsers
  const images = document.querySelectorAll<HTMLImageElement>(selector);
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const dataSrc = img.dataset.src;
        
        if (dataSrc) {
          img.src = dataSrc;
          img.removeAttribute('data-src');
        }
        
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
};
