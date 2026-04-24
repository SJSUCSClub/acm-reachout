console.log("FILTER FILE LOADED")   // --> this is just to check if the filter file is being loaded, can be removed later

function getText(el : Element | null) : string {    // this reads the text of the element if it exists, or uses "" if its null, 
    return (el?.textContent || "").toLowerCase().trim()    // and converts it to lowercase for easier searching
}


function isNotGraduated(card: Element) : boolean {      
    const text = getText(card)                                      // gets text from card
    const currentYear = new Date().getFullYear()                    // gets the current year

    const years = [...text.matchAll(/\b(20\d{2})\b/g)].map((m => Number(m[1])))    // uses regex to extract the year from card
    const hasFutureGrad = years.some((y) => y >= currentYear)                      // check if years in years are greater than years from currentYear, if so, it means the person has not graduated yet

   const lowerText = text.toLowerCase();
   return(
    lowerText.includes("student") ||     // these keywords indicate that the person is still studying or expected to graduate in the future, so we return true if any of these are found in the card text
    lowerText.includes("studying") ||
    lowerText.includes("expected") ||
    lowerText.includes("ms") ||
    lowerText.includes("bs") ||
    lowerText.includes("m.s.") ||
    lowerText.includes("b.s.") ||
    lowerText.includes("@ sjsu") ||
    lowerText.includes("@ san jose state") ||
    lowerText.includes("@san jose state") ||
    lowerText.includes("@san josé state university") ||
    lowerText.includes("@ san josé state university") ||
    lowerText.includes("@sjsu") ||
    hasFutureGrad
   )
}

function isAlumni(card: Element) : boolean {       
    const text = getText(card)                                      
    const currentYear = new Date().getFullYear() 

    const years = [...text.matchAll(/\b(20\d{2})\b/g)].map((m) => Number(m[1])) // extracts years using regex
    const hasPastGrad = years.some((y) => y < currentYear)      // check if year in currentYear is less than year extracted years
                                                                // assume graduated if true
    
    const lowerText = text.toLowerCase();
    return (
        lowerText.includes("alumni") ||
        lowerText.includes("graduate") ||        // these keywords indicate alumni
        lowerText.includes("alumn") ||
        hasPastGrad
    )
}

async function applyFilter() {
  const currentUrl = window.location.href;
  if (!currentUrl.includes("linkedin.com/search/results/people")) {
    return;
  }

  const filterStatus = await chrome.runtime.sendMessage({ type: "GET_FILTER_STATUS" })

  const cards = Array.from(document.querySelectorAll('[role="listitem"]')) as HTMLElement[]

  cards.forEach((card) => {
      let keep = true;
      card.style.display = "";   // reset display to default before applying filter
      const hasProfileLink = !!card.querySelector('a[href*="/in/"]')
      if (!hasProfileLink) return;

      if (filterStatus.filter_out_students && isNotGraduated(card)) {
        card.style.display = "none";
        keep = false;
      }
      if (filterStatus.require_alumni && !isAlumni(card)) {
        card.style.display = "none";
        keep = false;
      }

      console.log({
          text: getText(card),
          alumni: isAlumni(card),
          notGraduated: isNotGraduated(card),
          keep
      })
  })
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "APPLY_FILTER") {
    applyFilter()
    sendResponse({ ok: true })
    return true;
  }
})


// function matchesFilter(card: Element) : boolean {     // checks if card matches the filter criteria
//     return (
//         isAlumni(card) &&               // alumni & not current student
//         !isNotGraduated(card)
//     )
// }