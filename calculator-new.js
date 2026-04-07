// 장기요양보험 본인부담금 계산기 - 2026년 기준
// PM 지침에 따른 완전 재구현

// ==========================================
// 1. 데이터 구조화 (2026년 수가표 기준)
// ==========================================

// 표1: 주야간보호 시간별 급여비용 (일당, 원)
const dailyCareCost = {
    '1': { // 1등급
        '3': 40650,
        '6': 54490,
        '8': 67770,
        '10': 74660
    },
    '2': { // 2등급
        '3': 37630,
        '6': 50470,
        '8': 62780,
        '10': 69160
    },
    '3': { // 3등급
        '3': 34740,
        '6': 46590,
        '8': 57960,
        '10': 63900
    },
    '4': { // 4등급
        '3': 33160,
        '6': 45000,
        '8': 56380,
        '10': 62290
    },
    '5': { // 5등급
        '3': 31580,
        '6': 43400,
        '8': 54780,
        '10': 60710
    },
    'cognitive': { // 인지지원등급
        '3': 31580,
        '6': 43400,
        '8': 54780,
        '10': 54782
    }
};

// 표2: 등급별 재가급여 월 한도액 (기본)
const monthlyLimitStandard = {
    '1': 2306400,
    '2': 2083400,
    '3': 1485700,
    '4': 1370600,
    '5': 1177000,
    'cognitive': 657400
};

// 표3: 하루3시간 이상, 월15회 이상 이용 시 상한되는 월 한도액
const monthlyLimitIncreased = {
    '1': 2767680,  // 기본 한도액의 120%
    '2': 2500080,
    '3': 1782840,
    '4': 1644720,
    '5': 1412400
    // 인지지원등급은 상향 한도 없음
};

// 표4: 수급자 자격별 급여비용 본인부담 비율
const copayRate = {
    'normal': 0.15,      // 일반: 15%
    'reduced9': 0.09,    // 경감대상자: 9%
    'reduced6': 0.06,    // 감: 6%
    'welfare': 0.00      // 기초수급권자: 0%
};

// 표5: 비급여 본인부담 (식사비, 원/일)
const mealCost = {
    '0': 0,      // 식사 안함
    '1': 4500,   // 1일 1식
    '2': 8000    // 1일 2식
};

// ==========================================
// 2. 계산기 상태 관리
// ==========================================

const calculatorState = {
    grade: null,           // 장기요양등급
    dailyHours: null,      // 하루 이용시간
    monthlyDays: 21,       // 한달 이용일수 (기본값 21일)
    copayType: null,       // 본인부담 유형
    mealType: '1',         // 식사 횟수 (기본값 1식)
    serviceType: 'home',    // 서비스 유형 (재가급여 고정)
    selectedHomeServices: new Set() // 선택된 재가급여 서비스
};

// ==========================================
// 3. 계산 로직 (5단계 알고리즘)
// ==========================================

