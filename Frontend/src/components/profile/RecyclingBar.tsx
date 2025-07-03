import { View, Text, StyleSheet } from "react-native"
import React from "react";

interface RecyclingBarProps {
    label: string;
    value: number;
    color: string;
}

const calculateRange = (value: number): { minValue: number; maxValue: number } => {
    // 向下取整到最接近的10的倍數
    const minValue = Math.floor(value / 10) * 10;
    return {
        minValue,
        maxValue: minValue + 10
    };
};

export default function RecyclingBar({ label, value, color }: RecyclingBarProps) {
    const { minValue, maxValue } = calculateRange(value);
    const percentage = (value - minValue) * 10; // %
    
    return (
        <View style={styles.barContainer}>
            {/* recycle category */}
            <Text style={styles.barLabel}>{label}</Text>
            {/* minValue Label */}
            <Text style={styles.barValue}>{minValue}</Text>
            <View style={styles.barWrapperContainer}>
                <View style={styles.barBackground}>
                    {/* 填充條 */}
                    <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: color}]}>
                        {/* 填充末端端點 */}
                        <View style={[styles.barEndCircle, { backgroundColor: color, right: value % 10 === 0 ? -12 : -6}]} />
                    </View>
                </View>
                {/* 填充端點上方數字 */}
                { value % 10 !== 0 && (
                    <View style={[styles.valueWrapper, { left: `${percentage}%`, transform: [{ translateX: -15 }], marginTop: -3}]}>
                        <Text style={styles.barValue}>{value}</Text>
                    </View>
                )}
            </View>
            {/* maxValue Label*/}
            <Text style={styles.barValue}>{maxValue}</Text>
        </View>
    )
};

const styles = StyleSheet.create({
    barContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    barLabel: {
        width: 70,
        fontSize: 16
    },
    barWrapperContainer: {
        flex: 1,
        position: 'relative',
        marginHorizontal: 4,
    },
    barBackground: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 4,
        position: 'relative',
    },
    barEndCircle: {
        position: 'absolute',
        top: -2,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'white',
    },
    barValue: {
        width: 30,
        textAlign: 'center'
    },
    valueWrapper: {
        position: 'absolute',
        top: -20,
        width: 30,
    },
});