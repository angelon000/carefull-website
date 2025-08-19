// CareFull Image Manager - Unsplash API Integration
class ImageManager {
    constructor() {
        this.accessKey = '1rzcR_kiy5znKTwKWOZoeP2WiCLLySiXo_uXfkje8jg';
        this.baseUrl = 'https://api.unsplash.com';
        this.imageCache = new Map();
        this.observers = new Map();
    }

    // 고품질 케어 관련 이미지 컬렉션 - 새로운 아트 디렉션 반영
    getImageQueries() {
        return {
            // 히어로 이미지 - 좌측/우측 여백, 밝은 자연광 (한국 시니어 중심)
            hero: [
                'korean elderly family grandparents living room natural light',
                'korean grandmother grandchild warm home candid',
                'korean elderly couple with family home daylight',
                'korean senior and caregiver home warm light'
            ],
            
            // About 페이지 전용 카테고리
            brand_about_korean: [
                'korean elderly couple family home natural light warm',
                'korean grandparents with adult children smiling home',
                'korean senior caregiver friendly conversation daylight',
                'korean family three generations living room connection'
            ],
            
            // 재가 서비스 - 따뜻한 가정 환경 (한국 가정)
            homecare: [
                '한국 가정 방문 요양 케어',
                'caregiver with senior at home daylight korean',
                'home visit care assistance living room korea',
                'nurse visiting elderly patient warm korea'
            ],
            
            // 가족 관계 - 따뜻한 상호작용 (한국 가족)
            family: [
                '한국인 가족 부모와 자녀 자연스러운 미소',
                'adult children caring elderly parent smile korean',
                'multi generation korean family connection',
                'elderly parent adult child bonding korea'
            ],
            
            // 의료/요양 - 전문성과 공감 (한국 시니어)
            healthcare: [
                'korean senior patient consultation doctor empathy',
                'healthcare professionals team collaboration korea',
                'medical assessment senior patient clipboard korean',
                'senior facility bedroom natural light korea'
            ],
            
            // 시니어 라이프스타일 - 활기찬 일상 (한국 시니어)
            lifestyle: [
                '한국 시니어 일상 자연광',
                'korean elderly person peaceful daily routine',
                'korean senior lifestyle wellness calm',
                'flat lay icon objects minimal healthcare'
            ],
            
            // 전문가/컨설팅 - 비즈니스 환경 (국내)
            professional: [
                'business healthcare consulting meeting minimal office korea',
                'korean senior care professional portrait team',
                'executive consulting healthcare industry korea',
                'workshop whiteboard healthcare team korea'
            ],
            
            // 기술/디지털 - 미니멀한 테크 (국내 배경 선호)
            technology: [
                'telemedicine tablet elderly hands clean desk korea',
                'health app ui tablet minimal korea',
                'tablet calculator finance healthcare minimal korea',
                'digital health monitoring clean interface korea'
            ],

            // About - 우리가 만들어가는 내일 (비전/미션/가치)
            vision: [
                'korean elderly couple smile natural light dignity happiness',
                '한국 시니어 미소 존엄 자연광',
                'korean senior outdoor soft light happy portrait'
            ],
            mission: [
                'korean digital health technology tablet with senior care team',
                '데이터 헬스케어 기술 협업 한국 병원',
                'telemedicine consultation korea senior caregiver'
            ],
            values: [
                'korean teamwork hands together trust connection warm light',
                'team handshake korea trust empathy',
                'hands holding heart korea compassion sustainability'
            ]
        };
    }

