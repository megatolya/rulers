var tabsSettings = {};

function getSettings(tabId) {
    return tabsSettings[tabId] || {
        showRulers: true
    };
}

function saveSettings(tabId, settings) {
    tabsSettings[tabId] = settings;
}

function handleSettings(tabId, newSettings) {
    var oldSettings = getSettings(tabId);
    var equal = _.isEqual(oldSettings, newSettings);

    saveSettings(tabId, newSettings);

    if (!equal) {
        sendMessageToTab(tabId, {
            type: 'settingsChanged',
            settings: newSettings
        });
    }

    Ruler.getByTab(tabId).forEach(function (ruler) {
        if (newSettings.showRulers) {
            sendMessageToTab(tabId, {type: 'rulerChanged', ruler: ruler});
        } else {
            console.log('fake remove', ruler.id);
            sendMessageToTab(tabId, {type: 'rulerRemoved', ruler: ruler.id});
        }
    });
}

