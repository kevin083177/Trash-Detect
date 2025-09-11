import React from 'react';
import './styles/GaugeChart.css';

interface GaugeChartProps {
  title: string;
  icon: React.ReactNode;
  percentage: number;
  details: string;
  color: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({ 
  title, 
  icon, 
  percentage, 
  details, 
  color,
}) => {
  const radius = 90;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth * 2;
  
  const svgHeight = radius + strokeWidth;
  const svgWidth = radius * 2;
  
  const halfCircumference = Math.PI * normalizedRadius;
  
  const strokeDasharray = `${halfCircumference} ${halfCircumference}`;
  const strokeDashoffset = halfCircumference - (percentage / 100) * halfCircumference;

  return (
    <div className="gauge-container">
      <div className="gauge-header">
        <span className="gauge-icon">{icon}</span>
        <span className="gauge-title">{title}</span>
      </div>
      
      <div className="gauge-chart">
        <svg
          height={svgHeight}
          width={svgWidth}
          className="gauge-svg"
        >
          <path
            d={`M ${radius - normalizedRadius} ${radius}
               A ${normalizedRadius} ${normalizedRadius} 0 0 1 
               ${radius + normalizedRadius} ${radius}`}
            fill="none"
            stroke="#e9ecef"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          <path
            d={`M ${radius - normalizedRadius} ${radius}
               A ${normalizedRadius} ${normalizedRadius} 0 0 1 
               ${radius + normalizedRadius} ${radius}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="gauge-progress"
          />
        </svg>
        
        <div className="gauge-center">
          <div className="gauge-percentage" style={{ color: percentage > 90 ? "#FF0060" : "black" }}>{percentage}%</div>
          <div className="gauge-details" style={{ color: percentage > 90 ? "#FF0060" : "black" }}>{details}</div>
        </div>
      </div>
    </div>
  );
};