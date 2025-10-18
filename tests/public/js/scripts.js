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

// Export para testing con ES modules
export const greet = (name) => `Hello, ${name}!`;

// Compatibilidad con navegador (global)
if (typeof window !== 'undefined') {
    window.greet = greet;
} else if (typeof globalThis !== 'undefined') {
    globalThis.greet = greet;
}
