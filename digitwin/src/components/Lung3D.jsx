import React, { useRef, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Center, Environment, ContactShadows, Sphere, MeshDistortMaterial, Torus } from '@react-three/drei';
import * as THREE from 'three';

// --- Error Boundary Component ---
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // eslint-disable-next-line no-unused-vars
  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Lung3D Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI if something goes wrong
      return (
        <group>
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="red" />
          </mesh>
        </group>
      );
    }

    return this.props.children;
  }
}

// --- Procedural Lungs Component (Fallback) ---
const ProceduralLungs = ({ volume, resistance }) => {
  // Refs for the lung groups to animate scale
  const leftLungGroup = useRef();
  const rightLungGroup = useRef();

  // Refs for materials to animate color
  const leftMatRef = useRef();
  const rightMatRef = useRef();

  // Color Logic:
  // User requested "make it red". 
  // Healthy: Pinkish Red (#fca5a5). Inflamed: Deep Red (#7f1d1d).
  const targetColor = new THREE.Color(resistance > 10 ? "#7f1d1d" : "#fca5a5");

  useFrame((state, delta) => {
    // 1. Animate Color
    if (leftMatRef.current) leftMatRef.current.color.lerp(targetColor, delta * 3);
    if (rightMatRef.current) rightMatRef.current.color.lerp(targetColor, delta * 3);

    // 2. Animate Breathing (Expansion / Contraction)
    const t = state.clock.getElapsedTime();
    // Breathing rhythm: sin wave. 
    const breathIntensity = 0.1; // How much it expands
    const breathFreq = 1.5; // Speed of breathing
    const expansion = Math.sin(t * breathFreq) * breathIntensity;

    const baseScale = 0.8 + (volume / 2500); // Base size from volume prop
    const currentScale = baseScale + expansion;

    if (leftLungGroup.current) {
      leftLungGroup.current.scale.set(currentScale, currentScale, currentScale);
    }
    if (rightLungGroup.current) {
      rightLungGroup.current.scale.set(currentScale, currentScale, currentScale);
    }
  });

  // Trachea Ridges
  const ridges = Array.from({ length: 8 }).map((_, i) => (
    <Torus key={i} args={[0.26, 0.03, 16, 32]} position={[0, 1.1 + (i * 0.12), 0]} rotation={[Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
    </Torus>
  ));

  // Shared material props for the lobes
  const materialProps = {
    roughness: 0.4,
    metalness: 0.1,
    distort: 0.5, // High distortion for organic feel
    speed: 1.5
  };

  return (
    <group>
      {/* LEFT LUNG GROUP */}
      <group ref={leftLungGroup} position={[-1.1, 0, 0]}>
        {/* Upper Lobe */}
        <Sphere args={[0.65, 64, 64]} position={[0, 0.6, 0.1]} scale={[0.9, 1.1, 0.9]}>
          <MeshDistortMaterial ref={leftMatRef} color="#fca5a5" {...materialProps} />
        </Sphere>
        {/* Lower Lobe */}
        <Sphere args={[0.75, 64, 64]} position={[0.1, -0.4, 0]} scale={[1, 1.2, 1]}>
          <MeshDistortMaterial color="#fca5a5" {...materialProps} />
        </Sphere>
      </group>

      {/* RIGHT LUNG GROUP */}
      <group ref={rightLungGroup} position={[1.1, 0, 0]}>
        {/* Upper Lobe */}
        <Sphere args={[0.65, 64, 64]} position={[0, 0.6, 0.1]} scale={[0.9, 1.1, 0.9]}>
          <MeshDistortMaterial ref={rightMatRef} color="#fca5a5" {...materialProps} />
        </Sphere>
        {/* Lower Lobe */}
        <Sphere args={[0.75, 64, 64]} position={[-0.1, -0.4, 0]} scale={[1, 1.2, 1]}>
          <MeshDistortMaterial color="#fca5a5" {...materialProps} />
        </Sphere>
      </group>

      {/* Trachea (Central Tube) */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 1.2, 32]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.5} />
      </mesh>

      {/* Trachea Ridges */}
      {ridges}

      {/* Bronchi Connections */}
      {/* Left Bronchus - Angled downwards */}
      <mesh position={[-0.5, 1.1, 0]} rotation={[0, 0, Math.PI / 1.5]}>
        <cylinderGeometry args={[0.15, 0.15, 1.2, 32]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.5} />
      </mesh>

      {/* Right Bronchus - Angled downwards */}
      <mesh position={[0.5, 1.1, 0]} rotation={[0, 0, -Math.PI / 1.5]}>
        <cylinderGeometry args={[0.15, 0.15, 1.2, 32]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.5} />
      </mesh>

    </group>
  );
};

// --- Main Scene ---
const LungScene = ({ volume, resistance }) => {
  return (
    <div style={{ height: '100%', width: '100%', background: '#000000', position: 'relative' }}>
      <Canvas shadows camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <color attach="background" args={['#000000']} />
        <Center>
          <ProceduralLungs volume={volume} resistance={resistance} />
        </Center>
        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
    </div>
  );
};

export default LungScene;