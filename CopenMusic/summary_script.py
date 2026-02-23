#!/usr/bin/env python3
"""
Summary script for GitHub Actions to avoid YAML indentation issues
"""

import json
import sys

def main():
    try:
        with open('output/concerts.json', 'r') as f:
            data = json.load(f)
        
        total = data['metadata']['total_concerts']
        upcoming = data['metadata']['upcoming_concerts']
        venues = data['metadata']['venues_count']
        last_updated = data['last_updated']
        
        print(f"Total concerts: {total}")
        print(f"Upcoming concerts: {upcoming}")
        print(f"Venues: {venues}")
        print(f"Last updated: {last_updated}")
        
        # Set GitHub outputs
        print(f"::set-output name=summary::🎵 Found {total} concerts ({upcoming} upcoming) from {venues} venues")
        print(f"::set-output name=total_concerts::{total}")
        print(f"::set-output name=upcoming_concerts::{upcoming}")
        print(f"::set-output name=venues_count::{venues}")
        
    except Exception as e:
        print(f"::set-output name=summary::❌ Failed to scrape concerts")
        print(f"::set-output name=total_concerts::0")
        print(f"::set-output name=upcoming_concerts::0")
        print(f"::set-output name=venues_count::0")
        sys.exit(1)

if __name__ == '__main__':
    main()
