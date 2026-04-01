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
const loggerResult = document.getElementById("logger-result") as HTMLLabelElement

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
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // There is only one active tab in the current window, so we access tabs[0]
    const activeTab = tabs[0];
    const currentUrl = activeTab.url;

    if (currentUrl == null) {
      loggerResult.textContent = "Error: No active tab URL";
      loggerResult.style.display = "flex";
    }
    else if (currentUrl.startsWith("https://www.linkedin.com/in/") || currentUrl.startsWith("linkedin.com/in/")) {
      loggerResult.textContent = "Logged: " + currentUrl.replace("https://www.linkedin.com/in/", "") as string;
      loggerResult.style.display = "flex";
    }
    else {
      loggerResult.textContent = "Error: Not a LinkedIn profile page";
      loggerResult.style.display = "flex";
    }
  });
})


refreshStatus()
