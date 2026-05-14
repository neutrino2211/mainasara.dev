---
author: Mainasara Tsowa
pubDatetime: 2026-03-12T06:00:00Z
title: "vuln-pkg: The Boredom-Fueled Package Manager for Your Homelab"
featured: true
draft: false
description: "How watching teammates wrestle with Docker inspired a one-command way to run vulnerable labs."
tags:
  - rust
  - security
  - docker
  - projects
---

This is one of those "surely somebody already built this" projects that, somehow, did not exist.

## The problem

I work in security, specifically in a SOC. A lot of my time is spent on night shifts staring at Wazuh alerts and following suspicious traffic patterns.

In security, you need practice targets. You cannot test skills on production systems, so most of us run intentionally vulnerable apps in homelabs: DVWA, WebGoat, Juice Shop, and the usual suspects.

The pain starts right there.

I kept hearing the same questions from coworkers:

- How do I set up DVWA again?
- Which port is this one running on?
- Why is Docker complaining about conflicts?
- Where is the compose file?
- Wait, do I have to set up MySQL first?

These are skilled security engineers. People who can analyze weird memory bugs and spot dangerous logic flaws. But local Docker plumbing still slows everyone down.

It felt like something we should be able to simplify.

## The idea

One boring night shift, a thought popped up:

What if vulnerable lab setup felt like `npm install`?

```bash
vuln-pkg run dvwa
# That's it. DVWA is now at http://dvwa.127.0.0.1.sslip.io
```

No compose files. No manual port mapping. No DNS setup. Just run a command.

That is where the name came from: `vuln-pkg`. A package manager for vulnerable apps. Basically npm, but for your homelab.

## Making it zero-config

The messiest part of running many local apps is usually ports and naming.

You end up with a mental map like this:

- `localhost:8080` -> DVWA
- `localhost:8081` -> WebGoat
- `localhost:3000` -> Juice Shop
- `localhost:????` -> no idea anymore

I wanted cleaner URLs. Something like:

- `http://dvwa.127.0.0.1.sslip.io`
- `http://webgoat.127.0.0.1.sslip.io`

without touching `/etc/hosts` or running local DNS services.

That is where [sslip.io](https://sslip.io) helped a lot. It resolves hostnames that contain an IP address:

- `dvwa.127.0.0.1.sslip.io` -> `127.0.0.1`
- `webgoat.192.168.1.50.sslip.io` -> `192.168.1.50`

No machine-level DNS setup needed. This was the piece that made the rest click.

## Traefik does the routing

Once clean hostnames are in place, you need a reverse proxy. I used Traefik because it reads Docker labels and configures routes automatically.

When you run `vuln-pkg run dvwa`, the flow is:

1. Pull image if needed.
2. Ensure `vuln-pkg` Docker network exists.
3. Start Traefik (if not already running).
4. Start the app container with the right labels.
5. Print the URL.

Example output:

```text
[*] Ensuring vuln-pkg network exists
[*] Starting Traefik reverse proxy
[+] Traefik running (dashboard: http://traefik.127.0.0.1.sslip.io)
[*] Creating container for dvwa
[+] Started dvwa

 -> http://dvwa.127.0.0.1.sslip.io
```

Need multiple labs at once?

```bash
vuln-pkg run dvwa
vuln-pkg run webgoat
vuln-pkg run juice-shop
```

Everything stays on clean subdomains with no port collisions.

## Custom manifests

The default manifest includes common training apps (DVWA, WebGoat, Juice Shop, bWAPP, and others), but I also wanted people to define their own labs.

You can create a YAML manifest like this:

```yaml
meta:
  author: "Your Name"
  description: "Custom training labs"

apps:
  - name: sqli-lab
    version: "1.0"
    type: dockerfile
    dockerfile: |
      FROM php:8.0-apache
      RUN docker-php-ext-install mysqli
      COPY <<EOF /var/www/html/index.php
      <?php
      $conn = new mysqli("db", "root", "root", "vuln");
      $id = $_GET['id'];
      $result = $conn->query("SELECT * FROM users WHERE id = $id");
      ?>
      EOF
    ports: [80]
    description: "Simple SQL injection lab"
```

Run with:

```bash
vuln-pkg --manifest-url file://./my-labs.yml run sqli-lab
```

You can also use Git-based sources:

```yaml
- name: dvwa-custom
  version: "1.0"
  type: git
  repo: https://github.com/digininja/DVWA.git
  ref: master
  ports: [80]
```

Then pull updates with:

```bash
vuln-pkg rebuild dvwa-custom
```

## Why Rust?

I wrote it in Rust. Not because I had to, but because I wanted to.

The binary is self-contained, and the only real runtime dependency is Docker. It cross-compiles nicely for Linux, macOS, and Windows. The install script handles platform detection.

```bash
curl -fsSL https://raw.githubusercontent.com/neutrino2211/vuln-pkg/main/install.sh | bash
```

CLI commands are intentionally simple:

```text
vuln-pkg list              # Available apps
vuln-pkg search sqli       # Filter apps by keyword/tag
vuln-pkg run dvwa          # Start app
vuln-pkg status            # Show running apps
vuln-pkg stop dvwa         # Stop app
vuln-pkg remove --purge    # Remove everything
```

## Closing thoughts

`vuln-pkg` came from repeatedly watching people burn time on setup friction that had nothing to do with learning security.

It is not some revolutionary invention. It is mostly Traefik + sslip.io + a cleaner CLI experience. But sometimes that is exactly what makes a tool useful.

If you run training labs, host CTF exercises, or just want quick vulnerable targets without Docker busywork, give it a shot:

```bash
curl -fsSL https://raw.githubusercontent.com/neutrino2211/vuln-pkg/main/install.sh | bash
vuln-pkg run dvwa
```

Repository: [neutrino2211/vuln-pkg](https://github.com/neutrino2211/vuln-pkg)
