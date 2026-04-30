export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'servidor' | 'coordenacao';
  cargo: string;
  base: string;
  cpf: string;
  coren?: string;
  createdAt: string;
}

export interface PermutaData {
  id?: string;
  unitType: 'USA' | 'USB';
  base: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  requesterDate: string;
  requesterShift: string;
  requesterCpf: string;
  requesterCoren?: string;
  
  substituteId: string;
  substituteName: string;
  substituteRole: string;
  substituteCpf?: string;
  substituteCoren?: string;
  date: string;
  shift: string;
  reason?: string;
  
  status: 'pendente_substituto' | 'pendente_coordenacao' | 'aprovada' | 'rejeitada';
  requesterSignedAt?: string;
  substituteSignedAt?: string;
  coordinatorSignedAt?: string;
  coordinatorName?: string;
  coordinatorCpf?: string;
  coordinatorCoren?: string;

  assinaturaSolicitante?: {
    cpf: string;
    timestamp: string;
  };
  assinaturaSubstituto?: {
    cpf: string;
    timestamp: string;
  };
  assinaturaCoordenacao?: {
    cpf: string;
    timestamp: string;
  };
  
  updatedAt?: string;
  createdAt: string;
}

export interface NotificationData {
  id?: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  permutaId?: string;
}
