Handlebars.registerHelper('i18n', function(str) {
    try {
        str = chrome.i18n.getMessage(str);
    } catch (err) {
        str = str + ' failed!';
    }

    return str;
});

Handlebars.registerHelper('option', function(value, positionType) {
    return `<option ${positionType === value ? 'selected' : null}>${value}</option>`;
});

Handlebars.registerHelper('inputType', function(value, positionType) {
    return positionType === value ? 'number' : 'hidden';
});
