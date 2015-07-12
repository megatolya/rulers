var FONT_COLOR_THRESHOLD = 170;

var utils = {
    getFontColorByBackgroundColor: function (bgColor) {
        var red = parseInt(bgColor.substr(1, 2), 16);
        var green = parseInt(bgColor.substr(3, 2), 16);
        var blue = parseInt(bgColor.substr(5, 2), 16);
        var tone = (red + green + blue) / 3;
        var isWhite = (tone < FONT_COLOR_THRESHOLD) && (red < FONT_COLOR_THRESHOLD || green < FONT_COLOR_THRESHOLD);

        return isWhite ? '#fff' : '#000';
    }
};
