# AgarthaLogin 🔐

<img src="https://img.shields.io/badge/Java%20version-%2017+-blue?style=for-the-badge&logo=java&logoColor=white" alt="Plugin requires Java 17 or newer"></img>
<a href="https://github.com/akippnn/AgarthaLogin/wiki">
<img src="https://img.shields.io/badge/Documentation-Docs-orange?style=for-the-badge&logo=wikipedia" alt="Documentation on the Wiki"></img>
</a>

AgarthaLogin is a modern authentication plugin for Minecraft servers that replaces traditional `/login <password>` commands with a **secure web-based authentication flow**. Players receive a one-time link in chat and authenticate through a sleek React interface—no more sending passwords in plain text over chat.

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

## �️ Tech Stack

**Backend**: Java 17+, Jetty (embedded web server)  
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

```bash
# Build
./gradlew shadowJar

# Deploy to Velocity plugins folder
# Configure config.conf (ensure web port is open)
# Restart proxy
```

For containerized deployments, see `.compose/docker-compose.yaml`.

## 📍 Roadmap

- [x] Web-based authentication flow (Jetty + React)
- [x] Session management and auto-login
- [x] Admin panel with user management
- [x] Premium/cracked registration flow with Mojang verification
- [x] Frontend refactor — migrated to TypeScript, extracted common UI components
- [ ] Support custom CSS
- [ ] User settings panel (password change, premium/cracked toggle)
- [ ] Two-Factor Authentication (TOTP)
- [ ] Plugin rewrite (keeping only the important parts, fully independent from LibreLogin)
- [ ] Decouple Jetty and Vite web stack from plugin

## 👥 Credits

- **vuxeim** — Support for newest Minecraft versions
- **LibreLogin creators** — Original base plugin

## 📄 License

[Mozilla Public License 2.0](LICENSE)

---
*Maintained by the Agartha Team.*
