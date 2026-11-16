import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: 96, color: '#0A7C4A' }}>404</div>
        <h1 style={{ margin: '0 0 8px' }}>Page not found</h1>
        <p className="muted">This admin page doesn’t exist.</p>
        <Link href="/" style={{ fontWeight: 700, color: '#0A7C4A' }}>
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
