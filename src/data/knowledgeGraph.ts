export interface BKGNode {
  id: string;
  name: string;
  type: 'compound' | 'target' | 'pathway' | 'disease' | 'phenotype';
  clinicalValidity: number; // 0.0 to 1.0
  details: {
    synonyms?: string[];
    description: string;
    family?: string; // e.g., "RTK Kinase", "Cytokine", "GPCR", "Small Molecule", "Monoclonal Antibody", etc.
    clinicalPhase?: 'Approved' | 'Phase III' | 'Phase II' | 'Phase I' | 'Preclinical';
    tissueExpression?: string; // HPA-like validation
    molecularFormula?: string; // for compounds
    chromosomeLocation?: string; // for targets
  };
}

export interface BKGEdge {
  id: string;
  source: string;
  target: string;
  type: 'inhibits' | 'activates' | 'upregulates' | 'downregulates' | 'associated_with' | 'member_of' | 'modulates' | 'sentence' | 'abstract';
  confidence: number; // 0.0 to 1.0
  publications: string[]; // PMIDs
  evidence: string;
}

export const nodes: BKGNode[] = [
  // --- ONCOLOGY COMPOUNDS ---
  {
    id: "CHEMBL1201116",
    name: "Gefitinib",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Iressa", "ZD1839"],
      description: "A selective epidermal growth factor receptor (EGFR) tyrosine kinase inhibitor used for the treatment of locally advanced or metastatic non-small cell lung cancer.",
      family: "Small Molecule Inhibitor",
      clinicalPhase: "Approved",
      molecularFormula: "C22H24ClFN4O3"
    }
  },
  {
    id: "CHEMBL3545062",
    name: "Osimertinib",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Tagrisso", "AZD9291"],
      description: "A third-generation, irreversible epidermal growth factor receptor (EGFR) tyrosine kinase inhibitor that targets both EGFR-sensitizing and EGFR T790M resistance mutations.",
      family: "Small Molecule Inhibitor",
      clinicalPhase: "Approved",
      molecularFormula: "C28H33N7O2"
    }
  },
  {
    id: "CHEMBL4650574",
    name: "Sotorasib",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Lumakras", "AMG-510"],
      description: "An inhibitor of the RAS GTPase family, specifically targeting the KRAS G12C mutation in non-small cell lung cancer.",
      family: "Small Molecule Inhibitor",
      clinicalPhase: "Approved",
      molecularFormula: "C32H35F2N7O2"
    }
  },
  {
    id: "CHEMBL3813872",
    name: "Trametinib",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Mekinist", "GSK1120212"],
      description: "A reversible, highly selective allosteric inhibitor of mitogen-activated extracellular signal-regulated kinase 1 (MEK1) and MEK2 activation and kinase activity.",
      family: "Small Molecule Inhibitor",
      clinicalPhase: "Approved",
      molecularFormula: "C26H23FIN5O4"
    }
  },
  {
    id: "CHEMBL2103837",
    name: "Vemurafenib",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Zelboraf", "PLX4032"],
      description: "An inhibitor of the mutated BRAF serine-threonine kinase (specifically BRAF V600E) used to treat late-stage melanoma.",
      family: "Small Molecule Inhibitor",
      clinicalPhase: "Approved",
      molecularFormula: "C23H18ClF2N3O3S"
    }
  },

  // --- ONCOLOGY TARGETS (GENES/PROTEINS) ---
  {
    id: "TARGET:EGFR",
    name: "EGFR",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["ERBB1", "HER1"],
      description: "Epidermal Growth Factor Receptor, a receptor tyrosine kinase that binds to epidermal growth factor family ligands to initiate signaling cascades driving cell proliferation.",
      family: "Receptor Tyrosine Kinase",
      tissueExpression: "Lungs, Colon, Placenta, Skin",
      chromosomeLocation: "7p11.2"
    }
  },
  {
    id: "TARGET:KRAS",
    name: "KRAS",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["K-RAS", "p21ras"],
      description: "KRAS proto-oncogene GTPase, an essential molecular switch in the EGFR/MAPK signaling cascade that regulates cell growth, division, and survival.",
      family: "Small GTPase",
      tissueExpression: "Colon, Lungs, Pancreas, Stomach",
      chromosomeLocation: "12p12.1"
    }
  },
  {
    id: "TARGET:BRAF",
    name: "BRAF",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["B-RAF", "BRAF1"],
      description: "BRAF serine/threonine-protein kinase, a key downstream effector of KRAS in the MAPK cascade. Frequently mutated in cutaneous melanomas and colorectal cancers.",
      family: "Serine/Threonine Kinase",
      tissueExpression: "Brain, Testis, Thyroid, Skin",
      chromosomeLocation: "7q34"
    }
  },
  {
    id: "TARGET:MAP2K1",
    name: "MEK1",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["MAP2K1", "MKK1"],
      description: "Dual specificity mitogen-activated protein kinase kinase 1, which phosphorylates MAPK1/ERK2 and MAPK3/ERK1 in response to RAF activation.",
      family: "Dual-Specificity Tyrosine/Threonine Kinase",
      tissueExpression: "Ubiquitous, Skeletal Muscle, Brain",
      chromosomeLocation: "15q22.31"
    }
  },
  {
    id: "TARGET:MAPK1",
    name: "ERK2",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["MAPK1", "ERK2", "p42MAPK"],
      description: "Mitogen-activated protein kinase 1, the terminal kinase of the classical MAPK pathway. Translocates to the nucleus to phosphorylate transcription factors driving transcription.",
      family: "Serine/Threonine Kinase",
      tissueExpression: "Ubiquitous, Brain, Heart, Kidney",
      chromosomeLocation: "22q11.21"
    }
  },
  {
    id: "TARGET:AKT1",
    name: "AKT1",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["PKB", "AKT"],
      description: "AKT serine/threonine kinase 1, an essential regulator of cell survival, growth, metabolism, and angiogenesis. Activates downstream cell-growth regulators like mTOR.",
      family: "AGC Kinase Family",
      tissueExpression: "Ubiquitous, Prostate, Brain, Heart",
      chromosomeLocation: "14q32.33"
    }
  },
  {
    id: "TARGET:MTOR",
    name: "mTOR",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["FRAP1", "RAFT1"],
      description: "Mechanistic target of rapamycin kinase, a central coordinator of cellular nutritional state, translation initiation, protein synthesis, and autophagy.",
      family: "PI3K-related Kinase (PIKK)",
      tissueExpression: "Ubiquitous, Skeletal Muscle, Liver",
      chromosomeLocation: "1p36.22"
    }
  },

  // --- IMMUNOLOGY COMPOUNDS ---
  {
    id: "CHEMBL1201584",
    name: "Adalimumab",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Humira"],
      description: "A recombinant human IgG1 monoclonal antibody specific for human tumor necrosis factor-alpha (TNF-alpha) used to treat autoimmune diseases.",
      family: "Monoclonal Antibody",
      clinicalPhase: "Approved"
    }
  },
  {
    id: "CHEMBL2105743",
    name: "Tofacitinib",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Xeljanz", "CP-690550"],
      description: "An oral janus kinase (JAK) inhibitor selective for JAK1 and JAK3, blocking cytokine signaling that drives inflammatory immune responses.",
      family: "Small Molecule Inhibitor",
      clinicalPhase: "Approved",
      molecularFormula: "C16H20N6O"
    }
  },
  {
    id: "CHEMBL1201834",
    name: "Tocilizumab",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Actemra"],
      description: "A humanized monoclonal antibody targeting the interleukin-6 receptor (IL-6R), inhibiting IL-6-mediated pro-inflammatory signaling.",
      family: "Monoclonal Antibody",
      clinicalPhase: "Approved"
    }
  },
  {
    id: "CHEMBL3137343",
    name: "Secukinumab",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Cosentyx", "AIN457"],
      description: "A human IgG1 kappa monoclonal antibody that selectively binds to and neutralizes interleukin-17A, used in plaque psoriasis and ankylosing spondylitis.",
      family: "Monoclonal Antibody",
      clinicalPhase: "Approved"
    }
  },
  {
    id: "CHEMBL_METHOTREXATE",
    name: "Methotrexate",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Rheumatrex", "Trexall"],
      description: "An antimetabolite and folate analog that inhibits dihydrofolate reductase (DHFR), widely used at low doses as an immunosuppressive agent in rheumatoid arthritis.",
      family: "Small Molecule Inhibitor",
      clinicalPhase: "Approved",
      molecularFormula: "C20H22N8O5"
    }
  },

  // --- IMMUNOLOGY TARGETS ---
  {
    id: "TARGET:TNF",
    name: "TNF-alpha",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["TNF", "TNFSF2"],
      description: "Tumor Necrosis Factor, a multifunctional pro-inflammatory cytokine secreted primarily by macrophages. It stimulates systemic inflammation and acute phase reaction.",
      family: "Cytokine",
      tissueExpression: "Spleen, Lymph Nodes, Bone Marrow",
      chromosomeLocation: "6p21.33"
    }
  },
  {
    id: "TARGET:JAK1",
    name: "JAK1",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["JAK1A", "JAK1B"],
      description: "Janus Kinase 1, a tyrosine kinase that associates with cytokine receptors and initiates signal transduction by phosphorylating STAT transcription factors.",
      family: "Non-Receptor Tyrosine Kinase",
      tissueExpression: "Lymphoid Tissue, Bone Marrow, Colon",
      chromosomeLocation: "1p31.3"
    }
  },
  {
    id: "TARGET:JAK3",
    name: "JAK3",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["JAK3_HUMAN", "LJAK"],
      description: "Janus Kinase 3, a non-receptor tyrosine kinase restricted to hematopoietic cells. Interacts with the common gamma chain of interleukins IL-2, -4, -7, -9, -15, and -21.",
      family: "Non-Receptor Tyrosine Kinase",
      tissueExpression: "Spleen, Bone Marrow, Lymph Nodes",
      chromosomeLocation: "19p13.11"
    }
  },
  {
    id: "TARGET:STAT3",
    name: "STAT3",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["APRF"],
      description: "Signal Transducer and Activator of Transcription 3. Phosphorylated by JAKs in response to cytokine stimulation, homodimerizes, and translocates to the nucleus to induce transcription.",
      family: "Transcription Factor",
      tissueExpression: "Ubiquitous, Immune cells, Liver",
      chromosomeLocation: "17q21.31"
    }
  },
  {
    id: "TARGET:IL6",
    name: "IL-6",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["IFNB2", "IL6"],
      description: "Interleukin 6, a cytokine that acts as both a pro-inflammatory cytokine and an anti-inflammatory myokine. Secreted by T-cells and macrophages.",
      family: "Cytokine",
      tissueExpression: "Spleen, Adipose Tissue, Lungs",
      chromosomeLocation: "7p15.3"
    }
  },
  {
    id: "TARGET:IL6R",
    name: "IL-6R",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["IL6RA", "gp80"],
      description: "Interleukin-6 Receptor, a subunit of the receptor complex for interleukin-6. Exists in both membrane-bound and soluble forms.",
      family: "Cytokine Receptor",
      tissueExpression: "Liver, Spleen, Leukocytes",
      chromosomeLocation: "1q21.3"
    }
  },
  {
    id: "TARGET:IL17A",
    name: "IL-17A",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["IL17", "CTLA8"],
      description: "Interleukin-17A, a pro-inflammatory cytokine produced by activated T-cells (specifically Th17 cells) that stimulates the release of IL-6, IL-8, and CXCL1.",
      family: "Cytokine",
      tissueExpression: "Activated Lymphocytes, Tonsil",
      chromosomeLocation: "6p12.2"
    }
  },
  {
    id: "TARGET:NFKB1",
    name: "NF-kB",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["NFKB1", "p50", "p105"],
      description: "Nuclear Factor Kappa B subunit 1, a pleiotropic transcription factor activated by inflammatory stimuli (TNF-alpha, IL-1, LPS) driving cytokine transcription and cell survival.",
      family: "Transcription Factor",
      tissueExpression: "Ubiquitous, Lymph Nodes, Spleen",
      chromosomeLocation: "4q24"
    }
  },

  // --- NEUROLOGY COMPOUNDS ---
  {
    id: "CHEMBL_DONEPEZIL",
    name: "Donepezil",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Aricept", "E2020"],
      description: "A reversible, acetylcholinesterase inhibitor used in the symptomatic treatment of mild to moderate Alzheimer's disease.",
      family: "Small Molecule Inhibitor",
      clinicalPhase: "Approved",
      molecularFormula: "C24H29NO3"
    }
  },
  {
    id: "CHEMBL_MEMANTINE",
    name: "Memantine",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Namenda"],
      description: "An uncompetitive, moderate-affinity NMDA receptor antagonist used for the treatment of moderate to severe Alzheimer's disease.",
      family: "Small Molecule Antagonist",
      clinicalPhase: "Approved",
      molecularFormula: "C12H21N"
    }
  },
  {
    id: "CHEMBL_MAGNESIUM",
    name: "Magnesium",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Mg2+", "Magnesium Ion", "Magnesium sulfate", "Magnesium oxide"],
      description: "A crucial intracellular divalent cation that acts as a natural calcium channel blocker and NMDA receptor antagonist.",
      family: "Essential Mineral",
      clinicalPhase: "Approved"
    }
  },
  {
    id: "CHEMBL_CALCIUM",
    name: "Calcium",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Ca2+", "Calcium Ion", "Calcium chloride", "Calcium gluconate"],
      description: "A vital cellular messenger regulating muscle contraction, vasomotor tone, neurotransmitter release, and synaptic plasticity.",
      family: "Essential Mineral",
      clinicalPhase: "Approved"
    }
  },
  {
    id: "CHEMBL_LECANEMAB",
    name: "Lecanemab",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Leqembi", "BAN2401"],
      description: "A humanized IgG1 monoclonal antibody directed against amyloid-beta soluble protofibrils, approved to slow cognitive decline in early Alzheimer's disease.",
      family: "Monoclonal Antibody",
      clinicalPhase: "Approved"
    }
  },
  {
    id: "CHEMBL_SELEGILINE",
    name: "Selegiline",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Eldepryl", "L-deprenyl"],
      description: "An irreversible monoamine oxidase B (MAO-B) inhibitor used as an adjunctive treatment in Parkinson's disease.",
      family: "Small Molecule Inhibitor",
      clinicalPhase: "Approved",
      molecularFormula: "C13H17N"
    }
  },
  {
    id: "CHEMBL_L_DOPA",
    name: "Levodopa",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["L-DOPA", "Larodopa"],
      description: "A metabolic precursor of dopamine that crosses the blood-brain barrier and is converted to dopamine. The gold-standard therapy for Parkinson's disease.",
      family: "Small Molecule Agonist",
      clinicalPhase: "Approved",
      molecularFormula: "C9H11NO4"
    }
  },

  // --- NEUROLOGY TARGETS ---
  {
    id: "TARGET:ACHE",
    name: "AChE",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Acetylcholinesterase"],
      description: "An enzyme that rapidly hydrolyzes acetylcholine in the synaptic cleft, terminating synaptic transmission. Primary target of symptomatic Alzheimer's drugs.",
      family: "Cholinesterase Enzyme",
      tissueExpression: "Brain, Skeletal Muscle, Erythrocytes",
      chromosomeLocation: "7q22.1"
    }
  },
  {
    id: "TARGET:GRIN1",
    name: "NMDA Receptor",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["GRIN1", "NMDAR1"],
      description: "Glutamate Ionotropic Receptor NMDA Type Subunit 1, an essential component of the ligand-gated NMDA glutamate receptor channel involved in synaptic plasticity and memory.",
      family: "Ionotropic Glutamate Receptor",
      tissueExpression: "Brain (Cortex, Hippocampus, Cerebellum)",
      chromosomeLocation: "9q34.3"
    }
  },
  {
    id: "TARGET:APP",
    name: "APP",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Amyloid Beta Precursor Protein", "A4"],
      description: "Amyloid precursor protein, a cell surface receptor cleaved by secretases to generate amyloid-beta peptides. Aggregated beta-amyloid forms senile plaques in Alzheimer's brains.",
      family: "Cell Surface Glycoprotein",
      tissueExpression: "Brain, Kidney, Heart, Lungs",
      chromosomeLocation: "21q21.3"
    }
  },
  {
    id: "TARGET:MAPT",
    name: "Tau",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["MAPT", "Neurofibrillary Tangle Protein"],
      description: "Microtubule Associated Protein Tau, which stabilizes neuronal microtubules. Hyperphosphorylation and aggregation of Tau leads to neurofibrillary tangles in Alzheimer's.",
      family: "Microtubule-Stabilizing Protein",
      tissueExpression: "Neurons (Axons), Brain",
      chromosomeLocation: "17q21.31"
    }
  },
  {
    id: "TARGET:MAOB",
    name: "MAO-B",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Monoamine Oxidase B"],
      description: "An enzyme located in the outer mitochondrial membrane that catalyzes the oxidative deamination of dopamine and other monoamines in the brain.",
      family: "Flavin Monoamine Oxidase Enzyme",
      tissueExpression: "Brain (Astrocytes), Platelets, Liver",
      chromosomeLocation: "Xp11.3"
    }
  },
  {
    id: "TARGET:DRD2",
    name: "D2 Receptor",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["DRD2", "Dopamine Receptor D2"],
      description: "Dopamine Receptor D2, a G-protein coupled receptor that inhibits adenylyl cyclase activity. Crucial target for Parkinson's drugs (agonists) and antipsychotics (antagonists).",
      family: "G-Protein Coupled Receptor (GPCR)",
      tissueExpression: "Brain (Striatum, Substantia Nigra)",
      chromosomeLocation: "11q23.2"
    }
  },
  {
    id: "TARGET:BACE1",
    name: "BACE1",
    type: "target",
    clinicalValidity: 0.9,
    details: {
      synonyms: ["Beta-Secretase 1", "Memapsin-2"],
      description: "Beta-site APP cleaving enzyme 1, an aspartyl protease that conducts the rate-limiting step in beta-amyloid peptide production.",
      family: "Aspartyl Protease",
      tissueExpression: "Brain (Neurons), Pancreas",
      chromosomeLocation: "11q23.3"
    }
  },
  {
    id: "TARGET:SNCA",
    name: "Alpha-Synuclein",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["SNCA", "PARK1"],
      description: "Alpha-synuclein, an abundant neuronal protein regulating synaptic vesicle release. Aggregates to form Lewy Bodies, the pathological hallmark of Parkinson's Disease.",
      family: "Apolipoprotein-like Protein",
      tissueExpression: "Brain (Synapses), Cerebellum",
      chromosomeLocation: "4q22.1"
    }
  },

  // --- CARDIOVASCULAR & METABOLIC COMPOUNDS ---
  {
    id: "CHEMBL_LISINOPRIL",
    name: "Lisinopril",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Prinivil", "Zestril"],
      description: "A synthetic peptide derivative and competitive angiotensin-converting enzyme (ACE) inhibitor used to treat hypertension and congestive heart failure.",
      family: "Small Molecule Inhibitor",
      clinicalPhase: "Approved",
      molecularFormula: "C21H31N3O5"
    }
  },
  {
    id: "CHEMBL_METOPROLOL",
    name: "Metoprolol",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Lopressor", "Toprol-XL"],
      description: "A selective beta-1 adrenergic receptor antagonist used to treat hypertension, angina pectoris, and to reduce mortality in heart failure patients.",
      family: "Small Molecule Antagonist",
      clinicalPhase: "Approved",
      molecularFormula: "C15H25NO3"
    }
  },
  {
    id: "CHEMBL_ATORVASTATIN",
    name: "Atorvastatin",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Lipitor"],
      description: "An HMG-CoA reductase inhibitor (statin) used to lower cholesterol and prevent cardiovascular events in high-risk patients.",
      family: "Small Molecule Inhibitor",
      clinicalPhase: "Approved",
      molecularFormula: "C33H35FN2O5"
    }
  },
  {
    id: "CHEMBL_EMPAGLIFLOZIN",
    name: "Empagliflozin",
    type: "compound",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Jardiance"],
      description: "An orally-active, selective sodium-glucose co-transporter 2 (SGLT2) inhibitor that improves glycemic control and reduces cardiovascular mortality in diabetes.",
      family: "Small Molecule Inhibitor",
      clinicalPhase: "Approved",
      molecularFormula: "C23H27ClO7"
    }
  },

  // --- CARDIOVASCULAR & METABOLIC TARGETS ---
  {
    id: "TARGET:ACE",
    name: "ACE",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Angiotensin-Converting Enzyme", "DCP1"],
      description: "Angiotensin-converting enzyme, a zinc metalloprotease that converts Angiotensin I to the potent vasoconstrictor Angiotensin II and degrades bradykinin.",
      family: "Metalloprotease Enzyme",
      tissueExpression: "Lungs (Endothelium), Kidneys, Prostate",
      chromosomeLocation: "17q23.3"
    }
  },
  {
    id: "TARGET:AGTR1",
    name: "AT1 Receptor",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["AGTR1", "AT1R"],
      description: "Angiotensin II Receptor Type 1, a GPCR mediating major cardiovascular effects of Angiotensin II, including vasoconstriction, aldosterone release, and cardiac hypertrophy.",
      family: "G-Protein Coupled Receptor (GPCR)",
      tissueExpression: "Adrenal Gland, Vascular Smooth Muscle, Kidney",
      chromosomeLocation: "3q24"
    }
  },
  {
    id: "TARGET:ADRB1",
    name: "Beta-1 Receptor",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["ADRB1", "B1AR"],
      description: "Adrenergic Receptor Beta 1, a Gs-coupled GPCR highly expressed in the heart. Activation increases heart rate, cardiac output, and renin secretion.",
      family: "G-Protein Coupled Receptor (GPCR)",
      tissueExpression: "Heart (Myocardium), Brain, Kidney",
      chromosomeLocation: "10q25.3"
    }
  },
  {
    id: "TARGET:HMGCR",
    name: "HMG-CoA Reductase",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["HMGCR", "LDLD"],
      description: "3-hydroxy-3-methylglutaryl-CoA reductase, the rate-limiting enzyme in cholesterol biosynthesis, catalyzing conversion of HMG-CoA to mevalonic acid.",
      family: "Reductase Enzyme",
      tissueExpression: "Liver, Adrenal Gland, Small Intestine",
      chromosomeLocation: "5q13.3"
    }
  },
  {
    id: "TARGET:SLC5A2",
    name: "SGLT2",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["SLC5A2", "SGLT2"],
      description: "Sodium/Glucose Cotransporter 2, responsible for reabsorbing the majority of filtered glucose in the proximal renal tubules of the kidney.",
      family: "Solute Carrier Transporter",
      tissueExpression: "Kidney (Proximal Tubules)",
      chromosomeLocation: "16p11.2"
    }
  },
  {
    id: "TARGET:NOS3",
    name: "eNOS",
    type: "target",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["NOS3", "Endothelial NOS"],
      description: "Nitric Oxide Synthase 3, generates nitric oxide in blood vessels to induce vasodilation, inhibit platelet aggregation, and maintain vascular homeostasis.",
      family: "Monooxygenase Enzyme",
      tissueExpression: "Endothelial Cells, Heart, Lungs",
      chromosomeLocation: "7q36.1"
    }
  },

  // --- PATHWAYS (BIOLOGICAL SYSTEM NODES) ---
  {
    id: "PW:MAPK",
    name: "MAPK Signaling Pathway",
    type: "pathway",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["MAPK/ERK Pathway", "Ras-Raf-MEK-ERK Pathway"],
      description: "A highly conserved intracellular signaling pathway linking extracellular mitogens to gene expression regulating cell division, differentiation, and migration."
    }
  },
  {
    id: "PW:PI3K_AKT",
    name: "PI3K/Akt/mTOR Pathway",
    type: "pathway",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["PI3K/Akt Pathway", "mTOR Signaling"],
      description: "An intracellular signaling pathway crucial in regulating cell cycle, translation, cell growth, and metabolism. Highly mutated and hyperactivated in human cancers."
    }
  },
  {
    id: "PW:JAK_STAT",
    name: "JAK-STAT Signaling Pathway",
    type: "pathway",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["JAK-STAT Pathway"],
      description: "A direct signaling mechanism from cell surface receptors to the nucleus, translating cytokine signaling into transcription programs driving immunity."
    }
  },
  {
    id: "PW:TNF_SIGNALING",
    name: "TNF-alpha Signaling Pathway",
    type: "pathway",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["TNF Pathway"],
      description: "Pathway triggered by TNF-alpha binding to TNFR1/TNFR2, resulting in NF-kB activation, pro-inflammatory cytokine secretion, or apoptotic cascades."
    }
  },
  {
    id: "PW:NFKB_SIGNALING",
    name: "NF-kB Signaling Pathway",
    type: "pathway",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["NF-kB Cascade"],
      description: "Central transcription cascade regulating immune, inflammatory, and stress responses. Triggered by phosphorylation and degradation of IkB inhibitors."
    }
  },
  {
    id: "PW:AMYLOID_FIBRIL",
    name: "Amyloid Beta Cascade",
    type: "pathway",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Amyloidogenic Pathway", "APP Processing"],
      description: "Cleavage of APP by BACE1 and gamma-secretase to form insoluble amyloid-beta monomers and fibrils, which accumulate into extracellular plaques in the brain."
    }
  },
  {
    id: "PW:DOPAMINERGIC_TRANSMISSION",
    name: "Dopaminergic Transmission",
    type: "pathway",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Dopaminergic Synapse"],
      description: "Neurotransmission pathways regulated by dopamine release and GPCR binding (D1-D5 receptors), coordinating motor control, motivation, and reward."
    }
  },
  {
    id: "PW:GLUTAMATERGIC_TRANSMISSION",
    name: "Glutamate Synaptic Transmission",
    type: "pathway",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Glutamate Synapse"],
      description: "Primary excitatory neurotransmission in the mammalian brain, mediated by AMPA, NMDA, and kainate ionotropic receptors."
    }
  },
  {
    id: "PW:RAS_SYSTEM",
    name: "Renin-Angiotensin System (RAAS)",
    type: "pathway",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["RAAS Pathway"],
      description: "Hormonal cascade that regulates blood pressure, blood volume, and vascular resistance. Overactivation drives chronic cardiovascular and renal diseases."
    }
  },
  {
    id: "PW:CHOLESTEROL_METABOLISM",
    name: "Cholesterol Biosynthesis",
    type: "pathway",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Mevalonate Pathway"],
      description: "An metabolic pathway producing cholesterol, isoprenoids, and vitamin D from acetyl-CoA. Target of statin therapeutics to control cardiovascular risk."
    }
  },
  {
    id: "PW:CATECHOLAMINE_RESPONSE",
    name: "Adrenergic Receptor Signaling",
    type: "pathway",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Beta-Adrenergic Signaling", "GPCR Gs Pathway"],
      description: "Signal transduction cascade initiated by catecholamines binding to G-protein coupled adrenergic receptors, regulating heart rate and contractility."
    }
  },

  // --- DISEASES ---
  {
    id: "DISEASE:MIGRAINE",
    name: "Migraine",
    type: "disease",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Migraine headache", "Aura", "Hemicrania"],
      description: "A complex neurovascular disorder characterized by recurrent moderate to severe headaches, often associated with sensory abnormalities and cortical spreading depression."
    }
  },
  {
    id: "DISEASE:NSCLC",
    name: "Non-Small Cell Lung Cancer",
    type: "disease",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["NSCLC", "Lung Adenocarcinoma"],
      description: "Any epithelial lung cancer other than small cell lung carcinoma (SCLC), accounting for about 85% of all lung cancers. Often driven by EGFR or KRAS mutations."
    }
  },
  {
    id: "DISEASE:MELANOMA",
    name: "Cutaneous Melanoma",
    type: "disease",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Malignant Melanoma", "Skin Melanoma"],
      description: "A highly aggressive cancer of melanocytes in the skin. Frequently harbor BRAF V600E mutations, making them sensitive to RAF/MEK inhibitor combinations."
    }
  },
  {
    id: "DISEASE:COLORECTAL_CANCER",
    name: "Colorectal Cancer",
    type: "disease",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["CRC", "Bowel Cancer"],
      description: "Malignancy arising from the colon or rectum. Often involves mutations in EGFR signaling pathways (KRAS, BRAF, PI3K), conferring resistance to anti-EGFR antibodies."
    }
  },
  {
    id: "DISEASE:PANCREATIC_ADENOCARCINOMA",
    name: "Pancreatic Ductal Adenocarcinoma",
    type: "disease",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["PDAC", "Pancreatic Cancer"],
      description: "A highly lethal malignancy of the exocrine pancreas. Characterized by near-universal (95%) mutations in the KRAS oncogene."
    }
  },
  {
    id: "DISEASE:RHEUMATOID_ARTHRITIS",
    name: "Rheumatoid Arthritis",
    type: "disease",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["RA", "Atrophic Arthritis"],
      description: "A chronic systemic inflammatory autoimmune disorder that primarily affects synovial joints. Driven by pro-inflammatory cytokines like TNF-alpha and IL-6."
    }
  },
  {
    id: "DISEASE:PSORIASIS",
    name: "Plaque Psoriasis",
    type: "disease",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["Psoriasis Vulgaris"],
      description: "A common immune-mediated skin disease characterized by red, scaly plaques. Driven by the IL-23/IL-17 signaling axis causing keratinocyte hyperproliferation."
    }
  },
  {
    id: "DISEASE:CROHNS_DISEASE",
    name: "Crohn's Disease",
    type: "disease",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["CD", "Regional Enteritis"],
      description: "A type of inflammatory bowel disease (IBD) that may affect any part of the gastrointestinal tract, characterized by transmural inflammation driven by TNF."
    }
  },
  {
    id: "DISEASE:ULCERATIVE_COLITIS",
    name: "Ulcerative Colitis",
    type: "disease",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["UC"],
      description: "A chronic inflammatory bowel disease (IBD) characterized by mucosal inflammation and ulceration restricted to the colon and rectum."
    }
  },
  {
    id: "DISEASE:ALZHEIMERS",
    name: "Alzheimer's Disease",
    type: "disease",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["AD", "Alzheimer's Dementia"],
      description: "A progressive, neurodegenerative disease and the most common cause of dementia. Pathologically marked by extracellular amyloid plaques and intracellular Tau tangles."
    }
  },
  {
    id: "DISEASE:PARKINSONS",
    name: "Parkinson's Disease",
    type: "disease",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["PD", "Paralysis Agitans"],
      description: "A progressive neurodegenerative movement disorder characterized by loss of dopaminergic neurons in the substantia nigra and accumulation of alpha-synuclein."
    }
  },
  {
    id: "DISEASE:HYPERTENSION",
    name: "Essential Hypertension",
    type: "disease",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["High Blood Pressure", "HTN"],
      description: "Chronic elevation of systemic arterial blood pressure without a single identifiable secondary cause. A leading risk factor for stroke and myocardial infarction."
    }
  },
  {
    id: "DISEASE:HEART_FAILURE",
    name: "Congestive Heart Failure",
    type: "disease",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["CHF", "Heart Failure"],
      description: "A complex clinical syndrome where the heart is unable to pump sufficient blood to meet the metabolic demands of the body. Driven by adrenergic overactivation."
    }
  },
  {
    id: "DISEASE:ATHEROSCLEROSIS",
    name: "Coronary Atherosclerosis",
    type: "disease",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["CAD", "Coronary Artery Disease"],
      description: "A disease of the arteries characterized by deposition of plaques of fatty material on their inner walls, driven by cholesterol accumulation and chronic inflammation."
    }
  },
  {
    id: "DISEASE:TYPE2_DIABETES",
    name: "Type 2 Diabetes Mellitus",
    type: "disease",
    clinicalValidity: 1.0,
    details: {
      synonyms: ["T2DM", "Non-Insulin Dependent Diabetes"],
      description: "A chronic metabolic disorder characterized by high blood sugar, insulin resistance, and relative lack of insulin. Major risk factor for cardiovascular disease."
    }
  },

  // --- PHENOTYPES / PATHOLOGICAL PROCESSES ---
  {
    id: "PHENOTYPE:CELL_PROLIFERATION",
    name: "Cell Proliferation",
    type: "phenotype",
    clinicalValidity: 0.8,
    details: {
      description: "The process by which a cell grows and divides, highly upregulated in all cancers."
    }
  },
  {
    id: "PHENOTYPE:CELL_SURVIVAL",
    name: "Cell Survival / Apoptosis Resistance",
    type: "phenotype",
    clinicalValidity: 0.8,
    details: {
      description: "Suppression of programmed cell death (apoptosis) pathways, facilitating tumorigenesis and drug resistance."
    }
  },
  {
    id: "PHENOTYPE:SYNAPTIC_DYSFUNCTION",
    name: "Synaptic Dysfunction",
    type: "phenotype",
    clinicalValidity: 0.8,
    details: {
      description: "Impairment of synaptic transmission and connectivity, representing the early stages of cognitive decline in neurodegeneration."
    }
  },
  {
    id: "PHENOTYPE:NEUROINFLAMMATION",
    name: "Neuroinflammation",
    type: "phenotype",
    clinicalValidity: 0.85,
    details: {
      description: "Chronic inflammatory responses in the central nervous system, driven by microglial and astrocytic activation."
    }
  },
  {
    id: "PHENOTYPE:VASOCONSTRICTION",
    name: "Systemic Vasoconstriction",
    type: "phenotype",
    clinicalValidity: 0.9,
    details: {
      description: "Narrowing of blood vessels resulting from vascular smooth muscle contraction, directly elevating systemic blood pressure."
    }
  },
  {
    id: "PHENOTYPE:CARDIAC_REMODELING",
    name: "Pathological Cardiac Remodeling",
    type: "phenotype",
    clinicalValidity: 0.8,
    details: {
      description: "Changes in size, shape, structure, and function of the heart in response to chronic hemodynamic load or injury."
    }
  },
  {
    id: "PHENOTYPE:GLUCOSURIA",
    name: "Glucosuria",
    type: "phenotype",
    clinicalValidity: 0.95,
    details: {
      description: "Excretion of glucose into the urine, which lowers blood glucose levels in diabetic patients when induced therapeutically."
    }
  }
];

