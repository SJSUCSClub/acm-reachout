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
  const { googleConnected } = await chrome.storage.local.get("googleConnected")
  if (googleConnected) {
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

refreshStatus()