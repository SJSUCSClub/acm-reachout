import './index.css' 


const loginDropdownBtn = document.getElementById("login-dropdown-button") as HTMLButtonElement
const loginDisplayWrapper = document.getElementById("login-display-wrapper") as HTMLDivElement
const connectBtn = document.getElementById("connectBtn") as HTMLButtonElement
const disconnectBtn = document.getElementById("disconnectBtn") as HTMLButtonElement
const connectionStatus = document.getElementById("connection-status") as HTMLDivElement
const loginNeededLabels = document.getElementsByClassName("login-needed-label") as HTMLCollectionOf<HTMLLabelElement>

const loggerDropdownBtn = document.getElementById("logger-dropdown-button") as HTMLButtonElement
const loggerDisplayWrapper = document.getElementById("logger-display-wrapper") as HTMLDivElement
const loggerButton = document.getElementById("logger-button") as HTMLButtonElement
const unlogButton = document.getElementById("unlog-button") as HTMLButtonElement
const loggerResult = document.getElementById("logger-result") as HTMLLabelElement

const statusDropdownBtn = document.getElementById("status-dropdown-button") as HTMLButtonElement
const statusDisplayWrapper = document.getElementById("status-display-wrapper") as HTMLDivElement
const acceptStatusButton = document.getElementById("accept-status-button") as HTMLButtonElement
const declinedStatusButton = document.getElementById("declined-status-button") as HTMLButtonElement
const clearStatusButton = document.getElementById("clear-status-button") as HTMLButtonElement
const statusResult = document.getElementById("status-result") as HTMLLabelElement

const filterDropdownBtn = document.getElementById("filter-dropdown-button") as HTMLButtonElement
const filterDisplayWrapper = document.getElementById("filter-display-wrapper") as HTMLDivElement
const filterStudentsCheckbox = document.getElementById("filter-out-students-checkbox") as HTMLInputElement
const requireAlumniCheckbox = document.getElementById("require-alumni-checkbox") as HTMLInputElement
const markLoggedCheckbox = document.getElementById("mark-logged-checkbox") as HTMLInputElement
const filterResult = document.getElementById("filter-result") as HTMLLabelElement


function setConnStatus(text: string) {
  connectionStatus.textContent = text
}

function setStatusResult(text: string) {
  statusResult.textContent = text;
  statusResult.style.display = "block";
}

function clearStatusResult() {
  statusResult.style.display = "none";
}

function setLoggerResult(text: string) {
  loggerResult.textContent = text;
  loggerResult.style.display = "flex";
}

function clearLoggerResult() {
  loggerResult.style.display = "none";
}

function setFilterResult(text: string) {
  filterResult.textContent = text;
  filterResult.style.display = "block";
}

function clearFilterResult() {
  filterResult.style.display = "none";
}


async function refreshFilterUI() {
  const response = await chrome.runtime.sendMessage({ type: "GET_FILTER_STATUS" })

  if (!response?.ok) {
    filterStudentsCheckbox.checked = false;
    requireAlumniCheckbox.checked = false;
    markLoggedCheckbox.checked = false;
    setFilterResult(`Error getting filter status: ${response?.error || "Unknown error"}`);
    return;
  }

  filterStudentsCheckbox.checked = response.filter_out_students;
  requireAlumniCheckbox.checked = response.require_alumni;
  markLoggedCheckbox.checked = response.mark_logged;

}


async function getActiveTabId(): Promise<number | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  return tabs[0]?.id ?? null
}


async function updateFilterStatus() {
  const filter_out_students = filterStudentsCheckbox.checked;
  const require_alumni = requireAlumniCheckbox.checked;
  const mark_logged = markLoggedCheckbox.checked;
  const response = await chrome.runtime.sendMessage({ 
    type: "UPDATE_FILTER_STATUS", 
    filter_out_students: filter_out_students, 
    require_alumni: require_alumni, 
    mark_logged: mark_logged 
  })
  if (!response?.ok) {
    setFilterResult(`Error updating filter status: ${response?.error || "Unknown error"}`);
    return;
  }

  const tabId = await getActiveTabId()
  if (!tabId) {
    setFilterResult("No active tab to apply filter");
    return;
  }
  chrome.tabs.sendMessage(tabId, { type: "APPLY_FILTER1" }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn("No receiving content script:", chrome.runtime.lastError.message);
      return;
    }
    console.log("Filter applied:", response);
  });
}

filterStudentsCheckbox?.addEventListener("change", async () => {
  updateFilterStatus();
})

requireAlumniCheckbox?.addEventListener("change", async () => {
  updateFilterStatus();
})

markLoggedCheckbox?.addEventListener("change", async () => {
  updateFilterStatus();
})




loginDropdownBtn?.addEventListener("click", () => {
  if (loginDisplayWrapper.style.display === "none") {
    showLoginDisplay();
  } else {
    hideLoginDisplay();
  }
})
function showLoginDisplay() {
    loginDisplayWrapper.style.display = "flex"
    loginDropdownBtn.style.borderRadius = "8px 8px 0px 0px"
}
function hideLoginDisplay() {
  loginDisplayWrapper.style.display = "none";
  loginDropdownBtn.style.borderRadius = "8px 8px 8px 8px"
}

