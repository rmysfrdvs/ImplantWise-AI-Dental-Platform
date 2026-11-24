'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ConnectionType,
  IMPLANT_CATALOG,
  IMPLANT_CATEGORIES,
  ImplantCategory,
  PieceConfiguration,
  PriceTier,
} from './implant/implantCatalogData';

function createOrganicNoiseTexture(
  baseHex: string,
  speckleHex: string,
  density = 1800,
  size = 256
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < density; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 2.2 + 0.5;
    ctx.fillStyle = speckleHex;
    ctx.globalAlpha = Math.random() * 0.35 + 0.08;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function createAnatomicalToothCrown(scale = 1): THREE.Group {
  const toothGroup = new THREE.Group();

  const points: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.32, 0.02),
    new THREE.Vector2(0.44, 0.22),
    new THREE.Vector2(0.54, 0.52),
    new THREE.Vector2(0.51, 0.78),
    new THREE.Vector2(0.38, 0.88),
    new THREE.Vector2(0.0, 0.84),
  ];
  const bodyGeo = new THREE.LatheGeometry(points, 36);
  bodyGeo.scale(1.12, 1.0, 0.94);

  const enamelMat = new THREE.MeshPhysicalMaterial({
    color: 0xfaf8f2,
    roughness: 0.16,
    metalness: 0.02,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    sheen: 0.3,
    sheenColor: new THREE.Color(0xfffbeb),
  });

  const bodyMesh = new THREE.Mesh(bodyGeo, enamelMat);
  toothGroup.add(bodyMesh);

  const cuspOffsets: [number, number, number][] = [
    [-0.22, 0.84, -0.18],
    [0.22, 0.85, -0.18],
    [-0.21, 0.82, 0.18],
    [0.21, 0.83, 0.18],
  ];
  cuspOffsets.forEach(([x, y, z]) => {
    const cusp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), enamelMat);
    cusp.scale.set(1.15, 0.55, 1.05);
    cusp.position.set(x, y, z);
    toothGroup.add(cusp);
  });

  toothGroup.scale.setScalar(scale);
  return toothGroup;
}

function createNeighborNaturalTooth(xPos: number, enamelColor = 0xf5f0e6): THREE.Group {
  const group = new THREE.Group();
  // Ortadaki implant kronuyla milimetrik olarak aynı oklüzal (çiğneme) hizasında
  group.position.set(xPos, 0.58, 0);

  const crown = createAnatomicalToothCrown(0.96);
  group.add(crown);

  const rootPoints = [
    new THREE.Vector2(0.0, -1.85),
    new THREE.Vector2(0.11, -1.48),
    new THREE.Vector2(0.24, -0.78),
    new THREE.Vector2(0.32, 0.02),
  ];
  const rootGeo = new THREE.LatheGeometry(rootPoints, 24);
  const rootMat = new THREE.MeshStandardMaterial({
    color: 0xe6d3a7,
    roughness: 0.55,
    transparent: true,
    opacity: 0.72,
  });
  const rootMesh = new THREE.Mesh(rootGeo, rootMat);
  group.add(rootMesh);

  crown.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const m = ((obj as THREE.Mesh).material as THREE.MeshPhysicalMaterial).clone();
      m.color.setHex(enamelColor);
      m.transparent = true;
      m.opacity = 0.52;
      (obj as THREE.Mesh).material = m;
    }
  });

  return group;
}

