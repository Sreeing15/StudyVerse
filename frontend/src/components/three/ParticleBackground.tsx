import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTheme } from '@/context/ThemeContext';
import * as THREE from 'three';

interface ParticleFieldProps {
  isDarkMode: boolean;
}

const ParticleField: React.FC<ParticleFieldProps> = ({ isDarkMode }) => {
  const meshRef = useRef<THREE.Points>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const particleCount = 150;

  // Generate particles
  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
    }

    return { positions, velocities };
  }, []);

  // Create geometry with positions
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  // Track mouse movement
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animation frame
  useFrame(() => {
    if (!meshRef.current) return;

    const positionAttribute = meshRef.current.geometry.attributes.position;
    const positionArray = positionAttribute.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;

      // Update positions
      positionArray[idx] += velocities[idx];
      positionArray[idx + 1] += velocities[idx + 1];
      positionArray[idx + 2] += velocities[idx + 2];

      // Boundary check and bounce
      if (Math.abs(positionArray[idx]) > 10) velocities[idx] *= -1;
      if (Math.abs(positionArray[idx + 1]) > 10) velocities[idx + 1] *= -1;
      if (Math.abs(positionArray[idx + 2]) > 5) velocities[idx + 2] *= -1;

      // Subtle mouse influence
      const dx = mouseRef.current.x * 5 - positionArray[idx];
      const dy = mouseRef.current.y * 5 - positionArray[idx + 1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) {
        positionArray[idx] += dx * 0.001;
        positionArray[idx + 1] += dy * 0.001;
      }
    }

    positionAttribute.needsUpdate = true;
  });

  // Colors based on theme
  const particleColor = isDarkMode ? '#a5b4fc' : '#6366f1';
  const particleOpacity = isDarkMode ? 0.6 : 0.8;

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        size={0.12}
        color={particleColor}
        transparent
        opacity={particleOpacity}
        sizeAttenuation
      />
    </points>
  );
};

interface ConnectionLinesProps {
  isDarkMode: boolean;
}

const ConnectionLines: React.FC<ConnectionLinesProps> = ({ isDarkMode }) => {
  const linesRef = useRef<THREE.LineSegments>(null);
  const particleCount = 150;

  const { positions, lineGeometry } = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    for (let i = 0; i < particleCount; i++) {
      positions.push(new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10
      ));
    }

    // Pre-allocate line positions (max possible connections)
    const maxConnections = particleCount * 3;
    const linePositions = new Float32Array(maxConnections * 6);
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    return { positions, lineGeometry: geo };
  }, []);

  const velocities = useMemo(() => {
    return positions.map(() => new THREE.Vector3(
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.005
    ));
  }, [positions]);

  useFrame(() => {
    if (!linesRef.current) return;

    // Update particle positions
    for (let i = 0; i < particleCount; i++) {
      positions[i].add(velocities[i]);

      // Boundary bounce
      if (Math.abs(positions[i].x) > 10) velocities[i].x *= -1;
      if (Math.abs(positions[i].y) > 10) velocities[i].y *= -1;
      if (Math.abs(positions[i].z) > 5) velocities[i].z *= -1;
    }

    // Update line connections
    const positionAttribute = linesRef.current.geometry.attributes.position;
    const lineArray = positionAttribute.array as Float32Array;
    let lineIndex = 0;
    const maxDist = 2.5;

    for (let i = 0; i < particleCount; i++) {
      let connections = 0;
      for (let j = i + 1; j < particleCount && connections < 3; j++) {
        const dist = positions[i].distanceTo(positions[j]);
        if (dist < maxDist) {
          lineArray[lineIndex++] = positions[i].x;
          lineArray[lineIndex++] = positions[i].y;
          lineArray[lineIndex++] = positions[i].z;
          lineArray[lineIndex++] = positions[j].x;
          lineArray[lineIndex++] = positions[j].y;
          lineArray[lineIndex++] = positions[j].z;
          connections++;
        }
      }
    }

    // Clear remaining line positions
    for (let i = lineIndex; i < lineArray.length; i++) {
      lineArray[i] = 0;
    }

    positionAttribute.needsUpdate = true;
  });

  const lineColor = isDarkMode ? '#6366f1' : '#818cf8';

  return (
    <lineSegments ref={linesRef} geometry={lineGeometry}>
      <lineBasicMaterial
        color={lineColor}
        transparent
        opacity={isDarkMode ? 0.15 : 0.35}
      />
    </lineSegments>
  );
};

const FloatingShapes: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
  });

  const shapeColor = isDarkMode ? '#4f46e5' : '#6366f1';
  const shapeOpacity = isDarkMode ? 0.3 : 0.5;

  return (
    <group ref={groupRef}>
      {/* Floating octahedron */}
      <mesh position={[-6, 3, -5]}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshBasicMaterial color={shapeColor} transparent opacity={shapeOpacity} wireframe />
      </mesh>

      {/* Floating torus */}
      <mesh position={[6, -3, -3]}>
        <torusGeometry args={[0.6, 0.2, 8, 20]} />
        <meshBasicMaterial color={shapeColor} transparent opacity={shapeOpacity * 0.9} wireframe />
      </mesh>

      {/* Floating icosahedron */}
      <mesh position={[-4, -4, -6]}>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color={shapeColor} transparent opacity={shapeOpacity * 0.8} wireframe />
      </mesh>

      {/* Floating sphere */}
      <mesh position={[5, 4, -4]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial color={shapeColor} transparent opacity={shapeOpacity * 0.9} wireframe />
      </mesh>
    </group>
  );
};

const ParticleBackground: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={[isDarkMode ? '#0f172a' : '#f8fafc']} />
        <ambientLight intensity={isDarkMode ? 0.3 : 0.7} />
        <ParticleField isDarkMode={isDarkMode} />
        <ConnectionLines isDarkMode={isDarkMode} />
        <FloatingShapes isDarkMode={isDarkMode} />
      </Canvas>
    </div>
  );
};

export default ParticleBackground;
