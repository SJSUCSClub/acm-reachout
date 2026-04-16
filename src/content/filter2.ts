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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "APPLY_FILTER1") {
    applyMarks()
    sendResponse({ ok: true })
    return true;
  }
})