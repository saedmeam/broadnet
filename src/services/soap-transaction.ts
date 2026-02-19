
export interface TransactionParams {
    monto: string | number;
    secuencial: string;
    lote: string;
    telefono: string;
    terminalId: string;
    merchant: string;
    cajero: string;
    clave: string;
    tipoTransaccion?: string;
    servicio: string;
    proveedor: string; // Añadido explícitamente como parámetro
}

/**
 * Función unificada para procesar transacciones SOAP de Broadnet.
 * Maneja el envío de la transacción original y opcionalmente el reverso si el proveedor lo permite.
 *
 * @param params Parámetros de la transacción
 * @param provider El proveedor (ej: 'CLARO', 'MOVISTAR', etc.)
 * @param service El código del servicio
 */
export async function processTransaction(
    params: TransactionParams
): Promise<{ success: boolean; result: any; reversalSent?: boolean }> {
    const { proveedor, servicio } = params;

    // 1. Validaciones previas según documentación y robustez
    if (!params.telefono || params.telefono.length !== 10) {
        throw new Error('Teléfono debe tener 10 dígitos');
    }

    const formattedAmount = formatSoapAmount(params.monto);
    const soapUrl = 'http://201.234.207.210/wsrecargas/service.asmx';

    // 2. Construcción del XML Original
    const originalXml = buildSoapEnvelope({
        ...params,
        monto: formattedAmount,
        servicio: servicio,
        tipoTransaccion: params.tipoTransaccion || '02'
    });

    try {
        console.log(`[SOAP] Enviando transacción para ${proveedor} - Servicio: ${servicio}`);

        // 3. Ejecución con Timeout y Reintentos (Lógica integrada)
        const response = await fetchWithRetry(soapUrl, originalXml, {
            timeout: 30000,
            retries: 2
        });

        const result = await response.text();
        const isSuccess = checkResponseSuccess(result);

        return { success: isSuccess, result };

    } catch (error: any) {
        console.error('[SOAP] Error en transacción original:', error);

        // 4. Lógica de Reverso Condicional
        // Solo se intenta el reverso si es un error de timeout/red Y el proveedor lo permite
        if (shouldAttemptReversal(proveedor, servicio, error)) {
            console.log(`[SOAP] Intentando reverso automático para ${proveedor}...`);

            const reversalXml = buildSoapEnvelope({
                ...params,
                monto: formattedAmount,
                servicio: servicio,
                tipoTransaccion: '04' // Tipo Reverso universal
            });

            try {
                const revResponse = await fetchWithRetry(soapUrl, reversalXml, {
                    timeout: 15000,
                    retries: 1
                });
                const revResult = await revResponse.text();
                return { success: false, result: error.message, reversalSent: true };
            } catch (revError) {
                console.error('[SOAP] Error crítico: Falló incluso el reverso.', revError);
                return { success: false, result: `Error: ${error.message}. Falla en reverso: ${revError}`, reversalSent: true };
            }
        }

        throw error;
    }
}

// --- Utilidades Internas (Robustas) ---

function formatSoapAmount(amount: string | number): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(value) || value < 0) throw new Error('Monto inválido');
    return Math.round(value * 100).toString().padStart(12, '0');
}

function buildSoapEnvelope(p: TransactionParams): string {
    return `
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <Transaccion xmlns="http://tempuri.org/">
          <tipoTransaccion>${p.tipoTransaccion}</tipoTransaccion>
          <secuencial>${p.secuencial}</secuencial>
          <lote>${p.lote}</lote>
          <monto>${p.monto}</monto>
          <cajero>${p.cajero}</cajero>
          <clave>${p.clave}</clave>
          <terminalId>${p.terminalId}</terminalId>
          <merchant>${p.merchant}</merchant>
          <servicio>${p.servicio}</servicio>
          <telefono>${p.telefono}</telefono>
        </Transaccion>
      </soap:Body>
    </soap:Envelope>
  `.trim();
}

async function fetchWithRetry(url: string, body: string, options: { timeout: number, retries: number }): Promise<Response> {
    let attempt = 0;
    while (attempt <= options.retries) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), options.timeout);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://tempuri.org/Transaccion' },
                body,
                signal: controller.signal
            });
            clearTimeout(timer);
            if (response.ok) return response;
            throw new Error(`HTTP Error: ${response.status}`);
        } catch (err: any) {
            clearTimeout(timer);
            if (attempt === options.retries) throw err;
            attempt++;
            console.warn(`[SOAP] Reintento ${attempt}/${options.retries} tras error:`, err.message);
            await new Promise(r => setTimeout(r, 1000)); // Pequeña espera entre reintentos
        }
    }
    throw new Error('Máximo de reintentos alcanzado');
}

function checkResponseSuccess(xml: string): boolean {
    return xml.includes('<TransaccionResult>000</TransaccionResult>') || xml.includes('>OK<');
}

/**
 * Define qué proveedores y servicios son aptos para reverso.
 * Según documentación, típicamente Recargas (Claro, Movistar, CNT) lo permiten.
 * Servicios básicos (Agua, Luz) no suelen permitir reverso automático.
 */
function shouldAttemptReversal(provider: string, service: string, error: any): boolean {
    // Solo revertir si hubo un problema de tiempo de espera (incertidumbre)
    const isTimeout = error.name === 'AbortError' || error.message.includes('timeout');
    if (!isTimeout) return false;

    const allowedProviders = ['CLARO', 'MOVISTAR', 'CNT', 'TUENTI'];
    return allowedProviders.includes(provider.toUpperCase());
}
