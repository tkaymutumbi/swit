import QtQuick
import QtQuick.Controls

Button {
    id: c
    property bool primary: false
    implicitHeight: 38
    leftPadding: 16
    rightPadding: 16
    focusPolicy: Qt.TabFocus
    background: Rectangle {
        radius: 9
        color: c.primary ? (c.down ? Qt.darker(Theme.c, 1.2) : (c.hovered ? Qt.lighter(Theme.c, 1.1) : Theme.c)) : (c.down || c.hovered ? Theme.l : Theme.r)
        border.width: c.primary ? 0 : 1
        border.color: c.visualFocus ? Theme.c : Theme.l
    }
    contentItem: Text {
        text: c.text
        color: !c.enabled ? Theme.s : (c.primary ? Theme.ci : Theme.t)
        font.family: Theme.sans
        font.pixelSize: 13
        font.weight: c.primary ? Font.DemiBold : Font.Normal
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
    }
}
