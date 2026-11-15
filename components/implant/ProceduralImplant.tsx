"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HOTSPOTS, HotspotItem } from "./hotspotData";
import { CrownMaterialId, TreatmentStageId } from "./clinicalData";
import JawBoneSection from "./JawBoneSection";

function PinMarker({
  spot,
  activeId,
  onSelect,
}: {
  spot: HotspotItem;
  activeId: number | null;
  onSelect: (item: HotspotItem) => void;
}) {
  const isSelected = activeId === spot.id;

  return (
    <group
      position={spot.offset}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(spot);
      }}
    >
      {/* Dış beyaz halka */}
      <mesh>
        <sphereGeometry args={[isSelected ? 0.085 : 0.068, 24, 24]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      {/* İç renkli çekirdek */}
      <mesh>
        <sphereGeometry args={[isSelected ? 0.065 : 0.052, 24, 24]} />
        <meshStandardMaterial
          color={isSelected ? "#f59e0b" : "#0ea5e9"}
          emissive={isSelected ? "#f59e0b" : "#0284c7"}
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
}

export default function ProceduralImplant({
  onSelectHotspot,
  activeId,
  isExploded,
  showAnatomy,
  treatmentStage,
  crownMaterial,
}: {
  onSelectHotspot: (item: HotspotItem) => void;
  activeId: number | null;
  isExploded: boolean;
  showAnatomy: boolean;
  treatmentStage: TreatmentStageId;
  crownMaterial: CrownMaterialId;
}) {
  const crownGroupRef = useRef<THREE.Group>(null);
  const abutmentGroupRef = useRef<THREE.Group>(null);
  const screwGroupRef = useRef<THREE.Group>(null);
  const osseoGlowRef = useRef<THREE.Mesh>(null);

  const hasProsthetics = treatmentStage === 3;
  const isHealingStage = treatmentStage === 2;

  const crownGeometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.52, 64, 64);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const ny = v.y / 0.52;
      const angle = Math.atan2(v.z, v.x);

      const molarBulge = 1 + 0.11 * Math.cos(4 * angle + Math.PI / 4);
      v.x *= molarBulge * 1.08;
      v.z *= molarBulge * 0.96;

      if (ny < 0) {
        const neckTaper = 1 + ny * 0.38;
        v.x *= Math.max(0.52, neckTaper);
        v.z *= Math.max(0.52, neckTaper);
        v.y *= 0.85;
      } else {
        const r = Math.sqrt(v.x * v.x + v.z * v.z);
        const cusps =
          Math.pow(Math.abs(Math.cos(angle - Math.PI / 4)), 1.6) *
          Math.pow(Math.abs(Math.sin(angle - Math.PI / 4)), 1.6) *
          4;

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

  const threadHeights = [-0.2, -0.33, -0.46, -0.59, -0.72, -0.85, -0.98, -1.11, -1.24, -1.37];

  useFrame((state, delta) => {
    const speed = Math.min(1, delta * 6);
    const targetCrownY = isExploded ? 1.68 : 0.96;
    const targetAbutmentY = isExploded ? 0.18 : -0.04;
    const targetScrewY = isExploded ? -0.28 : 0.0;

    if (crownGroupRef.current) {
      crownGroupRef.current.position.y = THREE.MathUtils.lerp(
        crownGroupRef.current.position.y,
        targetCrownY,
        speed
      );
    }
    if (abutmentGroupRef.current) {
      abutmentGroupRef.current.position.y = THREE.MathUtils.lerp(
        abutmentGroupRef.current.position.y,
        targetAbutmentY,
        speed
      );
    }
    if (screwGroupRef.current) {
      screwGroupRef.current.position.y = THREE.MathUtils.lerp(
        screwGroupRef.current.position.y,
        targetScrewY,
        speed
      );
    }

    if (osseoGlowRef.current) {
      const pulse = 0.22 + Math.sin(state.clock.elapsedTime * 3.2) * 0.1;
      const mat = osseoGlowRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = isHealingStage ? pulse : 0;
    }
  });

  const isEmax = crownMaterial === "emax";

  return (
    <group position={[0, -0.05, 0]}>
      <JawBoneSection visible={showAnatomy} />

      {/* 1. KRON */}
      <group
        ref={crownGroupRef}
        position={[0, 0.96, 0]}
        visible={hasProsthetics}
        onClick={(e) => {
          if (!hasProsthetics) return;
          e.stopPropagation();
          onSelectHotspot(HOTSPOTS[0]);
        }}
      >
        <mesh geometry={crownGeometry} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={activeId === 1 ? "#fef3c7" : isEmax ? "#faf6ee" : "#f2ede2"}
            roughness={isEmax ? 0.08 : 0.22}
            metalness={0.0}
            clearcoat={1.0}
            clearcoatRoughness={isEmax ? 0.04 : 0.14}
            transmission={isEmax ? 0.22 : 0.0}
            thickness={isEmax ? 0.6 : 0.0}
            ior={isEmax ? 1.52 : 2.15}
            reflectivity={isEmax ? 0.95 : 0.78}
            sheen={0.35}
            sheenRoughness={0.35}
            sheenColor="#fffbeb"
            emissive={activeId === 1 ? "#f59e0b" : "#000000"}
            emissiveIntensity={activeId === 1 ? 0.14 : 0}
          />
        </mesh>

        <PinMarker spot={HOTSPOTS[0]} activeId={activeId} onSelect={onSelectHotspot} />
      </group>

      {/* 2. ABUTMENT */}
      <group
        ref={abutmentGroupRef}
        position={[0, -0.04, 0]}
        visible={hasProsthetics}
        onClick={(e) => {
          if (!hasProsthetics) return;
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

        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.22, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.22} />
        </mesh>

        <PinMarker spot={HOTSPOTS[1]} activeId={activeId} onSelect={onSelectHotspot} />
      </group>

      {/* 3. İMPLANT GÖVDESİ (VİDA) */}
      <group
        ref={screwGroupRef}
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectHotspot(HOTSPOTS[2]);
        }}
      >
        <mesh ref={osseoGlowRef} position={[0, -0.85, 0]} visible={isHealingStage}>
          <cylinderGeometry args={[0.34, 0.22, 1.56, 32]} />
          <meshStandardMaterial
            color="#34d399"
            emissive="#10b981"
            emissiveIntensity={1.2}
            transparent
            opacity={0.25}
            depthWrite={false}
          />
        </mesh>

        <mesh position={[0, -0.82, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.14, 1.52, 48]} />
          <meshStandardMaterial
            color={activeId === 3 ? "#fcd34d" : "#94a3b8"}
            metalness={0.92}
            roughness={0.26}
            emissive={activeId === 3 ? "#b45309" : isHealingStage ? "#059669" : "#000000"}
            emissiveIntensity={activeId === 3 ? 0.25 : isHealingStage ? 0.2 : 0}
          />
        </mesh>

        <mesh position={[0, -0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.135, 0.24, 6]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.058, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.135, 6]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>

        <mesh position={[0, -1.58, 0]} castShadow>
          <sphereGeometry args={[0.14, 32, 16]} />
          <meshStandardMaterial
            color={activeId === 3 ? "#fcd34d" : "#94a3b8"}
            metalness={0.92}
            roughness={0.26}
          />
        </mesh>

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

        <PinMarker spot={HOTSPOTS[2]} activeId={activeId} onSelect={onSelectHotspot} />
      </group>
    </group>
  );
}