    // 특정 카테고리의 이미지 가져오기
    async getImage(category, index = 0, options = {}) {
        const queries = this.getImageQueries();
        const candidates = queries[category] && queries[category].length > 0
            ? queries[category]
            : [category];

        // 요청 인덱스부터 시작해 후보 쿼리를 순차 시도
        for (let i = 0; i < candidates.length; i++) {
            const rawQuery = candidates[(index + i) % candidates.length];
            const query = this.applyKoreanBias(rawQuery);
            const cacheKey = `${query}_${JSON.stringify(options)}`;

            if (this.imageCache.has(cacheKey)) {
                return this.imageCache.get(cacheKey);
            }

            try {
                const params = new URLSearchParams({
                    query,
                    orientation: options.orientation || 'landscape',
                    per_page: 1,
                    order_by: 'relevant',
                    content_filter: 'high',
                    lang: 'ko'
                });
                if (options.color) params.set('color', options.color);

                const response = await fetch(`${this.baseUrl}/search/photos?${params}`, {
                    headers: { 'Authorization': `Client-ID ${this.accessKey}` }
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    const image = data.results[0];
                    const imageData = {
                        id: image.id,
                        url: image.urls.regular,
                        thumb: image.urls.thumb,
                        small: image.urls.small,
                        alt: image.alt_description || rawQuery,
                        photographer: image.user.name,
                        photographerUrl: image.user.links.html,
                        downloadUrl: image.links.download_location
                    };
                    this.imageCache.set(cacheKey, imageData);
                    return imageData;
                }
            } catch (error) {
                console.debug('Image fetch attempt failed for query:', query, error);
                // 다음 후보로 계속 시도
            }
        }

        // 모든 후보가 실패하면 폴백
        return this.getFallbackImage(category);
    }

    // 폴백 이미지 (Unsplash 연결 실패 시)
    getFallbackImage(category) {
        const fallbacks = {
            // 모두 로컬 자산 사용 (워터마크 방지)
            hero: 'img/hero-main.jpg?v=1',
            family: 'img/multi-generation-family.jpg',
            healthcare: 'img/medical-consultation.jpg',
            homecare: 'img/home-healthcare-visit.jpg',
            lifestyle: 'img/elderly-couple-smiling.jpg',
            professional: 'img/professional-consultation.jpg',
            technology: 'img/healthcare-technology-app.jpg'
        };
        
        return {
            url: fallbacks[category] || fallbacks.hero,
            alt: `${category} 관련 이미지`,
            photographer: 'Local',
            photographerUrl: '#'
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
        const size = imgElement.dataset.size || 'regular'; // thumb, small, regular
        const color = imgElement.dataset.color; // e.g., 'black_and_white'
        
        try {
            // 로딩 스피너 표시
            imgElement.style.backgroundColor = 'var(--gray-100)';
            imgElement.style.background = 'linear-gradient(90deg, var(--gray-200) 25%, var(--gray-100) 50%, var(--gray-200) 75%)';
            imgElement.style.backgroundSize = '200% 100%';
            imgElement.style.animation = 'loading 1.5s infinite';

            const imageData = await this.getImage(category, index, { orientation, color });
            
            // size에 따른 적절한 이미지 URL 선택
            let imageUrl;
            if (size === 'thumb' && imageData.thumb) {
                imageUrl = imageData.thumb;
            } else if (size === 'small' && imageData.small) {
                imageUrl = imageData.small;
            } else {
                imageUrl = imageData.url;
            }
            
            // 이미지 로드 확인
            const testImg = new Image();
            testImg.onload = () => {
                imgElement.src = imageUrl;
                imgElement.alt = imageData.alt || `${category} 관련 이미지`;
                imgElement.style.background = '';
                imgElement.style.animation = '';
                
                // Unsplash 다운로드 등록 (API 정책 준수)
                if (imageData.downloadUrl) {
                    this.registerDownload(imageData.downloadUrl);
                }
                
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
            
            testImg.src = imageUrl;
            
        } catch (error) {
            console.error('Error loading image:', error);
            const fallback = this.getFallbackImage(category);
            imgElement.src = fallback.url;
            imgElement.alt = fallback.alt;
            imgElement.style.background = '';
            imgElement.style.animation = '';
        }
    }

    // 한국인/국내 결과 우선 로직
    applyKoreanBias(originalQuery) {
        try {
            const q = originalQuery || '';
            const lower = q.toLowerCase();
            const hasHangul = /[\u3131-\u318E\uAC00-\uD7A3]/.test(q);
            const hasKorea = lower.includes('korea') || lower.includes('korean');
            if (hasHangul || hasKorea) return q;
            // 한국 관련 키워드를 추가하여 국내 인물/상황을 우선 검색
            return `${q} korean korea`;
        } catch (_) {
            return originalQuery;
        }
    }

    // Unsplash 다운로드 등록 (API 정책 준수)
    async registerDownload(downloadUrl) {
        try {
            await fetch(downloadUrl, {
                headers: {
                    'Authorization': `Client-ID ${this.accessKey}`
                }
            });
        } catch (error) {
            // 다운로드 등록 실패는 조용히 처리 (사용자 경험에 영향 없음)
            console.debug('Download registration failed:', error);
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