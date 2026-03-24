# DEBUGGER STEPS

## Breakpoint 1: Before API request
- Logical point: submit handler before waiting for API data.
- Location in code: const requests = await fetch311Requests(keyword);
- Why this point matters:
	- Confirms form validation already passed.
	- Confirms keyword value before network request starts.
	- Confirms UI state changed to loading before async work.

### Screenshot 1 (paused at Breakpoint 1)
- Observed state:
	- Execution paused on the await line in submit handler.
	- keyword is set to "pothole".
	- Call stack shows current flow from submit event.
	- Status text is in loading state.

### Screenshot 2 (after stepping from Breakpoint 1)
- What changed after step-through:
	- Await completed and requests is now populated.
	- requests is visible as an array with returned API rows.
	- Execution is ready to pass parsed data into rendering.

## Breakpoint 2: After parsing response and before rendering
- Logical point: first line after parsed data is available.
- Location in code: renderRows(requests, keyword);
- Why this point matters:
	- Verifies parsed data exists before DOM update starts.
	- Separates fetch/parse concerns from rendering concerns.

### Screenshot 5 (paused at Breakpoint 2)
- Observed state:
	- Execution paused on renderRows(requests, keyword);.
	- requests array is present and contains multiple rows.
	- keyword is still available and correct.
	- Call stack confirms transition from async fetch path to render path.

### Screenshot 6 (after stepping from Breakpoint 2)
- What changed after step-through:
	- Render function has been executed.
	- Table rows are visible in UI.
	- Status/meta text updates reflect loaded request count.

## Breakpoint 3: During DOM update
- Logical point: inside row rendering loop where a row is appended.
- Location in code: resultsBody.appendChild(tr);
- Why this point matters:
	- Shows exactly how one API row becomes one table row.
	- Verifies object fields are mapped to DOM cells correctly.

### Screenshot 3 (paused at Breakpoint 3)
- Observed state:
	- Execution paused at resultsBody.appendChild(tr);.
	- Current row object is visible in Scope.
	- Cell values like subject, reason, open date, and status are prepared.
	- DOM update is about to occur.

### Screenshot 4 (after stepping from Breakpoint 3)
- What changed after step-through:
	- New <tr> is appended to table body.
	- Rendered rows are visible on screen.
	- Execution continues through remaining rows in loop.

## Critical state analysis
- Chosen critical state: Screenshot 5 at renderRows(requests, keyword);

### What this state tells me about program logic
- The async boundary has completed successfully.
- Data is already parsed into a usable JavaScript array.
- Program is transitioning from data acquisition to presentation.

### Is the program behaving as expected?
- Yes.
- requests exists with many rows, which matches expectations for a keyword like pothole.
- UI state and call stack align with the intended flow.

### How this state connects to next steps
- requests is passed directly to renderRows.
- renderRows loops through each object and appends rows to the table.
- After render, status and metadata are updated for user feedback.

## Notes on debugging outcomes
- Issue observed earlier: searches could appear stuck at loading.
- Fixes applied in code:
	- Added faster query strategy with $q while keeping WHERE and ORDER.
	- Added timeout with AbortController.
	- Added retry logic and clearer error messages.
- Result after fixes:
	- Search flow completes and renders expected rows for common keywords.

