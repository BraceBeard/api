// Main JavaScript for API Documentation
console.log('🚀 API Documentation loaded successfully!');

// Add interactivity
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    
    // Add click animation to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 100);
        });
    });
    
    // Log endpoint clicks
    const endpoints = document.querySelectorAll('.endpoint-list li');
    endpoints.forEach(endpoint => {
        endpoint.addEventListener('click', function() {
            const codeElement = this.querySelector('code');
            if (codeElement) {
                console.log(`Endpoint clicked: ${codeElement.textContent}`);
            } else {
                console.warn('No <code> element found in endpoint:', this);
            }
        });
    });
    
    // Add timestamp to footer
    const footer = document.querySelector('footer p');
    if (footer) {
        const timestamp = new Date().toLocaleString();
        footer.innerHTML += ` <br><small>Loaded at: ${timestamp}</small>`;
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getTimestamp: () => new Date().toISOString(),
        greeting: (name) => `Hello, ${name}! Welcome to the API.`
    };
}
