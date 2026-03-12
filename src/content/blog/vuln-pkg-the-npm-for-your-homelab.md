---
author: Mainasara Tsowa
pubDatetime: 2026-03-12T06:00:00Z
title: 'vuln-pkg: The Boredom-Fueled Package Manager for Your Homelab'
featured: true
published: true
description: How watching coworkers struggle with Docker led to a one-command solution for security training labs
tags:
    - rust
    - security
    - docker
    - projects
---

Another "surely this exists" project that didn't exist.

## Table of contents

## The Problem

I work in security. SOC, specifically. Night shifts staring at Wazuh alerts and watching traffic do suspicious things.

But here's the thing about security — you need practice targets. You can't just hack production (well, you *shouldn't*). So you set up homelabs with intentionally vulnerable applications: DVWA, WebGoat, Juice Shop, the classics.

And this is where I watched my coworkers suffer.

"How do I set up DVWA?"
"What port is it on again?"
"Why is there a conflict with my other container?"
"Where's the docker-compose file?"
"Wait, I need to configure MySQL first?"

I've seen security engineers — people who can find race conditions and craft buffer overflows — struggle with basic Docker networking.

It shouldn't be this hard.

## The Idea

I was bored one night (night shift, remember?) and the thought hit me:

*What if spinning up vulnerable apps was as easy as `npm install`?*

```bash
vuln-pkg run dvwa
# That's it. DVWA is now running at http://dvwa.127.0.0.1.sslip.io
```

No docker-compose files. No port management. No DNS configuration. Just... run it.

The name "vuln-pkg" came naturally — it's a package manager, but for vulnerable applications. The NPM for your home lab.

## Zero-Config Everything

The hardest part of running multiple web applications locally is port conflicts and DNS. You end up with bookmarks like:

- `localhost:8080` — DVWA
- `localhost:8081` — WebGoat  
- `localhost:3000` — Juice Shop
- `localhost:????` — wait, which one was this?

I wanted clean URLs. `http://dvwa.localhost` instead of `http://localhost:8080`.

The problem? Local DNS is annoying to configure. You need to edit `/etc/hosts`, or run dnsmasq, or mess with systemd-resolved. None of that is "zero-config."

Enter [sslip.io](https://sslip.io).

sslip.io is a DNS service that returns the IP address embedded in the hostname. So:
- `dvwa.127.0.0.1.sslip.io` resolves to `127.0.0.1`
- `webgoat.192.168.1.50.sslip.io` resolves to `192.168.1.50`

It just... works. No local setup needed. This was the "aha" moment that made the whole project click.

## Traefik, My Beloved

Clean URLs mean you need a reverse proxy. Traefik handles this beautifully — it reads Docker labels and automatically routes requests based on hostname.

When you run `vuln-pkg run dvwa`, here's what actually happens:

1. Pull the Docker image (if needed)
2. Create a `vuln-pkg` Docker network
3. Spin up Traefik (if not already running)
4. Start the container with appropriate labels
5. Print the URL

```
[*] Ensuring vuln-pkg network exists
[*] Starting Traefik reverse proxy
[+] Traefik running (dashboard: http://traefik.127.0.0.1.sslip.io)
[*] Creating container for dvwa
[+] Started dvwa

 -> http://dvwa.127.0.0.1.sslip.io
```

Want to run three apps simultaneously? Just run three commands:

```bash
vuln-pkg run dvwa
vuln-pkg run webgoat
vuln-pkg run juice-shop
```

All accessible via subdomains, all on port 80, no conflicts.

## Custom Manifests

The default manifest has the usual suspects — DVWA, WebGoat, Juice Shop, bWAPP, and more. But what if you want your own vulnerable apps?

This is where custom manifests come in. You can create a YAML file with your own applications:

```yaml
# my-labs.yml
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

Then:

```bash
vuln-pkg --manifest-url file://./my-labs.yml run sqli-lab
```

You can also point at Git repos:

```yaml
- name: dvwa-custom
  version: "1.0"
  type: git
  repo: https://github.com/digininja/DVWA.git
  ref: master
  ports: [80]
```

Run `vuln-pkg rebuild dvwa-custom` anytime to pull the latest changes.

## The Rust of It

I wrote this in Rust. Not because I needed to (Go would've been fine), but because I wanted to. Sometimes you just want an excuse to write Rust.

The binary is self-contained — no runtime dependencies except Docker. Cross-compiles to Linux, macOS, and Windows without much fuss. The install script auto-detects your platform:

```bash
curl -fsSL https://raw.githubusercontent.com/neutrino2211/vuln-pkg/main/install.sh | bash
```

I'm quite happy with how clean the CLI turned out:

```
vuln-pkg list              # See available apps
vuln-pkg search sqli       # Find apps by tag
vuln-pkg run dvwa          # Start an app
vuln-pkg status            # See what's running
vuln-pkg stop dvwa         # Stop an app
vuln-pkg remove --purge    # Nuke everything
```

## Conclusion

vuln-pkg is one of those tools born from watching people struggle with something that shouldn't be hard. It's not revolutionary technology — it's Traefik and sslip.io glued together with some nice CLI ergonomics.

But that's often what good tools are: obvious ideas, well-executed.

If you're doing security training, running CTFs, or just want to practice without the Docker hassle — give it a try:

```bash
curl -fsSL https://raw.githubusercontent.com/neutrino2211/vuln-pkg/main/install.sh | bash
vuln-pkg run dvwa
```

That's it. You're hacking.

---

*Check it out: [github.com/neutrino2211/vuln-pkg](https://github.com/neutrino2211/vuln-pkg)*
