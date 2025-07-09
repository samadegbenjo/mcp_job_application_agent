/**
 * MCP Job Application Agent - Form Filler
 * 
 * This content script automatically fills out job application forms on supported job sites:
 * - LinkedIn
 * - Indeed
 * - Workday
 */

// Form field mappings for different sites
const FORM_FIELD_MAPPINGS = {
  'linkedin.com': {
    name: 'input[name*="name"], input[placeholder*="name"], input[aria-label*="name"]',
    email: 'input[type="email"], input[name*="email"], input[placeholder*="email"]',
    phone: 'input[type="tel"], input[name*="phone"], input[placeholder*="phone"]',
    resume: 'input[type="file"], input[name*="resume"], input[accept*="pdf"]',
    coverLetter: 'textarea[name*="cover"], textarea[placeholder*="cover"]',
    linkedIn: 'input[name*="linkedin"], input[placeholder*="linkedin"]',
    website: 'input[name*="website"], input[placeholder*="website"]'
  },
  'indeed.com': {
    name: '#input-applicant\\.name',
    email: '#input-applicant\\.email',
    phone: '#input-applicant\\.phoneNumber',
    resume: '#resume-upload-input',
    coverLetter: '#input-applicant\\.coverLetter, .cover-letter-input',
    linkedIn: 'input[name="linkedin"], input[placeholder*="LinkedIn"]',
    website: 'input[name="website"], input[placeholder*="Website"]'
  },
  'workday.com': {
    name: 'input[data-automation-id*="name"]',
    email: 'input[data-automation-id*="email"]',
    phone: 'input[data-automation-id*="phone"]',
    resume: 'input[data-automation-id*="file-upload-input"]',
    coverLetter: 'textarea[data-automation-id*="coverLetter"]',
    linkedIn: 'input[data-automation-id*="linkedin"]',
    website: 'input[data-automation-id*="website"]'
  }
};

// Helper function to get the mapping for the current site
function getSiteMapping() {
  const hostname = window.location.hostname;
  for (const site in FORM_FIELD_MAPPINGS) {
    if (hostname.includes(site)) {
      return FORM_FIELD_MAPPINGS[site];
    }
  }
  return null;
}

// Fill form with user data
function fillForm(userData) {
  const mapping = getSiteMapping();
  if (!mapping) {
    console.error('Unsupported job application site');
    return;
  }

  console.log('Attempting to fill form with user data');

  // Helper to fill a field
  const fillField = (selector, value) => {
    if (!value) return;
    
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      // Handle different input types
      if (el.tagName === 'INPUT') {
        if (el.type === 'file') {
          // File inputs require special handling - can't set value directly
          console.log('File input detected, skipping automatic fill');
        } else {
          el.value = value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else if (el.tagName === 'TEXTAREA') {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  };

  // Fill each field
  if (userData.fullName) fillField(mapping.name, userData.fullName);
  if (userData.email) fillField(mapping.email, userData.email);
  if (userData.phone) fillField(mapping.phone, userData.phone);
  if (userData.coverLetter) fillField(mapping.coverLetter, userData.coverLetter);
  if (userData.linkedIn) fillField(mapping.linkedIn, userData.linkedIn);
  if (userData.website) fillField(mapping.website, userData.website);

  // Show success notification to the user
  showNotification();
}

// Create notification UI to show form fill success
function showNotification() {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #f0f9ff;
    border: 1px solid #3182ce;
    border-left: 4px solid #3182ce;
    border-radius: 4px;
    padding: 16px;
    max-width: 350px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: start; gap: 12px;">
      <div>
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">MCP Job Application Agent</h3>
        <p style="margin: 0 0 12px 0; font-size: 14px;">Form fields have been automatically filled with your profile data.</p>
        <div style="display: flex; gap: 8px;">
          <button id="mcp-open-settings" style="background: #3182ce; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 14px;">Open Settings</button>
          <button id="mcp-close-notification" style="background: #e2e8f0; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 14px;">Dismiss</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Handle button clicks
  document.getElementById('mcp-open-settings').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
    notification.remove();
  });
  
  document.getElementById('mcp-close-notification').addEventListener('click', () => {
    notification.remove();
  });
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.remove();
    }
  }, 5000);
}

// Run the script
(function() {
  // Check if we're on a job application form page
  const mapping = getSiteMapping();
  if (!mapping) return;
  
  // Wait for the page to fully load
  window.addEventListener('load', () => {
    setTimeout(() => {
      // Request user profile data from background script
      chrome.runtime.sendMessage({ action: 'getProfile' }, (response) => {
        if (response && response.success && response.profile) {
          fillForm(response.profile);
        } else {
          console.log('No profile data available or user not logged in');
        }
      });
    }, 1000); // Small delay to ensure form is fully loaded
  });
})();
