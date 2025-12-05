import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Instances, Instance, Environment, Stars, Grid } from '@react-three/drei';
import * as THREE from 'three';

const SceneContent = ({ data, year, decayRate }) => {
  // --- TUNED CLINICAL LOGIC ---
  const survivalThreshold = (year * 0.12) * decayRate; 

  const segments = useMemo(() => {
    if (!data || !data.geometry) return [];
    const { nodes, edges } = data.geometry;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    return edges.map(([parentId, childId]) => {
      const parent = nodeMap.get(parentId);
      const child = nodeMap.get(childId);
      if (!parent || !child) return null;

      const start = new THREE.Vector3(parent.x, parent.y, parent.z);
      const end = new THREE.Vector3(child.x, child.y, child.z);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      const len = start.distanceTo(end);
      
      const orientation = new THREE.Object3D();
      orientation.position.copy(mid);
      orientation.lookAt(end);
      orientation.rotateX(Math.PI / 2);

      return {
        pos: mid,
        quat: orientation.quaternion,
        len: len,
        rad: child.radius || 0.5,
        type: child.type
      };
    }).filter(Boolean);
  }, [data]);

  return (
    <group>
      <Instances range={30000}>
        <cylinderGeometry args={[1, 1, 1, 5]} /> 
        <meshStandardMaterial toneMapped={false} />

        {segments.map((seg, i) => {
           const isDead = seg.type !== 1 && seg.rad < survivalThreshold;
           // Scale to 0 if dead (reversible), otherwise use biological scale
           const scale = isDead ? [0, 0, 0] : [seg.rad, seg.len, seg.rad];

           const isDying = !isDead && seg.rad < (survivalThreshold + 0.15);
           let color = "#2dd4bf"; // Cyan (Healthy)
           if (isDying) color = "#ef4444"; // Red (Dying)
           else if (seg.type === 1) color = "#ffffff"; // White (Soma)
           else if (seg.type === 2) color = "#10b981"; // Green (Axon)

           return (
             <Instance
               key={i}
               position={seg.pos}
               quaternion={seg.quat}
               scale={scale}
               color={color}
             />
           );
        })}
      </Instances>
    </group>
  );
};

const NeuronViewer = ({ data, year, decayRate }) => {
  return (
    <div className="w-full h-full bg-[#0c0a09] rounded-2xl overflow-hidden shadow-2xl border border-neuro-card relative">
      {/* CAMERA FIX: Moved Z from 140 to 400 to zoom out significantly */}
      <Canvas camera={{ position: [0, 0, 400], fov: 45 }} dpr={[1, 1.5]}>
        <color attach="background" args={['#0c0a09']} />
        
        <ambientLight intensity={0.4} />
        <spotLight position={[50, 50, 50]} angle={0.2} penumbra={1} intensity={1} color="#ffffff" />
        <pointLight position={[-20, -20, -20]} intensity={0.5} color="#38bdf8" />

        <Stars radius={200} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
        <Grid infiniteGrid sectionSize={50} sectionColor="#44403c" cellColor="#1c1917" fadeDistance={400} />

        <SceneContent data={data} year={year} decayRate={decayRate} />
        
        {/* Controls: Enable Pan/Zoom for better inspection */}
        <OrbitControls autoRotate autoRotateSpeed={0.2} enablePan={true} maxDistance={800} minDistance={10} />
      </Canvas>
      
      <div className="absolute top-4 right-4 text-[10px] font-mono text-neuro-muted bg-black/40 px-3 py-1 rounded backdrop-blur-md border border-white/5">
        RENDER: WEBGL 2.0 • INSTANCING ACTIVE
      </div>
    </div>
  );
};

export default NeuronViewer;