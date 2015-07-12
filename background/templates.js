var link = document.querySelector('link[rel=import]');

[].forEach.call(link.import.querySelectorAll('script[type="text/html"]'), function (templateElem) {
    templates[templateElem.getAttribute('name')] = templateElem.innerHTML.trim();
});
