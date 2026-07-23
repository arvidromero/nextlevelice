import { useState } from 'react';
import api from '../api/client';
import { useBitacora } from '../context/BitacoraContext';

export default function Gastos() {
  const { bitacora } = useBitacora();
  const [tab, setTab] = useState('gas'); // 'gas' | 'extra'

  const [gas, setGas] = useState({ litros: '', importe: '', ubicacion: '' });
  const [extra, setExtra] = useState({ tipo: 'Gasto', concepto: '', importe: '' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  async function enviarGas(e) {
    e.preventDefault();
    setEnviando(true); setError(''); setOk('');
    try {
      await api.post(`/bitacoras/${bitacora.idBitacora}/abastecimientos`, {
        litros: gas.litros ? Number(gas.litros) : undefined,
        importe: Number(gas.importe),
        ubicacion: gas.ubicacion || undefined,
      });
      setOk('Gasolina registrada.');
      setGas({ litros: '', importe: '', ubicacion: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar');
    } finally {
      setEnviando(false);
    }
  }

  async function enviarExtra(e) {
    e.preventDefault();
    setEnviando(true); setError(''); setOk('');
    try {
      await api.post(`/bitacoras/${bitacora.idBitacora}/movimientos-extra`, {
        tipo: extra.tipo,
        concepto: extra.concepto,
        importe: Number(extra.importe),
      });
      setOk(`${extra.tipo === 'Gasto' ? 'Gasto' : 'Ingreso'} registrado.`);
      setExtra({ tipo: 'Gasto', concepto: '', importe: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 16, fontSize: 20 }}>Gastos</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <button type="button" className={tab === 'gas' ? 'btn btn-brand btn-sm' : 'btn btn-ghost btn-sm'} style={{ flex: 1 }} onClick={() => setTab('gas')}>Gasolina</button>
        <button type="button" className={tab === 'extra' ? 'btn btn-brand btn-sm' : 'btn btn-ghost btn-sm'} style={{ flex: 1 }} onClick={() => setTab('extra')}>Gasto / Ingreso</button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {ok && <div className="ok-banner">{ok}</div>}

      {tab === 'gas' ? (
        <form onSubmit={enviarGas}>
          <div className="field">
            <label>Litros (opcional)</label>
            <input type="number" step="0.01" inputMode="decimal" value={gas.litros} onChange={(e) => setGas({ ...gas, litros: e.target.value })} />
          </div>
          <div className="field">
            <label>Importe</label>
            <input required type="number" step="0.01" inputMode="decimal" value={gas.importe} onChange={(e) => setGas({ ...gas, importe: e.target.value })} />
          </div>
          <div className="field">
            <label>Gasolinera (opcional)</label>
            <input value={gas.ubicacion} onChange={(e) => setGas({ ...gas, ubicacion: e.target.value })} />
          </div>
          <button className="btn btn-brand" disabled={enviando}>{enviando ? 'Registrando...' : 'Registrar gasolina'}</button>
        </form>
      ) : (
        <form onSubmit={enviarExtra}>
          <div className="field">
            <label>Tipo</label>
            <select value={extra.tipo} onChange={(e) => setExtra({ ...extra, tipo: e.target.value })}>
              <option value="Gasto">Gasto (ej. llanta ponchada)</option>
              <option value="Ingreso">Ingreso (ej. cobro atrasado)</option>
            </select>
          </div>
          <div className="field">
            <label>Concepto</label>
            <input required value={extra.concepto} onChange={(e) => setExtra({ ...extra, concepto: e.target.value })} placeholder="Ej. Llanta ponchada" />
          </div>
          <div className="field">
            <label>Importe</label>
            <input required type="number" step="0.01" inputMode="decimal" value={extra.importe} onChange={(e) => setExtra({ ...extra, importe: e.target.value })} />
          </div>
          <button className="btn btn-brand" disabled={enviando}>{enviando ? 'Registrando...' : 'Registrar'}</button>
        </form>
      )}
    </div>
  );
}
