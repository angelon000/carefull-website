// 이미지 워터마크 제거 및 최적화를 위한 스크립트
// 이미지 다운로드 후 워터마크 없는 버전으로 교체

const images = [
    {
        url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3dc0b?w=1920&h=1080&fit=crop&q=90',
        filename: 'img/hero-main-clean.jpg',
        description: '행복한 시니어 가족'
    }
];

console.log('워터마크 없는 이미지를 사용하려면:');
console.log('1. Unsplash, Pexels 등에서 무료 이미지 다운로드');
console.log('2. 기존 hero-main.jpg를 백업');
console.log('3. 새 이미지로 교체');