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

  const filterStatus = await chrome.runtime.sendMessage({ type: "GET_FILTER_STATUS" });
  for (const card of cards) {

    if (!filterStatus.mark_status) {
      card.querySelectorAll('.sheet-filter-dot').forEach(dot => dot.remove());
      continue;
    };

    if (card.querySelector('.sheet-filter-dot')) continue;

    const nameEl = card.querySelector('.truncate') as HTMLElement | null
    if (!nameEl) continue

    const name = nameEl.textContent?.trim()
    if (!name) continue

    const apiQuery = await chrome.runtime.sendMessage({ 
      type: "SHEETS_SEARCH_PROFILE_STATUS",
      name: name,
      link: "", 
    })

    if (!apiQuery.ok) {
      throw "GETTING STATUS ERROR: " + apiQuery.error;
    }


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
    const status = apiQuery.status;
    const row = apiQuery.row;

    if (row !== -1 && (status == null || status == "" || status == "CLEAR")) {
      dot.style.backgroundColor = "#d3d028";
      dot.style.border = "1.5px solid #c0b51d";
    }
    else if (status == "ACCEPTED") {
      dot.style.backgroundColor = "#22c55e";
      dot.style.border = "1.5px solid #16a34a";
    }
    else if (status == "DECLINED") {
      dot.style.backgroundColor = "#c30101"
      dot.style.border = "1.5px solid #991b1b"
    }
    else {
      dot.style.backgroundColor = "#555555";
      dot.style.border = "1.5px solid #4b4b4b";
    }


    nameEl.insertAdjacentElement('afterend', dot)
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "APPLY_FILTER") {
    applyMarks()
    applyStatusMarks()
    sendResponse({ ok: true })
    return true;
  }
})