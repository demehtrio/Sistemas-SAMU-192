import React, { useState, useEffect, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { Check, X, Clock, Plus, FileText, MessageCircle, Mail, Inbox, Send, LogOut, User, PlusCircle, Ambulance, AlertTriangle, Trash2, AlertCircle, ArrowLeft, History } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { twMerge } from 'tailwind-merge';
import { AdminPanel } from './AdminPanel';
import { SamuLogo } from './components/SamuLogo';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

export class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      let isPermissionError = false;

      try {
        const errorMsg = this.state.error?.message || String(this.state.error);
        if (errorMsg.startsWith('{') && errorMsg.endsWith('}')) {
          const parsed = JSON.parse(errorMsg);
          if (parsed.error) {
            isPermissionError = true;
            const opMap: Record<string, string> = {
              create: "criar",
              update: "atualizar",
              delete: "excluir",
              list: "listar",
              get: "acessar",
              write: "salvar"
            };
            const op = opMap[parsed.operationType] || "acessar";
            errorMessage = `Você não tem permissão para ${op} estes dados. Por favor, verifique seu acesso ou contate a coordenação.`;
          }
        } else {
          errorMessage = errorMsg;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center border-t-4 border-samu-red">
            <AlertCircle className="h-12 w-12 text-samu-red mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {isPermissionError ? 'Acesso Negado' : 'Erro no Aplicativo'}
            </h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-samu-blue text-white py-2 px-4 rounded-md hover:bg-samu-blue-hover transition-colors font-bold"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const SystemSignatureButton: React.FC<{ onClick?: () => void; className?: string; label?: string; loading?: boolean; type?: "button" | "submit" }> = ({ onClick, className, label, loading, type = "button" }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={loading}
    className={twMerge(`flex items-center justify-center px-6 py-3 border-2 border-samu-blue text-xs font-black uppercase tracking-widest rounded-xl text-samu-blue bg-white hover:bg-samu-blue hover:text-white transition-all shadow-sm hover:shadow-lg active:scale-95 disabled:opacity-50`, className)}
  >
    {loading ? (
      <div className="h-5 w-5 border-2 border-current border-t-transparent animate-spin rounded-full mr-2" />
    ) : (
      <Check className="w-5 h-5 mr-2" />
    )}
    {loading ? 'Assinando...' : (label || 'Confirmar e Assinar')}
  </button>
);

export const generatePDF = async (permuta: any) => {
  const doc = new jsPDF();
  
  // Function to get SAMU Logo as Base64 by rendering the SVG to a canvas
  const getSamuLogoBase64 = async (): Promise<string> => {
    return new Promise((resolve) => {
      const svgString = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
    <circle cx="250" cy="250" r="240" fill="#FFFFFF" stroke="#E87C00" stroke-width="8" />
    <path d="M 10,250 A 240,240 0 0,1 490,250 Z" fill="#E87C00" />
    <circle cx="250" cy="250" r="165" fill="#FFFFFF" />
    <circle cx="250" cy="250" r="165" fill="none" stroke="#E87C00" stroke-width="6" />
    <defs>
      <path id="topTextPath" d="M 55,250 A 195,195 0 0,1 445,250" />
      <path id="bottomTextPath" d="M 35,250 A 215,215 0 0,0 465,250" />
    </defs>
    <text fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="26" letter-spacing="2.5">
      <textPath href="#topTextPath" startOffset="50%" text-anchor="middle">SERVIÇO DE ATENDIMENTO MÓVEL DE URGÊNCIA</textPath>
    </text>
    <text fill="#E87C00" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="30" letter-spacing="5">
      <textPath href="#bottomTextPath" startOffset="50%" text-anchor="middle">SISTEMA ÚNICO DE SAÚDE</textPath>
    </text>
    <g transform="translate(250, 250) scale(1.1)">
      <path d="M -20,-110 L 20,-110 L 20,-34.64 L 85.26,-72.32 L 105.26,-37.68 L 40,0 L 105.26,37.68 L 85.26,72.32 L 20,34.64 L 20,110 L -20,110 L -20,34.64 L -85.26,72.32 L -105.26,37.68 L -40,0 L -105.26,-37.68 L -85.26,-72.32 L -20,-34.64 Z" fill="none" stroke="#E87C00" stroke-width="12" stroke-linejoin="round" />
      <path d="M -20,-110 L 20,-110 L 20,-34.64 L 85.26,-72.32 L 105.26,-37.68 L 40,0 L 105.26,37.68 L 85.26,72.32 L 20,34.64 L 20,110 L -20,110 L -20,34.64 L -85.26,72.32 L -105.26,37.68 L -40,0 L -105.26,-37.68 L -85.26,-72.32 L -20,-34.64 Z" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linejoin="round" />
      <path d="M -20,-110 L 20,-110 L 20,-34.64 L 85.26,-72.32 L 105.26,-37.68 L 40,0 L 105.26,37.68 L 85.26,72.32 L 20,34.64 L 20,110 L -20,110 L -20,34.64 L -85.26,72.32 L -105.26,37.68 L -40,0 L -105.26,-37.68 L -85.26,-72.32 L -20,-34.64 Z" fill="#C8102E" />
      <polygon points="0,-85 8,-70 4,-70 4,75 -4,75 -4,-70 -8,-70" fill="#FFFFFF" />
      <path d="M -5,55 C -30,35 -30,-5 0,-15 C 30,-25 30,-60 0,-70 C -15,-75 -20,-90 -10,-100 C -5,-105 5,-105 10,-95" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" />
    </g>
  </svg>`;
      
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 500;
          canvas.height = 500;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve('');
          }
        } catch (e) {
          console.error("Canvas error:", e);
          resolve('');
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => {
        resolve('');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  };

  const samuLogoBase64 = await getSamuLogoBase64();

  // Header Layout
  doc.setFontSize(18);
  doc.setTextColor(200, 16, 46); // SAMU Red
  doc.setFont('helvetica', 'bold');
  doc.text('Termo de Permuta - SAMU 192', 105, 25, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text('BASE SERRA TALHADA - PE', 105, 33, { align: 'center' });
  
  // Thin red line
  doc.setDrawColor(200, 16, 46);
  doc.setLineWidth(0.2);
  doc.line(20, 45, 190, 45);

  // Content
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados da Permuta:', 20, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tipo de Unidade: ${permuta.unitType || 'Não informado'}`, 20, 65);
  doc.text(`Base: ${permuta.base || 'SERRA TALHADA'}`, 20, 72);
  doc.text(`Motivo: ${permuta.reason || 'Não informado'}`, 20, 79);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Solicitante:', 20, 92);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome: ${permuta.requesterName}`, 20, 102);
  doc.text(`Cargo: ${permuta.requesterRole || 'Não informado'}`, 20, 109);
  doc.text(`Data do Plantão: ${permuta.requesterDate || 'Não informado'}`, 20, 116);
  doc.text(`Turno: ${permuta.requesterShift || 'Não informado'}`, 20, 123);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Substituto:', 120, 92);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome: ${permuta.substituteName}`, 120, 102);
  doc.text(`Cargo: ${permuta.substituteRole || 'Não informado'}`, 120, 109);
  doc.text(`Data do Plantão: ${permuta.date}`, 120, 116);
  doc.text(`Turno: ${permuta.shift}`, 120, 123);

  // Second thin red line
  doc.setDrawColor(200, 16, 46);
  doc.line(20, 140, 190, 140);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSINATURAS DIGITAIS:', 20, 150);

  // Digital Signature Block
  const drawSignature = (x: number, y: number, name: string, id: string, date: string) => {
    // Add full SAMU Logo as watermark behind signature
    if (samuLogoBase64) {
      try {
        // Use a simpler approach for watermark if GState is not available or causing issues
        doc.saveGraphicsState();
        const GState = (doc as any).GState;
        if (GState) {
          const gState = new GState({opacity: 0.15});
          doc.setGState(gState);
        }
        doc.addImage(samuLogoBase64, 'PNG', x + 20, y - 5, 25, 25);
        doc.restoreGraphicsState();
      } catch (e) {
        console.warn("Watermark error:", e);
        // Fallback: just draw it small next to it without transparency if GState fails
        try {
          doc.addImage(samuLogoBase64, 'PNG', x, y, 15, 15);
        } catch (e2) {}
      }
    } else {
      // Fallback watermark using jsPDF primitives if image failed to load
      try {
        const GState = (doc as any).GState;
        if (GState) {
          doc.setGState(new GState({opacity: 0.1}));
        }
        doc.setDrawColor(200, 16, 46);
        doc.setFillColor(200, 16, 46);
        doc.circle(x + 32, y + 7, 12, 'F');
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(1.5);
        doc.line(x + 32, y + 1, x + 32, y + 13);
        doc.line(x + 26, y + 7, x + 38, y + 7);
      } catch (e) {}
    }

    const textX = x + 5;
    
    doc.setTextColor(150, 150, 150); // Light Gray
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('DOCUMENTO ASSINADO DIGITALMENTE', textX, y + 2);
    
    doc.setTextColor(0, 0, 0); // Black
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(name.toUpperCase(), textX, y + 6);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(id, textX, y + 10);
    
    doc.setFontSize(7);
    doc.text(`EM ${new Date(date).toLocaleDateString()} - ÀS ${new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, textX, y + 14);
  };

  let sigY = 160;
  if (permuta.requesterSignedAt) {
    const formattedReg = permuta.requesterCoren ? (permuta.requesterCoren.toUpperCase().includes('CPF') ? permuta.requesterCoren : `${permuta.requesterCoren} / `) : '';
    const id = `${formattedReg}CPF ${permuta.requesterCpf || ''}`;
    drawSignature(20, sigY, permuta.requesterName, id, permuta.requesterSignedAt);
    sigY += 25;
  } else {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(20, sigY + 10, 90, sigY + 10);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(permuta.requesterName.toUpperCase(), 55, sigY + 15, { align: 'center' });
    doc.text('Solicitante', 55, sigY + 19, { align: 'center' });
    sigY += 25;
  }
  
  if (permuta.substituteSignedAt) {
    const formattedReg = permuta.substituteCoren ? (permuta.substituteCoren.toUpperCase().includes('CPF') ? permuta.substituteCoren : `${permuta.substituteCoren} / `) : '';
    const id = `${formattedReg}CPF ${permuta.substituteCpf || ''}`;
    drawSignature(20, sigY, permuta.substituteName, id, permuta.substituteSignedAt);
    sigY += 25;
  } else {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(20, sigY + 10, 90, sigY + 10);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(permuta.substituteName.toUpperCase(), 55, sigY + 15, { align: 'center' });
    doc.text('Substituto', 55, sigY + 19, { align: 'center' });
    sigY += 25;
  }
  
  if (permuta.coordinatorSignedAt) {
    const formattedReg = permuta.coordinatorCoren ? (permuta.coordinatorCoren.toUpperCase().includes('CPF') ? permuta.coordinatorCoren : `${permuta.coordinatorCoren} / `) : '';
    const id = `${formattedReg}CPF ${permuta.coordinatorCpf || ''}`;
    drawSignature(20, sigY, `COORDENAÇÃO: ${permuta.coordinatorName}`, id, permuta.coordinatorSignedAt);
  } else {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(20, sigY + 10, 90, sigY + 10);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('COORDENAÇÃO', 55, sigY + 15, { align: 'center' });
  }
  
  doc.save(`Permuta_${permuta.date}_${permuta.requesterName.replace(/\s+/g, '')}.pdf`);
};

const Dashboard: React.FC = () => {
  console.log("Dashboard rendering...");
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [minhasPermutas, setMinhasPermutas] = useState<any[]>([]);
  const [permutasRecebidas, setPermutasRecebidas] = useState<any[]>([]);
  const [permutasCoordenacao, setPermutasCoordenacao] = useState<any[]>([]);
  const [permutasAprovadas, setPermutasAprovadas] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isWaitingForProfile, setIsWaitingForProfile] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => {
        setIsWaitingForProfile(false);
      }, 2000); // reduced to 2s
      return () => clearTimeout(timer);
    } else {
      setIsWaitingForProfile(true);
    }
  }, [authLoading]);

  // Signing state
  const [signingPermutaId, setSigningPermutaId] = useState<string | null>(null);
  const [signingStatus, setSigningStatus] = useState<'approved' | 'rejected' | null>(null);
  const [signingError, setSigningError] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  // Firestore Listener
  useEffect(() => {
    if (!profile) return;

    const q = query(collection(db, 'permutas'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allPermutas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setMinhasPermutas(allPermutas.filter((p: any) => p.requesterId === profile.uid && p.status !== 'aprovada'));
      setPermutasRecebidas(allPermutas.filter((p: any) => 
        p.substituteId === profile.uid && 
        p.status === 'pendente_substituto'
      ));
      
      if (profile.role === 'coordenacao') {
        setPermutasCoordenacao(allPermutas.filter((p: any) => p.status === 'pendente_coordenacao'));
      }

      setPermutasAprovadas(allPermutas.filter((p: any) => 
        (p.status === 'aprovada' || p.status === 'approved') && 
        (profile.role === 'coordenacao' || p.requesterId === profile.uid || p.substituteId === profile.uid)
      ));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'permutas');
    });

    return () => unsubscribe();
  }, [profile]);

  const initiateSign = (permutaId: string, status: 'approved' | 'rejected') => {
    setSigningPermutaId(permutaId);
    setSigningStatus(status);
    setSigningError('');
  };

  const confirmSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !signingPermutaId || !signingStatus) return;
    
    setIsSigning(true);
    setSigningError('');

    try {
      let nextStatus = signingStatus === 'approved' ? 'aprovada' : 'rejeitada';
      
      const updateData: any = {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      };

      if (profile.role === 'coordenacao') {
        updateData.coordinatorSignedAt = new Date().toISOString();
        updateData.coordinatorName = profile.name;
        updateData.coordinatorCpf = profile.cpf || '';
        updateData.coordinatorCoren = profile.registration || profile.coren || '';
      } else {
        if (signingStatus === 'approved') {
          updateData.status = 'pendente_coordenacao';
          updateData.substituteSignedAt = new Date().toISOString();
          updateData.substituteCpf = profile.cpf || '';
          updateData.substituteCoren = profile.registration || profile.coren || '';
        }
      }

      await updateDoc(doc(db, 'permutas', signingPermutaId), updateData);
      
      setSigningPermutaId(null);
      setSigningStatus(null);
      window.dispatchEvent(new CustomEvent('show-success-toast', { detail: "Permuta assinada com sucesso!" }));
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `permutas/${signingPermutaId}`);
      setSigningError("Erro ao assinar. Tente novamente.");
    } finally {
      setIsSigning(false);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeletePermuta = async (permutaId: string) => {
    if (!profile || profile.role !== 'coordenacao') return;
    setDeleteConfirmId(permutaId);
  };

  const confirmDeletePermuta = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteDoc(doc(db, 'permutas', deleteConfirmId));
      window.dispatchEvent(new CustomEvent('show-success-toast', { detail: 'Permuta excluída com sucesso.' }));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `permutas/${deleteConfirmId}`);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const getShareText = (permuta: any) => {
    let text = `*Termo de Permuta - SAMU 192*%0A%0A`;
    if (permuta.unitType) text += `*Unidade:* ${permuta.unitType}%0A%0A`;
    text += `*Solicitante:* ${permuta.requesterName} ${permuta.requesterRole ? `(${permuta.requesterRole})` : ''}%0A`;
    if (permuta.requesterDate) text += `*Data (Solicitante):* ${permuta.requesterDate}%0A`;
    if (permuta.requesterShift) text += `*Turno (Solicitante):* ${permuta.requesterShift}%0A`;
    
    text += `%0A*Substituto:* ${permuta.substituteName} ${permuta.substituteRole ? `(${permuta.substituteRole})` : ''}%0A`;
    text += `*Data (Substituto):* ${permuta.date}%0A`;
    text += `*Turno (Substituto):* ${permuta.shift}%0A`;
    
    text += `%0A*Status:* Assinada/Aprovada`;
    return text;
  };

  const shareWhatsApp = (permuta: any) => {
    const text = getShareText(permuta);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareEmail = (permuta: any) => {
    const subject = `Permuta Aprovada - ${permuta.date} - ${permuta.requesterName} e ${permuta.substituteName}`;
    const body = getShareText(permuta).replace(/%0A/g, '\n').replace(/\*/g, '');
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  if (authLoading || (user && !profile && isWaitingForProfile)) {
    return (
      <div className="min-h-screen bg-samu-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-samu-red"></div>
          <p className="text-samu-blue font-black uppercase tracking-widest text-xs">Carregando seu perfil...</p>
        </div>
      </div>
    );
  }

  if (user && !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-slate-100"
      >
        <div className="bg-orange-100 p-4 rounded-2xl w-fit mx-auto mb-6">
          <User className="h-10 w-10 text-orange-600" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Perfil Incompleto</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Seu cadastro foi iniciado, mas os dados do seu perfil não foram encontrados. 
          Isso pode acontecer se houve uma falha na conexão durante o cadastro.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => window.location.href = '/#/register'}
            className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-xs font-black uppercase tracking-widest text-white bg-orange-600 hover:bg-orange-700 transition-all active:scale-95"
          >
            Tentar Cadastrar Novamente
          </button>
          <button
            onClick={() => signOut()}
            className="w-full flex justify-center py-4 px-6 border border-slate-200 rounded-xl shadow-sm text-xs font-black uppercase tracking-widest text-slate-700 bg-white hover:bg-slate-50 transition-all active:scale-95"
          >
            Sair da Conta
          </button>
        </div>
        <p className="mt-8 text-[10px] text-slate-400 font-mono">
          ID: {user.uid}
        </p>
      </motion.div>
    </div>
    );
  }

  if (!profile) return null; // Safety check

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-all flex items-center justify-center border border-transparent hover:border-slate-200"
                title="Voltar ao Início"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div 
                className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                onClick={() => navigate('/')}
                title="Voltar ao Painel"
              >
                <SamuLogo className="h-10 w-10 object-contain" />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-xl font-black text-samu-blue tracking-tight leading-none">Sistemas SAMU 192</h1>
                <span className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-1">Serra Talhada / PE</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {profile?.role === 'coordenacao' && (
                <button
                  onClick={() => {
                    setIsAdminView(!isAdminView);
                    setIsCreating(false);
                  }}
                  className={twMerge(
                    "hidden sm:flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-sm",
                    isAdminView 
                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      : "bg-samu-red/10 text-samu-red hover:bg-samu-red hover:text-white"
                  )}
                  title="Painel de Administração"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>{isAdminView ? 'Sair Admin' : 'Admin'}</span>
                </button>
              )}
              <div className="hidden sm:flex items-center space-x-3 text-slate-700 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 shadow-inner">
                <div className="w-6 h-6 bg-samu-blue rounded-full flex items-center justify-center text-[10px] text-white font-black">
                  {profile?.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-black uppercase tracking-tight">{profile?.name.split(' ')[0]}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 pb-32 px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {isAdminView ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <AdminPanel />
            </motion.div>
          ) : isCreating ? (
            <motion.div
              key="create"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <CreatePermuta onCancel={() => setIsCreating(false)} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tightest">Gestão de Permutas</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">Controle operacional e trocas de plantões</p>
                </div>
                <button
                  onClick={() => setIsCreating(true)}
                  className="inline-flex items-center px-8 py-4 border border-transparent rounded-2xl shadow-xl hover:shadow-2xl text-xs font-black uppercase tracking-widest text-white bg-samu-orange hover:bg-orange-600 transition-all transform hover:-translate-y-1 active:translate-y-0"
                >
                  <PlusCircle className="mr-3 -ml-1 h-6 w-6" />
                  Nova Permuta
                </button>
              </div>

            {/* Painel da Coordenação */}
            {profile.role === 'coordenacao' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white shadow-2xl shadow-samu-red/5 overflow-hidden rounded-[2rem] border border-samu-red/20"
              >
                <div className="px-8 py-8 bg-gradient-to-r from-red-50 to-white border-b border-red-100 flex items-center justify-between">
                  <div className="flex items-center space-x-5">
                    <div className="bg-samu-red p-4 rounded-2xl shadow-lg shadow-samu-red/20">
                      <Check className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        Aprovações Pendentes
                      </h3>
                      <p className="mt-1 text-slate-500 text-xs font-bold uppercase tracking-widest">
                        Validação final da coordenação
                      </p>
                    </div>
                  </div>
                  <span className="bg-samu-red/10 text-samu-red text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-samu-red/20">Coordenador</span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {permutasCoordenacao.length === 0 ? (
                    <li className="px-8 py-12 text-slate-400 text-sm font-medium italic text-center">Nenhuma permuta aguardando aprovação da coordenação.</li>
                  ) : (
                    permutasCoordenacao.map((p) => (
                      <motion.li 
                        whileHover={{ backgroundColor: "rgba(248, 250, 252, 1)" }}
                        key={p.id} 
                        className="px-8 py-6 transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center space-x-3">
                              {p.unitType && <span className="text-[10px] font-black text-white bg-indigo-600 px-3 py-1 rounded-lg uppercase tracking-widest">{p.unitType}</span>}
                              <p className="text-lg font-black text-slate-900 tracking-tight">
                                {p.requesterName} <span className="text-slate-300 mx-1 font-light">↔</span> {p.substituteName}
                              </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="text-slate-400 uppercase tracking-widest text-[9px] font-bold mb-1">Solicitante</p>
                                <p className="text-slate-900">{p.requesterDate} <span className="text-slate-300">•</span> {p.requesterShift}</p>
                                <p className="text-slate-500 mt-0.5">{p.requesterRole}</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="text-slate-400 uppercase tracking-widest text-[9px] font-bold mb-1">Substituto</p>
                                <p className="text-slate-900">{p.date} <span className="text-slate-300">•</span> {p.shift}</p>
                                <p className="text-slate-500 mt-0.5">{p.substituteRole}</p>
                              </div>
                              {p.reason && (
                                <div className="sm:col-span-2 text-slate-500 bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200 italic">
                                  <span className="font-black not-italic uppercase tracking-tighter mr-2 text-[9px] text-slate-400">Motivo:</span> {p.reason}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {profile?.role === 'coordenacao' && (
                              <button 
                                onClick={() => handleDeletePermuta(p.id)} 
                                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Excluir Permanentemente"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => initiateSign(p.id, 'approved')}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 rounded-xl shadow-lg shadow-green-600/10 text-[10px] font-black uppercase tracking-widest text-white bg-green-600 hover:bg-green-700 transition-all active:scale-95"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => initiateSign(p.id, 'rejected')}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 rounded-xl shadow-lg shadow-red-600/10 text-[10px] font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95"
                            >
                              Rejeitar
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))
                  )}
                </ul>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Permutas Recebidas */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white shadow-xl shadow-slate-200/50 overflow-hidden rounded-[2.5rem] border border-slate-100"
              >
                <div className="px-8 py-8 bg-slate-50 flex items-center space-x-5">
                  <div className="bg-samu-blue p-4 rounded-3xl shadow-lg shadow-samu-blue/20">
                    <Inbox className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Recebidas
                    </h3>
                    <p className="mt-0.5 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      Solicitadas por colegas
                    </p>
                  </div>
                </div>
                <ul className="divide-y divide-slate-50">
                  {permutasRecebidas.length === 0 ? (
                    <li className="px-8 py-16 text-slate-400 text-sm font-medium italic text-center">Nenhuma permuta recebida.</li>
                  ) : (
                    permutasRecebidas.map((p) => (
                      <li key={p.id} className="px-8 py-8 hover:bg-slate-50/50 transition-all">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                  <User className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-900 tracking-tight">{p.requesterName}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">{p.requesterRole}</p>
                                </div>
                              </div>
                              {p.unitType && <span className="text-[9px] font-black text-samu-orange bg-samu-orange/10 px-3 py-1 rounded-full border border-samu-orange/20 uppercase tracking-widest">{p.unitType}</span>}
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 gap-4 border border-slate-100">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sua Escala</p>
                                <p className="text-xs font-bold text-slate-900">{p.date}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{p.shift}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Solicitante</p>
                                <p className="text-xs font-bold text-slate-900">{p.requesterDate}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{p.requesterShift}</p>
                              </div>
                            </div>
                          
                          <div className="flex items-center justify-between gap-4 pt-2">
                            {p.status === 'pending' || p.status === 'pendente_substituto' ? (
                              <div className="flex items-center gap-3 w-full">
                                <button
                                  onClick={() => initiateSign(p.id, 'approved')}
                                  className="flex-1 py-3 bg-samu-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-samu-blue/10 hover:bg-samu-blue-hover active:scale-95 transition-all"
                                >
                                  Aceitar
                                </button>
                                <button
                                  onClick={() => initiateSign(p.id, 'rejected')}
                                  className="flex-1 py-3 bg-white text-slate-400 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-red-500 hover:border-red-100 active:scale-95 transition-all"
                                >
                                  Recusar
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <span className={twMerge(
                                  "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border",
                                  p.status === 'aprovada' || p.status === 'approved' ? 'bg-green-50 text-green-600 border-green-100' : 
                                  p.status === 'pendente_coordenacao' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                  'bg-red-50 text-red-600 border-red-100'
                                )}>
                                  {p.status === 'aprovada' || p.status === 'approved' ? 'Aprovada' : 
                                   p.status === 'pendente_coordenacao' ? 'Aguardando Coord' :
                                   'Rejeitada'}
                                </span>
                                <div className="flex gap-2">
                                  {p.status.includes('aprov') && (
                                    <div className="flex gap-1.5 focus-within:ring-2 focus-within:ring-slate-100 rounded-full p-1">
                                      <button onClick={() => generatePDF(p)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all" title="Gerar PDF">
                                        <FileText className="h-4 w-4" />
                                      </button>
                                      <button onClick={() => shareWhatsApp(p)} className="p-2 text-green-500 hover:bg-green-50 rounded-xl transition-all" title="WhatsApp">
                                        <MessageCircle className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                  {profile?.role === 'coordenacao' && (
                                    <button 
                                      onClick={() => handleDeletePermuta(p.id)} 
                                      className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                                      title="Excluir"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </motion.div>

              {/* Minhas Solicitações */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white shadow-xl shadow-slate-200/50 overflow-hidden rounded-[2.5rem] border border-slate-100"
              >
                <div className="px-8 py-8 bg-slate-50 flex items-center space-x-5">
                  <div className="bg-samu-orange p-4 rounded-3xl shadow-lg shadow-samu-orange/20">
                    <Send className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Minhas Trocas
                    </h3>
                    <p className="mt-0.5 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      Iniciadas por você
                    </p>
                  </div>
                </div>
                <ul className="divide-y divide-slate-50">
                  {minhasPermutas.length === 0 ? (
                    <li className="px-8 py-16 text-slate-400 text-sm font-medium italic text-center">Nenhuma solicitação enviada.</li>
                  ) : (
                    minhasPermutas.map((p) => (
                      <li key={p.id} className="px-8 py-8 hover:bg-slate-50/50 transition-all">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                  <User className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-900 tracking-tight">{p.substituteName}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">{p.substituteRole}</p>
                                </div>
                              </div>
                              {p.unitType && <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 uppercase tracking-widest">{p.unitType}</span>}
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 gap-4 border border-slate-100">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Carga Horária</p>
                                <p className="text-xs font-bold text-slate-900">{p.date}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{p.shift}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sua Escala</p>
                                <p className="text-xs font-bold text-slate-900">{p.requesterDate}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{p.requesterShift}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between w-full">
                                <span className={twMerge(
                                  "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border",
                                  p.status === 'aprovada' || p.status === 'approved' ? 'bg-green-50 text-green-600 border-green-100' : 
                                  p.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 
                                  p.status === 'pendente_coordenacao' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                  'bg-yellow-50 text-yellow-600 border-yellow-100 shadow-inner'
                                )}>
                                  {p.status === 'aprovada' || p.status === 'approved' ? 'Aprovada' : 
                                   p.status === 'rejected' ? 'Rejeitada' : 
                                   p.status === 'pendente_coordenacao' ? 'Aguardando Coord' :
                                   'Aguardando Colega'}
                                </span>
                                <div className="flex gap-2">
                                  {p.status.includes('aprov') && (
                                    <div className="flex gap-1.5 focus-within:ring-2 focus-within:ring-slate-100 rounded-full p-1">
                                      <button onClick={() => generatePDF(p)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all" title="Gerar PDF">
                                        <FileText className="h-4 w-4" />
                                      </button>
                                      <button onClick={() => shareWhatsApp(p)} className="p-2 text-green-500 hover:bg-green-50 rounded-xl transition-all" title="WhatsApp">
                                        <MessageCircle className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                  {profile?.role === 'coordenacao' && (
                                    <button 
                                      onClick={() => handleDeletePermuta(p.id)} 
                                      className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                                      title="Excluir"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                            </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </motion.div>
            </div>

            {/* Histórico de Permutas Aprovadas */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white shadow-2xl shadow-slate-200/50 overflow-hidden rounded-[2.5rem] border border-slate-100"
            >
              <div className="px-8 py-10 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center space-x-6">
                  <div className="bg-green-500 p-5 rounded-3xl shadow-xl shadow-green-500/20">
                    <History className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                      Histórico
                    </h3>
                    <p className="mt-1 text-slate-400 text-xs font-bold uppercase tracking-widest">
                      Permutas validadas oficialmente
                    </p>
                  </div>
                </div>
                <span className="bg-slate-50 text-slate-500 text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest border border-slate-100 shadow-sm">
                  {permutasAprovadas.length} Registros
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-slate-50/50 border-y border-slate-100">
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Unidade</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipe Envolvida</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Documentação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {permutasAprovadas.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-8 py-20 text-center text-slate-300 text-sm font-medium italic">Nenhum registro encontrado.</td>
                      </tr>
                    ) : (
                      permutasAprovadas.map((p) => (
                        <motion.tr 
                          whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.5)" }}
                          key={p.id} 
                          className="group transition-all"
                        >
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-900 tracking-tight">{p.date}</span>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md uppercase border border-indigo-100">{p.unitType}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{p.shift}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                              <div className="flex -space-x-3">
                                <div className="w-9 h-9 rounded-2xl bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center text-samu-blue font-black text-xs ring-4 ring-white" title={p.requesterName}>
                                  {p.requesterName.charAt(0)}
                                </div>
                                <div className="w-9 h-9 rounded-2xl bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center text-samu-orange font-black text-xs ring-4 ring-white" title={p.substituteName}>
                                  {p.substituteName.charAt(0)}
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900">{p.requesterName.split(' ')[0]} ↔ {p.substituteName.split(' ')[0]}</span>
                                <span className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">{p.requesterRole}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap text-right">
                            <div className="flex justify-end gap-2 group-hover:opacity-100 sm:opacity-50 transition-opacity">
                              <button 
                                onClick={() => generatePDF(p)} 
                                className="p-3 bg-white text-slate-400 hover:text-samu-blue hover:bg-slate-50 rounded-2xl border border-slate-100 shadow-sm transition-all active:scale-95"
                                title="Baixar Termo"
                              >
                                <FileText className="h-5 w-5" />
                              </button>
                              <button 
                                onClick={() => shareWhatsApp(p)} 
                                className="p-3 bg-white text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-2xl border border-slate-100 shadow-sm transition-all active:scale-95"
                                title="Compartilhar"
                              >
                                <MessageCircle className="h-5 w-5" />
                              </button>
                              {profile?.role === 'coordenacao' && (
                                <button 
                                  onClick={() => handleDeletePermuta(p.id)} 
                                  className="p-3 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl border border-slate-100 shadow-sm transition-all active:scale-95"
                                  title="Remover"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>

      {/* Digital Signature Confirmation Modal */}
      <AnimatePresence>
        {signingPermutaId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100"
            >
              <div className="p-8 text-center bg-gradient-to-b from-slate-50 to-white">
                <div className="bg-samu-blue/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Check className="h-8 w-8 text-samu-blue" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Assinatura Digital</h3>
                <p className="mt-2 text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                  Validação via Google Auth
                </p>

                <div className="mt-8 p-6 border-2 border-dashed border-samu-blue/20 rounded-3xl bg-blue-50/50 relative overflow-hidden group">
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                    <SamuLogo className="w-32 h-32" />
                  </div>
                  <div className="flex flex-col items-center relative z-10">
                    <div className="bg-white p-2 rounded-xl shadow-sm mb-4 border border-blue-100">
                      <SamuLogo className="h-8 w-8 object-contain" />
                    </div>
                    <p className="text-[9px] text-samu-blue font-black tracking-[0.2em] uppercase mb-4 opacity-60">Autenticação Segura</p>
                    <p className="text-lg font-black text-slate-900 leading-tight">{profile?.name.toUpperCase()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        {profile?.coren ? `${profile.coren} • ` : ''}CPF {profile?.cpf}
                      </span>
                    </div>
                    <div className="h-px w-12 bg-blue-200 my-4" />
                    <p className="text-[9px] text-slate-400 font-mono uppercase tracking-tighter">
                      {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {signingError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                  >
                    {signingError}
                  </motion.div>
                )}

                <div className="mt-8 space-y-3">
                  <SystemSignatureButton 
                    onClick={confirmSign as any}
                    loading={isSigning}
                    className="w-full py-5 rounded-2xl shadow-xl shadow-samu-blue/20"
                  />
                  <button
                    type="button"
                    onClick={() => setSigningPermutaId(null)}
                    className="w-full py-4 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-[0.2em]"
                  >
                    Desistir e Voltar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100"
            >
              <div className="bg-red-50 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Excluir Permuta?</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">Esta ação removerá permanentemente o registro do sistema. Esta ação não poderá ser desfeita.</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-6 py-4 text-[10px] font-black text-slate-400 border border-slate-200 rounded-2xl hover:bg-slate-50 active:scale-95 transition-all uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeletePermuta}
                  className="flex-1 px-6 py-4 text-[10px] font-black text-white bg-red-600 rounded-2xl shadow-lg shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all uppercase tracking-widest"
                >
                   Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CreatePermuta: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [substituteId, setSubstituteId] = useState('');
  const [requesterRole, setRequesterRole] = useState('');
  const [substituteRole, setSubstituteRole] = useState('');
  const [requesterDate, setRequesterDate] = useState('');
  const [requesterShift, setRequesterShift] = useState('');
  const [date, setDate] = useState('');
  const [shift, setShift] = useState('');
  const [reason, setReason] = useState('');
  const [unitType, setUnitType] = useState('');
  const [base, setBase] = useState('');
  const [loading, setLoading] = useState(false);

  const SAMU_ROLES = [
    "Médico(a)",
    "Enfermeiro(a)",
    "Técnico(a) de Enfermagem",
    "Condutor(a) Socorrista",
    "TARM",
    "Rádio Operador(a)",
    "Coordenador(a) / Administrativo"
  ];

  const UNIT_TYPES = ["USA", "USB", "MOTOLÂNCIA", "VIR", "CENTRAL"];

  useEffect(() => {
    if (profile?.cargo) {
      setRequesterRole(profile.cargo);
    }
    if (profile?.base) {
      setBase(profile.base);
    }
  }, [profile]);

  useEffect(() => {
    if (substituteId) {
      const substitute = users.find(u => u.id === substituteId);
      if (substitute?.cargo) {
        setSubstituteRole(substitute.cargo);
      }
    }
  }, [substituteId, users]);

  useEffect(() => {
    if (!profile) return;
    
    // Load users from Firestore
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mappedUsers = snapshot.docs.map((d: any) => {
        const u = d.data();
        return {
          id: d.id,
          name: u.name,
          cargo: u.cargo || u.role,
          base: u.base || 'Serra Talhada',
          cpf: u.cpf,
          coren: u.registration || u.coren || ''
        };
      });
      setUsers(mappedUsers.filter((u: any) => u.id !== profile?.uid));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    try {
      const substitute = users.find(u => u.id === substituteId);
      if (!substitute) throw new Error("Substituto não encontrado");

      const newPermuta = {
        unitType,
        base,
        requesterId: profile.uid,
        requesterName: profile.name,
        requesterRole,
        requesterDate,
        requesterShift,
        requesterCpf: profile.cpf || '',
        requesterCoren: profile.registration || profile.coren || '',
        substituteId: substitute.id,
        substituteName: substitute.name,
        substituteRole,
        substituteCpf: substitute.cpf || '',
        substituteCoren: substitute.coren || '',
        date,
        shift,
        reason,
        status: 'pendente_substituto',
        requesterSignedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'permutas'), newPermuta);

      window.dispatchEvent(new CustomEvent('show-success-toast', { detail: "Permuta solicitada com sucesso!" }));
      onCancel();
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'permutas');
      window.dispatchEvent(new CustomEvent('show-error-toast', { detail: "Erro ao criar permuta." }));
    } finally {
      setLoading(false);
    }
  };

  const handleSavePDF = async () => {
    if (!substituteId || !date || !shift || !reason || !unitType || !base || !requesterDate || !requesterShift) {
      window.dispatchEvent(new CustomEvent('show-error-toast', { detail: "Preencha todos os campos antes de salvar em PDF." }));
      return;
    }

    const substitute = users.find(u => u.id === substituteId);
    if (!substitute) return;

    const tempPermuta = {
      unitType,
      base,
      requesterId: profile!.uid,
      requesterName: profile!.name,
      requesterRole,
      requesterCpf: profile!.cpf || '',
      requesterCoren: profile!.registration || profile!.coren || '',
      requesterDate,
      requesterShift,
      substituteId: substitute.id,
      substituteName: substitute.name,
      substituteRole,
      substituteCpf: substitute.cpf || '',
      substituteCoren: substitute.coren || '',
      date,
      shift,
      reason,
      status: 'rascunho',
      createdAt: new Date().toISOString()
    };

    try {
      await generatePDF(tempPermuta);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      window.dispatchEvent(new CustomEvent('show-error-toast', { detail: "Erro ao gerar PDF." }));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto pb-20"
    >
      <div className="bg-white shadow-2xl shadow-slate-200/50 rounded-[3rem] overflow-hidden border border-slate-100">
        <div className="px-10 py-12 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="bg-samu-orange p-5 rounded-3xl shadow-xl shadow-samu-orange/20">
                <PlusCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Nova Solicitação</h2>
                <p className="mt-1 text-slate-400 text-xs font-bold uppercase tracking-widest">Preencha os detalhes da troca de plantão</p>
              </div>
            </div>
            <button 
              onClick={onCancel}
              className="p-4 hover:bg-slate-200 rounded-2xl text-slate-400 transition-all active:scale-90"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-10 space-y-12">
          {/* Seção 1: Localização */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">01</span>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Unidade e Base</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Unidade</label>
                <select
                  required
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value)}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-samu-blue/10 focus:border-samu-blue outline-none transition-all font-bold text-slate-700"
                >
                  <option value="">Selecione...</option>
                  {UNIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base / Localidade</label>
                <input
                  required
                  placeholder="Ex: Serra Talhada"
                  value={base}
                  onChange={(e) => setBase(e.target.value)}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-samu-blue/10 focus:border-samu-blue outline-none transition-all font-bold text-slate-700"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
            {/* Seção 2: Solicitante */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-samu-blue text-white flex items-center justify-center text-[10px] font-black">02</span>
                <h3 className="text-sm font-black text-samu-blue uppercase tracking-widest">Dados do Solicitante (Você)</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Nome Completo</p>
                  <p className="text-sm font-black text-slate-900">{profile?.name.toUpperCase()}</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sua Função</label>
                  <select
                    required
                    value={requesterRole}
                    onChange={(e) => setRequesterRole(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-samu-blue/10 focus:border-samu-blue outline-none transition-all font-bold text-slate-700"
                  >
                    <option value="">Selecione sua função...</option>
                    {SAMU_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sua Data</label>
                    <input
                      type="date"
                      required
                      value={requesterDate}
                      onChange={(e) => setRequesterDate(e.target.value)}
                      className="w-full px-3 sm:px-5 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-samu-blue/10 focus:border-samu-blue outline-none transition-all font-bold text-xs sm:text-sm text-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu Turno</label>
                    <select
                      required
                      value={requesterShift}
                      onChange={(e) => setRequesterShift(e.target.value)}
                      className="w-full px-3 sm:px-5 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-samu-blue/10 focus:border-samu-blue outline-none transition-all font-bold text-xs sm:text-sm text-slate-700"
                    >
                      <option value="">Turno...</option>
                      <option value="Diurno">Diurno</option>
                      <option value="Noturno">Noturno</option>
                      <option value="Plantão 24h">Plantão 24h</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 3: Substituto */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-samu-orange text-white flex items-center justify-center text-[10px] font-black">03</span>
                <h3 className="text-sm font-black text-samu-orange uppercase tracking-widest">Dados do Substituto</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Colega Substituto</label>
                  <select
                    required
                    value={substituteId}
                    onChange={(e) => setSubstituteId(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-samu-orange/10 focus:border-samu-orange outline-none transition-all font-bold text-slate-700"
                  >
                    <option value="">Selecione o colega...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Função do Substituto</label>
                  <select
                    required
                    value={substituteRole}
                    onChange={(e) => setSubstituteRole(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-samu-orange/10 focus:border-samu-orange outline-none transition-all font-bold text-slate-700"
                  >
                    <option value="">Selecione a função dele...</option>
                    {SAMU_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data do Colega</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 sm:px-5 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-samu-orange/10 focus:border-samu-orange outline-none transition-all font-bold text-xs sm:text-sm text-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turno do Colega</label>
                    <select
                      required
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      className="w-full px-3 sm:px-5 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-samu-orange/10 focus:border-samu-orange outline-none transition-all font-bold text-xs sm:text-sm text-slate-700"
                    >
                      <option value="">Turno...</option>
                      <option value="Diurno">Diurno</option>
                      <option value="Noturno">Noturno</option>
                      <option value="Plantão 24h">Plantão 24h</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">04</span>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Justificativa</h3>
            </div>
            <textarea
              required
              rows={3}
              placeholder="Descreva o motivo da solicitação de permuta..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-samu-blue/10 focus:border-samu-blue outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300 resize-none"
            />
          </div>

          <div className="pt-8 flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-5 px-10 bg-samu-blue text-white rounded-[1.5rem] shadow-2xl shadow-samu-blue/20 hover:bg-samu-blue-hover active:scale-95 transition-all text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center"
            >
              {loading ? (
                <div className="h-5 w-5 border-3 border-white border-t-transparent animate-spin rounded-full" />
              ) : (
                <>
                  <Check className="w-5 h-5 mr-3" />
                  Enviar Solicitação
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleSavePDF}
              className="flex-1 py-5 px-10 bg-white text-samu-orange border border-samu-orange/20 rounded-[1.5rem] hover:bg-orange-50 active:scale-95 transition-all text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center"
            >
              <FileText className="w-5 h-5 mr-3" />
              Salvar PDF
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-5 px-10 bg-white text-slate-400 border border-slate-200 rounded-[1.5rem] hover:bg-slate-50 active:scale-95 transition-all text-[11px] font-black uppercase tracking-[0.2em]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 text-center p-8 bg-samu-blue/5 rounded-[2rem] border border-samu-blue/10">
        <p className="text-[10px] text-samu-blue/60 font-black uppercase tracking-[0.3em]">Importante</p>
        <p className="mt-2 text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
          Ao enviar esta solicitação, uma notificação será registrada no sistema. A troca só terá validade oficial após a assinatura de ambas as partes e homologação da coordenação.
        </p>
      </div>
    </motion.div>
  );
};

export default Dashboard;
