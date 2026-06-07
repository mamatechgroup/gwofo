// main.js - Consolidated and Optimized Main JavaScript File

// DOM Ready Event
document.addEventListener('DOMContentLoaded', function() {
    initializeAllFunctionality();
});

// Main initialization function
function initializeAllFunctionality() {
    // Initialize all core functionality
    initNavigation();
    initForms();
    initSliders();
    initInteractiveElements();
    initAnimations();
    initDropdowns();
    
    // Setup event listeners
    setupEventListeners();
}

// ==========================================================================
// NAVIGATION FUNCTIONS
// ==========================================================================

function initNavigation() {
    initMobileNavigation();
    initSmoothScrolling();
    initStickyNavigation();
    highlightActiveNav();
}

function initMobileNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');
    const body = document.body;
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            navMenu.classList.toggle('active');
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
            
            // Toggle body overflow to prevent scrolling when menu is open
            if (navMenu.classList.contains('active')) {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = '';
            }
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const icon = navToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
                body.style.overflow = ''; // Restore scrolling
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (window.innerWidth <= 992) { // Only on mobile
                if (!navToggle.contains(event.target) && 
                    !navMenu.contains(event.target) && 
                    navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    const icon = navToggle.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                    body.style.overflow = ''; // Restore scrolling
                }
            }
        });
        
        // Also close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                const icon = navToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
                body.style.overflow = '';
            }
        });
    }
}

function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const headerHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initStickyNavigation() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            if (scrollTop > lastScrollTop) {
                // Scrolling down
                navbar.style.transform = 'translateY(-100%)';
            } else {
                // Scrolling up
                navbar.style.transform = 'translateY(0)';
                navbar.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
            }
        } else {
            navbar.style.transform = 'translateY(0)';
            navbar.style.boxShadow = 'none';
        }
        
        lastScrollTop = scrollTop;
    });
}

function highlightActiveNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-menu > li > a:not(.dropdown-menu a)');
    
    // First, remove all active classes
    navLinks.forEach(link => {
        link.classList.remove('active');
        // Also remove active from parent dropdown if exists
        const parentDropdown = link.parentElement;
        if (parentDropdown.classList.contains('dropdown')) {
            parentDropdown.classList.remove('active');
        }
    });
    
    // Now find and mark the correct active link
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        
        // Skip hash links
        if (linkHref.startsWith('#')) return;
        
        // Handle exact matches first
        if (linkHref === currentPath || 
            (currentPath === '/' && linkHref === '/index.html') ||
            (currentPath.endsWith('/') && linkHref === 'index.html')) {
            link.classList.add('active');
            return;
        }
        
        // Handle project pages specially
        if (linkHref === '#projects.html' && currentPath.includes('projects')) {
            // Find the closest dropdown parent
            const dropdown = link.closest('.dropdown');
            if (dropdown) {
                link.classList.add('active');
                dropdown.classList.add('active');
            }
            return;
        }
        
        // Handle partner pages specially
        if (linkHref === '#partners.html' && 
            (currentPath.includes('partners') || 
             currentPath.includes('report') || 
             currentPath.includes('become-partner'))) {
            const dropdown = link.closest('.dropdown');
            if (dropdown) {
                link.classList.add('active');
                dropdown.classList.add('active');
            }
            return;
        }
        
        // Handle about pages specially
        if (linkHref === '#about.html' && 
            (currentPath.includes('about') || 
             currentPath.includes('team') || 
             currentPath.includes('board') || 
             currentPath.includes('impact'))) {
            const dropdown = link.closest('.dropdown');
            if (dropdown) {
                link.classList.add('active');
                dropdown.classList.add('active');
            }
            return;
        }
        
        // Handle blog page
        if (linkHref === '/admin/posts-feed.html' && currentPath.includes('posts-feed')) {
            link.classList.add('active');
            return;
        }
        
        // Handle contact page
        if (linkHref === '/contact.html' && currentPath.includes('contact')) {
            link.classList.add('active');
            return;
        }
        
        // Handle index/home page
        if ((linkHref === '/index.html' || linkHref === '/') && 
            (currentPath === '/' || currentPath === '' || currentPath.endsWith('index.html'))) {
            link.classList.add('active');
            return;
        }
    });
    
    // Also highlight dropdown menu items
    highlightDropdownActiveItems();
}

// ==========================================================================
// FORM FUNCTIONS
// ==========================================================================

function initForms() {
    initContactForm();
    initNewsletterForms();
    initFormFieldEffects();
}

function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        // Validate form
        if (validateContactForm(this)) {
            // In a real application, this would send to a server
            console.log('Contact form submitted:', data);
            
            // Show success message
            showFormSuccess(this);
        }
    });
}

function validateContactForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    // Validate required fields
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'This field is required');
            isValid = false;
        } else {
            clearFieldError(field);
        }
    });
    
    // Email validation
    const emailField = form.querySelector('#email');
    if (emailField && emailField.value.trim()) {
        if (!validateEmail(emailField.value.trim())) {
            showFieldError(emailField, 'Please enter a valid email address');
            isValid = false;
        }
    }
    
    // Message validation (if it exists)
    const messageField = form.querySelector('#message');
    if (messageField && messageField.value.trim().length < 10) {
        showFieldError(messageField, 'Please enter a message of at least 10 characters');
        isValid = false;
    }
    
    return isValid;
}

function initNewsletterForms() {
    // Use event delegation to handle all newsletter form submissions dynamically (including header/footer)
    document.addEventListener('submit', async function(e) {
        const form = e.target.closest('.newsletter-form');
        if (!form) return;

        e.preventDefault();
        const emailInput = form.querySelector('input[type="email"]');
        if (!emailInput) return;

        const email = emailInput.value.trim();
        if (!validateEmail(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showThankYouPopup(email);
                form.reset();
            } else {
                alert(data.error || 'Failed to subscribe to newsletter. Please try again.');
            }
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            alert('Error connecting to subscription server. Please try again later.');
        }
    });
}

