'use client';

import { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';

interface WpCollection {
  id: string;
  label: string;
  images: string[];
}

interface WpCategory {
  title: string;
  collections: WpCollection[];
}

function crearGaleria(carpeta: string, cantidad: number, sufijo: string): string[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const numero = String(i + 1).padStart(2, '0');
    return `/wallpapers/${carpeta}/img${numero}_${sufijo}.jpg`;
  });
}

const catalogo: Record<string, WpCategory> = {
  giras: {
    title: 'GIRAS',
    collections: [
      { id: 'runit', label: 'RUN IT Seoul', images: crearGaleria('Giras/RUNIT/Seoul', 3, 'rits') },
      { id: 'rimc', label: 'RUN IT Merch', images: crearGaleria('Giras/RUNIT/Merch', 3, 'rimc') },
      { id: 'maniac', label: 'MANIAC Encore', images: crearGaleria('Giras/Maniac/Encore', 3, 'mane') },
      { id: 'dominate_j', label: 'dominATE Japan', images: crearGaleria('Giras/dominATE/Japan', 3, 'atej') },
      { id: 'dominate_s', label: 'dominATE Seoul', images: crearGaleria('Giras/dominATE/Seoul', 3, 'ates') },
      { id: '5star', label: '5 STAR', images: crearGaleria('Giras/5STAR/t1', 3, '5st1') },
    ],
  },
  fanmeeting: {
    title: 'FANMEETING',
    collections: [
      { id: '1sts', label: '1ST LOVE STAY', images: crearGaleria('Fanmeeting/1stLoveSTAY', 3, '1sts') },
      { id: '2sts', label: '2ND LOVESTAY', images: crearGaleria('Fanmeeting/2ndLoveSTAY', 3, '2sts') },
      { id: 'stig', label: 'STAYING', images: crearGaleria('Fanmeeting/STAYing', 3, 'stig') },
      { id: 'tywd', label: 'TOYWORLD', images: crearGaleria('Fanmeeting/ToyWorld', 3, 'tywd') },
    ],
  },
};

export default function WallpaperSelector() {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [currentWp, setCurrentWp] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nachimbong_wallpaper');
      if (saved) setCurrentWp(saved);
    } catch {}
  }, []);

  const applyWallpaper = (url: string) => {
    setCurrentWp(url);
    try { localStorage.setItem('nachimbong_wallpaper', url); } catch {}
  };

  const activeCatData = activeCat ? catalogo[activeCat] : null;
  const activeCol = activeCatData?.collections?.find((c) => c.id === activeCollection);

  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <ImageIcon size={16} /> Fondo de la Interfaz
        </h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Personaliza el fondo de la interfaz con imágenes de giras y fanmeetings de Stray Kids.
        </p>

        {/* Category buttons */}
        <div className="flex gap-2 mb-4">
          {Object.entries(catalogo).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => {
                if (activeCat === key) {
                  setActiveCat(null);
                  setActiveCollection(null);
                } else {
                  setActiveCat(key);
                  setActiveCollection(cat.collections?.[0]?.id ?? null);
                }
              }}
              className={`btn-secondary ${activeCat === key ? 'active' : ''}`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Collection buttons */}
        {activeCatData && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeCatData.collections.map((col) => (
              <button
                key={col.id}
                onClick={() => setActiveCollection(activeCollection === col.id ? null : col.id)}
                className={`btn-secondary text-xs ${activeCollection === col.id ? 'active' : ''}`}
              >
                {col.label}
              </button>
            ))}
          </div>
        )}

        {/* Image grid */}
        {activeCol && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {activeCol.images.map((img, i) => (
              <img
                key={`${img}-${i}`}
                src={img}
                alt={`${activeCol.label} #${i + 1}`}
                className={`wp-thumb ${currentWp === img ? 'selected' : ''}`}
                onClick={() => applyWallpaper(img)}
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ))}
          </div>
        )}

        {!activeCat && (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            Selecciona una categoría para ver los fondos disponibles.
          </div>
        )}
      </div>
    </div>
  );
}
