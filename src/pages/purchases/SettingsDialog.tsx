import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AppSettings } from "@/hooks/useSettings";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
}

const FIELDS: { key: keyof AppSettings; label: string }[] = [
  { key: "losingColor", label: "Цвет проигранных закупок" },
  { key: "importantColor", label: "Цвет «Пометить как важное»" },
  { key: "rejectedColor", label: "Цвет отклонённых закупок" },
];

export default function SettingsDialog({ open, onClose, settings, onSave }: SettingsDialogProps) {
  const [local, setLocal] = useState<AppSettings>(settings);

  function handleChange(key: keyof AppSettings, value: string) {
    setLocal(prev => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    onSave(local);
    onClose();
  }

  function handleReset() {
    const defaults: AppSettings = {
      losingColor: "#fce7f3",
      importantColor: "#f0fdf4",
      rejectedColor: "#fef2f2",
    };
    setLocal(defaults);
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Настройки</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {FIELDS.map(({ key, label }) => (
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
                  onChange={e => handleChange(key, e.target.value)}
                  className="w-8 h-8 cursor-pointer rounded border-0 p-0 bg-transparent"
                  title={label}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between gap-2 pt-2">
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
