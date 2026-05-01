import React, { useState, useEffect, useRef } from 'react';
import { checklistData } from './data/checklist';
import { checklistUSB } from './data/checklistUSB';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from './AuthContext';
import { jsPDF } from 'jspdf';
import { 
  Save, 
  Trash2, 
  PlusCircle, 
  Share2, 
  Mail, 
  CheckSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  Pill,
  Archive,
  Layers,
  Sun,
  Moon,
  Ambulance,
  History,
  X,
  AlertTriangle,
  Camera,
  ImagePlus,
  LogIn,
  Users,
  Eye,
  Settings,
  Briefcase,
  Box,
  Stethoscope,
  Syringe,
  Thermometer,
  Activity,
  Clipboard,
  Package,
  Truck,
  Clock,
  Calendar,
  ArrowLeft,
  ClipboardCheck,
  ImageIcon,
  Send,
  Download,
  MessageCircle
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';
import { motion, AnimatePresence } from 'motion/react';
import AdminChecklistManager from './components/AdminChecklistManager';
import { useNavigate } from 'react-router-dom';
import { SamuLogo } from './components/SamuLogo';

const iconMap: Record<string, any> = {
  Briefcase, Stethoscope, Syringe, Pill, Thermometer, Activity, Archive, Layers, Box, Clipboard, Package, Truck, User, Clock, Calendar
};

type ChecklistState = {
  [key: string]: boolean;
};

type OutroState = {
  [key: string]: string;
};

type FormState = {
  enfermeiro: string;
  registro: string; // CRM/COREN/MATRICULA
  turno: string;
  observacoes: string;
};

type HistoryEntry = {
  id: string;
  userId: string;
  date: any;
  type: 'USA' | 'USB';
  enfermeiro: string;
  registro: string;
  turno: string;
  checkedItems: ChecklistState;
  outros: OutroState;
  formData: FormState;
  photos?: string[];
  createdAt: any;
};

const initialFormState: FormState = {
  enfermeiro: '',
  registro: '',
  turno: '',
  observacoes: ''
};

export const ChecklistDashboard: React.FC = () => {
  const { user, profile, loading: authLoading, quotaExceeded } = useAuth();
  const navigate = useNavigate();
  
  const [checklistType, setChecklistType] = useState<'USA' | 'USB'>('USA');
  const [dynamicChecklistUSA, setDynamicChecklistUSA] = useState<any[]>(checklistData);
  const [dynamicChecklistUSB, setDynamicChecklistUSB] = useState<any[]>(checklistUSB);
  const [showAdminManager, setShowAdminManager] = useState(false);
  const [checkedItems, setCheckedItems] = useState<ChecklistState>({});
  const [outros, setOutros] = useState<OutroState>({});
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [photos, setPhotos] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState('bolsas');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<HistoryEntry | null>(null);
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({ show: false, message: '', type: 'success' });
  const [locationCity, setLocationCity] = useState('Serra Talhada - PE');

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        enfermeiro: profile.name || user?.displayName || '',
        registro: profile.registration || profile.coren || ''
      }));
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        enfermeiro: user.displayName || '',
        registro: ''
      }));
    }
  }, [profile, user]);

  // Load Templates (Firestore)
  useEffect(() => {
    const unsubUSA = onSnapshot(doc(db, 'config', 'checklist_templates_USA'), (d) => {
      if (d.exists()) {
        const data = d.data();
        if (data.categories) setDynamicChecklistUSA(data.categories);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'config/checklist_templates_USA');
    });

    const unsubUSB = onSnapshot(doc(db, 'config', 'checklist_templates_USB'), (d) => {
      if (d.exists()) {
        const data = d.data();
        if (data.categories) setDynamicChecklistUSB(data.categories);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'config/checklist_templates_USB');
    });

    return () => {
      unsubUSA();
      unsubUSB();
    };
  }, []);

  // History Loader (Firestore)
  useEffect(() => {
    if (!showHistory || !profile) return;
    
    const q = query(
      collection(db, 'checklists'), 
      where('userId', '==', profile.uid),
      orderBy('date', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HistoryEntry[];
      setHistory(historyList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'checklists');
    });

    return () => unsubscribe();
  }, [showHistory, profile]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-samu-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-samu-red"></div>
          <p className="text-samu-blue font-black uppercase tracking-widest text-xs">Carregando...</p>
        </div>
      </div>
    );
  }

  if (quotaExceeded) {
    return (
      <div className="min-h-screen bg-samu-white flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md border border-red-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trash2 className="text-red-500" size={40} />
          </div>
          <h2 className="text-2xl font-black text-samu-blue uppercase mb-4">Limite Diário Atingido</h2>
          <p className="text-gray-600 mb-6 font-medium leading-relaxed">
            O limite de uso gratuito do banco de dados para hoje foi atingido. O sistema voltará a funcionar normalmente em algumas horas quando a cota for reiniciada pelo Google.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-samu-blue text-white rounded-2xl font-black uppercase tracking-widest"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const currentChecklistData = checklistType === 'USA' ? dynamicChecklistUSA : dynamicChecklistUSB;

  const handleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOutroChange = (categoryId: string, value: string) => {
    setOutros(prev => ({ ...prev, [categoryId]: value }));
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const saveHistory = async () => {
    try {
      if (!profile) return;
      
      const newEntry = {
        userId: profile.uid,
        date: new Date().toISOString(),
        type: checklistType,
        enfermeiro: formData.enfermeiro,
        registro: formData.registro,
        turno: formData.turno,
        checkedItems,
        outros,
        formData,
        photos,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'checklists'), newEntry);
      showToastMessage('Checklist salvo com sucesso!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'checklists');
      showToastMessage('Erro ao salvar checklist.', 'error');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const generatePDF = async (dataToUse?: any) => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const currentData = dataToUse || {
        type: checklistType,
        enfermeiro: formData.enfermeiro,
        turno: formData.turno,
        registro: formData.registro,
        date: new Date().toISOString(),
        checkedItems,
        outros,
        formData
      };

      // Header
      doc.setFillColor(0, 0, 128); // Navy Blue (matches samu-blue)
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("SAMU 192", 105, 20, { align: "center" });
      doc.setFontSize(14);
      doc.text(`CHECKLIST DE VIATURA - ${currentData.type}`, 105, 30, { align: "center" });

      // Info Section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Responsável: ${currentData.enfermeiro}`, 20, 50);
      doc.text(`Registro Profissional (CRM/COREN/MAT): ${currentData.registro || 'N/A'}`, 20, 56);
      doc.text(`Turno: ${currentData.turno}`, 20, 62);
      doc.text(`Data/Hora: ${format(new Date(currentData.date), 'dd/MM/yyyy HH:mm')}`, 20, 68);
      doc.text(`Viatura: ${currentData.type}`, 20, 74);

      let yPos = 85;
      doc.line(20, yPos - 5, 190, yPos - 5);

      // Iterate through categories
      const categories = currentData.type === 'USA' ? dynamicChecklistUSA : dynamicChecklistUSB;
      
      categories.forEach(category => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        const categoryItems = category.items;
        const checkedInCategory = categoryItems.filter((i: any) => currentData.checkedItems[i.id]);

        if (checkedInCategory.length > 0 || currentData.outros[category.id]) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(210, 0, 0); // samu-red
          doc.text(category.title.toUpperCase(), 20, yPos);
          yPos += 7;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);

          checkedInCategory.forEach((item: any) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(`[X] ${item.label}`, 25, yPos);
            yPos += 6;
          });

          if (currentData.outros[category.id]) {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            doc.setFont("helvetica", "italic");
            doc.text(`Outros: ${currentData.outros[category.id]}`, 25, yPos);
            doc.setFont("helvetica", "normal");
            yPos += 7;
          }
          yPos += 5;
        }
      });

      // Observations
      if (currentData.formData.observacoes) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text("OBSERVAÇÕES:", 20, yPos);
        yPos += 7;
        doc.setFont("helvetica", "normal");
        const splitObs = doc.splitTextToSize(currentData.formData.observacoes, 170);
        doc.text(splitObs, 20, yPos);
      }

      doc.save(`Checklist_SAMU_${currentData.type}_${format(new Date(currentData.date), 'yyyyMMdd_HHmm')}.pdf`);
      showToastMessage('PDF gerado com sucesso!');
    } catch (err) {
      console.error(err);
      showToastMessage('Erro ao gerar PDF', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const shareWhatsApp = (dataToUse?: any) => {
    const currentData = dataToUse || {
      type: checklistType,
      enfermeiro: formData.enfermeiro,
      registro: formData.registro,
      turno: formData.turno,
      date: new Date().toISOString(),
      formData
    };

    const text = `*CHECKLIST SAMU 192 - SERRA TALHADA*\n\n` +
      `*Tipo:* ${currentData.type}\n` +
      `*Servidor:* ${currentData.enfermeiro}\n` +
      `*Registro:* ${currentData.registro || 'N/A'}\n` +
      `*Turno:* ${currentData.turno}\n` +
      `*Data:* ${format(new Date(currentData.date), 'dd/MM/yyyy HH:mm')}\n` +
      `*Status:* ✅ CONCLUÍDO\n\n` +
      `*Observações:* ${currentData.formData.observacoes || 'Sem observações.'}`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleReset = () => {
    if (window.confirm('Deseja realmente limpar todo o checklist? Isso apagará todas as seleções, fotos e observações.')) {
      setCheckedItems({});
      setOutros({});
      setPhotos([]);
      setFormData(prev => ({ ...prev, observacoes: '', turno: '' }));
      setActiveTab('bolsas');
      showToastMessage('Checklist limpo!');
    }
  };

  const handleSubmit = async () => {
    if (!formData.turno) {
      showToastMessage('Por favor, selecione o turno.', 'error');
      return;
    }
    
    setSubmitting(true);
    try {
      await saveHistory();
      // Reset form after submittal
      setCheckedItems({});
      setOutros({});
      setPhotos([]);
      setFormData(prev => ({ ...prev, observacoes: '', turno: '' }));
      setActiveTab('bolsas');
      showToastMessage('Checklist enviado com sucesso!');
    } catch (err) {
      console.error(err);
      showToastMessage('Erro ao enviar checklist.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const currentTabs = checklistType === 'USA' 
    ? [
        { id: 'bolsas', label: 'Bolsas', icon: Briefcase },
        { id: 'medicacoes', label: 'Medicação', icon: Pill },
        { id: 'compartimentos', label: 'Compartimentos', icon: Archive },
        { id: 'geral', label: 'Geral', icon: Layers },
        { id: 'finalizacao', label: 'Finalização', icon: ClipboardCheck }
      ]
    : [
        { id: 'bolsas', label: 'Bolsas', icon: Briefcase },
        { id: 'compartimentos', label: 'Compartimentos', icon: Archive },
        { id: 'geral', label: 'Geral', icon: Layers },
        { id: 'finalizacao', label: 'Finalização', icon: ClipboardCheck }
      ];

  const CATEGORY_MAPPING: Record<string, string> = {
    'bolsa-via-aerea-avancada': 'bolsas',
    'bolsa-trauma': 'bolsas',
    'bolsa-azul-ssvv': 'bolsas',
    'bolsa-avp': 'bolsas',
    'soros': 'medicacoes',
    'bolsa-medicacoes': 'medicacoes',
    'gaveta-01': 'compartimentos',
    'gaveta-02': 'compartimentos',
    'prateleira': 'compartimentos',
    'armario': 'compartimentos',
    'porta-luva': 'compartimentos',
    'balcao-inferior': 'geral',
    'balcao-superior': 'geral',
    'salao': 'geral',
    'bau': 'geral',
    'usb-bolsa-trauma': 'bolsas',
    'usb-bolsa-avp': 'bolsas',
    'usb-soros': 'bolsas',
    'usb-bolsa-medicacao': 'bolsas',
    'usb-bolsa-azul-ssvv': 'bolsas',
    'usb-imobilizacao': 'geral',
    'usb-materiais': 'compartimentos',
    'usb-equipamentos': 'geral'
  };

  const filteredCategories = currentChecklistData.filter(category => {
    const mappedTab = CATEGORY_MAPPING[category.id] || 'geral';
    return mappedTab === activeTab;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-samu-blue text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-full">
              <ArrowLeft size={20} />
            </button>
            <div 
              className="bg-white p-1 rounded-full shadow-sm cursor-pointer hover:scale-105 transition-transform"
              onClick={() => navigate('/')}
            >
              <SamuLogo className="h-8 w-8 object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight">Checklist de Viaturas</h1>
              <p className="text-[10px] text-samu-orange font-bold uppercase tracking-widest">SAMU 192 - Serra Talhada</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setShowHistory(true)} className="p-2 hover:bg-white/10 rounded-lg" title="Histórico">
              <History size={20} />
            </button>
            {profile?.role === 'coordenacao' && (
              <button onClick={() => setShowAdminManager(true)} className="p-2 hover:bg-white/10 rounded-lg">
                <Settings size={20} />
              </button>
            )}
          </div>
        </div>
        <div className="bg-samu-blue px-4 py-2 flex justify-center space-x-4">
           <button 
             onClick={() => setChecklistType('USA')}
             className={`px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${checklistType === 'USA' ? 'bg-samu-red text-white shadow-md' : 'text-blue-200'}`}
           >
             USA (Avançada)
           </button>
           <button 
             onClick={() => setChecklistType('USB')}
             className={`px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${checklistType === 'USB' ? 'bg-samu-orange text-white shadow-md' : 'text-blue-200'}`}
           >
             USB (Básica)
           </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Form Info */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome Completo</label>
            <input 
              value={formData.enfermeiro} 
              onChange={(e) => setFormData(f => ({ ...f, enfermeiro: e.target.value }))}
              placeholder="Digite seu nome completo"
              className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 font-bold text-gray-700 focus:ring-2 focus:ring-samu-blue/20 outline-none" 
            />
          </div>
          <div className="grid grid-cols-2 md:contents gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registro (CRM/COREN/MAT)</label>
              <input 
                value={formData.registro} 
                onChange={(e) => setFormData(f => ({ ...f, registro: e.target.value }))}
                placeholder="Ex: COREN 123456"
                className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 font-bold text-gray-700 focus:ring-2 focus:ring-samu-blue/20 outline-none" 
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Turno de Plantão</label>
              <div className="flex gap-2 mt-1">
                {['Diurno', 'Noturno'].map(t => {
                  const Icon = t === 'Diurno' ? Sun : Moon;
                  const isActive = formData.turno === t;
                  const activeStyles = t === 'Diurno' 
                    ? 'bg-amber-400 text-white shadow-lg shadow-amber-200 ring-2 ring-amber-100' 
                    : 'bg-indigo-900 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-100';
                  
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, turno: t }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95 ${isActive ? activeStyles : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    >
                      <Icon size={12} className={isActive ? 'animate-pulse' : ''} />
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {currentTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const activeColorClass = checklistType === 'USA' ? 'bg-samu-red border-samu-red' : 'bg-samu-orange border-samu-orange';
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all whitespace-nowrap shadow-sm border ${
                  isActive 
                    ? `${activeColorClass} text-white` 
                    : `bg-white text-gray-400 border-gray-100 hover:border-${checklistType === 'USA' ? 'samu-red' : 'samu-orange'}/30`
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Categories */}
        {activeTab !== 'finalizacao' ? (
          <>
            <div className="space-y-4">
              {filteredCategories.map((category) => {
                const Icon = iconMap[category.iconName] || Box;
                const isExpanded = expandedCategories[category.id] ?? true;
                const checkedCount = category.items.filter((i: any) => checkedItems[i.id]).length;
                const isDone = checkedCount === category.items.length;

                return (
                  <div key={category.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${isDone ? 'border-green-200 bg-green-50/20' : 'border-gray-100'}`}>
                    <button 
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between p-4"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl ${isDone ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                          <Icon size={24} />
                        </div>
                        <div className="text-left">
                          <h3 className="font-black text-gray-800 uppercase tracking-tight text-sm">{category.title}</h3>
                          <p className="text-[10px] font-bold text-gray-400">{checkedCount} / {category.items.length} itens checados</p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="text-gray-300" /> : <ChevronDown className="text-gray-300" />}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-2 border-t border-gray-50 pt-4">
                        {category.items.map((item: any) => (
                          <label key={item.id} className="flex items-start space-x-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer group">
                            <input 
                              type="checkbox"
                              checked={!!checkedItems[item.id]}
                              onChange={() => handleCheck(item.id)}
                              className={`mt-0.5 w-5 h-5 rounded-md border-gray-300 focus:ring-${checklistType === 'USA' ? 'samu-red' : 'samu-orange'} ${checklistType === 'USA' ? 'text-samu-red' : 'text-samu-orange'}`}
                            />
                            <span className={`text-sm font-medium transition-colors ${checkedItems[item.id] ? 'text-gray-300 line-through' : 'text-gray-700'}`}>
                              {item.label}
                            </span>
                          </label>
                        ))}
                        {category.hasOutro && (
                          <div className="col-span-full mt-4 pt-4 border-t border-gray-50">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-2">Outros (especifique):</label>
                            <textarea
                              value={outros[category.id] || ''}
                              onChange={(e) => handleOutroChange(category.id, e.target.value)}
                              placeholder="Adicione itens extras aqui..."
                              className="w-full mt-2 p-4 bg-gray-50 rounded-2xl border-none text-xs font-bold focus:ring-2 focus:ring-samu-blue/20 transition-all min-h-[80px]"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex gap-4">
              <button 
                onClick={handleReset}
                className="flex-1 py-4 bg-white text-red-400 border border-gray-100 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Limpar
              </button>
              <button 
                onClick={() => setActiveTab('finalizacao')}
                className={`flex-[2] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transform active:scale-95 transition-all ${checklistType === 'USA' ? 'bg-samu-red' : 'bg-samu-orange'}`}
              >
                Próximo Passo
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* Observações */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="text-samu-red" size={20} />
                <h3 className="font-black text-xs uppercase tracking-wider text-samu-blue">Observações Gerais</h3>
              </div>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Digite aqui observações adicionais, intercorrências ou informações importantes..."
                className="w-full p-4 bg-gray-50 rounded-2xl border-none text-xs font-bold focus:ring-2 focus:ring-samu-blue/20 transition-all min-h-[120px]"
              />
            </div>

            {/* Fotos */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Camera className="text-samu-red" size={20} />
                <h3 className="font-black text-xs uppercase tracking-wider text-samu-blue">Fotos e Anexos</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center p-6 text-white rounded-2xl transition-all gap-2 ${checklistType === 'USA' ? 'bg-samu-red hover:bg-samu-red/90' : 'bg-samu-orange hover:bg-samu-orange/90'}`}
                >
                  <Camera size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Tirar Foto</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 transition-all gap-2"
                >
                  <ImageIcon size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Galeria</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>

              {photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100">
                      <img src={photo} alt={`Checklist ${index}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Nenhuma foto anexada</p>
                  <p className="text-[10px] text-gray-300 mt-1 uppercase tracking-widest">Use os botões acima para adicionar imagens</p>
                </div>
              )}
            </div>

            {/* WhatsApp e PDF Preview */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={() => generatePDF()}
                disabled={isGeneratingPdf}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-800 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-900 transition-all shadow-lg"
              >
                {isGeneratingPdf ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div> : <Download size={16} />}
                Gerar PDF
              </button>
              <button
                onClick={() => shareWhatsApp()}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg"
              >
                <MessageCircle size={16} />
                WhatsApp
              </button>
            </div>

            {/* Finalizar Button */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 py-5 bg-white text-gray-400 border border-gray-200 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Limpar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`flex-[2] py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all flex items-center justify-center gap-3 ${
                  submitting ? 'bg-gray-300 cursor-not-allowed' : (checklistType === 'USA' ? 'bg-samu-red hover:bg-samu-red/90 shadow-samu-red/20' : 'bg-samu-orange hover:bg-samu-orange/90 shadow-samu-orange/20') + ' text-white hover:scale-[1.02] active:scale-95'
                }`}
              >
                <Send size={20} />
                {submitting ? 'Enviando...' : 'Finalizar'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* History Modal (Simplified for integration) */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-black uppercase text-gray-800">Meu Histórico</h2>
              <button onClick={() => setShowHistory(false)}><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.map(entry => (
                <div key={entry.id} className="p-4 border rounded-xl bg-white shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-samu-blue uppercase">{entry.type} - {entry.turno}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{new Date(entry.date).toLocaleString('pt-BR')}</p>
                  </div>
                  <button 
                    onClick={() => setViewingEntry(entry)}
                    className="p-2 text-gray-400 hover:text-samu-blue transition-colors"
                  >
                    <Eye size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Viewing Entry Detail Modal */}
      {viewingEntry && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between bg-samu-blue text-white">
              <div>
                <h2 className="text-xl font-black uppercase">Detalhes do Checklist</h2>
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-[0.2em]">{format(new Date(viewingEntry.date), "dd 'de' MMMM 'de' yyyy HH:mm", { locale: ptBR })}</p>
              </div>
              <button 
                onClick={() => setViewingEntry(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Viatura</p>
                  <p className="font-bold text-samu-blue">{viewingEntry.type}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Turno</p>
                  <p className="font-bold text-samu-blue">{viewingEntry.turno}</p>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => generatePDF(viewingEntry)}
                  disabled={isGeneratingPdf}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-800 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-900 transition-all shadow-lg"
                >
                  {isGeneratingPdf ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div> : <Download size={16} />}
                  Baixar PDF
                </button>
                <button
                  onClick={() => shareWhatsApp(viewingEntry)}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </button>
              </div>

              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 pl-1">Itens Marcados</p>
                <div className="space-y-4">
                  {(viewingEntry.type === 'USA' ? dynamicChecklistUSA : dynamicChecklistUSB).map(cat => {
                    const checkedInCat = cat.items.filter((i: any) => viewingEntry.checkedItems[i.id]);
                    if (checkedInCat.length === 0 && !viewingEntry.outros[cat.id]) return null;
                    
                    return (
                      <div key={cat.id} className="border border-gray-100 rounded-2xl p-4">
                        <h4 className="font-black text-xs uppercase text-samu-blue mb-2">{cat.title}</h4>
                        <ul className="space-y-1">
                          {checkedInCat.map((i: any) => (
                            <li key={i.id} className="text-xs text-gray-600 flex items-center gap-2 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              {i.label}
                            </li>
                          ))}
                          {viewingEntry.outros[cat.id] && (
                            <li className="text-xs text-samu-orange italic font-bold mt-1">
                              Outros: {viewingEntry.outros[cat.id]}
                            </li>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>

              {viewingEntry.formData.observacoes && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Observações</p>
                  <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 text-xs text-yellow-800 font-bold leading-relaxed">
                    {viewingEntry.formData.observacoes}
                  </div>
                </div>
              )}

              {viewingEntry.photos && viewingEntry.photos.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 pl-1">Fotos Anexadas</p>
                  <div className="grid grid-cols-2 gap-3">
                    {viewingEntry.photos.map((p, i) => (
                      <img key={i} src={p} className="rounded-xl border border-gray-100 shadow-sm" alt="Anexo" />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex gap-4">
              <button 
                onClick={() => setViewingEntry(null)}
                className="flex-1 py-4 bg-white text-gray-400 border border-gray-200 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all"
              >
                Fechar Detalhes
              </button>
              {profile?.role === 'coordenacao' && (
                <button 
                  onClick={async () => {
                    if (window.confirm('Excluir este registro permanentemente?')) {
                      try {
                        await deleteDoc(doc(db, 'checklists', viewingEntry!.id));
                        setViewingEntry(null);
                        showToastMessage('Registro excluído com sucesso!');
                      } catch (err) {
                        handleFirestoreError(err, OperationType.DELETE, `checklists/${viewingEntry?.id}`);
                        showToastMessage('Erro ao excluir registro.', 'error');
                      }
                    }
                  }}
                  className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Manager */}
      {showAdminManager && (
        <AdminChecklistManager 
          type={checklistType} 
          initialData={currentChecklistData} 
          onClose={() => setShowAdminManager(false)} 
          onSave={() => showToastMessage('Estrutura atualizada!')} 
        />
      )}

      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white font-black uppercase tracking-widest text-xs z-[200] shadow-2xl animate-bounce ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};
