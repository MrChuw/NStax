browser.action.onClicked.addListener((tab) => {
    browser.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (tabs.length === 0) {
            console.error("No active tab found.");
            return;
        }

        const activeTab = tabs[0];
        const {url} = activeTab;

        if (!url.startsWith("https://www.nationstates.net/page=show_dilemma/dilemma=")) {
            console.warn("Issue page not detected in the active tab.");
            browser.windows.create({
                url: browser.runtime.getURL("options/index.html"),
                type: "popup",
                width: 1800,
                height: 1000
            }, (window) => {
                browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
                    if (tabId === window.tabs[0].id && changeInfo.status === "complete") {
                        const dilemmaId = url.replace("https://www.nationstates.net/page=show_dilemma/dilemma=", "");
                        browser.tabs.sendMessage(tabId, { data: dilemmaId }, (response) => {
                            if (response && response.status === "received") {
                                console.log("Data received by popup:", dilemmaId);
                            } else {
                                console.error("Failed to send data to popup.");
                            }
                        });
                    }
                });
            });
            return;
        }

        browser.windows.create({
            url: browser.runtime.getURL("index.html"),
            type: "popup",
            width: 1600,
            height: 800
        }, (window) => {
            browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
                if (tabId === window.tabs[0].id && changeInfo.status === "complete") {
                    const dilemmaId = url.replace("https://www.nationstates.net/page=show_dilemma/dilemma=", "");
                    browser.tabs.sendMessage(tabId, { data: dilemmaId }, (response) => {
                        if (response && response.status === "received") {
                            console.log("Data received by popup:", dilemmaId);
                        } else {
                            console.error("Failed to send data to popup.");
                        }
                    });
                }
            });
        });
    });
});