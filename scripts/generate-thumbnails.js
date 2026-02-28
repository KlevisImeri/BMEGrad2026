import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const THUMBNAILS_DIR = path.join(PUBLIC_DIR, 'thumbnails');

const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov'];
const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 300;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) return 'video';
  return null;
}

async function generateThumbnail(inputPath, outputPath) {
  try {
    const ext = path.extname(inputPath).toLowerCase();
    
    if (ext === '.png') {
      await sharp(inputPath)
        .resize(THUMBNAIL_WIDTH, null, { withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
    } else {
      await sharp(inputPath)
        .resize(THUMBNAIL_WIDTH, null, { withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
    }
    console.log(`  ✓ Generated: ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`  ✗ Failed: ${inputPath} - ${error.message}`);
  }
}

async function generateVideoPlaceholder(outputPath) {
  try {
    await sharp({
      create: {
        width: THUMBNAIL_WIDTH,
        height: THUMBNAIL_HEIGHT,
        channels: 3,
        background: { r: 60, g: 60, b: 60 }
      }
    })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
    console.log(`  ✓ Generated: ${path.basename(outputPath)} (video placeholder)`);
  } catch (error) {
    console.error(`  ✗ Failed video placeholder: ${error.message}`);
  }
}

async function main() {
  console.log('🔍 Scanning public folder for media files...\n');
  
  ensureDir(THUMBNAILS_DIR);
  
  const files = fs.readdirSync(PUBLIC_DIR);
  const mediaFiles = [];
  
  for (const file of files) {
    const fileType = getFileType(file);
    if (fileType) {
      mediaFiles.push({ name: file, type: fileType });
    }
  }
  
  console.log(`Found ${mediaFiles.length} media files\n`);
  
  let imageCount = 0;
  let videoCount = 0;
  const manifest = [];
  
  for (const file of mediaFiles) {
    if (file.type === 'image') {
      const thumbnailName = file.name.replace(/\.[^.]+$/, '_thumb.jpg');
      const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailName);
      const originalPath = path.join(PUBLIC_DIR, file.name);
      
      if (!fs.existsSync(thumbnailPath)) {
        await generateThumbnail(originalPath, thumbnailPath);
      } else {
        console.log(`  ✓ Already exists: ${thumbnailName}`);
      }
      
      manifest.push({
        id: file.name,
        filename: file.name,
        type: 'image',
        thumbnail: `/thumbnails/${thumbnailName}`,
        original: `/${file.name}`,
      });
      imageCount++;
    } else if (file.type === 'video') {
      const thumbnailName = file.name.replace(/\.[^.]+$/, '_thumb.jpg');
      const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailName);
      
      if (!fs.existsSync(thumbnailPath)) {
        await generateVideoPlaceholder(thumbnailPath);
      } else {
        console.log(`  ✓ Already exists: ${thumbnailName}`);
      }
      
      manifest.push({
        id: file.name,
        filename: file.name,
        type: 'video',
        thumbnail: `/thumbnails/${thumbnailName}`,
        original: `/${file.name}`,
      });
      videoCount++;
    }
  }
  
  fs.writeFileSync(
    path.join(PUBLIC_DIR, 'media-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log(`\n✅ Thumbnail generation complete!`);
  console.log(`   Images: ${imageCount}`);
  console.log(`   Videos: ${videoCount}`);
  console.log(`   Thumbnails saved to: thumbnails/`);
  console.log(`   Manifest saved to: media-manifest.json\n`);
}

main().catch(console.error);
