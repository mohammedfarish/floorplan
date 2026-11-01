# Floorplan in Cursor

Floorplan installs in [Cursor](https://cursor.com) as a Cursor plugin: the same skill, scripts and map as in Claude Code and Codex. Cursor's agent follows the skill, runs the scripts and opens the map in your browser.

## What you need

- Cursor, with its agent.
- [Node.js](https://nodejs.org) 18 or newer.
- For the map's Ask bar: the [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) or [Codex](codex.md), signed in. See [Asking questions on the map](#asking-questions-on-the-map).

## Install

**From GitHub:**

1. In Cursor, open **Customize**.
2. Choose **From GitHub Repository** and enter `haydenschmitty/floorplan`.
3. Install **Floorplan**, for a project or for every project.
4. Start a new chat.

The repo lists the plugin in `.cursor-plugin/marketplace.json`, and the plugin itself is described in `.cursor-plugin/plugin.json`.

## Make your first map

Open your project in Cursor and ask the agent in plain words:

> Draw a floorplan of this codebase

You can also call the skill by name with `/floorplan`. Everything after that is the same as in Claude Code ([Getting started](getting-started.md#make-your-first-map)): the agent scans the code, describes every part, file and web request, builds the map and opens it. Later, "update the floorplan" re-reads only what changed.

Cursor asks before running the skill's scripts according to your own settings. The skill's list of pre-approved scripts is a Claude Code feature.

## Asking questions on the map

There is no Cursor engine for the Ask bar yet. The map's server answers through the Claude Code CLI or Codex, read-only, on your own account, exactly as described in [Getting started](getting-started.md) and [Floorplan in Codex](codex.md#asking-questions-on-the-map). If neither is installed, the map still works for exploring, Health, Screens and flows, and only the Ask bar can't answer.

A map made in Cursor is recorded as made by Claude Code, so its Ask bar tries the Claude Code CLI first and falls back to Codex, and its ready-made fix prompts say "Fix with Claude". To choose Codex:

```bash
node floorplan/serve.mjs --engine codex
```

## Trying a working copy

To test a local clone without a marketplace, copy it into Cursor's local plugins folder:

```bash
mkdir -p ~/.cursor/plugins/local
cp -R /path/to/floorplan ~/.cursor/plugins/local/floorplan
```

Then restart Cursor, or run **Developer: Reload Window**, and check that **Floorplan** shows under skills in **Customize**. Cursor skips a symlink here that points outside `~/.cursor/plugins/local`, so copy the folder rather than linking it, and copy it again after each change. If you also installed Floorplan from GitHub, that install takes precedence over the local copy.

## Update or remove it

Open **Customize**, find Floorplan, and update or uninstall it there. For a local copy, delete `~/.cursor/plugins/local/floorplan` and reload the window. Your maps stay in each project's `floorplan/` folder until you delete them.
