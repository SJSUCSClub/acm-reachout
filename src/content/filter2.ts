async function applyMarks(){

  const currentUrl = window.location.href;
  if (!currentUrl.includes("linkedin.com/search/results/people")) {
    return;
  }

  // LinkedIn search results can use different selectors depending on the view
  const cards = Array.from(
    document.querySelectorAll(
      '[data-chameleon-result-urn], .reusable-search__result-container, [role="listitem"]'
    )
  ) as HTMLElement[];

  console.log('Found cards:', cards.length);

  const filterStatus = await chrome.runtime.sendMessage({ type: "GET_FILTER_STATUS" });
  for (const card of cards) {

    if (!filterStatus.mark_logged) {
      card.querySelectorAll('.sheet-filter-dot').forEach(dot => dot.remove());
      continue;
    }

    // Skip if dot already added (prevents duplicates on re-run)
    if (card.querySelector('.sheet-filter-dot')) continue;

    const linkEl = card.querySelectorAll('a[href*="/in/"]') as NodeListOf<HTMLAnchorElement>;
    if (!linkEl || linkEl.length === 0) {
      console.log('No link found in card');
      continue;
    }

    const name = linkEl[1].textContent?.trim() || '';
    const profileUrl = linkEl[1].href;
    console.log('Processing card:', name);

    const sheetsResponse = await chrome.runtime.sendMessage({
      type: "SHEETS_SEARCH_PROFILE",
      name,
      link: profileUrl
    });
    
    if (!sheetsResponse || !sheetsResponse.ok) {
      console.warn('Error checking profile status for ' + sheetsResponse.error);
      return;
    }

    const dot = document.createElement('span');
    if (sheetsResponse.row > -1) {
      dot.className = 'sheet-filter-dot';
      dot.style.cssText = `
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: #c30101;
        margin-left: 8px;
        vertical-align: middle;
        flex-shrink: 0;
        border: 1.5px solid #c30101;
      `;
    }
    else {
      dot.className = 'sheet-filter-dot';
      dot.style.cssText = `
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: #22c55e;
        margin-left: 8px;
        vertical-align: middle;
        flex-shrink: 0;
        border: 1.5px solid #16a34a;
      `;
    }

    // Insert dot right after the name link
    linkEl[1].insertAdjacentElement('afterend', dot);
    console.log('Dot added next to:', name);
  }
}

async function applyStatusMarks() {
  const currentUrl = window.location.href
  if (!currentUrl.includes("linkedin.com/messaging")) return

  const cards = Array.from(
    document.querySelectorAll('.msg-conversation-card')
  ) as HTMLElement[]

  if (cards.length === 0) return

  // One single API call for all profiles
  const response = await chrome.runtime.sendMessage({ type: "SHEETS_GET_ALL_STATUSES" })
  if (!response?.ok) {
    console.warn("Error fetching all statuses:", response?.error)
    return
  }

  const profileMap = new Map<string, string | null>(
    response.profiles.map((p: {name: string, status: string | null}) => [p.name.toLowerCase(), p.status])
  )

  for (const card of cards) {
    card.querySelectorAll('.sheet-filter-dot').forEach(dot => dot.remove())

    const nameEl = card.querySelector('.truncate') as HTMLElement | null
    if (!nameEl) continue

    const name = nameEl.textContent?.trim()
    if (!name) continue

    if (!profileMap.has(name.toLowerCase())) continue // not in sheet

    const status = profileMap.get(name.toLowerCase())?.toUpperCase()

    if (status !== "ACCEPTED" && status !== "DECLINED") continue

    const dot = document.createElement('span')
    dot.className = 'sheet-filter-dot'
    dot.style.cssText = `
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-left: 6px;
      vertical-align: middle;
      flex-shrink: 0;
    `
    dot.style.backgroundColor = status === "ACCEPTED" ? "#22c55e" : "#c30101"
    dot.style.border = status === "ACCEPTED" ? "1.5px solid #16a34a" : "1.5px solid #991b1b"

    nameEl.insertAdjacentElement('afterend', dot)
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "APPLY_FILTER1") {
    applyMarks()
    applyStatusMarks()
    sendResponse({ ok: true })
    return true;
  }
})

function observeMessaging() {
  const currentUrl = window.location.href;
  if (!currentUrl.includes("linkedin.com/messaging")) return;

  const target = document.querySelector('.msg-conversations-container') ?? document.body;

  const observer = new MutationObserver(() => {
    applyStatusMarks();
  });

  observer.observe(target, { childList: true, subtree: true });
}

observeMessaging();