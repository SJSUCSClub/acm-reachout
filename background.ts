let connectedToken: string | null = null;

const SHEET_TITLE = "Sheet1";

async function getAccessToken(interactive = false): Promise<string> {
  const result = await chrome.identity.getAuthToken({ interactive }).catch(() => null);
  const token = typeof result === "string" ? result : result?.token;

  if (!token) {
    throw new Error("No auth token available");
  }

  connectedToken = token;
  return token;
}

async function connectToApi() {
  const result = await chrome.storage.local.get(["googleConnected"]);
  if (result.googleConnected !== true) {
    throw new Error("Google not connected");
  }

  await getAccessToken(false);
}

async function getSpreadsheetId() {
  const result = await chrome.storage.local.get(["spreadsheetId"]);
  return result.spreadsheetId;
}

async function getSheetId() {
  const result = await chrome.storage.local.get(["sheetId"]);
  return result.sheetId;
}

async function checkAPIConnection() {
  if (!connectedToken || (await getSpreadsheetId()) == null || (await getSheetId()) == null) {
    throw new Error("Google API not connected");
  }
}

async function apiFetch(path: string, init?: RequestInit): Promise<any> {
  const token = connectedToken ?? await getAccessToken(false);

  const res = await fetch(`https://sheets.googleapis.com/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets API error ${res.status}: ${text}`);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

async function createSheetInDrive(): Promise<boolean> {
  if ((await getSpreadsheetId()) != null || (await getSheetId()) != null) {
    throw new Error("Spreadsheet already exists");
  }

  const data = await apiFetch("/spreadsheets", {
    method: "POST",
    body: JSON.stringify({
      properties: {
        title: "acm-linkedin-reachout-log",
      },
      sheets: [
        { properties: { title: SHEET_TITLE } }
      ],
    }),
  });

  const spreadsheetId = data.spreadsheetId;
  const sheetId = data.sheets?.[0]?.properties?.sheetId;

  if (!spreadsheetId || sheetId == null) {
    throw new Error("Failed to create spreadsheet or retrieve IDs");
  }

  await chrome.storage.local.set({ spreadsheetId, sheetId });
    await apiFetch(
    `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(`${SHEET_TITLE}!A:D`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({
        values: [["{LogTime}", "{NAME}", "{LINK}", "{StatusSetTime}", "{STATUS}"]],
      }),
    }
  );

  return true;
}

export async function setUp() {
  await connectToApi();

  if ((await getSpreadsheetId()) == null || (await getSheetId()) == null) {
    await createSheetInDrive();
  }
}

export async function appendRowInSheet(name: string, link: string, status?: string) {
  await checkAPIConnection();

  const spreadsheetId = await getSpreadsheetId() as string | undefined;
  if (!spreadsheetId) {
    throw new Error("Missing spreadsheetId");
  }

  const alreadyLoggedRow = await searchForProfile(name, link);
  if (alreadyLoggedRow !== -1) {
    throw new Error(`Profile "${name}" already logged in row ${alreadyLoggedRow}`);
  }

  const safeStatus = status ?? "";
  let safeStatusTime = "=Now()";
  if (safeStatus === "") {
    safeStatusTime = "";
  }

  await apiFetch(
    `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(`${SHEET_TITLE}!A:D`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({
        values: [["=NOW()", name, link, safeStatusTime, safeStatus]],
      }),
    }
  );
}

export async function deleteSingleRow(row: number) {
  await checkAPIConnection();

  if (row < 1) {
    throw new Error("Row must be greater than or equal to 1");
  }

  await deleteRows(row, row);
}

async function deleteRows(rowStart: number, rowEnd: number) {
  const spreadsheetId = await getSpreadsheetId() as string | undefined;
  const sheetId = await getSheetId();

  if (!spreadsheetId || sheetId == null) {
    throw new Error("Missing spreadsheet info");
  }

  await apiFetch(`/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowStart - 1,
              endIndex: rowEnd,
            },
          },
        },
      ],
    }),
  });
}

export async function searchInColumn(query: string, column: string): Promise<number> {
  column = column.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(column)) {
    throw new Error("Invalid column");
  }

  await checkAPIConnection();

  const spreadsheetId = await getSpreadsheetId() as string | undefined;
  if (!spreadsheetId) {
    throw new Error("Missing spreadsheetId");
  }

  const range = `${SHEET_TITLE}!${column}:${column}`;

  const data = await apiFetch(
    `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`
  );

  const values: string[][] = data.values || [];

  for (let i = 0; i < values.length; i++) {
    if (values[i]?.[0] === query) {
      return i + 1;
    }
  }

  return -1;
}

export async function getColumns(leftBound: string, rightBound: string): Promise<string[][]> {
  leftBound = leftBound.trim().toUpperCase();
  rightBound = rightBound.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(leftBound) || !/^[A-Z]+$/.test(rightBound)) {
    throw new Error("Invalid column");
  }

  await checkAPIConnection();

  const spreadsheetId = await getSpreadsheetId() as string | undefined;
  if (!spreadsheetId) {
    throw new Error("Missing spreadsheetId");
  }

  const range = `${SHEET_TITLE}!${leftBound}:${rightBound}`;

  const data = await apiFetch(
    `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`
  );

  const values: string[][] = data.values || [];

  return values;
}

export async function searchForProfile(name: string, link: string): Promise<number> {
  await checkAPIConnection();

  const spreadsheetId = await getSpreadsheetId() as string | undefined;
  if (!spreadsheetId) {
    throw new Error("Missing spreadsheetId");
  }

  const nameColumn = await apiFetch(
    `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(SHEET_TITLE + "!B:B")}`
  );
  const nameValues: string[][] = nameColumn.values || [];

  const linkColumn = await apiFetch(
    `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(SHEET_TITLE + "!C:C")}`
  );
  const linkValues: string[][] = linkColumn.values || [];

  for (let i = 0; i < nameValues.length; i++) {
    if (nameValues[i]?.[0] === name && linkValues[i]?.[0] === link) {
      return i + 1;
    }
  }

  return -1;

}

async function setConnectedBadge() {
  await chrome.action.setBadgeText({ text: "ON" });
  await chrome.action.setBadgeBackgroundColor({ color: [22, 163, 74, 255] });
}

async function clearConnectedBadge() {
  await chrome.action.setBadgeText({ text: "OFF" });
  await chrome.action.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
}

async function connectGoogle() {
  try {
    const token = await getAccessToken(true);

    await chrome.storage.local.set({ googleConnected: true });
    await setConnectedBadge();

    return { ok: true, token };
  } catch (error: any) {
    await chrome.storage.local.set({ googleConnected: false });
    await clearConnectedBadge();
    return { ok: false, error: error?.message || String(error) };
  }
}

async function disconnectGoogle() {
  try {
    const result = await chrome.identity.getAuthToken({ interactive: false }).catch(() => null);
    const token = typeof result === "string" ? result : result?.token;

    if (token) {
      await chrome.identity.removeCachedAuthToken({ token });

      await fetch(
        `https://accounts.google.com/o/oauth2/revoke?token=${encodeURIComponent(token)}`
      ).catch(() => {});
    }

    connectedToken = null;
    await chrome.storage.local.set({ googleConnected: false });
    await clearConnectedBadge();

    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.message || String(error) };
  }
}

