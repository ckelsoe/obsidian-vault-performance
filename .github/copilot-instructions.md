# Copilot instructions for obsidian-vault-performance

## What this repository is

Vault Performance is an Obsidian community plugin that finds what slows a vault down: which plugins block the interface, which notes are heavy or rewritten constantly, how long Obsidian's metadata cache takes to catch up, and how loaded the machine is. Everything is measured locally and stays on the user's device.

## Repository layout

- `main.ts`: plugin entry point. Wiring only (lifecycle, commands, settings tab). No measurement logic.
- `settings-tab.ts`: declarative settings tab (`getSettingDefinitions()`), ending with the mandatory version and links footer.
- Measurement code lives in its own service modules, one per concern, each with pure functions that can be unit-tested.
- `__tests__/`: Jest tests. `__mocks__/obsidian.ts`: runtime stand-in for the types-only `obsidian` package.
- `styles.css`: all styling. No inline `style` attributes.

## Commands

- `npm run build`: type-check and bundle.
- `npm run lint`: ESLint (`eslint-plugin-obsidianmd` recommended, type-aware), Prettier check, submission pre-check, and the marketplace-scan type-check. Must report zero warnings.
- `npm test`: Jest.
- `npm run knip`, `npm run type-coverage` (at least 99%).

## Hard rules

- Never `as any`. Add missing types to `types.d.ts`.
- Never suppress a lint rule: no inline `eslint-disable`, no config-level `off`, no per-file override. Fix the code.
- Sentence case for every UI string.
- Node built-ins (`os`, `process`) are reached with `require()` at call time, never a top-level import, and only on desktop. The plugin is desktop only.
- Measuring must cost nothing while it is off: no observers, listeners, or timers registered until the user starts a session.
- Every observer and timer, event listeners included, has an owner that removes it when the session stops or the plugin unloads.
- No network code of any kind. Reports are written locally or copied to the clipboard by the user.
- Never write a log or report as a Markdown note while a session runs: a note is re-parsed by the metadata cache on every write and would distort the measurement. Use a plain file in the plugin folder.
- No em dashes in prose, comments, or UI strings.

## Tests

- Every assertion must be able to fail. Assert produced output, not only flags.
- A test double for a Promise-returning method that awaits nothing runs its body inside `new Promise((resolve) => { ... })` (or an `asyncResult` helper), so a throw rejects like the real async method.

## CI and releases

- CI runs type-check, lint, test, build, OSV-Scanner, and Dependency Review on every PR. The required check is `check`.
- Releases are created only by pushing a version tag. The release workflow builds the artifacts and attests them. Never create a release by hand.
