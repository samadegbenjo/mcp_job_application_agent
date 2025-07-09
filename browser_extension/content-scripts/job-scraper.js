/**
 * MCP Job Application Agent - Job Description Scraper
 * 
 * This content script scrapes job descriptions from supported job sites:
 * - LinkedIn
 * - Indeed
 * - Workday
 */

// Configuration for different job sites
const SITE_CONFIGS = {
  'linkedin.com': {
    jobTitleSelector: '.job-details-jobs-unified-top-card__job-title',
    companySelector: '.job-details-jobs-unified-top-card__company-name',
    descriptionSelector: '.jobs-description__content',
  },
  'indeed.com': {
    jobTitleSelector: 'h1.jobsearch-JobInfoHeader-title',
    companySelector: '[data-testid="inlineCompanyName"]',
    descriptionSelector: '#jobDescriptionText',
  },
  'workday.com': {
    jobTitleSelector: '.css-1vbvugv',
    companySelector: '.css-9geu3q',
    descriptionSelector: '.css-1sgf10q',
  }
};

// Helper function to get current site configuration
function getSiteConfig() {
  const hostname = window.location.hostname;
  for (const site in SITE_CONFIGS) {
    if (hostname.includes(site)) {
      return SITE_CONFIGS[site];
    }
  }
  return null;
}

// Scrape job description from the current page
function scrapeJobDescription() {
  const siteConfig = getSiteConfig();
  if (!siteConfig) {
    console.error('Unsupported job site');
    return null;
  }

  try {
    const jobTitle = document.querySelector(siteConfig.jobTitleSelector)?.textContent.trim();
    const company = document.querySelector(siteConfig.companySelector)?.textContent.trim();
    const description = document.querySelector(siteConfig.descriptionSelector)?.textContent.trim();
    const jobUrl = window.location.href;

    if (!jobTitle || !description) {
      console.error('Failed to extract job information');
      return null;
    }

    return {
      jobTitle,
      company,
      description,
      jobUrl,
      scrapedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error scraping job description:', error);
    return null;
  }
}

// Initialize a MutationObserver to detect job content loading
function initializeObserver() {
  const siteConfig = getSiteConfig();
  if (!siteConfig) return;

  const observer = new MutationObserver((mutations) => {
    const descriptionElement = document.querySelector(siteConfig.descriptionSelector);
    if (descriptionElement) {
      const jobData = scrapeJobDescription();
      if (jobData) {
        sendToExtension(jobData);
        observer.disconnect();
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });
}

// Send scraped data to the extension
function sendToExtension(jobData) {
  // Create job scraping notification UI
  createNotification(jobData);
  
  // Send message to background script
  chrome.runtime.sendMessage({
    action: 'jobScraped',
    data: jobData
  });
}

// Create notification UI for user
function createNotification(jobData) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
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
        <p style="margin: 0 0 12px 0; font-size: 14px;">Job details for "${jobData.jobTitle}" at ${jobData.company} have been captured.</p>
        <div style="display: flex; gap: 8px;">
          <button id="mcp-view-job" style="background: #3182ce; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 14px;">View in Dashboard</button>
          <button id="mcp-close-notification" style="background: #e2e8f0; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 14px;">Dismiss</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Handle button clicks
  document.getElementById('mcp-view-job').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openDashboard' });
    notification.remove();
  });
  
  document.getElementById('mcp-close-notification').addEventListener('click', () => {
    notification.remove();
  });
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.remove();
    }
  }, 10000);
}

// Run the script
(function() {
  // Initial attempt to scrape immediately
  const jobData = scrapeJobDescription();
  if (jobData) {
    sendToExtension(jobData);
  } else {
    // If initial scrape fails, set up observer to wait for content to load
    initializeObserver();
  }
})();
