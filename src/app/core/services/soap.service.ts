import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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

        return this.http.post(this.url, xml, { headers, responseType: 'text' });
    }
}
