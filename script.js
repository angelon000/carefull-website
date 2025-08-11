// CareFull - Interactive JavaScript

// Initialize all features when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeScrollEffects();
    initializeSmoothScrolling();
});

// Initialize Scroll Effects for Navigation
function initializeScrollEffects() {
    const nav = document.querySelector('.nav');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        // Add scrolled class for enhanced styling
        if (currentScrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        
        // Optional: Hide nav on scroll down, show on scroll up
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            nav.style.transform = 'translateY(-100%)';
        } else {
            nav.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
    });
}

// Initialize Smooth Scrolling
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = document.querySelector('.nav').offsetHeight;
                const targetPosition = target.offsetTop - navHeight - 20;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Mobile menu toggle
const navToggle = document.querySelector('.nav__toggle');
const navMenu = document.querySelector('.nav__menu');
const navCta = document.querySelector('.nav__cta');
const body = document.body;

let mobileMenuOpen = false;

navToggle?.addEventListener('click', function() {
    mobileMenuOpen = !mobileMenuOpen;
    navToggle.setAttribute('aria-expanded', mobileMenuOpen ? 'true' : 'false');
    
    if (mobileMenuOpen) {
        // Create mobile menu overlay
        createMobileMenu();
        body.style.overflow = 'hidden';
    } else {
        // Remove mobile menu overlay
        removeMobileMenu();
        body.style.overflow = '';
    }
});

function createMobileMenu() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1001;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    // Create menu container
    const menuContainer = document.createElement('div');
    menuContainer.className = 'mobile-menu-container';
    menuContainer.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: 280px;
        height: 100vh;
        background: white;
        z-index: 1002;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        padding: 80px 20px 20px;
        box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
        overflow-y: auto;
    `;
    
    // Copy navigation links
    const navLinks = navMenu?.querySelectorAll('a') || [];
    navLinks.forEach(link => {
        const mobileLink = link.cloneNode(true);
        mobileLink.style.cssText = `
            display: block;
            padding: 15px 0;
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--gray-800);
            text-decoration: none;
            border-bottom: 1px solid var(--gray-200);
            transition: color 0.2s ease;
        `;
        mobileLink.addEventListener('click', () => {
            removeMobileMenu();
            body.style.overflow = '';
            mobileMenuOpen = false;
        });
        menuContainer.appendChild(mobileLink);
    });
    
    // Add CTA button
    if (navCta) {
        const mobileCta = navCta.cloneNode(true);
        mobileCta.style.cssText = `
            display: block;
            margin-top: 20px;
            width: 100%;
            text-align: center;
            padding: 12px 20px;
            background: var(--primary-teal);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: background 0.2s ease;
        `;
        mobileCta.addEventListener('click', () => {
            removeMobileMenu();
            body.style.overflow = '';
            mobileMenuOpen = false;
        });
        menuContainer.appendChild(mobileCta);
    }
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--gray-600);
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s ease;
    `;
    closeButton.addEventListener('click', () => {
        removeMobileMenu();
        body.style.overflow = '';
        mobileMenuOpen = false;
    });
    menuContainer.appendChild(closeButton);
    
    // Add to DOM
    body.appendChild(overlay);
    body.appendChild(menuContainer);
    
    // Trigger animations
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        menuContainer.style.transform = 'translateX(0)';
    });
    
    // Close on overlay click
    overlay.addEventListener('click', () => {
        removeMobileMenu();
        body.style.overflow = '';
        mobileMenuOpen = false;
    });
}

function removeMobileMenu() {
    const overlay = document.querySelector('.mobile-menu-overlay');
    const container = document.querySelector('.mobile-menu-container');
    
    if (overlay && container) {
        overlay.style.opacity = '0';
        container.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            overlay.remove();
            container.remove();
        }, 300);
    }
}

// Contact form handling
const contactForm = document.getElementById('contactForm');
contactForm?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton?.textContent;
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '전송 중...';
    }
    
    const formData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        type: document.getElementById('type').value,
        message: document.getElementById('message').value
    };
    
    try {
        const webhookUrl = window.CAREFULL_CONTACT_WEBHOOK || '';
        if (webhookUrl) {
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source: 'carefull-website', ...formData })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
        }
        alert('상담 신청이 완료되었습니다. 빠른 시일 내에 연락드리겠습니다.');
        contactForm.reset();
    } catch (err) {
        console.warn('Form submit failed, falling back to alert only:', err);
        alert('상담 신청이 접수되었습니다. 네트워크 상태에 따라 처리에 시간이 걸릴 수 있습니다.');
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalText || '상담 신청하기';
        }
    }
});

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            
            // Special animations for specific elements
            if (entry.target.classList.contains('puzzle-piece')) {
                setTimeout(() => {
                    entry.target.style.transform = 'scale(1.05)';
                    setTimeout(() => {
                        entry.target.style.transform = 'scale(1)';
                    }, 200);
                }, Math.random() * 500);
            }
            
            if (entry.target.classList.contains('stat')) {
                animateNumber(entry.target.querySelector('.stat__number'));
            }
            
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all cards and sections
document.querySelectorAll('.card, .section, .puzzle-piece, .stat, .vision-card').forEach(el => {
    observer.observe(el);
});

