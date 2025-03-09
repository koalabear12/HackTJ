console.log("Content script loaded gj");

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { //this file highlights the text on the page (and deletes the highlight when u press reset)
        console.log("hi highlight was called");
        if (message.action === "highlight") {
            highlightText(message.results);
        } else if (message.action === "undoHighlight") {
            undoHighlights(); // Call the undoHighlights function
        }
    });

function highlightText(results) {
    console.log("hi highlight was called 2", results)
    let paragraphs = document.querySelectorAll("p"); //select all paragraph text

    paragraphs.forEach(paragraph => {
        let sentences = paragraph.innerHTML.split(/(?<=[.?!])\s+/); // split text into sentences

        sentences = sentences.map(sentence => {
            if (results[sentence.trim()] === false) { //if it is a invalid claim
                return `<span class="fancySpan">${sentence}</span>`; //replace it with a fancy span
            }
            return sentence;
        });

        paragraph.innerHTML = sentences.join(' ');
    });
}

// undos all of the modifications we did and returns the page to normal
function undoHighlights() {
    document.querySelectorAll(".fancySpan").forEach(span => {
        span.outerHTML = span.innerHTML;
    });
}

// css to make it a squigly underline like grammarly
const style = document.createElement("style");
style.innerHTML = `.fancySpan {
  text-decoration: underline;
  text-decoration-color: red;
  text-decoration-thickness: 2px;
  text-decoration-style: wavy;
}`;
document.head.appendChild(style);
