import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, OrbitControls } from '@react-three/drei';

import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three-stdlib';
import { mergeBufferGeometries } from 'three-stdlib';

// =========================================
// HELPERS (Exact copy from modcopy.html)
// =========================================

// 1. ORGAN GENERATOR (Upgraded Materials)
function createOrgan(geometry, color, count, particleSize = 0.12) {
    const group = new THREE.Group();

    // A. The Inner Core (Physical Material for "Wet/Organic" look)
    const coreMat = new THREE.MeshPhysicalMaterial({
        color: color,
        roughness: 0.4,
        metalness: 0.1,
        clearcoat: 1.0,       // Makes it look wet
        clearcoatRoughness: 0.1,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide
    });
    const coreMesh = new THREE.Mesh(geometry.clone(), coreMat);
    coreMesh.scale.set(0.92, 0.92, 0.92);
    group.add(coreMesh);

    // B. The Cellular Surface (Particles)
    // Note: We pass the geometry to the sampler. 
    // Ensure geometry has normal attribute (BufferGeometryUtils.mergeBufferGeometries usually keeps it)
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial())).build();
    const partGeo = new THREE.SphereGeometry(particleSize, 8, 8); // Slightly higher res

    // Glowing particle material
    const partMat = new THREE.MeshPhysicalMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.3,
        roughness: 0.2,
        clearcoat: 1.0
    });

    const instancedMesh = new THREE.InstancedMesh(partGeo, partMat, count);
    const dummy = new THREE.Object3D();
    const pos = new THREE.Vector3();
    const nor = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
        sampler.sample(pos, nor);
        pos.addScaledVector(nor, (Math.random() - 0.5) * 0.2);
        dummy.position.copy(pos);

        const s = 0.5 + Math.random() * 1.0;
        dummy.scale.set(s, s, s);
        dummy.lookAt(pos.clone().add(nor));
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;

    group.add(instancedMesh);
    return group;
}

// =========================================
// MODELS (Geometry logic preserved exactly)
// =========================================

function createHeartModel() {
    const containerGroup = new THREE.Group();
    const redGeos = [];

    const leftVentricle = new THREE.SphereGeometry(2.0, 32, 32);
    leftVentricle.applyMatrix4(new THREE.Matrix4().makeScale(0.8, 1.5, 0.8));
    leftVentricle.translate(0.6, -0.5, 0);
    leftVentricle.rotateZ(0.2);
    redGeos.push(leftVentricle);

    const leftAtrium = new THREE.SphereGeometry(1.2, 24, 24);
    leftAtrium.translate(1.0, 1.5, -0.4);
    redGeos.push(leftAtrium);

    const aortaCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.5, 1.5, 0),
        new THREE.Vector3(0.2, 2.8, 0),
        new THREE.Vector3(-0.5, 3.2, 0),
        new THREE.Vector3(-1.2, 2.5, 0),
        new THREE.Vector3(-1.2, 0.5, 0)
    ]);
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 24, 0.6, 12, false);
    redGeos.push(aortaGeo);

    // Use mergeBufferGeometries from three-stdlib
    const redMerged = mergeBufferGeometries(redGeos);
    const redTissue = createOrgan(redMerged, 0xd00000, 1500, 0.09); // Reduced from 4000
    containerGroup.add(redTissue);

    const blueGeos = [];
    const rightVentricle = new THREE.SphereGeometry(1.7, 32, 32);
    rightVentricle.applyMatrix4(new THREE.Matrix4().makeScale(0.9, 1.3, 0.9));
    rightVentricle.translate(-0.8, -0.2, 0.6);
    blueGeos.push(rightVentricle);

    const rightAtrium = new THREE.SphereGeometry(1.3, 24, 24);
    rightAtrium.translate(-1.2, 1.2, 0.3);
    blueGeos.push(rightAtrium);

    const venaCurve = new THREE.LineCurve3(new THREE.Vector3(-1.6, 1.5, 0.2), new THREE.Vector3(-1.6, 3.2, 0));
    const venaGeo = new THREE.TubeGeometry(venaCurve, 8, 0.55, 12, false);
    blueGeos.push(venaGeo);

    const pulmCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.6, 0.8, 0.9),
        new THREE.Vector3(-0.4, 2.2, 0.7),
        new THREE.Vector3(0.8, 2.4, 0.5)
    ]);
    const pulmGeo = new THREE.TubeGeometry(pulmCurve, 15, 0.5, 12, false);
    blueGeos.push(pulmGeo);

    const blueMerged = mergeBufferGeometries(blueGeos);
    const blueTissue = createOrgan(blueMerged, 0x2255aa, 1200, 0.09); // Reduced from 3500
    containerGroup.add(blueTissue);

    new THREE.Box3().setFromObject(containerGroup).getCenter(containerGroup.position).multiplyScalar(-1);
    return containerGroup;
}

