# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project config

# Fill in before running /init. Everything else is discovered automatically.

Project name: Smart Section TOC
Purpose: Automatically generates a dynamic table of contents from H2 headings with smooth scrolling and active section highlighting.
WordPress: 6.9+
PHP: 8.4+
Dependencies: ACF Pro, Admin Columns Pro
Main plugin file: smart-section-toc.php

# Commands

There is no build step. CSS and JS in `assets/` are plain files edited directly.
Releases are built automatically by `.github/workflows/release.yml` when a version tag is pushed.

# Architecture

## Main plugin file

`smart-section-toc.php` contains a `Smart_Section_TOC` singleton class — this predates the procedural rule and is considered legacy infrastructure. Do not extend it. New functionality goes in standalone procedural includes.

Asset loading is conditional: CSS/JS enqueue only when the `[smart_section_toc]` shortcode is present on the page, or when the page contains H2 headings (detected via `smart_section_toc_intelligent_loading()`).

## Available filters

- `smart_section_toc_content_selector` — CSS selector for the content area (default: `.site-content`)
- `smart_section_toc_heading_selector` — heading tag to detect (default: `h2`)
- `smart_section_toc_scroll_offset` — scroll offset in px (default: `80`)
- `smart_section_toc_min_headings` — minimum heading count before TOC renders (default: `1`)

## Third-party code

`includes/plugin-update-checker/` is the Yahnis Elsts Plugin Update Checker library. Do not modify it.

# Architecture and boilerplate

This plugin was originally scaffolded with WordPress Plugin Boilerplate (wppb.me).
The boilerplate structure is considered legacy infrastructure and must not be replicated or extended.

## Rules for new and modified code

- Always write procedural PHP (PHP 8.4+). No classes, no OOP patterns.
- Create new files as standalone procedural includes — not as methods inside existing boilerplate classes.
- Do not call `Plugin_Name_Loader::add_action()` / `add_filter()` or similar.
  Use WordPress-native `add_action()` and `add_filter()` directly.
- The admin/public split in `/admin/` and `/public/` does not govern placement of new code.
  Place files according to functional logic.

## What you may ignore

- `class-{plugin}-loader.php` and its `run()` method
- `class-{plugin}-i18n.php` (unless i18n is explicitly in scope)
- Any class definition that exists solely as a boilerplate skeleton

## What you must not change without explicit instruction

Do not touch existing boilerplate classes or their hook registrations.
They serve as infrastructure glue and are only refactored in dedicated tasks.

# Code style

- Follow WordPress Coding Standards (WPCS)
- Procedural PHP only — no classes, no OOP, no traits
  Reason: I need to be able to read and review all code myself
- Prefer WordPress core APIs over custom implementations
- Use \_\_() and \_e() for all user-facing strings
- No <?php headers in output
- English-only inline comments

# PHPDoc

Add PHPDoc blocks to all functions and hooks by default.

- phpDocumentor syntax, PSR-12 placement
- Tag order: summary → @param → @return → @throws
- Use precise types: string, int, bool, WP_Post, WP_Error, int[], array<string, mixed>
- Avoid mixed unless genuinely unavoidable

# Security baseline

# Apply always — do not wait to be asked.

- Add direct file access guard at top of every PHP file: if ( ! defined( 'ABSPATH' ) ) exit;
- Sanitize all input: sanitize_text_field(), absint(), wp_kses() etc.
- Escape all output to context: esc_html(), esc_attr(), esc_url(), wp_kses_post()
- Use wpdb->prepare() for all SQL — never interpolate variables directly
- Check capabilities before any privileged operation: current_user_can()
- Use nonces for all state-changing requests: wp_verify_nonce()
- Never trust $\_GET, $\_POST or $\_REQUEST directly

If you spot a security issue outside the current task scope:
flag it explicitly, but do not fix it without asking first.

# Performance

# Apply when clearly relevant — do not over-optimise simple code.

- Use transients for expensive or repeated external calls
- Use wp_cache_get/set for repeated in-request lookups
- Avoid redundant database queries — check if WP core APIs already provide the data
- Avoid query-inside-loop patterns

# What NOT to do

- Do not introduce OOP — I need to be able to read and review all code
- Do not reimplement WordPress core functionality
- Do not refactor beyond the scope I have defined
- Do not add fallbacks or logging I haven't asked for
  (exception: security-critical error handling should always be included)
- Do not suggest plugin dependencies for problems solvable in <20 lines
- Do not make multiple changes in one step — one problem, one change

# Review and approval workflow

When reviewing or changing existing code:

1. Briefly state what the code does and its likely intent
2. Identify concrete issues before suggesting anything
3. Present changes as a unified diff (removed lines with -, added with +)
4. Briefly explain each change
5. Wait for my approval before outputting full code

Short replies like "yes", "ok", "looks good", "apply", "go ahead"
mean: output the full updated code. Do not re-analyze. Do not add changes.

# Git workflow

Git-flow is in use. Branch structure:

- Production branch: main
- Development branch: develop
- Feature branches: feature/[short-description]
- Hotfix branches: hotfix/[short-description]
- Release branches: release/[version]
- Version tags: v[semver] e.g. v1.2.0

Rules:

- New features always branch from develop, not main
- Hotfixes branch from main and merge back into both main and develop
- Never commit directly to main or develop
- Commit messages in imperative English: "Add expiry date calculation to klippekort"
- One logical change per commit — do not bundle unrelated changes
- Ask me before pushing, merging, or tagging a release

# Release procedure

When asked to create a release:

1. Find the latest release tag and list all commits since then
2. Determine the next version number (patch increment unless scope warrants minor/major)
3. Write changelog entries for user-facing commits only — exclude CLAUDE.md, docs, and internal tooling commits
4. Update version in:
    - Main plugin file (plugin header `Version:`)
    - `README.md` (`**Version:**`)
    - `README.txt` (header `Version:` and `== Changelog ==` section)
5. Commit with message: `Bump version to X.X.X`
6. Create tag: `vX.X.X` on current branch
7. Merge develop into main: `git checkout main && git merge --no-ff develop -m "Merge develop into main for release X.X.X"` then `git checkout develop`

Do not push to remote without explicit instruction.

# When to ask vs. proceed

Ask before proceeding if:

- The task requires touching more than one file
- You are unsure which approach fits the project architecture
- A change could affect existing functionality
- There are two reasonable solutions with different trade-offs

Proceed without asking for:

- Small, clearly scoped fixes
- Adding inline comments when I ask for it
- Outputting full code after I have approved a diff
