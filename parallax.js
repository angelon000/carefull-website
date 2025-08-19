// 패럴랙스 효과 스크립트
(function() {
    'use strict';
    
    // 모바일 체크
    const isMobile = window.innerWidth <= 768;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // 패럴랙스 비활성화 조건
    if (isMobile || prefersReducedMotion) {
        return;
    }
    
    // 패럴랙스 대상 요소들
    const heroBgs = document.querySelectorAll('.hero-bg');
    
    // 패럴랙스 클래스 추가
    heroBgs.forEach(bg => {
        bg.classList.add('parallax');
    });
    
    // 스크롤 핸들러
    let ticking = false;
    function updateParallax() {
        const scrollY = window.pageYOffset;
        
        heroBgs.forEach(bg => {
            // 뷰포트에 보이는 경우만 업데이트
            const rect = bg.getBoundingClientRect();
            const isVisible = rect.bottom >= 0 && rect.top <= window.innerHeight;
            
            if (isVisible) {
                bg.style.setProperty('--scroll-y', scrollY + 'px');
                bg.classList.add('scrolled');
            }
        });
        
        ticking = false;
    }
    
    // 스크롤 이벤트 최적화 (RAF 사용)
    function requestTick() {
        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    // 이벤트 리스너
    window.addEventListener('scroll', requestTick, { passive: true });
    
    // 초기 실행
    updateParallax();
})();