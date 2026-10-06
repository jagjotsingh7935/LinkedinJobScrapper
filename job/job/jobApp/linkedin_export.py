import requests
import json
import time
from urllib.parse import urljoin
import pandas as pd  # for Excel export

# Load cookies from the exported JSON file
def load_cookies_from_file(filepath):
    with open(filepath, 'r') as f:
        cookies_list = json.load(f)
    # Convert list of dicts to requests cookie jar
    cookies = {}
    for cookie in cookies_list:
        cookies[cookie['name']] = cookie['value']
    return cookies

# Headers mimicking a real browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/vnd.linkedin.normalized+json+2.1',
    'Accept-Language': 'en-US,en;q=0.9',
    'csrf-token': 'ajax:1234567890',  # This may be needed; we'll extract it from cookies or set a dummy
    'x-restli-protocol-version': '2.0.0',
    'x-li-lang': 'en_US',
    'x-li-track': '{"clientVersion":"1.13.13128","osName":"web","timezoneOffset":-5,"deviceFormFactor":"DESKTOP","mpName":"voyager-web"}',
    'Connection': 'keep-alive',
}

def fetch_applied_jobs(cookies, start=0, count=100):
    """
    Fetch one page of applied jobs.
    Returns the JSON response and the total number of jobs (if available).
    """
    url = f"https://www.linkedin.com/voyager/api/collections/saved-jobs?count={count}&start={start}"
    resp = requests.get(url, headers=HEADERS, cookies=cookies)
    resp.raise_for_status()
    return resp.json()

def extract_jobs_from_response(data):
    """
    Parse the JSON response and return a list of job dictionaries.
    """
    jobs = []
    # The structure may vary; typical path: data -> data -> elements
    try:
        elements = data['data']['data']['elements']
    except KeyError:
        # Fallback: try direct elements
        elements = data.get('elements', [])
    
    for elem in elements:
        # The job details are often nested inside 'jobPosting' or directly in 'job'
        job_posting = elem.get('jobPosting') or elem.get('job') or elem
        title = job_posting.get('title')
        company = job_posting.get('companyDetails', {}).get('company', {}).get('name')
        location = job_posting.get('formattedLocation')
        applied_date = elem.get('appliedDate')  # may be a timestamp or formatted string
        job_url = f"https://www.linkedin.com/jobs/view/{job_posting.get('entityUrn', '').split(':')[-1]}/" if job_posting.get('entityUrn') else None
        
        jobs.append({
            'job_title': title,
            'company': company,
            'location': location,
            'applied_date': applied_date,
            'job_url': job_url,
        })
    return jobs

def get_all_applied_jobs(cookies):
    all_jobs = []
    start = 0
    count = 100  # max per page
    while True:
        print(f"Fetching jobs {start} to {start+count}...")
        data = fetch_applied_jobs(cookies, start, count)
        jobs = extract_jobs_from_response(data)
        if not jobs:
            break
        all_jobs.extend(jobs)
        # Check if we have fetched all
        total = data.get('data', {}).get('data', {}).get('paging', {}).get('total')
        if total and len(all_jobs) >= total:
            break
        start += count
        time.sleep(1)  # be polite
    return all_jobs

def main():
    # Load cookies
    cookies = load_cookies_from_file('linkedin_cookies.json')
    
    # Optionally, extract CSRF token from cookies and update headers
    if 'JSESSIONID' in cookies:
        HEADERS['csrf-token'] = cookies['JSESSIONID'].strip('"')
    
    # Fetch all applied jobs
    jobs = get_all_applied_jobs(cookies)
    print(f"Total jobs fetched: {len(jobs)}")
    
    # Save to JSON
    with open('applied_jobs.json', 'w', encoding='utf-8') as f:
        json.dump(jobs, f, indent=2, ensure_ascii=False)
    
    # Save to Excel (optional)
    df = pd.DataFrame(jobs)
    df.to_excel('applied_jobs.xlsx', index=False)
    print("Exported to applied_jobs.json and applied_jobs.xlsx")

if __name__ == '__main__':
    main()

def export_linkedin_applied_jobs(email, password, fmt='excel'):
    try:
        import os
        from django.conf import settings
        cookie_path = os.path.join(settings.BASE_DIR, 'linkedin_cookies.json')
        if not os.path.exists(cookie_path):
            return {'success': False, 'error': 'LinkedIn cookies not configured on server'}
        cookies = load_cookies_from_file(cookie_path)
        if 'JSESSIONID' in cookies:
            HEADERS['csrf-token'] = cookies['JSESSIONID'].strip('"')
        jobs = get_all_applied_jobs(cookies)
        applied_jobs_dir = os.path.join(settings.MEDIA_ROOT, 'applied_jobs')
        os.makedirs(applied_jobs_dir, exist_ok=True)
        filename = f"applied_jobs_{int(time.time())}.{'xlsx' if fmt == 'excel' else 'json'}"
        file_path = os.path.join(applied_jobs_dir, filename)
        file_url = f"{settings.MEDIA_URL}applied_jobs/{filename}"
        if fmt == 'excel':
            df = pd.DataFrame(jobs)
            df.to_excel(file_path, index=False)
        else:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(jobs, f, indent=2, ensure_ascii=False)
        return {'success': True, 'count': len(jobs), 'file_path': file_url, 'format': fmt}
    except Exception as e:
        return {'success': False, 'error': str(e)}