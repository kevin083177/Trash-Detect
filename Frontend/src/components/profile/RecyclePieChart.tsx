import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { RecycleValues, RECYCLE_TYPE_LABELS } from '@/interface/Recycle';
import { Ionicons } from '@expo/vector-icons';

interface RecyclePieChartProps {
  data: RecycleValues;
  size?: number;
  containerWidth: number;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

const COLORS = ['#CAF0F8', '#90E0EF', '#00B4D8', '#0077B6', '#03045E'];

export default function RecyclePieChart({ 
  data, 
  size = 200,
  containerWidth 
}: RecyclePieChartProps) {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  
  if (total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyCircle, { width: size, height: size }]}>
          <Text style={styles.emptyText}>尚未開始回收</Text>
        </View>
        <View style={styles.emptyLabels}>
          <Text style={styles.emptyLabel}>點選下方按鈕開始辨識</Text>
          <Ionicons name="arrow-down" size={64} color="#000" />
        </View>
      </View>
    );
  }

  const chartData: ChartData[] = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      label: RECYCLE_TYPE_LABELS[key as keyof RecycleValues],
      value,
      color: '',
      percentage: (value / total) * 100,
    }))
    .sort((a, b) => b.value - a.value)
    .map((item, index) => ({
      ...item,
      color: COLORS[index] || COLORS[COLORS.length - 1],
    }));

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
        
        <View style={[
          styles.legendContainer, { width: containerWidth }]}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={styles.legendText} numberOfLines={1} ellipsizeMode="tail">
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
      
      <View style={[
        styles.legendContainer, { width: containerWidth }]}>
        <View style={styles.legendHeader}>
            <Text style={[styles.legendHeaderText, styles.legendCol]}>回收類別</Text>
            <Text style={[styles.legendHeaderText, styles.legendCol]}>回收量</Text>
            <Text style={[styles.legendHeaderText, styles.legendCol]}>比例</Text>
        </View>
        {chartData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendCol, styles.legendCell]}>
              <View style={styles.legendLabelContainer}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.label}</Text>
              </View>
            </View>
            <Text style={[styles.legendCount, styles.legendCol]}>{item.value}</Text>
            <Text style={[styles.legendPercentage, styles.legendCol]}>
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 400,
  },
  emptyCircle: {
    borderRadius: 200,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyLabels: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emptyLabel: {
    marginBottom: 24,
    fontSize: 16,
    fontWeight: '500'
  },
  legendContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  legendHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  legendHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  legendCol: {
    flex: 1,
  },
  legendCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingLeft: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    flexShrink: 0,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'left',
    flex: 1,
  },
  legendCount: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  legendPercentage: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
});