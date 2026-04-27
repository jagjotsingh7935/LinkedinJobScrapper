from django.db import models
import json

class SearchQuery(models.Model):
    email = models.EmailField(max_length=254,null=True,blank=True)
    keywords = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    job_limit = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.keywords} in {self.location} ({self.job_limit} jobs)"

    class Meta:
        ordering = ['-created_at']


class JobScheduler(models.Model):
    email = models.EmailField(max_length=254, null=True, blank=True)
    keywords = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    job_limit = models.IntegerField()
    day = models.CharField(max_length=10)  # e.g., 'Monday', 'Tuesday', etc.
    time = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)  # Added missing field

    def __str__(self):
        return f"{self.keywords} in {self.location} ({self.job_limit} jobs)"

    class Meta:
        ordering = ['-created_at']

class Job(models.Model):
    search_query = models.ForeignKey(SearchQuery, on_delete=models.CASCADE, related_name='jobs')
    job_id = models.CharField(max_length=50)
    company = models.CharField(max_length=255, null=True, blank=True)
    company_url = models.URLField(null=True, blank=True)
    job_title = models.CharField(max_length=255, null=True, blank=True)
    job_url = models.URLField(null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    posted_date = models.CharField(max_length=100, null=True, blank=True)
    job_description = models.TextField(null=True, blank=True)
    applicant_count = models.CharField(max_length=100, null=True, blank=True)
    level = models.CharField(max_length=100, null=True, blank=True)
    employment_type = models.CharField(max_length=100, null=True, blank=True)
    job_function = models.CharField(max_length=255, null=True, blank=True)
    industry = models.CharField(max_length=255, null=True, blank=True)
    salary = models.CharField(max_length=100, null=True, blank=True)
    skills = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.job_title} at {self.company} ({self.location})"

    def get_skills(self):
        return json.loads(self.skills) if self.skills else []

    def set_skills(self, skills_list):
        self.skills = json.dumps(skills_list)

    class Meta:
        ordering = ['-created_at']


class SavedJobs(models.Model):
    job = models.ForeignKey(Job,on_delete=models.CASCADE,related_name='jobs_saved')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']





class LinkedInProfile(models.Model):
    title = models.CharField(max_length=255, blank=True, null=True)       # Profile title
    url = models.URLField(unique=True)                                    # LinkedIn profile URL
    description = models.TextField(blank=True, null=True)                 # Snippet / About
    created_at = models.DateTimeField(auto_now_add=True)                  # Timestamp

    def __str__(self):
        return self.title or self.url

