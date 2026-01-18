# 📍 AgarthaLogin Roadmap

## ✅ Implemented

Check commit history for all of the implemented features not listed here.

- [x] Web-based authentication flow (Jetty + React)
- [x] Session management and auto-login
- [x] Admin panel with user management
- [x] Premium/offline registration flow with Mojang verification
- [x] Frontend refactor — migrated to TypeScript, extracted common UI components
- [x] Complete HTTPS setup documentation
- [x] I18n
- [x] Frontend move from SPA to MPA ("Islands Architecture")
- [x] **Preact Migration** (Replaced React for smaller bundle size)
- [x] **Global CSS Refactor** (Removed legacy `styles.ts`)

## 🚀 In Progress

- [ ] **Extreme Frontend Optimization** (<10KB bundle target)
    - [x] Preact Migration
    - [x] Tree-shaking verification
    - [ ] `lucide-preact` optimization (currently heavy in dev)
    - [ ] `preact-i18n` migration
- [ ] Backend integration of new frontend build
- [ ] Allow scalability by ensuring the plugin is stateless

## 🔶 TODO

- [ ] Reject insecure HTTP connections on the frontend
- [ ] Implement backup/restore functionality in admin panel
- [ ] User settings panel (password change, premium/offline toggle)
- [ ] Two-Factor Authentication (TOTP)
- [ ] Plugin rewrite (keeping only the important parts, fully independent from LibreLogin)
- [ ] Decouple Jetty and Vite web stack from plugin
- [ ] Improve frontend design
- [ ] Support custom CSS
- [ ] Translations