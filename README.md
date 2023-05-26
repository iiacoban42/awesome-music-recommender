# pick-me-up

[![Django CI](https://github.com/iiacoban42/DelfiTLM/actions/workflows/django.yml/badge.svg?branch=main)](https://github.com/iiacoban42/DelfiTLM/actions/workflows/django.yml)

## Requirements

- python3
- Docker and docker-compose (optional)
## Setup Django server

1. Create a python environment (one time instruction):
`python3 -m venv env`

2. Activate it using:
`source env/bin/activate`

3. Install the requirements (one time instruction):
`pip install -r requirements.txt`

4. Run the migrations from the `backend/src` folder:
`python manage.py migrate`

5. Run the server from the `backend/src` folder:
`python manage.py runserver` The server runs on http://127.0.0.1:8000/

6. Run the unit tests from `backend/src` with:
`python manage.py test`

- Alternatively, the server can run in a docker container with: `docker-compose up --build`