function createNeuronModel() {
    const geos = [];
    const soma = new THREE.SphereGeometry(1.5, 32, 32);
    const posAttr = soma.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i); const y = posAttr.getY(i); const z = posAttr.getZ(i);
        const n = Math.sin(x * 3) * Math.sin(y * 2) * 0.2;
        posAttr.setXYZ(i, x + n, y + n, z + n);
    }
    soma.computeVertexNormals(); geos.push(soma);

    const axonCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(2, -0.5, 0),
        new THREE.Vector3(5, 0.5, 0),
        new THREE.Vector3(8, -1, 0),
        new THREE.Vector3(10, 0, 0)
    ]);
    const axon = new THREE.TubeGeometry(axonCurve, 30, 0.35, 8, false); geos.push(axon);

    function addBranch(start, dir, length, thickness, branches = 0) {
        const end = new THREE.Vector3().copy(start).add(dir.clone().multiplyScalar(length));
        const mid = new THREE.Vector3().lerpVectors(start, end, 0.5).add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5));
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const tube = new THREE.TubeGeometry(curve, 8, thickness, 6, false); geos.push(tube);
        if (branches > 0) {
            const numSub = 2;
            for (let i = 0; i < numSub; i++) {
                const newDir = dir.clone().applyEuler(new THREE.Euler((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5))).normalize();
                addBranch(end, newDir, length * 0.7, thickness * 0.6, branches - 1);
            }
        }
    }

    for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2;
        const dir = new THREE.Vector3(-Math.cos(angle), Math.sin(angle), (Math.random() - 0.5)).normalize();
        addBranch(new THREE.Vector3(-0.5, 0, 0), dir, 2.5, 0.3, 2);
    }
    addBranch(new THREE.Vector3(10, 0, 0), new THREE.Vector3(1, 0.5, 0).normalize(), 1.5, 0.2, 1);
    addBranch(new THREE.Vector3(10, 0, 0), new THREE.Vector3(1, -0.5, 0).normalize(), 1.5, 0.2, 1);

    const neuronGeo = mergeBufferGeometries(geos);
    const model = createOrgan(neuronGeo, 0x00ffff, 2000, 0.08); // Reduced from 6000
    new THREE.Box3().setFromObject(model).getCenter(model.position).multiplyScalar(-1);
    model.position.x += 1.5; // Visual centering
    model.scale.set(0.6, 0.6, 0.6);
    return model;
}

function createBoneModel() {
    const shaftCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, -4.5, 0), new THREE.Vector3(0.3, 0, 0), new THREE.Vector3(0, 4.5, 0));
    const shaft = new THREE.TubeGeometry(shaftCurve, 24, 0.65, 16, false);
    const head = new THREE.SphereGeometry(1.4, 32, 32); head.translate(-1.4, 5.5, 0);
    const neck = new THREE.CylinderGeometry(0.55, 0.75, 1.8, 12); neck.rotateZ(0.7); neck.translate(-0.6, 4.8, 0);
    const troch = new THREE.SphereGeometry(1.1, 24, 24); troch.scale(0.8, 1.3, 0.8); troch.translate(0.7, 4.5, 0);
    const c1 = new THREE.SphereGeometry(1.3, 24, 24); c1.scale(0.9, 1.1, 1.2); c1.translate(-0.7, -5.2, 0.2);
    const c2 = new THREE.SphereGeometry(1.3, 24, 24); c2.scale(0.9, 1.1, 1.2); c2.translate(0.7, -5.2, 0.2);
    const bridge = new THREE.CylinderGeometry(1.0, 1.0, 1.4, 12); bridge.rotateZ(Math.PI / 2); bridge.translate(0, -5.0, 0.2);

    const boneGeo = mergeBufferGeometries([shaft, head, neck, troch, c1, c2, bridge]);
    const model = createOrgan(boneGeo, 0xfffff0, 2500, 0.07); // Reduced from 7500
    model.rotation.z = 0.2;
    model.scale.set(0.25, 0.25, 0.25);
    return model;
}

// 4. High-Fidelity Lungs (From light2.html - Alveoli Clusters)
const LungModel = () => {
    const groupRef = useRef();

    const alveoli = useMemo(() => {
        const points = [];
        const createCluster = (offsetX) => {
            for (let i = 0; i < 30; i++) {
                const theta = Math.random() * 2 * Math.PI;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = 0.45 * Math.cbrt(Math.random());
                points.push({
                    pos: [
                        r * Math.sin(phi) * Math.cos(theta) + offsetX,
                        r * Math.sin(phi) * Math.sin(theta) + 0.1,
                        r * Math.cos(phi)
                    ],
                    scale: Math.random() * 0.12 + 0.06
                });
            }
        };
        createCluster(-0.55);
        createCluster(0.55);
        return points;
    }, []);

    useFrame((state, delta) => {
        const t = state.clock.getElapsedTime();
        const baseScale = 1.8;
        const breath = (1 + Math.sin(t * 2) * 0.08) * baseScale;
        if (groupRef.current) {
            groupRef.current.scale.set(breath, breath, breath);
            groupRef.current.rotation.y += delta * 0.2;
        }
    });

    return (
        <group ref={groupRef} scale={1.8}>
            {alveoli.map((data, i) => (
                <mesh key={i} position={data.pos} scale={data.scale}>
                    <sphereGeometry args={[1, 16, 16]} />
                    <meshPhysicalMaterial
                        color="#06b6d4"
                        transmission={0.6}
                        thickness={0.8}
                        roughness={0.1}
                        ior={1.4}
                    />
                </mesh>
            ))}
            <mesh position={[0, 0.8, 0]}>
                <cylinderGeometry args={[0.12, 0.12, 0.4, 12]} />
                <meshStandardMaterial color="#0891b2" roughness={0.4} />
            </mesh>
        </group>
    );
};

