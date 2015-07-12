var rulers = {};

function Ruler(data) {
    [
        'id',
        'width',
        'height',
        'top',
        'left',
        'color',
        'position',
        'opacity'
    ].forEach(function (prop) {
        this[prop] = data[prop];
    }, this);

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
        'position'
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
        if (name === 'position') {
            this.position = getSelectValue(this._getInput('position'));
            return;
        }
        this[name] = this._getInput(name).value;
    },

    serialize: function () {
        return [
            'id',
            'width',
            'height',
            'top',
            'left',
            'color',
            'opacity',
            'position'
        ].reduce(function (output, prop) {
            output[prop] = this[prop];
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
