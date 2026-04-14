(async () => {
  console.log("Sheet FILTER FILE LOADED");

  // LinkedIn search results can use different selectors depending on the view
  const cards = Array.from(
    document.querySelectorAll(
      '[data-chameleon-result-urn], .reusable-search__result-container, [role="listitem"]'
    )
  ) as HTMLElement[];

  console.log('Found cards:', cards.length);

  for (const card of cards) {
    // Skip if dot already added (prevents duplicates on re-run)
    if (card.querySelector('.sheet-filter-dot')) continue;

    const linkEl = card.querySelector('a[href*="/in/"]') as HTMLAnchorElement;
    if (!linkEl) {
      console.log('No link found in card');
      continue;
    }

    const name = linkEl.textContent?.trim() || '';
    console.log('Processing card:', name);

    // Find the name element to position the dot next to it
    const nameContainer = linkEl.closest('span')?.parentElement
      ?? linkEl.parentElement
      ?? linkEl;

    // Create dot
    const dot = document.createElement('span');
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

    // Insert dot right after the name link
    linkEl.insertAdjacentElement('afterend', dot);
    console.log('Dot added next to:', name);
  }
})();