console.log("FILTER FILE LOADED")   // --> this is just to check if the filter file is being loaded, can be removed later

let filterEnabled = false

function getText(el : Element | null) : string {    // this reads the text of the element if it exists, or uses "" if its null, 
    return (el?.textContent || "").toLowerCase().trim()    // and converts it to lowercase for easier searching
}


function isNotGraduated(card: Element) : boolean {      
    const text = getText(card)                                      // gets text from card
    const currentYear = new Date().getFullYear()                    // gets the current year

    const years = [...text.matchAll(/\b(20\d{2})\b/g)].map((m => Number(m[1])))    // uses regex to extract the year from card
    const hasFutureGrad = years.some((y) => y >= currentYear)                      // check if years in years are greater than years from currentYear, if so, it means the person has not graduated yet

   return(
    text.includes("student") ||     // these keywords indicate that the person is still studying or expected to graduate in the future, so we return true if any of these are found in the card text
    text.includes("studying") ||
    text.includes("expected") ||
    text.includes("ms") ||
    text.includes("bs") ||
    text.includes("m.s.") ||
    text.includes("b.s.") ||
    text.includes("@ sjsu") ||
    text.includes("@ san jose state") ||
    text.includes("@san jose state") ||
    text.includes("@san josé state university") ||
    text.includes("@ san josé state university") ||
    text.includes("@sjsu") ||
    hasFutureGrad
   )
}

function isAlumni(card: Element) : boolean {       
    const text = getText(card)                                      
    const currentYear = new Date().getFullYear() 

    const years = [...text.matchAll(/\b(20\d{2})\b/g)].map((m) => Number(m[1])) // extracts years using regex
    const hasPastGrad = years.some((y) => y < currentYear)      // check if year in currentYear is less than year extracted years
                                                                // assume graduated if true
    return (
        text.includes("alumni") ||
        text.includes("graduate") ||        // these keywords indicate alumni
        text.includes("alumn") ||
        hasPastGrad
    )
}

function applyFilter(enabled: boolean) {
    filterEnabled = enabled

    const cards = Array.from(document.querySelectorAll('[role="listitem"]')) as HTMLElement[]

    cards.forEach((card) => {
        const hasProfileLink = !!card.querySelector('a[href*="/in/"]')
        if (!hasProfileLink) return

        if (!enabled) {
        card.style.display = ""
        return
        }

        const keep = isAlumni(card) || !isNotGraduated(card)
        card.style.display = keep ? "" : "none"

        console.log({
            text: getText(card),
            alumni: isAlumni(card),
            notGraduated: isNotGraduated(card),
            keep
        })
    })
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "TOGGLE_LINKEDIN_FILTER") {
    applyFilter(Boolean(message.enabled))
    sendResponse({ ok: true })
  }

  if (message?.type === "GET_LINKEDIN_FILTER_STATE") {
    sendResponse({ ok: true, enabled: filterEnabled })
  }
})

const observer = new MutationObserver(() => {
  if (filterEnabled) {
    applyFilter(true)
  }
})

observer.observe(document.body, {
  childList: true,
  subtree: true,
})


// function matchesFilter(card: Element) : boolean {     // checks if card matches the filter criteria
//     return (
//         isAlumni(card) &&               // alumni & not current student
//         !isNotGraduated(card)
//     )
// }