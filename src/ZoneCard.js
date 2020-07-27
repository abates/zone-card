import { html, css, LitElement } from 'lit-element';
import { styleMap } from 'lit-html/directives/style-map';

export class ZoneCard extends LitElement {
  static get properties() {
    return {
      entity: { type: String },
      source: { type: String },
      sourceList: { type: Array },
      sourcePlayer: { type: Object },
      backgroundColor: { type: String },
      foregroundColor: { type: String },
      hass: { type: Object },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        color: var(--zone-card-text-color, #000);
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
    this.sourceList = [];
    this.backgroundColor = 'rgb(255,255,255,1.0)';
  }

  setConfig(config) {
    if (!config.controller) {
      throw new Error('You need to define an controller');
    }

    if (!config.zones) {
      throw new Error('Zone entities must be specified');
    }

    this.entity = config.controller;

    this.config = {
      ...config,
      options: {
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

    this.controllerConfig = {
      entity: this.config.controller,
      ...this.config.options,
    };

    this.sources = {};
    if (config.sources) {
      for (let i = 0; i < config.sources.length; i += 1) {
        this.sources[config.sources[i].name] = config.sources[i].options;
      }
    }

    this.zones = [];
    for (let i = 0; i < config.zones.length; i += 1) {
      this.zones.push(document.createElement('zone-control'));
      this.zones[i].entity = config.zones[i];
    }
  }

  firstUpdated() {
    this.controller = this.shadowRoot.getElementById('controller');
    this.background = this.shadowRoot.getElementById('background');
  }

  updated(changedProperties) {
    if (changedProperties.has('hass') && this.hass) {
      this.state = this.hass.states[this.config.controller];
      if (this.state) {
        this.name = this.state.attributes.friendly_name || this.entity;
        this.source = this.state.attributes.source;
        this.sourceList = this.state.attributes.source_list;

        if (this.sourceConfig !== this.sources[this.source]) {
          this.sourceConfig = this.sources[this.source];
          if (this.sourceConfig) {
            this.sourcePlayer = document.createElement('mini-media-player');
            this.sourcePlayer.setConfig(this.sourceConfig);
            this.sourceEntity = this.sourceConfig.entity;
          } else {
            this.sourcePlayer = undefined;
          }
        }
      } else {
        this.sourcePlayer = undefined;
      }

      if (this.sourcePlayer) {
        this.sourcePlayer.hass = this.hass;
        this.sourceState = this.hass.states[this.sourceConfig.entity];
        if (
          this.sourceState &&
          this._backgroundSrc !== this.sourceState.attributes.entity_picture
        ) {
          this._backgroundSrc = this.hass.hassUrl(
            this.sourceState.attributes.entity_picture
          );
        }
      } else {
        this.sourceState = undefined;
      }

      this.controller.hass = this.hass;

      for (let i = 0; i < this.zones.length; i += 1) {
        this.zones[i].hass = this.hass;
        this.zones[i].controllerSource = this.source;
      }
    }
  }

  handleSourceChanged(ev) {
    const source = ev.detail.value;
    if (this.source !== source) {
      this.source = source;
      this.hass.callService('media_player', 'select_source', {
        entity_id: this.entity,
        source: this.source,
      });
    }
  }

  _backgroundChanged(ev) {
    this.backgroundColor = ev.detail.backgroundColor;
    this.foregroundColor = ev.detail.foregroundColor;
  }

  render() {
    const haCardStyle = {
      '--primary-text-color': this.foregroundColor,
      '--secondary-text-color': this.foregroundColor,
      '--ha-card-header-color': this.foregroundColor,
      '--zone-card-text-color': this.foregroundColor,
      '--mini-media-player-button-color': `${this.backgroundColor}b2`,
    };

    return html`
      <zone-background
        id="background"
        src=${this._backgroundSrc ? this._backgroundSrc : ''}
        @background-changed=${this._backgroundChanged}
      >
        <ha-card header="${this.name}" style="${styleMap(haCardStyle)}">
          <div class="cardContent">
            <!-- zone controller -->
            <zone-control
              id="controller"
              entity="${this.entity}"
              controllerSource="${this.source}"
              hideName
            ></zone-control>
            <div class="flex right">
              <ha-paper-dropdown-menu
                class="flex source-input"
                dynamic-align=""
                label-float=""
                label=""
                style="--paper-input-container-input-color: ${this
                  .foregroundColor}"
              >
                <paper-listbox
                  slot="dropdown-content"
                  attr-for-selected="item-name"
                  selected="${this.source}"
                  @selected-changed="${this.handleSourceChanged}"
                >
                  ${this.sourceList.map(
                    source =>
                      html`<paper-item item-name="${source}"
                        >${source}</paper-item
                      >`
                  )}
                </paper-listbox>
              </ha-paper-dropdown-menu>
              <ha-icon class="source-input" icon="hass:login-variant"></ha-icon>
            </div>
            <div class="source-player">
              ${this.sourcePlayer ? html`${this.sourcePlayer}` : ''}
            </div>
            ${this.zones.map(zone => html`${zone}`)}
          </div>
        </ha-card>
      </zone-background>
    `;
  }
}
