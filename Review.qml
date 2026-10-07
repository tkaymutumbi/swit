import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtMultimedia

Item {
    id: rv
    readonly property bool compact: width < 900
    property bool showPanel: false
    readonly property var proj: backend.project
    readonly property var scenes: proj.scenes || []
    readonly property real secs: mp.position / 1000
    readonly property real total: Math.max(0.001, mp.duration > 0 ? mp.duration / 1000 : (proj.total || 0))
    property string tool: "box"
    property string filter: "open"
    property string selectedId: ""
    property var draft: null          // {kind, pts:[{x,y}]} in 0..1 video coordinates
    property var pending: null        // finished draft waiting for text
    property real stamp: 0

    function seek(s) { mp.pause(); mp.position = Math.max(0, Math.min(total, s)) * 1000 }
    function load() { stamp = proj.updatedMs || 0; mp.source = proj.videoUrl || "" }
    function numberOf(id) { var cs = backend.comments; for (var i = 0; i < cs.length; i++) if (cs[i].id === id) return i + 1; return 0 }
    function sceneIndexOf(c) {
        if (c.scene) for (var i = 0; i < scenes.length; i++) if (scenes[i].id === c.scene) return i
        return Theme.sceneAt(scenes, c.time || 0)
    }
    readonly property var listed: {
        var out = [], cs = backend.comments
        for (var i = 0; i < cs.length; i++) if (filter === "all" || cs[i].status === filter) out.push(cs[i])
        return out
    }
    readonly property var visibleShapes: {
        var out = [], cs = backend.comments
        for (var i = 0; i < cs.length; i++) {
            var c = cs[i]
            if (c.status !== "open" || c.time === undefined || (c.kind !== "pin" && c.kind !== "box" && c.kind !== "arrow" && c.kind !== "pen")) continue
            if (c.id === selectedId || Math.abs(c.time - secs) < 0.75) out.push(c)
        }
        return out
    }
    onVisibleShapesChanged: overlay.requestPaint()
    onDraftChanged: overlay.requestPaint()

    onVisibleChanged: { if (visible) { if (stamp !== (proj.updatedMs || 0) || mp.source.toString() === "") load(); pendingSeek.restart() } else mp.pause() }
    Timer { id: pendingSeek; interval: 120; onTriggered: rv.seek(Nav.reviewTime) }

    MediaPlayer {
        id: mp
        videoOutput: vo
        audioOutput: AudioOutput {}
        onMediaStatusChanged: if (mediaStatus === MediaPlayer.LoadedMedia) { rv.seek(Nav.reviewTime) }
    }
    Shortcut { enabled: rv.visible; sequence: "Space"; onActivated: mp.playbackState === MediaPlayer.PlayingState ? mp.pause() : mp.play() }
    Shortcut { enabled: rv.visible; sequence: "Left"; onActivated: rv.seek(rv.secs - 1) }
    Shortcut { enabled: rv.visible; sequence: "Right"; onActivated: rv.seek(rv.secs + 1) }

    Composer {
        id: composer
        onAccepted: (text) => {
            var p = rv.pending, c = { kind: p.kind, time: p.time, text: text }
            if (p.kind === "pin") { c.x = p.pts[0].x; c.y = p.pts[0].y }
            else if (p.kind === "pen") { c.points = p.pts }
            else if (p.kind !== "note") {
                var a = p.pts[0], b = p.pts[p.pts.length - 1]
                c.x = Math.min(a.x, b.x); c.y = Math.min(a.y, b.y); c.w = Math.abs(b.x - a.x); c.h = Math.abs(b.y - a.y)
                c.x1 = a.x; c.y1 = a.y; c.x2 = b.x; c.y2 = b.y
            }
            c.scene = rv.scenes.length ? rv.scenes[Theme.sceneAt(rv.scenes, p.time)].id : ""
            rv.selectedId = backend.addComment(c)
            rv.pending = null; rv.draft = null
        }
        onCancelled: { rv.pending = null; rv.draft = null }
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 0
        TopBar {
            crumbs: [{ text: "Home", page: "home" }, { text: rv.proj.name || "", page: "folder" }, { text: "Review", page: "review" }]
            Row {
                visible: !(rv.compact && rv.showPanel)
                spacing: 4
                Repeater {
                    model: [["pin", "Pin"], ["arrow", "Arrow"], ["box", "Box"], ["pen", "Pen"]]
                    Chip { required property var modelData; text: modelData[1]; on: rv.tool === modelData[0]; onClicked: rv.tool = modelData[0] }
                }
            }
            Btn { visible: rv.compact; text: rv.showPanel ? "Video" : "Comments " + (rv.proj.openComments || 0); onClicked: rv.showPanel = !rv.showPanel }
            Btn {
                visible: !rv.compact
                text: "Ask Claude to fix " + (rv.proj.openComments || 0)
                primary: true; enabled: (rv.proj.openComments || 0) > 0
                onClicked: backend.copyText(backend.fixPrompt())
            }
        }

        RowLayout {
            Layout.fillWidth: true; Layout.fillHeight: true; spacing: 0

            ColumnLayout {
                visible: !(rv.compact && rv.showPanel)
                Layout.fillWidth: true; Layout.fillHeight: true
                Layout.margins: rv.compact ? 12 : 20; Layout.bottomMargin: 14
                spacing: 12
                Rectangle {
                    Layout.fillWidth: true; Layout.fillHeight: true
                    radius: 10; color: "#000"; clip: true
                    VideoOutput { id: vo; anchors.fill: parent; fillMode: VideoOutput.PreserveAspectFit }
                    Text { visible: !rv.proj.hasVideo; anchors.centerIn: parent; color: Theme.s; font.pixelSize: 15; text: "No video to review yet." }
                    Canvas {
                        id: overlay
                        anchors.fill: parent
                        readonly property rect cr: vo.contentRect
                        function px(p) { return Qt.point(cr.x + p.x * cr.width, cr.y + p.y * cr.height) }
                        function shape(ctx, kind, c) {
                            ctx.lineWidth = 3; ctx.strokeStyle = "#8fb4ff"; ctx.fillStyle = "#8fb4ff"; ctx.lineJoin = "round"; ctx.lineCap = "round"
                            if (kind === "box") {
                                var a = px({ x: c.x1 !== undefined ? c.x1 : c.x, y: c.y1 !== undefined ? c.y1 : c.y }), b = px({ x: c.x2 !== undefined ? c.x2 : c.x + c.w, y: c.y2 !== undefined ? c.y2 : c.y + c.h })
                                ctx.fillStyle = "rgba(143,180,255,0.14)"; ctx.fillRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y))
                                ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y))
                            } else if (kind === "arrow") {
                                var s = px({ x: c.x1, y: c.y1 }), e = px({ x: c.x2, y: c.y2 }), ang = Math.atan2(e.y - s.y, e.x - s.x)
                                ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.stroke()
                                ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x - 16 * Math.cos(ang - 0.45), e.y - 16 * Math.sin(ang - 0.45)); ctx.lineTo(e.x - 16 * Math.cos(ang + 0.45), e.y - 16 * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill()
                            } else if (kind === "pen" && c.pts && c.pts.length) {
                                var q = px(c.pts[0]); ctx.beginPath(); ctx.moveTo(q.x, q.y)
                                for (var i = 1; i < c.pts.length; i++) { q = px(c.pts[i]); ctx.lineTo(q.x, q.y) }
                                ctx.stroke()
                            }
                        }
                        function badge(ctx, p, n) {
                            ctx.beginPath(); ctx.arc(p.x, p.y, 13, 0, Math.PI * 2); ctx.fillStyle = "#8fb4ff"; ctx.fill()
                            ctx.fillStyle = "#0d1424"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(n), p.x, p.y + 1)
                        }
                        onPaint: {
                            var ctx = getContext("2d")
                            ctx.reset()
                            var list = rv.visibleShapes
                            for (var i = 0; i < list.length; i++) {
                                var c = list[i]
                                if (c.kind === "pin") { badge(ctx, px({ x: c.x, y: c.y }), rv.numberOf(c.id)); continue }
                                var s = c
                                if (c.kind === "pen") s = { pts: c.points }
                                shape(ctx, c.kind, s)
                                var anchor = c.kind === "pen" && c.points && c.points.length ? c.points[0] : { x: c.x1 !== undefined ? c.x1 : c.x, y: c.y1 !== undefined ? c.y1 : c.y }
                                badge(ctx, px(anchor), rv.numberOf(c.id))
                            }
                            if (rv.draft) {
                                var d = rv.draft, p = d.pts
                                if (d.kind === "pin") badge(ctx, px(p[0]), "+")
                                else shape(ctx, d.kind, { x1: p[0].x, y1: p[0].y, x2: p[p.length - 1].x, y2: p[p.length - 1].y, pts: p })
                            }
                        }
                        onWidthChanged: requestPaint()
                        onHeightChanged: requestPaint()
                        MouseArea {
                            anchors.fill: parent
                            enabled: rv.proj.hasVideo === true
                            cursorShape: Qt.CrossCursor
                            function norm(m) {
                                var cr = overlay.cr
                                return { x: Math.max(0, Math.min(1, (m.x - cr.x) / cr.width)), y: Math.max(0, Math.min(1, (m.y - cr.y) / cr.height)) }
                            }
                            onPressed: (m) => { mp.pause(); rv.draft = { kind: rv.tool, pts: [norm(m)] } }
                            onPositionChanged: (m) => {
                                if (!pressed || !rv.draft) return
                                var pts = rv.draft.pts.slice()
                                if (rv.tool === "pen") pts.push(norm(m)); else pts = [pts[0], norm(m)]
                                rv.draft = { kind: rv.draft.kind, pts: pts }
                            }
                            onReleased: {
                                if (!rv.draft) return
                                var d = rv.draft
                                var a = d.pts[0], b = d.pts[d.pts.length - 1]
                                if (d.kind !== "pin" && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) < 0.01) d = { kind: "pin", pts: [a] }
                                rv.pending = { kind: d.kind, pts: d.pts, time: rv.secs }
                                rv.draft = d
                                composer.ask(Theme.fmt(rv.secs) + " · " + d.kind)
                            }
                        }
                    }
                }
                RowLayout {
                    spacing: 12
                    Rectangle {
                        Layout.preferredWidth: 30; Layout.preferredHeight: 30; radius: 15; color: Theme.r
                        Text { anchors.centerIn: parent; text: mp.playbackState === MediaPlayer.PlayingState ? "⏸" : "▶"; color: Theme.t; font.pixelSize: 12 }
                        MouseArea { anchors.fill: parent; onClicked: mp.playbackState === MediaPlayer.PlayingState ? mp.pause() : mp.play(); cursorShape: Qt.PointingHandCursor }
                    }
                    Text { text: Theme.fmt(rv.secs); color: Theme.t; font.family: Theme.mono; font.pixelSize: 12 }
                    Item {
                        id: sc
                        Layout.fillWidth: true; Layout.preferredHeight: 22
                        Rectangle { anchors.verticalCenter: parent.verticalCenter; width: parent.width; height: 6; radius: 3; color: Theme.r }
                        Rectangle { anchors.verticalCenter: parent.verticalCenter; width: parent.width * rv.secs / rv.total; height: 6; radius: 3; color: Theme.c }
                        Repeater {
                            model: backend.comments
                            Rectangle {
                                required property var modelData
                                visible: modelData.time !== undefined && modelData.status === "open"
                                x: sc.width * (modelData.time || 0) / rv.total - 6; anchors.verticalCenter: parent.verticalCenter
                                width: 12; height: 12; radius: 6; color: Theme.c; border.color: Theme.bg; border.width: 2
                            }
                        }
                        MouseArea {
                            anchors.fill: parent
                            onPressed: (m) => rv.seek(m.x / width * rv.total)
                            onPositionChanged: (m) => { if (pressed) rv.seek(Math.max(0, Math.min(1, m.x / width)) * rv.total) }
                        }
                    }
                    Text { text: Theme.fmt(rv.total); color: Theme.s; font.family: Theme.mono; font.pixelSize: 12 }
                }
            }

            Rectangle {
                visible: !rv.compact || rv.showPanel
                Layout.fillHeight: true; Layout.fillWidth: rv.compact; Layout.preferredWidth: rv.compact ? 1 : 350; color: Theme.p
                Rectangle { width: 1; height: parent.height; color: Theme.l }
                ColumnLayout {
                    anchors.fill: parent; anchors.margins: 18; spacing: 10
                    RowLayout {
                        spacing: 6
                        Text { text: "Comments"; color: Theme.t; font.pixelSize: 15; font.weight: Font.DemiBold; Layout.fillWidth: true }
                        Chip { text: (rv.proj.openComments || 0) + " open"; on: rv.filter === "open"; onClicked: rv.filter = "open" }
                        Chip { text: "Resolved " + (rv.proj.resolvedComments || 0); on: rv.filter === "resolved"; onClicked: rv.filter = "resolved" }
                    }
                    ListView {
                        id: lv
                        Layout.fillWidth: true; Layout.fillHeight: true
                        spacing: 10; clip: true
                        model: rv.listed
                        boundsBehavior: Flickable.StopAtBounds
                        footer: Text { visible: rv.listed.length === 0; width: lv.width; topPadding: 20; horizontalAlignment: Text.AlignHCenter; color: Theme.s; font.pixelSize: 13; text: "No comments here.\nDraw on the video or click a code line in the storyboard." }
                        delegate: Rectangle {
                            id: th
                            required property var modelData
                            width: lv.width; height: tcol.implicitHeight + 24; radius: 12; color: Theme.p
                            border.color: rv.selectedId === modelData.id ? Theme.c : Theme.l
                            ColumnLayout {
                                id: tcol
                                anchors.fill: parent; anchors.margins: 12; spacing: 6
                                RowLayout {
                                    spacing: 8
                                    Rectangle {
                                        Layout.preferredWidth: 20; Layout.preferredHeight: 20; radius: 10; color: th.modelData.status === "open" ? Theme.c : Theme.r
                                        Text { anchors.centerIn: parent; text: rv.numberOf(th.modelData.id); font.pixelSize: 11; font.bold: true; color: th.modelData.status === "open" ? Theme.ci : Theme.s }
                                    }
                                    Text {
                                        color: Theme.c; font.family: Theme.mono; font.pixelSize: 12; Layout.fillWidth: true; elide: Text.ElideMiddle
                                        text: th.modelData.kind === "code" ? th.modelData.file.replace("scenes/", "") + ":" + th.modelData.line : Theme.fmt(th.modelData.time || 0)
                                    }
                                    Text { text: th.modelData.status === "open" ? "Resolve" : "Reopen"; color: Theme.s; font.pixelSize: 12
                                           MouseArea { anchors.fill: parent; anchors.margins: -4; cursorShape: Qt.PointingHandCursor; onClicked: backend.setCommentStatus(th.modelData.id, th.modelData.status === "open" ? "resolved" : "open") } }
                                    Text { text: "Delete"; color: Theme.s; font.pixelSize: 12
                                           MouseArea { anchors.fill: parent; anchors.margins: -4; cursorShape: Qt.PointingHandCursor; onClicked: backend.deleteComment(th.modelData.id) } }
                                }
                                Text { Layout.fillWidth: true; wrapMode: Text.WordWrap; text: th.modelData.text; color: th.modelData.status === "open" ? Theme.t : Theme.s; font.pixelSize: 13; lineHeight: 1.3 }
                                Text { visible: !!th.modelData.resolution; Layout.fillWidth: true; wrapMode: Text.WordWrap; text: "Claude: " + th.modelData.resolution; color: Theme.ok; font.pixelSize: 12 }
                            }
                            MouseArea {
                                anchors.fill: parent; z: -1; cursorShape: Qt.PointingHandCursor
                                onClicked: {
                                    rv.selectedId = th.modelData.id
                                    if (th.modelData.kind === "code") { Nav.storyScene = rv.sceneIndexOf(th.modelData); Nav.go("storyboard") }
                                    else if (th.modelData.time !== undefined) rv.seek(th.modelData.time)
                                }
                            }
                        }
                    }
                    Btn {
                        visible: rv.compact
                        Layout.fillWidth: true
                        text: "Ask Claude to fix " + (rv.proj.openComments || 0); primary: true; enabled: (rv.proj.openComments || 0) > 0
                        onClicked: backend.copyText(backend.fixPrompt())
                    }
                    Rectangle {
                        Layout.fillWidth: true; Layout.preferredHeight: 42; radius: 10; color: "transparent"
                        border.color: note.activeFocus ? Theme.c : Theme.l
                        TextInput {
                            id: note
                            anchors.fill: parent; anchors.leftMargin: 12; anchors.rightMargin: 12
                            verticalAlignment: TextInput.AlignVCenter; clip: true
                            color: Theme.t; font.pixelSize: 13; font.family: Theme.sans
                            enabled: rv.proj.hasVideo === true
                            onAccepted: {
                                if (!text.trim()) return
                                rv.selectedId = backend.addComment({ kind: "note", time: rv.secs, text: text.trim(), scene: rv.scenes.length ? rv.scenes[Theme.sceneAt(rv.scenes, rv.secs)].id : "" })
                                text = ""
                            }
                            Text { visible: !note.text; anchors.fill: parent; verticalAlignment: Text.AlignVCenter; color: Theme.s; font: note.font; text: "Add a comment at " + Theme.fmt(rv.secs) + "…" }
                        }
                    }
                }
            }
        }
    }
}
