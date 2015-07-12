// Chrome automatically creates a background.html page for this to execute.
// This can access the inspected page via executeScript
// 
// Can use:
// chrome.tabs.*
// chrome.extension.*
var templates = {};

function sendMessageToTab(tabId, message) {
    console.log('sending message', tabId, message.type, message);
    chrome.tabs.sendMessage(tabId, message);
}

function sendMessageToAll(message) {
    chrome.tabs.query({}, function (tabs) {
         for (var i=0; i<tabs.length; ++i) {
            sendMessageToTab(tabs[i].id, message);
        }
    });
}

function handleHighlight(tabId, on, ruler) {
    sendMessageToTab(tabId, {
        type: 'highlight',
        on: on,
        ruler: ruler.id
    });
}

var runtimeNamespace = chrome.runtime && chrome.runtime.sendMessage ? 'runtime' : 'extension';
var ports = [];

function postMessageToAll(message) {
    ports.forEach(function (port) {
        try {
            port.postMessage(message);
        } catch (err) {}
    });
}

chrome.extension.onConnect.addListener(function (port) {
    ports.push(port);

    var devToolsListener = function (message, sender, sendResponse) {
        var tabId = message.tabId;
        getSettings(tabId, function (settings) {
            switch (message.type) {
                case 'rulerCreated':
                    if (!tabId) {
                        return;
                    }

                    var ruler = new Ruler(tabId);
                    ruler.position = settings.rulerDefaultPosition;
                    ruler.setPort(port);
                    if (settings.showRulers) {
                        sendMessageToTab(tabId, {type: 'rulerCreated', ruler: ruler});
                    }
                    port.postMessage({type: 'rulerCreated', ruler: ruler});
                    break;

                case 'rulerChanged':
                    Ruler.getById(message.ruler.id).change(message.ruler);
                    break;

                case 'rulerRemoved':
                    Ruler.getById(message.ruler.id).remove();
                    break;

                case 'removeAllRulers':
                    Ruler.removeAll(tabId);
                    break;

                case 'settingsChanged':
                    handleSettings(tabId, message.settings);
                    break;

                case 'highlight':
                    handleHighlight(tabId, message.on, message.ruler);
                    break;

                case 'requestInit':
                    port.postMessage({type: 'settingsChanged', settings: settings});

                    if (!tabId) {
                        console.warn('No tab is inspected ;(');
                        return;
                    }
                    Ruler.getByTab(tabId).forEach(function (ruler) {
                        ruler.setPort(port);
                        port.postMessage({type: 'rulerCreated', ruler: ruler});
                    });
            }
        });
    }

    port.postMessage({type: 'templates', templates: templates});

    chrome[runtimeNamespace].onMessage.addListener(devToolsListener);

    port.onDisconnect.addListener(function (port) {
        chrome.extension.onMessage.removeListener(devToolsListener);
    });
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    getSettings(null, function (settings) {
        postMessageToAll({type: 'settingsChanged', settings: settings});
    });
});

// Listens to messages sent from the panel
chrome[runtimeNamespace].onMessage.addListener(function (message, sender, sendResponse) {
    if (message.fromDevtools) {
        return;
    }

    getSettings(sender.tab.id, function (settings) {

        switch (message.type) {
            case 'requestInit':
                sendMessageToTab(sender.tab.id, {
                    type: 'templates',
                    templates: templates
                });
                if (settings.showRulers) {
                    Ruler.getByTab(sender.tab.id).forEach(function (ruler) {
                        sendMessageToTab(sender.tab.id, {type: 'rulerCreated', ruler: ruler});
                    });
                }
                break;

            case 'rulerOffsetChanged':
                Ruler.getById(message.rulerId).change(message.offset);
                break;
        }
    });

    return true;
});
