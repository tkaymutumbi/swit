import QtQuick

// Round header button drawn from shapes: "help" shows a question mark, "gear" a cog.
Rectangle {
    id: b
    property string kind: "help"
    property string tip: ""
    signal clicked()
    implicitWidth: 34
    implicitHeight: 34
    radius: 17
    color: ma.containsMouse ? Theme.l : Theme.r
    border.color: Theme.l
    Text { visible: b.kind === "help"; anchors.centerIn: parent; text: "?"; color: Theme.t; font.pixelSize: 16; font.weight: Font.DemiBold; font.family: Theme.sans }
    Canvas {
        visible: b.kind === "gear"
        anchors.centerIn: parent; width: 22; height: 22
        onPaint: {
            var c = getContext("2d"); c.reset(); c.strokeStyle = Theme.t; c.lineWidth = 2; c.lineCap = "round"
            c.beginPath(); c.arc(11, 11, 6.5, 0, Math.PI * 2); c.stroke(); c.lineWidth = 3.4
            for (var i = 0; i < 8; i++) {
                var a = i * Math.PI / 4
                c.beginPath(); c.moveTo(11 + Math.cos(a) * 8.6, 11 + Math.sin(a) * 8.6); c.lineTo(11 + Math.cos(a) * 10.2, 11 + Math.sin(a) * 10.2); c.stroke()
            }
        }
        Component.onCompleted: requestPaint()
    }
    MouseArea { id: ma; anchors.fill: parent; hoverEnabled: true; cursorShape: Qt.PointingHandCursor; onClicked: b.clicked() }
    Accessible.role: Accessible.Button
    Accessible.name: tip
}
