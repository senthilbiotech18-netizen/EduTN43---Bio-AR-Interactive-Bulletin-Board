import { 
  collection, 
  setDoc, 
  doc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Library3DModel, BiologyModelType } from '../types';
import { 
  getAllModelsFromIDB, 
  saveModelToIDB, 
  deleteModelFromIDB, 
  clearAllModelsFromIDB 
} from '../utils/indexedDBStorage';

const MODELS_COLLECTION = 'biology_3d_models';
const LOCAL_STORAGE_MODELS_KEY = 'bioar_custom_3d_models_cache';
const LOCAL_STORAGE_DELETED_BUILTIN_KEY = 'bioar_deleted_builtin_3d_models';

export const BUILT_IN_3D_MODELS: Library3DModel[] = [
  {
    id: 'builtin_plant_cell',
    name: 'Plant Cell & Organelles',
    category: 'Cellular Biology',
    description: 'Eukaryotic plant cell featuring cell wall, plasma membrane, large central vacuole, purple nucleus, nucleolus, and photosynthetic chloroplasts.',
    modelType: 'preset_plant_cell',
    scale: 1.0,
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    authorName: 'BioAR Scientific Core',
    fileFormat: 'preset',
    annotations: [
      {
        id: 'ann_wall',
        name: 'Cell Wall & Membrane',
        position: [0, 1.8, 0],
        description: 'Rigid cellulose outer barrier that provides structural tensile strength and prevents excessive osmotic water uptake.',
        function: 'Structural protection & turgor pressure regulation'
      },
      {
        id: 'ann_vacuole',
        name: 'Large Central Vacuole',
        position: [0.6, 0.1, 0],
        description: 'Enormous fluid-filled membrane sac containing cell sap that maintains internal turgor pressure against the cell wall.',
        function: 'Hydrostatic pressure maintenance & waste storage'
      },
      {
        id: 'ann_nucleus',
        name: 'Nucleus & Nucleolus',
        position: [-1.1, 0.3, 0.1],
        description: 'Double-membrane organelle housing eukaryotic DNA chromosomes and controlling transcription and metabolic activities.',
        function: 'Genetic storage & rRNA ribosomal assembly'
      },
      {
        id: 'ann_chloro',
        name: 'Chloroplasts',
        position: [-1.1, -0.9, 0.3],
        description: 'Double-membraned photosynthetic plastids packed with chlorophyll and thylakoid grana discs.',
        function: 'Converts sunlight, CO2, and H2O into glucose via light & dark reactions'
      }
    ]
  },
  {
    id: 'builtin_dna_helix',
    name: 'DNA Double Helix',
    category: 'Genetics',
    description: 'Double-stranded helical antiparallel deoxyribonucleic acid with complementary hydrogen-bonded purine and pyrimidine nitrogenous base pairs (A-T, G-C).',
    modelType: 'preset_dna',
    scale: 1.0,
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    authorName: 'BioAR Scientific Core',
    fileFormat: 'preset',
    annotations: [
      {
        id: 'ann_sugar_phosphate',
        name: 'Sugar-Phosphate Backbone',
        position: [-0.9, 1.0, 0],
        description: 'Alternating deoxyribose sugar and phosphate groups linked by strong covalent 3\'-5\' phosphodiester bonds.',
        function: 'Structural framework that protects internal nitrogenous genetic code'
      },
      {
        id: 'ann_base_at',
        name: 'Adenine = Thymine Base Pair',
        position: [0, 0.5, 0.2],
        description: 'Complementary purine-pyrimidine pair bound securely by exactly 2 hydrogen bonds.',
        function: 'Genetic encoding with lower thermal denaturation threshold'
      },
      {
        id: 'ann_base_gc',
        name: 'Guanine ≡ Cytosine Base Pair',
        position: [0, -0.5, -0.2],
        description: 'Complementary pair held together by 3 strong hydrogen bonds, contributing higher thermodynamic stability.',
        function: 'High-density genetic stability in GC-rich gene promoter islands'
      },
      {
        id: 'ann_major_groove',
        name: 'Major & Minor Grooves',
        position: [0.8, -1.0, 0],
        description: 'Asymmetrical helical windings that expose nucleotide edge patterns to regulatory transcription factor proteins.',
        function: 'Target binding site for sequence-specific transcription factors and polymerases'
      }
    ]
  },
  {
    id: 'builtin_human_heart',
    name: 'Human Heart (4-Chamber)',
    category: 'Human Anatomy',
    description: 'Muscular pump featuring right/left atria, ventricles, aorta arch, pulmonary trunk, and rhythmic myocardial contractions.',
    modelType: 'preset_heart',
    scale: 1.0,
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    authorName: 'BioAR Scientific Core',
    fileFormat: 'preset',
    annotations: [
      {
        id: 'ann_aorta',
        name: 'Aortic Arch',
        position: [0.1, 1.5, 0.1],
        description: 'The largest systemic artery in the human body, receiving pressurized oxygenated blood from the left ventricle.',
        function: 'High-pressure distribution of oxygenated blood throughout systemic circulation'
      },
      {
        id: 'ann_left_ventricle',
        name: 'Left Ventricle',
        position: [0.7, -0.5, 0.4],
        description: 'Thickest, highly muscular myocardial chamber generating the high systolic pressure required for systemic circulation.',
        function: 'Forces oxygen-rich blood into the aorta across the aortic valve'
      },
      {
        id: 'ann_right_ventricle',
        name: 'Right Ventricle',
        position: [-0.6, -0.5, 0.4],
        description: 'Pumps deoxygenated blood through the pulmonary semilunar valve into the pulmonary trunk toward the lungs.',
        function: 'Low-pressure pulmonary vascular propulsion'
      },
      {
        id: 'ann_coronary',
        name: 'Coronary Arteries & Veins',
        position: [0.1, -0.2, 0.9],
        description: 'Branching vascular network delivering continuous oxygen and glucose nutrients directly to active cardiac muscle tissue.',
        function: 'Supplies myocardial capillary beds to prevent ischemic arrest'
      }
    ]
  },
  {
    id: 'builtin_neuron',
    name: 'Multipolar Neuron',
    category: 'Human Anatomy',
    description: 'Electrochemical signaling nerve cell featuring a soma body, dendritic arbor, long axon, golden myelin sheath nodes of Ranvier, and synaptic terminal buttons.',
    modelType: 'preset_neuron',
    scale: 1.0,
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    authorName: 'BioAR Scientific Core',
    fileFormat: 'preset',
    annotations: [
      {
        id: 'ann_soma',
        name: 'Soma (Cell Body) & Dendrites',
        position: [-1.4, 0.6, 0],
        description: 'Receives excitatory and inhibitory neurotransmitter signals from upstream presynaptic terminals via ligand-gated ion channels.',
        function: 'Signal summation and metabolic synthesis'
      },
      {
        id: 'ann_hillock',
        name: 'Axon Hillock',
        position: [-0.8, 0.2, 0],
        description: 'Dense concentration of voltage-gated Na+ channels where graded postsynaptic potentials reach threshold (-55mV) to fire an action potential.',
        function: 'Initiation of all-or-none electrical action potentials'
      },
      {
        id: 'ann_myelin',
        name: 'Myelin Sheaths & Nodes of Ranvier',
        position: [0.2, -0.2, 0],
        description: 'Lipid-rich insulating glial layers (Schwann cells/oligodendrocytes) separated by periodic bare nodes.',
        function: 'Enables rapid saltatory conduction of action potentials (up to 120 m/s)'
      },
      {
        id: 'ann_synapse',
        name: 'Synaptic Boutons / Terminals',
        position: [1.6, -0.7, 0],
        description: 'Contains synaptic vesicles loaded with neurotransmitters (e.g., acetylcholine, glutamate, GABA) that exocytose across the synaptic cleft.',
        function: 'Converts electrical action potential into chemical neurotransmission'
      }
    ]
  },
  {
    id: 'builtin_chloroplast',
    name: 'Chloroplast Anatomy',
    category: 'Botany',
    description: 'High-resolution chloroplast showing double-envelope membrane, stroma fluid matrix, thylakoid discs, and interconnected granum stacks.',
    modelType: 'preset_chloroplast',
    scale: 1.0,
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    authorName: 'BioAR Scientific Core',
    fileFormat: 'preset',
    annotations: [
      {
        id: 'ann_membrane_envelope',
        name: 'Outer & Inner Envelope',
        position: [0, 1.2, 0],
        description: 'Selectively permeable double lipid bilayer with intermembrane space.',
        function: 'Regulates transport of metabolites, proteins, and ions into the plastid'
      },
      {
        id: 'ann_grana',
        name: 'Thylakoid Grana Stacks',
        position: [-0.7, 0, 0.3],
        description: 'Membranous stacks where photosystems I & II, cytochrome b6f, and ATP synthases perform light-dependent reactions.',
        function: 'Photolysis of H2O, oxygen release, and generation of NADPH + ATP'
      },
      {
        id: 'ann_stroma',
        name: 'Stroma Fluid Matrix',
        position: [0.6, 0.2, -0.2],
        description: 'Aqueous fluid containing dissolved enzymes including RuBisCO, circular chloroplast DNA, and ribosomes.',
        function: 'Site of the light-independent Calvin cycle for CO2 carbon fixation'
      },
      {
        id: 'ann_lamellae',
        name: 'Stromal Lamellae / Frets',
        position: [0, -0.5, 0],
        description: 'Tubular connections linking individual grana stacks to distribute photophosphorylation components.',
        function: 'Maximizes photosynthetic light capture surface area across the stroma'
      }
    ]
  },
  {
    id: 'builtin_animal_cell',
    name: 'Animal Cell & Organelles',
    category: 'Cellular Biology',
    description: 'Comprehensive animal cell with plasma membrane, central nucleus, rough/smooth endoplasmic reticulum, Golgi apparatus, and powerhouse mitochondria.',
    modelType: 'preset_animal_cell',
    scale: 1.0,
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    authorName: 'BioAR Scientific Core',
    fileFormat: 'preset',
    annotations: [
      {
        id: 'ann_animal_nucleus',
        name: 'Nucleus & Chromatin',
        position: [-0.3, 0.4, 0],
        description: 'Nuclear envelope with pore complexes enclosing condensed chromatin fibres.',
        function: 'Regulates gene expression and DNA replication during cell cycle'
      },
      {
        id: 'ann_mitochondria',
        name: 'Mitochondria (Powerhouse)',
        position: [0.9, -0.6, 0.3],
        description: 'Double-membrane organelle with convoluted inner cristae folds harboring the electron transport chain and ATP synthase.',
        function: 'Cellular respiration generating cellular ATP via oxidative phosphorylation'
      },
      {
        id: 'ann_golgi',
        name: 'Golgi Apparatus',
        position: [-0.8, -0.7, 0.2],
        description: 'Stack of curved cisternae modifying, sorting, and packaging proteins from the rough ER into secretory vesicles.',
        function: 'Post-translational modification and protein secretion'
      },
      {
        id: 'ann_plasma_mem',
        name: 'Plasma Membrane',
        position: [0, 1.4, 0],
        description: 'Phospholipid bilayer embedded with cholesterol, glycoproteins, and receptor ion channels.',
        function: 'Cellular boundary, cell signaling, and selective molecular transport'
      }
    ]
  }
];

