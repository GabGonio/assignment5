const DATASET_ENDPOINT = "https://data.winnipeg.ca/resource/u7f6-5326.json";
const MAX_RESULTS = 25;

const searchForm = document.getElementById("searchForm");
const keywordInput = document.getElementById("keyword");
const keywordError = document.getElementById("keywordError");
const searchButton = document.getElementById("searchButton");
const statusMessage = document.getElementById("statusMessage");
const resultsBody = document.getElementById("resultsBody");

function buildApiUrl(keyword) {
	const safeKeyword = keyword.replace(/'/g, "''");
	const whereParts = [
		`lower(subject) LIKE lower('%${safeKeyword}%')`,
		"subject IS NOT NULL",
	];

	const apiUrl =
		`${DATASET_ENDPOINT}?` +
		`$select=subject,reason,open_date,case_status&` +
		`$where=${whereParts.join(" AND ")}&` +
		`$order=open_date DESC&` +
		`$limit=${MAX_RESULTS}`;

	return encodeURI(apiUrl);
}

async function fetch311Requests(keyword) {
	const url = buildApiUrl(keyword);
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`HTTP error: ${response.status}`);
	}

	return response.json();
}

function setStatus(message, isError = false) {
	statusMessage.textContent = message;
	statusMessage.classList.toggle("error-text", isError);
}

function clearKeywordError() {
	keywordError.textContent = "";
	keywordInput.setAttribute("aria-invalid", "false");
}

function showKeywordError(message) {
	keywordError.textContent = message;
	keywordInput.setAttribute("aria-invalid", "true");
}

function formatDate(dateString) {
	const parsed = new Date(dateString);
	if (Number.isNaN(parsed.getTime())) {
		return "N/A";
	}

	return parsed.toLocaleDateString();
}

function renderRows(rows) {
	resultsBody.innerHTML = "";

	if (rows.length === 0) {
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
}

keywordInput.addEventListener("input", () => {
	if (keywordInput.value.trim()) {
		clearKeywordError();
	}
});

searchForm.addEventListener("submit", async (event) => {
	event.preventDefault();

	const keyword = keywordInput.value.trim();
	clearKeywordError();

	if (!keyword) {
		showKeywordError("Keyword is required.");
		setStatus("Please enter a keyword before searching.", true);
		keywordInput.focus();
		return;
	}

	searchButton.disabled = true;
	setStatus("Loading requests...");

	try {
		const requests = await fetch311Requests(keyword);
		renderRows(requests);
		setStatus(`Loaded ${requests.length} request(s).`);
	} catch (error) {
		console.error(error);
		renderRows([]);
		setStatus("Unable to load data right now. Please try again.", true);
	} finally {
		searchButton.disabled = false;
	}
});
