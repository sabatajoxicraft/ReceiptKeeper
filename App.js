import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  StatusBar,
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const App = () => {
  const [db, setDb] = useState(null);
  const [name, setName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [openCount, setOpenCount] = useState(0);
  const [isFirstTime, setIsFirstTime] = useState(true);

  useEffect(() => {
    initDatabase();
  }, []);

  const initDatabase = async () => {
    try {
      const database = await SQLite.openDatabase({
        name: 'AppCounter.db',
        location: 'default',
      });
      setDb(database);

      await database.executeSql(
        `CREATE TABLE IF NOT EXISTS user_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          open_count INTEGER
        )`
      );

      const results = await database.executeSql('SELECT * FROM user_data LIMIT 1');
      
      if (results[0].rows.length > 0) {
        const row = results[0].rows.item(0);
        setSavedName(row.name);
        const newCount = row.open_count + 1;
        setOpenCount(newCount);
        setIsFirstTime(false);
        
        await database.executeSql(
          'UPDATE user_data SET open_count = ? WHERE id = ?',
          [newCount, row.id]
        );
      } else {
        setIsFirstTime(true);
        setOpenCount(1);
      }
    } catch (error) {
      console.error('Database error:', error);
    }
  };

  const saveName = async () => {
    if (!name.trim()) {
      return;
    }

    try {
      await db.executeSql(
        'INSERT INTO user_data (name, open_count) VALUES (?, ?)',
        [name, openCount]
      );
      setSavedName(name);
      setIsFirstTime(false);
    } catch (error) {
      console.error('Error saving name:', error);
    }
  };

  if (isFirstTime) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.content}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.label}>Please enter your name:</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#999"
          />
          <Button title="Save" onPress={saveName} />
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              App opened: {openCount} {openCount === 1 ? 'time' : 'times'}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Text style={styles.welcomeTitle}>Welcome back, {savedName}! 👋</Text>
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            You've opened this app {openCount} {openCount === 1 ? 'time' : 'times'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  counter: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  counterText: {
    fontSize: 20,
    textAlign: 'center',
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default App;
