import React, { useState, useEffect, useRef } from 'react';
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
  Truck,
  Clock,
  Calendar,
  ArrowLeft,
  ClipboardCheck,
  ImageIcon,
  Send,
  Download,
  MessageCircle,
  Zap,
  Coffee,
  LifeBuoy,
  FileSearch,
  Droplet,
  Fuel,
  Volume2,
  Wind
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
import { useNavigate } from 'react-router-dom';
import { SamuLogo } from './components/SamuLogo';
import { VehicleChecklistData } from './types';

const vehicleChecklistStructure = [
  {
    id: 'motor',
    title: '1. Motor e Fluidos',
    icon: Droplet,
    items: [
      { id: 'oleo_motor', label: 'Nível de Óleo do Motor (Dentro da marca)' },
      { id: 'liquido_arrefecimento', label: 'Líquido de Arrefecimento (Nível reservatórrio)' },
      { id: 'fluido_freio_direcao', label: 'Fluido de Freio e Direção (Nível/Vazamentos)' },
      { id: 'combustivel', label: 'Combustível (Tanque acima de 3/4)' }
    ]
  },
  {
    id: 'eletrico',
    title: '2. Sistema Elétrico, Iluminação e Som',
    icon: Zap,
    items: [
      { id: 'sinalizacao_visual', label: 'Sinalização Visual (Giroflex, strobo, perimetrais)' },
      { id: 'sinalizacao_acustica', label: 'Sinalização Acústica (Sirene, buzina)' },
      { id: 'iluminacao_padrao', label: 'Iluminação Padrão (Faróis, setas, freio, ré)' },
      { id: 'radio_transmissor', label: 'Rádio Transmissor (Comunicação Central)' }
    ]
  },
  {
    id: 'cabine',
    title: '3. Cabine e Conforto',
    icon: Wind,
    items: [
      { id: 'ar_condicionado', label: 'Ar-condicionado (Cabine e Salão)' },
      { id: 'painel_instrumentos', label: 'Painel (Sem luzes de advertência - Injeção, ABS, Airbag)' },
      { id: 'higienizacao', label: 'Higienização (Cabine limpa)' }
    ]
  },
  {
    id: 'seguranca',
    title: '4. Itens de Rodagem e Segurança',
    icon: LifeBuoy,
    items: [
      { id: 'pneus', label: 'Pneus (Calibragem e sulcos)' },
      { id: 'estepe_ferramentas', label: 'Estepe e Ferramentas (Macaco, triângulo, chave)' },
      { id: 'extintor_incendio', label: 'Extintor (Zona verde e validade)' }
    ]
  },
  {
    id: 'documentacao',
    title: '5. Documentação',
    icon: FileSearch,
    items: [
      { id: 'documento_veiculo', label: 'Documento do Veículo (CRLV)' },
      { id: 'cartao_abastecimento', label: 'Cartão de Abastecimento' }
    ]
  }
];

