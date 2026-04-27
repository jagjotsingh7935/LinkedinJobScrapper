from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'job.settings')

app = Celery('job')

# Optional: Disable UTC and set your timezone
app.conf.enable_utc = False
app.conf.update(timezone='Asia/Kolkata')

# Load task modules from all registered Django app configs.
app.config_from_object(settings, namespace='CELERY')

# Autodiscover tasks from all installed apps
app.autodiscover_tasks()