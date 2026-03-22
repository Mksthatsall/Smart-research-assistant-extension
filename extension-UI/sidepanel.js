const API_URL = "http://localhost:8080/api/research/process";
const HISTORY_KEY = "researchHistory";
const SELECTED_TEXT_KEY = "latestSelectedText";
const MAX_HISTORY_ITEMS = 100;

const selectionStatus = document.getElementById("selectionStatus");
const researchStatus = document.getElementById("researchStatus");
const selectedTextPreview = document.getElementById("selectedTextPreview");
const saveHistoryToggle = document.getElementById("saveHistoryToggle");
const newResearchBtn = document.getElementById("newResearchBtn");
const researchBtn = document.getElementById("researchBtn");
const clearBtn = document.getElementById("clearBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const responseEditor = document.getElementById("responseEditor");
const saveEditBtn = document.getElementById("saveEditBtn");
const loader = document.getElementById("loader");
const historyList = document.getElementById("historyList");
const threadList = document.getElementById("threadList");
let activeResearchId = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadCapturedContext();
  await renderHistory();
  renderThreadEntries();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  const selectedTextChange = changes[SELECTED_TEXT_KEY];

  if (selectedTextChange) {
    setSelectedText((selectedTextChange.newValue || "").trim());
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "SELECTION_CHANGED") {
    return;
  }

  setSelectedText((message.selectedText || "").trim());
});

researchBtn.addEventListener("click", handleResearch);
newResearchBtn.addEventListener("click", startNewResearch);
clearBtn.addEventListener("click", clearCurrentView);
clearHistoryBtn.addEventListener("click", clearHistory);
saveEditBtn.addEventListener("click", saveEditedResponse);

async function loadCapturedContext() {
  try {
    const stored = await chrome.storage.local.get([SELECTED_TEXT_KEY]);
    const storedSelectedText = (stored[SELECTED_TEXT_KEY] || "").trim();

    setSelectedText(storedSelectedText);

    if (storedSelectedText) {
      return;
    }
  } catch (error) {
    console.warn("Could not load stored selected text:", error);
  }

  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!activeTab?.id) {
      return;
    }

    const response = await chrome.tabs.sendMessage(activeTab.id, {
      type: "GET_SELECTED_TEXT"
    });

    const selectedText = response?.selectedText?.trim();

    if (selectedText) {
      setSelectedText(selectedText);
      await chrome.storage.local.set({ [SELECTED_TEXT_KEY]: selectedText });
    }
  } catch (error) {
    console.warn("Could not load selected text from active tab:", error);
  }
}

async function handleResearch() {
  const selectedText = selectedTextPreview.dataset.selectedText?.trim() || "";

  if (!selectedText) {
    setResponse("Please select text on the webpage first.");
    return;
  }

  setLoading(true);
  setResponse("");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: selectedText,
        operation: "summarize"
      })
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const result = await parseBackendResponse(response);

    setResponse(result);
    if (saveHistoryToggle.checked) {
      await saveResearch(selectedText, result);
      await renderHistory();
    }
  } catch (error) {
    console.error("Research request failed:", error);
    const message =
      error instanceof TypeError
        ? "Server not running on localhost"
        : error.message || "Something went wrong while processing the request.";
    setResponse(message);
  } finally {
    setLoading(false);
  }
}

function clearCurrentView() {
  activeResearchId = null;
  updateResearchStatus();
  setSelectedText("");
  setResponse("");
  renderThreadEntries();
  chrome.storage.local.set({ [SELECTED_TEXT_KEY]: "" });
}

function setLoading(isLoading) {
  loader.classList.toggle("hidden", !isLoading);
  newResearchBtn.disabled = isLoading;
  researchBtn.disabled = isLoading;
  clearBtn.disabled = isLoading;
  saveEditBtn.disabled = isLoading;
}

function setResponse(text) {
  if (!text) {
    responseEditor.value = "";
    return;
  }

  responseEditor.value = text;
}

function setSelectedText(text) {
  selectedTextPreview.dataset.selectedText = text;

  if (!text) {
    setSelectionStatus("");
    selectedTextPreview.innerHTML = '<p class="placeholder">Select text on the webpage, then open the side panel.</p>';
    return;
  }

  setSelectionStatus(text);
  selectedTextPreview.textContent = text;
}

function setSelectionStatus(text) {
  selectionStatus.classList.toggle("selection-status-ready", Boolean(text));
  selectionStatus.classList.toggle("selection-status-empty", !text);

  if (!text) {
    selectionStatus.textContent = "No selection captured yet.";
    return;
  }

  const preview = truncate(text.replace(/\s+/g, " "), 90);
  selectionStatus.textContent = `Selection captured. Ready to summarize: "${preview}"`;
}

function updateResearchStatus(title = "") {
  if (!activeResearchId) {
    researchStatus.textContent = "New research mode";
    return;
  }

  researchStatus.textContent = title
    ? `Saving into: ${truncate(title, 60)}`
    : "Saving into opened research";
}

function startNewResearch() {
  activeResearchId = null;
  updateResearchStatus();
  setResponse("");
}

