// components/DelegatePDF.tsx
import React from 'react'
import { Page, Text, View, Document, StyleSheet, PDFViewer } from '@react-pdf/renderer'

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  table: {
    display: 'flex',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableColHeader: {
    width: '25%',
    padding: 5,
    backgroundColor: '#f0f0f0',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tableCol: {
    width: '25%',
    padding: 5,
    textAlign: 'center',
  },
})

// Define the DelegatePDF component
const DelegatePDF = ({ delegates, committees }) => {
  // Sort delegates alphabetically by name
  const sortedDelegates = delegates.sort((a, b) =>
    a.delegateInfo.name.localeCompare(b.delegateInfo.name)
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Delegate List</Text>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Name</Text>
            <Text style={styles.tableColHeader}>Email</Text>
            <Text style={styles.tableColHeader}>Committee</Text>
            <Text style={styles.tableColHeader}>Status</Text>
          </View>
          {/* Table Rows */}
          {sortedDelegates.map((delegate) => {
            const committee = committees.find((c) => c.id === delegate.committeeId)
            return (
              <View key={delegate.id} style={styles.tableRow}>
                <Text style={styles.tableCol}>{delegate.delegateInfo.name}</Text>
                <Text style={styles.tableCol}>{delegate.delegateInfo.email}</Text>
                <Text style={styles.tableCol}>{committee?.name || 'N/A'}</Text>
                <Text style={styles.tableCol}>
                  {delegate.checkedIn ? 'Checked-In' : 'Not Checked-In'}
                </Text>
              </View>
            )
          })}
        </View>
      </Page>
    </Document>
  )
}

export default DelegatePDF