export const VehicleChecklistDashboard: React.FC = () => {
  const { user, profile, loading: authLoading, quotaExceeded } = useAuth();
  const navigate = useNavigate();

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    prefixoPlaca: '',
    condutor: '',
    kmInicial: '',
    kmFinal: '',
    turno: '',
    observacoes: ''
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [history, setHistory] = useState<VehicleChecklistData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<VehicleChecklistData | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({ show: false, message: '', type: 'success' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        condutor: profile.name || user?.displayName || ''
      }));
    }
  }, [profile, user]);

  useEffect(() => {
    if (!showHistory || !profile) return;
    
    const checklistsRef = collection(db, 'vehicle_checklists');
    const isCoord = profile.role === 'coordenacao';
    
    const q = isCoord
      ? query(checklistsRef, orderBy('createdAt', 'desc'))
      : query(checklistsRef, where('userId', '==', profile.uid), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VehicleChecklistData[];
      setHistory(historyList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'vehicle_checklists');
    });

    return () => unsubscribe();
  }, [showHistory, profile]);

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
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

  const handleReset = () => {
    if (window.confirm('Limpar checklist?')) {
      setCheckedItems({});
      setPhotos([]);
      setFormData(prev => ({ ...prev, observacoes: '', kmInicial: '', kmFinal: '', turno: '', prefixoPlaca: '' }));
      showToastMessage('Checklist limpo!');
    }
  };

  const handleSubmit = async () => {
    if (!formData.prefixoPlaca || !formData.condutor || !formData.turno) {
      showToastMessage('Preencha os campos obrigatórios (Placa, Condutor, Turno).', 'error');
      return;
    }
    
    setSubmitting(true);
    try {
      if (!profile) return;
      
      const newEntry = {
        userId: profile.uid,
        date: new Date().toISOString(),
        condutor: formData.condutor,
        prefixoPlaca: formData.prefixoPlaca,
        turno: formData.turno,
        kmInicial: formData.kmInicial,
        kmFinal: formData.kmFinal,
        checks: checkedItems,
        observacoes: formData.observacoes,
        photos: photos,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'vehicle_checklists'), newEntry);
      
      // Reset
      setCheckedItems({});
      setPhotos([]);
      setFormData(prev => ({ ...prev, kmFinal: '', kmInicial: '', observacoes: '', turno: '', prefixoPlaca: '' }));
      showToastMessage('Checklist enviado com sucesso!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'vehicle_checklists');
      showToastMessage('Erro ao enviar checklist.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const generatePDF = async (dataToUse?: any) => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const currentData = dataToUse || {
        condutor: formData.condutor,
        prefixoPlaca: formData.prefixoPlaca,
        turno: formData.turno,
        kmInicial: formData.kmInicial,
        kmFinal: formData.kmFinal,
        date: new Date().toISOString(),
        checks: checkedItems,
        observacoes: formData.observacoes
      };

      // Header
      doc.setFillColor(255, 122, 0); // samu-orange
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("SAMU 192", 105, 20, { align: "center" });
      doc.setFontSize(14);
      doc.text("CHECKLIST DE VIATURA - MANUTENÇÃO", 105, 30, { align: "center" });

      // Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Viatura (Prefixo/Placa): ${currentData.prefixoPlaca}`, 20, 50);
      doc.text(`Condutor: ${currentData.condutor}`, 20, 56);
      doc.text(`Data: ${format(new Date(currentData.date), 'dd/MM/yyyy')}`, 20, 62);
      doc.text(`Turno: ${currentData.turno}`, 80, 62);
      doc.text(`KM Inicial: ${currentData.kmInicial} km`, 20, 68);
      doc.text(`KM Final: ${currentData.kmFinal} km`, 80, 68);

      let yPos = 80;
      doc.line(20, yPos - 5, 190, yPos - 5);

      vehicleChecklistStructure.forEach(section => {
        if (yPos > 260) { doc.addPage(); yPos = 20; }
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(210, 0, 0); // samu-red
        doc.text(section.title.toUpperCase(), 20, yPos);
        yPos += 7;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);

        section.items.forEach(item => {
          if (yPos > 270) { doc.addPage(); yPos = 20; }
          const isChecked = currentData.checks[item.id] ? '[X]' : '[ ]';
          doc.text(`${isChecked} ${item.label}`, 25, yPos);
          yPos += 6;
        });
        yPos += 4;
      });

      if (currentData.observacoes) {
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.setFont("helvetica", "bold");
        doc.text("OBSERVAÇÕES / AVARIAS:", 20, yPos);
        yPos += 7;
        doc.setFont("helvetica", "normal");
        const splitObs = doc.splitTextToSize(currentData.observacoes, 170);
        doc.text(splitObs, 20, yPos);
      }

      doc.save(`Checklist_VTR_${currentData.prefixoPlaca}_${format(new Date(currentData.date), 'yyyyMMdd')}.pdf`);
      showToastMessage('PDF gerado!');
    } catch (err) {
      console.error(err);
      showToastMessage('Erro PDF', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const shareWhatsApp = (dataToUse?: any) => {
    const currentData = dataToUse || {
      condutor: formData.condutor,
      prefixoPlaca: formData.prefixoPlaca,
      turno: formData.turno,
      kmInicial: formData.kmInicial,
      kmFinal: formData.kmFinal,
      date: new Date().toISOString(),
      checks: checkedItems,
      observacoes: formData.observacoes
    };

    let missing = '';
    vehicleChecklistStructure.forEach(s => {
      s.items.forEach(i => {
        if (!currentData.checks[i.id]) missing += `• ${i.label}\n`;
      });
    });

    const text = `*CHECKLIST VIATURA SAMU 192*\n` +
      `*VTR:* ${currentData.prefixoPlaca}\n` +
      `*Condutor:* ${currentData.condutor}\n` +
      `*Turno:* ${currentData.turno} (${format(new Date(currentData.date), 'dd/MM/yyyy')})\n` +
      `*KM:* ${currentData.kmInicial} -> ${currentData.kmFinal}\n` +
      `*Situação:* ${missing ? '⚠️ PENDÊNCIAS' : '✅ TUDO OK'}\n` +
      (missing ? `\n*ITENS NÃO CONCORDES:*\n${missing}` : '') +
      (currentData.observacoes ? `\n*Observações:* ${currentData.observacoes}` : '');

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-samu-orange text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-full">
              <ArrowLeft size={20} />
            </button>
            <div className="bg-white p-1 rounded-full shadow-sm">
              <SamuLogo className="h-8 w-8 object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight text-white">Checklist VTR</h1>
              <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest">Controle de Viatura</p>
            </div>
          </div>
          <button onClick={() => setShowHistory(true)} className="p-2 hover:bg-white/10 rounded-lg">
            <History size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Identificação Inicial */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <h2 className="md:col-span-2 text-xs font-black uppercase tracking-widest text-samu-blue flex items-center gap-2 mb-2">
            <Truck size={18} /> Identificação Inicial
          </h2>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Viatura (Prefixo/Placa)</label>
            <input 
              value={formData.prefixoPlaca}
              onChange={e => setFormData(p => ({...p, prefixoPlaca: e.target.value}))}
              placeholder="Ex: USB 01 / SAMU-1234"
              className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-gray-700 focus:ring-2 focus:ring-samu-blue/20"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Condutor</label>
            <input 
              value={formData.condutor}
              onChange={e => setFormData(p => ({...p, condutor: e.target.value}))}
              className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-gray-700"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">KM Inicial</label>
              <input 
                type="number"
                value={formData.kmInicial}
                onChange={e => setFormData(p => ({...p, kmInicial: e.target.value}))}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-gray-700"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Turno</label>
              <select 
                value={formData.turno}
                onChange={e => setFormData(p => ({...p, turno: e.target.value}))}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-gray-700"
              >
                <option value="">Selecione</option>
                <option value="Diurno">Diurno</option>
                <option value="Noturno">Noturno</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">KM Final (Opcional no início)</label>
            <input 
              type="number"
              value={formData.kmFinal}
              onChange={e => setFormData(p => ({...p, kmFinal: e.target.value}))}
              className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-gray-700"
            />
          </div>
        </section>

        {/* Categories */}
        <div className="space-y-4">
          {vehicleChecklistStructure.map(section => {
            const Icon = section.icon;
            const checkedCount = section.items.filter(i => checkedItems[i.id]).length;
            const isAllChecked = checkedCount === section.items.length;

            return (
              <div key={section.id} className={`bg-white rounded-3xl shadow-sm border transition-all ${isAllChecked ? 'border-green-200 bg-green-50/20' : 'border-gray-100'}`}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-2xl ${isAllChecked ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                      <Icon size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-black text-gray-800 uppercase tracking-tight text-sm">{section.title}</h3>
                      <p className="text-[10px] font-bold text-gray-400">{checkedCount} / {section.items.length} itens checados</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {section.items.map(item => (
                    <label key={item.id} className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-gray-50 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={!!checkedItems[item.id]}
                        onChange={() => handleCheck(item.id)}
                        className="w-6 h-6 rounded-lg border-gray-300 text-samu-blue focus:ring-samu-blue/20"
                      />
                      <span className={`text-xs font-bold transition-colors ${checkedItems[item.id] ? 'text-gray-300' : 'text-gray-700'}`}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Observações */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-black uppercase text-samu-blue mb-4">Observações / Avarias Identificadas</h3>
          <textarea 
            value={formData.observacoes}
            onChange={e => setFormData(p => ({...p, observacoes: e.target.value}))}
            placeholder="Relate qualquer problema identificado na viatura..."
            className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-gray-700 min-h-[120px]"
          />
        </section>

        {/* Fotos */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-black uppercase text-samu-blue mb-4 flex items-center gap-2"><Camera size={18}/> Fotos da Viatura</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
             <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-6 bg-samu-blue text-white rounded-2xl gap-2 hover:bg-blue-900 transition-all">
                <Camera size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">Tirar Foto</span>
             </button>
             <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-6 bg-gray-100 text-gray-400 rounded-2xl gap-2 hover:bg-gray-200 transition-all">
                <ImageIcon size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">Galeria</span>
             </button>
             <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" multiple className="hidden" />
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden shadow-sm">
                  <img src={p} className="w-full h-full object-cover" />
                  <button onClick={() => setPhotos(prev => prev.filter((_, idx)=> idx !== i))} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md"><X size={12}/></button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={handleReset} 
            className="py-4 bg-white text-gray-400 border border-gray-200 rounded-2xl font-black uppercase tracking-widest text-[10px]"
          >
            Reset
          </button>
          
          <button 
            onClick={() => generatePDF()}
            className="py-4 bg-gray-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-gray-900 transition-all"
          >
            <Download size={16} /> PDF
          </button>

          <button 
            onClick={() => shareWhatsApp()}
            className="py-4 bg-green-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-green-600 transition-all"
          >
            <Send size={16} /> WhatsApp
          </button>

          <button 
            disabled={submitting}
            onClick={handleSubmit} 
            className="py-4 bg-samu-red text-white rounded-2xl shadow-xl shadow-red-500/20 font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Salvar no Banco'}
          </button>
        </div>
      </main>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
             >
                <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                  <h2 className="text-sm font-black uppercase text-samu-blue">Histórico de Viaturas</h2>
                  <button onClick={() => setShowHistory(false)}><X /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {history.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 font-bold uppercase text-[10px]">Nenhum registro encontrado</div>
                  ) : (
                    history.map(entry => (
                      <div key={entry.id} className="p-4 border border-gray-100 rounded-2xl bg-white shadow-sm flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-samu-blue uppercase">{entry.prefixoPlaca}</p>
                          <p className="text-[10px] text-gray-500 font-bold">{entry.condutor} - {entry.turno}</p>
                          <p className="text-[10px] text-gray-400 font-bold">
                            {(() => {
                              const date = entry.createdAt?.seconds 
                                ? new Date(entry.createdAt.seconds * 1000) 
                                : new Date(entry.date);
                              return date.toLocaleDateString('pt-BR');
                            })()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => setViewingEntry(entry)} className="p-2 text-samu-blue hover:bg-gray-50 rounded-lg"><Eye size={20}/></button>
                           {profile?.role === 'coordenacao' && (
                             <button onClick={async () => {
                               if(window.confirm('Excluir?')) await deleteDoc(doc(db, 'vehicle_checklists', entry.id!));
                             }} className="p-2 text-red-400 hover:bg-gray-50 rounded-lg"><Trash2 size={20}/></button>
                           )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Viewing Detail Modal */}
      <AnimatePresence>
        {viewingEntry && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
             <motion.div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-samu-orange text-white flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase">Detalhes: {viewingEntry.prefixoPlaca}</h2>
                  <button onClick={() => setViewingEntry(null)}><X size={24}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-[8px] font-black uppercase text-gray-400">Condutor</p>
                        <p className="text-xs font-bold">{viewingEntry.condutor}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-[8px] font-black uppercase text-gray-400">Turno</p>
                        <p className="text-xs font-bold">{viewingEntry.turno}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-[8px] font-black uppercase text-gray-400">KM Inicial</p>
                        <p className="text-xs font-bold">{viewingEntry.kmInicial}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-[8px] font-black uppercase text-gray-400">KM Final</p>
                        <p className="text-xs font-bold">{viewingEntry.kmFinal || '---'}</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      {vehicleChecklistStructure.map(section => (
                        <div key={section.id}>
                           <h4 className="text-[10px] font-black uppercase text-samu-red mb-2">{section.title}</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {section.items.map(item => (
                                <div key={item.id} className="flex items-center gap-2 text-[10px] font-bold text-gray-600">
                                   {viewingEntry.checks[item.id] ? <CheckSquare size={14} className="text-green-500" /> : <X size={14} className="text-red-300" />}
                                   <span className={viewingEntry.checks[item.id] ? 'text-gray-800' : 'text-gray-400'}>{item.label}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                      ))}
                   </div>

                   {viewingEntry.observacoes && (
                     <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                        <p className="text-[10px] font-black uppercase text-amber-600 mb-1">Observações</p>
                        <p className="text-xs font-bold text-amber-900">{viewingEntry.observacoes}</p>
                     </div>
                   )}
                </div>
                <div className="p-4 border-t bg-gray-50 flex gap-3">
                   <button onClick={() => shareWhatsApp(viewingEntry)} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><Send size={16}/> WhatsApp</button>
                   <button onClick={() => generatePDF(viewingEntry)} className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><Download size={16}/> PDF</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl z-[1000] flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {toast.type === 'success' ? <CheckSquare className="text-white" /> : <AlertTriangle className="text-white" />}
            <span className="text-white font-black uppercase tracking-widest text-[10px]">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
