var rulers = {};

function Ruler(data) {
    [
        'id',
        'width',
        'height',
        'top',
        'left',
        'bottom',
        'right',
        'color',
        'position',
        'opacity',
        'positionXType',
        'positionYType'
    ].forEach(function (prop) {
        this[prop] = data[prop];
    }, this);

    data.x = this.positionXType === 'left' ? data.left : data.right;
    data.y = this.positionYType === 'top' ? data.top : data.bottom;

    rulers[this.id] = this;

    var container = document.createElement('div');
    container.innerHTML = templates.rulerSettings(data);
    var domElem = this.domElem = container.firstChild;

    [
        'color',
        'opacity'
    ].forEach(function (prop) {
        this._getInput(prop)
            .addEventListener('change', function () {
                this[prop] = this._getInput(prop).value;
                this._sendToBackground();
            }.bind(this), false);
    }, this);

    [
        'width',
        'height',
        'top',
        'left',
        'bottom',
        'right',
        'position',
        'positionXType',
        'positionYType'
    ].forEach(function (prop) {
        this._getInput(prop).addEventListener('change', function (e) {
            this._actualizeInput(prop);
            this._sendToBackground();
        }.bind(this));
    }, this);

    this.domElem.querySelector('.ruler__remove').addEventListener('click', function () {
        sendMessage({
            type: 'rulerRemoved',
            ruler: this.serialize()
        });
    }.bind(this), false);


    var _this = this;
    function onOver(eventType, originalEvent) {
        sendMessage({
            type: 'highlight',
            on: eventType === 'over',
            ruler: _this.serialize()
        });
    }

    this.domElem.addEventListener('mouseleave', onOver.bind(this, 'out'));
    this.domElem.addEventListener('mouseenter', onOver.bind(this, 'over'));

    this.append();

    [
        'position'
    ].forEach(function (prop) {
        this._getInput(prop).selectedIndex = ['absolute', 'fixed'].indexOf(data.position);
    }, this);

    this._getInput('copy').addEventListener('click', function (e) {
        this.copy();
        e.preventDefault();
    }.bind(this), false);

    [
        'width',
        'height',
        'top',
        'left',
    ].forEach(function (inputName) {
        var input = this._getInput(inputName);

        input.addEventListener('keydown', function (e) {
            if (!e.shiftKey) {
                return;
            }

            var val = parseInt(input.value, 10);

            if (Number.isNaN(val)) {
                return;
            }

            if (e.keyCode === 40) {
                val -= 9;
            }

            if (e.keyCode === 38) {
                val += 9;
            }

            input.value = val.toString();
        });
    }, this);
}

Ruler.prototype = {
    constructor: Ruler,

    _getInput: function (type) {
        var elem = this.domElem.querySelector('#' + type + '-input-' + this.id);
        if (!elem) {
            throw new Error('Input not found ' + type);
        }
        return elem;
    },

    _actualizeInput: function (name) {
        switch (name) {
            case 'positionXType':
            case 'positionYType': {
                if (this.positionXType === 'left') {
                    this._getInput('left').setAttribute('type', 'number');
                    this._getInput('right').setAttribute('type', 'hidden');
                } else {
                    this._getInput('left').setAttribute('type', 'hidden');
                    this._getInput('right').setAttribute('type', 'number');
                }

                if (this.positionYType === 'top') {
                    this._getInput('top').setAttribute('type', 'number');
                    this._getInput('bottom').setAttribute('type', 'hidden');
                } else {
                    this._getInput('top').setAttribute('type', 'hidden');
                    this._getInput('bottom').setAttribute('type', 'number');
                }
            }

            case 'position':
                this[name] = getSelectValue(this._getInput(name));
                return;

            default:
                this[name] = parseInt(this._getInput(name).value, 10);
        }
    },

    serialize: function () {
        const res = [
            'id',
            'width',
            'height',
            'color',
            'opacity',
            'position',
            this.positionXType === 'left' ? 'left' : 'right',
            this.positionYType === 'top' ? 'top' : 'bottom',
        ].reduce(function (output, prop) {
            output[prop] = this[prop];
            return output;
        }.bind(this), {});
        return res;
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
        delete rulers[this.id];
    },

    change: function (ruler) {
        [
            'left',
            'top'
        ].forEach(function (prop) {
            if (prop in ruler) {
                this[prop] = ruler[prop];
                this._getInput(prop).value = ruler[prop];
            }
        }, this);
    },

    copy: function () {
        sendMessage({type: 'rulerCopied', ruler: this.id});
    }
};

Ruler.getById = function (id) {
    function throwErr() {
        throw new Error('Ruler not found, id = ' + id);
    }

    return rulers[id] || throwErr();
};
