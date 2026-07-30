import type { HomeAssistant } from "custom-card-helpers";
import type { HassEntities } from "home-assistant-js-websocket";
import { html, css, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import type WaSlider from "@awesome.me/webawesome/dist/components/slider/slider.js";
import { ContextRequestEvent } from "./types";

@customElement("zone-control")
export class ZoneControl extends LitElement {
  @property({ type: String }) entity?: string;
  @property({ type: Object }) hass?: HomeAssistant;
  @property({ type: String }) controllerSource?: string;

  @state() private _name?: string;
  @state() private _volume: number = 0;
  @state() private _source?: string;
  @state() private _unsubscribe?: () => void;
  @state() private _state?: string;

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      .label {
        position: relative;
        width: 120px;
        white-space: nowrap;
        overflow: hidden;
        text-align: right;
      }

      ha-paper-slider {
        flex: 1;
      }

      .hidden {
        visibility: hidden;
      }

      ha-icon-button {
        transition: color 0.25s;
      }

      ha-slider {
        --ha-slider-thumb-color: var(--primary-text-color);
        --ha-slider-indicator-color: hsl(from var(--primary-text-color) h s calc(l - 12));
      }
    `;
  }

  get active() {
    if (!this.controllerSource) {
      return false;
    }

    return this._source === this.controllerSource && this._state === "on";
  }

  connectedCallback() {
    super.connectedCallback();
    const event = new CustomEvent("context-request", {
      bubbles: true,
      composed: true,
      cancelable: true,
    }) as ContextRequestEvent;

    event.context = "states";
    event.subscribe = true;

    event.callback = (cbEvent, unsubscribe) => this.updateStates(cbEvent, unsubscribe);

    this.dispatchEvent(event);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = undefined;
    }
  }

  private updateStates(states: HassEntities, unsubscribe: () => void) {
    this._unsubscribe = unsubscribe;
    if (this.entity) {
      const state = states[this.entity];
      if (state) {
        this._state = state.state;
        this._name = state.attributes.friendly_name || this.entity;
        this._volume = state.attributes.volume_level;
        this._source = state.attributes.source;
      }
    }
  }

  turnOn() {
    if (this._state) {
      if (this._state === "off") {
        // console.log("Turning on", this.hass, this.entity);
        this.hass
          ?.callService("media_player", "turn_on", {
            entity_id: this.entity,
          })
          .then(() =>
            this.hass?.callService("media_player", "volume_set", {
              entity_id: this.entity,
              volume_level: 0.3,
            }),
          )
          .then(() =>
            this.hass?.callService("media_player", "select_source", {
              entity_id: this.entity,
              source: this.controllerSource,
            }),
          );
      } else {
        this.hass?.callService("media_player", "select_source", {
          entity_id: this.entity,
          source: this.controllerSource,
        });
      }
    }
  }

  turnOff() {
    this.hass?.callService("media_player", "turn_off", {
      entity_id: this.entity,
    });
  }

  setVolume(event: Event) {
    const target = event.target! as WaSlider;
    const volume = target.value / 100;
    this.hass?.callService("media_player", "volume_set", {
      entity_id: this.entity,
      volume_level: volume,
    });
  }

  increaseVolume() {
    this.hass?.callService("media_player", "volume_up", {
      entity_id: this.entity,
    });
  }

  decreaseVolume() {
    this.hass?.callService("media_player", "volume_down", {
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
      <div class="label">${this._name}</div>
      <ha-icon-button class="${classMap({ hidden: !this.active })}" @click=${this.decreaseVolume}
        ><ha-icon icon="hass:volume-medium"></ha-icon
      ></ha-icon-button>
      <ha-slider
        class="${classMap({ hidden: !this.active })}"
        value=${this._volume * 100}
        @change=${this.setVolume}
        size="s"
      ></ha-slider>
      <ha-icon-button class="${classMap({ hidden: !this.active })}" @click=${this.increaseVolume}
        ><ha-icon icon="hass:volume-high"></ha-icon
      ></ha-icon-button>
      <ha-icon-button ?color="${this.active}" @click=${this.handlePowerClick}
        ><ha-icon icon="hass:power"></ha-icon
      ></ha-icon-button>
    `;
  }
}
