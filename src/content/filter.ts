console.log("FILTER FILE LOADED")   // --> this is just to check if the filter file is being loaded, can be removed later


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

const cards = Array.from(document.querySelectorAll('[role="listitem"]')) as HTMLElement[]

cards.forEach((card) => {
  const hasProfileLink = !!card.querySelector('a[href*="/in/"]')
  if (!hasProfileLink) return

  const keep = isAlumni(card) || !isNotGraduated(card)

  card.style.display = keep ? "" : "none"

  console.log({
    text: getText(card),
    alumni: isAlumni(card),
    notGraduated: isNotGraduated(card),
    keep
  })
})


// function matchesFilter(card: Element) : boolean {     // checks if card matches the filter criteria
//     return (
//         isAlumni(card) &&               // alumni & not current student
//         !isNotGraduated(card)
//     )
// }

// function filterCards(): void {
//     const cards = document.querySelectorAll("li.reusable-search__result-container")          // "list item" HTML tag --> selects all <li> elements 

//     cards.forEach((card) => {
//         const el = card as HTMLElement                          // casts card to HTMLElement to access style property
//         el.style.display = matchesFilter(card) ? "" : "none"    // if card matches filter, then ""(show it) else "none"(hide it)
//     })
//     }

//     function startFiltering() : void {
//         filterCards()                                           // starts filtering the cards                    

//         const observer = new MutationObserver(() => {           // this creates a watcher to run the filter again if a page change is observed (i.e. when scrolling)
//             filterCards()
//         })

//         observer.observe(document.body, { 
//             childList: true,            // checks for new elements
//             subtree: true               // watches what is inside the page
//         })
//     }

//     startFiltering()