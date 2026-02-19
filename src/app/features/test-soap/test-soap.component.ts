import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SoapService } from '../../core/services/soap.service';
import { SoapRequest, SOAP_DEFAULTS } from '../../core/models/soap-transaction.model';

@Component({
    selector: 'app-test-soap',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="test-container">
      <h2>🚀 Broadnet SOAP Integration Test</h2>

      <div class="grid-container">
        <!-- Panel Izquierdo: Selección de Producto -->
        <div class="card">
          <h3>📦 Selección de Producto</h3>
          <div class="form-group">
            <label for="productSelect">Buscar Producto (JSON):</label>
            <select id="productSelect" [(ngModel)]="selectedProduct" (change)="onProductChange()">
              <option [ngValue]="null">-- Seleccione un producto --</option>
              <option *ngFor="let prod of products()" [ngValue]="prod">
                {{ prod.nombre.trim() }}
              </option>
            </select>
          </div>

          <div class="product-info" *ngIf="selectedProduct">
            <p><strong>Código:</strong> {{ selectedProduct.codigo }}</p>
            <p><strong>Precio Sugerido:</strong> {{ selectedProduct.preciovta | currency }}</p>
            <p><strong>IVA:</strong> {{ selectedProduct.coniva ? 'Sí' : 'No' }}</p>
            <p><strong>Línea:</strong> {{ selectedProduct.linom }}</p>
          </div>
        </div>

        <!-- Panel Derecho: Configuración de Transacción -->
        <div class="card highlight">
          <h3>⚙️ Parámetros de Transacción</h3>

          <div class="form-row">
            <div class="form-group">
                <label>Teléfono/Referencia (10 dígitos):</label>
                <input type="text" [(ngModel)]="config.telefono" placeholder="Ej: 0999999999" maxlength="10">
                <small class="error-text" *ngIf="config.telefono && !isValidPhone()">⚠️ Debe tener 10 dígitos numéricos</small>
            </div>
            <div class="form-group">
                <label>Monto ($):</label>
                <input type="number" [(ngModel)]="config.monto" step="0.01" min="0.01">
                <small class="error-text" *ngIf="+config.monto <= 0">⚠️ El monto debe ser mayor a 0</small>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
                <label>Secuencial:</label>
                <input type="text" [(ngModel)]="config.secuencial">
            </div>
            <div class="form-group">
                <label>Lote:</label>
                <input type="text" [(ngModel)]="config.lote">
            </div>
          </div>

          <details>
            <summary>Configuración Avanzada (Merchant / Terminal)</summary>
            <div class="advanced-grid">
                <div class="form-group">
                    <label>Terminal ID:</label>
                    <input type="text" [(ngModel)]="config.terminalId">
                </div>
                <div class="form-group">
                    <label>Merchant ID:</label>
                    <input type="text" [(ngModel)]="config.merchant">
                </div>
                <div class="form-group">
                    <label>Cajero:</label>
                    <input type="text" [(ngModel)]="config.cajero">
                </div>
                <div class="form-group">
                    <label>Clave:</label>
                    <input type="password" [(ngModel)]="config.clave">
                </div>
                <div class="form-group">
                    <label>Tipo Transn:</label>
                    <input type="text" [(ngModel)]="config.tipoTransaccion">
                </div>
                <div class="form-group">
                    <label>Servicio:</label>
                    <input type="text" [(ngModel)]="config.servicio">
                </div>
            </div>
          </details>

          <div class="actions-grid">
            <button class="btn-primary" (click)="invokeSoap()" [disabled]="!canSendTransaction() || loading()">
                ⚡ {{ loading() ? 'Procesando...' : 'Enviar Transacción SOAP' }}
            </button>
            <button class="btn-warning" (click)="invokeReversal()" [disabled]="!config.secuencial || loading()">
                🔄 Enviar Reverso
            </button>
          </div>
        </div>
      </div>

      <!-- Consola de Resultados -->
      <div class="card result-card" *ngIf="soapResult() || loading()">
        <h3>📡 Respuesta del Servidor</h3>
        <div class="spinner" *ngIf="loading()">Enviando petición...</div>
        <pre *ngIf="soapResult()">{{ soapResult() }}</pre>
      </div>
    </div>
  `,
    styles: [`
    .test-container { padding: 2rem; font-family: 'Segoe UI', system-ui, sans-serif; background: #f4f7f6; min-height: 100vh; }
    h2 { color: #2c3e50; margin-bottom: 2rem; border-bottom: 2px solid #3498db; padding-bottom: 0.5rem; }
    .grid-container { display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem; }
    .card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; }
    .card.highlight { border-top: 4px solid #3498db; }
    h3 { margin-top: 0; font-size: 1.1rem; color: #34495e; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-bottom: 1.2rem; }

    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #7f8c8d; margin-bottom: 0.4rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    input, select {
        width: 100%; padding: 0.6rem; border: 1px solid #dcdde1; border-radius: 6px; font-size: 0.9rem; transition: border-color 0.2s;
        box-sizing: border-box;
    }
    input:focus { outline: none; border-color: #3498db; }

    .product-info { margin-top: 1rem; padding: 1rem; background: #e8f4fd; border-radius: 8px; font-size: 0.9rem; }
    .product-info p { margin: 0.4rem 0; color: #2980b9; }

    details { margin-top: 1.5rem; background: #f9f9f9; padding: 0.8rem; border-radius: 8px; cursor: pointer; }
    summary { font-weight: 600; color: #34495e; font-size: 0.9rem; }
    .advanced-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.8rem; margin-top: 1rem; }

    .actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }

    .btn-primary {
        padding: 0.8rem; background: #3498db; color: white; border: none;
        border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;
    }
    .btn-primary:hover:not(:disabled) { background: #2980b9; }

    .btn-warning {
        padding: 0.8rem; background: #f39c12; color: white; border: none;
        border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;
    }
    .btn-warning:hover:not(:disabled) { background: #e67e22; }

    .btn-primary:disabled, .btn-warning:disabled { background: #bdc3c7; cursor: not-allowed; }

    .result-card { margin-top: 2rem; background: #2d3436; color: #dfe6e9; border: none; }
    .result-card h3 { color: #00cec9; border-color: #636e72; }
    pre { white-space: pre-wrap; word-break: break-all; font-family: 'Consolas', monospace; font-size: 0.85rem; background: #1e272e; padding: 1rem; border-radius: 6px; }

    .error-text { color: #e74c3c; font-size: 0.75rem; margin-top: 0.2rem; display: block; }

    @media (max-width: 900px) { .grid-container { grid-template-columns: 1fr; } }
  `]
})
export class TestSoapComponent implements OnInit {
    products = signal<any[]>([]);
    selectedProduct: any = null;
    soapResult = signal<string | null>(null);
    loading = signal<boolean>(false);

    // Configuración de la transacción inicializada con valores por defecto
    config: SoapRequest = {
        ...SOAP_DEFAULTS,
        monto: '2.00',
        secuencial: '',
        lote: this.getCurrentDateFormatted(),
        telefono: ''
    } as SoapRequest;

    constructor(private http: HttpClient, private soap: SoapService) { }

    ngOnInit() {
        this.http.get<any>('/assets/products.json').subscribe(data => {
            // El JSON original tiene una propiedad "Hoja1" según lo visto previamente
            this.products.set(data.Hoja1 || []);
        });

        // Generar un secuencial aleatorio inicial
        this.config.secuencial = Math.floor(Math.random() * 1000000).toString();
    }

    private getCurrentDateFormatted(): string {
        const today = new Date();
        const year = today.getFullYear().toString().substring(2);
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        return year + month + day; // Formato YYMMDD
    }

    onProductChange() {
        if (this.selectedProduct) {
            this.config.monto = this.selectedProduct.preciovta.toString();
            console.log('Producto seleccionado:', this.selectedProduct);
        }
    }

    isValidPhone(): boolean {
        return /^\d{10}$/.test(this.config.telefono);
    }

    canSendTransaction(): boolean {
        return this.isValidPhone() && +this.config.monto > 0;
    }

    private extractXmlContent(xml: string, tagName: string): string {
        const match = xml.match(new RegExp(`<${tagName}>(.*?)<\/${tagName}>`));
        return match ? match[1] : '';
    }

    invokeSoap() {
        if (!this.canSendTransaction()) return;

        this.loading.set(true);
        this.soapResult.set(null);

        // Asegurar que el secuencial cambie para cada prueba
        if (!this.config.secuencial) {
            this.config.secuencial = Math.floor(Math.random() * 1000000).toString();
        }

        this.soap.sendTransaction(this.config).subscribe({
            next: (res) => {
                const errorMsg = this.extractXmlContent(res, 'Mensaje');
                const codError = this.extractXmlContent(res, 'TransaccionResult');

                let summary = `✅ Respuesta Procesada:\n`;
                summary += `Código: ${codError || 'N/A'}\n`;
                summary += `Mensaje: ${errorMsg || 'Sin mensaje de Broadnet'}\n\n`;
                summary += `XML Original:\n` + res;

                this.soapResult.set(summary);
                this.loading.set(false);
            },
            error: (err) => {
                this.soapResult.set('❌ Error de conexión o timeout después de 2 reintentos.\nDetalles: ' + (err.statusText || 'Error de Red'));
                this.loading.set(false);
            }
        });
    }

    invokeReversal() {
        this.loading.set(true);
        this.soapResult.set(null);

        this.soap.sendReversal(this.config).subscribe({
            next: (res) => {
                this.soapResult.set('🔄 Reverso enviado:\n' + res);
                this.loading.set(false);
                // Después de un reverso, generamos nuevo secuencial
                this.config.secuencial = Math.floor(Math.random() * 1000000).toString();
            },
            error: (err) => {
                this.soapResult.set('❌ Error en Reverso:\n' + JSON.stringify(err, null, 2));
                this.loading.set(false);
            }
        });
    }
}
