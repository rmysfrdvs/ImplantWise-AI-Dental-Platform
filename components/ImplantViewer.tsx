"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";

function ImplantModel() {
  return (
    <mesh castShadow receiveShadow>
      <cylinderGeometry args={[0.8, 0.5, 3, 32]} />
      <meshStandardMaterial color="#38bdf8" metalness={0.8} roughness={0.2} />
    </mesh>
  );
}

export default function ImplantViewer() {
  return (
    <div className="w-full h-full relative">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }}>
        <color attach="background" args={["#1e293b"]} />
        <Stage adjustCamera intensity={0.5} environment="city">
          <ImplantModel />
        </Stage>
        <OrbitControls makeDefault autoRotate autoRotateSpeed={2} />
      </Canvas>
      <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
        🖱️ Dondurmek icin surukleyin | Yakinlasmak icin kaydirin
      </div>
    </div>
  );
}