import { View, Text, StyleSheet, SectionList } from 'react-native';

const SCHEDULE_DATA = [
  {
    title: 'Day 1 - Friday, Oct 24',
    data: [
      { time: '08:00 AM', event: 'Registration & Breakfast', location: 'Main Foyer' },
      { time: '09:00 AM', event: 'Opening Ceremony', location: 'Auditorium' },
      { time: '10:30 AM', event: 'Committee Session I', location: 'Committee Rooms' },
      { time: '01:00 PM', event: 'Lunch Break', location: 'Cafeteria' },
      { time: '02:00 PM', event: 'Committee Session II', location: 'Committee Rooms' },
      { time: '05:00 PM', event: 'High Tea', location: 'Lawn' },
    ],
  },
  {
    title: 'Day 2 - Saturday, Oct 25',
    data: [
      { time: '09:00 AM', event: 'Committee Session III', location: 'Committee Rooms' },
      { time: '01:00 PM', event: 'Lunch Break', location: 'Cafeteria' },
      { time: '02:00 PM', event: 'Committee Session IV', location: 'Committee Rooms' },
      { time: '06:00 PM', event: 'Delegate Dance (Socials)', location: 'Main Hall' },
    ],
  }
];

export default function ScheduleScreen() {
  return (
    <View style={styles.container}>
      <SectionList
        sections={SCHEDULE_DATA}
        keyExtractor={(item, index) => item.event + index}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
            <View style={styles.detailsContainer}>
              <Text style={styles.eventText}>{item.event}</Text>
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.header}>{title}</Text>
        )}
        stickySectionHeadersEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 20,
    color: '#334155',
  },
  item: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  timeContainer: {
    width: 80,
    justifyContent: 'center',
    borderRightWidth: 2,
    borderRightColor: '#cbd5e1',
    paddingRight: 12,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  detailsContainer: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'center',
  },
  eventText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
  },
});
