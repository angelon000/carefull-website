const https = require('https');
const fs = require('fs');
const path = require('path');

// 서비스에 적절한 이미지들
const images = [
    {
        url: 'https://plus.unsplash.com/premium_photo-1661697023626-506d562e52cb?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        filename: 'service-info.jpg',
        description: '의료진과 환자 상담'
    },
    {
        url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80', 
        filename: 'service-partner.jpg',
        description: '비즈니스 파트너십'
    },
    {
        url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
        filename: 'service-franchise.jpg',
        description: '비즈니스 네트워크'
    },
    {
        url: 'https://images.unsplash.com/photo-1586880244386-8b3e34c8382c?w=800&q=80',
        filename: 'service-apply.jpg',
        description: '서류 작성 및 신청'
    }
];

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Handle redirect
                https.get(response.headers.location, (redirectResponse) => {
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                }).on('error', reject);
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            }
        }).on('error', reject);
    });
}

async function downloadAll() {
    const imgDir = path.join(__dirname, 'img');
    
    for (const image of images) {
        const filepath = path.join(imgDir, image.filename);
        console.log(`Downloading ${image.description} to ${image.filename}...`);
        
        try {
            await downloadImage(image.url, filepath);
            console.log(`✓ Downloaded ${image.filename}`);
        } catch (error) {
            console.error(`✗ Failed to download ${image.filename}:`, error.message);
        }
    }
    
    console.log('\nAll downloads complete!');
}

downloadAll().catch(console.error);