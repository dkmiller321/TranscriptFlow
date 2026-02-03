import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 40,
          background: 'linear-gradient(135deg, #34d399 0%, #14b8a6 50%, #06b6d4 100%)',
        }}
      >
        {/* Text lines */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            position: 'absolute',
            left: 36,
            top: 50,
          }}
        >
          <div
            style={{
              width: 68,
              height: 14,
              backgroundColor: 'white',
              borderRadius: 7,
            }}
          />
          <div
            style={{
              width: 50,
              height: 14,
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: 7,
            }}
          />
          <div
            style={{
              width: 56,
              height: 14,
              backgroundColor: 'rgba(255,255,255,0.6)',
              borderRadius: 7,
            }}
          />
        </div>
        {/* Play arrow */}
        <div
          style={{
            position: 'absolute',
            right: 32,
            width: 0,
            height: 0,
            borderLeft: '34px solid white',
            borderTop: '28px solid transparent',
            borderBottom: '28px solid transparent',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
