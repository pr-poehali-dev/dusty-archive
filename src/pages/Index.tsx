import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import Users from "./Users";
import type { CurrentUser } from "../App";

const PURCHASES_URL = "https://functions.poehali.dev/ec7ab38c-b81f-4f32-886e-907af780fddf";
const REFS_URL = "https://functions.poehali.dev/f306d1bc-8c13-4391-bebe-54d07aeec2f8";

interface ProductType { id: number; name: string; }
interface Competitor { id: number; name: string; }
interface Executor { id: number; full_name: string; }
interface Purchase {
  id: number;
  name: string;
  product_type_id: number | null;
  product_type_name: string | null;
  competitor_id: number | null;
  competitor_name: string | null;
  submission_date: string | null;
  quantity: number | null;
  competitor_price: number | null;
  our_price: number | null;
  percent: number | null;
  our_coefficient: number | null;
  note: string | null;
  executor_id: number | null;
  executor_name: string | null;
  purchase_link: string | null;
  is_important: boolean;
  is_rejected: boolean;
}

const emptyPurchase: Omit<Purchase, "id" | "product_type_name" | "competitor_name" | "executor_name"> = {
  name: "",
  product_type_id: null,
  competitor_id: null,
  submission_date: null,
  quantity: null,
  competitor_price: null,
  our_price: null,
  percent: null,
  our_coefficient: null,
  note: null,
  executor_id: null,
  purchase_link: null,
  is_important: false,
  is_rejected: false,
};

interface IndexProps {
  sessionId: string;
  currentUser: CurrentUser;
  onLogout: () => void;
}

const ROLE_LABELS: Record<string, string> = { admin: "Администратор", editor: "Редактор", viewer: "Пользователь" };

