/**
 * MCP Job Application Agent - Background Service Worker
 * 
 * Handles browser extension functionality including:
 * - Processing scraped job data
 * - Managing user profile data
 * - Communication with the MCP backend API
 */

// Configuration
const API_BASE_URL = 'http://localhost:8000/api'; // Change to your deployed API URL in production
const DASHBOARD_URL = 'http://localhost:3000/job-applications'; // Change to your deployed frontend URL

// Store for keeping scraped job data
let scrapedJobs = [];
let userProfile = null;

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'jobScraped') {
    handleScrapedJob(message.data);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'openDashboard') {
    chrome.tabs.create({ url: DASHBOARD_URL });
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'getProfile') {
    getUserProfile().then(profile => {
      sendResponse({ success: true, profile });
    });
    return true; // Keep the messaging channel open for async response
  }
});

// Process scraped job data
async function handleScrapedJob(jobData) {
  console.log('Job data received:', jobData);
  
  // Add to local storage
  scrapedJobs.push(jobData);
  await chrome.storage.local.set({ 'scrapedJobs': scrapedJobs });
  
  // Send notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Job Captured',
    message: `"${jobData.jobTitle}" at ${jobData.company} has been saved.`,
    buttons: [
      { title: 'View in Dashboard' }
    ]
  });
  
  // Try to send to backend if user is authenticated
  const token = await chrome.storage.local.get('authToken');
  if (token.authToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.authToken}`
        },
        body: JSON.stringify({
          job_title: jobData.jobTitle,
          company: jobData.company,
          job_description: jobData.description,
          job_url: jobData.jobUrl
        })
      });
      
      if (response.ok) {
        console.log('Job data sent to backend successfully');
      }
    } catch (error) {
      console.error('Failed to send job data to backend:', error);
    }
  }
}

// Get user profile data
async function getUserProfile() {
  // First check cache
  if (userProfile) return userProfile;
  
  // Then check storage
  const stored = await chrome.storage.local.get('userProfile');
  if (stored.userProfile) {
    userProfile = stored.userProfile;
    return userProfile;
  }
  
  // Try to get from API if user is authenticated
  const token = await chrome.storage.local.get('authToken');
  if (token.authToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token.authToken}`
        }
      });
      
      if (response.ok) {
        userProfile = await response.json();
        await chrome.storage.local.set({ 'userProfile': userProfile });
        return userProfile;
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  }
  
  return null;
}

// Initialize extension data
async function initialize() {
  const stored = await chrome.storage.local.get('scrapedJobs');
  if (stored.scrapedJobs) {
    scrapedJobs = stored.scrapedJobs;
  }
}

// Run initialization
initialize();
