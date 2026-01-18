// Vanilla TS - No dependencies intended to keep bundle size minimal (<1KB)
const params = new URLSearchParams(window.location.search);
const code = params.get('code') || 'Error';
const message = params.get('message') || 'An unexpected error occurred.';

const app = document.getElementById('app');
if (app) {
    app.innerHTML = `
        <h1>${code}</h1>
        <p>${decodeURIComponent(message)}</p>
    `;
}
