import { useState } from "react";

export type ColumnKey = "product_type" | "competitor" | "submission_date" | "quantity" | "competitor_price" | "our_price" | "percent" | "executor";

export interface AppSettings {
  losingColor: string;
  importantColor: string;
  rejectedColor: string;
  visibleColumns: ColumnKey[];
}

export const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "product_type", label: "Тип продукции" },
  { key: "competitor", label: "Конкурент" },
  { key: "submission_date", label: "Дата подачи" },
  { key: "quantity", label: "Кол-во" },
  { key: "competitor_price", label: "Цена конк." },
  { key: "our_price", label: "Наша цена" },
  { key: "percent", label: "%" },
  { key: "executor", label: "Исполнитель" },
];

const DEFAULT_COLUMNS: ColumnKey[] = ["product_type", "competitor", "submission_date", "quantity", "competitor_price", "our_price", "percent", "executor"];

const DEFAULTS: AppSettings = {
  losingColor: "#fce7f3",
  importantColor: "#f0fdf4",
  rejectedColor: "#fef2f2",
  visibleColumns: DEFAULT_COLUMNS,
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
