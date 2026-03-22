Here’s a clean, polished **GitHub-ready README.md** you can directly copy 👇

---

# 📘 Smart Research Assistant

## 🚀 Introduction

**Smart Research Assistant** is a full-stack project designed to simplify online research. It consists of:

* A **Spring Boot backend** for AI processing
* A **Chrome Extension frontend** for user interaction

The extension captures selected text from webpages and sends it to the backend for **AI-powered summarization and suggestions**, making research faster and more organized.

---

## ✨ Features

* Capture selected text from any webpage
* Open results in a Chrome side panel
* Send text to AI via backend API
* Generate summaries of content
* Save and reopen research history
* Edit saved responses

---

## 🏗️ Project Structure

The project is divided into two main parts:

```
Smart-Research-Assistant/
│
├── research-assistant/   # Spring Boot Backend
└── extension-UI/         # Chrome Extension Frontend
```

---

## 🛠️ Tech Stack

### Backend

* Java 21
* Spring Boot
* Maven
* WebClient
* Gemini API

### Frontend

* Chrome Extension (Manifest V3)
* JavaScript
* HTML
* CSS
* Chrome Storage API
* Chrome Side Panel API

---

## 🔄 How It Works

1. User selects text on a webpage
2. Extension captures the selected text
3. Side panel displays the captured content
4. Frontend sends a request to the backend
5. Backend processes the request and calls Gemini API
6. AI generates a response (summary/suggestions)
7. Backend returns the result
8. Frontend displays and optionally stores it

---

## ⚙️ Backend Setup

### Requirements

* Java 21 installed
* Maven (or use Maven Wrapper)

### Steps

1. Navigate to backend folder:

   ```bash
   cd research-assistant
   ```

2. Set environment variable:

   ```bash
   export GEMINI_KEY=your_api_key
   ```

   (Windows PowerShell)

   ```powershell
   setx GEMINI_KEY "your_api_key"
   ```

3. Run the backend:

   ```bash
   ./mvnw spring-boot:run
   ```

Backend will run on:

```
http://localhost:8080
```

---

## 🔌 API

### Endpoint

```
POST /api/research/process
```

### Example Request

```json
{
  "content": "some text",
  "operation": "summarize"
}
```

### Supported Operations

* `summarize`
* `suggest`

---

## 🌐 Frontend Setup

1. Open Chrome and go to:

   ```
   chrome://extensions
   ```

2. Enable **Developer Mode** (top right)

3. Click **Load Unpacked**

4. Select the folder:

   ```
   extension-UI/
   ```

---

## ▶️ Usage

1. Start the backend server
2. Load the Chrome extension
3. Open any webpage
4. Select text
5. Open the extension side panel
6. Click **Research**
7. View AI-generated results
8. Save or edit responses as needed

---

## ⚠️ Important Notes

* The frontend currently depends on a **localhost backend**
* Backend must be running for the extension to work
* **Do NOT upload your API key** to GitHub
* Research history is stored using **Chrome Local Storage**

---

## 📦 GitHub Upload Guidelines

Upload both folders:

```
research-assistant/
extension-UI/
```

### Do NOT upload:

* `.env` files
* API keys
* `target/` or build folders
* logs
* `.idea/`, `.vscode/`

---

## 🔮 Future Improvements

* Deploy backend to cloud (AWS / Render / Railway)
* Add more AI operations (explain, translate, etc.)
* Improve UI/UX of extension
* Add user authentication
* Export saved research (PDF / notes)

---

## 📄 License

This project is open-source and can be licensed under the **MIT License** (or your preferred license).

---

