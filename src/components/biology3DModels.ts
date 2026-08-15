import * as THREE from 'three';
import { BiologyModelType, ModelAnnotation } from '../types';

export interface BiologyModelResult {
  group: THREE.Group;
  annotations: ModelAnnotation[];
  update: (delta: number, elapsed: number, explodeFactor: number) => void;
  dispose: () => void;
}

// 1. PLANT CELL 3D MODEL
export function createPlantCellModel(): BiologyModelResult {
  const group = new THREE.Group();
  const explodables: { mesh: THREE.Object3D; basePos: THREE.Vector3; dir: THREE.Vector3 }[] = [];

  // Cell Wall (Emerald Green hexagonal rounded container)
  const wallGeo = new THREE.BoxGeometry(4.2, 3.4, 2.2);
  const wallMat = new THREE.MeshPhysicalMaterial({
    color: 0x15803d,
    transparent: true,
    opacity: 0.35,
    roughness: 0.2,
    transmission: 0.6,
    thickness: 0.5,
    wireframe: false,
  });
  const wallMesh = new THREE.Mesh(wallGeo, wallMat);
  group.add(wallMesh);

  // Cell Wall Outline
  const wallEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(wallGeo),
    new THREE.LineBasicMaterial({ color: 0x166534, linewidth: 2 })
  );
  wallMesh.add(wallEdges);

  // Cytoplasm base matrix
  const cytoGeo = new THREE.BoxGeometry(3.9, 3.1, 1.9);
  const cytoMat = new THREE.MeshStandardMaterial({
    color: 0xdcfce7,
    transparent: true,
    opacity: 0.25,
    roughness: 0.5,
  });
  const cytoMesh = new THREE.Mesh(cytoGeo, cytoMat);
  group.add(cytoMesh);

  // Large Central Vacuole (Water Blue)
  const vacuoleGeo = new THREE.SphereGeometry(1.1, 32, 24);
  vacuoleGeo.scale(1.2, 0.9, 0.8);
  const vacuoleMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.75,
    roughness: 0.1,
    transmission: 0.8,
    ior: 1.33,
  });
  const vacuoleMesh = new THREE.Mesh(vacuoleGeo, vacuoleMat);
  vacuoleMesh.position.set(0.6, 0.1, 0);
  group.add(vacuoleMesh);
  explodables.push({ mesh: vacuoleMesh, basePos: vacuoleMesh.position.clone(), dir: new THREE.Vector3(1, 0.2, 0) });

  // Nucleus (Purple Spherical Organelle)
  const nucGroup = new THREE.Group();
  nucGroup.position.set(-1.1, 0.3, 0.1);
  const nucGeo = new THREE.SphereGeometry(0.6, 32, 24);
  const nucMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    roughness: 0.3,
    metalness: 0.1,
  });
  const nucMesh = new THREE.Mesh(nucGeo, nucMat);
  nucGroup.add(nucMesh);

  // Nucleolus (Golden center)
  const nucleolusGeo = new THREE.SphereGeometry(0.22, 16, 16);
  const nucleolusMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.3,
  });
  const nucleolusMesh = new THREE.Mesh(nucleolusGeo, nucleolusMat);
  nucGroup.add(nucleolusMesh);
  group.add(nucGroup);
  explodables.push({ mesh: nucGroup, basePos: nucGroup.position.clone(), dir: new THREE.Vector3(-1, 0.5, 0.2) });

  // Chloroplasts (Green capsules with thylakoid discs inside)
  const chloroplasts: THREE.Group[] = [];
  const chloroPositions = [
    new THREE.Vector3(-1.1, -0.9, 0.3),
    new THREE.Vector3(0.1, -1.0, -0.4),
    new THREE.Vector3(1.2, -0.9, 0.3),
    new THREE.Vector3(-0.4, 1.0, 0.4),
    new THREE.Vector3(1.2, 1.0, -0.3),
    new THREE.Vector3(-1.2, 0.9, -0.4),
  ];

  const chloroGeo = new THREE.CapsuleGeometry(0.2, 0.35, 12, 16);
  const chloroMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    roughness: 0.3,
  });

  chloroPositions.forEach((pos, idx) => {
    const cGroup = new THREE.Group();
    cGroup.position.copy(pos);
    cGroup.rotation.set(Math.random(), Math.random(), Math.random());
    const cMesh = new THREE.Mesh(chloroGeo, chloroMat);
    cGroup.add(cMesh);

    // Mini thylakoid discs
    for (let k = -0.15; k <= 0.15; k += 0.1) {
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.03, 8),
        new THREE.MeshStandardMaterial({ color: 0x15803d })
      );
      disc.position.y = k;
      cGroup.add(disc);
    }

    group.add(cGroup);
    chloroplasts.push(cGroup);
    explodables.push({ mesh: cGroup, basePos: cGroup.position.clone(), dir: pos.clone().normalize() });
  });

  // Mitochondria (Orange bean-shaped)
  const mitoPositions = [
    new THREE.Vector3(-0.3, -0.5, 0.5),
    new THREE.Vector3(-0.6, 0.8, -0.3),
    new THREE.Vector3(0.8, -0.6, -0.4),
  ];
  const mitoGeo = new THREE.CapsuleGeometry(0.14, 0.3, 10, 16);
  const mitoMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });

  mitoPositions.forEach((pos) => {
    const mMesh = new THREE.Mesh(mitoGeo, mitoMat);
    mMesh.position.copy(pos);
    mMesh.rotation.set(0.5, 0.8, 0.3);
    group.add(mMesh);
    explodables.push({ mesh: mMesh, basePos: mMesh.position.clone(), dir: pos.clone().normalize() });
  });

  const annotations: ModelAnnotation[] = [
    {
      id: 'cell_wall',
      name: 'Cell Wall',
      position: [0, 1.8, 1.1],
      description: 'Rigid cellulose layer that supports and gives shape to the plant cell.',
      function: 'Structural support, protection, and turgor pressure regulation.',
    },
    {
      id: 'central_vacuole',
      name: 'Central Vacuole',
      position: [0.6, 0.1, 0],
      description: 'Massive single membrane organelle filled with cell sap and water.',
      function: 'Maintains turgidity, stores ions, nutrients, and hydrolytic enzymes.',
    },
    {
      id: 'chloroplast',
      name: 'Chloroplast',
      position: [-1.1, -0.9, 0.3],
      description: 'Double-membrane plastid containing chlorophyll and thylakoid grana.',
      function: 'Converts light energy into chemical energy (glucose) via photosynthesis.',
    },
    {
      id: 'nucleus',
      name: 'Nucleus & DNA',
      position: [-1.1, 0.3, 0.1],
      description: 'The control center containing genomic chromatin and nucleolus.',
      function: 'Directs transcription, protein synthesis, and cellular replication.',
    },
    {
      id: 'mitochondria',
      name: 'Mitochondrion',
      position: [-0.3, -0.5, 0.5],
      description: 'Powerhouse organelle with inner folded cristae membrane.',
      function: 'Generates cellular ATP via oxidative phosphorylation.',
    },
  ];

  return {
    group,
    annotations,
    update: (delta, elapsed, explodeFactor) => {
      // Gentle floating animation of chloroplasts
      chloroplasts.forEach((c, idx) => {
        c.rotation.y += delta * 0.4 * (idx % 2 === 0 ? 1 : -1);
      });

      // Handle explosion factor
      explodables.forEach(item => {
        item.mesh.position.copy(item.basePos).addScaledVector(item.dir, explodeFactor * 1.5);
      });
    },
    dispose: () => {
      wallGeo.dispose();
      wallMat.dispose();
      cytoGeo.dispose();
      cytoMat.dispose();
      vacuoleGeo.dispose();
      vacuoleMat.dispose();
      nucGeo.dispose();
      nucMat.dispose();
      chloroGeo.dispose();
      chloroMat.dispose();
      mitoGeo.dispose();
      mitoMat.dispose();
    },
  };
}

