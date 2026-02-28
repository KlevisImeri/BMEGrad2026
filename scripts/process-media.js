import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import sharp from 'sharp';
import heicConvert from 'heic-convert';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const THUMBNAILS_DIR = path.join(PUBLIC_DIR, 'thumbnails');

const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov'];
const HEIC_EXTENSIONS = ['.heic'];
const MOV_EXTENSIONS = ['.mov'];
const AAE_EXTENSIONS = ['.aae'];

const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 300;
const MAX_IMAGE_SIZE = 2048;
const COMPRESSION_QUALITY = 80;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getFileType(filename) {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  if (AAE_EXTENSIONS.includes(ext)) return 'aae';
  if (HEIC_EXTENSIONS.includes(ext)) return 'heic';
  if (MOV_EXTENSIONS.includes(ext)) return 'mov';
  if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) return 'video';
  return null;
}

function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`  🗑️  Deleted: ${path.basename(filePath)}`);
    }
  } catch (error) {
    console.error(`  ⚠️  Failed to delete: ${filePath} - ${error.message}`);
  }
}

async function convertHeicToJpg(inputPath, outputPath) {
  try {
    const buffer = fs.readFileSync(inputPath);
    const jpgBuffer = await heicConvert({
      buffer,
      format: 'JPEG',
      quality: 95
    });
    fs.writeFileSync(outputPath, jpgBuffer);
    console.log(`  ✓ Converted HEIC → JPG: ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`  ✗ Failed to convert HEIC: ${inputPath} - ${error.message}`);
    throw error;
  }
}

function convertVideoToH264(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // Try OpenH264 first (free H.264 encoder)
    const args = [
      '-i', inputPath,
      '-c:v', 'libopenh264',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '96k',
      '-movflags', '+faststart',
      '-y',
      outputPath
    ];
    
    const ffmpegProc = spawn('ffmpeg', args);
    
    let stderr = '';
    ffmpegProc.stderr.on('data', (data) => {
      stderr += data.toString();
      const timeMatch = stderr.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (timeMatch) {
        const totalSeconds = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
        process.stdout.write(`\r  📹 Converting → H.264: ${totalSeconds}s`);
      }
    });
    
    ffmpegProc.on('close', (code) => {
      if (code === 0) {
        console.log(`\n  ✓ Converted → H.264: ${path.basename(outputPath)}`);
        resolve();
      } else {
        // If it fails, try copying the video stream without re-encoding
        console.log(`\n  ⚠️ Direct encode failed, trying stream copy...`);
        const copyArgs = [
          '-i', inputPath,
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-b:a', '96k',
          '-movflags', '+faststart',
          '-y',
          outputPath
        ];
        
        const copyProc = spawn('ffmpeg', copyArgs);
        copyProc.on('close', (copyCode) => {
          if (copyCode === 0) {
            console.log(`\n  ✓ Stream copied: ${path.basename(outputPath)}`);
            resolve();
          } else {
            console.error(`\n  ✗ Failed: ${inputPath} - Could not convert video`);
            reject(new Error(`ffmpeg exited with code ${copyCode}`));
          }
        });
      }
    });
    
    ffmpegProc.on('error', (error) => {
      console.error(`\n  ✗ Failed: ${inputPath} - ${error.message}`);
      reject(error);
    });
  });
}

async function generateThumbnail(inputPath, outputPath) {
  try {
    const ext = path.extname(inputPath).toLowerCase();
    
    if (ext === '.png' || ext === '.heic') {
      await sharp(inputPath)
        .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
    } else {
      await sharp(inputPath)
        .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
    }
    console.log(`  ✓ Generated thumbnail: ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`  ✗ Failed thumbnail: ${inputPath} - ${error.message}`);
  }
}

