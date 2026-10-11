import React from 'react';
import { View, Text, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import theme from '../styles/theme';

interface Column {
  header: string;
  key: string;
  width?: number | string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  style?: ViewStyle;
}

export default function Table({ columns, data, style }: TableProps) {
  return (
    <View style={[styles.container, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.headerRow}>
            {columns.map((col, idx) => (
              <View
                key={idx}
                style={[
                  styles.headerCell,
                  { width: col.width || 150, minWidth: col.width || 150 },
                ]}
              >
                <Text style={styles.headerText}>{col.header}</Text>
              </View>
            ))}
          </View>

          {/* Body */}
          {data.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No data available</Text>
            </View>
          ) : (
            data.map((row, rowIdx) => (
              <View
                key={rowIdx}
                style={[
                  styles.dataRow,
                  rowIdx === data.length - 1 && styles.lastDataRow,
                ]}
              >
                {columns.map((col, colIdx) => (
                  <View
                    key={colIdx}
                    style={[
                      styles.dataCell,
                      { width: col.width || 150, minWidth: col.width || 150 },
                    ]}
                  >
                    {col.render ? (
                      col.render(row[col.key], row)
                    ) : (
                      <Text style={styles.dataText}>{row[col.key] || '—'}</Text>
                    )}
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  table: {
    minWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgTertiary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerCell: {
    padding: theme.spacing.lg,
  },
  headerText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.slate600,
    textTransform: 'uppercase',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  lastDataRow: {
    borderBottomWidth: 0,
  },
  dataCell: {
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  dataText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.slate700,
  },
  emptyRow: {
    padding: theme.spacing['4xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textTertiary,
  },
});
