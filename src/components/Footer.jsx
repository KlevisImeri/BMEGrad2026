export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-black/80 text-gray-300 text-sm py-3 px-4 text-center backdrop-blur-sm flex flex-col gap-1">
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
    </footer>
  );
}
