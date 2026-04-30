import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { SamuLogo } from './components/SamuLogo';
import { useAuth } from './AuthContext';

export const Signup: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cargo, setCargo] = useState('');
  const [base, setBase] = useState('');
  const [cpf, setCpf] = useState('');
  const [coren, setCoren] = useState('');
  const [role, setRole] = useState<'servidor' | 'coordenacao'>('servidor');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setCargo(profile.cargo || '');
      setBase(profile.base || '');
      setCpf(profile.cpf || '');
      setCoren(profile.coren || '');
      setRole((profile.role as any) || 'servidor');
    }
  }, [profile]);

  const SAMU_ROLES = [
    "Médico(a)",
    "Enfermeiro(a)",
    "Técnico(a) de Enfermagem",
    "Condutor(a) Socorrista",
    "TARM",
    "Rádio Operador(a)",
    "Coordenador(a) / Administrativo"
  ];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updatedData = {
        name: name.trim(),
        email: email.trim(),
        role,
        cargo,
        base: base.trim(),
        cpf: cpf.trim(),
        coren: coren.trim(),
      };
      
      updateProfile(updatedData);

      // Also update registry for substitute selection
      const savedProfiles = localStorage.getItem('samu_users_registry');
      let registry = savedProfiles ? JSON.parse(savedProfiles) : [];
      const myId = profile?.uid || 'local-user';
      
      registry = registry.filter((u: any) => u.id !== myId);
      registry.push({
        id: myId,
        name: updatedData.name,
        cargo: updatedData.cargo,
        base: updatedData.base,
        cpf: updatedData.cpf
      });
      localStorage.setItem('samu_users_registry', JSON.stringify(registry));

      setSuccess('Perfil atualizado com sucesso! Redirecionando...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      console.error("Signup error:", err);
      setError('Falha ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Acesso Negado</h2>
          <p className="text-gray-600 mt-2">Erro ao carregar perfil local.</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-2 bg-samu-blue text-white rounded-lg font-bold"
          >
            Voltar para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <div className="bg-white p-2 rounded-full shadow-md mb-4">
            <SamuLogo className="h-20 w-20 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-samu-blue">SAMU 192</h1>
          <h2 className="text-sm font-bold text-samu-orange tracking-widest uppercase">Base Serra Talhada</h2>
        </div>
        <h3 className="mt-6 text-center text-2xl font-extrabold text-gray-900">
          Complete seu Cadastro
        </h3>
        <p className="mt-2 text-center text-sm text-gray-600">
          Olá, <strong>{profile?.name}</strong>. <br/>
          Atualize suas informações para os documentos localmente.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSignup}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}
            <div className="grid grid-cols-1 gap-y-6 gap-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-samu-blue focus:border-samu-blue sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1">
                  <input
                    type="email"
                    readOnly
                    value={email}
                    className="appearance-none block w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-md shadow-sm sm:text-sm cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">CPF</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-samu-blue focus:border-samu-blue sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">CRM / COREN / MATRÍCULA</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={coren}
                    onChange={(e) => setCoren(e.target.value)}
                    placeholder="ex.: COREN 00000"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-samu-blue focus:border-samu-blue sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cargo</label>
                <div className="mt-1">
                  <select
                    required
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-samu-blue focus:border-samu-blue sm:text-sm"
                  >
                    <option value="">Selecione seu cargo...</option>
                    {SAMU_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Base</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={base}
                    onChange={(e) => setBase(e.target.value)}
                    placeholder="Base Serra Talhada"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-samu-blue focus:border-samu-blue sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Conta</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('servidor')}
                  className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${role === 'servidor' ? 'bg-samu-blue text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  Servidor
                </button>
                <button
                  type="button"
                  onClick={() => setRole('coordenacao')}
                  className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${role === 'coordenacao' ? 'bg-samu-red text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  Coordenação
                </button>
              </div>
              <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase text-center tracking-tighter">A coordenação validará seu acesso administrativo</p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-black uppercase tracking-widest text-white bg-samu-blue hover:bg-samu-blue-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samu-blue disabled:opacity-50 transition-all transform active:scale-95"
              >
                {loading ? 'Processando...' : 'Finalizar Cadastro'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
