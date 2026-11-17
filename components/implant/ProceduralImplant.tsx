'use client';

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  BrandOption,
  ConnectionType,
  ImplantModelSpec,
  PieceConfiguration,
} from './implantCatalogData';

interface ProceduralImplantModelsProps {
  spec: ImplantModelSpec;
  brand: BrandOption;
  pieceConfig: PieceConfiguration;
  connectionType: ConnectionType;
  exploded: boolean;
  crownMaterial: 'zirconia' | 'pfm';
  showCrown: boolean;
}

export default function ProceduralImplantModels({
  spec,
  brand,
  pieceConfig,
  connectionType,
  exploded,
  crownMaterial,
  showCrown,
}: ProceduralImplantModelsProps) {
  const rootRef = useRef<THREE.Group>(null);
  const abutmentGroupRef = useRef<THREE.Group>(null);
  const screwRef = useRef<THREE.Mesh>(null);
  const crownRef = useRef<THREE.Mesh>(null);

  // Marka segmentine göre dinamik titanyum/alaşım materyali
  const titaniumMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(brand.materialFinish.color),
        metalness: brand.materialFinish.metalness,
        roughness: brand.materialFinish.roughness,
      }),
    [brand]
  );

  // Boyun & Abutment parlak işlenmiş (machined) metal materyali
  const collarMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(brand.materialFinish.collarColor),
        metalness: Math.min(0.98, brand.materialFinish.metalness + 0.06),
        roughness: Math.max(0.08, brand.materialFinish.roughness - 0.1),
      }),
    [brand]
  );

  // Bağlantı vidası (altın/anodize titanyum vurgusu)
  const screwMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#f59e0b'),
        metalness: 0.92,
        roughness: 0.18,
      }),
    []
  );

  // Kron (diş üst yapısı) materyali
  const crownMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(crownMaterial === 'zirconia' ? '#f8fafc' : '#fef3c7'),
        metalness: crownMaterial === 'zirconia' ? 0.05 : 0.12,
        roughness: crownMaterial === 'zirconia' ? 0.18 : 0.26,
      }),
    [crownMaterial]
  );

  // Patlatılmış görünüm (Exploded View) yumuşak animasyonu
  useFrame((_, delta) => {
    const targetAbutmentY = exploded && pieceConfig === 'two-piece' ? 1.15 : 0;
    const targetScrewY = exploded && pieceConfig === 'two-piece' ? 2.15 : 0.25;
    const targetCrownY = exploded ? (pieceConfig === 'two-piece' ? 3.15 : 1.35) : 0;

    if (abutmentGroupRef.current) {
      abutmentGroupRef.current.position.y = THREE.MathUtils.lerp(
        abutmentGroupRef.current.position.y,
        targetAbutmentY,
        delta * 6
      );
    }
    if (screwRef.current) {
      screwRef.current.position.y = THREE.MathUtils.lerp(
        screwRef.current.position.y,
        targetScrewY,
        delta * 6
      );
    }
    if (crownRef.current) {
      crownRef.current.position.y = THREE.MathUtils.lerp(
        crownRef.current.position.y,
        targetCrownY,
        delta * 6
      );
    }
  });

  // Helisel vida yivleri oluşturucu yardımcı
  const renderThreads = (
    count: number,
    startY: number,
    endY: number,
    topRadius: number,
    bottomRadius: number,
    tubeRadius = 0.045
  ) => {
    const rings = [];
    for (let i = 0; i < count; i++) {
      const t = i / Math.max(1, count - 1);
      const y = THREE.MathUtils.lerp(startY, endY, t);
      const r = THREE.MathUtils.lerp(topRadius, bottomRadius, t);
      rings.push(
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2 + 0.08, 0, 0]} material={titaniumMat}>
          <torusGeometry args={[r, tubeRadius, 10, 28]} />
        </mesh>
      );
    }
    return rings;
  };

  // 4. BÖLÜM: Bağlantı Arayüzü (Platform Connection Types)
  const renderConnectionPlatform = (platformY: number, radius = 0.34) => {
    if (pieceConfig === 'monoblock') {
      // Monoblok (Tek parça) implantta platform ayrımı yoktur; gövde doğrudan dayanakla birleşir
      return (
        <mesh position={[0, platformY + 0.06, 0]} material={collarMat}>
          <cylinderGeometry args={[radius * 0.92, radius, 0.14, 24]} />
        </mesh>
      );
    }

    return (
      <group position={[0, platformY, 0]}>
        {/* Düz Platform Yakası */}
        <mesh material={collarMat}>
          <cylinderGeometry args={[radius, radius, 0.08, 28]} />
        </mesh>

        {/* External Hex: Dıştan altıgen çıkıntı */}
        {connectionType === 'external-hex' && (
          <mesh position={[0, 0.11, 0]} material={collarMat}>
            <cylinderGeometry args={[radius * 0.58, radius * 0.58, 0.16, 6]} />
          </mesh>
        )}

        {/* Internal Hex: İçten altıgen koyu yuva */}
        {connectionType === 'internal-hex' && (
          <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[radius * 0.55, radius * 0.55, 0.02, 6]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.4} />
          </mesh>
        )}

        {/* Conical / Morse Taper: Konik kilitli iç huni yuva */}
        {connectionType === 'morse-taper' && (
          <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[radius * 0.65, radius * 0.35, 0.03, 24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.3} />
          </mesh>
        )}
      </group>
    );
  };

  // Üst Yapı (Abutment + Bağlantı Vidası + Kron)
  const renderSuperstructure = (baseY: number, scale = 1) => (
    <group position={[0, baseY, 0]} scale={[scale, scale, scale]}>
      {/* Abutment (Dayanak) */}
      <group ref={abutmentGroupRef}>
        <mesh position={[0, 0.42, 0]} material={collarMat}>
          <cylinderGeometry args={[0.24, 0.32, 0.78, 24]} />
        </mesh>
        {/* Abutment alt bağlantı konisi (Two-piece ise patlatılmış görünümde görünür) */}
        {pieceConfig === 'two-piece' && (
          <mesh position={[0, -0.06, 0]} material={screwMat}>
            <cylinderGeometry
              args={[
                0.18,
                connectionType === 'morse-taper' ? 0.12 : 0.18,
                0.18,
                connectionType === 'external-hex' ? 6 : 24,
              ]}
            />
          </mesh>
        )}
      </group>

      {/* Bağlantı Vidası (Sadece İki Parçalı sistemde) */}
      {pieceConfig === 'two-piece' && (
        <mesh ref={screwRef} position={[0, 0.25, 0]} material={screwMat}>
          <cylinderGeometry args={[0.09, 0.06, 0.55, 16]} />
        </mesh>
      )}

      {/* Protez Kron (Diş) */}
      {showCrown && (
        <mesh ref={crownRef} position={[0, 0.92, 0]} material={crownMat}>
          <cylinderGeometry args={[0.52, 0.36, 0.85, 24]} />
        </mesh>
      )}
    </group>
  );

  // 15 İMPLANT GEOMETRİSİ SEÇİCİ
  const renderFixtureBySpec = () => {
    switch (spec.id) {
      // 1.1 Silindirik (Parallel-Walled) Vidalı İmplant
      case 'cylindrical-threaded':
        return (
          <group>
            <mesh position={[0, -0.8, 0]} material={titaniumMat}>
              <cylinderGeometry args={[0.34, 0.34, 1.8, 28]} />
            </mesh>
            {renderThreads(9, -0.05, -1.62, 0.35, 0.35, 0.04)}
            {renderConnectionPlatform(0.12, 0.35)}
            {renderSuperstructure(0.16)}
          </group>
        );

      // 1.2 Konik (Tapered / Kök Formlu) İmplant
      case 'tapered-root':
        return (
          <group>
            <mesh position={[0, -0.85, 0]} material={titaniumMat}>
              <cylinderGeometry args={[0.38, 0.16, 1.9, 28]} />
            </mesh>
            {renderThreads(9, -0.05, -1.72, 0.39, 0.18, 0.048)}
            {renderConnectionPlatform(0.12, 0.38)}
            {renderSuperstructure(0.16)}
          </group>
        );

      // 1.3 Hibrit Gövdeli İmplant (Üstü silindirik, altı konik)
      case 'hybrid-body':
        return (
          <group>
            {/* Üst Silindirik Yarı */}
            <mesh position={[0, -0.35, 0]} material={titaniumMat}>
              <cylinderGeometry args={[0.36, 0.36, 0.9, 28]} />
            </mesh>
            {/* Alt Konik Yarı */}
            <mesh position={[0, -1.25, 0]} material={titaniumMat}>
              <cylinderGeometry args={[0.36, 0.17, 0.9, 28]} />
            </mesh>
            {renderThreads(4, -0.05, -0.75, 0.37, 0.37, 0.036)}
            {renderThreads(5, -0.9, -1.65, 0.36, 0.18, 0.048)}
            {renderConnectionPlatform(0.12, 0.36)}
            {renderSuperstructure(0.16)}
          </group>
        );

      // 1.4 Vidasız Silindirik (Press-Fit) İmplant
      case 'press-fit-threadless':
        return (
          <group>
            {/* Yivsiz Pürüzlü/Gözenekli Düz Silindir */}
            <mesh position={[0, -0.8, 0]} material={titaniumMat}>
              <cylinderGeometry args={[0.36, 0.35, 1.75, 32]} />
            </mesh>
            {/* Apikal yuvarlatılmış kubbe */}
            <mesh position={[0, -1.68, 0]} material={titaniumMat}>
              <sphereGeometry args={[0.35, 24, 16]} />
            </mesh>
            {renderConnectionPlatform(0.1, 0.36)}
            {renderSuperstructure(0.14)}
          </group>
        );

      // 1.5 Blade (Bıçak / Plaka) İmplant
      case 'blade-plate':
        return (
          <group>
            {/* İnce Yassı Metal Plaka Gövde */}
            <mesh position={[0, -0.75, 0]} material={titaniumMat}>
              <boxGeometry args={[1.65, 1.1, 0.12]} />
            </mesh>
            {/* Kemik Geçiş Delikleri (Vent Holes) */}
            {[-0.48, 0, 0.48].map((x, idx) => (
              <mesh key={idx} position={[x, -0.75, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.14, 0.14, 0.14, 20]} />
                <meshStandardMaterial color="#7f1d1d" roughness={0.8} />
              </mesh>
            ))}
            {/* Üstte Çift Dayanak (Post) */}
            <group position={[-0.42, -0.15, 0]}>
              {renderConnectionPlatform(0.05, 0.2)}
              {renderSuperstructure(0.08, 0.65)}
            </group>
            <group position={[0.42, -0.15, 0]}>
              {renderConnectionPlatform(0.05, 0.2)}
              {renderSuperstructure(0.08, 0.65)}
            </group>
          </group>
        );

      // 1.6 Kısa (Short) ve Mini İmplantlar (Yan yana karşılaştırmalı çift gösterim)
      case 'short-mini':
        return (
          <group>
            {/* Sol: Kısa & Kalın İmplant (< 6 mm) */}
            <group position={[-0.55, 0, 0]}>
              <mesh position={[0, -0.35, 0]} material={titaniumMat}>
                <cylinderGeometry args={[0.46, 0.44, 0.85, 28]} />
              </mesh>
              {renderThreads(4, -0.05, -0.72, 0.48, 0.46, 0.05)}
              {renderConnectionPlatform(0.1, 0.46)}
              {renderSuperstructure(0.14, 0.9)}
            </group>
            {/* Sağ: Mini & İnce Tek Parça İmplant (< 3 mm çap, uzun boy) */}
            <group position={[0.55, 0, 0]}>
              <mesh position={[0, -0.85, 0]} material={titaniumMat}>
                <cylinderGeometry args={[0.16, 0.11, 1.85, 24]} />
              </mesh>
              {renderThreads(10, -0.05, -1.72, 0.18, 0.12, 0.028)}
              {renderConnectionPlatform(0.1, 0.18)}
              {renderSuperstructure(0.14, 0.6)}
            </group>
          </group>
        );

      // 2.1 Subperiosteal (Kemik Üstü) İmplant (Eyer/Kafes Ağ)
      case 'subperiosteal':
        return (
          <group>
            {/* Kemik sırtını saran organik eyer kafes kemerleri */}
            {[-0.65, 0, 0.65].map((x, i) => (
              <mesh key={i} position={[x, -0.45, 0]} rotation={[0, Math.PI / 2, 0]} material={titaniumMat}>
                <torusGeometry args={[0.62, 0.055, 12, 28, Math.PI]} />
              </mesh>
            ))}
            {/* Yatay bağlantı ağ çubukları */}
            {[-0.55, 0, 0.55].map((z, i) => (
              <mesh key={i} position={[0, -0.45 + (i === 1 ? 0.6 : 0.15), z]} rotation={[0, 0, Math.PI / 2]} material={titaniumMat}>
                <cylinderGeometry args={[0.045, 0.045, 1.65, 16]} />
              </mesh>
            ))}
            {/* Diş eti dışına uzanan postlar */}
            {[-0.5, 0.5].map((x, idx) => (
              <group key={idx} position={[x, 0.15, 0]}>
                {renderConnectionPlatform(0.02, 0.2)}
                {renderSuperstructure(0.05, 0.68)}
              </group>
            ))}
          </group>
        );

      // 2.2 Transosseöz (Transmandibular) İmplant
      case 'transosseous':
        return (
          <group>
            {/* Alt çene tabanına oturan yatay metal plaka */}
            <mesh position={[0, -1.45, 0]} material={titaniumMat}>
              <boxGeometry args={[1.7, 0.14, 0.45]} />
            </mesh>
            {/* Kemiği alttan üste boydan boya geçen 2 uzun dikey pim */}
            {[-0.5, 0.5].map((x, idx) => (
              <group key={idx} position={[x, 0, 0]}>
                <mesh position={[0, -0.68, 0]} material={titaniumMat}>
                  <cylinderGeometry args={[0.13, 0.13, 1.65, 20]} />
                </mesh>
                {renderConnectionPlatform(0.15, 0.2)}
                {renderSuperstructure(0.18, 0.68)}
              </group>
            ))}
          </group>
        );

      // 2.3 İntramukozal İmplant (İnsert - Mantar başı çıtçıt)
      case 'intramucosal':
        return (
          <group>
            {[-0.45, 0.45].map((x, idx) => (
              <group key={idx} position={[x, 0, 0]}>
                {/* Mantar başı (mukoza yuvasına oturan alt başlık) */}
                <mesh position={[0, -0.18, 0]} material={titaniumMat}>
                  <sphereGeometry args={[0.24, 24, 16]} />
                </mesh>
                {/* İnce boyun */}
                <mesh position={[0, 0.04, 0]} material={collarMat}>
                  <cylinderGeometry args={[0.11, 0.11, 0.26, 20]} />
                </mesh>
                {/* Protez taban plakası */}
                <mesh position={[0, 0.2, 0]} material={collarMat}>
                  <cylinderGeometry args={[0.28, 0.28, 0.07, 24]} />
                </mesh>
              </group>
            ))}
          </group>
        );

      // 2.4 Endodontik İmplant (Stabilizatör - İnce uzun kök içi pin)
      case 'endodontic':
        return (
          <group>
            {/* Kök kanalından kemiğe uzanan çok ince uzun pin */}
            <mesh position={[0, -0.65, 0]} material={titaniumMat}>
              <cylinderGeometry args={[0.09, 0.06, 2.4, 20]} />
            </mesh>
            {renderThreads(8, -0.9, -1.78, 0.1, 0.07, 0.016)}
            {/* Doğal diş kronu silüeti */}
            {showCrown && (
              <mesh position={[0, 0.55, 0]} material={crownMat}>
                <cylinderGeometry args={[0.45, 0.3, 0.85, 24]} />
              </mesh>
            )}
          </group>
        );

      // 3.1 Zygomatik (Elmacık Kemiği) İmplant (Çok uzun + 45° açılı boyun)
      case 'zygomatic':
        return (
          <group>
            {/* Elmacık kemiğine uzanan uzun eğik gövde */}
            <group rotation={[0, 0, -0.42]} position={[0.45, 0.55, 0]}>
              <mesh position={[0, 0, 0]} material={titaniumMat}>
                <cylinderGeometry args={[0.26, 0.21, 3.1, 24]} />
              </mesh>
              {/* Elmacık kemiğine tutunan apikal yivler */}
              {renderThreads(7, 1.48, 0.7, 0.24, 0.27, 0.035)}
            </group>
            {/* 45° Açılı Protez Bağlantı Başı */}
            <group position={[-0.2, -0.82, 0]}>
              {renderConnectionPlatform(0, 0.28)}
              {renderSuperstructure(0.05, 0.85)}
            </group>
          </group>
        );

      // 3.2 Pterygoid İmplant (Uzun & sivri uçlu açılı vida)
      case 'pterygoid':
        return (
          <group>
            <group rotation={[0, 0, -0.35]} position={[0.32, 0.25, 0]}>
              <mesh position={[0, 0, 0]} material={titaniumMat}>
                <cylinderGeometry args={[0.25, 0.11, 2.35, 24]} />
              </mesh>
              {renderThreads(11, 1.1, -1.05, 0.13, 0.26, 0.035)}
            </group>
            <group position={[-0.1, -0.82, 0]}>
              {renderConnectionPlatform(0, 0.28)}
              {renderSuperstructure(0.05, 0.85)}
            </group>
          </group>
        );

      // 3.3 Transnazal İmplant (Burun yan duvarına uzanan uzun açılı form)
      case 'transnasal':
        return (
          <group>
            <group rotation={[0, 0, 0.32]} position={[-0.3, 0.35, 0]}>
              <mesh position={[0, 0, 0]} material={titaniumMat}>
                <cylinderGeometry args={[0.24, 0.18, 2.55, 24]} />
              </mesh>
              {renderThreads(9, 1.2, 0.15, 0.2, 0.25, 0.034)}
            </group>
            <group position={[0.1, -0.82, 0]}>
              {renderConnectionPlatform(0, 0.28)}
              {renderSuperstructure(0.05, 0.85)}
            </group>
          </group>
        );

      default:
        return null;
    }
  };

  return <group ref={rootRef}>{renderFixtureBySpec()}</group>;
}