export default function App({ sessionId, currentUser, onLogout }: IndexProps) {
  const { toast } = useToast();
  const canEdit = currentUser.role === "admin" || currentUser.role === "editor";
  const isAdmin = currentUser.role === "admin";
  const [view, setView] = useState<"purchases" | "users">("purchases");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Purchase | null>(null);

  const [refs, setRefs] = useState<{ product_types: ProductType[]; competitors: Competitor[]; executors: Executor[] }>({
    product_types: [], competitors: [], executors: [],
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
  const [form, setForm] = useState<Partial<Purchase>>(emptyPurchase as Partial<Purchase>);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [refsOpen, setRefsOpen] = useState(false);
  const [refsTab, setRefsTab] = useState("executors");

  const [refItems, setRefItems] = useState<Record<string, string | number>[]>([]);
  const [refEdit, setRefEdit] = useState<{ id: number | null; value: string }>({ id: null, value: "" });

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterType !== "all") params.set("product_type_id", filterType);
    const res = await fetch(`${PURCHASES_URL}?${params}`);
    const data = await res.json();
    setPurchases(data.purchases || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, filterType]);

  const loadRefs = useCallback(async () => {
    const res = await fetch(`${PURCHASES_URL}?action=refs`);
    const data = await res.json();
    setRefs(data);
  }, []);

  useEffect(() => { loadPurchases(); }, [loadPurchases]);
  useEffect(() => { loadRefs(); }, [loadRefs]);

  const openAdd = () => {
    if (!canEdit) return;
    setForm({ ...emptyPurchase }); setDialogMode("add"); setDialogOpen(true);
  };
  const openEdit = () => {
    if (!canEdit) return;
    if (!selectedRow) { toast({ title: "Выберите закупку" }); return; }
    setForm({ ...selectedRow }); setDialogMode("edit"); setDialogOpen(true);
  };
  const openView = (row: Purchase) => { setForm({ ...row }); setDialogMode("view"); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name) { toast({ title: "Укажите наименование закупки", variant: "destructive" }); return; }
    const payload = { ...form };
    if (dialogMode === "add") {
      await fetch(PURCHASES_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      toast({ title: "Закупка добавлена" });
    } else {
      await fetch(`${PURCHASES_URL}?id=${form.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      toast({ title: "Закупка обновлена" });
    }
    setDialogOpen(false);
    setSelectedRow(null);
    loadPurchases();
  };

  const handleDelete = async () => {
    if (!selectedRow) return;
    await fetch(`${PURCHASES_URL}?id=${selectedRow.id}`, { method: "DELETE" });
    toast({ title: "Закупка удалена" });
    setDeleteConfirm(false);
    setSelectedRow(null);
    loadPurchases();
  };

  const loadRefItems = async (tab: string) => {
    setRefsTab(tab);
    const res = await fetch(`${REFS_URL}?ref=${tab}`);
    const data = await res.json();
    setRefItems(data);
    setRefEdit({ id: null, value: "" });
  };

  const openRefs = () => { setRefsOpen(true); loadRefItems("executors"); };

  const handleRefSave = async () => {
    const fieldMap: Record<string, string> = { executors: "full_name", competitors: "name", product_types: "name" };
    const field = fieldMap[refsTab];
    if (refEdit.id) {
      await fetch(`${REFS_URL}?ref=${refsTab}&id=${refEdit.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: refEdit.value })
      });
    } else {
      await fetch(`${REFS_URL}?ref=${refsTab}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: refEdit.value })
      });
    }
    setRefEdit({ id: null, value: "" });
    loadRefItems(refsTab);
    loadRefs();
  };

  const handleRefDelete = async (id: number) => {
    await fetch(`${REFS_URL}?ref=${refsTab}&id=${id}`, { method: "DELETE" });
    loadRefItems(refsTab);
    loadRefs();
  };

  const getRefLabel = (tab: string) => ({ executors: "Исполнители", competitors: "Конкуренты", product_types: "Типы продукции" }[tab] || tab);
  const getRefField = (tab: string, item: Record<string, string | number>) => tab === "executors" ? String(item.full_name) : String(item.name);

  const setField = (key: string, val: unknown) => setForm((prev: Partial<Purchase>) => ({ ...prev, [key]: val }));

  if (view === "users") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b shadow-sm">
          <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground rounded-lg p-2">
                <Icon name="TrendingUp" size={20} />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900 leading-none">Анализ цен</h1>
                <p className="text-xs text-slate-500">Управление закупками</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setView("purchases")}>
                <Icon name="ArrowLeft" size={15} className="mr-1" />
                К закупкам
              </Button>
            </div>
          </div>
        </header>
        <Users sessionId={sessionId} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground rounded-lg p-2">
              <Icon name="TrendingUp" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 leading-none">Анализ цен</h1>
              <p className="text-xs text-slate-500">Управление закупками</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={openRefs}>
                <Icon name="BookOpen" size={16} className="mr-1" />
                Справочники
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Icon name="UserCircle" size={16} />
                  <span className="hidden sm:inline">{currentUser.full_name || currentUser.username}</span>
                  <Icon name="ChevronDown" size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{currentUser.full_name || currentUser.username}</p>
                  <p className="text-xs text-slate-500">{ROLE_LABELS[currentUser.role] || currentUser.role}</p>
                </div>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem onClick={() => setView("users")}>
                    <Icon name="Users" size={14} className="mr-2" />
                    Пользователи
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
                  <Icon name="LogOut" size={14} className="mr-2" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-screen-xl mx-auto px-4 py-6 flex-1 w-full">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Поиск по наименованию..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Тип продукции" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              {refs.product_types.map(t => (
                <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canEdit && (
          <div className="flex gap-2">
            <Button size="sm" className="text-white" onClick={openAdd}>
              <Icon name="Plus" size={16} className="mr-1" />
              Добавить
            </Button>
            <Button size="sm" variant="outline" onClick={openEdit}>
              <Icon name="Pencil" size={16} className="mr-1" />
              Изменить
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              onClick={() => { if (!selectedRow) { toast({ title: "Выберите закупку" }); return; } setDeleteConfirm(true); }}>
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
                    onClick={() => setSelectedRow(p.id === selectedRow?.id ? null : p)}
                    onDoubleClick={() => openView(p)}
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

        {/* Footer counter */}
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <Icon name="Database" size={14} />
          Всего закупок в базе: <span className="font-semibold text-slate-700">{total}</span>
        </div>
      </main>

      {/* Purchase Dialog (add / edit / view) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Добавить закупку" : dialogMode === "edit" ? "Редактировать закупку" : "Карточка закупки"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label>Наименование закупки *</Label>
              <Input value={form.name || ""} onChange={e => setField("name", e.target.value)} disabled={dialogMode === "view"} className="mt-1" />
            </div>
            <div>
              <Label>Тип продукции</Label>
              <Select value={form.product_type_id ? String(form.product_type_id) : ""} onValueChange={v => setField("product_type_id", v ? Number(v) : null)} disabled={dialogMode === "view"}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Выберите тип" /></SelectTrigger>
                <SelectContent>
                  {refs.product_types.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Конкурент</Label>
              <Select value={form.competitor_id ? String(form.competitor_id) : ""} onValueChange={v => setField("competitor_id", v ? Number(v) : null)} disabled={dialogMode === "view"}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Выберите конкурента" /></SelectTrigger>
                <SelectContent>
                  {refs.competitors.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Дата подачи</Label>
              <Input type="date" value={form.submission_date?.slice(0, 10) || ""} onChange={e => setField("submission_date", e.target.value || null)} disabled={dialogMode === "view"} className="mt-1" />
            </div>
            <div>
              <Label>Количество</Label>
              <Input type="number" value={form.quantity ?? ""} onChange={e => setField("quantity", e.target.value ? Number(e.target.value) : null)} disabled={dialogMode === "view"} className="mt-1" />
            </div>
            <div>
              <Label>Стоимость конкурента без НДС</Label>
              <Input type="number" value={form.competitor_price ?? ""} onChange={e => setField("competitor_price", e.target.value ? Number(e.target.value) : null)} disabled={dialogMode === "view"} className="mt-1" />
            </div>
            <div>
              <Label>Наша стоимость без НДС</Label>
              <Input type="number" value={form.our_price ?? ""} onChange={e => setField("our_price", e.target.value ? Number(e.target.value) : null)} disabled={dialogMode === "view"} className="mt-1" />
            </div>
            <div>
              <Label>%</Label>
              <Input type="number" value={form.percent ?? ""} onChange={e => setField("percent", e.target.value ? Number(e.target.value) : null)} disabled={dialogMode === "view"} className="mt-1" />
            </div>
            <div>
              <Label>Наш коэффициент</Label>
              <Input type="number" value={form.our_coefficient ?? ""} onChange={e => setField("our_coefficient", e.target.value ? Number(e.target.value) : null)} disabled={dialogMode === "view"} className="mt-1" />
            </div>
            <div>
              <Label>Исполнитель</Label>
              <Select value={form.executor_id ? String(form.executor_id) : ""} onValueChange={v => setField("executor_id", v ? Number(v) : null)} disabled={dialogMode === "view"}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Выберите исполнителя" /></SelectTrigger>
                <SelectContent>
                  {refs.executors.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Ссылка на закупку</Label>
              <Input value={form.purchase_link || ""} onChange={e => setField("purchase_link", e.target.value || null)} disabled={dialogMode === "view"} className="mt-1" placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <Label>Примечание</Label>
              <Textarea value={form.note || ""} onChange={e => setField("note", e.target.value || null)} disabled={dialogMode === "view"} className="mt-1" rows={3} />
            </div>
            <div className="col-span-2 flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox id="important" checked={!!form.is_important} onCheckedChange={v => setField("is_important", v)} disabled={dialogMode === "view"} />
                <Label htmlFor="important" className="cursor-pointer">Пометить как важное</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="rejected" checked={!!form.is_rejected} onCheckedChange={v => setField("is_rejected", v)} disabled={dialogMode === "view"} />
                <Label htmlFor="rejected" className="cursor-pointer">Отклонили</Label>
              </div>
            </div>
            {dialogMode === "view" && form.purchase_link && (
              <div className="col-span-2">
                <a href={form.purchase_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                  <Icon name="ExternalLink" size={14} />
                  Открыть ссылку на закупку
                </a>
              </div>
            )}
          </div>
          <DialogFooter>
            {dialogMode !== "view" ? (
              <>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
                <Button className="text-white" onClick={handleSave}>Сохранить</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Закрыть</Button>
                {canEdit && <Button className="text-white" onClick={() => setDialogMode("edit")}>Редактировать</Button>}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить закупку?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Вы уверены, что хотите удалить закупку <span className="font-semibold">«{selectedRow?.name}»</span>? Это действие необратимо.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete}>Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refs Dialog */}
      <Dialog open={refsOpen} onOpenChange={setRefsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Справочники</DialogTitle>
          </DialogHeader>
          <Tabs value={refsTab} onValueChange={loadRefItems}>
            <TabsList className="w-full">
              <TabsTrigger value="executors" className="flex-1">Исполнители</TabsTrigger>
              <TabsTrigger value="competitors" className="flex-1">Конкуренты</TabsTrigger>
              <TabsTrigger value="product_types" className="flex-1">Типы продукции</TabsTrigger>
            </TabsList>
            {["executors", "competitors", "product_types"].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-3">
                <div className="text-sm font-medium text-slate-700 mt-2">{getRefLabel(tab)}</div>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                  {refItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg">
                      {refEdit.id === item.id ? (
                        <Input value={refEdit.value} onChange={e => setRefEdit(prev => ({ ...prev, value: e.target.value }))} className="h-7 text-sm" autoFocus />
                      ) : (
                        <span className="text-sm text-slate-800">{getRefField(tab, item)}</span>
                      )}
                      <div className="flex gap-1 shrink-0">
                        {refEdit.id === item.id ? (
                          <>
                            <Button size="sm" className="h-7 px-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleRefSave}>
                              <Icon name="Check" size={14} />
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setRefEdit({ id: null, value: "" })}>
                              <Icon name="X" size={14} />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setRefEdit({ id: item.id, value: getRefField(tab, item) })}>
                              <Icon name="Pencil" size={14} />
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-red-600 hover:text-red-700" onClick={() => handleRefDelete(item.id)}>
                              <Icon name="Trash2" size={14} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {refItems.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">Список пуст</p>}
                </div>
                <div className="flex gap-2 pt-1">
                  {refEdit.id === null && (
                    <>
                      <Input
                        placeholder={`Добавить ${tab === "executors" ? "ФИО" : "наименование"}...`}
                        value={refEdit.value}
                        onChange={e => setRefEdit(prev => ({ ...prev, value: e.target.value }))}
                        className="h-8 text-sm"
                        onKeyDown={e => { if (e.key === "Enter") handleRefSave(); }}
                      />
                      <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleRefSave}>
                        <Icon name="Plus" size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefsOpen(false)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}