var runtimeNamespace = chrome.runtime && chrome.runtime.sendMessage ? "runtime" : "extension";

function Ruler(data) {
    this._width = data.width;
    this._height = data.height;
    this._top = data.top;
    this._left = data.left;
    this._color = data.color;

    var container = document.createElement('div');
    container.innerHTML = templates.ruler();
    console.log(container, container.firstChild);
    var domElem = this.domElem = container.firstChild;
    this._bgElem = domElem.querySelector('.ruler__bg');
    this._textElem = domElem.querySelector('.ruler__text');

    this.update();
}

Ruler.prototype = {
    constructor: Ruler,

    get width() {
        return this._width;
    },

    get height() {
        return this._height;
    },

    get top() {
        return this._top;
    },

    get left() {
        return this._left;
    },

    get color() {
        return this._color.toLowerCase();
    },

    append: function () {
        document.body.appendChild(this.domElem);
    },
    update: function () {
        var domElem = this.domElem;

        ['top', 'left', 'width', 'height'].forEach(function (prop) {
            domElem.style[prop] = this[prop] + 'px';
        }, this);

        this._textElem.innerText = this.width + 'x' + this.height;
        this._bgElem.style.backgroundColor = this.color;
    }
};

var templates;
chrome[runtimeNamespace].onMessage.addListener(function(event, sender, sendResponse) {
    console.log('11111', event);
    if (event.fromDevtools) {
        return;
    }

    switch (event.type) {
        case 'rulerChanged':
            new Ruler(event.ruler).append();
            break;
        case 'templates':
            templates = event.templates;
            Object.keys(templates).forEach(function (templateName) {
                templates[templateName] = Handlebars.compile(templates[templateName]);
            });
            console.log(templates);
            console.log(templates.ruler);
            break;
    }
});

chrome[runtimeNamespace].sendMessage({
    type: 'requestInit'
});
console.log('injected');
