import { useState } from "react";

export interface AppSettings {
  losingColor: string;
  importantColor: string;
  rejectedColor: string;
}

const DEFAULTS: AppSettings = {
  losingColor: "#fce7f3",
  importantColor: "#f0fdf4",
  rejectedColor: "#fef2f2",
};

const STORAGE_KEY = "purchase_settings";

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch (e) {
    console.warn("Failed to load settings", e);
  }
  return DEFAULTS;
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  function saveSettings(next: AppSettings) {
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return { settings, saveSettings };
}