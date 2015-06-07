// Chrome automatically creates a background.html page for this to execute.
// This can access the inspected page via executeScript
// 
// Can use:
// chrome.tabs.*
// chrome.extension.*
var templates = {};


function sendMessageToTab(tabId, event) {
    console.log('sending event to', tabId, event.type, event);
    chrome.tabs.sendMessage(tabId, event);
}


function handleHighlight(tabId, on, ruler) {
    sendMessageToTab(tabId, {
        type: 'highlight',
        on: on,
        ruler: ruler.id
    });
}

var runtimeNamespace = chrome.runtime && chrome.runtime.sendMessage ? "runtime" : "extension";
chrome.extension.onConnect.addListener(function (port) {
    var devToolsListener = function (event, sender, sendResponse) {
        var tabId = event.tabId;
        var settings = getSettings(tabId);
        console.log('receiving message', event);

        switch (event.type) {
            case 'rulerCreated':
                if (!tabId) {
                    return;
                }

                var ruler = new Ruler(tabId);
                ruler.setPort(port);
                if (settings.showRulers) {
                    sendMessageToTab(tabId, {type: 'rulerCreated', ruler: ruler});
                }
                port.postMessage({type: 'rulerCreated', ruler: ruler});
                break;

            case 'rulerChanged':
                Ruler.getById(event.ruler.id).change(event.ruler);
                break;

            case 'rulerRemoved':
                Ruler.getById(event.ruler.id).remove();
                break;

            case 'settingsChanged':
                handleSettings(tabId, event.settings);
                break;

            case 'highlight':
                handleHighlight(tabId, event.on, event.ruler);
                break;

            case 'requestInit':
                if (!tabId) {
                    console.warn('No tab is inspected ;(');
                    return;
                }
                port.postMessage({type: 'settingsChanged', settings: getSettings(tabId)});
                Ruler.getByTab(tabId).forEach(function (ruler) {
                    ruler.setPort(port);
                    port.postMessage({type: 'rulerCreated', ruler: ruler});
                });
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
            var rulers = Ruler.getByTab(sender.tab.id).forEach(function (ruler) {
                sendMessageToTab(sender.tab.id, {type: 'rulerCreated', ruler: ruler});
            });
            break;
    }

    return true;
});
