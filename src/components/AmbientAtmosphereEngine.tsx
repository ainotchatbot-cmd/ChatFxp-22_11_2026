import React from 'react';
import { AtmosphereMode } from '../types';

interface AmbientAtmosphereEngineProps {
  enabled: boolean;
  mode: AtmosphereMode;
  candlelightEnabled: boolean;
  bloodMoonActive?: boolean;
}

const SNOW_FLAKES = [
  { id: 's1', left: '4%', delay: '0s', duration: '13s', size: 3 },
  { id: 's2', left: '12%', delay: '3.1s', duration: '16s', size: 2 },
  { id: 's3', left: '21%', delay: '1.4s', duration: '14.5s', size: 4 },
  { id: 's4', left: '29%', delay: '5.2s', duration: '18s', size: 2 },
  { id: 's5', left: '38%', delay: '2.3s', duration: '15s', size: 3 },
  { id: 's6', left: '47%', delay: '6.8s', duration: '13.5s', size: 2 },
  { id: 's7', left: '56%', delay: '0.8s', duration: '17s', size: 3 },
  { id: 's8', left: '66%', delay: '4.4s', duration: '14s', size: 4 },
  { id: 's9', left: '75%', delay: '1.9s', duration: '16.5s', size: 2 },
  { id: 's10', left: '84%', delay: '5.9s', duration: '13.8s', size: 3 },
  { id: 's11', left: '91%', delay: '2.7s', duration: '15.5s', size: 3 },
  { id: 's12', left: '96%', delay: '4.1s', duration: '17.2s', size: 2 },
];

const DUST_MOTES = [
  { id: 'd1', left: '9%', top: '26%', delay: '0s', duration: '9s', size: 3, crimson: false },
  { id: 'd2', left: '17%', top: '54%', delay: '2.1s', duration: '11s', size: 2, crimson: true },
  { id: 'd3', left: '25%', top: '72%', delay: '4.2s', duration: '10s', size: 3, crimson: false },
  { id: 'd4', left: '41%', top: '38%', delay: '1.3s', duration: '12s', size: 2, crimson: false },
  { id: 'd5', left: '53%', top: '63%', delay: '3.7s', duration: '9.5s', size: 3, crimson: true },
  { id: 'd6', left: '68%', top: '29%', delay: '0.9s', duration: '11.5s', size: 2, crimson: false },
  { id: 'd7', left: '79%', top: '58%', delay: '2.8s', duration: '10.5s', size: 3, crimson: true },
  { id: 'd8', left: '88%', top: '44%', delay: '4.9s', duration: '9.2s', size: 2, crimson: false },
  { id: 'd9', left: '93%', top: '76%', delay: '1.6s', duration: '11.8s', size: 3, crimson: true },
];

const EMBERS = [
  { id: 'e1', left: '7%', delay: '0s', duration: '11.5s', size: 3 },
  { id: 'e2', left: '23%', delay: '2.5s', duration: '14s', size: 2 },
  { id: 'e3', left: '49%', delay: '1.2s', duration: '13s', size: 3 },
  { id: 'e4', left: '72%', delay: '4.6s', duration: '12s', size: 2 },
  { id: 'e5', left: '89%', delay: '0.9s', duration: '13.5s', size: 3 },
];

const BLOOD_MOON_WISPS = [
  { id: 'bm1', left: '8%', top: '18%', delay: '0s', duration: '4.8s', size: 5 },
  { id: 'bm2', left: '19%', top: '42%', delay: '1.1s', duration: '5.5s', size: 4 },
  { id: 'bm3', left: '31%', top: '24%', delay: '2.2s', duration: '4.4s', size: 6 },
  { id: 'bm4', left: '44%', top: '66%', delay: '0.6s', duration: '5.9s', size: 4 },
  { id: 'bm5', left: '58%', top: '16%', delay: '1.7s', duration: '4.6s', size: 5 },
  { id: 'bm6', left: '70%', top: '48%', delay: '2.9s', duration: '5.2s', size: 4 },
  { id: 'bm7', left: '82%', top: '29%', delay: '0.9s', duration: '4.9s', size: 6 },
  { id: 'bm8', left: '92%', top: '62%', delay: '2.4s', duration: '5.4s', size: 4 },
  { id: 'bm9', left: '14%', top: '79%', delay: '1.5s', duration: '5.1s', size: 5 },
  { id: 'bm10', left: '63%', top: '82%', delay: '3.1s', duration: '4.7s', size: 4 },
];

