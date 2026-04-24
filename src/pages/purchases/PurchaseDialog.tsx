import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import type { Purchase, Refs } from "./types";

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "add" | "edit" | "view";
  onModeChange: (m: "add" | "edit" | "view") => void;
  form: Partial<Purchase>;
  setField: (key: string, val: unknown) => void;
  setForm: (updater: (prev: Partial<Purchase>) => Partial<Purchase>) => void;
  refs: Refs;
  canEdit: boolean;
  onSave: () => void;
  deleteConfirm: boolean;
  onDeleteConfirmChange: (v: boolean) => void;
  selectedRow: Purchase | null;
  onDelete: () => void;
}

function calcFromVat(priceWithVat: number | null | undefined, vatRate: number | null | undefined): number | null {
  if (priceWithVat == null || !vatRate) return null;
  return Math.round((priceWithVat / (1 + vatRate / 100)) * 100) / 100;
}

function calcPercent(competitorPrice: number | null | undefined, ourPrice: number | null | undefined): number | null {
  if (competitorPrice == null || ourPrice == null || competitorPrice === 0) return null;
  return Math.round(((ourPrice - competitorPrice) / competitorPrice) * 10000) / 100;
}

export default function PurchaseDialog({
  open, onOpenChange, mode, onModeChange,
  form, setField, setForm, refs, canEdit,
  onSave, deleteConfirm, onDeleteConfirmChange, selectedRow, onDelete,
}: PurchaseDialogProps) {
  const disabled = mode === "view";

  const handleVatChange = (vatRate: number) => {
    setForm(prev => {
      const compWithVat = prev.competitor_price_with_vat;
      const ourWithVat = prev.our_price_with_vat;
      const compWithout = calcFromVat(compWithVat, vatRate);
      const ourWithout = calcFromVat(ourWithVat, vatRate);
      const percent = calcPercent(compWithout, ourWithout);
      return {
        ...prev,
        vat_rate: vatRate,
        competitor_price: compWithout,
        our_price: ourWithout,
        percent,
      };
    });
  };

  const handleCompetitorWithVat = (val: string) => {
    const priceWithVat = val ? Number(val) : null;
    const vatRate = form.vat_rate ?? 20;
    const compWithout = calcFromVat(priceWithVat, vatRate);
    const percent = calcPercent(compWithout, form.our_price);
    setForm(prev => ({ ...prev, competitor_price_with_vat: priceWithVat, competitor_price: compWithout, percent }));
  };

  const handleOurWithVat = (val: string) => {
    const priceWithVat = val ? Number(val) : null;
    const vatRate = form.vat_rate ?? 20;
    const ourWithout = calcFromVat(priceWithVat, vatRate);
    const percent = calcPercent(form.competitor_price, ourWithout);
    setForm(prev => ({ ...prev, our_price_with_vat: priceWithVat, our_price: ourWithout, percent }));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === "add" ? "Добавить закупку" : mode === "edit" ? "Редактировать закупку" : "Карточка закупки"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">

            {/* Наименование */}
            <div className="col-span-2">
              <Label>Наименование закупки *</Label>
              <Input value={form.name || ""} onChange={e => setField("name", e.target.value)} disabled={disabled} className="mt-1" />
            </div>

            {/* Тип / Конкурент */}
            <div>
              <Label>Тип продукции</Label>
              <Select value={form.product_type_id ? String(form.product_type_id) : ""} onValueChange={v => setField("product_type_id", v ? Number(v) : null)} disabled={disabled}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Выберите тип" /></SelectTrigger>
                <SelectContent>
                  {refs.product_types.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Конкурент</Label>
              <Select value={form.competitor_id ? String(form.competitor_id) : ""} onValueChange={v => setField("competitor_id", v ? Number(v) : null)} disabled={disabled}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Выберите конкурента" /></SelectTrigger>
                <SelectContent>
                  {refs.competitors.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Дата / Количество */}
            <div>
              <Label>Дата подачи</Label>
              <Input type="date" value={form.submission_date?.slice(0, 10) || ""} onChange={e => setField("submission_date", e.target.value || null)} disabled={disabled} className="mt-1" />
            </div>
            <div>
              <Label>Количество</Label>
              <Input type="number" value={form.quantity ?? ""} onChange={e => setField("quantity", e.target.value ? Number(e.target.value) : null)} disabled={disabled} className="mt-1" />
            </div>

            {/* НДС */}
            <div className="col-span-2">
              <Label>Ставка НДС</Label>
              <Select value={String(form.vat_rate ?? 20)} onValueChange={v => handleVatChange(Number(v))} disabled={disabled}>
                <SelectTrigger className="mt-1 w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">НДС 10%</SelectItem>
                  <SelectItem value="20">НДС 20%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Стоимость конкурента с НДС → без НДС */}
            <div>
              <Label>Стоимость конкурента с НДС</Label>
              <Input type="number" value={form.competitor_price_with_vat ?? ""} onChange={e => handleCompetitorWithVat(e.target.value)} disabled={disabled} className="mt-1" />
            </div>
            <div>
              <Label className="text-slate-500">Стоимость конкурента без НДС</Label>
              <Input type="number" value={form.competitor_price ?? ""} onChange={e => setField("competitor_price", e.target.value ? Number(e.target.value) : null)} disabled={disabled} className="mt-1 bg-slate-50" />
            </div>

            {/* Наша стоимость с НДС → без НДС */}
            <div>
              <Label>Наша стоимость с НДС</Label>
              <Input type="number" value={form.our_price_with_vat ?? ""} onChange={e => handleOurWithVat(e.target.value)} disabled={disabled} className="mt-1" />
            </div>
            <div>
              <Label className="text-slate-500">Наша стоимость без НДС</Label>
              <Input type="number" value={form.our_price ?? ""} onChange={e => setField("our_price", e.target.value ? Number(e.target.value) : null)} disabled={disabled} className="mt-1 bg-slate-50" />
            </div>

            {/* % / Коэффициент */}
            <div>
              <Label className="text-slate-500">% (авто)</Label>
              <Input type="number" value={form.percent ?? ""} onChange={e => setField("percent", e.target.value ? Number(e.target.value) : null)} disabled={disabled} className="mt-1 bg-slate-50" />
            </div>
            <div>
              <Label>Наш коэффициент</Label>
              <Input type="number" value={form.our_coefficient ?? ""} onChange={e => setField("our_coefficient", e.target.value ? Number(e.target.value) : null)} disabled={disabled} className="mt-1" />
            </div>

            {/* Коэффициент конкурента — только в режиме просмотра, вычисляемый */}
            {mode === "view" && (
              <div className="col-span-2">
                <Label className="text-slate-500">Коэффициент конкурента (авто)</Label>
                <Input
                  type="number"
                  value={
                    form.competitor_price && form.our_coefficient && form.our_price
                      ? Math.round((form.competitor_price * form.our_coefficient / form.our_price) * 100) / 100
                      : ""
                  }
                  disabled
                  className="mt-1 bg-slate-50"
                />
              </div>
            )}

            {/* Исполнитель */}
            <div>
              <Label>Исполнитель</Label>
              <Select value={form.executor_id ? String(form.executor_id) : ""} onValueChange={v => setField("executor_id", v ? Number(v) : null)} disabled={disabled}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Выберите исполнителя" /></SelectTrigger>
                <SelectContent>
                  {refs.executors.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ссылка на закупку</Label>
              <Input value={form.purchase_link || ""} onChange={e => setField("purchase_link", e.target.value || null)} disabled={disabled} className="mt-1" placeholder="https://..." />
            </div>

            {/* Примечание */}
            <div className="col-span-2">
              <Label>Примечание</Label>
              <Textarea value={form.note || ""} onChange={e => setField("note", e.target.value || null)} disabled={disabled} className="mt-1" rows={3} />
            </div>

            {/* Чекбоксы — только в режиме редактирования/добавления */}
            {mode !== "view" && (
              <div className="col-span-2 flex gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox id="important" checked={!!form.is_important} onCheckedChange={v => setField("is_important", v)} />
                  <Label htmlFor="important" className="cursor-pointer">Пометить как важное</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="rejected" checked={!!form.is_rejected} onCheckedChange={v => setField("is_rejected", v)} />
                  <Label htmlFor="rejected" className="cursor-pointer">Отклонили</Label>
                </div>
              </div>
            )}

            {mode === "view" && form.purchase_link && (
              <div className="col-span-2">
                <a href={form.purchase_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                  <Icon name="ExternalLink" size={14} />
                  Открыть ссылку на закупку
                </a>
              </div>
            )}
          </div>
          <DialogFooter>
            {mode !== "view" ? (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
                <Button className="text-white" onClick={onSave}>Сохранить</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Закрыть</Button>
                {canEdit && <Button className="text-white" onClick={() => onModeChange("edit")}>Редактировать</Button>}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteConfirm} onOpenChange={onDeleteConfirmChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить закупку?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Вы уверены, что хотите удалить закупку <span className="font-semibold">«{selectedRow?.name}»</span>? Это действие необратимо.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => onDeleteConfirmChange(false)}>Отмена</Button>
            <Button variant="destructive" onClick={onDelete}>Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}