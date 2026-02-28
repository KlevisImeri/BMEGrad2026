import { useState, useEffect } from 'react';

export default function MessageBar() {
  const [position, setPosition] = useState('center');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fadeInTimer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    const moveTimer = setTimeout(() => {
      setPosition('bottom');
    }, 5000);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(moveTimer);
    };
  }, []);

  return (
    <div
      className={`fixed left-0 right-0 z-[9999] flex justify-center px-4 transition-all duration-1000 ${
        position === 'center' 
          ? 'top-1/2 -translate-y-1/2' 
          : 'bottom-0'
      }`}
    >
      <div 
        className={`bg-black/80 text-gray-300 text-sm py-3 px-4 text-center backdrop-blur-sm flex flex-col gap-1 shadow-lg pointer-events-auto transition-opacity duration-300 ${
          position === 'center' 
            ? 'rounded-lg' 
            : 'rounded-t-lg md:rounded-t-xl md:rounded-b-lg'
        } ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <p>Click thumbnails for high resolution images.</p>
        <p className="text-gray-400">
          For super high res, contact me at{' '}
          <a 
            href="https://aboutme.klevis.xyz/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="underline hover:text-red-400"
          >
            https://aboutme.klevis.xyz/
          </a>
        </p>
        <p className="text-gray-500 text-xs">© 2026 Klevis Imeri. All rights reserved.</p>
      </div>
    </div>
  );
}
