
import type { ProjectItem, FileContentStore, Language, FileType } from './types';

export const initialItems: ProjectItem[] = [
  // Folders
  { id: 'folder-cpp', name: 'C++ Projects', parentId: null, itemType: 'folder', fileType: null, language: null },
  { id: 'folder-rn', name: 'React Native Apps', parentId: null, itemType: 'folder', fileType: null, language: null },
  { id: 'folder-py', name: 'Python Scripts', parentId: null, itemType: 'folder', fileType: null, language: null },
  { id: 'folder-js', name: 'JavaScript Snippets', parentId: null, itemType: 'folder', fileType: null, language: null },
  { id: 'folder-java', name: 'Java Examples', parentId: null, itemType: 'folder', fileType: null, language: null },
  { id: 'folder-go', name: 'Go Programs', parentId: null, itemType: 'folder', fileType: null, language: null },
  { id: 'folder-nodejs', name: 'Node.js Projects', parentId: null, itemType: 'folder', fileType: null, language: null },
  { id: 'folder-web', name: 'Web Projects', parentId: null, itemType: 'folder', fileType: null, language: null },

  // Files
  { id: '1', name: 'main.cpp', parentId: 'folder-cpp', itemType: 'file', fileType: 'cpp', language: 'C++' },
  { id: '2', name: 'App.tsx', parentId: 'folder-rn', itemType: 'file', fileType: 'rn', language: 'React Native' },
  { id: '3', name: 'utils.h', parentId: 'folder-cpp', itemType: 'file', fileType: 'cpp', language: 'C++' },
  { id: '4', name: 'Button.tsx', parentId: 'folder-rn', itemType: 'file', fileType: 'rn', language: 'React Native' },
  { id: '5', name: 'main.py', parentId: 'folder-py', itemType: 'file', fileType: 'py', language: 'Python' },
  { id: '6', name: 'app.js', parentId: 'folder-js', itemType: 'file', fileType: 'js', language: 'JavaScript' },
  { id: '7', name: 'Main.java', parentId: 'folder-java', itemType: 'file', fileType: 'java', language: 'Java' },
  { id: '8', name: 'main.go', parentId: 'folder-go', itemType: 'file', fileType: 'go', language: 'Go' },
  { id: '9', name: 'server.js', parentId: 'folder-nodejs', itemType: 'file', fileType: 'js', language: 'Node.js' },
  { id: '10', name: 'index.html', parentId: 'folder-web', itemType: 'file', fileType: 'html', language: 'Web' },
  { id: '11', name: 'style.css', parentId: 'folder-web', itemType: 'file', fileType: 'html', language: 'Web' }, // Using 'html' filetype for simplicity
  { id: '12', name: 'script.js', parentId: 'folder-web', itemType: 'file', fileType: 'html', language: 'Web' }, // Using 'html' filetype for simplicity
];

export const languages: Language[] = ['C++', 'React Native', 'Python', 'JavaScript', 'Java', 'Go', 'Node.js', 'Web'];

export const fileTypesByLanguage: Record<Language, FileType> = {
  'C++': 'cpp',
  'React Native': 'rn',
  'Python': 'py',
  'JavaScript': 'js',
  'Java': 'java',
  'Go': 'go',
  'Node.js': 'js',
  'Web': 'html',
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

const nodeServerContent = `const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello, Node.js!');
});

server.listen(port, hostname, () => {
  console.log(\`Server running at http://\${hostname}:\${port}/\`);
});`;

const webIndexContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello Web</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1 id="greeting">Hello, Web!</h1>
    <p>Click the heading to see an alert.</p>
    <script src="script.js"></script>
</body>
</html>`;

const webCssContent = `body {
    font-family: sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
    background-color: #f0f0f0;
}
h1 {
    color: #333;
    cursor: pointer;
}
p {
    color: #666;
}`;

const webJsContent = `document.getElementById('greeting').addEventListener('click', () => {
    alert('You clicked the heading!');
});

console.log("External script loaded successfully!");
`;


export const initialContent: FileContentStore = {
  '1': cppMainContent,
  '2': rnAppContent,
  '3': cppHeaderContent,
  '4': rnButtonContent,
  '5': pythonContent,
  '6': jsContent,
  '7': javaContent,
  '8': goContent,
  '9': nodeServerContent,
  '10': webIndexContent,
  '11': webCssContent,
  '12': webJsContent,
};

export const fileTemplates: Record<Language, string> = {
  'C++': `#include <iostream>

int main() {
    std::cout << "New C++ file!" << std::endl;
    return 0;
}`,
  'React Native': `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NewComponent = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>New React Native Component</Text>
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
    fontSize: 20,
  }
});

export default NewComponent;`,
  'Python': `def main():
    print("New Python file!")

if __name__ == "__main__":
    main()`,
  'JavaScript': `console.log("New JavaScript file!");`,
  'Java': `public class NewFile {
    public static void main(String[] args) {
        System.out.println("New Java file!");
    }
}`,
  'Go': `package main

import "fmt"

func main() {
    fmt.Println("New Go file!")
}`,
  'Node.js': `const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello from new Node.js server!');
});

server.listen(port, hostname, () => {
  console.log(\`Server running at http://\${hostname}:\${port}/\`);
});`,
  'Web': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Web Page</title>
    <style>
        body {
            font-family: sans-serif;
            background-color: #f0f0f0;
        }
        h1 {
            color: #333;
        }
    </style>
</head>
<body>
    <h1>New Web Page</h1>
    <script>
        console.log('Hello from new web page!');
    </script>
</body>
</html>`,
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
  '9': [{ content: nodeServerContent, timestamp: new Date() }],
  '10': [{ content: webIndexContent, timestamp: new Date() }],
  '11': [{ content: webCssContent, timestamp: new Date() }],
  '12': [{ content: webJsContent, timestamp: new Date() }],
};
