FROM node:22.6-alpine AS frontend-builder
WORKDIR /app/frontend

COPY Admin/package.json Admin/package-lock.json* ./
RUN npm ci

COPY Admin/ .

ARG GOOGLE_API_KEY

RUN echo "VITE_API_URL=http://localhost:8000" > .env && \
    echo "VITE_SOCKET_URL=http://localhost:8001" >> .env && \
    echo "VITE_GOOGLE_MAPS_API_KEY=$GOOGLE_API_KEY" >> .env

RUN npm run build

FROM python:3.12.6-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/Backend

COPY Backend/requirement.txt .
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirement.txt

COPY Backend/ .

WORKDIR /app
COPY --from=frontend-builder /app/frontend/dist ./Admin/dist

WORKDIR /app/Backend
EXPOSE 8000 8001
CMD ["python", "app.py"]