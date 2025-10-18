// Static file test JavaScript
console.log('Static file server is working!');

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('testButton');
    
    if (button) {
        button.addEventListener('click', () => {
            alert('Button clicked! Static JavaScript is working.');
            console.log('Button click event handled successfully');
        });
    }
});

// Export a test function for unit testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        greet: (name) => `Hello, ${name}!`
    };
}
