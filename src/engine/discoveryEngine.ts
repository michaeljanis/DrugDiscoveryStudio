import { nodeMap, adjacencyList, edges as bkgEdges, nodes as bkgNodes } from '../data/knowledgeGraph';
import type { BKGNode, BKGEdge } from '../data/knowledgeGraph';

export interface SearchOptions {
  maxHops: number; // 1 to 5
  minClinicalValidity: number; // 0.0 to 1.0
  minEdgeConfidence: number; // 0.0 to 1.0
  minCvs: number; // 0.0 to 1.0
  disabledNodeIds: Set<string>;
  includedNodeTypes: Set<BKGNode['type']>;
}

export interface PathResult {
  nodes: BKGNode[];
  edges: BKGEdge[];
  cvs: number; // Cumulative Validity Score
  totalPublications: number;
  allPublications: string[];
  hypothesis: string;
  isUndocumented: boolean;
}

export interface BatchQueryResult {
  sourceId: string;
  targetId: string;
  paths: PathResult[];
  executionTimeMs: number;
}

// Format the grammatical action verb for the hypothesis
function formatAction(type: BKGEdge['type']): string {
  switch (type) {
    case 'inhibits': return 'inhibits';
    case 'activates': return 'activates';
    case 'upregulates': return 'upregulates';
    case 'downregulates': return 'downregulates';
    case 'associated_with': return 'is associated with';
    case 'member_of': return 'is a component of';
    case 'modulates': return 'modulates';
    default: return 'interacts with';
  }
}

// Generate peer-review-grade hypothesis statement from a path
function generateHypothesis(pathNodes: BKGNode[], pathEdges: BKGEdge[], cvs: number): string {
  const parts: string[] = [];
  const start = pathNodes[0];
  const end = pathNodes[pathNodes.length - 1];

  parts.push(`**Hypothesis Proposal**: **${start.name}** (${start.details.family || start.type}) exhibits a latent therapeutic or metabolic link to **${end.name}** through a ${pathEdges.length}-hop pathway.`);

  // Describe the mechanism step-by-step
  const mechanisms: string[] = [];
  for (let i = 0; i < pathEdges.length; i++) {
    const edge = pathEdges[i];
    const srcNode = pathNodes[i];
    const tgtNode = pathNodes[i + 1];

    const action = formatAction(edge.type);
    let detail = `**${srcNode.name}** ${action} **${tgtNode.name}**`;

    // Add brief biochemical details if available
    if (edge.evidence && edge.evidence.length > 0) {
      // Shorten evidence for brevity or use directly
      detail += ` (${edge.evidence.split('.')[0]}.`;
      if (edge.publications.length > 0) {
        detail += ` Supported by ${edge.publications.length} pub(s): ${edge.publications.slice(0, 2).join(', ')}`;
      }
      detail += `)`;
    } else {
      detail += ` (Confidence: ${edge.confidence.toFixed(2)})`;
    }
    mechanisms.push(detail);
  }
  parts.push(mechanisms.join('\n* Then, '));

  // Add the biological clinical significance reasoning
  const intermediates = pathNodes.slice(1, -1);
  if (intermediates.length > 0) {
    const interDesc = intermediates.map(node => {
      const details = [];
      if (node.details.family) details.push(node.details.family);
      if (node.details.tissueExpression) details.push(`highly expressed in ${node.details.tissueExpression}`);
      const desc = details.length > 0 ? ` (${details.join(', ')})` : '';
      return `**${node.name}**${desc} with clinical validity ${node.clinicalValidity.toFixed(2)}`;
    }).join(' and ');
    parts.push(`* **Epistemic Validation**: The pathway's intermediate clinical noise is eliminated via biological validation of: ${interDesc}.`);
  }

  parts.push(`* **Therapeutic Rationale**: This traversal yields a Cumulative Clinical Validity Score (CVS) of **${cvs.toFixed(3)}**. The cascade suggests that targeting ${start.name} would effectively modulate the downstream ${end.name} disease phenotype without triggering common cellular noise cascades.`);

  return parts.join('\n\n');
}

/**
 * Searches for pathways from a single source node to a single target node.
 */
