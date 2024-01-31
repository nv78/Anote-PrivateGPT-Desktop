FROM python:3.8-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
# CMD flask start-background & flask start-event-background & flask run --host=0.0.0.0CMD flask start-background & flask start-event-background & flask run --host=0.0.0.0
CMD flask run --host=0.0.0.0