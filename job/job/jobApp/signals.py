from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import JobScheduler
from .tasks import create_periodic_task
from django_celery_beat.models import PeriodicTask


import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=JobScheduler)
def schedule_periodic_task(sender, instance, created, **kwargs):
    """
    Signal to create or update the periodic task when a JobScheduler is saved.
    """
    try:
        if created:
            create_periodic_task.delay(instance.id)
        else:
            # For updates, delete old periodic task and create a new one
            task_name = f"job_search_{instance.id}_{instance.keywords}_{instance.location}"
            PeriodicTask.objects.filter(name=task_name).delete()
            create_periodic_task.delay(instance.id)
    except Exception as e:
        logger.warning(f"Could not enqueue Celery periodic task for JobScheduler {instance.id} (Redis broker may be offline): {e}")