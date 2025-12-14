# Codebase Investigation Report: AgarthaLogin (Fork of LibreLoginProd)

## Overview
**AgarthaLogin** is a robust, multi-platform Minecraft authentication plugin. It is a fork of **LibreLoginProd**. It replaces traditional in-game auth commands with a secure, web-based authentication flow served by an embedded Jetty server.

## Architecture

### Module Structure
- **`API`**: Public interfaces (`LibreLoginPlugin`).
- **`Plugin`**: Concrete implementation, now including the **Web Module**.

### Web Authentication Module (New)
AgarthaLogin introduces a `WebServer` component using **Jetty** and **React**.

#### 1. Infrastructure
*   **Server:** Embedded Jetty running on a configurable port (default 8080).
*   **Security:** SSL/TLS is **offloaded** to a Reverse Proxy (Nginx/HAProxy). The plugin communicates via HTTP on localhost but generates links using a configured `public-url` (HTTPS).
*   **API:** JSON-based API at `/api/*`.
*   **Frontend:** React (Vite build) serving a Single Page Application (SPA).

#### 2. Authentication Flow
1.  **Trigger:** Unauthenticated player joins.
2.  **Token:** Secure, random, short-lived (5m), one-time use token generated.
3.  **Delivery:** Player receives a **Book** with a clickable link: `https://auth.server.com/?token=xyz...`
4.  **Browser:**
    *   Token validated via `/api/check-token`.
    *   Token **invalidated** immediately.
    *   User logs in or registers.
5.  **Completion:** Backend creates a session, authorizes the player in-game immediately.

#### 3. Admin Panel (Two-Step Verification)
1.  **Trigger:** Admin runs `/agarthalogin adminpanel`.
2.  **Access:** Short-lived (15s) link generated.
3.  **Action:** Admin performs sensitive actions in browser.
4.  **Verification:** Browser provides a 6-digit code.
5.  **Finalize:** Admin types `/agarthalogin apply <code>` in-game to execute.

### Core Design Pattern (Maintained)
The **Bootstrap + Delegate** pattern remains. `AuthenticLibreLogin` now manages the `WebServer` lifecycle.

### Database Structure
**Unchanged.** AgarthaLogin uses the standard `librepremium_data` table for full compatibility.

| Component | File Path | Description |
| :--- | :--- | :--- |
| **Web Server** | `Plugin/src/main/java/xyz/kyngs/librelogin/common/web/WebServer.java` | Jetty server entry point. |
| **API Handler** | `Plugin/src/main/java/xyz/kyngs/librelogin/common/web/handler/ApiHandler.java` | Handles REST endpoints. |
| **Session Manager** | `Plugin/src/main/java/xyz/kyngs/librelogin/common/web/WebSessionManager.java` | Manages tokens and sessions. |
| **Frontend App** | `frontend/src/App.jsx` | React application logic. |
| **Auth Provider** | `Plugin/src/main/java/xyz/kyngs/librelogin/common/authorization/AuthenticAuthorizationProvider.java` | Modified to open Book instead of chat. |

## Dependencies
-   **Jetty**: 11.0.20 (Server, Servlet)
-   **Gson**: 2.10.1
-   **React**: 18.2.0 (Frontend)
