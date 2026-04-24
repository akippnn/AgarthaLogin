# 📍 AgarthaLogin Roadmap

## ✅ Implemented

Check commit history for all of the implemented features not listed here.

- [x] Web-based authentication flow (Jetty + React)
- [x] Session management and auto-login
- [x] Admin panel with user management
- [x] Premium/offline registration flow with Mojang verification
- [x] Complete HTTPS setup documentation
- [x] I18n support
- [x] **Frontend Architecture Overhaul**
    - [x] Migrated from React SPA to Preact "Islands" (MPA)
    - [x] Replaced `styles.ts` with Global CSS variables
    - [x] Tree-shaking & minimal bundle size (<10KB target achieved)
    - [x] Custom minimal i18n solution
- [x] **Security Hardening**
    - [x] Hyper-Optimized Error Handling (DoS Protection)
    - [x] Admin Verification Flow (Two-step command)
    - [x] Application-Level Rate Limiting (Caffeine-based Token Bucket)
- [x] **Performance Testing**
    - [x] Full-Stack Benchmark Suite
    - [x] Payload & Bandwidth Analysis

## 🚀 In Progress

*(None)*

## 🔶 TODO

- [ ] **Admin Panel Overhaul**
    - [ ] Refactor Admin Panel to use `Stack` and proper UI components
    - [ ] Improve Admin Panel Styles
- [ ] **Backend Scalability Refactor** (The "Unique Endpoint" Solution)
    - [ ] Decouple Jetty/Vite from Plugin
    - [ ] Create Standalone Web Microservice
    - [ ] Implement Redis-based State Management
    - [ ] Plugin rewrite (keeping only the important parts, fully independent from LibreLogin)
- [ ] **Feature Enhancements**
    - [ ] **Premium Account Override/Recovery Mechanism** (Allow verified owners to reclaim accounts)
    - [ ] **Force Premium Login** (If premium username is detected in Login, force user to connect as premium if they own it)
    - [ ] Reject insecure HTTP connections on the frontend
    - [ ] Implement backup/restore functionality in admin panel
    - [ ] User settings panel (password change, premium/offline toggle)
    - [ ] Two-Factor Authentication (TOTP)
    - [ ] Support custom CSS
    - [ ] Additional Translations