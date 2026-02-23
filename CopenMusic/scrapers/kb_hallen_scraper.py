"""
K.B. Hallen scraper implementation.
Extracts concert data from https://kbhallen.dk/kalender/
"""

import re
from typing import Dict, List, Any
from bs4 import BeautifulSoup, Tag
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from base_scraper import BaseScraper


class KbHallenScraper(BaseScraper):
    """Scraper for K.B. Hallen concert venue."""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.venue_id = 'kb_hallen'
        self.venue_name = 'K.B. Hallen'
    
    def parse_concerts(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """
        Parse K.B. Hallen concerts from the calendar page.
        The page has concert info spread across multiple elements.
        """
        concerts = []
        
        # Look for list-month divs which contain the concert information
        month_divs = soup.find_all('div', class_='list-month')
        
        for month_div in month_divs:
            try:
                month_text = month_div.get_text()
                
                # Find all concert patterns in this month
                # Pattern: Day.Weekday — Time ArtistName Support Info
                # Note: HTML uses &mdash; entity, so we need to handle both
                concert_pattern = r'(\d{1,2})\.(\w+)\s*(?:—|&mdash;)\s*(\d{1,2}):(\d{2})([^0-9]+?)(?=\d{1,2}\.\w+\s*(?:—|&mdash;)|$)'
                matches = re.findall(concert_pattern, month_text, re.DOTALL)
                
                for match in matches:
                    day, weekday, hour, minute, concert_info = match
                    
                    # Clean up the concert info
                    concert_info = concert_info.strip()
                    
                    # Extract artist name - first line that looks like an artist
                    lines = [line.strip() for line in concert_info.split('\n') if line.strip()]
                    artist_name = ""
                    support = ""
                    
                    for line in lines:
                        line = line.strip()
                        # Skip common non-artist lines
                        if line.lower() in ['info', 'læs mere', 'udsolgt', 'venteliste', 'få billetter']:
                            continue
                        
                        # Extract support acts
                        if 'with special guest:' in line.lower():
                            support_match = re.search(r'with special guest:\s*(.+)', line, re.IGNORECASE)
                            if support_match:
                                support = support_match.group(1).strip()
                                continue
                        
                        if 'support:' in line.lower():
                            support_match = re.search(r'support:\s*(.+)', line, re.IGNORECASE)
                            if support_match:
                                support = support_match.group(1).strip()
                                continue
                        
                        # Look for "+ Artist" pattern
                        if '+' in line and not artist_name:
                            plus_match = re.search(r'([^\+]+)\+\s*(.+)', line)
                            if plus_match:
                                artist_name = plus_match.group(1).strip()
                                support = plus_match.group(2).strip()
                                continue
                        
                        # Artist name is usually the first substantial line
                        if not artist_name and len(line) > 2 and line[0].isupper():
                            # Check if this looks like an artist name
                            if (not re.match(r'^\d', line) and 
                                '—' not in line and
                                line.lower() not in ['info', 'læs mere', 'udsolgt', 'venteliste', 'få billetter']):
                                artist_name = line
                    
                    if not artist_name:
                        continue
                    
                    # Determine status
                    status = "Tilgængelig"
                    if 'udsolgt' in concert_info.lower():
                        status = 'Udsolgt'
                    elif 'venteliste' in concert_info.lower():
                        status = 'Venteliste'
                    elif 'få billetter' in concert_info.lower():
                        status = 'Få billetter'
                    
                    # Find the corresponding URL
                    event_url = ""
                    # Look for links that contain the artist name
                    all_links = soup.find_all('a', href=re.compile(r'/event/'))
                    for link in all_links:
                        href = link.get('href', '')
                        link_text = link.get_text().strip()
                        # Check if this link matches our artist
                        if (artist_name.lower() in link_text.lower() or 
                            link_text.lower() in artist_name.lower()):
                            if href.startswith('/'):
                                event_url = f"https://kbhallen.dk{href}"
                            else:
                                event_url = href
                            break
                    
                    # Parse the date properly
                    date_iso = self._parse_danish_date(day, weekday)
                    time_str = f"{hour.zfill(2)}:{minute.zfill(2)}"
                    
                    concerts.append({
                        'name': artist_name,
                        'date': date_iso,
                        'time': time_str,
                        'status': status,
                        'url': event_url,
                        'support': support,
                        'genre': '',
                        'price': None
                    })
                
            except Exception as e:
                self.logger.warning(f"Error parsing month div: {e}")
                continue
        
        return concerts
    
    def _parse_danish_date(self, day: str, weekday: str) -> str:
        """Parse Danish day and weekday to ISO date format."""
        from datetime import datetime, timedelta
        
        # Map Danish weekdays to English
        weekday_map = {
            'mandag': 0, 'monday': 0,
            'tirsdag': 1, 'tuesday': 1,
            'onsdag': 2, 'wednesday': 2,
            'torsdag': 3, 'thursday': 3,
            'fredag': 4, 'friday': 4,
            'lørdag': 5, 'saturday': 5,
            'søndag': 6, 'sunday': 6
        }
        
        # Get current date
        current_date = datetime.now()
        day_num = int(day)
        
        # Try to find the next occurrence of this weekday
        target_weekday = weekday_map.get(weekday.lower())
        if target_weekday is not None:
            # Find the next date that matches this weekday and day
            for month_offset in range(0, 4):  # Look up to 4 months ahead
                test_date = current_date.replace(day=1) + timedelta(days=32 * month_offset)
                
                # Find the first occurrence of the target weekday in this month
                first_day = test_date.replace(day=1)
                days_until_target = (target_weekday - first_day.weekday()) % 7
                first_occurrence = first_day + timedelta(days=days_until_target)
                
                # Check if any occurrence in this month matches our day
                for week_offset in range(5):  # Check up to 5 weeks
                    candidate_date = first_occurrence + timedelta(weeks=week_offset)
                    if (candidate_date.month == first_occurrence.month and 
                        candidate_date.day == day_num and
                        candidate_date >= current_date):
                        return candidate_date.strftime('%Y-%m-%d')
        
        # Fallback: use current month
        try:
            fallback_date = current_date.replace(day=day_num)
            if fallback_date >= current_date:
                return fallback_date.strftime('%Y-%m-%d')
            else:
                # If date passed, use next month
                if fallback_date.month == 12:
                    fallback_date = fallback_date.replace(year=fallback_date.year + 1, month=1)
                else:
                    fallback_date = fallback_date.replace(month=fallback_date.month + 1)
                return fallback_date.strftime('%Y-%m-%d')
        except ValueError:
            # Invalid day for current month, use next month
            next_month = current_date.replace(day=28) + timedelta(days=4)  # This gets us to next month
            next_month = next_month.replace(day=day_num)
            return next_month.strftime('%Y-%m-%d')
    
    def _find_concert_elements(self, soup: BeautifulSoup) -> List[Tag]:
        """
        Find concert elements on the page.
        Based on the website structure, let's look for patterns that contain concert information.
        """
        concerts = []
        
        # Look for text patterns that match concert entries
        # The page seems to have a pattern like: "25.Onsdag — 20:00" followed by artist name
        page_text = soup.get_text()
        
        # Find patterns that look like concerts
        import re
        
        # Pattern to match date lines and following artist info
        concert_pattern = r'(\d{1,2}\.\w+)\s*—\s*(\d{1,2}:\d{2})\s*([^\n]+?)(?=\d{1,2}\.\w+\s*—|$)'
        matches = re.findall(concert_pattern, page_text)
        
        for match in matches:
            date_part, time_part, artist_part = match
            
            # Extract artist name and URL if present
            artist_lines = artist_part.strip().split('\n')
            artist_name = ""
            event_url = ""
            
            for line in artist_lines:
                line = line.strip()
                if line and not line.lower() in ['info', 'udsolgt', 'venteliste', 'få billetter']:
                    if not artist_name:
                        artist_name = line
                    # Look for URLs in the soup that match this artist
                    if not event_url:
                        links = soup.find_all('a', href=re.compile(r'/event/'))
                        for link in links:
                            if line in link.get_text():
                                href = link.get('href', '')
                                if href.startswith('/'):
                                    href = f"https://kbhallen.dk{href}"
                                event_url = href
                                break
            
            if artist_name and event_url:
                # Create a mock element for consistency
                mock_element = soup.new_tag('div')
                mock_element.string = f"{date_part} — {time_part} {artist_name}"
                
                concert_data = {
                    'name': artist_name,
                    'date': self._parse_date(date_part),
                    'time': time_part,
                    'status': self._extract_status_from_text(artist_part),
                    'url': event_url,
                    'support': self._extract_support_from_text(artist_part),
                    'genre': '',
                    'price': None
                }
                
                concerts.append(concert_data)
        
        return concerts
    
    def _parse_date(self, date_str: str) -> str:
        """Parse Danish date format to ISO format."""
        # Handle formats like "25.Onsdag", "28.Lørdag", etc.
        import re
        
        # Map Danish weekday/month names to numbers if needed
        # For now, assume current year and extract day number
        day_match = re.search(r'(\d{1,2})', date_str)
        if day_match:
            day = day_match.group(1)
            # We'll need to determine the month and year - for now use current date
            from datetime import datetime
            current_date = datetime.now()
            return f"{current_date.year}-{current_date.month:02d}-{day.zfill(2)}"
        
        return date_str
    
    def _extract_status_from_text(self, text: str) -> str:
        """Extract status from text."""
        text_lower = text.lower()
        if 'udsolgt' in text_lower:
            return 'Udsolgt'
        elif 'venteliste' in text_lower:
            return 'Venteliste'
        elif 'få billetter' in text_lower:
            return 'Få billetter'
        else:
            return 'Tilgængelig'
    
    def _extract_support_from_text(self, text: str) -> str:
        """Extract support act information from text."""
        import re
        
        # Look for patterns like "Support: Artist Name"
        support_match = re.search(r'support:\s*([^,\n]+)', text, re.IGNORECASE)
        if support_match:
            return support_match.group(1).strip()
        
        # Look for "+ Artist Name" pattern
        plus_match = re.search(r'\+\s*([^,\n]+)', text)
        if plus_match:
            return plus_match.group(1).strip()
        
        return ""
    
    def _find_concert_container(self, link: Tag) -> Tag:
        """
        Find the container element that holds all information for a single concert.
        """
        # Try to find a common parent that contains date, name, and status
        current = link
        
        # Look up the DOM tree to find a suitable container
        for _ in range(5):  # Limit search depth
            current = current.parent
            if not current:
                break
            
            # Check if this container looks like it has concert info
            if self._has_concert_info(current):
                return current
        
        # Fallback: return the link itself
        return link
    
    def _has_concert_info(self, element: Tag) -> bool:
        """Check if element contains concert information."""
        text = element.get_text().lower()
        
        # Look for patterns that suggest this is a concert container
        has_date = bool(re.search(r'\d{1,2}\.\s*\w+\s*\d{4}', text))
        has_time = bool(re.search(r'\d{1,2}:\d{2}', text))
        has_link = bool(element.find('a', href=re.compile(r'/event/')))
        
        return has_date and has_link
    
    def _extract_concert_data(self, container: Tag) -> Dict[str, Any]:
        """Extract concert data from a container element."""
        # Find the main event link
        event_link = container.find('a', href=re.compile(r'/event/[^"]+'))
        if not event_link:
            return None
        
        # Extract basic information
        url = event_link.get('href', '')
        if not url.startswith('http'):
            url = f"https://kbhallen.dk{url}"
        
        name = self._extract_concert_name(container, event_link)
        date_str, time_str = self._extract_datetime(container)
        status = self._extract_status(container)
        support = self._extract_support_act(container)
        
        return {
            'name': name,
            'date': date_str,
            'time': time_str,
            'status': status,
            'url': url,
            'support': support,
            'genre': '',  # Could be extracted from event details page if needed
            'price': None  # Could be extracted from event details page if needed
        }
    
    def _extract_concert_name(self, container: Tag, event_link: Tag) -> str:
        """Extract the concert name."""
        # Try multiple methods to find the concert name
        
        # Method 1: Use the event link text
        name = event_link.get_text().strip()
        if name and len(name) > 2:
            return name
        
        # Method 2: Look for headings near the link
        for tag_name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            heading = container.find(tag_name)
            if heading:
                name = heading.get_text().strip()
                if name and len(name) > 2:
                    return name
        
        # Method 3: Look for strong/bold text
        for tag in container.find_all(['strong', 'b']):
            text = tag.get_text().strip()
            if text and len(text) > 2 and not self._is_date_or_time(text):
                return text
        
        # Method 4: Look for the most prominent text
        all_text = container.get_text()
        lines = [line.strip() for line in all_text.split('\n') if line.strip()]
        
        for line in lines:
            if not self._is_date_or_time(line) and not self._is_status(line):
                return line
        
        return "Unknown Concert"
    
    def _extract_datetime(self, container: Tag) -> tuple[str, str]:
        """Extract date and time information."""
        text = container.get_text()
        
        # Extract date (Danish format: DD.MM.YYYY or DD. Month YYYY)
        date_patterns = [
            r'(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})',  # DD.MM.YYYY
            r'(\d{1,2})\.\s*([a-zA-Z]+)\s*(\d{4})',   # DD. Month YYYY
            r'(\d{4})-(\d{2})-(\d{2})',               # YYYY-MM-DD
        ]
        
        date_str = ""
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                if pattern.startswith(r'(\d{1,2})\.\s*([a-zA-Z]+)'):  # DD. Month YYYY
                    day, month_name, year = match.groups()
                    # Convert month name to number (simplified)
                    months = {
                        'januar': '01', 'jan': '01',
                        'februar': '02', 'feb': '02',
                        'marts': '03', 'mar': '03',
                        'april': '04', 'apr': '04',
                        'maj': '05', 'mai': '05',
                        'juni': '06', 'jun': '06',
                        'juli': '07', 'jul': '07',
                        'august': '08', 'aug': '08',
                        'september': '09', 'sep': '09',
                        'oktober': '10', 'okt': '10',
                        'november': '11', 'nov': '11',
                        'december': '12', 'dec': '12'
                    }
                    month = months.get(month_name.lower(), '01')
                    date_str = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                else:
                    groups = match.groups()
                    if len(groups) == 3:
                        if pattern.startswith(r'(\d{1,2})\.'):  # DD.MM.YYYY
                            day, month, year = groups
                        else:  # YYYY-MM-DD
                            year, month, day = groups
                        date_str = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                break
        
        # Extract time
        time_patterns = [
            r'(\d{1,2}):(\d{2})',  # HH:MM
            r'kl\.\s*(\d{1,2}):(\d{2})',  # kl. HH:MM
            r'(\d{1,2})\s*-\s*(\d{2})',  # HH - MM
        ]
        
        time_str = ""
        for pattern in time_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                hour, minute = match.groups()
                time_str = f"{hour.zfill(2)}:{minute.zfill(2)}"
                break
        
        return date_str, time_str
    
    def _extract_status(self, container: Tag) -> str:
        """Extract concert status (sold out, waiting list, etc.)."""
        text = container.get_text().lower()
        
        # Look for status indicators
        status_indicators = {
            'udsolgt': 'Udsolgt',
            'sold out': 'Udsolgt',
            'venteliste': 'Venteliste',
            'waiting list': 'Venteliste',
            'få billetter': 'Få billetter',
            'few tickets': 'Få billetter',
        }
        
        for indicator, status in status_indicators.items():
            if indicator in text:
                return status
        
        return "Tilgængelig"
    
    def _extract_support_act(self, container: Tag) -> str:
        """Extract support act information."""
        text = container.get_text()
        
        # Look for patterns like "Support: Artist Name" or "With: Artist Name"
        support_patterns = [
            r'support:\s*([^,\n]+)',
            r'with:\s*([^,\n]+)',
            r'med:\s*([^,\n]+)',
            r'opvarmning:\s*([^,\n]+)',
        ]
        
        for pattern in support_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _is_date_or_time(self, text: str) -> bool:
        """Check if text looks like a date or time."""
        text = text.strip()
        
        # Date patterns
        date_patterns = [
            r'\d{1,2}\.\d{1,2}\.\d{4}',
            r'\d{4}-\d{2}-\d{2}',
            r'\d{1,2}\.\s*[a-zA-Z]+\s*\d{4}',
        ]
        
        # Time patterns
        time_patterns = [
            r'\d{1,2}:\d{2}',
            r'kl\.\s*\d{1,2}',
        ]
        
        # Day names in Danish
        day_names = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag']
        
        for pattern in date_patterns + time_patterns:
            if re.search(pattern, text):
                return True
        
        return any(day in text.lower() for day in day_names)
    
    def _is_status(self, text: str) -> bool:
        """Check if text looks like a status indicator."""
        text = text.lower().strip()
        status_words = [
            'udsolgt', 'sold out', 'venteliste', 'waiting list',
            'få billetter', 'few tickets', 'tilgængelig', 'available',
            'info', 'læs mere', 'read more'
        ]
        return any(word in text for word in status_words)
