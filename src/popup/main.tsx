import './index.css'

const loginPageBtn = document.getElementById("login-page") as HTMLButtonElement
const actionPageBtn = document.getElementById("action-page") as HTMLButtonElement
const loginDisplayWrapper = document.getElementById("login-display-wrapper") as HTMLDivElement

const connectBtn = document.getElementById("connectBtn") as HTMLButtonElement
const disconnectBtn = document.getElementById("disconnectBtn") as HTMLButtonElement
const statusEl = document.getElementById("status") as HTMLDivElement

const actionDisplayWrapper = document.getElementById("action-display-wrapper") as HTMLDivElement
const loginNeededLabels = document.getElementsByClassName("login-needed-label") as HTMLCollectionOf<HTMLLabelElement>
const loggerWrapper = document.getElementById("logger-wrapper") as HTMLDivElement
const loggerButton = document.getElementById("logger-button") as HTMLButtonElement
const unlogButton = document.getElementById("unlog-button") as HTMLButtonElement
const loggerResult = document.getElementById("logger-result") as HTMLLabelElement

const setStatusWrapper = document.getElementById("set-status-wrapper") as HTMLDivElement
const acceptStatusButton = document.getElementById("accept-status-button") as HTMLButtonElement
const declinedStatusButton = document.getElementById("declined-status-button") as HTMLButtonElement
const clearStatusButton = document.getElementById("clear-status-button") as HTMLButtonElement

function setStatus(text: string) {
  statusEl.textContent = text
}

async function refreshStatus() {
  const { googleConnected } = await chrome.storage.local.get("googleConnected")
  if (googleConnected) {
    setStatus("Connected");
    connectBtn.style.display = "none";
    disconnectBtn.style.display = "block";
    await chrome.action.setBadgeText({ text: "ON" })
    await chrome.action.setBadgeBackgroundColor({ color: [22, 163, 74, 255] })
    await chrome.runtime.sendMessage({ type: "SHEETS_SETUP" })
    loginDisplayWrapper.style.display = "none"
    actionDisplayWrapper.style.display = "flex"
    loginPageBtn.disabled = false
    actionPageBtn.disabled = true
    actionPageBtn.style.backgroundColor = "#1a1a1a"
    loginNeededLabels[0].style.display = "none"
    loginNeededLabels[1].style.display = "none"
    loginNeededLabels[2].style.display = "none"
    loggerWrapper.style.display = "flex"
  } else {
    setStatus("Disconnected");
    connectBtn.style.display = "block";
    disconnectBtn.style.display = "none";
    await chrome.action.setBadgeText({ text: "OFF" })
    await chrome.action.setBadgeBackgroundColor({ color: [255, 0, 0, 255] })
    loginNeededLabels[0].style.display = "block"
    loginNeededLabels[1].style.display = "block"
    loginNeededLabels[2].style.display = "block"
    loggerWrapper.style.display = "none"
  }
}

connectBtn?.addEventListener("click", async () => {
  setStatus("Connecting...")

  const response = await chrome.runtime.sendMessage({
    type: "GOOGLE_CONNECT"
  })

  if (response?.ok) {
    setStatus("Connected");
    connectBtn.style.display = "none";
    disconnectBtn.style.display = "block";

  } else {
    setStatus(`Failed: ${response?.error || "Unknown error"}`)
  }
  refreshStatus();
})

disconnectBtn?.addEventListener("click", async () => {
  setStatus("Disconnecting...")

  const response = await chrome.runtime.sendMessage({
    type: "GOOGLE_DISCONNECT"
  })

  if (response?.ok) {
    setStatus("Disconnected");
    connectBtn.style.display = "block";
    disconnectBtn.style.display = "none";
  } else {
    setStatus(`Failed: ${response?.error || "Unknown error"}`)
  }
  refreshStatus();
})

loginPageBtn?.addEventListener("click", () => {
  loginDisplayWrapper.style.display = "flex"
  actionDisplayWrapper.style.display = "none"
  loginPageBtn.disabled = true
  actionPageBtn.disabled = false
})

actionPageBtn?.addEventListener("click", () => {
  loginDisplayWrapper.style.display = "none"
  actionDisplayWrapper.style.display = "flex"
  loginPageBtn.disabled = false
  actionPageBtn.disabled = true
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
