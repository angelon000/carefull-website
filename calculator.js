// CareFull Cost Calculator

// Calculator state
const calculatorState = {
    grade: null,
    serviceType: null,
    homeServices: [],
    daycareHours: null, // 주야간보호 선택 시에만 설정
    reduction: null
};

// Cost data (2026년 1월 1일 기준)
const costData = {
    // 재가급여 월 한도액 (원)
    homeCareLimit: {
        1: 2306400,
        2: 2083400,
        3: 1485700,
        4: 1370600,
        5: 1177000,
        cognitive: 657400
    },
    
    // 주야간보호 이용시간별 급여비용 (원/일)
    dayCareCost: {
        // 3시간
        3: {
            1: 40650,
            2: 37630,
            3: 34740,
            4: 33160,
            5: 31580,
            cognitive: 31580
        },
        // 6시간
        6: {
            1: 54490,
            2: 50470,
            3: 46590,
            4: 45000,
            5: 43400,
            cognitive: 43400
        },
        // 8시간
        8: {
            1: 67770,
            2: 62780,
            3: 57960,
            4: 56380,
            5: 54780,
            cognitive: 54780
        },
        // 10시간 이상
        10: {
            1: 74660,
            2: 69160,
            3: 63900,
            4: 62290,
            5: 60710,
            cognitive: 54782
        }
    },
    
    // 하루3시간 이상, 월15회 이상 이용 시 20% 상한되는 월 한도액(원)
    dayCareMonthlyLimit: {
        1: 2767680,
        2: 2500080,
        3: 1782840,
        4: 1644720,
        5: 1412400
    },
    
    // 시설급여 일일 수가 (원)
    facilityCost: {
        1: 89290,  // 2026년 기준 업데이트
        2: 82770,
        3: 76260,
        4: 76260,
        5: 76260,
        cognitive: 0 // 인지지원등급은 시설급여 불가
    },
    
    // 본인부담률
    copayRate: {
        home: 0.15,      // 재가급여 15%
        daycare: 0.15,   // 주야간보호 15%
        facility: 0.20   // 시설급여 20%
    },
    
    // 수급자 자격별 급여비용 본인부담 비율 (일반 15%, 경감대상자 9%, 감 6%, 기초수급권자 0%)
    reductionRates: {
        normal: 0.15,       // 일반: 15% 부담
        reduced40: 0.09,    // 경감대상자: 9% 부담
        reduced60: 0.06,    // 감: 6% 부담
        welfare: 0          // 기초수급권자: 0% 부담
    },
    
    // 비급여 본인부담 (원/일)
    nonCoveredCost: {
        meal: {
            1: 4500,  // 1일 1식 급간식비
            2: 8000   // 1일 2식 급간식비
        },
        careHelperFee: "해당 급간식비 + 외래진료비 = 비급여 본인부담비용"
    },
    
    // 급여 본인부담금 예상금액 (하루8시간 월 21회 기준)
    monthlyEstimate: {
        1: {
            welfare: 0,
            reduced60: 85386,
            reduced40: 128079,
            normal: 213465
        },
        2: {
            welfare: 0,
            reduced60: 79086,
            reduced40: 118650,
            normal: 197757
        },
        3: {
            welfare: 0,
            reduced60: 73017,
            reduced40: 109536,
            normal: 182574
        },
        4: {
            welfare: 0,
            reduced60: 71022,
            reduced40: 106554,
            normal: 177597
        },
        5: {
            welfare: 0,
            reduced60: 69006,
            reduced40: 103530,
            normal: 172557
        }
    }
};

// Step 1: Grade selection
document.querySelectorAll('[data-grade]').forEach(card => {
    // 접근성 속성
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-pressed', 'false');

    function selectGrade() {
        // Remove previous selection
        document.querySelectorAll('[data-grade]').forEach(c => {
            c.classList.remove('selected');
            c.setAttribute('aria-pressed', 'false');
        });
        
        // Add selection
        card.classList.add('selected');
        card.setAttribute('aria-pressed', 'true');
        calculatorState.grade = card.dataset.grade;
        
        // Enable next button
        document.getElementById('next-1').disabled = false;
        document.getElementById('next-1').setAttribute('aria-disabled', 'false');
    }

    card.addEventListener('click', selectGrade);
    card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectGrade();
        }
    });
});

