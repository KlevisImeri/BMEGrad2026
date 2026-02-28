import { useState, useEffect } from 'react';

export default function HintPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    }, 500);

    return () => clearTimeout(showTimer);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="bg-black/80 text-white px-6 py-4 rounded-lg text-base backdrop-blur-sm shadow-lg pointer-events-auto flex flex-col gap-2 text-center">
        <p>Click thumbnails for high resolution images.</p>
        <p className="text-gray-300 text-sm">For super high res, contact me at <a href="https://aboutme.klevis.xyz/" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-400">https://aboutme.klevis.xyz/</a></p>
        <p className="text-gray-400 text-xs">© 2026 Klevis Imeri. All rights reserved.</p>
      </div>
    </div>
  );
}
