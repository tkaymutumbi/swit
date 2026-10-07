import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Item {
    id: home
    readonly property bool compact: width < 760
    property string mode: "all"   // all | comments
    property string query: ""
    readonly property var list: {
        var out = []
        var ps = backend.projects
        for (var i = 0; i < ps.length; i++) {
            var p = ps[i]
            if (mode === "comments" && p.openComments === 0) continue
            if (query && (p.title + p.name).toLowerCase().indexOf(query.toLowerCase()) < 0) continue
            out.push(p)
        }
        return out
    }
    readonly property var latest: backend.projects.length ? backend.projects[0] : null

    component NavItem: Rectangle {
        id: n
        property string text
        property bool on: false
        property int badge: 0
        signal clicked()
        Layout.fillWidth: true
        implicitHeight: 38
        radius: 8
        color: on ? Theme.r : (ma.containsMouse ? Qt.rgba(1, 1, 1, 0.04) : "transparent")
        RowLayout {
            anchors.fill: parent
            anchors.leftMargin: 12
            anchors.rightMargin: 10
            Text { text: n.text; color: n.on ? Theme.t : Theme.s; font.pixelSize: 14; font.family: Theme.sans; Layout.fillWidth: true; elide: Text.ElideMiddle }
            Rectangle {
                visible: n.badge > 0
                radius: 10; color: Theme.c
                implicitWidth: bt.implicitWidth + 14; implicitHeight: 18
                Text { id: bt; anchors.centerIn: parent; text: n.badge; color: Theme.ci; font.pixelSize: 11; font.bold: true }
            }
        }
        MouseArea { id: ma; anchors.fill: parent; hoverEnabled: true; onClicked: n.clicked(); cursorShape: Qt.PointingHandCursor }
    }

    Act { action: "home.search"; active: home.visible; onTriggered: search.forceActiveFocus() }
    Act { action: "home.openFolder"; active: home.visible; onTriggered: Nav.addFolderRequested() }

    RowLayout {
        anchors.fill: parent
        spacing: 0

        Rectangle {
            Layout.fillHeight: true
            visible: !home.compact
            Layout.preferredWidth: 236
            color: Theme.p
            Rectangle { anchors.right: parent.right; width: 1; height: parent.height; color: Theme.l }
            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 14
                anchors.topMargin: 20
                spacing: 6
                RowLayout {
                    Layout.leftMargin: 8
                    Layout.bottomMargin: 18
                    spacing: 10
                    Rectangle {
                        Layout.preferredWidth: 28; Layout.preferredHeight: 28; radius: 8; color: Theme.c
                        Text { anchors.centerIn: parent; text: "s"; font.bold: true; font.pixelSize: 16; color: Theme.ci }
                    }
                    Text { text: "swit"; color: Theme.t; font.pixelSize: 17; font.weight: Font.DemiBold }
                }
                NavItem { text: "Home"; on: home.mode === "all"; onClicked: home.mode = "all" }
                NavItem { text: "Open comments"; badge: backend.openCommentTotal; on: home.mode === "comments"; onClicked: home.mode = "comments" }
                Text { text: "LOCATIONS"; color: Theme.s; font.pixelSize: 11; font.letterSpacing: 1.2; Layout.topMargin: 22; Layout.leftMargin: 12; Layout.bottomMargin: 4 }
                NavItem { text: backend.videosRoot.replace(/^\/home\/[^/]+/, "~"); onClicked: home.mode = "all" }
                Item { Layout.fillHeight: true }
                Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: col.implicitHeight + 24
                    radius: 12; color: "transparent"; border.color: Theme.l
                    ColumnLayout {
                        id: col
                        anchors.fill: parent; anchors.margins: 12; spacing: 6
                        Row {
                            spacing: 6
                            Rectangle { width: 7; height: 7; radius: 4; color: Theme.ok; anchors.verticalCenter: parent.verticalCenter }
                            Text { text: "Claude connected"; color: Theme.t; font.pixelSize: 12 }
                        }
                        Text { Layout.fillWidth: true; wrapMode: Text.WordWrap; color: Theme.s; font.pixelSize: 12; lineHeight: 1.3
                               text: "Ask Claude to “create a pro video” and the folder shows up here." }
                    }
                }
            }
        }

        ColumnLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            Layout.margins: home.compact ? 16 : 32
            Layout.topMargin: home.compact ? 16 : 28
            spacing: home.compact ? 14 : 22

            RowLayout {
                spacing: 14
                Text { text: home.mode === "comments" ? "Open comments" : "Your videos"; color: Theme.t; font.pixelSize: home.compact ? 22 : 26; font.weight: Font.DemiBold; Layout.fillWidth: true; elide: Text.ElideRight }
                Rectangle {
                    Layout.preferredWidth: home.compact ? 130 : 240; Layout.minimumWidth: 90; Layout.preferredHeight: 38; radius: 9; color: "transparent"
                    border.color: search.activeFocus ? Theme.c : Theme.l
                    TextInput {
                        id: search
                        anchors.fill: parent; anchors.leftMargin: 12; anchors.rightMargin: 12
                        verticalAlignment: TextInput.AlignVCenter
                        color: Theme.t; font.pixelSize: 13; font.family: Theme.sans; clip: true
                        onTextChanged: home.query = text
                        Text { visible: !search.text && !search.activeFocus; anchors.fill: parent; verticalAlignment: Text.AlignVCenter; text: "Search videos"; color: Theme.s; font: search.font }
                    }
                }
                Btn { text: "Open folder"; onClicked: Nav.addFolderRequested() }
                IconButton { kind: "help"; tip: "Help and shortcuts"; onClicked: Nav.helpRequested() }
                IconButton { kind: "gear"; tip: "Settings"; onClicked: Nav.settingsRequested("general") }
            }

            Row {
                visible: home.compact
                spacing: 8
                Chip { text: "All"; on: home.mode === "all"; onClicked: home.mode = "all" }
                Chip { text: "Open comments " + backend.openCommentTotal; on: home.mode === "comments"; onClicked: home.mode = "comments" }
            }

            Rectangle {
                visible: home.latest !== null && home.mode === "all" && home.query === ""
                Layout.fillWidth: true
                implicitHeight: 76
                radius: 14; color: Theme.r; border.color: Theme.l
                RowLayout {
                    anchors.fill: parent; anchors.leftMargin: 18; anchors.rightMargin: 18; spacing: 16
                    Rectangle {
                        Layout.preferredWidth: 44; Layout.preferredHeight: 44; radius: 10; color: Theme.c
                        Glyph { anchors.centerIn: parent; width: 20; height: 20; color: Theme.ci }
                    }
                    ColumnLayout {
                        Layout.fillWidth: true; spacing: 2
                        Text { Layout.fillWidth: true; elide: Text.ElideRight; text: home.latest ? home.latest.name + (home.latest.hasVideo ? " is ready to review" : " has a storyboard to check") : ""; color: Theme.t; font.pixelSize: 15; font.weight: Font.DemiBold }
                        Text {
                            Layout.fillWidth: true; elide: Text.ElideRight; color: Theme.s; font.pixelSize: 13
                            text: home.latest ? (home.latest.sceneCount + " scenes · " + home.latest.drawn + " frames drawn · " + home.latest.updated) : ""
                        }
                    }
                    Btn { text: home.compact ? "Open" : "Open project"; primary: true; onClicked: Nav.open(home.latest.dir) }
                }
            }

            Text {
                visible: home.list.length === 0
                Layout.fillWidth: true; Layout.topMargin: 30
                horizontalAlignment: Text.AlignHCenter; wrapMode: Text.WordWrap; color: Theme.s; font.pixelSize: 15; lineHeight: 1.4
                text: backend.projects.length === 0
                      ? "No videos yet.\nAsk Claude to create one, or use Open folder to add a project folder."
                      : "Nothing matches."
            }

            GridView {
                id: grid
                visible: home.list.length > 0
                Layout.fillWidth: true; Layout.fillHeight: true
                readonly property int cols: Math.max(1, Math.floor(width / 280))
                cellWidth: Math.floor(width / cols); cellHeight: Math.round((cellWidth - 16) * 9 / 16) + 130
                clip: true
                model: home.list
                delegate: Item {
                    id: cell
                    required property var modelData
                    width: grid.cellWidth; height: grid.cellHeight
                    Rectangle {
                        anchors.fill: parent; anchors.rightMargin: 16; anchors.bottomMargin: 16
                        radius: 14; color: Theme.p; clip: true
                        border.color: ma.containsMouse ? Theme.c : Theme.l
                        ColumnLayout {
                            anchors.fill: parent; spacing: 0
                            FrameImage {
                                Layout.fillWidth: true; Layout.preferredHeight: width * 9 / 16
                                fit: true
                                radius: 0
                                label: "No frames yet"
                                source: cell.modelData.frames.length > 1 ? cell.modelData.frames[1] : (cell.modelData.frames.length ? cell.modelData.frames[0] : "")
                                Rectangle {
                                    anchors.right: parent.right; anchors.bottom: parent.bottom; anchors.margins: 8
                                    radius: 10; color: "#aa000000"; width: sc.implicitWidth + 16; height: 22
                                    Text { id: sc; anchors.centerIn: parent; text: cell.modelData.sceneCount + " scenes" + (cell.modelData.format !== "landscape" ? "  \u00B7  " + cell.modelData.ratio : ""); color: "#fff"; font.pixelSize: 11 }
                                }
                            }
                            ColumnLayout {
                                Layout.margins: 14; spacing: 4
                                Text { text: cell.modelData.name; color: Theme.t; font.pixelSize: 15; font.weight: Font.DemiBold }
                                Text { text: cell.modelData.dir.replace(/^\/home\/[^/]+/, "~"); color: Theme.s; font.family: Theme.mono; font.pixelSize: 11; elide: Text.ElideMiddle; Layout.fillWidth: true }
                                Row {
                                    spacing: 6; topPadding: 6
                                    Chip { text: cell.modelData.hasVideo ? "Video " + Theme.fmt(cell.modelData.total) : "Storyboard" }
                                    Chip {
                                        text: cell.modelData.openComments > 0 ? cell.modelData.openComments + " comments" : (cell.modelData.hasVideo ? "No comments" : cell.modelData.sceneCount + " scenes")
                                        hi: cell.modelData.openComments > 0
                                    }
                                }
                            }
                        }
                        MouseArea { id: ma; anchors.fill: parent; hoverEnabled: true; cursorShape: Qt.PointingHandCursor; onClicked: Nav.open(cell.modelData.dir) }
                    }
                }
            }
        }
    }
}
