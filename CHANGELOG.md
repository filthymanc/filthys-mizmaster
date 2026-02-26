# Changelog

All notable changes to this project will be documented in this file.
## [1.2.0](https://github.com/filthymanc/filthys-mizmaster/compare/v1.1.0...v1.2.0) (2026-02-26)


### Features

* **phase-2:** implement tactical interface enhancements ([f6b0cb3](https://github.com/filthymanc/filthys-mizmaster/commit/f6b0cb32ab71c0e891f8832fda2299bd1f704d1e))

## [1.1.0](https://github.com/filthymanc/filthys-mizmaster/compare/v1.0.2...v1.1.0) (2026-02-26)


### Features

* phase 1 - syntax highlighting and chat virtualization ([917b069](https://github.com/filthymanc/filthys-mizmaster/commit/917b069046de231657ab9aa9e90c7167cea8090c))

### [1.0.2](https://github.com/filthymanc/filthys-mizmaster/compare/v1.0.1...v1.0.2) (2026-02-23)


### Miscellaneous Chores

* **deps:** override minimatch to v10.2.1 to resolve ReDoS vulnerability ([8959a43](https://github.com/filthymanc/filthys-mizmaster/commit/8959a43318526d90b62b694f990fcdf817c7d346))

### 1.0.1 (2026-02-23)


### Features

* **core:** implement XML-based system instructions and anti-hallucination protocols ([ce05b99](https://github.com/filthymanc/filthys-mizmaster/commit/ce05b9990883bd01bb5253f880a5d65fb8d0ffe9))


### Bug Fixes

* **security:** resolve insecure randomness & restore vite 5.4 build ([7219052](https://github.com/filthymanc/filthys-mizmaster/commit/7219052be25bfddc099df1d6b814e08a92b45300))


### Miscellaneous Chores

* add generated SVG icon for PWA ([3536e88](https://github.com/filthymanc/filthys-mizmaster/commit/3536e8862f865d0fad133ac664dd1d736d7a56cc))
* **deps:** bump esbuild and vite ([7151430](https://github.com/filthymanc/filthys-mizmaster/commit/7151430ad2928dd0e406c4220868928259e9aa56))
* **deps:** update package-lock.json with security overrides ([8aea42e](https://github.com/filthymanc/filthys-mizmaster/commit/8aea42eeadd44f406ec4c92fbc0ab79632b6e840))
* initial commit for filthy's MizMaster v1.0.0 ([8805fe4](https://github.com/filthymanc/filthys-mizmaster/commit/8805fe4f04827cc88a9ba3f77921de5f0331cf57))
* **release:** 1.0.1 - fix security vulnerabilities in build dependencies ([42543e9](https://github.com/filthymanc/filthys-mizmaster/commit/42543e9560c8b2ab29dd635638e2646a87f244be))

## [1.0.0] - 2026-02-22
### Initial Release
- **Initial Release**: filthy's MizMaster v1.0.0. A specialized AI co-pilot for DCS World mission scripting (MOOSE/DML).
- **Core Engine**: Integrated @google/genai SDK with System Instructions for Lua sanitation and framework prioritization.
- **The Librarian Toolset**: Added GitHub API integration for real-time repository parsing and semantic file search.
- **User Interface**: Implemented responsive, mobile-optimized split-screen workspace with multiple tactical theme profiles (Carbon, Green Camo, Desert Camo, Supercarrier).
- **Persistence**: Deployed IndexedDB storage engine for local session and token usage tracking.
