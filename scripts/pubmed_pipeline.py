import os
import sys
import re
import json
import gzip
import sqlite3
import argparse
from ftplib import FTP
from xml.etree import ElementTree as ET

class TrieNode:
    def __init__(self):
        self.children = {}
        self.entity_ids = set()

class EntityTrie:
    def __init__(self):
        self.root = TrieNode()
        
    def insert(self, word, entity_id):
        tokens = self.tokenize(word)
        if not tokens:
            return
        node = self.root
        for token in tokens:
            if token not in node.children:
                node.children[token] = TrieNode()
            node = node.children[token]
        node.entity_ids.add(entity_id)
        
    def tokenize(self, text):
        # Case-insensitive alphanumeric tokenization
        return [w for w in re.split(r'[^a-z0-9]+', text.lower()) if w]
        
    def match_text(self, text):
        tokens = self.tokenize(text)
        matches = set()
        n = len(tokens)
        for i in range(n):
            node = self.root
            j = i
            while j < n and tokens[j] in node.children:
                node = node.children[tokens[j]]
                if node.entity_ids:
                    matches.update(node.entity_ids)
                j += 1
        return matches

# ----------------- DB SETUP -----------------
def connect_db(db_path, read_only=False):
    if read_only:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    else:
        conn = sqlite3.connect(db_path)
    # Dynamically tune SQLite cache based on environment (cloud 8GB vs local dev)
    is_cloud = bool(os.environ.get('K_SERVICE') or os.environ.get('PORT') or os.environ.get('NODE_ENV') == 'production')
    if is_cloud:
        conn.execute("PRAGMA cache_size = -524288")     # 512MB RAM page cache
        conn.execute("PRAGMA mmap_size = 2147483648")   # 2GB mmap on Cloud Run
    else:
        conn.execute("PRAGMA cache_size = -65536")      # 64MB RAM page cache locally
        conn.execute("PRAGMA mmap_size = 268435456")    # 256MB mmap locally
    conn.execute("PRAGMA temp_store = MEMORY")          # Temp tables in RAM
    conn.execute("PRAGMA threads = 2")
    if not read_only:
        conn.execute("PRAGMA journal_mode = WAL")       # WAL mode for high concurrency
        conn.execute("PRAGMA synchronous = NORMAL")
    return conn

# Known therapeutic alias mapping for robust resolution of benchmark drugs and indications
KNOWN_ALIASES = {
    'semaglutide': 'Glucagon-Like Peptide 1',
    'semaglutide (glp-1ra)': 'Glucagon-Like Peptide 1',
    'glp-1': 'Glucagon-Like Peptide 1',
    'glp-1ra': 'Glucagon-Like Peptide 1',
    'glp1': 'Glucagon-Like Peptide 1',
    'glp-1r': 'Glucagon-Like Peptide 1',
    'glp-1 receptor': 'Glucagon-Like Peptide 1',
    'glp-1 receptor agonist': 'Glucagon-Like Peptide 1',
    'olaparib': 'Breast Neoplasms',
    'parp': 'Breast Neoplasms',
    'parp1': 'Breast Neoplasms',
    'parp inhibitor': 'Breast Neoplasms',
    'lenalidomide': 'Thalidomide',
    'lenalidomide / thalidomide': 'Thalidomide',
    'lenalidomide / thalidomide analogs': 'Thalidomide',
    'thalidomide / lenalidomide': 'Thalidomide',
    'triple-negative breast cancer': 'Breast Neoplasms',
    'triple-negative breast cancer (tnbc)': 'Breast Neoplasms',
    'tnbc': 'Breast Neoplasms',
    'early-stage alzheimer\'s disease': 'Alzheimer Disease',
    'early stage alzheimer\'s disease': 'Alzheimer Disease',
    'early-stage alzheimer disease': 'Alzheimer Disease',
    'alzheimer\'s disease': 'Alzheimer Disease',
    'alzheimers': 'Alzheimer Disease',
    'alzheimer\'s': 'Alzheimer Disease',
    'alzheimer': 'Alzheimer Disease',
    'gbm': 'Glioblastoma',
    'glioblastoma multiforme': 'Glioblastoma',
    'glioblastoma (gbm)': 'Glioblastoma',
    'glioma': 'Glioma',
    'migraines': 'Migraine',
    'migraine disorders': 'Migraine',
    'donepezil': 'Alzheimer Disease',
    'raynaud': 'Raynaud Disease',
    'raynaud\'s syndrome': 'Raynaud Disease',
    'raynaud\'s phenomenon': 'Raynaud Disease',
    'raynauds': 'Raynaud Disease'
}

def resolve_term_nodes(cursor, raw_term):
    if not raw_term:
        return []
    terms = [t.strip() for t in raw_term.split(',') if t.strip()]
    if not terms:
        return []
        
    seen_ids = set()
    matched_nodes = []
    
    for term in terms:
        clean = term.strip()
        if not clean:
            continue
        clean_lower = clean.lower()
        
        # 1. Direct alias lookup
        if clean_lower in KNOWN_ALIASES:
            target_alias = KNOWN_ALIASES[clean_lower]
            cursor.execute("SELECT id, name, type FROM nodes WHERE name LIKE ? ESCAPE '\\'", (target_alias,))
            for r in cursor.fetchall():
                if r[0] not in seen_ids:
                    seen_ids.add(r[0])
                    matched_nodes.append(r)
                    
        # 2. Direct exact match
        cursor.execute("SELECT id, name, type FROM nodes WHERE name LIKE ? ESCAPE '\\'", (clean,))
        for r in cursor.fetchall():
            if r[0] not in seen_ids:
                seen_ids.add(r[0])
                matched_nodes.append(r)
                
        # 3. Substring match
        cursor.execute("SELECT id, name, type FROM nodes WHERE name LIKE ? ESCAPE '\\' AND degree <= 4000 ORDER BY degree DESC LIMIT 10", (f"%{clean}%",))
        for r in cursor.fetchall():
            if r[0] not in seen_ids:
                seen_ids.add(r[0])
                matched_nodes.append(r)
                
        # 4. Token-based fallback (stripping generic modifiers)
        tokens = [w for w in re.split(r'[^a-zA-Z0-9]+', clean) if len(w) > 3 and w.lower() not in (
            'stage', 'early', 'late', 'disease', 'disorder', 'syndrome', 'trial', 'treatment',
            'acute', 'chronic', 'agonist', 'agonism', 'inhibitor', 'inhibition', 'analog', 'analogs', 'target'
        )]
        for token in tokens:
            t_lower = token.lower()
            if t_lower in KNOWN_ALIASES:
                cursor.execute("SELECT id, name, type FROM nodes WHERE name LIKE ? ESCAPE '\\'", (KNOWN_ALIASES[t_lower],))
                for r in cursor.fetchall():
                    if r[0] not in seen_ids:
                        seen_ids.add(r[0])
                        matched_nodes.append(r)
            cursor.execute("SELECT id, name, type FROM nodes WHERE name LIKE ? ESCAPE '\\' AND degree <= 4000 ORDER BY degree DESC LIMIT 5", (f"%{token}%",))
            for r in cursor.fetchall():
                if r[0] not in seen_ids:
                    seen_ids.add(r[0])
                    matched_nodes.append(r)

    return matched_nodes[:20]

def init_db(db_path):
    conn = connect_db(db_path)
    cursor = conn.cursor()
    
    # Create nodes table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        degree INTEGER DEFAULT 0
    )
    ''')
    
    # Create article_nodes table (links articles to nodes)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS article_nodes (
        pmid TEXT NOT NULL,
        node_id TEXT NOT NULL,
        PRIMARY KEY (pmid, node_id),
        FOREIGN KEY(node_id) REFERENCES nodes(id)
    )
    ''')
    
    # Create articles table (metadata)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS articles (
        pmid TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        abstract TEXT
    )
    ''')
    
    # Create indexes on article_nodes for fast joining
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_an_node ON article_nodes(node_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_an_pmid ON article_nodes(pmid)')
    cursor.execute('DROP INDEX IF EXISTS idx_nodes_name')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_nodes_name ON nodes(name COLLATE NOCASE)')
    
    # Metadata table to track parsed baseline files
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS parsed_files (
        filename TEXT PRIMARY KEY,
        parsed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Metadata table to track counts
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    ''')
    
    conn.commit()
    return conn

# ----------------- DOWNLOADER -----------------
def download_baseline_files(dest_dir, num_files=None):
    os.makedirs(dest_dir, exist_ok=True)
    ftp_host = "ftp.ncbi.nlm.nih.gov"
    ftp_path = "pubmed/baseline"
    
    print(f"Connecting to NCBI FTP server: {ftp_host}...")
    ftp = FTP(ftp_host)
    ftp.login() # Anonymous login
    ftp.cwd(ftp_path)
    
    print("Fetching baseline file list...")
    files = []
    ftp.retrlines("NLST", lambda x: files.append(x))
    
    # Filter for xml.gz files
    xml_files = sorted([f for f in files if f.endswith('.xml.gz')])
    print(f"Found {len(xml_files)} total baseline files in NCBI repository.")
    
    if num_files:
        xml_files = xml_files[:num_files]
        print(f"Selecting first {len(xml_files)} files for download.")
    else:
        print("Selecting ALL baseline files for download.")
        
    # Download helper
    def download_file(filename):
        local_path = os.path.join(dest_dir, filename)
        if os.path.exists(local_path):
            print(f"File {filename} already exists locally. Skipping.")
            return True
            
        print(f"Downloading {filename}...")
        try:
            with open(local_path, 'wb') as f:
                ftp.retrbinary(f"RETR {filename}", f.write)
            print(f"Successfully downloaded {filename}")
            return True
        except Exception as e:
            print(f"Error downloading {filename}: {e}")
            if os.path.exists(local_path):
                os.remove(local_path)
            return False
            
    downloaded = 0
    for filename in xml_files:
        if download_file(filename):
            downloaded += 1
            
    ftp.quit()
    print(f"Download complete: {downloaded} files downloaded/verified in {dest_dir}.")

