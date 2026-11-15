"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import ProceduralImplant from "./implant/ProceduralImplant";
import { HOTSPOTS, HotspotItem } from "./implant/hotspotData";
import {
  CROWN_MATERIALS,
  CrownMaterialId,
  TREATMENT_STAGES,
  TreatmentStageId,
} from "./implant/clinicalData";

export default function ImplantViewer() {
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotItem | null>(null);
  const [isExploded, setIsExploded] = useState(false);
  const [showAnatomy, setShowAnatomy] = useState(true);
  const [treatmentStage, setTreatmentStage] = useState<TreatmentStageId>(3);
  const [crownMaterial, setCrownMaterial] = useState<CrownMaterialId>("zirconia");
  const [showMaterialCard, setShowMaterialCard] = useState(false);

  const activeStage = TREATMENT_STAGES.find((s) => s.id === treatmentStage)!;
  const activeMaterial = CROWN_MATERIALS[crownMaterial];

  const handleStageChange = (stageId: TreatmentStageId) => {
    setTreatmentStage(stageId);
    if (stageId === 1 || stageId === 2) {
      setShowAnatomy(true);
      setIsExploded(false);
    }
  };

  return (
    <div className="w-full h-full relative">
      {/* SOL ÜST KONTROL PANELİ */}
      <div className="absolute top-4 left-4 z-40 flex flex-col gap-2 max-w-[260px]">
        <button
          onClick={() => {
            if (treatmentStage !== 3) setTreatmentStage(3);
            setIsExploded((prev) => !prev);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all cursor-pointer border ${
            isExploded
              ? "bg-amber-500 text-slate-950 border-amber-300"
              : "bg-slate-900/90 hover:bg-slate-800 text-slate-100 border-slate-700"
          }`}
        >
          <span>{isExploded ? "🧲 Parçaları Birleştir" : "🧩 Parçaları Ayır (Exploded View)"}</span>
        </button>

        <button
          onClick={() => setShowAnatomy((prev) => !prev)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all cursor-pointer border ${
            showAnatomy
              ? "bg-rose-500 text-white border-rose-300"
              : "bg-slate-900/90 hover:bg-slate-800 text-slate-100 border-slate-700"
          }`}
        >
          <span>{showAnatomy ? "🙈 Doku Kesitini Gizle" : "🦴 Çene Kemiği & Diş Eti Kesiti"}</span>
        </button>

        {/* Doku Katmanları Renk Göstergesi (Lejant) */}
        {showAnatomy && (
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-2 text-[11px] text-slate-200 flex flex-col gap-1 shadow">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-400 inline-block" />
              <span>Diş Eti (Gingiva)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-200 inline-block" />
              <span>Kortikal Kemik (Dış)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Trabeküler Kemik (İç)</span>
            </div>
          </div>
        )}

        {/* KRON MATERYALİ KARŞILAŞTIRICI */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-2.5 shadow-lg">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-300">🦷 Kron Materyali</span>
            <button
              onClick={() => setShowMaterialCard((prev) => !prev)}
              className="text-[10px] text-sky-400 hover:text-sky-300 underline cursor-pointer"
            >
              {showMaterialCard ? "Detayı Gizle" : "Karşılaştır"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                setCrownMaterial("zirconia");
                setShowMaterialCard(true);
                if (treatmentStage !== 3) setTreatmentStage(3);
              }}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                crownMaterial === "zirconia"
                  ? "bg-sky-500 text-white border-sky-300 shadow"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              Zirkonyum
            </button>
            <button
              onClick={() => {
                setCrownMaterial("emax");
                setShowMaterialCard(true);
                if (treatmentStage !== 3) setTreatmentStage(3);
              }}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                crownMaterial === "emax"
                  ? "bg-sky-500 text-white border-sky-300 shadow"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              E-Max Porselen
            </button>
          </div>
        </div>

        {/* Hızlı Parça Seçici */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-2.5 shadow-lg">
          <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">🔍 Parça İncele</span>
          <div className="flex gap-1.5">
            {HOTSPOTS.map((spot) => (
              <button
                key={spot.id}
                onClick={() => setSelectedHotspot(spot)}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                  selectedHotspot?.id === spot.id
                    ? "bg-amber-500 text-slate-950 border-amber-300"
                    : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                }`}
              >
                #{spot.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3D SAHNE */}
      <Canvas shadows camera={{ position: [0, 0.35, 5.3], fov: 45 }}>
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
          treatmentStage={treatmentStage}
          crownMaterial={crownMaterial}
        />

        <ContactShadows position={[0, -2.05, 0]} opacity={0.45} scale={6} blur={2.2} />

        <OrbitControls makeDefault autoRotate={!selectedHotspot && !showAnatomy} autoRotateSpeed={1.4} />
      </Canvas>

      {/* SAĞ ÜST PANELLER: Pin Bilgisi ve Materyal Karşılaştırma Kartı */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-3 w-72">
        {selectedHotspot && (
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                Parça #{selectedHotspot.id}
              </span>
              <button
                onClick={() => setSelectedHotspot(null)}
                className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">{selectedHotspot.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{selectedHotspot.description}</p>
          </div>
        )}

        {showMaterialCard && (
          <div className="bg-slate-900/95 backdrop-blur-md border border-sky-500/40 rounded-xl p-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                Materyal Analizi
              </span>
              <button
                onClick={() => setShowMaterialCard(false)}
                className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <h3 className="text-sm font-bold text-white">{activeMaterial.name}</h3>
            <p className="text-[11px] text-sky-300 mb-2">{activeMaterial.subtitle}</p>

            <div className="space-y-1 text-[11px] bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 mb-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Işık Geçirgenliği:</span>
                <span className="text-slate-100 font-medium">{activeMaterial.translucency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dayanıklılık:</span>
                <span className="text-slate-100 font-medium">{activeMaterial.durability}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">İdeal Bölge:</span>
                <span className="text-slate-100 font-medium">{activeMaterial.idealArea}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">{activeMaterial.description}</p>
          </div>
        )}
      </div>

      {/* ALT TEDAVİ SÜRECİ ZAMAN ÇİZELGESİ (TIMELINE) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl bg-slate-900/92 backdrop-blur-md border border-slate-700 rounded-2xl p-3 shadow-2xl">
        <div className="grid grid-cols-3 gap-2 mb-2">
          {TREATMENT_STAGES.map((stage) => {
            const isActive = stage.id === treatmentStage;
            return (
              <button
                key={stage.id}
                onClick={() => handleStageChange(stage.id)}
                className={`text-left px-3 py-2 rounded-xl transition-all cursor-pointer border ${
                  isActive
                    ? "bg-emerald-500/20 border-emerald-400 text-white"
                    : "bg-slate-800/70 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-semibold">
                  <span className={isActive ? "text-emerald-400" : "text-slate-400"}>
                    {stage.stepLabel}
                  </span>
                  <span className="text-[10px] opacity-80">{stage.duration}</span>
                </div>
                <div className="text-xs font-bold truncate mt-0.5">{stage.title}</div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 px-2 pt-1 border-t border-slate-800 text-[11px] text-slate-300">
          <p className="leading-snug">
            <strong className="text-emerald-400">{activeStage.title}:</strong> {activeStage.summary}
          </p>
        </div>
      </div>
    </div>
  );
}