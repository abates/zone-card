# Zone Card

[![hacs][hacs-badge]][hacs-url]
[![GitHub Release][release-badge]][release-url]
[![License][license-badge]](LICENSE)

A custom [Home Assistant][home-assistant] Lovelace card for managing the **source
selection and volume of a group of media players** (zones) against a set of
source media players.

Pick a source from the dropdown and the card shows every zone that is currently
playing it. Activating a zone (optionally) powers it on and switches it to the
selected source. The card background is painted with the selected source's media
artwork — with colors extracted from the artwork — and falls back to the
theme's primary color when no artwork is available.

<!--
  Add a screenshot to make this README shine, e.g.:
  ![Zone Card screenshot](docs/screenshot.png)
-->

## Features

- Select a shared source and see, at a glance, which zones are playing it.
- Activate a zone to power it on, set a starting volume, and switch it to the
  current source in one tap.
- Per-zone power and volume controls.
- Dynamic background and accent colors derived from the source's album artwork.
- Embeds a [`mini-media-player`](https://github.com/kalkih/mini-media-player)
  for the active source so you keep full transport controls.

## Prerequisites

This card renders a `mini-media-player` element for the selected source, so the
[**Mini Media Player**][mini-media-player] card **must be installed** (it is
available in HACS). Install it before adding Zone Card.

## Installation

### HACS (recommended)

1. Make sure [HACS][hacs-url] is installed.
2. In HACS, open the menu (⋮) → **Custom repositories**.
3. Add `https://github.com/abates/zone-card` with category **Dashboard**.
4. Search for **Zone Card** and install it.
5. HACS adds the Lovelace resource automatically. Reload your browser.

### Manual

1. Download `zone-card.js` from the [latest release][release-url].
2. Copy it into your Home Assistant `config/www/` directory.
3. Add the resource under **Settings → Dashboards → ⋮ → Resources**:
   - URL: `/local/zone-card.js`
   - Resource type: **JavaScript Module**
4. Install [Mini Media Player][mini-media-player] if you haven't already.

## Configuration

The card is configured via YAML. It has no visual editor.

| Option                 | Type   | Required | Description                                                                                                   |
| ---------------------- | ------ | :------: | ------------------------------------------------------------------------------------------------------------- |
| `type`                 | string |   yes    | `custom:zone-card`                                                                                             |
| `zones`                | list   |   yes    | List of `media_player` entity IDs to control as zones.                                                        |
| `sources`              | list   |   yes    | List of selectable sources (see [Sources](#sources)). The first source is selected by default.                |
| `media_player_options` | map    |   yes    | Options passed through to the embedded `mini-media-player` for the active source (see [below](#media_player_options)). |

### Sources

Each entry in `sources` describes a selectable source:

| Option   | Type   | Required | Description                                                                                                                    |
| -------- | ------ | :------: | ------------------------------------------------------------------------------------------------------------------------------ |
| `name`   | string |   yes    | The source name. This must match the `source` value the zone media players report when playing this source.                    |
| `entity` | string |    no    | A `media_player` entity that backs this source. When set, its artwork drives the card background and a mini media player is shown. Omit for passive sources such as a physical Bluetooth or line input. |

### media_player_options

`media_player_options` is forwarded to the embedded
[`mini-media-player`](https://github.com/kalkih/mini-media-player#options); the
`entity` is supplied automatically from the selected source. The card applies
sensible defaults that you can override:

```yaml
media_player_options:
  type: custom:mini-media-player
  group: true
  icon: mdi:music-circle
  hide:
    icon: true
    source: true
    volume: true
    power: false
    power_state: false
    info: false
    name: true
    play_pause: true
    play_stop: false
```

## Example

```yaml
type: custom:zone-card
media_player_options:
  icon: mdi:music-circle
  shortcuts:
    columns: 4
    buttons:
      - id: pandora:station:4531417280166204988
        name: Country
        type: playlist
      - id: script.seasonal_music
        name: Seasonal
        type: script
        data: {}
sources:
  - name: Music Player
    entity: media_player.plex
  - name: Kitchen Bluetooth
  - name: Cable
zones:
  - media_player.kitchen
  - media_player.dining_room
  - media_player.living_room
  - media_player.master_bedroom
```

## How it works

- The **source dropdown** lists every entry in `sources`. Selecting one that has
  an `entity` shows its `mini-media-player` and paints the background from its
  artwork.
- A **zone is considered active** for the selected source when its reported
  `source` attribute equals the source `name` and its state is `on`.
- Tapping a zone's power button:
  - if the zone is **off**, turns it on, sets volume to 30%, and selects the
    current source;
  - if the zone is **on** with a different source, switches it to the current
    source;
  - if the zone is already **active**, turns it off.
- Each active zone exposes volume up/down and a volume slider.

## Development

```bash
npm install      # install dependencies
npm run lint     # ESLint (includes Prettier formatting checks)
npm run format   # auto-fix lint/formatting
npm run build    # bundle to dist/zone-card.js
npm run watch    # rebuild on change and serve dist/ on :5000
```

The source lives in `src/` (TypeScript + [Lit][lit]) and is bundled with Rollup
into `dist/zone-card.js`.

### Releasing

Releases are automated by [`.github/workflows/release.yml`](.github/workflows/release.yml):

1. Bump the `version` in `package.json`.
2. Commit, then push a matching tag (the workflow fails if they differ):
   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```
3. The workflow builds the card and attaches `zone-card.js` to a new GitHub
   Release, which HACS then serves to users.

## License

[MIT](LICENSE)

<!-- Badges -->
[hacs-badge]: https://img.shields.io/badge/HACS-Custom-41BDF5.svg
[hacs-url]: https://hacs.xyz/
[release-badge]: https://img.shields.io/github/v/release/abates/zone-card
[release-url]: https://github.com/abates/zone-card/releases
[license-badge]: https://img.shields.io/github/license/abates/zone-card

<!-- Links -->
[home-assistant]: https://www.home-assistant.io/
[mini-media-player]: https://github.com/kalkih/mini-media-player
[lit]: https://lit.dev/
