// Chrome automatically creates a background.html page for this to execute.
// This can access the inspected page via executeScript
// 
// Can use:
// chrome.tabs.*
// chrome.extension.*
function sendMessageToTab(tabId, event) {
    console.log('sending event to', tabId, event.type, event);
    chrome.tabs.sendMessage(tabId, event);
}

var runtimeNamespace = chrome.runtime && chrome.runtime.sendMessage ? "runtime" : "extension";

chrome.extension.onConnect.addListener(function (port) {
    var devToolsListener = function (event, sender, sendResponse) {
    console.log('receiving message', event);
        switch (event.type) {
            case 'rulerCreated':
                if (!event.tabId) {
                    return;
                }

                var ruler = new Ruler();
                sendMessageToTab(event.tabId, {type: 'rulerCreated', ruler: ruler});
                port.postMessage({type: 'rulerCreated', ruler: ruler});
                break;

            case 'rulerChanged':
                sendMessageToTab(event.tabId, {type: 'rulerChanged', ruler: event.ruler});
                break;
            case 'rulerRemoved':
                sendMessageToTab(event.tabId, {type: 'rulerRemoved', ruler: event.ruler});
                port.postMessage({type: 'rulerRemoved', ruler: event.ruler});
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
