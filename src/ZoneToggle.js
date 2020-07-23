import { html, css, LitElement } from 'lit-element';

export class ZoneToggle extends LitElement {
  static get properties() {
    return {
      on: { type: Boolean },
    };
  }

  static get styles() {
    return css`
      :host {
        display: inline;
      }

      .switch {
        position: relative;
        display: inline-block;
        width: 30px;
        height: 17px;
      }

      /* Hide default HTML checkbox */
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      /* The slider */
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        -webkit-transition: 0.4s;
        transition: 0.4s;
      }

      .slider:before {
        position: absolute;
        content: '';
        height: 13px;
        width: 13px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        -webkit-transition: 0.4s;
        transition: 0.4s;
      }

      input:checked + .slider {
        background-color: #2196f3;
      }

      input:focus + .slider {
        box-shadow: 0 0 1px #2196f3;
      }

      input:checked + .slider:before {
        -webkit-transform: translateX(13px);
        -ms-transform: translateX(13px);
        transform: translateX(13px);
      }

      /* Rounded sliders */
      .slider.round {
        border-radius: 34px;
      }

      .slider.round:before {
        border-radius: 50%;
      }
    `;
  }

  firstUpdated() {
    this.checkbox = this.shadowRoot.getElementById('checkbox');
  }

  handleClick() {
    if (this.checkbox.checked) {
      this.dispatchEvent(
        new CustomEvent('zone-on', {
          detail: {
            message: 'Something important happened',
          },
        })
      );
    } else {
      this.dispatchEvent(
        new CustomEvent('zone-off', {
          detail: {
            message: 'Something important happened',
          },
        })
      );
    }
  }

  render() {
    return html`
      <label class="switch">
        <input
          ?checked="${this.on}"
          id="checkbox"
          type="checkbox"
          @click="${this.handleClick}"
        />
        <span class="slider"></span>
      </label>
    `;
  }
}
