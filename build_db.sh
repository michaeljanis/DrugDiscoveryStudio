#!/bin/bash
# Project Episteme: Periodical PubMed Totality Ingestion Script
set -e

echo "================================================="
echo "PROJECT EPISTEME: PERIODIC PUBMED TOTALITY BUILD"
echo "================================================="
echo "Starting incremental ingestion of all PubMed baseline archives..."

# Running the python pipeline in ingest mode
# This connects to the NCBI FTP, downloads, parses, and deletes baseline gz files incrementally.
python3 scripts/pubmed_pipeline.py ingest

echo "================================================="
echo "PUBMED GRAPH DATABASE COMPILATION COMPLETED!"
echo "================================================="
