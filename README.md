# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## AI Integration with Ollama

This project is configured to use Ollama for local AI integration, allowing you to run powerful language models on your own machine without needing cloud APIs.

### Prerequisites

1.  **Install Ollama:** Follow the instructions on the [Ollama website](https://ollama.com/) to download and install it for your operating system.

2.  **Run Ollama:** Make sure the Ollama server is running. You can start it by running the following command in your terminal:
    ```bash
    ollama serve
    ```

3.  **Pull a Model:** This project defaults to using the `llama3` model. You need to pull it first:
    ```bash
    ollama pull llama3
    ```

Once Ollama is running and you have pulled a model, the AI features in this application will work automatically.