// Persistent In-Memory State for Instant Sync
let memoryCustomModels: Library3DModel[] = [];
let hasLoadedFromIDB = false;

// Initialize memory state from localStorage and IndexedDB
function initMemoryCache() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MODELS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCustomModels = parsed;
      }
    }
  } catch (e) {
    console.warn('Initial localStorage read:', e);
  }

  // Hydrate from IndexedDB in background
  if (!hasLoadedFromIDB) {
    getAllModelsFromIDB<Library3DModel>().then((idbModels) => {
      hasLoadedFromIDB = true;
      if (idbModels && idbModels.length > 0) {
        const map = new Map<string, Library3DModel>();
        // Add IDB models first
        idbModels.forEach((m) => map.set(m.id, m));
        // Merge memory models
        memoryCustomModels.forEach((m) => map.set(m.id, m));
        memoryCustomModels = Array.from(map.values());
        notifyAllSubscribers();
      }
    }).catch((err) => {
      console.warn('Could not read initial IDB models:', err);
    });
  }
}

initMemoryCache();

function getDeletedBuiltinIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_BUILTIN_KEY);
    if (raw) {
      return new Set(JSON.parse(raw));
    }
  } catch (e) {
    console.warn('Error reading deleted builtin models list:', e);
  }
  return new Set();
}