// Step 2: Service type selection (새로운 UI에 맞게 수정)
function initServiceTypeSelection() {
    const serviceTypeCards = document.querySelectorAll('.service-type-card');
    serviceTypeCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove previous selection
            serviceTypeCards.forEach(c => c.classList.remove('selected'));
            
            // Add selection
            this.classList.add('selected');
            calculatorState.serviceType = this.dataset.service;
            
            // Show/hide home services
            const homeServices = document.getElementById('home-services');
            const next2 = document.getElementById('next-2');
            
            if (this.dataset.service === 'home') {
                if (homeServices) {
                    homeServices.style.display = 'block';
                }
                // next-2 버튼은 홈 서비스가 선택되었을 때만 활성화
                updateNext2Button();
            } else {
                if (homeServices) {
                    homeServices.style.display = 'none';
                }
                // 시설급여 선택 시 바로 활성화
                if (next2) {
                    next2.disabled = false;
                    next2.setAttribute('aria-disabled', 'false');
                }
            }
        });
    });
}

// Home service selection (새로운 카드 UI)
function initHomeServiceSelection() {
    const homeServiceCards = document.querySelectorAll('.service-card[data-home-service]');
    homeServiceCards.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('selected');
            
            const service = this.dataset.homeService;
            if (this.classList.contains('selected')) {
                if (!calculatorState.homeServices.includes(service)) {
                    calculatorState.homeServices.push(service);
                }
                // 주야간보호 선택 시 시간 선택 표시
                if (service === 'day-care') {
                    const daycareHours = document.getElementById('daycare-hours');
                    if (daycareHours) {
                        daycareHours.style.display = 'block';
                    }
                    // 8시간을 기본으로 선택
                    if (calculatorState.daycareHours === null) {
                        calculatorState.daycareHours = 8;
                        const hour8Option = document.querySelector('.time-option[data-hours="8"]');
                        if (hour8Option) {
                            hour8Option.classList.add('selected');
                        }
                    }
                }
            } else {
                calculatorState.homeServices = calculatorState.homeServices.filter(s => s !== service);
                // 주야간보호 해제 시 시간 선택 숨기기
                if (service === 'day-care') {
                    const daycareHours = document.getElementById('daycare-hours');
                    if (daycareHours) {
                        daycareHours.style.display = 'none';
                    }
                }
            }
            
            // Update next button
            updateNext2Button();
        });
    });
}

// Daycare hours selection
function initDaycareHoursSelection() {
    const timeOptions = document.querySelectorAll('.time-option');
    timeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove previous selection
            timeOptions.forEach(o => o.classList.remove('selected'));
            
            // Add selection
            this.classList.add('selected');
            calculatorState.daycareHours = parseInt(this.dataset.hours);
        });
    });
}

// Step 3: Reduction selection (새로운 reduction-card 클래스에 맞게 수정)
function initReductionSelection() {
    const reductionCards = document.querySelectorAll('.reduction-card');
    reductionCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove previous selection
            reductionCards.forEach(c => c.classList.remove('selected'));
            
            // Add selection
            this.classList.add('selected');
            calculatorState.reduction = parseInt(this.dataset.reduction);
            
            // Enable calculate button
            const calculateBtn = document.getElementById('calculate');
            if (calculateBtn) {
                calculateBtn.disabled = false;
                calculateBtn.setAttribute('aria-disabled', 'false');
            }
        });
    });
}

// Navigation buttons
var next1Btn = document.getElementById('next-1');
if (next1Btn) {
    next1Btn.addEventListener('click', function(e) {
        if (!calculatorState.grade) {
            alert('먼저 등급을 선택해주세요.');
            return;
        }
        showStep(2);
    });
}

