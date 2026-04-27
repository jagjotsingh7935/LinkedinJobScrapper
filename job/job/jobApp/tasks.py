from __future__ import absolute_import, unicode_literals
from celery import shared_task
from urllib.parse import quote
import requests
from bs4 import BeautifulSoup
import random
import time
import pycountry
import re
import json
import pandas as pd
import uuid
import os
from django.conf import settings
from django.core.mail import EmailMessage
from .models import *
import datetime
from django.utils import timezone
from django_celery_beat.models import PeriodicTask, CrontabSchedule




def calculate_next_run_time(day_str, target_time):
    """
    Calculate the next run datetime based on the day of the week and time.
    Assumes day_str is lowercase like 'monday', 'tuesday', etc.
    Returns a timezone-aware datetime for Celery eta.
    """
    day_map = {
        'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
        'friday': 4, 'saturday': 5, 'sunday': 6
    }
    
    if day_str not in day_map:
        raise ValueError(f"Invalid day: {day_str}")
    
    target_weekday = day_map[day_str]
    today = timezone.now().date()
    current_weekday = today.weekday()
    
    days_ahead = 0
    if target_weekday < current_weekday:
        days_ahead = 7 + target_weekday - current_weekday
    elif target_weekday == current_weekday:
        now = timezone.now()
        target_dt = timezone.make_aware(datetime.datetime.combine(today, target_time))
        if now >= target_dt:
            days_ahead = 7
    else:
        days_ahead = target_weekday - current_weekday
    
    next_date = today + datetime.timedelta(days=days_ahead)
    next_run = timezone.make_aware(datetime.datetime.combine(next_date, target_time))
    
    return next_run




def create_linkedin_url(keywords, location):
    """Create LinkedIn search URL with encoded parameters for jobs, including a 31-mile (approximately 50 km) radius, jobs from the last 25 days, and IT industry focus."""
    encoded_keywords = quote(keywords)
    encoded_location = quote(location)
    return f'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={encoded_keywords}&location={encoded_location}&f_TPR=r2592000&distance=100&f_JT=M%2CS%2CD&f_E=4%2C5&f_F=it&f_I=4&start={{}}'


def is_title_match(job_title, keywords):
    """Check if the job title contains all keywords provided in the search."""
    keyword_list = keywords.lower().split()
    return all(keyword in job_title.lower() for keyword in keyword_list)

def extract_job_ids_from_page(url, headers):
    """Extract job IDs from a single search results page."""
    try:
        time.sleep(random.uniform(1, 3))
        res = requests.get(url, headers=headers)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')
        jobs_on_page = soup.find_all("li")
        print(f"Found {len(jobs_on_page)} jobs on page")
        
        job_ids = []
        for job in jobs_on_page:
            try:
                base_card = job.find("div", {"class": "base-card"})
                if base_card and base_card.get('data-entity-urn'):
                    jobid = base_card.get('data-entity-urn').split(":")[3]
                    job_ids.append(jobid)
            except Exception as e:
                print(f"Error processing job on page: {e}")
                continue
        return job_ids
    except Exception as e:
        print(f"Error fetching page: {e}")
        return []


# def is_location_match(job_location, search_location):
#     """Check if job location matches the search location with flexible global matching using pycountry."""
#     job_location_lower = job_location.lower().strip()
#     search_location_lower = search_location.lower().strip()
    
#     search_terms = set(search_location_lower.split())
#     if any(term in job_location_lower for term in search_terms):
#         return True
    
#     try:
#         search_country = pycountry.countries.lookup(search_location_lower)
#         country_indicators = [search_country.name.lower(), search_country.alpha_2.lower(), search_country.alpha_3.lower()]
#         if any(indicator in job_location_lower for indicator in country_indicators):
#             return True
#         subdivisions = pycountry.subdivisions.get(country_code=search_country.alpha_2)
#         for sub in subdivisions:
#             sub_indicators = [sub.name.lower(), sub.code.lower().split('-')[-1]]
#             if any(ind in job_location_lower for ind in sub_indicators):
#                 return True
#     except LookupError:
#         pass
    
#     for country in pycountry.countries:
#         subdivisions = pycountry.subdivisions.get(country_code=country.alpha_2)
#         for sub in subdivisions:
#             if search_location_lower in sub.name.lower() or search_location_lower in sub.code.lower():
#                 if sub.name.lower() in job_location_lower or country.name.lower() in job_location_lower:
#                     return True
    