export const AmbientAtmosphereEngine: React.FC<AmbientAtmosphereEngineProps> = ({
  enabled,
  mode,
  candlelightEnabled,
  bloodMoonActive = false,
}) => {
  if (!enabled && !bloodMoonActive) return null;

  const showSnow = enabled && (mode === 'snow' || mode === 'blended');
  const showDust = enabled && (mode === 'dust' || mode === 'blended');

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden select-none"
    >
      {/* Dynamic Weather: Blood Moon Deep Crimson Glow Overlay */}
      {bloodMoonActive && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 90% 55% at 50% 8%, rgba(255, 20, 43, 0.24), rgba(139, 0, 21, 0.16) 45%, rgba(65, 4, 18, 0.14) 75%, transparent 100%)',
              animation: 'chatfxpBloodMoonPulse 5.2s ease-in-out infinite',
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-72"
            style={{
              background:
                'linear-gradient(180deg, transparent 0%, rgba(139, 0, 21, 0.16) 65%, rgba(255, 20, 43, 0.22) 100%)',
              animation: 'chatfxpBloodMoonPulse 6.4s ease-in-out 1.1s infinite',
            }}
          />
          {BLOOD_MOON_WISPS.map((wisp) => (
            <span
              key={wisp.id}
              className="absolute rounded-full bg-[#FF1F38] shadow-[0_0_14px_#FF142B,0_0_24px_rgba(255,20,43,0.65)]"
              style={{
                left: wisp.left,
                top: wisp.top,
                width: `${wisp.size}px`,
                height: `${wisp.size}px`,
                animation: `chatfxpCrimsonWisp ${wisp.duration} ease-in-out ${wisp.delay} infinite`,
              }}
            />
          ))}
        </>
      )}

      {/* Subtle Drifting Twilight & Crimson Sanctuary Fog */}
      {enabled && (
        <div
          className="absolute -inset-x-1/4 top-0 h-[420px] opacity-25"
          style={{
            background:
              'radial-gradient(ellipse 65% 50% at 50% 15%, rgba(255, 20, 43, 0.2), rgba(57, 32, 63, 0.14) 55%, transparent 80%)',
          }}
        />
      )}

      {/* Flickering Candlelight Pools across Left, Right & Lower Sanctuary Corners */}
      {enabled && candlelightEnabled && (
        <>
          <div
            className="absolute -left-24 top-1/3 h-80 w-80 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(255, 162, 64, 0.14) 0%, rgba(255, 20, 43, 0.08) 42%, transparent 72%)',
              animation: 'chatfxpCandleFlicker 3.6s ease-in-out infinite',
            }}
          />
          <div
            className="absolute -right-24 top-1/2 h-80 w-80 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(255, 154, 58, 0.14) 0%, rgba(212, 166, 74, 0.07) 42%, transparent 72%)',
              animation: 'chatfxpCandleFlicker 4.3s ease-in-out 0.9s infinite',
            }}
          />
          <div
            className="absolute left-10 bottom-12 h-56 w-56 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(255, 130, 48, 0.11) 0%, rgba(139, 0, 21, 0.07) 45%, transparent 74%)',
              animation: 'chatfxpCandleFlicker 2.9s ease-in-out 0.4s infinite',
            }}
          />
          <div
            className="absolute right-10 bottom-12 h-56 w-56 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(255, 144, 52, 0.11) 0%, rgba(139, 0, 21, 0.07) 45%, transparent 74%)',
              animation: 'chatfxpCandleFlicker 3.9s ease-in-out 1.4s infinite',
            }}
          />
        </>
      )}

      {/* Subtle Falling Moonlit Snow Flakes */}
      {showSnow &&
        SNOW_FLAKES.map((flake) => (
          <span
            key={flake.id}
            className="absolute top-0 rounded-full bg-[#EFE8F6] shadow-[0_0_6px_rgba(240,232,245,0.55)] opacity-0"
            style={{
              left: flake.left,
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              animation: `chatfxpSnowFall ${flake.duration} linear ${flake.delay} infinite`,
            }}
          />
        ))}

      {/* Drifting Cathedral Dust Motes & Slow Rising Embers */}
      {showDust && (
        <>
          {DUST_MOTES.map((mote) => (
            <span
              key={mote.id}
              className={`absolute rounded-full opacity-0 ${
                mote.crimson || bloodMoonActive
                  ? 'bg-[#FF3B4E] shadow-[0_0_8px_rgba(255,20,43,0.75)]'
                  : 'bg-[#F0C878] shadow-[0_0_6px_rgba(212,166,74,0.55)]'
              }`}
              style={{
                left: mote.left,
                top: mote.top,
                width: `${mote.size}px`,
                height: `${mote.size}px`,
                animation: `chatfxpDustFloat ${mote.duration} ease-in-out ${mote.delay} infinite`,
              }}
            />
          ))}

          {EMBERS.map((ember) => (
            <span
              key={ember.id}
              className="absolute bottom-0 rounded-full bg-[#FF142B] shadow-[0_0_8px_#FF142B] opacity-0"
              style={{
                left: ember.left,
                width: `${ember.size}px`,
                height: `${ember.size}px`,
                animation: `chatfxpEmberRise ${ember.duration} linear ${ember.delay} infinite`,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};