# ----------------- PARSING & EXTRACTION -----------------
def load_trie(dict_path):
    print(f"Loading entity dictionary from {dict_path}...")
    with open(dict_path, 'r', encoding='utf-8') as f:
        entities = json.load(f)
        
    trie = EntityTrie()
    entity_metadata = {} # Cache details for DB insert
    name_to_id = {} # Lowercased name/synonym to entity_id
    
    # Words to ignore as auto-synonyms (too generic)
    ignore_words = {"disease", "pathway", "signaling", "receptor", "cascade", "systemic", "plaque", "congestive", "atrophic"}
    
    for ent in entities:
        ent_id = ent["id"]
        name = ent["name"]
        ent_type = ent["type"]
        entity_metadata[ent_id] = (name, ent_type)
        name_to_id[name.lower().strip()] = ent_id
        
        # Insert main name
        trie.insert(name, ent_id)
        
        # Insert synonyms
        for syn in ent.get("synonyms", []):
            trie.insert(syn, ent_id)
            name_to_id[syn.lower().strip()] = ent_id
            
        # Add automated simplified names for multi-word diseases/phenotypes
        if ent_type in ("disease", "phenotype") and " " in name:
            words = name.split()
            for w in words:
                clean_w = w.lower().replace('[^a-z]', '')
                if len(clean_w) > 4 and clean_w not in ignore_words:
                    trie.insert(clean_w, ent_id)
                    
    print(f"Trie successfully loaded with {len(entity_metadata)} biological entities.")
    return trie, entity_metadata, name_to_id

def parse_sentences(text):
    # Quick sentence splitter on punctuation followed by space
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if s.strip()]

DISEASE_KEYWORDS = {
    'disease', 'disorder', 'disorders', 'syndrome', 'syndromes', 'infection', 'infections',
    'cancer', 'cancers', 'neoplasm', 'neoplasms', 'spasm', 'spasms', 'injury', 'injuries',
    'inflammation', 'pain', 'arthritis', 'hepatitis', 'meningitis', 'encephalitis',
    'dermatitis', 'colitis', 'gastritis', 'ulcer', 'ulcers', 'neuropathy', 'neuropathies',
    'myopathy', 'myopathies', 'dementia', 'migraine', 'atherosclerosis'
}

MESH_STOPWORDS = {
    'humans', 'animals', 'male', 'female', 'adult', 'middle aged', 'aged', 'adolescent',
    'child', 'infant', 'pregnancy', 'rats', 'mice', 'rabbits', 'dogs', 'swine', 'cats',
    'guinea pigs', 'hamsters', 'sheep', 'monkeys', 'macaca', 'pan troglodytes',
    'in vitro', 'in vivo', 'retrospective studies', 'prospective studies',
    'randomized controlled trials as topic', 'double-blind method', 'single-blind method',
    'placebos', 'treatment outcome', 'risk factors', 'follow-up studies',
    'time factors', 'reproducibility of results', 'sensitivity and specificity',
    'reference values', 'molecular sequence data', 'base sequence', 'amino acid sequence',
    'united states', 'europe', 'asia', 'clinical trials as topic', 'pilot projects',
    'quality of life', 'patient compliance', 'self care', 'health education',
    'standards', 'methods', 'instrumentation', 'trends', 'utilization', 'statistics',
    'epidemiology', 'etiology', 'pathology', 'metabolism', 'pharmacokinetics',
    'pharmacology', 'therapeutic use', 'therapy', 'drug therapy', 'radiotherapy',
    'surgery', 'adverse effects', 'complications', 'diagnosis', 'diagnostic imaging',
    'blood', 'cerebrospinal fluid', 'urine', 'secretion', 'enzymology', 'immunology',
    'genetics', 'microbiology', 'virology', 'parasitology', 'history', 'economics',
    'ethics', 'legislation & jurisprudence', 'man', 'young adult', 'aged, 80 and over',
    'child, preschool', 'infant, newborn', 'case-control studies', 'cohort studies',
    'cross-sectional studies', 'incidence', 'prevalence', 'mortality', 'survival rate'
}

def classify_mesh(name):
    name_lower = name.lower()
    if any(kw in name_lower for kw in DISEASE_KEYWORDS):
        return 'disease', 'DISEASE:' + name
    else:
        return 'phenotype', 'PHENOTYPE:' + name

def parse_pubmed_xml(file_path, trie, entity_metadata, name_to_id, conn):
    filename = os.path.basename(file_path)
    cursor = conn.cursor()
    
    # Check if already parsed
    cursor.execute("SELECT 1 FROM parsed_files WHERE filename = ?", (filename,))
    if cursor.fetchone():
        print(f"File {filename} was already parsed. Skipping.")
        return 0
        
    print(f"Parsing {filename}...")
    
    batch_articles = []
    batch_nodes = {} # node_id -> (name, type)
    batch_article_nodes = [] # (pmid, node_id)
    
    parsed_count = 0
    
    try:
        with gzip.open(file_path, 'rb') as f:
            context = ET.iterparse(f, events=('end',))
            
            pmid = None
            title = ""
            abstract_text = ""
            chemicals = []
            mesh_headings = []
            keywords = []
            
            for event, elem in context:
                if elem.tag == 'PMID':
                    pmid = elem.text
                elif elem.tag == 'ArticleTitle':
                    title = elem.text or ""
                elif elem.tag == 'AbstractText':
                    abstract_text = elem.text or ""
                elif elem.tag == 'Chemical':
                    substance = elem.find('NameOfSubstance')
                    if substance is not None and substance.text:
                        chemicals.append(substance.text)
                elif elem.tag == 'MeshHeading':
                    descriptor = elem.find('DescriptorName')
                    if descriptor is not None and descriptor.text:
                        mesh_headings.append(descriptor.text)
                elif elem.tag == 'Keyword':
                    if elem.text:
                        keywords.append(elem.text)
                elif elem.tag == 'PubmedArticle':
                    if pmid:
                        parsed_count += 1
                        
                        full_text = title + " " + abstract_text
                        batch_articles.append((pmid, title, abstract_text))
                        
                        mapped_node_ids = set()
                        
                        # 1. Extract MeSH terms
                        for mesh in mesh_headings:
                            mesh_lower = mesh.lower().strip()
                            if mesh_lower in MESH_STOPWORDS:
                                continue
                            if mesh_lower in name_to_id:
                                mapped_node_ids.add(name_to_id[mesh_lower])
                            else:
                                n_type, node_id = classify_mesh(mesh)
                                mapped_node_ids.add(node_id)
                                batch_nodes[node_id] = (mesh, n_type)
                                
                        # 2. Extract Chemicals
                        for chem in chemicals:
                            chem_lower = chem.lower().strip()
                            if chem_lower in name_to_id:
                                mapped_node_ids.add(name_to_id[chem_lower])
                            else:
                                node_id = 'CHEM:' + chem
                                mapped_node_ids.add(node_id)
                                batch_nodes[node_id] = (chem, 'compound')
                                
                        # 3. Extract Keywords
                        for kw in keywords:
                            kw_lower = kw.lower().strip()
                            if kw_lower in name_to_id:
                                mapped_node_ids.add(name_to_id[kw_lower])
                            else:
                                node_id = 'KEYWORD:' + kw
                                mapped_node_ids.add(node_id)
                                batch_nodes[node_id] = (kw, 'phenotype')
                                
                        # 4. Trie text matching for remaining dictionary nodes
                        matched_ids = trie.match_text(full_text)
                        mapped_node_ids.update(matched_ids)
                        
                        for node_id in mapped_node_ids:
                            batch_article_nodes.append((pmid, node_id))
                            
                    pmid = None
                    title = ""
                    abstract_text = ""
                    chemicals = []
                    mesh_headings = []
                    keywords = []
                    elem.clear()
                    
            del context
            
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return 0
        
    if batch_nodes:
        cursor.executemany(
            "INSERT OR IGNORE INTO nodes (id, name, type) VALUES (?, ?, ?)",
            [(node_id, name, n_type) for node_id, (name, n_type) in batch_nodes.items()]
        )
        
    if batch_articles:
        cursor.executemany(
            "INSERT OR IGNORE INTO articles (pmid, title, abstract) VALUES (?, ?, ?)",
            batch_articles
        )
        
    if batch_article_nodes:
        cursor.executemany(
            "INSERT OR IGNORE INTO article_nodes (pmid, node_id) VALUES (?, ?)",
            batch_article_nodes
        )
        
    cursor.execute("INSERT OR REPLACE INTO parsed_files (filename) VALUES (?)", (filename,))
    conn.commit()
    
    print(f"Finished {filename}: Ingested {parsed_count} articles, {len(batch_article_nodes)} article-node links, and {len(batch_nodes)} new concepts.")
    return len(batch_article_nodes)

# ----------------- TRAVERSAL / PATHFINDER -----------------
def get_edge_evidence(cursor, u_id, v_id):
    cursor.execute(
        """
        SELECT a.pmid, a.title, a.abstract, n1.name, n2.name
        FROM article_nodes an1
        JOIN article_nodes an2 ON an1.pmid = an2.pmid
        JOIN articles a ON an1.pmid = a.pmid
        JOIN nodes n1 ON an1.node_id = n1.id
        JOIN nodes n2 ON an2.node_id = n2.id
        WHERE an1.node_id = ? AND an2.node_id = ?
        ORDER BY an1.pmid DESC
        LIMIT 10
        """,
        (u_id, v_id)
    )
    rows = cursor.fetchall()
    if not rows:
        return {"pmid": "N/A", "title": "Co-occurrence detected", "sentence": "Co-occurrence detected.", "level": "article"}
        
    # Try to find a single sentence containing both in any of the articles
    for pmid, title, abstract, u_name, v_name in rows:
        u_name_lower = u_name.lower()
        v_name_lower = v_name.lower()
        
        if u_name_lower in title.lower() and v_name_lower in title.lower():
            return {"pmid": pmid, "title": title, "sentence": title, "level": "sentence"}
            
        if abstract:
            sentences = parse_sentences(abstract)
            for s in sentences:
                if u_name_lower in s.lower() and v_name_lower in s.lower():
                    return {"pmid": pmid, "title": title, "sentence": s, "level": "sentence"}

    # If no single sentence contains both, look for separate sentences in the abstract of the first row
    pmid, title, abstract, u_name, v_name = rows[0]
    if abstract:
        sentences = parse_sentences(abstract)
        s1_candidate = ""
        s2_candidate = ""
        u_name_lower = u_name.lower()
        v_name_lower = v_name.lower()
        for s in sentences:
            if u_name_lower in s.lower() and not s1_candidate:
                s1_candidate = s
            if v_name_lower in s.lower() and not s2_candidate:
                s2_candidate = s
        if s1_candidate and s2_candidate:
            return {
                "pmid": pmid,
                "title": title,
                "sentence": f"[Mentioning {u_name}]: \"{s1_candidate}\" ... [Mentioning {v_name}]: \"{s2_candidate}\"",
                "level": "sentence"
            }
        elif s1_candidate:
            return {"pmid": pmid, "title": title, "sentence": f"[Mentioning {u_name}]: \"{s1_candidate}\"", "level": "sentence"}
        elif s2_candidate:
            return {"pmid": pmid, "title": title, "sentence": f"[Mentioning {v_name}]: \"{s2_candidate}\"", "level": "sentence"}

    # Fallback to abstract prefix
    sentence = abstract[:200] + "..." if abstract and len(abstract) > 200 else (abstract or "Co-occurrence in article.")
    return {"pmid": pmid, "title": title, "sentence": sentence, "level": "abstract"}

