document.addEventListener("DOMContentLoaded", function () {
    const textarea = document.querySelector("textarea");
    const generateBtn = document.getElementById("generateBtn");
    const summaryDisplay = document.getElementById("summaryDisplay");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const lengthSlider = document.getElementById("lengthSlider");
    const textLengthLabel = document.getElementById("textLength");
    const summaryLengthLabel = document.getElementById("summaryLength");
    // Update the length information when the user types in the textarea
    textarea.addEventListener("input", function () {
        textLengthLabel.textContent = `Length: ${textarea.value.length}`;
    });
    generateBtn.addEventListener("click", async function () {
        const inputText = textarea.value.trim();
        const selectedPenalty = lengthSlider.value;
        const selectedTab = document.querySelector('input[name="tab"]:checked').value;
    
        // Check if the length of the input text is less than 50 characters
        if (inputText.length < 50) {
            alert("Please provide a longer text (more than 50 characters).");
            return;
        }
    
        // Show loading indicator
        loadingIndicator.style.display = "block";
        try {
            // Make an asynchronous request to the Flask server
            const response = await fetch("/generate_summary", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: inputText,
                    maxLength: getMaxLength(selectedPenalty),
                    tab: selectedTab,
                }),
            });
            if (response.ok) {
                const result = await response.json();
                summaryDisplay.innerHTML = `<p>${result.summary}</p>`;
    
                // Update the length information for the generated summary
                summaryLengthLabel.textContent = `Length: ${result.summary.length}`;
            } else {
                alert("Error generating summary. Please try again.");
            }
        } catch (error) {
            console.error("An error occurred:", error);
            alert("An error occurred. Please try again.");
        } finally {
            // Hide loading indicator regardless of success or failure
            loadingIndicator.style.display = "none";
        }
    });
    function getMaxLength(selectedPenalty) {
        // Map slider values to corresponding lengths
        const lengths = [50, 150, 200];
        return lengths[selectedPenalty - 1];
    }
    // Initial update of label
    updateLabel();
});
function updateLabel() {
    var slider = document.getElementById("lengthSlider");
    var label = document.getElementById("lengthValue");
    // Map slider values to corresponding labels and lengths
    var value = slider.value;
    var labels = ["Short", "Medium", "Long"];
    var lengths = [50, 150, 200]; 
    label.innerHTML = labels[value - 1];
}

let isSpeaking = false; // Variable to track speech synthesis state
function readSummary() {
    const summaryText = document.getElementById("summaryDisplay").innerText;
    // Check if the browser supports the Web Speech API
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(summaryText);
        // Set the language to English (United States)
        utterance.lang = 'en-US';
        // Set the rate (adjust the value as needed)
        utterance.rate = 0.9; 
        // Detect punctuation marks to add pauses
        utterance.addEventListener('boundary', (event) => {
            const isPunctuation = /\p{P}/u.test(event.target.text.charAt(event.charIndex));
            if (isPunctuation) {
                // Add a pause after punctuation (adjust the value as needed)
                setTimeout(() => {
                    window.speechSynthesis.pause();
                    setTimeout(() => {
                        window.speechSynthesis.resume();
                    }, 500); // Adjust the pause duration as needed
                }, 50); // Adjust the pause duration as needed
            }
        });
        // Start or stop speech synthesis based on the current state
        if (!isSpeaking) {
            // If not currently speaking, start speech synthesis
            window.speechSynthesis.speak(utterance);
            isSpeaking = true;
        } else {
            // If currently speaking, stop speech synthesis
            window.speechSynthesis.cancel();
            isSpeaking = false;
        }
    } else {
        alert("Your browser does not support the Web Speech API.");
    }
}