import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ClipboardCheck, LogOut, User, Settings, Calendar, ExternalLink, Edit2, Check, X as CloseX, Truck } from 'lucide-react';
import { useAuth } from './AuthContext';
import { SamuLogo } from './components/SamuLogo';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';
import { motion, AnimatePresence } from 'motion/react';

export const Home: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [escalaLink, setEscalaLink] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [newLink, setNewLink] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'escala'), (docSnap) => {
      if (docSnap.exists()) {
        setEscalaLink(docSnap.data().escalaLink || '');
        setNewLink(docSnap.data().escalaLink || '');
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching settings:', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpdateLink = async () => {
    if (!newLink) return;
    try {
      await setDoc(doc(db, 'settings', 'escala'), {
        escalaLink: newLink,
        updatedAt: serverTimestamp(),
        updatedBy: profile?.name || 'Admin'
      }, { merge: true });
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/escala');
    }
  };

  const systems = [
    {
      id: 'permutas',
      title: 'Gestão de Permutas',
      description: 'Solicitação e assinatura digital de trocas de plantão.',
      icon: FileText,
      color: 'bg-samu-blue',
      path: '/permutas'
    },
    {
      id: 'checklist-materiais',
      title: 'Checklist de Salão',
      description: 'Conferência diária de equipamentos e materiais (USA/USB).',
      icon: ClipboardCheck,
      color: 'bg-samu-red',
      path: '/checklist'
    },
    {
      id: 'checklist-vtr',
      title: 'Checklist VTR',
      description: 'Checklist mecânico, elétrico e itens de segurança do veículo.',
      icon: Truck,
      color: 'bg-samu-orange',
      path: '/checklist-viatura'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-samu-blue shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-1 rounded-full">
                <SamuLogo className="h-10 w-10" />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-xl font-black text-white tracking-tight">Sistemas SAMU 192</h1>
                <span className="text-[10px] text-samu-orange font-black tracking-widest uppercase">Base Serra Talhada/PE</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-white bg-white/20 px-3 py-1.5 rounded-full">
                <User className="h-4 w-4" />
                <span className="text-xs font-bold uppercase">{profile?.name.split(' ')[0]}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="text-white hover:text-samu-orange transition-colors"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-samu-blue uppercase tracking-tight mb-2">Painel de Sistemas</h2>
          <p className="text-gray-500 font-medium">Selecione o módulo que deseja acessar hoje.</p>
        </div>

        {/* Banner Escalas */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12 bg-gradient-to-r from-samu-blue to-blue-700 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Calendar size={120} />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                <Calendar size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Escalas de Serviço</h3>
                <p className="text-blue-100 text-sm font-medium">Confira a escala atualizada do mês.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isEditing ? (
                <div className="flex items-center bg-white rounded-xl p-1 shadow-inner w-full md:w-auto">
                  <input 
                    type="text" 
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="Cole o link da escala aqui..."
                    className="bg-transparent border-none text-gray-900 text-sm px-4 py-2 w-full md:w-64 focus:ring-0 placeholder:text-gray-300 font-bold"
                  />
                  <button 
                    onClick={handleUpdateLink}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Check size={20} />
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <CloseX size={20} />
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    disabled={!escalaLink}
                    onClick={() => escalaLink && window.open(escalaLink, '_blank')}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black uppercase text-sm tracking-widest transition-all
                      ${escalaLink 
                        ? 'bg-samu-orange text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20 active:scale-95' 
                        : 'bg-white/10 text-white/50 cursor-not-allowed'}`}
                  >
                    Visualizar Escala
                    <ExternalLink size={18} />
                  </button>
                  
                  {profile?.role === 'coordenacao' && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
                      title="Editar Link"
                    >
                      <Edit2 size={20} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {systems.map((system, idx) => (
            <motion.button
              key={system.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => navigate(system.path)}
              className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center text-center group hover:scale-105 transition-all active:scale-95"
            >
              <div className={`p-6 rounded-2xl ${system.color} text-white mb-6 group-hover:rotate-6 transition-transform shadow-lg`}>
                <system.icon size={48} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">{system.title}</h3>
              <p className="text-gray-500 font-medium max-w-[200px]">{system.description}</p>
              
              <div className="mt-8 flex items-center text-samu-blue font-black uppercase text-xs tracking-widest gap-2">
                Acessar Sistema
                <span className="bg-gray-100 p-2 rounded-full group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <Settings size={12} />
            Versão Integrada 1.0.0
          </div>
        </div>
      </main>
    </div>
  );
};