#     return False


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
        'skills': []
    }
    
    try:
        time.sleep(random.uniform(0.5, 1.5))
        resp = requests.get(job_url, headers=headers)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        company_card = soup.find("div", {"class": "top-card-layout__card"})
        if company_card:
            company_link = company_card.find("a")
            if company_link:
                if company_link.find("img"):
                    job_data["company"] = company_link.find("img").get("alt", "").strip()
                job_data["company_url"] = company_link.get("href", "").strip()

        title_section = soup.find("div", {"class": "top-card-layout__entity-info"})
        if title_section:
            title_link = title_section.find("a")
            if title_link:
                job_data["job_title"] = title_link.text.strip()
                job_data["job_url"] = title_link.get("href", "").strip()

        location_elem = soup.find("span", {"class": "topcard__flavor--bullet"})
        if location_elem:
            job_data["location"] = location_elem.text.strip()

        posted_elem = soup.find("span", {"class": "posted-time-ago__text"})
        if posted_elem:
            job_data["posted_date"] = posted_elem.text.strip()

        desc_elem = soup.find("div", {"class": "show-more-less-html__markup"})
        if desc_elem:
            job_data["job_description"] = desc_elem.text.strip()

        applicant_elem = soup.find("span", {"class": "num-applicants__caption"})
        if applicant_elem:
            job_data["applicant_count"] = applicant_elem.text.strip()

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

        salary_elem = soup.find("span", {"class": "compensation__salary"})
        if salary_elem:
            job_data["salary"] = salary_elem.text.strip()
        elif job_data.get("job_description"):
            description_text = job_data["job_description"].lower()
            salary_pattern = r'\$[\d,]+(?:\.\d+)?(?:\s*-\s*\$[\d,]+(?:\.\d+)?)?(?:\s*(?:per year|annually|yearly))?'
            match = re.search(salary_pattern, description_text)
            if match:
                job_data["salary"] = match.group(0)

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
            if job_data.get("job_description"):
                description_text = job_data["job_description"].lower()

                common_skills = [
                    "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "php", 
                    "go", "rust", "scala", "r", "matlab", "perl", "swift", "kotlin", "dart",
                    "sql", "nosql", "bash", "powershell", "vba", "groovy",
                    "html", "css", "react", "angular", "vue", "node.js", "django", "flask", 
                    "spring", "asp.net", "express.js", "jquery", "bootstrap", "tailwind", 
                    "graphql", "rest api", "soap", "ajax", "webpack", "babel", "svelte",
                    "machine learning", "data analysis", "data science", "deep learning", 
                    "artificial intelligence", "nlp", "computer vision", "pandas", "numpy", 
                    "scikit-learn", "tensorflow", "pytorch", "keras", "statsmodels", 
                    "tableau", "power bi", "excel", "spss", "sas", "d3.js", "matplotlib", 
                    "seaborn", "statistical analysis", "data visualization", "big data", 
                    "hadoop", "spark", "hive", "pig", "qlikview",
                    "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "ansible", 
                    "terraform", "cloud computing", "ci/cd", "devops", "git", "github", 
                    "gitlab", "bitbucket", "prometheus", "grafana", "elasticsearch", 
                    "logstash", "kibana", "openshift", "cloudformation",
                    "mysql", "postgresql", "mongodb", "redis", "oracle", "sql server", 
                    "cassandra", "dynamodb", "sqlite", "mariadb", "neo4j",
                    "it strategy", "it governance", "budget management", "vendor management", 
                    "it infrastructure", "cybersecurity", "network administration", "itil", 
                    "service desk", "incident management", "change management", "risk management", 
                    "disaster recovery", "business continuity", "stakeholder management", 
                    "it procurement", "system administration", "erp systems", "crm systems", 
                    "it compliance", "data center management", "cloud migration", "it operations", 
                    "technical support", "team management", "strategic planning", "service management",
                    "penetration testing", "ethical hacking", "firewall", "siem", "soc", 
                    "intrusion detection", "vulnerability assessment", "cryptography", 
                    "network security", "endpoint security", "incident response", "malware analysis",
                    "agile", "scrum", "kanban", "waterfall", "software engineering", 
                    "test-driven development", "behavior-driven development", "unit testing", 
                    "integration testing", "microservices", "monolithic architecture", 
                    "design patterns", "software architecture", "code review",
                    "ios", "android", "flutter", "react native", "xamarin", "ionic", 
                    "mobile development", "swiftui", "jetpack compose",
                    "linux", "windows server", "unix", "tcp/ip", "dns", "dhcp", "vpn", 
                    "load balancing", "active directory", "vmware", "hyper-v", "cisco", 
                    "routing", "switching", "network engineering",
                    "project management", "communication", "team leadership", "problem solving", 
                    "time management", "decision making", "negotiation", "conflict resolution", 
                    "customer service", "business analysis", "requirements gathering", 
                    "stakeholder engagement", "process improvement", "change leadership", 
                    "mentoring", "coaching", "public speaking", "presentation skills",
                    "sap", "salesforce", "dynamics 365", "servicenow", "jira", "confluence", 
                    "trello", "asana", "slack", "microsoft teams", "zoom", "sharepoint",
                    "blockchain", "iot", "augmented reality", "virtual reality", "quantum computing", 
                    "edge computing", "serverless", "robotics", "5g",
                    "ui/ux design", "product management", "quality assurance", "technical writing", 
                    "api development", "database administration", "systems analysis", 
                    "business intelligence", "data engineering", "etl", "data warehousing",
                    "cloud security", "identity and access management", "zero trust security",
                    "scripting", "shell scripting", "powershell scripting",
                    "monitoring tools", "nagios", "splunk", "datadog",
                    "ci/cd pipelines", "gitlab ci",
                    "hands-on troubleshooting", "it asset management", "vendor coordination",
                    "ai governance", "it automation", "observability", "sre", 
                    "digital transformation", "data governance", "privacy compliance",
                    "financial skills", "forecasting", "strategic it leadership", 
                    "business alignment", "ai & emerging tech", "enterprise architecture", 
                    "operational management", "board reporting", "policy development",
                    "cio alignment", "performance metrics", "data management", "user training",
                    "system integration", "security frameworks", "team coordination",
                    "sla compliance", "resource allocation", "performance monitoring", 
                    "vendor negotiation", "datacenter management", "backup systems", 
                    "network upgrades", "cybersecurity initiatives", "desktop infrastructure", 
                    "server infrastructure", "rmm tools", "ticketing systems", 
                    "endpoint protection", "workstation rollouts", "microsoft 365 administration", 
                    "aws administration", "dns management", "device provisioning", 
                    "security administration", "cloud resources",
                    "asset documentation", "process optimization", "network diagnostics", 
                    "helpdesk management", "system upgrades", "compliance audits", 
                    "solution architecture", "system scalability", "cloud integration", 
                    "risk assessment", "compliance monitoring", "security governance", 
                    "audit coordination", "data pipelines", "model deployment", 
                    "algorithm optimization", "cloud orchestration", "feature engineering", 
                    "network configuration", "dynamic routing", "microsoft 365 migration", 
                    "aws provisioning", "dns configuration", "infrastructure monitoring", 
                    "client support", "service-level agreements", "performance optimization", 
                    "enterprise storage", "computing clusters", "zero trust architecture", 
                    "it modernization", "hybrid cloud", "container orchestration", 
                    "incident escalation", "security operations", "stakeholder collaboration", 
                    "resource planning", "project execution", "cost estimation", 
                    "stakeholder alignment", "team motivation", "performance oversight", 
                    "client communication", "cross-functional collaboration", 
                    "strategic decision-making", "change advocacy", "risk communication", 
                    "vendor oversight", "team development", "operational excellence"
                ]
                found_skills = []
                for skill in common_skills:
                    pattern = r'\b' + re.escape(skill) + r'\b'
                    if re.search(pattern, description_text, re.IGNORECASE):
                        found_skills.append(skill)
                skill_patterns = [
                    r'proficient in (\w+)', r'experience with (\w+)', r'expertise in (\w+)',
                    r'knowledge of (\w+)', r'skilled in (\w+)', r'familiar with (\w+)'
                ]
                for pattern in skill_patterns:
                    matches = re.findall(pattern, description_text, re.IGNORECASE)
                    for match in matches:
                        match_lower = match.lower()
                        if match_lower in common_skills and match_lower not in found_skills:
                            found_skills.append(match_lower)
                job_data["skills"] = list(set([skill.title() for skill in found_skills]))

    except Exception as e:
        print(f"Error processing job ID {job_id}: {e}")
        return None

    return job_data


