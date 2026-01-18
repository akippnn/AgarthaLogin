# Getting Started

This guide walks you through setting up AgarthaLogin on your Minecraft server.

## Prerequisites

- **Java 21+**
- **Velocity 3.x** and/or **Paper 1.21+**
- A database: MySQL, MariaDB, PostgreSQL, or SQLite
- A reverse proxy or tunnel for HTTPS (see [Exposing Auth](EXPOSING_AUTH.md))

## Installation

### 1. Download the plugin

Grab the latest JAR from [GitHub Releases](https://github.com/akippnn/AgarthaLogin/releases).

### 2. Deploy

Copy the built JAR to your server's `plugins/` folder based on your setup:

*   **Velocity Network** (Recommended): Place it in the **Velocity** `plugins/` folder.  

> [!WARNING]
> **Do not** install AgarthaLogin on your backend Paper servers if you are using Velocity. It will conflict or disable itself.

*   **Single Server** (No Proxy): Place it in the **Paper** `plugins/` folder.

### 3. Configure database

On first run, the plugin generates `plugins/AgarthaLogin/config.conf`. Configure your database:

```hocon
database {
    type = "sqlite"  # or mysql, mariadb, postgresql
    # For non-SQLite, configure host, port, database, username, password
}
```

### 4. Expose the web authentication

Before configuring the web server, you need to set up HTTPS access. See [Exposing Auth](EXPOSING_AUTH.md) for:
- Reverse proxy (Nginx, HAProxy)
- Tunneling (Tailscale, Cloudflare)
- Airgapped/self-signed setups

### 5. Configure public URL

After exposing the auth endpoint, update `config.conf` with your HTTPS URL:

```hocon
web-server {
    enabled = true
    port = 8080
    public-url = "https://auth.yourdomain.com"  # The URL from step 4
}
```

### 6. Restart your server

Restart Velocity/Paper to load the plugin with your configuration.

## Docker Deployment

For containerized setups, see the `.compose/` directory in the repository root.

## Next Steps

- How to use the admin panel (coming soon)
- Customize the frontend appearance (coming soon)

## Testing

> [!NOTE]
> **Production Preview**: Accessing the frontend via `http://localhost` now behaves differently depending on the mode:
> - `npm run dev` (Development): Bypasses authentication with specific mock tokens for easier debugging.
> - `npm run preview` (Production Build): Simulates a real production environment. Authentication is **NOT bypassed**, allowing you to test edge cases and real error states (like missing tokens) even on localhost.
