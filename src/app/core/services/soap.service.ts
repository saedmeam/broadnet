import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, timeout, retry, throwError, catchError } from 'rxjs';
import { SoapRequest } from '../models/soap-transaction.model';

@Injectable({
    providedIn: 'root'
})
export class SoapService {
    private url = 'http://201.234.207.210/wsrecargas/service.asmx';

    constructor(private http: HttpClient) { }

    /**
     * Formatea el monto para que tenga 12 caracteres con ceros a la izquierda.
     * Ejemplo: "2.00" -> "000000000200"
     */
    private formatAmount(amount: string | number): string {
        const value = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(value) || value < 0) {
            throw new Error('Monto inválido: Debe ser un número positivo.');
        }
        const cents = Math.round(value * 100);
        return cents.toString().padStart(12, '0');
    }

    sendTransaction(request: SoapRequest): Observable<any> {
        const formattedAmount = this.formatAmount(request.monto);

        const xml = `
      <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <Transaccion xmlns="http://tempuri.org/">
            <tipoTransaccion>${request.tipoTransaccion}</tipoTransaccion>
            <secuencial>${request.secuencial}</secuencial>
            <lote>${request.lote}</lote>
            <monto>${formattedAmount}</monto>
            <cajero>${request.cajero}</cajero>
            <clave>${request.clave}</clave>
            <terminalId>${request.terminalId}</terminalId>
            <merchant>${request.merchant}</merchant>
            <servicio>${request.servicio}</servicio>
            <telefono>${request.telefono}</telefono>
          </Transaccion>
        </soap:Body>
      </soap:Envelope>
    `;

        const headers = new HttpHeaders({
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://tempuri.org/Transaccion'
        });

        return this.http.post(this.url, xml, { headers, responseType: 'text' }).pipe(
            timeout(30000), // 30 segundos de timeout según estándar
            retry(2),       // Realizar hasta 2 reintentos en caso de fallo de red
            catchError(err => {
                console.error('Error en Transaccion SOAP:', err);
                return throwError(() => err);
            })
        );
    }

    /**
     * Envía una transacción de reverso.
     * Típicamente el reverso usa el mismo secuencial que la original fallida
     * pero con un tipo de transacción específico (ej: '04' según estándares ISO/Broadnet).
     */
    sendReversal(request: SoapRequest): Observable<any> {
        const formattedAmount = this.formatAmount(request.monto);

        // El tipo de transacción para reverso puede variar, usualmente es '04'
        const reversalType = '04';

        const xml = `
      <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <Transaccion xmlns="http://tempuri.org/">
            <tipoTransaccion>${reversalType}</tipoTransaccion>
            <secuencial>${request.secuencial}</secuencial>
            <lote>${request.lote}</lote>
            <monto>${formattedAmount}</monto>
            <cajero>${request.cajero}</cajero>
            <clave>${request.clave}</clave>
            <terminalId>${request.terminalId}</terminalId>
            <merchant>${request.merchant}</merchant>
            <servicio>${request.servicio}</servicio>
            <telefono>${request.telefono}</telefono>
          </Transaccion>
        </soap:Body>
      </soap:Envelope>
    `;

        const headers = new HttpHeaders({
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://tempuri.org/Transaccion'
        });

        return this.http.post(this.url, xml, { headers, responseType: 'text' }).pipe(
            timeout(15000), // Reversos suelen tener timeout más corto
            retry(1)
        );
    }
}
