'use client';

import { Zap, Play } from 'lucide-react';

interface AnimConfig {
  name: string;
  label: string;
  group: string;
}

const animations: AnimConfig[] = [
  // SKZOO Mexa
  { name: 'wolfchan_mexa', label: 'Wolf Chan', group: 'SKZOO Mexa' },
  { name: 'puppym_mexa', label: 'PuppyM', group: 'SKZOO Mexa' },
  { name: 'bbokari_mexa', label: 'BbokAri', group: 'SKZOO Mexa' },
  { name: 'quokka_mexa', label: 'Quokka', group: 'SKZOO Mexa' },
  { name: 'foxyny_mexa', label: 'FoxI.NY', group: 'SKZOO Mexa' },
  { name: 'dwaekki_mexa', label: 'Dwaekki', group: 'SKZOO Mexa' },
  { name: 'leebit_mexa', label: 'Leebit', group: 'SKZOO Mexa' },
  { name: 'jiniret_mexa', label: 'Jiniret', group: 'SKZOO Mexa' },
  // An01
  { name: 'bangchan_an01', label: 'Bang Chan', group: 'Con Maracas' },
  { name: 'seungmin_an01', label: 'Seungmin', group: 'Con Maracas' },
  { name: 'felix_an01', label: 'Felix', group: 'Con Maracas' },
  { name: 'in_an01', label: 'I.N', group: 'Con Maracas' },
  { name: 'han_an01', label: 'Han', group: 'Con Maracas' },
  { name: 'leeknow_an01', label: 'Lee Know', group: 'Con Maracas' },
  { name: 'changbin_an01', label: 'Changbin', group: 'Con Maracas' },
  { name: 'hyunjin_an01', label: 'Hyunjin', group: 'Con Maracas' },
  // Logos
  { name: 'dominate', label: 'dominATE', group: 'Logos SKZ' },
  { name: 'runit', label: 'RUN IT', group: 'Logos SKZ' },
  { name: 'runit2', label: 'RUN IT 2', group: 'Logos SKZ' },
  { name: 'sclass', label: 'S-Class', group: 'Logos SKZ' },
  { name: 'straycity', label: 'Stray City', group: 'Logos SKZ' },
  { name: 'venom', label: 'Venom', group: 'Logos SKZ' },
  { name: 'maniac', label: 'MANIAC', group: 'Logos SKZ' },
  { name: 'rockstar', label: 'ROCKSTAR', group: 'Logos SKZ' },
  { name: 'maxident', label: 'MAXIDENT', group: 'Logos SKZ' },
  { name: 'tasylogo', label: 'TASY Logo', group: 'Logos SKZ' },
  { name: 'thisandthat', label: 'This & That', group: 'Logos SKZ' },
  // STAY
  { name: 'ymsks', label: 'YMSKS', group: 'STAY' },
  { name: 'stayangel', label: 'STAY Angel', group: 'STAY' },
  { name: 'tasy', label: 'TASY', group: 'STAY' },
];

interface Props {
  onLoadDesign: (name: string) => void;
  currentAnimName: string | null;
  animSpeed: number;
  onSpeedChange: (speed: number) => void;
}

export default function AnimationGallery({ onLoadDesign, currentAnimName, animSpeed, onSpeedChange }: Props) {
  const groups = [...new Set(animations.map((a) => a.group))];

  return (
    <div className="space-y-5">
      {/* Speed control */}
      <div className="glass-card p-4">
        <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
          <Zap size={12} className="inline mr-1" />
          Velocidad: {animSpeed} FPS
        </label>
        <input
          type="range"
          min={1}
          max={30}
          value={animSpeed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
        />
      </div>

      {groups.map((group) => (
        <div key={group}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            {group}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {animations
              .filter((a) => a.group === group)
              .map((anim) => (
                <div
                  key={anim.name}
                  className={`anim-card ${currentAnimName === anim.name ? 'active' : ''}`}
                  onClick={() => onLoadDesign(anim.name)}
                >
                  <Play size={20} className="mx-auto mb-1" style={{ color: 'var(--accent-light)' }} />
                  <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {anim.label}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
