import React, { useState, useEffect } from 'react';
import { processTransaction, TransactionParams } from './services/soap-transaction';

const SOAP_DEFAULTS = {
    tipoTransaccion: '02',
    cajero: '5555',
    clave: '5555',
    terminalId: '10957975',
    merchant: '015912000100004',
    servicio: '02'
};

function App() {
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const [config, setConfig] = useState<TransactionParams>({
        ...SOAP_DEFAULTS,
        monto: '2.00',
        secuencial: Math.floor(Math.random() * 1000000).toString(),
        lote: getCurrentDateFormatted(),
        telefono: '',
        servicio: '02',
        proveedor: 'GENERAL'
    });

    useEffect(() => {
        fetch('/assets/products.json')
            .then(res => res.json())
            .then(data => setProducts(data.Hoja1 || []))
            .catch(err => console.error('Error cargando productos:', err));
    }, []);

    function getCurrentDateFormatted() {
        const today = new Date();
        const year = today.getFullYear().toString().substring(2);
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        return year + month + day;
    }

    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const prod = products.find(p => p.codigo === e.target.value);
        setSelectedProduct(prod);
        if (prod) {
            const provider = prod.nombre?.split(' ')[0] || 'GENERAL';
            setConfig(prev => ({
                ...prev,
                monto: prod.preciovta.toString(),
                proveedor: provider
            }));
        }
    };

    const isValidPhone = () => /^\d{10}$/.test(config.telefono);
    const canSend = () => isValidPhone() && Number(config.monto) > 0 && !loading;

    const handleSend = async () => {
        if (!canSend()) return;
        setLoading(true);
        setResult(null);

        try {
            const { success, result, reversalSent } = await processTransaction(config);

            let message = success ? '✅ Transacción Exitosa' : '❌ Transacción Fallida';
            if (reversalSent) message += ' (Se intentó reverso automático)';

            setResult(`${message}\n\nResultado:\n${result}`);
        } catch (error: any) {
            setResult(`❌ Error crítico:\n${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="test-container">
            <h2>🚀 Broadnet SOAP - React Version</h2>

            <div className="grid-container">
                {/* Panel Izquierdo: Selección */}
                <div className="card">
                    <h3>📦 Selección de Producto</h3>
                    <div className="form-group">
                        <label>Buscar Producto:</label>
                        <select onChange={handleProductChange} value={selectedProduct?.codigo || ''}>
                            <option value="">-- Seleccione --</option>
                            {products.map(p => (
                                <option key={p.codigo} value={p.codigo}>{p.nombre.trim()}</option>
                            ))}
                        </select>
                    </div>

                    {selectedProduct && (
                        <div className="product-info">
                            <p><strong>Código:</strong> {selectedProduct.codigo}</p>
                            <p><strong>Precio:</strong> ${selectedProduct.preciovta}</p>
                            <p><strong>IVA:</strong> {selectedProduct.coniva ? 'Sí' : 'No'}</p>
                        </div>
                    )}
                </div>

                {/* Panel Derecho: Configuración */}
                <div className="card highlight">
                    <h3>⚙️ Parámetros</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Teléfono (10 dígitos):</label>
                            <input
                                type="text"
                                value={config.telefono}
                                onChange={e => setConfig({ ...config, telefono: e.target.value })}
                                maxLength={10}
                            />
                            {config.telefono && !isValidPhone() && <small className="error-text">⚠️ Inválido</small>}
                        </div>
                        <div className="form-group">
                            <label>Monto ($):</label>
                            <input
                                type="number"
                                value={config.monto}
                                onChange={e => setConfig({ ...config, monto: e.target.value })}
                                step="0.01"
                            />
                        </div>
                    </div>

                    <details>
                        <summary>Configuración Avanzada</summary>
                        <div className="advanced-grid">
                            <div className="form-group">
                                <label>Secuencial:</label>
                                <input type="text" value={config.secuencial} onChange={e => setConfig({ ...config, secuencial: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Lote:</label>
                                <input type="text" value={config.lote} onChange={e => setConfig({ ...config, lote: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Servicio:</label>
                                <input type="text" value={config.servicio} onChange={e => setConfig({ ...config, servicio: e.target.value })} />
                            </div>
                        </div>
                    </details>

                    <div className="actions-grid">
                        <button className="btn-primary" onClick={handleSend} disabled={!canSend()}>
                            ⚡ {loading ? 'Enviando...' : 'Enviar Transacción'}
                        </button>
                    </div>
                </div>
            </div>

            {result && (
                <div className="card result-card">
                    <h3>📡 Respuesta</h3>
                    <pre>{result}</pre>
                </div>
            )}
        </div>
    );
}

export default App;
