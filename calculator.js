// CareFull Cost Calculator

// Calculator state
const calculatorState = {
    grade: null,
    serviceType: null,
    homeServices: [],
    reduction: null
};

// Cost data (2025년 기준)
const costData = {
    // 재가급여 월 한도액 (원)
    homeCareLimit: {
        1: 1997500,
        2: 1869600,
        3: 1455800,
        4: 1341800,
        5: 1151100,
        cognitive: 642400
    },
    
    // 시설급여 일일 수가 (원)
    facilityCost: {
        1: 83360,
        2: 83360,
        3: 76860,
        4: 76860,
        5: 76860,
        cognitive: 0 // 인지지원등급은 시설급여 불가
    },
    
    // 본인부담률
    copayRate: {
        home: 0.15,      // 재가급여 15%
        facility: 0.20   // 시설급여 20%
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

// Step 2: Service type selection
document.querySelectorAll('[data-service]').forEach(card => {
    card.addEventListener('click', function() {
        // Remove previous selection
        document.querySelectorAll('[data-service]').forEach(c => c.classList.remove('selected'));
        
        // Add selection
        this.classList.add('selected');
        calculatorState.serviceType = this.dataset.service;
        
        // Show/hide home services
        const homeServices = document.getElementById('home-services');
        if (this.dataset.service === 'home') {
            homeServices.classList.remove('hidden');
            document.getElementById('next-2').disabled = calculatorState.homeServices.length === 0;
            document.getElementById('next-2').setAttribute('aria-disabled', String(calculatorState.homeServices.length === 0));
        } else {
            homeServices.classList.add('hidden');
            document.getElementById('next-2').disabled = false;
            document.getElementById('next-2').setAttribute('aria-disabled', 'false');
        }
    });
});

// Home service selection
document.querySelectorAll('[data-home-service]').forEach(item => {
    item.addEventListener('click', function() {
        this.classList.toggle('selected');
        
        const service = this.dataset.homeService;
        if (this.classList.contains('selected')) {
            if (!calculatorState.homeServices.includes(service)) {
                calculatorState.homeServices.push(service);
            }
        } else {
            calculatorState.homeServices = calculatorState.homeServices.filter(s => s !== service);
        }
        
        // Enable/disable next button
        document.getElementById('next-2').disabled = calculatorState.homeServices.length === 0;
        document.getElementById('next-2').setAttribute('aria-disabled', String(calculatorState.homeServices.length === 0));
    });
});

// Step 3: Reduction selection
document.querySelectorAll('[data-reduction]').forEach(card => {
    card.addEventListener('click', function() {
        // Remove previous selection
        document.querySelectorAll('[data-reduction]').forEach(c => c.classList.remove('selected'));
        
        // Add selection
        this.classList.add('selected');
        calculatorState.reduction = parseInt(this.dataset.reduction);
        
        // Enable calculate button
        document.getElementById('calculate').disabled = false;
    });
});

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
        calculatorState.reduction = null;
        
        // Reset UI
        document.querySelectorAll('.selected').forEach(function(el){ el.classList.remove('selected'); });
        var n1 = document.getElementById('next-1'); if (n1) n1.disabled = true;
        var n2 = document.getElementById('next-2'); if (n2) n2.disabled = true;
        var cal = document.getElementById('calculate'); if (cal) cal.disabled = true;
        
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
    
    if (calculatorState.serviceType === 'home') {
        // 재가급여: 월 한도액 사용
        totalCost = costData.homeCareLimit[calculatorState.grade] || 0;
        selfPayRate = costData.copayRate.home;
    } else {
        // 시설급여: 일일 수가 * 30일
        const dailyCost = costData.facilityCost[calculatorState.grade] || 0;
        totalCost = dailyCost * 30;
        selfPayRate = costData.copayRate.facility;
    }
    
    // Apply reduction
    if (calculatorState.reduction === 100) {
        selfPayAmount = 0;
        selfPayRate = 0;
    } else if (calculatorState.reduction === 60) {
        selfPayAmount = totalCost * selfPayRate * 0.4; // 60% 감경 = 40% 부담
        selfPayRate = selfPayRate * 0.4;
    } else if (calculatorState.reduction === 40) {
        selfPayAmount = totalCost * selfPayRate * 0.6; // 40% 감경 = 60% 부담
        selfPayRate = selfPayRate * 0.6;
    } else {
        selfPayAmount = totalCost * selfPayRate;
    }
    
    const govSupport = totalCost - selfPayAmount;
    
    // Update UI
    document.getElementById('result-amount').textContent = formatNumber(Math.round(selfPayAmount)) + '원';
    document.getElementById('total-cost').textContent = formatNumber(Math.round(totalCost)) + '원';
    document.getElementById('gov-support').textContent = formatNumber(Math.round(govSupport)) + '원';
    document.getElementById('self-rate').textContent = Math.round(selfPayRate * 100) + '%';
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Show first step
    showStep(1);
});