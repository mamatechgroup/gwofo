// Project Comment Form Handler
document.addEventListener('DOMContentLoaded', function() {
    // Handle project 1 comment form
    const project1Form = document.getElementById('project1CommentForm');
    if (project1Form) {
        project1Form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('project1Name').value;
            const email = document.getElementById('project1Email').value;
            const comment = document.getElementById('project1Comment').value;
            const messageDiv = document.getElementById('project1Message');
            const submitBtn = project1Form.querySelector('button[type="submit"]');
            
            try {
                submitBtn.disabled = true;
                messageDiv.classList.remove('hidden');
                messageDiv.classList.add('loading');
                messageDiv.textContent = 'Posting comment...';
                
                const apiBase = window.location.hostname.includes('netlify.app')
                    ? 'https://gwofo.onrender.com/api'
                    : 'http://localhost:3000/api';
                const response = await fetch(`${apiBase}/projects/1/comments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        author_name: name,
                        author_email: email,
                        content: comment
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    messageDiv.classList.remove('loading');
                    messageDiv.classList.add('success');
                    messageDiv.textContent = 'Thank you! Your comment is pending moderation.';
                    project1Form.reset();
                    
                    setTimeout(() => {
                        messageDiv.classList.add('hidden');
                        submitBtn.disabled = false;
                    }, 5000);
                } else {
                    messageDiv.classList.remove('loading');
                    messageDiv.classList.add('error');
                    messageDiv.textContent = result.message || 'Error posting comment. Please try again.';
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Error posting comment:', error);
                messageDiv.classList.add('error');
                messageDiv.textContent = 'Error posting comment. Please try again.';
                submitBtn.disabled = false;
            }
        });
    }
});
