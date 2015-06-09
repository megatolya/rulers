// This one acts in the context of the panel in the Dev Tools
//
// Can use
// chrome.devtools.*
// chrome.extension.*

var runtimeNamespace = chrome.runtime && chrome.runtime.sendMessage ? 'runtime' : 'extension';
var templates;
var colors;
var port;

function handleSettings(settings) {
    document.querySelector('#show-rulers').checked = settings.showRulers;
}

function sendSettings() {
    var settings = {
        showRulers: document.querySelector('#show-rulers').checked
    };

    sendMessage({
        type: 'settingsChanged',
        settings: settings
    });
}

(function createChannel() {
    port = chrome.extension.connect({
        name: 'Rulers' //Given a Name
    });

    port.onMessage.addListener(function (event) {
        switch (event.type) {
            case 'templates':
                templates = event.templates;
                Object.keys(templates).forEach(function (templateName) {
                    templates[templateName] = Handlebars.compile(templates[templateName]);
                });
                break;

            case 'colors':
                colors = event.colors;
                break;

            case 'rulerCreated':
                new Ruler(event.ruler).append();
                break;

            case 'settingsChanged':
                handleSettings(event.settings);
                break;

            case 'rulerRemoved':
                Ruler.getById(event.ruler).remove();
                break;
        }
    });
}());

// This sends an object to the background page 
// where it can be relayed to the inspected page
function sendMessage(event) {
    event.tabId = chrome.devtools.inspectedWindow.tabId;
    event.fromDevtools = true;
    chrome.extension.sendMessage(event);
}

document.addEventListener('DOMContentLoaded', function () {
    sendMessage({type: 'requestInit'});

    document.querySelector('#add-ruler').addEventListener('click', function() {
        sendMessage({type: 'rulerCreated'});
    }, false);

    document.querySelector('#remove-all-rulers').addEventListener('click', function() {
        sendMessage({type: 'removeAllRulers'});
    }, false);

    [].forEach.call(document.querySelectorAll('[i18n]'), function (elem) {
        var msg = null;

        try {
            msg = chrome.i18n.getMessage(elem.getAttribute('i18n'));
        } catch (err) {}

        if (!msg) {
            return;
        }

        elem.innerText = msg;
    });

    document.querySelector('#show-rulers').addEventListener('change', function () {
        sendSettings();
    }, false);
});
