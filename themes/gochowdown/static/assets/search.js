let pagesIndex, searchIndex;

async function initSearchIndex() {
  try {
    const response = await fetch("/search.json");
    pagesIndex = await response.json();
    searchIndex = lunr(function () {
      this.field("title");
      this.field("authors");
      this.field("categories");
      this.field("tags");
      this.ref("href");
      pagesIndex.forEach((page) => this.add(page));
    });
  } catch (e) {
    console.log(e);
  }
}

function searchBoxFocused() {
  document.querySelector(".search-container").classList.add("focused");
  document
    .getElementById("search")
    .addEventListener("focusout", () => searchBoxFocusOut());
}

function searchBoxFocusOut() {
  document.querySelector(".search-container").classList.remove("focused");
}

initSearchIndex();
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("search-form") != null) {
    const searchInput = document.getElementById("search");
    searchInput.addEventListener("focus", () => searchBoxFocused());
    searchInput.addEventListener("keydown", (event) => {
      if (event.keyCode == 13) handleSearchQuery(event)
    });
    document
      .querySelector(".search-error")
      .addEventListener("animationend", removeAnimation);
    document
      .querySelector(".fa-search")
      .addEventListener("click", (event) => handleSearchQuery(event));
  }
})

function closeModal() {
  document.getElementById('popUpBox').style.display = "none"
  document.getElementById('search').value=''

  document.getElementById("navigation").removeAttribute("style", "pointer-events:none")
  document.getElementById("navigation").removeAttribute("style", "-webkit-filter: blur(4px)")

  document.getElementsByClassName("content")[0].removeAttribute("style", "pointer-events:none")
  document.getElementsByClassName("content")[0].removeAttribute("style", "-webkit-filter: blur(4px)")

  document.getElementById("footer").removeAttribute("style", "pointer-events:none")
  document.getElementById("footer").removeAttribute("style", "-webkit-filter: blur(4px)")
}

function handleSearchQuery(event) {
  event.preventDefault();
  const query = document.getElementById("search").value.trim().toLowerCase();
  if (!query) {
    displayErrorMessage("Please enter a search term");
    return;
  }
  document.getElementById('popUpBox').style.display = "none"
  document.getElementById("search-results").innerHTML = ''

  const results = searchSite('*' + query + '*')
  if (!results.length) {
    displayErrorMessage("Your search returned no results")
    return
  } else {
    let popUpBox = document.getElementById('popUpBox');
    popUpBox.style.display = "block";
    document.getElementById('closeModal').innerHTML = '<button onclick="closeModal()">Close</button>';

    for (var i = 0; i < results.length; i++) {
      var obj = results[i];
      var link = document.createElement('a')
      var linkText = document.createTextNode(obj.title + ' by ' + obj.authors)
      link.append(linkText)
      link.title = obj.title
      link.href = window.location.protocol + '//' + window.location.host + obj.href
      document.getElementById("search-results").append(link)

      var br = document.createElement("br");
      document.getElementById("search-results").appendChild(br)
    }

    document.getElementById('popUpBox').style.display = "block"
    document.getElementById("navigation").setAttribute("style", "-webkit-filter: blur(4px); pointer-events:none")
    document.getElementsByClassName("content")[0].setAttribute("style", "pointer-events:none")
    document.getElementsByClassName("content")[0].setAttribute("style", "-webkit-filter: blur(4px); pointer-events:none")
    document.getElementById("footer").setAttribute("style", "-webkit-filter: blur(4px); pointer-events:none")

    // console.log(results)
  }
}

function displayErrorMessage(message) {
  document.querySelector(".search-error-message").innerHTML = message;
  document.querySelector(".search-container").classList.remove("focused");
  document.querySelector(".search-error").classList.remove("hide-element");
  document.querySelector(".search-error").classList.add("fade");
}

function removeAnimation() {
  this.classList.remove("fade");
  this.classList.add("hide-element");
  document.querySelector(".search-container").classList.add("focused");
}

function searchSite(query) {
  const originalQuery = query;
  query = getLunrSearchQuery(query);
  let results = getSearchResults(query);
  return results.length
    ? results
    : query !== originalQuery
      ? getSearchResults(originalQuery)
      : [];
}

function getSearchResults(query) {
  return searchIndex.search(query).flatMap((hit) => {
    if (hit.ref == "undefined") return [];
    let pageMatch = pagesIndex.filter((page) => page.href === hit.ref)[0];
    pageMatch.score = hit.score;
    return [pageMatch];
  });
}

function getLunrSearchQuery(query) {
  const searchTerms = query.split(" ");
  if (searchTerms.length === 1) {
    return query;
  }
  query = "";
  for (const term of searchTerms) {
    query += `+${term} `;
  }
  return query.trim();
}
