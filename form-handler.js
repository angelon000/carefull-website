// 케어풀 웹사이트 폼 데이터 전송 핸들러
// Google Apps Script API를 통해 Google Sheets에 데이터 저장

const scriptURL = 'https://script.google.com/macros/s/AKfycbxlR0AkhigZegN7Qd1mv1w8s7VYyg6lvxU2XtsPW-fwUvhJdcgjmflBkPZjflIlVHy9_Q/exec';

document.addEventListener('DOMContentLoaded', function() {
    // 모든 contact-form 클래스를 가진 폼을 찾아서 이벤트 리스너 추가
    const forms = document.querySelectorAll('form.contact-form, form#contactForm, form#b2bContactForm');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // 기본 폼 제출 동작 방지

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
                if (data.result === 'success') {
                    // 성공 시 알림 및 폼 초기화
                    alert('상담 신청이 성공적으로 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.');
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
                    formData: Object.fromEntries(formData)
                });
                alert('오류가 발생했습니다. 다시 시도해주세요. 문제가 지속되면 전화(1577-2586)로 문의해주세요.');
            })
            .finally(() => {
                // 버튼 상태 복원
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            });
        });
    });
});