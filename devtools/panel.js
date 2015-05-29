// This one acts in the context of the panel in the Dev Tools
//
// Can use
// chrome.devtools.*
// chrome.extension.*

var runtimeNamespace = chrome.runtime && chrome.runtime.sendMessage ? "runtime" : "extension";
var templates;
var colors;

(function createChannel() {
    //Create a port with background page for continous message communication
    var port = chrome.extension.connect({
        name: "Sample Communication" //Given a Name
    });

    // Listen to messages from the background page
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

            case 'rulerRemoved':
                console.log('removing', event);
                Ruler.getById(event.ruler.id).remove();
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
    console.log('sending message', event);
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#add-ruler').addEventListener('click', function() {
        sendMessage({type: 'rulerCreated'});
    }, false);
});
console.log('panel is working');