async function getImageDimensions(inputPath) {
  try {
    const metadata = await sharp(inputPath).metadata();
    return { width: metadata.width, height: metadata.height };
  } catch (error) {
    return { width: 1200, height: 800 };
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
    console.log(`  ✓ Generated video placeholder: ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`  ✗ Failed video placeholder: ${error.message}`);
  }
}

async function compressImage(inputPath) {
  const filename = path.basename(inputPath);
  const ext = path.extname(filename);
  const basename = path.basename(filename, ext);
  
  // Skip if already compressed
  if (basename.includes('.cps')) {
    console.log(`  ✓ Already compressed: ${filename}`);
    return;
  }
  
  // Compress and rename with .cps suffix
  const newFilename = `${basename}.cps${ext}`;
  const newPath = path.join(path.dirname(inputPath), newFilename);
  
  await sharp(inputPath)
    .resize(MAX_IMAGE_SIZE, MAX_IMAGE_SIZE, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: COMPRESSION_QUALITY, progressive: true })
    .withMetadata()
    .toFile(newPath);
  
  // Remove original
  fs.unlinkSync(inputPath);
  
  console.log(`  ✓ Compressed: ${newFilename}`);
}

async function main() {
  console.log('🔍 Scanning public folder for media files...\n');
  
  ensureDir(THUMBNAILS_DIR);
  
  let files = fs.readdirSync(PUBLIC_DIR);
  
  console.log('📦 Step 1: Processing HEIC files...\n');
  for (const file of files) {
    const fileType = getFileType(file);
    if (fileType === 'heic') {
      const inputPath = path.join(PUBLIC_DIR, file);
      const outputName = file.replace(/\.heic$/i, '.jpg');
      const outputPath = path.join(PUBLIC_DIR, outputName);
      
      await convertHeicToJpg(inputPath, outputPath);
      deleteFile(inputPath);
    }
  }
  
  console.log('\n📦 Step 2: Processing MOV videos...\n');
  files = fs.readdirSync(PUBLIC_DIR);
  for (const file of files) {
    const fileType = getFileType(file);
    if (fileType === 'mov') {
      const inputPath = path.join(PUBLIC_DIR, file);
      const outputName = file.replace(/\.mov$/i, '.mp4');
      const outputPath = path.join(PUBLIC_DIR, outputName);
      
      try {
        await convertVideoToH264(inputPath, outputPath);
        deleteFile(inputPath);
      } catch (error) {
        console.log(`  ⚠️  Keeping original: ${file}`);
      }
    }
  }
  
  console.log('\n📦 Step 3: Keeping existing MP4s as-is...\n');
  
  console.log('\n📦 Step 4: Compressing full-res images (80% quality, max 2048px, preserving EXIF/GPS)...\n');
  files = fs.readdirSync(PUBLIC_DIR);
  for (const file of files) {
    const fileType = getFileType(file);
    if (fileType === 'image') {
      const inputPath = path.join(PUBLIC_DIR, file);
      await compressImage(inputPath);
    }
  }
  
  console.log('\n📦 Step 5: Removing AAE files...\n');
  files = fs.readdirSync(PUBLIC_DIR);
  for (const file of files) {
    const fileType = getFileType(file);
    if (fileType === 'aae') {
      const filePath = path.join(PUBLIC_DIR, file);
      deleteFile(filePath);
    }
  }
  
  console.log('\n📦 Step 6: Scanning for media to include...\n');
  files = fs.readdirSync(PUBLIC_DIR);
  const mediaFiles = [];
  
  for (const file of files) {
    const fileType = getFileType(file);
    if (fileType === 'image' || fileType === 'video') {
      mediaFiles.push({ name: file, type: fileType });
    }
  }
  
  console.log(`Found ${mediaFiles.length} media files\n`);
  
  let imageCount = 0;
  let videoCount = 0;
  const manifest = [];
  
  console.log('📦 Step 7: Generating thumbnails and extracting dimensions...\n');
  for (const file of mediaFiles) {
    const thumbnailName = file.name.replace(/\.[^.]+$/, '_thumb.jpg');
    const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailName);
    const originalPath = path.join(PUBLIC_DIR, file.name);
    
    let dimensions = { width: 1200, height: 800 };
    
    if (!fs.existsSync(thumbnailPath)) {
      if (file.type === 'image') {
        await generateThumbnail(originalPath, thumbnailPath);
        dimensions = await getImageDimensions(originalPath);
      } else if (file.type === 'video') {
        await generateVideoPlaceholder(thumbnailPath);
      }
    } else {
      console.log(`  ✓ Already exists: ${thumbnailName}`);
      if (file.type === 'image') {
        dimensions = await getImageDimensions(originalPath);
      }
    }
    
    manifest.push({
      id: file.name,
      filename: file.name,
      type: file.type,
      thumbnail: `/thumbnails/${thumbnailName}`,
      original: `/${file.name}`,
      width: dimensions.width,
      height: dimensions.height,
    });
    
    if (file.type === 'image') {
      imageCount++;
    } else {
      videoCount++;
    }
  }
  
  fs.writeFileSync(
    path.join(PUBLIC_DIR, 'media-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log(`\n✅ Media processing complete!`);
  console.log(`   Images: ${imageCount}`);
  console.log(`   Videos: ${videoCount}`);
  console.log(`   Thumbnails: ${imageCount + videoCount}`);
  console.log(`   Manifest saved to: media-manifest.json\n`);
}

main().catch(console.error);
