let clickStateIndex = 0; //what the button is on
let loading = false; //track loading state

document.getElementById('factCheckBtn').addEventListener('click', () => { //every time the button is clicked
  const div = document.getElementById('factCheckBtn'); //get the button element
  const buttonText = div.querySelector('span'); //find the span inside the div

  if (clickStateIndex == 0) {
    loading = true; //set loading to true
    clickStateIndex += 1; //incrament click state index
    document.getElementById('resetButton').style.display = "none"; //hide
    
    buttonText.innerText = "Loading"; //change button text to "Loading"
    
    let loadingDots = 0; // initialize loading dots counter
    const loadingInterval = setInterval(() => { //set interval to update the button text
      if (!loading) {
        clearInterval(loadingInterval); //clear the interval if loading is done
        buttonText.innerText = "Go!"; //reset button text to "Go!"
        return;
      }

      loadingDots = (loadingDots + 1) % 4; //cycle through 0-3 dots
      buttonText.innerText = "Loading" + '.'.repeat(loadingDots); //update button text with dots
    }, 500); //update every 500 ms

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => { //for the current window
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id }, //current tab
        func: extractText
      }, (injectionResults) => {
        const pageText = injectionResults[0].result;
        processClaims(pageText, loadingInterval); //call processClaims with the loading interval
      });
    });
  }
});

document.getElementById('resetButton').addEventListener('click', () => { // when the reset button is clicked
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "undoHighlight" });
  });
  clickStateIndex = 0; // reset click state index
  document.getElementById('resetButton').style.display = "none"; //hide reset button
  const div = document.getElementById('factCheckBtn'); //get the button element
  const buttonText = div.querySelector('span');
  buttonText.innerText = "Go!";
});

function extractText() { //gets all of the text
  return Array.from(document.querySelectorAll("p")).map(p => p.innerText).join("\n");
}

async function processClaims(pageText, loadingInterval) {
  let claims = pageText.split(/(?<=[.?!])\s+/); //makes lst of sentences
  let results = await sendClaimsToServer(claims); //send claims to server

  console.log("Sending message to content script", { action: "highlight", results });

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => { //  calls content.js to edit page
    chrome.tabs.sendMessage(tabs[0].id, { action: "highlight", results });
  });

  clearInterval(loadingInterval); //stop the loading interval
  clickStateIndex = 0; //reset click state index
  document.getElementById('resetButton').style.display = "block"; //show reset button
  loading = false; //set loading to false
  const div = document.getElementById('factCheckBtn'); //get the button element
  const buttonText = div.querySelector('span');
  buttonText.innerText = "Go!";
}

async function sendClaimsToServer(claims) {
  try {
    const response = await fetch('http://127.0.0.1:8000/fact-check', { //url of the flask server
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // tells the server that were sending json
      },
      body: JSON.stringify({ statements: claims }) //makes our list of sentences into json
    });

    if (!response.ok) { // if something's not good
      throw new Error('Your network response was not ok :(');
    }

    const data = await response.json(); //no more json
    return data; //return the data
  } catch (error) {
    console.error('Uh oh, there was an error when sending claims to server:', error); //uh oh
    throw error;
  }
}
