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
    card.addEventListener('click', function() {
        // Remove previous selection
        document.querySelectorAll('[data-grade]').forEach(c => c.classList.remove('selected'));
        
        // Add selection
        this.classList.add('selected');
        calculatorState.grade = this.dataset.grade;
        
        // Enable next button
        document.getElementById('next-1').disabled = false;
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
        } else {
            homeServices.classList.add('hidden');
            document.getElementById('next-2').disabled = false;
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
document.getElementById('next-1')?.addEventListener('click', () => {
    showStep(2);
});

document.getElementById('prev-2')?.addEventListener('click', () => {
    showStep(1);
});

document.getElementById('next-2')?.addEventListener('click', () => {
    showStep(3);
});

document.getElementById('prev-3')?.addEventListener('click', () => {
    showStep(2);
});

document.getElementById('calculate')?.addEventListener('click', () => {
    calculateCost();
    showStep(4);
});

document.getElementById('recalculate')?.addEventListener('click', () => {
    // Reset state
    calculatorState.grade = null;
    calculatorState.serviceType = null;
    calculatorState.homeServices = [];
    calculatorState.reduction = null;
    
    // Reset UI
    document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    document.getElementById('next-1').disabled = true;
    document.getElementById('next-2').disabled = true;
    document.getElementById('calculate').disabled = true;
    
    showStep(1);
});

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
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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