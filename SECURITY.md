# Security Policy

## Supported Versions

Only the current major version is supported for security updates.

| Version | Supported          |
| ------- | ------------------ |
| v2.x.x  | :white_check_mark: |
| v1.x.x  | :x:                |

## Security Architecture

"filthy's MizMaster" is a client-side Progressive Web Application (PWA).

- **Data Sovereignty:** All sensitive credentials (API Keys, GitHub Tokens) are stored locally in your browser's IndexedDB.
- **Secure Vault:** Sensitive data is encrypted using **AES-GCM** with a key derived via **PBKDF2** from your Master Password. Encryption keys are never persisted to disk.
- **Privacy:** No user data is transmitted to our servers. Network traffic is restricted via a Content Security Policy (CSP) to only authorized domains (Google AI APIs, GitHub API, and GitHub Raw Content CDN).

## Reporting a Vulnerability

If you discover a security vulnerability—particularly regarding the Secure Vault implementation or potential secret leakage—please do not disclose it publicly.

Instead, please report it privately via **GitHub Security Advisories**:

1. Navigate to the **Security** tab of this repository.
2. Select **Advisories** on the left sidebar.
3. Click **Report a vulnerability**.

### What to Report

- Flaws in the `cryptoService.ts` or Master Password derivation.
- Potential XSS vectors that could bypass the CSP.
- Unintentional logging of sensitive variables (PII/Secrets).

We will acknowledge receipt of your report within 48 hours and provide a timeline for a resolution.

## Disclaimer

This is a 3rd-party community tool. Users are responsible for their own API key usage and security hygiene. Always use a strong, unique Master Password.
