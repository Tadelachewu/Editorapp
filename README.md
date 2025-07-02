# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## AI Integration

This project supports two AI providers: **Google AI (Gemini)** for cloud-based access and **Ollama** for local development. You can switch between them using an environment variable.

### Configuring the AI Provider

Create a file named `.env.local` in the root of your project to configure the AI provider.

#### Option 1: Use Google AI (Default)

To use Google's Gemini models, you need an API key.

1.  Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Add the following line to your `.env.local` file:

    ```
    GOOGLE_API_KEY=YOUR_API_KEY_HERE
    ```

    With this setting, the app will use the `gemini-1.5-flash-latest` model by default.

#### Option 2: Use Ollama (Local)

To run models locally with Ollama and avoid cloud API rate limits:

1.  Set the following in your `.env.local` file:
    ```
    OLLAMA_ENABLED=true
    ```
2.  **Install Ollama:** Follow the instructions on the [Ollama website](https://ollama.com/) to download and install it for your operating system.
3.  **Run Ollama:** Make sure the Ollama server is running. You can start it with:
    ```bash
    ollama serve
    ```
4.  **Pull a Model:** This project defaults to using the `llama3` model with Ollama. You need to pull it first:
    ```bash
    ollama pull llama3
    ```
