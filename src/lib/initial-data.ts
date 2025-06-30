import type { ProjectFile, FileContentStore, FileHistoryStore } from './types';

export const initialFiles: ProjectFile[] = [
  { id: '1', name: 'main.cpp', type: 'cpp', language: 'C++' },
  { id: '2', name: 'App.tsx', type: 'rn', language: 'React Native' },
  { id: '3', name: 'utils.h', type: 'cpp', language: 'C++' },
  { id: '4', name: 'Button.tsx', type: 'rn', language: 'React Native' },
  { id: '5', name: 'main.py', type: 'py', language: 'Python' },
  { id: '6', name: 'app.js', type: 'js', language: 'JavaScript' },
  { id: '7', name: 'Main.java', type: 'java', language: 'Java' },
  { id: '8', name: 'main.go', type: 'go', language: 'Go' },
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

const pythonContent = `def main():
    print("Hello, Python!")

if __name__ == "__main__":
    main()`;

const jsContent = `console.log("Hello, JavaScript!");`;

const javaContent = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}`;

const goContent = `package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!")
}`;


export const initialContent: FileContentStore = {
  '1': cppMainContent,
  '2': rnAppContent,
  '3': cppHeaderContent,
  '4': rnButtonContent,
  '5': pythonContent,
  '6': jsContent,
  '7': javaContent,
  '8': goContent,
};

export const initialHistory: FileHistoryStore = {
  '1': [{ id: 'v1-1', content: cppMainContent, timestamp: new Date() }],
  '2': [{ id: 'v2-1', content: rnAppContent, timestamp: new Date() }],
  '3': [{ id: 'v3-1', content: cppHeaderContent, timestamp: new Date() }],
  '4': [{ id: 'v4-1', content: rnButtonContent, timestamp: new Date() }],
  '5': [{ id: 'v5-1', content: pythonContent, timestamp: new Date() }],
  '6': [{ id: 'v6-1', content: jsContent, timestamp: new Date() }],
  '7': [{ id: 'v7-1', content: javaContent, timestamp: new Date() }],
  '8': [{ id: 'v8-1', content: goContent, timestamp: new Date() }],
};
