"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";

function Model() {
  // public/implant.glb dosyasini okur
  const { scene } = useGLTF("/implant.glb");
  return <primitive object={scene} scale={1.5} />;
}

export default function ImplantViewer() {
  return (
    <div className="w-full h-full relative">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }}>
        <color attach="background" args={["#1e293b"]} />
        <Suspense fallback={null}>
          <Stage adjustCamera intensity={0.5} environment="city">
            <Model />
          </Stage>
        </Suspense>
        <OrbitControls makeDefault autoRotate autoRotateSpeed={2} />
      </Canvas>
      <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
        🖱️ Döndürmek için sürükleyin | Yakınlaşmak için kaydırın
      </div>
    </div>
  );
}

useGLTF.preload("/implant.glb");