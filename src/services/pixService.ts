import QRCode from 'qrcode';

// CRC16-CCITT (Polynomial 0x1021, Init 0xFFFF) required by Central Bank of Brazil (Bacen)
export function calculateCRC16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Remove accents and special characters according to EMV standard
export function sanitizeAscii(text: string, maxLength: number): string {
  if (!text) return '';
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-zA-Z0-9 ]/g, '') // only alphanumeric and spaces
    .trim();
  return normalized.slice(0, maxLength);
}

// Format TLV (Tag-Length-Value)
function formatTLV(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export type PixKeyType = 'cnpj' | 'cpf' | 'email' | 'phone' | 'random' | 'unknown';

// Detect and validate Pix Key type
export function detectPixKeyType(key: string): { type: PixKeyType; cleanKey: string; isValid: boolean; label: string } {
  const trimmed = (key || '').trim();
  if (!trimmed) {
    return { type: 'unknown', cleanKey: '', isValid: false, label: 'Chave Vazia' };
  }

  // Digits only
  const digits = trimmed.replace(/\D/g, '');

  // 1. CPF (11 digits)
  if (digits.length === 11 && !trimmed.includes('@') && !trimmed.startsWith('+')) {
    return {
      type: 'cpf',
      cleanKey: digits,
      isValid: true,
      label: 'CPF (11 dígitos)',
    };
  }

  // 2. CNPJ (14 digits)
  if (digits.length === 14) {
    return {
      type: 'cnpj',
      cleanKey: digits,
      isValid: true,
      label: 'CNPJ (14 dígitos)',
    };
  }

  // 3. Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return {
      type: 'email',
      cleanKey: trimmed.toLowerCase(),
      isValid: true,
      label: 'E-mail',
    };
  }

  // 4. Phone (+55... or (xx) 9xxxx-xxxx)
  if (trimmed.startsWith('+') || (digits.length >= 10 && digits.length <= 11)) {
    let phone = digits;
    if (!phone.startsWith('55')) {
      phone = `55${phone}`;
    }
    return {
      type: 'phone',
      cleanKey: `+${phone}`,
      isValid: phone.length >= 12,
      label: 'Telefone Celular',
    };
  }

  // 5. Random Key (EVP - UUID format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(trimmed) || (trimmed.length >= 32 && !trimmed.includes(' '))) {
    return {
      type: 'random',
      cleanKey: trimmed,
      isValid: true,
      label: 'Chave Aleatória (EVP)',
    };
  }

  return {
    type: 'unknown',
    cleanKey: trimmed,
    isValid: trimmed.length >= 5,
    label: 'Chave Personalizada',
  };
}

export interface GeneratePixParams {
  pixKey: string;
  merchantName: string;
  merchantCity?: string;
  amount: number;
  txid?: string;
  description?: string;
}

export interface GeneratedPixResult {
  emvCode: string;
  qrCodeDataUrl: string;
  fallbackQrUrl: string;
  cleanKey: string;
  keyType: PixKeyType;
  txid: string;
  amountFormatted: string;
  crc16: string;
}

