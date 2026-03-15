import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const connectBtn = document.getElementById("connectBtn") as HTMLButtonElement
const disconnectBtn = document.getElementById("disconnectBtn") as HTMLButtonElement
const statusEl = document.getElementById("status") as HTMLDivElement

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
  } else {
    setStatus("Disconnected");
    connectBtn.style.display = "block";
    disconnectBtn.style.display = "none";
    await chrome.action.setBadgeText({ text: "OFF" })
    await chrome.action.setBadgeBackgroundColor({ color: [255, 0, 0, 255] })
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
})

refreshStatus()
