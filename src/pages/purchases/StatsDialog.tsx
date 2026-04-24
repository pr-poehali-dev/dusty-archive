import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { PURCHASES_URL } from "./types";

interface Stats {
  total: number;
  won: number;
  lost: number;
  top_competitor: { name: string; cnt: number } | null;
  this_month: number;
}

interface StatsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function StatsDialog({ open, onClose }: StatsDialogProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`${PURCHASES_URL}?action=stats`)
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, [open]);

  const winRate = stats && (stats.won + stats.lost) > 0
    ? Math.round((stats.won / (stats.won + stats.lost)) * 100)
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Icon name="BarChart2" size={22} className="text-primary" />
            Статистика закупок
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center items-center py-12 text-slate-400">
            <Icon name="Loader2" size={28} className="animate-spin mr-2" />
            Загрузка...
          </div>
        )}

        {!loading && stats && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Card className="border-2 border-slate-100">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-lg p-2.5">
                    <Icon name="ShoppingCart" size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Всего закупок</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-100">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-violet-100 rounded-lg p-2.5">
                    <Icon name="CalendarDays" size={20} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">В этом месяце</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.this_month}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-lg p-2.5">
                    <Icon name="TrendingUp" size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Выиграли</p>
                    <p className="text-3xl font-bold text-green-600">{stats.won}</p>
                    {winRate !== null && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {winRate}% от оценённых
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-100">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 rounded-lg p-2.5">
                    <Icon name="TrendingDown" size={20} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Проиграли</p>
                    <p className="text-3xl font-bold text-red-500">{stats.lost}</p>
                    {winRate !== null && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {100 - winRate}% от оценённых
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {stats.top_competitor && (
              <Card className="col-span-2 border-2 border-amber-100">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 rounded-lg p-2.5">
                      <Icon name="Trophy" size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Самый активный конкурент</p>
                      <p className="text-xl font-bold text-slate-900">{stats.top_competitor.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Участвовал в {stats.top_competitor.cnt} закупках
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
