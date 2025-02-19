## Getting Started

### Prerequisites

- **Node.js and npm:** Make sure you have Node.js (version 12 or later) and npm (Node Package Manager) installed on your system. You can download them from [nodejs.org](https://nodejs.org/).
- **Feroxbuster:** You need to have `feroxbuster` installed and available in your system's PATH. You can install it from [feroxbuster GitHub releases](https://github.com/epi052/feroxbuster/releases) or using your system's package manager (e.g., `apt install feroxbuster` on Debian/Ubuntu).

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/terminalDZ/feroxbuster-web-ui.git
    cd feroxbuster-web-ui
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Place wordlists**
    Copy your `.txt` wordlists files into the `./public/common/` folder.

### Running the Application

1.  **Start the server:**

    ```bash
    npm start
    ```

    This will start the Node.js server, typically on port 3000.

2.  **Open in your browser:**

    Open your web browser and go to `http://localhost:3000`.

### Usage

1.  **Add URLs:**

    - Enter URLs in the "URLs" input field and click the "+" button to add them.
    - You can also import URLs from a `.txt` file using the "Import URLs" button.

2.  **Select a Wordlist:**

    - Choose a wordlist from the dropdown menu (populated from files in `./public/common/`).
    - Alternatively, enter a custom wordlist path in the "Or enter a custom wordlist path" input field.

3.  **Start the Scan:**

    - Click the "Start Scan" button.
    - The scan status will change to "Scanning...", and you'll see real-time output in the "Terminal" panel.
    - The Start Scan button will be disable and the Stop Scan button will be enable.

4.  **Stop the Scan (Optional):**

    - Click the Stop Scan button to interrupt the current scan.

5.  **View Results:**

    - Comming soon: Results will appear in the "Results" table as feroxbuster finds them.

6.  **Download Results:**
    - Click "Download JSON" to download the results in JSON format.
    - Click "Download CSV" to download the results in CSV format.
7.  **Page Reload:**
    - You can refresh/reload the page during an active scan, and it will reconnect showing existing output and scan status.

## Important Notes

- **Error Handling:** The application includes basic error handling (e.g., for file reading, parsing JSON). More robust error handling and logging could be added.
- **Security:** This is a basic example and _does not_ include security features like input sanitization or authentication. If you deploy this publicly, you _must_ add appropriate security measures. Do not expose this tool directly to the internet without proper security configurations. Consider running it only on your local machine or within a protected network.
- **Concurrency:** The application prevents multiple simultaneous feroxbuster scans. Attempting to start a new scan while one is already running will have no effect.
- **`data.json`:** The `data.json` file is overwritten each time a new scan is started. If you want to preserve results across scans, you should download them before starting a new scan.
- **Wordlist Paths:** The JavaScript code constructs the wordlist path relative to the `public` directory (e.g., `./common/wordlist.txt`). Ensure your wordlists are placed in the correct directory.

## Contributing

Contributions are welcome! If you find any bugs or have suggestions for improvements, please open an issue or submit a pull request.
