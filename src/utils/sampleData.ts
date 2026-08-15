import { Project } from '../types';
import { generateHandDrawnPoster } from './posterGenerator';

export function getInitialSampleProjects(): Project[] {
  // Generate authentic biology hand-drawn poster markers
  const plantCellPoster = generateHandDrawnPoster('plant_cell', 'Plant Cell Architecture & Chloroplasts', 'Maya Lin', 'Grade 8');
  const dnaPoster = generateHandDrawnPoster('dna', 'DNA Molecular Structure & Base Pairing', 'Liam Chen', 'Grade 9');
  const heartPoster = generateHandDrawnPoster('heart', 'Cardiovascular System: 4-Chamber Heart Flow', 'Sophia Patel', 'Grade 10');
  const neuronPoster = generateHandDrawnPoster('neuron', 'Neuron Synapse & Action Potential Firing', 'Ethan Walker', 'Grade 11');
  const chloroplastPoster = generateHandDrawnPoster('chloroplast', 'Chloroplast Thylakoids & Photosynthesis', 'Zoe Ramirez', 'Grade 7');

  return [
    {
      id: 'proj_plant_cell_01',
      title: 'Plant Cell Architecture & Chloroplasts',
      studentName: 'Maya Lin',
      studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      grade: 'Grade 8 - Life Sciences',
      topic: 'Cell Biology & Organelles',
      description: 'An in-depth poster investigation into how plant cell walls and large central vacuoles maintain turgor pressure, while chloroplasts convert sunlight into glucose via light-dependent reactions.',
      markerImage: plantCellPoster,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      videoCaption: "Maya's 90-second science fair walkthrough explaining how cell walls and chloroplasts differentiate plant and animal cells.",
      modelType: 'preset_plant_cell',
      modelScale: 1.2,
      createdAt: '2026-08-10T14:30:00Z',
      explanationPreference: 'both',
      autoRotateWithAudio: true,
      audioTranscript: "Hi, I am Maya Lin! Welcome to my Plant Cell project. As the 3D model turns, notice the rigid emerald cell wall on the exterior. Inside, the large blue central vacuole stores water to maintain turgor pressure. The green capsules are chloroplasts containing thylakoids that harvest sunlight for photosynthesis!",
      keyPoints: [
        'Cellulose cell wall provides structural rigidity and prevents bursting under osmotic pressure.',
        'Chloroplasts contain grana stacks of thylakoids where chlorophyll absorbs blue and red photons.',
        'The large central vacuole can occupy up to 90% of the cell volume, regulating cellular waste and hydration.',
        'Mitochondria perform aerobic cellular respiration to generate ATP energy alongside chloroplasts.'
      ],
      vocabulary: [
        { term: 'Turgor Pressure', definition: 'The hydrostatic pressure exerted by fluid inside the central vacuole pushing against the rigid cell wall.' },
        { term: 'Thylakoid', definition: 'A membrane-bound compartment inside chloroplasts that is the site of the light-dependent reactions of photosynthesis.' },
        { term: 'Plasmodesmata', definition: 'Microscopic channels traversing the cell walls of plant cells facilitating transport and communication.' }
      ]
    },
    {
      id: 'proj_dna_helix_02',
      title: 'DNA Molecular Structure & Base Pairing',
      studentName: 'Liam Chen',
      studentAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      grade: 'Grade 9 - AP Biology',
      topic: 'Genetics & Molecular Biology',
      description: 'Hand-drawn model demonstrating Watson-Crick antiparallel double helix geometry, complementary hydrogen bonding between pyrimidines and purines (A=T, G≡C), and major/minor groove binding.',
      markerImage: dnaPoster,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      videoCaption: 'Liam presents the molecular biochemistry of hydrogen bonds and DNA polymerase transcription proofreading.',
      modelType: 'preset_dna',
      modelScale: 1.0,
      createdAt: '2026-08-11T09:15:00Z',
      explanationPreference: 'both',
      autoRotateWithAudio: true,
      audioTranscript: "Hi everyone, I am Liam Chen, and I am going to explain the molecular structure of the DNA Double Helix. Watch as it spins: the outer blue and purple ribbons form the antiparallel sugar-phosphate backbone. In the center, Adenine pairs with Thymine via two hydrogen bonds, and Guanine bonds with Cytosine with three!",
      keyPoints: [
        'Antiparallel 5′ to 3′ and 3′ to 5′ sugar-phosphate backbone linked by phosphodiester bonds.',
        'Chargaff’s Rule: Adenine pairs exclusively with Thymine (2 H-bonds); Guanine pairs with Cytosine (3 H-bonds).',
        'One full helical turn occurs every 3.4 nanometers (approx. 10.5 base pairs).',
        'Major and minor grooves allow transcription factors and CRISPR-Cas9 proteins to recognize sequence motifs.'
      ],
      vocabulary: [
        { term: 'Antiparallel', definition: 'Orientation of the two DNA strands running in opposite directions (5′→3′ and 3′→5′).' },
        { term: 'Phosphodiester Bond', definition: 'The covalent linkage between the 3′-hydroxyl group of one sugar and the 5′-phosphate group of another.' },
        { term: 'Purine vs Pyrimidine', definition: 'Purines (A, G) have a double-ring structure, whereas pyrimidines (C, T) have a single carbon-nitrogen ring.' }
      ]
    },
    {
      id: 'proj_heart_anatomy_03',
      title: 'Cardiovascular System: 4-Chamber Heart Flow',
      studentName: 'Sophia Patel',
      studentAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      grade: 'Grade 10 - Human Physiology',
      topic: 'Anatomy & Cardiovascular Dynamics',
      description: 'Detailed anatomical schematic mapping systemic and pulmonary circulation loops, sinoatrial node cardiac conduction, tricuspid/bicuspid valves, and systolic ventricular ejection pressure.',
      markerImage: heartPoster,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      videoCaption: 'Sophia demonstrates the electrical pathway from the SA Node to Purkinje fibers and the dual circulation loops.',
      modelType: 'preset_heart',
      modelScale: 1.1,
      createdAt: '2026-08-12T11:00:00Z',
      explanationPreference: 'both',
      autoRotateWithAudio: true,
      audioTranscript: "Hello, I am Sophia Patel! Here is our 4-chamber human heart. See how it beats rhythmically in lub-dub cycles. The right ventricle pumps deoxygenated blood to the lungs, while the muscular left ventricle pumps oxygen-rich blood through the red aortic arch to supply the entire body.",
      keyPoints: [
        'Right side receives deoxygenated blood from Vena Cava and pumps it to the lungs via Pulmonary Arteries.',
        'Left side receives oxygen-rich blood from Pulmonary Veins and pumps it to the body under high pressure via the Aorta.',
        'Sinoatrial (SA) Node acts as the natural pacemaker generating rhythmic electrical impulses.',
        'Tricuspid and Mitral atrioventricular valves prevent retrograde backflow into atria during systole.'
      ],
      vocabulary: [
        { term: 'Systole', definition: 'The contraction phase of the cardiac cycle when the ventricles pump blood into the aorta and pulmonary trunk.' },
        { term: 'Sinoatrial (SA) Node', definition: 'A specialized cluster of cardiac muscle cells in the right atrium that initiates the electrical rhythm of the heart.' },
        { term: 'Myocardium', definition: 'The muscular tissue of the heart responsible for pumping action, composed of interconnected cardiomyocytes.' }
      ]
    },
    {
      id: 'proj_neuron_synapse_04',
      title: 'Neuron Synapse & Action Potential Firing',
      studentName: 'Ethan Walker',
      studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      grade: 'Grade 11 - Neurobiology',
      topic: 'Neuroscience & Cellular Signaling',
      description: 'Electrophysiological diagram of multipolar neuron anatomy, voltage-gated Na+/K+ channels during depolarization, myelin saltatory conduction, and calcium-triggered neurotransmitter exocytosis.',
      markerImage: neuronPoster,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      videoCaption: 'Ethan breaks down resting membrane potential (-70mV), threshold voltage, and synaptic vesicle fusion.',
      modelType: 'preset_neuron',
      modelScale: 1.25,
      createdAt: '2026-08-12T16:45:00Z',
      explanationPreference: 'both',
      autoRotateWithAudio: true,
      audioTranscript: "Hi, I am Ethan Walker. Today I am going to explain how neurons fire action potentials. The purple soma on the left receives signals through branching dendrites. Once threshold is reached, an electrical pulse shoots down the yellow axon, jumping across the myelin nodes of Ranvier to the synaptic terminal!",
      keyPoints: [
        'Dendrites receive chemical signals and propagate graded post-synaptic potentials to the axon hillock.',
        'Resting potential (-70 mV) maintained by the Na+/K+ ATPase pump (3 Na+ out, 2 K+ in).',
        'Myelin sheath produced by Schwann cells enables saltatory conduction jumping between Nodes of Ranvier at over 100 m/s.',
        'Action potential triggers influx of voltage-gated Ca2+ ions, stimulating synaptic vesicle exocytosis of acetylcholine.'
      ],
      vocabulary: [
        { term: 'Saltatory Conduction', definition: 'Rapid propagation of action potentials along myelinated axons from one Node of Ranvier to the next.' },
        { term: 'Action Potential', definition: 'A rapid, temporary change in membrane electrical potential across the axonal membrane caused by ion flux.' },
        { term: 'Neurotransmitter', definition: 'Endogenous chemical messenger released into the synaptic cleft to transmit signals to receptor proteins.' }
      ]
    },
    {
      id: 'proj_chloroplast_05',
      title: 'Chloroplast Thylakoids & Photosynthesis',
      studentName: 'Zoe Ramirez',
      studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      grade: 'Grade 7 - Life Sciences',
      topic: 'Biochemical Energetics',
      description: 'Cross-section of chloroplast double membrane organelle highlighting thylakoid grana discs, photon absorption in photosystems II and I, electron transport chain, and light-independent Calvin cycle in stroma.',
      markerImage: chloroplastPoster,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      videoCaption: 'Zoe explains the biochemical equation 6CO2 + 6H2O + Sunlight → C6H12O6 + 6O2 and ATP synthase spinning.',
      modelType: 'preset_chloroplast',
      modelScale: 1.15,
      createdAt: '2026-08-13T10:00:00Z',
      explanationPreference: 'both',
      autoRotateWithAudio: true,
      audioTranscript: "Hi, I am Zoe Ramirez, and I will explain the Chloroplast structure! As it rotates, look inside the cutaway double membrane: the stacks of green discs are thylakoids called grana. They capture sunlight to split water molecules, while the amber ATP synthase rotor spins to power the cell with chemical energy!",
      keyPoints: [
        'Light Reactions occur within the thylakoid membrane, splitting H2O to produce O2, NADPH, and ATP.',
        'Calvin Cycle occurs in the stroma, using RuBisCO enzyme to fix CO2 into glucose.',
        'Chlorophyll a and b pigments absorb blue-violet and red wavelengths while reflecting green light.',
        'Proton gradient (H+) drives ATP Synthase molecular rotary motor to phosphorylate ADP into ATP.'
      ],
      vocabulary: [
        { term: 'Stroma', definition: 'The fluid-filled space surrounding the grana inside the chloroplast where the Calvin cycle takes place.' },
        { term: 'Grana', definition: 'Stacks of disc-shaped thylakoids optimized for surface area and maximum light harvesting.' },
        { term: 'RuBisCO', definition: 'The primary enzyme responsible for carbon fixation during the light-independent photosynthetic reaction.' }
      ]
    }
  ];
}

