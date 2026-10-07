import os
import random
import time
import uuid
import threading
from django.core.mail import EmailMessage
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import pandas as pd
import json
import re
import requests
import pycountry
from bs4 import BeautifulSoup
import math
from urllib.parse import quote
from .models import *
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q

from collections import Counter
from datetime import datetime, timedelta
from django.db.models import Count
from rest_framework import generics,filters
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as filters
from .serializers import *
from rest_framework.pagination import LimitOffsetPagination
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable
from jobApp.linkedin_export import export_linkedin_applied_jobs

from .tasks import process_job_search

class JobListPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    
    def get_page_size(self, request):
        page_size = request.query_params.get('page_size')
        return int(page_size) if page_size else self.page_size

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'num_pages': self.page.paginator.num_pages,
            'page_size': self.page_size,
            'results': data
        })


# def create_linkedin_url(keywords, location):
#     """Create LinkedIn search URL with encoded parameters."""
#     encoded_keywords = quote(keywords)
#     encoded_location = quote(location)
#     return f'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={encoded_keywords}&location={encoded_location}&f_TPR=r86400&start={{}}'  # Shows jobs from last 24 hours


# def create_linkedin_url(keywords, location):
#     """Create LinkedIn search URL with encoded parameters, including a 31-mile (approximately 50 km) radius around the specified location."""
#     encoded_keywords = quote(keywords)
#     encoded_location = quote(location)
#     return f'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={encoded_keywords}&location={encoded_location}&f_TPR=r1296000&distance=40&start={{}}'  # Shows jobs from last 24 hours within ~50 km radius

def create_linkedin_url(keywords, location):
    """Create LinkedIn search URL with encoded parameters for IT Manager jobs, including a 31-mile (approximately 50 km) radius, jobs from the last 15 days, and IT industry focus."""
    from urllib.parse import quote
    encoded_keywords = quote(keywords)  # Use unquoted keywords for flexibility
    encoded_location = quote(location)
    # Include Manager/Senior/Director titles, Mid-Senior/Director levels, IT job function, and IT industry
    return f'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={encoded_keywords}&location={encoded_location}&f_TPR=r1728000&distance=45&f_JT=M%2CS%2CD&f_E=4%2C5&f_F=it&f_I=4&start={{}}'


def get_job_ids(base_url, headers, job_limit=100):
    """Collect job IDs from search results, fetching extra to meet job_limit after filtering."""
    job_ids = []
    page = 0
    max_pages = 50  # Safety limit to prevent infinite loops
    target_ids = job_limit * 2  # Fetch up to 2x job_limit to account for filtering

    while len(job_ids) < target_ids and page < max_pages:
        try:

            time.sleep(random.uniform(1, 3))
            
            res = requests.get(base_url.format(page * 25), headers=headers)
            res.raise_for_status()  # Raise exception for bad status codes
            soup = BeautifulSoup(res.text, 'html.parser')
            jobs_on_page = soup.find_all("li")
            
            if not jobs_on_page:
                print(f"No more jobs found on page {page+1}")
                break
                
            print(f"Found {len(jobs_on_page)} jobs on page {page+1}")
            
            for job in jobs_on_page:
                if len(job_ids) >= target_ids:
                    break
                    
                try:
                    base_card = job.find("div", {"class": "base-card"})
                    if base_card and base_card.get('data-entity-urn'):
                        jobid = base_card.get('data-entity-urn').split(":")[3]
                        job_ids.append(jobid)
                except Exception as e:
                    print(f"Error processing job: {e}")
                    continue
            
            page += 1
            
        except Exception as e:
            print(f"Error fetching page {page+1}: {e}")
            break
            
    return job_ids[:target_ids]



def is_location_match(job_location, search_location):
    """Check if job location matches the search location with flexible global matching using pycountry."""
    job_location_lower = job_location.lower().strip()
    search_location_lower = search_location.lower().strip()
    
    # Direct partial match (handles cities, exact matches, etc.)
    search_terms = set(search_location_lower.split())
    if any(term in job_location_lower for term in search_terms):
        return True
    
    # Try to treat search_location as a country and check for country or subdivision matches
    try:
        search_country = pycountry.countries.lookup(search_location_lower)
        
        # Check if country name, alpha_2, or alpha_3 appears in job_location
        country_indicators = [search_country.name.lower(), search_country.alpha_2.lower(), search_country.alpha_3.lower()]
        if any(indicator in job_location_lower for indicator in country_indicators):
            return True
        
        # Check subdivisions (states/provinces) for the country
        subdivisions = pycountry.subdivisions.get(country_code=search_country.alpha_2)
        for sub in subdivisions:
            sub_indicators = [sub.name.lower(), sub.code.lower().split('-')[-1]]  # e.g., 'ca' for US-CA
            if any(ind in job_location_lower for ind in sub_indicators):
                return True
    
    except LookupError:
        # If not a country, skip to next checks
        pass
    
    # Fallback: Check if search_location could be a subdivision (state/province) in any country
    for country in pycountry.countries:
        subdivisions = pycountry.subdivisions.get(country_code=country.alpha_2)
        for sub in subdivisions:
            if search_location_lower in sub.name.lower() or search_location_lower in sub.code.lower():
                # If matched, check if the subdivision's country or sub itself is in job_location
                if sub.name.lower() in job_location_lower or country.name.lower() in job_location_lower:
                    return True
    
    return False


