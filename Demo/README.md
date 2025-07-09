# PagarBook Clone: Face Recognition Attendance System

## Project Structure

```
/backend
  /php-api         # PHP REST API for business logic
  /python-face     # Python microservice for face recognition
  /db              # Database schema, migrations
/frontend
  /mobile-app      # React Native app
  /web-app         # React web app (optional)
/docs              # API docs, architecture
/scripts           # DevOps, deployment scripts
```

## Tech Stack
- React Native (mobile)
- React (web)
- PHP (Laravel/Slim/Lumen)
- Python (Flask/FastAPI, OpenCV, face_recognition)
- MySQL/PostgreSQL
- JWT/OAuth2
- Docker, Nginx/Apache

## Setup Instructions
1. Clone the repo
2. Set up the database (see /backend/db)
3. Start PHP API (`/backend/php-api`)
4. Start Python face recognition service (`/backend/python-face`)
5. Start React Native app (`/frontend/mobile-app`)
6. (Optional) Start React web app (`/frontend/web-app`)

---

This project is a full-featured clone of [PagarBook](https://pagarbook.com/) for large companies, supporting face recognition attendance, payroll, notifications, and more. 