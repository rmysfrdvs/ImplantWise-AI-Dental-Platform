"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";

// Komsu dogal dis (kron + kok) bileseni
function NeighborTooth({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const { crownGeo, rootGeo } = useMemo(() => {
    // 1. Komsu dis kronu
    const cGeo = new THREE.SphereGeometry(0.44, 32, 32);
    const cPos = cGeo.attributes.position;
    const v = new THREE.Vector3();

    for (let i = 0; i < cPos.count; i++) {
      v.fromBufferAttribute(cPos, i);
      const ny = v.y / 0.44;
      const angle = Math.atan2(v.z, v.x);
      const bulge = 1 + 0.09 * Math.cos(4 * angle + Math.PI / 4);
      v.x *= bulge * 1.02;
      v.z *= bulge * 0.92;

      if (ny < 0) {
        const taper = 1 + ny * 0.35;
        v.x *= Math.max(0.55, taper);
        v.z *= Math.max(0.55, taper);
        v.y *= 0.85;
      } else {
        const r = Math.sqrt(v.x * v.x + v.z * v.z);
        const cusps =
          Math.pow(Math.abs(Math.cos(angle - Math.PI / 4)), 1.5) *
          Math.pow(Math.abs(Math.sin(angle - Math.PI / 4)), 1.5) *
          3.5;
        const occlusal = 0.32 + 0.11 * cusps * Math.sin(Math.min(1, r * 2.4) * Math.PI) - 0.06 * Math.exp(-r * r * 14);
        v.y = THREE.MathUtils.lerp(v.y * 0.92, occlusal, Math.pow(ny, 1.4));
      }
      cPos.setXYZ(i, v.x, v.y, v.z);
    }
    cGeo.computeVertexNormals();

    // 2. Komsu dis koku (cene kemigi icine uzanan)
    const rPoints = [
      new THREE.Vector2(0.0, -1.25),
      new THREE.Vector2(0.06, -1.15),
      new THREE.Vector2(0.16, -0.65),
      new THREE.Vector2(0.24, -0.15),
      new THREE.Vector2(0.26, 0.05),
      new THREE.Vector2(0.0, 0.05),
    ];
    const rGeo = new THREE.LatheGeometry(rPoints, 32);

    return { crownGeo: cGeo, rootGeo: rGeo };
  }, []);

  return (
    <group position={position} scale={scale}>
      {/* Komsu Dis Kronu */}
      <mesh geometry={crownGeo} position={[0, 0.36, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#f3ede0"
          roughness={0.18}
          clearcoat={0.9}
          transparent
          opacity={0.78}
        />
      </mesh>
      {/* Komsu Dis Koku (Dentin) */}
      <mesh geometry={rootGeo} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#e7d7b8"
          roughness={0.55}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default function JawBoneSection({ visible }: { visible: boolean }) {
  // Anatomik Cene Kemigi & Dis Eti Kesit Geometrileri (ExtrudeGeometry ile organik kavis)
  const { gingivaGeo, corticalGeo, trabecularGeo, pores } = useMemo(() => {
    const extrudeSettings = {
      steps: 1,
      depth: 1.15,
      bevelEnabled: true,
      bevelSegments: 5,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    };

    // 1. Dis Eti (Gingiva) - Dis boyunlarini saran dalgali mukoza hatti
    const gShape = new THREE.Shape();
    gShape.moveTo(-1.75, 0.42);
    gShape.bezierCurveTo(-1.45, 0.62, -1.15, 0.58, -0.95, 0.48); // Sol dis eti tepesi
    gShape.bezierCurveTo(-0.72, 0.56, -0.52, 0.56, -0.32, 0.44); // Sol papilla
    gShape.bezierCurveTo(-0.12, 0.38, 0.12, 0.38, 0.32, 0.44);   // Implant boynu etrafi
    gShape.bezierCurveTo(0.52, 0.56, 0.72, 0.56, 0.95, 0.48);    // Sag papilla
    gShape.bezierCurveTo(1.15, 0.58, 1.45, 0.62, 1.75, 0.42);    // Sag dis eti tepesi
    gShape.lineTo(1.72, 0.22);
    gShape.bezierCurveTo(0.8, 0.26, -0.8, 0.26, -1.72, 0.22);
    gShape.closePath();

    // 2. Kortikal Kemik (Dis Sert Kemik Kabugu)
    const cShape = new THREE.Shape();
    cShape.moveTo(-1.72, 0.22);
    cShape.bezierCurveTo(-0.8, 0.26, 0.8, 0.26, 1.72, 0.22);
    cShape.lineTo(1.62, -0.85);
    cShape.bezierCurveTo(1.45, -1.25, 0.6, -1.38, 0, -1.38);     // Cene alt tabani kavisi
    cShape.bezierCurveTo(-0.6, -1.38, -1.45, -1.25, -1.62, -0.85);
    cShape.closePath();

    // 3. Trabekuler Kemik (Ic Sungerimsi Kemik Cekirdegi)
    const tShape = new THREE.Shape();
    tShape.moveTo(-1.54, 0.12);
    tShape.bezierCurveTo(-0.7, 0.16, 0.7, 0.16, 1.54, 0.12);
    tShape.lineTo(1.44, -0.78);
    tShape.bezierCurveTo(1.28, -1.12, 0.5, -1.22, 0, -1.22);
    tShape.bezierCurveTo(-0.5, -1.22, -1.28, -1.12, -1.44, -0.78);
    tShape.closePath();

    // Sungerimsi kemik icindeki mikro gozenek noktaları
    const poreList: [number, number, number, number][] = [];
    for (let i = 0; i < 42; i++) {
      const px = Math.sin(i * 19.3) * 1.25;
      const py = -0.15 - Math.abs(Math.cos(i * 11.7)) * 0.88;
      // Implant vidasinin tam ustune gelmesin
      if (Math.abs(px) > 0.34) {
        const pz = Math.sin(i * 7.1) * 0.42;
        const radius = 0.025 + (i % 4) * 0.012;
        poreList.push([px, py, pz, radius]);
      }
    }

    const gGeo = new THREE.ExtrudeGeometry(gShape, extrudeSettings);
    const cGeo = new THREE.ExtrudeGeometry(cShape, extrudeSettings);
    const tGeo = new THREE.ExtrudeGeometry(tShape, { ...extrudeSettings, depth: 1.08 });

    // Merkezleme (Z ekseninde ortala)
    gGeo.translate(0, 0, -0.575);
    cGeo.translate(0, 0, -0.575);
    tGeo.translate(0, 0, -0.54);

    return { gingivaGeo: gGeo, corticalGeo: cGeo, trabecularGeo: tGeo, pores: poreList };
  }, []);

  return (
    <group position={[0, -0.45, 0]} visible={visible}>
      {/* SAĞ VE SOL DOĞAL KOMŞU DİŞLER */}
      <NeighborTooth position={[-1.08, 0.52, 0]} scale={0.94} />
      <NeighborTooth position={[1.08, 0.52, 0]} scale={0.94} />

      {/* 1. DİŞ ETİ (GINGIVA) DOKUSU */}
      <mesh geometry={gingivaGeo} receiveShadow>
        <meshPhysicalMaterial
          color="#f472b6"
          transparent
          opacity={0.55}
          roughness={0.28}
          clearcoat={0.8}
          clearcoatRoughness={0.15}
          depthWrite={false}
        />
      </mesh>

      {/* 2. KORTİKAL KEMİK (DIŞ SERT KEMİK TABAKASI) */}
      <mesh geometry={corticalGeo} receiveShadow>
        <meshStandardMaterial
          color="#fef3c7"
          transparent
          opacity={0.34}
          roughness={0.55}
          depthWrite={false}
        />
      </mesh>

      {/* 3. TRABEKÜLER / SÜNGERİMSİ KEMİK (İÇ KEMİK) */}
      <mesh geometry={trabecularGeo} receiveShadow>
        <meshStandardMaterial
          color="#f59e0b"
          transparent
          opacity={0.22}
          roughness={0.85}
          depthWrite={false}
        />
      </mesh>

      {/* SÜNGERİMSİ KEMİK GÖZENEKLERİ (TRABEKÜL DOKUSU) */}
      {pores.map(([x, y, z, r], idx) => (
        <mesh key={idx} position={[x, y, z]}>
          <sphereGeometry args={[r, 8, 8]} />
          <meshStandardMaterial
            color="#d97706"
            transparent
            opacity={0.32}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Anatomik Katman Etiketleri */}
      <Html position={[1.95, 0.45, 0.35]} center zIndexRange={[50, 0]}>
        <div
          className={`bg-rose-950/90 border border-rose-400/60 text-rose-200 text-[10px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap shadow transition-opacity duration-200 ${
            visible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          Diş Eti (Gingiva)
        </div>
      </Html>
      <Html position={[1.95, 0.05, 0.35]} center zIndexRange={[50, 0]}>
        <div
          className={`bg-amber-950/90 border border-amber-300/60 text-amber-200 text-[10px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap shadow transition-opacity duration-200 ${
            visible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          Kortikal Kemik
        </div>
      </Html>
      <Html position={[1.95, -0.55, 0.35]} center zIndexRange={[50, 0]}>
        <div
          className={`bg-orange-950/90 border border-orange-400/60 text-orange-200 text-[10px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap shadow transition-opacity duration-200 ${
            visible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          Trabeküler Kemik
        </div>
      </Html>
    </group>
  );
}