import QtQuick

Rectangle {
    id: c
    property string text
    property bool hi: false
    property bool on: false
    signal clicked()
    implicitHeight: 24
    implicitWidth: label.implicitWidth + 20
    radius: 12
    color: on ? Theme.c : Theme.r
    Text {
        id: label
        anchors.centerIn: parent
        text: c.text
        font.family: Theme.sans
        font.pixelSize: 12
        font.weight: c.hi || c.on ? Font.DemiBold : Font.Normal
        color: c.on ? Theme.ci : (c.hi ? Theme.c : Theme.s)
    }
    MouseArea { anchors.fill: parent; onClicked: c.clicked(); cursorShape: Qt.PointingHandCursor }
}
