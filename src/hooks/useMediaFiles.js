import { useState, useEffect } from 'react';

const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov'];

function getFileType(filename) {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) return 'video';
  return null;
}

function getThumbnailUrl(filename) {
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  return `/thumbnails/${nameWithoutExt}_thumb.jpg`;
}

function getOriginalUrl(filename) {
  return `/${filename}`;
}

export function useMediaFiles() {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch('/');
        const text = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const allLinks = doc.querySelectorAll('a[href]');
        
        const files = [];
        const seen = new Set();
        
        allLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href && !href.startsWith('http') && !href.startsWith('?') && !href.startsWith('#')) {
            const filename = href.replace(/^\//, '');
            const fileType = getFileType(filename);
            
            if (fileType && !seen.has(filename)) {
              seen.add(filename);
              files.push({
                id: filename,
                filename,
                type: fileType,
                thumbnail: getThumbnailUrl(filename),
                original: getOriginalUrl(filename),
              });
            }
          }
        });
        
        const sortedFiles = files.sort((a, b) => 
          a.filename.localeCompare(b.filename, undefined, { numeric: true })
        );
        
        setMediaFiles(sortedFiles);
      } catch (error) {
        console.error('Error fetching media files:', error);
        setMediaFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, []);

  return { mediaFiles, loading };
}

export async function getImageDimensions(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      resolve({ width: 1200, height: 800 });
    };
    img.src = url;
  });
}
