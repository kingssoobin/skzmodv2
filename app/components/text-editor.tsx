'use client';

import { useState } from 'react';
import { Type, Smile } from 'lucide-react';

const emojiCats: Record<string, string[]> = {
  fav: ['❤','⭐','⚡','🔥','👑','🐺','🌙','✨','🎵','💎','🦋','🌸','💫','🎀','🏆','🌈'],
  faces: ['😀','😍','🥰','😎','🤩','😭','😤','🥺','😂','🤣','😊','🙃','😏','🤔','😴','👻'],
  nature: ['🌸','🌺','🌻','🌹','🍀','🌿','🌊','🌋','🌙','☀️','⛅','❄️','🌈','🦋','🐺','🦊'],
  objects: ['💎','🎵','🎶','🎸','🎹','🎤','🎧','🏆','🎯','🎲','🎮','📱','💻','🔮','⚔️','🛸'],
  symbols: ['❤','🧡','💛','💚','💙','💜','🖤','🤍','♥','★','☆','♦','♣','♠','✦','✧'],
};

const fonts = [
  { id: 'Arial', label: 'Arial' },
  { id: 'serif', label: 'Serif' },
  { id: "'Courier New', monospace", label: 'Mono' },
];

interface Props {
  onApplyText: (lines: string[], font: string, fontSize: number) => void;
  onApplyEmoji: (emoji: string) => void;
}

export default function TextEditor({ onApplyText, onApplyEmoji }: Props) {
  const [numLines, setNumLines] = useState(1);
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [line3, setLine3] = useState('');
  const [font, setFont] = useState('Arial');
  const [fontSize, setFontSize] = useState(24);
  const [emojiCat, setEmojiCat] = useState('fav');
  const [subTab, setSubTab] = useState<'text' | 'emoji'>('text');

  const handleApply = () => {
    const lines = [line1, line2, line3].slice(0, numLines).filter((l) => l.length > 0);
    if (lines.length === 0) return;
    onApplyText(lines, font, fontSize);
  };

  const sizeMap: Record<number, number> = { 1: 28, 2: 22, 3: 16 };
  const changeLines = (n: number) => {
    setNumLines(n);
    setFontSize(sizeMap[n] ?? 24);
  };

  return (
    <div className="glass-card p-5 space-y-5">
      {/* Sub-tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setSubTab('text')}
          className={`btn-secondary flex items-center gap-2 ${subTab === 'text' ? 'active' : ''}`}
        >
          <Type size={14} /> Texto
        </button>
        <button
          onClick={() => setSubTab('emoji')}
          className={`btn-secondary flex items-center gap-2 ${subTab === 'emoji' ? 'active' : ''}`}
        >
          <Smile size={14} /> Emojis
        </button>
      </div>

      {subTab === 'text' && (
        <>
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Líneas</label>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => changeLines(n)}
                  className={`btn-secondary ${numLines === n ? 'active' : ''}`}
                >
                  {n}L
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              maxLength={20}
              placeholder="Línea 1..."
              className="w-full px-4 py-2.5 rounded-lg text-sm"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            />
            {numLines >= 2 && (
              <input
                type="text"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                maxLength={20}
                placeholder="Línea 2..."
                className="w-full px-4 py-2.5 rounded-lg text-sm"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              />
            )}
            {numLines >= 3 && (
              <input
                type="text"
                value={line3}
                onChange={(e) => setLine3(e.target.value)}
                maxLength={20}
                placeholder="Línea 3..."
                className="w-full px-4 py-2.5 rounded-lg text-sm"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              />
            )}
          </div>

          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Fuente</label>
            <div className="flex gap-2 flex-wrap">
              {fonts.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFont(f.id)}
                  className={`btn-secondary ${font === f.id ? 'active' : ''}`}
                  style={{ fontFamily: f.id }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              Tamaño: {fontSize}px
            </label>
            <input
              type="range"
              min={8}
              max={60}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          </div>

          <button onClick={handleApply} className="btn-primary w-full flex items-center justify-center gap-2">
            <Type size={16} /> Aplicar Texto
          </button>
        </>
      )}

      {subTab === 'emoji' && (
        <>
          <div className="flex gap-2 flex-wrap">
            {Object.keys(emojiCats).map((cat) => (
              <button
                key={cat}
                onClick={() => setEmojiCat(cat)}
                className={`btn-secondary text-sm ${emojiCat === cat ? 'active' : ''}`}
              >
                {cat === 'fav' ? '⭐' : cat === 'faces' ? '🙂' : cat === 'nature' ? '🌿' : cat === 'objects' ? '💎' : '❤'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-1">
            {(emojiCats[emojiCat] ?? []).map((em, i) => (
              <div key={`${em}-${i}`} className="emoji-item" onClick={() => onApplyEmoji(em)}>
                {em}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