// 2. DNA DOUBLE HELIX 3D MODEL
export function createDNAModel(): BiologyModelResult {
  const group = new THREE.Group();
  const explodables: { mesh: THREE.Object3D; basePos: THREE.Vector3; dir: THREE.Vector3 }[] = [];

  const numPairs = 32;
  const radius = 1.1;
  const heightStep = 0.22;
  const twistRate = 0.38;

  // Base materials
  const matA = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 }); // Red - Adenine
  const matT = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 }); // Blue - Thymine
  const matC = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 }); // Green - Cytosine
  const matG = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 }); // Yellow - Guanine

  const matBackbone1 = new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.2, metalness: 0.2 });
  const matBackbone2 = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.2, metalness: 0.2 });
  const matHBond = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const strand1Spheres: THREE.Vector3[] = [];
  const strand2Spheres: THREE.Vector3[] = [];

  const pairPairs = [
    { mat1: matA, mat2: matT, name1: 'Adenine (A)', name2: 'Thymine (T)' },
    { mat1: matG, mat2: matC, name1: 'Guanine (G)', name2: 'Cytosine (C)' },
    { mat1: matT, mat2: matA, name1: 'Thymine (T)', name2: 'Adenine (A)' },
    { mat1: matC, mat2: matG, name1: 'Cytosine (C)', name2: 'Guanine (G)' },
  ];

  for (let i = 0; i < numPairs; i++) {
    const angle = i * twistRate;
    const y = (i - numPairs / 2) * heightStep;
    const x1 = Math.cos(angle) * radius;
    const z1 = Math.sin(angle) * radius;
    const x2 = Math.cos(angle + Math.PI) * radius;
    const z2 = Math.sin(angle + Math.PI) * radius;

    strand1Spheres.push(new THREE.Vector3(x1, y, z1));
    strand2Spheres.push(new THREE.Vector3(x2, y, z2));

    // Phosphate backbone spheres
    const bSphere1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), matBackbone1);
    bSphere1.position.set(x1, y, z1);
    group.add(bSphere1);

    const bSphere2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), matBackbone2);
    bSphere2.position.set(x2, y, z2);
    group.add(bSphere2);

    // Rung (Base Pair)
    const pair = pairPairs[i % pairPairs.length];
    const rungGroup = new THREE.Group();
    rungGroup.position.set(0, y, 0);

    // Base 1 Cylinder
    const cyl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, radius * 0.85, 8), pair.mat1);
    cyl1.rotation.z = Math.PI / 2;
    cyl1.rotation.y = angle;
    cyl1.position.set(x1 * 0.45, 0, z1 * 0.45);
    rungGroup.add(cyl1);

    // Base 2 Cylinder
    const cyl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, radius * 0.85, 8), pair.mat2);
    cyl2.rotation.z = Math.PI / 2;
    cyl2.rotation.y = angle;
    cyl2.position.set(x2 * 0.45, 0, z2 * 0.45);
    rungGroup.add(cyl2);

    // Hydrogen bond sphere in center
    const hBond = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), matHBond);
    rungGroup.add(hBond);

    group.add(rungGroup);
    explodables.push({
      mesh: rungGroup,
      basePos: new THREE.Vector3(0, y, 0),
      dir: new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)),
    });
  }

  // Smooth continuous backbone curves
  const curve1 = new THREE.CatmullRomCurve3(strand1Spheres);
  const tube1 = new THREE.Mesh(new THREE.TubeGeometry(curve1, 128, 0.06, 8, false), matBackbone1);
  group.add(tube1);

  const curve2 = new THREE.CatmullRomCurve3(strand2Spheres);
  const tube2 = new THREE.Mesh(new THREE.TubeGeometry(curve2, 128, 0.06, 8, false), matBackbone2);
  group.add(tube2);

  // Floating molecular energy particles
  const particleGeo = new THREE.BufferGeometry();
  const particleCount = 60;
  const posArray = new Float32Array(particleCount * 3);
  for (let p = 0; p < particleCount * 3; p += 3) {
    posArray[p] = (Math.random() - 0.5) * 3;
    posArray[p + 1] = (Math.random() - 0.5) * 7;
    posArray[p + 2] = (Math.random() - 0.5) * 3;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  const particleMat = new THREE.PointsMaterial({ size: 0.08, color: 0x38bdf8, transparent: true, opacity: 0.7 });
  const particles = new THREE.Points(particleGeo, particleMat);
  group.add(particles);

  const annotations: ModelAnnotation[] = [
    {
      id: 'backbone',
      name: 'Sugar-Phosphate Backbone',
      position: [1.1, 1.5, 0],
      description: 'Alternating deoxyribose sugar and phosphate groups linked by phosphodiester bonds.',
      function: 'Provides structural scaffolding and orientation (5′ to 3′ directionality).',
    },
    {
      id: 'adenine_thymine',
      name: 'Adenine = Thymine Base Pair',
      position: [0, 0.5, 0],
      description: 'Purine (Adenine) bonded to Pyrimidine (Thymine) via 2 hydrogen bonds.',
      function: 'Stores genetic codons with exact complementary pairing.',
    },
    {
      id: 'guanine_cytosine',
      name: 'Guanine ≡ Cytosine Base Pair',
      position: [0, -0.8, 0],
      description: 'Guanine and Cytosine paired via 3 strong hydrogen bonds.',
      function: 'Higher thermal stability due to triple hydrogen bonding.',
    },
    {
      id: 'major_groove',
      name: 'Major & Minor Grooves',
      position: [-1.1, 0, 0],
      description: 'Asymmetric spacing between backbones exposing chemical functional groups.',
      function: 'Enables sequence-specific binding by transcription factor proteins.',
    },
  ];

  return {
    group,
    annotations,
    update: (delta, elapsed, explodeFactor) => {
      // Rotate DNA continuously
      group.rotation.y = elapsed * 0.45;

      // Pulse particles
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += delta * 0.2;
        if (positions[i] > 3.5) positions[i] = -3.5;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Handle explosion factor
      explodables.forEach(item => {
        item.mesh.position.copy(item.basePos).addScaledVector(item.dir, explodeFactor * 1.8);
      });
    },
    dispose: () => {
      matA.dispose();
      matT.dispose();
      matC.dispose();
      matG.dispose();
      matBackbone1.dispose();
      matBackbone2.dispose();
      tube1.geometry.dispose();
      tube2.geometry.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    },
  };
}

