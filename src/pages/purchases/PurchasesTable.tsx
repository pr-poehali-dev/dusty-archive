import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import type { Purchase, ProductType } from "./types";

interface PurchasesTableProps {
  purchases: Purchase[];
  loading: boolean;
  total: number;
  search: string;
  onSearchChange: (v: string) => void;
  filterType: string;
  onFilterTypeChange: (v: string) => void;
  productTypes: ProductType[];
  selectedRow: Purchase | null;
  onRowClick: (p: Purchase) => void;
  onRowDoubleClick: (p: Purchase) => void;
  canEdit: boolean;
  onAdd: () => void;
  onEdit: () => void;
  onDeleteRequest: () => void;
}

export default function PurchasesTable({
  purchases, loading, total,
  search, onSearchChange,
  filterType, onFilterTypeChange, productTypes,
  selectedRow, onRowClick, onRowDoubleClick,
  canEdit, onAdd, onEdit, onDeleteRequest,
}: PurchasesTableProps) {
  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Поиск по наименованию..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={onFilterTypeChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Тип продукции" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {productTypes.map(t => (
              <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canEdit && (
          <div className="flex gap-2">
            <Button size="sm" className="text-white" onClick={onAdd}>
              <Icon name="Plus" size={16} className="mr-1" />
              Добавить
            </Button>
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Icon name="Pencil" size={16} className="mr-1" />
              Изменить
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300" onClick={onDeleteRequest}>
              <Icon name="Trash2" size={16} className="mr-1" />
              Удалить
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left px-4 py-3 font-semibold text-slate-700 min-w-[220px]">Наименование</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-700 min-w-[140px]">Тип продукции</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-700 min-w-[140px]">Конкурент</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-700 min-w-[110px]">Дата подачи</th>
              <th className="text-right px-3 py-3 font-semibold text-slate-700 min-w-[80px]">Кол-во</th>
              <th className="text-right px-3 py-3 font-semibold text-slate-700 min-w-[120px]">Цена конк.</th>
              <th className="text-right px-3 py-3 font-semibold text-slate-700 min-w-[120px]">Наша цена</th>
              <th className="text-right px-3 py-3 font-semibold text-slate-700 min-w-[70px]">%</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-700 min-w-[150px]">Исполнитель</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="text-center py-10 text-slate-400">Загрузка...</td></tr>
            )}
            {!loading && purchases.length === 0 && (
              <tr><td colSpan={9} className="text-center py-10 text-slate-400">Закупки не найдены</td></tr>
            )}
            {purchases.map(p => {
              const isImportant = p.is_important;
              const isRejected = p.is_rejected;
              const bg = isImportant ? "bg-green-50 hover:bg-green-100" : isRejected ? "bg-red-50 hover:bg-red-100" : "hover:bg-slate-50";
              const selected = selectedRow?.id === p.id ? "ring-2 ring-inset ring-blue-400" : "";
              return (
                <tr
                  key={p.id}
                  className={`border-b cursor-pointer transition-colors ${bg} ${selected}`}
                  onClick={() => onRowClick(p)}
                  onDoubleClick={() => onRowDoubleClick(p)}
                >
                  <td className="px-4 py-2.5 font-medium text-slate-900 max-w-[260px] truncate">
                    {p.name}
                    {p.is_important && <Badge className="ml-2 bg-green-200 text-green-800 text-xs">Важное</Badge>}
                    {p.is_rejected && <Badge className="ml-2 bg-red-200 text-red-800 text-xs">Отклонено</Badge>}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{p.product_type_name || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-600">{p.competitor_name || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-600">{p.submission_date ? new Date(p.submission_date).toLocaleDateString("ru-RU") : "—"}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{p.quantity != null ? Number(p.quantity).toLocaleString("ru-RU") : "—"}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{p.competitor_price != null ? Number(p.competitor_price).toLocaleString("ru-RU", { minimumFractionDigits: 2 }) : "—"}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{p.our_price != null ? Number(p.our_price).toLocaleString("ru-RU", { minimumFractionDigits: 2 }) : "—"}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{p.percent != null ? `${Number(p.percent).toFixed(2)}%` : "—"}</td>
                  <td className="px-3 py-2.5 text-slate-600">{p.executor_name || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Icon name="Database" size={14} />
          Всего закупок в базе: <span className="font-semibold text-slate-700">{total}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport(purchases)}
          disabled={purchases.length === 0}
        >
          <Icon name="Download" size={15} className="mr-1.5" />
          Выгрузка в Excel
        </Button>
      </div>
    </>
  );
}

function handleExport(purchases: Purchase[]) {
  const headers = [
    "Наименование", "Тип продукции", "Конкурент", "Дата подачи",
    "Количество", "Стоимость конкурента без НДС", "Наша стоимость без НДС",
    "%", "Наш коэффициент", "Исполнитель", "Ссылка", "Примечание", "Отклонили",
  ];

  const rows = purchases.map(p => [
    p.name,
    p.product_type_name || "",
    p.competitor_name || "",
    p.submission_date ? new Date(p.submission_date).toLocaleDateString("ru-RU") : "",
    p.quantity ?? "",
    p.competitor_price ?? "",
    p.our_price ?? "",
    p.percent ?? "",
    p.our_coefficient ?? "",
    p.executor_name || "",
    p.purchase_link || "",
    p.note || "",
    p.is_rejected ? "Да" : "Нет",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Цвет строк: зелёный — важное, красный — отклонено
  purchases.forEach((p, i) => {
    if (!p.is_important && !p.is_rejected) return;
    const fill = p.is_important
      ? { fgColor: { rgb: "C6EFCE" } }  // зелёный
      : { fgColor: { rgb: "FFCCCC" } };  // красный
    headers.forEach((_, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: colIdx });
      if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
      ws[cellRef].s = { fill: { patternType: "solid", ...fill } };
    });
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Закупки");

  const date = new Date().toLocaleDateString("ru-RU").replace(/\./g, "-");
  XLSX.writeFile(wb, `zakupki_${date}.xlsx`, { cellStyles: true });
}