# AgarthaLogin 🔐

<img src="https://img.shields.io/badge/Java%20version-%2017+-blue?style=for-the-badge&logo=java&logoColor=white" alt="Plugin requires Java 17 or newer"></img>
<a href="https://github.com/akippnn/AgarthaLogin/wiki">
<img src="https://img.shields.io/badge/Documentation-Docs-orange?style=for-the-badge&logo=wikipedia" alt="Documentation on the Wiki"></img>
</a>

AgarthaLogin is a modern authentication plugin for Minecraft servers, designed as a seamless and secure login alternative to command-based auth systems. It features a novel **Web-Based Authentication** flow, replacing traditional in-game commands with a sleek web interface.

> [!NOTE]
> This project is a fork of [LibreLogin](https://github.com/kyngs/LibreLogin), heavily modified for production use and enhanced with web capabilities.

## 🚀 Key Features

### 🌐 Web-Based Authentication
**No more `/login <password>`!**
- **Secure Flow**: Players receive a one-time link in-game.
- **Modern UI**: React-based frontend providing a smooth user experience.
- **Session Management**: Token-based validation with automatic in-game authorization.

### 🔒 Security
- **BCrypt-2A**: Industry-standard password hashing.
- **TOTP 2FA**: Support for Two-Factor Authentication (Google Authenticator, Authy). [Details](https://github.com/Navio1430/LibreLoginProd/wiki/2FA)
- **AutoLogin**: Premium players are automatically authenticated.
- **Session Persistence**: Secure session handling with configurable timeouts.

### ⚙️ Multi-Platform Support
- ✅ **Velocity**: Full support for Velocity 3.x (up to 1.21+)
- ✅ **Paper**: Native support for Paper 1.21+
- ✅ **Docker Ready**: Includes a production-ready `docker-compose` setup.
- ✅ **Geyser/Floodgate**: Bedrock support via [Floodgate](https://github.com/Navio1430/LibreLoginProd/wiki/Floodgate).
- ❌ **BungeeCord**: No longer supported.

## 🛠️ Technical Overview

### Web Server Integration
- **Jetty**: Embedded web server handling HTTP requests.
- **React Frontend**: Single Page Application (SPA) served by the plugin.
- **API Endpoints**:
  - `/api/check-token`: Validates the login token.
  - `/api/login`: Authenticates user credentials.
  - `/api/register`: Handles new account creation.
  - `/api/session-auth`: Verifies active sessions.

### Authentication Logic
- **Token Generation**: Secure, short-lived tokens generated upon player join.
- **Async Handling**: All database and web operations are offloaded from the main server thread.
- **Event-Driven**: Uses platform events to authorize players once the web session is valid.

## 📦 Installation

1. Build the plugin: `./gradlew shadowJar`
2. Deploy to your Velocity plugins folder.
3. Configure `config.conf` (ensure web port is open).
4. Restart the proxy.

The environment can be containerized. See `.compose/docker-compose.yaml` for the complete network topology including Velocity, Backend (Paper), and Database.

## 📌 Quick Info


## 👥 Contributors

- **vuxeim** - Support for the newest Minecraft versions
- **Original LibreLogin creators** - For creating the base plugin

## ❓ FAQ

### Any configuration differences?
The configuration file itself remains largely the same with new additions. The database schema is compatible with LibreLogin, so you can use the same database. Reconfiguring AgarthaLogin is required.

## 📄 License

Project is licensed under the Mozilla Public License 2.0.
[Read the license here.](https://github.com/Navio1430/LibreLoginProd/blob/master/LICENSE)

---
*Maintained by the Agartha Team.*