async function parseBackendResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json();
    return (
      (typeof data?.result === "string" && data.result) ||
      (typeof data?.response === "string" && data.response) ||
      (typeof data?.output === "string" && data.output) ||
      JSON.stringify(data, null, 2)
    );
  }

  const text = (await response.text()).trim();
  return text || "No result returned.";
}

async function saveResearch(selectedText, response) {
  const { [HISTORY_KEY]: storedHistory = [] } = await chrome.storage.local.get(HISTORY_KEY);
  const entry = {
    id: crypto.randomUUID(),
    selectedText,
    response,
    timestamp: new Date().toISOString()
  };

  let updatedHistory;
  const existingResearch = activeResearchId
    ? storedHistory.find((item) => item.id === activeResearchId)
    : null;

  if (existingResearch) {
    updatedHistory = storedHistory.map((item) => {
      if (item.id !== activeResearchId) {
        return item;
      }

      return {
        ...item,
        selectedText,
        updatedAt: entry.timestamp,
        entries: [...(item.entries || []), entry]
      };
    });
  } else {
    const newResearch = {
      id: crypto.randomUUID(),
      title: truncate(selectedText, 90),
      selectedText,
      updatedAt: entry.timestamp,
      entries: [entry]
    };

    activeResearchId = newResearch.id;
    updatedHistory = [newResearch, ...storedHistory];
  }

  updatedHistory = updatedHistory
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, MAX_HISTORY_ITEMS);

  await chrome.storage.local.set({ [HISTORY_KEY]: updatedHistory });
  const activeResearch = updatedHistory.find((item) => item.id === activeResearchId);
  updateResearchStatus(activeResearch?.title || "");
  renderThreadEntries(activeResearch);
}

async function renderHistory() {
  const { [HISTORY_KEY]: storedHistory = [] } = await chrome.storage.local.get(HISTORY_KEY);

  historyList.innerHTML = "";

  if (!storedHistory.length) {
    historyList.innerHTML = '<p class="history-empty">No recent searches yet.</p>';
    return;
  }

  storedHistory.forEach((item) => {
    const lastEntry = item.entries?.[item.entries.length - 1];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-item";
    button.innerHTML = `
      <span class="history-query">${escapeHtml(truncate(item.title || "Selected text research", 110))}</span>
      <span class="history-meta">${item.entries?.length || 0} saved summaries</span>
      <span class="history-time">${formatTimestamp(item.updatedAt || lastEntry?.timestamp)}</span>
    `;

    button.addEventListener("click", () => {
      activeResearchId = item.id;
      updateResearchStatus(item.title || "");
      setSelectedText(item.selectedText || "");
      setResponse(lastEntry?.response || "");
      renderThreadEntries(item);
    });

    historyList.appendChild(button);
  });
}

async function clearHistory() {
  activeResearchId = null;
  updateResearchStatus();
  await chrome.storage.local.set({ [HISTORY_KEY]: [] });
  await renderHistory();
  renderThreadEntries();
}

async function saveEditedResponse() {
  const editedResponse = responseEditor.value.trim();

  if (!activeResearchId) {
    setResponse("Open a saved research first, or summarize with history enabled before saving edits.");
    return;
  }

  if (!editedResponse) {
    setResponse("Edited summary cannot be empty.");
    return;
  }

  const { [HISTORY_KEY]: storedHistory = [] } = await chrome.storage.local.get(HISTORY_KEY);
  const updatedAt = new Date().toISOString();

  const updatedHistory = storedHistory.map((item) => {
    if (item.id !== activeResearchId) {
      return item;
    }

    const entries = [...(item.entries || [])];
    if (!entries.length) {
      entries.push({
        id: crypto.randomUUID(),
        selectedText: item.selectedText || "",
        response: editedResponse,
        timestamp: updatedAt,
        edited: true
      });
    } else {
      const lastEntry = entries[entries.length - 1];
      entries[entries.length - 1] = {
        ...lastEntry,
        response: editedResponse,
        timestamp: updatedAt,
        edited: true
      };
    }

    return {
      ...item,
      updatedAt,
      entries
    };
  });

  await chrome.storage.local.set({ [HISTORY_KEY]: updatedHistory });
  await renderHistory();
  const activeResearch = updatedHistory.find((item) => item.id === activeResearchId);
  renderThreadEntries(activeResearch);
}

function renderThreadEntries(research = null) {
  threadList.innerHTML = "";

  if (!research?.entries?.length) {
    threadList.innerHTML = '<p class="history-empty">No saved summaries in this research yet.</p>';
    return;
  }

  const activeEntryResponse = responseEditor.value.trim();

  research.entries.forEach((entry) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "thread-item";

    if (activeEntryResponse && entry.response === activeEntryResponse) {
      item.classList.add("thread-item-active");
    }

    item.innerHTML = `
      <span class="thread-item-time">${formatTimestamp(entry.timestamp)}</span>
      <span class="thread-item-text">${escapeHtml(truncate(entry.response, 260))}</span>
    `;

    item.addEventListener("click", () => {
      setResponse(entry.response || "");
      renderThreadEntries(research);
    });

    threadList.appendChild(item);
  });
}

function truncate(value, maxLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