var prev2Btn = document.getElementById('prev-2');
if (prev2Btn) {
    prev2Btn.addEventListener('click', function() {
        showStep(1);
    });
}

var next2Btn = document.getElementById('next-2');
if (next2Btn) {
    next2Btn.addEventListener('click', function() {
        
        if (!calculatorState.serviceType) {
            alert('서비스를 선택해주세요.');
            return;
        }
        if (calculatorState.serviceType === 'home' && calculatorState.homeServices.length === 0) {
            alert('재가급여 서비스를 하나 이상 선택해주세요.');
            return;
        }
        showStep(3);
    });
}

var prev3Btn = document.getElementById('prev-3');
if (prev3Btn) {
    prev3Btn.addEventListener('click', function() {
        showStep(2);
    });
}

var calcBtn = document.getElementById('calculate');
if (calcBtn) {
    calcBtn.addEventListener('click', function() {
        if (calculatorState.reduction == null) {
            alert('감경 대상을 선택해주세요.');
            return;
        }
        calculateCost();
        showStep(4);
    });
}

var recalcBtn = document.getElementById('recalculate');
if (recalcBtn) {
    recalcBtn.addEventListener('click', function() {
        // Reset state
        calculatorState.grade = null;
        calculatorState.serviceType = null;
        calculatorState.homeServices = [];
        calculatorState.daycareHours = null;
        calculatorState.reduction = null;
        
        // Reset UI
        document.querySelectorAll('.selected').forEach(function(el){ el.classList.remove('selected'); });
        
        // Hide home services and daycare hours
        const homeServices = document.getElementById('home-services');
        const daycareHours = document.getElementById('daycare-hours');
        if (homeServices) homeServices.style.display = 'none';
        if (daycareHours) daycareHours.style.display = 'none';
        
        // Reset buttons
        var n1 = document.getElementById('next-1'); if (n1) n1.disabled = true;
        var n2 = document.getElementById('next-2'); if (n2) n2.disabled = true;
        var cal = document.getElementById('calculate'); if (cal) cal.disabled = true;
        
        // Re-select home service type as default
        const homeServiceCard = document.querySelector('.service-type-card[data-service="home"]');
        if (homeServiceCard) {
            homeServiceCard.classList.add('selected');
            calculatorState.serviceType = 'home';
            if (homeServices) homeServices.style.display = 'block';
        }
        
        updateNext2Button();
        showStep(1);
    });
}

// Show specific step
function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.calculator__step').forEach(s => s.classList.add('hidden'));
    
    // Show current step
    document.getElementById(`step-${step}`).classList.remove('hidden');
    
    // Update progress
    document.querySelectorAll('.progress__step').forEach((p, index) => {
        if (index < step) {
            p.classList.add('active');
        } else {
            p.classList.remove('active');
        }
    });
    
    // Removed automatic scroll to calculator section for better UX
}

