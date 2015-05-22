// This one acts in the context of the panel in the Dev Tools
//
// Can use
// chrome.devtools.*
// chrome.extension.*

var runtimeNamespace = chrome.runtime && chrome.runtime.sendMessage ? "runtime" : "extension";

(function createChannel() {
    //Create a port with background page for continous message communication
    var port = chrome.extension.connect({
        name: "Sample Communication" //Given a Name
    });

    // Listen to messages from the background page
    port.onMessage.addListener(function (message) {
        console.log('message from bg page (port)', message);
      //document.querySelector('#insertmessagebutton').innerHTML = message.content;
      // port.postMessage(message);
    });

}());

// This sends an object to the background page 
// where it can be relayed to the inspected page
function sendMessage(message) {
    console.log('sending message');
    message.tabId = chrome.devtools.inspectedWindow.tabId;
    message.fromDevtools = true;
    chrome.extension.sendMessage(message);
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#add-ruler').addEventListener('click', function() {
        console.log('click');
        sendMessage({action: 'addRuler'});
    }, false);
});
console.log('panel is working');
