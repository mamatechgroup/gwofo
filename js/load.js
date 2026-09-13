// Includes Loader - GWOFO Modular Header & Footer Loader
async function loadHeader() {
    try {
        const isAdminPage = window.location.pathname.includes("/admin/");
        const includePath = isAdminPage ? "../includes/" : "includes/";
        
        const response = await fetch(includePath + "header.html");
        if (!response.ok) throw new Error(`HTTP ${response.status} fetching header`);
        const html = await response.text();
        const placeholder = document.getElementById('header-placeholder');
        if (placeholder) {
            placeholder.innerHTML = html;
            highlightActiveNavLink();
            if (typeof initMobileNavigation === 'function') {
                initMobileNavigation();
            }
            if (typeof initDropdowns === 'function') {
                initDropdowns();
            }
        }
    } catch (error) {
        console.error('Error loading header:', error);
    }
}

async function loadFooter() {
    try {
        const isAdminPage = window.location.pathname.includes("/admin/");
        const includePath = isAdminPage ? "../includes/" : "includes/";
        
        const response = await fetch(includePath + "footer.html");
        if (!response.ok) throw new Error(`HTTP ${response.status} fetching footer`);
        const html = await response.text();
        const placeholder = document.getElementById('footer-placeholder');
        if (placeholder) {
            placeholder.innerHTML = html;
            const yr = document.getElementById('footerYear');
            if (yr) yr.textContent = new Date().getFullYear();
            if (typeof renderSocialLinksAcrossDOM === 'function' && window._cachedSocialLinks) {
                renderSocialLinksAcrossDOM(window._cachedSocialLinks);
            } else if (typeof loadSocialMediaLinks === 'function') {
                loadSocialMediaLinks();
            }
        }
    } catch (error) {
        console.error('Error loading footer:', error);
    }
}

function highlightActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (!href) return;
        
        if (currentPath === '/' || currentPath.endsWith('index.html')) {
            if (href === '/index.html' || href === 'index.html' || href === '/') {
                link.classList.add('active');
            }
        } else {
            const pageName = currentPath.split('/').pop();
            if (pageName && (href.endsWith(pageName) || href === pageName)) {
                link.classList.add('active');
            }
        }
    });
}

// Load both header and footer simultaneously
async function loadIncludes() {
    try {
        await Promise.all([loadHeader(), loadFooter()]);
        if (typeof initMobileNavigation === 'function') {
            initMobileNavigation();
        }
        if (typeof initDropdowns === 'function') {
            initDropdowns();
        }
        if (typeof initNewsletterForms === 'function') {
            initNewsletterForms();
        }
        if (typeof initializeAllFunctionality === 'function') {
            initializeAllFunctionality();
        }
    } catch (error) {
        console.error('Error loading includes:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadIncludes);
} else {
    loadIncludes();
}