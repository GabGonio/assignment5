function buildApiUrl(keyword) {
	const DATASET_ENDPOINT = "https://data.winnipeg.ca/resource/u7f6-5326.json";
	const MAX_RESULTS = 25;

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
	const statusMessage = document.getElementById("statusMessage");
	statusMessage.textContent = message;
	statusMessage.classList.toggle("error-text", isError);
}

function setResultsMeta(message = "") {
	document.getElementById("resultsMeta").textContent = message;
}

function clearKeywordError() {
	document.getElementById("keywordError").textContent = "";
	document.getElementById("keyword").setAttribute("aria-invalid", "false");
}

function showKeywordError(message) {
	document.getElementById("keywordError").textContent = message;
	document.getElementById("keyword").setAttribute("aria-invalid", "true");
}

function formatDate(dateString) {
	const parsed = new Date(dateString);
	if (Number.isNaN(parsed.getTime())) {
		return "N/A";
	}

	return parsed.toLocaleDateString();
}

function formatTimeNow() {
	return new Date().toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

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
