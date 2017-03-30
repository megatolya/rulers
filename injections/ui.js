var runtimeNamespace = chrome.runtime && chrome.runtime.sendMessage ? "runtime" : "extension";

var rulers = {};
var DRAG_START_TIMEOUT = 100;

function getOffset(element) {
    var rect = element.getBoundingClientRect()

    return {
        top: rect.top + document.body.scrollTop,
        left: rect.left + document.body.scrollLeft
    };
}

function initDragAndDrop(ruler, e) {
    var dndTimeout = setTimeout(function() {
            clearTimeoutFn();
            onDragStart(ruler, e);
        }, DRAG_START_TIMEOUT),
        clearTimeoutFn = function() {
            clearTimeout(dndTimeout);
            document.removeEventListener('mouseup', clearTimeoutFn, false);
        };

    document.addEventListener('mouseup', clearTimeoutFn, false);
}

const initialStyles = `
.ruler__bg {
    display: block;
    width: 100%;
    height: 100%;
    opacity: 0.3;
    background: red;
    left: 0;
    position: absolute;
    top: 0;
    -webkit-user-select: none;
    user-select: none;
}

.ruler__text {
    z-index: 1;
    position: absolute;
    top: 50%;
    color: white;
    display: block;
    left: 50%;
    transform: translate3d(-50%, -50%, 0);
    white-space: nowrap;
    -webkit-user-select: none;
    user-select: none;
}
`;

var posDiff = null;
var _onDrag;
var _onDragEnd;

function onDragStart(ruler, e) {
    _onDrag = onDrag.bind(null, ruler);
    _onDragEnd = onDragEnd.bind(null, ruler);
    document.addEventListener('mousemove', _onDrag, false);
    document.addEventListener('mouseup', _onDragEnd, false);

    var offset = getOffset(ruler.domElem);

    posDiff = {
        left: e.clientX - offset.left,
        top: e.clientY - offset.top
    };

    ruler.setOffset({
        left: e.clientX - posDiff.left,
        top: e.clientY - posDiff.top
    });
}

function onDrag(ruler, e) {
    var left = e.clientX - posDiff.left;
    var top = e.clientY - posDiff.top;

    if (ruler.position === 'fixed') {
        left -= window.scrollX;
        top -= window.scrollY;
    }

    ruler.setOffset({
        left: left,
        top: top
    });
}

function onDragEnd(ruler, e) {
    posDiff = null;
    document.removeEventListener('mousemove', _onDrag, false);
    document.removeEventListener('mouseup', _onDragEnd, false);
}

function Ruler(data) {
    [
        'id',
        'width',
        'height',
        'bottom',
        'right',
        'top',
        'left',
        'color',
        'opacity',
        'position'
    ].forEach(function (prop) {
        this[prop] = data[prop];
    }, this);

    rulers[this.id] = this;

    var domElem = this.domElem = document.createElement('div');
    const shadow = domElem.createShadowRoot();
    shadow.appendChild(this._bgElem = document.createElement('div'));
    this._bgElem.classList.add('ruler__bg');
    shadow.appendChild(this._textElem = document.createElement('span'));
    this._textElem.classList.add('ruler__text');
    shadow.appendChild(this._style = document.createElement('style'));
    this._style.innerHTML = initialStyles;

    this.update();
    this.append();

    // this.domElem.addEventListener('mousedown', function (e) {
        // initDragAndDrop(this, e);
    // }.bind(this), false);

    this._sendOffset = _.throttle(function () {
        chrome[runtimeNamespace].sendMessage({
            type: 'rulerOffsetChanged',
            rulerId: this.id,
            offset: {
                left: this.left,
                top: this.top
            }
        });
    }.bind(this), 200);
}

Ruler.prototype = {
    constructor: Ruler,

    append: function () {
        document.body.appendChild(this.domElem);
    },

    update: function () {
        var domElem = this.domElem;

        [
            'bottom',
            'right',
            'top',
            'left',
            'width',
            'height'
        ].forEach(function (prop) {
            domElem.style[prop] = this[prop]
                ? (this[prop] + 'px')
                : null;
        }, this);

        [
            'position'
        ].forEach(function (prop) {
            domElem.style[prop] = this[prop];
        }, this);

        var text = this._textElem;

        text.innerText = this.width + 'x' + this.height;
        this._bgElem.style.backgroundColor = this.color;
        this._bgElem.style.opacity = this.opacity / 100;

        var fontMinimum = 14;

        if (this.width < 90) {
            fontMinimum = Math.min(fontMinimum, 8);
        }

        if (this.height < 29) {
            fontMinimum = Math.min(fontMinimum, 8);
        }

        text.style.fontSize = fontMinimum + 'px';
        text.style.color = utils.getFontColorByBackgroundColor(this.color);
    },

    change: function (data) {
        [
            'id',
            'width',
            'height',
            'top',
            'left',
            'bottom',
            'right',
            'color',
            'opacity',
            'position'
        ].forEach(function (prop) {
            this[prop] = data[prop];
        }, this);

        this.update();
    },

    remove: function () {
        this.domElem.parentNode.removeChild(this.domElem);
        delete rulers[this.id];
    },

    highlight: function (on) {
        if (on) {
            this.domElem.classList.add('ruler_highlighted');
        } else {
            this.domElem.classList.remove('ruler_highlighted');
        }
    },

    setOffset: function(coords) {
        var element = this.domElem;

        this.left = coords.left;
        this.top = coords.top;
        element.style.left = coords.left;
        element.style.top = coords.top;
        this._sendOffset();
    }
};

Ruler.getById = function (id, soft) {
    return rulers[id];
};

var templates;

chrome[runtimeNamespace].onMessage.addListener(function(event, sender, sendResponse) {
    if (event.fromDevtools) {
        return;
    }

    switch (event.type) {
        case 'rulerCreated':
            new Ruler(event.ruler);
            break;

        case 'rulerChanged':
            (Ruler.getById(event.ruler.id) || new Ruler(event.ruler)).change(event.ruler);
            break;

        case 'rulerRemoved':
            var ruler = Ruler.getById(event.ruler);
            if (ruler) {
                ruler.remove();
            }
            break;

        case 'highlight':
            var ruler = Ruler.getById(event.ruler);
            if (ruler) {
                ruler.highlight(event.on);
            }
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
