#!/usr/bin/env python3
"""
CopenMusic Concert Scraper - Main Orchestrator
Runs all venue scrapers and generates unified output files.
"""

import os
import sys
import json
import yaml
import logging
import argparse
from datetime import datetime
from typing import Dict, List, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
import csv
import io

# Add the current directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scrapers import KbHallenScraper


class ConcertScraperOrchestrator:
    """Main orchestrator for running all venue scrapers."""
    
    def __init__(self, config_path: str = "venues.yaml"):
        """
        Initialize the orchestrator.
        
        Args:
            config_path: Path to the venues configuration file
        """
        self.config_path = config_path
        self.logger = self._setup_logger()  # Setup logger first
        self.config = self._load_config()
        self.scrapers = self._load_scrapers()
        
    def _load_config(self) -> Dict[str, Any]:
        """Load venues configuration from YAML file."""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            print(f"Configuration file {self.config_path} not found!")
            sys.exit(1)
        except yaml.YAMLError as e:
            print(f"Error parsing configuration file: {e}")
            sys.exit(1)
    
    def _load_scrapers(self) -> List[Any]:
        """Dynamically load scraper instances based on configuration."""
        scrapers = []
        
        for venue_id, venue_config in self.config['venues'].items():
            if not venue_config.get('enabled', False):
                self.logger.info(f"Skipping disabled venue: {venue_id}")
                continue
            
            scraper_class_name = venue_config.get('scraper_class')
            if not scraper_class_name:
                self.logger.warning(f"No scraper class specified for {venue_id}")
                continue
            
            try:
                # Map class names to actual classes
                scraper_classes = {
                    'KbHallenScraper': KbHallenScraper,
                    # Add more scrapers here as they're implemented
                }
                
                scraper_class = scraper_classes.get(scraper_class_name)
                if not scraper_class:
                    self.logger.error(f"Unknown scraper class: {scraper_class_name}")
                    continue
                
                # Create scraper instance with venue config
                scraper_config = {
                    'venue_id': venue_id,
                    'venue_name': venue_config.get('name', venue_id),
                    'url': venue_config.get('url', ''),
                    'rate_limit': venue_config.get('rate_limit', 1),
                    **venue_config
                }
                
                scraper = scraper_class(scraper_config)
                scrapers.append(scraper)
                self.logger.info(f"Loaded scraper for {venue_id}: {scraper_class_name}")
                
            except Exception as e:
                self.logger.error(f"Error loading scraper for {venue_id}: {e}")
                continue
        
        return scrapers
    
    def _setup_logger(self) -> logging.Logger:
        """Set up main logger."""
        logger = logging.getLogger('CopenMusic')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def run_scrapers(self, parallel: bool = True) -> Dict[str, Any]:
        """
        Run all enabled scrapers.
        
        Args:
            parallel: Whether to run scrapers in parallel
            
        Returns:
            Dictionary with all venue results
        """
        start_time = datetime.now()
        self.logger.info(f"Starting concert scraping for {len(self.scrapers)} venues")
        
        results = {}
        
        if parallel and len(self.scrapers) > 1:
            # Run scrapers in parallel
            max_workers = min(len(self.scrapers), 
                             self.config['global']['performance']['max_concurrent_scrapers'])
            
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                future_to_scraper = {
                    executor.submit(scraper.run): scraper 
                    for scraper in self.scrapers
                }
                
                for future in as_completed(future_to_scraper):
                    scraper = future_to_scraper[future]
                    try:
                        result = future.result()
                        results[scraper.venue_id] = result
                    except Exception as e:
                        self.logger.error(f"Scraper {scraper.venue_id} failed: {e}")
                        results[scraper.venue_id] = scraper._create_error_result(str(e))
        else:
            # Run scrapers sequentially
            for scraper in self.scrapers:
                try:
                    result = scraper.run()
                    results[scraper.venue_id] = result
                except Exception as e:
                    self.logger.error(f"Scraper {scraper.venue_id} failed: {e}")
                    results[scraper.venue_id] = scraper._create_error_result(str(e))
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        self.logger.info(f"Scraping completed in {duration:.2f} seconds")
        
        return {
            'metadata': {
                'scraped_at': start_time.isoformat(),
                'duration_seconds': duration,
                'total_venues': len(self.scrapers),
                'successful_venues': len([r for r in results.values() 
                                        if r['metadata']['status'] == 'success']),
                'total_concerts': sum(r['metadata']['total_concerts'] for r in results.values())
            },
            'venues': results
        }
    
    def generate_unified_data(self, scrape_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate unified data structure from scrape results.
        
        Args:
            scrape_results: Results from run_scrapers()
            
        Returns:
            Unified data structure
        """
        venues_data = {}
        all_concerts = []
        
        for venue_id, venue_result in scrape_results['venues'].items():
            if venue_result['metadata']['status'] == 'success':
                venues_data[venue_id] = {
                    'venue_name': venue_result['venue_name'],
                    'concerts': venue_result['concerts'],
                    'metadata': venue_result['metadata']
                }
                all_concerts.extend(venue_result['concerts'])
            else:
                venues_data[venue_id] = {
                    'venue_name': venue_result['venue_name'],
                    'concerts': [],
                    'metadata': venue_result['metadata']
                }
        
        # Sort all concerts by date and time
        all_concerts.sort(key=lambda x: (x['date'], x['time']))
        
        # Filter upcoming concerts (today or future)
        today = datetime.now().strftime('%Y-%m-%d')
        upcoming_concerts = [
            concert for concert in all_concerts 
            if concert['date'] >= today
        ]
        
        return {
            'last_updated': scrape_results['metadata']['scraped_at'],
            'metadata': {
                **scrape_results['metadata'],
                'total_concerts': len(all_concerts),
                'upcoming_concerts': len(upcoming_concerts),
                'venues_count': len(venues_data)
            },
            'venues': venues_data,
            'all_concerts': all_concerts,
            'upcoming': upcoming_concerts
        }
    
    def save_outputs(self, data: Dict[str, Any]) -> None:
        """
        Save data in multiple formats.
        
        Args:
            data: Unified data structure
        """
        output_dir = self.config['global']['output']['directory']
        os.makedirs(output_dir, exist_ok=True)
        
        formats = self.config['global']['output']['formats']
        
        if 'json' in formats:
            self._save_json(data, output_dir)
        
        if 'csv' in formats:
            self._save_csv(data, output_dir)
        
        if 'markdown' in formats:
            self._save_markdown(data, output_dir)
    
    def _save_json(self, data: Dict[str, Any], output_dir: str) -> None:
        """Save data as JSON file."""
        output_path = os.path.join(output_dir, 'concerts.json')
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            self.logger.info(f"Saved JSON output to {output_path}")
        except Exception as e:
            self.logger.error(f"Error saving JSON: {e}")
    
    def _save_csv(self, data: Dict[str, Any], output_dir: str) -> None:
        """Save concerts as CSV file."""
        output_path = os.path.join(output_dir, 'concerts.csv')
        try:
            with open(output_path, 'w', newline='', encoding='utf-8') as f:
                if data['all_concerts']:
                    fieldnames = ['id', 'name', 'date', 'time', 'status', 'venue', 
                                'venue_name', 'support', 'genre', 'price', 'url']
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    
                    for concert in data['all_concerts']:
                        row = {field: concert.get(field, '') for field in fieldnames}
                        writer.writerow(row)
            
            self.logger.info(f"Saved CSV output to {output_path}")
        except Exception as e:
            self.logger.error(f"Error saving CSV: {e}")
    
    def _save_markdown(self, data: Dict[str, Any], output_dir: str) -> None:
        """Save concerts as Markdown file."""
        output_path = os.path.join(output_dir, 'concerts.md')
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write("# CopenMusic Concert Listings\n\n")
                f.write(f"Last updated: {data['last_updated']}\n\n")
                f.write(f"Total concerts: {data['metadata']['total_concerts']}\n")
                f.write(f"Upcoming concerts: {data['metadata']['upcoming_concerts']}\n\n")
                
                # Group by venue
                for venue_id, venue_data in data['venues'].items():
                    f.write(f"## {venue_data['venue_name']}\n\n")
                    
                    if venue_data['concerts']:
                        for concert in venue_data['concerts']:
                            f.write(f"### {concert['name']}\n\n")
                            f.write(f"- **Date:** {concert['date']} at {concert['time']}\n")
                            f.write(f"- **Status:** {concert['status']}\n")
                            if concert['support']:
                                f.write(f"- **Support:** {concert['support']}\n")
                            f.write(f"- **Link:** [{concert['name']}]({concert['url']})\n\n")
                    else:
                        f.write("No concerts found or scraping failed.\n\n")
            
            self.logger.info(f"Saved Markdown output to {output_path}")
        except Exception as e:
            self.logger.error(f"Error saving Markdown: {e}")
    
    def run(self, parallel: bool = True) -> Dict[str, Any]:
        """
        Run the complete scraping pipeline.
        
        Args:
            parallel: Whether to run scrapers in parallel
            
        Returns:
            Final unified data structure
        """
        try:
            # Run all scrapers
            scrape_results = self.run_scrapers(parallel)
            
            # Generate unified data
            unified_data = self.generate_unified_data(scrape_results)
            
            # Save outputs
            self.save_outputs(unified_data)
            
            return unified_data
            
        except Exception as e:
            self.logger.error(f"Pipeline failed: {e}")
            raise


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='CopenMusic Concert Scraper')
    parser.add_argument('--config', default='venues.yaml', 
                       help='Path to configuration file')
    parser.add_argument('--parallel', action='store_true', default=True,
                       help='Run scrapers in parallel')
    parser.add_argument('--sequential', dest='parallel', action='store_false',
                       help='Run scrapers sequentially')
    
    args = parser.parse_args()
    
    # Change to the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Run the orchestrator
    orchestrator = ConcertScraperOrchestrator(args.config)
    
    try:
        result = orchestrator.run(parallel=args.parallel)
        
        # Print summary
        print(f"\n=== CopenMusic Scraping Summary ===")
        print(f"Total concerts: {result['metadata']['total_concerts']}")
        print(f"Upcoming concerts: {result['metadata']['upcoming_concerts']}")
        print(f"Venues scraped: {result['metadata']['venues_count']}")
        print(f"Duration: {result['metadata']['duration_seconds']:.2f} seconds")
        print(f"Output saved to: {orchestrator.config['global']['output']['directory']}/")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
