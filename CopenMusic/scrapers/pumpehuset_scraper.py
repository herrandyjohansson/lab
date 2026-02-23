"""
Pumpehuset scraper for CopenMusic concert scraper system.
"""

import re
from typing import Dict, List, Any
from bs4 import BeautifulSoup
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from base_scraper import BaseScraper


class PumpehusetScraper(BaseScraper):
    """Scraper for Pumpehuset concert venue."""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.venue_id = 'pumpehuset'
        self.venue_name = 'Pumpehuset'
    
    def parse_concerts(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """
        Parse Pumpehuset concerts from the program page.
        """
        concerts = []
        
        # Look for event containers with date information
        event_containers = soup.find_all('div', class_='single-event-banner-text')
        
        for container in event_containers:
            try:
                # Extract date and time from the container
                container_text = container.get_text()
                
                # Look for date pattern (e.g., "27. mar 2026", "19. sep 2026")
                date_match = re.search(r'(\d{1,2})\.\s*(\w+)\s*(\d{4})', container_text)
                if not date_match:
                    continue
                
                day, month, year = date_match.groups()
                
                # Look for artist name - usually in a nearby element
                artist_name = ""
                
                # Check if there's a link in or near this container
                event_link = container.find_parent('a')
                if event_link:
                    artist_name = event_link.get_text().strip()
                else:
                    # Look for the next element with artist info
                    next_element = container.find_next()
                    if next_element:
                        potential_artist = next_element.get_text().strip()
                        if len(potential_artist) > 2 and potential_artist not in ['mere info', 'Køb billet']:
                            artist_name = potential_artist
                
                # Skip if no artist found
                if not artist_name:
                    continue
                
                # Try to find event URL
                event_url = ""
                all_links = soup.find_all('a', href=re.compile(r'/event/|/arrangement/'))
                for link in all_links:
                    link_text = link.get_text().strip()
                    if artist_name.lower() in link_text.lower() or link_text.lower() in artist_name.lower():
                        href = link.get('href', '')
                        if href.startswith('/'):
                            event_url = f"https://pumpehuset.dk{href}"
                        else:
                            event_url = href
                        break
                
                # Parse month name to number
                month_map = {
                    'jan': 1, 'januar': 1,
                    'feb': 2, 'februar': 2,
                    'mar': 3, 'marts': 3,
                    'apr': 4, 'april': 4,
                    'maj': 5, 'maj': 5,
                    'jun': 6, 'juni': 6,
                    'jul': 7, 'juli': 7,
                    'aug': 8, 'august': 8,
                    'sep': 9, 'september': 9,
                    'okt': 10, 'oktober': 10,
                    'nov': 11, 'november': 11,
                    'dec': 12, 'december': 12
                }
                
                month_num = month_map.get(month.lower(), 1)
                
                # Format date as ISO
                try:
                    date_iso = f"{year}-{month_num:02d}-{int(day):02d}"
                except (ValueError, TypeError):
                    date_iso = f"{year}-{month_num:02d}-{day:02d}"
                
                # Default time (Pumpehuset doesn't seem to show times)
                time_str = "19:00"  # Default evening time
                
                concerts.append({
                    'name': artist_name,
                    'date': date_iso,
                    'time': time_str,
                    'status': 'Tilgængelig',  # Default status
                    'url': event_url,
                    'support': '',
                    'genre': '',
                    'price': None
                })
                
            except Exception as e:
                self.logger.warning(f"Error parsing event container: {e}")
                continue
        
        return concerts
