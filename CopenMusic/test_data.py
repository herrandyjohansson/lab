#!/usr/bin/env python3
"""
Quick test script to display concert data in a readable format
"""

import json
from datetime import datetime

def main():
    try:
        with open('output/concerts.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print("🎵 CopenMusic Concert Data Test")
        print("=" * 50)
        print(f"Last Updated: {data['last_updated']}")
        print(f"Total Concerts: {data['metadata']['total_concerts']}")
        print(f"Upcoming Concerts: {data['metadata']['upcoming_concerts']}")
        print("=" * 50)
        
        # Show next 5 upcoming concerts
        upcoming = data['upcoming'][:5]
        
        for i, concert in enumerate(upcoming, 1):
            print(f"\n{i}. {concert['name']}")
            print(f"   📅 Date: {concert['date']} at {concert['time']}")
            print(f"   🏢 Venue: {concert['venue_name']}")
            print(f"   🎫 Status: {concert['status']}")
            if concert['support']:
                print(f"   🎤 Support: {concert['support']}")
            print(f"   🔗 Link: {concert['url']}")
            print("-" * 40)
        
        # Show by venue breakdown
        print(f"\n📍 Venue Breakdown:")
        for venue_id, venue_data in data['venues'].items():
            concert_count = len(venue_data['concerts'])
            print(f"   {venue_data['venue_name']}: {concert_count} concerts")
        
        print(f"\n✅ Test completed successfully!")
        
    except FileNotFoundError:
        print("❌ No concert data found. Run 'python3 main.py' first.")
    except Exception as e:
        print(f"❌ Error reading data: {e}")

if __name__ == '__main__':
    main()
