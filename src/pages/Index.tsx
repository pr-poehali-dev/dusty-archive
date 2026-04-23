import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import Users from "./Users";
import type { CurrentUser } from "../App";
import { PURCHASES_URL, REFS_URL, emptyPurchase } from "./purchases/types";
import type { Purchase, Refs } from "./purchases/types";
import PurchasesTable from "./purchases/PurchasesTable";
import PurchaseDialog from "./purchases/PurchaseDialog";
import RefsDialog from "./purchases/RefsDialog";

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

  const [refs, setRefs] = useState<Refs>({ product_types: [], competitors: [], executors: [] });

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

  const setField = (key: string, val: unknown) => setForm((prev: Partial<Purchase>) => ({ ...prev, [key]: val }));

  const handleDeleteRequest = () => {
    if (!selectedRow) { toast({ title: "Выберите закупку" }); return; }
    setDeleteConfirm(true);
  };

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
        <PurchasesTable
          purchases={purchases}
          loading={loading}
          total={total}
          search={search}
          onSearchChange={setSearch}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          productTypes={refs.product_types}
          selectedRow={selectedRow}
          onRowClick={p => setSelectedRow(p.id === selectedRow?.id ? null : p)}
          onRowDoubleClick={openView}
          canEdit={canEdit}
          onAdd={openAdd}
          onEdit={openEdit}
          onDeleteRequest={handleDeleteRequest}
        />
      </main>

      <PurchaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        onModeChange={setDialogMode}
        form={form}
        setField={setField}
        refs={refs}
        canEdit={canEdit}
        onSave={handleSave}
        deleteConfirm={deleteConfirm}
        onDeleteConfirmChange={setDeleteConfirm}
        selectedRow={selectedRow}
        onDelete={handleDelete}
      />

      <RefsDialog
        open={refsOpen}
        onOpenChange={setRefsOpen}
        refsTab={refsTab}
        onTabChange={loadRefItems}
        refItems={refItems}
        refEdit={refEdit}
        onRefEditChange={setRefEdit}
        onRefSave={handleRefSave}
        onRefDelete={handleRefDelete}
      />
    </div>
  );
}
