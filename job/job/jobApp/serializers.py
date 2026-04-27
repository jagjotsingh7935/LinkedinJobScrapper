from rest_framework import serializers
from .models import *

class JobSerializer(serializers.ModelSerializer):
    skills = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'job_id', 'company', 'company_url', 'job_title', 'job_url',
            'location', 'posted_date', 'job_description', 'applicant_count',
            'level', 'employment_type', 'job_function', 'industry', 'salary', 'skills'
        ]

    def get_skills(self, obj):
        return obj.get_skills()
    



class SavedJobsSerializer(serializers.ModelSerializer):
    job = JobSerializer()

    class Meta:
        model = SavedJobs
        fields = ['id', 'job', 'created_at', 'updated_at']





class LinkedInProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LinkedInProfile
        fields = "__all__"
