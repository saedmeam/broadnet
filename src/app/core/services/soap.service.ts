import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SoapService {
    private url = 'http://201.234.207.210/wsrecargas/service.asmx'; // Derived from PDF

    constructor(private http: HttpClient) { }

    sendTransaction(params: any): Observable<any> {
        const xml = `
      <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <Transaccion xmlns="http://tempuri.org/">
            <tipoTransaccion>${params.tipoTransaccion || '02'}</tipoTransaccion>
            <secuencial>${params.secuencial || '134985'}</secuencial>
            <lote>${params.lote || '190830'}</lote>
            <monto>${params.monto || '000000000200'}</monto>
            <cajero>${params.cajero || '5555'}</cajero>
            <clave>${params.clave || '5555'}</clave>
            <terminalId>${params.terminalId || '10957975'}</terminalId>
            <merchant>${params.merchant || '015912000100004'}</merchant>
            <servicio>${params.servicio || '02'}</servicio>
            <telefono>${params.telefono || '0962562205'}</telefono>
          </Transaccion>
        </soap:Body>
      </soap:Envelope>
    `;

        const headers = new HttpHeaders({
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://tempuri.org/Transaccion' // Typical .NET SOAP Action
        });

        return this.http.post(this.url, xml, { headers, responseType: 'text' });
    }
}
