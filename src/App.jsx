import { useState, useEffect } from 'react';
import GalleryComponent from './components/Gallery';

function App() {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch('/media-manifest.json');
        const data = await response.json();
        setMediaFiles(data);
      } catch (error) {
        console.error('Error loading media manifest:', error);
        setMediaFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen flex-col gap-6 bg-gradient-to-b from-black via-red-950/20 to-black">
        <div className="w-12 h-12 border-4 border-red-900 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-gray-400 text-lg">Loading gallery...</p>
      </div>
    );
  }

  return <GalleryComponent items={mediaFiles} />;
}

export default App;
