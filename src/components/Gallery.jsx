import { useState, useEffect, useRef, useMemo } from 'react';
import 'photoswipe/dist/photoswipe.css';
import { Gallery, Item } from 'react-photoswipe-gallery';

const ITEM_MIN_WIDTH = 280;
const GAP = 24;

function getColumnCount(containerWidth) {
  if (!containerWidth) return 4;
  return Math.max(1, Math.floor((containerWidth + GAP) / (ITEM_MIN_WIDTH + GAP)));
}

function LazyImage({ src, alt, className }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`${className} bg-gray-800 ${!isLoaded ? 'animate-pulse' : ''}`}>
      {isInView && (
        <img 
          src={src} 
          alt={alt}
          loading="lazy"
          onLoad={(e) => {
            e.target.classList.remove('opacity-0');
            setIsLoaded(true);
          }}
          className={`${className} object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
}

export default function GalleryComponent({ items }) {
  const parentRef = useRef(null);
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const updateColumns = () => {
      if (parentRef.current) {
        setColumns(getColumnCount(parentRef.current.offsetWidth));
      }
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const columnWidth = useMemo(() => {
    return `calc(${100 / columns}% - ${GAP * (columns - 1) / columns}px)`;
  }, [columns]);

  if (!items.length) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] flex-col gap-4">
        <p className="text-gray-400">No media files found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen p-3 md:p-6 max-w-[1800px] mx-auto">
      <header className="flex-shrink-0 bg-gradient-to-r from-black/80 via-red-900/40 to-black/80 backdrop-blur-sm rounded-2xl py-3 px-3 md:py-6 md:px-6 mb-3 md:mb-6 border border-red-900/30">
        <div className="flex items-center justify-center gap-2 md:gap-4 lg:gap-6">
          <span className="text-2xl md:text-4xl lg:text-6xl" role="img" aria-label="Albania">🇦🇱</span>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent tracking-wide">
            BMEGrad2026
          </h1>
          <span className="text-2xl md:text-4xl lg:text-6xl" role="img" aria-label="Kosovo">🇽🇰</span>
        </div>
        <p className="text-gray-400 text-sm md:text-lg mt-1 md:mt-2 text-center">{items.length} media files</p>
      </header>

      <div ref={parentRef} className="flex-1 overflow-auto">
        <Gallery
          withDownloadButton
          options={{ 
            bgOpacity: 0.9, 
          }}
        >
          <div className="flex flex-wrap" style={{ gap: `${GAP}px` }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  width: columnWidth,
                  aspectRatio: '1/1',
                }}
              >
                <Item
                  original={item.original}
                  thumbnail={item.thumbnail}
                  width={item.width}
                  height={item.height}
                >
                  {({ ref, open }) => (
                    <div 
                      ref={ref}
                      onClick={open}
                      className="w-full h-full relative overflow-hidden rounded-lg md:rounded-xl cursor-pointer bg-gray-900 border border-red-900/30 md:border-2 md:border-red-900/30 shadow-lg shadow-black/50 transition-all duration-300 hover:scale-105 hover:border-red-600/60 hover:shadow-red-900/40 hover:shadow-2xl"
                    >
                      <LazyImage 
                        src={item.thumbnail} 
                        alt={item.filename}
                        className="w-full h-full"
                      />
                      {item.type === 'video' && (
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-red-600 to-red-700 text-white px-2 py-1 md:px-4 md:py-2 rounded text-xs md:text-sm font-semibold shadow-lg">Video</span>
                      )}
                    </div>
                  )}
                </Item>
              </div>
            ))}
          </div>
        </Gallery>
      </div>
    </div>
  );
}