function saveDeletedBuiltinIds(deletedSet: Set<string>) {
  try {
    localStorage.setItem(LOCAL_STORAGE_DELETED_BUILTIN_KEY, JSON.stringify(Array.from(deletedSet)));
  } catch (e) {
    console.warn('Error saving deleted builtin models list:', e);
  }
}

function getActiveBuiltInModels(): Library3DModel[] {
  const deletedSet = getDeletedBuiltinIds();
  return BUILT_IN_3D_MODELS.filter(m => !deletedSet.has(m.id));
}

function getCustomModelsCache(): Library3DModel[] {
  return [...memoryCustomModels];
}

function saveCustomModelsCache(models: Library3DModel[]) {
  memoryCustomModels = [...models];
  try {
    // Save lightweight copy to localStorage
    const metaOnly = models.map((m) => ({
      ...m,
      // If data URL is huge (>300KB), don't blow localStorage quota
      modelUrl: m.modelUrl && m.modelUrl.length > 300000 ? '' : m.modelUrl,
      thumbnailImage: m.thumbnailImage && m.thumbnailImage.length > 300000 ? '' : m.thumbnailImage
    }));
    localStorage.setItem(LOCAL_STORAGE_MODELS_KEY, JSON.stringify(metaOnly));
  } catch (e) {
    console.warn('Safe localStorage quota notice (model securely stored in IndexedDB):', e);
  }
}

