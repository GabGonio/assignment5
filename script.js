const DATASET_ENDPOINT = "https://data.winnipeg.ca/resource/u7f6-5326.json";
const MAX_RESULTS = 25;

const searchForm = document.getElementById("searchForm");
const keywordInput = document.getElementById("keyword");
const requestDateInput = document.getElementById("requestDate");
const searchButton = document.getElementById("searchButton");
const statusMessage = document.getElementById("statusMessage");
const resultsBody = document.getElementById("resultsBody");

function buildApiUrl(keyword, date) {
	const safeKeyword = keyword.replace(/'/g, "''");
	const whereParts = [
		`lower(subject) LIKE lower('%${safeKeyword}%')`,
		"subject IS NOT NULL",
	];

	if (date) {
		whereParts.push(
			`open_date >= '${date}T00:00:00' AND open_date <= '${date}T23:59:59'`
		);
	}

	const apiUrl =
		`${DATASET_ENDPOINT}?` +
		`$select=subject,reason,open_date,case_status&` +
		`$where=${whereParts.join(" AND ")}&` +
		`$order=open_date DESC&` +
		`$limit=${MAX_RESULTS}`;

	return encodeURI(apiUrl);
}

async function fetch311Requests(date, keyword) {
	const url = buildApiUrl(keyword, date);
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
		emptyRow.innerHTML = '<td colspan="4">No matching requests found.</td>';
		resultsBody.appendChild(emptyRow);
		return;
	}

	rows.forEach((row) => {
		const { subject = "N/A", reason = "N/A", open_date = "", case_status = "N/A" } = row;
		const tr = document.createElement("tr");

		tr.innerHTML = `
			<td>${subject}</td>
			<td>${reason}</td>
			<td>${formatDate(open_date)}</td>
			<td>${case_status}</td>
		`;

		resultsBody.appendChild(tr);
	});
}

searchForm.addEventListener("submit", async (event) => {
	event.preventDefault();

	const keyword = keywordInput.value.trim();
	const selectedDate = requestDateInput.value;

	if (!keyword) {
		setStatus("Please enter a keyword before searching.", true);
		keywordInput.focus();
		return;
	}

	searchButton.disabled = true;
	setStatus("Loading requests...");

	try {
		const requests = await fetch311Requests(selectedDate, keyword);
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