function showThankYouPopup(email) {
    if (!document.getElementById('sub-thank-styles')) {
        const style = document.createElement('style');
        style.id = 'sub-thank-styles';
        style.textContent = `
            .sub-thank-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(15, 23, 42, 0.6);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                opacity: 0;
                transition: opacity 0.4s ease;
            }
            .sub-thank-overlay.show {
                opacity: 1;
            }
            .sub-thank-card {
                background: #ffffff;
                border-radius: 20px;
                padding: 40px;
                max-width: 480px;
                width: 90%;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                text-align: center;
                transform: scale(0.8) translateY(20px);
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                position: relative;
                border: 1px solid rgba(99, 102, 241, 0.1);
            }
            .sub-thank-overlay.show .sub-thank-card {
                transform: scale(1) translateY(0);
            }
            .sub-thank-icon-container {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15));
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 24px;
            }
            .sub-thank-icon {
                font-size: 2.2rem;
                color: #6366f1;
                animation: sub-icon-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s both;
            }
            @keyframes sub-icon-pop {
                0% { transform: scale(0); rotate: -45deg; }
                100% { transform: scale(1); rotate: 0deg; }
            }
            .sub-thank-title {
                font-family: 'Playfair Display', serif;
                font-size: 1.8rem;
                font-weight: 700;
                color: #1e1b4b;
                margin-bottom: 12px;
            }
            .sub-thank-message {
                font-family: 'Poppins', sans-serif;
                font-size: 1rem;
                color: #4b5563;
                line-height: 1.6;
                margin-bottom: 28px;
            }
            .sub-thank-btn {
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: #ffffff;
                border: none;
                padding: 12px 30px;
                border-radius: 30px;
                font-family: 'Poppins', sans-serif;
                font-weight: 600;
                font-size: 0.95rem;
                cursor: pointer;
                box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            .sub-thank-btn:hover {
                background: linear-gradient(135deg, #4f46e5, #7c3aed);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
            }
            .sub-thank-close-x {
                position: absolute;
                top: 20px;
                right: 20px;
                background: none;
                border: none;
                color: #9ca3af;
                font-size: 1.2rem;
                cursor: pointer;
                transition: color 0.2s ease;
            }
            .sub-thank-close-x:hover {
                color: #4b5563;
            }
        `;
        document.head.appendChild(style);
    }

    const overlay = document.createElement('div');
    overlay.className = 'sub-thank-overlay';
    overlay.innerHTML = `
        <div class="sub-thank-card">
            <button class="sub-thank-close-x" aria-label="Close dialog">&times;</button>
            <div class="sub-thank-icon-container">
                <i class="fas fa-check-circle sub-thank-icon"></i>
            </div>
            <h3 class="sub-thank-title">Thank You!</h3>
            <p class="sub-thank-message">
                You have successfully subscribed to the GWOFO newsletter with <strong>${(email || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong>.<br>
                Stay tuned for our latest stories, updates, and community impact events!
            </p>
            <button class="sub-thank-btn">
                Awesome <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);

    function closePopup() {
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.remove();
        }, 400);
    }

    const autoCloseTimer = setTimeout(closePopup, 5000);
    const closeBtn = overlay.querySelector('.sub-thank-btn');
    const closeX = overlay.querySelector('.sub-thank-close-x');

    const handleCloseClick = () => {
        clearTimeout(autoCloseTimer);
        closePopup();
    };

    closeBtn.addEventListener('click', handleCloseClick);
    closeX.addEventListener('click', handleCloseClick);

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            handleCloseClick();
        }
    });

    const escListener = function(e) {
        if (e.key === 'Escape') {
            document.removeEventListener('keydown', escListener);
            handleCloseClick();
        }
    };
    document.addEventListener('keydown', escListener);
}

function initFormFieldEffects() {
    const formInputs = document.querySelectorAll('input, textarea, select');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });
    });
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showFormSuccess(form) {
    // Show success message
    alert('Thank you for your message! We will get back to you within 24-48 hours.');
    
    // Reset form
    form.reset();
    
    // Show confirmation animation
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
        submitBtn.disabled = true;
        submitBtn.style.background = '#4CAF50';
        
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
        }, 3000);
    }
}

function showFieldError(field, message) {
    // Remove existing error
    clearFieldError(field);
    
    // Add error styling
    field.style.borderColor = 'var(--secondary-color)';
    field.style.boxShadow = '0 0 0 3px rgba(255, 107, 139, 0.1)';
    
    // Create error message
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    errorElement.style.color = 'var(--secondary-color)';
    errorElement.style.fontSize = '0.85rem';
    errorElement.style.marginTop = '5px';
    
    field.parentElement.appendChild(errorElement);
}

function clearFieldError(field) {
    field.style.borderColor = '';
    field.style.boxShadow = '';
    
    const errorElement = field.parentElement.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

// ==========================================================================
// SLIDER FUNCTIONS - FIXED VERSION
// ==========================================================================

function initSliders() {
    // Initialize hero slider if exists
    if (document.querySelector('.hero-slider')) {
        const heroSlider = new Slider('.hero-slider', {
            autoPlay: true,
            interval: 6000,
            transitionSpeed: 1000
        });
    }
    
    // Initialize team slider if exists
    const teamSliderContainer = document.querySelector('.team-slider-container');
    if (teamSliderContainer) {
        initTeamSlider();
    }
    
    initPartnersSlider();
}

// Team Slider Implementation - Fixed
function initTeamSlider() {
    const sliderContainer = document.querySelector('.team-slider-container');
    const slider = document.querySelector('.team-slider');
    const prevBtn = document.querySelector('.team-slider-prev');
    const nextBtn = document.querySelector('.team-slider-next');
    const cards = document.querySelectorAll('.team-card');
    
    if (!sliderContainer || !slider || cards.length === 0) return;
    
    let currentPosition = 0;
    let currentIndex = 0;
    const cardWidth = 300; // 300px card width + 30px gap
    let cardsPerView = calculateCardsPerView();
    
    // Calculate how many cards fit in the viewport
    function calculateCardsPerView() {
        const containerWidth = sliderContainer.offsetWidth;
        return Math.floor(containerWidth / cardWidth);
    }
    
    // Calculate maximum scroll position
    function getMaxPosition() {
        const totalCards = cards.length;
        const maxIndex = Math.max(0, totalCards - cardsPerView);
        return -maxIndex * cardWidth;
    }
    
    // Update slider position
    function updateSliderPosition() {
        slider.style.transform = `translateX(${currentPosition}px)`;
        slider.style.transition = 'transform 0.5s ease';
    }
    
    // Move to next set of cards
    function nextSlide() {
        const maxPosition = getMaxPosition();
        const newPosition = currentPosition - (cardsPerView * cardWidth);
        
        if (newPosition < maxPosition) {
            // If we're at the end, loop back to start
            currentPosition = 0;
            currentIndex = 0;
        } else {
            currentPosition = Math.max(newPosition, maxPosition);
            currentIndex = Math.min(currentIndex + cardsPerView, cards.length - cardsPerView);
        }
        
        updateSliderPosition();
    }
    
    // Move to previous set of cards
    function prevSlide() {
        const newPosition = currentPosition + (cardsPerView * cardWidth);
        
        if (newPosition > 0) {
            // If we're at the beginning, loop to end
            const maxPosition = getMaxPosition();
            currentPosition = maxPosition;
            currentIndex = Math.max(0, cards.length - cardsPerView);
        } else {
            currentPosition = Math.min(newPosition, 0);
            currentIndex = Math.max(currentIndex - cardsPerView, 0);
        }
        
        updateSliderPosition();
    }
    
    // Event listeners for buttons
    if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', prevSlide);
    }
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            cardsPerView = calculateCardsPerView();
            // Adjust position if needed
            const maxPosition = getMaxPosition();
            currentPosition = Math.max(currentPosition, maxPosition);
            updateSliderPosition();
        }, 250);
    });
    
    // Initialize slider position
    updateSliderPosition();
    
    // Add keyboard navigation
    sliderContainer.setAttribute('tabindex', '0');
    sliderContainer.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight') {
            nextSlide();
            e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
            prevSlide();
            e.preventDefault();
        }
    });
    
    // Add swipe functionality for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    sliderContainer.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    sliderContainer.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const minSwipeDistance = 50;
        const distance = touchStartX - touchEndX;
        
        if (Math.abs(distance) < minSwipeDistance) return;
        
        if (distance > 0) {
            // Swipe left - next slide
            nextSlide();
        } else {
            // Swipe right - previous slide
            prevSlide();
        }
    }
}

function initDropdowns() {
    initMobileDropdowns();
    initDropdownAccessibility();
    highlightDropdownActiveItems();
}

function initMobileDropdowns() {
    const dropdownLinks = document.querySelectorAll('.dropdown > a');
    
    dropdownLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (window.innerWidth <= 992) {
                e.preventDefault();
                const dropdown = this.parentElement;
                dropdown.classList.toggle('active');
                
                // Close other dropdowns
                dropdownLinks.forEach(otherLink => {
                    if (otherLink !== this) {
                        otherLink.parentElement.classList.remove('active');
                    }
                });
            }
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown') && window.innerWidth <= 992) {
            dropdownLinks.forEach(link => {
                link.parentElement.classList.remove('active');
            });
        }
    });
}

function initDropdownAccessibility() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector(':scope > a');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        // Keyboard navigation
        link.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (window.innerWidth > 992) {
                    this.click();
                }
            }
            
            if (e.key === 'Escape' && window.innerWidth > 992) {
                menu.style.opacity = '0';
                menu.style.visibility = 'hidden';
            }
        });
        
        // Close dropdown when focus leaves
        dropdown.addEventListener('focusout', function(e) {
            if (!this.contains(e.relatedTarget) && window.innerWidth > 992) {
                menu.style.opacity = '0';
                menu.style.visibility = 'hidden';
            }
        });
    });
}

function highlightDropdownActiveItems() {
    const currentPath = window.location.pathname;
    const dropdownItems = document.querySelectorAll('.dropdown-menu a');
    
    // First remove all active classes from dropdown items
    dropdownItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Find and mark active dropdown items
    dropdownItems.forEach(item => {
        const itemHref = item.getAttribute('href');
        
        // Skip anchor links within the same page
        if (itemHref.startsWith('#')) return;
        
        // Check for exact matches
        if (itemHref === currentPath) {
            item.classList.add('active');
            
            // Also highlight the parent dropdown main link
            const parentDropdown = item.closest('.dropdown');
            if (parentDropdown) {
                const parentLink = parentDropdown.querySelector(':scope > a');
                if (parentLink) {
                    parentLink.classList.add('active');
                    parentDropdown.classList.add('active');
                }
            }
            return;
        }
        
        // Handle about page anchors (like /about.html#mission)
        if (currentPath.includes('about.html') && itemHref.includes('about.html#')) {
            const hash = window.location.hash;
            if (itemHref.endsWith(hash) || (!hash && itemHref.includes('#who-we-are'))) {
                item.classList.add('active');
                
                const parentDropdown = item.closest('.dropdown');
                if (parentDropdown) {
                    const parentLink = parentDropdown.querySelector(':scope > a');
                    if (parentLink) {
                        parentLink.classList.add('active');
                        parentDropdown.classList.add('active');
                    }
                }
                return;
            }
        }
    });
}

function initPartnersSlider() {
    const partnersSliderContainer = document.querySelector('.partners-slider-container');
    const partnersSlider = document.querySelector('.partners-slider');
    const prevBtn = document.querySelector('.partners-slider-prev');
    const nextBtn = document.querySelector('.partners-slider-next');
    
    if (!partnersSliderContainer || !partnersSlider || !prevBtn || !nextBtn) return;
    
    // Clone slides for infinite loop effect
    const slides = Array.from(partnersSlider.querySelectorAll('.partner-logo'));
    
    // Only clone if we have slides
    if (slides.length === 0) return;
    
    // Calculate how many clones we need to fill the container
    const containerWidth = partnersSliderContainer.offsetWidth;
    const slideWidth = slides[0].offsetWidth + 40; // Include gap
    
    // Clear existing content and add slides with clones
    partnersSlider.innerHTML = '';
    
    // Add slides three times: clones at end, original, clones at beginning
    const allSlides = [];
    
    // 1. Add clones at the end (for seamless looping forward)
    slides.forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add('clone');
        allSlides.push(clone);
    });
    
    // 2. Add original slides
    slides.forEach(slide => {
        allSlides.push(slide);
    });
    
    // 3. Add clones at the beginning (for seamless looping backward)
    slides.forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add('clone');
        allSlides.push(clone);
    });
    
    // Append all slides to slider
    allSlides.forEach(slide => {
        partnersSlider.appendChild(slide);
    });
    
    // Update slides array
    const allSlideElements = partnersSlider.querySelectorAll('.partner-logo');
    
    // Calculate total width
    const totalWidth = allSlideElements.length * slideWidth;
    partnersSlider.style.width = totalWidth + 'px';
    
    // Set initial position to start at the "original" slides
    const startPosition = slides.length * slideWidth;
    let currentPosition = -startPosition;
    partnersSlider.style.transform = `translateX(${currentPosition}px)`;
    
    // Variables for auto-slide
    let autoSlideInterval;
    const slideSpeed = 300; // pixels per step
    const autoSlideDelay = 5000; // 5 seconds
    
    // Function to move slider
    function moveSlider(direction) {
        const increment = direction === 'next' ? -slideSpeed : slideSpeed;
        currentPosition += increment;
        
        // Apply transition
        partnersSlider.style.transition = 'transform 0.5s ease';
        partnersSlider.style.transform = `translateX(${currentPosition}px)`;
        
        // Check if we need to reset position for infinite loop
        const totalSlidesWidth = allSlideElements.length * slideWidth;
        const middleStart = slides.length * slideWidth;
        const middleEnd = middleStart + (slides.length * slideWidth);
        
        // If we've scrolled past the middle section (original slides + clones at end)
        // Reset to middle section without animation for seamless loop
        setTimeout(() => {
            if (currentPosition <= -middleEnd) {
                // If we've scrolled past the end clones, jump to start of middle section
                currentPosition = -middleStart;
                partnersSlider.style.transition = 'none';
                partnersSlider.style.transform = `translateX(${currentPosition}px)`;
            } else if (currentPosition >= -middleStart + slideSpeed) {
                // If we've scrolled past the beginning clones, jump to end of middle section
                currentPosition = -middleEnd + slideSpeed;
                partnersSlider.style.transition = 'none';
                partnersSlider.style.transform = `translateX(${currentPosition}px)`;
            }
        }, 500); // Match transition duration
    }
    
    // Next button click
    nextBtn.addEventListener('click', () => {
        moveSlider('next');
        resetAutoSlide();
    });
    
    // Previous button click
    prevBtn.addEventListener('click', () => {
        moveSlider('prev');
        resetAutoSlide();
    });
    
    // Auto-slide functionality
    function startAutoSlide() {
        autoSlideInterval = setInterval(() => {
            moveSlider('next');
        }, autoSlideDelay);
    }
    
    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }
    
    function resetAutoSlide() {
        stopAutoSlide();
        startAutoSlide();
    }
    
    // Start auto-slide
    startAutoSlide();
    
    // Pause on hover
    partnersSliderContainer.addEventListener('mouseenter', stopAutoSlide);
    partnersSliderContainer.addEventListener('mouseleave', startAutoSlide);
    
    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50;
    
    partnersSliderContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        stopAutoSlide();
    }, { passive: true });
    
    partnersSliderContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        const distance = touchStartX - touchEndX;
        
        if (Math.abs(distance) >= minSwipeDistance) {
            if (distance > 0) {
                // Swipe left - next
                moveSlider('next');
            } else {
                // Swipe right - previous
                moveSlider('prev');
            }
        }
        
        startAutoSlide();
    }, { passive: true });
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Recalculate based on new container size
            const newContainerWidth = partnersSliderContainer.offsetWidth;
            const newSlideWidth = allSlideElements[0].offsetWidth + 40;
            
            // Adjust current position proportionally
            const scaleFactor = newContainerWidth / containerWidth;
            currentPosition *= scaleFactor;
            
            // Update slider position
            partnersSlider.style.transition = 'none';
            partnersSlider.style.transform = `translateX(${currentPosition}px)`;
            
            // Update container width reference
            containerWidth = newContainerWidth;
        }, 250);
    });
    
    // Keyboard navigation
    partnersSliderContainer.setAttribute('tabindex', '0');
    partnersSliderContainer.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowLeft':
                moveSlider('prev');
                resetAutoSlide();
                e.preventDefault();
                break;
            case 'ArrowRight':
                moveSlider('next');
                resetAutoSlide();
                e.preventDefault();
                break;
        }
    });
}

// Slider Class for Hero Slider
class Slider {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;
        
        this.slides = this.container.querySelectorAll('.slide');
        this.currentSlide = 0;
        this.slideInterval = null;
        
        // Default options
        this.options = {
            autoPlay: true,
            interval: 5000,
            transitionSpeed: 1000,
            ...options
        };
        
        this.init();
    }
    
    init() {
        if (this.slides.length === 0) return;
        
        // Show first slide
        this.showSlide(this.currentSlide);
        
        // Initialize controls
        this.initControls();
        
        // Start autoplay if enabled
        if (this.options.autoPlay) {
            this.startAutoPlay();
        }
        
        // Pause autoplay on hover
        this.container.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.container.addEventListener('mouseleave', () => this.resumeAutoPlay());
        
        // Touch support for mobile
        this.initTouchEvents();
    }
    
    showSlide(index) {
        // Hide all slides
        this.slides.forEach(slide => {
            slide.classList.remove('active');
            slide.style.opacity = '0';
        });
        
        // Show current slide
        this.slides[index].classList.add('active');
        this.slides[index].style.opacity = '1';
        this.currentSlide = index;
    }
    
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.showSlide(nextIndex);
    }
    
    prevSlide() {
        const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.showSlide(prevIndex);
    }
    
    initControls() {
        const prevBtn = this.container.querySelector('.slider-prev');
        const nextBtn = this.container.querySelector('.slider-next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevSlide());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSlide());
        }
    }
    
    startAutoPlay() {
        this.slideInterval = setInterval(() => {
            this.nextSlide();
        }, this.options.interval);
    }
    
    pauseAutoPlay() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }
    
    resumeAutoPlay() {
        if (this.options.autoPlay && !this.slideInterval) {
            this.startAutoPlay();
        }
    }
    
    initTouchEvents() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        this.container.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        this.container.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });
    }
    
    handleSwipe(startX, endX) {
        const minSwipeDistance = 50;
        const distance = startX - endX;
        
        if (Math.abs(distance) < minSwipeDistance) return;
        
        if (distance > 0) {
            // Swipe left - next slide
            this.nextSlide();
        } else {
            // Swipe right - previous slide
            this.prevSlide();
        }
    }
}

// ==========================================================================
// INTERACTIVE ELEMENTS
// ==========================================================================

function initInteractiveElements() {
    initProjects();
    initFAQ();
    initEmergencyContact();
    initSocialLinks();
    initMapPlaceholder();
}

function initProjects() {
    // Filter functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectItems = document.querySelectorAll('.project-item');
    const projectDetails = document.querySelectorAll('.project-detail');
    
    if (filterButtons.length === 0) return;
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active filter button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filter = button.dataset.filter;
            
            // Filter project items in sidebar
            projectItems.forEach(item => {
                const status = item.querySelector('p')?.textContent.toLowerCase() || '';
                if (filter === 'all' || status.includes(filter)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
    
    // Project navigation
    projectItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('href')?.substring(1);
            if (!targetId) return;
            
            // Update active project item
            projectItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding project detail
            projectDetails.forEach(detail => {
                detail.classList.remove('active');
                if (detail.id === targetId) {
                    detail.classList.add('active');
                    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    });
    
    // Donation button
    const donateBtn = document.querySelector('.donate-btn');
    if (donateBtn) {
        donateBtn.addEventListener('click', () => {
            alert('Thank you for your interest in donating! In a full implementation, this would redirect to a secure donation page.');
        });
    }
}

function initFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    if (faqQuestions.length === 0) return;
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isActive = question.classList.contains('active');
            
            // Close all other FAQs
            faqQuestions.forEach(q => {
                q.classList.remove('active');
                q.nextElementSibling?.classList.remove('active');
            });
            
            // Toggle current FAQ
            if (!isActive) {
                question.classList.add('active');
                answer?.classList.add('active');
            }
        });
    });
}

function initEmergencyContact() {
    const emergencyContact = document.querySelector('.emergency-contact');
    if (!emergencyContact) return;
    
    emergencyContact.addEventListener('click', () => {
        const phoneNumber = emergencyContact.querySelector('strong')?.textContent;
        if (phoneNumber && confirm(`Call ${phoneNumber}?`)) {
            window.location.href = `tel:${phoneNumber.replace(/\s+/g, '')}`;
        }
    });
    
    emergencyContact.style.cursor = 'pointer';
    emergencyContact.style.transition = 'transform 0.3s ease';
    
    emergencyContact.addEventListener('mouseenter', () => {
        emergencyContact.style.transform = 'scale(1.02)';
    });
    
    emergencyContact.addEventListener('mouseleave', () => {
        emergencyContact.style.transform = 'scale(1)';
    });
    
    // Get Directions button
    const directionsBtn = document.querySelector('.btn-secondary');
    if (directionsBtn && directionsBtn.textContent.includes('Directions')) {
        directionsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const address = '123+Empowerment+Street,+Monrovia,+Liberia';
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
        });
    }
}

function initSocialLinks() {
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            link.style.transform = 'translateY(-10px)';
        });
        
        link.addEventListener('mouseleave', () => {
            link.style.transform = 'translateY(0)';
        });
    });
}

function initMapPlaceholder() {
    const mapPlaceholder = document.querySelector('.map-placeholder');
    if (!mapPlaceholder) return;
    
    mapPlaceholder.addEventListener('click', function() {
        this.style.background = 'linear-gradient(135deg, var(--primary-color), var(--dark-color))';
        
        setTimeout(() => {
            this.style.background = 'linear-gradient(135deg, var(--primary-light), var(--accent-color))';
        }, 300);
    });
}

// ==========================================================================
// ANIMATIONS
// ==========================================================================

function initAnimations() {
    initScrollAnimations();
    initActivityAnimations();
}

function initScrollAnimations() {
    // Create a single observer for all animated elements
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    // Observe all elements that should animate on scroll
    const animatedElements = [
        ...document.querySelectorAll('.project-card'),
        ...document.querySelectorAll('.team-card'),
        ...document.querySelectorAll('.category-card'),
        ...document.querySelectorAll('.stat-item'),
        ...document.querySelectorAll('.value-card'),
        ...document.querySelectorAll('.office-card')
    ];
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(element);
    });
}

function initActivityAnimations() {
    const activityItems = document.querySelectorAll('.activity-item');
    activityItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, index * 100);
    });
}

// ==========================================================================
// SETUP EVENT LISTENERS
// ==========================================================================

function setupEventListeners() {
    // Add click to focus for accessibility
    document.querySelectorAll('.team-card, .project-card').forEach(card => {
        card.addEventListener('click', function() {
            this.focus();
        });
        
        card.setAttribute('tabindex', '0');
    });
    
    // Add focus styles for keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.querySelectorAll('.team-card:focus, .project-card:focus').forEach(card => {
                card.style.outline = '2px solid var(--primary-color)';
                card.style.outlineOffset = '2px';
            });
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.team-card') && !e.target.closest('.project-card')) {
            document.querySelectorAll('.team-card, .project-card').forEach(card => {
                card.style.outline = 'none';
            });
        }
    });
}

// ==========================================================================
// INITIALIZE ON PAGE LOAD
// ==========================================================================

window.addEventListener('load', function() {
    highlightActiveNav();
    initializeMap();
    
    // Reinitialize team slider after all resources are loaded
    const teamSliderContainer = document.querySelector('.team-slider-container');
    if (teamSliderContainer) {
        setTimeout(() => {
            initTeamSlider();
        }, 100);
    }
});

// ==========================================================================
// GOOGLE MAP INITIALIZATION
// ==========================================================================

function initializeMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    
    // In a real application, you would initialize Google Maps here
    // For now, we'll create a placeholder
    mapElement.innerHTML = `
        <div style="width: 100%; height: 400px; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center;">
                <i class="fas fa-map-marker-alt" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 20px;"></i>
                <h3>Google Map Integration</h3>
                <p>In a production environment, Google Maps would be displayed here.</p>
                <p>Monrovia, Liberia</p>
            </div>
        </div>
    `;
}

// ==========================================================================
// EXPORT FOR MODULE USAGE
// ==========================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeAllFunctionality,
        initNavigation,
        initForms,
        initSliders,
        initTeamSlider, // Export the fixed function
        initInteractiveElements,
        initComments,
        initAnimations,
        Slider,
        validateEmail,
        showFieldError,
        clearFieldError,
        showFormSuccess
    };
}

// Consolidated JavaScript for all pages
document.addEventListener('DOMContentLoaded', function() {
    // ========== COMMON FUNCTIONS ==========
    
    // Email validation function
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Newsletter form handler
    function handleNewsletterForm(form) {
        // Handled globally by event delegation in initNewsletterForms()
    }
    
    // Tab functionality
    function initializeTabs(tabSelector, contentSelector, activeClass = 'active') {
        const tabs = document.querySelectorAll(tabSelector);
        const contents = document.querySelectorAll(contentSelector);
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const targetId = this.dataset.target || this.dataset.tab || this.dataset.type || this.dataset.story;
                if (!targetId) return;
                
                // Update active tab
                tabs.forEach(t => t.classList.remove(activeClass));
                this.classList.add(activeClass);
                
                // Show active content
                contents.forEach(content => {
                    content.classList.remove(activeClass);
                    if (content.id === `${targetId}-content` || 
                        content.id === `${targetId}-tab` || 
                        content.id === `${targetId}-story` ||
                        content.id === `${targetId}`) {
                        content.classList.add(activeClass);
                    }
                });
            });
        });
    }
    
    // Scroll animation observer
    function initializeScrollAnimation(elements, options = {}) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, options.delayMultiplier ? index * options.delayMultiplier : 0);
                }
            });
        }, { threshold: options.threshold || 0.1 });
        
        elements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = options.initialTransform || 'translateY(30px)';
            element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(element);
        });
    }
    
    // Accordion/FAQ functionality
    function initializeAccordion(headerSelector, options = {}) {
        const headers = document.querySelectorAll(headerSelector);
        const singleOpen = options.singleOpen !== false; // Default to single open
        
        headers.forEach(header => {
            header.addEventListener('click', function() {
                const item = this.parentElement;
                
                if (singleOpen) {
                    // Close other items
                    headers.forEach(otherHeader => {
                        if (otherHeader !== this) {
                            otherHeader.classList.remove('active');
                            if (otherHeader.parentElement) {
                                otherHeader.parentElement.classList.remove('active');
                            }
                        }
                    });
                }
                
                // Toggle current item
                item.classList.toggle('active');
                this.classList.toggle('active');
            });
        });
    }
    
    // ========== PAGE-SPECIFIC FUNCTIONALITY ==========
    
    // Health & Wellness Page
    const healthAccordion = document.querySelectorAll('.accordion-header');
    if (healthAccordion.length > 0) {
        initializeAccordion('.accordion-header');
    }
    
    // Donation button functionality (Health & Wellness)
    const donateButtons = document.querySelectorAll('.btn-donate');
    donateButtons.forEach(button => {
        button.addEventListener('click', function() {
            const amount = this.dataset.amount;
            const program = "Health & Wellness Program";
            
            alert(`Thank you for choosing to donate $${amount} to support our ${program}. You will be redirected to our secure donation page.`);
            
            setTimeout(() => {
                window.location.href = `get-involved.html?amount=${amount}&program=health`;
            }, 1000);
        });
    });
    
    // Health & Wellness Timeline Animation
    const timelineItems = document.querySelectorAll('.timeline-item');
    if (timelineItems.length > 0) {
        const timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateX(0)';
                }
            });
        }, { threshold: 0.1 });
        
        timelineItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = index % 2 === 0 ? 'translateX(-50px)' : 'translateX(50px)';
            item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            timelineObserver.observe(item);
        });
    }
    
    // Become a Partner Page
    const typeTabs = document.querySelectorAll('.type-tab');
    if (typeTabs.length > 0) {
        initializeTabs('.type-tab', '.type-content');
    }
    
    // Testimonial slider
    const testimonialTrack = document.querySelector('.testimonial-track');
    if (testimonialTrack) {
        const slides = document.querySelectorAll('.testimonial-slide');
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        let currentSlide = 0;
        
        function updateSlider() {
            testimonialTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
        }
        
        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                currentSlide = currentSlide > 0 ? currentSlide - 1 : slides.length - 1;
                updateSlider();
            });
            
            nextBtn.addEventListener('click', () => {
                currentSlide = currentSlide < slides.length - 1 ? currentSlide + 1 : 0;
                updateSlider();
            });
            
            setInterval(() => {
                currentSlide = currentSlide < slides.length - 1 ? currentSlide + 1 : 0;
                updateSlider();
            }, 5000);
        }
    }
    
    // Multi-step form (Become a Partner)
    const formSteps = document.querySelectorAll('.form-step');
    if (formSteps.length > 0) {
        const nextButtons = document.querySelectorAll('.next-step');
        const prevButtons = document.querySelectorAll('.prev-step');
        
        nextButtons.forEach(button => {
            button.addEventListener('click', function() {
                const nextStep = this.dataset.next;
                const currentStep = this.closest('.form-step');
                
                // Validate current step
                const inputs = currentStep.querySelectorAll('[required]');
                let isValid = true;
                
                inputs.forEach(input => {
                    if (!input.value.trim()) {
                        isValid = false;
                        input.style.borderColor = 'var(--accent-color)';
                    } else {
                        input.style.borderColor = '';
                    }
                });
                
                if (isValid) {
                    currentStep.classList.remove('active');
                    document.getElementById(nextStep).classList.add('active');
                    
                    // Update step indicator
                    const stepDots = document.querySelectorAll('.step-dot');
                    stepDots.forEach(dot => dot.classList.remove('active'));
                    document.querySelector(`#${nextStep} .step-dot`).classList.add('active');
                } else {
                    alert('Please fill in all required fields before proceeding.');
                }
            });
        });
        
        prevButtons.forEach(button => {
            button.addEventListener('click', function() {
                const prevStep = this.dataset.prev;
                const currentStep = this.closest('.form-step');
                
                currentStep.classList.remove('active');
                document.getElementById(prevStep).classList.add('active');
                
                const stepDots = document.querySelectorAll('.step-dot');
                stepDots.forEach(dot => dot.classList.remove('active'));
                document.querySelector(`#${prevStep} .step-dot`).classList.add('active');
            });
        });
    }
    
    // Partnership form submission
    const partnershipForm = document.getElementById('partnershipForm');
    if (partnershipForm) {
        partnershipForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                organization: document.getElementById('org-name')?.value,
                type: document.getElementById('org-type')?.value,
                contact: document.getElementById('contact-name')?.value,
                email: document.getElementById('contact-email')?.value,
                interest: document.querySelector('input[name="interest"]:checked')?.value,
                partnershipType: document.getElementById('partnership-type')?.value
            };
            
            alert('Thank you for your partnership inquiry! Our partnerships team will contact you within 3 business days to discuss next steps.');
            
            this.reset();
            formSteps.forEach(step => step.classList.remove('active'));
            document.getElementById('step1').classList.add('active');
            
            const stepDots = document.querySelectorAll('.step-dot');
            stepDots.forEach((dot, index) => {
                dot.classList.remove('active');
                if (index === 0) dot.classList.add('active');
            });
        });
    }
    
    // FAQ functionality
    const faqQuestions = document.querySelectorAll('.faq-question');
    if (faqQuestions.length > 0) {
        initializeAccordion('.faq-question', { singleOpen: true });
    }
    
    // Impact Page Tabs
    const impactTabs = document.querySelectorAll('.impact-tab');
    if (impactTabs.length > 0) {
        initializeTabs('.impact-tab', '.impact-tab-content');
    }
    
    // Corporate Partners Page
    const storyTabs = document.querySelectorAll('.story-tab');
    if (storyTabs.length > 0) {
        initializeTabs('.story-tab', '.story-content');
    }
    
    // Generate partner logos (Corporate Partners)
    const partnerLogos = document.querySelectorAll('.partner-logo');
    if (partnerLogos.length > 0) {
        const companyNames = [
            'Monrovia Bank', 'Liberia Telecom', 'AgriTech Solutions', 
            'Liberian Breweries', 'Unity Oil Company', 'Atlantic Shipping',
            'Liberia Cement', 'EcoPower Liberia'
        ];
        
        partnerLogos.forEach((logo, index) => {
            if (!logo.hasAttribute('data-processed')) {
                const name = companyNames[index % companyNames.length];
                const words = name.split(' ');
                const initials = words.map(word => word[0]).join('');
                const colors = [
                    'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                    'linear-gradient(135deg, var(--secondary-color), var(--secondary-light))',
                    'linear-gradient(135deg, var(--accent-color), #ff6b6b)'
                ];
                const colorIndex = index % colors.length;
                
                logo.innerHTML = `
                    <div style="width: 200px; height: 100px; background: ${colors[colorIndex]}; color: var(--white); display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 10px;">
                        <div style="font-size: 2rem; font-weight: bold;">${initials}</div>
                        <div style="font-size: 0.9rem; margin-top: 10px;">${name}</div>
                    </div>
                `;
                logo.setAttribute('data-processed', 'true');
            }
        });
    }
    
    // Donors Page - Filter functionality
    const levelButtons = document.querySelectorAll('.level-btn');
    if (levelButtons.length > 0) {
        const donorCards = document.querySelectorAll('.donor-card');
        
        levelButtons.forEach(button => {
            button.addEventListener('click', function() {
                const level = this.dataset.level;
                
                levelButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                donorCards.forEach(card => {
                    if (level === 'all' || card.dataset.level === level) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1)';
                        }, 10);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }
    
    // Get Involved Page - Donation functionality
    const amountButtons = document.querySelectorAll('.amount-btn');
    if (amountButtons.length > 0) {
        const customAmountInput = document.getElementById('custom-amount');
        const programOptions = document.querySelectorAll('input[name="program"]');
        const frequencyOptions = document.querySelectorAll('input[name="frequency"]');
        let selectedAmount = 100;
        let selectedProgram = 'general';
        let selectedFrequency = 'one-time';
        
        // Donation amount selection
        amountButtons.forEach(button => {
            button.addEventListener('click', function() {
                amountButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                selectedAmount = parseInt(this.dataset.amount);
                if (customAmountInput) customAmountInput.value = selectedAmount;
                updateDonationSummary();
            });
        });
        
        // Custom amount input
        if (customAmountInput) {
            customAmountInput.addEventListener('input', function() {
                amountButtons.forEach(btn => btn.classList.remove('active'));
                selectedAmount = parseInt(this.value) || 0;
                updateDonationSummary();
            });
        }
        
        // Program selection
        programOptions.forEach(option => {
            option.addEventListener('change', function() {
                selectedProgram = this.value;
                updateDonationSummary();
            });
        });
        
        // Frequency selection
        frequencyOptions.forEach(option => {
            option.addEventListener('change', function() {
                selectedFrequency = this.value;
                updateDonationSummary();
            });
        });
        
        // Update donation summary
        function updateDonationSummary() {
            const summaryAmount = document.getElementById('summary-amount');
            const summaryTotal = document.getElementById('summary-total');
            const summaryProgram = document.getElementById('summary-program');
            const summaryFrequency = document.getElementById('summary-frequency');
            
            if (summaryAmount) summaryAmount.textContent = `$${selectedAmount}`;
            if (summaryTotal) summaryTotal.textContent = `$${selectedAmount}`;
            
            const programNames = {
                'general': 'General Fund',
                'education': 'Education Programs',
                'empowerment': 'Women Empowerment',
                'health': 'Health & Wellness'
            };
            if (summaryProgram) summaryProgram.textContent = programNames[selectedProgram];
            
            const frequencyNames = {
                'one-time': 'One-time',
                'monthly': 'Monthly',
                'quarterly': 'Quarterly',
                'annually': 'Annually'
            };
            if (summaryFrequency) summaryFrequency.textContent = frequencyNames[selectedFrequency];
        }
        
        // Donate now button
        const donateNowBtn = document.querySelector('.btn-donate-now');
        if (donateNowBtn) {
            donateNowBtn.addEventListener('click', function() {
                alert(`Thank you for your donation of $${selectedAmount} to support our ${selectedProgram} program. You will be redirected to our secure payment processor.`);
                
                console.log({
                    amount: selectedAmount,
                    program: selectedProgram,
                    frequency: selectedFrequency
                });
            });
        }
        
        // Sponsorship buttons
        const sponsorButtons = document.querySelectorAll('.btn-sponsor');
        sponsorButtons.forEach(button => {
            button.addEventListener('click', function() {
                const level = this.dataset.level;
                const amounts = {
                    'primary': 300,
                    'secondary': 500,
                    'university': 1200
                };
                
                alert(`Thank you for choosing to sponsor a ${level} school student for $${amounts[level]}/year. You will be redirected to complete the sponsorship process.`);
            });
        });
        
        // Volunteer application
        const volunteerForm = document.getElementById('volunteerApplicationForm');
        if (volunteerForm) {
            volunteerForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const requiredFields = this.querySelectorAll('[required]');
                let isValid = true;
                
                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        isValid = false;
                        field.style.borderColor = '#B22234';
                    } else {
                        field.style.borderColor = '';
                    }
                });
                
                if (isValid) {
                    alert('Thank you for your volunteer application! We will review your application and contact you within 5-7 business days.');
                    this.reset();
                } else {
                    alert('Please fill in all required fields.');
                }
            });
        }
        
        // Apply volunteer buttons
        const applyButtons = document.querySelectorAll('.apply-volunteer');
        applyButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const volunteerType = this.dataset.type;
                
                const radioButtons = document.querySelectorAll('input[name="volunteer-type"]');
                radioButtons.forEach(radio => {
                    if (radio.value === volunteerType) {
                        radio.checked = true;
                    }
                });
                
                const volunteerFormSection = document.getElementById('volunteer-form');
                if (volunteerFormSection) {
                    volunteerFormSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
        
        // Impact calculator
        const donationSlider = document.getElementById('donation-amount');
        const impactFrequency = document.getElementById('impact-frequency');
        
        if (donationSlider && impactFrequency) {
            const amountValue = document.getElementById('amount-value');
            const resultAmount = document.getElementById('result-amount');
            
            function updateImpactCalculator() {
                const amount = parseInt(donationSlider.value);
                const frequency = impactFrequency.value;
                
                if (amountValue) amountValue.textContent = amount;
                if (resultAmount) resultAmount.textContent = amount;
                
                const books = Math.floor(amount / 10);
                const checkups = Math.floor(amount / 20);
                const businesses = Math.floor(amount / 100);
                
                const booksElement = document.getElementById('books');
                const checkupsElement = document.getElementById('checkups');
                const businessesElement = document.getElementById('businesses');
                
                if (booksElement) booksElement.textContent = books;
                if (checkupsElement) checkupsElement.textContent = checkups;
                if (businessesElement) businessesElement.textContent = businesses;
                
                if (frequency === 'monthly') {
                    if (booksElement) booksElement.textContent = books * 12;
                    if (checkupsElement) checkupsElement.textContent = checkups * 12;
                    if (businessesElement) businessesElement.textContent = businesses * 12;
                    if (resultAmount) resultAmount.textContent = amount * 12;
                }
            }
            
            donationSlider.addEventListener('input', updateImpactCalculator);
            impactFrequency.addEventListener('change', updateImpactCalculator);
            updateImpactCalculator();
        }
    }
    
    // NGO Partners Page - Filter functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length > 0) {
        const partnerCards = document.querySelectorAll('.partner-card');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const type = this.dataset.type;
                
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                partnerCards.forEach(card => {
                    const cardTypes = card.dataset.type ? card.dataset.type.split(' ') : [];
                    if (type === 'all' || cardTypes.includes(type)) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 10);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }
    
    // Education Programs Page - Story Slider
    const storyItems = document.querySelectorAll('.story-item');
    if (storyItems.length > 0) {
        const prevBtn = document.querySelector('.slider-prev');
        const nextBtn = document.querySelector('.slider-next');
        let currentStory = 0;
        
        function showStory(index) {
            // Remove active class from all items
            storyItems.forEach(item => item.classList.remove('active'));
            // Add active class to current item
            storyItems[index].classList.add('active');
            currentStory = index;
        }
        
        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                let newIndex = currentStory - 1;
                if (newIndex < 0) newIndex = storyItems.length - 1;
                showStory(newIndex);
            });
            
            nextBtn.addEventListener('click', () => {
                let newIndex = currentStory + 1;
                if (newIndex >= storyItems.length) newIndex = 0;
                showStory(newIndex);
            });
            
            setInterval(() => {
                let newIndex = currentStory + 1;
                if (newIndex >= storyItems.length) newIndex = 0;
                showStory(newIndex);
            }, 10000);
        }
        
        // Initialize first story as active
        showStory(0);
    }
    
    // Location Map Interaction (Education Programs)
    const countySpots = document.querySelectorAll('.county-spot');
    if (countySpots.length > 0) {
        const locationDetails = document.querySelectorAll('.location-details');
        
        countySpots.forEach(spot => {
            spot.addEventListener('click', function() {
                const county = this.dataset.county.toLowerCase();
                
                countySpots.forEach(s => s.classList.remove('active'));
                this.classList.add('active');
                
                locationDetails.forEach(detail => {
                    detail.classList.remove('active');
                    if (detail.id === `${county}-details`) {
                        detail.classList.add('active');
                    }
                });
            });
        });
    }
    
    // Women Empowerment Page
    const tabButtons = document.querySelectorAll('.tab-btn');
    if (tabButtons.length > 0) {
        initializeTabs('.tab-btn', '.tab-content');
    }
    
    // Story card animations (Women Empowerment)
    const storyCards = document.querySelectorAll('.story-card');
    storyCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.boxShadow = 'var(--shadow)';
        });
    });
    
    // ========== COMMON INITIALIZATIONS ==========
    
    // Initialize all newsletter forms
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    newsletterForms.forEach(handleNewsletterForm);
    
    // Initialize scroll animations for various elements
    const animatedElements = document.querySelectorAll(
        '.reason-card, .process-step, .faq-item, ' +
        '.benefit-card, .tier-card, .option-card, .step, ' +
        '.category-card, .donor-card, .wall-item, ' +
        '.support-card, .sponsorship-card, .opportunity-card, ' +
        '.step-card, .partner-card, .impact-stat, .story-card, ' +
        '.empowerment-stat'
    );
    
    if (animatedElements.length > 0) {
        initializeScrollAnimation(animatedElements, { delayMultiplier: 100 });
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});