loggerDropdownBtn?.addEventListener("click", () => {
  if (loggerDisplayWrapper.style.display === "none" && connectionStatus.textContent === "Connected") {
    showLoggerDisplay();
  } else {
    hideLoggerDisplay();
  }
})
function showLoggerDisplay() {
  loggerDisplayWrapper.style.display = "flex"
  loggerDropdownBtn.style.borderRadius = "8px 8px 0px 0px"
}
function hideLoggerDisplay() {
  loggerDisplayWrapper.style.display = "none";
  loggerDropdownBtn.style.borderRadius = "8px 8px 8px 8px"
}

filterDropdownBtn?.addEventListener("click", () => {
  if (filterDisplayWrapper.style.display === "none" && connectionStatus.textContent === "Connected") {
    showFilterDisplay();
  } else {
    hideFilterDisplay();
  }
})

function showFilterDisplay() {
  filterDisplayWrapper.style.display = "flex"
  filterDropdownBtn.style.borderRadius = "8px 8px 0px 0px"
}
function hideFilterDisplay() {
  filterDisplayWrapper.style.display = "none";
  filterDropdownBtn.style.borderRadius = "8px 8px 8px 8px"
}


statusDropdownBtn?.addEventListener("click", () => {
  if (statusDisplayWrapper.style.display === "none" && connectionStatus.textContent === "Connected") {
    showStatusDisplay();
  } else {
    hideStatusDisplay();
  }
})
function showStatusDisplay() {
  statusDisplayWrapper.style.display = "flex"
  statusDropdownBtn.style.borderRadius = "8px 8px 0px 0px"
}
function hideStatusDisplay() {
  statusDisplayWrapper.style.display = "none";
  statusDropdownBtn.style.borderRadius = "8px 8px 8px 8px"
}


async function refreshStatus() {
  const googleConnected = await chrome.runtime.sendMessage({
    type: "GOOGLE_CHECK"
  })
  if (googleConnected.ok && googleConnected.connected) {
    connectionStatus.textContent = "Connected";
    connectBtn.style.display = "none";
    disconnectBtn.style.display = "block";
    await chrome.action.setBadgeText({ text: "ON" })
    await chrome.action.setBadgeBackgroundColor({ color: [22, 163, 74, 255] })
    await chrome.runtime.sendMessage({ type: "SHEETS_SETUP" })
    hideLoginDisplay();
    showLoggerDisplay();
    showStatusDisplay();
    loginNeededLabels[0].style.display = "none"
    loginNeededLabels[1].style.display = "none"
  } else {
    connectionStatus.textContent = "Disconnected";
    connectBtn.style.display = "block";
    disconnectBtn.style.display = "none";
    await chrome.action.setBadgeText({ text: "OFF" })
    await chrome.action.setBadgeBackgroundColor({ color: [255, 0, 0, 255] })
    loginNeededLabels[0].style.display = "block"
    loginNeededLabels[1].style.display = "block"
    showLoginDisplay();
    hideLoggerDisplay();
    hideStatusDisplay();
  }
}


connectBtn?.addEventListener("click", async () => {
  connectionStatus.textContent = "Connecting...";

  const response = await chrome.runtime.sendMessage({
    type: "GOOGLE_CONNECT"
  })

  if (response?.ok) {
    connectionStatus.textContent = "Connected";
  } else {
    connectionStatus.textContent = `Failed: ${response?.error || "Unknown error"}`;
  }
  refreshStatus();
})

disconnectBtn?.addEventListener("click", async () => {
  connectionStatus.textContent = "Disconnecting..."

  const response = await chrome.runtime.sendMessage({
    type: "GOOGLE_DISCONNECT"
  })

  if (response?.ok) {
    connectionStatus.textContent = "Disconnected";
  } else {
    connectionStatus.textContent = `Failed: ${response?.error || "Unknown error"}`;
  }
  refreshStatus();
})

loggerButton?.addEventListener("click", async () => {
  const tab = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tab[0];
  const currentUrl = activeTab.url; //URL of the active tab

  //Check if URL is a LinkedIn profile page
  if (currentUrl == null) {
    loggerResult.textContent = "Error: No active tab URL";
    loggerResult.style.display = "flex";
    return
  }
  else if (currentUrl.startsWith("https://www.linkedin.com/in/") || currentUrl.startsWith("linkedin.com/in/")) {
  }
  else {
    loggerResult.textContent = "Error: Not a LinkedIn profile page";
    loggerResult.style.display = "flex";
    return
  }


  //Getting Profile Name
  const nameFinderResult = await chrome.scripting.executeScript({
    target: { tabId: activeTab.id as number },
    func: () => {
      const element = document.querySelectorAll('h2')[1] as HTMLElement | undefined;
      return element ? element.innerText : "Profile Name HTML element not found";
    }
  });

  const profileName = nameFinderResult[0]?.result ?? "Profile Name HTML element not found" ; //Name of the LinkedIn profile owner

  //log it to google sheets
  const logResult = await chrome.runtime.sendMessage({
    type: "LOG_PROFILE",
    name: profileName,
    link: currentUrl,
    status: null,
  })

  if (!logResult?.ok) {
    loggerResult.textContent = `${logResult?.error || "Error logging profile: Unknown error"}`;
    loggerResult.style.display = "flex";
    return
  }

  loggerResult.textContent = "Logged: " + profileName;
  loggerResult.style.display = "flex";
  return
})

