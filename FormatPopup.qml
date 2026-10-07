import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

// Pick the format of the open video. The scenes were laid out for the old shape, so Claude re-lays them out.
Popup {
    id: pop
    readonly property var proj: backend.project
    modal: true
    anchors.centerIn: Overlay.overlay
    width: Math.min(560, Overlay.overlay ? Overlay.overlay.width - 40 : 560)
    padding: 20
    closePolicy: Popup.CloseOnEscape | Popup.CloseOnPressOutside
    background: Rectangle { radius: 16; color: Theme.p; border.color: Theme.l }
    Overlay.modal: Rectangle { color: "#b0000000" }
    property string changedTo: ""

    function chosenName() { var fs = backend.formats(); for (var i = 0; i < fs.length; i++) if (fs[i].id === changedTo) return fs[i].name + " " + fs[i].ratio + " (" + fs[i].width + "x" + fs[i].height + ")"; return "" }
    onOpened: changedTo = ""

    contentItem: ColumnLayout {
        spacing: 12
        Text { text: "Video format"; color: Theme.t; font.pixelSize: 18; font.weight: Font.DemiBold; font.family: Theme.sans }
        Text { Layout.fillWidth: true; wrapMode: Text.WordWrap; color: Theme.s; font.pixelSize: 13; font.family: Theme.sans
               text: "The shape of the video decides where it fits. Pick the one for where you will post it." }
        Repeater {
            model: backend.formats()
            Rectangle {
                required property var modelData
                readonly property bool on: pop.proj.format === modelData.id
                Layout.fillWidth: true; implicitHeight: row.implicitHeight + 24; radius: 12
                color: on ? Qt.rgba(0.56, 0.71, 1, 0.12) : "transparent"; border.color: on ? Theme.c : Theme.l
                RowLayout {
                    id: row
                    anchors.fill: parent; anchors.margins: 12; spacing: 14
                    Rectangle {   // little shape preview
                        Layout.preferredWidth: 46; Layout.preferredHeight: 46; color: "transparent"
                        Rectangle {
                            anchors.centerIn: parent
                            width: modelData.width >= modelData.height ? 44 : 44 * modelData.width / modelData.height
                            height: modelData.width >= modelData.height ? 44 * modelData.height / modelData.width : 44
                            radius: 4; color: on ? Theme.c : Theme.r; border.color: on ? Theme.c : Theme.l
                        }
                    }
                    ColumnLayout {
                        Layout.fillWidth: true; spacing: 2
                        RowLayout {
                            spacing: 8
                            Text { text: modelData.name; color: Theme.t; font.pixelSize: 15; font.weight: Font.DemiBold; font.family: Theme.sans }
                            Text { text: modelData.ratio + "  " + modelData.width + "×" + modelData.height; color: Theme.c; font.pixelSize: 12; font.family: Theme.mono }
                        }
                        Text { Layout.fillWidth: true; wrapMode: Text.WordWrap; text: modelData.platforms; color: Theme.s; font.pixelSize: 12; font.family: Theme.sans }
                    }
                }
                MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor
                    onClicked: { if (!parent.on) { backend.setFormat(modelData.id); pop.changedTo = modelData.id } } }
            }
        }
        Rectangle {
            visible: pop.changedTo !== ""
            Layout.fillWidth: true; implicitHeight: msg.implicitHeight + 24; radius: 12; color: Theme.r
            ColumnLayout {
                id: msg
                anchors.fill: parent; anchors.margins: 12; spacing: 8
                Text { Layout.fillWidth: true; wrapMode: Text.WordWrap; color: Theme.t; font.pixelSize: 13; font.family: Theme.sans; lineHeight: 1.25
                       text: "The format is now " + pop.chosenName() + ". The scenes were laid out for the old shape, so ask Claude to re-lay them out." }
                Btn { text: "Copy prompt for Claude"; primary: true
                      onClicked: backend.copyText("The format of " + pop.proj.dir + " is now " + pop.chosenName() + ". Re-lay out every scene for this shape (use u, vertical and safe in the draw args), then re-render the frames and the video.") }
            }
        }
        RowLayout { Item { Layout.fillWidth: true } Btn { text: "Done"; onClicked: pop.close() } }
    }
}