const activeSubscribers = new Set<(allModels: Library3DModel[]) => void>();

function notifyAllSubscribers() {
  const activeBuiltIns = getActiveBuiltInModels();
  const localCustom = getCustomModelsCache();
  const merged = [...activeBuiltIns, ...localCustom];
  activeSubscribers.forEach((callback) => {
    try {
      callback(merged);
    } catch (err) {
      console.warn('Error in model library subscriber:', err);
    }
  });
}

// Subscribe to 3D models from Firestore, IndexedDB, and memory cache
export function subscribeToModelLibrary(onUpdate: (allModels: Library3DModel[]) => void): () => void {
  activeSubscribers.add(onUpdate);

  // Emit current active models immediately
  const localCustom = getCustomModelsCache();
  const activeBuiltIns = getActiveBuiltInModels();
  onUpdate([...activeBuiltIns, ...localCustom]);

  // Ensure IDB is loaded
  if (!hasLoadedFromIDB) {
    getAllModelsFromIDB<Library3DModel>().then((idbModels) => {
      hasLoadedFromIDB = true;
      if (idbModels && idbModels.length > 0) {
        const map = new Map<string, Library3DModel>();
        idbModels.forEach((m) => map.set(m.id, m));
        memoryCustomModels.forEach((m) => map.set(m.id, m));
        memoryCustomModels = Array.from(map.values());
        notifyAllSubscribers();
      }
    });
  }

  try {
    const colRef = collection(db, MODELS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const firestoreModels: Library3DModel[] = [];
        snapshot.forEach((docSnap) => {
          firestoreModels.push({
            id: docSnap.id,
            ...docSnap.data()
          } as Library3DModel);
        });

        // Non-destructive merge: preserve local models with full data URLs
        if (firestoreModels.length > 0) {
          const map = new Map<string, Library3DModel>();
          // Add local models first
          memoryCustomModels.forEach((m) => map.set(m.id, m));
          // Merge Firestore models
          firestoreModels.forEach((fm) => {
            const existing = map.get(fm.id);
            map.set(fm.id, {
              ...fm,
              modelUrl: fm.modelUrl || existing?.modelUrl,
              thumbnailImage: fm.thumbnailImage || existing?.thumbnailImage
            });
          });
          memoryCustomModels = Array.from(map.values());
          saveCustomModelsCache(memoryCustomModels);
          notifyAllSubscribers();
        }
      },
      (err) => {
        console.warn('Firestore 3D Models notice (operating with IndexedDB cache):', err);
        notifyAllSubscribers();
      }
    );

    return () => {
      activeSubscribers.delete(onUpdate);
      unsubscribe();
    };
  } catch (e) {
    console.warn('Could not initialize Firestore models listener, operating locally:', e);
    return () => {
      activeSubscribers.delete(onUpdate);
    };
  }
}

