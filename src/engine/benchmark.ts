import { searchPathsBatch } from './discoveryEngine';
import type { SearchOptions } from './discoveryEngine';
import { nodes } from '../data/knowledgeGraph';

async function runBenchmark() {
  console.log("=================================================");
  console.log("PROJECT EPISTEME: PATH TRAVERSAL BENCHMARK");
  console.log("=================================================");

  const defaultOptions: SearchOptions = {
    maxHops: 4,
    minClinicalValidity: 0.1,
    minEdgeConfidence: 0.1,
    minCvs: 0.01,
    disabledNodeIds: new Set<string>(),
    includedNodeTypes: new Set<any>(['compound', 'target', 'pathway', 'disease', 'phenotype'])
  };

  const sources = [
    "CHEMBL1201116", // Gefitinib
    "CHEMBL2103837", // Vemurafenib
    "CHEMBL1201584", // Adalimumab
    "CHEMBL_LISINOPRIL", // Lisinopril
    "CHEMBL_DONEPEZIL" // Donepezil
  ];

  const targets = [
    "DISEASE:NSCLC", // Non-Small Cell Lung Cancer
    "DISEASE:MELANOMA", // Melanoma
    "DISEASE:RHEUMATOID_ARTHRITIS", // Rheumatoid Arthritis
    "DISEASE:HYPERTENSION", // Hypertension
    "DISEASE:ALZHEIMERS" // Alzheimer's
  ];

  console.log(`Knowledge Graph Scale: ${nodes.length} nodes.`);
  console.log(`Running batch queries for ${sources.length} source compounds x ${targets.length} target diseases (${sources.length * targets.length} total pair permutations)...`);
  
  // Warmup run
  await searchPathsBatch(sources, targets, defaultOptions);

  // Measure execution
  const startTime = performance.now();
  const results = await searchPathsBatch(sources, targets, defaultOptions);
  const endTime = performance.now();

  const totalTimeMs = endTime - startTime;
  const avgTimePerPairMs = totalTimeMs / results.length;

  console.log("\nBENCHMARK RESULTS:");
  console.log(`- Total Batch Combinations Explored: ${results.length}`);
  console.log(`- Total Execution Latency: ${totalTimeMs.toFixed(4)} ms`);
  console.log(`- Average Latency Per Target Pair: ${avgTimePerPairMs.toFixed(4)} ms`);
  console.log(`- Meet Sub-Millisecond Constraint: ${totalTimeMs < 1.0 ? "YES (SUCCESS)" : "NO"}`);
  console.log("=================================================");

  // Display sample path
  const sample = results.find(r => r.paths.length > 0);
  if (sample) {
    console.log(`\nSample Path Discovered (${sample.sourceId} -> ${sample.targetId}):`);
    const path = sample.paths[0];
    const pathStr = path.nodes.map(n => n.name).join(" -> ");
    console.log(`Path: ${pathStr}`);
    console.log(`Cumulative Validity Score (CVS): ${path.cvs.toFixed(4)}`);
    console.log(`Publications: ${path.allPublications.length}`);
  }
}

runBenchmark().catch(console.error);