def get_job_details(job_id, headers):
    """Extract all available details for a single job posting."""
    job_url = f'https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}'
    job_data = {
        'company': None,
        'company_url': None,
        'job_title': None,
        'job_url': None,
        'location': None,
        'posted_date': None,
        'job_description': None,
        'applicant_count': None,
        'level': None,
        'employment_type': None,
        'job_function': None,
        'salary': None,
        'skills': []  # New field for skills
    }
    
    try:

        time.sleep(random.uniform(0.5, 1.5))

        resp = requests.get(job_url, headers=headers)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Company name and URL
        company_card = soup.find("div", {"class": "top-card-layout__card"})
        if company_card:
            company_link = company_card.find("a")
            if company_link:
                if company_link.find("img"):
                    job_data["company"] = company_link.find("img").get("alt", "").strip()
                job_data["company_url"] = company_link.get("href", "").strip()

        # Job title and URL
        title_section = soup.find("div", {"class": "top-card-layout__entity-info"})
        if title_section:
            title_link = title_section.find("a")
            if title_link:
                job_data["job_title"] = title_link.text.strip()
                job_data["job_url"] = title_link.get("href", "").strip()

        # Location
        location_elem = soup.find("span", {"class": "topcard__flavor--bullet"})
        if location_elem:
            job_data["location"] = location_elem.text.strip()

        # Posted date
        posted_elem = soup.find("span", {"class": "posted-time-ago__text"})
        if posted_elem:
            job_data["posted_date"] = posted_elem.text.strip()

        # Job description
        desc_elem = soup.find("div", {"class": "show-more-less-html__markup"})
        if desc_elem:
            job_data["job_description"] = desc_elem.text.strip()

        # Applicant count
        applicant_elem = soup.find("span", {"class": "num-applicants__caption"})
        if applicant_elem:
            job_data["applicant_count"] = applicant_elem.text.strip()

        # Job criteria (level, type, industry, function)
        criteria_list = soup.find("ul", {"class": "description__job-criteria-list"})
        if criteria_list:
            criteria_items = criteria_list.find_all("li")
            for item in criteria_items:
                header = item.find("h3")
                value = item.find("span")
                if header and value:
                    header_text = header.text.strip().lower()
                    if "seniority" in header_text:
                        job_data["level"] = value.text.strip()
                    elif "employment type" in header_text:
                        job_data["employment_type"] = value.text.strip()
                    elif "industry" in header_text:
                        job_data["industry"] = value.text.strip()
                    elif "job function" in header_text:
                        job_data["job_function"] = value.text.strip()

        # Salary
        salary_elem = soup.find("span", {"class": "compensation__salary"})
        if salary_elem:
            job_data["salary"] = salary_elem.text.strip()
        elif job_data.get("job_description"):
            description_text = job_data["job_description"].lower()
            salary_pattern = r'\$[\d,]+(?:\.\d+)?(?:\s*-\s*\$[\d,]+(?:\.\d+)?)?(?:\s*(?:per year|annually|yearly))?'
            match = re.search(salary_pattern, description_text)
            if match:
                job_data["salary"] = match.group(0)

        # Skills
        skills_section = soup.find("section", {"class": "skills-section"})
        if skills_section:
            print(f"Found skills section for job ID {job_id}")
            skills_items = skills_section.find_all("li", {"class": "job-details-skill-match-status-list__skill"})
            for skill_item in skills_items:
                skill_name = skill_item.find("span", {"class": "job-details-skill-match-status-list__skill-name"})
                if skill_name:
                    job_data["skills"].append(skill_name.text.strip())
        else:
            print(f"No skills section found for job ID {job_id}. Checking job description for skills.")
            # Fallback: Try to extract skills from the job description
            if job_data.get("job_description"):
                description_text = job_data["job_description"].lower()
                # Example: Look for common skill keywords in the description
                common_skills = [
                    # Programming Languages
                    "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "php", 
                    "go", "rust", "scala", "r", "matlab", "perl", "swift", "kotlin", "dart",
                    "sql", "nosql", "bash", "powershell", "vba", "groovy",
                    # Web Development
                    "html", "css", "react", "angular", "vue", "node.js", "django", "flask", 
                    "spring", "asp.net", "express.js", "jquery", "bootstrap", "tailwind", 
                    "graphql", "rest api", "soap", "ajax", "webpack", "babel", "svelte",
                    # Data Science & Analytics
                    "machine learning", "data analysis", "data science", "deep learning", 
                    "artificial intelligence", "nlp", "computer vision", "pandas", "numpy", 
                    "scikit-learn", "tensorflow", "pytorch", "keras", "statsmodels", 
                    "tableau", "power bi", "excel", "spss", "sas", "d3.js", "matplotlib", 
                    "seaborn", "statistical analysis", "data visualization", "big data", 
                    "hadoop", "spark", "hive", "pig", "qlikview",
                    # Cloud & DevOps
                    "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "ansible", 
                    "terraform", "cloud computing", "ci/cd", "devops", "git", "github", 
                    "gitlab", "bitbucket", "prometheus", "grafana", "elasticsearch", 
                    "logstash", "kibana", "openshift", "cloudformation",
                    # Databases
                    "mysql", "postgresql", "mongodb", "redis", "oracle", "sql server", 
                    "cassandra", "dynamodb", "sqlite", "mariadb", "neo4j",
                    # IT Management & Operations
                    "it strategy", "it governance", "budget management", "vendor management", 
                    "it infrastructure", "cybersecurity", "network administration", "itil", 
                    "service desk", "incident management", "change management", "risk management", 
                    "disaster recovery", "business continuity", "stakeholder management", 
                    "it procurement", "system administration", "erp systems", "crm systems", 
                    "it compliance", "data center management", "cloud migration", "it operations", 
                    "technical support", "team management", "strategic planning", "service management",
                    # Cybersecurity
                    "penetration testing", "ethical hacking", "firewall", "siem", "soc", 
                    "intrusion detection", "vulnerability assessment", "cryptography", 
                    "network security", "endpoint security", "incident response", "malware analysis",
                    # Software Engineering & Methodologies
                    "agile", "scrum", "kanban", "waterfall", "software engineering", 
                    "test-driven development", "behavior-driven development", "unit testing", 
                    "integration testing", "microservices", "monolithic architecture", 
                    "design patterns", "software architecture", "code review",
                    # Mobile Development
                    "ios", "android", "flutter", "react native", "xamarin", "ionic", 
                    "mobile development", "swiftui", "jetpack compose",
                    # Networking & Systems
                    "linux", "windows server", "unix", "tcp/ip", "dns", "dhcp", "vpn", 
                    "load balancing", "active directory", "vmware", "hyper-v", "cisco", 
                    "routing", "switching", "network engineering",
                    # Business & Soft Skills
                    "project management", "communication", "team leadership", "problem solving", 
                    "time management", "decision making", "negotiation", "conflict resolution", 
                    "customer service", "business analysis", "requirements gathering", 
                    "stakeholder engagement", "process improvement", "change leadership", 
                    "mentoring", "coaching", "public speaking", "presentation skills",
                    # Domain-Specific Tools
                    "sap", "salesforce", "dynamics 365", "servicenow", "jira", "confluence", 
                    "trello", "asana", "slack", "microsoft teams", "zoom", "sharepoint",
                    # Emerging Technologies
                    "blockchain", "iot", "augmented reality", "virtual reality", "quantum computing", 
                    "edge computing", "serverless", "robotics", "5g",
                    # Other Relevant Skills
                    "ui/ux design", "product management", "quality assurance", "technical writing", 
                    "api development", "database administration", "systems analysis", 
                    "business intelligence", "data engineering", "etl", "data warehousing"
                ]
                # Look for skills in description
                found_skills = []
                for skill in common_skills:
                    # Use regex to match whole words only, case-insensitive
                    pattern = r'\b' + re.escape(skill) + r'\b'
                    if re.search(pattern, description_text, re.IGNORECASE):
                        found_skills.append(skill)
                # Additional pattern matching for skills (e.g., "proficient in X", "experience with Y")
                skill_patterns = [
                    r'proficient in (\w+)', r'experience with (\w+)', r'expertise in (\w+)',
                    r'knowledge of (\w+)', r'skilled in (\w+)', r'familiar with (\w+)'
                ]
                for pattern in skill_patterns:
                    matches = re.findall(pattern, description_text, re.IGNORECASE)
                    for match in matches:
                        # Check if match is a whole word in common_skills
                        match_lower = match.lower()
                        if match_lower in common_skills and match_lower not in found_skills:
                            found_skills.append(match_lower)
                # Remove duplicates and ensure proper capitalization
                job_data["skills"] = list(set([skill.title() for skill in found_skills]))

    except Exception as e:
        print(f"Error processing job ID {job_id}: {e}")
        return None

    return job_data



