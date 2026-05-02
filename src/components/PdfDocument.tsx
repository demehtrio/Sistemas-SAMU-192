import React, { forwardRef } from 'react';
import { PermutaData } from '../types';

interface PdfDocumentProps {
  data: PermutaData;
}

export const PdfDocument = forwardRef<HTMLDivElement, PdfDocumentProps>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-white p-12 text-black w-[800px] mx-auto font-serif"
        style={{ minHeight: '1131px', position: 'absolute', top: '-10000px', left: '-10000px' }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-6 mb-8 flex flex-col items-center">
          <img 
            src="https://i.pinimg.com/originals/cb/b0/f4/cbb0f4c4a7e05d4635ec4c53c6e26baf.png" 
            alt="SAMU Logo" 
            className="h-24 mb-4 object-contain"
          />
          <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">
            Serviço de Atendimento Móvel de Urgência
          </h1>
          <h2 className="text-xl font-bold text-red-600 tracking-widest">SAMU 192</h2>
          <p className="text-sm mt-1 font-bold text-gray-800">
            Base Serra Talhada
          </p>
          <p className="text-xs mt-1 text-gray-500">
            Coordenação Geral de Urgência e Emergência
          </p>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h3 className="text-xl font-bold underline uppercase">
            Requerimento de Permuta de Plantão
          </h3>
        </div>

        {/* Body */}
        <div className="text-justify leading-relaxed mb-10 space-y-6">
          <p className="indent-8 text-lg">
            Eu, <strong>{data.requesterName || '_________________________'}</strong>, 
            CRM / COREN /  MATRÍCULA nº <strong>{data.requesterCoren || '_________'}</strong>, 
            ocupante do cargo de <strong>{data.requesterRole || '_________'}</strong>, 
            lotado(a) na base <strong>{data.base || '_________'}</strong>, 
            venho respeitosamente requerer a V. Sa. autorização para permuta de plantão 
            com o(a) servidor(a) <strong>{data.substituteName || '_________________________'}</strong>, 
            CRM / COREN /  MATRÍCULA nº <strong>{data.substituteCoren || '_________'}</strong>, 
            ocupante do cargo de <strong>{data.substituteRole || '_________'}</strong>, 
            lotado(a) na base <strong>{data.base || '_________'}</strong>.
          </p>

          <div className="pl-8 border-l-4 border-gray-300 py-2 my-6 bg-gray-50">
            <p className="mb-2"><strong>Plantão Original (Solicitante):</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Data: {data.requesterDate}</li>
              <li>Horário: {data.requesterShift}</li>
            </ul>
            
            <p className="mt-4 mb-2"><strong>Plantão de Devolução (Substituto):</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Data: {data.date || 'N/A'}</li>
              <li>Horário: {data.shift || 'N/A'}</li>
            </ul>
          </div>

          <p className="indent-8 text-lg">
            <strong>Justificativa:</strong> {data.reason || '____________________________________________________________________________________________________'}
          </p>
          
          <p className="indent-8 text-lg mt-6">
            Declaramos estar cientes de que a presente permuta não acarretará ônus para a Administração Pública 
            e que a responsabilidade pelo cumprimento do plantão passa a ser do servidor substituto após a 
            aprovação da Coordenação.
          </p>
        </div>

        {/* Date */}
        <div className="text-right mb-16 text-lg">
          <p>_____________________, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.</p>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 mt-12">
          {/* Solicitante Signature */}
          <div className="text-center flex flex-col items-center">
            <div className="w-full border-b border-black mb-2 h-16"></div>
            <p className="font-bold">{data.requesterName || 'Assinar do Solicitante'}</p>
            <p className="text-sm text-gray-600">CRM / COREN / MATRÍCULA: {data.requesterCoren}</p>
          </div>

          {/* Substituto Signature */}
          <div className="text-center flex flex-col items-center">
            <div className="w-full border-b border-black mb-2 h-16"></div>
            <p className="font-bold">{data.substituteName || 'Assinatura do Substituto'}</p>
            <p className="text-sm text-gray-600">CRM / COREN / MATRÍCULA: {data.substituteCoren}</p>
          </div>
        </div>

        {/* Coordenacao Signature */}
        <div className="mt-24 text-center flex flex-col items-center w-1/2 mx-auto">
          <div className="w-full border-b border-black mb-2 h-16"></div>
          <p className="font-bold">Coordenação SAMU 192</p>
          <p className="text-sm text-gray-600">Autorização / Deferimento</p>
        </div>
        
        {/* Footer */}
        <div className="mt-16 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>Documento gerado eletronicamente pelo Sistema de Permutas SAMU 192.</p>
        </div>
      </div>
    );
  }
);

PdfDocument.displayName = 'PdfDocument';

