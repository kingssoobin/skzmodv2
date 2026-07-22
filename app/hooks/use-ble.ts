'use client';

import { useState, useCallback, useRef } from 'react';

const SERVICE_UUID = '0000ae30-0000-1000-8000-00805f9b34fb';
const CHAR_UUID = '0000ae01-0000-1000-8000-00805f9b34fb';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getNavigatorBluetooth(): any {
  return (navigator as any)?.bluetooth;
}

export function useBLE() {
  const [isConnected, setIsConnected] = useState(false);
  const deviceRef = useRef<any>(null);
  const charRef = useRef<any>(null);

  const connect = useCallback(async () => {
    try {
      const bt = getNavigatorBluetooth();
      if (!bt) {
        alert('Web Bluetooth no está disponible en este navegador. Usa Chrome o Edge.');
        return;
      }
      const device = await bt.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
      });
      device.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        charRef.current = null;
      });
      const server = await device?.gatt?.connect();
      if (!server) throw new Error('No se pudo conectar al GATT server');
      const service = await server.getPrimaryService(SERVICE_UUID);
      const characteristic = await service.getCharacteristic(CHAR_UUID);
      deviceRef.current = device;
      charRef.current = characteristic;
      setIsConnected(true);
    } catch (err: any) {
      console.error('BLE connect error:', err);
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect();
      }
    } catch {}
    setIsConnected(false);
    charRef.current = null;
  }, []);

  const sendCommand = useCallback(async (cmd: string) => {
    const chr = charRef.current;
    if (!chr) return;
    const encoder = new TextEncoder();
    const data = encoder.encode(cmd);
    await chr.writeValue(data);
  }, []);

  const sendOledChunks = useCallback(async (oledBytes: Uint8Array, perChunkDelay = 150) => {
    for (let part = 0; part < 16; part++) {
      const chunk = oledBytes.slice(part * 128, (part + 1) * 128);
      const hexData = Array.from(chunk)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');
      const partHex = part.toString(16).padStart(2, '0');
      const cmd = `810F00000000${partHex}${hexData},-`;
      await sendCommand(cmd);
      await sleep(perChunkDelay);
    }
  }, [sendCommand]);

  return {
    isConnected,
    characteristic: charRef.current,
    connect,
    disconnect,
    sendCommand,
    sendOledChunks,
  };
}
