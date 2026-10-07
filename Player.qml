import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtMultimedia

Item {
    id: pl
    readonly property bool compact: width < 760
    readonly property var proj: backend.project
    readonly property var scenes: proj.scenes || []
    readonly property real secs: mp.position / 1000
    readonly property real total: Math.max(0.001, mp.duration > 0 ? mp.duration / 1000 : (proj.total || 0))
    readonly property int cur: Theme.sceneAt(scenes, secs)
    readonly property var scene: scenes.length ? scenes[cur] : null
    property bool showInspector: true
    property bool showTimeline: true
    property bool captions: false
    property real stamp: 0

    function toggle() { mp.playbackState === MediaPlayer.PlayingState ? mp.pause() : mp.play() }
    function seek(s) { mp.position = Math.max(0, Math.min(total, s)) * 1000 }
    property real resumeAt: 0
    function load() { stamp = proj.updatedMs || 0; if (mp.position > 0) resumeAt = mp.position; mp.stop(); mp.source = ""; reload.restart() }
    Timer { id: reload; interval: 350; onTriggered: mp.source = pl.proj.videoUrl || "" }

    onVisibleChanged: { if (visible) { if (stamp !== (proj.updatedMs || 0) || mp.source.toString() === "") load() } else mp.pause() }
    Connections { target: backend; function onProjectChanged() { if (pl.visible && pl.stamp !== (pl.proj.updatedMs || 0)) pl.load() } }
    Component.onCompleted: if (visible) load()

    MediaPlayer {
        id: mp
        videoOutput: vo
        audioOutput: AudioOutput { id: ao; muted: false }
        loops: loopChip.on ? MediaPlayer.Infinite : 1
        onMediaStatusChanged: if (mediaStatus === MediaPlayer.LoadedMedia) { if (pl.resumeAt > 0) { position = pl.resumeAt; pl.resumeAt = 0 } pause() }
    }

    Shortcut { enabled: pl.visible; sequence: "Space"; onActivated: pl.toggle() }
    Shortcut { enabled: pl.visible; sequence: "I"; onActivated: pl.showInspector = !pl.showInspector }
    Shortcut { enabled: pl.visible; sequence: "T"; onActivated: pl.showTimeline = !pl.showTimeline }
    Shortcut { enabled: pl.visible; sequence: "C"; onActivated: pl.captions = !pl.captions }
    Shortcut { enabled: pl.visible; sequence: "M"; onActivated: ao.muted = !ao.muted }
    Shortcut { enabled: pl.visible; sequence: "Left"; onActivated: pl.seek(pl.secs - 5) }
    Shortcut { enabled: pl.visible; sequence: "Right"; onActivated: pl.seek(pl.secs + 5) }
    Shortcut { enabled: pl.visible; sequence: "F"; onActivated: Window.window.visibility = Window.window.visibility === Window.FullScreen ? Window.Windowed : Window.FullScreen }

    ColumnLayout {
        anchors.fill: parent
        spacing: 0
        TopBar {
            id: top
            crumbs: [{ text: "Home", page: "home" }, { text: pl.proj.name || "", page: "folder" }, { text: "video.mp4", page: "player" }]
            Btn { visible: pl.width >= 1100; text: (pl.showInspector ? "Hide" : "Show") + " inspector  I"; onClicked: pl.showInspector = !pl.showInspector }
            Btn { visible: !pl.compact; text: (pl.showTimeline ? "Hide" : "Show") + " timeline  T"; onClicked: pl.showTimeline = !pl.showTimeline }
            Btn { text: "Review"; primary: true; onClicked: Nav.review(pl.secs) }
        }

        RowLayout {
            Layout.fillWidth: true; Layout.fillHeight: true; spacing: 0

            ColumnLayout {
                Layout.fillWidth: true; Layout.fillHeight: true
                Layout.margins: 16; Layout.leftMargin: pl.compact ? 12 : 20; Layout.rightMargin: pl.compact ? 12 : 20; Layout.bottomMargin: 12
                spacing: 12
                Rectangle {
                    Layout.fillWidth: true; Layout.fillHeight: true
                    radius: 10; color: "#000"; clip: true
                    VideoOutput { id: vo; anchors.fill: parent; fillMode: VideoOutput.PreserveAspectFit }
                    Text {
                        visible: pl.captions && pl.scene && pl.scene.caption !== ""
                        anchors.horizontalCenter: parent.horizontalCenter; anchors.bottom: parent.bottom; anchors.bottomMargin: 28
                        width: parent.width * 0.8; horizontalAlignment: Text.AlignHCenter; wrapMode: Text.WordWrap
                        text: pl.scene ? pl.scene.caption : ""; color: "#fff"; font.pixelSize: 20; style: Text.Outline; styleColor: "#cc000000"
                    }
                    Text {
                        visible: !pl.proj.hasVideo
                        anchors.centerIn: parent; horizontalAlignment: Text.AlignHCenter; color: Theme.s; font.pixelSize: 15; lineHeight: 1.4
                        text: "No video yet.\nApprove the storyboard, then ask Claude to build it."
                    }
                    MouseArea { anchors.fill: parent; onClicked: pl.toggle(); onDoubleClicked: Window.window.visibility = Window.window.visibility === Window.FullScreen ? Window.Windowed : Window.FullScreen }
                }
                RowLayout {
                    spacing: 12
                    Rectangle {
                        Layout.preferredWidth: 34; Layout.preferredHeight: 34; radius: 17; color: Theme.c
                        Glyph { anchors.centerIn: parent; width: 16; height: 16; color: Theme.ci; playing: mp.playbackState === MediaPlayer.PlayingState }
                        MouseArea { anchors.fill: parent; onClicked: pl.toggle(); cursorShape: Qt.PointingHandCursor }
                    }
                    Text { text: Theme.fmt(pl.secs) + " / " + Theme.fmt(pl.total); color: Theme.t; font.family: Theme.mono; font.pixelSize: 12 }
                    Item {
                        id: scrub
                        Layout.fillWidth: true; Layout.minimumWidth: 80; Layout.preferredHeight: 22
                        Rectangle { anchors.verticalCenter: parent.verticalCenter; width: parent.width; height: 6; radius: 3; color: Theme.r }
                        Rectangle { anchors.verticalCenter: parent.verticalCenter; width: parent.width * pl.secs / pl.total; height: 6; radius: 3; color: Theme.c }
                        Repeater {
                            model: pl.scenes.slice(1)
                            Rectangle { required property var modelData; x: scrub.width * modelData.start / pl.total; anchors.verticalCenter: parent.verticalCenter; width: 2; height: 12; color: Theme.bg }
                        }
                        Repeater {
                            model: backend.comments
                            Rectangle {
                                required property var modelData
                                visible: modelData.time !== undefined && modelData.status === "open"
                                x: scrub.width * (modelData.time || 0) / pl.total - 4; y: -3; width: 8; height: 8; radius: 4; color: Theme.c
                            }
                        }
                        Rectangle { x: scrub.width * pl.secs / pl.total - 6; anchors.verticalCenter: parent.verticalCenter; width: 12; height: 12; radius: 6; color: "#fff" }
                        MouseArea {
                            anchors.fill: parent
                            onPressed: (m) => pl.seek(m.x / width * pl.total)
                            onPositionChanged: (m) => { if (pressed) pl.seek(Math.max(0, Math.min(1, m.x / width)) * pl.total) }
                        }
                    }
                    Chip { text: [0.5, 1, 1.5, 2][speed] + "×"; property int speed: 1
                           onClicked: { speed = (speed + 1) % 4; mp.playbackRate = [0.5, 1, 1.5, 2][speed] } }
                    Chip { visible: !pl.compact; id: loopChip; text: "Loop"; on: false; onClicked: on = !on }
                    Chip { visible: !pl.compact; text: "CC"; on: pl.captions; onClicked: pl.captions = !pl.captions }
                    Chip { visible: !pl.compact; text: ao.muted ? "Muted" : "Sound"; on: ao.muted; onClicked: ao.muted = !ao.muted }
                    Chip { text: "Full"; onClicked: Window.window.visibility = Window.window.visibility === Window.FullScreen ? Window.Windowed : Window.FullScreen }
                }
            }

            Rectangle {
                visible: pl.showInspector && pl.width >= 1100
                Layout.fillHeight: true; Layout.preferredWidth: 300; color: Theme.p
                Rectangle { width: 1; height: parent.height; color: Theme.l }
                ColumnLayout {
                    anchors.fill: parent; anchors.margins: 18; spacing: 12
                    Text { text: pl.scene ? "SCENE " + (pl.cur + 1) + " · " + pl.scene.name.toUpperCase() : ""; color: Theme.s; font.pixelSize: 11; font.letterSpacing: 1.1 }
                    Repeater {
                        model: pl.scene ? [["Starts", Theme.fmt(pl.scene.start)], ["Duration", pl.scene.duration + " s"], ["File", pl.scene.file.replace("scenes/", "")], ["Status", pl.scene.approved ? "Approved" : "Not approved"]] : []
                        delegate: Rectangle {
                            required property var modelData
                            Layout.fillWidth: true; implicitHeight: 38; radius: 8; color: "transparent"; border.color: Theme.l
                            RowLayout {
                                anchors.fill: parent; anchors.margins: 12
                                Text { text: modelData[0]; color: Theme.s; font.pixelSize: 13; Layout.fillWidth: true }
                                Text { text: modelData[1]; color: Theme.t; font.family: Theme.mono; font.pixelSize: 12 }
                            }
                        }
                    }
                    Text { text: "CAPTION"; color: Theme.s; font.pixelSize: 11; font.letterSpacing: 1.1; Layout.topMargin: 6 }
                    Text { Layout.fillWidth: true; wrapMode: Text.WordWrap; text: pl.scene && pl.scene.caption ? pl.scene.caption : "None"; color: Theme.t; font.pixelSize: 14 }
                    Item { Layout.fillHeight: true }
                    Btn { text: "Open scene code"; Layout.fillWidth: true; onClicked: { Nav.storyScene = pl.cur; Nav.go("storyboard") } }
                }
            }
        }

        Rectangle {
            visible: pl.showTimeline && !pl.compact
            Layout.fillWidth: true; Layout.preferredHeight: 150; color: Theme.p
            Rectangle { width: parent.width; height: 1; color: Theme.l }
            Item {
                id: tl
                anchors.fill: parent; anchors.margins: 18; anchors.topMargin: 14
                readonly property real lw: 70
                readonly property real tw: width - lw
                Column {
                    anchors.fill: parent; spacing: 8
                    Item {
                        width: parent.width; height: 16
                        Repeater {
                            model: 5
                            Text { required property int index; x: tl.lw + tl.tw * index / 4 - (index === 4 ? width : (index === 0 ? 0 : width / 2)); text: Theme.fmt(pl.total * index / 4); color: Theme.s; font.family: Theme.mono; font.pixelSize: 11 }
                        }
                    }
                    Item {
                        width: parent.width; height: 48
                        Text { text: "Scenes"; color: Theme.s; font.pixelSize: 12; anchors.verticalCenter: parent.verticalCenter }
                        Repeater {
                            model: pl.scenes
                            delegate: FrameImage {
                                required property var modelData
                                required property int index
                                x: tl.lw + tl.tw * modelData.start / pl.total + 1
                                width: Math.max(4, tl.tw * modelData.duration / pl.total - 2); height: 48; radius: 6
                                source: modelData.frameUrl; compact: true
                                border.width: pl.cur === index ? 2 : (modelData.hasFrame ? 0 : 1); border.color: pl.cur === index ? Theme.c : Theme.l
                                Rectangle { visible: modelData.hasFrame; anchors.fill: parent; color: "#66000000" }
                                Text { visible: modelData.hasFrame; anchors.left: parent.left; anchors.bottom: parent.bottom; anchors.margins: 5; text: modelData.name; color: "#fff"; font.pixelSize: 11; style: Text.Outline; styleColor: "#aa000000" }
                            }
                        }
                    }
                    Item {
                        width: parent.width; height: 28
                        Text { text: "Comments"; color: Theme.s; font.pixelSize: 12; anchors.verticalCenter: parent.verticalCenter }
                        Rectangle { x: tl.lw; anchors.verticalCenter: parent.verticalCenter; width: tl.tw; height: 24; radius: 5; color: Theme.r }
                        Repeater {
                            model: backend.comments
                            Rectangle {
                                required property var modelData
                                visible: modelData.time !== undefined && modelData.status === "open"
                                x: tl.lw + tl.tw * (modelData.time || 0) / pl.total - 5; anchors.verticalCenter: parent.verticalCenter
                                width: 10; height: 10; radius: 5; color: Theme.c
                            }
                        }
                    }
                }
                Rectangle { x: tl.lw + tl.tw * pl.secs / pl.total - 1; y: 16; width: 2; height: parent.height - 16; color: Theme.c }
                MouseArea {
                    x: tl.lw; y: 0; width: tl.tw; height: parent.height
                    onPressed: (m) => pl.seek(m.x / width * pl.total)
                    onPositionChanged: (m) => { if (pressed) pl.seek(Math.max(0, Math.min(1, m.x / width)) * pl.total) }
                }
            }
        }
    }
}