def send_job_results_email(jobs_data, email, keywords, location):
    """Generate Excel with native hyperlinks and send to email in a background thread."""
    if not jobs_data or not email:
        return

    def _worker():
        try:
            # Flatten skills for Excel
            formatted_jobs = []
            for job in jobs_data:
                job_copy = dict(job)
                if 'skills' in job_copy and isinstance(job_copy['skills'], list):
                    job_copy['skills'] = ', '.join(job_copy['skills'])
                formatted_jobs.append(job_copy)

            columns = [
                'company', 'job_title', 'posted_date', 'applicant_count', 'salary',
                'level', 'location', 'company_url', 'skills', 'job_url',
                'job_description', 'employment_type', 'job_function'
            ]

            df = pd.DataFrame(formatted_jobs)
            df = df[[col for col in columns if col in df.columns]]

            filename = f"jobs_data_{uuid.uuid4().hex}.xlsx"
            filepath = os.path.join(settings.MEDIA_ROOT, filename)
            os.makedirs(settings.MEDIA_ROOT, exist_ok=True)

            from openpyxl import Workbook
            from openpyxl.styles import Font

            wb = Workbook()
            ws = wb.active
            ws.title = "Job Search Results"

            for col_num, header in enumerate(df.columns, start=1):
                cell = ws.cell(row=1, column=col_num, value=header)
                cell.font = Font(bold=True)

            for row_num, row in enumerate(df.itertuples(index=False), start=2):
                for col_num, value in enumerate(row, start=1):
                    col_name = df.columns[col_num - 1]
                    cell = ws.cell(row=row_num, column=col_num)

                    if col_name == 'company_url' and value and value != 'N/A':
                        cell.hyperlink = str(value).strip()
                        cell.value = "Company Site"
                        cell.style = "Hyperlink"
                    elif col_name == 'job_url' and value and value != 'N/A':
                        cell.hyperlink = str(value).strip()
                        cell.value = "View Job"
                        cell.style = "Hyperlink"
                    else:
                        cell.value = value

            wb.save(filepath)

            # Send email
            from_email = getattr(settings, 'EMAIL_HOST_USER', None) or 'swapsolutions3@gmail.com'
            email_subject = f"LinkedIn Job Search Results: {keywords} in {location}"
            email_body = (
                f"Hello,\n\n"
                f"Please find attached your LinkedIn job search report for '{keywords}' in '{location}'.\n"
                f"Total matching jobs found: {len(jobs_data)}.\n\n"
                f"Best regards,\n"
                f"LinkedIn Scraper Pro"
            )

            email_message = EmailMessage(
                subject=email_subject,
                body=email_body,
                from_email=from_email,
                to=[email]
            )
            with open(filepath, 'rb') as f:
                email_message.attach(filename, f.read(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            email_message.send()
            print(f"Successfully sent Excel report to {email}")
        except Exception as e:
            print(f"Failed to send email with Excel attachment to {email}: {e}")

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()



class JobSearchView(APIView):
    def post(self, request):
        keywords = request.data.get('keywords', '').strip()
        location = request.data.get('location', '').strip()
        email = request.data.get('email', '').strip()
        job_limit = int(request.data.get('job_limit', 100))
        
        if not keywords or not location:
            return Response(
                {"error": "Both keywords and location are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if job_limit < 1 or job_limit > 3000:
            return Response(
                {"error": "Job limit must be between 1 and 3000"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",  # Updated to a recent Chrome UA
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Connection": "keep-alive",
            "Referer": "https://www.linkedin.com/",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0"
        }

        search_query = SearchQuery.objects.create(
            keywords=keywords,
            location=location,
            job_limit=job_limit,
            email=email if email else None
        )
        
        base_url = create_linkedin_url(keywords, location)
        jobs_data = []
        processed_count = 0
        page = 0
        filtered_out_location = 0
        seen_job_ids = set()  # Track processed job IDs
        start_scrape_time = time.time()
        max_duration_seconds = 24  # Stay well within server/proxy timeouts

        try:
            while len(jobs_data) < job_limit and (time.time() - start_scrape_time) < max_duration_seconds:
                job_ids = get_job_ids(base_url.replace('start={}', f'start={page * 25}'), headers, job_limit - len(jobs_data))
                if not job_ids:
                    print("No more job IDs available")
                    break
                    
                for job_id in job_ids:
                    if len(jobs_data) >= job_limit or (time.time() - start_scrape_time) >= max_duration_seconds:
                        break

                    # Skip if already processed this job ID
                    if job_id in seen_job_ids:
                        continue
                    seen_job_ids.add(job_id)
                    
                    print(f"\rProcessing job {processed_count+1}", end="")
                    job_data = get_job_details(job_id, headers)
                    processed_count += 1
                    
                    if job_data and job_data.get('job_title') and job_data.get('location'):
                        # Check if location matches (using flexible matching with pycountry)
                        location_matches = is_location_match(job_data['location'], location)
                        
                        if location_matches:
                            job = Job.objects.create(
                                search_query=search_query,
                                job_id=job_id,
                                company=job_data['company'],
                                company_url=job_data['company_url'],
                                job_title=job_data['job_title'],
                                job_url=job_data['job_url'],
                                location=job_data['location'],
                                posted_date=job_data['posted_date'],
                                job_description=job_data['job_description'],
                                applicant_count=job_data['applicant_count'],
                                level=job_data['level'],
                                employment_type=job_data['employment_type'],
                                job_function=job_data['job_function'],
                                industry=job_data.get('industry'),
                                salary=job_data['salary'],
                                skills=json.dumps(job_data['skills'])
                            )
                            jobs_data.append({
                                'id': job.id,
                                'job_id': job_id,
                                **job_data
                            })
                        else:
                            filtered_out_location += 1

                page += 1  # Increment page for next batch
        except Exception as loop_err:
            print(f"Error during job search scraping loop: {loop_err}")

        print()  # Newline after progress
        print(f"Filtered out {filtered_out_location} jobs due to location mismatch")
        
        if not jobs_data:
            return Response({
                "message": f"No jobs found for {keywords} in {location}",
                "jobs": []
            })

        # Send Excel spreadsheet to email in background thread
        if email:
            send_job_results_email(jobs_data, email, keywords, location)

        return Response({
            "message": f"Found {len(jobs_data)} matching jobs" + (f". An Excel report is also being emailed to {email}." if email else ""),
            "jobs": jobs_data
        })



class JobRestrictSearchView(APIView):
    def post(self, request):

        keywords = request.data.get('keywords', '').strip()
        location = request.data.get('location', '').strip()
        email = request.data.get('email', '').strip()
        job_limit = int(request.data.get('job_limit', 100))
        
        if not keywords or not location:
            return Response(
                {"error": "Both keywords and location are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if job_limit < 1 or job_limit > 3000:
            return Response(
                {"error": "Job limit must be between 1 and 3000"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Connection": "keep-alive",
            "Referer": "https://www.linkedin.com/",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0"
        }

        search_query = SearchQuery.objects.create(
            keywords=keywords,
            location=location,
            job_limit=job_limit
        )
        
        base_url = create_linkedin_url(keywords, location)
        jobs_data = []
        processed_count = 0
        filtered_out_title = 0
        filtered_out_location = 0
        
        # Fetch a single batch of job IDs (up to 2x job_limit)
        job_ids = get_job_ids(base_url, headers, job_limit)
        if not job_ids:
            print("No job IDs found")
            return Response({
                "message": f"No jobs found for {keywords} in {location}",
                "jobs": []
            })
                
        start_scrape_time = time.time()
        max_duration_seconds = 24

        try:
            for job_id in job_ids:
                if len(jobs_data) >= job_limit or (time.time() - start_scrape_time) >= max_duration_seconds:
                    break
                print(f"\rProcessing job {processed_count+1}", end="")
                job_data = get_job_details(job_id, headers)
                processed_count += 1
                
                if job_data and job_data.get('job_title') and job_data.get('location'):
                    # Split keywords into words for strict matching
                    keyword_terms = set(keywords.lower().split())
                    
                    job_title_lower = job_data['job_title'].lower()
                    
                    # Check if ALL keyword terms are present in the job title (exact word match)
                    title_matches = all(
                        re.search(rf'\b{re.escape(term)}\b', job_title_lower) 
                        for term in keyword_terms
                    )
                    
                    # Check if location matches (using flexible matching with pycountry)
                    location_matches = is_location_match(job_data['location'], location)
                    
                    if title_matches and location_matches:
                        job = Job.objects.create(
                            search_query=search_query,
                            job_id=job_id,
                            company=job_data['company'],
                            company_url=job_data['company_url'],
                            job_title=job_data['job_title'],
                            job_url=job_data['job_url'],
                            location=job_data['location'],
                            posted_date=job_data['posted_date'],
                            job_description=job_data['job_description'],
                            applicant_count=job_data['applicant_count'],
                            level=job_data['level'],
                            employment_type=job_data['employment_type'],
                            job_function=job_data['job_function'],
                            industry=job_data.get('industry'),
                            salary=job_data['salary'],
                            skills=json.dumps(job_data['skills'])
                        )
                        jobs_data.append({
                            'id': job.id,
                            'job_id': job_id,
                            **job_data
                        })
                    else:
                        if not title_matches:
                            filtered_out_title += 1
                        if not location_matches:
                            filtered_out_location += 1
        except Exception as loop_err:
            print(f"Error during restricted job search scraping: {loop_err}")

        print()  # Newline after progress
        print(f"Filtered out {filtered_out_title} jobs due to title mismatch")
        print(f"Filtered out {filtered_out_location} jobs due to location mismatch")
        
        if not jobs_data:
            return Response({
                "message": f"No jobs found for {keywords} in {location}",
                "jobs": []
            })

        # Send Excel spreadsheet to email in background thread
        if email and jobs_data:
            send_job_results_email(jobs_data, email, keywords, location)

        return Response({
            "message": f"Found {len(jobs_data)} matching jobs" + (f". An Excel report is also being emailed to {email}." if email else ""),
            "jobs": jobs_data
        })


class DownloadExcelView(APIView):
    def post(self, request):
        jobs_data = request.data
        if not jobs_data or not isinstance(jobs_data, list):
            return Response(
                {"error": "Invalid data format"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Flatten skills list for Excel compatibility
        for job in jobs_data:
            if 'skills' in job and isinstance(job['skills'], list):
                job['skills'] = ', '.join(job['skills'])
        
        df = pd.DataFrame(jobs_data)
        
        # Generate unique filename
        filename = f"jobs_data_{uuid.uuid4().hex}.xlsx"
        filepath = os.path.join(settings.MEDIA_ROOT, filename)
        
        # Create MEDIA_ROOT directory if it doesn't exist
        os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
        
        # Save Excel file with error handling
        try:
            df.to_excel(filepath, index=False, engine='openpyxl')
            if not os.path.exists(filepath):
                raise OSError("Excel file was not created successfully.")
        except Exception as e:
            return Response(
                {"error": f"Failed to save Excel file: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Generate absolute URL
        absolute_url = request.build_absolute_uri(
            os.path.join(settings.MEDIA_URL, filename)
        )
        
        return Response({
            "message": "Excel file generated",
            "download_url": absolute_url
        })

        
class SavedJobSearchView(APIView):
    pagination_class = JobListPagination

    def post(self, request):
        keywords = request.data.get('keywords', '').strip()
        location = request.data.get('location', '').strip()
        
        if not keywords and not location:
            return Response(
                {"error": "Both keywords and location are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        jobs = Job.objects.filter(
            Q(job_title__icontains=keywords) &
            Q(location__icontains=location)
        ).select_related('search_query')
        
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(jobs, request)
        
        jobs_data = [
            {
                'id': job.id,
                'job_id': job.job_id,
                'company': job.company,
                'company_url': job.company_url,
                'job_title': job.job_title,
                'job_url': job.job_url,
                'location': job.location,
                'posted_date': job.posted_date,
                'job_description': job.job_description,
                'applicant_count': job.applicant_count,
                'level': job.level,
                'employment_type': job.employment_type,
                'job_function': job.job_function,
                'industry': job.industry,
                'salary': job.salary,
                'skills': job.get_skills(),
                'search_query': {
                    'keywords': job.search_query.keywords,
                    'location': job.search_query.location,
                    'job_limit': job.search_query.job_limit,
                    'created_at': job.search_query.created_at
                }
            }
            for job in page
        ]
        
        return paginator.get_paginated_response(jobs_data)



class KeywordLocationList(APIView):
    def get(self,request):

        jobs = Job.objects.all()

        data = []

        for job in jobs:

            data.append({
                'search_query_id': job.search_query.id,
                'search_query_keyword':job.search_query.keywords,
                'search_query_location':job.search_query.location
            })

        return Response(data,status=status.HTTP_200_OK)


##Frontend the component bnana with tab 

class AllJobList(APIView):
    pagination_class = JobListPagination

    def get(self,request):
        job = Job.objects.all()

        job_data = []

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(job, request)

        

        for jobs in page:
            job_data.append({
                'Search Query':[
                    {
                        'search_query_id':jobs.search_query.id,
                        'search_query_keyword':jobs.search_query.keywords,
                        'search_query_location':jobs.search_query.location,
                        'search_query_job_limit':jobs.search_query.job_limit,
                        'search_query_created_at':jobs.search_query.created_at
                    }
                ],
                'job_id':jobs.id,
                'company':jobs.company,
                'company_url':jobs.company_url,
                'job_title':jobs.job_title,
                'job_url':jobs.job_url,
                'location':jobs.location,
                'posted_date':jobs.posted_date,
                'job_description':jobs.job_description,
                'applicant_count':jobs.applicant_count,
                'level':jobs.level,
                'employment_type':jobs.employment_type,
                'job_function':jobs.job_function,
                'industry':jobs.industry,
                'salary':jobs.salary,
                'skills':jobs.get_skills()
            })

        return paginator.get_paginated_response(job_data)





class DashboardView(APIView):
    def get(self, request):
        # Total number of searches
        total_searches = SearchQuery.objects.count()

        # Total number of jobs fetched
        total_jobs = Job.objects.count()

        # Recent searches (last 7 days)
        recent_searches = SearchQuery.objects.filter(
            created_at__gte=datetime.now() - timedelta(days=7)
        ).order_by('-created_at')[:5]

        # Most common keywords
        keyword_counts = Counter()
        for query in SearchQuery.objects.all():
            keywords = query.keywords.lower().split()
            keyword_counts.update(keywords)
        top_keywords = [
            {'keyword': keyword, 'count': count}
            for keyword, count in keyword_counts.most_common(5)
        ]

        # Job distribution by location
        location_counts = Job.objects.values('location').annotate(
            count=Count('id')
        ).order_by('-count')[:5]

        # Jobs by employment type
        employment_type_counts = Job.objects.values('employment_type').annotate(
            count=Count('id')
        ).order_by('-count')

        # Most common industries
        industry_counts = Job.objects.values('industry').annotate(
            count=Count('id')
        ).order_by('-count')[:5]

        # Average jobs per search
        avg_jobs_per_search = total_jobs / total_searches if total_searches > 0 else 0

        # Recent jobs (last 7 days)
        recent_jobs = Job.objects.filter(
            search_query__created_at__gte=datetime.now() - timedelta(days=7)
        ).order_by('-search_query__created_at')[:5]

        dashboard_data = {
            'total_searches': total_searches,
            'total_jobs': total_jobs,
            'average_jobs_per_search': round(avg_jobs_per_search, 2),
            'recent_searches': [
                {
                    'id': query.id,
                    'keywords': query.keywords,
                    'location': query.location,
                    'job_limit': query.job_limit,
                    'created_at': query.created_at,
                    'job_count': query.jobs.count()
                }
                for query in recent_searches
            ],
            'top_keywords': top_keywords,
            'location_distribution': [
                {
                    'location': item['location'],
                    'count': item['count']
                }
                for item in location_counts
            ],
            'employment_type_distribution': [
                {
                    'employment_type': item['employment_type'],
                    'count': item['count']
                }
                for item in employment_type_counts
            ],
            'industry_distribution': [
                {
                    'industry': item['industry'],
                    'count': item['count']
                }
                for item in industry_counts
            ],
            'recent_jobs': [
                {
                    'id': job.id,
                    'job_title': job.job_title,
                    'company': job.company,
                    'location': job.location,
                    'posted_date': job.posted_date,
                    'search_query': {
                        'keywords': job.search_query.keywords,
                        'location': job.search_query.location
                    }
                }
                for job in recent_jobs
            ]
        }

        return Response({
            'message': 'Dashboard data retrieved successfully',
            'data': dashboard_data
        }, status=status.HTTP_200_OK)



class WishlistSavedJobCreate(APIView):
    def post(self,request):
        job_id = request.data.get('job_id')

        job_object = Job.objects.get(id=job_id)

        job_create = SavedJobs.objects.create(
            job = job_object
        )

        response_data = {
            "Job_saved_data": {
                "id": job_create.id,
                "job": {
                    "id": job_object.id,
                    "title": job_object.job_title,  
                }
            }
        }
        return Response(response_data,status=status.HTTP_201_CREATED)
    




class SavedJobsFilter(filters.FilterSet):
    job_title = filters.CharFilter(field_name='job__job_title', lookup_expr='icontains')
    company = filters.CharFilter(field_name='job__company', lookup_expr='icontains')
    location = filters.CharFilter(field_name='job__location', lookup_expr='icontains')
    employment_type = filters.CharFilter(field_name='job__employment_type', lookup_expr='iexact')
    industry = filters.CharFilter(field_name='job__industry', lookup_expr='icontains')

    class Meta:
        model = SavedJobs
        fields = ['job_title', 'company', 'location', 'employment_type', 'industry']


class WishlistSavedJobSearch(generics.ListAPIView):
    queryset = SavedJobs.objects.all()
    serializer_class = SavedJobsSerializer
    pagination_class = JobListPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = SavedJobsFilter
    search_fields = ['job__job_title', 'job__company', 'job__location', 'job__industry']

    def get_queryset(self):
        queryset = super().get_queryset()
        # Optional: Filter by authenticated user if SavedJobs is user-specific
        # if self.request.user.is_authenticated:
        #     queryset = queryset.filter(user=self.request.user)
        return queryset

# class GoogleLinkedInScraper(APIView):
#     pagination_class = LimitOffsetPagination

#     def get(self, request):
#         search_term = request.query_params.get("search_term")
#         if not search_term:
#             return Response(
#                 {"error": "search_term is required"},
#                 status=status.HTTP_400_BAD_REQUEST,
#             )

#         API_KEY = "AIzaSyCQSq1B_JNkzNzPMQyAtXzTAdxh_xUNCIM"  # Replace with your key
#         CX = "35ba1d3284f9b4c84"

#         # max_pages handling
#         max_pages = request.query_params.get("max_pages", 10)
#         try:
#             max_pages = int(max_pages)
#             max_pages = max(1, min(max_pages, 10))  # clamp between 1 and 10
#         except ValueError:
#             max_pages = 10

#         per_page = 10
#         results = []

#         try:
#             for page in range(max_pages):
#                 start_index = page * per_page + 1
#                 url = (
#                     f"https://www.googleapis.com/customsearch/v1?"
#                     f"q=site:linkedin.com/in {search_term}"
#                     f"&key={API_KEY}&cx={CX}&start={start_index}&num={per_page}"
#                 )
#                 response = requests.get(url)
#                 response.raise_for_status()
#                 data = response.json()

#                 if "items" not in data:
#                     break

#                 for item in data["items"]:
#                     link = item.get("link")
#                     # start with google values (may be truncated)
#                     full_title = item.get("title", "")
#                     full_desc = item.get("snippet", "")

#                     # ✅ Step 1: Try Google pagemap OG tags
#                     pagemap = item.get("pagemap", {})
#                     for meta in pagemap.get("metatags", []):
#                         if meta.get("og:title"):
#                             full_title = meta["og:title"].strip()
#                         if meta.get("og:description"):
#                             full_desc = meta["og:description"].strip()

#                     # ✅ Step 2: Fallback fetch LinkedIn page
#                     try:
#                         page_res = requests.get(
#                             link, headers={"User-Agent": "Mozilla/5.0"}
#                         )
#                         if page_res.status_code == 200:
#                             soup = BeautifulSoup(page_res.text, "html.parser")

#                             if soup.title and soup.title.string:
#                                 full_title = soup.title.string.strip()

#                             meta_tag = (
#                                 soup.find("meta", attrs={"name": "description"})
#                                 or soup.find("meta", attrs={"property": "og:description"})
#                             )
#                             if meta_tag and meta_tag.get("content"):
#                                 full_desc = meta_tag["content"].strip()
#                     except requests.RequestException:
#                         pass

#                     # Save or update
#                     profile, created = LinkedInProfile.objects.update_or_create(
#                         url=link,
#                         defaults={"title": full_title, "description": full_desc},
#                     )
#                     results.append(
#                         {
#                             "title": profile.title,
#                             "url": profile.url,
#                             "description": profile.description,
#                         }
#                     )

#         except requests.RequestException as e:
#             return Response(
#                 {"error": f"Failed to fetch results: {e}"},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             )

#         if not results:
#             return Response(
#                 {"warning": "No results found"},
#                 status=status.HTTP_200_OK,
#             )

#         # ✅ Apply pagination
#         paginator = self.pagination_class()
#         paginated = paginator.paginate_queryset(results, request)
#         return paginator.get_paginated_response(paginated)



# def get_linkedin_profile_data(url, driver):
#     """
#     Scrape LinkedIn profile details after login.
#     """
#     data = {
#         "name": None,
#         "headline": None,
#         "company": None,
#         "location": None,
#         "education": [],
#         "email": None,
#     }

#     try:
#         print(f"\n[DEBUG] Visiting LinkedIn profile: {url}")
#         driver.get(url)
#         time.sleep(3)  # allow JS to load

#         soup = BeautifulSoup(driver.page_source, "html.parser")

#         # Name
#         h1 = soup.find("h1", {"class": "text-heading-xlarge"})
#         if h1:
#             data["name"] = h1.get_text(strip=True)
#             print(f"[DEBUG] Extracted name: {data['name']}")

#         # Headline
#         intro = soup.find("div", {"class": "pv-text-details__left-panel"})
#         if intro:
#             title_div = intro.find("div", {"class": "text-body-medium"})
#             if title_div:
#                 headline_text = title_div.get_text(strip=True)
#                 data["headline"] = headline_text
#                 print(f"[DEBUG] Extracted headline: {data['headline']}")

#                 if " at " in headline_text:
#                     parts = headline_text.split(" at ", 1)
#                     data["headline"] = parts[0]
#                     data["company"] = parts[1]

#         # Location
#         if intro:
#             loc_span = intro.find("span", {"class": "text-body-small"})
#             if loc_span:
#                 data["location"] = loc_span.get_text(strip=True)

#         # Education
#         edu_section = soup.find("section", {"id": "education-section"})
#         if edu_section:
#             for li in edu_section.find_all("li"):
#                 edu_text = li.get_text(separator=" ", strip=True)
#                 if edu_text:
#                     data["education"].append(edu_text)

#     except Exception as e:
#         print(f"[ERROR] Error scraping LinkedIn profile {url}: {e}")

#     return data



# # -------------------
# # Main API View
# # -------------------
# class GoogleProfileSearchView(generics.ListAPIView):
#     pagination_class = JobListPagination
#     filter_backends = [DjangoFilterBackend]
#     search_fields = ["title", "description", "url"]

#     def linkedin_login(self, driver):
#         """
#         Log in to LinkedIn using credentials from settings.
#         """
#         email = "jagjotsingh7935@gmail.com"
#         password = "itsmylife16#J"


#         print("[DEBUG] Logging into LinkedIn...")
#         driver.get("https://www.linkedin.com/login")
#         time.sleep(2)

#         driver.find_element("id", "username").send_keys(email)
#         driver.find_element("id", "password").send_keys(password)
#         driver.find_element("xpath", "//button[@type='submit']").click()
#         time.sleep(5)  # wait for redirect
#         print("[DEBUG] Logged into LinkedIn successfully.")

#     def list(self, request, *args, **kwargs):
#         search_term = request.query_params.get("search_term")
#         print(f"\n[DEBUG] Incoming request with search_term: {search_term}")

#         if not search_term:
#             return Response({"error": "search_term parameter is required"}, status=400)

#         google_url = f"https://www.google.com/search?q={search_term}+site:linkedin.com/in/&num=10"

#         # Start Selenium
#         options = Options()
#         options.headless = False   # <-- set to True in production
#         driver = webdriver.Chrome(options=options)

#         # Step 1: Login to LinkedIn
#         self.linkedin_login(driver)

#         # Step 2: Scrape Google search
#         print(f"[DEBUG] Opening Google search URL: {google_url}")
#         driver.get(google_url)
#         time.sleep(3)

#         soup = BeautifulSoup(driver.page_source, "html.parser")

#         raw_results = []
#         for g in soup.select("a"):
#             href = g.get("href")
#             if href and "linkedin.com/in/" in href:
#                 title = g.get_text(strip=True)
#                 desc_tag = g.find_next("span")
#                 raw_results.append({
#                     "title": title,
#                     "url": href,
#                     "description": desc_tag.get_text(strip=True) if desc_tag else ""
#                 })

#         print(f"[DEBUG] Total Google results extracted: {len(raw_results)}")

#         # Step 3: Scrape LinkedIn Profiles
#         enriched_results = []
#         for item in raw_results:
#             profile_data = get_linkedin_profile_data(item["url"], driver)
#             item.update(profile_data)
#             enriched_results.append(item)

#         driver.quit()
#         print("[DEBUG] Selenium driver closed")

#         # Step 4: Paginate
#         page = self.paginate_queryset(enriched_results)
#         return self.get_paginated_response(page)

class LinkedInProfileListView(generics.ListAPIView):
    queryset = LinkedInProfile.objects.all().order_by("-created_at")
    serializer_class = LinkedInProfileSerializer
    pagination_class = JobListPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['title']   # filter by title
    search_fields = ['title', 'description', 'url']   # enable search




class GoogleLinkedInScraper(APIView):
    def get(self, request):
        search_term = request.query_params.get("search_term")
        if not search_term:
            return Response(
                {"error": "search_term is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        search_term = re.sub(r',\s*', ' ', search_term).strip()
        
        # Parse search_term into job_title and target_location
        parts = search_term.rsplit(maxsplit=1)
        if len(parts) >= 2:
            job_title = parts[0]
            target_location = parts[1]
        else:
            job_title = search_term
            target_location = None

        API_KEY = "AIzaSyCQSq1B_JNkzNzPMQyAtXzTAdxh_xUNCIM"  # Replace with your key
        CX = "35ba1d3284f9b4c84"

        # max_pages handling
        max_pages = request.query_params.get("max_pages", 10)
        try:
            max_pages = int(max_pages)
            max_pages = max(1, min(max_pages, 10))  # clamp between 1 and 10
        except ValueError:
            max_pages = 10

        per_page = 10
        results = []

        try:
            for page in range(max_pages):
                start_index = page * per_page + 1
                query = f'site:linkedin.com/in intitle:"{job_title}"'
                if target_location:
                    query += f" {target_location}"
                url = (
                    f"https://www.googleapis.com/customsearch/v1?"
                    f"q={query}"
                    f"&key={API_KEY}&cx={CX}&start={start_index}&num={per_page}"
                )
                response = requests.get(url)
                response.raise_for_status()
                data = response.json()

                if "items" not in data:
                    break

                for item in data["items"]:
                    link = item.get("link")
                    # start with google values (may be truncated)
                    full_title = item.get("title", "")
                    full_desc = item.get("snippet", "")

                    # ✅ Step 1: Try Google pagemap OG tags
                    pagemap = item.get("pagemap", {})
                    for meta in pagemap.get("metatags", []):
                        if meta.get("og:title"):
                            full_title = meta["og:title"].strip()
                        if meta.get("og:description"):
                            full_desc = meta["og:description"].strip()

                    # ✅ Step 2: Fallback fetch LinkedIn page
                    try:
                        page_res = requests.get(
                            link, headers={"User-Agent": "Mozilla/5.0"}
                        )
                        if page_res.status_code == 200:
                            soup = BeautifulSoup(page_res.text, "html.parser")

                            if soup.title and soup.title.string:
                                full_title = soup.title.string.strip()

                            meta_tag = (
                                soup.find("meta", attrs={"name": "description"})
                                or soup.find("meta", attrs={"property": "og:description"})
                            )
                            if meta_tag and meta_tag.get("content"):
                                full_desc = meta_tag["content"].strip()
                    except requests.RequestException:
                        pass

                    # Filter by job_title in title
                    if job_title.lower() not in full_title.lower():
                        continue

                    # Extract profile_location from description
                    profile_location = None
                    match = re.search(r"Location: (.*?) ·", full_desc)
                    if match:
                        profile_location = match.group(1).strip()

                    # Filter by distance if target_location is provided
                    include = True
                    if target_location and profile_location:
                        try:
                            geolocator = Nominatim(user_agent="linkedin_scraper")
                            target_geo = geolocator.geocode(target_location, timeout=10)
                            profile_geo = geolocator.geocode(profile_location, timeout=10)
                            if target_geo and profile_geo:
                                dist = geodesic(
                                    (target_geo.latitude, target_geo.longitude),
                                    (profile_geo.latitude, profile_geo.longitude)
                                ).miles
                                if dist > 50:
                                    include = False
                        except (GeocoderTimedOut, GeocoderUnavailable):
                            pass  # If geocoding fails, include the result

                    if not include:
                        continue

                    # Save or update
                    profile, created = LinkedInProfile.objects.update_or_create(
                        url=link,
                        defaults={"title": full_title, "description": full_desc},
                    )
                    results.append(
                        {
                            "title": profile.title,
                            "url": profile.url,
                            "description": profile.description,
                        }
                    )

        except requests.RequestException as e:
            return Response(
                {"error": f"Failed to fetch results: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not results:
            return Response(
                {"warning": "No results found"},
                status=status.HTTP_200_OK,
            )

        return Response(results)




class DownloadProfilesExcelView(APIView):
    def post(self, request):
        profiles_data = request.data
        if not profiles_data or not isinstance(profiles_data, list):
            return Response(
                {"error": "Invalid data format"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prepare data for Excel
        for profile in profiles_data:
            # Ensure all fields are strings to avoid Excel compatibility issues
            profile['title'] = str(profile.get('title', 'N/A'))
            profile['description'] = str(profile.get('description', 'N/A'))

            url = str(profile.get('url', 'N/A'))


            profile['url'] = f'=HYPERLINK("{url}", "{url}")'

        df = pd.DataFrame(profiles_data)

        # Generate unique filename
        filename = f"linkedin_profiles_{uuid.uuid4().hex}.xlsx"
        filepath = os.path.join(settings.MEDIA_ROOT, filename)

        # Create MEDIA_ROOT directory if it doesn't exist
        os.makedirs(settings.MEDIA_ROOT, exist_ok=True)

        # Save Excel file with error handling
        try:
            df.to_excel(filepath, index=False, engine='openpyxl')
            if not os.path.exists(filepath):
                raise OSError("Excel file was not created successfully.")
        except Exception as e:
            return Response(
                {"error": f"Failed to save Excel file: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Generate absolute URL
        absolute_url = request.build_absolute_uri(
            os.path.join(settings.MEDIA_URL, filename)
        )

        return Response({
            "message": "Excel file generated",
            "download_url": absolute_url
        })







class SaveJobScheduler(APIView):
    def post(self, request):
        email = request.data.get('email', '').strip()
        keywords = request.data.get('keywords', '').strip()
        location = request.data.get('location', '').strip()
        job_limit = int(request.data.get('job_limit', 100))

        # Accept both "day" / "days" and "time" / "times"
        days_input = request.data.get('days') or request.data.get('day') or []
        times_input = request.data.get('times') or request.data.get('time') or []

        if isinstance(days_input, str):
            days_input = [days_input] if days_input else []
        if isinstance(times_input, str):
            times_input = [times_input] if times_input else []

        # Now use days_input and times_input
        if not days_input:
            return Response({"error": "At least one day must be selected"}, status=400)

        if not times_input:
            return Response({"error": "At least one time must be selected"}, status=400)

        # Validate email
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            return Response({"error": "Invalid email format"}, status=400)

        if job_limit < 1 or job_limit > 3000:
            return Response({"error": "Job limit must be between 1 and 3000"}, status=400)

        valid_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        invalid_days = [d for d in days_input if d not in valid_days]
        if invalid_days:
            return Response(
                {"error": f"Invalid days: {', '.join(invalid_days)}"}, status=400
            )

        time_regex = r'^\d{2}:\d{2}$'
        invalid_times = [t for t in times_input if not re.match(time_regex, t)]
        if invalid_times:
            return Response(
                {"error": f"Invalid time formats: {', '.join(invalid_times)}"}, status=400
            )

        time_objs = []
        for t in times_input:
            try:
                time_objs.append(datetime.strptime(t, '%H:%M').time())
            except ValueError:
                return Response({"error": f"Invalid time: {t}"}, status=400)

        # Create one JobScheduler per day × time combination
        created = []
        try:
            for day in days_input:
                for time_obj in time_objs:
                    scheduler = JobScheduler.objects.create(
                        email=email,
                        keywords=keywords,
                        location=location,
                        job_limit=job_limit,
                        day=day,
                        time=time_obj
                    )
                    created.append(scheduler.id)

            return Response({
                "message": f"Created {len(created)} schedule(s) successfully",
                "created_ids": created
            }, status=201)
        except Exception as e:
            print(f"Error creating scheduler: {e}")
            return Response({"error": f"Failed to save scheduler: {str(e)}"}, status=500)

class ShowJobScheduler(APIView):
    def get(self, request):
        email = request.query_params.get('email', None)
        
        try:
            if email:
                # Validate email format
                email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                if not re.match(email_regex, email):
                    return Response(
                        {"error": "Invalid email format"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                schedules = JobScheduler.objects.filter(email=email)
            else:
                schedules = JobScheduler.objects.all()

            # Format response data
            response_data = [{
                "id": schedule.id,
                "email": schedule.email,
                "keywords": schedule.keywords,
                "location": schedule.location,
                "job_limit": schedule.job_limit,
                "day": schedule.day,
                "time": schedule.time.strftime('%H:%M:%S'),
                "created_at": schedule.created_at.isoformat()
            } for schedule in schedules]

            return Response({
                "message": "Job schedules retrieved successfully",
                "count": len(response_data),
                "data": response_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Failed to retrieve job schedules: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class UpdateJobScheduler(APIView):
    """
    PATCH: Update an existing Job Scheduler (partial update allowed)
    """
    def patch(self, request, pk):
        try:
            job_scheduler = JobScheduler.objects.get(pk=pk)
        except JobScheduler.DoesNotExist:
            return Response(
                {"error": "Job scheduler not found"},
                status=status.HTTP_404_NOT_FOUND
            )

      

        # Get data (all fields optional in PATCH)
        keywords = request.data.get('keywords', job_scheduler.keywords)
        location = request.data.get('location', job_scheduler.location)
        job_limit = request.data.get('job_limit', job_scheduler.job_limit)
        day = request.data.get('day', job_scheduler.day)
        time = request.data.get('time', None)  # Only update if provided

        # === Validations (same as create) ===

        if keywords:
            job_scheduler.keywords = keywords.strip()
        if location:
            job_scheduler.location = location.strip()

        if 'job_limit' in request.data:
            try:
                job_limit = int(job_limit)
                if not (1 <= job_limit <= 3000):
                    return Response(
                        {"error": "Job limit must be between 1 and 3000"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                job_scheduler.job_limit = job_limit
            except (ValueError, TypeError):
                return Response(
                    {"error": "Job limit must be a valid integer"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if 'day' in request.data:
            day = day.strip().lower().capitalize()
            valid_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            if day not in valid_days:
                return Response(
                    {"error": f"Day must be one of: {', '.join(valid_days)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            job_scheduler.day = day

        if time is not None:
            time = time.strip()
            time_regex = r'^\d{2}:\d{2}$'
            if not re.match(time_regex, time):
                return Response(
                    {"error": "Time must be in HH:MM format (e.g., 12:00)"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                time_obj = datetime.strptime(time, '%H:%M').time()
                job_scheduler.time = time_obj
            except ValueError:
                return Response(
                    {"error": "Invalid time format. Use HH:MM (00:00 - 23:59)"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        job_scheduler.save()

        return Response({
            "message": "Job scheduler updated successfully",
            "job_scheduler_id": job_scheduler.id,
            "data": {
                "email": job_scheduler.email,
                "keywords": job_scheduler.keywords,
                "location": job_scheduler.location,
                "job_limit": job_scheduler.job_limit,
                "day": job_scheduler.day,
                "time": job_scheduler.time.strftime('%H:%M')
            }
        }, status=status.HTTP_200_OK)


class DeleteJobScheduler(APIView):
    """
    DELETE: Remove a job scheduler by ID
    """
    def delete(self, request, pk):
        try:
            job_scheduler = JobScheduler.objects.get(pk=pk)
        except JobScheduler.DoesNotExist:
            return Response(
                {"error": "Job scheduler not found"},
                status=status.HTTP_404_NOT_FOUND
            )

       
        job_scheduler.delete()

        return Response({
            "message": "Job scheduler deleted successfully",
            "deleted_id": pk
        }, status=status.HTTP_200_OK)
    




class ExportAppliedJobsView(APIView):
    """
    POST /api/export-applied-jobs/
    
    Body (JSON):
    {
        "email": "your@email.com",
        "password": "yourpassword",
        "format": "excel"    // or "json"  (default: excel)
    }
    """
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        fmt = request.data.get('format', 'excel').lower()

        if not email or not password:
            return Response(
                {"error": "email and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if fmt not in ('excel', 'json'):
            return Response(
                {"error": "format must be 'excel' or 'json'"},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = export_linkedin_applied_jobs(email, password, fmt)

        if result['success']:
            return Response({
                "message": f"Successfully exported {result['count']} applied jobs",
                "file_url": result['file_path'],           # e.g. /media/applied_jobs/...
                "format": result['format']
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {"error": result.get('error', 'Export failed')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



