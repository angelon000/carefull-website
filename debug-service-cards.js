// 재가급여 서비스 카드 디버깅 스크립트
// 브라우저 콘솔에서 실행하세요

console.log('=== 재가급여 서비스 카드 디버깅 시작 ===');

// 1. 서비스 카드 요소들 확인
const serviceCards = document.querySelectorAll('.service-card[data-home-service]');
console.log('서비스 카드 개수:', serviceCards.length);

// 2. 각 카드의 체크 마크 존재 여부 확인
serviceCards.forEach((card, index) => {
    const checkMark = card.querySelector('.check-mark');
    const service = card.dataset.homeService;
    console.log(`카드 ${index + 1} (${service}):`, 
        checkMark ? '✅ 체크 마크 있음' : '❌ 체크 마크 없음');
    
    // 체크 마크의 스타일 확인
    if (checkMark) {
        const styles = window.getComputedStyle(checkMark);
        console.log(`  - display: ${styles.display}`);
        console.log(`  - selected 클래스 여부: ${card.classList.contains('selected')}`);
    }
});

// 3. 이벤트 리스너 확인
console.log('\n=== 이벤트 리스너 테스트 ===');
serviceCards.forEach((card, index) => {
    const service = card.dataset.homeService;
    
    // 클릭 이벤트 시뮬레이션
    const beforeSelected = card.classList.contains('selected');
    card.click();
    const afterSelected = card.classList.contains('selected');
    
    console.log(`카드 ${service}: ${beforeSelected ? '선택됨' : '선택안됨'} → ${afterSelected ? '선택됨' : '선택안됨'}`);
    
    // 원래 상태로 복원
    if (beforeSelected !== afterSelected) {
        card.click();
    }
});

// 4. CSS 스타일 체크
console.log('\n=== CSS 스타일 확인 ===');
const testCard = serviceCards[0];
if (testCard) {
    testCard.classList.add('selected');
    const checkMark = testCard.querySelector('.check-mark');
    if (checkMark) {
        const styles = window.getComputedStyle(checkMark);
        console.log('선택된 카드의 체크 마크 display:', styles.display);
        console.log('체크 마크 배경색:', styles.backgroundColor);
        console.log('체크 마크 위치:', styles.position);
    }
    testCard.classList.remove('selected');
}

console.log('\n=== 디버깅 완료 ===');