function calculateMonthlyPayment() {
    // 입력값 검증
    if (!calculatorState.grade || !calculatorState.dailyHours || 
        !calculatorState.copayType || !calculatorState.monthlyDays) {
        return null;
    }

    // 1단계: 총 월 급여비용 계산
    const dailyCost = dailyCareCost[calculatorState.grade][calculatorState.dailyHours];
    const totalMonthlyCost = dailyCost * calculatorState.monthlyDays;

    // 2단계: 월 한도액 적용 및 초과금 계산
    let applicableLimit;
    
    // 한도액 종류 결정 (8시간 이상 AND 15일 이상)
    if (calculatorState.dailyHours >= 8 && calculatorState.monthlyDays >= 15) {
        // 인지지원등급은 상향 한도 없음
        applicableLimit = monthlyLimitIncreased[calculatorState.grade] || 
                         monthlyLimitStandard[calculatorState.grade];
    } else {
        applicableLimit = monthlyLimitStandard[calculatorState.grade];
    }

    // 보험 적용 대상 금액 결정
    const coveredAmount = Math.min(totalMonthlyCost, applicableLimit);
    
    // 한도 초과금 계산
    const overLimitAmount = Math.max(0, totalMonthlyCost - applicableLimit);

    // 3단계: 본인부담금 계산 (급여 항목)
    const copayRatio = copayRate[calculatorState.copayType];
    let copayAmount = coveredAmount * copayRatio;
    
    // 10원 단위 절사
    copayAmount = Math.floor(copayAmount / 10) * 10;

    // 4단계: 비급여 항목 계산 (식사비)
    const dailyMealCost = mealCost[calculatorState.mealType];
    const totalMealCost = dailyMealCost * calculatorState.monthlyDays;

    // 5단계: 최종 월 예상 비용 합산
    const totalUserPayment = copayAmount + overLimitAmount + totalMealCost;

    // 정부 지원금 계산
    const governmentSupport = coveredAmount - copayAmount;

    // 결과 반환
    return {
        // 기본 정보
        grade: calculatorState.grade,
        dailyHours: calculatorState.dailyHours,
        monthlyDays: calculatorState.monthlyDays,
        
        // 비용 계산 결과
        dailyCost: dailyCost,
        totalMonthlyCost: totalMonthlyCost,
        applicableLimit: applicableLimit,
        coveredAmount: coveredAmount,
        overLimitAmount: overLimitAmount,
        
        // 본인부담금
        copayRatio: copayRatio,
        copayAmount: copayAmount,
        
        // 비급여
        dailyMealCost: dailyMealCost,
        totalMealCost: totalMealCost,
        
        // 최종 결과
        totalUserPayment: totalUserPayment,
        governmentSupport: governmentSupport,
        totalServiceCost: totalMonthlyCost + totalMealCost
    };
}

// ==========================================
// 4. UI 업데이트 함수
// ==========================================

function updateCalculationResult() {
    const result = calculateMonthlyPayment();
    
    if (!result) {
        console.log('필수 입력값이 누락되었습니다.');
        return;
    }
    
    // 결과를 화면에 표시
    const resultElement = document.getElementById('calculation-result');
    if (resultElement) {
        resultElement.innerHTML = `
            <div class="result-summary">
                <h3>월 예상 본인부담금</h3>
                <div class="result-total">
                    <span class="amount">${formatNumber(result.totalUserPayment)}원</span>
                </div>
            </div>
            
            <div class="result-details">
                <h4>상세 내역</h4>
                <table class="result-table">
                    <tr>
                        <td>월 총 이용금액</td>
                        <td class="text-right">${formatNumber(result.totalServiceCost)}원</td>
                    </tr>
                    <tr>
                        <td>├ 급여비용</td>
                        <td class="text-right">${formatNumber(result.totalMonthlyCost)}원</td>
                    </tr>
                    <tr>
                        <td>└ 식사비 (비급여)</td>
                        <td class="text-right">${formatNumber(result.totalMealCost)}원</td>
                    </tr>
                    <tr class="separator">
                        <td colspan="2"></td>
                    </tr>
                    <tr>
                        <td>정부 지원금</td>
                        <td class="text-right text-green">-${formatNumber(result.governmentSupport)}원</td>
                    </tr>
                    <tr>
                        <td>본인부담금 (${Math.round(result.copayRatio * 100)}%)</td>
                        <td class="text-right">${formatNumber(result.copayAmount)}원</td>
                    </tr>
                    ${result.overLimitAmount > 0 ? `
                    <tr>
                        <td>한도 초과금</td>
                        <td class="text-right text-red">${formatNumber(result.overLimitAmount)}원</td>
                    </tr>
                    ` : ''}
                    <tr class="total-row">
                        <td><strong>최종 본인부담금</strong></td>
                        <td class="text-right"><strong>${formatNumber(result.totalUserPayment)}원</strong></td>
                    </tr>
                </table>
                
                <div class="result-info">
                    <p>* ${calculatorState.grade === 'cognitive' ? '인지지원' : calculatorState.grade}등급, 
                       일 ${calculatorState.dailyHours}시간, 
                       월 ${calculatorState.monthlyDays}일 이용 기준</p>
                    <p>* 2026년 1월 1일 수가 기준</p>
                </div>
            </div>
        `;
    }
}

