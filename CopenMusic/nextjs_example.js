/**
 * Example Next.js integration with CopenMusic concert data
 * 
 * This shows how to use the generated concert data in a Next.js application
 */

// Import the concert data (adjust path as needed)
import concerts from './output/concerts.json';

export default function ConcertsPage() {
  const { venues, all_concerts, upcoming, metadata } = concerts;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
        🎵 CopenMusic Concert Listings
      </h1>
      
      <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Total Concerts:</strong> {metadata.total_concerts}</p>
        <p><strong>Upcoming:</strong> {metadata.upcoming_concerts}</p>
        <p><strong>Last Updated:</strong> {new Date(metadata.last_updated).toLocaleString()}</p>
        <p><strong>Venues:</strong> {metadata.venues_count}</p>
      </div>

      {/* All upcoming concerts */}
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#444', marginBottom: '15px' }}>🎪 Upcoming Concerts</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {upcoming.map(concert => (
            <div 
              key={concert.id} 
              style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '15px', 
                backgroundColor: '#f9f9f9',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                {concert.name}
              </h3>
              
              <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#555' }}>
                <p><strong>📅 Date:</strong> {concert.date} at {concert.time}</p>
                <p><strong>🏢 Venue:</strong> {concert.venue_name}</p>
                <p><strong>🎫 Status:</strong> 
                  <span style={{ 
                    color: concert.status === 'sold_out' ? '#d32f2f' : 
                           concert.status === 'waiting_list' ? '#f39c12' : '#28a745',
                    fontWeight: 'bold'
                  }}>
                    {concert.status === 'sold_out' ? 'Sold Out' :
                     concert.status === 'waiting_list' ? 'Waiting List' :
                     concert.status === 'few_tickets' ? 'Few Tickets' : 'Available'}
                  </span>
                </p>
                {concert.support && (
                  <p><strong>🎤 Support:</strong> {concert.support}</p>
                )}
                <p>
                  <a 
                    href={concert.url} 
                    target="_blank" 
                    style={{ 
                      color: '#007bff', 
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    🔗 Get Tickets
                  </a>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* By venue sections */}
      <section>
        <h2 style={{ color: '#444', marginBottom: '15px' }}>📍 Concerts by Venue</h2>
        {Object.entries(venues).map(([venueId, venueData]) => (
          <div key={venueId} style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#333', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
              {venueData.venue_name}
            </h3>
            <p style={{ color: '#666', marginBottom: '15px' }}>
              {venueData.concerts.length} concerts
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
              {venueData.concerts.map(concert => (
                <div 
                  key={concert.id}
                  style={{ 
                    border: '1px solid #eee', 
                    borderRadius: '6px', 
                    padding: '12px',
                    backgroundColor: '#fff'
                  }}
                >
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                    {concert.name}
                  </h4>
                  <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>
                    {concert.date} at {concert.time}
                  </p>
                  <a 
                    href={concert.url} 
                    target="_blank"
                    style={{ fontSize: '12px', color: '#007bff' }}
                  >
                    More Info →
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={{ 
        marginTop: '40px', 
        padding: '20px', 
        borderTop: '1px solid #ddd', 
        fontSize: '12px', 
        color: '#888',
        textAlign: 'center'
      }}>
        <p>
          🎵 Data powered by <strong>CopenMusic Concert Scraper</strong>
        </p>
        <p>
          Last updated: {new Date(metadata.last_updated).toLocaleString()}
        </p>
      </footer>
    </div>
  );
}

// Alternative: API route example for dynamic loading
export async function getStaticProps() {
  // In a real app, you might want to validate the data
  // or fetch it from an API endpoint
  
  return {
    props: {
      concerts, // Pass the entire concert data as props
    },
    // Revalidate every hour to get fresh data
    revalidate: 3600, 
  };
}

// Helper functions for filtering concerts
export const filterConcertsByVenue = (concerts, venueId) => {
  return concerts.filter(concert => concert.venue === venueId);
};

export const filterConcertsByMonth = (concerts, year, month) => {
  return concerts.filter(concert => {
    const concertDate = new Date(concert.date);
    return concertDate.getFullYear() === parseInt(year) && 
           concertDate.getMonth() + 1 === parseInt(month);
  });
};

export const getSoldOutConcerts = (concerts) => {
  return concerts.filter(concert => concert.status === 'sold_out');
};

export const getAvailableConcerts = (concerts) => {
  return concerts.filter(concert => 
    concert.status === 'available' || concert.status === 'few_tickets'
  );
};
