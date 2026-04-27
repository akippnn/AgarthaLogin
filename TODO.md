# 📝 AgarthaLogin TODO

## 🎯 High Priority (User Experience)
- [x] **Force Premium Login Flow**
    - [x] Detect premium status in `Login.tsx` via API.
    - [x] Add a "Login as Premium" button for verified owners to bypass password entry.
    - [x] Integrate with the backend to trigger a premium authentication check.
- [x] **Generated Username Logic**
    - [x] Replace `!!GENERATED USERNAME HERE!!` placeholder in `Register.tsx`.
    - [x] Implement a mechanism to suggest/assign alternative usernames for non-premium players trying to use a premium name.
- [x] **Invite-Only Authentication Gate**
    - [x] Implement packet-level filtering for DDoS mitigation in limbo.
    - [x] Build <2KB vanilla TS redemption UI in `error.html`.
    - [x] Implement `/api/invite/redeem` and referral tracking in SQL schema.
    - [x] Add `/agarthalogin invite` command for user-generated tokens.

## 🎨 UI/UX Refinement
- [x] **Admin Panel Consistency**
    - [x] Complete `UsersTab.tsx` refactor to use the `Table` component.
    - [x] Refactor `DatabaseTab.tsx` and `AddUserTab.tsx` to use `Stack` and standard components.
    - [x] Ensure all admin views follow the same design language as the registration flow.
- [x] **Global Admonition Usage**
    - Replace legacy `alert-error` / `alert-success` with `<Admonition />` in:
        - [x] `Login.tsx` & `LoginEntry.tsx`
        - [x] `RegisterEntry.tsx`
        - [x] `SessionAuth.tsx` & `SessionAuthEntry.tsx`
        - [x] `AdminEntry.tsx`
        - [x] `Authorized.tsx` (Update success message to Admonition)
- [ ] **Typography Audit**
    - Verify all components use the same Inter font and CSS variable weights.

## 🛠 Technical Debt & Security
- [ ] **Java Backend Cleanup**
    - Fix raw type warnings for `AuthenticLibreLogin` and `CommandManager`.
    - Fix unchecked cast warnings in `AdminController.java` and `AuthController.java`.
    - Parameterize generic types properly to satisfy the compiler.
- [x] **Tree-shaking Verification**
    - [x] Verify that `lucide-preact` icons are being properly tree-shaken and not bloating the bundle.
    - [x] Aim for < 10KB target for main islands (Optimized by removing `react-dom` dependencies).
- [ ] **HTTPS Enforcement**
    - Implement a warning or hard rejection for insecure HTTP connections on the frontend.
- [ ] **Clean up build logs**
    - Investigate and resolve the deprecated Gradle features mentioned in `shadowJar` output.

## 🚀 Robustness & Resilience (Next Steps)
- [ ] **Error Boundaries**
    - Implement a `SafeIsland` component to wrap entry points and prevent full page crashes.
- [ ] **Loading Skeletons**
    - Replace "Loading..." text with skeleton UI for `UsersTab` and `Login`.
- [ ] **Form Validation**
    - Add client-side password strength checking in `Register.tsx`.
- [ ] **Accessibility Audit**
    - Ensure all interactive elements have proper ARIA labels and keyboard focus states.

## 🧪 Testing
- [ ] **Edge Case: Token Type Mismatch**
    - Add automated tests for the path rewriting logic in `FrontendHandler.java`.
- [x] **Localization validation**
    - [x] Ensure all strings in `Register.tsx` (especially the new premium ownership warning) are present in `en.po`.