// Number animation function
function animateNumber(element) {
    if (!element) return;
    
    const finalText = element.textContent;
    const finalNumber = parseInt(finalText.replace(/[^\d]/g, ''));
    
    if (isNaN(finalNumber)) return;
    
    const duration = 2000;
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentNumber = Math.floor(easeOut * finalNumber);
        
        element.textContent = finalText.replace(/\d+/, currentNumber);
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        } else {
            element.textContent = finalText;
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Nav background on scroll
let lastScroll = 0;
const nav = document.querySelector('.nav');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        nav.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    } else {
        nav.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// Phone number formatting
document.getElementById('phone')?.addEventListener('input', function(e) {
    let value = e.target.value.replace(/[^\d]/g, '');
    if (value.length > 3 && value.length <= 7) {
        value = value.slice(0, 3) + '-' + value.slice(3);
    } else if (value.length > 7) {
        value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
    }
    e.target.value = value;
});

// Tooltip functionality
function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
        element.addEventListener('focus', showTooltip);
        element.addEventListener('blur', hideTooltip);
    });
}

function showTooltip(e) {
    const text = e.target.getAttribute('data-tooltip');
    if (!text) return;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
        position: absolute;
        background: var(--primary-dark);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.875rem;
        white-space: nowrap;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        transform: translateY(-100%);
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
    
    requestAnimationFrame(() => {
        tooltip.style.opacity = '1';
    });
    
    e.target._tooltip = tooltip;
}

function hideTooltip(e) {
    if (e.target._tooltip) {
        e.target._tooltip.style.opacity = '0';
        setTimeout(() => {
            if (e.target._tooltip) {
                e.target._tooltip.remove();
                delete e.target._tooltip;
            }
        }, 200);
    }
}

// Progress bar for calculator
function updateCalculatorProgress(step) {
    const progressSteps = document.querySelectorAll('.progress__step');
    progressSteps.forEach((stepEl, index) => {
        if (index < step) {
            stepEl.classList.add('active');
        } else {
            stepEl.classList.remove('active');
        }
    });
}

// Lazy loading for images
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => {
        imageObserver.observe(img);
    });
}

// Parallax effect for hero sections
function initParallax() {
    const parallaxElements = document.querySelectorAll('.hero, .story-hero');
    if (!parallaxElements.length) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (reduceMotion || isMobile) return;
    let ticking = false;
    const update = () => {
        const scrolled = window.pageYOffset;
        parallaxElements.forEach(element => {
            const rate = scrolled * -0.15;
            element.style.transform = `translate3d(0, ${rate}px, 0)`;
        });
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });
}

// Form validation enhancement
function enhanceFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('blur', validateInput);
            input.addEventListener('input', clearErrors);
        });
    });
}

function validateInput(e) {
    const input = e.target;
    const value = input.value.trim();
    
    // Clear previous errors
    clearInputError(input);
    
    // Validate based on input type
    if (input.required && !value) {
        showInputError(input, '필수 입력 항목입니다.');
        return false;
    }
    
    if (input.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showInputError(input, '올바른 이메일 형식을 입력해주세요.');
            return false;
        }
    }
    
    if (input.type === 'tel' && value) {
        const phoneRegex = /^\d{3}-\d{4}-\d{4}$/;
        if (!phoneRegex.test(value)) {
            showInputError(input, '올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)');
            return false;
        }
    }
    
    return true;
}

function showInputError(input, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'input-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: var(--error);
        font-size: 0.875rem;
        margin-top: 4px;
        display: block;
    `;
    
    input.style.borderColor = 'var(--error)';
    input.parentNode.appendChild(errorDiv);
}

function clearInputError(input) {
    const errorDiv = input.parentNode.querySelector('.input-error');
    if (errorDiv) {
        errorDiv.remove();
    }
    input.style.borderColor = '';
}

function clearErrors(e) {
    const input = e.target;
    if (input.value.trim()) {
        clearInputError(input);
    }
}

// Back to top button
function initBackToTop() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '↑';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: var(--primary-teal);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 1.25rem;
        cursor: pointer;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        box-shadow: var(--shadow-lg);
    `;
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    document.body.appendChild(backToTopBtn);
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.opacity = '1';
            backToTopBtn.style.visibility = 'visible';
        } else {
            backToTopBtn.style.opacity = '0';
            backToTopBtn.style.visibility = 'hidden';
        }
    });
}

// Initialize all enhancements
document.addEventListener('DOMContentLoaded', () => {
    initTooltips();
    initLazyLoading();
    initParallax();
    enhanceFormValidation();
    initBackToTop();
    
    console.log("CareFull website script loaded successfully with all enhancements");
});