// ==========================================
// 5. 유틸리티 함수
// ==========================================

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ==========================================
// 6. 네비게이션 함수
// ==========================================

function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.calculator__step').forEach(s => s.classList.add('hidden'));
    
    // Show current step
    const currentStep = document.getElementById(`step-${step}`);
    if (currentStep) {
        currentStep.classList.remove('hidden');
    }
    
    // Update progress
    document.querySelectorAll('.progress__step').forEach((p, index) => {
        if (index < step) {
            p.classList.add('active');
        } else {
            p.classList.remove('active');
        }
    });
}

function validateStep(step) {
    switch(step) {
        case 1:
            return calculatorState.grade !== null;
        case 2:
            // 조건 1: 최소 하나 이상의 재가 서비스 선택
            const hasSelectedService = calculatorState.selectedHomeServices.size > 0;
            // 조건 2: 만약 주야간보호가 선택되었다면, 시간도 선택해야 함
            const daycareRequirementMet = !calculatorState.selectedHomeServices.has('day-care') || calculatorState.dailyHours !== null;
            return hasSelectedService && daycareRequirementMet;
        case 3:
            return calculatorState.monthlyDays > 0;
        case 4:
            return calculatorState.copayType !== null;
        default:
            return true;
    }
}

function updateButtonStates() {
    console.log('버튼 상태 업데이트 중...');
    
    // next-1 button
    const next1 = document.getElementById('next-1');
    if (next1) {
        const isValid = validateStep(1);
        next1.disabled = !isValid;
        next1.setAttribute('aria-disabled', String(!isValid));
        if (isValid) {
            next1.classList.remove('btn--disabled');
        } else {
            next1.classList.add('btn--disabled');
        }
        console.log('1단계 버튼 상태:', isValid ? '활성화' : '비활성화');
    }
    
    // next-2 button  
    const next2 = document.getElementById('next-2');
    if (next2) {
        const isValid = validateStep(2);
        next2.disabled = !isValid;
        next2.setAttribute('aria-disabled', String(!isValid));
        if (isValid) {
            next2.classList.remove('btn--disabled');
        } else {
            next2.classList.add('btn--disabled');
        }
    }
    
    // next-3 button
    const next3 = document.getElementById('next-3');
    if (next3) {
        const isValid = validateStep(3);
        next3.disabled = !isValid;
        next3.setAttribute('aria-disabled', String(!isValid));
        if (isValid) {
            next3.classList.remove('btn--disabled');
        } else {
            next3.classList.add('btn--disabled');
        }
    }
    
    // calculate button
    const calculate = document.getElementById('calculate');
    if (calculate) {
        const isValid = validateStep(4);
        calculate.disabled = !isValid;
        calculate.setAttribute('aria-disabled', String(!isValid));
        if (isValid) {
            calculate.classList.remove('btn--disabled');
        } else {
            calculate.classList.add('btn--disabled');
        }
    }
}