// 5. Drug Simulation (Pill Model)
function createPillModel() {
    const group = new THREE.Group();

    // Capsule Body (Half White, Half Red)
    const radius = 0.8;
    const length = 2.5;

    // Top Half (Red)
    const topGeo = new THREE.CapsuleGeometry(radius, length / 2, 4, 16);
    topGeo.translate(0, length / 4, 0);
    const topMat = new THREE.MeshPhysicalMaterial({
        color: 0x3b82f6,
        roughness: 0.2,
        metalness: 0.1,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);

    // Bottom Half (White)
    const botGeo = new THREE.CapsuleGeometry(radius, length / 2, 4, 16);
    botGeo.translate(0, -length / 4, 0);
    const botMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.1,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1
    });
    const botMesh = new THREE.Mesh(botGeo, botMat);

    // Floating Particles (Molecules)
    const particleCount = 50;
    const particleGeo = new THREE.IcosahedronGeometry(0.15, 0);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.6 });
    const particles = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < particleCount; i++) {
        const r = 2.5 + Math.random() * 1.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        dummy.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        const s = 0.5 + Math.random() * 0.5;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        particles.setMatrixAt(i, dummy.matrix);
    }

    group.add(topMesh);
    group.add(botMesh);
    group.add(particles);

    group.rotation.z = Math.PI / 4;
    return group;
}

const PillWrapper = () => {
    const model = useMemo(() => createPillModel(), []);
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        // Removed auto-rotation for interactivity
        model.position.y = Math.sin(t * 1.5) * 0.2;
    });
    return <primitive object={model} />;
};

// =========================================
// WRAPPER COMPONENTS
// =========================================

const HeartWrapper = () => {
    const model = useMemo(() => createHeartModel(), []);
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        const period = 1.0;
        const phase = t % period;
        let s = 0.45;
        if (phase < 0.15) s = 0.5;
        else if (phase > 0.25 && phase < 0.4) s = 0.47;
        model.scale.lerp(new THREE.Vector3(s, s, s), 0.2);
    });
    return <primitive object={model} />;
};

const NeuronWrapper = () => {
    const model = useMemo(() => createNeuronModel(), []);
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        model.rotation.z = Math.sin(t * 0.5) * 0.05;
        const pulse = 0.25 + Math.sin(t * 4) * 0.01;
        model.scale.set(pulse, pulse, pulse);
    });
    return <primitive object={model} />;
};

const BoneWrapper = () => {
    const model = useMemo(() => createBoneModel(), []);
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        model.position.y = Math.sin(t) * 0.2;
    });
    return <primitive object={model} />;
};

const SpecialtyCard3D = ({ type, color, className }) => {
    // Removed pointer-events-none to allow interaction
    const containerClass = className || "w-full h-full absolute top-0 right-0 opacity-100 transition-opacity duration-500 bg-black";

    if (type === 'cardiology_mri') {
        return (
            <div className={containerClass}>
                <iframe
                    src="/mri1.html"
                    className="w-full h-full border-0 pointer-events-none" // pointer-events-none if we want click to go through to card
                    title="MRI Twin"
                />
            </div>
        );
    }

    if (type === 'drug_simulation') {
        return (
            <div className={containerClass}>
                <iframe
                    src="/pill.html"
                    className="w-full h-full border-0 pointer-events-none"
                    title="Drug Simulation"
                />
            </div>
        );
    }

    return (
        <div className={containerClass}>
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]}>
                <color attach="background" args={['#000000']} />
                {/* Studio Lighting */}
                <ambientLight intensity={0.2} />
                <directionalLight position={[5, 5, 10]} intensity={1.5} />
                <spotLight position={[-5, 5, -5]} angle={0.5} intensity={2.0} color={color} />

                {/* Centered Float */}
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5} position={[0, 0, 0]}>
                    {type === 'cardiology' && <HeartWrapper />}
                    {type === 'neurology' && <NeuronWrapper />}
                    {type === 'orthopedics' && <BoneWrapper />}
                    {type === 'pulmonology' && <LungModel />}
                </Float>

                <Environment preset="city" />
                {/* Enable Interaction */}
                <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
            </Canvas>
        </div>
    );
};

export default SpecialtyCard3D;