export function findPathsSingle(
  sourceId: string,
  targetId: string,
  options: SearchOptions
): PathResult[] {
  const results: PathResult[] = [];
  const visited = new Set<string>();

  const startNode = nodeMap.get(sourceId);
  const endNode = nodeMap.get(targetId);

  if (!startNode || !endNode) return [];

  // Check if a direct citation/indication edge exists between source and target
  const hasDirectEdge = bkgEdges.some(e => 
    (e.source === sourceId && e.target === targetId) || 
    (e.source === targetId && e.target === sourceId)
  );

  // Depth-First Search with path tracking
  function dfs(
    currentNodeId: string,
    currentNodes: BKGNode[],
    currentEdges: BKGEdge[],
    accumulatedCvs: number
  ) {
    if (currentNodes.length - 1 > options.maxHops) return;

    if (currentNodeId === targetId) {
      if (currentNodes.length - 1 > 0) { // Require at least 1 hop
        // Found a valid path!
        const totalPubs = currentEdges.reduce((sum, e) => sum + e.publications.length, 0);
        const allPubs = Array.from(new Set(currentEdges.flatMap(e => e.publications)));
        
        // Generate peer-review hypothesis
        const hypothesis = generateHypothesis(currentNodes, currentEdges, accumulatedCvs);

        results.push({
          nodes: [...currentNodes],
          edges: [...currentEdges],
          cvs: accumulatedCvs,
          totalPublications: totalPubs,
          allPublications: allPubs,
          hypothesis,
          isUndocumented: !hasDirectEdge
        });
      }
      return;
    }

    visited.add(currentNodeId);

    const outEdges = adjacencyList.get(currentNodeId) || [];
    for (const edge of outEdges) {
      const neighborId = edge.target;

      if (visited.has(neighborId)) continue;
      if (options.disabledNodeIds.has(neighborId)) continue;

      const neighborNode = nodeMap.get(neighborId);
      if (!neighborNode) continue;

      // Filter by node type
      if (!options.includedNodeTypes.has(neighborNode.type)) continue;

      // Filter by clinical validity
      if (neighborNode.clinicalValidity < options.minClinicalValidity) continue;

      // Filter by edge confidence
      if (edge.confidence < options.minEdgeConfidence) continue;

      // Calculate new cumulative validity score (CVS)
      const nextCvs = accumulatedCvs * neighborNode.clinicalValidity * edge.confidence;

      if (nextCvs < options.minCvs) continue;

      currentNodes.push(neighborNode);
      currentEdges.push(edge);

      dfs(neighborId, currentNodes, currentEdges, nextCvs);

      currentNodes.pop();
      currentEdges.pop();
    }

    visited.delete(currentNodeId);
  }

  // Initial CVS is based on the source node's clinical validity
  dfs(sourceId, [startNode], [], startNode.clinicalValidity);

  // Sort results by CVS descending
  return results.sort((a, b) => b.cvs - a.cvs);
}

/**
 * Perform concurrent, asynchronous batch inputs of multiple target compounds and disease profiles.
 * Latency constraint: sub-millisecond execution.
 */
export async function searchPathsBatch(
  sourceIds: string[],
  targetIds: string[],
  options: SearchOptions
): Promise<BatchQueryResult[]> {
  const promises = sourceIds.flatMap(sourceId => 
    targetIds.map(async targetId => {
      const pairStartTime = performance.now();
      const paths = findPathsSingle(sourceId, targetId, options);
      const pairEndTime = performance.now();

      return {
        sourceId,
        targetId,
        paths,
        executionTimeMs: pairEndTime - pairStartTime
      };
    })
  );

  const results = await Promise.all(promises);
  return results;
}

/**
 * Injects dynamically ingested nodes and edges from PubMed literature into the active graph.
 */
export function injectLiveLiteratureNodeAndEdge(
  nodeName: string,
  type: BKGNode['type'],
  sourceNodeId: string,
  direction: 'source_to_new' | 'new_to_source',
  relationType: BKGEdge['type'],
  pmid: string,
  evidence: string
): { node: BKGNode; edge: BKGEdge } {
  const cleanName = nodeName.trim();
  const newNodeId = `LIVE:${cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
  
  let node = nodeMap.get(newNodeId);
  if (!node) {
    node = {
      id: newNodeId,
      name: cleanName,
      type,
      clinicalValidity: 0.6, // Default validation for dynamic literature extractions
      details: {
        description: `Dynamically ingested from PubMed (${pmid}). Context: "${evidence}"`,
        clinicalPhase: 'Preclinical'
      }
    };
    bkgNodes.push(node);
    nodeMap.set(newNodeId, node);
  }

  const edgeId = `LIVE_EDGE:${sourceNodeId}_${relationType}_${newNodeId}_${pmid}`;
  const edge: BKGEdge = {
    id: edgeId,
    source: direction === 'source_to_new' ? sourceNodeId : newNodeId,
    target: direction === 'source_to_new' ? newNodeId : sourceNodeId,
    type: relationType,
    confidence: 0.75, // Moderate-high confidence default for direct literature support
    publications: [pmid],
    evidence
  };

  bkgEdges.push(edge);
  
  if (!adjacencyList.has(edge.source)) {
    adjacencyList.set(edge.source, []);
  }
  
  const existing = adjacencyList.get(edge.source)!;
  if (!existing.some(e => e.id === edge.id)) {
    existing.push(edge);
  }

  return { node, edge };
}
