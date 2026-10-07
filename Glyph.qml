import QtQuick

// Drawn play / pause icon, so no font glyph or emoji is involved.
Item {
    id: g
    property bool playing: false
    property color color: Theme.t
    implicitWidth: 16
    implicitHeight: 16
    Canvas {
        anchors.fill: parent
        onPaint: {
            var c = getContext("2d")
            c.reset()
            c.fillStyle = g.color
            if (g.playing) {
                c.fillRect(width * 0.18, height * 0.12, width * 0.24, height * 0.76)
                c.fillRect(width * 0.58, height * 0.12, width * 0.24, height * 0.76)
            } else {
                c.beginPath()
                c.moveTo(width * 0.24, height * 0.1)
                c.lineTo(width * 0.9, height * 0.5)
                c.lineTo(width * 0.24, height * 0.9)
                c.closePath()
                c.fill()
            }
        }
        Component.onCompleted: requestPaint()
    }
    onPlayingChanged: { for (var i = 0; i < children.length; i++) children[i].requestPaint() }
    onColorChanged: { for (var i = 0; i < children.length; i++) children[i].requestPaint() }
}
