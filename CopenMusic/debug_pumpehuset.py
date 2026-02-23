#!/usr/bin/env python3
"""
Debug script to analyze Pumpehuset website structure
"""

import requests
from bs4 import BeautifulSoup
import re

def main():
    url = "https://pumpehuset.dk/program/?genre=Jazz%2CMetal%2CRock%2CPop"
    
    print(f"Fetching: {url}")
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    print("\n=== PAGE TITLE ===")
    print(soup.title.string if soup.title else "No title")
    
    print("\n=== LOOKING FOR CONCERT PATTERNS ===")
    
    # Get all text content
    page_text = soup.get_text()
    print(f"Page text length: {len(page_text)}")
    
    # Look for date patterns
    date_patterns = [
        r'\d{1,2}\.\s*\w+\s*—\s*\d{1,2}:\d{2}',
        r'\d{1,2}\.\s*\w+\s*-\s*\d{1,2}:\d{2}',
        r'\d{1,2}\s*/\s*\w+\s*\d{1,2}:\d{2}',
    ]
    
    for pattern in date_patterns:
        matches = re.findall(pattern, page_text)
        if matches:
            print(f"Pattern '{pattern}' found {len(matches)} matches:")
            for match in matches[:3]:
                print(f"  {match}")
    
    print("\n=== LOOKING FOR EVENT LINKS ===")
    
    # Look for event links
    event_links = soup.find_all('a', href=re.compile(r'/event/|/program/|/arrangement/'))
    print(f"Found {len(event_links)} potential event links:")
    
    for i, link in enumerate(event_links[:10]):
        href = link.get('href', '')
        text = link.get_text().strip()
        print(f"{i+1}. {text} -> {href}")
    
    print("\n=== LOOKING FOR CONCERT CONTAINERS ===")
    
    # Look for common concert container classes
    concert_containers = soup.find_all(['div', 'section', 'article'], class_=re.compile(r'event|concert|show|program', re.IGNORECASE))
    print(f"Found {len(concert_containers)} potential concert containers:")
    
    for i, container in enumerate(concert_containers[:5]):
        classes = container.get('class', [])
        text = container.get_text()[:100].strip()
        print(f"{i+1}. Classes: {classes}")
        print(f"   Text: {text}...")
        print("---")
    
    print("\n=== SAMPLE PAGE TEXT ===")
    lines = [line.strip() for line in page_text.split('\n') if line.strip()]
    for i, line in enumerate(lines[:20]):
        print(f"{i+1:2d}: {line}")

if __name__ == '__main__':
    main()
