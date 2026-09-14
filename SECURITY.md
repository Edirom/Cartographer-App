# Security Policy

## Supported Versions

Only the latest release line of the Cartographer App receives security
updates. Older versions should be upgraded to the current release.

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| < 2.0   | :x:                |

The published Docker image is rebuilt for supported releases; if you deploy
via Docker, pull the latest image tag for the supported line.

## Reporting a Vulnerability

Please do **not** report security vulnerabilities through public GitHub
issues, discussions, or pull requests.

Instead, use one of the following private channels:

- **GitHub private vulnerability reporting (preferred):** go to the
  repository's **Security** tab → **Report a vulnerability**. This opens a
  private advisory visible only to you and the maintainers.
- **Email:** contact the maintainers at <SECURITY_CONTACT_EMAIL>.

Please include as much of the following as you can:

- A description of the vulnerability and its potential impact
- Steps to reproduce, a proof of concept, or affected URLs/components
- The version, commit, or Docker image tag you tested
- Any relevant configuration (e.g. root vs. subpath deployment, OAuth setup)

## What to Expect

- **Acknowledgement** of your report within **7 days**.
- An assessment and, where possible, a status update at least every
  **14 days** until the issue is resolved or declined.
- If the vulnerability is **accepted**, we will work on a fix, coordinate a
  release, and credit you in the advisory unless you prefer to remain
  anonymous.
- If the vulnerability is **declined** (e.g. not reproducible, out of scope,
  or working as intended), we will explain why.

We ask that you give us a reasonable opportunity to remediate the issue
before any public disclosure (coordinated disclosure, typically 90 days).

## Scope Notes

Reports we are particularly interested in include:

- Issues in the GitHub OAuth flow (token exchange via the nginx `/auth`
  endpoint, credential injection at container start, token handling in the
  browser)
- Ways to extract the `CLIENT_SECRET` from the container or the served bundle
- Injection or path-traversal issues in the subpath/placeholder rewriting
  (`40-create-ghcred.sh`)
- Vulnerabilities in how repository content (MEI files, images) is fetched
  and rendered

Vulnerabilities in third-party dependencies are best reported upstream, but
feel free to notify us as well so we can update or mitigate (see also the
automated `npm audit` workflow and Dependabot configuration in this repo).
