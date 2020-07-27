import { html, css, LitElement } from 'lit-element';
import { styleMap } from 'lit-html/directives/style-map';
import 'node-vibrant/dist/vibrant';

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

const COLOR_SIMILARITY_THRESHOLD = 150;
const CONTRAST_RATIO = 4.5;

const luminanace = (r, g, b) => {
  const a = [r, g, b].map(value => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const contrast = (rgb1, rgb2) => {
  const lum1 = luminanace(...rgb1);
  const lum2 = luminanace(...rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

function getContrastRatio(rgb1, rgb2) {
  return Math.round((contrast(rgb1, rgb2) + Number.EPSILON) * 100) / 100;
}

const customGenerator = colors => {
  colors.sort((colorA, colorB) => colorB.population - colorA.population);

  const backgroundColor = colors[0];
  let foregroundColor;

  const contrastRatios = new Map();
  const approvedContrastRatio = color => {
    if (!contrastRatios.has(color)) {
      contrastRatios.set(
        color,
        getContrastRatio(backgroundColor.rgb, color.rgb)
      );
    }

    return contrastRatios.get(color) > CONTRAST_RATIO;
  };

  // We take each next color and find one that has better contrast.
  for (let i = 1; i < colors.length && foregroundColor === undefined; i += 1) {
    // If this color matches, score, take it.
    if (approvedContrastRatio(colors[i])) {
      foregroundColor = colors[i].hex;
      break;
    }

    // This color has the wrong contrast ratio, but it is the right color.
    // Let's find similar colors that might have the right contrast ratio

    const currentColor = colors[i];

    for (let j = i + 1; j < colors.length; j += 1) {
      const compareColor = colors[j];

      // difference. 0 is same, 765 max difference
      const diffScore =
        Math.abs(currentColor.rgb[0] - compareColor.rgb[0]) +
        Math.abs(currentColor.rgb[1] - compareColor.rgb[1]) +
        Math.abs(currentColor.rgb[2] - compareColor.rgb[2]);

      if (diffScore <= COLOR_SIMILARITY_THRESHOLD) {
        if (approvedContrastRatio(compareColor)) {
          foregroundColor = compareColor.hex;
          break;
        }
      }
    }
  }

  if (foregroundColor === undefined) {
    foregroundColor = backgroundColor.bodyTextColor;
  }

  return [foregroundColor, backgroundColor.hex];
};

export class ZoneBackground extends LitElement {
  static get properties() {
    return {
      src: { type: String },
      backgroundColor: { type: String },
      cardWidth: { type: Number },
      cardHeight: { type: Number },
    };
  }

  static get styles() {
    return css`
      :host {
        /*position: absolute;*/
        width: 100%;
        height: 100%;
      }
    `;
  }

  constructor() {
    super();
    this.backgroundColor = '#000000';
    this.foregroundColor = '#ffffff';
  }

  async _attachObserver() {
    if (!this._resizeObserver) {
      this._resizeObserver = new ResizeObserver(
        debounce(() => this._measureCard(), 250, false)
      );
    }
    const card = this.shadowRoot.getElementById('background');
    this._resizeObserver.observe(card);
  }

  _measureCard() {
    const card = this.shadowRoot.getElementById('background');
    this.cardHeight = card.offsetHeight;
    this.cardWidth = card.offsetWidth;
  }

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => this._attachObserver());
  }

  firstUpdated() {
    this._attachObserver();
  }

  updated(changedProperties) {
    if (changedProperties.has('src') && this.src && this.src !== '') {
      // eslint-disable-next-line no-undef
      new Vibrant(this.src, {
        colorCount: 16,
        generator: customGenerator,
      })
        .getPalette()
        .then(v => {
          [this.foregroundColor, this.backgroundColor] = v;
          this.dispatchEvent(
            new CustomEvent('background-changed', {
              detail: {
                foregroundColor: this.foregroundColor,
                backgroundColor: this.backgroundColor,
              },
            })
          );
        });
    }
  }

  render() {
    let backgroundWidth = 'auto';
    const width = this.cardWidth ? `${this.cardWidth}px` : 'auto';

    let backgroundHeight = 'auto';
    const height = this.cardHeight ? `${this.cardHeight}px` : 'auto';

    let gradientDirection = 'to right';
    if (this.cardWidth && this.cardWidth < this.cardHeight) {
      backgroundHeight = `${this.cardWidth}px`;
      gradientDirection = 'to top';
    } else if (this.cardHeight) {
      backgroundWidth = `${this.cardHeight}px`;
    }

    const imageStyle = {
      'background-image': this.src ? `url(${this.src})` : 'none',
      'background-repeat': 'no-repeat',
      'background-size': `${backgroundWidth} ${backgroundHeight}`,
    };

    const gradientStyle = {
      position: 'absolute',
      'background-image': `linear-gradient(${gradientDirection}, ${this.backgroundColor}, ${this.backgroundColor}00)`,
      width,
      height,
    };

    return html`
      <div id="background" style="${styleMap(imageStyle)}">
        <div style="${styleMap(gradientStyle)}"></div>
        <slot></slot>
      </div>
    `;
  }
}
