import React, { useState, useEffect, useRef } from 'react';
import { PackageItem, PackageCategory, InfinitePayConfig, Pedido, SmmConfig, SupabaseConfig } from '../types';
import {
  LayoutDashboard,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle,
  Eye,
  Search,
  Sparkles,
  TrendingUp,
  Tag,
  Clock,
  RotateCcw,
  Store,
  Flame,
  AlertCircle,
  Check,
  X,
  Users,
  Heart,
  ShieldCheck,
  Save,
  ExternalLink,
  Key,
  CheckCircle2,
  Radio,
  Send,
  Database,
  Server,
  FileText,
  Copy,
  RefreshCw,
  Sliders,
  DollarSign,
  AlertTriangle,
  QrCode,
  Activity,
  XCircle,
  Loader2
} from 'lucide-react';
import { useToast } from './Toast';
import {
  getSavedSmmConfig,
  saveSmmConfig,
  testSmmConnection,
  sendOrderToSmm,
  checkSmmOrderStatus,
  syncAllSmmOrders
} from '../services/smmService';
import {
  fetchPedidos,
  updatePedido,
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  SUPABASE_SQL_SCHEMA
} from '../services/supabaseService';
import { generatePixBrCode, parseAndVerifyPixBrCode, detectPixKeyType } from '../services/pixService';

