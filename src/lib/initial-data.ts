import type { ProjectItem, FileContentStore, Language, FileType } from './types';

export const initialItems: ProjectItem[] = [
  // Folders
  { id: 'folder-cpp', name: 'C++ Projects', parentId: null, itemType: 'folder', fileType: null, language: null },
  { id: 'folder-rn', name: 'React Native Apps', parentId: null, itemType: 'folder', fileType: null, language: null },
  { id: 'folder-py', name: 'Python Scripts', parentId: null, itemType: 'folder', fileType: null, language: null },
  { id: 'folder-js', name: 'JavaScript Snippets', parentId: null, itemType: 'folder', fileType: null, language: null },
  { id: 'folder-java', name: 'Java Examples', parentId: null, itemType: 'folder', fileType: null, language: null },
  { id: 'folder-go', name: 'Go Programs', parentId: null, itemType: 'folder', fileType: null, language: null },

  // Files
  { id: '1', name: 'main.cpp', parentId: 'folder-cpp', itemType: 'file', fileType: 'cpp', language: 'C++' },
  { id: '2', name: 'App.tsx', parentId: 'folder-rn', itemType: 'file', fileType: 'rn', language: 'React Native' },
  { id: '3', name: 'utils.h', parentId: 'folder-cpp', itemType: 'file', fileType: 'cpp', language: 'C++' },
  { id: '4', name: 'Button.tsx', parentId: 'folder-rn', itemType: 'file', fileType: 'rn', language: 'React Native' },
  { id: '5', name: 'main.py', parentId: 'folder-py', itemType: 'file', fileType: 'py', language: 'Python' },
  { id: '6', name: 'app.js', parentId: 'folder-js', itemType: 'file', fileType: 'js', language: 'JavaScript' },
  { id: '7', name: 'Main.java', parentId: 'folder-java', itemType: 'file', fileType: 'java', language: 'Java' },
  { id: '8', name: 'main.go', parentId: 'folder-go', itemType: 'file', fileType: 'go', language: 'Go' },
];

export const languages: Language[] = ['C++', 'React Native', 'Python', 'JavaScript', 'Java', 'Go'];

export const fileTypesByLanguage: Record<Language, FileType> = {
  'C++': 'cpp',
  'React Native': 'rn',
  'Python': 'py',
  'JavaScript': 'js',
  'Java': 'java',
  'Go': 'go',
};

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

export const initialHistorySeed: Record<string, { content: string; timestamp: Date }[]> = {
  '1': [{ content: cppMainContent, timestamp: new Date() }],
  '2': [{ content: rnAppContent, timestamp: new Date() }],
  '3': [{ content: cppHeaderContent, timestamp: new Date() }],
  '4': [{ content: rnButtonContent, timestamp: new Date() }],
  '5': [{ content: pythonContent, timestamp: new Date() }],
  '6': [{ content: jsContent, timestamp: new Date() }],
  '7': [{ content: javaContent, timestamp: new Date() }],
  '8': [{ content: goContent, timestamp: new Date() }],
};
