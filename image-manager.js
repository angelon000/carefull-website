// CareFull Image Manager - Unsplash API Integration
class ImageManager {
    constructor() {
        this.accessKey = '1rzcR_kiy5znKTwKWOZoeP2WiCLLySiXo_uXfkje8jg';
        this.baseUrl = 'https://api.unsplash.com';
        this.imageCache = new Map();
        this.observers = new Map();
    }

    // 고품질 케어 관련 이미지 컬렉션
    getImageQueries() {
        return {
            // 홈페이지용 이미지들
            hero: [
                'elderly care happy family korean',
                'senior citizen smiling healthcare',
                'elderly person with caregiver warm',
                'grandparent with family loving care'
            ],
            
            // 서비스 관련 이미지들
            homecare: [
                'home healthcare elderly assistance',
                'caregiver helping senior at home',
                'elderly person receiving care home',
                'nurse visiting elderly patient'
            ],
            
            // 가족 및 관계 이미지들
            family: [
                'multi generation family happy',
                'adult child caring elderly parent',
                'family gathering elderly grandparent',
                'elderly couple with adult children'
            ],
            
            // 의료 및 건강 이미지들
            healthcare: [
                'medical consultation elderly patient',
                'doctor examining senior citizen',
                'healthcare professional elderly care',
                'medical check up senior health'
            ],
            
            // 활동 및 라이프스타일 이미지들
            lifestyle: [
                'active elderly person exercise',
                'senior citizen reading book peaceful',
                'elderly person gardening hobby',
                'seniors socializing community center'
            ],
            
            // 전문 서비스 이미지들
            professional: [
                'business meeting healthcare consultation',
                'professional caregiver training',
                'medical team discussing patient care',
                'healthcare administration planning'
            ],
            
            // 기술 및 혁신 이미지들
            technology: [
                'digital health monitoring elderly',
                'tablet computer elderly learning',
                'smart home technology seniors',
                'telehealth consultation video call'
            ]
        };
    }