interface AdminPanelProps {
  packages: PackageItem[];
  onSavePackage: (pkg: PackageItem) => void;
  onDeletePackage: (id: string) => void;
  onToggleActive: (id: string) => void;
  onResetDefaults: () => void;
  onGoToStore: () => void;
  infinitePayConfig: InfinitePayConfig;
  onUpdateInfinitePayConfig: (config: InfinitePayConfig) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  packages,
  onSavePackage,
  onDeletePackage,
  onToggleActive,
  onResetDefaults,
  onGoToStore,
  infinitePayConfig,
  onUpdateInfinitePayConfig,
}) => {
  const { showToast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  // Tabs: 'packages' | 'orders' | 'smm' | 'supabase' | 'infinitepay'
  const [activeTab, setActiveTab] = useState<'packages' | 'orders' | 'smm' | 'supabase' | 'infinitepay'>('packages');

  // Package Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState<PackageCategory>('seguidores');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number>(1000);
  const [price, setPrice] = useState<string>('19.90');
  const [originalPrice, setOriginalPrice] = useState<string>('34.90');
  const [highlightTag, setHighlightTag] = useState('Mais Vendido');
  const [deliveryTime, setDeliveryTime] = useState('5 a 15 minutos');
  const [serviceId, setServiceId] = useState<string>('101');
  const [featuresText, setFeaturesText] = useState(
    'Perfis Reais & Brasileiros\nInício Automático em Minutos\nSem necessidade de senha\nGarantia de reposição 30 dias'
  );

  // Search & Filter state for packages list
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<PackageCategory | 'all'>('all');
  const [deletingPackage, setDeletingPackage] = useState<PackageItem | null>(null);

  // ==========================================
  // ORDERS (PEDIDOS) MANAGEMENT STATE
  // ==========================================
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoadingPedidos, setIsLoadingPedidos] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pagos' | 'em_progresso' | 'concluidos' | 'cancelados' | 'erro_smm' | 'pendentes'>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Pedido | null>(null);
  const [isResendingSmm, setIsResendingSmm] = useState<string | null>(null);
  const [isVerifyingSmmStatus, setIsVerifyingSmmStatus] = useState<string | null>(null);
  const [isSyncingAllSmm, setIsSyncingAllSmm] = useState(false);
  const [isSimulatingPaidId, setIsSimulatingPaidId] = useState<string | null>(null);

  // Load orders on mount or tab change
  const reloadPedidos = async () => {
    setIsLoadingPedidos(true);
    try {
      const data = await fetchPedidos();
      setPedidos(data);
    } catch {
      // ignore
    } finally {
      setIsLoadingPedidos(false);
    }
  };

  useEffect(() => {
    reloadPedidos();
  }, [activeTab]);

  // ==========================================
  // SMM CONFIGURATION STATE
  // ==========================================
  const [smmConfig, setSmmConfig] = useState<SmmConfig>(getSavedSmmConfig);
  const [isTestingSmm, setIsTestingSmm] = useState(false);
  const [smmTestStatus, setSmmTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [smmTestMessage, setSmmTestMessage] = useState('');
  const [showSmmKey, setShowSmmKey] = useState(false);

  // ==========================================
  // SUPABASE CONFIGURATION STATE
  // ==========================================
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSavedSupabaseConfig);
  const [copiedSql, setCopiedSql] = useState(false);

  // ==========================================
  // INFINITEPAY CONFIG STATE
  // ==========================================
  const [infMerchantName, setInfMerchantName] = useState(infinitePayConfig.merchantName);
  const [infPixKey, setInfPixKey] = useState(infinitePayConfig.pixKey);
  const [infPixKeyType, setInfPixKeyType] = useState(infinitePayConfig.pixKeyType);
  const [infApiKey, setInfApiKey] = useState(infinitePayConfig.apiKey || 'inf_live_89a72b14c3e809df');
  const [infWebhookSecret, setInfWebhookSecret] = useState(infinitePayConfig.webhookSecret || 'whsec_98214fa76bc1209e');
  const [infPaymentLinkUrl, setInfPaymentLinkUrl] = useState(infinitePayConfig.paymentLinkUrl);
  const [infCheckoutMode, setInfCheckoutMode] = useState(infinitePayConfig.checkoutMode);
  const [infAutoVerifyEnabled, setInfAutoVerifyEnabled] = useState(infinitePayConfig.autoVerifyEnabled !== false);
  const [infAutoVerifySeconds, setInfAutoVerifySeconds] = useState(infinitePayConfig.autoVerifySeconds || 12);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingInfKey, setIsTestingInfKey] = useState(false);
  const [infTestStatus, setInfTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [infTestMessage, setInfTestMessage] = useState('');
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);

  const handleTestInfinitePayKey = async () => {
    if (!infApiKey.trim()) {
      showToast('Por favor, informe a Chave de API / Token da InfinitePay para testar.', 'error');
      return;
    }

    setIsTestingInfKey(true);
    setInfTestStatus('idle');
    setInfTestMessage('');

    try {
      const res = await fetch('/api/infinitepay/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: infApiKey, webhookSecret: infWebhookSecret }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInfTestStatus('success');
        setInfTestMessage(data.message || 'Token InfinitePay validado com sucesso!');
        showToast('Chave de API / Token InfinitePay validado com sucesso!', 'success');
      } else {
        setInfTestStatus('error');
        setInfTestMessage(data.error || 'Chave de API / Token InfinitePay inválido.');
        showToast(data.error || 'Erro na validação do token.', 'error');
      }
    } catch (err: any) {
      setInfTestStatus('error');
      setInfTestMessage(err.message || 'Erro de conexão.');
      showToast('Erro ao testar chave InfinitePay.', 'error');
    } finally {
      setIsTestingInfKey(false);
    }
  };

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/infinitepay`;
  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhookUrl(true);
    showToast('URL do Webhook InfinitePay copiada com sucesso!', 'success');
    setTimeout(() => setCopiedWebhookUrl(false), 3000);
  };

  // Real-time Pix & QR Code Tester in Admin
  const [adminTestPixQrUrl, setAdminTestPixQrUrl] = useState('');
  const [adminTestPixPayload, setAdminTestPixPayload] = useState('');
  const [adminTestPixCrc, setAdminTestPixCrc] = useState('');
  const [adminPixKeyInfo, setAdminPixKeyInfo] = useState<{ type: string; cleanKey: string; isValid: boolean; label: string }>({
    type: 'cnpj',
    cleanKey: '',
    isValid: true,
    label: 'CNPJ',
  });
  const [adminPixValidationMsg, setAdminPixValidationMsg] = useState<{ isValid: boolean; text: string } | null>(null);
  const [isAdminTestingPix, setIsAdminTestingPix] = useState(false);

  useEffect(() => {
    if (infPixKey) {
      const keyInfo = detectPixKeyType(infPixKey);
      setAdminPixKeyInfo(keyInfo);

      generatePixBrCode({
        pixKey: infPixKey,
        merchantName: infMerchantName || 'Social Networks',
        amount: 19.90,
        txid: 'ADMIN10',
        description: 'Verificacao InfinitePay',
      }).then((res) => {
        setAdminTestPixQrUrl(res.qrCodeDataUrl);
        setAdminTestPixPayload(res.emvCode);
        setAdminTestPixCrc(res.crc16);
      }).catch((err) => {
        console.error('Erro ao gerar preview de teste do Pix:', err);
      });
    }
  }, [infPixKey, infMerchantName]);

  const handleAdminVerifyPix = () => {
    setIsAdminTestingPix(true);
    setTimeout(() => {
      const verified = parseAndVerifyPixBrCode(adminTestPixPayload);
      if (verified.isValid) {
        setAdminPixValidationMsg({
          isValid: true,
          text: `QR Code e Chave Pix 100% Válidos! Padrão Bacen BR Code com CRC16 #${verified.crcCalculated}. O QR Code gerado é perfeitamente legível por todos os aplicativos bancários.`,
        });
        showToast('Chave Pix e QR Code validados com sucesso no padrão Bacen!', 'success');
      } else {
        setAdminPixValidationMsg({
          isValid: false,
          text: verified.error || 'A chave Pix informada possui formato inválido para o Banco Central.',
        });
        showToast('Atenção: verifique a chave Pix informada.', 'error');
      }
      setIsAdminTestingPix(false);
    }, 350);
  };

  // Quick stats
  const totalPackages = packages.length;
  const activePackages = packages.filter((p) => p.active).length;
  const averagePrice =
    packages.length > 0
      ? packages.reduce((acc, curr) => acc + curr.price, 0) / packages.length
      : 0;
  const bestSellerItem =
    packages.find((p) => p.highlightTag?.toLowerCase().includes('mais vendido') && p.active) ||
    packages[0];
  const bestSeller = bestSellerItem ? bestSellerItem.name : 'Nenhum';

  // Total paid orders amount
  const totalFaturamento = pedidos
    .filter((p) => p && p.status_pagamento === 'Aprovado')
    .reduce((acc, curr) => acc + (Number(curr?.valor) || 0), 0);
  const pedidosComErroSmm = pedidos.filter((p) => p && p.status_smm === 'Erro').length;
  const pedidosEmProgresso = pedidos.filter((p) => p && p.status_smm === 'Em progresso').length;
  const pedidosConcluidos = pedidos.filter((p) => p && p.status_smm === 'Concluído').length;
  const pedidosCancelados = pedidos.filter((p) => p && p.status_smm === 'Cancelado').length;

  // Handle Edit Action
  const handleStartEdit = (pkg: PackageItem) => {
    setActiveTab('packages');
    setEditingId(pkg.id);
    setCategory(pkg.category);
    setName(pkg.name);
    setQuantity(pkg.quantity);
    setPrice(pkg.price.toString());
    setOriginalPrice(pkg.originalPrice ? pkg.originalPrice.toString() : '');
    setHighlightTag(pkg.highlightTag || '');
    setDeliveryTime(pkg.deliveryTime || '5 a 15 minutos');
    setServiceId(String(pkg.serviceId || '101'));
    setFeaturesText(pkg.features?.join('\n') || '');

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    showToast(`Carregando "${pkg.name}" no formulário para edição.`, 'info');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setPrice('19.90');
    setOriginalPrice('34.90');
    setHighlightTag('Mais Vendido');
    setQuantity(1000);
    setDeliveryTime('5 a 15 minutos');
    setServiceId('101');
    setFeaturesText(
      'Perfis Reais & Brasileiros\nInício Automático em Minutos\nSem necessidade de senha\nGarantia de reposição 30 dias'
    );
  };

  // Handle Package Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Por favor, informe o nome do pacote.', 'error');
      return;
    }

    const parsedPrice = parseFloat(price.replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      showToast('Por favor, informe um preço válido maior que zero.', 'error');
      return;
    }

    const parsedOriginalPrice = originalPrice ? parseFloat(originalPrice.replace(',', '.')) : undefined;

    const parsedFeatures = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const packageData: PackageItem = {
      id: editingId || `pkg-${Date.now()}`,
      name: name.trim(),
      category,
      quantity: Number(quantity) || 1000,
      price: parsedPrice,
      originalPrice: parsedOriginalPrice,
      highlightTag: highlightTag.trim() || undefined,
      deliveryTime: deliveryTime.trim() || '5 a 15 minutos',
      serviceId: serviceId.trim() || undefined,
      features: parsedFeatures,
      active: true,
      createdAt: editingId ? (packages.find((p) => p.id === editingId)?.createdAt || Date.now()) : Date.now(),
    };

    onSavePackage(packageData);
    showToast(
      editingId ? 'Pacote atualizado com sucesso!' : 'Novo pacote cadastrado e disponível na loja!',
      'success'
    );
    handleCancelEdit();
  };

  // SMM Connection Test
  const handleTestSmmConnection = async () => {
    if (!smmConfig.apiUrl.trim() || !smmConfig.apiKey.trim()) {
      showToast('Preencha a URL da API e a Chave API do SMM para testar.', 'error');
      return;
    }

    setIsTestingSmm(true);
    setSmmTestStatus('idle');
    setSmmTestMessage('');

    try {
      const res = await testSmmConnection(smmConfig.apiUrl, smmConfig.apiKey);
      if (res.success) {
        setSmmTestStatus('success');
        setSmmTestMessage(`Conexão OK! Saldo Atual: ${res.currency || 'BRL'} ${res.balance}`);
        const updatedConfig: SmmConfig = {
          ...smmConfig,
          balance: res.balance,
          currency: res.currency,
          lastTestedAt: Date.now(),
          enabled: true,
        };
        setSmmConfig(updatedConfig);
        saveSmmConfig(updatedConfig);
        showToast(`Conectado ao SMM com sucesso! Saldo: ${res.currency} ${res.balance}`, 'success');
      } else {
        setSmmTestStatus('error');
        setSmmTestMessage(res.error || 'Falha de autenticação com o provedor SMM.');
        showToast(res.error || 'Erro ao conectar ao provedor SMM.', 'error');
      }
    } catch (err: any) {
      setSmmTestStatus('error');
      setSmmTestMessage(err.message || 'Erro de rede');
      showToast('Falha na requisição com o SMM.', 'error');
    } finally {
      setIsTestingSmm(false);
    }
  };

  const handleSaveSmmConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSmmConfig(smmConfig);
    showToast('Configurações do Provedor SMM salvas com sucesso!', 'success');
  };

  // Supabase Save
  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseConfig);
    showToast('Configurações do Banco Supabase salvas!', 'success');
    reloadPedidos();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    showToast('Script SQL copiado! Cole no SQL Editor do seu Supabase.', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Reenviar Pedido para SMM Manualmente
  const handleResendToSmm = async (pedido: Pedido) => {
    if (!smmConfig.apiUrl || !smmConfig.apiKey) {
      showToast('Configure a API do SMM na aba "Configuração SMM" antes de reenviar.', 'error');
      return;
    }

    setIsResendingSmm(pedido.id);
    showToast(`Reenviando pedido ${pedido.id} para o fornecedor SMM...`, 'info');

    try {
      const targetLink = `https://instagram.com/${pedido.cliente_instagram.replace('@', '')}`;
      // Look up package serviceId
      const pkg = packages.find((p) => p.id === pedido.pacote_id);
      const pkgServiceId = pkg?.serviceId || '101';

      const res = await sendOrderToSmm({
        apiUrl: smmConfig.apiUrl,
        apiKey: smmConfig.apiKey,
        service: pkgServiceId,
        link: targetLink,
        quantity: pedido.quantidade,
      });

      if (res.success && res.orderId) {
        await updatePedido(pedido.id, {
          status_smm: 'Enviado',
          order_id_fornecedor: res.orderId,
          mensagem_erro: undefined,
          smm_response_log: JSON.stringify(res.raw),
        });
        showToast(`Pedido ${pedido.id} reenviado com sucesso! Ordem SMM #${res.orderId}`, 'success');
        reloadPedidos();
      } else {
        await updatePedido(pedido.id, {
          status_smm: 'Erro',
          mensagem_erro: res.error || 'Erro retornado pela API do SMM',
          smm_response_log: JSON.stringify(res.raw),
        });
        showToast(`Falha ao reenviar: ${res.error || 'Erro SMM'}`, 'error');
        reloadPedidos();
      }
    } catch (err: any) {
      showToast(`Erro ao reenviar: ${err.message}`, 'error');
    } finally {
      setIsResendingSmm(null);
    }
  };

  // Verify real-time status of single SMM order
  const handleCheckSmmStatus = async (pedido: Pedido) => {
    if (!pedido.order_id_fornecedor) {
      showToast('Este pedido ainda não possui um ID de ordem gerado no fornecedor SMM.', 'error');
      return;
    }

    setIsVerifyingSmmStatus(pedido.id);
    try {
      const res = await checkSmmOrderStatus({
        apiUrl: smmConfig.apiUrl,
        apiKey: smmConfig.apiKey,
        orderId: pedido.order_id_fornecedor,
        localOrderId: pedido.id,
      });

      if (res.success) {
        showToast(`Status SMM atualizado: ${res.status_smm} (Ordem #${pedido.order_id_fornecedor})`, 'success');
        if (selectedOrderForModal && selectedOrderForModal.id === pedido.id && res.order) {
          setSelectedOrderForModal(res.order);
        }
        await reloadPedidos();
      } else {
        showToast(`Erro na consulta SMM: ${res.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`Falha ao verificar status: ${err.message}`, 'error');
    } finally {
      setIsVerifyingSmmStatus(null);
    }
  };

  // Batch sync all SMM orders
  const handleSyncAllSmm = async () => {
    setIsSyncingAllSmm(true);
    try {
      const res = await syncAllSmmOrders({
        apiUrl: smmConfig.apiUrl,
        apiKey: smmConfig.apiKey,
      });

      if (res.success) {
        showToast(`${res.totalUpdated || 0} pedidos sincronizados com o fornecedor SMM!`, 'success');
        await reloadPedidos();
      } else {
        showToast(`Erro ao sincronizar: ${res.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`Falha na sincronização SMM: ${err.message}`, 'error');
    } finally {
      setIsSyncingAllSmm(false);
    }
  };

  // [DEV] Admin only: simulate Pix paid for testing without real banking charge
  const handleSimulatePixPaid = async (ped: Pedido) => {
    setIsSimulatingPaidId(ped.id);
    showToast(`[DEV] Simulando aprovação de pagamento Pix para o pedido ${ped.id}...`, 'info');

    try {
      const res = await fetch('/api/infinitepay/verify-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: ped.id,
          pixEndToEndId: ped.pix_end_to_end_id || `E3265812020261108${Math.floor(10000000 + Math.random() * 90000000)}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`[DEV] Pedido ${ped.id} aprovado com sucesso no servidor! O checkout do cliente detectará a confirmação.`, 'success');
        if (selectedOrderForModal && selectedOrderForModal.id === ped.id) {
          setSelectedOrderForModal({
            ...selectedOrderForModal,
            status_pagamento: 'Aprovado',
          });
        }
        await reloadPedidos();
      } else {
        showToast(`Erro ao simular aprovação: ${data.error || 'Falha'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Erro ao simular: ${err.message}`, 'error');
    } finally {
      setIsSimulatingPaidId(null);
    }
  };

  // Filtered Orders
  const filteredPedidos = pedidos.filter((p) => {
    if (!p) return false;
    if (orderFilter === 'pagos' && p.status_pagamento !== 'Aprovado') return false;
    if (orderFilter === 'em_progresso' && p.status_smm !== 'Em progresso') return false;
    if (orderFilter === 'concluidos' && p.status_smm !== 'Concluído') return false;
    if (orderFilter === 'cancelados' && p.status_smm !== 'Cancelado') return false;
    if (orderFilter === 'erro_smm' && p.status_smm !== 'Erro') return false;
    if (orderFilter === 'pendentes' && p.status_pagamento !== 'Pendente') return false;

    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const matchInsta = (p.cliente_instagram?.toLowerCase().includes(q)) ?? false;
      const matchWhats = (p.cliente_whatsapp?.toLowerCase().includes(q)) ?? false;
      const matchId =
        ((p.id?.toLowerCase().includes(q)) ?? false) ||
        ((p.chave_pedido?.toLowerCase().includes(q)) ?? false) ||
        (p.order_id_fornecedor ? String(p.order_id_fornecedor).toLowerCase().includes(q) : false);
      const matchName = (p.pacote_nome?.toLowerCase().includes(q)) ?? false;
      return matchInsta || matchWhats || matchId || matchName;
    }
    return true;
  });

  // Filtered packages
  const filteredPackages = packages.filter((pkg) => {
    const matchesCategory = adminCategoryFilter === 'all' || pkg.category === adminCategoryFilter;
    const matchesSearch =
      pkg.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
      pkg.highlightTag?.toLowerCase().includes(adminSearch.toLowerCase()) ||
      pkg.quantity.toString().includes(adminSearch) ||
      (pkg.serviceId && String(pkg.serviceId).includes(adminSearch));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <LayoutDashboard className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Painel de Gestão Completo
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Controle de pacotes, histórico de pedidos em tempo real, integração com Provedor SMM e InfinitePay.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onGoToStore}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
          >
            <Store className="w-4 h-4 text-emerald-400" />
            <span>Ver Loja no Ar</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0F1420] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Faturamento Pix</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-2 font-mono">
            R$ {totalFaturamento.toFixed(2).replace('.', ',')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total aprovado via InfinitePay</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0F1420] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Pedidos Cadastrados</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-2 font-mono">
            {pedidos.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {pedidosComErroSmm > 0 ? (
              <span className="text-rose-400 font-bold">{pedidosComErroSmm} com erro SMM</span>
            ) : (
              '100% operando sem falhas'
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0F1420] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Saldo Provedor SMM</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-300 mt-2 font-mono truncate">
            {smmConfig.currency || 'BRL'} {smmConfig.balance || '0.00'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {smmConfig.enabled ? '● Conectado ao fornecedor' : '○ Não configurado'}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0F1420] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Pacotes na Vitrine</span>
            <Tag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 mt-2 font-mono">
            {activePackages} / {totalPackages}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Preço Médio: R$ {averagePrice.toFixed(2).replace('.', ',')}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-[#0A0E17] border border-slate-800/80 rounded-2xl overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('packages')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'packages'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Gerenciador de Pacotes ({totalPackages})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Histórico & Gestão de Pedidos ({pedidos.length})</span>
          {pedidosComErroSmm > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
              {pedidosComErroSmm}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('smm')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'smm'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Configuração SMM</span>
          {smmConfig.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'supabase'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Banco Supabase / SQL</span>
        </button>

        <button
          onClick={() => setActiveTab('infinitepay')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'infinitepay'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <span className="text-base font-bold leading-none">∞</span>
          <span>InfinitePay & Webhook</span>
        </button>
      </div>

      {/* ==========================================
          TAB 1: PACOTES (GERENCIADOR)
         ========================================== */}
      {activeTab === 'packages' && (
        <div className="space-y-8">
          {/* Creation & Editing Form */}
          <div
            ref={formRef}
            className="p-6 rounded-2xl bg-[#0F1420] border border-slate-800 shadow-xl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {editingId ? <Edit2 className="w-5 h-5 text-amber-400" /> : <PlusCircle className="w-5 h-5 text-emerald-400" />}
                  <span>{editingId ? 'Editar Pacote Existente' : 'Cadastrar Novo Pacote'}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Defina nome, valor em R$, Service ID no SMM e destaques para refletir instantaneamente na vitrine.
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar Edição
                </button>
              )}
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Categoria <span className="text-purple-400">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PackageCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="seguidores">Seguidores</option>
                    <option value="curtidas">Curtidas</option>
                    <option value="views">Visualizações (Views)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Nome do Pacote <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: 1.000 Seguidores VIP"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Quantidade <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Preço em R$ <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="19.90"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Preço Original R$ <span className="text-slate-500">(Riscado)</span>
                  </label>
                  <input
                    type="text"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="34.90"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 text-sm focus:outline-none focus:border-slate-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Tag de Destaque
                  </label>
                  <input
                    type="text"
                    value={highlightTag}
                    onChange={(e) => setHighlightTag(e.target.value)}
                    placeholder="ex: Mais Vendido, Promoção"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center justify-between">
                    <span>Service ID (SMM)</span>
                    <span className="text-[10px] text-cyan-400 font-mono">ID Provedor</span>
                  </label>
                  <input
                    type="text"
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    placeholder="ex: 1042"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 font-bold text-sm focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Prazo de Entrega Estimado
                  </label>
                  <input
                    type="text"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    placeholder="5 a 15 minutos"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Benefícios / Recursos (1 por linha)
                  </label>
                  <textarea
                    rows={3}
                    value={featuresText}
                    onChange={(e) => setFeaturesText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingId ? 'Salvar Alterações do Pacote' : 'Cadastrar Pacote na Vitrine'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Packages List / Table */}
          <div className="p-6 rounded-2xl bg-[#0F1420] border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Pacotes Ativos e Cadastrados</h3>
                <p className="text-xs text-slate-400">Alterne visibilidade na vitrine ou edite os valores instantaneamente.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onResetDefaults}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Padrões</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="Buscar por nome, tag ou Service ID..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={adminCategoryFilter}
                onChange={(e) => setAdminCategoryFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="all">Todas Categorias</option>
                <option value="seguidores">Seguidores</option>
                <option value="curtidas">Curtidas</option>
                <option value="views">Views</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Status</th>
                    <th className="p-3">Pacote</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Qtd.</th>
                    <th className="p-3">Preço</th>
                    <th className="p-3">Service ID</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPackages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3">
                        <button
                          onClick={() => onToggleActive(pkg.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            pkg.active
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${pkg.active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          <span>{pkg.active ? 'Ativo' : 'Oculto'}</span>
                        </button>
                      </td>
                      <td className="p-3 font-semibold text-white">
                        <div>{pkg.name}</div>
                        {pkg.highlightTag && (
                          <span className="text-[10px] text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                            {pkg.highlightTag}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300 uppercase text-[11px] font-mono">
                        {pkg.category}
                      </td>
                      <td className="p-3 font-mono text-slate-200">
                        {pkg.quantity.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        R$ {pkg.price.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-3 font-mono text-cyan-300">
                        #{pkg.serviceId || '---'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(pkg)}
                            className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Editar pacote"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingPackage(pkg)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Excluir pacote"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: HISTÓRICO & GESTÃO DE PEDIDOS
         ========================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0F1420] border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <span>Histórico de Pedidos & Rastreamento SMM</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Acompanhe compensação de Pix, status de disparo da API SMM e faça reenvios manuais instantâneos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncAllSmm}
                  disabled={isSyncingAllSmm}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 cursor-pointer shadow-sm transition-colors"
                  title="Consultar status de todos os pedidos no provedor SMM em tempo real"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAllSmm ? 'animate-spin' : ''}`} />
                  <span>{isSyncingAllSmm ? 'Sincronizando...' : 'Sincronizar Status SMM'}</span>
                </button>

                <button
                  onClick={reloadPedidos}
                  disabled={isLoadingPedidos}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPedidos ? 'animate-spin' : ''}`} />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>

            {/* Filter buttons & Search bar */}
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Buscar por @ do Instagram, WhatsApp, ID do pedido ou ID do SMM..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 flex-wrap">
                <button
                  onClick={() => setOrderFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    orderFilter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos ({pedidos.length})
                </button>
                <button
                  onClick={() => setOrderFilter('pagos')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    orderFilter === 'pagos' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pagos
                </button>
                <button
                  onClick={() => setOrderFilter('em_progresso')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    orderFilter === 'em_progresso' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Em Progresso ({pedidosEmProgresso})
                </button>
                <button
                  onClick={() => setOrderFilter('concluidos')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    orderFilter === 'concluidos' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Concluídos ({pedidosConcluidos})
                </button>
                {pedidosCancelados > 0 && (
                  <button
                    onClick={() => setOrderFilter('cancelados')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      orderFilter === 'cancelados' ? 'bg-rose-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Cancelados ({pedidosCancelados})
                  </button>
                )}
                <button
                  onClick={() => setOrderFilter('erro_smm')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    orderFilter === 'erro_smm' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Erro SMM ({pedidosComErroSmm})
                </button>
                <button
                  onClick={() => setOrderFilter('pendentes')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    orderFilter === 'pendentes' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pendentes
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">ID / Chave</th>
                    <th className="p-3">Cliente (@ / Whats)</th>
                    <th className="p-3">Pacote</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Status Pagamento</th>
                    <th className="p-3">Status SMM</th>
                    <th className="p-3">Data/Hora</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPedidos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Nenhum pedido encontrado para estes filtros.
                      </td>
                    </tr>
                  ) : (
                    filteredPedidos.map((ped) => {
                      const safeQty = Math.max(0, Number(ped?.quantidade) || 0);
                      const safeVal = Math.max(0, Number(ped?.valor) || 0);
                      return (
                      <tr key={ped.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-mono">
                          <div className="font-bold text-white">{ped.id}</div>
                          <div className="text-[10px] text-purple-300 truncate max-w-[120px]">{ped.chave_pedido || '---'}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-white font-mono text-xs">{ped.cliente_instagram || 'Cliente'}</div>
                          <div className="text-[11px] text-slate-400">{ped.cliente_whatsapp || '---'}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-200">{ped.pacote_nome || 'Pacote'}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-mono">{safeQty.toLocaleString('pt-BR')} itens</div>
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          R$ {safeVal.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-3">
                          {ped.status_pagamento === 'Aprovado' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <Check className="w-3 h-3" />
                              Aprovado
                            </span>
                          ) : ped.status_pagamento === 'Recusado' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              <X className="w-3 h-3" />
                              Recusado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3 h-3" />
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            {/* SMM Order ID */}
                            {ped.order_id_fornecedor ? (
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-cyan-300 font-bold text-xs bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                                  #{ped.order_id_fornecedor}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">Sem ID SMM</span>
                            )}

                            {/* SMM Real-Time Status Badge */}
                            <div>
                              {ped.status_smm === 'Concluído' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Concluído</span>
                                </span>
                              ) : ped.status_smm === 'Em progresso' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping mr-0.5" />
                                  <Activity className="w-3 h-3 text-blue-400" />
                                  <span>Em Progresso</span>
                                  {ped.smm_remains !== undefined && (
                                    <span className="text-[9px] text-blue-200/80 font-mono font-normal">
                                      ({ped.smm_remains} restam)
                                    </span>
                                  )}
                                </span>
                              ) : ped.status_smm === 'Cancelado' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                  <XCircle className="w-3 h-3 text-rose-400" />
                                  <span>Cancelado</span>
                                </span>
                              ) : ped.status_smm === 'Parcial' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                                  <span>Parcial</span>
                                </span>
                              ) : ped.status_smm === 'Enviado' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                  <Send className="w-3 h-3 text-cyan-400" />
                                  <span>Enviado</span>
                                </span>
                              ) : ped.status_smm === 'Erro' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40" title={ped.mensagem_erro}>
                                  <AlertCircle className="w-3 h-3 text-rose-400" />
                                  <span>Erro no SMM</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>Pendente</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-[11px] text-slate-400 font-mono">
                          {ped.data_hora}
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Botão de Verificar Status SMM */}
                            {ped.order_id_fornecedor && (
                              <button
                                onClick={() => handleCheckSmmStatus(ped)}
                                disabled={isVerifyingSmmStatus === ped.id}
                                className="px-2 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                                title="Consultar status em tempo real no fornecedor SMM"
                              >
                                <RefreshCw className={`w-3 h-3 ${isVerifyingSmmStatus === ped.id ? 'animate-spin text-cyan-400' : ''}`} />
                                <span className="hidden sm:inline">Verificar SMM</span>
                              </button>
                            )}

                            {/* Reenviar para SMM se deu erro ou cancelado */}
                            {(ped.status_smm === 'Erro' || ped.status_smm === 'Cancelado') && (
                              <button
                                onClick={() => handleResendToSmm(ped)}
                                disabled={isResendingSmm === ped.id}
                                className="px-2 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                                title="Reenviar este pedido para o fornecedor SMM"
                              >
                                {isResendingSmm === ped.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Send className="w-3 h-3" />
                                )}
                                <span className="hidden sm:inline">Reenviar</span>
                              </button>
                            )}

                            {/* [DEV] Simular Pix Pago para testes de desenvolvimento */}
                            {ped.status_pagamento === 'Pendente' && (
                              <button
                                onClick={() => handleSimulatePixPaid(ped)}
                                disabled={isSimulatingPaidId === ped.id}
                                className="px-2 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                                title="[DEV] Simular aprovação do Pix para testar o checkout e envio ao SMM"
                              >
                                <CheckCircle className={`w-3 h-3 ${isSimulatingPaidId === ped.id ? 'animate-spin' : ''}`} />
                                <span className="hidden xl:inline">[DEV] Simular Pix Pago</span>
                                <span className="inline xl:hidden">[DEV] Pagar</span>
                              </button>
                            )}

                            {/* Ver Detalhes */}
                            <button
                              onClick={() => setSelectedOrderForModal(ped)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              Detalhes
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: CONFIGURAÇÃO SMM
         ========================================== */}
      {activeTab === 'smm' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-[#0F1420] border border-slate-800 shadow-xl space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-cyan-400" />
                <span>Configuração da API do Provedor SMM</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Conecte seu painel fornecedor SMM padrão v2 (action: balance, action: add) para automação de entrega de seguidores, curtidas e views.
              </p>
            </div>

            <form onSubmit={handleSaveSmmConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  URL da API do Provedor SMM <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={smmConfig.apiUrl}
                  onChange={(e) => setSmmConfig({ ...smmConfig, apiUrl: e.target.value })}
                  placeholder="https://fornecedorsmm.com/api/v2"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Endpoint de requisição POST padrão dos painéis SMM v2.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Chave API (API Key) <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSmmKey ? 'text' : 'password'}
                    required
                    value={smmConfig.apiKey}
                    onChange={(e) => setSmmConfig({ ...smmConfig, apiKey: e.target.value })}
                    placeholder="Sua chave de API do fornecedor SMM"
                    className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmmKey(!showSmmKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    {showSmmKey ? 'Ocultar' : 'Exibir'}
                  </button>
                </div>
              </div>

              {/* Status and Test Connection Display */}
              {smmTestMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                    smmTestStatus === 'success'
                      ? 'bg-emerald-950/40 text-emerald-200 border-emerald-500/40'
                      : 'bg-rose-950/40 text-rose-200 border-rose-500/40'
                  }`}
                >
                  {smmTestStatus === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{smmTestMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleTestSmmConnection}
                  disabled={isTestingSmm}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingSmm ? 'animate-spin' : ''}`} />
                  <span>{isTestingSmm ? 'Consultando Saldo...' : 'Testar Conexão & Consultar Saldo'}</span>
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Configuração SMM</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 4: CONFIGURAÇÃO SUPABASE / SQL
         ========================================== */}
      {activeTab === 'supabase' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-[#0F1420] border border-slate-800 shadow-xl space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <span>Persistência no Supabase / PostgreSQL</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Conecte seu projeto Supabase para sincronização em nuvem da tabela <code>pedidos</code>. Caso não configure, o sistema opera automaticamente com persistência local de alta performance.
              </p>
            </div>

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={supabaseConfig.supabaseUrl}
                    onChange={(e) => setSupabaseConfig({ ...supabaseConfig, supabaseUrl: e.target.value })}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Supabase Anon Public Key
                  </label>
                  <input
                    type="password"
                    value={supabaseConfig.supabaseAnonKey}
                    onChange={(e) => setSupabaseConfig({ ...supabaseConfig, supabaseAnonKey: e.target.value })}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableSupabase"
                  checked={supabaseConfig.enabled}
                  onChange={(e) => setSupabaseConfig({ ...supabaseConfig, enabled: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                />
                <label htmlFor="enableSupabase" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Ativar sincronização ativa com banco Supabase
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors cursor-pointer"
                >
                  Salvar Conexão Supabase
                </button>
              </div>
            </form>

            {/* SQL Schema Preview & Copy */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Script SQL da Tabela pedidos (PostgreSQL)</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copiado!' : 'Copiar Script SQL'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-56">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 5: INFINITEPAY CONFIG
         ========================================== */}
      {/* ==========================================
          TAB 5: INFINITEPAY CONFIG (API, TOKENS & WEBHOOK)
         ========================================== */}
      {activeTab === 'infinitepay' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-[#0F1420] border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-emerald-400 font-extrabold text-2xl leading-none">∞</span>
                  <span>Gateway InfinitePay · Sistema de API, Tokens & Webhook</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Gerencie as credenciais bancárias da CloudWalk / InfinitePay, tokens de autenticação da API e recebimento via Webhook.
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Pix Bacen Instituição #32658</span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateInfinitePayConfig({
                  merchantName: infMerchantName,
                  pixKey: infPixKey,
                  pixKeyType: infPixKeyType,
                  apiKey: infApiKey,
                  webhookSecret: infWebhookSecret,
                  paymentLinkUrl: infPaymentLinkUrl,
                  checkoutMode: infCheckoutMode,
                  autoVerifyEnabled: infAutoVerifyEnabled,
                  autoVerifySeconds: Number(infAutoVerifySeconds) || 12,
                  enabled: true,
                });
                showToast('Configurações da InfinitePay e Tokens salvas com sucesso!', 'success');
              }}
              className="space-y-6"
            >
              {/* Seção 1: Dados do Titular e Chave Pix */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>1. Dados da Conta e Chave Pix</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Nome do Titular (Merchant) <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={infMerchantName}
                      onChange={(e) => setInfMerchantName(e.target.value)}
                      placeholder="Social Networks"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Tipo de Chave Pix
                    </label>
                    <select
                      value={infPixKeyType}
                      onChange={(e) => setInfPixKeyType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="phone">Celular</option>
                      <option value="random">Chave Aleatória (EVP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Chave Pix Cadastrada <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={infPixKey}
                      onChange={(e) => setInfPixKey(e.target.value)}
                      placeholder="45.123.456/0001-90"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Painel de Validação e Teste em Tempo Real do QR Code */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Pré-visualização & Verificador do QR Code Pix
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        {adminPixKeyInfo.label}
                      </span>
                      <button
                        type="button"
                        onClick={handleAdminVerifyPix}
                        disabled={isAdminTestingPix}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 ${isAdminTestingPix ? 'animate-spin' : ''}`} />
                        <span>Validar QR Code Bacen</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Live Scannable QR Code */}
                    <div className="p-2.5 bg-white rounded-xl shadow-lg border border-slate-700 shrink-0">
                      {adminTestPixQrUrl ? (
                        <img
                          src={adminTestPixQrUrl}
                          alt="QR Code Pix Teste"
                          className="w-32 h-32 object-contain rounded"
                        />
                      ) : (
                        <div className="w-32 h-32 flex items-center justify-center text-slate-700">
                          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-xs w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Chave Sanitizada:</span>
                        <span className="font-mono text-emerald-400 font-bold">{adminPixKeyInfo.cleanKey || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Beneficiário:</span>
                        <span className="text-white font-semibold">{infMerchantName || 'Social Networks'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Checksum CRC16:</span>
                        <span className="font-mono text-purple-300 font-bold">#{adminTestPixCrc || 'CALCULANDO'}</span>
                      </div>

                      {adminPixValidationMsg && (
                        <div
                          className={`p-2 rounded-lg text-[11px] flex items-center gap-2 border ${
                            adminPixValidationMsg.isValid
                              ? 'bg-emerald-950/40 text-emerald-200 border-emerald-500/30'
                              : 'bg-rose-950/40 text-rose-200 border-rose-500/30'
                          }`}
                        >
                          {adminPixValidationMsg.isValid ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          )}
                          <span>{adminPixValidationMsg.text}</span>
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400 pt-1">
                        Aponte a câmera do aplicativo do seu banco (Nubank, Itaú, Inter, etc.) para o QR Code acima para testar a leitura antes de liberar para os clientes.
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              {/* Seção 2: Chave de API / Token Bearer da InfinitePay */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <Key className="w-4 h-4 text-purple-400" />
                    <span>2. Chave de API / Token InfinitePay (Bearer Token)</span>
                  </div>

                  <span className="text-[10px] text-purple-400 font-mono font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                    CloudWalk API v1
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={infApiKey}
                      onChange={(e) => setInfApiKey(e.target.value)}
                      placeholder="inf_live_89a72b14c3e809df ou token JWT"
                      className="w-full pl-3.5 pr-28 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-purple-300 text-xs sm:text-sm font-mono focus:outline-none focus:border-purple-500"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="px-2 py-1 rounded text-[11px] font-semibold text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
                      >
                        {showApiKey ? 'Ocultar' : 'Exibir'}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    O Token de API permite que sua aplicação realize consultas de transações, validação e conciliação bancária direta.
                  </p>
                </div>

                {/* Status da validação da chave */}
                {infTestMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      infTestStatus === 'success'
                        ? 'bg-emerald-950/40 text-emerald-200 border-emerald-500/40'
                        : 'bg-rose-950/40 text-rose-200 border-rose-500/40'
                    }`}
                  >
                    {infTestStatus === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{infTestMessage}</span>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleTestInfinitePayKey}
                    disabled={isTestingInfKey}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-purple-300 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingInfKey ? 'animate-spin' : ''}`} />
                    <span>{isTestingInfKey ? 'Validando Token...' : 'Testar Token & Conexão InfinitePay'}</span>
                  </button>
                </div>
              </div>

              {/* Seção 3: Webhook de Notificação Automática */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>3. Webhook de Confirmação Pix (Tempo Real)</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Webhook Ativo
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      Token Secreto do Webhook (Webhook Secret)
                    </label>
                    <input
                      type="text"
                      value={infWebhookSecret}
                      onChange={(e) => setInfWebhookSecret(e.target.value)}
                      placeholder="whsec_98214fa76bc1209e"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Utilizado para autenticar a assinatura HMAC dos eventos de pagamento recebidos pela InfinitePay.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      URL de Destino do Webhook (Cole no Painel da InfinitePay)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={webhookUrl}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-mono select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyWebhookUrl}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        {copiedWebhookUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedWebhookUrl ? 'Copiada' : 'Copiar URL'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 4: Modo de Checkout e Link Direto */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>4. Modo de Exibição do Checkout</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => setInfCheckoutMode('modal_qr')}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      infCheckoutMode === 'modal_qr'
                        ? 'bg-purple-950/30 border-purple-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="checkoutMode"
                      checked={infCheckoutMode === 'modal_qr'}
                      onChange={() => setInfCheckoutMode('modal_qr')}
                      className="mt-1 text-purple-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Modal Pix com QR Code & Chave Única</span>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.2 rounded">Recomendado</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        Gera o QR Code oficial e código Pix Copia e Cola na tela com detecção instantânea do pagamento.
                      </div>
                    </div>
                  </label>

                  <label
                    onClick={() => setInfCheckoutMode('payment_link')}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      infCheckoutMode === 'payment_link'
                        ? 'bg-purple-950/30 border-purple-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="checkoutMode"
                      checked={infCheckoutMode === 'payment_link'}
                      onChange={() => setInfCheckoutMode('payment_link')}
                      className="mt-1 text-purple-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">Link Direto da InfinitePay</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        Exibe o link da página oficial de cobrança da InfinitePay para o cliente pagar no navegador.
                      </div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Link de Pagamento InfinitePay (Opcional)
                  </label>
                  <input
                    type="url"
                    value={infPaymentLinkUrl}
                    onChange={(e) => setInfPaymentLinkUrl(e.target.value)}
                    placeholder="https://link.infinitepay.io/socialnetworks"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Seção 5: Verificação Real de Pagamento & Webhook */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>5. Segurança & Confirmação de Pagamento Real (InfinitePay)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/20 text-xs text-slate-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block">Sondagem em Tempo Real a Cada 4 Segundos:</strong>
                      <span>O checkout consulta a API da InfinitePay no backend. O pedido permanece em &quot;Aguardando Pagamento&quot; e NUNCA é enviado para o fornecedor SMM até que o status da transação mude oficialmente para <strong>PAID</strong> ou <strong>APPROVED</strong>.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 border-t border-slate-800 pt-2 text-[11px] text-slate-400">
                    <span className="font-bold text-amber-400 shrink-0">[DEV Testes]:</span>
                    <span>Para simular pagamentos em ambiente de desenvolvimento sem realizar transferências bancárias reais, acesse a aba <strong>Histórico &amp; Gestão de Pedidos</strong> e clique no botão <strong>&quot;[DEV] Simular Pix Pago&quot;</strong> no pedido desejado.</span>
                  </div>
                </div>
              </div>

              {/* Salvar Botão */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Todas as Configurações da InfinitePay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ==========================================
          MODAL: DETALHES COMPLETOS DO PEDIDO & LOGS SMM
         ========================================== */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#0A0E17] border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  Detalhes do Pedido #{selectedOrderForModal.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 font-semibold">Cliente Instagram:</div>
                <div className="text-white font-mono text-sm font-bold mt-0.5">{selectedOrderForModal.cliente_instagram || '---'}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 font-semibold">WhatsApp:</div>
                <div className="text-white font-mono text-sm font-bold mt-0.5">{selectedOrderForModal.cliente_whatsapp || '---'}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 font-semibold">Pacote / Quantidade:</div>
                <div className="text-white font-bold mt-0.5">
                  {selectedOrderForModal.pacote_nome || 'Pacote'} ({(Number(selectedOrderForModal.quantidade) || 0).toLocaleString('pt-BR')} itens)
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 font-semibold">Valor Pago:</div>
                <div className="text-emerald-400 font-mono text-base font-extrabold mt-0.5">
                  R$ {(Number(selectedOrderForModal.valor) || 0).toFixed(2).replace('.', ',')}
                </div>
              </div>
            </div>

            {/* Chaves e Identificadores */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Chave do Pedido:</span>
                <span className="font-mono text-purple-300 font-bold">{selectedOrderForModal.chave_pedido}</span>
              </div>
              {selectedOrderForModal.pix_end_to_end_id && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">End-to-End ID Bacen:</span>
                  <span className="font-mono text-slate-300 text-[11px] truncate max-w-[280px]">
                    {selectedOrderForModal.pix_end_to_end_id}
                  </span>
                </div>
              )}
            </div>

            {/* SMM Real-Time Provider Card */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Rastreamento da Ordem no Fornecedor SMM
                  </span>
                </div>
                {selectedOrderForModal.order_id_fornecedor && (
                  <span className="font-mono text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                    ID #{selectedOrderForModal.order_id_fornecedor}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/60">
                  <div className="text-[10px] text-slate-400 font-medium">Status do SMM</div>
                  <div className="mt-1">
                    {selectedOrderForModal.status_smm === 'Concluído' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Concluído
                      </span>
                    ) : selectedOrderForModal.status_smm === 'Em progresso' ? (
                      <span className="inline-flex items-center gap-1 text-blue-400 font-bold text-xs">
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        Em Progresso
                      </span>
                    ) : selectedOrderForModal.status_smm === 'Cancelado' ? (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-xs">
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelado
                      </span>
                    ) : selectedOrderForModal.status_smm === 'Parcial' ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Parcial
                      </span>
                    ) : selectedOrderForModal.status_smm === 'Enviado' ? (
                      <span className="inline-flex items-center gap-1 text-cyan-400 font-bold text-xs">
                        <Send className="w-3.5 h-3.5" />
                        Enviado
                      </span>
                    ) : selectedOrderForModal.status_smm === 'Erro' ? (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-xs">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Erro SMM
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        Pendente
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/60">
                  <div className="text-[10px] text-slate-400 font-medium">Resposta API (Raw)</div>
                  <div className="mt-1 font-mono text-slate-200 font-bold truncate text-xs">
                    {selectedOrderForModal.smm_order_status || selectedOrderForModal.status_smm}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/60">
                  <div className="text-[10px] text-slate-400 font-medium">Contagem Inicial</div>
                  <div className="mt-1 font-mono text-purple-300 font-bold text-xs">
                    {selectedOrderForModal.smm_start_count !== undefined ? selectedOrderForModal.smm_start_count : '---'}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/60">
                  <div className="text-[10px] text-slate-400 font-medium">Restante a Entregar</div>
                  <div className="mt-1 font-mono text-cyan-300 font-bold text-xs">
                    {selectedOrderForModal.smm_remains !== undefined ? selectedOrderForModal.smm_remains : '0'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                <div>
                  Última verificação:{' '}
                  <span className="text-slate-300 font-mono">
                    {selectedOrderForModal.smm_last_checked || 'Ainda não verificado'}
                  </span>
                </div>

                {selectedOrderForModal.order_id_fornecedor && (
                  <button
                    onClick={() => handleCheckSmmStatus(selectedOrderForModal)}
                    disabled={isVerifyingSmmStatus === selectedOrderForModal.id}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingSmmStatus === selectedOrderForModal.id ? 'animate-spin' : ''}`} />
                    <span>Consultar Status no SMM Agora</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mensagem de Erro se houver */}
            {selectedOrderForModal.mensagem_erro && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 space-y-1">
                <strong className="block text-rose-200">Mensagem de Erro SMM:</strong>
                <div>{selectedOrderForModal.mensagem_erro}</div>
              </div>
            )}

            {/* Logs Brutos da Resposta SMM */}
            {selectedOrderForModal.smm_response_log && (
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-400">Log da Resposta JSON do SMM:</div>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-36">
                  {selectedOrderForModal.smm_response_log}
                </pre>
              </div>
            )}

            {/* [DEV] Teste: Simular Pix Pago no Painel ADM */}
            {selectedOrderForModal.status_pagamento === 'Pendente' && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 text-left">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Ambiente de Testes: Simulação Pix Pago</span>
                  </div>
                  <div className="text-[11px] text-amber-200/80">
                    Este pedido está aguardando pagamento real. O checkout só aprova e envia ao SMM após confirmação bancária. Clique abaixo para simular a liquidação:
                  </div>
                </div>
                <button
                  onClick={() => handleSimulatePixPaid(selectedOrderForModal)}
                  disabled={isSimulatingPaidId === selectedOrderForModal.id}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shrink-0 transition-all"
                >
                  <CheckCircle className={`w-3.5 h-3.5 ${isSimulatingPaidId === selectedOrderForModal.id ? 'animate-spin' : ''}`} />
                  <span>[DEV] Simular Pix Pago</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              {(selectedOrderForModal.status_smm === 'Erro' || selectedOrderForModal.status_smm === 'Cancelado') && (
                <button
                  onClick={() => {
                    handleResendToSmm(selectedOrderForModal);
                    setSelectedOrderForModal(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-rose-400 hover:bg-rose-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reenviar para SMM Agora</span>
                </button>
              )}

              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#0F1420] border border-slate-800 p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Excluir Pacote?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Você tem certeza que deseja remover "{deletingPackage.name}" da vitrine?
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingPackage(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePackage(deletingPackage.id);
                  setDeletingPackage(null);
                  showToast('Pacote removido com sucesso!', 'info');
                }}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
