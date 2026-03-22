const SELECTED_TEXT_KEY = "latestSelectedText";
let lastSelectedText = "";

function getCurrentSelectedText() {
  return window.getSelection()?.toString().trim() || "";
}

async function broadcastSelectedText(selectedText) {
  try {
    await chrome.runtime.sendMessage({
      type: "SELECTION_CHANGED",
      selectedText
    });
  } catch (_error) {
    // Ignore when no extension page is listening.
  }
}

async function persistSelectedText(selectedText = getCurrentSelectedText()) {
  const normalizedText = selectedText.trim();

  if (!normalizedText) {
    if (!document.hasFocus()) {
      return;
    }

    lastSelectedText = "";

    try {
      await chrome.storage.local.set({ [SELECTED_TEXT_KEY]: "" });
      await broadcastSelectedText("");
    } catch (error) {
      console.warn("Failed to clear selected text:", error);
    }

    return;
  }

  lastSelectedText = normalizedText;

  try {
    await chrome.storage.local.set({ [SELECTED_TEXT_KEY]: normalizedText });
    await broadcastSelectedText(normalizedText);
  } catch (error) {
    console.warn("Failed to store selected text:", error);
  }
}

document.addEventListener("mouseup", persistSelectedText);
document.addEventListener("keyup", persistSelectedText);
document.addEventListener("selectionchange", () => {
  const selectedText = getCurrentSelectedText();
  persistSelectedText(selectedText);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "GET_SELECTED_TEXT") {
    return false;
  }

  const selectedText = getCurrentSelectedText() || lastSelectedText;
  sendResponse({ selectedText });
  return true;
});
