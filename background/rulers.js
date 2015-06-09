var INITIAL_WIDTH = 100;
var INITIAL_HEIGHT = 100;
var INITIAL_OPACITY = 30;
var INITIAL_COORDS = {
    left: 15,
    top: 15
};

var id = 0;
var rulersPositionRatio = 0;
var leftDelta = 0;

var colors = _.shuffle('aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkturquoise darkviolet deeppink deepskyblue dimgray dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'.split(' '));

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

function Ruler(tabId, port) {
    rulersPositionRatio++;
    if (rulersPositionRatio > 15) {
        rulersPositionRatio = 1;
        leftDelta += INITIAL_COORDS.left * 5;
    }

    this.tabId = tabId;
    this._port = port;

    this.id = 'id' + id++;
    this.width = INITIAL_WIDTH;
    this.height = INITIAL_HEIGHT;
    this.top = INITIAL_COORDS.top * rulersPositionRatio;
    this.left = INITIAL_COORDS.left * rulersPositionRatio + leftDelta;
    this.opacity = INITIAL_OPACITY;
    this.color = colors[id % colors.length];

    idToRule[this.id] = this;
    var rulersForTab = tabRulers[this.tabId] = tabRulers[this.tabId] || [];
    rulersForTab.push(this);
}

Ruler.prototype = {
    constructor: Ruler,

    remove: function () {
        var settings = getSettings(this.tabId);
        if (settings.showRulers) {
            sendMessageToTab(this.tabId, {type: 'rulerRemoved', ruler: this.id});
        }

        this.port.postMessage({type: 'rulerRemoved', ruler: this.id});

        delete idToRule[this.id];
        tabRulers[this.tabId].splice(tabRulers[this.tabId].indexOf(this), 1);
    },

    change: function (ruler) {
        [
            'width',
            'height',
            'top',
            'left',
            'color',
            'opacity'
        ].forEach(function (prop) {
            this[prop] = ruler[prop];
        }, this);


        var settings = getSettings(this.tabId);
        if (settings.showRulers) {
            sendMessageToTab(this.tabId, {type: 'rulerChanged', ruler: ruler});
        }

        this.port.postMessage({type: 'rulerRemoved', ruler: ruler});
    },

    setPort: function (port) {
        this.port = port;
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
