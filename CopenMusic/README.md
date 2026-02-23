# CopenMusic Concert Scraper

A scalable, extensible concert data scraper system that extracts concert information from multiple Danish venues and makes it available in unified formats for Next.js and other projects.

## Features

- **Multi-Venue Support**: Currently supports K.B. Hallen, with extensible architecture for adding more venues
- **Scalable Architecture**: Modular scraper system with base classes and configuration-driven setup
- **Multiple Output Formats**: JSON, CSV, and Markdown outputs
- **Automated Workflows**: GitHub Actions for daily automated scraping
- **Error Handling**: Robust error handling with retry mechanisms and graceful degradation
- **Rate Limiting**: Respectful scraping with configurable rate limits per venue

## Quick Start

### Local Development

1. **Install dependencies**:
   ```bash
   cd CopenMusic
   pip install -r requirements.txt
   ```

2. **Run the scraper**:
   ```bash
   python main.py
   ```

3. **Check output files**:
   ```bash
   ls output/
   # concerts.json  concerts.csv  concerts.md
   ```

### Using the Data

#### Next.js Integration

```javascript
// Import concert data
import concerts from './CopenMusic/output/concerts.json';

export default function ConcertsPage() {
  const { venues, all_concerts, metadata } = concerts;
  
  return (
    <div>
      <h1>Upcoming Concerts ({metadata.upcoming_concerts})</h1>
      
      {/* All concerts from all venues */}
      {all_concerts.map(concert => (
        <div key={concert.id}>
          <h3>{concert.name}</h3>
          <p>{concert.date} at {concert.time}</p>
          <p>Venue: {concert.venue_name}</p>
          <p>Status: {concert.status}</p>
          <a href={concert.url}>More info</a>
        </div>
      ))}
    </div>
  );
}
```

#### Data Structure

```json
{
  "last_updated": "2026-02-23T13:00:00Z",
  "metadata": {
    "total_concerts": 45,
    "upcoming_concerts": 32,
    "venues_count": 1
  },
  "venues": {
    "kb_hallen": {
      "venue_name": "K.B. Hallen",
      "concerts": [
        {
          "id": "kb_hallen-zach-top-2026-02-25",
          "name": "Zach Top",
          "date": "2026-02-25",
          "time": "20:00",
          "status": "available",
          "url": "https://kbhallen.dk/event/zach-top_2026-02-25/",
          "support": "Wyatt Mccubbin",
          "genre": "",
          "price": null,
          "venue": "kb_hallen",
          "venue_name": "K.B. Hallen"
        }
      ]
    }
  },
  "all_concerts": [...],
  "upcoming": [...]
}
```

## Architecture

### Core Components

1. **Base Scraper** (`base_scraper.py`): Abstract base class with common functionality
2. **Venue Scrapers** (`scrapers/`): Venue-specific implementations
3. **Main Orchestrator** (`main.py`): Coordinates all scrapers and generates output
4. **Configuration** (`venues.yaml`): Venue settings and global configuration

### Adding New Venues

1. **Create venue scraper**:
   ```python
   # scrapers/new_venue_scraper.py
   from ..base_scraper import BaseScraper
   
   class NewVenueScraper(BaseScraper):
       def parse_concerts(self, soup):
           # Implement venue-specific parsing logic
           pass
   ```

2. **Add to configuration** (`venues.yaml`):
   ```yaml
   venues:
     new_venue:
       name: "New Venue"
       url: "https://venue-website.com/events"
       scraper_class: "NewVenueScraper"
       enabled: true
       rate_limit: 1
   ```

3. **Import in `__init__.py`**:
   ```python
   from .new_venue_scraper import NewVenueScraper
   ```

4. **Add to main.py mapping**:
   ```python
   scraper_classes = {
       'KbHallenScraper': KbHallenScraper,
       'NewVenueScraper': NewVenueScraper,
   }
   ```

## Configuration

### Venue Configuration

Each venue in `venues.yaml` supports:

- `name`: Display name
- `url`: Base URL for scraping
- `scraper_class`: Python class name
- `enabled`: Whether to include in scraping
- `rate_limit`: Requests per second
- `selectors`: CSS selectors for parsing (future enhancement)

### Global Configuration

- `output.directory`: Output folder location
- `output.formats`: Output formats (json, csv, markdown)
- `performance.max_concurrent_scrapers`: Parallel processing limit
- `validation`: Data validation rules

## GitHub Actions

The workflow runs automatically:
- **Daily at 09:00 Copenhagen time** (08:00 UTC)
- **Manual trigger** with test mode option

### Workflow Features

- Parallel scraping of multiple venues
- Output file verification
- Automatic git commits for data updates
- Summary reports with statistics
- Error notifications on failure

## Development

### Running Tests

```bash
# Install development dependencies
pip install -r requirements.txt

# Run tests (when implemented)
pytest

# Code formatting
black .

# Linting
flake8 .
```

### Debugging

```bash
# Run with verbose logging
python main.py --parallel

# Run sequentially for debugging
python main.py --sequential

# Check specific venue output
python -c "
import json
with open('output/concerts.json', 'r') as f:
    data = json.load(f)
    print(json.dumps(data['venues']['kb_hallen'], indent=2))
"
```

## Output Files

### concerts.json
Main data file with complete concert information in structured format.

### concerts.csv
Spreadsheet-compatible format with all concerts as rows.

### concerts.md
Human-readable format organized by venue.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your venue scraper
4. Update configuration
5. Test thoroughly
6. Submit a pull request

## License

This project is for educational purposes. Please respect the terms of service of the venues being scraped and implement responsible scraping practices.

## Support

For issues or questions:
1. Check the logs in the GitHub Actions workflow
2. Review the venue configuration
3. Test the scraper locally
4. Check the venue website for structural changes