export default function ImplantViewer() {
  const [selectedCategory, setSelectedCategory] = useState<ImplantCategory>('endosteal');
  const [selectedImplantId, setSelectedImplantId] = useState<string>('cylindrical-threaded');
  const [selectedTier, setSelectedTier] = useState<PriceTier>('premium');

  const [pieceConfig, setPieceConfig] = useState<PieceConfiguration>('two-piece');
  const [connectionType, setConnectionType] = useState<ConnectionType>('morse-taper');
  const [exploded, setExploded] = useState<boolean>(false);

  const [crownMaterial, setCrownMaterial] = useState<'zirconia' | 'pfm'>('zirconia');
  const [showCrown, setShowCrown] = useState<boolean>(true);
  const [showBone, setShowBone] = useState<boolean>(true);
  const [showNeighbors, setShowNeighbors] = useState<boolean>(true);
  const [shortMiniVariant, setShortMiniVariant] = useState<'short' | 'mini'>('short');

  const mountRef = useRef<HTMLDivElement>(null);

  const categoryModels = useMemo(
    () => IMPLANT_CATALOG.filter((m) => m.category === selectedCategory),
    [selectedCategory]
  );

  const activeSpec = useMemo(
    () => IMPLANT_CATALOG.find((m) => m.id === selectedImplantId) || IMPLANT_CATALOG[0],
    [selectedImplantId]
  );

  const activeBrand = activeSpec.brands[selectedTier];

  const handleSelectCategory = (cat: ImplantCategory) => {
    setSelectedCategory(cat);
    const firstInCat = IMPLANT_CATALOG.find((m) => m.category === cat);
    if (firstInCat) {
      setSelectedImplantId(firstInCat.id);
      setPieceConfig(firstInCat.defaultPiece);
      setConnectionType(firstInCat.defaultConnection);
    }
  };

  const handleSelectModel = (id: string) => {
    setSelectedImplantId(id);
    const found = IMPLANT_CATALOG.find((m) => m.id === id);
    if (found) {
      setPieceConfig(found.defaultPiece);
      setConnectionType(found.defaultConnection);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isMobile = container.clientWidth < 640;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      isMobile ? 45 : 40,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      100
    );
    camera.position.set(isMobile ? 3.5 : 2.9, isMobile ? 1.75 : 1.55, isMobile ? 5.1 : 4.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.0;
    controls.maxDistance = 10.0;

    scene.add(new THREE.AmbientLight(0xffffff, 0.95));
    const hemi = new THREE.HemisphereLight(0xf0f9ff, 0x1e293b, 0.85);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xbae6fd, 1.2);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    const warmFill = new THREE.PointLight(0xfef3c7, 0.9);
    warmFill.position.set(0, -3, 4);
    scene.add(warmFill);

    const titaniumBump = createOrganicNoiseTexture('#808080', '#ffffff', 2500, 256);
    const boneTex = createOrganicNoiseTexture('#edd1b0', '#b88b5a', 3200, 256);
    const gumTex = createOrganicNoiseTexture('#e8799a', '#be185d', 1600, 256);

    const titaniumMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activeBrand.materialFinish.color),
      metalness: activeBrand.materialFinish.metalness,
      roughness: activeBrand.materialFinish.roughness,
      bumpMap: titaniumBump,
      bumpScale: 0.012,
    });

    const collarMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activeBrand.materialFinish.collarColor),
      metalness: Math.min(0.98, activeBrand.materialFinish.metalness + 0.06),
      roughness: Math.max(0.08, activeBrand.materialFinish.roughness - 0.12),
    });

    const screwMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.94,
      roughness: 0.16,
    });

    const rootGroup = new THREE.Group();
    rootGroup.position.set(0, 0.15, 0);
    scene.add(rootGroup);

    const addHelicalThreads = (
      parent: THREE.Object3D,
      turns: number,
      startY: number,
      endY: number,
      topR: number,
      botR: number,
      wireR = 0.036
    ) => {
      const pts: THREE.Vector3[] = [];
      const totalSteps = turns * 24;
      for (let i = 0; i <= totalSteps; i++) {
        const t = i / totalSteps;
        const angle = t * turns * Math.PI * 2;
        const y = THREE.MathUtils.lerp(startY, endY, t);
        const r = THREE.MathUtils.lerp(topR, botR, t);
        pts.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const threadGeo = new THREE.TubeGeometry(curve, totalSteps, wireR, 8, false);
      const threadMesh = new THREE.Mesh(threadGeo, titaniumMat);
      parent.add(threadMesh);

      for (let m = 0; m < 3; m++) {
        const microRing = new THREE.Mesh(
          new THREE.TorusGeometry(topR * 0.99, wireR * 0.42, 8, 32),
          collarMat
        );
        microRing.rotation.x = Math.PI / 2;
        microRing.position.y = startY + 0.05 + m * 0.042;
        parent.add(microRing);
      }
    };

    const addPlatform = (parent: THREE.Object3D, y: number, radius = 0.35) => {
      if (pieceConfig === 'monoblock') {
        const monoPts = [
          new THREE.Vector2(radius, y),
          new THREE.Vector2(radius * 0.95, y + 0.12),
          new THREE.Vector2(radius * 0.82, y + 0.22),
        ];
        const mono = new THREE.Mesh(new THREE.LatheGeometry(monoPts, 32), collarMat);
        parent.add(mono);
        return;
      }

      const collarPts = [
        new THREE.Vector2(radius * 0.96, y - 0.02),
        new THREE.Vector2(radius * 1.03, y + 0.04),
        new THREE.Vector2(radius * 0.94, y + 0.1),
      ];
      const base = new THREE.Mesh(new THREE.LatheGeometry(collarPts, 32), collarMat);
      parent.add(base);

      if (connectionType === 'external-hex') {
        const hex = new THREE.Mesh(
          new THREE.CylinderGeometry(radius * 0.56, radius * 0.56, 0.16, 6),
          collarMat
        );
        hex.position.y = y + 0.14;
        parent.add(hex);
      } else if (connectionType === 'internal-hex') {
        const slot = new THREE.Mesh(
          new THREE.CylinderGeometry(radius * 0.54, radius * 0.54, 0.03, 6),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.35 })
        );
        slot.position.y = y + 0.095;
        parent.add(slot);
      } else {
        const cone = new THREE.Mesh(
          new THREE.CylinderGeometry(radius * 0.64, radius * 0.32, 0.04, 28),
          new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.98, roughness: 0.25 })
        );
        cone.position.y = y + 0.095;
        parent.add(cone);
      }
    };

    const addSuperstructure = (parent: THREE.Object3D, baseY: number, scale = 1) => {
      const grp = new THREE.Group();
      grp.position.y = baseY;
      grp.scale.setScalar(scale);
      parent.add(grp);

      const abOffset = exploded && pieceConfig === 'two-piece' ? 0.95 : 0;
      const screwOffset = exploded && pieceConfig === 'two-piece' ? 1.85 : 0.25;
      const crownOffset = exploded ? (pieceConfig === 'two-piece' ? 2.75 : 1.15) : 0;

      const abPts = [
        new THREE.Vector2(0.0, 0.05),
        new THREE.Vector2(0.24, 0.05),
        new THREE.Vector2(0.35, 0.28),
        new THREE.Vector2(0.33, 0.45),
        new THREE.Vector2(0.23, 0.78),
        new THREE.Vector2(0.0, 0.78),
      ];
      const abutment = new THREE.Mesh(new THREE.LatheGeometry(abPts, 32), collarMat);
      abutment.position.y = abOffset;
      grp.add(abutment);

      if (pieceConfig === 'two-piece') {
        const screw = new THREE.Mesh(
          new THREE.CylinderGeometry(0.085, 0.055, 0.56, 20),
          screwMat
        );
        screw.position.y = screwOffset;
        grp.add(screw);
      }

      if (showCrown) {
        const crown = createAnatomicalToothCrown(0.96);
        // baseY (0.16) + 0.42 = 0.58 -> komşu dişlerle birebir aynı hizada
        crown.position.y = 0.42 + crownOffset;
        crown.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mat = (obj as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
            mat.color.setHex(crownMaterial === 'zirconia' ? 0xfaf8f2 : 0xfef3c7);
          }
        });
        grp.add(crown);
      }
    };

    switch (activeSpec.id) {
      case 'cylindrical-threaded': {
        const corePts = [
          new THREE.Vector2(0.0, -1.75),
          new THREE.Vector2(0.28, -1.68),
          new THREE.Vector2(0.32, -1.5),
          new THREE.Vector2(0.32, 0.1),
        ];
        const body = new THREE.Mesh(new THREE.LatheGeometry(corePts, 32), titaniumMat);
        rootGroup.add(body);
        addHelicalThreads(rootGroup, 8, -0.05, -1.58, 0.34, 0.33, 0.036);
        addPlatform(rootGroup, 0.1, 0.34);
        addSuperstructure(rootGroup, 0.16);
        break;
      }
      case 'tapered-root': {
        const corePts = [
          new THREE.Vector2(0.0, -1.85),
          new THREE.Vector2(0.14, -1.75),
          new THREE.Vector2(0.26, -0.9),
          new THREE.Vector2(0.36, 0.1),
        ];
        const body = new THREE.Mesh(new THREE.LatheGeometry(corePts, 32), titaniumMat);
        rootGroup.add(body);
        addHelicalThreads(rootGroup, 9, -0.04, -1.7, 0.38, 0.17, 0.042);
        addPlatform(rootGroup, 0.1, 0.37);
        addSuperstructure(rootGroup, 0.16);
        break;
      }
      case 'hybrid-body': {
        const corePts = [
          new THREE.Vector2(0.0, -1.8),
          new THREE.Vector2(0.15, -1.7),
          new THREE.Vector2(0.34, -0.82),
          new THREE.Vector2(0.34, 0.1),
        ];
        const body = new THREE.Mesh(new THREE.LatheGeometry(corePts, 32), titaniumMat);
        rootGroup.add(body);
        addHelicalThreads(rootGroup, 4, -0.04, -0.78, 0.36, 0.36, 0.032);
        addHelicalThreads(rootGroup, 5, -0.82, -1.68, 0.36, 0.17, 0.044);
        addPlatform(rootGroup, 0.1, 0.35);
        addSuperstructure(rootGroup, 0.16);
        break;
      }
      case 'press-fit-threadless': {
        const corePts = [
          new THREE.Vector2(0.0, -1.82),
          new THREE.Vector2(0.26, -1.75),
          new THREE.Vector2(0.34, -1.55),
          new THREE.Vector2(0.35, 0.1),
        ];
        const body = new THREE.Mesh(new THREE.LatheGeometry(corePts, 36), titaniumMat);
        rootGroup.add(body);
        for (let i = 0; i < 6; i++) {
          const band = new THREE.Mesh(
            new THREE.CylinderGeometry(0.356, 0.356, 0.14, 32),
            titaniumMat
          );
          band.position.y = -0.25 - i * 0.23;
          rootGroup.add(band);
        }
        addPlatform(rootGroup, 0.1, 0.36);
        addSuperstructure(rootGroup, 0.15);
        break;
      }
      case 'blade-plate': {
        const bladeShape = new THREE.Shape();
        bladeShape.moveTo(-0.85, -0.2);
        bladeShape.quadraticCurveTo(-0.92, -1.1, -0.55, -1.25);
        bladeShape.lineTo(0.55, -1.25);
        bladeShape.quadraticCurveTo(0.92, -1.1, 0.85, -0.2);
        bladeShape.closePath();

        [-0.46, 0, 0.46].forEach((cx) => {
          const hole = new THREE.Path();
          hole.absarc(cx, -0.75, 0.14, 0, Math.PI * 2, false);
          bladeShape.holes.push(hole);
        });

        const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
          depth: 0.1,
          bevelEnabled: true,
          bevelThickness: 0.02,
          bevelSize: 0.02,
          bevelSegments: 3,
        });
        bladeGeo.translate(0, 0, -0.05);
        rootGroup.add(new THREE.Mesh(bladeGeo, titaniumMat));

        [-0.44, 0.44].forEach((x) => {
          const post = new THREE.Group();
          post.position.set(x, -0.18, 0);
          addPlatform(post, 0.05, 0.2);
          addSuperstructure(post, 0.1, 0.65);
          rootGroup.add(post);
        });
        break;
      }
      case 'short-mini': {
        if (shortMiniVariant === 'short') {
          const shortPts = [
            new THREE.Vector2(0.0, -0.82),
            new THREE.Vector2(0.38, -0.76),
            new THREE.Vector2(0.45, -0.6),
            new THREE.Vector2(0.45, 0.1),
          ];
          rootGroup.add(new THREE.Mesh(new THREE.LatheGeometry(shortPts, 32), titaniumMat));
          addHelicalThreads(rootGroup, 4, -0.04, -0.72, 0.47, 0.45, 0.045);
          addPlatform(rootGroup, 0.1, 0.46);
          addSuperstructure(rootGroup, 0.15, 0.92);
        } else {
          const miniPts = [
            new THREE.Vector2(0.0, -1.85),
            new THREE.Vector2(0.09, -1.72),
            new THREE.Vector2(0.15, 0.1),
          ];
          rootGroup.add(new THREE.Mesh(new THREE.LatheGeometry(miniPts, 24), titaniumMat));
          addHelicalThreads(rootGroup, 10, -0.04, -1.72, 0.17, 0.11, 0.024);
          addPlatform(rootGroup, 0.1, 0.17);
          addSuperstructure(rootGroup, 0.15, 0.65);
        }
        break;
      }
      case 'subperiosteal': {
        [-0.68, -0.22, 0.22, 0.68].forEach((x) => {
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(x, -1.15, -0.65),
            new THREE.Vector3(x, -0.35, -0.56),
            new THREE.Vector3(x, 0.12, 0),
            new THREE.Vector3(x, -0.35, 0.56),
            new THREE.Vector3(x, -1.15, 0.65),
          ]);
          const arch = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.045, 10, false), titaniumMat);
          rootGroup.add(arch);
        });
        [-0.56, 0, 0.56].forEach((z, idx) => {
          const rail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 1.65, 16),
            titaniumMat
          );
          rail.rotation.z = Math.PI / 2;
          rail.position.set(0, idx === 1 ? 0.12 : -0.38, z);
          rootGroup.add(rail);
        });
        [-0.48, 0.48].forEach((x) => {
          const post = new THREE.Group();
          post.position.set(x, 0.12, 0);
          addPlatform(post, 0.02, 0.2);
          addSuperstructure(post, 0.06, 0.68);
          rootGroup.add(post);
        });
        break;
      }
      case 'transosseous': {
        const basePlate = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.13, 0.48), titaniumMat);
        basePlate.position.y = -1.62;
        rootGroup.add(basePlate);
        [-0.5, 0.5].forEach((x) => {
          const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.75, 24), titaniumMat);
          pin.position.set(x, -0.75, 0);
          rootGroup.add(pin);
          const top = new THREE.Group();
          top.position.set(x, 0.1, 0);
          addPlatform(top, 0.02, 0.2);
          addSuperstructure(top, 0.06, 0.68);
          rootGroup.add(top);
        });
        break;
      }
      case 'intramucosal': {
        [-0.45, 0.45].forEach((x) => {
          const g = new THREE.Group();
          g.position.x = x;
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 28, 20), titaniumMat);
          head.scale.set(1.0, 0.85, 1.0);
          head.position.y = -0.18;
          const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.26, 20), collarMat);
          neck.position.y = 0.04;
          const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 28), collarMat);
          cap.position.y = 0.2;
          g.add(head, neck, cap);
          rootGroup.add(g);
        });
        break;
      }
      case 'endodontic': {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.05, 2.45, 24), titaniumMat);
        pin.position.y = -0.65;
        rootGroup.add(pin);
        addHelicalThreads(rootGroup, 7, -0.95, -1.78, 0.095, 0.065, 0.014);
        if (showCrown) {
          const crown = createAnatomicalToothCrown(0.95);
          crown.position.y = 0.15;
          rootGroup.add(crown);
        }
        break;
      }
      case 'zygomatic': {
        const angled = new THREE.Group();
        angled.rotation.z = -0.42;
        angled.position.set(0.45, 0.55, 0);
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 3.15, 28), titaniumMat);
        angled.add(body);
        addHelicalThreads(angled, 6, 1.48, 0.72, 0.23, 0.26, 0.032);
        rootGroup.add(angled);

        const head = new THREE.Group();
        head.position.set(-0.2, -0.82, 0);
        addPlatform(head, 0, 0.28);
        addSuperstructure(head, 0.05, 0.85);
        rootGroup.add(head);
        break;
      }
      case 'pterygoid': {
        const angled = new THREE.Group();
        angled.rotation.z = -0.35;
        angled.position.set(0.32, 0.25, 0);
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.1, 2.35, 28), titaniumMat);
        angled.add(body);
        addHelicalThreads(angled, 10, 1.1, -1.05, 0.12, 0.25, 0.032);
        rootGroup.add(angled);

        const head = new THREE.Group();
        head.position.set(-0.1, -0.82, 0);
        addPlatform(head, 0, 0.28);
        addSuperstructure(head, 0.05, 0.85);
        rootGroup.add(head);
        break;
      }
      case 'transnasal': {
        const angled = new THREE.Group();
        angled.rotation.z = 0.32;
        angled.position.set(-0.3, 0.35, 0);
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.17, 2.55, 28), titaniumMat);
        angled.add(body);
        addHelicalThreads(angled, 8, 1.2, 0.18, 0.19, 0.24, 0.032);
        rootGroup.add(angled);

        const head = new THREE.Group();
        head.position.set(0.1, -0.82, 0);
        addPlatform(head, 0, 0.28);
        addSuperstructure(head, 0.05, 0.85);
        rootGroup.add(head);
        break;
      }
    }

    if (showBone) {
      const spongiosaMat = new THREE.MeshStandardMaterial({
        map: boneTex,
        bumpMap: boneTex,
        bumpScale: 0.025,
        color: 0xf3d4b0,
        transparent: true,
        opacity: 0.42,
        roughness: 0.85,
      });

      const corticalMat = new THREE.MeshStandardMaterial({
        color: 0xe5be93,
        transparent: true,
        opacity: 0.52,
        roughness: 0.65,
      });

      const gingivaMat = new THREE.MeshPhysicalMaterial({
        map: gumTex,
        bumpMap: gumTex,
        bumpScale: 0.015,
        color: 0xf4729c,
        transparent: true,
        opacity: 0.48,
        roughness: 0.35,
        clearcoat: 0.6,
        clearcoatRoughness: 0.2,
      });

      if (
        activeSpec.jawContext === 'maxilla_zygoma' ||
        activeSpec.jawContext === 'maxilla_pterygoid' ||
        activeSpec.jawContext === 'maxilla_nasal'
      ) {
        const maxShape = new THREE.Shape();
        maxShape.moveTo(-1.35, -0.85);
        maxShape.quadraticCurveTo(0, -1.05, 1.35, -0.85);
        maxShape.lineTo(1.25, 0.0);
        maxShape.quadraticCurveTo(0, 0.12, -1.25, 0.0);
        maxShape.closePath();

        const maxGeo = new THREE.ExtrudeGeometry(maxShape, {
          depth: 1.15,
          bevelEnabled: true,
          bevelThickness: 0.12,
          bevelSize: 0.1,
          bevelSegments: 5,
        });
        maxGeo.translate(0, 0, -0.575);
        rootGroup.add(new THREE.Mesh(maxGeo, spongiosaMat));

        const zygoma = new THREE.Mesh(new THREE.SphereGeometry(0.88, 28, 22), corticalMat);
        zygoma.scale.set(1.15, 0.85, 0.95);
        zygoma.position.set(activeSpec.jawContext === 'maxilla_nasal' ? -0.68 : 0.78, 1.32, 0);
        rootGroup.add(zygoma);
      } else if (activeSpec.jawContext === 'mucosa_denture') {
        const mucShape = new THREE.Shape();
        mucShape.moveTo(-1.25, -0.55);
        mucShape.quadraticCurveTo(0, -0.68, 1.25, -0.55);
        mucShape.lineTo(1.2, 0.05);
        mucShape.quadraticCurveTo(0, 0.14, -1.2, 0.05);
        mucShape.closePath();
        const mucGeo = new THREE.ExtrudeGeometry(mucShape, {
          depth: 1.1,
          bevelEnabled: true,
          bevelThickness: 0.1,
          bevelSize: 0.08,
          bevelSegments: 4,
        });
        mucGeo.translate(0, 0, -0.55);
        rootGroup.add(new THREE.Mesh(mucGeo, gingivaMat));
      } else {
        const halfDepth = activeSpec.jawContext === 'mandible_narrow' ? 0.34 : 0.62;
        const jawShape = new THREE.Shape();
        jawShape.moveTo(-halfDepth, 0.02);
        jawShape.bezierCurveTo(-halfDepth * 1.12, -0.65, -halfDepth * 0.95, -1.55, 0, -1.78);
        jawShape.bezierCurveTo(halfDepth * 0.95, -1.55, halfDepth * 1.12, -0.65, halfDepth, 0.02);
        jawShape.quadraticCurveTo(0, 0.12, -halfDepth, 0.02);

        const jawGeo = new THREE.ExtrudeGeometry(jawShape, {
          depth: 2.55,
          bevelEnabled: true,
          bevelThickness: 0.14,
          bevelSize: 0.08,
          bevelSegments: 5,
        });
        jawGeo.rotateY(Math.PI / 2);
        jawGeo.translate(-1.275, 0, 0);
        rootGroup.add(new THREE.Mesh(jawGeo, spongiosaMat));

        const gumShape = new THREE.Shape();
        gumShape.moveTo(-halfDepth * 1.06, -0.14);
        gumShape.quadraticCurveTo(-halfDepth * 1.1, 0.16, -0.38, 0.24);
        gumShape.quadraticCurveTo(0, 0.14, 0.38, 0.24);
        gumShape.quadraticCurveTo(halfDepth * 1.1, 0.16, halfDepth * 1.06, -0.14);
        gumShape.quadraticCurveTo(0, -0.02, -halfDepth * 1.06, -0.14);

        const gumGeo = new THREE.ExtrudeGeometry(gumShape, {
          depth: 2.6,
          bevelEnabled: true,
          bevelThickness: 0.1,
          bevelSize: 0.06,
          bevelSegments: 4,
        });
        gumGeo.rotateY(Math.PI / 2);
        gumGeo.translate(-1.3, 0, 0);
        rootGroup.add(new THREE.Mesh(gumGeo, gingivaMat));
      }
    }

    if (
      showNeighbors &&
      activeSpec.jawContext === 'mandible_standard' &&
      activeSpec.id !== 'short-mini'
    ) {
      rootGroup.add(createNeighborNaturalTooth(-1.02));
      rootGroup.add(createNeighborNaturalTooth(1.02));
    }

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const mobile = container.clientWidth < 640;
      camera.fov = mobile ? 45 : 40;
      camera.aspect = container.clientWidth / Math.max(1, container.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
    };
  }, [
    activeSpec,
    activeBrand,
    pieceConfig,
    connectionType,
    exploded,
    crownMaterial,
    showCrown,
    showBone,
    showNeighbors,
    shortMiniVariant,
  ]);

  return (
    <div className="flex flex-col lg:flex-row w-full bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* SOL & ORTA PANEL: MOBİLDE DİKEY AKIŞLI, MASAÜSTÜNDE TAM EKRAN 3D SAHNE */}
      <div className="relative flex-1 flex flex-col justify-between bg-gradient-to-b from-slate-900 via-slate-950 to-black lg:min-h-[780px]">
        {/* Üst Bilgi Kartı */}
        <div className="relative lg:absolute lg:top-4 lg:left-4 lg:right-4 z-10 p-3 sm:p-4 lg:p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/90 lg:bg-transparent border-b border-slate-800 lg:border-b-0 pointer-events-none">
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/70 px-3.5 py-2 rounded-xl pointer-events-auto">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">
              {activeSpec.categoryTitle}
            </span>
            <h2 className="text-sm sm:text-lg font-bold text-white leading-snug">
              {activeSpec.name}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">{activeSpec.dimensions}</p>
          </div>

          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/70 px-3 py-2 rounded-xl pointer-events-auto flex sm:flex-col items-center sm:items-end justify-between">
            <span
              className={`inline-block text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full sm:mb-1 ${
                selectedTier === 'economic'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : selectedTier === 'mid'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-purple-500/20 text-purple-300'
              }`}
            >
              {activeBrand.tierLabel}
            </span>
            <div className="text-right">
              <div className="text-xs sm:text-sm font-bold text-white">{activeBrand.brandName}</div>
              <div className="text-[11px] text-slate-400">{activeBrand.modelSeries}</div>
            </div>
          </div>
        </div>

        {/* 3D Canvas Alanı */}
        <div
          ref={mountRef}
          className="w-full h-[360px] sm:h-[460px] lg:h-[780px] touch-none cursor-grab active:cursor-grabbing"
        />

        {/* Alt Sahne Kontrol Çubuğu */}
        <div className="relative lg:absolute lg:bottom-4 lg:left-4 lg:right-4 z-10 p-2.5 sm:p-3 lg:p-2.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 bg-slate-900/95 lg:bg-slate-900/85 backdrop-blur-md border-t lg:border border-slate-800 lg:rounded-xl">
          <button
            onClick={() => setShowBone((v) => !v)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition ${
              showBone
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {showBone ? 'Kemik & Diş Eti: Açık' : 'Kemik & Diş Eti: Gizli'}
          </button>

          {activeSpec.id !== 'short-mini' && (
            <button
              onClick={() => setShowNeighbors((v) => !v)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition ${
                showNeighbors
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {showNeighbors ? 'Komşu Dişler: Açık' : 'Komşu Dişler: Gizli'}
            </button>
          )}

          {activeSpec.id === 'short-mini' && (
            <button
              onClick={() => setShortMiniVariant((v) => (v === 'short' ? 'mini' : 'short'))}
              className="px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold bg-indigo-500/25 text-indigo-200 border border-indigo-400/50"
            >
              Form: {shortMiniVariant === 'short' ? 'Kısa İmplant (<6mm)' : 'Mini İmplant (<3mm)'}
            </button>
          )}

          <button
            onClick={() => setShowCrown((v) => !v)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition ${
              showCrown
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {showCrown ? 'Protez Kron: Açık' : 'Protez Kron: Gizli'}
          </button>

          {showCrown && (
            <button
              onClick={() => setCrownMaterial((m) => (m === 'zirconia' ? 'pfm' : 'zirconia'))}
              className="px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700"
            >
              Kron: {crownMaterial === 'zirconia' ? 'Zirkonyum' : 'Porselen (PFM)'}
            </button>
          )}

          <button
            onClick={() => setExploded((v) => !v)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition ${
              exploded
                ? 'bg-rose-500/25 text-rose-200 border border-rose-500/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {exploded ? 'Patlatılmış: AÇIK' : 'Patlatılmış (Exploded)'}
          </button>
        </div>
      </div>

      {/* SAĞ / ALT PANEL: KATEGORİ, 15 İMPLANT, PARÇA/BAĞLANTI VE MARKA KATALOĞU */}
      <div className="w-full lg:w-[440px] bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 sm:p-5 lg:overflow-y-auto lg:max-h-[780px] space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Anatomik & Yapısal Kategori
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {IMPLANT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition border ${
                  selectedCategory === cat.id
                    ? 'bg-sky-500/20 border-sky-500 text-white'
                    : 'bg-slate-800/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{cat.title}</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-950/60 text-sky-300">
                  {cat.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            3D İmplant Geometrisi Seçin
          </label>
          <div className="space-y-1.5">
            {categoryModels.map((model) => (
              <button
                key={model.id}
                onClick={() => handleSelectModel(model.id)}
                className={`w-full text-left p-2.5 rounded-xl border transition ${
                  selectedImplantId === model.id
                    ? 'bg-slate-800 border-sky-400 shadow-md'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-white">{model.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{model.subtitle}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-sky-400">
            4. Parça Sayısı & Bağlantı Arayüzü
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setPieceConfig('monoblock')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                pieceConfig === 'monoblock'
                  ? 'bg-sky-500/20 border-sky-400 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              Tek Parça (Monoblok)
            </button>
            <button
              onClick={() => setPieceConfig('two-piece')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                pieceConfig === 'two-piece'
                  ? 'bg-sky-500/20 border-sky-400 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              İki Parçalı (Modüler)
            </button>
          </div>

          {pieceConfig === 'two-piece' && (
            <div>
              <div className="text-[11px] text-slate-400 mb-1.5">Platform Bağlantı Tipi:</div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'internal-hex', label: 'Internal Hex' },
                  { id: 'external-hex', label: 'External Hex' },
                  { id: 'morse-taper', label: 'Morse Taper' },
                ].map((conn) => (
                  <button
                    key={conn.id}
                    onClick={() => setConnectionType(conn.id as ConnectionType)}
                    className={`py-1.5 px-1.5 rounded-lg text-[11px] font-semibold border ${
                      connectionType === conn.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {conn.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Klinik Marka & Bütçe Segmenti
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'economic', label: 'Ekonomik' },
                { id: 'mid', label: 'Orta' },
                { id: 'premium', label: 'Premium' },
              ] as { id: PriceTier; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTier(t.id)}
                className={`py-2 px-2 rounded-lg text-xs font-bold border transition ${
                  selectedTier === t.id
                    ? t.id === 'economic'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                      : t.id === 'mid'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-purple-500/20 border-purple-400 text-purple-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{activeBrand.brandName}</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {activeBrand.origin}
              </span>
            </div>
            <div className="text-xs font-medium text-sky-300">{activeBrand.modelSeries}</div>
            <div className="text-[11px] text-slate-300">
              <strong className="text-slate-400">Yüzey Teknolojisi:</strong> {activeBrand.surfaceTech}
            </div>
            <div className="text-[11px] text-slate-400">{activeBrand.priceRangeNote}</div>
          </div>
        </div>

        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-xs">
          <p className="text-slate-300 leading-relaxed">{activeSpec.description}</p>
          <p className="text-slate-400 pt-1 border-t border-slate-800/80">
            <strong className="text-sky-400">Klinik Endikasyon:</strong> {activeSpec.clinicalIndication}
          </p>
        </div>
      </div>
    </div>
  );
}