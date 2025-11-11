import React from 'react';

// minutes -> circular gauge component
export function HoursGauge({ minutes = 0 }) {
  const totalMinutes = Math.round(minutes);
  const hoursInt = Math.floor(totalMinutes / 60);
  const minutesRem = totalMinutes % 60;
  const hours = +(totalMinutes / 60).toFixed(2);
  const maxHours = 60; // threshold
  const pct = Math.min(hours / maxHours, 1);

  const size = 120;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = `${(circumference * pct).toFixed(2)} ${circumference.toFixed(2)}`;

  const color = hoursInt >= maxHours ? '#ef4444' : '#2563eb'; // red vs blue

  return (
    <div className="hours-gauge">
      <svg width={size} height={size} className="gauge-svg">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" x2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </linearGradient>
        </defs>

        <g transform={`translate(${size/2}, ${size/2})`}>
          <circle
            r={radius}
            stroke="#e6edf7"
            strokeWidth={stroke}
            fill="none"
            className="gauge-track"
          />

          <circle
            r={radius}
            stroke="url(#gaugeGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={dash}
            transform={`rotate(-90)`}
            className="gauge-progress"
          />
        </g>
      </svg>

      <div className="hours-value" style={{ color }}>
        <div className="hours-number">{hoursInt}h {String(minutesRem).padStart(2, '0')}m</div>
        <div className="hours-label">Weekly total</div>
      </div>
    </div>
  );
}

export default HoursGauge;
