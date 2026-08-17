/**
 * Project Episteme: Live Biological & Literature API Services
 */

export interface LivePubMedArticle {
  pmid: string;
  title: string;
  source: string;
  pubDate: string;
  authors: string;
}

export interface LiveChEMBLData {
  chemblId: string;
  prefName: string;
  structureSMILES?: string;
  maxPhase?: number;
  moleculeType?: string;
  therapeuticClass?: string;
}

export interface LiveOpenTargetsData {
  symbol: string;
  approvedName: string;
  targetClass?: string;
  tractability?: Array<{ id: string; modality: string; value: boolean }>;
}

// Queue to serialize NCBI requests and enforce a delay between them
let ncbiRequestQueue: Promise<any> = Promise.resolve();

async function enqueueNCBIRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  const result = ncbiRequestQueue.then(async () => {
    // Enforce a minimum delay of 350ms between NCBI requests to stay below 3 req/sec limit
    await new Promise(resolve => setTimeout(resolve, 350));
    return requestFn();
  });
  // Catch errors to ensure the queue continues processing subsequent requests
  ncbiRequestQueue = result.catch(() => {});
  return result;
}

/**
 * Performs fetch to NCBI with rate-limiting and automatic retries on 429 rate limit errors.
 */
async function fetchNCBI(url: string, retries = 3, delayMs = 1000): Promise<Response> {
  return enqueueNCBIRequest(async () => {
    try {
      const res = await fetch(url);
      if (res.status === 429 && retries > 0) {
        console.warn(`NCBI rate limit (429) hit, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return fetchNCBI(url, retries - 1, delayMs * 2);
      }
      return res;
    } catch (error) {
      if (retries > 0) {
        console.warn(`NCBI fetch failed, retrying in ${delayMs}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return fetchNCBI(url, retries - 1, delayMs * 2);
      }
      throw error;
    }
  });
}

/**
 * Queries PubMed (NCBI Entrez) for articles matching a search query.
 */
export async function searchPubMedArticles(query: string): Promise<LivePubMedArticle[]> {
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=5`;
    const searchRes = await fetchNCBI(searchUrl);
    if (!searchRes.ok) throw new Error(`PubMed Search HTTP error: ${searchRes.status}`);
    
    const searchData = await searchRes.json();
    const idList: string[] = searchData.esearchresult?.idlist || [];
    
    if (idList.length === 0) return [];
    
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(',')}&retmode=json`;
    const summaryRes = await fetchNCBI(summaryUrl);
    if (!summaryRes.ok) throw new Error(`PubMed Summary HTTP error: ${summaryRes.status}`);
    
    const summaryData = await summaryRes.json();
    const results = summaryData.result || {};
    
    return idList.map(id => {
      const article = results[id] || {};
      const authorsList: any[] = article.authors || [];
      const authorStr = authorsList.slice(0, 3).map(a => a.name).join(', ') + (authorsList.length > 3 ? ', et al.' : '');
      
      return {
        pmid: `PMID:${id}`,
        title: article.title || 'Untitled Article',
        source: article.source || 'PubMed Central',
        pubDate: article.pubdate || 'N/A',
        authors: authorStr || 'Unknown Authors'
      };
    });
  } catch (error) {
    console.error("Failed to fetch PubMed articles:", error);
    return [];
  }
}

/**
 * Queries the ChEMBL API for molecule details.
 */
export async function fetchChEMBLMolecule(chemblId: string): Promise<LiveChEMBLData | null> {
  try {
    // Strip prefixes just in case
    const cleanId = chemblId.trim().toUpperCase();
    const url = `https://www.ebi.ac.uk/chembl/api/data/molecule/${cleanId}.json`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`ChEMBL API HTTP error: ${response.status}`);
    
    const data = await response.json();
    if (!data) return null;
    
    return {
      chemblId: data.molecule_chembl_id || cleanId,
      prefName: data.pref_name || 'N/A',
      structureSMILES: data.molecule_structures?.canonical_smiles || undefined,
      maxPhase: data.max_phase !== null ? parseInt(data.max_phase) : undefined,
      moleculeType: data.molecule_type || 'N/A',
      therapeuticClass: data.development_phase_indications?.[0]?.mesh_heading || undefined
    };
  } catch (error) {
    console.error(`Failed to fetch ChEMBL details for ${chemblId}:`, error);
    return null;
  }
}

