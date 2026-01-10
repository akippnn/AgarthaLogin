# AgarthaLogin 🔐

![Status](https://img.shields.io/badge/Status-Beta-orange)
![License](https://img.shields.io/badge/License-MPL%202.0-blue)
![Core](https://img.shields.io/badge/Core-Java%2021-green)
![Platforms](https://img.shields.io/badge/Platform-Velocity%20%7C%20Paper-lightgrey)

AgarthaLogin acts as a modern alternative to traditional auth plugins, moving logins from the chat to the web. This enables advanced user experiences like **standard browser autofill**, **2FA**, and **future web integrations** such as OAuth and passwordless setups that works on all Velocity setups. You do not need

> [!IMPORTANT]
> AgarthaLogin prevents passwords from being compromised with [a proper HTTPS setup](./docs/EXPOSING_AUTH.md), but it **does not encrypt in-game connection** (TCP).
>
> *   **Just want encryption?**  
>     Use [OfflineEncryptor](https://modrinth.com/plugin/offlineencryptor) with your existing auth plugin.
> *   **Want better auth UX?**  
>     Use AgarthaLogin (we recommend using it *alongside* [OfflineEncryptor](https://modrinth.com/plugin/offlineencryptor) for maximum security).

> [!NOTE]
> This project is a fork of [LibreLogin](https://github.com/kyngs/LibreLogin), heavily modified for production use and enhanced with web capabilities.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌐 **Web Authentication** | One-time links, React UI, session persistence |
| 🔒 **BCrypt Hashing** | Industry-standard password security |
| 👑 **Premium AutoLogin** | Automatic authentication for Mojang accounts |
| 🛡️ **Admin Panel** | Web-based user management interface |
| 🔄 **Session Management** | Token-based auth with configurable timeouts |

### Platform Support
- ✅ **Velocity 3.x** (1.21+)
- ✅ **Paper** (1.21+)
- ✅ **Docker** — production-ready compose setup
- ✅ **Geyser/Floodgate** — [Bedrock support](https://github.com/Navio1430/LibreLoginProd/wiki/Floodgate)
- ❌ **BungeeCord** — not supported

## 📚️ Tech Stack

**Backend**: Java 21, Jetty (embedded web server)  
**Frontend**: Vite + React + TypeScript  
**Database**: MySQL/MariaDB/PostgreSQL/SQLite

### API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `/api/check-token` | Validate login token |
| `/api/login` | Authenticate credentials |
| `/api/register` | Create new account |
| `/api/session-auth` | Verify active session |
| `/api/admin/*` | Admin panel operations |

## 📦 Quick Start

> **New to AgarthaLogin?** Check out the [Getting Started Guide](./docs/GETTING_STARTED.md).

```bash
# Build
./gradlew shadowJar

# Deploy to Velocity plugins folder
# Configure config.conf (ensure web port is open)
# Restart proxy
```

For containerized deployments, see `.compose/docker-compose.yaml`.
## 👥 Credits

- **vuxeim** — Support for newest Minecraft versions
- **LibreLogin creators** — Original base plugin

## 📄 License

[Mozilla Public License 2.0](LICENSE)