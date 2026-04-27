import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { AppSettings, ColumnKey } from "@/hooks/useSettings";
import { ALL_COLUMNS } from "@/hooks/useSettings";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
}

const COLOR_FIELDS: { key: "losingColor" | "importantColor" | "rejectedColor"; label: string }[] = [
  { key: "losingColor", label: "Цвет проигранных закупок" },
  { key: "importantColor", label: "Цвет «Пометить как важное»" },
  { key: "rejectedColor", label: "Цвет отклонённых закупок" },
];

const DEFAULTS = {
  losingColor: "#fce7f3",
  importantColor: "#f0fdf4",
  rejectedColor: "#fef2f2",
};

export default function SettingsDialog({ open, onClose, settings, onSave }: SettingsDialogProps) {
  const [local, setLocal] = useState<AppSettings>(settings);

  function handleColorChange(key: "losingColor" | "importantColor" | "rejectedColor", value: string) {
    setLocal(prev => ({ ...prev, [key]: value }));
  }

  function toggleColumn(key: ColumnKey, checked: boolean) {
    setLocal(prev => ({
      ...prev,
      visibleColumns: checked
        ? [...prev.visibleColumns, key]
        : prev.visibleColumns.filter(k => k !== key),
    }));
  }

  function handleSave() {
    onSave(local);
    onClose();
  }

  function handleReset() {
    setLocal({
      ...DEFAULTS,
      visibleColumns: ALL_COLUMNS.map(c => c.key),
    });
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); setLocal(settings); }}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Настройки</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Цвета строк</p>
            <div className="space-y-4">
              {COLOR_FIELDS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <Label className="text-sm text-slate-700 flex-1">{label}</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border border-slate-200"
                      style={{ backgroundColor: local[key] }}
                    />
                    <input
                      type="color"
                      value={local[key]}
                      onChange={e => handleColorChange(key, e.target.value)}
                      className="w-8 h-8 cursor-pointer rounded border-0 p-0 bg-transparent"
                      title={label}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Столбцы таблицы</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 opacity-50">
                <Checkbox checked disabled />
                <Label className="text-sm text-slate-700 cursor-default">Наименование</Label>
              </div>
              {ALL_COLUMNS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`col-${key}`}
                    checked={local.visibleColumns.includes(key)}
                    onCheckedChange={(checked) => toggleColumn(key, !!checked)}
                  />
                  <Label htmlFor={`col-${key}`} className="text-sm text-slate-700 cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-2 pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Сбросить
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleSave}>
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
