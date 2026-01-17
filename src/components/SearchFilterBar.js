import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { APP_COLORS } from '../config/constants';

const CATEGORIES = ['All', 'Transport', 'Meals', 'Supplies', 'Services', 'Other', 'Uncategorized'];

const SearchFilterBar = ({ onFilterChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    category: 'All',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    applyFilters({ ...filters, searchQuery: text });
  };

  const applyFilters = (newFilters = filters) => {
    // Count active filters
    let count = 0;
    if (newFilters.category !== 'All') count++;
    if (newFilters.minAmount) count++;
    if (newFilters.maxAmount) count++;
    if (newFilters.startDate) count++;
    if (newFilters.endDate) count++;
    
    setActiveFiltersCount(count);
    
    onFilterChange({
      searchQuery,
      ...newFilters,
    });
  };

  const handleApplyFilters = () => {
    applyFilters();
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      category: 'All',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: '',
    };
    setFilters(clearedFilters);
    setSearchQuery('');
    setActiveFiltersCount(0);
    onFilterChange({ searchQuery: '' });
    setShowFilterModal(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search receipts..."
          placeholderTextColor={APP_COLORS.textSecondary}
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              handleSearchChange('');
            }}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilterModal(true)}
      >
        <Text style={styles.filterButtonText}>
          🔧 {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
        </Text>
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Receipts</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Category Filter */}
              <Text style={styles.filterLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      filters.category === category && styles.categoryChipSelected,
                    ]}
                    onPress={() =>
                      setFilters({ ...filters, category })
                    }
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        filters.category === category && styles.categoryChipTextSelected,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount Range Filter */}
              <Text style={styles.filterLabel}>Amount Range (R)</Text>
              <View style={styles.rangeRow}>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="Min"
                  placeholderTextColor={APP_COLORS.textSecondary}
                  keyboardType="decimal-pad"
                  value={filters.minAmount}
                  onChangeText={(text) =>
                    setFilters({ ...filters, minAmount: text })
                  }
                />
                <Text style={styles.rangeSeparator}>-</Text>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="Max"
                  placeholderTextColor={APP_COLORS.textSecondary}
                  keyboardType="decimal-pad"
                  value={filters.maxAmount}
                  onChangeText={(text) =>
                    setFilters({ ...filters, maxAmount: text })
                  }
                />
              </View>

              {/* Date Range Filter */}
              <Text style={styles.filterLabel}>Date Range</Text>
              <Text style={styles.filterHint}>
                Format: YYYY-MM-DD (e.g., 2024-01-15)
              </Text>
              <View style={styles.dateRow}>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>From:</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={APP_COLORS.textSecondary}
                    value={filters.startDate}
                    onChangeText={(text) =>
                      setFilters({ ...filters, startDate: text })
                    }
                  />
                </View>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>To:</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={APP_COLORS.textSecondary}
                    value={filters.endDate}
                    onChangeText={(text) =>
                      setFilters({ ...filters, endDate: text })
                    }
                  />
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={handleClearFilters}
              >
                <Text style={styles.clearFiltersButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: APP_COLORS.surface,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: APP_COLORS.text,
  },
  clearButton: {
    padding: 5,
  },
  clearButtonText: {
    fontSize: 18,
    color: APP_COLORS.textSecondary,
  },
  filterButton: {
    backgroundColor: APP_COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  filterButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: APP_COLORS.text,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: APP_COLORS.textSecondary,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginTop: 15,
    marginBottom: 10,
  },
  filterHint: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    backgroundColor: '#fff',
  },
  categoryChipSelected: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: APP_COLORS.text,
  },
  categoryChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rangeInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: APP_COLORS.text,
    backgroundColor: '#fff',
  },
  rangeSeparator: {
    fontSize: 18,
    color: APP_COLORS.textSecondary,
  },
  dateRow: {
    gap: 10,
  },
  dateInputContainer: {
    marginBottom: 10,
  },
  dateLabel: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    marginBottom: 5,
  },
  dateInput: {
    height: 45,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: APP_COLORS.text,
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  clearFiltersButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.error,
    alignItems: 'center',
  },
  clearFiltersButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.error,
  },
  applyButton: {
    flex: 1,
    backgroundColor: APP_COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SearchFilterBar;
