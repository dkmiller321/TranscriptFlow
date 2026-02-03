import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          background: 'linear-gradient(135deg, #34d399 0%, #14b8a6 50%, #06b6d4 100%)',
        }}
      >
        {/* Text lines */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            position: 'absolute',
            left: 6,
            top: 9,
          }}
        >
          <div
            style={{
              width: 12,
              height: 2.5,
              backgroundColor: 'white',
              borderRadius: 1.25,
            }}
          />
          <div
            style={{
              width: 9,
              height: 2.5,
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: 1.25,
            }}
          />
          <div
            style={{
              width: 10,
              height: 2.5,
              backgroundColor: 'rgba(255,255,255,0.6)',
              borderRadius: 1.25,
            }}
          />
        </div>
        {/* Play arrow */}
        <div
          style={{
            position: 'absolute',
            right: 6,
            width: 0,
            height: 0,
            borderLeft: '6px solid white',
            borderTop: '5px solid transparent',
            borderBottom: '5px solid transparent',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
