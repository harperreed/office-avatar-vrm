# Use the official Python image from Docker Hub
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the code into the container
COPY . .

# Set the command to run your app
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000", "--log-level", "info"]

