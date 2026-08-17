import sqlite3
import sys
import json
import os

def main():
    db_path = 'pubmed_data/pubmed_graph.db'
    dict_path = 'pubmed_data/entity_dictionary.json'
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Add degree column if not exists
    try:
        cursor.execute('ALTER TABLE nodes ADD COLUMN degree INTEGER DEFAULT 0')
        conn.commit()
        print('Added degree column to nodes table.')
    except sqlite3.OperationalError:
        print('Degree column already exists.')
        
    # 2. Populate dictionary nodes if dictionary exists
    if os.path.exists(dict_path):
        print(f"Loading entity dictionary from {dict_path}...")
        with open(dict_path, 'r', encoding='utf-8') as f:
            entities = json.load(f)
        
        print(f"Pre-populating nodes table with {len(entities)} dictionary nodes...")
        cursor.executemany(
            "INSERT OR IGNORE INTO nodes (id, name, type, degree) VALUES (?, ?, ?, 0)",
            [(ent['id'], ent['name'], ent['type']) for ent in entities]
        )
        conn.commit()
        print("Dictionary nodes pre-populated successfully.")
    else:
        print("Warning: entity dictionary not found. Skipping pre-population.")
        
    # 3. Always recalculate node degrees to ensure accuracy and cover dictionary nodes
    print('Starting node degree aggregation and population...')
    cursor.execute("UPDATE nodes SET degree = 0")
    cursor.execute("""
        CREATE TEMP TABLE node_counts AS
        SELECT node_id, COUNT(*) as cnt
        FROM article_nodes
        GROUP BY node_id
    """)
    cursor.execute('CREATE INDEX temp_node_counts_idx ON node_counts(node_id)')
    cursor.execute("""
        UPDATE nodes
        SET degree = COALESCE((SELECT cnt FROM node_counts WHERE node_counts.node_id = nodes.id), 0)
    """)
    cursor.execute("DROP TABLE IF EXISTS node_counts")
    conn.commit()
    print('Successfully aggregated and populated node degrees.')
    
    # 4. Create index on nodes(name) for fast lookups
    print('Creating case-insensitive index on nodes(name)...')
    cursor.execute('DROP INDEX IF EXISTS idx_nodes_name')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_nodes_name ON nodes(name COLLATE NOCASE)')
    conn.commit()
    print('Index on nodes(name COLLATE NOCASE) created successfully.')
    
    # 5. Re-classify obviously chemical/compound nodes that MeSH misclassified as phenotypes
    print('Re-classifying miscategorized MeSH compound nodes...')
    cursor.execute("SELECT id, name FROM nodes WHERE type = 'phenotype'")
    phenotype_nodes = cursor.fetchall()
    
    chemical_suffixes = [
        ' Acid', ' Acids', ' Chloride', ' Chlorides', ' Sulfate', ' Sulfates',
        ' Phosphate', ' Phosphates', ' Oxide', ' Oxides', ' Peroxide', ' Peroxides',
        ' Salicylate', ' Salicylates', ' Hydride', ' Bromide', ' Iodide', ' Fluoride',
        ' Carbonate', ' Carbonates', ' Glutamate', ' Glutamates', ' Oxalate', ' Oxalates',
        ' Acetate', ' Lactate', ' Maleate', ' Fumarate', ' Citrate', ' Nitrate', ' Nitrite',
        ' Diethylamide', ' Glycol', ' Glycols', ' Ether', ' Ethers', ' Alcohol', ' Alcohols',
        ' Ester', ' Esters', ' Hydroxide', ' Hydroxides', ' Silicate', ' Silicates'
    ]

    exclude_ine = ('medicine', 'urine', 'spine', 'line', 'vaccine', 'bovine', 'equine', 'canine', 'feline', 'marine', 'uterine', 'endocrine', 'exocrine', 'limousine', 'discipline', 'doctrine', 'decline', 'pipeline', 'outline', 'shoreline', 'headline', 'streamline', 'guideline', 'baseline', 'online', 'offline', 'timeline', 'famine', 'engine', 'combine', 'shrine', 'pine', 'wine', 'shine', 'swine', 'fine', 'mine', 'nine', 'sine', 'airline', 'machine', 'quarantine', 'caffeine', 'cocaine', 'routine', 'feline', 'equine')
    exclude_one = ('bone', 'stone', 'zone', 'cone', 'alone', 'clone', 'drone', 'phone', 'throne', 'milestone', 'tombstone', 'ozone')
    exclude_ol = ('school', 'pool', 'tool', 'fool', 'cool', 'wool', 'sol', 'protocol', 'control', 'parasol', 'capitol')
    exclude_in = ('brain', 'skin', 'grain', 'pain', 'vein', 'rain', 'train', 'chain', 'strain', 'drain', 'main', 'gain', 'plain', 'slain', 'remain', 'domain', 'fountain', 'mountain', 'curtain', 'certain', 'again', 'against', 'captain', 'bargain', 'sin', 'twin', 'spin', 'pin', 'tin', 'fin', 'bin', 'chin', 'shin', 'thin', 'within', 'cousin', 'basin', 'cabin', 'margin', 'origin', 'virgin', 'bulletin', 'groin', 'heroin')

    reclassify_ids = []
    
    # Specific known chemicals that MeSH misclassified
    known_chemicals = {
        'magnesium', 'calcium', 'sodium', 'potassium', 'barium', 'lithium', 'cadmium', 'tritium', 
        'caffeine', 'procaine', 'clonidine', 'verapamil', 'cholesterol', 'methanol', 'ethanol', 
        'isoproterenol', 'propranolol', 'metaraminol', 'alprenolol', 'trifluoroethanol', 'chlordiazepoxide', 
        'ipratropium', 'cycloheximide', 'glutethimide', 'cyclophosphamide', 'ifosfamide', 'ethylmaleimide', 
        'iodoacetamide', 'mercaptoethanol', 'phosphocreatine', 'urea', 'melatonin', 'serotonin', 
        'dopamine', 'histamine', 'epinephrine', 'norepinephrine', 'acetylcholine'
    }

    for node_id, name in phenotype_nodes:
        name_lower = name.lower().strip()
        is_chem = False
        
        if name_lower in known_chemicals:
            is_chem = True
            
        if not is_chem:
            for suff in chemical_suffixes:
                if name.endswith(suff):
                    is_chem = True
                    break
                    
        if not is_chem:
            if name_lower.endswith('ine') and (not name_lower.endswith(exclude_ine) or name_lower.endswith('amine')):
                is_chem = True
            elif name_lower.endswith('one') and not name_lower.endswith(exclude_one):
                is_chem = True
            elif name_lower.endswith('ol') and not name_lower.endswith(exclude_ol):
                is_chem = True
            elif name_lower.endswith('in') and not name_lower.endswith(exclude_in) and not name_lower.endswith('protein') and not name_lower.endswith('toxin'):
                is_chem = True
                
        if is_chem:
            reclassify_ids.append(node_id)
            
    print(f"Found {len(reclassify_ids)} phenotype nodes to re-classify as compounds based on name pattern.")
    if reclassify_ids:
        cursor.executemany(
            "UPDATE nodes SET type = 'compound' WHERE id = ?",
            [(nid,) for nid in reclassify_ids]
        )
        conn.commit()
    
    # 6. Propagate compound type to duplicate phenotype nodes sharing name with compounds
    print('Propagating compound type to duplicate nodes sharing name with compounds...')
    cursor.execute("""
        UPDATE nodes
        SET type = 'compound'
        WHERE type = 'phenotype' AND name IN (
            SELECT name FROM nodes WHERE type = 'compound' OR id LIKE 'CHEM:%'
        )
    """)
    conn.commit()
    print(f"Propagated compound type to {cursor.rowcount} duplicate nodes.")
    
    conn.close()
    print("Database migration completed successfully.")

if __name__ == '__main__':
    main()
