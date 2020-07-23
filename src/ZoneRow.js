import { html, css, LitElement } from 'lit-element';

export class ZoneRow extends LitElement {
  static get properties() {
    return {
      active: { type: Boolean },
      source: { type: String },
      hass: { type: Object },
      config: { type: Object },
    };
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        color: var(--zone-card-text-color, #000);
      }

      zone-toggle {
        align-self: center;
      }

      mini-media-player {
        flex: 1;
      }
    `;
  }

  firstUpdated() {
    this.player = this.shadowRoot.getElementById('player');
  }

  updated(changedProperties) {
    if (changedProperties.has('config') && this.config) {
      this.player.setConfig(this.config);
    }

    if (changedProperties.has('hass') && this.hass) {
      this.state = this.hass.states[this.config.entity];

      if (this.config) {
        this.player.hass = this.hass;
      }
    }

    if (this.source && this.state) {
      if (
        this.state.attributes.source === this.source &&
        this.state.state === 'on'
      ) {
        console.log('checking the box');
        this.active = true;
      }
    }
  }

  turnOn() {
    if (this.state) {
      this.oldSource = this.state.attributes.source;
      this.oldState = this.state.state;
      this.oldVolume = this.state.attributes.volume_level;
      console.log('Old state', this.state);
      if (this.state.state === 'off') {
        this.hass.callService('media_player', 'turn_on', {
          entity_id: this.config.entity,
        });
        this.hass.callService('media_player', 'volume_set', {
          entity_id: this.config.entity,
          volume: '0.3',
        });
      }
      this.hass.callService('media_player', 'select_source', {
        entity_id: this.config.entity,
        source: this.source,
      });
    }
  }

  turnOff() {
    if (this.oldSource) {
      this.hass.callService('media_player', 'select_source', {
        entity_id: this.config.entity,
        source: this.source,
      });
      this.oldSource = undefined;
    }

    if (this.oldVolume) {
      this.hass.callService('media_player', 'volume_set', {
        entity_id: this.config.entity,
        volume: this.oldVolume,
      });
      this.oldVolume = undefined;
    }

    if (this.oldState === 'off') {
      this.hass.callService('media_player', 'turn_off', {
        entity_id: this.config.entity,
      });
      this.oldState = undefined;
    }
  }

  render() {
    return html`
      <zone-toggle
        .on="${this.active}"
        @zone-on="${this.turnOn}"
        @zone-off="${this.turnOff}"
      ></zone-toggle>
      <mini-media-player id="player"></mini-media-player>
    `;
  }
}
