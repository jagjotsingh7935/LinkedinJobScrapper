# LinkedIn Job Scrapper & Portal

A full-stack application for searching, scraping, and managing LinkedIn job listings and candidate profiles.

## Architecture
- **Backend**: Django 5.1 REST Framework (`job/job`)
- **Frontend**: React 19 + Vite + Tailwind CSS + Material UI (`jobFrontend`)
- **Static File Serving**: WhiteNoise serves the bundled React production build directly through Django.
- **Deployment**: Configured for Render Web Service deployment.

---

## Deployment to Render

### Option 1: Manual Web Service Setup (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository: `https://github.com/jagjotsingh7935/LinkedinJobScrapper`.
3. Configure the following fields:
   - **Name**: `linkedin-job-scrapper`
   - **Runtime**: `Python 3`
   - **Region**: `Oregon (US West)` or preferred region
   - **Branch**: `main`
   - **Root Directory**: `job/job`
   - **Build Command**: `./build.sh` (or `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`)
   - **Start Command**: `gunicorn job.wsgi:application`
4. In the **Environment Variables** section, add:
   - `PYTHON_VERSION`: `3.12.8`
   - `DEBUG`: `False`
   - `SECRET_KEY`: `<generate or enter a random secret string>`
   - `EMAIL_HOST_USER`: `your_email@gmail.com`
   - `EMAIL_HOST_PASSWORD`: `your_app_password`
   - *(Optional)* `DATABASE_URL`: Your Render PostgreSQL database connection string (if using Render Postgres).
5. Click **Deploy Web Service**.

### Option 2: Render Blueprint (render.yaml)
1. Connect the repository as a **Blueprint** in Render.
2. Render will automatically read `render.yaml` and configure the service.
3. Supply `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` in the environment settings.

---

## Local Development

### 1. Backend Setup
```bash
cd job/job
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd jobFrontend
npm install
npm run dev
```

### 3. Build Frontend for Django
To update the frontend bundle served by Django:
```bash
cd jobFrontend
npm run build
# Copy the built dist into the backend folder:
# Windows PowerShell:
Copy-Item -Path "dist\*" -Destination "..\job\job\dist" -Recurse -Force
```