// ==========================================
// 7. 이벤트 리스너 초기화
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('계산기 초기화 시작');
    
    // Show first step
    showStep(1);
    console.log('첫 번째 단계 표시됨');
    
    // 등급 선택
    const gradeCards = document.querySelectorAll('[data-grade]');
    console.log('등급 카드 개수:', gradeCards.length);
    gradeCards.forEach(card => {
        card.addEventListener('click', function() {
            console.log('등급 선택됨:', this.dataset.grade);
            document.querySelectorAll('[data-grade]').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            calculatorState.grade = this.dataset.grade;
            console.log('계산기 상태 업데이트:', calculatorState);
            updateButtonStates();
        });
    });
    
    // 이용시간 선택
    document.querySelectorAll('[data-hours]').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('[data-hours]').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            calculatorState.dailyHours = parseInt(this.dataset.hours);
            updateButtonStates();
        });
    });
    
    // 이용일수 입력
    const daysInput = document.getElementById('monthly-days');
    if (daysInput) {
        daysInput.addEventListener('input', function() {
            const days = parseInt(this.value);
            if (days > 0 && days <= 31) {
                calculatorState.monthlyDays = days;
                updateButtonStates();
            }
        });
    }
    
    // 본인부담 유형 선택
    document.querySelectorAll('[data-copay]').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('[data-copay]').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            calculatorState.copayType = this.dataset.copay;
            updateButtonStates();
        });
    });
    
    // 식사 선택
    document.querySelectorAll('[data-meal]').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('[data-meal]').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            calculatorState.mealType = this.dataset.meal;
            updateButtonStates();
        });
    });
    
    // 재가급여 서비스 선택
    const homeServiceCards = document.querySelectorAll('.service-card[data-home-service]');
    homeServiceCards.forEach(card => {
        card.addEventListener('click', function() {
            this.classList.toggle('selected');
            
            const service = this.dataset.homeService;
            
            // Update selected services state
            if (this.classList.contains('selected')) {
                calculatorState.selectedHomeServices.add(service);
            } else {
                calculatorState.selectedHomeServices.delete(service);
            }

            const daycareHoursContainer = document.getElementById('daycare-hours');
            
            // 주야간보호 선택 시 이용시간 옵션 표시/숨김
            if (service === 'day-care') {
                if (this.classList.contains('selected')) {
                    daycareHoursContainer.style.display = 'block';
                } else {
                    daycareHoursContainer.style.display = 'none';
                    // 주야간보호 선택 해제 시 시간 선택도 초기화
                    calculatorState.dailyHours = null; 
                    document.querySelectorAll('[data-hours]').forEach(o => o.classList.remove('selected'));
                }
            }
            // 버튼 상태 즉시 업데이트
            updateButtonStates();
        });
    });
    
    // Navigation buttons
    const next1 = document.getElementById('next-1');
    console.log('next-1 버튼:', next1);
    if (next1) {
        next1.addEventListener('click', function() {
            console.log('next-1 버튼 클릭됨');
            if (validateStep(1)) {
                console.log('1단계 유효성 검사 통과');
                showStep(2);
            } else {
                console.log('1단계 유효성 검사 실패');
            }
        });
    }
    
    const prev2 = document.getElementById('prev-2');
    if (prev2) {
        prev2.addEventListener('click', function() {
            showStep(1);
        });
    }
    
    const next2 = document.getElementById('next-2');
    if (next2) {
        next2.addEventListener('click', function() {
            if (validateStep(2)) {
                showStep(3);
            }
        });
    }
    
    const prev3 = document.getElementById('prev-3');
    if (prev3) {
        prev3.addEventListener('click', function() {
            showStep(2);
        });
    }
    
    const next3 = document.getElementById('next-3');
    if (next3) {
        next3.addEventListener('click', function() {
            if (validateStep(3)) {
                showStep(4);
            }
        });
    }
    
    const prev4 = document.getElementById('prev-4');
    if (prev4) {
        prev4.addEventListener('click', function() {
            showStep(3);
        });
    }
    
    const calculate = document.getElementById('calculate');
    if (calculate) {
        calculate.addEventListener('click', function() {
            if (validateStep(4)) {
                updateCalculationResult();
                showStep(5);
            }
        });
    }
    
    const recalculate = document.getElementById('recalculate');
    if (recalculate) {
        recalculate.addEventListener('click', function() {
            // Reset state
            calculatorState.grade = null;
            calculatorState.dailyHours = null;
            calculatorState.monthlyDays = 21;
            calculatorState.copayType = null;
            calculatorState.mealType = '1';
            calculatorState.selectedHomeServices.clear(); // 서비스 선택 초기화
            
            // Reset UI
            document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
            document.getElementById('monthly-days').value = 21;
            document.querySelector('[data-meal="1"]').classList.add('selected');
            
            // 주야간보호 시간 선택 UI 숨김
            const daycareHoursContainer = document.getElementById('daycare-hours');
            if (daycareHoursContainer) {
                daycareHoursContainer.style.display = 'none';
            }

            updateButtonStates();
            showStep(1);
        });
    }
    
    // Initial button states
    updateButtonStates();
});

// Export for debugging
window.calculatorState = calculatorState;
window.calculateMonthlyPayment = calculateMonthlyPayment;
window.showStep = showStep;