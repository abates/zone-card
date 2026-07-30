import { html, css, LitElement, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import { Vibrant } from "node-vibrant/browser";

import { debounce } from "custom-card-helpers";
import type { HomeAssistant as _HomeAssistant } from "custom-card-helpers";
import type { HassEntity } from "home-assistant-js-websocket";

export interface BackgroundChanged {
  foregroundColor: string;
  foregroundLightColor: string;
  backgroundColor: string;
}

interface HomeAssistant extends _HomeAssistant {
  hassUrl: (path?: string) => string;
}

async function extractColors(url: string, downsampleColors = 16) {
  return new Vibrant(url, {
    colorCount: downsampleColors,
  })
    .getPalette()
    .then((palette) => palette);
}

@customElement("zone-background")
export class ZoneBackground extends LitElement {
  @property({ type: Object }) hass?: HomeAssistant;
  @property({ type: Object }) controllerSourceState?: HassEntity;
  @property({ type: String }) state?: string;

  @state() private cardHeight?: number;

  private imageURL?: string;
  private foregroundColor?: string;
  private foregroundLightColor?: string;
  private _backgroundColor?: string;
  private resizeObserver?: ResizeObserver;

  @state() private _unsubscribe?: () => void;

  async _setColors() {
    if (this.controllerSourceState) {
      const imageURL =
        this.controllerSourceState.attributes.entity_picture_local ||
        this.controllerSourceState.attributes.entity_picture;
      if (imageURL && this.imageURL !== imageURL) {
        this.imageURL = imageURL;
      }
    } else {
      this.imageURL = undefined;
    }

    if (this.hass && this.imageURL) {
      try {
        const palette = await extractColors(this.hass?.hassUrl(this.imageURL));
        this._backgroundColor = palette.Vibrant?.hex;
        this.foregroundColor = palette.Vibrant?.bodyTextColor;
        this.foregroundLightColor = palette.Vibrant?.titleTextColor;
      } catch (err) {
        console.error("Error getting Image Colors", err);
        this.foregroundColor = undefined;
        this._backgroundColor = undefined;
      }
    } else {
      this.foregroundColor = undefined;
      this._backgroundColor = undefined;
    }

    this.dispatchEvent(
      new CustomEvent("background-changed", {
        detail: {
          foregroundColor: this.foregroundColor,
          foregroundLightColor: this.foregroundLightColor,
          backgroundColor: this._backgroundColor,
        },
      }),
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = undefined;
    }
  }

  static get properties() {
    return {
      entity: { type: String },
      hass: { type: Object },
      controllerSource: { type: String },
      state: { type: String },
      cardWidth: { type: Number },
      cardHeight: { type: Number },
      _imageURL: { type: String },
      _foregroundColor: { type: String },
      _foregroundLightColor: { type: String },
      _backgroundColor: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        width: 100%;
        height: 100%;
      }

      #background {
        display: flex;
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
      }

      .color-block {
        background-color: var(--primary-color);
        transition: background-color 0.8s;
        width: 100%;
      }

      .color-gradient {
        position: absolute;
        background-image: linear-gradient(to right, var(--primary-color), transparent);
        height: 100%;
        right: 0;

        opacity: 1;
        transition:
          width 0.8s,
          opacity 0.8s linear 0.8s;
      }

      .image {
        background-color: var(--primary-color);
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        position: absolute;
        right: 0;
        height: 105%;
        opacity: 0.8;
        transition:
          width 0.8s,
          background-image 0.8s,
          background-color 0.8s,
          background-size 0.8s,
          opacity 0.8s linear 0.8s;
        width: 105%;
        top: -5px;
      }

      .no-image .image {
        opacity: 0;
      }

      .no-img {
        background-color: var(--primary-color);
        background-size: initial;
        background-repeat: no-repeat;
        background-position: center center;
        padding-bottom: 0;
        position: absolute;
        right: 0;
        height: 100%;
        background-image: url("/static/images/card_media_player_bg.png");
        width: 50%;
        transition:
          opacity 0.8s,
          background-color 0.8s;
      }

      .off .image,
      .off .color-gradient {
        opacity: 0;
        transition:
          opacity 0s,
          width 0.8s;
        width: 0;
      }

      .background:not(.off):not(.no-image) .no-img {
        opacity: 0;
      }

      .off.background {
        filter: grayscale(1);
      }
    `;
  }

  constructor() {
    super();
    this._backgroundColor = undefined;
    this.foregroundColor = "#fff";
    this.foregroundLightColor = "#ffffff";
  }

  async _attachObserver() {
    if (!this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(debounce(() => this._measureCard(), 250, false));
    }
    const card = this.shadowRoot?.getElementById("background");
    if (card) {
      this.resizeObserver.observe(card);
    }
  }

  _measureCard() {
    const card = this.shadowRoot?.getElementById("background");
    if (card) {
      this.cardHeight = card.offsetHeight;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => this._attachObserver());
  }

  firstUpdated() {
    this._attachObserver();
  }

  get backgroundColor() {
    return this._backgroundColor;
  }

  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("controllerSourceState") && this.hass) {
      this._setColors();
    }
  }

  render() {
    const imageStyle = {
      "background-image": this.imageURL ? `url(${this.hass?.hassUrl(this.imageURL)})` : "none",
      width: `${this.cardHeight}px`,
      "background-color": this._backgroundColor || "",
    };

    const gradientStyle = {
      "background-image": `linear-gradient(to right, ${this._backgroundColor}, ${this._backgroundColor}00)`,
      width: `${this.cardHeight}px`,
    };

    const hasNoImage = this.imageURL === undefined;

    return html`
      <div id="background" class="background ${classMap({ "no-image": hasNoImage, off: this.state === "off" })}">
        <div class="color-block" style=${styleMap({ "background-color": this._backgroundColor })}></div>
        <div class="image" style=${styleMap(imageStyle)}></div>
        ${hasNoImage ? "" : html` <div class="color-gradient" style=${styleMap(gradientStyle)}></div> `}
      </div>
    `;
  }
}
