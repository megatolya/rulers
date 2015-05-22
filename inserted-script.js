var runtimeNamespace = chrome.runtime && chrome.runtime.sendMessage ? "runtime" : "extension";

function Ruler(data) {
    console.log(data);
    this._width = data.width;
    this._height = data.height;
    this._top = data.top;
    this._left = data.left;

    var domElem = this.domElem = document.createElement('i');
    var text = document.createElement('i');
    var bg = document.createElement('i');
    domElem.appendChild(text);
    domElem.appendChild(bg);

    domElem.classList.add('ruler');
    bg.classList.add('ruler__bg');
    text.classList.add('ruler__text');
    text.innerText = this.width + 'x' + this.height;

    this._text = text;
    this._bg = bg;

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

    append: function () {
        document.body.appendChild(this.domElem);
    },

    update: function () {
        var domElem = this.domElem;

        ['top', 'left', 'width', 'height'].forEach(function (prop) {
            console.log(prop, this[prop]);
            domElem.style[prop] = this[prop] + 'px';
        }, this);
    }
};

chrome[runtimeNamespace].onMessage.addListener(function(message, sender, sendResponse) {
    console.log('api event', message);

    if (message.fromDevtools) {
        return;
    }

    switch (message.type) {
        case 'rulerChanged':
            new Ruler(message.ruler).append();
            break;
    }
});
