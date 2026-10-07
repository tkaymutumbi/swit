import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Item {
    id: folder
    readonly property bool compact: width < 860
    readonly property bool narrow: width < 560
    readonly property var proj: backend.project
    readonly property var rows: { backend.project; return backend.files() }
    property int selected: -1
    readonly property var sel: selected >= 0 && selected < rows.length ? rows[selected] : null
    onProjChanged: if (selected >= rows.length) selected = -1
    onVisibleChanged: if (visible && selected < 0) {
        for (var i = 0; i < rows.length; i++) if (rows[i].kind === "Video") { selected = i; return }
        selected = rows.length ? 0 : -1
    }

    function openRow(r) {
        if (!r) return
        if (r.kind === "Video") Nav.go("player")
        else if (r.kind === "Storyboard" || r.name === "scenes/") Nav.go("storyboard")
        else if (r.kind === "Comments") Nav.review(0)
        else backend.openExternal(r.path)
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 0
        TopBar {
            crumbs: [{ text: "Home", page: "home" }, { text: "videos", page: "home" }, { text: folder.proj.name || "", page: "folder" }]
            Chip { visible: (folder.proj.openComments || 0) > 0 && !folder.narrow; text: folder.proj.openComments + " open comments"; hi: true; onClicked: Nav.review(0) }
            Btn { visible: folder.compact && folder.proj.hasVideo === true; text: "Play"; primary: true; onClicked: Nav.go("player") }
            Btn { visible: folder.compact && !folder.narrow; text: "Storyboard"; onClicked: Nav.go("storyboard") }
            Btn { visible: !folder.compact; text: "Reveal in files"; onClicked: backend.openExternal(folder.proj.dir) }
        }
        RowLayout {
            Layout.fillWidth: true; Layout.fillHeight: true; spacing: 0
            ColumnLayout {
                Layout.fillWidth: true; Layout.fillHeight: true
                Layout.margins: folder.narrow ? 14 : 28; Layout.topMargin: 22
                spacing: 12
                RowLayout {
                    Text { text: folder.proj.title || ""; color: Theme.t; font.pixelSize: 22; font.weight: Font.DemiBold; Layout.fillWidth: true }
                    Text { text: folder.rows.length + " items"; color: Theme.s; font.family: Theme.mono; font.pixelSize: 12 }
                }
                Rectangle {
                    Layout.fillWidth: true; Layout.fillHeight: true
                    Layout.maximumHeight: 36 + folder.rows.length * 46 + 2
                    radius: 12; color: Theme.p; border.color: Theme.l; clip: true
                    readonly property real nameW: folder.narrow ? width - 28 : width - 14 - 3 * 12 - 330 - 14
                    ListView {
                        id: tv
                        anchors.fill: parent
                        model: folder.rows
                        boundsBehavior: Flickable.StopAtBounds
                        ScrollBar.vertical: ScrollBar {}
                        header: Row {
                            height: 36; leftPadding: 14; spacing: 12
                            Repeater {
                                model: folder.narrow ? [["Name", 0]] : [["Name", 0], ["Kind", 130], ["Size", 80], ["Modified", 120]]
                                Text {
                                    required property var modelData
                                    width: modelData[0] === "Name" ? Math.max(80, tv.parent.nameW) : modelData[1]
                                    height: 36; verticalAlignment: Text.AlignVCenter
                                    text: modelData[0].toUpperCase(); color: Theme.s; font.pixelSize: 11; font.letterSpacing: 1.1
                                }
                            }
                        }
                        delegate: Rectangle {
                            id: row
                            required property var modelData
                            required property int index
                            width: tv.width; height: 46
                            color: folder.selected === index ? Theme.r : (ma.containsMouse ? Qt.rgba(1, 1, 1, 0.03) : "transparent")
                            Rectangle { anchors.top: parent.top; width: parent.width; height: 1; color: Theme.l }
                            Row {
                                anchors.fill: parent; leftPadding: 14; spacing: 12
                                Repeater {
                                    model: folder.narrow ? [row.modelData.name] : [row.modelData.name, row.modelData.kind, row.modelData.size, row.modelData.modified]
                                    Text {
                                        required property var modelData
                                        required property int index
                                        width: index === 0 ? Math.max(80, tv.parent.nameW) : [0, 130, 80, 120][index]
                                        height: 46; verticalAlignment: Text.AlignVCenter; elide: Text.ElideRight
                                        text: modelData
                                        font.pixelSize: 13
                                        font.weight: index === 0 && row.modelData.kind === "Video" ? Font.DemiBold : Font.Normal
                                        color: index === 0 ? Theme.t : (index === 1 && row.modelData.kind === "Comments" && backend.project.openComments > 0 ? Theme.c : Theme.s)
                                    }
                                }
                            }
                            MouseArea { id: ma; anchors.fill: parent; hoverEnabled: true; onClicked: folder.selected = row.index; onDoubleClicked: folder.openRow(row.modelData) }
                        }
                    }
                }
                Item { Layout.fillHeight: true }
            }

            Rectangle {
                visible: !folder.compact
                Layout.fillHeight: true; Layout.preferredWidth: 380
                color: Theme.p
                Rectangle { width: 1; height: parent.height; color: Theme.l }
                ColumnLayout {
                    anchors.fill: parent; anchors.margins: 22; spacing: 14
                    FrameImage {
                        Layout.fillWidth: true; Layout.preferredHeight: width * 9 / 16
                        radius: 10
                        label: "No preview"
                        source: folder.proj.frames && folder.proj.frames.length ? folder.proj.frames[0] : ""
                    }
                    ColumnLayout {
                        spacing: 2
                        Text { text: folder.sel ? folder.sel.name : ""; color: Theme.t; font.pixelSize: 16; font.weight: Font.DemiBold }
                        Text {
                            font.family: Theme.mono; font.pixelSize: 12; color: Theme.s
                            text: !folder.sel ? "" : folder.sel.kind === "Video" ? folder.proj.width + "×" + folder.proj.height + " · " + folder.proj.fps + " fps · " + folder.sel.size
                                  : folder.sel.kind === "Storyboard" ? folder.proj.sceneCount + " scenes · " + folder.proj.drawn + " frames drawn"
                                  : folder.sel.kind === "Comments" ? folder.proj.openComments + " open · " + folder.proj.resolvedComments + " resolved"
                                  : folder.sel.kind + " · " + folder.sel.size
                        }
                    }
                    RowLayout {
                        spacing: 8
                        Btn { text: folder.sel && folder.sel.kind === "Video" ? "Play" : "Open"; primary: true; Layout.fillWidth: true; onClicked: folder.openRow(folder.sel) }
                        Btn { text: "Review"; Layout.fillWidth: true; visible: folder.proj.hasVideo === true; onClicked: Nav.review(0) }
                        Btn { text: "Storyboard"; Layout.fillWidth: true; visible: !folder.sel || folder.sel.kind !== "Storyboard"; onClicked: Nav.go("storyboard") }
                    }
                    Text { text: "BUILT FROM"; color: Theme.s; font.pixelSize: 11; font.letterSpacing: 1.1; Layout.topMargin: 6 }
                    Chip { text: "storyboard.json · " + (folder.proj.sceneCount || 0) + " scenes" }
                    Item { Layout.fillHeight: true }
                    Text {
                        Layout.fillWidth: true; wrapMode: Text.WordWrap; color: Theme.s; font.pixelSize: 12; lineHeight: 1.35
                        text: (folder.proj.openComments || 0) > 0 ? "Tell Claude “fix the comments in " + folder.proj.name + "” when you are done reviewing." : ""
                    }
                }
            }
        }
    }
}
