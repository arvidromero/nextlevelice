import { useEffect } from 'react';
import api from '../api/client';

export function useUbicacionPing(bitacora) {
  useEffect(() => {
    if (!bitacora || bitacora.estado !== 'EnOperacion') return;
    if (!navigator.geolocation) return;

    function mandarUbicacion() {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          api.post('/ubicacion-actual', {
            idVehiculo: bitacora.idVehiculo,
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
          }).catch(() => {}); // fallo silencioso -- no interrumpe al chofer
        },
        () => {}, // sin permiso de GPS -- no truena la app
        { enableHighAccuracy: false, timeout: 15000 }
      );
    }

    mandarUbicacion(); // primer ping inmediato
    const intervalo = setInterval(mandarUbicacion, 2 * 60 * 1000);
    return () => clearInterval(intervalo);
  }, [bitacora?.idBitacora, bitacora?.estado]);
}