/**
 * Searches ChEMBL API by molecule name.
 */
export async function searchChEMBLMolecule(term: string): Promise<LiveChEMBLData | null> {
  try {
    const url = `https://www.ebi.ac.uk/chembl/api/data/molecule/search?q=${encodeURIComponent(term)}&format=json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`ChEMBL API HTTP error: ${response.status}`);
    const data = await response.json();
    const molecules = data.molecules || [];
    if (molecules.length === 0) return null;
    
    const bestMatch = molecules.find((m: any) => m.pref_name && m.pref_name.toLowerCase() === term.toLowerCase()) || molecules[0];
    
    return {
      chemblId: bestMatch.molecule_chembl_id,
      prefName: bestMatch.pref_name || 'N/A',
      structureSMILES: bestMatch.molecule_structures?.canonical_smiles || undefined,
      maxPhase: bestMatch.max_phase !== null ? parseInt(bestMatch.max_phase) : undefined,
      moleculeType: bestMatch.molecule_type || 'N/A',
      therapeuticClass: bestMatch.development_phase_indications?.[0]?.mesh_heading || undefined
    };
  } catch (error) {
    console.error(`Failed to search ChEMBL for ${term}:`, error);
    return null;
  }
}

/**
 * Queries Open Targets Platform GraphQL API for gene/target properties.
 */
export async function fetchOpenTargetsTarget(symbol: string): Promise<LiveOpenTargetsData | null> {
  const query = `
    query target($symbol: String!) {
      target(approvedSymbol: $symbol) {
        id
        approvedName
        targetClass {
          label
        }
        tractability {
          id
          modality
          value
        }
      }
    }
  `;

  try {
    const url = 'https://api.platform.opentargets.org/api/v4/graphql';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { symbol } })
    });
    
    if (!response.ok) throw new Error(`Open Targets HTTP error: ${response.status}`);
    
    const resBody = await response.json();
    const target = resBody.data?.target;
    if (!target) return null;

    const rawTractability: any[] = target.tractability || [];
    const tractability = rawTractability
      .filter((t: any) => t.value === true)
      .map((t: any) => ({
        id: t.id,
        modality: t.modality,
        value: t.value
      }));

    return {
      symbol,
      approvedName: target.approvedName || 'N/A',
      targetClass: target.targetClass?.label || undefined,
      tractability
    };
  } catch (error) {
    console.error(`Failed to fetch Open Targets details for ${symbol}:`, error);
    return null;
  }
}

/**
 * Searches PubMed for the given term and returns up to 30 article titles.
 */
export async function fetchTitlesForTerm(term: string): Promise<string[]> {
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmode=json&retmax=150`;
    const searchRes = await fetchNCBI(searchUrl);
    if (!searchRes.ok) throw new Error(`PubMed Search HTTP error: ${searchRes.status}`);
    
    const searchData = await searchRes.json();
    const idList: string[] = searchData.esearchresult?.idlist || [];
    
    if (idList.length === 0) return [];
    
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(',')}&retmode=json`;
    const summaryRes = await fetchNCBI(summaryUrl);
    if (!summaryRes.ok) throw new Error(`PubMed Summary HTTP error: ${summaryRes.status}`);
    
    const summaryData = await summaryRes.json();
    const results = summaryData.result || {};
    
    return idList.map(id => (results[id]?.title || '').trim()).filter(Boolean);
  } catch (error) {
    console.error(`Failed to fetch titles for term ${term}:`, error);
    return [];
  }
}