unlogButton?.addEventListener("click", async () => {
  const tab = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tab[0];
  const currentUrl = activeTab.url;

  //Check if URL is a LinkedIn profile page
  if (currentUrl == null) {
    loggerResult.textContent = "Error: No active tab URL";
    loggerResult.style.display = "flex";
    return
  }
  else if (currentUrl.startsWith("https://www.linkedin.com/in/") || currentUrl.startsWith("linkedin.com/in/")) {
  }
  else {
    loggerResult.textContent = "Error: Not a LinkedIn profile page";
    loggerResult.style.display = "flex";
    return
  }

  //Getting Profile Name
  const nameFinderResult = await chrome.scripting.executeScript({
    target: { tabId: activeTab.id as number },
    func: () => {
      const element = document.querySelectorAll('h2')[1] as HTMLElement | undefined;
      return element ? element.innerText : "Profile Name HTML element not found";
    }
  });

  const profileName = nameFinderResult[0]?.result ?? "Error: Profile Name HTML element not found" ;
  if (profileName.startsWith("Error:")) {
    loggerResult.textContent = profileName;
    loggerResult.style.display = "flex";
    return
  }

  const logResult = await chrome.runtime.sendMessage({
    type: "SHEETS_DELETE_ROW",
    name: profileName,
    link: currentUrl,
  })

  if (!logResult?.ok) {
    loggerResult.textContent = `${logResult?.error || "Error unlogging profile: Unknown error"}`;
    loggerResult.style.display = "flex";
    return
  }

  loggerResult.textContent = "Unlogged: " + profileName;
  loggerResult.style.display = "flex";
  return

})


async function changeStatus(newStatus: string) {
  setStatusResult("Changing status...");

  const tab = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tab[0];
  if (activeTab.url == null || (!activeTab.url.startsWith("https://www.linkedin.com/messaging/thread"))) {
    setStatusResult("Error: No active tab URL or not a LinkedIn messaging thread page");
    return
  }

  let profileInfo;
  try {
    profileInfo = await MessengerProfileFinder(activeTab.id as number)
  } catch (error) {
    setStatusResult(`Error: ${(error as Error).message}`);
    return
  }

  const logResult = await chrome.runtime.sendMessage({
    type: "SHEETS_SET_STATUS",
    name: profileInfo.name,
    link: profileInfo.url,
    status: newStatus
  })

  if (!logResult?.ok) {
    setStatusResult(`${logResult?.error || "Error setting status: Unknown error"}`);
    return
  }

  if (newStatus === "") {
    newStatus = "CLEARED";
  }
  setStatusResult(profileInfo.name + ": " + newStatus);
  return
}


async function MessengerProfileFinder(activeTabId: number):  Promise<{url: string, name: string}> {
  
  const result = await chrome.scripting.executeScript({
    target: { tabId: activeTabId },
    func: async () => {
      const element = document.getElementsByClassName('msg-thread__link-to-profile')[0] as HTMLElement | undefined;
      if (!element) {
        throw new Error("Messenger Profile Card HTML element not found");
      }

      let profileURL = element.getAttribute('href');
      if (!profileURL) {
        throw new Error("Profile URL not found in Messenger Profile Card");
      }
      if (!profileURL.includes("linkedin.com")) {
        throw new Error("Profile URL in Messenger Profile Card is not a LinkedIn URL");
      }
      const response = await chrome.runtime.sendMessage({ type: "GET_REDIRECT_URL", url: profileURL });
      if (!response?.ok || !response.finalUrl) {
        throw new Error("Failed to get redirect URL: " + (response?.error || "Unknown error"));
      }
      profileURL = response.finalUrl as string;

      let profileName = element.getAttribute('title');
      if (!profileName) {
        throw new Error("Profile Name not found in Messenger Profile Card");
      }
      profileName = profileName.replace("Open ", "").trim();
      profileName = profileName.substring(0, profileName.length - "'s Profile".length).trim();

      return { url: profileURL, name: profileName };
    }
  });

  if (result[0]?.result == null) {
    throw new Error("Getting Profile Information from Messenger Profile Card failed");
  }
  if (!result[0]?.result.url) {
    throw new Error("Profile URL not found in Messenger Profile Card");
  }
  if (!result[0]?.result.name) {
    throw new Error("Profile Name not found in Messenger Profile Card");
  }
  return {url: result[0].result.url as string, name: result[0].result.name as string};
} 

acceptStatusButton?.addEventListener("click", async () => {
  const status = "ACCEPTED"
  changeStatus(status);

})

declinedStatusButton?.addEventListener("click", async () => {
  const status = "DECLINED"
  changeStatus(status);

})

clearStatusButton?.addEventListener("click", async () => {
  const status = ""
  changeStatus(status);

})

refreshStatus()
refreshFilterUI()