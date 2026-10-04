# Vault Performance

[![CI](https://img.shields.io/github/actions/workflow/status/ckelsoe/obsidian-vault-performance/ci.yml?branch=main&label=CI&logo=github)](https://github.com/ckelsoe/obsidian-vault-performance/actions/workflows/ci.yml) [![Release](https://img.shields.io/github/actions/workflow/status/ckelsoe/obsidian-vault-performance/release.yml?label=Release&logo=github)](https://github.com/ckelsoe/obsidian-vault-performance/actions/workflows/release.yml) [![GitHub Downloads](https://img.shields.io/github/downloads/ckelsoe/obsidian-vault-performance/total?logo=github&label=Downloads)](https://github.com/ckelsoe/obsidian-vault-performance/releases) [![GitHub Stars](https://img.shields.io/github/stars/ckelsoe/obsidian-vault-performance?style=flat&logo=github&label=Stars)](https://github.com/ckelsoe/obsidian-vault-performance) [![Obsidian](https://img.shields.io/badge/Obsidian-v1.13.0%2B-7C3AED?logo=obsidian&logoColor=white)](https://obsidian.md) [![License](https://img.shields.io/github/license/ckelsoe/obsidian-vault-performance)](https://github.com/ckelsoe/obsidian-vault-performance/blob/main/LICENSE) [![Latest Release](https://img.shields.io/github/v/release/ckelsoe/obsidian-vault-performance?label=Latest)](https://github.com/ckelsoe/obsidian-vault-performance/releases/latest)

Find what slows your vault down: slow plugins, heavy notes, constant file writes, and indexing delays, measured on your own machine.

Vault Performance is being built in stages. This release takes a snapshot of the vault. Measuring file writes, indexing delays, and plugins that freeze the interface come in later releases.

## Vault snapshot

Run **Vault Performance: Open vault snapshot** from the command palette. A tab opens with:

- How many notes and attachments the vault holds, and their total size.
- Every note at or above the large-note size (1 MB by default). Obsidian's metadata cache parses a note again each time it changes, so a large note that changes often slows the vault.
- The ten largest notes and the ten largest attachments.
- Your enabled community plugins and their versions.

The snapshot reads file sizes Obsidian already knows. It opens no files.

**Copy report** puts the report on the clipboard as Markdown, ready to paste into a bug report or forum post. **Save report as note** saves it as a new note in the vault root.

### Privacy

Note paths can be personal, so copied and saved reports call notes "Note 1", "Note 2" and so on, and attachments "Attachment 1 (.pdf)". The tab itself always shows real paths, since it never leaves your device. To include paths in copied and saved reports, turn on **Include note paths in reports** in the plugin settings.

The plugin has no network code. Nothing is sent anywhere.

## Settings

- **Include note paths in reports**: off by default.
- **Large note size in MB**: notes this size or larger are listed as large. Default 1.

## Installation

### From Obsidian Community Plugins (recommended)

1. Open Obsidian settings.
2. Navigate to **Community plugins**.
3. Click **Browse**.
4. Search for **Vault Performance**.
5. Click **Install**, then **Enable**.

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/ckelsoe/obsidian-vault-performance/releases/latest).
2. Create a folder named `vault-performance` in your vault's `.obsidian/plugins/` directory.
3. Copy the downloaded files into this folder.
4. Reload Obsidian.
5. Enable **Vault Performance** in Settings → Community plugins.

### BRAT (optional, for pre-release testing)

BRAT lets power users install pre-release builds before they reach the marketplace.

1. Install the **BRAT** plugin from Community Plugins.
2. Open BRAT settings and click **Add Beta Plugin**.
3. Enter: `https://github.com/ckelsoe/obsidian-vault-performance`
4. Enable **Vault Performance** in Settings → Community plugins.

## Community

Questions, ideas, and general discussion happen on [Discord](https://discord.gg/gd6tKJDPj4). For anything that needs tracking, a [GitHub issue](https://github.com/ckelsoe/obsidian-vault-performance/issues) is still the better home.

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, quality gates, and conventions.

## License

MIT. See [LICENSE](./LICENSE).
