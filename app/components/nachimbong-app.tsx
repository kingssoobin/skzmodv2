'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bluetooth, BluetoothOff, Send, Trash2, RotateCcw, Type, Zap, Settings, Image as ImageIcon, Palette } from 'lucide-react';
import ThemeSwitcher from './theme-switcher';
import TextEditor from './text-editor';
import AnimationGallery from './animation-gallery';
import WallpaperSelector from './wallpaper-selector';
import { useBLE } from '../hooks/use-ble';
import { canvasToOledBytes, hexToBytes, renderOledBytesVariant, pickBestModeForHex, padTo2048Bytes } from '../lib/oled-utils';

type Tab = 'texto' | 'animaciones' | 'fondos';

export default function NachimbongApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('texto');
  const [status, setStatus] = useState('Listo para conectar...');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastFrames, setLastFrames] = useState<string[]>([]);
  const [previewTimer, setPreviewTimerState] = useState<NodeJS.Timeout | null>(null);
  const [previewMode, setPreviewMode] = useState('standard');
  const [animSpeed, setAnimSpeed] = useState(10);
  const [currentAnimName, setCurrentAnimName] = useState<string | null>(null);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFramesRef = useRef<string[]>([]);
  const previewIdxRef = useRef(0);
  const transferInProgressRef = useRef(false);

  const [mounted, setMounted] = useState(false);
  const ble = useBLE();

  useEffect(() => { setMounted(true); }, []);

  // Restore canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    try {
      const saved = localStorage.getItem('last_oled_img');
      if (saved) {
        const img = new window.Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = saved;
      } else {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 128, 128);
      }
    } catch {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, 128, 128);
    }
  }, []);

  const saveCanvas = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (canvas) localStorage.setItem('last_oled_img', canvas.toDataURL());
    } catch {}
  }, []);

  const clearCanvas = useCallback(() => {
    stopPreview();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 128, 128);
    setLastFrames([]);
    lastFramesRef.current = [];
    setCurrentAnimName(null);
    saveCanvas();
    setStatus('Canvas limpiado.');
  }, [saveCanvas]);

  // Drawing
  const getPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (128 / rect.width),
      y: (e.clientY - rect.top) * (128 / rect.height),
    };
  }, []);

  const draw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [getPos]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  }, [draw]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    draw(e);
  }, [isDrawing, draw]);

  const handlePointerUp = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      saveCanvas();
    }
  }, [isDrawing, saveCanvas]);

  // Preview animation
  const stopPreview = useCallback(() => {
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
      setPreviewTimerState(null);
    }
  }, []);

  const startPreview = useCallback((framesHex: string[], mode: string = 'standard', fps: number = 10) => {
    stopPreview();
    if (!framesHex?.length) return;
    previewIdxRef.current = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const delay = Math.max(20, Math.round(1000 / fps));
    const renderCurrent = () => {
      const hex = framesHex[previewIdxRef.current];
      if (!hex) return;
      const bytes = hexToBytes(hex);
      renderOledBytesVariant(ctx, bytes, mode);
      if (!transferInProgressRef.current) {
        setStatus(`Vista previa: frame ${previewIdxRef.current + 1}/${framesHex.length} (${fps} FPS)`);
      }
      previewIdxRef.current = (previewIdxRef.current + 1) % framesHex.length;
    };

    renderCurrent();
    if (framesHex.length > 1) {
      const timer = setInterval(renderCurrent, delay);
      previewTimerRef.current = timer;
      setPreviewTimerState(timer);
    }
    saveCanvas();
  }, [stopPreview, saveCanvas]);

  // Load animation design
  const loadDesign = useCallback(async (name: string) => {
    stopPreview();
    setStatus(`Cargando ${name}...`);
    setCurrentAnimName(name);
    try {
      const res = await fetch(`/anim/${getAnimPath(name)}`);
      if (!res.ok) throw new Error('No encontrado');
      const text = await res.text();
      const framesHex = extractFramesFromJS(text, name);
      if (!framesHex?.length) {
        setStatus(`No se encontraron frames para: ${name}`);
        return;
      }
      const normalized = framesHex.map((h: string) => padTo2048Bytes(h));
      setLastFrames(normalized);
      lastFramesRef.current = normalized;

      let chosenMode = 'standard';
      try {
        chosenMode = pickBestModeForHex(normalized[0]);
      } catch { chosenMode = 'standard'; }
      setPreviewMode(chosenMode);

      if (normalized.length > 1) {
        startPreview(normalized, chosenMode, animSpeed);
      } else {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            renderOledBytesVariant(ctx, hexToBytes(normalized[0]), chosenMode);
            saveCanvas();
          }
        }
        setStatus(`Cargado: ${name} (1 frame, modo: ${chosenMode})`);
      }
    } catch (err: any) {
      setStatus(`Error cargando ${name}: ${err?.message ?? 'desconocido'}`);
    }
  }, [stopPreview, startPreview, saveCanvas, animSpeed]);

  // Send to device
  const sendToDevice = useCallback(async () => {
    if (!ble.isConnected || !ble.characteristic) {
      setStatus('⚠️ No hay conexión BLE. Conecta primero.');
      return;
    }
    transferInProgressRef.current = true;
    try {
      const frames = lastFramesRef.current;
      if (frames?.length > 0) {
        // Send animation frames
        for (let fi = 0; fi < frames.length; fi++) {
          const oledBytes = hexToBytes(frames[fi]);
          setStatus(`Enviando frame ${fi + 1}/${frames.length}...`);
          await ble.sendOledChunks(oledBytes);
        }
      } else {
        // Send current canvas
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const oledBytes = canvasToOledBytes(ctx);
        setStatus('Enviando imagen...');
        await ble.sendOledChunks(oledBytes);
      }
      // Reset command
      await ble.sendCommand('8110,-');
      setStatus('✅ ¡Enviado correctamente!');
    } catch (err: any) {
      setStatus(`⚠️ Error: ${err?.message ?? 'desconocido'}`);
    } finally {
      transferInProgressRef.current = false;
    }
  }, [ble]);

  // Apply text to canvas
  const applyText = useCallback((lines: string[], font: string, fontSize: number) => {
    stopPreview();
    setLastFrames([]);
    lastFramesRef.current = [];
    setCurrentAnimName(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${fontSize}px ${font}`;
    const lineHeight = fontSize * 1.25;
    const totalH = lineHeight * lines.length;
    const startY = (128 - totalH) / 2 + lineHeight / 2;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 64, startY + i * lineHeight);
    }
    saveCanvas();
    setStatus(`✅ ${lines.length} línea(s) aplicada(s).`);
  }, [stopPreview, saveCanvas]);

  // Apply emoji
  const applyEmoji = useCallback((emoji: string) => {
    stopPreview();
    setLastFrames([]);
    lastFramesRef.current = [];
    setCurrentAnimName(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '90px Arial';
    ctx.fillText(emoji, 64, 68);
    saveCanvas();
    setStatus(`Emoji cargado: ${emoji}`);
  }, [stopPreview, saveCanvas]);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'texto', label: 'Texto y Emojis', icon: Type },
    { id: 'animaciones', label: 'Animaciones', icon: Zap },
    { id: 'fondos', label: 'Fondos', icon: Palette },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-4 py-3"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: `blur(var(--glass-blur))`,
          WebkitBackdropFilter: `blur(var(--glass-blur))`,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xl font-bold" style={{ color: 'var(--accent-light)' }}>
              ✦ Nachimbong <span style={{ color: 'var(--text-primary)' }}>V2</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <span className={`status-dot ${ble.isConnected ? 'connected' : 'disconnected'}`} />
              <span style={{ color: 'var(--text-secondary)' }}>
                {ble.isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <button
              onClick={ble.isConnected ? ble.disconnect : ble.connect}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              {ble.isConnected ? <BluetoothOff size={16} /> : <Bluetooth size={16} />}
              <span className="hidden sm:inline">{ble.isConnected ? 'Desconectar' : 'Conectar'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* BLE warning */}
        {mounted && !('bluetooth' in (navigator as any)) && (
          <div className="glass-card p-4 mb-4 text-center" style={{ borderColor: 'var(--warning)' }}>
            <p className="text-sm" style={{ color: 'var(--warning)' }}>
              ⚠️ Tu navegador no soporta Web Bluetooth. Usa Chrome o Edge en HTTPS o localhost.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Canvas */}
          <div className="lg:col-span-5">
            <div className="glass-card p-6 flex flex-col items-center">
              <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
                Vista Previa OLED
              </h3>
              <div className="canvas-bezel">
                <canvas
                  ref={canvasRef}
                  width={128}
                  height={128}
                  style={{ width: 256, height: 256 }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  className="touch-none"
                />
              </div>
              {/* Canvas toolbar */}
              <div className="flex gap-2 mt-4 w-full">
                <button onClick={clearCanvas} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <Trash2 size={14} /> Limpiar
                </button>
                <button onClick={sendToDevice} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Send size={14} /> Enviar
                </button>
              </div>
              {/* Status */}
              <div
                className="mt-3 w-full text-xs font-mono px-3 py-2 rounded-lg text-center"
                style={{ background: 'var(--bg-secondary)', color: 'var(--accent-light)' }}
              >
                {status}
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="lg:col-span-7">
            {/* Tab bar */}
            <div className="flex gap-2 mb-4">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300"
                    style={{
                      background: activeTab === t.id ? 'var(--accent)' : 'var(--bg-card)',
                      color: activeTab === t.id ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${activeTab === t.id ? 'var(--accent)' : 'var(--border)'}`,
                    }}
                  >
                    <Icon size={16} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="tab-content-enter">
              {activeTab === 'texto' && (
                <TextEditor
                  onApplyText={applyText}
                  onApplyEmoji={applyEmoji}
                />
              )}
              {activeTab === 'animaciones' && (
                <AnimationGallery
                  onLoadDesign={loadDesign}
                  currentAnimName={currentAnimName}
                  animSpeed={animSpeed}
                  onSpeedChange={setAnimSpeed}
                />
              )}
              {activeTab === 'fondos' && <WallpaperSelector />}
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs" style={{ color: 'var(--text-muted)' }}>
        SKZ NACHIMBONG V2 • OLED STUDIO
      </footer>
    </div>
  );
}

