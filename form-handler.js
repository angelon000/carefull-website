// 케어풀 웹사이트 폼 데이터 전송 핸들러
// Google Apps Script API를 통해 Google Sheets에 데이터 저장

const scriptURL = 'https://script.google.com/macros/s/AKfycbxCRJKT6Dr8v_DeCKNHrtu1brk2M6hsJQprvfnjRvB-fQ-sefPrICdJ9BM22Hvz6AkyMg/exec';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Form handler script loaded');
    
    // 모든 contact-form 클래스를 가진 폼을 찾아서 이벤트 리스너 추가
    const forms = document.querySelectorAll('form.contact-form, form#contactForm, form#b2bContactForm');
    console.log('Found forms:', forms.length);
    
    forms.forEach((form, index) => {
        console.log(`Setting up form ${index + 1}:`, form.id, form.className);
        
        form.addEventListener('submit', function(e) {
            console.log('Form submission started for:', form.id);
            e.preventDefault(); // 기본 폼 제출 동작 방지
            e.stopPropagation(); // 이벤트 버블링 방지

            // HTML5 내장 검증을 통과하지 못하면 브라우저 기본 메시지 노출 및 조기 종료
            // 참고: requestSubmit은 기본 검증을 트리거합니다. 단, 지금은 수동 제출 흐름이므로 reportValidity 사용
            if (!form.reportValidity || !form.reportValidity()) {
                return;
            }

            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            
            // 버튼 비활성화 및 로딩 상태 표시
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner"></span> 전송 중...';

            // 폼 데이터 수집
            const formData = new FormData(form);
            
            // 폼 타입 결정
            const formType = form.dataset.formType || 
                           (form.id === 'contactForm' ? '메인페이지 문의' : 
                            form.id === 'b2bContactForm' ? 'B2B 무료진단 문의' : 
                            '일반 문의');
            
            // FormData를 URLSearchParams로 변환 (Google Apps Script 호환성을 위해)
            const urlParams = new URLSearchParams();
            for (let [key, value] of formData.entries()) {
                urlParams.append(key, value);
            }
            urlParams.append('formType', formType);

            // Google Apps Script로 데이터 전송 (URL-encoded 형식)
            console.log('Sending data to:', scriptURL);
            console.log('Form data:', Object.fromEntries(urlParams));
            console.log('Form type:', formType);
            console.log('Form ID:', form.id);
            
            fetch(scriptURL, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: urlParams.toString()
            })
            .then(response => {
                console.log('Response status:', response.status);
                console.log('Response headers:', response.headers);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text(); // 먼저 텍스트로 응답을 확인
            })
            .then(text => {
                console.log('Raw response text:', text);
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error('JSON parse error:', e);
                    throw new Error(`Invalid JSON response: ${text}`);
                }
            })
            .then(data => {
                console.log('Parsed response data:', data);
                if (data.result === 'success') {
                    // 성공 시 토스트 알림 및 폼 초기화
                    showToast('상담 신청이 성공적으로 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.', 'success');
                    form.reset();
                } else {
                    throw new Error(data.error || '알 수 없는 오류가 발생했습니다.');
                }
            })
            .catch(error => {
                console.error('Form submission error:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    formData: Object.fromEntries(formData),
                    scriptURL: scriptURL
                });
                
                // 네트워크 오류와 서버 오류를 구분하여 메시지 표시
                let errorMessage = '오류가 발생했습니다. 다시 시도해주세요.';
                if (error.message.includes('fetch')) {
                    errorMessage = '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.';
                } else if (error.message.includes('HTTP error')) {
                    errorMessage = '서버에서 응답하지 않습니다. 잠시 후 다시 시도해주세요.';
                }
                errorMessage += ' 문제가 지속되면 전화(1577-2586)로 문의해주세요.';
                
                showToast(errorMessage, 'error');
            })
            .finally(() => {
                // 버튼 상태 복원
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            });
        });
    });
});

// 토스트 메시지 함수
function showToast(message, type = 'info') {
    // 기존 토스트가 있으면 제거
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // 토스트 엘리먼트 생성
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
        <div class="toast__content">
            <div class="toast__icon">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </div>
            <div class="toast__message">${message}</div>
            <button class="toast__close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    // 토스트 스타일 적용
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        max-width: 400px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    // 토스트 내용 스타일
    const contentStyle = `
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
    `;
    
    const iconStyle = `
        font-size: 1.25rem;
        flex-shrink: 0;
        margin-top: 0.125rem;
    `;
    
    const messageStyle = `
        flex: 1;
        font-size: 0.875rem;
        line-height: 1.4;
        font-weight: 500;
    `;
    
    const closeStyle = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 1.25rem;
        padding: 0;
        margin-left: 0.5rem;
        opacity: 0.7;
        transition: opacity 0.2s ease;
        flex-shrink: 0;
    `;

    // DOM에 추가
    document.body.appendChild(toast);
    
    // 내부 요소들에 스타일 적용
    const content = toast.querySelector('.toast__content');
    const icon = toast.querySelector('.toast__icon');
    const messageEl = toast.querySelector('.toast__message');
    const closeBtn = toast.querySelector('.toast__close');
    
    content.style.cssText = contentStyle;
    icon.style.cssText = iconStyle;
    messageEl.style.cssText = messageStyle;
    closeBtn.style.cssText = closeStyle;
    
    // 호버 효과
    closeBtn.addEventListener('mouseover', () => {
        closeBtn.style.opacity = '1';
    });
    closeBtn.addEventListener('mouseout', () => {
        closeBtn.style.opacity = '0.7';
    });

    // 애니메이션 시작
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    // 자동 제거 (성공: 5초, 에러: 8초)
    const autoRemoveTime = type === 'error' ? 8000 : 5000;
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }, autoRemoveTime);
}