# @shared_task
# def process_job_search(keywords, location, email, job_limit, search_query_id):
#     """Celery task to process job search, generate Excel, and send email."""
#     headers = {
#         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
#         "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
#         "Accept-Language": "en-US,en;q=0.9",
#         "Accept-Encoding": "gzip, deflate, br, zstd",
#         "Connection": "keep-alive",
#         "Referer": "https://www.linkedin.com/",
#         "Upgrade-Insecure-Requests": "1",
#         "Sec-Fetch-Dest": "document",
#         "Sec-Fetch-Mode": "navigate",
#         "Sec-Fetch-Site": "same-origin",
#         "Sec-Fetch-User": "?1",
#         "Cache-Control": "max-age=0"
#     }

#     try:
#         # Retrieve SearchQuery
#         search_query = SearchQuery.objects.get(id=search_query_id)
#     except SearchQuery.DoesNotExist:
#         print(f"SearchQuery {search_query_id} not found")
#         return

#     base_url = create_linkedin_url(keywords, location)
#     max_fetch = job_limit * 3  # Total unique jobs to process
#     max_pages = (max_fetch // 10) + 5  # Approximate pages needed, + buffer for variable jobs per page

#     # Collect unique job IDs sequentially
#     all_job_ids = []
#     seen_job_ids = set()
#     page = 0

