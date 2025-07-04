# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## AI Integration

This project supports two AI providers: **Google AI (Gemini)** for cloud-based access and **Ollama** for local development. You can switch between them using the toggle in the sidebar.

### Using the AI Provider Toggle

In the bottom-left sidebar, you'll find an "AI Settings" section with a toggle:

-   **Use Ollama (Local) (Enabled by default):** When this is on, the application will use models running locally via Ollama.
-   **Use Ollama (Local) (Disabled):** When this is off, the application will switch to using Google AI's cloud-based Gemini models.

Your choice is saved in your browser's local storage and will be remembered.

### Configuring Google AI

To use Google's Gemini models (when the "Use Ollama" toggle is off), you need an API key.

1.  Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Create a file named `.env.local` in the root of your project.
3.  Add the following line to your `.env.local` file, replacing `YOUR_API_KEY_HERE` with your actual key:

    ```
    GOOGLE_API_KEY=YOUR_API_KEY_HERE
    ```

### Configuring Ollama (Local)

To run models locally with Ollama (when the "Use Ollama" toggle is on):

1.  **Install Ollama:** Follow the instructions on the [Ollama website](https://ollama.com/) to download and install it for your operating system.
2.  **Run Ollama:** Make sure the Ollama server is running. You can start it with:
    ```bash
    ollama serve
    ```
3.  **Pull a Model:** This project defaults to using the `llama3` model with Ollama. You need to pull it first:
    ```bash
    ollama pull llama3
    ```

#### Running Ollama on Termux (Android / ARM64 Linux)

For users on Android with Termux or another ARM64 Linux environment, you can use the following commands to install and run Ollama:

```bash
# 1. Update your packages
pkg update && pkg upgrade

# 2. Install dependencies
pkg install curl git python

# 3. Download and prepare Ollama
curl -L https://ollama.ai/download/ollama-linux-arm64 -o ollama
chmod +x ollama

# 4. Run the Ollama server in the background
./ollama serve &

# 5. Pull your desired model
ollama pull llama3
```
