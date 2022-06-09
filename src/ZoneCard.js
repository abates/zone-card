import { html, css, LitElement } from 'lit';
import { styleMap } from 'lit-html/directives/style-map.js';

export class ZoneCard extends LitElement {
  static get properties() {
    return {
      backgroundColor: { type: String },
      foregroundColor: { type: String },
      foregroundLightColor: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        color: var(--zone-card-text-color, #000);
      }

      select {
        border: none;
        color: var(--zone-card-text-color, #000);
        background-color: transparent;
      }

      select:focus {
        outline: none;
      }

      ha-icon.source-input {
        margin-top: 17px;
        padding: 12px;
      }

      ha-card {
        display: flex;
        flex-direction: column;
        background-color: transparent;
      }

      ha-card div {
        padding: 0 16px 0px;
      }

      .flex {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 0;
      }

      .right {
        justify-content: flex-end;
      }

      .source-player {
        min-height: 120px;
      }

      .transparent {
        background-color: rgba(255, 255, 255, 0.7);
      }
    `;
  }

  constructor() {
    super();
    this._sourceList = [];
    this.backgroundColor = 'rgb(255,255,255,1.0)';
  }

  setConfig(config) {
    if (!config.zones) {
      throw new Error('Zone entities must be specified');
    }

    this.config = {
      ...config,
      options: {
        type: 'custom:mini-media-player',
        group: true,
        icon: 'mdi:music-circle',
        ...config.options,
        hide: {
          power_state: false,
          controls: true,
          info: false,
          name: true,
          next: true,
          play_pause: true,
          prev: true,
          ...(config.options ? config.options.hide : {}),
        },
      },
    };

    this._sources = [];
    if (config.sources) {
      this._sources = config.sources;
    }

    this.zones = [];
    for (let i = 0; i < config.zones.length; i += 1) {
      this.zones.push(document.createElement('zone-control'));
      this.zones[this.zones.length - 1].entity = config.zones[i];
    }
  }

  firstUpdated() {
    this.background = this.shadowRoot.getElementById('background');
    this.sourceSelect = this.shadowRoot.getElementById('source');
    this.handleSourceChanged();
  }

  set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;
    if (this._hass) {
      if (this._sourcePlayer) {
        this._sourcePlayer.hass = this._hass;
        this._sourceState = this._hass.states[this._sourceConfig.entity];
        if (
          this._sourceState &&
          this._backgroundSrc !== this._sourceState.attributes.entity_picture
        ) {
          this._backgroundSrc = this._hass.hassUrl(
            this._sourceState.attributes.entity_picture
          );
        }
      } else {
        this._backgroundSrc = undefined;
        this._sourceState = undefined;
      }
    }
    this.requestUpdate('hass', oldHass);
  }

  updated(changedProperties) {
    if (changedProperties.has('hass') && this.hass) {
      for (let i = 0; i < this.zones.length; i += 1) {
        this.zones[i].hass = this._hass;
      }
    }
  }

  get hass() {
    return this._hass;
  }

  handleSourceChanged() {
    const source = this._sources[this.sourceSelect.selectedIndex];
    if (this._source !== source) {
      this._source = source;
      for (let i = 0; i < this.zones.length; i += 1) {
        this.zones[i].controllerSource = this._source.name;
      }

      if (this._source.options !== undefined) {
        this._sourceConfig = this._source.options;
        this._sourcePlayer = document.createElement('mini-media-player');
        this._sourcePlayer.setConfig(this._sourceConfig);
        this._sourcePlayer.hass = this._hass;
      } else {
        this._sourceConfig = undefined;
        this._sourcePlayer = undefined;
        this._backgroundSrc = undefined;
      }

      // Update the UI since the source has changed
      this.requestUpdate();
    }
  }

  _backgroundChanged(ev) {
    this.backgroundColor = ev.detail.backgroundColor;
    this.foregroundColor = ev.detail.foregroundColor;
    this.foregroundLightColor = ev.detail.foregroundLightColor;
    this.requestUpdate();
  }

  render() {
    const haCardStyle = {
      '--primary-text-color': this.foregroundColor,
      '--secondary-text-color': this.foregroundColor,
      '--ha-card-header-color': this.foregroundColor,
      '--zone-card-text-color': this.foregroundColor,
      '--zone-card-light-text-color': this.foregroundLightColor,
      '--mini-media-player-button-color': `${this.backgroundColor}`,
    };

    return html`
      <zone-background
        id="background"
        src=${this._backgroundSrc ? this._backgroundSrc : ''}
        @background-changed=${this._backgroundChanged}
      >
        <ha-card header="" style="${styleMap(haCardStyle)}">
          <div class="cardContent">
            <div class="flex right">
              <select
                id="source"
                @change="${this.handleSourceChanged}"
                @blur="${this.handleSourceChanged}"
              >
                ${this._sources.map(source =>
                  this._source === source
                    ? html`<option value="${source.name}" selected="selected">
                        ${source.name}
                      </option>`
                    : html`<option value="${source.name}">
                        ${source.name}
                      </option>`
                )}
              </select>
              <ha-icon class="source-input" icon="hass:login-variant"></ha-icon>
            </div>
            <div class="source-player">
              ${this._sourcePlayer ? html`${this._sourcePlayer}` : ''}
            </div>
            ${this.zones.map(zone => html`${zone}`)}
          </div>
        </ha-card>
      </zone-background>
    `;
  }
}
