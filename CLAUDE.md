# CLAUDE.md

Guidance for working in this repository.

## What this is

`zone-card` is a custom [Home Assistant](https://www.home-assistant.io/) Lovelace
card (`custom:zone-card`) distributed through [HACS](https://hacs.xyz/) as a
Dashboard/plugin. It manages source selection and per-zone volume across a group
of `media_player` entities. It is written in TypeScript with [Lit](https://lit.dev/)
and bundled with Rollup into a single ES module, `dist/zone-card.js`, which is the
artifact HACS installs.

## Commands

```bash
npm install      # install dependencies
npm run lint     # ESLint (flat config; Prettier runs as a lint rule)
npm run format   # eslint --fix
npm run build    # rollup -c  ->  dist/zone-card.js
npm run watch    # rebuild on change and serve dist/ on :5000
```

There is currently no automated test suite. `test/` holds a Home Assistant
configuration and Lovelace dashboard used for manual/integration testing inside
the `.devcontainer`, not unit tests.

## Architecture

The bundle entry point is `src/zone-card.ts`, which registers three custom
elements defined in:

- **`src/ZoneCard.ts`** — the top-level `<zone-card>`. Handles `setConfig`, holds
  the selected source, subscribes to entity states via a `context-request`
  event, renders the source dropdown and the embedded `mini-media-player`, and
  composes `<zone-background>` + one `<zone-control>` per zone.
- **`src/ZoneControl.ts`** — `<zone-control>`, a single zone row: power toggle
  and volume controls. Calls `media_player` services (`turn_on`, `turn_off`,
  `select_source`, `volume_set`/`volume_up`/`volume_down`). Activating an off
  zone turns it on, sets volume to 0.3, then selects the current source.
- **`src/ZoneBackground.ts`** — `<zone-background>`, extracts a color palette
  from the source's artwork with `node-vibrant` and emits a `background-changed`
  event; `ZoneCard` maps those colors onto CSS custom properties.
- **`src/types.ts`** — shared interfaces (`ContextRequestEvent`, `HaSelectEvent`,
  `MiniMediaPlayer`, etc.).

### Key external dependencies

- **`custom:mini-media-player`** is a hard *runtime* dependency: `ZoneCard`
  creates a `mini-media-player` element and expects it to already be registered
  in the browser. It is not bundled. Keep the README prerequisite in sync.
- `custom-card-helpers` / `home-assistant-js-websocket` provide HA types.
- `@kipk/load-ha-components` loads built-in HA elements (`ha-control-select-menu`,
  `state-badge`) at runtime.

## Conventions

- TypeScript, `strict` mode; components use Lit decorators (`@customElement`,
  `@property`, `@state`).
- Formatting is enforced by ESLint via `eslint-plugin-prettier` with
  `printWidth: 120` — run `npm run format` rather than invoking Prettier directly
  (there is no standalone Prettier config, so the CLI would use the wrong width).
- Config files (`rollup.config.js`, `eslint.config.js`) are ES modules;
  `package.json` sets `"type": "module"`.

## Releasing

Version is kept in sync between `package.json` and the git tag.

1. Bump `version` in `package.json`.
2. Push a `v<version>` tag (e.g. `v0.2.0`).
3. `.github/workflows/release.yml` verifies the tag matches `package.json`,
   lints, builds, and attaches `dist/zone-card.js` to a GitHub Release. HACS
   serves that asset (`filename` in `hacs.json` is `zone-card.js`).

`.github/workflows/validate.yml` runs lint + build and the HACS validation
action on pushes/PRs.

## When making changes

- After editing `src/`, run `npm run lint` and `npm run build` to confirm the
  bundle still compiles.
- If you change the config schema in `ZoneCard.setConfig`, update the
  Configuration section of `README.md`.
- If you add/remove a runtime dependency on another HACS card, update both this
  file and the README Prerequisites.
