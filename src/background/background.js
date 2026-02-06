let MODE = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

    if (msg.type === "START_LEARN") {
        MODE = "LEARN";
        console.log("🟢 Learn mode started");
        sendResponse({ ok: true });
        return;
    }

    if (msg.type === "START_SOLVE") {
        MODE = "SOLVE";
        console.log("🧠 Solve mode started");

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { type: "SOLVE_NOW" });
            }
        });
        sendResponse({ ok: true });
        return;
    }
    if(msg.type === "START_LEARN_SIMPLE"){
        MODE = "SIMPLE_LEARN";
        console.log("Simple Learn Mode Started.")
        sendResponse({ ok: true });
    }

    if (msg.type === "STOP") {
        MODE = null;
        console.log("🛑 Automation stopped");
        sendResponse({ ok: true });
        return;
    }

    if (msg.type === "GET_MODE") {
        sendResponse({ mode: MODE });
        return;
    }

    if (msg.type === "SAVE_RESULTS") {
        chrome.storage.local.set(
            { quizResults: msg.payload },
            () => {
                console.log("✅ Results saved");
                sendResponse({ ok: true });
            }
        );
        return true;
    }
});