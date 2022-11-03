// Shrink a text element until it's overall height is
// within 'lines' number of lines tall with the initial font size
function fitText(textElem, lines) {
    // Get height and maximum height allowed
    var height = textElem.height();
    var maxHeight = parseInt(textElem.css("font-size"), 10) * lines;

    // If too tall, reduce font size until it fits
    while (maxHeight < height) {
        size = parseInt(textElem.css("font-size"), 10);
        textElem.css("font-size", size - 1);
        height = textElem.height();

        // Adjust position
        // Assumed font is positioned relative to bottom
        var bottom = parseInt(textElem.css("bottom"), 10);
        textElem.css("bottom", bottom + 1);
    }
    textElem.css("line-height", textElem.css("font-size"));
}

// Fit all name elements in name badges
function fixNameText() {
    $("body").find(".wca-name").each(function() {
        fitText($(this), 2);
    });
}