import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

// Pop-out help: every shortcut with its current binding, plus a few tips.
Popup {
    id: pop
    modal: true
    anchors.centerIn: Overlay.overlay
    width: Math.min(760, Overlay.overlay ? Overlay.overlay.width - 40 : 760)
    height: Math.min(640, Overlay.overlay ? Overlay.overlay.height - 40 : 640)
    padding: 0
    closePolicy: Popup.CloseOnEscape | Popup.CloseOnPressOutside
    background: Rectangle { radius: 16; color: Theme.p; border.color: Theme.l }
    Overlay.modal: Rectangle { color: "#b0000000" }

    function keyRow(id) { return Prefs.parts(Prefs.seq(id)) }

    contentItem: ColumnLayout {
        spacing: 0
        RowLayout {
            Layout.fillWidth: true; Layout.margins: 20; Layout.bottomMargin: 12
            Text { text: "Help and shortcuts"; color: Theme.t; font.pixelSize: 20; font.weight: Font.DemiBold; font.family: Theme.sans; Layout.fillWidth: true }
            Btn { text: "Edit shortcuts"; onClicked: { pop.close(); Nav.settingsRequested("keys") } }
            Btn { text: "Close"; onClicked: pop.close() }
        }
        Rectangle { Layout.fillWidth: true; height: 1; color: Theme.l }
        Flickable {
            Layout.fillWidth: true; Layout.fillHeight: true
            contentHeight: col.implicitHeight + 40; clip: true
            boundsBehavior: Flickable.StopAtBounds
            ScrollBar.vertical: ScrollBar {}
            ColumnLayout {
                id: col
                x: 20; y: 20; width: parent.width - 40; spacing: 22
                Rectangle {
                    Layout.fillWidth: true; implicitHeight: tips.implicitHeight + 28; radius: 12; color: Theme.r
                    ColumnLayout {
                        id: tips
                        anchors.fill: parent; anchors.margins: 14; spacing: 6
                        Text { text: "HOW IT WORKS"; color: Theme.s; font.pixelSize: 11; font.letterSpacing: 1.1 }
                        Repeater {
                            model: [
                                "Ask Claude for a video. It asks a few questions, drafts a storyboard, then builds it.",
                                "In Review, pick a tool and draw on the video, or click a code line in the storyboard to comment on code.",
                                "Each note shows for a set time. Click “Shows 3s” on a comment to change it.",
                                "When you are done, press Ask Claude to fix, paste the copied prompt to Claude, and it resolves each comment."
                            ]
                            Text { required property string modelData; Layout.fillWidth: true; text: modelData; color: Theme.t; font.pixelSize: 13; wrapMode: Text.WordWrap; lineHeight: 1.25; font.family: Theme.sans }
                        }
                    }
                }
                Repeater {
                    model: Prefs.scopes
                    ColumnLayout {
                        id: sec
                        required property string modelData
                        Layout.fillWidth: true; spacing: 6
                        Text { text: sec.modelData.toUpperCase(); color: Theme.c; font.pixelSize: 11; font.letterSpacing: 1.2; font.weight: Font.DemiBold }
                        Repeater {
                            model: Prefs.defs.filter(function (d) { return d.scope === sec.modelData })
                            RowLayout {
                                required property var modelData
                                Layout.fillWidth: true; spacing: 8
                                Text { text: modelData.label; color: Theme.t; font.pixelSize: 14; font.family: Theme.sans; Layout.fillWidth: true }
                                Text { visible: pop.keyRow(modelData.id).length === 0; text: "Not set"; color: Theme.s; font.pixelSize: 12 }
                                Repeater { model: pop.keyRow(modelData.id); Key { required property string modelData; label: modelData } }
                            }
                        }
                    }
                }
            }
        }
    }
}
