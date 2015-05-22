// Chrome automatically creates a background.html page for this to execute.
// This can access the inspected page via executeScript
// 
// Can use:
// chrome.tabs.*
// chrome.extension.*
function sendMessageToTab(tabId, message) {
    chrome.tabs.sendMessage(tabId, message);
}

var runtimeNamespace = chrome.runtime && chrome.runtime.sendMessage ? "runtime" : "extension";

chrome.extension.onConnect.addListener(function (port) {
    var devToolsListener = function (message, sender, sendResponse) {
        switch (message.action) {
            case 'addRuler':
                if (!message.tabId) {
                    return;
                }
                console.log('adding ruler', message);
                sendMessageToTab(message.tabId, {type: 'rulerChanged', ruler: new Ruler()});
                break;
        }
    }

    // Listens to messages sent from the panel
    chrome[runtimeNamespace].onMessage.addListener(devToolsListener);

    port.onDisconnect.addListener(function(port) {
        chrome.extension.onMessage.removeListener(devToolsListener);
    });

    chrome[runtimeNamespace].onMessage.addListener(function(msg, sender, sendResponse) {
        if (msg.fromDevtools) {
            return;
        }
        console.log('background runtime listener', msg);

        return true;
    });
});




