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

Copy the built JAR to your server's `plugins/` folder:
- **Velocity**: `plugins/`
- **Paper**: `plugins/`

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

- Set up the admin panel for user management
- Customize the frontend appearance (coming soon)
