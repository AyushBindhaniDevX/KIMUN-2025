import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';

const NEWS_DATA = [
  {
    id: '1',
    title: 'Secretariat Announces Guest Speaker',
    date: '2 hours ago',
    content: 'We are thrilled to announce that the former UN Ambassador will be giving the keynote address at the opening ceremony.',
    image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '2',
    title: 'Shuttle Schedule Updated',
    date: '5 hours ago',
    content: 'Please check the updated shuttle schedule on the resources tab. Shuttles will now depart every 15 minutes from the main hotel.',
    image: 'https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '3',
    title: 'Welcome to KIMUN 2025',
    date: '1 day ago',
    content: 'The organizing committee welcomes all delegates to the finest Model UN experience of the year.',
    image: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=800&q=80',
  }
];

export default function NewsScreen() {
  return (
    <ScrollView style={styles.container}>
      {NEWS_DATA.map(news => (
        <View key={news.id} style={styles.card}>
          <Image source={{ uri: news.image }} style={styles.image} />
          <View style={styles.cardContent}>
            <Text style={styles.date}>{news.date}</Text>
            <Text style={styles.title}>{news.title}</Text>
            <Text style={styles.contentText}>{news.content}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 20,
  },
  date: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  contentText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
});
