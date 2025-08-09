import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { RecycleValues, RECYCLE_TYPE_LABELS } from '@/interface/Recycle';

interface RecyclePieChartProps {
  data: RecycleValues;
  size?: number;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

const COLORS = {
  paper: '#03045E',
  plastic: '#90E0EF',
  containers: '#0077B6',
  bottles: '#CAF0F8',
  cans: '#00B4D8',
};

export default function RecyclePieChart({ data, size = 200 }: RecyclePieChartProps) {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  
  if (total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyCircle, { width: size, height: size }]}>
          <Text style={styles.emptyText}>尚未開始回收</Text>
        </View>
      </View>
    );
  }

  const chartData: ChartData[] = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      label: RECYCLE_TYPE_LABELS[key as keyof RecycleValues],
      value,
      color: COLORS[key as keyof RecycleValues],
      percentage: (value / total) * 100,
    }))
    .sort((a, b) => b.value - a.value);

  const createPath = (startAngle: number, endAngle: number, radius: number, innerRadius: number = 0) => {
    const centerX = size / 2;
    const centerY = size / 2;
    
    const angleDiff = endAngle - startAngle;
    const isFullCircle = Math.abs(angleDiff - 2 * Math.PI) < 0.001;
    
    if (isFullCircle) {
      const midAngle = startAngle + Math.PI;
      
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(midAngle);
      const y2 = centerY + radius * Math.sin(midAngle);
      const x3 = centerX + radius * Math.cos(endAngle - 0.001);
      const y3 = centerY + radius * Math.sin(endAngle - 0.001);
      
      if (innerRadius > 0) {
        const x4 = centerX + innerRadius * Math.cos(endAngle - 0.001);
        const y4 = centerY + innerRadius * Math.sin(endAngle - 0.001);
        const x5 = centerX + innerRadius * Math.cos(midAngle);
        const y5 = centerY + innerRadius * Math.sin(midAngle);
        const x6 = centerX + innerRadius * Math.cos(startAngle);
        const y6 = centerY + innerRadius * Math.sin(startAngle);
        
        return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} A ${radius} ${radius} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 0 0 ${x5} ${y5} A ${innerRadius} ${innerRadius} 0 0 0 ${x6} ${y6} Z`;
      } else {
        return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} A ${radius} ${radius} 0 0 1 ${x3} ${y3} Z`;
      }
    }
    
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    
    if (innerRadius > 0) {
      const x3 = centerX + innerRadius * Math.cos(endAngle);
      const y3 = centerY + innerRadius * Math.sin(endAngle);
      const x4 = centerX + innerRadius * Math.cos(startAngle);
      const y4 = centerY + innerRadius * Math.sin(startAngle);
      
      return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    } else {
      return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }
  };

  const renderSingleCategory = () => {
    const item = chartData[0];
    const radius = size / 2;
    const innerRadius = radius * 0.6;
    const centerX = size / 2;
    const centerY = size / 2;

    return (
      <Svg width={size} height={size}>
        <Circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill={item.color}
          stroke="#fff"
          strokeWidth={2}
        />
        <Circle
          cx={centerX}
          cy={centerY}
          r={innerRadius}
          fill="white"
        />
        
        <SvgText
          x={centerX}
          y={centerY}
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
          fill="#333"
        >
          {total}
        </SvgText>
        <SvgText
          x={centerX}
          y={centerY + 20}
          textAnchor="middle"
          fontSize="16"
          fill="#666"
        >
          總計
        </SvgText>
      </Svg>
    );
  };

  const radius = size / 2;
  const innerRadius = radius * 0.6;
  let currentAngle = -Math.PI / 2;

  if (chartData.length === 1) {
    return (
      <View style={styles.container}>
        <View style={styles.chartContainer}>
          {renderSingleCategory()}
        </View>
        
        <View style={styles.legendContainer}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>
                {item.label} ({item.value})
              </Text>
              <Text style={styles.legendPercentage}>
                {item.percentage.toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          {chartData.map((item, index) => {
            const angle = (item.value / total) * 2 * Math.PI;
            const path = createPath(currentAngle, currentAngle + angle, radius, innerRadius);
            currentAngle += angle;
            
            return (
              <Path
                key={index}
                d={path}
                fill={item.color}
                stroke="#fff"
                strokeWidth={2}
              />
            );
          })}
          
          <SvgText
            x={size / 2}
            y={size / 2}
            textAnchor="middle"
            fontSize="24"
            fontWeight="bold"
            fill="#333"
          >
            {total}
          </SvgText>
          <SvgText
            x={size / 2}
            y={size / 2 + 20}
            textAnchor="middle"
            fontSize="16"
            fill="#666"
          >
            總計
          </SvgText>
        </Svg>
      </View>
      
      <View style={styles.legendContainer}>
        {chartData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>
              {item.label} ({item.value})
            </Text>
            <Text style={styles.legendPercentage}>
              {item.percentage.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartContainer: {
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCircle: {
    borderRadius: 200,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  legendContainer: {
    width: '90%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  legendPercentage: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});