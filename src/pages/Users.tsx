import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";

const AUTH_URL = "https://functions.poehali.dev/cfc5299f-fd61-478a-b748-efec947d114a";

interface User { id: number; username: string; full_name: string; role: string; is_active: boolean; created_at: string; }

const ROLE_LABELS: Record<string, string> = { admin: "Администратор", editor: "Редактор", viewer: "Пользователь" };
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  editor: "bg-blue-100 text-blue-800",
  viewer: "bg-slate-100 text-slate-700",
};

interface Props { sessionId: string; }

const emptyForm = { username: "", password: "", full_name: "", role: "viewer" };

export default function Users({ sessionId }: Props) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`${AUTH_URL}?action=users`, { headers: { "X-Session-Id": sessionId } });
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditUser(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (u: User) => { setEditUser(u); setForm({ username: u.username, password: "", full_name: u.full_name || "", role: u.role }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.username && !editUser) { toast({ title: "Укажите логин", variant: "destructive" }); return; }
    if (!form.password && !editUser) { toast({ title: "Укажите пароль", variant: "destructive" }); return; }

    if (editUser) {
      const body: Record<string, string | boolean> = { full_name: form.full_name, role: form.role };
      if (form.password) body.password = form.password;
      await fetch(`${AUTH_URL}?action=update_user&id=${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
        body: JSON.stringify(body),
      });
      toast({ title: "Пользователь обновлён" });
    } else {
      const res = await fetch(`${AUTH_URL}?action=create_user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error || "Ошибка", variant: "destructive" }); return; }
      toast({ title: "Пользователь создан" });
    }
    setDialogOpen(false);
    load();
  };

  const toggleActive = async (u: User) => {
    await fetch(`${AUTH_URL}?action=update_user&id=${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
      body: JSON.stringify({ is_active: !u.is_active }),
    });
    load();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Пользователи</h2>
          <p className="text-sm text-slate-500 mt-0.5">Управление доступом к системе</p>
        </div>
        <Button className="text-white" onClick={openAdd}>
          <Icon name="UserPlus" size={16} className="mr-2" />
          Добавить
        </Button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Пользователь</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Логин</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Роль</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Дата создания</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-700">Активен</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-10 text-slate-400">Загрузка...</td></tr>}
            {!loading && users.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-slate-400">Нет пользователей</td></tr>}
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">{u.full_name || "—"}</td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{u.username}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${ROLE_COLORS[u.role]}`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(u.created_at).toLocaleDateString("ru-RU")}</td>
                <td className="px-4 py-3 text-center">
                  <Switch checked={u.is_active} onCheckedChange={() => toggleActive(u)} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => openEdit(u)}>
                    <Icon name="Pencil" size={13} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editUser ? "Редактировать пользователя" : "Новый пользователь"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editUser && (
              <div>
                <Label>Логин *</Label>
                <Input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} className="mt-1" placeholder="Введите логин" />
              </div>
            )}
            <div>
              <Label>ФИО</Label>
              <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} className="mt-1" placeholder="Иванов Иван Иванович" />
            </div>
            <div>
              <Label>Пароль {editUser ? "(оставьте пустым, чтобы не менять)" : "*"}</Label>
              <Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="mt-1" placeholder="••••••••" />
            </div>
            <div>
              <Label>Роль</Label>
              <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="editor">Редактор</SelectItem>
                  <SelectItem value="viewer">Пользователь</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button className="text-white" onClick={handleSave}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
