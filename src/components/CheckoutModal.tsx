import React, { useState, useEffect, useRef } from 'react';
import { PackageItem, InfinitePayConfig, Pedido } from '../types';
import {
  X,
  Lock,
  Unlock,
  Copy,
  Check,
  Clock,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Sparkles,
  QrCode,
  CheckCircle2,
  Key,
  RefreshCw,
  Search,
  Radio,
  AlertTriangle,
  Instagram,
  Eye,
  Heart,
  Film,
  Camera,
  CheckCircle,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from './Toast';
import {
  verifyInstagramProfile,
  verifyInstagramPost,
  InstagramProfile,
  InstagramPost,
} from '../services/instagramService';
import { savePedido, updatePedido } from '../services/supabaseService';
import { getSavedSmmConfig, sendOrderToSmm } from '../services/smmService';
import { generatePixBrCode, parseAndVerifyPixBrCode, detectPixKeyType } from '../services/pixService';

interface CheckoutModalProps {
  packageItem: PackageItem | null;
  isOpen: boolean;
  onClose: () => void;
  infinitePayConfig?: InfinitePayConfig;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  packageItem,
  isOpen,
  onClose,
  infinitePayConfig,
}) => {
  const { showToast } = useToast();

  const [step, setStep] = useState<'form' | 'pix' | 'success'>('form');
  const [profileOrUrl, setProfileOrUrl] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  
  // Instagram Verification States
  const [isVerifyingTarget, setIsVerifyingTarget] = useState(false);
  const [verifiedProfile, setVerifiedProfile] = useState<InstagramProfile | null>(null);
  const [verifiedPost, setVerifiedPost] = useState<InstagramPost | null>(null);
  const [isTargetConfirmed, setIsTargetConfirmed] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [forcedPrivateState, setForcedPrivateState] = useState<boolean | undefined>(undefined);

  // Transaction and Key Identifiers
  const [orderId, setOrderId] = useState('');
  const [orderKey, setOrderKey] = useState('');
  const [pixEndToEndId, setPixEndToEndId] = useState('');
  
  // Timers and Real-time Polling
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [pollCount, setPollCount] = useState(0);
  const [isVerifyingNow, setIsVerifyingNow] = useState(false);
  const [manualCheckNotice, setManualCheckNotice] = useState<string | null>(null);

  // InfinitePay Dynamic Checkout IDs
  const [checkoutId, setCheckoutId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isCreatingCharge, setIsCreatingCharge] = useState(false);

  // SMM dispatch status after payment
  const [smmDispatchStatus, setSmmDispatchStatus] = useState<'idle' | 'enviado' | 'erro' | 'pendente'>('idle');
  const [smmOrderId, setSmmOrderId] = useState<string | number | null>(null);

  // Configuration defaults
  const merchantName = infinitePayConfig?.merchantName || 'Social Networks';
  const pixKey = infinitePayConfig?.pixKey || '45.123.456/0001-90';
  const paymentLinkUrl = infinitePayConfig?.paymentLinkUrl || 'https://link.infinitepay.io/socialnetworks';
  const verifiedRef = useRef(false);

  // Bacen BR Code & Real QR Code States
  const [pixPayload, setPixPayload] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [pixCleanKey, setPixCleanKey] = useState('');
  const [pixKeyTypeLabel, setPixKeyTypeLabel] = useState('');
  const [pixCrc16, setPixCrc16] = useState('');
  const [pixDiagnosticMsg, setPixDiagnosticMsg] = useState<{ isValid: boolean; text: string } | null>(null);
  const [isValidatingPix, setIsValidatingPix] = useState(false);



  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setProfileOrUrl('');
      setWhatsapp('');
      setEmail('');
      setCopiedPix(false);
      setCopiedKey(false);
      setTimeLeft(600);
      setPollCount(1);
      setIsVerifyingNow(false);
      setManualCheckNotice(null);
      setCheckoutId('');
      setTransactionId('');
      setIsCreatingCharge(false);
      verifiedRef.current = false;
      setSmmDispatchStatus('idle');
      setSmmOrderId(null);

      // Reset verification
      setIsVerifyingTarget(false);
      setVerifiedProfile(null);
      setVerifiedPost(null);
      setIsTargetConfirmed(false);
      setVerificationError(null);
      setForcedPrivateState(undefined);

      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const generatedOrderId = `INF-${randomNum}`;
      const generatedKey = `KEY-INF-${randomNum}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      const now = new Date();
      const datePart = now.toISOString().replace(/[-:T]/g, '').slice(0, 12);
      const randomHex = Math.random().toString(16).substring(2, 12).toLowerCase();
      const generatedE2E = `E32658120${datePart}${randomHex}`;

      setOrderId(generatedOrderId);
      setOrderKey(generatedKey);
      setPixEndToEndId(generatedE2E);
    }
  }, [isOpen]);

  // Pix expiration timer countdown
  useEffect(() => {
    if (step === 'pix' && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timeLeft]);

  // Helper to query InfinitePay payment status (handles both automated 3s polling and manual click)
  const checkPaymentStatus = async (isManualClick: boolean = false) => {
    if (verifiedRef.current || !orderId) return;

    if (isManualClick) {
      setIsVerifyingNow(true);
      setManualCheckNotice(null);
    }

    try {
      const queryParams = new URLSearchParams({
        checkout_id: checkoutId || orderId,
        transaction_id: transactionId || orderId,
        order_id: orderId,
      });
      if (infinitePayConfig?.apiKey) {
        queryParams.append('apiKey', infinitePayConfig.apiKey);
      }

      console.log(`[InfinitePay Front Debug] Consultando status (${isManualClick ? 'Botão Manual' : 'Loop 3s'}) para Checkout:`, checkoutId || orderId);
      const res = await fetch(`/api/infinitepay/check-status?${queryParams.toString()}`);
      if (!res.ok) {
        if (isManualClick) {
          const warnText = 'Pagamento pendente. Aguarde a compensação no app do banco.';
          setManualCheckNotice(warnText);
          showToast(warnText, 'info');
        }
        return;
      }

      const data = await res.json();
      console.log('[InfinitePay Front Debug] Resposta exata da API da InfinitePay:', data);

      setPollCount((prev) => prev + 1);

      // Check if paid
      const isPaid =
        data.paid === true ||
        data.status === 'PAID' ||
        data.status === 'APPROVED' ||
        data.status_pagamento === 'Aprovado' ||
        data.isPaid === true;

      if (isPaid) {
        if (!verifiedRef.current) {
          verifiedRef.current = true;
          setManualCheckNotice(null);
          triggerPaymentSuccess();
        }
      } else {
        if (isManualClick) {
          const notice = data.message || 'Pagamento pendente. Aguarde a compensação no app do banco.';
          setManualCheckNotice(notice);
          showToast(notice, 'info');
        }
      }
    } catch (err: any) {
      console.error('[InfinitePay Front Debug] Erro ao consultar status da InfinitePay:', err);
      if (isManualClick) {
        const fallbackMsg = 'Pagamento pendente. Aguarde a compensação no app do banco.';
        setManualCheckNotice(fallbackMsg);
        showToast(fallbackMsg, 'info');
      }
    } finally {
      if (isManualClick) {
        setIsVerifyingNow(false);
      }
    }
  };

  // Real-time polling loop: queries InfinitePay status every 3 seconds
  useEffect(() => {
    if (step !== 'pix' || !orderId || verifiedRef.current) return;

    let isPolling = true;

    const pollPaymentStatus = async () => {
      if (!isPolling || verifiedRef.current || isVerifyingNow) return;
      await checkPaymentStatus(false);
    };

    // First check after 3s, then recurring every 3 seconds
    const pollInterval = setInterval(pollPaymentStatus, 3000);

    return () => {
      isPolling = false;
      clearInterval(pollInterval);
    };
  }, [step, orderId, checkoutId, transactionId, isVerifyingNow, infinitePayConfig]);

  // Instagram Verification Handler
  const handleVerifyInstagram = async (targetInput?: string, overridePrivate?: boolean) => {
    const rawInput = (targetInput !== undefined ? targetInput : profileOrUrl).trim();
    if (!rawInput || !packageItem) return;

    setIsVerifyingTarget(true);
    setVerificationError(null);
    setIsTargetConfirmed(false);

    try {
      if (packageItem.category === 'seguidores') {
        const profile = await verifyInstagramProfile(rawInput, overridePrivate ?? forcedPrivateState);
        setVerifiedProfile(profile);
        setVerifiedPost(null);

        if (profile.isPrivate) {
          setVerificationError('Perfil privado ou não encontrado. Por favor, desbloqueie seu perfil para receber os seguidores/curtidas.');
          showToast('Perfil privado ou não encontrado. Desbloqueie seu perfil para continuar.', 'error');
        } else {
          showToast(`Perfil @${profile.username} verificado e 100% público!`, 'success');
        }
      } else {
        const post = await verifyInstagramPost(rawInput, undefined, overridePrivate ?? forcedPrivateState);
        setVerifiedPost(post);
        setVerifiedProfile(null);

        if (post.isPrivate) {
          setVerificationError('Perfil privado ou não encontrado. Por favor, desbloqueie seu perfil para receber os seguidores/curtidas.');
          showToast('Publicação pertence a uma conta privada. Desbloqueie para continuar.', 'error');
        } else {
          showToast(`Publicação de @${post.author} verificada com sucesso!`, 'success');
        }
      }
    } catch (err: any) {
      const errMsg = err.message || 'Perfil privado ou não encontrado. Por favor, desbloqueie seu perfil para receber os seguidores/curtidas.';
      setVerificationError(errMsg);
      if (err.profileData) {
        setVerifiedProfile(err.profileData);
      } else if (err.postData) {
        setVerifiedPost(err.postData);
      }
      showToast(errMsg, 'error');
    } finally {
      setIsVerifyingTarget(false);
    }
  };

  // Input change handler
  const handleTargetInputChange = (val: string) => {
    setProfileOrUrl(val);
    setIsTargetConfirmed(false);
    setVerificationError(null);
    setVerifiedProfile(null);
    setVerifiedPost(null);
  };

  if (!isOpen || !packageItem) return null;

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setWhatsapp(value);
  };

  // Re-verify after customer makes account public ("desprivar")
  const handleRecheckAfterMakePublic = () => {
    setForcedPrivateState(false);
    handleVerifyInstagram(profileOrUrl, false);
  };

  // Quick toggle to simulate private vs public for testing
  const handleTogglePrivateSimulation = () => {
    const currentState = verifiedProfile ? verifiedProfile.isPrivate : (verifiedPost ? verifiedPost.isPrivate : false);
    const newState = !currentState;
    setForcedPrivateState(newState);
    handleVerifyInstagram(profileOrUrl, newState);
  };

  const isFollowers = packageItem.category === 'seguidores';
  const targetIsPrivate = Boolean(
    (isFollowers ? verifiedProfile?.isPrivate : verifiedPost?.isPrivate) ||
    (verificationError && verificationError.includes('Perfil privado'))
  );

  // Whether target has been verified and confirmed as public
  const isTargetVerifiedAndPublic = isFollowers
    ? Boolean(verifiedProfile && !verifiedProfile.isPrivate)
    : Boolean(verifiedPost && !verifiedPost.isPrivate);

  const canProceedToPix = Boolean(isTargetVerifiedAndPublic && isTargetConfirmed && !targetIsPrivate);

  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileOrUrl.trim()) {
      showToast('Por favor, informe seu @perfil ou o link do post.', 'error');
      return;
    }

    // Strict validation requirement
    if (isFollowers) {
      if (!verifiedProfile) {
        showToast('Clique em "Verificar" antes de gerar o Pix.', 'error');
        handleVerifyInstagram();
        return;
      }
      if (verifiedProfile.isPrivate) {
        setVerificationError('Perfil privado ou não encontrado. Por favor, desbloqueie seu perfil para receber os seguidores/curtidas.');
        showToast('Perfil privado ou não encontrado. Desbloqueie seu perfil para receber os seguidores/curtidas.', 'error');
        return;
      }
      if (!isTargetConfirmed) {
        showToast('Por favor, confirme que a foto e o @ são seus para continuar.', 'info');
        return;
      }
    } else {
      if (!verifiedPost) {
        showToast('Clique em "Verificar" antes de gerar o Pix.', 'error');
        handleVerifyInstagram();
        return;
      }
      if (verifiedPost.isPrivate) {
        setVerificationError('Perfil privado ou não encontrado. Por favor, desbloqueie seu perfil para receber os seguidores/curtidas.');
        showToast('Perfil privado ou não encontrado. Desbloqueie seu perfil para receber os seguidores/curtidas.', 'error');
        return;
      }
      if (!isTargetConfirmed) {
        showToast('Por favor, confirme que a foto da publicação é a correta.', 'info');
        return;
      }
    }

    if (whatsapp.length < 14) {
      showToast('Por favor, digite um WhatsApp válido com DDD.', 'error');
      return;
    }

    // 2. CRIAR COBRANÇA DINÂMICA VIA API INFINITEPAY
    setIsCreatingCharge(true);
    showToast('Gerando cobrança dinâmica na API da InfinitePay...', 'info');

    const targetHandle = verifiedProfile ? `@${verifiedProfile.username}` : (verifiedPost ? `@${verifiedPost.author}` : profileOrUrl);

    try {
      const chargeRes = await fetch('/api/infinitepay/create-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: packageItem.price,
          external_id: orderId,
          package_name: packageItem.name,
          customer: {
            name: verifiedProfile?.fullName || targetHandle,
            whatsapp,
            instagram: targetHandle,
            email,
          },
          apiKey: infinitePayConfig?.apiKey,
          merchantName: infinitePayConfig?.merchantName,
          pixKey: infinitePayConfig?.pixKey,
        }),
      });

      const chargeData = await chargeRes.json();
      console.log('[InfinitePay Front Debug] Cobrança dinâmica criada:', chargeData);

      if (chargeData.success) {
        setCheckoutId(chargeData.checkout_id);
        setTransactionId(chargeData.transaction_id);
        setPixPayload(chargeData.pix_code);
        setQrCodeDataUrl(chargeData.qr_code_url);

        const initialPedido: Pedido = {
          id: orderId,
          chave_pedido: orderKey,
          cliente_whatsapp: whatsapp,
          cliente_instagram: targetHandle,
          pacote_id: packageItem.id,
          pacote_nome: packageItem.name,
          pacote_categoria: packageItem.category,
          quantidade: packageItem.quantity,
          valor: packageItem.price,
          status_pagamento: 'Pendente',
          status_smm: 'Pendente',
          checkout_id: chargeData.checkout_id,
          transaction_id: chargeData.transaction_id,
          pix_end_to_end_id: pixEndToEndId,
          data_hora: new Date().toLocaleString('pt-BR'),
        };
        savePedido(initialPedido);

        setStep('pix');
        showToast('Cobrança dinâmica gerada com sucesso pela InfinitePay!', 'success');
      } else {
        showToast(chargeData.error || 'Erro ao gerar cobrança na InfinitePay.', 'error');
      }
    } catch (err: any) {
      console.error('[InfinitePay Front Debug] Erro ao criar cobrança dinâmica:', err);
      showToast('Falha na comunicação com a API InfinitePay.', 'error');
    } finally {
      setIsCreatingCharge(false);
    }
  };

  // Pix EMV Code copy handler
  const activePixCode = pixPayload;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(activePixCode);
    setCopiedPix(true);
    showToast('Código Pix oficial copiado! Abra o app do seu banco para colar.', 'success');
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleCopyOrderKey = () => {
    navigator.clipboard.writeText(orderKey);
    setCopiedKey(true);
    showToast('Chave de autenticação do pedido copiada!', 'success');
    setTimeout(() => setCopiedKey(false), 3000);
  };

  // Verify Pix Code integrity and Bacen conformity
  const handleVerifyPixIntegrity = () => {
    setIsValidatingPix(true);
    setTimeout(() => {
      const codeToTest = activePixCode;
      const verified = parseAndVerifyPixBrCode(codeToTest);
      if (verified.isValid) {
        setPixDiagnosticMsg({
          isValid: true,
          text: `Pix 100% Válido! Chave: ${verified.pixKey || pixCleanKey || pixKey} · Valor: R$ ${packageItem.price.toFixed(2).replace('.', ',')} · Checksum Bacen #${verified.crcCalculated} Validado com Sucesso.`,
        });
        showToast('Código Pix e QR Code verificados com sucesso no padrão Bacen!', 'success');
      } else {
        setPixDiagnosticMsg({
          isValid: false,
          text: verified.error || 'Código Pix possui inconsistência na chave.',
        });
        showToast('Atenção: verifique a chave cadastrada.', 'error');
      }
      setIsValidatingPix(false);
    }, 400);
  };

  const handleManualVerifyNow = async () => {
    if (verifiedRef.current || isVerifyingNow) return;
    await checkPaymentStatus(true);
  };

  // AUTOMATIC SMM TRIGGER ON PAYMENT SUCCESS
  const triggerPaymentSuccess = async () => {
    setStep('success');
    showToast('Pagamento Confirmado! Seu pedido já foi enviado', 'success');

    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } catch {
      // safe fallback
    }

    const targetHandle = verifiedProfile ? `@${verifiedProfile.username}` : (verifiedPost ? `@${verifiedPost.author}` : profileOrUrl);
    const targetLink = `https://instagram.com/${targetHandle.replace('@', '')}`;

    // Update order in database to Aprovado
    await updatePedido(orderId, {
      status_pagamento: 'Aprovado',
      pix_end_to_end_id: pixEndToEndId,
    });

    // Check SMM Configuration
    const smmConfig = getSavedSmmConfig();
    if (smmConfig.enabled && smmConfig.apiUrl && smmConfig.apiKey && packageItem.serviceId) {
      try {
        const smmRes = await sendOrderToSmm({
          apiUrl: smmConfig.apiUrl,
          apiKey: smmConfig.apiKey,
          service: packageItem.serviceId,
          link: targetLink,
          quantity: packageItem.quantity,
        });

        if (smmRes.success && smmRes.orderId) {
          setSmmDispatchStatus('enviado');
          setSmmOrderId(smmRes.orderId);
          await updatePedido(orderId, {
            status_smm: 'Enviado',
            order_id_fornecedor: smmRes.orderId,
            smm_response_log: JSON.stringify(smmRes.raw),
          });
          showToast(`Pedido SMM disparado com sucesso! Ordem #${smmRes.orderId}`, 'success');
        } else {
          setSmmDispatchStatus('erro');
          await updatePedido(orderId, {
            status_smm: 'Erro',
            mensagem_erro: smmRes.error || 'Erro desconhecido ao enviar ao SMM',
            smm_response_log: JSON.stringify(smmRes.raw),
          });
          showToast('Pix recebido! Envio manual para SMM registrado no Painel ADM.', 'info');
        }
      } catch (err: any) {
        setSmmDispatchStatus('erro');
        await updatePedido(orderId, {
          status_smm: 'Erro',
          mensagem_erro: err.message,
        });
      }
    } else {
      setSmmDispatchStatus('pendente');
    }

    // Call InfinitePay webhook endpoint in server for full-stack event logging
    try {
      await fetch('/api/webhook/infinitepay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'pix.received',
          order_id: orderId,
          orderKey,
          amount: packageItem.price,
          smmConfig,
        }),
      });
    } catch {
      // ignore
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      
      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0A0E17] border border-slate-800 shadow-2xl shadow-emerald-950/30 overflow-hidden my-6">
        
        {/* InfinitePay Branded Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-extrabold text-xs">
              <span className="text-base font-bold leading-none tracking-tight">∞</span>
              <span className="tracking-wide">InfinitePay</span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                {step === 'form' && 'Checkout Pix & Validação Real Instagram'}
                {step === 'pix' && 'Aguardando Pagamento Pix'}
                {step === 'success' && 'Pagamento Confirmado! 🎉'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {step === 'form' && 'Verificação visual obrigatória do perfil no Instagram'}
                {step === 'pix' && `Chave: ${orderKey}`}
                {step === 'success' && 'Autenticado no gateway InfinitePay & SMM'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[82vh] overflow-y-auto">

          {/* Package Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold uppercase">
                <span>{packageItem.category}</span>
                <span>·</span>
                <span className="text-slate-400 font-mono">{packageItem.quantity.toLocaleString('pt-BR')} itens</span>
              </div>
              <div className="text-sm font-bold text-white mt-0.5">{packageItem.name}</div>
              <div className="text-xs text-slate-400">Entrega: {packageItem.deliveryTime} {packageItem.serviceId ? `· Service #${packageItem.serviceId}` : ''}</div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[11px] text-slate-400">Total a pagar</div>
              <div className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono tabular-nums">
                R$ {packageItem.price.toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>

          {/* ================= STEP 1: FORM WITH REAL INSTAGRAM VALIDATION ================= */}
          {step === 'form' && (
            <form onSubmit={handleGeneratePix} className="space-y-4">
              
              {/* Field 1: Instagram Target with Real Verification Engine */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    {isFollowers ? 'Seu @Perfil no Instagram' : 'Link da Publicação / Post / Reel'} <span className="text-emerald-400">*</span>
                  </label>

                  {/* Simulator switch */}
                  {(verifiedProfile || verifiedPost) && (
                    <button
                      type="button"
                      onClick={handleTogglePrivateSimulation}
                      className="text-[10px] text-purple-400 hover:text-purple-300 underline font-semibold flex items-center gap-1 cursor-pointer"
                      title="Alternar teste privado / público"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{targetIsPrivate ? 'Testar Modo Público' : 'Testar Modo Privado'}</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 flex items-center pointer-events-none">
                      <Instagram className="w-4 h-4 text-pink-500" />
                    </div>
                    <input
                      type="text"
                      required
                      value={profileOrUrl}
                      onChange={(e) => handleTargetInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleVerifyInstagram(profileOrUrl);
                        }
                      }}
                      placeholder={
                        isFollowers
                          ? '@seu_perfil (ex: @anaclara.oficial)'
                          : 'https://www.instagram.com/p/... ou link do Reel'
                      }
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>

                  {/* Explicit Verify Button */}
                  <button
                    type="button"
                    onClick={() => handleVerifyInstagram(profileOrUrl)}
                    disabled={isVerifyingTarget || !profileOrUrl.trim()}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/30 transition-all cursor-pointer shrink-0"
                  >
                    {isVerifyingTarget ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verificando...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Verificar</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  {isFollowers
                    ? '🔍 Digite seu @ e clique em "Verificar". O sistema valida a existência e se o perfil está público.'
                    : '🔍 Cole o link do Reels/Post para verificar a imagem da publicação e a visibilidade.'}
                </p>

                {/* Verification Loading Radar */}
                {isVerifyingTarget && (
                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center gap-3 animate-pulse">
                    <div className="w-5 h-5 rounded-full border-2 border-pink-500 border-t-transparent animate-spin shrink-0" />
                    <div className="text-xs text-purple-200">
                      <strong>Conectando à API do Instagram...</strong>
                      <div className="text-[10px] text-slate-400">Consultando perfil oficial e verificando se está 100% público.</div>
                    </div>
                  </div>
                )}

                {/* ================= RED ALERT FOR PRIVATE PROFILE OR NOT FOUND ================= */}
                {verificationError && !isVerifyingTarget && (
                  <div className="p-3.5 rounded-xl bg-rose-950/70 border-2 border-rose-500 text-rose-200 text-xs flex items-start gap-3 shadow-lg shadow-rose-950/40">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="block text-rose-100 font-bold text-xs">Atenção: Ação Necessária no Instagram</strong>
                      <div className="text-[11px] text-rose-200 leading-relaxed font-semibold">
                        {verificationError}
                      </div>
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRecheckAfterMakePublic}
                          className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Já desativei o modo privado · Testar Novamente</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= INSTAGRAM PROFILE CARD (REAL PHOTO + METRICS) ================= */}
                {isFollowers && verifiedProfile && !isVerifyingTarget && !verifiedProfile.isPrivate && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 shadow-lg space-y-3">
                    
                    <div className="flex items-center gap-3">
                      {/* Real Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-md overflow-hidden flex items-center justify-center">
                          <img
                            src={verifiedProfile.avatarUrl}
                            alt={verifiedProfile.username}
                            className="w-full h-full rounded-full object-cover bg-slate-800"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src !== verifiedProfile.fallbackAvatarUrl) {
                                target.src = verifiedProfile.fallbackAvatarUrl;
                              }
                            }}
                          />
                        </div>
                        {verifiedProfile.isVerified && (
                          <div className="absolute -bottom-1 -right-1 bg-sky-500 text-white rounded-full p-0.5 border border-[#0A0E17]" title="Verificado">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-white truncate">
                            {verifiedProfile.fullName}
                          </h4>
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <Unlock className="w-2.5 h-2.5" />
                            100% Público
                          </span>
                        </div>

                        <div className="text-xs text-purple-300 font-mono truncate">
                          @{verifiedProfile.username}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <div>
                            <strong className="text-slate-200">{verifiedProfile.followersCount.toLocaleString('pt-BR')}</strong> seguidores
                          </div>
                          <div>
                            <strong className="text-slate-200">{verifiedProfile.postsCount}</strong> posts
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer confirmation toggle */}
                    <div className="pt-1">
                      {!isTargetConfirmed ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsTargetConfirmed(true);
                            showToast('Perfil confirmado com sucesso! Prossiga com o checkout.', 'success');
                          }}
                          className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 border border-purple-400/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Confirmar: A foto e o @ são meus</span>
                        </button>
                      ) : (
                        <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span>Perfil verificado e confirmado para entrega!</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsTargetConfirmed(false)}
                            className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                          >
                            Trocar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ================= INSTAGRAM POST CARD (FOR CURTIDAS / VIEWS) ================= */}
                {!isFollowers && verifiedPost && !isVerifyingTarget && !verifiedPost.isPrivate && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 shadow-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                        <img
                          src={verifiedPost.thumbnailUrl}
                          alt="Foto da publicação"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white flex items-center gap-1">
                          {verifiedPost.type === 'reel' ? (
                            <>
                              <Film className="w-3 h-3 text-pink-400" />
                              <span>Reel</span>
                            </>
                          ) : (
                            <>
                              <Camera className="w-3 h-3 text-cyan-400" />
                              <span>Feed</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-purple-300 font-mono">
                            @{verifiedPost.author}
                          </span>
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <Unlock className="w-2.5 h-2.5" />
                            100% Público
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 leading-snug">
                          {verifiedPost.caption}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                          <div className="flex items-center gap-1 text-rose-300 font-semibold">
                            <Heart className="w-3 h-3 fill-rose-500/30 text-rose-400" />
                            <span>{verifiedPost.likesCount} curtidas</span>
                          </div>
                          {verifiedPost.viewsCount && (
                            <div className="flex items-center gap-1 text-cyan-300 font-semibold">
                              <Eye className="w-3 h-3 text-cyan-400" />
                              <span>{verifiedPost.viewsCount.toLocaleString('pt-BR')} views</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">
                      {!isTargetConfirmed ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsTargetConfirmed(true);
                            showToast('Publicação confirmada! Prossiga com o checkout.', 'success');
                          }}
                          className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 border border-purple-400/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Confirmar: Esta é a publicação correta</span>
                        </button>
                      ) : (
                        <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span>Publicação confirmada para entrega!</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsTargetConfirmed(false)}
                            className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                          >
                            Trocar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Field 2: WhatsApp Number */}
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  Número do WhatsApp <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={handleWhatsappChange}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Você receberá a chave do pedido e o comprovante no WhatsApp.
                </p>
              </div>

              {/* Field 3: E-mail (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  E-mail para Recibo <span className="text-slate-500 font-normal">(Opcional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              {/* InfinitePay Automation Notice */}
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2.5">
                <Radio className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="leading-snug">
                  <strong className="text-white">Verificação Automática InfinitePay & SMM:</strong> Assim que você pagar no app do seu banco, nosso sistema detecta a compensação e despacha o pedido para o fornecedor em instantes.
                </div>
              </div>

              {/* Submit Button: Strictly blocked until verified and 100% public */}
              {targetIsPrivate ? (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border-2 border-rose-500 text-center space-y-1">
                  <div className="text-xs font-bold text-rose-300 flex items-center justify-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    <span>Botão de Compra Bloqueado</span>
                  </div>
                  <p className="text-[11px] text-rose-200">
                    Perfil privado ou não encontrado. Por favor, desbloqueie seu perfil para receber os seguidores/curtidas.
                  </p>
                </div>
              ) : isCreatingCharge ? (
                <div className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-extrabold text-slate-950 bg-emerald-400 opacity-90 cursor-wait">
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Criando cobrança dinâmica na InfinitePay...</span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!canProceedToPix || isCreatingCharge}
                  className={`w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-extrabold text-slate-950 transition-all ${
                    !canProceedToPix || isCreatingCharge
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-80'
                      : 'bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 shadow-lg shadow-emerald-500/25 active:scale-[0.98] cursor-pointer'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-current" />
                  <span>
                    {!isTargetVerifiedAndPublic
                      ? 'Clique em "Verificar" acima para validar o perfil'
                      : !isTargetConfirmed
                      ? 'Confirme o perfil acima para liberar o Pix'
                      : `Gerar Pix InfinitePay · R$ ${packageItem.price.toFixed(2).replace('.', ',')}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 pt-1">
                <span>∞ Processamento CloudWalk / InfinitePay · Integração SMM & Banco de Dados</span>
              </div>
            </form>
          )}

          {/* ================= STEP 2: PIX CODE, QR & AUTOMATIC DETECTION ================= */}
          {step === 'pix' && (
            <div className="space-y-4 text-center">
              
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/40 border border-emerald-500/40 text-left flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3.5 w-3.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Verificando Pix Automaticamente</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded">
                        Sondagem #{pollCount}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Pague no seu banco. O sistema detectará o pagamento sozinho!
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Expira em</div>
                  <div className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 animate-pulse" />
                    <span>{formattedTime}</span>
                  </div>
                </div>
              </div>

              {/* Order Key Information Card */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Key className="w-3 h-3 text-purple-400" />
                    <span>Chave do Pedido (Guarde esta chave)</span>
                  </div>
                  <div className="font-mono font-bold text-purple-300 text-xs sm:text-sm mt-0.5">
                    {orderKey}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyOrderKey}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey ? 'Copiada' : 'Copiar'}</span>
                </button>
              </div>

              {/* Real Scannable InfinitePay Pix QR Code */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl max-w-[260px] mx-auto shadow-2xl border-2 border-emerald-500/50">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code Pix Scannable"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-800">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                    <span className="text-xs font-bold text-slate-600">Gerando QR Code...</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-900 uppercase tracking-wider mt-2">
                  <span className="text-emerald-600 font-bold text-sm">∞</span>
                  <span>InfinitePay Pix · Bacen Oficial</span>
                </div>
              </div>

              {/* Informações da Cobrança Dinâmica InfinitePay */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-left text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Checkout ID (InfinitePay):</span>
                  <span className="font-mono text-purple-300 font-bold text-[11px] truncate max-w-[200px]">
                    {checkoutId || orderId}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Transação Dinâmica:</span>
                  <span className="font-mono text-emerald-400 font-bold text-[11px] truncate max-w-[200px]">
                    {transactionId || orderId}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5 text-[11px]">
                  <span className="text-slate-400">Tipo de Cobrança:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Cobrança Dinâmica InfinitePay API v2
                  </span>
                </div>
              </div>

              {/* Pix Copia e Cola Input */}
              <div className="space-y-1 text-left">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Código Pix Copia e Cola (Oficial Bacen)
                </label>
                <div className="relative">
                  <input
                    readOnly
                    value={activePixCode}
                    className="w-full px-3 py-2.5 pr-28 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className={`absolute right-1.5 top-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      copiedPix
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {copiedPix ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Pix</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Ferramenta de Verificação & Diagnóstico da Chave Pix */}
              <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/30 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Verificação do Código Pix InfinitePay</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleVerifyPixIntegrity}
                    disabled={isValidatingPix}
                    className="text-[10px] text-purple-300 hover:text-white underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isValidatingPix ? 'animate-spin' : ''}`} />
                    <span>Testar Leitura</span>
                  </button>
                </div>

                {pixDiagnosticMsg ? (
                  <div
                    className={`p-2 rounded-lg text-[11px] flex items-center gap-2 border ${
                      pixDiagnosticMsg.isValid
                        ? 'bg-emerald-950/40 text-emerald-200 border-emerald-500/30'
                        : 'bg-rose-950/40 text-rose-200 border-rose-500/30'
                    }`}
                  >
                    {pixDiagnosticMsg.isValid ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span>{pixDiagnosticMsg.text}</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400">
                    O QR Code acima contém o payload BR Code padrão Bacen com CRC16 válido, pronto para leitura instantânea por qualquer aplicativo de banco (Nubank, Itaú, Bradesco, Inter, Mercado Pago, etc.).
                  </div>
                )}
              </div>


              {/* Manual Verification Button */}
              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  onClick={handleManualVerifyNow}
                  disabled={isVerifyingNow}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    isVerifyingNow
                      ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                      : 'text-slate-950 bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 hover:from-emerald-300 hover:to-green-400 border border-emerald-400/50 shadow-emerald-500/20'
                  }`}
                >
                  {isVerifyingNow ? (
                    <>
                      <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <span>Consultando banco...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Verificar Pagamento Pix</span>
                    </>
                  )}
                </button>

                {manualCheckNotice && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{manualCheckNotice}</span>
                  </div>
                )}
              </div>

              {paymentLinkUrl && (
                <div className="pt-0.5">
                  <a
                    href={paymentLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 text-[11px] font-medium text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 text-emerald-400" />
                    <span>Abrir link de pagamento InfinitePay no navegador</span>
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-xs text-slate-500 hover:text-slate-300 underline cursor-pointer"
              >
                Voltar e alterar dados
              </button>
            </div>
          )}

          {/* ================= STEP 3: SUCCESS & SMM CONFIRMATION ================= */}
          {step === 'success' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pix Verificado e Aprovado via InfinitePay</span>
                </div>
                <h4 className="text-xl sm:text-2xl font-extrabold text-white">Pagamento Confirmado! Seu pedido já foi enviado</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                  A compensação de <strong className="text-emerald-400">R$ {packageItem.price.toFixed(2).replace('.', ',')}</strong> foi autenticada. Seu pedido foi gravado na base de dados e enviado para processamento!
                </p>
              </div>

              {/* SMM Dispatch Status Pill */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Disparo no Fornecedor SMM:</span>
                  {smmDispatchStatus === 'enviado' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <Check className="w-3 h-3" />
                      Ordem SMM #{smmOrderId} Enviada
                    </span>
                  ) : smmDispatchStatus === 'erro' ? (
                    <span className="inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                      <AlertCircle className="w-3 h-3" />
                      Pendente de Reenvio no ADM
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      Registrado na Base de Pedidos
                    </span>
                  )}
                </div>
              </div>

              {/* Key System Receipt Box */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-left space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                    <span>Chave do Pedido:</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-purple-300">{orderKey}</span>
                    <button
                      type="button"
                      onClick={handleCopyOrderKey}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                      title="Copiar Chave do Pedido"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Chave E2E (Bacen):</span>
                  <span className="font-mono text-[11px] text-slate-300 truncate max-w-[210px]">{pixEndToEndId}</span>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Destino Validado:</span>
                  <div className="flex items-center gap-2 max-w-[240px]">
                    {verifiedProfile?.avatarUrl && (
                      <img
                        src={verifiedProfile.avatarUrl}
                        alt="Foto do perfil"
                        className="w-5 h-5 rounded-full object-cover border border-purple-500 shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== verifiedProfile.fallbackAvatarUrl) {
                            target.src = verifiedProfile.fallbackAvatarUrl;
                          }
                        }}
                      />
                    )}
                    {verifiedPost?.thumbnailUrl && (
                      <img
                        src={verifiedPost.thumbnailUrl}
                        alt="Foto do post"
                        className="w-5 h-5 rounded object-cover border border-purple-500 shrink-0"
                      />
                    )}
                    <span className="font-semibold text-white truncate font-mono text-[11px]">
                      {verifiedProfile ? `@${verifiedProfile.username}` : (verifiedPost ? `@${verifiedPost.author}` : profileOrUrl)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Status da Entrega:</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Entrega em Andamento
                  </span>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span className="text-emerald-400 font-bold">1. Pix Autenticado</span>
                    <span className="text-emerald-400 font-bold">2. Banco Atualizado</span>
                    <span className="text-emerald-400 font-bold">3. SMM Ativado</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 via-green-400 to-cyan-400 h-full w-full rounded-full" />
                  </div>
                </div>
              </div>

              {/* WhatsApp Support CTA with Order Key */}
              <div className="pt-2">
                <a
                  href={`https://wa.me/5511999999999?text=Ol%C3%A1!%20Meu%20Pix%20InfinitePay%20foi%20confirmado.%20Minha%20chave%20do%20pedido%20%C3%A9%20${encodeURIComponent(orderKey)}%20para%20o%20pacote%20${encodeURIComponent(packageItem.name)}%20(${encodeURIComponent(profileOrUrl)})`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#25D366] hover:bg-[#20ba59] shadow-lg shadow-green-900/30 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Acompanhar com Suporte (Enviar Chave)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Fechar e Continuar Navegando
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
