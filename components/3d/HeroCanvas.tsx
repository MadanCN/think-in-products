"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;

    // Particle field
    const count = 1800;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0x00e5cc, size: 0.04, transparent: true, opacity: 0.35,
    })));

    // Wireframe icosahedron — right side
    const icosa = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.8, 1),
      new THREE.MeshBasicMaterial({ color: 0x00e5cc, wireframe: true, transparent: true, opacity: 0.08 }),
    );
    icosa.position.set(3, 0.5, -2);
    scene.add(icosa);

    // Wireframe torus — left side
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.4, 12, 40),
      new THREE.MeshBasicMaterial({ color: 0x00a896, wireframe: true, transparent: true, opacity: 0.07 }),
    );
    torus.position.set(-3.5, -1, -1.5);
    scene.add(torus);

    // Wireframe octahedron — upper
    const octa = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.0),
      new THREE.MeshBasicMaterial({ color: 0x00e5cc, wireframe: true, transparent: true, opacity: 0.08 }),
    );
    octa.position.set(-1, 2.5, -3);
    scene.add(octa);

    let mouseX = 0, mouseY = 0;
    const onMouse = (e: MouseEvent) => {
      mouseX =  (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let raf: number;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      camera.position.x += (mouseX * 0.3 - camera.position.x) * 0.02;
      camera.position.y += (mouseY * 0.3 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      icosa.rotation.x = t * 0.12; icosa.rotation.y = t * 0.18;
      torus.rotation.x = t * 0.08; torus.rotation.z = t * 0.14;
      octa.rotation.y  = t * 0.16; octa.rotation.x  = t * 0.10;
      scene.rotation.y = t * 0.015;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