#     while len(all_job_ids) < max_fetch and page < max_pages:
#         url = base_url.format(page * 25)
#         page_job_ids = extract_job_ids_from_page(url, headers)
#         new_ids = [jid for jid in page_job_ids if jid not in seen_job_ids]
#         all_job_ids.extend(new_ids)
#         seen_job_ids.update(new_ids)
#         page += 1
#         print(f"Collected {len(all_job_ids)} unique job IDs after page {page}")

#     # Limit to max_fetch
#     all_job_ids = all_job_ids[:max_fetch]

#     jobs_data = []
#     processed_count = 0
#     filtered_out_title = 0

#     for job_id in all_job_ids:
#         if len(jobs_data) >= job_limit:
#             break
#         print(f"\rProcessing job {processed_count+1}/{len(all_job_ids)}", end="")
#         job_data = get_job_details(job_id, headers)
#         processed_count += 1
        
#         if job_data and job_data.get('job_title'):
#             if not is_title_match(job_data['job_title'], keywords):
#                 filtered_out_title += 1
#                 continue
            
#             job = Job.objects.create(
#                 search_query=search_query,
#                 job_id=job_id,
#                 company=job_data['company'],
#                 company_url=job_data['company_url'],
#                 job_title=job_data['job_title'],
#                 job_url=job_data['job_url'],
#                 location=job_data['location'],
#                 posted_date=job_data['posted_date'],
#                 job_description=job_data['job_description'],
#                 applicant_count=job_data['applicant_count'],
#                 level=job_data['level'],
#                 employment_type=job_data['employment_type'],
#                 job_function=job_data['job_function'],
#                 industry=job_data.get('industry'),
#                 salary=job_data['salary'],
#                 skills=json.dumps(job_data['skills'])
#             )
#             jobs_data.append({
#                 'id': job.id,
#                 'job_id': job_id,
#                 **job_data
#             })

#     print()
#     print(f"Processed {processed_count} unique jobs from {page} pages")
#     print(f"Filtered out {filtered_out_title} jobs due to title mismatch")
#     print(f"Collected {len(jobs_data)} matching jobs")

#     # Generate Excel file
#     if not jobs_data:
#         print(f"No jobs found for {keywords} in {location}")
#         # Send email with no results
#         email_subject = f"Job Search Results for {keywords} in {location}"
#         email_body = f"No matching jobs found for {keywords} in {location}."

#         email_message = EmailMessage(
#             subject=email_subject,
#             body=email_body,
#             from_email=settings.EMAIL_HOST_USER,
#             to=[email]
#         )
#         try:
#             email_message.send()
#             print(f"Sent email to {email} with no results")
#         except Exception as e:
#             print(f"Failed to send email to {email}: {e}")
#         return

#     # Flatten skills for Excel
#     for job in jobs_data:
#         if 'skills' in job and isinstance(job['skills'], list):
#             job['skills'] = ', '.join(job['skills'])

        
#         # Convert URLs to Excel HYPERLINK formula (clickable in Excel)
#         if 'company_url' in job and job['company_url']:
#             job['company_url'] = f'=HYPERLINK("{job["company_url"]}", "View Company")'
#         else:
#             job['company_url'] = 'N/A'

#         if 'job_url' in job and job['job_url']:
#             job['job_url'] = f'=HYPERLINK("{job["job_url"]}", "View Job")'
#         else:
#             job['job_url'] = 'N/A'

#     # Define desired column order
#     columns = [
#         'company', 'job_title', 'posted_date', 'applicant_count', 'salary', 
#         'level', 'location', 'company_url', 'skills', 'job_url', 
#         'job_description', 'employment_type', 'job_function'
#     ]

