function Ruler(data) {
    this._width = data.width;
    this._height = data.height;
    this._top = data.top;
    this._left = data.left;
    this._color = data.color;

    var container = document.createElement('div');
    container.innerHTML = templates.rulerSettings(data);
    var domElem = this.domElem = container.firstChild;

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
        document.querySelector('#rulers-container').appendChild(this.domElem);
    },
    update: function () {}
};
