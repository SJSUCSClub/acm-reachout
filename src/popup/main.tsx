import './index.css'

const loginPageBtn = document.getElementById("login-page") as HTMLButtonElement
const actionPageBtn = document.getElementById("action-page") as HTMLButtonElement
const loginDisplayWrapper = document.getElementById("login-display-wrapper") as HTMLDivElement

const connectBtn = document.getElementById("connectBtn") as HTMLButtonElement
const disconnectBtn = document.getElementById("disconnectBtn") as HTMLButtonElement
const connectionStatus = document.getElementById("status") as HTMLDivElement

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
const statusResult = document.getElementById("status-result") as HTMLLabelElement

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

async function refreshStatus() {
  const { googleConnected } = await chrome.storage.local.get("googleConnected")
  if (googleConnected) {
    setConnStatus("Connected");
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
    setStatusWrapper.style.display = "block"
  } else {
    setConnStatus("Disconnected");
    connectBtn.style.display = "block";
    disconnectBtn.style.display = "none";
    await chrome.action.setBadgeText({ text: "OFF" })
    await chrome.action.setBadgeBackgroundColor({ color: [255, 0, 0, 255] })
    loginNeededLabels[0].style.display = "block"
    loginNeededLabels[1].style.display = "block"
    loginNeededLabels[2].style.display = "block"
    loggerWrapper.style.display = "none"
    setStatusWrapper.style.display = "none"
  }
}

connectBtn?.addEventListener("click", async () => {
  setConnStatus("Connecting...")

  const response = await chrome.runtime.sendMessage({
    type: "GOOGLE_CONNECT"
  })

  if (response?.ok) {
    setConnStatus("Connected");
    connectBtn.style.display = "none";
    disconnectBtn.style.display = "block";

  } else {
    setConnStatus(`Failed: ${response?.error || "Unknown error"}`)
  }
  refreshStatus();
})

disconnectBtn?.addEventListener("click", async () => {
  setConnStatus("Disconnecting...")

  const response = await chrome.runtime.sendMessage({
    type: "GOOGLE_DISCONNECT"
  })

  if (response?.ok) {
    setConnStatus("Disconnected");
    connectBtn.style.display = "block";
    disconnectBtn.style.display = "none";
  } else {
    setConnStatus(`Failed: ${response?.error || "Unknown error"}`)
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

async function profileNameFinder(activeTabId: number): Promise<string>{
  const result = await chrome.scripting.executeScript({
    target: { tabId: activeTabId },
    func: () => {
      const element = document.querySelectorAll('h2')[1] as HTMLElement | undefined;
      return element ? element.innerText : "Profile Name HTML element not found";
    }
  });
  if (result[0]?.result == null || result[0]?.result === "Profile Name HTML element not found") {
    throw new Error("Profile Name HTML element not found");
  }
  return result[0]?.result as string;
}

loggerButton?.addEventListener("click", async () => {
  const tab = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tab[0];
  const currentUrl = activeTab.url; //URL of the active tab

  //Check if URL is a LinkedIn profile page
  if (currentUrl == null) {
    setLoggerResult("Error: No active tab URL");
    return
  }
  else if (currentUrl.startsWith("https://www.linkedin.com/in/") || currentUrl.startsWith("linkedin.com/in/")) {
  }
  else {
    setLoggerResult("Error: Not a LinkedIn profile page");
    return
  }


  //Getting Profile Name
  let profileName;
  try {
    profileName = await profileNameFinder(activeTab.id as number)
  } catch (error) {
    setLoggerResult(`Error: ${(error as Error).message}`);
    return
  }

  //log it to google sheets
  const logResult = await chrome.runtime.sendMessage({
    type: "LOG_PROFILE",
    name: profileName,
    link: currentUrl,
    status: null,
  })

  if (!logResult?.ok) {
    setLoggerResult(`${logResult?.error || "Error logging profile: Unknown error"}`);
    return
  }

  setLoggerResult("Logged: " + profileName);
  return
})

unlogButton?.addEventListener("click", async () => {
  const tab = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tab[0];
  const currentUrl = activeTab.url;

  //Check if URL is a LinkedIn profile page
  if (currentUrl == null) {
    setLoggerResult("Error: No active tab URL");
    return
  }
  else if (currentUrl.startsWith("https://www.linkedin.com/in/") || currentUrl.startsWith("linkedin.com/in/")) {
  }
  else {
    setLoggerResult("Error: Not a LinkedIn profile page");
    return
  }

  //Getting Profile Name
  let profileName;
  try {
    profileName = await profileNameFinder(activeTab.id as number)
  } catch (error) {
    setLoggerResult(`Error: ${(error as Error).message}`);
    return
  }

  const logResult = await chrome.runtime.sendMessage({
    type: "SHEETS_DELETE_ROW",
    name: profileName,
    link: currentUrl,
  })

  if (!logResult?.ok) {
    setLoggerResult(`${logResult?.error || "Error unlogging profile: Unknown error"}`);
    return
  }

  setLoggerResult("Unlogged: " + profileName);
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
