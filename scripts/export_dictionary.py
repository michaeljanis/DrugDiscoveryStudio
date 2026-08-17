import re
import json
import os

def parse_knowledge_graph(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple state machine to parse the nodes array from the TS file
    # We look for the nodes list start: export const nodes: BKGNode[] = [
    match = re.search(r'export\s+const\s+nodes:\s+BKGNode\[\]\s*=\s*\[(.*?)\];', content, re.DOTALL)
    if not match:
        # Fallback to general search if type annotation is slightly different
        match = re.search(r'const\s+nodes\s*=\s*\[(.*?)\];', content, re.DOTALL)
        if not match:
            raise ValueError("Could not find nodes array in knowledgeGraph.ts")
            
    nodes_content = match.group(1)
    
    # Split by node objects. Each node is surrounded by {...}
    # Since details is also an object, we need to balance braces or use a regex that matches the structure.
    # A robust regex for matching individual node blocks in the TS structure:
    node_pattern = re.compile(
        r'\{\s*id:\s*["\']([^"\']+)["\'],\s*'
        r'name:\s*["\']([^"\']+)["\'],\s*'
        r'type:\s*["\']([^"\']+)["\']'
        r'(.*?)\}', 
        re.DOTALL
    )
    
    dictionary = []
    
    for m in node_pattern.finditer(nodes_content):
        node_id = m.group(1)
        name = m.group(2)
        node_type = m.group(3)
        rest = m.group(4)
        
        # Extract synonyms from the details block if present
        synonyms = []
        syn_match = re.search(r'synonyms:\s*\[(.*?)\]', rest, re.DOTALL)
        if syn_match:
            # Split synonyms by comma and strip quotes
            syn_items = syn_match.group(1).split(',')
            for item in syn_items:
                clean_item = item.strip().strip('"').strip("'").strip()
                if clean_item:
                    synonyms.append(clean_item)
                    
        dictionary.append({
            "id": node_id,
            "name": name,
            "type": node_type,
            "synonyms": synonyms
        })
        
    return dictionary

def main():
    workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    kg_path = os.path.join(workspace_dir, "src/data/knowledgeGraph.ts")
    out_dir = os.path.join(workspace_dir, "pubmed_data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "entity_dictionary.json")
    
    print(f"Parsing knowledge graph from {kg_path}...")
    dictionary = parse_knowledge_graph(kg_path)
    print(f"Extracted {len(dictionary)} biological entities.")
    
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, indent=2)
        
    print(f"Entity dictionary successfully exported to {out_path}")

if __name__ == "__main__":
    main()
