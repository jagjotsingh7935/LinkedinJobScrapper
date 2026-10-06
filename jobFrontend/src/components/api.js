import axios from "axios";

const rawApiUrl = import.meta.env.VITE_API_URL || "/";
const API_BASE_URL = rawApiUrl.endsWith("/") ? rawApiUrl : `${rawApiUrl}/`;


export const searchJobs = async (keywords, location,email, jobLimit) => {
  try {
    const response = await axios.post(`${API_BASE_URL}search/`, {
      keywords,
      location,
      email,
      job_limit: jobLimit,
    });
    return response.data;
  } catch (error) {
    console.error("Error searching jobs:", error);
    throw error;
  }
};

export const saveJob = async (jobId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}saved/job/create/`, {
      job_id: jobId,
    });
    return response.data;
  } catch (error) {
    console.error("Error saving job:", error);
    throw error;
  }
};

export const searchSavedWishlistJobs = async (
  keywords,
  location,
  page = 1,
  pageSize = 5
) => {
  try {
    const response = await axios.get(`${API_BASE_URL}saved/jobs/search/`, {
      params: {
        job_title: keywords,
        location,
        page,
        page_size: pageSize,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching saved jobs:", error);
    throw error;
  }
};

export const restrictSearchJobs = async (keywords, location, jobLimit) => {
  try {
    const response = await axios.post(`${API_BASE_URL}restrict/search/`, {
      keywords,
      location,
      job_limit: jobLimit,
    });
    return response.data;
  } catch (error) {
    console.error("Error in restricted job search:", error);
    throw error;
  }
};

export const savedJobSearch = async (
  keywords,
  location,
  page = 1,
  pageSize = 5
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}saved/job/search/`,
      {
        keywords,
        location,
      },
      {
        params: { page, page_size: pageSize },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching saved jobs:", error);
    throw error;
  }
};

export const downloadExcel = async (jobsData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}download/excel/`,
      jobsData
    );
    const { download_url } = response.data;

    if (!download_url) {
      throw new Error("Download URL not provided by the server");
    }

    // Extract filename from the download_url
    const filename = download_url.split("/").pop();

    const link = document.createElement("a");
    link.href = download_url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { message: "Excel file downloaded" };
  } catch (error) {
    console.error("Error downloading Excel:", error);
    throw error;
  }
};

export const getDashboardData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}dashboard/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
};

export const getAllJobs = async (page = 1, pageSize = 5) => {
  try {
    const response = await axios.get(`${API_BASE_URL}all/job/list/`, {
      params: {
        page,
        page_size: pageSize,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching all jobs:", error);
    throw error;
  }
};

export const searchProfiles = async (keywords, maxPages = 10) => {
  const response = await axios.get(
    `${API_BASE_URL}google/profile/search/?search_term=${encodeURIComponent(
      keywords
    )}&max_pages=${maxPages}`
  );
  return response.data;
};

export const downloadProfilesExcel = async (profiles) => {
  const response = await axios.post(
    `${API_BASE_URL}google/profile/download/`,
    profiles,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};




export const createJobSchedule = async (email, keywords, location, jobLimit, day, time) => {
  try {
    const response = await axios.post(`${API_BASE_URL}job/scheduler/save/`, {
      email,
      keywords,
      location,
      job_limit: jobLimit,
      day,
      time,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating job schedule:", error);
    throw error;
  }
};


export const getJobSchedules = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}job/scheduler/show/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching job schedules:", error);
    throw error;
  }
};


export const updateJobSchedule = async (id, email, updates) => {
  const response = await axios.patch(`${API_BASE_URL}job/scheduler/${id}/update/`, {
    email,
    ...updates,
  });
  return response.data;
};

export const deleteJobSchedule = async (id, email) => {
  const response = await axios.delete(`${API_BASE_URL}job/scheduler/${id}/delete/`, {
    params: { email }, // or send in body if preferred
  });
  return response.data;
};