// 3. HUMAN HEART 3D MODEL WITH PULSING BEAT
export function createHeartModel(): BiologyModelResult {
  const group = new THREE.Group();
  const heartBody = new THREE.Group();
  group.add(heartBody);

  // Heart Left Ventricle (Thick red myocardium)
  const lvGeo = new THREE.SphereGeometry(0.9, 32, 24);
  lvGeo.scale(0.85, 1.25, 0.85);
  const lvMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.35 });
  const lvMesh = new THREE.Mesh(lvGeo, lvMat);
  lvMesh.position.set(0.4, -0.2, 0);
  lvMesh.rotation.z = -0.15;
  heartBody.add(lvMesh);

  // Right Ventricle (Blue tinted deoxygenated chamber)
  const rvGeo = new THREE.SphereGeometry(0.8, 32, 24);
  rvGeo.scale(0.8, 1.15, 0.75);
  const rvMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35 });
  const rvMesh = new THREE.Mesh(rvGeo, rvMat);
  rvMesh.position.set(-0.45, -0.3, 0.1);
  rvMesh.rotation.z = 0.15;
  heartBody.add(rvMesh);

  // Atria (Upper Chambers)
  const laGeo = new THREE.SphereGeometry(0.6, 24, 20);
  const laMesh = new THREE.Mesh(laGeo, lvMat);
  laMesh.position.set(0.45, 0.7, -0.1);
  heartBody.add(laMesh);

  const raGeo = new THREE.SphereGeometry(0.65, 24, 20);
  const raMesh = new THREE.Mesh(raGeo, rvMat);
  raMesh.position.set(-0.55, 0.65, 0);
  heartBody.add(raMesh);

  // Aorta Arch (Great vessel - Crimson Red)
  const aortaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.2, 0.5, 0),
    new THREE.Vector3(0.2, 1.3, 0),
    new THREE.Vector3(0.0, 1.6, 0.1),
    new THREE.Vector3(-0.4, 1.4, -0.2),
    new THREE.Vector3(-0.5, 0.8, -0.3),
  ]);
  const aortaMesh = new THREE.Mesh(
    new THREE.TubeGeometry(aortaCurve, 32, 0.22, 16, false),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25 })
  );
  heartBody.add(aortaMesh);

  // 3 Aorta Branch Arteries (Brachiocephalic, Carotid, Subclavian)
  const branchGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 12);
  [-0.1, 0.05, 0.2].forEach((bx, idx) => {
    const branch = new THREE.Mesh(branchGeo, new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    branch.position.set(bx, 1.75, 0.05);
    branch.rotation.z = (idx - 1) * 0.2;
    heartBody.add(branch);
  });

  // Superior Vena Cava (Blue Vessel)
  const svcGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.9, 16);
  const svcMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
  const svcMesh = new THREE.Mesh(svcGeo, svcMat);
  svcMesh.position.set(-0.75, 1.2, 0);
  heartBody.add(svcMesh);

  // Pulmonary Artery trunk
  const paCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.2, 0.5, 0.3),
    new THREE.Vector3(0, 1.0, 0.2),
    new THREE.Vector3(0.5, 1.1, -0.2),
  ]);
  const paMesh = new THREE.Mesh(
    new THREE.TubeGeometry(paCurve, 24, 0.19, 16, false),
    new THREE.MeshStandardMaterial({ color: 0x2563eb })
  );
  heartBody.add(paMesh);

  // Animated blood flow particles
  const flowGeo = new THREE.BufferGeometry();
  const flowCount = 40;
  const flowPositions = new Float32Array(flowCount * 3);
  for (let i = 0; i < flowCount * 3; i += 3) {
    flowPositions[i] = (Math.random() - 0.5) * 1.5;
    flowPositions[i + 1] = (Math.random() - 0.5) * 2;
    flowPositions[i + 2] = (Math.random() - 0.5) * 1.2;
  }
  flowGeo.setAttribute('position', new THREE.BufferAttribute(flowPositions, 3));
  const flowParticles = new THREE.Points(
    flowGeo,
    new THREE.PointsMaterial({ color: 0xff3b30, size: 0.06, transparent: true, opacity: 0.8 })
  );
  heartBody.add(flowParticles);

  const annotations: ModelAnnotation[] = [
    {
      id: 'aorta',
      name: 'Aortic Arch',
      position: [0, 1.6, 0.1],
      description: 'Largest systemic artery distributing oxygenated blood under high pressure.',
      function: 'Pumps blood to the head, brain, upper limbs, and entire systemic body.',
    },
    {
      id: 'left_ventricle',
      name: 'Left Ventricle',
      position: [0.4, -0.2, 0],
      description: 'Thick muscular wall generating peak systolic blood pressure.',
      function: 'Ejects oxygenated blood through aortic valve into systemic circulation.',
    },
    {
      id: 'right_ventricle',
      name: 'Right Ventricle',
      position: [-0.45, -0.3, 0.1],
      description: 'Pumps deoxygenated blood through pulmonary valve to the lungs.',
      function: 'Pulmonary circulation loop for alveolar gas exchange (CO2/O2).',
    },
    {
      id: 'vena_cava',
      name: 'Superior Vena Cava',
      position: [-0.75, 1.2, 0],
      description: 'Large vein returning deoxygenated blood from the upper body into the Right Atrium.',
      function: 'Systemic venous return.',
    },
    {
      id: 'sa_node',
      name: 'Sinoatrial (SA) Node',
      position: [-0.55, 0.9, 0.1],
      description: 'Natural cardiac pacemaker embedded in superior right atrial wall.',
      function: 'Initiates spontaneous sinus rhythm action potentials (~72 bpm).',
    },
  ];

  return {
    group,
    annotations,
    update: (delta, elapsed, explodeFactor) => {
      // Realistic 2-phase heartbeat pulse: "Lub-Dub"
      const heartRate = 1.2; // Hz (~72 bpm)
      const t = (elapsed * heartRate * Math.PI * 2) % (Math.PI * 2);
      
      // Dual systolic pulse curve
      let scale = 1.0;
      if (t < 0.35) {
        scale = 1.0 + Math.sin(t * (Math.PI / 0.35)) * 0.12; // Ventricular systole
      } else if (t >= 0.45 && t < 0.75) {
        scale = 1.0 + Math.sin((t - 0.45) * (Math.PI / 0.3)) * 0.06; // Atrial systole
      }

      heartBody.scale.set(scale, scale * 1.02, scale);

      // Blood flow particle motion
      const arr = flowGeo.attributes.position.array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] += delta * 0.8;
        if (arr[i] > 1.8) arr[i] = -1.2;
      }
      flowGeo.attributes.position.needsUpdate = true;

      // Handle explosion factor by separating chambers
      lvMesh.position.set(0.4 + explodeFactor * 0.8, -0.2, 0);
      rvMesh.position.set(-0.45 - explodeFactor * 0.8, -0.3, 0.1);
      aortaMesh.position.set(0, explodeFactor * 0.7, 0);
    },
    dispose: () => {
      lvGeo.dispose();
      lvMat.dispose();
      rvGeo.dispose();
      rvMat.dispose();
      laGeo.dispose();
      raGeo.dispose();
      svcGeo.dispose();
      svcMat.dispose();
      flowGeo.dispose();
    },
  };
}

