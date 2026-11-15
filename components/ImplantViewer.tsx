"use client";

import { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

const HOTSPOTS = [
  {
    id: 1,
    title: "Kron (Üst Yapı)",
    description:
      "Doğal diş anatomisine uygun tüberkül (çiğneme çıkıntısı) yapısına sahip, ışık geçirgenliği yüksek porselen veya zirkonyum kaplama.",
    position: [0, 1.12, 0.48] as [number, number, number],
  },
  {
    id: 2,
    title: "Abutment (Ara Parça)",
    description:
      "İmplant gövdesi ile protez diş (kron) arasındaki bağlantıyı kuran ve diş eti çıkış profilini destekleyen titanyum parça.",
    position: [0, 0.25, 0.34] as [number, number, number],
  },
  {
    id: 3,
    title: "İmplant Gövdesi (Vida)",
    description:
      "Çene kemiğine yerleştirilen ve kemik dokusuyla biyolojik olarak kaynaşan (osseointegrasyon) mikro-yivli titanyum vida.",
    position: [0, -0.85, 0.32] as [number, number, number],
  },
];

function ProceduralImplant({
  onSelectHotspot,
  activeId,
}: {
  onSelectHotspot: (item: (typeof HOTSPOTS)[0]) => void;
  activeId: number | null;
}) {
  // Gercekci Anatomik Azi Disi (Molar) Kron Geometrisi
  const crownGeometry = useMemo(() => {
    // Yuksek cozunurluklu kure uzerinden anatomik dis formu olusturma
    const geo = new THREE.SphereGeometry(0.52, 64, 64);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);

      // Normalize yukseklik (-1 taban, +1 cigneme yuzeyi)
      const ny = v.y / 0.52;
      const angle = Math.atan2(v.z, v.x);

      // 1. Disi hafif dortgenimsi (azi disi) forma yaklastir (4 kose siskinligi)
      const molarBulge = 1 + 0.11 * Math.cos(4 * angle + Math.PI / 4);
      v.x *= molarBulge * 1.08;
      v.z *= molarBulge * 0.96;

      // 2. Boyun kismi (dis eti birlesimi) daha dar, orta govde daha siskin
      if (ny < 0) {
        const neckTaper = 1 + ny * 0.38; // Alt tarafa dogru daralir
        v.x *= Math.max(0.52, neckTaper);
        v.z *= Math.max(0.52, neckTaper);
        v.y *= 0.85;
      } else {
        // 3. Ust cigneme yuzeyi (Okluzal tabela): 4 tuberkul (tepecik) ve orta oluk (fossa)
        const r = Math.sqrt(v.x * v.x + v.z * v.z);
        // 4 kosede tepecik olusturan dalga fonksiyonu
        const cusps =
          Math.pow(Math.abs(Math.cos(angle - Math.PI / 4)), 1.6) *
          Math.pow(Math.abs(Math.sin(angle - Math.PI / 4)), 1.6) *
          4;

        // Orta kisimda (fossa) hafif cukurluk, kenarlarda tepecikler
        const occlusalHeight =
          0.38 +
          0.14 * cusps * Math.sin(Math.min(1, r * 2.2) * Math.PI) -
          0.08 * Math.exp(-r * r * 14);

        v.y = THREE.MathUtils.lerp(v.y * 0.95, occlusalHeight, Math.pow(ny, 1.4));
      }

      pos.setXYZ(i, v.x, v.y, v.z);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  // Abutment (Ara Parca) icin anatomik konik profil
  const abutmentGeometry = useMemo(() => {
    const points = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.24, 0.0),
      new THREE.Vector2(0.26, 0.2),
      new THREE.Vector2(0.31, 0.44),
      new THREE.Vector2(0.25, 0.62),
      new THREE.Vector2(0.0, 0.62),
    ];
    return new THREE.LatheGeometry(points, 48);
  }, []);

  // Vida yivleri icin yukseklik listesi
  const threadHeights = [-0.2, -0.33, -0.46, -0.59, -0.72, -0.85, -0.98, -1.11, -1.24, -1.37];

  return (
    <group position={[0, 0.1, 0]}>
      {/* 1. PARCA: ANATOMIK PORSELEN / ZIRKONYUM KRON */}
      <group
        position={[0, 0.96, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectHotspot(HOTSPOTS[0]);
        }}
      >
        <mesh geometry={crownGeometry} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={activeId === 1 ? "#fef3c7" : "#f6f1e3"}
            roughness={0.14}
            metalness={0.0}
            clearcoat={1.0}
            clearcoatRoughness={0.08}
            reflectivity={0.9}
            sheen={0.35}
            sheenRoughness={0.4}
            sheenColor="#fffbeb"
            emissive={activeId === 1 ? "#f59e0b" : "#000000"}
            emissiveIntensity={activeId === 1 ? 0.14 : 0}
          />
        </mesh>
      </group>

      {/* 2. PARCA: ABUTMENT (Titanyum Ara Parca) */}
      <group
        position={[0, -0.04, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectHotspot(HOTSPOTS[1]);
        }}
      >
        <mesh geometry={abutmentGeometry} castShadow receiveShadow>
          <meshStandardMaterial
            color={activeId === 2 ? "#fde68a" : "#cbd5e1"}
            metalness={0.9}
            roughness={0.2}
            emissive={activeId === 2 ? "#d97706" : "#000000"}
            emissiveIntensity={activeId === 2 ? 0.25 : 0}
          />
        </mesh>
      </group>

      {/* 3. PARCA: IMPLANT GOVDESI (Yivli Titanyum Vida) */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelectHotspot(HOTSPOTS[2]);
        }}
      >
        {/* Ana Konik Govde */}
        <mesh position={[0, -0.82, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.14, 1.52, 48]} />
          <meshStandardMaterial
            color={activeId === 3 ? "#fcd34d" : "#94a3b8"}
            metalness={0.92}
            roughness={0.26}
            emissive={activeId === 3 ? "#b45309" : "#000000"}
            emissiveIntensity={activeId === 3 ? 0.25 : 0}
          />
        </mesh>

        {/* Yuvarlatilmis Apikal (Alt) Uc */}
        <mesh position={[0, -1.58, 0]} castShadow>
          <sphereGeometry args={[0.14, 32, 16]} />
          <meshStandardMaterial
            color={activeId === 3 ? "#fcd34d" : "#94a3b8"}
            metalness={0.92}
            roughness={0.26}
          />
        </mesh>

        {/* Keskin Kenarli Vida Yivleri */}
        {threadHeights.map((y, idx) => {
          const taper = 1 - idx * 0.036;
          return (
            <mesh key={idx} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0.07]} castShadow>
              <torusGeometry args={[0.232 * taper, 0.022, 6, 48]} />
              <meshStandardMaterial
                color={activeId === 3 ? "#fde68a" : "#64748b"}
                metalness={0.94}
                roughness={0.22}
              />
            </mesh>
          );
        })}
      </group>

      {/* 3D HOTSPOT PINLERI */}
      {HOTSPOTS.map((spot) => (
        <Html key={spot.id} position={spot.position} center zIndexRange={[100, 0]}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectHotspot(spot);
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-lg transition-all cursor-pointer border-2 ${
              activeId === spot.id
                ? "bg-amber-500 text-slate-950 border-white scale-125"
                : "bg-sky-500 hover:bg-sky-400 text-white border-white hover:scale-110"
            }`}
            title={spot.title}
          >
            {spot.id}
          </button>
        </Html>
      ))}
    </group>
  );
}

export default function ImplantViewer() {
  const [selectedHotspot, setSelectedHotspot] = useState<(typeof HOTSPOTS)[0] | null>(null);

  return (
    <div className="w-full h-full relative">
      <Canvas shadows camera={{ position: [0, 0.45, 4.3], fov: 45 }}>
        <color attach="background" args={["#0f172a"]} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
        <pointLight position={[-4, 2, -4]} intensity={0.6} color="#38bdf8" />
        <Environment preset="city" />

        <ProceduralImplant
          onSelectHotspot={(spot) => setSelectedHotspot(spot)}
          activeId={selectedHotspot?.id ?? null}
        />

        <ContactShadows position={[0, -1.72, 0]} opacity={0.45} scale={6} blur={2.2} />

        <OrbitControls makeDefault autoRotate={!selectedHotspot} autoRotateSpeed={1.5} />
      </Canvas>

      {/* Secilen Pin Icin Acilan Bilgi Karti */}
      {selectedHotspot && (
        <div className="absolute top-4 right-4 w-72 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-4 text-slate-100 shadow-2xl z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Bölüm #{selectedHotspot.id}
            </span>
            <button
              onClick={() => setSelectedHotspot(null)}
              className="text-slate-400 hover:text-white text-sm px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <h3 className="text-base font-bold text-white mb-1.5">{selectedHotspot.title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{selectedHotspot.description}</p>
        </div>
      )}

      {/* Alt Bilgi Cubugu */}
      <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
        🖱️ Döndürmek için sürükleyin | Parçalara veya 1, 2, 3 noktalarına tıklayın
      </div>
    </div>
  );
}