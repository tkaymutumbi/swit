import QtQuick

// A keyboard key cap.
Rectangle {
    property string label
    implicitHeight: 26
    implicitWidth: Math.max(26, t.implicitWidth + 14)
    radius: 6
    color: Theme.bg
    border.color: Theme.l
    Text { id: t; anchors.centerIn: parent; text: parent.label; color: Theme.t; font.family: Theme.mono; font.pixelSize: 12 }
}
