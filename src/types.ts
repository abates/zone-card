import type { HomeAssistant, LovelaceCardConfig } from "custom-card-helpers";

export interface ContextRequestEvent extends CustomEvent {
  context: string;
  subscribe: boolean;
  callback: (states: any, unsubscribe: () => void) => void;
}

export interface HaDropdownItem {
  value: number;
}

export interface HaSelectEvent {
  item: HaDropdownItem;
}

export interface MiniMediaPlayer extends HTMLElement {
  hass?: HomeAssistant;
  setConfig: (config: LovelaceCardConfig) => void;
}
