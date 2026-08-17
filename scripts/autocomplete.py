import sys
import json
import sqlite3

def connect_db(db_path):
    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    # Optimize SQLite parameters for high-performance read
    conn.execute("PRAGMA cache_size = -262144")   # 256MB cache limit
    conn.execute("PRAGMA temp_store = MEMORY")    # Temp tables in RAM for fast joins
    conn.execute("PRAGMA mmap_size = 2147483648")  # 2GB memory-mapped files
    return conn

def find_node_suggestions(db_path, query_str):
    conn = connect_db(db_path)
    cursor = conn.cursor()
    
    # 1. Prefix match (uses idx_nodes_name_nocase range scan, extremely fast)
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
    return results

def main():
    if len(sys.argv) < 2:
        print(json.dumps([]))
        return
    
    query_str = sys.argv[1]
    db_path = 'pubmed_data/pubmed_graph.db'
    if len(sys.argv) > 2:
        db_path = sys.argv[2]
        
    try:
        results = find_node_suggestions(db_path, query_str)
        print(json.dumps(results))
    except Exception as e:
        sys.stderr.write(f"Error: {e}\n")
        print(json.dumps([]))

if __name__ == '__main__':
    main()
