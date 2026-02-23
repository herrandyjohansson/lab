"""
Base scraper class for concert venues.
Provides common functionality for all venue-specific scrapers.
"""

import requests
import time
import logging
from abc import ABC, abstractmethod
from bs4 import BeautifulSoup
from datetime import datetime
from typing import Dict, List, Optional, Any
import re


class BaseScraper(ABC):
    """Base class for all venue scrapers with common functionality."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize scraper with venue configuration.
        
        Args:
            config: Venue-specific configuration dictionary
        """
        self.config = config
        self.venue_id = config.get('venue_id', 'unknown')
        self.venue_name = config.get('venue_name', 'Unknown Venue')
        self.base_url = config.get('url', '')
        self.rate_limit = config.get('rate_limit', 1)  # requests per second
        self.session = requests.Session()
        self.logger = self._setup_logger()
        
        # Set up session headers
        self.session.headers.update({
            'User-Agent': 'CopenMusic-Concert-Scraper/1.0 (Educational Purpose)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        })
    
    def _setup_logger(self) -> logging.Logger:
        """Set up venue-specific logger."""
        logger = logging.getLogger(f'{self.__class__.__name__}_{self.venue_id}')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                f'[{self.venue_id}] %(asctime)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def fetch_page(self, url: Optional[str] = None, retries: int = 3) -> Optional[BeautifulSoup]:
        """
        Fetch webpage and return BeautifulSoup object.
        
        Args:
            url: URL to fetch (defaults to base_url)
            retries: Number of retry attempts
            
        Returns:
            BeautifulSoup object or None if failed
        """
        target_url = url or self.base_url
        
        for attempt in range(retries):
            try:
                self.logger.info(f"Fetching page: {target_url} (attempt {attempt + 1})")
                
                response = self.session.get(target_url, timeout=30)
                response.raise_for_status()
                
                # Respect rate limiting
                if self.rate_limit > 0:
                    time.sleep(1 / self.rate_limit)
                
                return BeautifulSoup(response.content, 'html.parser')
                
            except requests.RequestException as e:
                self.logger.warning(f"Request failed (attempt {attempt + 1}): {e}")
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    self.logger.error(f"Failed to fetch page after {retries} attempts")
                    return None
    
    @abstractmethod
    def parse_concerts(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """
        Parse concerts from BeautifulSoup object.
        Must be implemented by each venue scraper.
        
        Args:
            soup: BeautifulSoup object containing the page content
            
        Returns:
            List of raw concert data dictionaries
        """
        pass
    
    def normalize_data(self, raw_concert: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert venue-specific concert data to unified structure.
        
        Args:
            raw_concert: Raw concert data from venue scraper
            
        Returns:
            Normalized concert data dictionary
        """
        # Generate unique ID
        concert_id = self._generate_concert_id(raw_concert)
        
        # Normalize date and time
        date_str = raw_concert.get('date', '')
        time_str = raw_concert.get('time', '')
        normalized_date, normalized_time = self._normalize_datetime(date_str, time_str)
        
        # Normalize status
        status = self._normalize_status(raw_concert.get('status', ''))
        
        return {
            'id': concert_id,
            'name': raw_concert.get('name', '').strip(),
            'date': normalized_date,
            'time': normalized_time,
            'status': status,
            'url': raw_concert.get('url', ''),
            'support': raw_concert.get('support', ''),
            'genre': raw_concert.get('genre', ''),
            'price': raw_concert.get('price', None),
            'venue': self.venue_id,
            'venue_name': self.venue_name,
            'raw_data': raw_concert  # Keep original data for debugging
        }
    
    def _generate_concert_id(self, raw_concert: Dict[str, Any]) -> str:
        """Generate unique concert ID."""
        name = raw_concert.get('name', '').lower().replace(' ', '-')
        date = raw_concert.get('date', '').replace('.', '-').replace('/', '-')
        return f"{self.venue_id}-{name}-{date}"
    
    def _normalize_datetime(self, date_str: str, time_str: str) -> tuple[str, str]:
        """Normalize date and time to consistent format."""
        # Handle Danish date formats (DD.MM.YYYY, DD/MM/YYYY, etc.)
        date_patterns = [
            r'(\d{2})\.(\d{2})\.(\d{4})',  # DD.MM.YYYY
            r'(\d{2})/(\d{2})/(\d{4})',   # DD/MM/YYYY
            r'(\d{4})-(\d{2})-(\d{2})',   # YYYY-MM-DD
        ]
        
        normalized_date = date_str
        for pattern in date_patterns:
            match = re.search(pattern, date_str)
            if match:
                if pattern.startswith(r'(\d{2})'):  # Danish format
                    day, month, year = match.groups()
                else:  # ISO format
                    year, month, day = match.groups()
                normalized_date = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                break
        
        # Normalize time (ensure HH:MM format)
        normalized_time = time_str
        if time_str and ':' not in time_str:
            # Handle formats like "20:00" -> "20:00", "20" -> "20:00"
            if re.match(r'^\d{1,2}$', time_str):
                normalized_time = f"{time_str.zfill(2)}:00"
        
        return normalized_date, normalized_time
    
    def _normalize_status(self, status: str) -> str:
        """Normalize concert status to standard values."""
        status_lower = status.lower().strip()
        
        status_mapping = {
            'udsolgt': 'sold_out',
            'sold out': 'sold_out',
            'venteliste': 'waiting_list',
            'waiting list': 'waiting_list',
            'få billetter': 'few_tickets',
            'few tickets': 'few_tickets',
            'tilgængelig': 'available',
            'available': 'available',
        }
        
        return status_mapping.get(status_lower, 'available')
    
    def validate_concert(self, concert: Dict[str, Any]) -> bool:
        """
        Validate concert data has required fields.
        
        Args:
            concert: Concert data dictionary
            
        Returns:
            True if valid, False otherwise
        """
        required_fields = ['name', 'date', 'url']
        return all(concert.get(field) for field in required_fields)
    
    def run(self) -> Dict[str, Any]:
        """
        Main execution method for the scraper.
        
        Returns:
            Dictionary with venue results and metadata
        """
        start_time = datetime.now()
        self.logger.info(f"Starting scraper for {self.venue_name}")
        
        try:
            # Fetch the main page
            soup = self.fetch_page()
            if not soup:
                return self._create_error_result("Failed to fetch page")
            
            # Parse concerts
            raw_concerts = self.parse_concerts(soup)
            self.logger.info(f"Found {len(raw_concerts)} raw concert entries")
            
            # Normalize and validate concerts
            normalized_concerts = []
            for raw_concert in raw_concerts:
                try:
                    normalized = self.normalize_data(raw_concert)
                    if self.validate_concert(normalized):
                        normalized_concerts.append(normalized)
                    else:
                        self.logger.warning(f"Invalid concert data: {raw_concert.get('name', 'Unknown')}")
                except Exception as e:
                    self.logger.error(f"Error normalizing concert: {e}")
            
            # Sort concerts by date and time
            normalized_concerts.sort(key=lambda x: (x['date'], x['time']))
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            self.logger.info(f"Successfully processed {len(normalized_concerts)} concerts in {duration:.2f}s")
            
            return {
                'venue_id': self.venue_id,
                'venue_name': self.venue_name,
                'concerts': normalized_concerts,
                'metadata': {
                    'total_concerts': len(normalized_concerts),
                    'scraped_at': start_time.isoformat(),
                    'duration_seconds': duration,
                    'status': 'success'
                }
            }
            
        except Exception as e:
            self.logger.error(f"Scraper failed: {e}")
            return self._create_error_result(str(e))
    
    def _create_error_result(self, error_message: str) -> Dict[str, Any]:
        """Create error result dictionary."""
        return {
            'venue_id': self.venue_id,
            'venue_name': self.venue_name,
            'concerts': [],
            'metadata': {
                'total_concerts': 0,
                'scraped_at': datetime.now().isoformat(),
                'duration_seconds': 0,
                'status': 'error',
                'error': error_message
            }
        }
