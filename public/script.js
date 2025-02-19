// script.js
const socket = io();

const urlInput = document.getElementById("urlInput");
const addUrlBtn = document.getElementById("addUrl");
const urlTagsContainer = document.getElementById("urlTags");
const wordlistSelect = document.getElementById("wordlistSelect");
const startScanBtn = document.getElementById("startScan");
const stopScanBtn = document.getElementById("stopScan");
const scanStatus = document.getElementById("scanStatus");
const terminalOutput = document.getElementById("terminalOutput");
const resultsTableBody = document
  .getElementById("resultsTable")
  .getElementsByTagName("tbody")[0];
const importUrlsBtn = document.getElementById("importUrlsBtn");
const importFileInput = document.getElementById("importFileInput");
const exportUrlsBtn = document.getElementById("exportUrlsBtn");
const customWordlistInput = document.getElementById("customWordlist");
const downloadJsonBtn = document.getElementById("downloadJsonBtn");
const downloadCsvBtn = document.getElementById("downloadCsvBtn");

let urls = [];
let allResults = []; // Accumulate all results

function updateUrlTags() {
  urlTagsContainer.innerHTML = "";
  urls.forEach((url, index) => {
    const tag = document.createElement("div");
    tag.classList.add("url-tag");
    tag.textContent = url;

    const removeBtn = document.createElement("span");
    removeBtn.classList.add("url-tag-remove");
    removeBtn.textContent = "x";
    removeBtn.onclick = () => {
      urls.splice(index, 1);
      updateUrlTags();
    };

    tag.appendChild(removeBtn);
    urlTagsContainer.appendChild(tag);
  });
}

addUrlBtn.addEventListener("click", () => {
  const url = urlInput.value.trim();
  if (url && !urls.includes(url)) {
    urls.push(url);
    urlInput.value = "";
    updateUrlTags();
  }
});

// URL Import
importUrlsBtn.addEventListener("click", () => {
  importFileInput.click();
});

importFileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const importedUrls = e.target.result
      .split("\n")
      .filter((url) => url.trim() !== "");
    urls = [...new Set([...urls, ...importedUrls])]; // Merge and remove duplicates
    updateUrlTags();
    socket.emit("importedUrls", urls);
  };
  reader.readAsText(file);
  importFileInput.value = ""; // Reset for re-import
});

// URL Export
exportUrlsBtn.addEventListener("click", () => {
  const dataStr =
    "data:text/plain;charset=utf-8," + encodeURIComponent(urls.join("\n"));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "urls.txt");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
});

// Fetch Wordlists
socket.on("wordlists", (wordlists) => {
  wordlistSelect.innerHTML = '<option value="">Select a Wordlist</option>';
  wordlists.forEach((wordlist) => {
    const option = document.createElement("option");
    option.value = `./common/${wordlist}`;
    option.textContent = wordlist;
    wordlistSelect.appendChild(option);
  });
});

socket.emit("getWordlists");

startScanBtn.addEventListener("click", () => {
  const selectedWordlist = wordlistSelect.value;
  const customWordlist = customWordlistInput.value.trim();

  const wordlist = selectedWordlist || customWordlist;
  if (!wordlist) {
    alert("Please select or enter a wordlist.");
    return;
  }

  if (urls.length === 0) {
    alert("Please add at least one URL.");
    return;
  }

  allResults = []; // Reset accumulated results
  startScanBtn.disabled = true;
  stopScanBtn.style.display = "inline-block"; // Show stop button
  terminalOutput.textContent = ""; // Clear previous output
  clearResultsTable(); // Clear the table

  socket.emit("startScan", { urls, wordlist });
});

stopScanBtn.addEventListener("click", () => {
  socket.emit("stopScan");
  stopScanBtn.style.display = "none"; // Hide stop button
  startScanBtn.disabled = false;
});

socket.on("scanStatus", (data) => {
  scanStatus.textContent = `Status: ${
    data.status === "running" ? "Scanning..." : "Idle"
  }`;
  if (data.status === "stopped") {
    startScanBtn.disabled = false; // Re enable when stop complete
    stopScanBtn.style.display = "none";
  }
});

socket.on("terminalOutput", (data) => {
  terminalOutput.textContent += data;
  terminalOutput.scrollTop = terminalOutput.scrollHeight; // Auto-scroll
});

// Function to clear the results table
function clearResultsTable() {
  while (resultsTableBody.firstChild) {
    resultsTableBody.removeChild(resultsTableBody.firstChild);
  }
}

// Updated scanResults handler
socket.on("scanResults", (results) => {
  results.forEach((result) => {
    if (result && result.type === "response") {
      // Check if result is valid
      allResults.push(result);
      const row = resultsTableBody.insertRow();
      row.insertCell(0).textContent = result.type;
      row.insertCell(1).textContent = result.url;
      row.insertCell(2).textContent = result.status;
      row.insertCell(3).textContent = result.content_length;
    }
  });
});

downloadJsonBtn.addEventListener("click", () => {
  // Use the accumulated allResults array
  const jsonData = JSON.stringify(allResults, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "scan_results.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// CSV Download
downloadCsvBtn.addEventListener("click", () => {
  if (allResults.length === 0) {
    alert("No results to download.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";

  // Add CSV header row
  const headers = Object.keys(allResults[0]);
  csvContent += headers.join(",") + "\r\n";

  // Add data rows
  allResults.forEach((item) => {
    let row = headers
      .map((header) => {
        let value = item[header];
        if (typeof value === "string") {
          // Escape double quotes and wrap strings in quotes
          value = '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
      })
      .join(",");
    csvContent += row + "\r\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "scan_results.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link); // Clean up
});
