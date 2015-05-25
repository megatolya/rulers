Handlebars.registerHelper('i18n', function(str) {
    console.log('i18ning', str);
    try {
        str = chrome.i18n.getMessage(str);
    } catch (err) {
        console.log(err);
        str = str + ' failed!';
    }

    console.log('str', str);
    return str;
}); 
