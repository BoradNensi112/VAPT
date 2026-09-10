import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function CyberGlobe() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 550;
    const height = container.clientHeight || 550;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 240;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Root Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Outer Holographic Wireframe Sphere
    const sphereGeometry = new THREE.SphereGeometry(68, 36, 36);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    globeGroup.add(sphereMesh);

    // 2. Inner Glowing Core
    const innerGeo = new THREE.IcosahedronGeometry(46, 2);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      wireframe: true,
      transparent: true,
      opacity: 0.38
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    globeGroup.add(innerCore);

    // 3. Floating Threat Data Nodes (Cyber Particles)
    const particleCount = 260;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 70 + Math.random() * 5;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color variation: High Threat (Red/Orange) & Secure Nodes (Cyan/Emerald)
      const rand = Math.random();
      if (rand > 0.82) {
        colors[i * 3] = 0.95;     // Red
        colors[i * 3 + 1] = 0.25;
        colors[i * 3 + 2] = 0.25;
      } else if (rand > 0.6) {
        colors[i * 3] = 0.98;     // Amber
        colors[i * 3 + 1] = 0.70;
        colors[i * 3 + 2] = 0.15;
      } else {
        colors[i * 3] = 0.0;      // Cyan
        colors[i * 3 + 1] = 0.94;
        colors[i * 3 + 2] = 1.0;
      }
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 4.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    globeGroup.add(particles);

    // 4. Equatorial & Orbital Cyber Rings
    const ringGeo1 = new THREE.RingGeometry(88, 90, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    globeGroup.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(96, 97.5, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    globeGroup.add(ring2);

    // INTERACTIVITY (Mouse & Touch Drag Controls with Auto-Resume)
    let isDragging = false;
    let previousPointerPosition = { x: 0, y: 0 };
    let rotationVelocity = { x: 0, y: 0.003 };
    let autoRotate = true;

    const domElement = renderer.domElement;
    domElement.style.cursor = 'grab';

    const onPointerDown = (e) => {
      isDragging = true;
      autoRotate = false;
      domElement.style.cursor = 'grabbing';
      previousPointerPosition = {
        x: e.clientX || (e.touches && e.touches[0].clientX) || 0,
        y: e.clientY || (e.touches && e.touches[0].clientY) || 0
      };
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;

      const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const currentY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      const deltaX = currentX - previousPointerPosition.x;
      const deltaY = currentY - previousPointerPosition.y;

      globeGroup.rotation.y += deltaX * 0.007;
      globeGroup.rotation.x += deltaY * 0.007;

      rotationVelocity = {
        x: deltaY * 0.002,
        y: deltaX * 0.002
      };

      previousPointerPosition = { x: currentX, y: currentY };
    };

    const onPointerUp = () => {
      isDragging = false;
      domElement.style.cursor = 'grab';
      setTimeout(() => {
        autoRotate = true;
      }, 500);
    };

    domElement.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    domElement.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isDragging) {
        if (autoRotate) {
          globeGroup.rotation.y += 0.0035;
          globeGroup.rotation.x *= 0.98;
        } else {
          globeGroup.rotation.y += rotationVelocity.y;
          globeGroup.rotation.x += rotationVelocity.x;
          rotationVelocity.x *= 0.95;
          rotationVelocity.y *= 0.95;
        }
      }

      innerCore.rotation.y -= 0.004;
      ring1.rotation.z += 0.002;
      ring2.rotation.z -= 0.0015;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      domElement.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        userSelect: 'none',
        touchAction: 'none'
      }}
      title="Click & Drag to rotate 3D Cyber Globe"
    />
  );
}