// Generate Brazilian Central Bank standard Pix BR Code (EMV)
export async function generatePixBrCode({
  pixKey,
  merchantName,
  merchantCity = 'SAO PAULO',
  amount,
  txid,
  description,
}: GeneratePixParams): Promise<GeneratedPixResult> {
  const { cleanKey, type: keyType } = detectPixKeyType(pixKey);

  const cleanMerchant = sanitizeAscii(merchantName || 'Social Networks', 25) || 'SOCIAL NETWORKS';
  const cleanCity = sanitizeAscii(merchantCity || 'SAO PAULO', 15) || 'SAO PAULO';
  
  // Bacen standard TXID: alphanumeric up to 25 chars, or '***' for dynamic/immediate
  const cleanTxid = txid
    ? txid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***'
    : '***';

  const amountStr = amount > 0 ? amount.toFixed(2) : '';

  // 1. Tag 26: Merchant Account Information - Pix
  let subTag26 = formatTLV('00', 'br.gov.bcb.pix');
  subTag26 += formatTLV('01', cleanKey);
  if (description) {
    const cleanDesc = sanitizeAscii(description, 25);
    if (cleanDesc) {
      subTag26 += formatTLV('02', cleanDesc);
    }
  }

  // 2. Tag 62: Additional Data Field (TXID)
  const subTag62 = formatTLV('05', cleanTxid);

  // 3. Assemble payload before CRC
  let payload = '';
  payload += formatTLV('00', '01'); // Payload Format Indicator
  payload += formatTLV('26', subTag26); // Merchant Account Information
  payload += formatTLV('52', '0000'); // Merchant Category Code (0000 = ISO 18245)
  payload += formatTLV('53', '986'); // Transaction Currency (986 = BRL)
  
  if (amountStr) {
    payload += formatTLV('54', amountStr); // Transaction Amount
  }

  payload += formatTLV('58', 'BR'); // Country Code
  payload += formatTLV('59', cleanMerchant); // Merchant Name
  payload += formatTLV('60', cleanCity); // Merchant City
  payload += formatTLV('62', subTag62); // Additional Data (txid)
  payload += '6304'; // CRC16 Tag ID and Length

  // 4. Calculate checksum
  const crc16 = calculateCRC16(payload);
  const emvCode = `${payload}${crc16}`;

  // 5. Generate high-resolution scannable QR Code as Data URL
  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(emvCode, {
      margin: 1,
      width: 360,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Erro ao gerar QRCode local:', err);
  }

  // External fallback QR server image
  const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(emvCode)}&size=300x300&margin=8`;

  return {
    emvCode,
    qrCodeDataUrl: qrCodeDataUrl || fallbackQrUrl,
    fallbackQrUrl,
    cleanKey,
    keyType,
    txid: cleanTxid,
    amountFormatted: amount.toFixed(2).replace('.', ','),
    crc16,
  };
}

// Verify and decode a Pix BR Code EMV payload
export function parseAndVerifyPixBrCode(emv: string): {
  isValid: boolean;
  pixKey?: string;
  merchantName?: string;
  merchantCity?: string;
  amount?: string;
  txid?: string;
  crcExpected?: string;
  crcCalculated?: string;
  error?: string;
} {
  const trimmed = (emv || '').trim();
  if (trimmed.length < 20) {
    return { isValid: false, error: 'Código Pix muito curto ou inválido' };
  }

  // Check CRC16
  const payloadWithoutCrc = trimmed.slice(0, -4);
  const expectedCrc = trimmed.slice(-4).toUpperCase();
  const calculatedCrc = calculateCRC16(payloadWithoutCrc);

  const crcValid = expectedCrc === calculatedCrc;

  // Extract key fields via regex or TLV walk
  const keyMatch = trimmed.match(/0014br\.gov\.bcb\.pix01(\d{2})([^\d]{0,2}[a-zA-Z0-9@.+_-]+)/);
  let pixKey = '';
  if (keyMatch) {
    const keyLen = parseInt(keyMatch[1], 10);
    const keyCandidate = trimmed.slice(trimmed.indexOf('0014br.gov.bcb.pix01') + 22, trimmed.indexOf('0014br.gov.bcb.pix01') + 22 + keyLen);
    pixKey = keyCandidate;
  }

  const amountMatch = trimmed.match(/54(\d{2})([0-9.]+)/);
  let amount = '';
  if (amountMatch) {
    const amtLen = parseInt(amountMatch[1], 10);
    amount = amountMatch[2].slice(0, amtLen);
  }

  return {
    isValid: crcValid,
    pixKey,
    amount,
    crcExpected: expectedCrc,
    crcCalculated: calculatedCrc,
    error: crcValid ? undefined : `Checksum CRC16 incorreto (Esperado: ${expectedCrc}, Calculado: ${calculatedCrc})`,
  };
}
