
import { TokenInfo, LoginResponse, RegisterResponse, CheckPremiumResponse, AdminApplyResponse } from '../lib/types';

export function setupMockApi() {
  if (!import.meta.env.DEV) return;
  
  console.log('--- Mock API Enabled ---');
  
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    console.log(`MockFetch: ${url}`);

    const mockResponse = (data: any) => 
      Promise.resolve(new Response(JSON.stringify(data), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }));

    // /api/check-token
    if (url.includes('/api/check-token')) {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        // Support specific session-auth testing via query param if needed, or just default behavior
        if (body.token === 'dev-token') {
             // If referer or checking for admin, return ADMIN_ACCESS if the component expects it?
             // Actually AdminEntry expects ADMIN_ACCESS. LoginEntry expects LOGIN.
             // We can use the URL or a hack to determine context, OR just return what's needed based on standard flow.
             // Simpler: Check window.location.pathname
             if (window.location.pathname.includes('admin.html')) {
                 return mockResponse({ username: 'DevAdmin', type: 'ADMIN_ACCESS' });
             }
             if (window.location.pathname.includes('register.html')) {
                 return mockResponse({ username: 'DevUser', type: 'REGISTER' });
             }
             if (window.location.pathname.includes('sessionauth.html')) {
                 // SessionAuth checks session first usually.
                 return mockResponse({ username: 'DevUser', type: 'LOGIN' }); 
             }
             return mockResponse({ username: 'DevUser', type: 'LOGIN' } as TokenInfo);
        }
        return mockResponse({ error: 'Invalid mock token' });
    }

    // --- Mock Database for Admin Panel ---
    // Initialize standard mock users if not present in memory (this resets on reload, which is fine)
    // To persist, we'd use localStorage, but in-memory is okay for simple 'dev' usage.
    if (!(window as any).__MOCK_USERS__) {
        (window as any).__MOCK_USERS__ = [
            { id: 1, username: 'Notch', twoFactor: true, status: 'Active' },
            { id: 2, username: 'Dinnerbone', twoFactor: false, status: 'Active' },
            { id: 3, username: 'Jeb', twoFactor: true, status: 'Locked' },
            { id: 4, username: 'Griefer123', twoFactor: false, status: 'Banned' },
        ];
    }
    const getUsers = () => (window as any).__MOCK_USERS__;
    const setUsers = (users: any[]) => (window as any).__MOCK_USERS__ = users;


    if (url.includes('/api/admin/users')) {
        const u = new URL(url, window.location.origin);
        const query = (u.searchParams.get('q') || '').toLowerCase();
        const page = parseInt(u.searchParams.get('page') || '1');
        const limit = 10;
        
        let filtered = getUsers().filter((u: any) => u.username.toLowerCase().includes(query));
        const total = filtered.length;
        const paginated = filtered.slice((page - 1) * limit, page * limit);

        return mockResponse({ users: paginated, total, page, totalPages: Math.ceil(total / limit) });
    }

    if (url.includes('/api/admin/add-user')) {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        const users = getUsers();
        if (users.find((u: any) => u.username === body.username)) {
            return Promise.resolve(new Response(JSON.stringify({ error: 'User already exists' }), { status: 400 }));
        }
        const newUser = {
            id: users.length + 1,
            username: body.username,
            twoFactor: false,
            status: 'Active'
        };
        users.push(newUser);
        setUsers(users);
        return mockResponse({ success: true, user: newUser });
    }

    if (url.includes('/api/admin/delete-user')) {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        const users = getUsers().filter((u: any) => u.username !== body.username);
        setUsers(users);
        return mockResponse({ success: true });
    }
    
    // /api/login
    if (url.includes('/api/login')) {
        return new Promise(resolve => setTimeout(() => {
            resolve(mockResponse({ success: true, sessionId: 'mock-session-id' } as LoginResponse));
        }, 500));
    }

    // /api/register
    if (url.includes('/api/register')) {
        return new Promise(resolve => setTimeout(() => {
            resolve(mockResponse({ success: true, sessionId: 'mock-session-id' } as RegisterResponse));
        }, 800));
    }
    
    // /api/check-premium
    if (url.includes('/api/check-premium')) {
        const u = new URL(url, window.location.origin);
        const user = u.searchParams.get('username') || '';
        const isPremium = user.toLowerCase() !== 'cracked' 
            && user.toLowerCase() !== 'crackeduser' 
            && user.toLowerCase() !== 'offline'
            && user.toLowerCase() !== 'offlineuser';
        return mockResponse({ isPremium } as CheckPremiumResponse);
    }

    // /api/admin/apply
    if (url.includes('/api/admin/apply')) {
        return mockResponse({ success: true, sessionId: 'mock-session-id', gameCode: '123456' } as AdminApplyResponse);
    }

    // Pass through unrelated requests
    return originalFetch(input, init);
  };
}
