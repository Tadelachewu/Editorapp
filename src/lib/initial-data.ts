import type { ProjectFile, FileContentStore, FileHistoryStore } from './types';

export const initialFiles: ProjectFile[] = [
  { id: '1', name: 'main.cpp', type: 'cpp', language: 'C++' },
  { id: '2', name: 'App.tsx', type: 'rn', language: 'React Native' },
  { id: '3', name: 'utils.h', type: 'cpp', language: 'C++' },
  { id: '4', name: 'Button.tsx', type: 'rn', language: 'React Native' },
];

const cppMainContent = `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`;

const rnAppContent = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const App = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello, React Native!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
  }
});

export default App;`;

const cppHeaderContent = `#ifndef UTILS_H
#define UTILS_H

int add(int a, int b);

#endif`;

const rnButtonContent = `import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const CustomButton = ({ title, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.button}>
    <Text style={styles.text}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#191970',
    padding: 10,
    borderRadius: 5,
  },
  text: {
    color: '#FFFFFF',
    textAlign: 'center',
  }
});

export default CustomButton;`;


export const initialContent: FileContentStore = {
  '1': cppMainContent,
  '2': rnAppContent,
  '3': cppHeaderContent,
  '4': rnButtonContent,
};

export const initialHistory: FileHistoryStore = {
  '1': [{ id: 'v1-1', content: cppMainContent, timestamp: new Date() }],
  '2': [{ id: 'v2-1', content: rnAppContent, timestamp: new Date() }],
  '3': [{ id: 'v3-1', content: cppHeaderContent, timestamp: new Date() }],
  '4': [{ id: 'v4-1', content: rnButtonContent, timestamp: new Date() }],
};
