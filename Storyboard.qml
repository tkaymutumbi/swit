import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Item {
    id: sb
    readonly property bool compact: width < 1000
    readonly property bool narrow: width < 640
    property bool showCode: false
    readonly property var proj: backend.project
    readonly property var scenes: proj.scenes || []
    readonly property int idx: Math.min(Nav.storyScene, Math.max(0, scenes.length - 1))
    readonly property var scene: scenes.length ? scenes[idx] : null
    readonly property var codeLines: { backend.project; return scene ? backend.readText(scene.file).split("\n") : [] }
    readonly property var sceneComments: {
        var out = []
        var cs = backend.comments
        for (var i = 0; i < cs.length; i++) {
            var c = cs[i]
            if (!scene) break
            var inScene = c.scene ? c.scene === scene.id : (c.time >= scene.start && c.time < scene.start + scene.duration)
            if (inScene) out.push(c)
        }
        return out
    }
    function commentsOnLine(n) {
        var k = 0
        for (var i = 0; i < sceneComments.length; i++) {
            var c = sceneComments[i]
            if (c.kind === "code" && c.line === n && c.status === "open") k++
        }
        return k
    }
    property int pendingLine: 0

    Act { action: "story.prev"; active: sb.visible; onTriggered: Nav.storyScene = Math.max(0, sb.idx - 1) }
    Act { action: "story.next"; active: sb.visible; onTriggered: Nav.storyScene = Math.min(sb.scenes.length - 1, sb.idx + 1) }
    Act { action: "story.approve"; active: sb.visible && sb.scene !== null; onTriggered: backend.setSceneApproved(sb.scene.id, !sb.scene.approved) }

    readonly property real ar: proj.aspect || 16 / 9
    FormatPopup { id: formatPopup }
    Connections { target: Nav; function onFormatRequested() { if (visible) formatPopup.open() } }

    Composer {
        id: composer
        onAccepted: (text) => backend.addComment({ kind: "code", scene: sb.scene.id, file: sb.scene.file, line: sb.pendingLine, text: text })
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 0
        TopBar {
            crumbs: [{ text: "Home", page: "home" }, { text: sb.proj.name || "", page: "folder" }, { text: "Storyboard", page: "storyboard" }]
            Chip { visible: !sb.narrow; text: (sb.proj.formatName || "") + "  " + (sb.proj.ratio || ""); hi: true; onClicked: formatPopup.open() }
            Chip { visible: !sb.narrow; text: (sb.proj.drawn || 0) + " of " + (sb.proj.sceneCount || 0) + " frames drawn" }
            Btn {
                text: "Ask Claude to draw the rest"
                visible: (sb.proj.drawn || 0) < (sb.proj.sceneCount || 0) && !sb.compact
                onClicked: backend.copyText("Render the remaining storyboard frames for " + sb.proj.dir + " with swit_render_frames, then tell me when they are ready.")
            }
            Btn { visible: sb.compact; text: sb.showCode ? "Frame" : "Code"; onClicked: sb.showCode = !sb.showCode }
            Btn {
                text: sb.narrow ? "Approve" : "Approve & build video"; primary: true
                onClicked: { backend.approveAll(); backend.copyText(backend.buildPrompt()) }
            }
        }

        RowLayout {
            Layout.fillWidth: true; Layout.fillHeight: true; spacing: 0

            Rectangle {
                visible: width > 0 && !sb.compact
                Layout.fillHeight: true; Layout.preferredWidth: 210; color: "transparent"
                Rectangle { anchors.right: parent.right; width: 1; height: parent.height; color: Theme.l }
                Column {
                    anchors.fill: parent; anchors.margins: 12; spacing: 4
                    Text { text: "SCENES · " + Math.round(sb.proj.total || 0) + "s"; color: Theme.s; font.pixelSize: 11; font.letterSpacing: 1.1; leftPadding: 8; bottomPadding: 8 }
                    Repeater {
                        model: sb.scenes
                        delegate: Rectangle {
                            required property var modelData
                            required property int index
                            width: parent.width; height: 44; radius: 8
                            color: sb.idx === index ? Theme.r : "transparent"
                            Row {
                                anchors.fill: parent; anchors.leftMargin: 10; anchors.rightMargin: 10; spacing: 10
                                Text { height: parent.height; verticalAlignment: Text.AlignVCenter; text: (index + 1 < 10 ? "0" : "") + (index + 1); font.family: Theme.mono; font.pixelSize: 13; color: sb.idx === index ? Theme.c : Theme.s }
                                Text { height: parent.height; width: parent.width - 80; verticalAlignment: Text.AlignVCenter; elide: Text.ElideRight; text: modelData.name; font.pixelSize: 14; color: sb.idx === index ? Theme.t : Theme.s }
                                Text { height: parent.height; verticalAlignment: Text.AlignVCenter; text: modelData.duration + "s"; font.family: Theme.mono; font.pixelSize: 12; color: Theme.s }
                            }
                            MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: Nav.storyScene = index }
                        }
                    }
                }
            }

            ColumnLayout {
                visible: !(sb.compact && sb.showCode)
                Layout.fillWidth: true; Layout.fillHeight: true; Layout.preferredWidth: 1; Layout.minimumWidth: 0
                Layout.margins: sb.narrow ? 14 : 26; Layout.topMargin: sb.narrow ? 12 : 22
                spacing: 16
                Item {
                    Layout.fillWidth: true; Layout.fillHeight: true; Layout.minimumHeight: 120
                    FrameImage {
                        anchors.centerIn: parent
                        width: Math.min(parent.width, parent.height * sb.ar); height: width / sb.ar
                        radius: 12
                        source: sb.scene ? sb.scene.frameUrl : ""
                        label: sb.scene ? sb.scene.name : ""
                        Rectangle {
                            anchors.top: parent.top; anchors.right: parent.right; anchors.margins: 12
                            radius: 6; color: "#99000000"; width: tl.implicitWidth + 20; height: 26
                            Text { id: tl; anchors.centerIn: parent; color: "#fff"; font.pixelSize: 12
                                   text: sb.scene ? "Frame " + (sb.idx + 1) + " \u00B7 " + Theme.fmt(sb.scene.start) + "\u2013" + Theme.fmt(sb.scene.start + sb.scene.duration) : "" }
                        }
                    }
                }
                GridLayout {
                    Layout.fillWidth: true; columnSpacing: 14; rowSpacing: 10
                    columns: sb.narrow ? 1 : 2
                    Repeater {
                        model: [["CAPTION", sb.scene ? sb.scene.caption : ""], ["NOTES", sb.scene ? sb.scene.note : ""]]
                        delegate: Rectangle {
                            required property var modelData
                            Layout.fillWidth: true; Layout.alignment: Qt.AlignTop
                            implicitHeight: cc.implicitHeight + 28
                            radius: 14; color: Theme.p; border.color: Theme.l
                            ColumnLayout {
                                id: cc
                                anchors.fill: parent; anchors.margins: 14; spacing: 6
                                Text { text: modelData[0]; color: Theme.s; font.pixelSize: 11; font.letterSpacing: 1.1 }
                                Text { Layout.fillWidth: true; wrapMode: Text.WordWrap; text: modelData[1] || "None"; color: modelData[1] ? Theme.t : Theme.s; font.pixelSize: 15 }
                            }
                        }
                    }
                }
                RowLayout {
                    spacing: 8
                    Chip { text: sb.scene && sb.scene.approved ? "Approved" : "Mark approved"; on: sb.scene ? sb.scene.approved : false
                           onClicked: backend.setSceneApproved(sb.scene.id, !sb.scene.approved) }
                    Chip { text: sb.scene && sb.scene.hasFrame ? "Redraw with Claude" : "Draw with Claude"
                           onClicked: backend.copyText("Render the storyboard frame for " + sb.scene.id + " in " + sb.proj.dir + " with swit_render_frames.") }
                }
            }

            Rectangle {
                visible: !sb.compact || sb.showCode
                Layout.fillHeight: sb.compact ? true : true; Layout.fillWidth: sb.compact; Layout.preferredWidth: sb.compact ? 1 : 340; color: Theme.p
                Rectangle { width: 1; height: parent.height; color: Theme.l }
                ColumnLayout {
                    anchors.fill: parent; anchors.margins: 16; spacing: 10
                    RowLayout {
                        Text { text: "SCENE CODE"; color: Theme.s; font.pixelSize: 11; font.letterSpacing: 1.1; Layout.fillWidth: true }
                        Text { text: "click a line"; color: Theme.s; font.pixelSize: 11 }
                    }
                    Rectangle {
                        Layout.fillWidth: true; Layout.fillHeight: true; Layout.preferredHeight: 1
                        radius: 10; color: Theme.bg; border.color: Theme.l; clip: true
                        ListView {
                            anchors.fill: parent; anchors.margins: 4
                            model: sb.codeLines
                            boundsBehavior: Flickable.StopAtBounds
                            ScrollBar.vertical: ScrollBar {}
                            delegate: Rectangle {
                                id: ln
                                required property string modelData
                                required property int index
                                readonly property int n: index + 1
                                readonly property int cnt: sb.commentsOnLine(n)
                                width: ListView.view.width; height: 20
                                color: cnt > 0 ? Qt.rgba(0.56, 0.71, 1, 0.16) : (lma.containsMouse ? Qt.rgba(1, 1, 1, 0.05) : "transparent")
                                Row {
                                    anchors.fill: parent; spacing: 8
                                    Text { width: 30; horizontalAlignment: Text.AlignRight; text: ln.n; color: Theme.s; font.family: Theme.mono; font.pixelSize: 11; height: 20; verticalAlignment: Text.AlignVCenter }
                                    Text { text: ln.modelData; color: Theme.t; font.family: Theme.mono; font.pixelSize: 11; height: 20; verticalAlignment: Text.AlignVCenter; textFormat: Text.PlainText }
                                }
                                Text { visible: lma.containsMouse || ln.cnt > 0; anchors.right: parent.right; anchors.rightMargin: 8; height: 20; verticalAlignment: Text.AlignVCenter
                                       text: ln.cnt > 0 ? ln.cnt : "+"; color: Theme.c; font.pixelSize: 12; font.bold: true }
                                MouseArea {
                                    id: lma; anchors.fill: parent; hoverEnabled: true; cursorShape: Qt.PointingHandCursor
                                    onClicked: { sb.pendingLine = ln.n; composer.ask((sb.scene ? sb.scene.file : "") + ":" + ln.n, false) }
                                }
                            }
                        }
                    }
                    Text { text: "COMMENTS ON THIS SCENE"; color: Theme.s; font.pixelSize: 11; font.letterSpacing: 1.1 }
                    Text { visible: sb.sceneComments.length === 0; text: "No comments on this scene."; color: Theme.s; font.pixelSize: 13 }
                    Column {
                        Layout.fillWidth: true; spacing: 6
                        Repeater {
                            model: sb.sceneComments.slice(0, 3)
                            delegate: Rectangle {
                                required property var modelData
                                width: parent.width; height: ct.implicitHeight + 16; radius: 10; color: "transparent"; border.color: Theme.l
                                Text { id: ct; anchors.fill: parent; anchors.margins: 8; wrapMode: Text.WordWrap; font.pixelSize: 12; color: modelData.status === "open" ? Theme.t : Theme.s
                                       text: (modelData.kind === "code" ? "line " + modelData.line : Theme.fmt(modelData.time || 0)) + "  " + modelData.text }
                            }
                        }
                    }
                }
            }
        }

        Rectangle {
            Layout.fillWidth: true; Layout.preferredHeight: sb.narrow ? 100 : 128; color: Theme.p
            Rectangle { width: parent.width; height: 1; color: Theme.l }
            ListView {
                anchors.fill: parent; anchors.leftMargin: 24; anchors.rightMargin: 24
                orientation: ListView.Horizontal; spacing: 14; clip: true
                model: sb.scenes
                delegate: Item {
                    required property var modelData
                    required property int index
                    width: (sb.narrow ? 68 : 90) * sb.ar; height: ListView.view.height
                    FrameImage {
                        anchors.verticalCenter: parent.verticalCenter
                        width: (sb.narrow ? 68 : 90) * sb.ar; height: sb.narrow ? 68 : 90
                        source: modelData.frameUrl
                        label: (index + 1) + " " + modelData.name
                        compact: true
                        border.width: sb.idx === index ? 2 : (modelData.hasFrame ? 0 : 1)
                        border.color: sb.idx === index ? Theme.c : Theme.l
                        Text { visible: modelData.hasFrame; anchors.left: parent.left; anchors.bottom: parent.bottom; anchors.margins: 6; color: "#fff"; font.pixelSize: 11; style: Text.Outline; styleColor: "#aa000000"; text: (index + 1) + " " + modelData.name }
                        MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: Nav.storyScene = index }
                    }
                }
            }
        }
    }
}
