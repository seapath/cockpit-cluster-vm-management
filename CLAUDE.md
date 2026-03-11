# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cockpit plugin for managing Virtual Machines on a SEAPATH cluster. Built with React (class components) and PatternFly 5, bundled with esbuild. Runs inside the Cockpit web console and interacts with VMs via `vm-mgr` and `crm` CLI tools spawned through the Cockpit API (`cockpit.spawn()`).

## Build Commands

```bash
npm run init    # First-time setup: install deps, copy cockpit libs to pkg/lib, build to dist/
npm run build   # Rebuild to dist/
npm run clean   # Remove dist/, node_modules/, pkg/, and package-lock.json
```

No test or lint commands are configured.

## Architecture

**Entry point:** `src/index.js` → renders `Application` from `src/app.jsx`.

**Routing:** Uses `cockpit.location.path` for client-side navigation. Two views:
- Default: `VMManager` (VM list + actions + creation)
- `/console/<vmName>`: `VMConsole` (xterm-based terminal)

**Component hierarchy** (all class components, in `src/components/`):
- `VMManager` — orchestrates the main view
  - `VMData` — render-prop component that fetches VM list via `vm-mgr list`, `vm-mgr status`, and `crm` commands. Provides `VMlist` and `refreshVMList` to children.
  - `VMTable` — displays VMs using PatternFly Table
  - `VMActions` — action buttons (start, stop, enable, disable, restart, migrate, snapshot, remove). Uses `vm-mgr` for VM operations, `crm resource` for cluster operations. Polls `crm_mon` XML output during migration.
  - `VMCreator` — modal for creating VMs from uploaded qcow2/XML files
  - `VMConsole` — xterm terminal connecting to VM console

**Key external dependencies:**
- `cockpit` — imported as a bare module from `pkg/lib` (copied from cockpit-repo during init)
- `vm-mgr` (vm_manager) — CLI tool for VM lifecycle operations on the hypervisor
- `crm` / `crm_mon` — Pacemaker cluster resource management commands

**Build system:** `build.js` uses esbuild with JSX loader, SASS plugins (from cockpit's esbuild helpers in `pkg/lib/`), and copies `index.html` + `manifest.json` to `dist/`. The `pkg/lib/` directory is not committed — it's copied from the `cockpit-repo` npm dependency during `npm run init`.

## Deployment

Built output in `dist/` is copied to `/usr/share/cockpit/cockpit-cluster-vm-management` on target machines. The `manifest.json` registers the plugin with Cockpit.

## Conventions

- Apache-2.0 license; copyright header on all source files (ask for the copyright holder if unsure)
- All React components use class-based style (not hooks)
- Cockpit API for shell commands: `cockpit.spawn([cmd, ...args], { superuser: "try" })`
