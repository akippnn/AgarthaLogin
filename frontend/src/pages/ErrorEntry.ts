// Vanilla TS - No dependencies intended to keep bundle size minimal (<1KB)
const params = new URLSearchParams(window.location.search);
const action = params.get('action');

const app = document.getElementById('app');

if (action === 'invite') {
    const token = params.get('token') || '';
    if (app) {
        app.innerHTML = `
            <h1>Invite Required</h1>
            <p>This server requires an invite code to join.</p>
            <form id="invite-form" style="margin-top: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                <input type="text" id="invite-code" placeholder="Enter Invite Code" required style="padding: 0.5rem; border-radius: 4px; border: 1px solid #444; background: #2c2e33; color: #fff;">
                <button type="submit" style="padding: 0.5rem 1rem; background: #339af0; color: white; border: none; border-radius: 4px; cursor: pointer;">Redeem Invite</button>
            </form>
            <p id="invite-error" style="color: #ff6b6b; margin-top: 1rem; display: none;"></p>
        `;

        document.getElementById('invite-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = (document.getElementById('invite-code') as HTMLInputElement).value;
            const errorEl = document.getElementById('invite-error');
            if (errorEl) errorEl.style.display = 'none';

            try {
                const res = await fetch('/api/invite/redeem', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, code })
                });

                if (res.ok) {
                    window.location.href = '/login.html?token=' + encodeURIComponent(token);
                } else {
                    const data = await res.json().catch(() => ({}));
                    if (errorEl) {
                        errorEl.textContent = data.error || 'Failed to redeem invite.';
                        errorEl.style.display = 'block';
                    }
                }
            } catch (err) {
                if (errorEl) {
                    errorEl.textContent = 'Network error occurred.';
                    errorEl.style.display = 'block';
                }
            }
        });
    }
} else {
    const code = params.get('code') || 'Error';
    const message = params.get('message') || 'An unexpected error occurred.';
    
    if (app) {
        app.innerHTML = `
            <h1>${code}</h1>
            <p>${decodeURIComponent(message)}</p>
        `;
    }
}
