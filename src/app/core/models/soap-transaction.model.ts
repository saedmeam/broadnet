export interface SoapRequest {
    tipoTransaccion: string;
    secuencial: string;
    lote: string;
    monto: string;
    cajero: string;
    clave: string;
    terminalId: string;
    merchant: string;
    servicio: string;
    telefono: string;
}

export const SOAP_DEFAULTS: Partial<SoapRequest> = {
    tipoTransaccion: '02',
    cajero: '5555',
    clave: '5555',
    terminalId: '10957975',
    merchant: '015912000100004',
    servicio: '02'
};
