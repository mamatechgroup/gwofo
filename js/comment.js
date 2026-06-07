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
                messageDiv.style.display = 'block';
                messageDiv.style.background = '#e3f2fd';
                messageDiv.style.color = '#1976d2';
                messageDiv.textContent = 'Posting comment...';
                
                const response = await fetch('http://localhost:3000/api/projects/1/comments', {
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
                    messageDiv.style.background = '#c8e6c9';
                    messageDiv.style.color = '#2e7d32';
                    messageDiv.textContent = 'Thank you! Your comment is pending moderation.';
                    project1Form.reset();
                    
                    setTimeout(() => {
                        messageDiv.style.display = 'none';
                        submitBtn.disabled = false;
                    }, 5000);
                } else {
                    messageDiv.style.background = '#ffcdd2';
                    messageDiv.style.color = '#c62828';
                    messageDiv.textContent = result.message || 'Error posting comment. Please try again.';
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Error posting comment:', error);
                messageDiv.style.background = '#ffcdd2';
                messageDiv.style.color = '#c62828';
                messageDiv.textContent = 'Error posting comment. Please try again.';
                submitBtn.disabled = false;
            }
        });
    }
});
