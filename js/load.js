// In your header loading script (where you fetch and insert the header)
async function loadHeader() {
    try {
        // Check if current page is inside /admin/
        const isAdminPage = window.location.pathname.includes("/admin/");
        
        // Decide correct path
        const includePath = isAdminPage ? "../includes/" : "includes/";
        
        const response = await fetch(includePath + "header.html");
        const html = await response.text();
        document.getElementById('header-placeholder').innerHTML = html;
        
        // Reinitialize after header is loaded
        initializeAllFunctionality();
    } catch (error) {
        console.error('Error loading header:', error);
    }
}

async function loadFooter() {
    try {
        // Check if current page is inside /admin/
        const isAdminPage = window.location.pathname.includes("/admin/");
        
        // Decide correct path
        const includePath = isAdminPage ? "../includes/" : "includes/";
        
        const response = await fetch(includePath + "footer.html");
        const html = await response.text();
        document.getElementById('footer-placeholder').innerHTML = html;
    } catch (error) {
        console.error('Error loading footer:', error);
    }
}

// Load both header and footer simultaneously for better performance
async function loadIncludes() {
    try {
        // Load both in parallel
        await Promise.all([loadHeader(), loadFooter()]);
    } catch (error) {
        console.error('Error loading includes:', error);
    }
}

// Call loadIncludes on DOMContentLoaded
document.addEventListener('DOMContentLoaded', loadIncludes);