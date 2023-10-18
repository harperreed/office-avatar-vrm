# Anime Neko Girl Office Avatar Web App

This web application allows you to control an animated Neko Girl avatar using APIs, MQTT, and WebSockets.

## Features

- Change emotions and animations via a RESTful API
- Synchronize avatar state in real-time with WebSockets
- Integrate with other services through MQTT
- Automatic state reset after a period of inactivity
- Dockerized for easy deployment

## Requirements

- Python 3.9
- Docker and Docker Compose

## Quick Start

### Clone the Repository

```bash
git clone <repository_url>
cd <repository_folder>
```

### Set up Environment Variables

Create a `.env` file in the root directory and populate it with necessary environment variables, like MQTT broker details.

### Build and Run with Docker Compose

```bash
docker-compose up --build
```

Your application will be available at `http://localhost:5000`.

### API Endpoints

- Set Emotion: `POST /api/emotion`
- Set Animation: `POST /api/animation`

### MQTT Topics

- Emotion: `/avatar/emotion`
- Animation: `/avatar/animation`

## Development

### Running Locally

If you prefer to run the app locally for development, set up a Python virtual environment and install dependencies:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Run the app:

```bash
python main.py
```

## License

This project is licensed under the MIT License.

---

Feel free to add or modify sections according to your project's needs.