Handlebars.registerHelper('i18n', function(str) {
    try {
        str = chrome.i18n.getMessage(str);
    } catch (err) {
        str = str + ' failed!';
    }

    return str;
}); 
