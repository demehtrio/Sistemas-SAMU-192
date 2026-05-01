import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ShieldCheck, LogOut } from 'lucide-react';
import { SamuLogo } from './components/SamuLogo';
import { useAuth } from './AuthContext';

export const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { user, profile, registerProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    registration: '',
    cpf: '',
    cargo: 'Enfermeiro',
    role: 'servidor' as 'servidor' | 'coordenacao',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (profile) {
      navigate('/');
    } else {
      // Pre-fill name from Google if available
      setFormData(prev => ({
        ...prev,
        name: user.displayName || ''
      }));
    }
  }, [user, profile, navigate]);

  const cargos = [
    'Médico(a)',
    'Enfermeiro(a)',
    'Técnico(a) em Enfermagem',
    'Condutor(a) Socorrista',
    'TARP (Telefonista)',
    'Rádio Operador(a)',
    'Administrativo',
    'Serviços Gerais'
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.registration || !formData.cpf) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    setLoading(true);
    
    const success = await registerProfile({
      name: formData.name,
      email: user?.email || '',
      registration: formData.registration,
      cpf: formData.cpf,
      cargo: formData.cargo,
      role: formData.role
    });

    if (success) {
      navigate('/');
    } else {
      setError('Erro ao salvar perfil. Tente novamente.');
    }
    
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center flex-col items-center">
          <div className="bg-white p-2 rounded-full shadow-md mb-4">
            <SamuLogo className="h-24 w-24 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-samu-blue">Concluir Perfil</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Olá, {user.email}</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-3xl sm:px-10 border border-gray-100">
          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block text-xs font-black text-samu-blue uppercase tracking-widest mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-samu-blue focus:ring-2 focus:ring-samu-blue/10 outline-none transition-all font-medium text-sm"
                placeholder="Ex: João da Silva"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-samu-blue uppercase tracking-widest mb-1">
                  Função / Cargo
                </label>
                <select
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-samu-blue focus:ring-2 focus:ring-samu-blue/10 outline-none transition-all font-medium text-sm bg-white"
                >
                  {cargos.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-samu-blue uppercase tracking-widest mb-1">
                  Perfil de Acesso
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-samu-blue focus:ring-2 focus:ring-samu-blue/10 outline-none transition-all font-medium text-sm bg-white"
                >
                  <option value="servidor">Servidor (Padrão)</option>
                  <option value="coordenacao">Coordenação (Admin)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-samu-blue uppercase tracking-widest mb-1">
                CPF
              </label>
              <input
                type="text"
                required
                value={formData.cpf}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length > 11) val = val.slice(0, 11);
                  if (val.length > 9) val = val.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                  else if (val.length > 6) val = val.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
                  else if (val.length > 3) val = val.replace(/(\d{3})(\d{1,3})/, "$1.$2");
                  setFormData({ ...formData, cpf: val });
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-samu-blue focus:ring-2 focus:ring-samu-blue/10 outline-none transition-all font-medium text-sm"
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-samu-blue uppercase tracking-widest mb-1">
                Registro Profissional (CRM/COREN/MATRÍCULA)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.registration}
                  onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-samu-blue focus:ring-2 focus:ring-samu-blue/10 outline-none transition-all font-medium text-sm"
                  placeholder="Ex: COREN 123456"
                />
                <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              </div>
            </div>

            {error && (
              <p className="text-[10px] font-bold text-samu-red uppercase tracking-tight bg-red-50 p-2 rounded-lg text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-black uppercase tracking-widest text-white bg-samu-blue hover:bg-samu-blue-hover focus:outline-none disabled:opacity-50 transition-all transform active:scale-95"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus size={18} />
                  Concluir Cadastro
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => signOut()}
              className="w-full flex justify-center items-center gap-2 py-3 text-xs font-bold text-gray-400 hover:text-samu-red transition-all uppercase tracking-widest"
            >
              <LogOut size={14} />
              Usar outra conta
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
