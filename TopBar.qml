import QtQuick
import QtQuick.Layouts

Rectangle {
    id: bar
    readonly property bool compact: width < 760
    property var crumbs: []   // [{text, page}] last one is current
    default property alias actions: right.data
    Layout.fillWidth: true
    implicitHeight: 54
    color: Theme.p
    Rectangle { anchors.bottom: parent.bottom; width: parent.width; height: 1; color: Theme.l }
    RowLayout {
        anchors.fill: parent
        anchors.leftMargin: 20
        anchors.rightMargin: 20
        spacing: bar.compact ? 8 : 12
        Rectangle {
            Layout.preferredWidth: 26; Layout.preferredHeight: 26; radius: 8; color: Theme.c
            Text { anchors.centerIn: parent; text: "s"; font.bold: true; color: Theme.ci; font.pixelSize: 15 }
            MouseArea { anchors.fill: parent; onClicked: Nav.home(); cursorShape: Qt.PointingHandCursor }
        }
        Repeater {
            model: bar.crumbs
            delegate: Row {
                required property var modelData
                required property int index
                spacing: 8
                visible: index === bar.crumbs.length - 1 || !bar.compact
                Text {
                    visible: index > 0 && !bar.compact
                    text: "/"; color: Theme.s; font.pixelSize: 13; font.family: Theme.sans
                }
                Text {
                    width: Math.min(implicitWidth, bar.compact ? 140 : 300)
                    elide: Text.ElideRight
                    text: modelData.text
                    color: index === bar.crumbs.length - 1 ? Theme.t : Theme.s
                    font.weight: index === bar.crumbs.length - 1 ? Font.DemiBold : Font.Normal
                    font.pixelSize: 13; font.family: Theme.sans
                    MouseArea {
                        anchors.fill: parent
                        enabled: index < bar.crumbs.length - 1
                        cursorShape: Qt.PointingHandCursor
                        onClicked: modelData.page === "home" ? Nav.home() : Nav.go(modelData.page)
                    }
                }
            }
        }
        Item { Layout.fillWidth: true }
        RowLayout { id: right; spacing: 8 }
    }
}
