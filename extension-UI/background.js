const SELECTED_TEXT_KEY = "latestSelectedText";

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.windowId || !tab.id) {
    return;
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString().trim() || ""
    });

    const selectedText = result?.result?.trim() || "";

    if (selectedText) {
      await chrome.storage.local.set({ [SELECTED_TEXT_KEY]: selectedText });
    }
  } catch (error) {
    console.warn("Failed to capture selected text before opening side panel:", error);
  }

  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (error) {
    console.error("Failed to open side panel:", error);
  }
});
