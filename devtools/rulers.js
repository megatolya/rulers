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
    container.innerHTML = templates.rulerSettings(data);
    var domElem = this.domElem = container.firstChild;

    [
        'color',
        'opacity'
    ].forEach(function (prop) {
        this._getInput(prop)
            .addEventListener('change', function () {
                this['_' + prop] = this._getInput(prop).value;
                this._sendToBackground();
            }.bind(this), false);
    }, this);

    [
        'width',
        'height',
        'top',
        'left',
    ].forEach(function (prop) {
        var unpreventableCodes = [9];

        this._getInput(prop)
            .addEventListener('keydown', function (e) {
                if (unpreventableCodes.indexOf(e.keyCode) !== -1) {
                    return;
                }

                e.preventDefault();
                var direction;

                if (e.keyCode === 40 || e.keyCode === 74) {
                    direction = 'down';
                } else if (e.keyCode === 38 || e.keyCode === 75) {
                    direction = 'up';
                }

                if (direction) {
                    var absDiff = e.shiftKey ? 10 : 1;
                    var diff;
                    if (direction === 'down') {
                        diff = -absDiff;
                    } else {
                        diff = absDiff;
                    }

                    this._getInput(prop).value = parseInt(this._getInput(prop).value, 10) + diff;
                    this['_' + prop] = this._getInput(prop).value;
                    this._sendToBackground();
                }
            }.bind(this), false);
    }, this);

    this.domElem.querySelector('.ruler__remove').addEventListener('click', function () {
        sendMessage({
            type: 'rulerRemoved',
            ruler: this.serialize()
        });
    }.bind(this), false);

}

Ruler.prototype = {
    constructor: Ruler,

    _getInput: function (type) {
        var elem = this.domElem.querySelector('#' + type + '-input-' + this._id);
        if (!elem) {
            throw new Error('Input not found ' + type);
        }
        return elem;
    },

    serialize: function () {
        return [
            'id',
            'width',
            'height',
            'top',
            'left',
            'color',
            'opacity'
        ].reduce(function (output, prop) {
            output[prop] = this['_' + prop];
            return output;
        }.bind(this), {});
    },

    _sendToBackground: function () {
        sendMessage({
            type: 'rulerChanged',
            ruler: this.serialize()
        });
    },

    append: function () {
        document.querySelector('#rulers-container').appendChild(this.domElem);
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
