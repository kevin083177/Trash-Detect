<div align="center" flexDirection="row">
    <h1 style="border: none">Garbi</h1>
    <img src="https://raw.githubusercontent.com/kevin083177/Trash-Detect/refs/heads/main/Frontend/src/assets/images/icon.png" alt="Garbi App Logo" width="300" height="300">
</div>

## 📚 Documentation

- **[API Documentation](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/API.md)** - Comprehensive API endpoint reference
- **[Middleware Documentation](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/Middleware.md)** - Middleware configuration and usage

---

## 🚀 Quick Start

### Prerequisites

You need **Docker** and **Docker Compose** installed to run this project.

- **Windows / macOS:** Recommend installing [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose).
- **Linux:** Install `docker-ce` and `docker-compose-plugin`.

### Setup Instructions

#### Configure Environment Variables
Create and configure your `.env` file in the project root directory.

#### Run Setup Script
Before running the setup script, ensure you have the following:
- **Cloudinary Account:** Sign up and get your cloud name and API credentials
    - Register at: https://cloudinary.com/users/register_free
    - After registration, find your credentials in the Dashboard

- **Google API Services:** Enable required Google APIs and obtain credentials
    - Access Google Cloud Console: https://console.cloud.google.com/
    - Create a new project or select an existing one
    - Enable necessary APIs (e.g., Maps API, Places API, etc.)
    - Create credentials (API Key or OAuth 2.0)
- **Network Configuration:** Ensure `CURRENT_IP` is set to your machine's IP (not localhost)
    <details>
        <summary>How to get your host machine IP?</summary>

    ```bash
    # macOS
    ipconfig getifaddr en0

    # Linux
    hostname -I | awk '{print $1}'

    # Windows (PowerShell)
    (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi").IPAddress

    # Windows (CMD)
    ipconfig  # Look for IPv4 Address
    ```
    </details>

- **Execute the setup script**
    ```
    ./setup.sh
    ```
#### Choose Your Deployment Method
You will be prompted with two options:

- ##### **Option 1: Backend Only**
    Run only the backend services (Docker Compose) without setting up the frontend.

- ##### **Option 2: Full Stack**
    Run the complete stack including backend services and mobile client.
---

## 📱 Mobile Device Setup

To run the app on a physical device:

1. Enable **Developer Options** and **USB Debugging** on your Android device
2. Connect your device to your computer via USB
3. Verify connection: `adb devices`
4. Run the setup script as shown above

---

## 🛠️ Tech Stack

### Frontend (Mobile App)
- **Framework:** React Native (via Expo SDK 52)
- **Language:** TypeScript
- **Features:** Vision Camera (Scanning), Socket.io-client (Real-time), React Native Maps

### Frontend (Admin Web)
- **Framework:** React (via Vite)
- **Language:** TypeScript

### Backend (API & WebSocket)
- **Framework:** Flask
- **Real-time:** Flask-SocketIO
- **Server:** Gevent (WSGI)
- **Database:** MongoDB

### AI & Computer Vision
- **Object Detection:** Ultralytics YOLO11
- **Image Processing:** OpenCV

### Infrastructure & Services
- **Containerization:** Docker, Docker Compose
- **Cloud Storage:** Cloudinary

---

## 📄 License
This project is licensed under the [MIT License](LICENSE)
