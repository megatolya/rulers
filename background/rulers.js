var INITIAL_WIDTH = 100;
var INITIAL_HEIGHT = 100;
var INITIAL_COORDS = {
    left: 50,
    top: 50
};

var i = 0;

function Ruler() {
    this.id = i++;
    this.width = INITIAL_WIDTH;
    this.height = INITIAL_HEIGHT;
    this.top = INITIAL_COORDS.top;
    this.left = INITIAL_COORDS.left;
}
