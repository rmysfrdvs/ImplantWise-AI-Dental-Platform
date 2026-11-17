'use client';

import React from 'react';
import { ImplantModelSpec } from './implantCatalogData';

interface JawBoneSectionProps {
  jawContext: ImplantModelSpec['jawContext'];
  showBone: boolean;
}

export default function JawBoneSection({ jawContext, showBone }: JawBoneSectionProps) {
  if (!showBone) return null;

  // Üst çene & ileri anatomik tutunma (Zygoma / Pterygoid / Nazal duvar)
  if (
    jawContext === 'maxilla_zygoma' ||
    jawContext === 'maxilla_pterygoid' ||
    jawContext === 'maxilla_nasal'
  ) {
    return (
      <group>
        {/* Alt Maksilla Alveolar Kemik Tabanı */}
        <mesh position={[0, -0.45, 0]}>
          <boxGeometry args={[2.4, 0.85, 1.3]} />
          <meshStandardMaterial color="#f5d0a9" transparent opacity={0.42} roughness={0.75} />
        </mesh>
        {/* Üst Zygoma / Pterygoid / Nazal Kortikal Tutunma Bloğu */}
        <mesh
          position={[
            jawContext === 'maxilla_nasal' ? -0.65 : 0.75,
            1.25,
            0,
          ]}
        >
          <boxGeometry args={[1.45, 1.15, 1.25]} />
          <meshStandardMaterial color="#e6b88a" transparent opacity={0.48} roughness={0.7} />
        </mesh>
      </group>
    );
  }

  // Hareketli Protez & Mukoza (İntramukozal İnsert için)
  if (jawContext === 'mucosa_denture') {
    return (
      <group>
        {/* Diş eti (Mukoza) tabakası */}
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[2.2, 0.55, 1.2]} />
          <meshStandardMaterial color="#f472b6" transparent opacity={0.45} roughness={0.6} />
        </mesh>
        {/* Akrilik hareketli damak protez tabanı */}
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[2.2, 0.36, 1.2]} />
          <meshStandardMaterial color="#fb7185" transparent opacity={0.35} roughness={0.35} />
        </mesh>
      </group>
    );
  }

  // Dar Çene Kreti (Blade ve Subperiosteal için)
  if (jawContext === 'mandible_narrow') {
    return (
      <group>
        <mesh position={[0, -0.75, 0]}>
          <boxGeometry args={[2.3, 1.45, 0.68]} />
          <meshStandardMaterial color="#f3cfa7" transparent opacity={0.42} roughness={0.78} />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[2.35, 0.18, 0.74]} />
          <meshStandardMaterial color="#f472b6" transparent opacity={0.38} roughness={0.65} />
        </mesh>
      </group>
    );
  }

  // Standart Alt Çene Kesiti (Kortikal + Spongiyöz Kemik + Diş Eti)
  return (
    <group>
      {/* Spongiyöz (Süngerimsi) İç Kemik */}
      <mesh position={[0, -0.82, 0]}>
        <boxGeometry args={[2.2, 1.65, 1.25]} />
        <meshStandardMaterial color="#f3cfa7" transparent opacity={0.38} roughness={0.82} />
      </mesh>
      {/* Kortikal Dış Çerçeve Tabanı */}
      <mesh position={[0, -1.68, 0]}>
        <boxGeometry args={[2.3, 0.16, 1.32]} />
        <meshStandardMaterial color="#e2b487" transparent opacity={0.55} roughness={0.65} />
      </mesh>
      {/* Diş Eti (Gingiva) Katmanı */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[2.25, 0.22, 1.3]} />
        <meshStandardMaterial color="#f472b6" transparent opacity={0.38} roughness={0.6} />
      </mesh>
    </group>
  );
}