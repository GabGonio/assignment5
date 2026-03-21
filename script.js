/**
 * Builds and encodes a SoQL API URL for the 311 dataset filtered by keyword.
 *
 * @param {string} keyword - The search term to match against the subject field.
 * @returns {string} A fully encoded URL ready for use with fetch.
 */
function buildApiUrl(keyword) {
	const DATASET_ENDPOINT = "https://data.winnipeg.ca/resource/u7f6-5326.json";
	const MAX_RESULTS = 25;

	const apiUrl =
		`${DATASET_ENDPOINT}?` +
		`$select=subject,reason,open_date,case_status&` +
		`$where=subject IS NOT NULL&` +
		`$q=${keyword}&` +
		`$order=open_date DESC&` +
		`$limit=${MAX_RESULTS}`;

	return encodeURI(apiUrl);
}

/**
 * Fetches 311 service requests from the City of Winnipeg Open Data API.
 *
 * @param {string} keyword - The keyword to search for in request subjects.
 * @returns {Promise<Object[]>} A promise that resolves to an array of request objects.
 * @throws {Error} If the HTTP response is not OK.
 */
async function fetch311Requests(keyword) {
	const url = buildApiUrl(keyword);
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`HTTP error: ${response.status}`);
	}

	return response.json();
}

/**
 * Updates the main status message visible to the user.
 *
 * @param {string} message - The message text to display.
 * @param {boolean} [isError=false] - When true, applies error styling.
 */
function setStatus(message, isError = false) {
	const statusMessage = document.getElementById("statusMessage");
	statusMessage.textContent = message;
	statusMessage.classList.toggle("error-text", isError);
}

/**
 * Updates the results metadata line shown below the status message.
 *
 * @param {string} [message=""] - The metadata text to display.
 */
function setResultsMeta(message = "") {
	document.getElementById("resultsMeta").textContent = message;
}

/**
 * Clears the inline validation error for the keyword input field.
 */
function clearKeywordError() {
	document.getElementById("keywordError").textContent = "";
	document.getElementById("keyword").setAttribute("aria-invalid", "false");
}

/**
 * Displays an inline validation error for the keyword input field.
 *
 * @param {string} message - The error message to display.
 */
function showKeywordError(message) {
	document.getElementById("keywordError").textContent = message;
	document.getElementById("keyword").setAttribute("aria-invalid", "true");
}

/**
 * Formats an ISO date string into a locale-friendly date.
 *
 * @param {string} dateString - An ISO 8601 date string from the API.
 * @returns {string} A formatted date string, or "N/A" if invalid.
 */
function formatDate(dateString) {
	const parsed = new Date(dateString);
	if (Number.isNaN(parsed.getTime())) {
		return "N/A";
	}

	return parsed.toLocaleDateString();
}

/**
 * Returns the current time formatted as HH:MM:SS.
 *
 * @returns {string} The current time as a locale string.
 */
function formatTimeNow() {
	return new Date().toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

/**
 * Renders the fetched 311 request rows into the results table.
 * Uses destructuring to extract fields from each row object.
 *
 * @param {Object[]} rows - Array of request objects from the API.
 * @param {string} keyword - The keyword that was searched, used in metadata text.
 */
function renderRows(rows, keyword) {
	const resultsBody = document.getElementById("resultsBody");
	resultsBody.innerHTML = "";

	if (rows.length === 0) {
		setResultsMeta(`0 results displayed for "${keyword}".`);
		const emptyRow = document.createElement("tr");
		const emptyCell = document.createElement("td");
		emptyCell.colSpan = 4;
		emptyCell.textContent = "No matching requests found.";
		emptyRow.appendChild(emptyCell);
		resultsBody.appendChild(emptyRow);
		return;
	}

	rows.forEach((row) => {
		const { subject = "N/A", reason = "N/A", open_date = "", case_status = "N/A" } = row;
		const tr = document.createElement("tr");

		const subjectCell = document.createElement("td");
		subjectCell.textContent = subject;

		const reasonCell = document.createElement("td");
		reasonCell.textContent = reason;

		const openDateCell = document.createElement("td");
		openDateCell.textContent = formatDate(open_date);

		const statusCell = document.createElement("td");
		statusCell.textContent = case_status;

		tr.appendChild(subjectCell);
		tr.appendChild(reasonCell);
		tr.appendChild(openDateCell);
		tr.appendChild(statusCell);

		resultsBody.appendChild(tr);
	});

	setResultsMeta(
		`${rows.length} result(s) for "${keyword}". Updated at ${formatTimeNow()}. Showing most recent first.`
	);
}

/**
 * Clears the results table and resets status/metadata messages.
 */
function clearResults() {
	document.getElementById("resultsBody").innerHTML = "";
	setResultsMeta("");
	setStatus("Enter a keyword, then click Search.");
}

document.getElementById("keyword").addEventListener("input", () => {
	if (document.getElementById("keyword").value.trim()) {
		clearKeywordError();
	}
});

document.getElementById("clearButton").addEventListener("click", () => {
	document.getElementById("searchForm").reset();
	clearKeywordError();
	clearResults();
	document.getElementById("keyword").focus();
});

document.getElementById("searchForm").addEventListener("submit", async (event) => {
	event.preventDefault();

	const keyword = document.getElementById("keyword").value.trim();
	clearKeywordError();

	if (!keyword) {
		showKeywordError("Keyword is required.");
		setStatus("Please enter a keyword before searching.", true);
		document.getElementById("keyword").focus();
		return;
	}

	document.getElementById("searchButton").disabled = true;
	setStatus("Loading requests...");
	setResultsMeta(`Searching for "${keyword}"...`);

	try {
		const requests = await fetch311Requests(keyword);
		renderRows(requests, keyword);
		setStatus(`Loaded ${requests.length} request(s).`);
	} catch (error) {
		console.error(error);
		renderRows([], keyword);
		setResultsMeta(`Search for "${keyword}" failed. Please try again.`);
		setStatus("Unable to load data right now. Please try again.", true);
	} finally {
		document.getElementById("searchButton").disabled = false;
	}
});