#     df = pd.DataFrame(jobs_data)
#     df = df[[col for col in columns if col in df.columns]]
#     filename = f"jobs_data_{uuid.uuid4().hex}.xlsx"
#     filepath = os.path.join(settings.MEDIA_ROOT, filename)
#     os.makedirs(settings.MEDIA_ROOT, exist_ok=True)

#     try:
#         df.to_excel(filepath, index=False, engine='openpyxl')
#         if not os.path.exists(filepath):
#             raise OSError("Excel file was not created successfully.")
#     except Exception as e:
#         print(f"Failed to save Excel file: {e}")
#         return

#     # Send email with Excel attachment
#     email_subject = f"Job Search Results for {keywords} in {location}"
#     email_body = f"Attached are the job search results for {keywords} in {location}. Found {len(jobs_data)} matching jobs."

#     email_message = EmailMessage(
#         subject=email_subject,
#         body=email_body,
#         from_email=settings.EMAIL_HOST_USER,
#         to=[email]
#     )
#     try:
#         with open(filepath, 'rb') as f:
#             email_message.attach(filename, f.read(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
#         email_message.send()
#         print(f"Sent email to {email} with Excel attachment")
#     except Exception as e:
#         print(f"Failed to send email to {email}: {e}")




@shared_task
def process_job_search(keywords, location, email, job_limit, search_query_id):
    """Celery task to process job search, generate Excel with native hyperlinks, and send email."""
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

    try:
        # Retrieve SearchQuery
        search_query = SearchQuery.objects.get(id=search_query_id)
    except SearchQuery.DoesNotExist:
        print(f"SearchQuery {search_query_id} not found")
        return

    base_url = create_linkedin_url(keywords, location)
    max_fetch = job_limit * 3  # Total unique jobs to process
    max_pages = (max_fetch // 10) + 5  # Approximate pages needed, + buffer

    # Collect unique job IDs sequentially
    all_job_ids = []
    seen_job_ids = set()
    page = 0

    while len(all_job_ids) < max_fetch and page < max_pages:
        url = base_url.format(page * 25)
        page_job_ids = extract_job_ids_from_page(url, headers)
        new_ids = [jid for jid in page_job_ids if jid not in seen_job_ids]
        all_job_ids.extend(new_ids)
        seen_job_ids.update(new_ids)
        page += 1
        print(f"Collected {len(all_job_ids)} unique job IDs after page {page}")

    # Limit to max_fetch
    all_job_ids = all_job_ids[:max_fetch]

    jobs_data = []
    processed_count = 0
    filtered_out_title = 0

    for job_id in all_job_ids:
        if len(jobs_data) >= job_limit:
            break
        print(f"\rProcessing job {processed_count+1}/{len(all_job_ids)}", end="")
        job_data = get_job_details(job_id, headers)
        processed_count += 1
        
        if job_data and job_data.get('job_title'):
            if not is_title_match(job_data['job_title'], keywords):
                filtered_out_title += 1
                continue
            
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

    print()
    print(f"Processed {processed_count} unique jobs from {page} pages")
    print(f"Filtered out {filtered_out_title} jobs due to title mismatch")
    print(f"Collected {len(jobs_data)} matching jobs")

    # Generate Excel file with native hyperlinks (no formulas)
    if not jobs_data:
        print(f"No jobs found for {keywords} in {location}")
        # Send email with no results
        email_subject = f"Job Search Results for {keywords} in {location}"
        email_body = f"No matching jobs found for {keywords} in {location}."

        email_message = EmailMessage(
            subject=email_subject,
            body=email_body,
            from_email=settings.EMAIL_HOST_USER,
            to=[email]
        )
        try:
            email_message.send()
            print(f"Sent email to {email} with no results")
        except Exception as e:
            print(f"Failed to send email to {email}: {e}")
        return

    # Flatten skills for Excel (still needed for other columns)
    for job in jobs_data:
        if 'skills' in job and isinstance(job['skills'], list):
            job['skills'] = ', '.join(job['skills'])

    # Define desired column order
    columns = [
        'company', 'job_title', 'posted_date', 'applicant_count', 'salary', 
        'level', 'location', 'company_url', 'skills', 'job_url', 
        'job_description', 'employment_type', 'job_function'
    ]

    df = pd.DataFrame(jobs_data)
    df = df[[col for col in columns if col in df.columns]]

    filename = f"jobs_data_{uuid.uuid4().hex}.xlsx"
    filepath = os.path.join(settings.MEDIA_ROOT, filename)
    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)

    try:
        # Use openpyxl directly for native hyperlinks
        from openpyxl import Workbook
        from openpyxl.styles import Font

        wb = Workbook()
        ws = wb.active
        ws.title = "Job Search Results"

        # Write headers (bold for readability)
        for col_num, header in enumerate(df.columns, start=1):
            cell = ws.cell(row=1, column=col_num, value=header)
            cell.font = Font(bold=True)

        # Write data rows + native hyperlinks for URL columns
        for row_num, row in enumerate(df.itertuples(index=False), start=2):
            for col_num, value in enumerate(row, start=1):
                col_name = df.columns[col_num - 1]
                cell = ws.cell(row=row_num, column=col_num)

                if col_name == 'company_url' and value and value != 'N/A':
                    cell.hyperlink = value.strip()
                    cell.value = "Company Site"  # Short friendly name – renders well on iOS
                    cell.style = "Hyperlink"     # Blue + underlined look
                elif col_name == 'job_url' and value and value != 'N/A':
                    cell.hyperlink = value.strip()
                    cell.value = "View Job"
                    cell.style = "Hyperlink"
                else:
                    # All other columns get normal value
                    cell.value = value

        wb.save(filepath)

        if not os.path.exists(filepath):
            raise OSError("Excel file was not created successfully.")
    except Exception as e:
        print(f"Failed to save Excel file: {e}")
        return

    # Send email with Excel attachment
    email_subject = f"Job Search Results for {keywords} in {location}"
    email_body = f"Attached are the job search results for {keywords} in {location}. Found {len(jobs_data)} matching jobs."

    email_message = EmailMessage(
        subject=email_subject,
        body=email_body,
        from_email=settings.EMAIL_HOST_USER,
        to=[email]
    )
    try:
        with open(filepath, 'rb') as f:
            email_message.attach(filename, f.read(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        email_message.send()
        print(f"Sent email to {email} with Excel attachment")
    except Exception as e:
        print(f"Failed to send email to {email}: {e}")


def create_crontab_schedule(day_str, target_time):
    """Create or get a CrontabSchedule for the specified day and time."""
    day_map = {
        'monday': '1', 'tuesday': '2', 'wednesday': '3', 'thursday': '4',
        'friday': '5', 'saturday': '6', 'sunday': '0'
    }
    
    if day_str.lower() not in day_map:
        raise ValueError(f"Invalid day: {day_str}")
    
    hour = target_time.hour
    minute = target_time.minute
    day_of_week = day_map[day_str.lower()]
    
    schedule, created = CrontabSchedule.objects.get_or_create(
        minute=minute,
        hour=hour,
        day_of_week=day_of_week,
        timezone='America/Vancouver'
    )
    return schedule



@shared_task
def create_periodic_task(job_scheduler_id):
    """Create or update a periodic task for a JobScheduler entry."""
    try:
        scheduler = JobScheduler.objects.get(id=job_scheduler_id)
    except JobScheduler.DoesNotExist:
        print(f"JobScheduler {job_scheduler_id} not found")
        return

    schedule = create_crontab_schedule(scheduler.day, scheduler.time)
    
    task_name = f"job_search_{scheduler.id}_{scheduler.keywords}_{scheduler.location}"
    
    # Delete any existing task with the same name to avoid duplicates
    PeriodicTask.objects.filter(name=task_name).delete()
    
    PeriodicTask.objects.create(
        crontab=schedule,
        name=task_name,
        task='jobApp.tasks.scheduled_job_search',
        args=json.dumps([job_scheduler_id]),
        enabled=True
    )
    print(f"Created/Updated periodic task {task_name} for JobScheduler {job_scheduler_id}")

    
@shared_task
def scheduled_job_search(job_scheduler_id):
    """Celery task to run a scheduled job search."""
    try:
        scheduler = JobScheduler.objects.get(id=job_scheduler_id)
    except JobScheduler.DoesNotExist:
        print(f"JobScheduler {job_scheduler_id} not found")
        return
    
    search_query = SearchQuery.objects.create(
        email=scheduler.email,
        keywords=scheduler.keywords,
        location=scheduler.location,
        job_limit=scheduler.job_limit
    )
    
    process_job_search.delay(
        scheduler.keywords,
        scheduler.location,
        scheduler.email,
        scheduler.job_limit,
        search_query.id
    )
    print(f"Triggered job search for {scheduler.keywords} in {scheduler.location}")