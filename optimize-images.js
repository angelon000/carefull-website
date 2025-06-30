const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// 최적화할 이미지 확장자 목록
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// 원본 이미지 백업을 위한 디렉토리
const BACKUP_DIR = path.join(__dirname, 'img_backup');
const IMG_DIR = path.join(__dirname, 'img');

// 디렉토리 생성 함수
const mkdirIfNotExists = async (dir) => {
  try {
    await fs.promises.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
};

// 이미지 최적화 함수
const optimizeImage = async (inputPath, outputPath) => {
  try {
    const ext = path.extname(inputPath).toLowerCase();
    
    // WebP로 변환 (훨씬 작은 용량)
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      await sharp(inputPath)
        .webp({ quality: 80, effort: 6 })
        .toFile(outputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
    } else {
      // 이미 WebP인 경우 그대로 복사
      await fs.promises.copyFile(inputPath, outputPath);
    }
    
    console.log(`Optimized: ${path.basename(inputPath)}`);
  } catch (err) {
    console.error(`Error optimizing ${inputPath}:`, err);
  }
};

// 디렉토리 내 모든 이미지 최적화
const optimizeImagesInDir = async (dir) => {
  try {
    const files = await readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const fileStat = await stat(filePath);
      
      if (fileStat.isDirectory()) {
        await optimizeImagesInDir(filePath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (IMAGE_EXTENSIONS.includes(ext)) {
          // 백업 디렉토리 생성
          const relativePath = path.relative(IMG_DIR, path.dirname(filePath));
          const backupDir = path.join(BACKUP_DIR, relativePath);
          await mkdirIfNotExists(backupDir);
          
          // 원본 파일 백업
          const backupPath = path.join(backupDir, path.basename(filePath));
          await fs.promises.copyFile(filePath, backupPath);
          
          // 이미지 최적화
          await optimizeImage(filePath, filePath);
        }
      }
    }
  } catch (err) {
    console.error('Error optimizing images:', err);
  }
};

// 실행
(async () => {
  try {
    console.log('Starting image optimization...');
    
    // 백업 디렉토리 생성
    await mkdirIfNotExists(BACKUP_DIR);
    
    // 이미지 최적화 실행
    await optimizeImagesInDir(IMG_DIR);
    
    console.log('Image optimization completed!');
    console.log(`Original images are backed up to: ${BACKUP_DIR}`);
  } catch (err) {
    console.error('Error:', err);
  }
})();
