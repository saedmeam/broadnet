import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SoapService } from '../../core/services/soap.service';

@Component({
    selector: 'app-test-soap',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="test-container">
      <h2>Prueba de Integración SOAP (Broadnet)</h2>

      <div class="form-group">
        <label for="productSelect">Seleccione Producto (desde Excel):</label>
        <select id="productSelect" [(ngModel)]="selectedProduct" (change)="onProductChange()">
          <option [ngValue]="null">-- Seleccione --</option>
          <option *ngFor="let prod of products()" [ngValue]="prod">
            {{ prod.descripcion }} ({{ prod.codigo }})
          </option>
        </select>
      </div>

      <div class="form-group" *ngIf="selectedProduct">
        <p><strong>Código Barras:</strong> {{ selectedProduct.codigobarr }}</p>
        <p><strong>Marca:</strong> {{ selectedProduct.marca }}</p>
      </div>

      <button (click)="invokeSoap()" [disabled]="!selectedProduct">
        Enviar Transacción SOAP
      </button>

      <div class="result" *ngIf="soapResult()">
        <h3>Resultado:</h3>
        <pre>{{ soapResult() }}</pre>
      </div>
    </div>
  `,
    styles: [`
    .test-container { padding: 2rem; max-width: 600px; }
    .form-group { margin-bottom: 1.5rem; }
    select { width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
    button { padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:disabled { background: #ccc; cursor: not-allowed; }
    .result { margin-top: 2rem; padding: 1rem; background: #f8f9fa; border: 1px solid #ddd; }
    pre { white-space: pre-wrap; font-size: 0.8rem; }
  `]
})
export class TestSoapComponent implements OnInit {
    products = signal<any[]>([]);
    selectedProduct: any = null;
    soapResult = signal<string | null>(null);

    constructor(private http: HttpClient, private soap: SoapService) { }

    ngOnInit() {
        this.http.get<any>('/assets/products.json').subscribe(data => {
            // Assuming MAESTRO sheet contains the products
            this.products.set(data.MAESTRO || []);
        });
    }

    onProductChange() {
        console.log('Selected:', this.selectedProduct);
    }

    invokeSoap() {
        const params = {
            tipoTransaccion: '02',
            secuencial: Math.floor(Math.random() * 1000000).toString(),
            lote: '260129', // Based on current date or PDF example
            monto: '000000000200', // $2.00 fixed for test
            telefono: this.selectedProduct.codigobarr || '0962562205',
            servicio: '02' // Recargas
        };

        this.soap.sendTransaction(params).subscribe({
            next: (res) => this.soapResult.set(res),
            error: (err) => this.soapResult.set('Error: ' + JSON.stringify(err))
        });
    }
}
