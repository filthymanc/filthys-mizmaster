# filthy's MizMaster

> **"filthy's MizMaster: Your personal AI co-pilot for DCS World mission scripting. Whether you're new to coding or a veteran, this tool simplifies MOOSE and DML logic, validates syntax, and manages snippets. Developed by 'the filthymanc' for the entire DCS community. Make your mission ideas fly."**

![Deployment Status](https://img.shields.io/github/deployments/filthymanc/filthys-mizmaster/github-pages?label=Deployment)
![License](https://img.shields.io/github/license/filthymanc/filthys-mizmaster)

## 🚀 Overview

**filthy's MizMaster** is a progressive web application (PWA) designed to act as an intelligent "Force Multiplier" for DCS Mission Designers. It integrates the latest Google Gemini models with a specialized "Librarian" toolset to fetch, analyze, and implement scripts from the **MOOSE** and **DML** frameworks.

### Key Capabilities
- **Context-Aware Chat:** Understands the difference between a `GROUP:FindByName()` and a generic Lua function.
- **The Librarian:** Can browse the GitHub file trees of MOOSE and DML in real-time to fetch the latest source code for context.
- **Syntax Safety:** Automatically sanitizes output to prevent usage of banned DCS Lua environments (`os`, `io`, `lfs`).
- **Mobile Optimized:** Designed for use on a secondary tablet or laptop while you work in the Mission Editor.

---

## 🛠️ Installation (Local Development)

This repository is the **Local Edition** (GPL Source).

1. **Clone:**
   ```bash
   git clone https://github.com/filthymanc/filthys-mizmaster.git
   cd filthys-mizmaster
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Run Dev Server:**
   ```bash
   npm run dev
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 📜 Legal & Compliance

### License
This project is licensed under the **GNU General Public License v3.0**.
See [LICENSE](LICENSE) for details.

### Trademark Notice
"filthy's MizMaster" is a trademark of the filthymanc.
While the source code is free to modify under GPL, you **must rename your fork** if you intend to distribute it publicly, as per Section 7(e) of the GPL v3.

### Third-Party Rights
- **DCS World** is a trademark of Eagle Dynamics SA. This project is not endorsed by or affiliated with Eagle Dynamics.
- **MOOSE** is the intellectual property of FlightControl-Master. This project is not endorsed by or affiliated with FlightControl-Master.
- **DML** is the intellectual property of csofranz. This project is not endorsed by or affiliated with csofranz.


