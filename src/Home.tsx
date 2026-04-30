import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ClipboardCheck, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from './AuthContext';
import { SamuLogo } from './components/SamuLogo';
import { motion } from 'motion/react';

export const Home: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

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
      id: 'checklist',
      title: 'Checklist de Viaturas',
      description: 'Conferência diária de equipamentos e materiais (USA/USB).',
      icon: ClipboardCheck,
      color: 'bg-samu-red',
      path: '/checklist'
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
