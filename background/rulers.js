var id = 0;
var rulersPositionRatio = 0;
var leftDelta = 0;

var colors = _.shuffle('aliceblue aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkturquoise darkviolet deeppink deepskyblue dimgray dodgerblue firebrick forestgreen fuchsia gainsboro gold goldenrod gray green greenyellow honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray snow springgreen steelblue tan teal thistle tomato turquoise violet wheat yellow yellowgreen'.split(' '));

function throwErr(text) {
    throw new Error(text);
}

document.addEventListener('DOMContentLoaded', function () {
    var tempElem = document.createElement('div');
    document.body.appendChild(tempElem);
    colors = colors.map(function (color) {
        tempElem.style.color = color;
        color = window.getComputedStyle(tempElem).color;
        color = color.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
        return (color && color.length === 4) ? '#' +
            ('0' + parseInt(color[1],10).toString(16)).slice(-2) +
            ('0' + parseInt(color[2],10).toString(16)).slice(-2) +
            ('0' + parseInt(color[3],10).toString(16)).slice(-2) : '';
    });
    document.body.removeChild(tempElem);
});

var tabRulers = {};
var idToRule = {};

var count = 0;

function Ruler(tabId, data) {
    this.tabId = tabId;
    this.id = 'id' + id++;
    Object.keys(data).forEach(function (prop) {
        this[prop] = data[prop];
    }, this);

    idToRule[this.id] = this;
    var rulersForTab = tabRulers[this.tabId] = tabRulers[this.tabId] || [];
    rulersForTab.push(this);
}

Ruler.prototype = {
    constructor: Ruler,

    remove: function () {
        getSettings(this.tabId, function (settings) {
            if (settings.showRulers) {
                sendMessageToTab(this.tabId, {type: 'rulerRemoved', ruler: this.id});
            }

            this.port.postMessage({type: 'rulerRemoved', ruler: this.id});

            delete idToRule[this.id];
            tabRulers[this.tabId].splice(tabRulers[this.tabId].indexOf(this), 1);
        }.bind(this));
    },

    change: function (diff, soft) {
        var ruler = {
            id: this.id
        };

        [
            'position',
            'width',
            'height',
            'top',
            'left',
            'right',
            'bottom',
            'color',
            'opacity'
        ].forEach(function (prop) {
            if (soft) {
                this[prop] = diff[prop];
            } else {
                if (prop in diff) {
                    this[prop] = diff[prop];
                } else {
                    delete this[prop];
                }
            }

            ruler[prop] = this[prop];
        }, this);

        getSettings(this.tabId, function (settings) {
            if (settings.showRulers) {
                sendMessageToTab(this.tabId, {type: 'rulerChanged', ruler: ruler});
            }

            this.port.postMessage({type: 'rulerChanged', ruler: ruler});
        }.bind(this));
    },

    setPort: function (port) {
        this.port = port;
    },

    copy: function () {
        var data = {};
        [
            'width',
            'height',
            'top',
            'left',
            'opacity',
            'color',
            'position'
        ].forEach(function (prop) {
            data[prop] = this[prop];
        }, this);
        return new Ruler(this.tabId, data);
    }
};

Ruler.getByTab = function (tabId) {
    var rulersForTab = tabRulers[tabId] = tabRulers[tabId] || [];

    return rulersForTab.slice();
};

Ruler.getById = function (id) {
    return idToRule[id] || throwErr('Ruler not found by id ' + id);
};

Ruler.removeAll = function (tabId) {
    rulersPositionRatio = 1;
    leftDelta = 0;
    this.getByTab(tabId).forEach(function (ruler) {
        ruler.remove();
    });
};

Ruler.create = function (tabId) {
    var INITIAL_COORDS = {
        left: 15,
        top: 15
    };

    rulersPositionRatio++;
    if (rulersPositionRatio > 15) {
        rulersPositionRatio = 1;
        leftDelta += INITIAL_COORDS.left * 5;
    }

    var data = {
        width: 100,
        height: 100,
        top: INITIAL_COORDS.top * rulersPositionRatio,
        left: INITIAL_COORDS.left * rulersPositionRatio + leftDelta,
        right: 0,
        bottom: 0,
        opacity: 70,
        color: colors[(count++) % colors.length],
        positionXType: 'left',
        positionYType: 'top'
    };
    return new Ruler(tabId, data);
};