// 4. NEURON SYNAPSE & ACTION POTENTIAL MODEL
export function createNeuronModel(): BiologyModelResult {
  const group = new THREE.Group();
  const neuronGroup = new THREE.Group();
  group.add(neuronGroup);

  // Soma (Cell Body) - Purple
  const somaGeo = new THREE.SphereGeometry(0.85, 24, 20);
  somaGeo.scale(1.1, 0.9, 0.9);
  const somaMat = new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.3 });
  const somaMesh = new THREE.Mesh(somaGeo, somaMat);
  somaMesh.position.set(-2.2, 0, 0);
  neuronGroup.add(somaMesh);

  // Nucleus inside soma
  const nucMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.4 })
  );
  nucMesh.position.set(-2.2, 0, 0);
  neuronGroup.add(nucMesh);

  // Dendrites (Branching 3D tubes)
  const dendriteMat = new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.4 });
  const angles = [-2.4, -1.8, -1.2, 1.2, 1.8, 2.4];
  angles.forEach(ang => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.2 + Math.cos(ang) * 0.7, Math.sin(ang) * 0.6, 0),
      new THREE.Vector3(-2.2 + Math.cos(ang) * 1.3, Math.sin(ang) * 1.1, (Math.random() - 0.5) * 0.4),
      new THREE.Vector3(-2.2 + Math.cos(ang) * 1.8, Math.sin(ang) * 1.5, (Math.random() - 0.5) * 0.8),
    ]);
    const dTube = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.06, 8, false), dendriteMat);
    neuronGroup.add(dTube);
  });

  // Long Axon Cylinder
  const axonGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.8, 16);
  const axonMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3 });
  const axonMesh = new THREE.Mesh(axonGeo, axonMat);
  axonMesh.rotation.z = Math.PI / 2;
  axonMesh.position.set(0.1, 0, 0);
  neuronGroup.add(axonMesh);

  // 4 Myelin Sheath Schwann Cells (Gold rounded barrels with gaps = Nodes of Ranvier)
  const sheaths: THREE.Mesh[] = [];
  const sheathGeo = new THREE.CapsuleGeometry(0.24, 0.5, 12, 16);
  sheathGeo.rotateZ(Math.PI / 2);
  const sheathMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.25, metalness: 0.1 });

  const sheathPositions = [-1.1, -0.3, 0.5, 1.3];
  sheathPositions.forEach(sx => {
    const sMesh = new THREE.Mesh(sheathGeo, sheathMat);
    sMesh.position.set(sx, 0, 0);
    neuronGroup.add(sMesh);
    sheaths.push(sMesh);
  });

  // Axon Terminal Buttons (Synaptic boutons)
  const terminalGroup = new THREE.Group();
  terminalGroup.position.set(2.0, 0, 0);

  const tCurve1 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.5, 0.4, 0.2),
    new THREE.Vector3(0.9, 0.6, 0.3),
  ]);
  const tMesh1 = new THREE.Mesh(new THREE.TubeGeometry(tCurve1, 12, 0.05, 8, false), axonMat);
  terminalGroup.add(tMesh1);

  const tCurve2 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.6, -0.4, -0.2),
    new THREE.Vector3(1.0, -0.5, -0.3),
  ]);
  const tMesh2 = new THREE.Mesh(new THREE.TubeGeometry(tCurve2, 12, 0.05, 8, false), axonMat);
  terminalGroup.add(tMesh2);

  // Synaptic Bouton bulbs
  const boutonGeo = new THREE.SphereGeometry(0.16, 16, 16);
  const boutonMat = new THREE.MeshStandardMaterial({ color: 0xca8a04 });
  const b1 = new THREE.Mesh(boutonGeo, boutonMat); b1.position.set(0.9, 0.6, 0.3); terminalGroup.add(b1);
  const b2 = new THREE.Mesh(boutonGeo, boutonMat); b2.position.set(1.0, -0.5, -0.3); terminalGroup.add(b2);
  neuronGroup.add(terminalGroup);

  // Electrical Action Potential Spark / Wave traveling down axon
  const sparkGeo = new THREE.SphereGeometry(0.18, 16, 16);
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
  neuronGroup.add(sparkMesh);

  // Glowing spark point light
  const sparkLight = new THREE.PointLight(0x06b6d4, 2, 2.5);
  sparkMesh.add(sparkLight);

  const annotations: ModelAnnotation[] = [
    {
      id: 'soma',
      name: 'Soma (Cell Body)',
      position: [-2.2, 0.8, 0],
      description: 'Contains nucleus and biosynthetic organelles producing neurotransmitters.',
      function: 'Integrates incoming post-synaptic dendritic electrical potentials.',
    },
    {
      id: 'dendrites',
      name: 'Dendrites',
      position: [-3.2, 1.2, 0],
      description: 'Extensive branched cellular projections receiving synaptic input.',
      function: 'Converts neurotransmitter ligand binding into graded electrical signals.',
    },
    {
      id: 'axon',
      name: 'Axon & Axon Hillock',
      position: [-1.7, 0.3, 0],
      description: 'Long specialized projection generating all-or-nothing action potentials.',
      function: 'Rapid impulse transmission across physiological distances.',
    },
    {
      id: 'myelin_nodes',
      name: 'Myelin & Nodes of Ranvier',
      position: [0.1, 0.4, 0],
      description: 'Insulating lipid sheath with periodic unmyelinated nodes rich in Na+ channels.',
      function: 'Saltatory conduction accelerating transmission velocity up to 120 m/s.',
    },
    {
      id: 'synaptic_terminal',
      name: 'Synaptic Bouton Terminal',
      position: [2.8, 0.4, 0],
      description: 'Presynaptic terminal storing neurotransmitter vesicles (e.g. Acetylcholine).',
      function: 'Calcium-dependent exocytosis into the synaptic cleft.',
    },
  ];

  return {
    group,
    annotations,
    update: (delta, elapsed, explodeFactor) => {
      // Propagate Action Potential Spark along the axon
      const cycle = (elapsed * 1.2) % 2.5; // Every 2.5 seconds
      if (cycle < 1.8) {
        const progress = cycle / 1.8;
        sparkMesh.visible = true;
        sparkMesh.position.set(-2.0 + progress * 4.6, 0, 0);
        sparkMesh.scale.setScalar(1.0 + Math.sin(progress * Math.PI) * 0.5);
      } else {
        sparkMesh.visible = false;
      }

      // Handle explosion factor by spreading myelin sheaths outward
      sheaths.forEach((s, idx) => {
        const offset = (idx - 1.5) * 0.4 * explodeFactor;
        s.position.y = (idx % 2 === 0 ? 1 : -1) * explodeFactor * 0.6;
      });
      somaMesh.position.x = -2.2 - explodeFactor * 1.0;
      terminalGroup.position.x = 2.0 + explodeFactor * 1.0;
    },
    dispose: () => {
      somaGeo.dispose();
      somaMat.dispose();
      axonGeo.dispose();
      axonMat.dispose();
      sheathGeo.dispose();
      sheathMat.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
    },
  };
}

