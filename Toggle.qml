import QtQuick

// On/off switch.
Rectangle {
    id: t
    property bool checked: false
    signal toggled(bool value)
    implicitWidth: 46
    implicitHeight: 26
    radius: 13
    color: checked ? Theme.c : Theme.r
    border.color: checked ? "transparent" : Theme.l
    Behavior on color { ColorAnimation { duration: 120 } }
    Rectangle {
        width: 20; height: 20; radius: 10
        y: 3; x: t.checked ? parent.width - width - 3 : 3
        color: t.checked ? Theme.ci : Theme.s
        Behavior on x { NumberAnimation { duration: 120; easing.type: Easing.OutCubic } }
    }
    MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: t.toggled(!t.checked) }
    Accessible.role: Accessible.CheckBox
    Accessible.checked: checked
}
