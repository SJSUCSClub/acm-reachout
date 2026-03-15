async function setConnectedBadge() {
  await chrome.action.setBadgeText({ text: "ON" })
  await chrome.action.setBadgeBackgroundColor({ color: [22, 163, 74, 255] })
}

async function clearConnectedBadge() {
  await chrome.action.setBadgeText({ text: "OFF" })
  await chrome.action.setBadgeBackgroundColor({ color: [255, 0, 0, 255] })
}

async function connectGoogle() {
  try {
    const result = await chrome.identity.getAuthToken({ interactive: true })
    const token = typeof result === "string" ? result : result?.token

    if (!token) {
      throw new Error("No token returned")
    }

    await chrome.storage.local.set({ googleConnected: true })
    await setConnectedBadge()

    return { ok: true, token }
  } catch (error: any) {
    await chrome.storage.local.set({ googleConnected: false })
    await clearConnectedBadge()
    return { ok: false, error: error?.message || String(error) }
  }
}

async function disconnectGoogle() {
  try {
    const result = await chrome.identity.getAuthToken({ interactive: false }).catch(() => null)
    const token = typeof result === "string" ? result : result?.token

    if (token) {
      await chrome.identity.removeCachedAuthToken({ token })

      await fetch(
        `https://accounts.google.com/o/oauth2/revoke?token=${encodeURIComponent(token)}`
      ).catch(() => {})
    }

    await chrome.storage.local.set({ googleConnected: false })
    await clearConnectedBadge()

    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error?.message || String(error) }
  }
}

async function checkGoogleConnection() {
  try {
    const result = await chrome.identity.getAuthToken({ interactive: false }).catch(() => null)
    const token = typeof result === "string" ? result : result?.token

    if (!token) {
      await chrome.storage.local.set({ googleConnected: false })
      await clearConnectedBadge()
      return { ok: true, connected: false }
    }

    await chrome.storage.local.set({ googleConnected: true })
    await setConnectedBadge()
    return { ok: true, connected: true }
  } catch (error: any) {
    await chrome.storage.local.set({ googleConnected: false })
    await clearConnectedBadge()
    return { ok: false, error: error?.message || String(error) }
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await clearConnectedBadge()
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GOOGLE_CONNECT") {
    connectGoogle().then(sendResponse).catch((error) => {
      sendResponse({ ok: false, error: String(error) })
    })
    return true
  }

  if (message.type === "GOOGLE_DISCONNECT") {
    disconnectGoogle().then(sendResponse).catch((error) => {
      sendResponse({ ok: false, error: String(error) })
    })
    return true
  }

  if (message.type === "GOOGLE_CHECK") {
    checkGoogleConnection().then(sendResponse).catch((error) => {
      sendResponse({ ok: false, error: String(error) })
    })
    return true
  }
})