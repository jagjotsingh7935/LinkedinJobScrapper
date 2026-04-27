from django.apps import AppConfig


class JobappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'jobApp'


    def ready(self):
        # Ensure Celery Beat scheduler is initialized
        from django_celery_beat.models import PeriodicTask, CrontabSchedule
        from .tasks import create_periodic_task
        import jobApp.tasks  # Ensure tasks are discovered
        import jobApp.signals