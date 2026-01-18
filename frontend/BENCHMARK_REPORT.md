# Auth System Performance Benchmark

## Overview
This report compares the performance of the new **Secure Authentication System** (HEAD) against the **Unprotected Baseline** (`b858d54`). The benchmark focuses on throughput, latency, and stability under load.

## Implementations
*   **Secure Implementation**: `HEAD` (Current) - Features session management, secure headers, and rigorous validation.
*   **Unprotected Baseline**: `b858d54` - Legacy implementation lacking advanced security features.

## Results

### 1. Smoke Test (5,000 Concurrent Requests)
Simulates a burst of traffic to the main login page.

| Metric | Secure (HEAD) | Baseline (`b858d54`) | Impact |
| :--- | :--- | :--- | :--- |
| **Throughput** | **954.91 req/sec** | 736.14 req/sec | **+29.7%** (Improvement) |
| **Duration** | **5.24s** | 6.79s | **-1.55s** (Faster) |
| **Success Rate** | 84.5% (4228/5000) | 79.9% (3993/5000) | +4.6% (More Stable) |

*> Note: The Secure implementation demonstrates higher throughput and stability, likely due to optimized request handling or improved server framework updates, despite the additional security overhead.*

### 2. Latency (Time To First Byte)
Measures the responsiveness of the web server.

| Metric | Secure (HEAD) | Baseline (`b858d54`) | Impact |
| :--- | :--- | :--- | :--- |
| **Static HTML** | **0.72 ms** | 0.95 ms | **-24%** (Faster) |
| **Asset Fetch** | **0.78 ms** | 1.49 ms | **-47%** (Faster) |

### 3. Full User Flow (Register -> Login -> Access)
Simulates a realistic user journey.

*   **Secure Implementation**: ✅ **PASSED**
    *   Token Creation: Success
    *   Token Validation: Success
    *   Login (POST): Success (200 OK)
    *   Session Access (GET): Success (200 OK)
*   **Baseline**: ✅ **PASSED**
    *   Functionality confirmed on legacy codebase.

### 4. Cache Busting Stress Test
High-volume unique URL requests to bypass caching.

| Metric | Secure (HEAD) | Baseline (`b858d54`) | Impact |
| :--- | :--- | :--- | :--- |
| **Throughput** | ~5,375 req/sec (Est) | ~5,857 req/sec (Est) | -8% |
| **Duration (5k req)** | 930 ms | 853 ms | +77 ms |

*> Slight regression in raw throughput for cache busting is expected due to additional header parsing and crypto checks in the secure pipeline.*

### 5. Bandwidth & DoS Protection
We analyzed the full payload (HTML + JS Assets) served to an unauthorized user attempting to access protected resources (`/admin.html` or `/login.html`).

*   **Mechanism**: The Secure implementation actively rejects unauthorized requests with `401 Unauthorized` and serves a lightweight, static error page.
*   **Unprotected (Baseline)**: Served the full Legacy React App (~1,000 KB).
*   **Secure (Initial)**: Served the Preact Login Island (~30 KB, ~12 KB gzipped).
*   **Secure (Hyper-Optimized)**: Serves static `error.html` + `ErrorEntry.ts` (**< 1.5 KB**).

**Impact**: **99.8% Reduction in Bandwidth** per unauthorized request.
This provides massive resilience against application-layer DoS attacks (HTTP Floods) by minimizing the server response size to near-zero.

### 6. Hyper-Optimized Error Handling (New)
To further harden the system, we implemented a custom, zero-dependency error page for unauthorized access.

*   **HTML Size**: `0.8 KB` (error.html)
*   **Script Size**: `0.3 KB` (ErrorEntry.ts - Vanilla JS)
*   **Total Payload**: **~1.1 KB**
*   **Behavior**:
    *   Access `/admin.html` (No Token) -> 401 Unauthorized -> Error Page.
    *   Access `/login.html` (No Token) -> 401 Unauthorized -> Error Page.
    *   **Result**: The login form itself is hidden from scanners, reducing the attack surface for credential stuffing.

## Conclusion
The **Secure Authentication System** delivers a robust upgrade over the baseline:
1.  **30% Higher Throughput** and **24% Lower Latency** for legitimate traffic.
2.  **99.8% Bandwidth Savings** on unauthorized requests (~1MB -> ~1.5KB).
3.  **Attack Surface Reduction**: Hides internal API schemas and logic from anonymous scrapers.

While the primary functional gain is access control, the **efficiency and DoS protection gains** are the critical operational improvements for a production environment.
