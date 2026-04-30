import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Edit2, PlusCircle } from 'lucide-react';

interface AdminChecklistManagerProps {
  type: 'USA' | 'USB';
  initialData: any[];
  onClose: () => void;
  onSave: (newData: any[]) => void;
}

const AdminChecklistManager: React.FC<AdminChecklistManagerProps> = ({ type, initialData, onClose, onSave }) => {
  const [data, setData] = useState<any[]>([...initialData]);
  const [saving, setSaving] = useState(false);

  const saveToLocal = async () => {
    setSaving(true);
    try {
      localStorage.setItem(`checklist_templates_${type}`, JSON.stringify({
        categories: data,
        updatedAt: new Date().toISOString()
      }));
      onSave(data);
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Erro ao salvar template localmente.");
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    const newCat = {
      id: `cat_${Date.now()}`,
      title: 'Nova Categoria',
      iconName: 'Box',
      items: [],
      hasOutro: true
    };
    setData([...data, newCat]);
  };

  const removeCategory = (id: string) => {
    setData(data.filter(c => c.id !== id));
  };

  const updateCategory = (id: string, field: string, value: any) => {
    setData(data.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addItem = (catId: string) => {
    setData(data.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: [...c.items, { id: `item_${Date.now()}`, label: 'Novo Item' }]
        };
      }
      return c;
    }));
  };

  const removeItem = (catId: string, itemId: string) => {
    setData(data.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: c.items.filter((i: any) => i.id !== itemId)
        };
      }
      return c;
    }));
  };

  const updateItem = (catId: string, itemId: string, label: string) => {
    setData(data.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: c.items.map((i: any) => i.id === itemId ? { ...i, label } : i)
        };
      }
      return c;
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between bg-samu-blue text-white">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Gerenciar Checklist {type}</h2>
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Personalização de Itens e Categorias</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {data.map((cat, idx) => (
            <div key={cat.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 p-4 flex items-center gap-4 border-b border-gray-200">
                <span className="bg-samu-blue text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">{idx + 1}</span>
                <input 
                  value={cat.title}
                  onChange={(e) => updateCategory(cat.id, 'title', e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-gray-800 text-lg uppercase"
                />
                <button 
                  onClick={() => removeCategory(cat.id)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {cat.items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <Edit2 size={14} className="text-gray-400" />
                    <input 
                      value={item.label}
                      onChange={(e) => updateItem(cat.id, item.id, e.target.value)}
                      className="flex-1 text-sm border-b border-gray-100 focus:border-samu-blue/40 py-1 outline-none"
                    />
                    <button 
                      onClick={() => removeItem(cat.id, item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => addItem(cat.id)}
                  className="mt-2 flex items-center gap-2 text-samu-blue hover:text-samu-blue-hover text-xs font-black uppercase tracking-widest pt-2"
                >
                  <Plus size={16} />
                  Adicionar Item
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={addCategory}
            className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:text-samu-blue hover:border-samu-blue/40 transition-all font-black uppercase tracking-widest"
          >
            <PlusCircle size={24} />
            Adicionar Nova Categoria
          </button>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl font-black uppercase tracking-widest text-xs text-gray-500 hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={saveToLocal}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-samu-blue text-white rounded-xl font-black uppercase tracking-widest transition-all hover:bg-samu-blue-hover shadow-lg active:scale-95 disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminChecklistManager;
