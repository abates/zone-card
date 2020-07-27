import { html, css, LitElement } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map';

export class ZoneControl extends LitElement {
  static get properties() {
    return {
      entity: { type: String },
      active: { type: Boolean },
      hideName: { type: Boolean },
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
    `;
  }

  updated(changedProperties) {
    if (changedProperties.has('hass') && this.hass) {
      this.state = this.hass.states[this.entity];

      if (this.state) {
        this.name = this.state.attributes.friendly_name || this.entity;
        this.volume = this.state.attributes.volume_level;
        this.source = this.state.attributes.source;
      }
    }
  }

  get active() {
    return (
      this.source === this.controllerSource &&
      this.state &&
      this.state.state === 'on'
    );
  }

  turnOn() {
    if (this.state) {
      if (this.state.state === 'off') {
        this.hass.callService('media_player', 'turn_on', {
          entity_id: this.entity,
        });

        this.hass.callService('media_player', 'volume_set', {
          entity_id: this.entity,
          volume_level: 0.3,
        });
      }

      this.hass.callService('media_player', 'select_source', {
        entity_id: this.entity,
        source: this.controllerSource,
      });
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
    return html`
      ${this.hideName ? '' : html`<div class="label">${this.name}</div>`}
      <ha-icon-button
        class="${classMap({ hidden: !this.active })}"
        icon="hass:volume-medium"
        @click=${this.decreaseVolume}
      ></ha-icon-button>
      <ha-paper-slider
        class="${classMap({ hidden: !this.active })}"
        value=${this.volume * 100}
        @change=${this.setVolume}
      ></ha-paper-slider>
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
