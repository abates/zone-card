import { html, css, LitElement } from 'lit-element';
import { styleMap } from 'lit-html/directives/style-map';

export class ZoneCard extends LitElement {
  static get properties() {
    return {
      entities: [],
      backgroundUrl: { type: String },
      hass: { type: Object },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        color: var(--zone-card-text-color, #000);
        --mini-media-player-button-color: rgba(255, 255, 255, 0.7);
      }

      ha-card {
        display: flex;
        flex-direction: column;
      }

      ha-card div {
        padding: 0 16px 16px;
      }

      .transparent {
        background-color: rgba(255, 255, 255, 0.7);
      }
    `;
  }

  constructor() {
    super();
    this.entities = [];
  }

  setConfig(config) {
    if (!config.controller) {
      throw new Error('You need to define an controller');
    }

    if (!config.zones) {
      throw new Error('Zone entities must be specified');
    }

    this.config = {
      ...config,
      options: {
        ...config.options,
        group: true,
        icon: 'mdi:music-circle',
        hide: {
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

    this.config.zone_options = config.zone_options || {};

    const zoneOptions = {
      group: true,
      ...this.config.zone_options,
      hide: {
        controls: true,
        info: true,
        power: false,
        power_state: true,
        source: true,
        ...this.config.zone_options.hide,
      },
    };
    this.config.zone_options = zoneOptions;

    this.zones = [];
    for (let i = 0; i < config.zones.length; i += 1) {
      this.zones.push(document.createElement('mini-media-player'));
      this.zones[i].setConfig({
        entity: config.zones[i],
        ...zoneOptions,
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getCardSize() {
    return 2;
  }

  firstUpdated() {
    this.controller = this.shadowRoot.getElementById('controller');
    this.controller.setConfig(this.controllerConfig);
  }

  updated(changedProperties) {
    const entities = [];
    if (changedProperties.has('hass') && this.hass) {
      this.state = this.hass.states[this.config.controller];
      this.source = this.state.attributes.source;
      this.controller.hass = this.hass;

      if (this.state) {
        if (this.sourceConfig !== this.sources[this.source]) {
          this.sourceConfig = this.sources[this.source];
          if (this.sourceConfig) {
            this.sourcePlayer = document.createElement('mini-media-player');
            this.sourcePlayer.setConfig(this.sourceConfig);
          } else {
            this.sourcePlayer = undefined;
          }
        }
      } else {
        this.sourcePlayer = undefined;
      }

      if (this.sourcePlayer) {
        this.sourceState = this.hass.states[this.sourceConfig.entity];
        entities.push(this.sourcePlayer);
      } else {
        this.sourceState = undefined;
      }

      if (this.sourceState) {
        this.backgroundUrl = this.sourceState.attributes.entity_picture;
      } else {
        this.backgroundUrl = undefined;
      }

      for (let i = 0; i < this.zones.length; i += 1) {
        if (
          this.hass.states[this.config.zones[i]] &&
          this.hass.states[this.config.zones[i]].attributes.source ===
            this.source
        ) {
          entities.push(this.zones[i]);
        }
      }

      for (let i = 0; i < entities.length; i += 1) {
        entities[i].hass = this.hass;
      }
      this.entities = entities;
    }
  }

  renderEntities() {
    const content = this.entities.map(entity => html`<div>${entity}</div>`);
    return html`${content}`;
  }

  cardStyle() {
    if (this.backgroundUrl) {
      return {
        backgroundImage: `url(${this.backgroundUrl})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: '100%',
      };
    }
    return {};
  }

  contentClasses() {
    const classes = ['card-content'];
    if (this.backgroundUrl) {
      classes.push('transparent');
    }

    return classes.join(' ');
  }

  render() {
    return html`
      <ha-card style="${styleMap(this.cardStyle())}">
        <div class="${this.contentClasses()}">
          <div>
            <!-- zone controller -->
            <mini-media-player id="controller"></mini-media-player>
          </div>
          ${this.renderEntities()}
        </div>
      </ha-card>
    `;
  }
}