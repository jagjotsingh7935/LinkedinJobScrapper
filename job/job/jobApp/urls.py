from django.urls import path
from .views import *

urlpatterns = [

    path('search/',JobSearchView.as_view(),name='job-search'),

    path('restrict/search/', JobRestrictSearchView.as_view(), name='job-restrict-search'),
    
    path('download/excel/', DownloadExcelView.as_view(), name='download-excel'),

    path('saved/job/search/', SavedJobSearchView.as_view(), name='saved-job-search'),

    path('dashboard/', DashboardView.as_view(), name='dashboard'),

    path('keyword/location/list/', KeywordLocationList.as_view(), name='keyword-location-list'),

    path('all/job/list/', AllJobList.as_view(), name='all-job-list'),

    path('saved/job/create/', WishlistSavedJobCreate.as_view(), name='saved-job-create'),

    path('saved/jobs/search/', WishlistSavedJobSearch.as_view(), name='saved-jobs-search'),


    path('google/profile/search/', GoogleLinkedInScraper.as_view(), name='profile-search'),

    path('google/profile/download/', DownloadProfilesExcelView.as_view(), name='profile-download'),



    path('job/scheduler/save/', SaveJobScheduler.as_view(), name='job-scheduler-save'),

    path('job/scheduler/show/', ShowJobScheduler.as_view(), name='job-scheduler-show'),

    path('job/scheduler/<int:pk>/update/', UpdateJobScheduler.as_view(), name='update-scheduler'),
    path('job/scheduler/<int:pk>/delete/', DeleteJobScheduler.as_view(), name='delete-scheduler'),

    path('export/applied/jobs/', ExportAppliedJobsView.as_view(), name='export-applied-jobs'),






]

