import { html, css, LitElement } from 'lit';
import { classMap } from 'lit-html/directives/class-map.js';

export class ZoneControl extends LitElement {
  static get properties() {
    return {
      entity: { type: String },
      hass: { type: Object },
      controllerSource: { type: String },
      volume: { type: Number },
    };
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: row;
        align-items: center;
        color: var(--zone-card-text-color, #000);
      }

      zone-toggle {
      }

      .label {
        width: 120px;
        white-space: nowrap;
        overflow: hidden;
      }

      ha-paper-slider {
        flex: 1;
      }

      .hidden {
        visibility: hidden;
      }

      ha-icon-button {
        color: var(--zone-card-text-color, var(--primary-text-color));
        transition: color 0.25s;
      }

      ha-icon-button[color] {
        color: var(--accent-color) !important;
        opacity: 1 !important;
      }

      ha-slider {
        --paper-slider-active-color: var(--zone-card-text-color, #000);
        --paper-slider-knob-color: var(--zone-card-text-color, #000);
        --paper-slider-container-color: var(
          --zone-card-light-text-color,
          #ffffff80
        );
      }
    `;
  }

  get active() {
    if (!this.controllerSource) {
      return false;
    }

    return (
      this._source === this.controllerSource &&
      this._state &&
      this._state.state === 'on'
    );
  }

  turnOn() {
    if (this._state) {
      if (this._state.state === 'off') {
        this.hass
          .callService('media_player', 'turn_on', {
            entity_id: this.entity,
          })
          .then(() =>
            this.hass.callService('media_player', 'volume_set', {
              entity_id: this.entity,
              volume_level: 0.3,
            })
          )
          .then(() =>
            this.hass.callService('media_player', 'select_source', {
              entity_id: this.entity,
              source: this.controllerSource,
            })
          );
      } else {
        this.hass.callService('media_player', 'select_source', {
          entity_id: this.entity,
          source: this.controllerSource,
        });
      }
    }
  }

  turnOff() {
    this.hass.callService('media_player', 'turn_off', {
      entity_id: this.entity,
    });
  }

  setVolume(ev) {
    const volume = parseFloat(ev.target.value) / 100;
    this.hass.callService('media_player', 'volume_set', {
      entity_id: this.entity,
      volume_level: volume,
    });
  }

  increaseVolume() {
    this.hass.callService('media_player', 'volume_up', {
      entity_id: this.entity,
    });
  }

  decreaseVolume() {
    this.hass.callService('media_player', 'volume_down', {
      entity_id: this.entity,
    });
  }

  handlePowerClick() {
    if (this.active) {
      this.turnOff();
    } else {
      this.turnOn();
    }
  }

  render() {
    if (this.hass) {
      this._state = this.hass.states[this.entity];

      if (this._state) {
        this._name = this._state.attributes.friendly_name || this.entity;
        this._volume = this._state.attributes.volume_level;
        this._source = this._state.attributes.source;
      }
    }

    return html`
      <div class="label">${this._name}</div>
      <ha-icon-button
        class="${classMap({ hidden: !this.active })}"
        icon="hass:volume-medium"
        @click=${this.decreaseVolume}
      ></ha-icon-button>
      <ha-slider
        class="${classMap({ hidden: !this.active })}"
        value=${this._volume * 100}
        @change=${this.setVolume}
      ></ha-slider>
      <ha-icon-button
        class="${classMap({ hidden: !this.active })}"
        icon="hass:volume-high"
        @click=${this.increaseVolume}
      ></ha-icon-button>
      <ha-icon-button
        ?color="${this.active}"
        icon="hass:power"
        @click=${this.handlePowerClick}
      ></ha-icon-button>
    `;
  }
}
