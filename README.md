# pick-me-up

[![Django CI](https://github.com/iiacoban42/DelfiTLM/actions/workflows/django.yml/badge.svg?branch=main)](https://github.com/iiacoban42/DelfiTLM/actions/workflows/django.yml)

The "pick-me-up" project introduces a Discord bot that creates personalized music playlists by blending users' preferred genres. To enhance the experience, the bot considers the users' current activities, such as studying or gaming. The back-end server implements a recommender system that analyzes users' genre preferences and interacts with the Spotify API to generate a customized playlist that aligns with their preferences and current context. Once the playlist is compiled, the bot utilizes the Google API to retrieve the YouTube URLs of the recommended tracks. These URLs are then sent back to the Discord bot, allowing them to be played in the voice channel.

## Requirements
- python3
- Docker and docker-compose (optional)
- npm
- Discord bot token
- API keys from Spotify and Google

## Launch the Discord bot
1. Navigate to folder `bot`
2. Add a `.env` file in the `bot` folder containing:
TOKEN="OBTAIN TOKEN FROM DISCORD DEVELOPER PORTAL"
CLIENT_ID="OBTAIN CLIENT ID FROM DISCORD DEVELOPER PORTAL"

3. Run `npm install`
4. Run `npm start`
5. Enter `/join` in the Discord server text channel


## Setup Django server

1. Create a python environment (one time instruction):
`python3 -m venv env`

2. Activate it using:
`source env/bin/activate` or `env\Scripts\activate`

3. Navigate to `backend`

4. Install the requirements (one time instruction):
`pip install -r requirements.txt`

5. Run the migrations from the `backend/src` folder:
`python manage.py migrate`

6. Add `env` file in the `backend` folder containing:
YOUTUBE_API_KEY='OBTAIN KEY FROM YOUTUBE DATA API'
SPOTIFY_CLIENT_ID='OBTAIN CLIENT ID FROM SPOTIFY DEVELOPER DASHBOARD'
SPOTIFY_CLIENT_SECRET='OBTAIN CLIENT SECRET FROM SPOTIFY DEVELOPER DASHBOARD'

7. Run the server from the `backend/src` folder:
`python manage.py runserver` The server runs on http://127.0.0.1:8000/

8. Run the unit tests from `backend/src` with:
`python manage.py test`

- Alternatively, the server can run in a docker container with: `docker-compose up --build`

## Back-end file structure

```
.
├── .env
├── home
│   ├── __init__.py
│   ├── apps.py
│   ├── recommender.py
│   ├── test
│   │   ├── __init__.py
│   │   └── tests.py
│   ├── urls.py
│   └── views.py
├── manage.py
├── pickmeup
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── static
└── websocket
    ├── __init__.py
    ├── echo.py
    ├── routing.py
    └── test
        ├── __init__.py
        └── tests.py
```

The back-end server is implemented with the `Django` framework and follow the corresponding files structure. The `pickmeup` folder contains files related to the the server settings and configuration, while the `home` and `websocket` folders contain `Django` apps.

The `websocket` app was created to receive a live audio streams from the Discord app. However, due to changes in our user study design, there was no longer a need for the audio stream. Initially, this would have been used to apply ML on the steam data to recommend music based on identified emotions.

The `home` app hosts the code of your recommender in `recommender.py`, while `url.py` and `views.py` contain the code for the API endpoints and request handling.

Lastly, the `.env` file contains the `YOUTUBE_API_KEY`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` needed to query the Youtube and Spotify APIs in order to create a new playlist recommendation.