// Helpers to resolve anim file paths
function getAnimPath(name: string): string {
  const mexa = ['wolfchan_mexa','puppym_mexa','bbokari_mexa','quokka_mexa','foxyny_mexa','dwaekki_mexa','leebit_mexa','jiniret_mexa'];
  const an01 = ['bangchan_an01','seungmin_an01','felix_an01','in_an01','han_an01','leeknow_an01','changbin_an01','hyunjin_an01'];
  const logos = ['dominate','runit','runit2','sclass','straycity','venom','maniac','rockstar','maxident','tasylogo','thisandthat'];
  const stay = ['ymsks','stayangel','tasy'];
  const prueba = ['numero10'];
  if (mexa.includes(name)) return `mexa/${name}.js`;
  if (an01.includes(name)) return `an01/${name}.js`;
  if (logos.includes(name)) return `logos/${name}.js`;
  if (stay.includes(name)) return `stay/${name}.js`;
  if (prueba.includes(name)) return `prueba/${name}.js`;
  return `${name}.js`;
}

function extractFramesFromJS(jsCode: string, name: string): string[] {
  // Extract ORIGINAL_CHUNKS array from the JS file
  const match = jsCode.match(/ORIGINAL_CHUNKS\s*=\s*\[([\s\S]*?)\];/);
  if (!match?.[1]) return [];
  // Extract hex strings
  const hexStrings: string[] = [];
  const strRegex = /"([0-9A-Fa-f]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = strRegex.exec(match[1])) !== null) {
    if (m[1]?.length >= 100) hexStrings.push(m[1]);
  }
  return hexStrings;
}
