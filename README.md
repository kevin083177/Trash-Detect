<div align="center" flexDirection="row">
    <p style="font-size: 40px; font-weight: bold; margin-bottom: 24px;">Garbi</p>
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

#### 1️⃣ Configure Environment Variables

Create and configure your `.env` file in the project root directory.

#### 2️⃣ Choose Your Deployment Method

##### **Option A: Server Deployment**

Deploy the backend services to your server:
```bash
docker-compose up --build -d
```

##### **Option B: Local Development (with Client)**

Run the full stack including the mobile client on your local machine:

<details>
	<summary>Click to expand</summary>

- Ensure `CURRENT_IP` is set to your machine's network IP (not `localhost`)
- Connect your mobile device to the host machine via `adb`
- Run the command:
    ```bash
    ./setup.sh
    ```
</details>

How to get your host machine IP?
<details>
	<summary>Click to expand</summary>

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