// 5. CHLOROPLAST 3D ORGANELLE
export function createChloroplastModel(): BiologyModelResult {
  const group = new THREE.Group();
  const explodables: { mesh: THREE.Object3D; basePos: THREE.Vector3; dir: THREE.Vector3 }[] = [];

  // Cutaway Chloroplast Double Envelope
  const outerGeo = new THREE.SphereGeometry(2.0, 32, 24, 0, Math.PI * 1.5, 0, Math.PI);
  outerGeo.scale(1.3, 0.85, 0.85);
  const outerMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    side: THREE.DoubleSide,
    roughness: 0.35,
  });
  const outerMesh = new THREE.Mesh(outerGeo, outerMat);
  group.add(outerMesh);

  // Inner Stroma Liquid Bed
  const stromaGeo = new THREE.SphereGeometry(1.85, 32, 24);
  stromaGeo.scale(1.25, 0.8, 0.8);
  const stromaMat = new THREE.MeshPhysicalMaterial({
    color: 0xdcfce7,
    transparent: true,
    opacity: 0.3,
    roughness: 0.2,
  });
  const stromaMesh = new THREE.Mesh(stromaGeo, stromaMat);
  group.add(stromaMesh);

  // Grana (Thylakoid coin stacks)
  const granaGroup = new THREE.Group();
  const thylakoidGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.05, 16);
  const thylakoidMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.3 });

  const granaPositions = [
    new THREE.Vector3(-1.2, -0.2, 0),
    new THREE.Vector3(-0.4, -0.1, 0.3),
    new THREE.Vector3(0.4, -0.2, -0.2),
    new THREE.Vector3(1.1, -0.1, 0.2),
    new THREE.Vector3(-0.2, 0.3, -0.3),
    new THREE.Vector3(0.6, 0.3, 0.2),
  ];

  granaPositions.forEach(pos => {
    const stack = new THREE.Group();
    stack.position.copy(pos);
    const numDiscs = 7;
    for (let d = 0; d < numDiscs; d++) {
      const disc = new THREE.Mesh(thylakoidGeo, thylakoidMat);
      disc.position.y = (d - numDiscs / 2) * 0.07;
      stack.add(disc);
    }
    granaGroup.add(stack);
    explodables.push({ mesh: stack, basePos: stack.position.clone(), dir: pos.clone().normalize() });
  });
  group.add(granaGroup);

  // Stroma Lamellae bridges connecting grana
  const bridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.2, -0.2, 0),
    new THREE.Vector3(-0.4, -0.1, 0.3),
    new THREE.Vector3(0.4, -0.2, -0.2),
    new THREE.Vector3(1.1, -0.1, 0.2),
  ]);
  const bridgeMesh = new THREE.Mesh(
    new THREE.TubeGeometry(bridgeCurve, 24, 0.04, 8, false),
    new THREE.MeshStandardMaterial({ color: 0x22c55e })
  );
  group.add(bridgeMesh);

  // Rotating ATP Synthase Rotor
  const rotorGroup = new THREE.Group();
  rotorGroup.position.set(0, -0.7, 0);
  const baseRotor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.25, 0.3, 12),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b })
  );
  rotorGroup.add(baseRotor);
  group.add(rotorGroup);

  const annotations: ModelAnnotation[] = [
    {
      id: 'double_membrane',
      name: 'Double Membrane Envelope',
      position: [0, 1.3, 0],
      description: 'Outer and inner phospholipid bilayer regulating molecular transport into stroma.',
      function: 'Permeability barrier and intermembrane space metabolic compartmentalization.',
    },
    {
      id: 'thylakoid_grana',
      name: 'Grana (Thylakoid Discs)',
      position: [-0.4, 0.2, 0.3],
      description: 'Densely packed membrane discs housing Photosystem II, Photosystem I, and chlorophyll.',
      function: 'Site of light-dependent reactions: water photolysis, oxygen evolution, and ATP/NADPH generation.',
    },
    {
      id: 'stroma',
      name: 'Stroma Matrix',
      position: [0.4, -0.5, 0],
      description: 'Alkaline aqueous fluid filled with RuBisCO enzymes, ribosomes, and circular cpDNA.',
      function: 'Site of the light-independent Calvin cycle for carbon fixation into carbohydrates.',
    },
    {
      id: 'atp_synthase',
      name: 'ATP Synthase Complex',
      position: [0, -0.7, 0],
      description: 'Molecular rotary motor driven by the thylakoid proton electrochemical gradient (pmf).',
      function: 'Synthesizes ATP from ADP and inorganic phosphate.',
    },
  ];

  return {
    group,
    annotations,
    update: (delta, elapsed, explodeFactor) => {
      // Spin the ATP Synthase rotor turbine
      rotorGroup.rotation.y += delta * 3.0;

      // Handle explosion factor
      explodables.forEach(item => {
        item.mesh.position.copy(item.basePos).addScaledVector(item.dir, explodeFactor * 1.4);
      });
      outerMesh.position.y = explodeFactor * 0.6;
    },
    dispose: () => {
      outerGeo.dispose();
      outerMat.dispose();
      stromaGeo.dispose();
      stromaMat.dispose();
      thylakoidGeo.dispose();
      thylakoidMat.dispose();
    },
  };
}

// Factory helper to instantiate 3D biology model
export function loadBiologyModel(modelType: BiologyModelType): BiologyModelResult {
  switch (modelType) {
    case 'preset_plant_cell':
      return createPlantCellModel();
    case 'preset_dna':
      return createDNAModel();
    case 'preset_heart':
      return createHeartModel();
    case 'preset_neuron':
      return createNeuronModel();
    case 'preset_chloroplast':
      return createChloroplastModel();
    case 'preset_animal_cell':
    default:
      return createPlantCellModel();
  }
}
