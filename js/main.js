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
    initComments();
    
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
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const icon = navToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!navToggle.contains(event.target) && !navMenu.contains(event.target) && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                const icon = navToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
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
    const currentPage = window.location.pathname.split('/').pop() || '';
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if ((linkPage === currentPage) || 
            (currentPage === '' && linkPage === 'index.html') ||
            (currentPage.includes(linkPage.replace('.html', '')) && linkPage !== 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
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
    document.querySelectorAll('.newsletter-form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            
            if (emailInput && emailInput.value.trim()) {
                if (!validateEmail(emailInput.value.trim())) {
                    alert('Please enter a valid email address.');
                    return;
                }
                
                // Here you would typically send the data to a server
                console.log('Newsletter subscription:', emailInput.value);
                alert('Thank you for subscribing to our newsletter!');
                this.reset();
            }
        });
    });
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

function initPartnersSlider() {
    const partnersSlider = document.querySelector('.partners-slider');
    const prevBtn = document.querySelector('.partners-slider-prev');
    const nextBtn = document.querySelector('.partners-slider-next');
    
    if (!partnersSlider || !prevBtn || !nextBtn) return;
    
    let currentPosition = 0;
    const cardWidth = 240; // 200px + 40px gap
    
    nextBtn.addEventListener('click', () => {
        const maxPosition = -(partnersSlider.scrollWidth - partnersSlider.parentElement.offsetWidth);
        currentPosition = Math.max(currentPosition - cardWidth, maxPosition);
        partnersSlider.style.transform = `translateX(${currentPosition}px)`;
    });
    
    prevBtn.addEventListener('click', () => {
        currentPosition = Math.min(currentPosition + cardWidth, 0);
        partnersSlider.style.transform = `translateX(${currentPosition}px)`;
    });
    
    // Auto-slide every 5 seconds
    setInterval(() => {
        const maxPosition = -(partnersSlider.scrollWidth - partnersSlider.parentElement.offsetWidth);
        if (currentPosition <= maxPosition) {
            currentPosition = 0;
        } else {
            currentPosition = Math.max(currentPosition - cardWidth, maxPosition);
        }
        partnersSlider.style.transform = `translateX(${currentPosition}px)`;
    }, 5000);
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
    
    // Share button
    const shareBtn = document.querySelector('.share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const url = window.location.href;
            const title = document.title;
            
            if (navigator.share) {
                navigator.share({
                    title: title,
                    url: url
                });
            } else {
                navigator.clipboard.writeText(url).then(() => {
                    alert('Link copied to clipboard!');
                });
            }
        });
    }
    
    // Comment form submission
    const commentForm = document.getElementById('project1CommentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = this.querySelector('#name')?.value.trim();
            const email = this.querySelector('#email')?.value.trim();
            const comment = this.querySelector('#comment')?.value.trim();
            
            if (name && email && comment) {
                // In a real app, this would send to server
                alert('Thank you for your comment! It will appear after moderation.');
                this.reset();
            }
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
// COMMENTS SYSTEM
// ==========================================================================

function initComments() {
    // Like button functionality
    document.querySelectorAll('.like-btn').forEach(button => {
        button.addEventListener('click', handleLikeClick);
    });
    
    // Reply button functionality
    document.querySelectorAll('.reply-btn').forEach(button => {
        button.addEventListener('click', handleReplyClick);
    });
    
    // Share button functionality
    document.querySelectorAll('.share-btn').forEach(button => {
        button.addEventListener('click', handleShareClick);
    });
    
    // Comment form submission
    const commentForm = document.querySelector('.comment-form form');
    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmit);
    }
    
    // Reply form submissions
    document.querySelectorAll('.reply-form form').forEach(form => {
        form.addEventListener('submit', handleReplySubmit);
    });
}

function handleLikeClick() {
    const commentId = this.dataset.commentId || 'default';
    const likeCount = this.querySelector('.like-count');
    const icon = this.querySelector('i');
    
    if (icon.classList.contains('far')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        if (likeCount) likeCount.textContent = '1';
        this.innerHTML = '<i class="fas fa-heart"></i> Liked <span class="like-count">1</span>';
        sendLikeToServer(commentId, 'like');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        if (likeCount) likeCount.textContent = '0';
        this.innerHTML = '<i class="far fa-heart"></i> Like <span class="like-count">0</span>';
        sendLikeToServer(commentId, 'unlike');
    }
}