// Calculate cost
function calculateCost() {
    let totalCost = 0;
    let selfPayRate = 0;
    let selfPayAmount = 0;
    let govSupport = 0;
    
    if (calculatorState.serviceType === 'home') {
        // 재가급여 계산
        if (calculatorState.homeServices.includes('day-care')) {
            // 주야간보호 - 사용자가 선택한 시간 기준 월 21일 이용 가정
            const hours = calculatorState.daycareHours || 8;
            const dailyCost = costData.dayCareCost[hours][calculatorState.grade] || costData.dayCareCost[hours]['cognitive'];
            totalCost = dailyCost * 21; // 월 21일 이용
            
            // 하루3시간 이상, 월15회 이상 이용 시 20% 상한 적용
            const monthlyLimit = costData.dayCareMonthlyLimit[calculatorState.grade] || (costData.homeCareLimit[calculatorState.grade] * 1.2);
            
            if (totalCost > monthlyLimit) {
                totalCost = monthlyLimit;
            }
            
            selfPayRate = costData.copayRate.daycare;
        } else {
            // 기타 재가급여: 월 한도액의 70% 사용 가정
            const monthlyLimit = costData.homeCareLimit[calculatorState.grade] || costData.homeCareLimit['cognitive'];
            totalCost = monthlyLimit * 0.7;
            selfPayRate = costData.copayRate.home;
        }
    } else {
        // 시설급여: 일일 수가 * 30일
        const dailyCost = costData.facilityCost[calculatorState.grade] || costData.facilityCost['cognitive'];
        if (dailyCost === 0) {
            // 인지지원등급은 시설급여 불가
            totalCost = 0;
            selfPayRate = 0;
        } else {
            totalCost = dailyCost * 30;
            selfPayRate = costData.copayRate.facility;
        }
    }
    
    // 감경 적용 (이미지 기준: 일반 15%, 경감대상자 9%, 감 6%, 기초수급자 0%)
    let actualSelfPayRate = selfPayRate;
    if (calculatorState.reduction === 100) {
        actualSelfPayRate = 0; // 기초수급자: 0%
    } else if (calculatorState.reduction === 60) {
        actualSelfPayRate = 0.06; // 감: 6%
    } else if (calculatorState.reduction === 40) {
        actualSelfPayRate = 0.09; // 경감대상자: 9%
    } else {
        actualSelfPayRate = 0.15; // 일반: 15%
    }
    
    // 본인부담금 계산
    selfPayAmount = totalCost * actualSelfPayRate;
    
    // 정부지원금 계산
    govSupport = totalCost - selfPayAmount;
    
    // 실제 부담률 계산
    const effectiveRate = totalCost > 0 ? (selfPayAmount / totalCost) : 0;
    
    // Update UI
    document.getElementById('result-amount').textContent = formatNumber(Math.round(selfPayAmount)) + '원';
    document.getElementById('total-cost').textContent = formatNumber(Math.round(totalCost)) + '원';
    document.getElementById('gov-support').textContent = formatNumber(Math.round(govSupport)) + '원';
    document.getElementById('self-rate').textContent = Math.round(effectiveRate * 100) + '%';
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Next-2 버튼 활성화 로직
function updateNext2Button() {
    const next2 = document.getElementById('next-2');
    if (!next2) return;
    
    if (calculatorState.serviceType === 'home') {
        // 재가급여 선택 시: 홈 서비스가 하나 이상 선택되어야 함
        const shouldEnable = calculatorState.homeServices.length > 0;
        next2.disabled = !shouldEnable;
        next2.setAttribute('aria-disabled', String(!shouldEnable));
    } else if (calculatorState.serviceType === 'facility') {
        // 시설급여 선택 시: 바로 활성화
        next2.disabled = false;
        next2.setAttribute('aria-disabled', 'false');
    } else {
        // 서비스 타입이 선택되지 않았을 때
        next2.disabled = true;
        next2.setAttribute('aria-disabled', 'true');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all event listeners
    initServiceTypeSelection();
    initHomeServiceSelection();
    initDaycareHoursSelection();
    initReductionSelection();
    
    // Show first step
    showStep(1);
    
    // 재가급여 기본 선택 설정
    const homeServiceCard = document.querySelector('.service-type-card[data-service="home"]');
    if (homeServiceCard) {
        homeServiceCard.classList.add('selected');
        calculatorState.serviceType = 'home';
        
        // 재가급여 서비스 컨테이너 표시
        const homeServices = document.getElementById('home-services');
        if (homeServices) {
            homeServices.style.display = 'block';
        }
    }
    
    // 초기 next-2 버튼 상태 업데이트
    updateNext2Button();
    
    // 초기 상태에서는 주야간보호 시간 선택 숨기기
    const daycareHours = document.getElementById('daycare-hours');
    if (daycareHours) {
        daycareHours.style.display = 'none';
    }
});