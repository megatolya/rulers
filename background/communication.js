// Chrome automatically creates a background.html page for this to execute.
// This can access the inspected page via executeScript
// 
// Can use:
// chrome.tabs.*
// chrome.extension.*
function sendMessageToTab(tabId, event) {
    console.log('sending event to', tabId);
    chrome.tabs.sendMessage(tabId, event);
}

var runtimeNamespace = chrome.runtime && chrome.runtime.sendMessage ? "runtime" : "extension";

chrome.extension.onConnect.addListener(function (port) {
    var devToolsListener = function (event, sender, sendResponse) {
        switch (event.type) {
            case 'addRuler':
                if (!event.tabId) {
                    return;
                }

                var ruler = new Ruler();
                sendMessageToTab(event.tabId, {type: 'rulerChanged', ruler: ruler});
                port.postMessage({type: 'rulerChanged', ruler: ruler});
                break;
        }
    }

    port.postMessage({type: 'templates', templates: templates});

    chrome[runtimeNamespace].onMessage.addListener(devToolsListener);

    port.onDisconnect.addListener(function(port) {
        chrome.extension.onMessage.removeListener(devToolsListener);
    });
});

// Listens to messages sent from the panel
chrome[runtimeNamespace].onMessage.addListener(function(event, sender, sendResponse) {
    if (event.fromDevtools) {
        return;
    }

    switch (event.type) {
        case 'requestInit':
            sendMessageToTab(sender.tab.id, {
                type: 'templates',
                templates: templates
            });
            break;
    }

    return true;
});
