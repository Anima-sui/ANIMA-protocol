"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ─── CONSTANTS ─── */
const BRAND_BLUE = 0x0241ff;
const BRAND_BLUE_LIGHT = 0x4d8aff;
const CORE_RADIUS = 1.0;
const ORBIT_RADIUS = 2.8;
const NODE_RADIUS = 0.18;

const NODES = [
  { id: "wallet" },
  { id: "skills" },
  { id: "history" },
  { id: "mode" },
  { id: "reputation" },
];

interface NfaThreeSceneProps {
  activeNodeId: string | null;
  onNodeSelect: (id: string) => void;
}

export default function NfaThreeScene({
  activeNodeId,
  onNodeSelect,
}: NfaThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef(activeNodeId);
  activeIdRef.current = activeNodeId;
  const onSelectRef = useRef(onNodeSelect);
  onSelectRef.current = onNodeSelect;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    if (width === 0 || height === 0) return;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    /* ── Scene & Camera ── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 8);
    camera.lookAt(0, 0, 0);

    /* ── Lighting ── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const coreLight = new THREE.PointLight(BRAND_BLUE, 3, 12);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight.position.set(4, 6, 4);
    scene.add(dirLight);

    /* ── Subtle Grid Floor ── */
    const gridHelper = new THREE.GridHelper(24, 48, BRAND_BLUE, BRAND_BLUE);
    (gridHelper.material as THREE.Material).opacity = 0.04;
    (gridHelper.material as THREE.Material).transparent = true;
    gridHelper.position.y = -3.2;
    scene.add(gridHelper);

    /* ── Central Core Group ── */
    const coreGroup = new THREE.Group();

    // Wireframe icosahedron (outer)
    const coreOuterGeo = new THREE.IcosahedronGeometry(CORE_RADIUS, 1);
    const coreOuterMat = new THREE.MeshBasicMaterial({
      color: BRAND_BLUE,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    coreGroup.add(new THREE.Mesh(coreOuterGeo, coreOuterMat));

    // Wireframe icosahedron (inner, rotated)
    const coreInnerGeo = new THREE.IcosahedronGeometry(CORE_RADIUS * 0.7, 1);
    const coreInnerWire = new THREE.MeshBasicMaterial({
      color: BRAND_BLUE_LIGHT,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const innerWireMesh = new THREE.Mesh(coreInnerGeo, coreInnerWire);
    innerWireMesh.rotation.set(0.5, 0.3, 0.2);
    coreGroup.add(innerWireMesh);

    // Inner solid glow
    const solidGeo = new THREE.IcosahedronGeometry(CORE_RADIUS * 0.45, 2);
    const solidMat = new THREE.MeshPhongMaterial({
      color: BRAND_BLUE,
      transparent: true,
      opacity: 0.2,
      emissive: BRAND_BLUE,
      emissiveIntensity: 0.5,
    });
    const solidMesh = new THREE.Mesh(solidGeo, solidMat);
    coreGroup.add(solidMesh);

    // Core glow sphere
    const glowGeo = new THREE.SphereGeometry(CORE_RADIUS * 0.3, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: BRAND_BLUE,
      transparent: true,
      opacity: 0.15,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    coreGroup.add(glowMesh);

    scene.add(coreGroup);

    /* ── Orbital Torus Rings ── */
    const rings: THREE.Mesh[] = [];
    const ringRadii = [1.6, 2.1, 2.6];
    ringRadii.forEach((r, i) => {
      const tGeo = new THREE.TorusGeometry(r, 0.006, 8, 120);
      const tMat = new THREE.MeshBasicMaterial({
        color: BRAND_BLUE,
        transparent: true,
        opacity: 0.1 - i * 0.02,
      });
      const torus = new THREE.Mesh(tGeo, tMat);
      torus.rotation.x = Math.PI / 2 + (i - 1) * 0.15;
      scene.add(torus);
      rings.push(torus);
    });

    /* ── Node Meshes (Octahedrons) ── */
    const nodeMeshes = new Map<string, THREE.Mesh>();
    const nodeRings = new Map<string, THREE.Mesh>();
    const connLines = new Map<string, THREE.Line>();
    const basePositions = new Map<string, THREE.Vector3>();

    NODES.forEach((node, i) => {
      const angle = (i / NODES.length) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * ORBIT_RADIUS;
      const y = Math.sin(angle) * ORBIT_RADIUS;
      const pos = new THREE.Vector3(x, y, 0);
      basePositions.set(node.id, pos.clone());

      // Octahedron node
      const nGeo = new THREE.OctahedronGeometry(NODE_RADIUS, 0);
      const nMat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: BRAND_BLUE,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.9,
        flatShading: true,
      });
      const nMesh = new THREE.Mesh(nGeo, nMat);
      nMesh.position.copy(pos);
      nMesh.userData = { id: node.id };
      scene.add(nMesh);
      nodeMeshes.set(node.id, nMesh);

      // Node halo ring
      const hrGeo = new THREE.TorusGeometry(NODE_RADIUS * 1.8, 0.006, 8, 32);
      const hrMat = new THREE.MeshBasicMaterial({
        color: BRAND_BLUE,
        transparent: true,
        opacity: 0.2,
      });
      const hrMesh = new THREE.Mesh(hrGeo, hrMat);
      hrMesh.position.copy(pos);
      scene.add(hrMesh);
      nodeRings.set(node.id, hrMesh);

      // Connection beam
      const lGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        pos,
      ]);
      const lMat = new THREE.LineBasicMaterial({
        color: BRAND_BLUE,
        transparent: true,
        opacity: 0.1,
      });
      const line = new THREE.Line(lGeo, lMat);
      scene.add(line);
      connLines.set(node.id, line);
    });

    /* ── Background Particles ── */
    const pCount = 400;
    const pPositions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 20;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: BRAND_BLUE_LIGHT,
      size: 0.025,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    /* ── Raycasting ── */
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-100, -100);
    const clock = new THREE.Clock();
    const _scaleVec = new THREE.Vector3();
    let hoveredId: string | null = null;
    let animId = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = () => {
      if (hoveredId) {
        onSelectRef.current(hoveredId);
      }
    };

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    /* ── Animation Loop ── */
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Core rotation
      coreGroup.rotation.y = t * 0.12;
      coreGroup.rotation.x = Math.sin(t * 0.08) * 0.12;
      innerWireMesh.rotation.y = -t * 0.2;

      // Solid inner pulse
      const solidScale = 1 + Math.sin(t * 1.8) * 0.06;
      solidMesh.scale.setScalar(solidScale);
      glowMesh.scale.setScalar(1 + Math.sin(t * 2) * 0.08);
      glowMat.opacity = 0.12 + Math.sin(t * 2) * 0.04;

      // Core light pulse
      coreLight.intensity = 2.5 + Math.sin(t * 1.5) * 0.8;

      // Orbital ring rotation
      rings.forEach((ring, i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        ring.rotation.z = t * (0.04 + i * 0.015) * dir;
      });

      // Particle drift
      particles.rotation.y = t * 0.008;
      particles.rotation.x = Math.sin(t * 0.05) * 0.02;

      // Raycasting
      raycaster.setFromCamera(mouse, camera);
      const meshArr = Array.from(nodeMeshes.values());
      const intersects = raycaster.intersectObjects(meshArr);
      const newHover = intersects.length > 0 ? (intersects[0].object.userData.id as string) : null;

      if (newHover !== hoveredId) {
        hoveredId = newHover;
        renderer.domElement.style.cursor = hoveredId ? "pointer" : "default";
      }

      // Update nodes
      nodeMeshes.forEach((mesh, id) => {
        const mat = mesh.material as THREE.MeshPhongMaterial;
        const isActive = activeIdRef.current === id;
        const isHovered = hoveredId === id;

        // Scale
        const s = isActive ? 1.6 : isHovered ? 1.3 : 1.0;
        _scaleVec.set(s, s, s);
        mesh.scale.lerp(_scaleVec, 0.1);

        // Self-rotation
        mesh.rotation.y = t * (isActive ? 1.5 : 0.4);
        mesh.rotation.x = t * 0.3;

        // Color
        if (isActive) {
          mat.emissiveIntensity = 0.9 + Math.sin(t * 3) * 0.15;
          mat.color.setHex(BRAND_BLUE);
          mat.emissive.setHex(BRAND_BLUE);
          mat.opacity = 1;
        } else if (isHovered) {
          mat.emissiveIntensity = 0.55;
          mat.color.setHex(BRAND_BLUE_LIGHT);
          mat.emissive.setHex(BRAND_BLUE);
          mat.opacity = 0.95;
        } else {
          mat.emissiveIntensity = 0.2;
          mat.color.setHex(0xcccccc);
          mat.emissive.setHex(BRAND_BLUE);
          mat.opacity = 0.85;
        }

        // Halo ring
        const halo = nodeRings.get(id);
        if (halo) {
          const hMat = halo.material as THREE.MeshBasicMaterial;
          hMat.opacity = isActive ? 0.5 : isHovered ? 0.35 : 0.12;
          halo.rotation.z = t * 0.5;
        }

        // Connection beam
        const line = connLines.get(id);
        if (line) {
          const lm = line.material as THREE.LineBasicMaterial;
          lm.opacity = isActive ? 0.5 : isHovered ? 0.3 : 0.08;
        }
      });

      // Gentle camera sway
      camera.position.x = Math.sin(t * 0.06) * 0.4;
      camera.position.y = 1.5 + Math.sin(t * 0.04) * 0.15;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    /* ── Resize Handler ── */
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", onResize);

    /* ── Cleanup ── */
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else (mat as THREE.Material).dispose();
        }
      });

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