export async function checkGoogleConnection() {
  try {
    const token = await getAccessToken(false);

    if (!token) {
      await chrome.storage.local.set({ googleConnected: false });
      await clearConnectedBadge();
      return { ok: true, connected: false };
    }

    await chrome.storage.local.set({ googleConnected: true });
    await setConnectedBadge();
    return { ok: true, connected: true };
  } catch (error: any) {
    connectedToken = null;
    await chrome.storage.local.set({ googleConnected: false });
    await clearConnectedBadge();
    return { ok: false, error: error?.message || String(error) };
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await clearConnectedBadge();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GOOGLE_CONNECT") {
    connectGoogle().then(sendResponse).catch((error) => {
      sendResponse({ ok: false, error: String(error) });
    });
    return true;
  }

  if (message.type === "GOOGLE_DISCONNECT") {
    disconnectGoogle().then(sendResponse).catch((error) => {
      sendResponse({ ok: false, error: String(error) });
    });
    return true;
  }

  if (message.type === "GOOGLE_CHECK") {
    checkGoogleConnection().then(sendResponse).catch((error) => {
      sendResponse({ ok: false, error: String(error) });
    });
    return true;
  }

  if (message.type === "SHEETS_SETUP") {
    setUp().then(() => sendResponse({ ok: true })).catch((error) => {
      sendResponse({ ok: false, error: String(error) });
    });
    return true;
  }

  if (message.type === "LOG_PROFILE") {
    appendRowInSheet(message.name, message.link, message.status)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

    if (message.type === "SHEETS_DELETE_ROW") {
      searchForProfile(message.name, message.link)
      .then((row) => {
        if (row === -1) {
          let notFoundError = new Error(`Profile "${message.name}" not found`);
          sendResponse({ ok: false, error: String(notFoundError) });
          return;
        }
        deleteSingleRow(row)
          .then(() => sendResponse({ ok: true }))
          .catch((error) => sendResponse({ ok: false, error: String(error) }));
      });
    return true;
  }

  if (message.type === "SHEETS_SEARCH_COLUMN") {
    searchInColumn(message.query, message.column)
      .then((row) => sendResponse({ ok: true, row }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "SHEETS_GET_COLUMN") {
    getColumns(message.leftBound, message.rightBound)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "SHEETS_SEARCH_PROFILE") {
    searchForProfile(message.name, message.link)
      .then((row) => sendResponse({ ok: true, row }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }


});