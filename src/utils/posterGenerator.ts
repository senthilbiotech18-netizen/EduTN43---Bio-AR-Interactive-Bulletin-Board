// Generates authentic hand-drawn poster marker graphics for biology student exhibits
export function generateHandDrawnPoster(
  type: 'plant_cell' | 'dna' | 'heart' | 'neuron' | 'chloroplast' | 'animal_cell',
  title: string,
  studentName: string,
  grade: string
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background: Realistic textured drawing paper / watercolor paper
  ctx.fillStyle = '#fbf9f4';
  ctx.fillRect(0, 0, 800, 1000);

  // Subtle paper grain & borders
  ctx.strokeStyle = '#e2dacb';
  ctx.lineWidth = 1;
  for (let i = 0; i < 1000; i += 32) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(800, i + (Math.random() * 2 - 1));
    ctx.stroke();
  }

  // Hand-drawn sketchy outer border
  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Sketchy border rectangle
  ctx.beginPath();
  ctx.moveTo(35, 35);
  ctx.lineTo(765, 38);
  ctx.lineTo(762, 965);
  ctx.lineTo(38, 962);
  ctx.closePath();
  ctx.stroke();

  // Second faint sketch line
  ctx.strokeStyle = '#718096';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(32, 32, 736, 936);

  // Header Banner
  ctx.fillStyle = '#10b981'; // Biology emerald green
  ctx.fillRect(50, 50, 700, 70);

  // Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "Comic Sans MS", "Chalkboard SE", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title.toUpperCase(), 400, 95);

  // Student Info Subtitle banner
  ctx.fillStyle = '#2d3748';
  ctx.font = 'italic 18px "Comic Sans MS", "Segoe UI", sans-serif';
  ctx.fillText(`By: ${studentName} • ${grade} Biology Exhibition`, 400, 150);

  // Drawing Canvas Area (Center 700x600)
  ctx.save();
  ctx.translate(400, 480);

  if (type === 'plant_cell') {
    // Hand-drawn Plant Cell with thick green cell wall
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 14;
    ctx.fillStyle = '#ecfdf5';
    
    // Hexagonal / rounded plant cell wall
    ctx.beginPath();
    ctx.roundRect(-260, -220, 520, 440, 40);
    ctx.fill();
    ctx.stroke();

    // Inner cell membrane
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(-245, -205, 490, 410, 30);
    ctx.stroke();

    // Large Central Vacuole (Blue)
    ctx.fillStyle = 'rgba(186, 230, 253, 0.75)';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(50, 10, 160, 110, Math.PI / 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Vacuole Label
    ctx.fillStyle = '#0369a1';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Central Vacuole (H2O)', 50, 15);

    // Nucleus with Nucleolus (Purple/Magenta)
    ctx.fillStyle = '#f3e8ff';
    ctx.strokeStyle = '#9333ea';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(-140, -80, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Nucleolus inner dot
    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    ctx.arc(-140, -80, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6b21a8';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Nucleus (DNA)', -140, -20);

    // 4 Green Chloroplasts with Grana thylakoid lines
    const chloroPositions = [
      { x: -160, y: 110, angle: -0.3 },
      { x: -40, y: -150, angle: 0.2 },
      { x: 160, y: -140, angle: -0.4 },
      { x: 170, y: 130, angle: 0.5 },
    ];

    chloroPositions.forEach((pos, idx) => {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(pos.angle);
      
      // Chloroplast body
      ctx.fillStyle = '#22c55e';
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 48, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Thylakoid grana lines inside
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-25, -8); ctx.lineTo(-25, 8);
      ctx.moveTo(-8, -14); ctx.lineTo(-8, 14);
      ctx.moveTo(8, -14); ctx.lineTo(8, 14);
      ctx.moveTo(25, -8); ctx.lineTo(25, 8);
      ctx.stroke();
      ctx.restore();
    });

    // Chloroplast callout label
    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Chloroplast (Photosynthesis)', -140, 165);

    // Mitochondria (Orange/Red)
    ctx.fillStyle = '#ffedd5';
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 140, 45, 24, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#c2410c';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Mitochondria (ATP)', 0, 175);

  } else if (type === 'dna') {
    // DNA Double Helix twisted ladder
    ctx.lineWidth = 8;
    const strandRadius = 130;
    const totalSteps = 24;

    // Draw connecting base pairs
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']; // A (Red), T (Blue), C (Green), G (Yellow)
    const basePairs = [
      { left: 'A (Adenine)', right: 'T (Thymine)', colA: '#ef4444', colB: '#3b82f6' },
      { left: 'G (Guanine)', right: 'C (Cytosine)', colA: '#f59e0b', colB: '#10b981' },
      { left: 'T (Thymine)', right: 'A (Adenine)', colA: '#3b82f6', colB: '#ef4444' },
      { left: 'C (Cytosine)', right: 'G (Guanine)', colA: '#10b981', colB: '#f59e0b' },
    ];

    for (let i = 0; i <= totalSteps; i++) {
      const t = (i / totalSteps) * Math.PI * 3.5;
      const y = -220 + (i * 18);
      const x1 = Math.sin(t) * strandRadius;
      const x2 = -Math.sin(t) * strandRadius;
      const z = Math.cos(t);

      const pair = basePairs[i % basePairs.length];

      // Draw base pair rungs
      ctx.lineWidth = 6;
      // Left base
      ctx.strokeStyle = pair.colA;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(0, y);
      ctx.stroke();

      // Hydrogen bonds (dashed middle)
      ctx.strokeStyle = '#64748b';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(-10, y);
      ctx.lineTo(10, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Right base
      ctx.strokeStyle = pair.colB;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }

    // Strand 1 (Deep Indigo)
    ctx.strokeStyle = '#4338ca';
    ctx.lineWidth = 10;
    ctx.beginPath();
    for (let i = 0; i <= totalSteps; i++) {
      const t = (i / totalSteps) * Math.PI * 3.5;
      const y = -220 + (i * 18);
      const x = Math.sin(t) * strandRadius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Strand 2 (Teal)
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 10;
    ctx.beginPath();
    for (let i = 0; i <= totalSteps; i++) {
      const t = (i / totalSteps) * Math.PI * 3.5;
      const y = -220 + (i * 18);
      const x = -Math.sin(t) * strandRadius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Legend Callouts
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('■ Adenine (A)', -180, 200);
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('■ Thymine (T)', -180, 225);
    ctx.fillStyle = '#10b981';
    ctx.fillText('■ Cytosine (C)', 80, 200);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('■ Guanine (G)', 80, 225);

  } else if (type === 'heart') {
    // Anatomical Heart drawing with 4 chambers and aorta
    // Superior & Inferior Vena Cava (Blue)
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.rect(-150, -180, 50, 100);
    ctx.fill();
    ctx.stroke();

    // Aortic Arch (Red/Crimson)
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, -140, 60, Math.PI, 0);
    ctx.lineTo(70, -60);
    ctx.lineTo(20, -60);
    ctx.lineTo(-20, -100);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3 Aortic branch arteries
    ctx.beginPath();
    ctx.rect(-35, -200, 18, 50);
    ctx.rect(-5, -210, 18, 60);
    ctx.rect(25, -200, 18, 50);
    ctx.fill();
    ctx.stroke();

    // Pulmonary Artery (Blue)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-60, -100, 120, 40);

    // Heart Muscle Main Body (Divided into Left & Right)
    // Right Side (Deoxygenated - Blue tint)
    ctx.fillStyle = '#93c5fd';
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(-60, 20, 90, 120, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Left Side (Oxygenated - Red tint)
    ctx.fillStyle = '#fca5a5';
    ctx.strokeStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(60, 40, 100, 140, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Chamber Labels
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText('Right Atrium', -70, -20);
    ctx.fillText('Right Ventricle', -70, 70);

    ctx.fillStyle = '#7f1d1d';
    ctx.fillText('Left Atrium', 70, 0);
    ctx.fillText('Left Ventricle', 70, 90);

    // Septum divider line
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.lineTo(0, 170);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'italic 16px sans-serif';
    ctx.fillText('Cardiac Cycle: Diastole & Systole', 0, 210);

  } else if (type === 'neuron') {
    // Multipolar Neuron with soma, dendrites, axon, and synaptic terminal
    // Soma (Cell Body) - Purple
    ctx.fillStyle = '#fae8ff';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(-140, 0, 60, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Nucleus inside soma
    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    ctx.arc(-140, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // Dendrites branching out from soma
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 5;
    const dendriteAngles = [-2.5, -2.0, -1.5, -1.0, 1.0, 1.5, 2.0, 2.5];
    dendriteAngles.forEach(ang => {
      const sx = -140 + Math.cos(ang) * 55;
      const sy = Math.sin(ang) * 45;
      const ex = -140 + Math.cos(ang) * 110;
      const ey = Math.sin(ang) * 90;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      // secondary branch
      ctx.lineTo(ex + Math.cos(ang + 0.3) * 30, ey + Math.sin(ang + 0.3) * 30);
      ctx.stroke();
    });

    // Long Axon (Yellow/Gold core)
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-80, 0);
    ctx.lineTo(160, 0);
    ctx.stroke();

    // 4 Myelin Sheath Schwann cells along axon
    const sheathX = [-50, 10, 70, 130];
    sheathX.forEach((x, idx) => {
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(x - 22, -22, 44, 44, 12);
      ctx.fill();
      ctx.stroke();
    });

    // Synaptic Terminal buttons on right
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(160, 0); ctx.lineTo(210, -50);
    ctx.moveTo(160, 0); ctx.lineTo(220, 0);
    ctx.moveTo(160, 0); ctx.lineTo(210, 50);
    ctx.stroke();

    ctx.fillStyle = '#ca8a04';
    [-50, 0, 50].forEach(y => {
      ctx.beginPath();
      ctx.arc(215, y, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    // Action potential electrical wave arrow (Cyan spark)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(-60, -40);
    ctx.lineTo(160, -40);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#0891b2';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('⚡ Action Potential (100 m/s)', 50, -55);

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#6b21a8';
    ctx.fillText('Dendrites & Soma', -140, 95);
    ctx.fillStyle = '#854d0e';
    ctx.fillText('Myelin Sheath (Schwann Cell)', 40, 50);
    ctx.fillText('Synapse Terminal', 180, 95);

  } else {
    // Chloroplast organelle cross-section
    ctx.fillStyle = '#dcfce7';
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 10;
    
    // Outer & inner double membrane
    ctx.beginPath();
    ctx.ellipse(0, 0, 240, 160, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 220, 140, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 4 Grana Stacks of Thylakoids
    const granaX = [-120, -40, 40, 120];
    granaX.forEach((gx, gIdx) => {
      for (let ty = -50; ty <= 50; ty += 20) {
        ctx.fillStyle = '#16a34a';
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(gx, ty, 28, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });

    // Connecting Stroma Lamellae
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-100, -10); ctx.lineTo(100, -10);
    ctx.moveTo(-100, 30); ctx.lineTo(100, 30);
    ctx.stroke();

    // Stroma matrix & Ribosome dots
    ctx.fillStyle = '#15803d';
    for (let i = 0; i < 20; i++) {
      const rx = (Math.random() - 0.5) * 360;
      const ry = (Math.random() - 0.5) * 220;
      ctx.beginPath();
      ctx.arc(rx, ry, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Callout equations
    ctx.fillStyle = '#14532d';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Grana (Thylakoid Stacks)', 0, -90);
    ctx.fillText('Stroma Fluid Matrix (Calvin Cycle)', 0, 95);
    ctx.fillStyle = '#047857';
    ctx.fillText('6CO2 + 6H2O + Sunlight → C6H12O6 + 6O2', 0, 140);
  }

  ctx.restore();

  // Footer notes & interactive instruction
  ctx.fillStyle = '#334155';
  ctx.font = '16px "Comic Sans MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✨ Point BioAR Board Camera at this drawing to unlock 3D organelle & video!', 400, 915);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px monospace';
  ctx.fillText(`BioAR ID: POSTER-${type.toUpperCase()}-2026`, 400, 940);

  return canvas.toDataURL('image/jpeg', 0.92);
}
