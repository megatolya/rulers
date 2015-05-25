var templates = {};

[].forEach.call(document.querySelectorAll('script[type="text/html"]'), function (templateElem) {
    templates[templateElem.getAttribute('name')] = templateElem.innerHTML.trim();
});
