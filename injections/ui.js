var runtimeNamespace = chrome.runtime && chrome.runtime.sendMessage ? "runtime" : "extension";

var rulers = {};

function Ruler(data) {
    [
        'id',
        'width',
        'height',
        'top',
        'left',
        'color',
        'opacity'
    ].forEach(function (prop) {
        this['_' + prop] = data[prop];
    }, this);

    rulers[this._id] = this;

    var container = document.createElement('div');
    container.innerHTML = templates.ruler();
    var domElem = this.domElem = container.firstChild;
    this._bgElem = domElem.querySelector('.ruler__bg');
    this._textElem = domElem.querySelector('.ruler__text');

    this.update();
}

Ruler.prototype = {
    constructor: Ruler,

    append: function () {
        document.body.appendChild(this.domElem);
    },

    get color() {
        return this._color.toLowerCase();
    },

    update: function () {
        var domElem = this.domElem;

        ['top', 'left', 'width', 'height'].forEach(function (prop) {
            domElem.style[prop] = this['_' + prop] + 'px';
        }, this);

        this._textElem.innerText = this._width + 'x' + this._height;
        this._bgElem.style.backgroundColor = this.color;
        this._bgElem.style.opacity = this._opacity / 100;
    },

    change: function (data) {
        [
            'id',
            'width',
            'height',
            'top',
            'left',
            'color',
            'opacity'
        ].forEach(function (prop) {
            this['_' + prop] = data[prop];
        }, this);

        this.update();
    },

    remove: function () {
        this.domElem.parentNode.removeChild(this.domElem);
        delete rulers[this._id];
    }
};

Ruler.getById = function (id) {
    function throwErr() {
        throw new Error('Ruler not found, id = ' + id);
    }

    return rulers[id] || throwErr();
};

var templates;
chrome[runtimeNamespace].onMessage.addListener(function(event, sender, sendResponse) {
    if (event.fromDevtools) {
        return;
    }

    switch (event.type) {
        case 'rulerCreated':
            new Ruler(event.ruler).append();
            break;

        case 'rulerChanged':
            Ruler.getById(event.ruler.id).change(event.ruler);
            break;

        case 'rulerRemoved':
            Ruler.getById(event.ruler).remove();
            break;

        case 'templates':
            templates = event.templates;
            Object.keys(templates).forEach(function (templateName) {
                templates[templateName] = Handlebars.compile(templates[templateName]);
            });
            break;
    }
});

chrome[runtimeNamespace].sendMessage({
    type: 'requestInit'
});