    // 특정 카테고리의 이미지 가져오기
    async getImage(category, index = 0, options = {}) {
        const queries = this.getImageQueries();
        const query = queries[category] ? queries[category][index % queries[category].length] : category;
        
        const cacheKey = `${query}_${JSON.stringify(options)}`;
        
        if (this.imageCache.has(cacheKey)) {
            return this.imageCache.get(cacheKey);
        }

        try {
            const params = new URLSearchParams({
                query: query,
                orientation: options.orientation || 'landscape',
                per_page: 1,
                order_by: 'relevant',
                content_filter: 'high',
                ...options
            });

            const response = await fetch(`${this.baseUrl}/search/photos?${params}`, {
                headers: {
                    'Authorization': `Client-ID ${this.accessKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const image = data.results[0];
                const imageData = {
                    id: image.id,
                    url: image.urls.regular,
                    thumb: image.urls.thumb,
                    small: image.urls.small,
                    alt: image.alt_description || query,
                    photographer: image.user.name,
                    photographerUrl: image.user.links.html,
                    downloadUrl: image.links.download_location
                };
                
                this.imageCache.set(cacheKey, imageData);
                return imageData;
            }
        } catch (error) {
            console.error('Error fetching image:', error);
            return this.getFallbackImage(category);
        }
        
        return this.getFallbackImage(category);
    }

    // 폴백 이미지 (Unsplash 연결 실패 시)
    getFallbackImage(category) {
        const fallbacks = {
            hero: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
            family: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800&h=600&fit=crop',
            healthcare: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop',
            homecare: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop',
            lifestyle: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
            professional: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&h=600&fit=crop',
            technology: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop'
        };
        
        return {
            url: fallbacks[category] || fallbacks.hero,
            alt: `${category} 관련 이미지`,
            photographer: 'Unsplash',
            photographerUrl: 'https://unsplash.com'
        };
    }

    // 이미지 지연 로딩 설정
    setupLazyLoading() {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImageWithFallback(img);
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px'
        });

        // data-category 속성을 가진 이미지들을 관찰
        document.querySelectorAll('img[data-category]').forEach(img => {
            imageObserver.observe(img);
        });

        return imageObserver;
    }

    // 이미지 로딩 및 폴백 처리
    async loadImageWithFallback(imgElement) {
        const category = imgElement.dataset.category;
        const index = parseInt(imgElement.dataset.index) || 0;
        const orientation = imgElement.dataset.orientation || 'landscape';
        
        try {
            // 로딩 스피너 표시
            imgElement.style.backgroundColor = 'var(--gray-100)';
            imgElement.style.background = 'linear-gradient(90deg, var(--gray-200) 25%, var(--gray-100) 50%, var(--gray-200) 75%)';
            imgElement.style.backgroundSize = '200% 100%';
            imgElement.style.animation = 'loading 1.5s infinite';

            const imageData = await this.getImage(category, index, { orientation });
            
            // 이미지 로드 확인
            const testImg = new Image();
            testImg.onload = () => {
                imgElement.src = imageData.url;
                imgElement.alt = imageData.alt;
                imgElement.style.background = '';
                imgElement.style.animation = '';
                
                // 크레딧 추가 (선택적)
                if (imgElement.dataset.showCredit === 'true') {
                    this.addImageCredit(imgElement, imageData);
                }
                
                // 페이드인 애니메이션
                imgElement.style.opacity = '0';
                imgElement.style.transition = 'opacity 0.5s ease';
                requestAnimationFrame(() => {
                    imgElement.style.opacity = '1';
                });
            };
            
            testImg.onerror = () => {
                const fallback = this.getFallbackImage(category);
                imgElement.src = fallback.url;
                imgElement.alt = fallback.alt;
                imgElement.style.background = '';
                imgElement.style.animation = '';
            };
            
            testImg.src = imageData.url;
            
        } catch (error) {
            console.error('Error loading image:', error);
            const fallback = this.getFallbackImage(category);
            imgElement.src = fallback.url;
            imgElement.alt = fallback.alt;
            imgElement.style.background = '';
            imgElement.style.animation = '';
        }
    }

    // 이미지 크레딧 추가
    addImageCredit(imgElement, imageData) {
        const credit = document.createElement('div');
        credit.className = 'image-credit';
        credit.innerHTML = `
            <span>Photo by <a href="${imageData.photographerUrl}" target="_blank" rel="noopener">${imageData.photographer}</a> on <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a></span>
        `;
        credit.style.cssText = `
            position: absolute;
            bottom: 8px;
            right: 8px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        const container = imgElement.parentElement;
        if (container) {
            container.style.position = 'relative';
            container.appendChild(credit);
            
            container.addEventListener('mouseenter', () => {
                credit.style.opacity = '1';
            });
            
            container.addEventListener('mouseleave', () => {
                credit.style.opacity = '0';
            });
        }
    }

    // 특정 페이지용 이미지 세트 로딩
    async loadPageImages(page) {
        const imageConfigs = {
            home: [
                { selector: '.hero-image', category: 'hero', index: 0 },
                { selector: '.feature-image-1', category: 'family', index: 0 },
                { selector: '.feature-image-2', category: 'homecare', index: 0 },
                { selector: '.feature-image-3', category: 'healthcare', index: 0 }
            ],
            ltci: [
                { selector: '.ltci-hero-image', category: 'healthcare', index: 1 },
                { selector: '.service-image-1', category: 'homecare', index: 1 },
                { selector: '.service-image-2', category: 'professional', index: 0 }
            ],
            about: [
                { selector: '.story-hero-bg', category: 'family', index: 2 },
                { selector: '.team-bg', category: 'professional', index: 1 }
            ],
            b2b: [
                { selector: '.b2b-hero-bg', category: 'professional', index: 2 },
                { selector: '.consulting-image', category: 'technology', index: 0 }
            ],
            calculator: [
                { selector: '.calculator-hero-bg', category: 'technology', index: 1 },
                { selector: '.calculator-info-image', category: 'healthcare', index: 1 }
            ]
        };

        const configs = imageConfigs[page] || [];
        
        for (const config of configs) {
            const elements = document.querySelectorAll(config.selector);
            elements.forEach(async (element, index) => {
                const imageData = await this.getImage(config.category, config.index + index);
                
                if (element.tagName === 'IMG') {
                    element.src = imageData.url;
                    element.alt = imageData.alt;
                } else {
                    element.style.backgroundImage = `url(${imageData.url})`;
                }
            });
        }
    }

    // 이미지 미리로딩 (성능 향상)
    async preloadImages(categories = ['hero', 'family', 'healthcare']) {
        const preloadPromises = categories.map(category => 
            this.getImage(category, 0).then(imageData => {
                const img = new Image();
                img.src = imageData.url;
                return img;
            })
        );

        try {
            await Promise.all(preloadPromises);
            console.log('Images preloaded successfully');
        } catch (error) {
            console.warn('Some images failed to preload:', error);
        }
    }
}

// 전역 이미지 매니저 인스턴스
window.imageManager = new ImageManager();

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.imageManager.setupLazyLoading();
    
    // 현재 페이지 감지하여 적절한 이미지 로딩
    const path = window.location.pathname;
    let currentPage = 'home';
    
    if (path.includes('ltci-guide')) currentPage = 'ltci';
    else if (path.includes('about')) currentPage = 'about';
    else if (path.includes('b2b_services')) currentPage = 'b2b';
    else if (path.includes('calculator')) currentPage = 'calculator';
    
    window.imageManager.loadPageImages(currentPage);
    
    // 주요 이미지들 미리로딩
    const categoriesToPreload = ['hero', 'family', 'healthcare', 'professional', 'technology'];
    window.imageManager.preloadImages(categoriesToPreload);
    
    // 페이지별 추가 이미지 미리로딩
    setTimeout(() => {
        if (currentPage === 'home') {
            window.imageManager.preloadImages(['homecare', 'lifestyle']);
        } else if (currentPage === 'b2b') {
            window.imageManager.preloadImages(['professional']);
        }
    }, 2000);
});