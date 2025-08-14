import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Circle, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { QuestionStats } from '@/interface/Question';
import { RecycleType, RECYCLE_TYPE_LABELS } from '@/interface/Recycle';

interface PentagonChartProps {
  data: QuestionStats;
  containerWidth: number;
}

export default function PentagonChart({ 
  data, 
  containerWidth 
}: PentagonChartProps) {
  const chartSize = 215;
  const center = chartSize / 2;
  const radius = chartSize * 0.4;
  const labelRadius = chartSize * 0.47;

  const getPointCoordinates = (index: number, r: number = radius) => {
    const angle = (index * 72 - 90) * (Math.PI / 180);
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const getLabelCoordinates = (index: number) => {
    const angle = (index * 72 - 90) * (Math.PI / 180);
    const x = center + labelRadius * Math.cos(angle);
    const y = center + labelRadius * Math.sin(angle);
    return { x, y };
  };

  const getAccuracy = (category: RecycleType): number => {
    const stats = data[category];
    if (stats.total === 0) return 0;
    return (stats.correct / stats.total) * 100;
  };

  const categories: RecycleType[] = ['bottles', 'plastic', 'cans', 'containers', 'paper'];

  const sortedCategories = [...categories].sort((a, b) => {
    const statsA = data[a];
    const statsB = data[b];
    
    if (statsA.total === 0 && statsB.total > 0) return 1;
    if (statsA.total > 0 && statsB.total === 0) return -1;
    
    const accuracyA = getAccuracy(a);
    const accuracyB = getAccuracy(b);
    
    if (accuracyA !== accuracyB) {
      return accuracyB - accuracyA;
    }
    
    return statsB.total - statsA.total;
  });

  const getValidPoints = () => {
    const validPoints: { point: { x: number; y: number }; index: number; category: RecycleType }[] = [];
    
    categories.forEach((category, index) => {
      const stats = data[category];
      if (stats.total > 0) {
        const accuracy = getAccuracy(category);
        const r = (accuracy / 100) * radius;
        const point = getPointCoordinates(index, r);
        validPoints.push({ point, index, category });
      }
    });
    
    return validPoints;
  };

  const validPoints = getValidPoints();
  const hasValidArea = validPoints.length >= 3;

  const pointsToString = (points: { x: number; y: number }[]) => {
    return points.map(p => `${p.x},${p.y}`).join(' ');
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg width={containerWidth} height={200} viewBox={`0 0 ${chartSize} ${200}`}>
          <Defs>
            <LinearGradient id="fillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#4A90E2" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#2563eb" stopOpacity="0.2" />
            </LinearGradient>
            <LinearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#4A90E2" stopOpacity="1" />
              <Stop offset="100%" stopColor="#2563eb" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, index) => {
            const gridPoints = categories.map((_, i) => getPointCoordinates(i, radius * scale));
            return (
              <Polygon
                key={`grid-${index}`}
                points={pointsToString(gridPoints)}
                fill="none"
                stroke={"#dee2e6"}
                strokeWidth={index === 4 ? 1.5 : 0.8}
                opacity={index === 4 ? 0.8 : 0.4}
              />
            );
          })}

          {categories.map((_, index) => {
            const point = getPointCoordinates(index);
            return (
              <G key={`line-${index}`}>
                <Polygon
                  points={`${center},${center} ${point.x},${point.y}`}
                  fill="none"
                  stroke={"#dee2e6"}
                  strokeWidth={0.8}
                  opacity={0.4}
                />
              </G>
            );
          })}

          {hasValidArea && (
            <Polygon
              points={pointsToString(validPoints.map(vp => vp.point))}
              fill="url(#fillGradient)"
              stroke="url(#strokeGradient)"
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
          )}

          {!hasValidArea && validPoints.map((vp, idx) => (
            <Circle
              key={`point-${idx}`}
              cx={vp.point.x}
              cy={vp.point.y}
              r={4}
              fill="#4A90E2"
              stroke="#2563eb"
              strokeWidth={1.5}
            />
          ))}

          {categories.map((category, index) => {
            const labelPos = getLabelCoordinates(index);
            
            return (
              <G key={`label-${index}`}>
                <SvgText
                  x={labelPos.x}
                  y={labelPos.y + 8}
                  textAnchor="middle"
                  fontSize={chartSize * 0.06}
                  fontWeight="600"
                  fill={"#374151"}
                >
                  {RECYCLE_TYPE_LABELS[category]}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
      <View style={styles.legendContainer}>
        <View style={styles.legendHeader}>
            <Text style={[styles.legendHeaderText, styles.legendCol]}>題目類別</Text>
            <Text style={[styles.legendHeaderText, styles.legendCol]}>回答數</Text>
            <Text style={[styles.legendHeaderText, styles.legendCol]}>答對數</Text>
            <Text style={[styles.legendHeaderText, styles.legendCol]}>準確率</Text>
        </View>
        {sortedCategories.map((category, index) => {
          const stats = data[category];
          const accuracy = getAccuracy(category);
          const hasData = stats.total > 0;
          
          return (
            <View key={index} style={[styles.legendItem, !hasData && styles.legendItemEmpty]}>
              <Text style={[styles.legendText, styles.legendCol, !hasData && styles.legendTextEmpty]}>
                {RECYCLE_TYPE_LABELS[category]}
              </Text>
              <Text style={[styles.legendText, styles.legendCol, !hasData && styles.legendTextEmpty]}>
                {stats.total}
              </Text>
              <Text style={[styles.legendText, styles.legendCol, !hasData && styles.legendTextEmpty]}>
                {stats.correct}
              </Text>
              <Text style={[styles.legendPercentage, styles.legendCol, !hasData && styles.legendTextEmpty]}>
                {hasData ? `${accuracy.toFixed(2)}%` : '-'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  chartContainer: {
    marginBottom: 20    
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
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  legendItemEmpty: {
    opacity: 0.5,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center'
  },
  legendTextEmpty: {
    color: '#999',
  },
  legendPercentage: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center'
  },
  legendCol: { flex: 1 },
});