function handleReplyClick() {
    const commentId = this.dataset.commentId;
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    
    if (replyForm) {
        replyForm.classList.toggle('active');
        if (replyForm.classList.contains('active')) {
            const textarea = replyForm.querySelector('textarea');
            if (textarea) textarea.focus();
        }
    }
}

function handleShareClick() {
    const url = window.location.href;
    const title = document.title;
    
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        });
    } else {
        navigator.clipboard.writeText(url).then(() => {
            alert('Link copied to clipboard!');
        });
    }
}

function handleCommentSubmit(e) {
    e.preventDefault();
    const name = this.querySelector('#comment-name')?.value.trim();
    const comment = this.querySelector('#comment-text')?.value.trim();
    
    if (name && comment) {
        addComment(name, comment);
        this.reset();
    }
}

function handleReplySubmit(e) {
    e.preventDefault();
    const commentId = this.dataset.commentId;
    const name = this.querySelector('#reply-name')?.value.trim();
    const reply = this.querySelector('#reply-text')?.value.trim();
    
    if (name && reply && commentId) {
        addReply(commentId, name, reply);
        this.reset();
        this.classList.remove('active');
    }
}

function addComment(name, comment) {
    const commentsList = document.querySelector('.comments-list');
    if (!commentsList) return;
    
    const commentId = 'comment-' + Date.now();
    const commentHTML = createCommentHTML(commentId, name, comment);
    
    commentsList.insertAdjacentHTML('afterbegin', commentHTML);
    initComments();
    sendCommentToServer(name, comment);
}

function addReply(commentId, name, reply) {
    const repliesContainer = document.getElementById(`replies-${commentId}`);
    if (!repliesContainer) return;
    
    const replyId = 'reply-' + Date.now();
    const replyHTML = createReplyHTML(replyId, name, reply);
    
    repliesContainer.insertAdjacentHTML('beforeend', replyHTML);
    initComments();
    sendReplyToServer(commentId, name, reply);
}

function createCommentHTML(id, name, comment) {
    return `
        <div class="comment" id="${id}">
            <div class="comment-header">
                <span class="comment-author">${name}</span>
                <span class="comment-date">Just now</span>
            </div>
            <div class="comment-content">
                <p>${comment}</p>
            </div>
            <div class="comment-actions">
                <button class="like-btn" data-comment-id="${id}">
                    <i class="far fa-heart"></i> Like <span class="like-count">0</span>
                </button>
                <button class="reply-btn" data-comment-id="${id}">
                    <i class="fas fa-reply"></i> Reply
                </button>
                <button class="share-btn">
                    <i class="fas fa-share-alt"></i> Share
                </button>
            </div>
            <div class="replies" id="replies-${id}"></div>
            <div class="reply-form" id="reply-form-${id}">
                <form data-comment-id="${id}">
                    <div class="form-group">
                        <input type="text" id="reply-name" placeholder="Your Name" required>
                    </div>
                    <div class="form-group">
                        <textarea id="reply-text" placeholder="Your Reply" required></textarea>
                    </div>
                    <button type="submit" class="btn-primary">Post Reply</button>
                </form>
            </div>
        </div>
    `;
}

function createReplyHTML(id, name, reply) {
    return `
        <div class="comment reply" id="${id}">
            <div class="comment-header">
                <span class="comment-author">${name}</span>
                <span class="comment-date">Just now</span>
            </div>
            <div class="comment-content">
                <p>${reply}</p>
            </div>
            <div class="comment-actions">
                <button class="like-btn" data-comment-id="${id}">
                    <i class="far fa-heart"></i> Like <span class="like-count">0</span>
                </button>
                <button class="share-btn">
                    <i class="fas fa-share-alt"></i> Share
                </button>
            </div>
        </div>
    `;
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
// API FUNCTIONS (mock implementations)
// ==========================================================================

function sendLikeToServer(commentId, action) {
    console.log(`${action} comment ${commentId}`);
    // Example: fetch('/api/like', { method: 'POST', body: JSON.stringify({ commentId, action }) });
}

function sendCommentToServer(name, comment) {
    console.log('New comment:', { name, comment });
    // Example: fetch('/api/comments', { method: 'POST', body: JSON.stringify({ name, comment }) });
}

function sendReplyToServer(commentId, name, reply) {
    console.log('New reply to', commentId, ':', { name, reply });
    // Example: fetch('/api/replies', { method: 'POST', body: JSON.stringify({ commentId, name, reply }) });
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