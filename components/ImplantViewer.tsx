"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import ProceduralImplant from "./implant/ProceduralImplant";
import { HotspotItem } from "./implant/hotspotData";

export default function ImplantViewer() {
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotItem | null>(null);
  const [isExploded, setIsExploded] = useState(false);
  const [showAnatomy, setShowAnatomy] = useState(false);

  return (
    <div className="w-full h-full relative">
      {/* Sol Üst Kontrol Paneli */}
      <div className="absolute top-4 left-4 z-40 flex flex-col gap-2">
        <button
          onClick={() => setIsExploded((prev) => !prev)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all cursor-pointer border ${
            isExploded
              ? "bg-amber-500 text-slate-950 border-amber-300"
              : "bg-slate-900/90 hover:bg-slate-800 text-slate-100 border-slate-700"
          }`}
        >
          <span>{isExploded ? "🧲 Parçaları Birleştir" : "🧩 Parçaları Ayır (Patlatılmış Görünüm)"}</span>
        </button>

        <button
          onClick={() => setShowAnatomy((prev) => !prev)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all cursor-pointer border ${
            showAnatomy
              ? "bg-rose-500 text-white border-rose-300"
              : "bg-slate-900/90 hover:bg-slate-800 text-slate-100 border-slate-700"
          }`}
        >
          <span>{showAnatomy ? "🙈 Doku Kesitini Gizle" : "🦴 Çene Kemiği & Diş Eti Kesiti"}</span>
        </button>
      </div>

      <Canvas shadows camera={{ position: [0, 0.45, 5.1], fov: 45 }}>
        <color attach="background" args={["#0f172a"]} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
        <pointLight position={[-4, 2, -4]} intensity={0.6} color="#38bdf8" />
        <Environment preset="city" />

        <ProceduralImplant
          onSelectHotspot={(spot) => setSelectedHotspot(spot)}
          activeId={selectedHotspot?.id ?? null}
          isExploded={isExploded}
          showAnatomy={showAnatomy}
        />

        <ContactShadows position={[0, -2.0, 0]} opacity={0.45} scale={6} blur={2.2} />

        <OrbitControls makeDefault autoRotate={!selectedHotspot && !showAnatomy} autoRotateSpeed={1.5} />
      </Canvas>

      {/* Seçilen Pin İçin Açılan Bilgi Kartı */}
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

      {/* Alt Bilgi Çubuğu */}
      <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
        🖱️ Döndürmek için sürükleyin | Parçalara veya 1, 2, 3 noktalarına tıklayın
      </div>
    </div>
  );
}