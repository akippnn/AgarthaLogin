# 📍 AgarthaLogin Roadmap

## ✅ Implemented

- [x] Web-based authentication flow (Jetty + React)
- [x] Session management and auto-login
- [x] Admin panel with user management
- [x] Premium/offline registration flow with Mojang verification
- [x] Frontend refactor — migrated to TypeScript, extracted common UI components
- [x] Complete HTTPS setup documentation

## 🔶 TODO

- [ ] Reject insecure HTTP connections on the frontend
- [ ] Implement backup/restore functionality in admin panel

## 📮 Backlog

- [ ] User settings panel (password change, premium/offline toggle)
- [ ] Two-Factor Authentication (TOTP)
- [ ] Plugin rewrite (keeping only the important parts, fully independent from LibreLogin)
- [ ] Decouple Jetty and Vite web stack from plugin
- [ ] Improve frontend design
- [ ] Support custom CSS