export const edges: BKGEdge[] = [
  // --- ONCOLOGY EDGES ---
  {
    id: "EDGE:GEFITINIB_EGFR",
    source: "CHEMBL1201116",
    target: "TARGET:EGFR",
    type: "inhibits",
    confidence: 1.0,
    publications: ["PMID:11896340", "PMID:12702723"],
    evidence: "Gefitinib binds to the ATP-binding site of EGFR, preventing autophosphorylation and activation of downstream targets."
  },
  {
    id: "EDGE:OSIMERTINIB_EGFR",
    source: "CHEMBL3545062",
    target: "TARGET:EGFR",
    type: "inhibits",
    confidence: 1.0,
    publications: ["PMID:24814187", "PMID:26038483"],
    evidence: "Osimertinib is an irreversible EGFR inhibitor targeting both sensitizing mutant alleles and the T790M resistance gatekeeper mutation."
  },
  {
    id: "EDGE:SOTORASIB_KRAS",
    source: "CHEMBL4650574",
    target: "TARGET:KRAS",
    type: "inhibits",
    confidence: 1.0,
    publications: ["PMID:31666432", "PMID:34079875"],
    evidence: "Sotorasib covalently and selectively binds to the cysteine residue in KRAS G12C, locking the GTPase in its inactive GDP-bound state."
  },
  {
    id: "EDGE:TRAMETINIB_MEK1",
    source: "CHEMBL3813872",
    target: "TARGET:MAP2K1",
    type: "inhibits",
    confidence: 1.0,
    publications: ["PMID:22591877", "PMID:23528257"],
    evidence: "Trametinib selectively inhibits MEK1/2 activation and kinase activity, blocking RAF-mediated phosphorylation of MEK."
  },
  {
    id: "EDGE:VEMURAFENIB_BRAF",
    source: "CHEMBL2103837",
    target: "TARGET:BRAF",
    type: "inhibits",
    confidence: 1.0,
    publications: ["PMID:20818278", "PMID:21639808"],
    evidence: "Vemurafenib is a potent inhibitor of mutated BRAF V600E kinase, blocking ATP binding and downstream signaling."
  },
  {
    id: "EDGE:EGFR_KRAS",
    source: "TARGET:EGFR",
    target: "TARGET:KRAS",
    type: "activates",
    confidence: 0.95,
    publications: ["PMID:16007086", "PMID:19131976"],
    evidence: "Active EGFR recruits Grb2/SOS complex to the membrane, promoting GDP-to-GTP exchange and activation of RAS."
  },
  {
    id: "EDGE:KRAS_BRAF",
    source: "TARGET:KRAS",
    target: "TARGET:BRAF",
    type: "activates",
    confidence: 0.95,
    publications: ["PMID:17962809", "PMID:19018635"],
    evidence: "GTP-bound active KRAS binds to the RBD region of BRAF, recruiting it to the plasma membrane for phosphorylation and dimerization."
  },
  {
    id: "EDGE:BRAF_MEK1",
    source: "TARGET:BRAF",
    target: "TARGET:MAP2K1",
    type: "activates",
    confidence: 1.0,
    publications: ["PMID:15313886", "PMID:16959567"],
    evidence: "Active BRAF dimers phosphorylate the activation loop serine residues (Ser217/Ser221) of MEK1/2."
  },
  {
    id: "EDGE:MEK1_ERK2",
    source: "TARGET:MAP2K1",
    target: "TARGET:MAPK1",
    type: "activates",
    confidence: 1.0,
    publications: ["PMID:14559897", "PMID:16024803"],
    evidence: "Active MEK1 phosphorylates both the threonine and tyrosine residues (Thr202/Tyr204) in the activation loop of ERK2."
  },
  {
    id: "EDGE:EGFR_PI3K",
    source: "TARGET:EGFR",
    target: "TARGET:AKT1",
    type: "activates",
    confidence: 0.9,
    publications: ["PMID:15254045"],
    evidence: "EGFR autophosphorylation recruits PI3K, which synthesizes PIP3, promoting PDK1-mediated phosphorylation of AKT1 at Thr308."
  },
  {
    id: "EDGE:AKT1_MTOR",
    source: "TARGET:AKT1",
    target: "TARGET:MTOR",
    type: "activates",
    confidence: 0.95,
    publications: ["PMID:12485996"],
    evidence: "Active AKT1 phosphorylates and inactivates the TSC1/TSC2 complex, allowing Rheb GTPase to activate mTORC1."
  },
  {
    id: "EDGE:ERK2_MAPK_PW",
    source: "TARGET:MAPK1",
    target: "PW:MAPK",
    type: "member_of",
    confidence: 1.0,
    publications: [],
    evidence: "ERK2 is the primary effector kinase of the classical mitogen-activated protein kinase (MAPK) cascade."
  },
  {
    id: "EDGE:MEK1_MAPK_PW",
    source: "TARGET:MAP2K1",
    target: "PW:MAPK",
    type: "member_of",
    confidence: 1.0,
    publications: [],
    evidence: "MEK1 is the intermediate gatekeeper kinase of the classical MAPK pathway."
  },
  {
    id: "EDGE:BRAF_MAPK_PW",
    source: "TARGET:BRAF",
    target: "PW:MAPK",
    type: "member_of",
    confidence: 1.0,
    publications: [],
    evidence: "BRAF is an upstream regulatory serine/threonine kinase driving the MAPK signaling cascade."
  },
  {
    id: "EDGE:KRAS_MAPK_PW",
    source: "TARGET:KRAS",
    target: "PW:MAPK",
    type: "member_of",
    confidence: 0.95,
    publications: [],
    evidence: "KRAS initiates the MAPK signal transduction cascade upon growth factor stimulation."
  },
  {
    id: "EDGE:AKT1_PI3K_PW",
    source: "TARGET:AKT1",
    target: "PW:PI3K_AKT",
    type: "member_of",
    confidence: 1.0,
    publications: [],
    evidence: "AKT1 is the core signal-integrating node in the PI3K/Akt pathway."
  },
  {
    id: "EDGE:MTOR_PI3K_PW",
    source: "TARGET:MTOR",
    target: "PW:PI3K_AKT",
    type: "member_of",
    confidence: 1.0,
    publications: [],
    evidence: "mTOR is the downstream translation-regulating kinase in the PI3K/Akt pathway."
  },
  {
    id: "EDGE:MAPK_PW_PROLIFERATION",
    source: "PW:MAPK",
    target: "PHENOTYPE:CELL_PROLIFERATION",
    type: "upregulates",
    confidence: 0.95,
    publications: ["PMID:11988899", "PMID:14704332"],
    evidence: "MAPK signaling induces transcription of Cyclin D1, driving cells from G1 to S phase, promoting rapid proliferation."
  },
  {
    id: "EDGE:PI3K_PW_SURVIVAL",
    source: "PW:PI3K_AKT",
    target: "PHENOTYPE:CELL_SURVIVAL",
    type: "upregulates",
    confidence: 0.95,
    publications: ["PMID:10521404"],
    evidence: "PI3K/Akt signaling phosphorylates Bad, preventing it from binding to Bcl-xL, thereby blocking apoptosis and enhancing cell survival."
  },
  {
    id: "EDGE:PROLIFERATION_NSCLC",
    source: "PHENOTYPE:CELL_PROLIFERATION",
    target: "DISEASE:NSCLC",
    type: "associated_with",
    confidence: 0.95,
    publications: [],
    evidence: "Uncontrolled cell proliferation is a fundamental hallmark of non-small cell lung cancer pathogenesis."
  },
  {
    id: "EDGE:SURVIVAL_NSCLC",
    source: "PHENOTYPE:CELL_SURVIVAL",
    target: "DISEASE:NSCLC",
    type: "associated_with",
    confidence: 0.9,
    publications: [],
    evidence: "Apoptosis evasion allows lung tumor cells to survive under hypoxic conditions and resist chemotherapy."
  },
  {
    id: "EDGE:PROLIFERATION_MELANOMA",
    source: "PHENOTYPE:CELL_PROLIFERATION",
    target: "DISEASE:MELANOMA",
    type: "associated_with",
    confidence: 0.95,
    publications: [],
    evidence: "Rapid, uncontrolled melanocyte proliferation is the main driver of primary melanoma tumor growth."
  },
  {
    id: "EDGE:PROLIFERATION_CRC",
    source: "PHENOTYPE:CELL_PROLIFERATION",
    target: "DISEASE:COLORECTAL_CANCER",
    type: "associated_with",
    confidence: 0.9,
    publications: [],
    evidence: "Hyperproliferation of intestinal epithelial cells initiates adenoma formation, leading to colorectal cancer."
  },
  {
    id: "EDGE:PROLIFERATION_PDAC",
    source: "PHENOTYPE:CELL_PROLIFERATION",
    target: "DISEASE:PANCREATIC_ADENOCARCINOMA",
    type: "associated_with",
    confidence: 0.95,
    publications: [],
    evidence: "Aggressive proliferation driven by KRAS mutations leads to pancreatic ductal adenocarcinoma."
  },

  // --- IMMUNOLOGY EDGES ---
  {
    id: "EDGE:ADALIMUMAB_TNF",
    source: "CHEMBL1201584",
    target: "TARGET:TNF",
    type: "inhibits",
    confidence: 1.0,
    publications: ["PMID:11523758", "PMID:12224741"],
    evidence: "Adalimumab binds specifically to TNF-alpha, blocking its interaction with TNFR1 and TNFR2 cell surface receptors."
  },
  {
    id: "EDGE:TOFACITINIB_JAK1",
    source: "CHEMBL2105743",
    target: "TARGET:JAK1",
    type: "inhibits",
    confidence: 0.95,
    publications: ["PMID:21205931", "PMID:22039234"],
    evidence: "Tofacitinib binds competitively to the ATP-binding pocket of JAK1, preventing downstream phosphorylation of STAT proteins."
  },
  {
    id: "EDGE:TOFACITINIB_JAK3",
    source: "CHEMBL2105743",
    target: "TARGET:JAK3",
    type: "inhibits",
    confidence: 1.0,
    publications: ["PMID:19592235", "PMID:21205931"],
    evidence: "Tofacitinib is a highly potent inhibitor of JAK3, blocking common-gamma-chain cytokine signaling in lymphocytes."
  },
  {
    id: "EDGE:TOCILIZUMAB_IL6R",
    source: "CHEMBL1201834",
    target: "TARGET:IL6R",
    type: "inhibits",
    confidence: 1.0,
    publications: ["PMID:12558661", "PMID:15610444"],
    evidence: "Tocilizumab binds to both soluble and membrane-bound IL-6R, inhibiting IL-6-mediated trans-signaling and cis-signaling."
  },
  {
    id: "EDGE:SECUKINUMAB_IL17A",
    source: "CHEMBL3137343",
    target: "TARGET:IL17A",
    type: "inhibits",
    confidence: 1.0,
    publications: ["PMID:20546907", "PMID:24754323"],
    evidence: "Secukinumab selectively binds IL-17A, preventing it from interacting with the IL-17 receptor complex and inducing inflammatory cytokines."
  },
  {
    id: "EDGE:METHOTREXATE_NFKB",
    source: "CHEMBL_METHOTREXATE",
    target: "TARGET:NFKB1",
    type: "inhibits",
    confidence: 0.8,
    publications: ["PMID:10862085", "PMID:12513902"],
    evidence: "Low-dose methotrexate increases adenosine release, which acts via A2a receptors to inhibit NF-kB activation and decrease TNF-alpha production."
  },
  {
    id: "EDGE:IL6_IL6R",
    source: "TARGET:IL6",
    target: "TARGET:IL6R",
    type: "activates",
    confidence: 1.0,
    publications: [],
    evidence: "IL-6 ligand binds to IL-6 Receptor (IL-6R), triggering recruitment of the signal-transducing subunit gp130."
  },
  {
    id: "EDGE:IL6R_JAK1",
    source: "TARGET:IL6R",
    target: "TARGET:JAK1",
    type: "activates",
    confidence: 0.95,
    publications: ["PMID:15322197"],
    evidence: "gp130 homodimerization induced by IL-6/IL-6R complex activates constitutively bound JAK1."
  },
  {
    id: "EDGE:JAK1_STAT3",
    source: "TARGET:JAK1",
    target: "TARGET:STAT3",
    type: "activates",
    confidence: 0.95,
    publications: ["PMID:11156640"],
    evidence: "Active JAK1 phosphorylates STAT3 at Tyr705, promoting homodimerization and nuclear translocation."
  },
  {
    id: "EDGE:JAK3_STAT3",
    source: "TARGET:JAK3",
    target: "TARGET:STAT3",
    type: "activates",
    confidence: 0.9,
    publications: ["PMID:12480643"],
    evidence: "JAK3 activated by common gamma cytokines phosphorylates STAT transcription factors including STAT3."
  },
  {
    id: "EDGE:TNF_NFKB",
    source: "TARGET:TNF",
    target: "TARGET:NFKB1",
    type: "activates",
    confidence: 0.95,
    publications: ["PMID:10438459"],
    evidence: "TNF-alpha binding to TNFR1 activates the IKK complex, which phosphorylates IkB, leading to its degradation and the release of active NF-kB."
  },
  {
    id: "EDGE:STAT3_JAKSTAT_PW",
    source: "TARGET:STAT3",
    target: "PW:JAK_STAT",
    type: "member_of",
    confidence: 1.0,
    publications: [],
    evidence: "STAT3 is a pivotal transcription factor executing the transcriptional response of the JAK-STAT pathway."
  },
  {
    id: "EDGE:JAK1_JAKSTAT_PW",
    source: "TARGET:JAK1",
    target: "PW:JAK_STAT",
    type: "member_of",
    confidence: 1.0,
    publications: [],
    evidence: "JAK1 is a ubiquitous receptor-associated tyrosine kinase in the JAK-STAT pathway."
  },
  {
    id: "EDGE:JAK3_JAKSTAT_PW",
    source: "TARGET:JAK3",
    target: "PW:JAK_STAT",
    type: "member_of",
    confidence: 1.0,
    publications: [],
    evidence: "JAK3 is a lymphoid-restricted kinase executing common-gamma cytokine signaling in the JAK-STAT pathway."
  },
  {
    id: "EDGE:TNF_TNFPW",
    source: "TARGET:TNF",
    target: "PW:TNF_SIGNALING",
    type: "member_of",
    confidence: 1.0,
    publications: [],
    evidence: "TNF-alpha is the initiating cytokine ligand of the TNF signaling pathway."
  },
  {
    id: "EDGE:NFKB_NFKBPW",
    source: "TARGET:NFKB1",
    target: "PW:NFKB_SIGNALING",
    type: "member_of",
    confidence: 1.0,
    publications: [],
    evidence: "NF-kB is the downstream effector transcription factor of the NF-kB signaling pathway."
  },
  {
    id: "EDGE:TNFPW_NFKB",
    source: "PW:TNF_SIGNALING",
    target: "TARGET:NFKB1",
    type: "activates",
    confidence: 0.95,
    publications: [],
    evidence: "The TNF-alpha pathway converges on the IKK complex, directly activating NF-kB."
  },
  {
    id: "EDGE:NFKBPW_IL6",
    source: "PW:NFKB_SIGNALING",
    target: "TARGET:IL6",
    type: "upregulates",
    confidence: 0.9,
    publications: ["PMID:9828114"],
    evidence: "NF-kB binds to the promoter region of the IL-6 gene, strongly upregulating its transcription during inflammation."
  },
  {
    id: "EDGE:JAKSTAT_PW_IL17A",
    source: "PW:JAK_STAT",
    target: "TARGET:IL17A",
    type: "upregulates",
    confidence: 0.85,
    publications: ["PMID:17947670"],
    evidence: "JAK-STAT signaling (specifically IL-23-induced STAT3 phosphorylation) drives differentiation of pro-inflammatory Th17 cells producing IL-17A."
  },
  {
    id: "EDGE:IL17A_NFKB",
    source: "TARGET:IL17A",
    target: "TARGET:NFKB1",
    type: "activates",
    confidence: 0.9,
    publications: ["PMID:11418647"],
    evidence: "IL-17A binds to IL-17RA/RC, recruiting Act1 and TRAF6 to activate the NF-kB signaling cascade."
  },
  {
    id: "EDGE:NFKBPW_RA",
    source: "PW:NFKB_SIGNALING",
    target: "DISEASE:RHEUMATOID_ARTHRITIS",
    type: "associated_with",
    confidence: 0.95,
    publications: ["PMID:11689228"],
    evidence: "Active NF-kB drives synoviocyte survival and production of matrix metalloproteinases, leading to joint destruction in RA."
  },
  {
    id: "EDGE:NFKBPW_CD",
    source: "PW:NFKB_SIGNALING",
    target: "DISEASE:CROHNS_DISEASE",
    type: "associated_with",
    confidence: 0.9,
    publications: ["PMID:10562231"],
    evidence: "Mucosal NF-kB activity is significantly elevated in Crohn's patients, driving chronic bowel wall inflammation."
  },
  {
    id: "EDGE:NFKBPW_UC",
    source: "PW:NFKB_SIGNALING",
    target: "DISEASE:ULCERATIVE_COLITIS",
    type: "associated_with",
    confidence: 0.9,
    publications: [],
    evidence: "NF-kB activation drives epithelial cell death and chemokine secretion, resulting in colon ulceration."
  },
  {
    id: "EDGE:IL17A_PSORIASIS",
    source: "TARGET:IL17A",
    target: "DISEASE:PSORIASIS",
    type: "associated_with",
    confidence: 0.95,
    publications: ["PMID:23727821"],
    evidence: "IL-17A acts directly on epidermal keratinocytes to induce hyperplasia, chemokine release, and neutrophil recruitment in psoriasis."
  },

  // --- NEUROLOGY EDGES ---
  {
    id: "EDGE:DONEPEZIL_ACHE",
    source: "CHEMBL_DONEPEZIL",
    target: "TARGET:ACHE",
    type: "inhibits",
    confidence: 1.0,
    publications: ["PMID:9272825", "PMID:10338102"],
    evidence: "Donepezil binds reversibly to acetylcholinesterase, inhibiting acetylcholine hydrolysis and increasing its synaptic concentration."
  },
  {
    id: "EDGE:MEMANTINE_NMDAR",
    source: "CHEMBL_MEMANTINE",
    target: "TARGET:GRIN1",
    type: "inhibits",
    confidence: 1.0,
    publications: ["PMID:10499644", "PMID:12488820"],
    evidence: "Memantine is an uncompetitive NMDA receptor antagonist that binds to the channel pore, preventing pathological levels of glutamate influx."
  },
  {
    id: "EDGE:LECANEMAB_APP",
    source: "CHEMBL_LECANEMAB",
    target: "TARGET:APP",
    type: "inhibits",
    confidence: 0.95,
    publications: ["PMID:36449137", "PMID:37075306"],
    evidence: "Lecanemab binds selectively to soluble amyloid-beta protofibrils (derived from APP cleavage), accelerating clearance and preventing plaque deposition."
  },
  {
    id: "EDGE:SELEGILINE_MAOB",
    source: "CHEMBL_SELEGILINE",
    target: "TARGET:MAOB",
    type: "inhibits",
    confidence: 1.0,
    publications: ["PMID:7918118", "PMID:8192348"],
    evidence: "Selegiline is an irreversible MAO-B inhibitor that prevents dopamine metabolism in the striatum, amplifying dopamine signals."
  },
  {
    id: "EDGE:LDOPA_DRD2",
    source: "CHEMBL_L_DOPA",
    target: "TARGET:DRD2",
    type: "activates",
    confidence: 0.95,
    publications: ["PMID:11728294"],
    evidence: "Levodopa is converted to dopamine by aromatic L-amino acid decarboxylase, which then binds and activates postsynaptic D2 receptors."
  },
  {
    id: "EDGE:BACE1_APP",
    source: "TARGET:BACE1",
    target: "TARGET:APP",
    type: "modulates",
    confidence: 1.0,
    publications: ["PMID:10506556"],
    evidence: "BACE1 cleaves APP at the beta-site (Asp672), releasing soluble APP-beta and generating the C99 fragment, which is cleaved by gamma-secretase to produce amyloid-beta."
  },
  {
    id: "EDGE:APP_AMYLOIDPW",
    source: "TARGET:APP",
    target: "PW:AMYLOID_FIBRIL",
    type: "member_of",
    confidence: 1.0,
    publications: [],
    evidence: "APP is the parent substrate whose processing initiates the amyloid cascade."
  },
  {
    id: "EDGE:BACE1_AMYLOIDPW",
    source: "TARGET:BACE1",
    target: "PW:AMYLOID_FIBRIL",
    type: "member_of",
    confidence: 0.95,
    publications: [],
    evidence: "BACE1 acts as the rate-limiting enzyme initiating the amyloidogenic pathway."
  },
  {
    id: "EDGE:AMYLOIDPW_SYNAPTIC",
    source: "PW:AMYLOID_FIBRIL",
    target: "PHENOTYPE:SYNAPTIC_DYSFUNCTION",
    type: "upregulates",
    confidence: 0.9,
    publications: ["PMID:12048424", "PMID:17008310"],
    evidence: "Soluble amyloid-beta oligomers bind to synaptic receptors, causing long-term potentiation (LTP) impairment and synapse loss."
  },
  {
    id: "EDGE:ACHE_SYNAPTIC",
    source: "TARGET:ACHE",
    target: "PHENOTYPE:SYNAPTIC_DYSFUNCTION",
    type: "upregulates",
    confidence: 0.85,
    publications: [],
    evidence: "Excessive AChE activity rapidly depletes synaptic acetylcholine, causing cholinergic transmission failure."
  },
  {
    id: "EDGE:NMDAR_SYNAPTIC",
    source: "TARGET:GRIN1",
    target: "PHENOTYPE:SYNAPTIC_DYSFUNCTION",
    type: "upregulates",
    confidence: 0.9,
    publications: ["PMID:11918664"],
    evidence: "Chronic, low-level NMDA receptor activation by excess glutamate mediates calcium excitotoxicity, driving synaptic pruning."
  },
  {
    id: "EDGE:SYNAPTIC_ALZHEIMERS",
    source: "PHENOTYPE:SYNAPTIC_DYSFUNCTION",
    target: "DISEASE:ALZHEIMERS",
    type: "associated_with",
    confidence: 0.95,
    publications: [],
    evidence: "Synaptic loss is the strongest pathological correlate of cognitive decline and memory impairment in Alzheimer's patients."
  },
  {
    id: "EDGE:AMYLOIDPW_NEUROINFLAM",
    source: "PW:AMYLOID_FIBRIL",
    target: "PHENOTYPE:NEUROINFLAMMATION",
    type: "upregulates",
    confidence: 0.9,
    publications: ["PMID:11520919"],
    evidence: "Fibrillar amyloid-beta plaques bind to microglia scavenger receptors, activating NLRP3 inflammasomes and triggering cytokine release."
  },
  {
    id: "EDGE:MAPT_ALZHEIMERS",
    source: "TARGET:MAPT",
    target: "DISEASE:ALZHEIMERS",
    type: "associated_with",
    confidence: 0.95,
    publications: ["PMID:15064716"],
    evidence: "Hyperphosphorylated Tau aggregates into intracellular neurofibrillary tangles, leading to microtubule disintegration and neuronal death."
  },
  {
    id: "EDGE:NEUROINFLAM_ALZHEIMERS",
    source: "PHENOTYPE:NEUROINFLAMMATION",
    target: "DISEASE:ALZHEIMERS",
    type: "associated_with",
    confidence: 0.85,
    publications: [],
    evidence: "Chronic microglial activation releases neurotoxic cytokines and nitric oxide, accelerating neuronal loss in AD."
  },
  {
    id: "EDGE:SNCA_NEUROINFLAM",
    source: "TARGET:SNCA",
    target: "PHENOTYPE:NEUROINFLAMMATION",
    type: "upregulates",
    confidence: 0.85,
    publications: ["PMID:19383612"],
    evidence: "Aggregated alpha-synuclein released from damaged neurons acts as a damage-associated molecular pattern (DAMP) to activate microglia."
  },
  {
    id: "EDGE:MAOB_DOPAMINE_METABOLISM",
    source: "TARGET:MAOB",
    target: "PW:DOPAMINERGIC_TRANSMISSION",
    type: "downregulates",
    confidence: 0.95,
    publications: ["PMID:8243160"],
    evidence: "MAO-B metabolizes synaptic dopamine to DOPAC and hydrogen peroxide, depleting the dopaminergic neurotransmitter pool."
  },
  {
    id: "EDGE:DRD2_DOPAMINEPW",
    source: "TARGET:DRD2",
    target: "PW:DOPAMINERGIC_TRANSMISSION",
    type: "member_of",
    confidence: 1.0,
    publications: [],
    evidence: "DRD2 is a primary postsynaptic receptor mediating inhibitory dopaminergic transmission in the striatum."
  },
  {
    id: "EDGE:DOPAMINEPW_PARKINSONS",
    source: "PW:DOPAMINERGIC_TRANSMISSION",
    target: "DISEASE:PARKINSONS",
    type: "associated_with",
    confidence: 0.95,
    publications: [],
    evidence: "Degeneration of the nigrostriatal dopaminergic pathway causes a critical dopamine deficit, driving the motor symptoms of Parkinson's."
  },
  {
    id: "EDGE:SNCA_PARKINSONS",
    source: "TARGET:SNCA",
    target: "DISEASE:PARKINSONS",
    type: "associated_with",
    confidence: 0.95,
    publications: ["PMID:9828114"],
    evidence: "Misfolded alpha-synuclein aggregates into Lewy Bodies, causing selective toxicity to dopaminergic neurons."
  },

  // --- CARDIOVASCULAR EDGES ---
  {
    id: "EDGE:LISINOPRIL_ACE",
    source: "CHEMBL_LISINOPRIL",
    target: "TARGET:ACE",
    type: "inhibits",
    confidence: 1.0,
    publications: ["PMID:6339001", "PMID:8482438"],
    evidence: "Lisinopril binds competitively to the active site zinc ion of ACE, preventing conversion of Angiotensin I to Angiotensin II."
  },
  {
    id: "EDGE:METOPROLOL_ADRB1",
    source: "CHEMBL_METOPROLOL",
    target: "TARGET:ADRB1",
    type: "inhibits",
    confidence: 1.0,
    publications: ["PMID:6120221", "PMID:7828479"],
    evidence: "Metoprolol is a highly selective beta-1 adrenergic receptor antagonist, blocking Gs-coupled signaling in cardiac tissue."
  },
  {
    id: "EDGE:ATORVASTATIN_HMGCR",
    source: "CHEMBL_ATORVASTATIN",
    target: "TARGET:HMGCR",
    type: "inhibits",
    confidence: 1.0,
    publications: ["PMID:9098877", "PMID:11596853"],
    evidence: "Atorvastatin competitively inhibits HMGCR by mimicking the HMG substrate, preventing cholesterol biosynthesis."
  },
  {
    id: "EDGE:EMPAGLIFLOZIN_SGLT2",
    source: "CHEMBL_EMPAGLIFLOZIN",
    target: "TARGET:SLC5A2",
    type: "inhibits",
    confidence: 1.0,
    publications: ["PMID:22440381", "PMID:24434231"],
    evidence: "Empagliflozin selectively inhibits SGLT2 in the renal proximal tubules, blocking glucose reabsorption and promoting urinary glucose excretion."
  },
  {
    id: "EDGE:ACE_RASPW",
    source: "TARGET:ACE",
    target: "PW:RAS_SYSTEM",
    type: "member_of",
    confidence: 1.0,
    publications: [],
    evidence: "ACE is a central regulatory carboxypeptidase in the Renin-Angiotensin cascade."
  },
  {
    id: "EDGE:AGTR1_RASPW",
    source: "TARGET:AGTR1",
    target: "PW:RAS_SYSTEM",
    type: "member_of",
    confidence: 1.0,
    publications: [],
    evidence: "AT1 Receptor is the primary GPCR mediating vasoconstrictive and hypertrophic effects of the RAAS pathway."
  },
  {
    id: "EDGE:ACE_AGTR1",
    source: "TARGET:ACE",
    target: "TARGET:AGTR1",
    type: "activates",
    confidence: 0.95,
    publications: [],
    evidence: "ACE generates Angiotensin II, which directly binds and activates the AT1 receptor."
  },
  {
    id: "EDGE:RASPW_VASOCONSTRICTION",
    source: "PW:RAS_SYSTEM",
    target: "PHENOTYPE:VASOCONSTRICTION",
    type: "upregulates",
    confidence: 0.95,
    publications: ["PMID:10222345"],
    evidence: "AT1 Receptor signaling activates PLC/IP3, releasing intracellular calcium and causing vascular smooth muscle contraction."
  },
  {
    id: "EDGE:VASOCONSTRICTION_HYPERTENSION",
    source: "PHENOTYPE:VASOCONSTRICTION",
    target: "DISEASE:HYPERTENSION",
    type: "associated_with",
    confidence: 0.95,
    publications: [],
    evidence: "Elevated systemic vascular resistance caused by vasoconstriction directly increases systolic and diastolic blood pressure."
  },
  {
    id: "EDGE:RASPW_REMODELING",
    source: "PW:RAS_SYSTEM",
    target: "PHENOTYPE:CARDIAC_REMODELING",
    type: "upregulates",
    confidence: 0.9,
    publications: ["PMID:11893322"],
    evidence: "Angiotensin II promotes cardiac fibroblast proliferation and collagen synthesis, leading to ventricular hypertrophy."
  },
  {
    id: "EDGE:REMODELING_HF",
    source: "PHENOTYPE:CARDIAC_REMODELING",
    target: "DISEASE:HEART_FAILURE",
    type: "associated_with",
    confidence: 0.95,
    publications: [],
    evidence: "Pathological ventricular hypertrophy and fibrosis result in diastolic dysfunction, eventually leading to clinical heart failure."
  },
  {
    id: "EDGE:ADRB1_ADR_PW",
    source: "TARGET:ADRB1",
    target: "PW:CATECHOLAMINE_RESPONSE",
    type: "member_of",
    confidence: 1.0,
    publications: [],
    evidence: "Beta-1 receptor is the principal mediator of sympathetic response in the myocardium."
  },
  {
    id: "EDGE:ADRPW_REMODELING",
    source: "PW:CATECHOLAMINE_RESPONSE",
    target: "PHENOTYPE:CARDIAC_REMODELING",
    type: "upregulates",
    confidence: 0.85,
    publications: ["PMID:10961934"],
    evidence: "Chronic catecholamine stimulation activates Gs/PKA signaling, inducing cardiomyocyte apoptosis and driving cardiac remodeling."
  },
  {
    id: "EDGE:HMGCR_CHOL_PW",
    source: "TARGET:HMGCR",
    target: "PW:CHOLESTEROL_METABOLISM",
    type: "member_of",
    confidence: 1.0,
    publications: [],
    evidence: "HMG-CoA reductase is the rate-limiting enzyme in the cholesterol synthesis pathway."
  },
  {
    id: "EDGE:CHOLPW_ATHERO",
    source: "PW:CHOLESTEROL_METABOLISM",
    target: "DISEASE:ATHEROSCLEROSIS",
    type: "associated_with",
    confidence: 0.95,
    publications: ["PMID:12459960"],
    evidence: "Excess LDL cholesterol particles penetrate the arterial endothelium, undergo oxidation, and recruit macrophages to form foam cells."
  },
  {
    id: "EDGE:SGLT2_GLUCOSE_METAB",
    source: "TARGET:SLC5A2",
    target: "PHENOTYPE:GLUCOSURIA",
    type: "upregulates",
    confidence: 1.0,
    publications: [],
    evidence: "SLC5A2 (SGLT2) handles ~90% of renal glucose reabsorption. Inhibiting it causes massive excretion of glucose into the urine."
  },
  {
    id: "EDGE:GLUCOSURIA_T2D",
    source: "PHENOTYPE:GLUCOSURIA",
    target: "DISEASE:TYPE2_DIABETES",
    type: "associated_with",
    confidence: 0.95,
    publications: ["PMID:24434231"],
    evidence: "Glucosuria (induced by SGLT2 inhibitors) successfully lowers HbA1c and improves insulin sensitivity in Type 2 Diabetes."
  },

  // --- CROSS-SYSTEM NOISE ELIMINATORS & NOVEL RECONCILIATIONS ---
  // Connect Metoprolol/ADRB1 to eNOS (NOS3) representing Metoprolol's indirect upregulation of endothelial NO (improving hypertension)
  {
    id: "EDGE:ADRB1_NOS3",
    source: "TARGET:ADRB1",
    target: "TARGET:NOS3",
    type: "modulates",
    confidence: 0.8,
    publications: ["PMID:16530121"],
    evidence: "Beta-1 blockade shifts adrenergic signaling, indirectly increasing eNOS phosphorylation and nitric oxide production in endothelium."
  },
  {
    id: "EDGE:NOS3_VASOCONSTRICTION",
    source: "TARGET:NOS3",
    target: "PHENOTYPE:VASOCONSTRICTION",
    type: "downregulates",
    confidence: 0.95,
    publications: ["PMID:10222345"],
    evidence: "eNOS synthesizes Nitric Oxide, which diffuses to vascular smooth muscle, activating guanylyl cyclase to induce vasodilation (countering vasoconstriction)."
  },
  // Connect STAT3 (Immune) to EGFR (Cancer) representing IL-6/JAK/STAT3 feedforward loop in lung cancer
  {
    id: "EDGE:EGFR_STAT3",
    source: "TARGET:EGFR",
    target: "TARGET:STAT3",
    type: "activates",
    confidence: 0.85,
    publications: ["PMID:12853564"],
    evidence: "EGFR signaling activates Src kinase, which directly phosphorylates STAT3 on Tyr705, bypassing JAK activation in lung cancer cells."
  },
  {
    id: "EDGE:STAT3_PROLIFERATION",
    source: "TARGET:STAT3",
    target: "PHENOTYPE:CELL_PROLIFERATION",
    type: "upregulates",
    confidence: 0.9,
    publications: ["PMID:15313886"],
    evidence: "STAT3 homodimers translocate to the nucleus and bind to the promoter of cyclin D1 and c-Myc, driving cell cycle progression."
  },
  // Connect TNF-alpha (Immune) to BACE1 (Alzheimer's) representing neuroinflammation driving amyloid pathology
  {
    id: "EDGE:TNF_BACE1",
    source: "TARGET:TNF",
    target: "TARGET:BACE1",
    type: "upregulates",
    confidence: 0.8,
    publications: ["PMID:18408224"],
    evidence: "TNF-alpha activates NF-kB, which directly binds to the promoter region of BACE1, increasing its expression and accelerating amyloid-beta production."
  },
  // Magnesium-Migraine Classic Swanson LBD Connections
  {
    id: "EDGE:MAGNESIUM_CALCIUM",
    source: "CHEMBL_MAGNESIUM",
    target: "CHEMBL_CALCIUM",
    type: "inhibits",
    confidence: 0.95,
    publications: ["PMID:324545"],
    evidence: "Magnesium acts as a physiological calcium antagonist, competing with calcium for binding sites on voltage-gated calcium channels and blocking calcium entry."
  },
  {
    id: "EDGE:CALCIUM_VASOCONSTRICTION",
    source: "CHEMBL_CALCIUM",
    target: "PHENOTYPE:VASOCONSTRICTION",
    type: "activates",
    confidence: 0.98,
    publications: ["PMID:462742"],
    evidence: "Intracellular calcium accumulation in vascular smooth muscle cells activates myosin light chain kinase, inducing vasoconstriction and arterial narrowing."
  },
  {
    id: "EDGE:VASOCONSTRICTION_MIGRAINE",
    source: "PHENOTYPE:VASOCONSTRICTION",
    target: "DISEASE:MIGRAINE",
    type: "associated_with",
    confidence: 0.90,
    publications: ["PMID:781290"],
    evidence: "Cortical spreading depression and initial localized vasoconstriction, followed by rebound vasodilation of cranial vessels, trigger the sensory pain cascade of migraine headache."
  }
];

// Graph lookup helper structures
export const nodeMap = new Map<string, BKGNode>(nodes.map(n => [n.id, n]));
export const adjacencyList = new Map<string, BKGEdge[]>();

// Initialize adjacency list
for (const edge of edges) {
  if (!adjacencyList.has(edge.source)) {
    adjacencyList.set(edge.source, []);
  }
  adjacencyList.get(edge.source)!.push(edge);
}