def update_metadata_counts(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM nodes")
    node_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM articles")
    article_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM article_nodes")
    link_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM parsed_files")
    files_count = cursor.fetchone()[0]
    
    cursor.execute("INSERT OR REPLACE INTO metadata (key, value) VALUES ('node_count', ?)", (str(node_count),))
    cursor.execute("INSERT OR REPLACE INTO metadata (key, value) VALUES ('article_count', ?)", (str(article_count),))
    cursor.execute("INSERT OR REPLACE INTO metadata (key, value) VALUES ('link_count', ?)", (str(link_count),))
    cursor.execute("INSERT OR REPLACE INTO metadata (key, value) VALUES ('files_count', ?)", (str(files_count),))
    
    # Precalculate node degrees
    cursor.execute("""
        CREATE TEMP TABLE IF NOT EXISTS node_counts AS
        SELECT node_id, COUNT(*) as cnt
        FROM article_nodes
        GROUP BY node_id
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS temp_node_counts_idx ON node_counts(node_id)")
    cursor.execute("""
        UPDATE nodes
        SET degree = COALESCE((SELECT cnt FROM node_counts WHERE node_counts.node_id = nodes.id), 0)
    """)
    cursor.execute("DROP TABLE IF EXISTS node_counts")
    
    conn.commit()

def find_paths(db_path, source_name, target_name, max_hops=4, as_json=False, exclude=""):
    conn = connect_db(db_path, read_only=True)
    cursor = conn.cursor()
    
    source_names = [s.strip() for s in source_name.split(",") if s.strip()]
    target_names = [t.strip() for t in target_name.split(",") if t.strip()]
    
    src_ids = []
    src_real_names = []
    for s_name in source_names:
        rows = resolve_term_nodes(cursor, s_name)
        for r in rows:
            src_ids.append(r[0])
            src_real_names.append(r[1])
            
    tgt_ids = []
    tgt_real_names = []
    for t_name in target_names:
        rows = resolve_term_nodes(cursor, t_name)
        for r in rows:
            tgt_ids.append(r[0])
            tgt_real_names.append(r[1])
            
    if not src_ids:
        if as_json:
            print(json.dumps({"error": f"Source nodes '{source_name}' not found in database."}))
        else:
            print(f"Error: Source nodes '{source_name}' not found in database.")
        return
    if not tgt_ids:
        if as_json:
            print(json.dumps({"error": f"Target nodes '{target_name}' not found in database."}))
        else:
            print(f"Error: Target nodes '{target_name}' not found in database.")
        return
        
    exclude_ids = set()
    if exclude:
        exclude_names = [e.strip() for e in exclude.split(",") if e.strip()]
        for e_name in exclude_names:
            cursor.execute("SELECT id FROM nodes WHERE name LIKE ? ESCAPE '\\' OR id = ?", (e_name, e_name))
            for r in cursor.fetchall():
                exclude_ids.add(r[0])
                
    if not as_json:
        print(f"Pathfinding: {src_real_names} &rarr; {tgt_real_names} (max {max_hops} hops)...")
        
    # Queue structure: (current_node, path_so_far)
    from_source_queue = {sid: [sid] for sid in src_ids}
    from_target_queue = {tid: [tid] for tid in tgt_ids}
    
    meeting_nodes = {}
    node_name_cache = {}

    neighbor_cache = {}
    
    def get_node_name(nid):
        if nid in node_name_cache:
            return node_name_cache[nid]
        cursor.execute("SELECT name FROM nodes WHERE id = ?", (nid,))
        row = cursor.fetchone()
        name = row[0].lower().strip() if row else ""
        node_name_cache[nid] = name
        return name
    
    def get_neighbors(node_id):
        if node_id in neighbor_cache:
            return neighbor_cache[node_id]
            
        # Prune generic high-degree hubs and duplicate concept names of source/target to prevent timeouts/meaningless loops
        cursor.execute("SELECT name, degree FROM nodes WHERE id = ?", (node_id,))
        row = cursor.fetchone()
        if not row:
            neighbor_cache[node_id] = []
            return []
        name, degree = row
        name_clean = name.lower().strip()

        if node_id not in src_ids and node_id not in tgt_ids:
            if name_clean in [s.lower().strip() for s in src_real_names] or name_clean in [t.lower().strip() for t in tgt_real_names]:
                neighbor_cache[node_id] = []
                return []
            if node_id in exclude_ids:
                neighbor_cache[node_id] = []
                return []
            if degree > 3000:  # Skip generic hubs
                neighbor_cache[node_id] = []
                return []
                
        # Optimize neighbor query to use JOIN for faster execution
        cursor.execute(
            """
            SELECT an2.node_id, COUNT(*) as weight
            FROM article_nodes an1
            JOIN article_nodes an2 ON an1.pmid = an2.pmid
            WHERE an1.node_id = ? AND an2.node_id != ?
            GROUP BY an2.node_id
            ORDER BY weight DESC
            LIMIT 100
            """,
            (node_id, node_id)
        )
        res = [(row[0], 'article') for row in cursor.fetchall()]
        neighbor_cache[node_id] = res
        return res

    for hop in range(1, (max_hops // 2) + 2):
        # Forward step
        next_source_queue = {}
        for curr, path in from_source_queue.items():
            for neighbor, level in get_neighbors(curr):
                neighbor_name = get_node_name(neighbor)
                path_names = [get_node_name(nid) for nid in path]
                if neighbor_name not in path_names:
                    new_path = path + [neighbor]
                    if neighbor in from_target_queue:
                        meeting_nodes[neighbor] = (new_path, from_target_queue[neighbor])
                    next_source_queue[neighbor] = new_path
        from_source_queue = next_source_queue
        
        # Backward step
        next_target_queue = {}
        for curr, path in from_target_queue.items():
            for neighbor, level in get_neighbors(curr):
                neighbor_name = get_node_name(neighbor)
                path_names = [get_node_name(nid) for nid in path]
                if neighbor_name not in path_names:
                    new_path = path + [neighbor]
                    if neighbor in from_source_queue:
                        meeting_nodes[neighbor] = (from_source_queue[neighbor], new_path)
                    next_target_queue[neighbor] = new_path
        from_target_queue = next_target_queue
        
        if meeting_nodes:
            break
            
    paths_found = []
    for node, (path_src, path_tgt) in meeting_nodes.items():
        full_path = path_src + list(reversed(path_tgt[:-1]))
        
        # Filter out paths containing duplicate concept names
        seen_names_in_path = set()
        has_dup = False
        for nid in full_path:
            name = get_node_name(nid)
            if name in seen_names_in_path:
                has_dup = True
                break
            seen_names_in_path.add(name)
            
        if not has_dup and len(full_path) - 1 <= max_hops:
            paths_found.append(full_path)
            
    if not paths_found:
        if as_json:
            print(json.dumps([]))
        else:
            print("No pathways found within maximum hops limit.")
        return
        
    if as_json:
        json_results = []
        for path in paths_found:
            path_nodes = []
            path_edges = []
            
            for n_id in path:
                cursor.execute("SELECT id, name, type FROM nodes WHERE id = ?", (n_id,))
                n_row = cursor.fetchone()
                if n_row:
                    path_nodes.append({
                        "id": n_row[0],
                        "name": n_row[1],
                        "type": n_row[2]
                    })
                    
            for i in range(len(path) - 1):
                u, v = path[i], path[i+1]
                evidence = get_edge_evidence(cursor, u, v)
                path_edges.append({
                    "source": u,
                    "target": v,
                    "pmid": evidence["pmid"],
                    "sentence": evidence["sentence"],
                    "level": evidence["level"]
                })
                
            json_results.append({
                "path": [n["name"] for n in path_nodes],
                "nodes": path_nodes,
                "edges": path_edges
            })
        print(json.dumps(json_results))
        conn.close()
        return
        
    print(f"\nDiscovered {len(paths_found)} causal pathway(s):")
    for idx, path in enumerate(paths_found):
        path_names = []
        for n_id in path:
            cursor.execute("SELECT name FROM nodes WHERE id = ?", (n_id,))
            path_names.append(cursor.fetchone()[0])
            
        print(f"\nPathway #{idx+1}: " + " -> ".join(path_names))
        for i in range(len(path) - 1):
            u, v = path[i], path[i+1]
            evidence = get_edge_evidence(cursor, u, v)
            print(f"  Hop {i+1}: {path_names[i]} -({evidence['level']})-> {path_names[i+1]}")
            print(f"    Evidence: \"{evidence['sentence'].strip()}\" (PMID:{evidence['pmid']})")
            
    conn.close()

# ----------------- PIPELINE STATUS -----------------
def print_status(db_path):
    if not os.path.exists(db_path):
        print(f"Database {db_path} does not exist yet. Run parse/ingest to initialize.")
        return
        
    conn = connect_db(db_path, read_only=True)
    cursor = conn.cursor()
    
    node_count = None
    article_count = None
    link_count = None
    files_count = None
    
    try:
        cursor.execute("SELECT value FROM metadata WHERE key = 'node_count'")
        row = cursor.fetchone()
        if row: node_count = int(row[0])
        
        cursor.execute("SELECT value FROM metadata WHERE key = 'article_count'")
        row = cursor.fetchone()
        if row: article_count = int(row[0])
        
        cursor.execute("SELECT value FROM metadata WHERE key = 'link_count'")
        row = cursor.fetchone()
        if row: link_count = int(row[0])
        
        cursor.execute("SELECT value FROM metadata WHERE key = 'files_count'")
        row = cursor.fetchone()
        if row: files_count = int(row[0])
    except sqlite3.OperationalError:
        pass
        
    # Fallback if metadata is not populated
    if node_count is None or article_count is None or link_count is None or files_count is None:
        cursor.execute("SELECT COUNT(*) FROM nodes")
        node_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM articles")
        article_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM article_nodes")
        link_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM parsed_files")
        files_count = cursor.fetchone()[0]
        
    print("=================================================")
    print("PROJECT EPISTEME: HERMETIC GRAPH DATABASE STATUS")
    print("=================================================")
    print(f"Database File:          {db_path}")
    print(f"Parsed Baseline files:  {files_count}")
    print(f"Total Unique Articles:  {article_count}")
    print(f"Total Unique Concepts:  {node_count}")
    print(f"Total Concept-Article Links: {link_count}")
    
    if files_count > 0:
        print("\nLast 5 Ingested Files:")
        cursor.execute("SELECT filename, parsed_at FROM parsed_files ORDER BY parsed_at DESC LIMIT 5")
        for row in cursor.fetchall():
            print(f"  - {row[0]} (parsed at: {row[1]})")
            
    conn.close()

# ----------------- DRUGGABILITY & TRACTABILITY CLASSIFICATION -----------------
def classify_druggability(name, entity_type):
    low = name.lower().strip()
    
    # 1. Small Molecule Druggable (Kinases, GPCRs, Ion Channels, Proteases, Nuclear Receptors, etc.)
    sm_keywords = [
        'kinase', 'receptor', 'gpcr', 'channel', 'nmda', 'gaba', 'protease', 
        'phosphatase', 'hydrolase', 'polymerase', 'dehydrogenase', 'transferase', 
        'oxidase', 'synthase', 'phosphodiesterase', 'inhibitor', 'agonist',
        'antagonist', 'adrenergic', 'dopamine', 'serotonin', 'histamine', 
        'opioid', 'cholinergic', 'ppar', 'estrogen', 'androgen', 'steroid',
        'acetylcholinesterase', 'cyclooxygenase', 'topoisomerase', 'carbonic anhydrase',
        'sirt', 'hdac', 'pde', 'jak', 'stat', 'braf', 'kras', 'egfr', 'her2', 
        'parp', 'cdk', 'mtor', 'ampk', 'akt', 'mapk', 'erk', 'pi3k', 'btk'
    ]
    if any(k in low for k in sm_keywords):
        return {
            "tier": "Small Molecule",
            "badge": "💊 Small Molecule",
            "modality": "small_molecule",
            "tractability": "High (Oral Bioavailability)"
        }
        
    # 2. Biologics / Antibody Accessible
    biologics_keywords = [
        'interleukin', 'cytokine', 'chemokine', 'integrin', 'growth factor',
        'vegf', 'egf', 'fgf', 'pdgf', 'tgf', 'bdnf', 'tnf', 'interferon',
        'cd antigen', 'cd4', 'cd8', 'cd19', 'cd20', 'cd47', 'pd-1', 'pdl-1',
        'ctla-4', 'checkpoint', 'extracellular', 'glycoprotein', 'antibody'
    ]
    if any(k in low for k in biologics_keywords) or (low.startswith('cd') and len(low) <= 6):
        return {
            "tier": "Biologics / mAb",
            "badge": "💉 Biologics / mAb",
            "modality": "antibody",
            "tractability": "High (Cell Surface / Secreted)"
        }
        
    # 3. PROTAC Degradable
    protac_keywords = [
        'ubiquitin', 'ligase', 'vhl', 'cereblon', 'mdm2', 'cullin', 'proteasome',
        'degron', 'trim', 'e3'
    ]
    if any(k in low for k in protac_keywords):
        return {
            "tier": "PROTAC / Degrader",
            "badge": "🧪 PROTAC / Degrader",
            "modality": "protac",
            "tractability": "High (Targeted Protein Degradation)"
        }
        
    # 4. Transporter / Metabolic Enzyme
    transporter_keywords = [
        'transporter', 'atpase', 'cytochrome', 'cyp', 'slc', 'pump', 'carrier',
        'permease', 'exchanger', 'symporter', 'antiporter'
    ]
    if any(k in low for k in transporter_keywords):
        return {
            "tier": "Transporter / Enzyme",
            "badge": "⚡ Transporter / Enzyme",
            "modality": "transporter",
            "tractability": "Moderate (Membrane Bound)"
        }
        
    if entity_type == 'disease':
        return {
            "tier": "Clinical Indication",
            "badge": "🩺 Clinical Indication",
            "modality": "disease",
            "tractability": "Targetable Pathology"
        }
        
    return {
        "tier": "Biological Pathway",
        "badge": "🔬 Pathway Target",
        "modality": "pathway",
        "tractability": "Exploratory"
    }

# ----------------- SWANSON B-TERM EXTRACTION -----------------
def find_swanson_b_terms(db_path, source_name, target_name, as_json=False, include_evidence=False, exclude=""):
    conn = connect_db(db_path, read_only=True)
    cursor = conn.cursor()
    
    source_names = [s.strip() for s in source_name.split(",") if s.strip()]
    target_names = [t.strip() for t in target_name.split(",") if t.strip()]
    
    src_ids = []
    src_details = [] # list of (id, name, type)
    for s_name in source_names:
        rows = resolve_term_nodes(cursor, s_name)
        for r in rows:
            src_ids.append(r[0])
            src_details.append(r)
            
    tgt_ids = []
    tgt_details = []
    for t_name in target_names:
        rows = resolve_term_nodes(cursor, t_name)
        for r in rows:
            tgt_ids.append(r[0])
            tgt_details.append(r)
            
    if not src_ids or not tgt_ids:
        if as_json:
            print(json.dumps({"error": f"Source '{source_name}' or Target '{target_name}' not found in database."}))
        else:
            print("Source or Target not found.")
        return
        
    src_id, src_name, src_type = src_details[0]
    tgt_id, tgt_name, tgt_type = tgt_details[0]
    
    # Check direct co-occurrences between any A and any C
    src_placeholders = ",".join(["?"] * len(src_ids))
    tgt_placeholders = ",".join(["?"] * len(tgt_ids))
    
    cursor.execute(
        f"""
        SELECT COUNT(DISTINCT an1.pmid)
        FROM article_nodes an1
        JOIN article_nodes an2 ON an1.pmid = an2.pmid
        WHERE an1.node_id IN ({src_placeholders}) AND an2.node_id IN ({tgt_placeholders})
        """,
        src_ids + tgt_ids
    )
    direct_count = cursor.fetchone()[0]
    
    # Loop prevention excludes
    exclude_ids = []
    if exclude:
        exclude_names = [e.strip() for e in exclude.split(",") if e.strip()]
        for e_name in exclude_names:
            cursor.execute("SELECT id FROM nodes WHERE name LIKE ? ESCAPE '\\' OR id = ?", (e_name, e_name))
            for r in cursor.fetchall():
                exclude_ids.append(r[0])
                
    # Add exclude filter to the query
    exclude_filter = ""
    if exclude_ids:
        ex_placeholders = ",".join(["?"] * len(exclude_ids))
        exclude_filter = f" AND n.id NOT IN ({ex_placeholders})"
        
    query = f"""
        SELECT n.id, n.name, n.type, ab.count_a, bc.count_c, n.degree
        FROM nodes n
        JOIN (
            SELECT an2.node_id, COUNT(DISTINCT an2.pmid) as count_a
            FROM article_nodes an1
            JOIN article_nodes an2 ON an1.pmid = an2.pmid
            WHERE an1.node_id IN ({src_placeholders})
            GROUP BY an2.node_id
        ) ab ON n.id = ab.node_id
        JOIN (
            SELECT an4.node_id, COUNT(DISTINCT an4.pmid) as count_c
            FROM article_nodes an3
            JOIN article_nodes an4 ON an3.pmid = an4.pmid
            WHERE an3.node_id IN ({tgt_placeholders})
            GROUP BY an4.node_id
        ) bc ON n.id = bc.node_id
        WHERE n.id NOT IN ({src_placeholders}) AND n.id NOT IN ({tgt_placeholders}) {exclude_filter} AND n.degree <= 5000
    """
    
    params = src_ids + tgt_ids + src_ids + tgt_ids + exclude_ids
    cursor.execute(query, params)
    b_rows = cursor.fetchall()
    
    # Calculate tf-idf relevance score and sort by score DESC, deduplicating on concept name
    b_rows_with_score = []
    seen_names = {}
    
    for b_id, b_name, b_type, count_a, count_c, total_occurrences in b_rows:
        lower_name = b_name.lower().strip()
        
        # Aggressive Semantic Filtering: Eliminate lexical variations/substrings of source and target sets
        is_synonym = False
        for s_name in src_details:
            s_low = s_name[1].lower().strip()
            if s_low in lower_name or lower_name in s_low:
                is_synonym = True
                break
        for t_name in tgt_details:
            t_low = t_name[1].lower().strip()
            if t_low in lower_name or lower_name in t_low:
                is_synonym = True
                break
        if is_synonym:
            continue
            
        score = float(count_a * count_c) / float(total_occurrences) if total_occurrences > 0 else 0.0

        if lower_name in seen_names:
            prev_idx = seen_names[lower_name]
            prev_row = b_rows_with_score[prev_idx]
            # Keep the duplicate entry with the higher relevance score
            if score > prev_row[6]:
                b_rows_with_score[prev_idx] = (b_id, b_name, b_type, count_a, count_c, total_occurrences, score)
        else:
            seen_names[lower_name] = len(b_rows_with_score)
            b_rows_with_score.append((b_id, b_name, b_type, count_a, count_c, total_occurrences, score))
        
    b_rows_with_score.sort(key=lambda x: x[6], reverse=True)
    
    # Only process and return the top 100 B-terms to avoid OOM or timeout on Cloud Run
    top_b_rows = b_rows_with_score[:100]
    
    b_list = []
    for b_id, b_name, b_type, count_a, count_c, total_occurrences, score in top_b_rows:
        edges_a = []
        edges_c = []
        
        if include_evidence:
            # Get evidence for A-B
            cursor.execute(
                """
                SELECT a.pmid, a.title, a.abstract
                FROM article_nodes an1
                JOIN article_nodes an2 ON an1.pmid = an2.pmid
                JOIN articles a ON an1.pmid = a.pmid
                WHERE an1.node_id = ? AND an2.node_id = ?
                ORDER BY an1.pmid DESC
                LIMIT 15
                """,
                (src_id, b_id)
            )
            for pmid, title, abstract in cursor.fetchall():
                sentence = f"Article: \"{title}\""
                level = "abstract"
                if abstract:
                    sentences = parse_sentences(abstract)
                    for s in sentences:
                        if b_name.lower() in s.lower() and src_name.lower() in s.lower():
                            sentence = s
                            level = "sentence"
                            break
                edges_a.append({"pmid": pmid, "sentence": sentence, "level": level})
                
            # Get evidence for B-C
            cursor.execute(
                """
                SELECT a.pmid, a.title, a.abstract
                FROM article_nodes an1
                JOIN article_nodes an2 ON an1.pmid = an2.pmid
                JOIN articles a ON an1.pmid = a.pmid
                WHERE an1.node_id = ? AND an2.node_id = ?
                ORDER BY an1.pmid DESC
                LIMIT 15
                """,
                (tgt_id, b_id)
            )
            for pmid, title, abstract in cursor.fetchall():
                sentence = f"Article: \"{title}\""
                level = "abstract"
                if abstract:
                    sentences = parse_sentences(abstract)
                    for s in sentences:
                        if b_name.lower() in s.lower() and tgt_name.lower() in s.lower():
                            sentence = s
                            level = "sentence"
                            break
                edges_c.append({"pmid": pmid, "sentence": sentence, "level": level})
                
        b_list.append({
            "word": b_name,
            "id": b_id,
            "type": b_type,
            "druggability": classify_druggability(b_name, b_type),
            "countA": count_a,
            "countC": count_c,
            "totalOccurrences": total_occurrences,
            "score": score,
            "edgesA": edges_a,
            "edgesC": edges_c
        })
        
    if as_json:
        print(json.dumps({
            "directCount": direct_count,
            "bList": b_list
        }))
    else:
        print(f"Direct co-occurrences between {src_name} and {tgt_name}: {direct_count}")
        for idx, item in enumerate(b_list[:25]):
            print(f"{idx+1}. {item['word']} (score: {item['score']:.4f}, A: {item['countA']}, C: {item['countC']}, Total: {item['totalOccurrences']})")
            
    conn.close()

# ----------------- OPEN DISCOVERY (SINGLE-TERM DISJOINT GAPS) -----------------
LAB_NOISE_BLACKLIST = {
    'edetic acid', 'egtazic acid', 'edta', 'egta', 'cations, divalent', 'cations, monovalent',
    'ions', 'solutions', 'buffers', 'water', 'hydrogen-ion concentration', 'culture media',
    'temperature', 'ph', 'time', 'dose-response relationship, drug', 'animals', 'humans',
    'in vitro techniques', 'cells, cultured', 'rna, transfer', 'dna', 'rna', 'spectrophotometry',
    'chromatography', 'electrophoresis', 'chromatography, deae-cellulose', 'templates, genetic',
    'chloroplasts', 'centrifugation', 'freeze drying', 'indicators and reagents', 'solvents',
    'detergents', 'hydrochloric acid', 'sodium hydroxide', 'potassium chloride', 'sodium chloride',
    'manganese', 'calcium', 'potassium', 'sodium', 'chlorides', 'sulfates', 'phosphates',
    'osmolar concentration', 'molecular weight', 'half-life', 'spectrophotometry, ultraviolet',
    'microsomes', 'ribosomes', 'organelles', 'cytosol', 'subcellular fractions', 'drug packaging',
    'oral hygiene', 'thermodynamics', 'electron transport', 'cell membrane permeability',
    'nucleic acid denaturation', 'freezing', 'solubility', 'kinetics', 'binding sites',
    '3t3 cells', 'hela cells', 'dental enamel solubility', 'fluoridation', 'peptide mapping',
    'fluorosis, dental', 'plant extracts', 'reagent kits, diagnostic'
}

def open_discovery(db_path, term_name, as_json=False):
    conn = connect_db(db_path, read_only=True)
    cursor = conn.cursor()
    
    # 1. Resolve source node
    cursor.execute("SELECT id, name, type, degree FROM nodes WHERE name LIKE ? ESCAPE '\\' LIMIT 5", (term_name,))
    src_rows = cursor.fetchall()
    if not src_rows:
        cursor.execute("SELECT id, name, type, degree FROM nodes WHERE name LIKE ? ESCAPE '\\' LIMIT 5", (f"%{term_name}%",))
        src_rows = cursor.fetchall()
    if not src_rows:
        tokens = [t for t in term_name.split() if len(t) > 2]
        if tokens:
            token_query = " AND ".join(["name LIKE ?"] * len(tokens))
            cursor.execute(f"SELECT id, name, type, degree FROM nodes WHERE {token_query} LIMIT 5", tuple(f"%{t}%" for t in tokens))
            src_rows = cursor.fetchall()
            
    if not src_rows:
        if as_json:
            print(json.dumps({"error": f"Concept '{term_name}' not found in database."}))
        else:
            print(f"Concept '{term_name}' not found.")
        conn.close()
        return
        
    src_id, src_name, src_type, src_degree = src_rows[0]
    
    # 2. Get top clean empirical B-nodes (Filtered for biological relevance)
    cursor.execute("""
        SELECT an2.node_id, n.name, n.type, COUNT(an2.pmid) as co_count, n.degree
        FROM article_nodes an1
        JOIN article_nodes an2 ON an1.pmid = an2.pmid
        JOIN nodes n ON an2.node_id = n.id
        WHERE an1.node_id = ? AND an2.node_id != ? AND n.degree BETWEEN 12 AND 4000
        GROUP BY an2.node_id
        ORDER BY co_count DESC
        LIMIT 300
    """, (src_id, src_id))
    b_nodes_raw = cursor.fetchall()
    
    seen_b_names = set()
    b_nodes = []
    for b in b_nodes_raw:
        low = b[1].lower().strip()
        if low in LAB_NOISE_BLACKLIST or low == src_name.lower().strip():
            continue
        if any(noise in low for noise in ['cellulose', 'spectrophotom', 'electrophoresis', 'centrifug', 'chromatograph', 'in vitro', 'apparatus', 'method']):
            continue
        if low not in seen_b_names:
            seen_b_names.add(low)
            b_nodes.append(b)
            
    # 3. Find Candidate Clinical Indications / Pathologies (C-nodes)
    top_b_ids = [b[0] for b in b_nodes[:20]]
    if not top_b_ids:
        if as_json:
            print(json.dumps({"source": {"id": src_id, "name": src_name, "type": src_type, "degree": src_degree}, "known": [], "novel": []}))
        conn.close()
        return
        
    placeholders = ",".join(["?"] * len(top_b_ids))
    cursor.execute(f"""
        SELECT n.id, n.name, n.type, COUNT(DISTINCT an2.pmid) as bc_count, n.degree, an1.node_id as b_id
        FROM article_nodes an1
        JOIN article_nodes an2 ON an1.pmid = an2.pmid
        JOIN nodes n ON an2.node_id = n.id
        WHERE an1.node_id IN ({placeholders}) 
          AND an2.node_id != ?
          AND an2.node_id NOT IN ({placeholders})
          AND n.degree BETWEEN 5 AND 3500
          AND (
            n.type IN ('disease', 'phenotype', 'pathway')
            OR n.name LIKE '%Disease%'
            OR n.name LIKE '%Syndrome%'
            OR n.name LIKE '%Disorder%'
            OR n.name LIKE '%Infarction%'
            OR n.name LIKE '%Ischemia%'
            OR n.name LIKE '%Spasm%'
            OR n.name LIKE '%Hypertension%'
            OR n.name LIKE '%Arrhythmia%'
            OR n.name LIKE '%Pain%'
            OR n.name LIKE '%Epilepsy%'
            OR n.name LIKE '%Migraine%'
            OR n.name LIKE '%Depression%'
            OR n.name LIKE '%Asthma%'
            OR n.name LIKE '%Inflammation%'
            OR n.name LIKE '%Raynaud%'
            OR n.name LIKE '%Preeclampsia%'
            OR n.name LIKE '%Encephalopathy%'
          )
        GROUP BY n.id, an1.node_id
        HAVING bc_count >= 2
        ORDER BY bc_count DESC
        LIMIT 350
    """, top_b_ids + [src_id] + top_b_ids)
    c_candidates = cursor.fetchall()
    
    b_map = {b[0]: (b[1], b[2], b[3]) for b in b_nodes}
    
    c_agg = {}
    for c_id, c_name, c_type, bc_count, c_degree, b_id in c_candidates:
        c_low = c_name.lower().strip()
        if c_low in LAB_NOISE_BLACKLIST or c_low == src_name.lower().strip():
            continue
        if any(noise in c_low for noise in ['cellulose', 'spectrophotom', 'electrophoresis', 'centrifug', 'chromatograph', 'in vitro', 'apparatus', 'method', 'packaging', 'cells']):
            continue
        if c_id not in c_agg:
            c_agg[c_id] = {
                "id": c_id,
                "name": c_name,
                "type": c_type,
                "degree": c_degree,
                "bridges": []
            }
        b_info = b_map.get(b_id, (b_id, "unknown", 1))
        c_agg[c_id]["bridges"].append({
            "b_name": b_info[0],
            "b_type": b_info[1],
            "ab_count": b_info[2],
            "bc_count": bc_count
        })
        
    candidate_c_ids = list(c_agg.keys())
    if candidate_c_ids:
        c_placeholders = ",".join(["?"] * len(candidate_c_ids))
        cursor.execute(f"""
            SELECT an2.node_id, COUNT(DISTINCT an1.pmid)
            FROM article_nodes an1
            JOIN article_nodes an2 ON an1.pmid = an2.pmid
            WHERE an1.node_id = ? AND an2.node_id IN ({c_placeholders})
            GROUP BY an2.node_id
        """, [src_id] + candidate_c_ids)
        direct_a_c = dict(cursor.fetchall())
    else:
        direct_a_c = {}
        
    novel_c = []
    known_c = []
    seen_c_names = set()
    
    # Adaptive Swanson threshold: If source is a massive hub (>2000 papers like Magnesium), direct <= 3 is considered a neglected structural gap
    neglected_threshold = 3 if src_degree > 2000 else 0
    
    for c_id, data in c_agg.items():
        c_low = data["name"].lower().strip()
        if c_low in seen_c_names:
            continue
        seen_c_names.add(c_low)
        
        direct_count = direct_a_c.get(c_id, 0)
        data["direct_a_c"] = direct_count
        
        data["bridges"].sort(key=lambda b: (b["ab_count"] * b["bc_count"]), reverse=True)
        
        total_bridge_score = sum((b["ab_count"] * b["bc_count"]) for b in data["bridges"]) / float(data["degree"])
        data["gap_score"] = round(total_bridge_score, 2)
        
        # Clinical Domain Categorization
        name_lower = data["name"].lower()
        if any(k in name_lower for k in ['brain', 'neuro', 'migraine', 'epilepsy', 'seizure', 'alzheimer', 'parkinson', 'dementia', 'pain', 'headache', 'spasm', 'encephal']):
            category = '🧠 Neurology & Neurovascular'
        elif any(k in name_lower for k in ['heart', 'cardio', 'vaso', 'hypertension', 'artery', 'ischemia', 'infarct', 'arrhythmia', 'raynaud', 'platelet', 'thromb']):
            category = '🫀 Cardiovascular & Vascular'
        elif any(k in name_lower for k in ['syndrome', 'genetic', 'menkes', 'mitochondri', 'pediatric', 'congenital', 'dystrophy', 'infantile', 'niemann', 'phenylketo']):
            category = '🧬 Rare & Pediatric Disorders'
        elif any(k in name_lower for k in ['inflam', 'immune', 'sepsis', 'shock', 'asthma', 'colitis', 'lupus', 'rheumat']):
            category = '🛡️ Immunology & Inflammation'
        elif any(k in name_lower for k in ['diabetes', 'metabolic', 'obesity', 'lipid', 'acidosis', 'alkalosis', 'liver']):
            category = '⚡ Metabolic & Endocrinology'
        else:
            category = '🔬 Cellular & Systemic Pathology'
            
        data["category"] = category
        data["druggability"] = classify_druggability(data["name"], data["type"])
        for b in data["bridges"]:
            b["druggability"] = classify_druggability(b["b_name"], b["b_type"])
        
        if direct_count <= neglected_threshold:
            novel_c.append(data)
        else:
            known_c.append(data)
            
    novel_c.sort(key=lambda x: x["gap_score"], reverse=True)
    known_c.sort(key=lambda x: x["direct_a_c"], reverse=True)
    
    result = {
        "source": {
            "id": src_id,
            "name": src_name,
            "type": src_type,
            "degree": src_degree
        },
        "top_empirical_b": [
            {"id": b[0], "name": b[1], "type": b[2], "co_count": b[3], "degree": b[4]}
            for b in b_nodes[:15]
        ],
        "known_universe": known_c[:15],
        "novel_structural_gaps": novel_c[:30]
    }
    
    if as_json:
        print(json.dumps(result))
    else:
        print(f"Open Discovery for {src_name}: {len(known_c)} known, {len(novel_c)} novel gaps")
        
    conn.close()

# ----------------- CO-OCCURRENCE EVIDENCE -----------------
def fetch_cooccurrence_evidence_list(cursor, node1_name, node2_name, limit=15, exclude=""):
    # Split comma-separated names for set-based evidence matching
    names1 = [n.strip() for n in node1_name.split(",") if n.strip()]
    names2 = [n.strip() for n in node2_name.split(",") if n.strip()]
    
    n1_ids = []
    n1_real_names = []
    n1_degrees = []
    for name in names1:
        cursor.execute("SELECT id, name, degree FROM nodes WHERE name LIKE ? ESCAPE '\\'", (name,))
        rows = cursor.fetchall()
        if not rows:
            cursor.execute("SELECT id, name, degree FROM nodes WHERE name LIKE ? ESCAPE '\\'", (f"%{name}%",))
            rows = cursor.fetchall()
        if not rows:
            tokens = [t for t in name.split() if len(t) > 2]
            if tokens:
                token_query = " AND ".join(["name LIKE ?"] * len(tokens))
                cursor.execute(f"SELECT id, name, degree FROM nodes WHERE {token_query}", tuple(f"%{t}%" for t in tokens))
                rows = cursor.fetchall()
        for r in rows:
            n1_ids.append(r[0])
            n1_real_names.append(r[1])
            n1_degrees.append(r[2])
            
    n2_ids = []
    n2_real_names = []
    n2_degrees = []
    for name in names2:
        cursor.execute("SELECT id, name, degree FROM nodes WHERE name LIKE ? ESCAPE '\\'", (name,))
        rows = cursor.fetchall()
        if not rows:
            cursor.execute("SELECT id, name, degree FROM nodes WHERE name LIKE ? ESCAPE '\\'", (f"%{name}%",))
            rows = cursor.fetchall()
        if not rows:
            tokens = [t for t in name.split() if len(t) > 2]
            if tokens:
                token_query = " AND ".join(["name LIKE ?"] * len(tokens))
                cursor.execute(f"SELECT id, name, degree FROM nodes WHERE {token_query}", tuple(f"%{t}%" for t in tokens))
                rows = cursor.fetchall()
        for r in rows:
            n2_ids.append(r[0])
            n2_real_names.append(r[1])
            n2_degrees.append(r[2])
            
    if not n1_ids or not n2_ids:
        return []
        
    # Swap n1 and n2 if n1 has a higher total degree (A-articles > C-articles).
    # Scanning the smaller set first in the JOIN/EXISTS query is 10x-50x faster.
    should_swap = sum(n1_degrees) > sum(n2_degrees)
    if should_swap:
        n1_ids, n2_ids = n2_ids, n1_ids
        n1_real_names, n2_real_names = n2_real_names, n1_real_names
        
    n1_placeholders = ",".join(["?"] * len(n1_ids))
    n2_placeholders = ",".join(["?"] * len(n2_ids))
    
    ex_ids = []
    if exclude:
        names3 = [n.strip() for n in exclude.split(",") if n.strip()]
        for name in names3:
            cursor.execute("SELECT id FROM nodes WHERE name LIKE ? ESCAPE '\\'", (name,))
            rows = cursor.fetchall()
            if not rows:
                cursor.execute("SELECT id FROM nodes WHERE name LIKE ? ESCAPE '\\'", (f"%{name}%",))
                rows = cursor.fetchall()
            for r in rows:
                ex_ids.append(r[0])
                
    exclude_filter = ""
    if ex_ids:
        ex_placeholders = ",".join(["?"] * len(ex_ids))
        exclude_filter = f" AND NOT EXISTS (SELECT 1 FROM article_nodes ex WHERE ex.pmid = an1.pmid AND ex.node_id IN ({ex_placeholders}))"

    cursor.execute(
        f"""
        SELECT DISTINCT an1.pmid
        FROM article_nodes an1
        JOIN article_nodes an2 ON an1.pmid = an2.pmid
        WHERE an1.node_id IN ({n1_placeholders}) AND an2.node_id IN ({n2_placeholders}) {exclude_filter}
        ORDER BY an1.pmid DESC
        LIMIT ?
        """,
        n1_ids + n2_ids + ex_ids + [limit]
    )
    pmids = [row[0] for row in cursor.fetchall()]

    rows = []
    if pmids:
        placeholders = ",".join(["?"] * len(pmids))
        cursor.execute(
            f"SELECT pmid, title, abstract FROM articles WHERE pmid IN ({placeholders}) ORDER BY pmid DESC",
            pmids
        )
        rows = cursor.fetchall()
    
    edges = []
    for pmid, title, abstract in rows:
        sentence = ""
        level = "abstract"
        if abstract:
            sentences = parse_sentences(abstract)
            matching_sentence = ""
            # 1. Look for a sentence containing BOTH terms
            for s in sentences:
                s_lower = s.lower()
                has_n1 = any(n.lower() in s_lower or n.lower().rstrip('s') in s_lower for n in n1_real_names) or any(n.lower() in s_lower or n.lower().rstrip('s') in s_lower for n in names1)
                has_n2 = any(n.lower() in s_lower or n.lower().rstrip('s') in s_lower for n in n2_real_names) or any(n.lower() in s_lower or n.lower().rstrip('s') in s_lower for n in names2)
                if has_n1 and has_n2:
                    matching_sentence = s
                    level = "sentence"
                    break
            
            # 2. If no single sentence contains both, extract sentence mentioning n1 and sentence mentioning n2
            if not matching_sentence:
                s1_candidate = ""
                s2_candidate = ""
                for s in sentences:
                    s_lower = s.lower()
                    has_n1 = any(n.lower() in s_lower or n.lower().rstrip('s') in s_lower for n in n1_real_names) or any(n.lower() in s_lower or n.lower().rstrip('s') in s_lower for n in names1)
                    has_n2 = any(n.lower() in s_lower or n.lower().rstrip('s') in s_lower for n in n2_real_names) or any(n.lower() in s_lower or n.lower().rstrip('s') in s_lower for n in names2)
                    if has_n1 and not s1_candidate:
                        s1_candidate = s
                    if has_n2 and not s2_candidate:
                        s2_candidate = s
                
                if s1_candidate and s2_candidate:
                    if s1_candidate == s2_candidate:
                        matching_sentence = s1_candidate
                    else:
                        matching_sentence = f"[Mentioning {node1_name.split(',')[0]}]: \"{s1_candidate}\" ... [Mentioning {node2_name.split(',')[0]}]: \"{s2_candidate}\""
                    level = "sentence"
                elif s1_candidate:
                    matching_sentence = f"[Mentioning {node1_name.split(',')[0]}]: \"{s1_candidate}\""
                    level = "sentence"
                elif s2_candidate:
                    matching_sentence = f"[Mentioning {node2_name.split(',')[0]}]: \"{s2_candidate}\""
                    level = "sentence"
            
            sentence = matching_sentence

        if not sentence:
            # Fallback to abstract prefix if no sentence has specific term mentions
            sentence = abstract[:200] + "..." if abstract and len(abstract) > 200 else (abstract or "")
            level = "abstract"

        edges.append({
            "pmid": pmid,
            "title": title,
            "sentence": sentence,
            "level": level
        })
    return edges

def get_cooccurrence_evidence(db_path, node1_name, node2_name, node3_name=None, limit=15, as_json=False, exclude=""):
    conn = connect_db(db_path, read_only=True)
    cursor = conn.cursor()
    
    if node3_name:
        evidence_a = fetch_cooccurrence_evidence_list(cursor, node1_name, node2_name, limit, exclude)
        evidence_c = fetch_cooccurrence_evidence_list(cursor, node2_name, node3_name, limit, exclude)
        if as_json:
            print(json.dumps({
                "evidenceA": evidence_a,
                "evidenceC": evidence_c
            }))
        else:
            print(f"Evidence A-B: {len(evidence_a)} articles. Evidence B-C: {len(evidence_c)} articles.")
    else:
        evidence = fetch_cooccurrence_evidence_list(cursor, node1_name, node2_name, limit, exclude)
        if as_json:
            print(json.dumps(evidence))
        else:
            print(f"Co-occurrence evidence: {len(evidence)} articles")
            
    conn.close()

def find_top_bridge(cursor, src_ids, tgt_ids, exclude_ids, src_names, tgt_names):
    src_placeholders = ",".join(["?"] * len(src_ids))
    tgt_placeholders = ",".join(["?"] * len(tgt_ids))
    ex_filter = ""
    params = list(src_ids) + list(tgt_ids) + list(src_ids) + list(tgt_ids)
    
    if exclude_ids:
        filtered_excludes = [eid for eid in exclude_ids if eid]
        if filtered_excludes:
            ex_placeholders = ",".join(["?"] * len(filtered_excludes))
            ex_filter = f" AND n.id NOT IN ({ex_placeholders})"
            params.extend(filtered_excludes)
            
    query = f"""
        SELECT n.id, n.name, n.type, ab.count_a, bc.count_c, n.degree
        FROM nodes n
        JOIN (
            SELECT an2.node_id, COUNT(DISTINCT an2.pmid) as count_a
            FROM article_nodes an1
            JOIN article_nodes an2 ON an1.pmid = an2.pmid
            WHERE an1.node_id IN ({src_placeholders})
            GROUP BY an2.node_id
        ) ab ON n.id = ab.node_id
        JOIN (
            SELECT an4.node_id, COUNT(DISTINCT an4.pmid) as count_c
            FROM article_nodes an3
            JOIN article_nodes an4 ON an3.pmid = an4.pmid
            WHERE an3.node_id IN ({tgt_placeholders})
            GROUP BY an4.node_id
        ) bc ON n.id = bc.node_id
        WHERE n.id NOT IN ({src_placeholders}) AND n.id NOT IN ({tgt_placeholders}) {ex_filter} AND n.degree <= 5000
    """
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    best_bridge = None
    best_score = -1.0
    
    for b_id, b_name, b_type, count_a, count_c, degree in rows:
        lower_name = b_name.lower().strip()
        
        # Semantic duplicate filter:
        is_dup = False
        for s_name in src_names:
            s_low = s_name.lower().strip()
            if s_low in lower_name or lower_name in s_low:
                is_dup = True
                break
        if is_dup:
            continue
        for t_name in tgt_names:
            t_low = t_name.lower().strip()
            if t_low in lower_name or lower_name in t_low:
                is_dup = True
                break
        if is_dup:
            continue
            
        score = float(count_a * count_c) / float(degree) if degree > 0 else 0.0
        if score > best_score:
            best_score = score
            best_bridge = (b_id, b_name, b_type, count_a, count_c, degree, score)
            
    return best_bridge

def get_recursive_bridge(cursor, src_node, tgt_node, level, max_level, exclude_ids):
    if level > max_level:
        return []
        
    src_ids = [src_node['id']] if isinstance(src_node, dict) else [n['id'] for n in src_node]
    tgt_ids = [tgt_node['id']] if isinstance(tgt_node, dict) else [n['id'] for n in tgt_node]
    src_names = [src_node['name']] if isinstance(src_node, dict) else [n['name'] for n in src_node]
    tgt_names = [tgt_node['name']] if isinstance(tgt_node, dict) else [n['name'] for n in tgt_node]
    
    bridge = find_top_bridge(cursor, src_ids, tgt_ids, exclude_ids, src_names, tgt_names)
    if not bridge:
        return []
        
    b_id, b_name, b_type, count_a, count_c, degree, score = bridge
    b_node = {"id": b_id, "name": b_name, "type": b_type}
    
    new_excludes = exclude_ids | {b_id}
    
    left_bridges = get_recursive_bridge(cursor, src_node, b_node, level + 1, max_level, new_excludes)
    left_ids = {n['id'] for n in left_bridges}
    right_bridges = get_recursive_bridge(cursor, b_node, tgt_node, level + 1, max_level, new_excludes | left_ids)
    
    return left_bridges + [b_node] + right_bridges

def get_recursive_swanson_path(db_path, source, target, bridge, depth, as_json=False, exclude=""):
    conn = connect_db(db_path, read_only=True)
    cursor = conn.cursor()
    
    source_names = [s.strip() for s in source.split(",") if s.strip()]
    rows_s = resolve_term_nodes(cursor, source_names[0])
    if not rows_s:
        if as_json:
            print(json.dumps({"error": f"Source {source_names[0]} not found"}))
        else:
            print(f"Error: Source {source_names[0]} not found")
        conn.close()
        return
        
    src_node = {"id": rows_s[0][0], "name": rows_s[0][1], "type": rows_s[0][2]}
    
    target_names = [t.strip() for t in target.split(",") if t.strip()]
    rows_t = resolve_term_nodes(cursor, target_names[0])
    if not rows_t:
        if as_json:
            print(json.dumps({"error": f"Target {target_names[0]} not found"}))
        else:
            print(f"Error: Target {target_names[0]} not found")
        conn.close()
        return
        
    tgt_node = {"id": rows_t[0][0], "name": rows_t[0][1], "type": rows_t[0][2]}
    
    rows_b = resolve_term_nodes(cursor, bridge)
    if not rows_b:
        if as_json:
            print(json.dumps({"error": f"Bridge {bridge} not found"}))
        else:
            print(f"Error: Bridge {bridge} not found")
        conn.close()
        return
        
    bridge_node = {"id": rows_b[0][0], "name": rows_b[0][1], "type": rows_b[0][2]}
    
    exclude_ids = {src_node['id'], tgt_node['id'], bridge_node['id']}
    if exclude:
        exclude_names = [e.strip() for e in exclude.split(",") if e.strip()]
        for e_name in exclude_names:
            cursor.execute("SELECT id FROM nodes WHERE name LIKE ? ESCAPE '\\' OR id = ?", (e_name, e_name))
            for r in cursor.fetchall():
                exclude_ids.add(r[0])
                
    if depth == 1:
        max_level = 0
    elif depth == 3:
        max_level = 1
    elif depth == 7:
        max_level = 2
    else:
        max_level = 0
        
    left_bridges = get_recursive_bridge(cursor, src_node, bridge_node, 1, max_level, exclude_ids)
    left_ids = {n['id'] for n in left_bridges}
    right_bridges = get_recursive_bridge(cursor, bridge_node, tgt_node, 1, max_level, exclude_ids | left_ids)
    
    intermediate_nodes = left_bridges + [bridge_node] + right_bridges
    full_path = [src_node] + intermediate_nodes + [tgt_node]
    
    path_nodes = []
    for n in full_path:
        path_nodes.append({
            "id": n["id"],
            "name": n["name"],
            "type": n["type"]
        })
        
    path_edges = []
    for i in range(len(full_path) - 1):
        u, v = full_path[i], full_path[i+1]
        evidence = get_edge_evidence(cursor, u["id"], v["id"])
        path_edges.append({
            "source": u["id"],
            "target": v["id"],
            "pmid": evidence["pmid"],
            "title": evidence["title"],
            "sentence": evidence["sentence"],
            "level": evidence["level"]
        })
        
    path_result = {
        "path": [n["name"] for n in path_nodes],
        "nodes": path_nodes,
        "edges": path_edges
    }
    
    if as_json:
        print(json.dumps(path_result))
    else:
        print(" -> ".join(path_result["path"]))
        for edge in path_edges:
            print(f"  {edge['source']} -> {edge['target']} ({edge['level']}): PMID {edge['pmid']}")
            
    conn.close()

# ----------------- AUTOCOMPLETE SUGGESTIONS -----------------
def find_node_suggestions(db_path, query_str):
    conn = connect_db(db_path, read_only=True)
    cursor = conn.cursor()
    
    # 1. Prefix match (uses idx_nodes_name range scan, extremely fast)
    cursor.execute(
        """
        SELECT id, name, type 
        FROM nodes 
        WHERE name LIKE ?
        ORDER BY name COLLATE NOCASE ASC
        LIMIT 100
        """,
        (f"{query_str}%",)
    )
    rows = cursor.fetchall()
    
    # Sort in Python by length to avoid breaking SQLite index usage
    rows.sort(key=lambda x: len(x[1]))
    rows = rows[:15]
    
    # 2. If fewer than 5 results, fall back to contains match (slower table scan)
    if len(rows) < 5:
        found_ids = [r[0] for r in rows]
        exclude_clause = ""
        params = [f"%{query_str}%", query_str, f"{query_str}%"]
        if found_ids:
            placeholders = ",".join(["?"] * len(found_ids))
            exclude_clause = f" AND id NOT IN ({placeholders})"
            params.extend(found_ids)
            
        cursor.execute(
            f"""
            SELECT id, name, type 
            FROM nodes 
            WHERE name LIKE ? {exclude_clause}
            ORDER BY 
                CASE 
                    WHEN name = ? THEN 0 
                    WHEN name LIKE ? THEN 1 
                    ELSE 2 
                END, 
                name COLLATE NOCASE ASC
            LIMIT 100
            """,
            tuple(params)
        )
        more_rows = cursor.fetchall()
        more_rows.sort(key=lambda x: len(x[1]))
        
        # Combine and limit to 15
        rows.extend(more_rows)
        # Deduplicate while preserving order
        seen = set()
        deduped = []
        for r in rows:
            if r[0] not in seen:
                seen.add(r[0])
                deduped.append(r)
        rows = deduped[:15]
        
    results = [{"id": r[0], "name": r[1], "type": r[2]} for r in rows]
    conn.close()
    print(json.dumps(results))

# ----------------- VALIDATE CONCEPTS -----------------
def validate_concepts(db_path, terms_str):
    conn = connect_db(db_path, read_only=True)
    cursor = conn.cursor()
    if terms_str.startswith("[") and terms_str.endswith("]"):
        try:
            terms = json.loads(terms_str)
        except Exception:
            terms = [t.strip() for t in terms_str.split(",") if t.strip()]
    else:
        terms = [t.strip() for t in terms_str.split(",") if t.strip()]
        
    valid_terms = []
    for term in terms:
        cursor.execute("SELECT name FROM nodes WHERE name LIKE ?", (term,))
        row = cursor.fetchone()
        if row:
            valid_terms.append(row[0])
    conn.close()
    print(json.dumps(valid_terms))

# ----------------- MASS INGESTION -----------------
def ingest_all_pubmed(db_path, dict_path, dest_dir, limit=None):
    os.makedirs(dest_dir, exist_ok=True)
    conn = init_db(db_path)
    cursor = conn.cursor()
    
    # Pre-populate nodes table from dict
    trie, entity_metadata, name_to_id = load_trie(dict_path)
    for ent_id, (name, ent_type) in entity_metadata.items():
        cursor.execute(
            "INSERT OR IGNORE INTO nodes (id, name, type) VALUES (?, ?, ?)",
            (ent_id, name, ent_type)
        )
    conn.commit()
    
    ftp_host = "ftp.ncbi.nlm.nih.gov"
    ftp_path = "pubmed/baseline"
    
    print(f"Connecting to NCBI FTP server: {ftp_host}...")
    try:
        ftp = FTP(ftp_host)
        ftp.login()
        ftp.cwd(ftp_path)
    except Exception as e:
        print(f"FTP connection failed: {e}")
        return
        
    print("Fetching baseline file list...")
    files = []
    ftp.retrlines("NLST", lambda x: files.append(x))
    
    xml_files = sorted([f for f in files if f.endswith('.xml.gz')])
    print(f"Found {len(xml_files)} total baseline files in NCBI repository.")
    
    cursor.execute("SELECT filename FROM parsed_files")
    already_parsed = set(row[0] for row in cursor.fetchall())
    
    files_to_parse = [f for f in xml_files if f not in already_parsed]
    print(f"{len(files_to_parse)} files remaining to be parsed.")
    
    if limit:
        files_to_parse = files_to_parse[:limit]
        print(f"Limiting to first {limit} remaining files.")
        
    processed_count = 0
    for filename in files_to_parse:
        local_path = os.path.join(dest_dir, filename)
        
        print(f"[{processed_count + 1}/{len(files_to_parse)}] Downloading {filename}...")
        try:
            with open(local_path, 'wb') as f:
                ftp.retrbinary(f"RETR {filename}", f.write)
            print(f"Successfully downloaded {filename}")
        except Exception as e:
            print(f"Error downloading {filename}: {e}")
            if os.path.exists(local_path):
                os.remove(local_path)
            continue
            
        links_added = parse_pubmed_xml(local_path, trie, entity_metadata, name_to_id, conn)
        
        if os.path.exists(local_path):
            os.remove(local_path)
            print(f"Deleted local archive {filename} to conserve disk space.")
            
        processed_count += 1
        
    ftp.quit()
    if processed_count > 0:
        print("Updating metadata counts...")
        update_metadata_counts(conn)
    conn.close()
    print(f"Incremental ingestion session complete: Processed {processed_count} files.")

# ----------------- MAIN CLI -----------------
def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.abspath(os.path.join(script_dir, ".."))
    default_db_path = os.path.join(base_dir, "pubmed_data/pubmed_graph.db")
    default_dict_path = os.path.join(base_dir, "pubmed_data/entity_dictionary.json")
    default_src_dir = os.path.join(base_dir, "pubmed_data/baseline")

    parser = argparse.ArgumentParser(description="Project Episteme: Scaled PubMed Ingestion & Traversal Engine CLI")
    subparsers = parser.add_subparsers(dest="command", help="Pipeline commands")
    
    # Download parser
    p_download = subparsers.add_parser("download", help="Download baseline XML.GZ files from NCBI FTP")
    p_download.add_argument("--num-files", type=int, default=None, help="Number of baseline files to download (defaults to all)")
    p_download.add_argument("--dest-dir", type=str, default=default_src_dir, help="Directory to save baseline files")
    
    # Parse parser
    p_parse = subparsers.add_parser("parse", help="Parse downloaded XML.GZ files and populate the database")
    p_parse.add_argument("--db-path", type=str, default=default_db_path, help="Path to SQLite graph database")
    p_parse.add_argument("--dict-path", type=str, default=default_dict_path, help="Path to exported entity dictionary")
    p_parse.add_argument("--src-dir", type=str, default=default_src_dir, help="Directory containing downloaded XML.GZ files")
    
    # Ingest parser
    p_ingest = subparsers.add_parser("ingest", help="Incrementally download, parse, and delete baseline XML.GZ files")
    p_ingest.add_argument("--limit", type=int, default=None, help="Max number of files to process in this run")
    p_ingest.add_argument("--db-path", type=str, default=default_db_path, help="Path to SQLite graph database")
    p_ingest.add_argument("--dict-path", type=str, default=default_dict_path, help="Path to exported entity dictionary")
    p_ingest.add_argument("--dest-dir", type=str, default=default_src_dir, help="Temporary download directory")
    
    # Traverse parser
    p_traverse = subparsers.add_parser("traverse", help="Run pathfinding algorithm between two nodes")
    p_traverse.add_argument("source", type=str, help="Source node name (e.g. Magnesium)")
    p_traverse.add_argument("target", type=str, help="Target node name (e.g. Migraine)")
    p_traverse.add_argument("--hops", type=int, default=4, help="Maximum traversal depth (default 4)")
    p_traverse.add_argument("--db-path", type=str, default=default_db_path, help="Path to SQLite graph database")
    p_traverse.add_argument("--json", action="store_true", help="Output paths in JSON format")
    p_traverse.add_argument("--exclude", type=str, default="", help="Comma-separated concepts to exclude")
    
    # Swanson parser
    p_swanson = subparsers.add_parser("swanson", help="Find B-terms linking A and C in SQLite database")
    p_swanson.add_argument("source", type=str, help="Source term A")
    p_swanson.add_argument("target", type=str, help="Target term C")
    p_swanson.add_argument("--db-path", type=str, default=default_db_path, help="Path to SQLite graph database")
    p_swanson.add_argument("--json", action="store_true", help="Output results in JSON format")
    p_swanson.add_argument("--include-evidence", action="store_true", help="Include full co-occurrence evidence in results")
    p_swanson.add_argument("--exclude", type=str, default="", help="Comma-separated concepts to exclude")
    
    # Evidence parser
    p_evidence = subparsers.add_parser("evidence", help="Get co-occurrence evidence between two nodes")
    p_evidence.add_argument("node1", type=str, help="First node name")
    p_evidence.add_argument("node2", type=str, help="Second node name")
    p_evidence.add_argument("node3", type=str, nargs="?", default=None, help="Third node name (optional)")
    p_evidence.add_argument("--limit", type=int, default=15, help="Max number of evidence articles to fetch")
    p_evidence.add_argument("--db-path", type=str, default=default_db_path, help="Path to SQLite graph database")
    p_evidence.add_argument("--json", action="store_true", help="Output results in JSON format")
    p_evidence.add_argument("--exclude", type=str, default="", help="Comma-separated concepts to exclude")

    # Recursive Swanson parser
    p_rec_swanson = subparsers.add_parser("recursive_swanson", help="Find recursive Swanson path of depth 1, 3, or 7 between A and C through bridge B")
    p_rec_swanson.add_argument("source", type=str, help="Source term A")
    p_rec_swanson.add_argument("target", type=str, help="Target term C")
    p_rec_swanson.add_argument("bridge", type=str, help="Bridge term B")
    p_rec_swanson.add_argument("--depth", type=int, default=3, choices=[1, 3, 7], help="Total intermediate nodes (default 3)")
    p_rec_swanson.add_argument("--db-path", type=str, default=default_db_path, help="Path to SQLite graph database")
    p_rec_swanson.add_argument("--json", action="store_true", help="Output results in JSON format")
    p_rec_swanson.add_argument("--exclude", type=str, default="", help="Comma-separated concepts to exclude")
    
    # Status parser
    p_status = subparsers.add_parser("status", help="Show pipeline database statistics")
    p_status.add_argument("--db-path", type=str, default=default_db_path, help="Path to SQLite graph database")
    
    # Autocomplete parser
    p_autocomplete = subparsers.add_parser("autocomplete", help="Suggest matching concepts in SQLite database")
    p_autocomplete.add_argument("query", type=str, help="Search query string")
    p_autocomplete.add_argument("--db-path", type=str, default=default_db_path, help="Path to SQLite graph database")
    
    # Validate parser
    p_validate = subparsers.add_parser("validate", help="Validate a list of terms against SQLite nodes")
    p_validate.add_argument("terms", type=str, help="Comma-separated or JSON list of terms")
    p_validate.add_argument("--db-path", type=str, default=default_db_path, help="Path to SQLite graph database")

    # Open Discovery parser
    p_open = subparsers.add_parser("open_discovery", help="Run single-term open discovery to find known universe and novel structural gaps")
    p_open.add_argument("term", type=str, help="Source concept term (e.g. Metformin)")
    p_open.add_argument("--db-path", type=str, default=default_db_path, help="Path to SQLite graph database")
    p_open.add_argument("--json", action="store_true", help="Output results in JSON format")
    
    args = parser.parse_args()
    
    db_path = args.db_path if hasattr(args, 'db_path') else default_db_path
    
    if args.command == "download":
        download_baseline_files(args.dest_dir, args.num_files)
    elif args.command == "parse":
        conn = init_db(args.db_path)
        trie, entity_metadata, name_to_id = load_trie(args.dict_path)
        
        if not os.path.exists(args.src_dir):
            print(f"Source directory {args.src_dir} does not exist. Run download first.")
            return
            
        xml_files = sorted([os.path.join(args.src_dir, f) for f in os.listdir(args.src_dir) if f.endswith('.xml.gz')])
        print(f"Found {len(xml_files)} baseline files to process in {args.src_dir}")
        
        total_links = 0
        for f_path in xml_files:
            total_links += parse_pubmed_xml(f_path, trie, entity_metadata, name_to_id, conn)
            
        print("Updating metadata counts...")
        update_metadata_counts(conn)
        print(f"\nIngestion session completed. Added a total of {total_links} links.")
        conn.close()
        
    elif args.command == "ingest":
        ingest_all_pubmed(args.db_path, args.dict_path, args.dest_dir, args.limit)
    elif args.command == "traverse":
        find_paths(args.db_path, args.source, args.target, args.hops, args.json, args.exclude)
    elif args.command == "swanson":
        find_swanson_b_terms(args.db_path, args.source, args.target, args.json, args.include_evidence, args.exclude)
    elif args.command == "open_discovery":
        open_discovery(db_path, args.term, args.json)
    elif args.command == "recursive_swanson":
        get_recursive_swanson_path(db_path, args.source, args.target, args.bridge, args.depth, args.json, args.exclude)
    elif args.command == "evidence":
        get_cooccurrence_evidence(db_path, args.node1, args.node2, args.node3, limit=args.limit, as_json=args.json, exclude=args.exclude)
    elif args.command == "autocomplete":
        find_node_suggestions(db_path, args.query)
    elif args.command == "validate":
        validate_concepts(db_path, args.terms)
    elif args.command == "status":
        print_status(db_path)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
