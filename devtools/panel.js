// This one acts in the context of the panel in the Dev Tools
//
// Can use
// chrome.devtools.*
// chrome.extension.*

var runtimeNamespace = chrome.runtime && chrome.runtime.sendMessage ? 'runtime' : 'extension';
var templates;
var colors;
var port;

function getSelectValue(select) {
    return select.options[select.selectedIndex].value;
}

function setSelectValueFactory(select, options) {
    return function (value) {
        select.selectedIndex = options.indexOf(value);
    }
}

var oldSettings;

function handleSettings(settings) {
    oldSettings = settings;
    settings = _.assign(getSettings(), settings);
    $('#set-show-rulers').checked = settings.showRulers;
    setRulerPositionSelect(settings.rulerDefaultPosition);
    $('#set-ruler-default-position').value = settings.rulerDefaultPosition;
    //$('#set-create-rulers-in-viewport').checked = settings.createRulersInViewport;
}

var setRulerPositionSelect;

var $ = document.querySelector.bind(document);
var $$ = document.querySelectorAll.bind(document);

function getSettings() {
    return {
        showRulers: $('#set-show-rulers').checked,
        rulerDefaultPosition: getSelectValue($('#set-ruler-default-position')),
        //createRulersInViewport: $('#set-create-rulers-in-viewport').checked
    };
}

function sendSettings() {
    var settings = getSettings();

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
                new Ruler(event.ruler);
                break;

            case 'settingsChanged':
                handleSettings(event.settings);
                break;

            case 'rulerRemoved':
                Ruler.getById(event.ruler).remove();
                break;

            case 'rulerChanged':
                Ruler.getById(event.ruler.id).change(event.ruler);
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

var views = {};

function setSettingsToInputs() {
    if (oldSettings) {
        setRulerPositionSelect(oldSettings.rulerDefaultPosition);
    }
}

function setView(newViewName) {
    Object.keys(views).forEach(function (viewName) {
        if (viewName === newViewName) {
            views[viewName].style.display = 'block';
        } else {
            views[viewName].style.display = 'none';
        }
    });

    [].forEach.call($$('.set-view-button'), function (element) {
        element.classList.remove('selected');
    });
    $('#set-view-' + newViewName).classList.add('selected');
    setSettingsToInputs();
};

document.addEventListener('DOMContentLoaded', function () {
    setRulerPositionSelect = setSelectValueFactory($('#set-ruler-default-position'), ['absolute', 'fixed']);
    setSettingsToInputs();
    sendMessage({type: 'requestInit'});

    [].forEach.call($$('[data-view]'), function (element) {
        views[element.getAttribute('data-view')] = element;
    });

    $('#add-ruler').addEventListener('click', function() {
        sendMessage({type: 'rulerCreated'});
    }, false);

    [
        'rulers',
        'settings'
    ].forEach(function (view) {
        var element = $('#set-view-' + view);

        if (!element) {
            return;
        }

        element.addEventListener('click', function () {
            setView(view);
        }, false);
    });

    setView('rulers');

    [].forEach.call($$('[settings-changer]'), function (element) {
        element.addEventListener('change', function () {
            sendSettings();
        });
    });

    [].forEach.call($$('[i18n]'), function (elem) {
        var msg = null;
        var attr = elem.getAttribute('i18n');

        try {
            msg = chrome.i18n.getMessage(attr);
        } catch (err) {}

        if (!msg) {
            elem.innerText = attr;
            return;
        }

        elem.innerText = msg;
    });

    $('#remove-all-rulers').addEventListener('click', function() {
        sendMessage({type: 'removeAllRulers'});
    }, false);
});
