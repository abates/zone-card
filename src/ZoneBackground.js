import { html, css, LitElement } from 'lit-element';
import { styleMap } from 'lit-html/directives/style-map';

function debounce(func, wait, immediate) {
  let timeout;

  return function executedFunction(...args) {
    const context = this;

    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
}

export class ZoneBackground extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      entity: { type: String },
      src: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        position: absolute;
        width: 100%;
        height: 100%;
      }
    `;
  }

  async _attachObserver() {
    if (!this._resizeObserver) {
      this._resizeObserver = new ResizeObserver(
        debounce(() => this._measureCard(), 250, false)
      );
    }

    if (!this.parentElement) {
      return;
    }

    this._resizeObserver.observe(this.parentElement);
  }

  _measureCard() {
    const parent = this.parentElement;
    if (!parent) {
      return;
    }
    this._cardHeight = parent.offsetHeight;
    this._cardWidth = parent.offsetWidth;
  }

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => this._attachObserver());
  }

  firstUpdated() {
    this._attachObserver();
  }

  updated(changedProperties) {
    if (changedProperties.has('hass') && this.hass) {
      this.state = this.hass.states[this.entity];
      if (this.state && this.src !== this.state.attributes.entity_picture) {
        const src = this.state.attributes.entity_picture;
        this.src = src;
      }
    }
  }

  render() {
    let width = 'auto';
    let height = 'auto';

    if (this._cardWidth < this._cardHeight) {
      height = `${this._cardWidth}px`;
    } else {
      width = `${this._cardHeight}px`;
    }

    const imageStyle = {
      'background-image': this.src
        ? `url(${this.hass.hassUrl(this.src)})`
        : 'none',
      'background-color': this._backgroundColor || 'transparent',
      width,
      height,
    };

    return html`
      <div>
        ${this.src ? html`<div style="${styleMap(imageStyle)}"></div>` : ''}
      </div>
    `;
  }
}
