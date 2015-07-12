var tabsSettings = {};
function getDefaults() {
    return {
        showRulers: true,
        rulerDefaultPosition: 'absolute',
        createRulersInViewport: true
    };
};

function getSettings(tabId, callback) {
    chrome.storage.sync.get(function (settings) {
        if (tabId === undefined) {
            callback(settings);
            return;
        }
        callback(_.assign(getDefaults(), tabsSettings[tabId] || {}, settings));
    });
}

function saveSettings(tabId, newSettings) {
    tabsSettings[tabId] = _.assign({}, tabsSettings[tabId] || {}, newSettings);
}

function handleSettings(tabId, newSettings) {
    saveSettings(tabId, newSettings);

    if (tabId !== undefined) {
        sendMessageToTab(tabId, {
            type: 'settingsChanged',
            settings: newSettings
        });
    }

    var globalSettings = {};

    constants.GLOBAL_SETTINGS.forEach(function (key) {
        globalSettings[key] = newSettings[key];
    });

    chrome.storage.sync.set(globalSettings);

    sendMessageToAll({
        type: 'settingsChanged',
        settings: newSettings
    });

    Ruler.getByTab(tabId).forEach(function (ruler) {
        if (newSettings.showRulers) {
            sendMessageToTab(tabId, {type: 'rulerChanged', ruler: ruler});
        } else {
            sendMessageToTab(tabId, {type: 'rulerRemoved', ruler: ruler.id});
        }
    });
}

