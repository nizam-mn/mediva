# 🏥 Mediva — AI-Powered Personal Health Assistant

Mediva is an intelligent personal health platform that helps users **manage medical data, analyze prescriptions, and gain AI-driven health insights** — all in one place.

Built with a modern stack combining **React Native, Firebase, and AI services**, Mediva focuses on making healthcare data **accessible, understandable, and actionable**.

---

## 🚀 Core Features

### 📄 AI Prescription Analyzer

* Upload prescriptions (including handwritten)
* AI-powered extraction using **Groq API**
* Detect medicines, dosage, and instructions
* Structured medical data output

---

### 🧠 Health Insights & Risk Prediction

* Personalized health insights dashboard
* Risk prediction based on:

  * Vitals
  * Lab reports
  * Medical history
* Powered by **Gemini 2.5 Flash**

---

### 💬 Medical Chatbot

* AI chatbot for general health queries
* Context-aware responses
* Assists users in understanding reports and symptoms

---

### 📂 Medical Document Storage

* Secure upload and storage of:

  * Prescriptions
  * Lab reports
  * Medical records
* Supports PDF, scanned documents, and images

---

### 🧬 Health Profile System

* Store and track:

  * Blood Sugar, BP, Cholesterol
  * BMI, Heart Rate, SpO₂
  * HbA1c, Creatinine, Vitamins
* Allergies & chronic conditions tracking
* Health score system

---

### ⏰ Smart Reminder System

* Medicine reminders (local + cloud sync)
* Daily tracking
* (Upcoming) Alarm-style intelligent reminders

---

## 🏗️ Tech Stack

### 📱 Frontend

* React Native (Expo)
* Firebase Authentication
* AsyncStorage

### ⚙️ Backend (AI Engine)

* Python (FastAPI via Uvicorn)
* Groq API (Prescription AI)
* Gemini 2.5 Flash (Health insights & prediction)

### 🗄️ Database & Storage

* Firebase Firestore
* Firebase Storage

---

## 📁 Project Structure

```
mediva/
 ├── frontend/              # React Native app
 ├── backend/               # Python AI backend
 │    ├── app/
 │    │    ├── main.py      # FastAPI entry point
 │    ├── venv/             # ❌ ignored
 │    ├── .env              # ❌ ignored
 │    ├── .env.example      # ✅ template
 │    ├── requirements.txt
 ├── .gitignore
 ├── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/mediva.git
cd mediva
```

---

### 2️⃣ Frontend Setup

```bash
cd frontend
npm install
npx expo start
```

---

### 3️⃣ Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate venv
# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

### 4️⃣ Environment Variables

Create a `.env` file inside `backend/`:

```
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
FIREBASE_CONFIG=your_config
```

> ⚠️ Never commit `.env` files to GitHub

---

### 5️⃣ Run Backend Server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🔐 Security Best Practices

* `.env` is excluded via `.gitignore`
* API keys are never exposed
* Use `.env.example` for reference
* Rotate keys if leaked

---

## 🧠 AI Capabilities Overview

| Feature                | Technology                     |
| ---------------------- | ------------------------------ |
| Prescription Analysis  | Groq API                       |
| Health Risk Prediction | Gemini 2.5 Flash               |
| Chatbot                | LLM-based conversational AI    |
| OCR & Parsing          | Tesseract / OpenCV / PDF tools |

---

## 🛣️ Roadmap

* 📊 Advanced health trend visualization
* 🔔 Smart alarm-based medicine reminders
* 📷 Real-time prescription scanning
* ☁️ Backup & multi-device sync improvements
* 🧾 Auto medical report summarization

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Developer

**Mohammed Nizam** |
**Habeeb Rahman** |
**Salahudheen** |
**Mohamed Safwan**


---

## 💡 Vision

Mediva aims to bridge the gap between **raw medical data and meaningful insights**, empowering users to take control of their health using AI.

---

## ⭐ Support

If you find this project useful, consider giving it a ⭐ on GitHub!
