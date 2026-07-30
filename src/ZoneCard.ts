import { html, css, LitElement } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { loadHaComponents } from "@kipk/load-ha-components";
import { customElement, state } from "lit/decorators.js";
import type { HassEntity, HassEntities } from "home-assistant-js-websocket";

import type { HASSDomEvent, HomeAssistant, LovelaceCard, LovelaceCardConfig } from "custom-card-helpers";

import { BackgroundChanged } from "./ZoneBackground";
import { ContextRequestEvent, HaSelectEvent, MiniMediaPlayer } from "./types";

interface ZoneSource {
  entity?: string;
  name: string;
}

export type ZoneCardConfig = LovelaceCardConfig;

@customElement("zone-card")
export class ZoneCard extends LitElement implements LovelaceCard {
  @state() private _backgroundColor?: string = undefined;

  @state() private _foregroundColor?: string = undefined;

  @state() private _foregroundLightColor?: string = undefined;

  @state() private _source?: ZoneSource = undefined;

  @state() private _sourceState?: HassEntity = undefined;

  @state() private zones: Array<string> = [];

  @state() private config!: ZoneCardConfig;

  @state() private _unsubscribe?: () => void;

  @state() _hass?: HomeAssistant;

  getCardSize(): number | Promise<number> {
    return 1;
  }

  public get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  public set hass(hass: HomeAssistant) {
    if (hass) {
      this._hass = hass;
      if (this.shadowRoot) {
        const mediaPlayer = this.shadowRoot.querySelector("mini-media-player") as MiniMediaPlayer;
        if (mediaPlayer && this._source?.entity) {
          // console.log("media player", mediaPlayer, "this", this, "hass", this.hass);
          try {
            mediaPlayer.hass = this.hass;
          } catch {
            console.warn("Failed to set hass on min-media-player");
          }
        }
      }
    }
  }

  public async connectedCallback() {
    super.connectedCallback();
    await loadHaComponents(["ha-control-select-menu", "state-badge"]);

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

  public disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = undefined;
    }
  }

  public setConfig(config: ZoneCardConfig) {
    if (!config.zones) {
      throw new Error("Zone entities must be specified");
    }
    const { media_player_options, ...main_config } = config;
    const { hide, ...media_player } = media_player_options;
    this.config = {
      media_player_options: {
        type: "custom:mini-media-player",
        group: true,
        icon: "mdi:music-circle",
        hide: {
          icon: true,
          source: true,
          volume: true,
          power: false,
          power_state: false,
          info: false,
          name: true,
          play_pause: true,
          play_stop: false,
          ...hide,
        },
        ...media_player,
      },
      ...main_config,
    };

    if (config.sources) {
      [this._source] = config.sources;
    }

    this.zones = [];
    for (let i = 0; i < config.zones.length; i += 1) {
      this.zones.push(config.zones[i]);
    }
  }

  private handleBackgroundChanged(event: CustomEvent<BackgroundChanged>) {
    this._backgroundColor = event.detail.backgroundColor;
    this._foregroundColor = event.detail.foregroundColor;
    this._foregroundLightColor = event.detail.foregroundLightColor;
    this.requestUpdate();
  }

  private handleSourceChanged(event: HASSDomEvent<HaSelectEvent>) {
    if (event) {
      const item = event.detail.item;
      this._source = this.config.sources[item.value];
      if (this._source?.entity) {
        this._sourceState = this.hass?.states[this._source.entity];
      } else {
        this._sourceState = undefined;
      }
    }
  }

  private updateStates(states: HassEntities, unsubscribe: () => void) {
    // Store the unsubscribe function so we can call it when the card is removed from the DOM
    this._unsubscribe = unsubscribe;
    let newSourceState = undefined;
    if (this._source && this._source.entity) {
      newSourceState = states[this._source.entity];
    }

    if (this._sourceState !== newSourceState) {
      this._sourceState = newSourceState;
    }
  }

  public render() {
    const haCardStyle = {
      color: this._foregroundColor,
      "--primary-text-color": this._foregroundColor,
      "--secondary-text-color": this._foregroundLightColor,
    };

    let state = "off";
    for (let i = 0; i < this.zones.length; i += 1) {
      const zoneState = this.hass?.states[this.zones[i]];
      if (zoneState && zoneState.attributes.source === this._source?.name && zoneState.state === "on") {
        state = "on";
      }
    }

    const sources = [];
    let selectedValue = null;
    for (let i = 0; i < this.config.sources.length; i += 1) {
      sources.push({
        value: i,
        label: this.config.sources[i].name,
      });
      if (this._source === this.config.sources[i]) {
        selectedValue = i;
      }
    }
    let mediaPlayer = null;
    if (this._source?.entity && this._sourceState !== null) {
      const config = {
        entity: this._source?.entity,
        ...this.config.media_player_options,
      };
      mediaPlayer = document.createElement("mini-media-player") as MiniMediaPlayer;
      if (mediaPlayer.setConfig) {
        mediaPlayer.setConfig(config);
        mediaPlayer.hass = this.hass;
      }
    }

    return html`
      <ha-card>
        <zone-background
          .hass=${this.hass}
          .controllerSource=${this._source?.entity}
          .controllerSourceState=${this._sourceState}
          .state=${state}
          @background-changed=${this.handleBackgroundChanged}
        ></zone-background>
        <div class="cardContent" style="${styleMap(haCardStyle)}">
          <div id="source-selection">
            <state-badge
              .hass=${this.hass}
              .stateObj=${this._sourceState}
              .overrideIcon=${"mdi:menu"}
              icon
            ></state-badge>
            <ha-control-select-menu
              .label="source"
              .value=${selectedValue}
              .options=${sources}
              @wa-select=${this.handleSourceChanged}
            ></ha-control-select-menu>
            <ha-icon class="source-input" icon="hass:login-variant"></ha-icon>
          </div>
          <div class="source-player">${mediaPlayer !== null ? mediaPlayer : ""}</div>
          ${this.zones.map(
            (zone) => html`
              <zone-control .hass=${this.hass} .entity=${zone} .controllerSource=${this._source?.name}></zone-control>
            `,
          )}
        </div>
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        color: var(--primary-text-color);
      }

      ha-icon.source-input {
        padding: 0 12px;
      }

      ha-card {
        overflow: hidden;
        height: 100%;
      }

      #source-selection {
        display: flex;
        align-items: center;
        padding: 10px 0 0 0;
      }

      ha-control-select-menu {
        width: 100%;
      }

      .source-player {
        min-height: 120px;
      }
    `;
  }
}