// Save or Add a New 3D Model / 3D Asset to the Library
export async function saveModelToLibrary(model: Omit<Library3DModel, 'id' | 'createdAt'> & { id?: string }): Promise<Library3DModel> {
  const modelId = model.id || `custom_3d_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullModel: Library3DModel = {
    ...model,
    id: modelId,
    createdAt: new Date().toISOString(),
    isBuiltIn: false,
    scale: model.scale || 1.0,
    annotations: model.annotations || []
  };

  // 1. Update in-memory cache immediately
  const index = memoryCustomModels.findIndex(m => m.id === modelId);
  if (index >= 0) {
    memoryCustomModels[index] = fullModel;
  } else {
    memoryCustomModels = [fullModel, ...memoryCustomModels];
  }
  saveCustomModelsCache(memoryCustomModels);
  notifyAllSubscribers();

  // 2. Persist to robust IndexedDB (handles 100MB+ without size issues)
  try {
    await saveModelToIDB(fullModel);
  } catch (err) {
    console.warn('IndexedDB save notice:', err);
  }

  // 3. Persist to Firestore (safely guard against 1MB doc limits)
  try {
    const docRef = doc(db, MODELS_COLLECTION, modelId);
    const firestorePayload = {
      ...fullModel,
      // If URL is > 800KB, keep payload under Firestore 1MB threshold
      modelUrl: fullModel.modelUrl && fullModel.modelUrl.length > 800000 ? '' : fullModel.modelUrl,
      thumbnailImage: fullModel.thumbnailImage && fullModel.thumbnailImage.length > 800000 ? '' : fullModel.thumbnailImage,
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, firestorePayload, { merge: true });
  } catch (e) {
    console.warn('Firestore setDoc notice for 3D model (persisted in IndexedDB):', e);
  }

  return fullModel;
}

// Delete ANY 3D Model from Library (including built-in presets)
export async function deleteModelFromLibrary(modelId: string): Promise<boolean> {
  // If it's a built-in model, register it in the deleted set
  if (modelId.startsWith('builtin_')) {
    const deletedSet = getDeletedBuiltinIds();
    deletedSet.add(modelId);
    saveDeletedBuiltinIds(deletedSet);
    notifyAllSubscribers();
    return true;
  }

  // 1. Remove custom model from in-memory cache
  memoryCustomModels = memoryCustomModels.filter(m => m.id !== modelId);
  saveCustomModelsCache(memoryCustomModels);
  notifyAllSubscribers();

  // 2. Remove from IndexedDB
  try {
    await deleteModelFromIDB(modelId);
  } catch (err) {
    console.warn('IndexedDB delete notice:', err);
  }

  // 3. Remove custom model from Firestore
  try {
    const docRef = doc(db, MODELS_COLLECTION, modelId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Firestore deleteDoc notice for 3D model:', e);
  }

  return true;
}

// Clear all models from the library (both presets and custom)
export async function clearAllModelsFromLibrary(): Promise<boolean> {
  // 1. Mark all built-ins as deleted
  const allBuiltInIds = new Set(BUILT_IN_3D_MODELS.map(m => m.id));
  saveDeletedBuiltinIds(allBuiltInIds);

  // 2. Clear custom cache
  const toDelete = [...memoryCustomModels];
  memoryCustomModels = [];
  saveCustomModelsCache([]);
  notifyAllSubscribers();

  // 3. Clear IndexedDB
  try {
    await clearAllModelsFromIDB();
  } catch (err) {
    console.warn('IndexedDB clear notice:', err);
  }

  // 4. Clear from Firestore
  try {
    for (const m of toDelete) {
      const docRef = doc(db, MODELS_COLLECTION, m.id);
      await deleteDoc(docRef);
    }
  } catch (e) {
    console.warn('Firestore delete all notice:', e);
  }

  return true;
}

// Reset/Restore all default built-in biology models
export function resetModelLibraryToDefaults(): boolean {
  try {
    localStorage.removeItem(LOCAL_STORAGE_DELETED_BUILTIN_KEY);
    notifyAllSubscribers();
    return true;
  } catch (e) {
    console.warn('Error resetting library defaults:', e);
    return false;
  }
}
