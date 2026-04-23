import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";

interface RefsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  refsTab: string;
  onTabChange: (tab: string) => void;
  refItems: Record<string, string | number>[];
  refEdit: { id: number | null; value: string };
  onRefEditChange: (v: { id: number | null; value: string }) => void;
  onRefSave: () => void;
  onRefDelete: (id: number) => void;
}

const getRefLabel = (tab: string) =>
  ({ executors: "Исполнители", competitors: "Конкуренты", product_types: "Типы продукции" }[tab] || tab);

const getRefField = (tab: string, item: Record<string, string | number>) =>
  tab === "executors" ? String(item.full_name) : String(item.name);

export default function RefsDialog({
  open, onOpenChange, refsTab, onTabChange,
  refItems, refEdit, onRefEditChange, onRefSave, onRefDelete,
}: RefsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Справочники</DialogTitle>
        </DialogHeader>
        <Tabs value={refsTab} onValueChange={onTabChange}>
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
                      <Input
                        value={refEdit.value}
                        onChange={e => onRefEditChange({ ...refEdit, value: e.target.value })}
                        className="h-7 text-sm"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm text-slate-800">{getRefField(tab, item)}</span>
                    )}
                    <div className="flex gap-1 shrink-0">
                      {refEdit.id === item.id ? (
                        <>
                          <Button size="sm" className="h-7 px-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={onRefSave}>
                            <Icon name="Check" size={14} />
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => onRefEditChange({ id: null, value: "" })}>
                            <Icon name="X" size={14} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => onRefEditChange({ id: Number(item.id), value: getRefField(tab, item) })}>
                            <Icon name="Pencil" size={14} />
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-red-600 hover:text-red-700" onClick={() => onRefDelete(Number(item.id))}>
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
                      onChange={e => onRefEditChange({ ...refEdit, value: e.target.value })}
                      className="h-8 text-sm"
                      onKeyDown={e => { if (e.key === "Enter") onRefSave(); }}
                    />
                    <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={onRefSave}>
                      <Icon name="Plus" size={14} />
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
