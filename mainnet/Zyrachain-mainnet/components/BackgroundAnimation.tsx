'use client';

export function BackgroundAnimation() {
  return (
    <div className="background-animated">
      <div
        className="background-gradient-blob background-blob-1"
        style={{
          width: '300px',
          height: '300px',
          left: '10%',
          top: '20%',
          backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(198 100% 45% / 0.15), transparent)',
        }}
      />
      <div
        className="background-gradient-blob background-blob-2"
        style={{
          width: '250px',
          height: '250px',
          right: '15%',
          bottom: '20%',
          backgroundImage: 'radial-gradient(circle at 80% 80%, hsl(142 71% 45% / 0.1), transparent)',
        }}
      />
      <div
        className="background-gradient-blob background-blob-1"
        style={{
          width: '200px',
          height: '200px',
          right: '40%',
          top: '40%',
          backgroundImage: 'radial-gradient(circle at 50% 50%, hsl(38 92% 50% / 0.08), transparent)',
          animationDelay: '10s',
        }}
      />
    </div>
  );
}
