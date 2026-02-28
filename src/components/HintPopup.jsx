import { useState, useEffect } from 'react';

export default function HintPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      
      setTimeout(() => {
        setIsVisible(false);
      }, 1500);
    }, 500);

    return () => clearTimeout(showTimer);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="bg-black/80 text-white px-6 py-3 rounded-lg text-base backdrop-blur-sm shadow-lg pointer-events-auto">
        Click thumbnails for high resolution images.
      </div>
    </div>
  );
}
