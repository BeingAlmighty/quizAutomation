let MODE = null;

chrome.runtime.onMessage.addListener(
    (msg, sender, sendResponse) => {

    if (msg.type === "START_LEARN") {
        MODE = "LEARN";

        console.log("Learn mode started");

        chrome.tabs.query(
            { active: true, currentWindow: true },
            (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(
                        tabs[0].id,
                        { type: "LEARN_NOW" }
                    );
                }
            }
        );

        sendResponse({ ok: true });
        return;
    }

    if (msg.type === "START_SOLVE") {
        MODE = "SOLVE";

        console.log("Solve mode started");

        chrome.tabs.query(
            { active: true, currentWindow: true },
            (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(
                        tabs[0].id,
                        { type: "SOLVE_NOW" }
                    );
                }
            }
        );

        sendResponse({ ok: true });
        return;
    }

    if (msg.type === "START_LEARN_SIMPLE") {
        MODE = "SIMPLE_LEARN";

        console.log("Simple learn mode started");

        chrome.tabs.query(
            { active: true, currentWindow: true },
            (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(
                        tabs[0].id,
                        { type: "SIMPLE_LEARN_NOW" }
                    );
                }
            }
        );

        sendResponse({ ok: true });
        return;
    }

    if (msg.type === "START_SOLVE_SIMPLE") {
        MODE = "SIMPLE_SOLVE";

        console.log("Simple solve mode started");

        chrome.tabs.query(
            { active: true, currentWindow: true },
            (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(
                        tabs[0].id,
                        { type: "SIMPLE_SOLVE_NOW" }
                    );
                }
            }
        );

        sendResponse({ ok: true });
        return;
    }

    if (msg.type === "STOP") {
        MODE = null;

        console.log("Automation stopped");

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
                console.log("Results saved");
                sendResponse({ ok: true });
            }
        );

        return true;
    }
});

chrome.tabs.onUpdated.addListener(
    (tabId, changeInfo, tab) => {

    if (changeInfo.status !== "complete") return;

    const url = tab.url || "";

    if (url.includes("/review")) {

        console.log(
            "Review page detected, mode:",
            MODE
        );

        if (MODE === "LEARN") {

            console.log("Running review learn");

            chrome.tabs.sendMessage(
                tabId,
                { type: "REVIEW_LEARN" }
            );
        }

        if (MODE === "SIMPLE_LEARN") {

            console.log("Running simple review learn");

            chrome.tabs.sendMessage(
                tabId,
                { type: "REVIEW_SIMPLE_LEARN" }
            );
        }
    }
});