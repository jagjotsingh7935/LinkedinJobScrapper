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
from .models import SearchQuery, Job


print("EMAIL",settings.EMAIL_HOST_USER)

print("EMAIL",settings.EMAIL_HOST_USER)



def create_linkedin_url(keywords, location):
    """Create LinkedIn search URL with encoded parameters for IT Manager jobs, including a 31-mile (approximately 50 km) radius, jobs from the last 15 days, and IT industry focus."""
    encoded_keywords = quote(keywords)
    encoded_location = quote(location)
    return f'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={encoded_keywords}&location={encoded_location}&f_TPR=r1728000&distance=45&f_JT=M%2CS%2CD&f_E=4%2C5&f_F=it&f_I=4&start={{}}'

def get_job_ids(base_url, headers, job_limit=100):
    """Collect job IDs from search results, fetching extra to meet job_limit after filtering."""
    job_ids = []
    page = 0
    max_pages = 50
    target_ids = job_limit * 2

    while len(job_ids) < target_ids and page < max_pages:
        try:
            time.sleep(random.uniform(1, 3))
            res = requests.get(base_url.format(page * 25), headers=headers)
            res.raise_for_status()
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
    
    search_terms = set(search_location_lower.split())
    if any(term in job_location_lower for term in search_terms):
        return True
    
    try:
        search_country = pycountry.countries.lookup(search_location_lower)
        country_indicators = [search_country.name.lower(), search_country.alpha_2.lower(), search_country.alpha_3.lower()]
        if any(indicator in job_location_lower for indicator in country_indicators):
            return True
        subdivisions = pycountry.subdivisions.get(country_code=search_country.alpha_2)
        for sub in subdivisions:
            sub_indicators = [sub.name.lower(), sub.code.lower().split('-')[-1]]
            if any(ind in job_location_lower for ind in sub_indicators):
                return True
    except LookupError:
        pass
    
    for country in pycountry.countries:
        subdivisions = pycountry.subdivisions.get(country_code=country.alpha_2)
        for sub in subdivisions:
            if search_location_lower in sub.name.lower() or search_location_lower in sub.code.lower():
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
                # common_skills = [
                #     "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "php", 
                #     "go", "rust", "scala", "r", "matlab", "perl", "swift", "kotlin", "dart",
                #     "sql", "nosql", "bash", "powershell", "vba", "groovy",
                #     "html", "css", "react", "angular", "vue", "node.js", "django", "flask", 
                #     "spring", "asp.net", "express.js", "jquery", "bootstrap", "tailwind", 
                #     "graphql", "rest api", "soap", "ajax", "webpack", "babel", "svelte",
                #     "machine learning", "data analysis", "data science", "deep learning", 
                #     "artificial intelligence", "nlp", "computer vision", "pandas", "numpy", 
                #     "scikit-learn", "tensorflow", "pytorch", "keras", "statsmodels", 
                #     "tableau", "power bi", "excel", "spss", "sas", "d3.js", "matplotlib", 
                #     "seaborn", "statistical analysis", "data visualization", "big data", 
                #     "hadoop", "spark", "hive", "pig", "qlikview",
                #     "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "ansible", 
                #     "terraform", "cloud computing", "ci/cd", "devops", "git", "github", 
                #     "gitlab", "bitbucket", "prometheus", "grafana", "elasticsearch", 
                #     "logstash", "kibana", "openshift", "cloudformation",
                #     "mysql", "postgresql", "mongodb", "redis", "oracle", "sql server", 
                #     "cassandra", "dynamodb", "sqlite", "mariadb", "neo4j",
                #     "it strategy", "it governance", "budget management", "vendor management", 
                #     "it infrastructure", "cybersecurity", "network administration", "itil", 
                #     "service desk", "incident management", "change management", "risk management", 
                #     "disaster recovery", "business continuity", "stakeholder management", 
                #     "it procurement", "system administration", "erp systems", "crm systems", 
                #     "it compliance", "data center management", "cloud migration", "it operations", 
                #     "technical support", "team management", "strategic planning", "service management",
                #     "penetration testing", "ethical hacking", "firewall", "siem", "soc", 
                #     "intrusion detection", "vulnerability assessment", "cryptography", 
                #     "network security", "endpoint security", "incident response", "malware analysis",
                #     "agile", "scrum", "kanban", "waterfall", "software engineering", 
                #     "test-driven development", "behavior-driven development", "unit testing", 
                #     "integration testing", "microservices", "monolithic architecture", 
                #     "design patterns", "software architecture", "code review",
                #     "ios", "android", "flutter", "react native", "xamarin", "ionic", 
                #     "mobile development", "swiftui", "jetpack compose",
                #     "linux", "windows server", "unix", "tcp/ip", "dns", "dhcp", "vpn", 
                #     "load balancing", "active directory", "vmware", "hyper-v", "cisco", 
                #     "routing", "switching", "network engineering",
                #     "project management", "communication", "team leadership", "problem solving", 
                #     "time management", "decision making", "negotiation", "conflict resolution", 
                #     "customer service", "business analysis", "requirements gathering", 
                #     "stakeholder engagement", "process improvement", "change leadership", 
                #     "mentoring", "coaching", "public speaking", "presentation skills",
                #     "sap", "salesforce", "dynamics 365", "servicenow", "jira", "confluence", 
                #     "trello", "asana", "slack", "microsoft teams", "zoom", "sharepoint",
                #     "blockchain", "iot", "augmented reality", "virtual reality", "quantum computing", 
                #     "edge computing", "serverless", "robotics", "5g",
                #     "ui/ux design", "product management", "quality assurance", "technical writing", 
                #     "api development", "database administration", "systems analysis", 
                #     "business intelligence", "data engineering", "etl", "data warehousing"
                # ]
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

@shared_task
def process_job_search(keywords, location, email, job_limit, search_query_id):
    """Celery task to process job search, generate Excel, and send email."""
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
    jobs_data = []
    processed_count = 0
    page = 0
    filtered_out_location = 0
    seen_job_ids = set()

    while len(jobs_data) < job_limit:
        job_ids = get_job_ids(base_url.replace('start={}', f'start={page * 25}'), headers, job_limit - len(jobs_data))
        if not job_ids:
            print("No more job IDs available")
            break

        for job_id in job_ids:
            if len(jobs_data) >= job_limit:
                break
            if job_id in seen_job_ids:
                continue
            seen_job_ids.add(job_id)
            
            print(f"\rProcessing job {processed_count+1}", end="")
            job_data = get_job_details(job_id, headers)
            processed_count += 1
            
            if job_data and job_data.get('job_title') and job_data.get('location'):
                if is_location_match(job_data['location'], location):
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

        page += 1

    print()
    print(f"Filtered out {filtered_out_location} jobs due to location mismatch")

    # Generate Excel file
    if not jobs_data:
        print(f"No jobs found for {keywords} in {location}")
        # Send email with no results
        email_subject = f"Job Search Results for {keywords} in {location}"
        email_body = f"No matching jobs found for {keywords} in {location}."

        print("EMAIL",settings.EMAIL_HOST_USER)



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

    # Flatten skills for Excel
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
        df.to_excel(filepath, index=False, engine='openpyxl')
        if not os.path.exists(filepath):
            raise OSError("Excel file was not created successfully.")
    except Exception as e:
        print(f"Failed to save Excel file: {e}")
        return

    # Send email with Excel attachment
    email_subject = f"Job Search Results for {keywords} in {location}"
    email_body = f"Attached are the job search results for {keywords} in {location}. Found {len(jobs_data)} matching jobs."

    print("EMAIL",settings.EMAIL_HOST_USER)

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
    