/**
 * MCP Job Application Agent - Popup UI Controller
 */

// Default settings
const DEFAULT_SETTINGS = {
  enableAutofill: true,
  enableJobScraping: true,
  showNotifications: true,
  apiUrl: 'http://localhost:8000/api'
};

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const loginSection = document.getElementById('login-section');
const profileSection = document.getElementById('profile-section');
const loginForm = document.getElementById('login-form');
const recentJobsContainer = document.getElementById('recent-jobs');
const viewDashboardBtn = document.getElementById('view-dashboard');
const captureJobBtn = document.getElementById('capture-job');
const saveSettingsBtn = document.getElementById('save-settings');
const resetSettingsBtn = document.getElementById('reset-settings');

// Tab switching
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Remove active class from all tabs
    tabButtons.forEach(btn => btn.classList.remove('active', 'border-blue-500', 'text-blue-600'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked tab
    button.classList.add('active', 'border-blue-500', 'text-blue-600');
    const tabId = button.getAttribute('data-tab');
    document.getElementById(`${tabId}-tab`).classList.add('active');
  });
});

// Check authentication status
async function checkAuth() {
  const storage = await chrome.storage.local.get(['authToken', 'userProfile']);
  
  if (storage.authToken && storage.userProfile) {
    loginSection.classList.add('hidden');
    profileSection.classList.remove('hidden');
    renderProfile(storage.userProfile);
  } else {
    loginSection.classList.remove('hidden');
    profileSection.classList.add('hidden');
  }
}

// Render user profile
function renderProfile(profile) {
  profileSection.innerHTML = `
    <div class="bg-white shadow overflow-hidden rounded-md mb-4">
      <div class="px-4 py-4 sm:px-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">${profile.fullName || 'User'}</h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">${profile.email || ''}</p>
      </div>
      <div class="border-t border-gray-200">
        <dl>
          <div class="px-4 py-3 grid grid-cols-3 gap-4">
            <dt class="text-sm font-medium text-gray-500">Phone</dt>
            <dd class="text-sm text-gray-900 col-span-2">${profile.phone || 'Not set'}</dd>
          </div>
          <div class="px-4 py-3 grid grid-cols-3 gap-4 bg-gray-50">
            <dt class="text-sm font-medium text-gray-500">LinkedIn</dt>
            <dd class="text-sm text-gray-900 col-span-2">${profile.linkedIn || 'Not set'}</dd>
          </div>
          <div class="px-4 py-3 grid grid-cols-3 gap-4">
            <dt class="text-sm font-medium text-gray-500">Website</dt>
            <dd class="text-sm text-gray-900 col-span-2">${profile.website || 'Not set'}</dd>
          </div>
        </dl>
      </div>
    </div>
    <div class="flex justify-between">
      <button id="edit-profile" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-medium">
        Edit Profile
      </button>
      <button id="logout" class="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded text-sm font-medium">
        Sign Out
      </button>
    </div>
  `;
  
  // Add event listeners
  document.getElementById('edit-profile').addEventListener('click', () => {
    // Implement edit profile functionality
    chrome.tabs.create({ url: 'http://localhost:3000/profile' });
  });
  
  document.getElementById('logout').addEventListener('click', handleLogout);
}

// Handle logout
async function handleLogout() {
  await chrome.storage.local.remove(['authToken', 'userProfile']);
  checkAuth();
}

// Load recent jobs
async function loadRecentJobs() {
  const storage = await chrome.storage.local.get('scrapedJobs');
  const jobs = storage.scrapedJobs || [];
  
  if (jobs.length > 0) {
    recentJobsContainer.innerHTML = jobs.slice(0, 3).map(job => `
      <div class="bg-white shadow overflow-hidden rounded-md">
        <div class="px-4 py-4">
          <h3 class="text-sm font-medium text-gray-900 truncate">${job.jobTitle}</h3>
          <p class="mt-1 text-xs text-gray-500">${job.company}</p>
          <div class="mt-2 flex justify-between items-center">
            <span class="text-xs text-gray-500">${new Date(job.scrapedAt).toLocaleDateString()}</span>
            <button class="view-job-btn text-xs text-blue-600 hover:text-blue-800" data-url="${job.jobUrl}">View Job</button>
          </div>
        </div>
      </div>
    `).join('');
    
    // Add event listeners to job buttons
    document.querySelectorAll('.view-job-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const url = e.target.getAttribute('data-url');
        if (url) chrome.tabs.create({ url });
      });
    });
  }
}

// Load settings
async function loadSettings() {
  const storage = await chrome.storage.local.get('settings');
  const settings = storage.settings || DEFAULT_SETTINGS;
  
  document.getElementById('enable-autofill').checked = settings.enableAutofill;
  document.getElementById('enable-job-scraping').checked = settings.enableJobScraping;
  document.getElementById('show-notifications').checked = settings.showNotifications;
  document.getElementById('api-url').value = settings.apiUrl || '';
}

// Save settings
async function saveSettings() {
  const settings = {
    enableAutofill: document.getElementById('enable-autofill').checked,
    enableJobScraping: document.getElementById('enable-job-scraping').checked,
    showNotifications: document.getElementById('show-notifications').checked,
    apiUrl: document.getElementById('api-url').value.trim()
  };
  
  await chrome.storage.local.set({ settings });
  
  // Show saved notification
  const notification = document.createElement('div');
  notification.textContent = 'Settings saved!';
  notification.className = 'fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded shadow';
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 3000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadRecentJobs();
  loadSettings();
  
  // Login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Implement login functionality
    // This would connect to your backend API
  });
  
  // Dashboard button
  viewDashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });
  
  // Capture job button
  captureJobBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content-scripts/job-scraper.js']
    });
  });
  
  // Settings buttons
  saveSettingsBtn.addEventListener('click', saveSettings);
  resetSettingsBtn.addEventListener('click', () => {
    chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    loadSettings();
  });
});
