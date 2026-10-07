import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Dialogs

// Settings: general options, keyboard shortcuts you can re-record, and About with the changelog.
Popup {
    id: pop
    property string tab: "general"
    property string recording: ""     // action id being recorded
    property string notice: ""
    function openTab(t) { tab = t || "general"; recording = ""; notice = ""; open() }

    modal: true
    anchors.centerIn: Overlay.overlay
    width: Math.min(900, Overlay.overlay ? Overlay.overlay.width - 40 : 900)
    height: Math.min(640, Overlay.overlay ? Overlay.overlay.height - 40 : 640)
    padding: 0
    closePolicy: recording === "" ? (Popup.CloseOnEscape | Popup.CloseOnPressOutside) : Popup.NoAutoClose
    background: Rectangle { radius: 16; color: Theme.p; border.color: Theme.l }
    Overlay.modal: Rectangle { color: "#b0000000" }

    component Row2: RowLayout {
        property string title
        property string hint
        default property alias control: slot.data
        Layout.fillWidth: true; spacing: 16
        ColumnLayout {
            Layout.maximumWidth: 520; spacing: 2
            Text { text: parent.parent.title; color: Theme.t; font.pixelSize: 14; font.family: Theme.sans }
            Text { visible: parent.parent.hint !== ""; text: parent.parent.hint; color: Theme.s; font.pixelSize: 12; font.family: Theme.sans; Layout.fillWidth: true; wrapMode: Text.WordWrap }
        }
        Item { Layout.fillWidth: true }
        RowLayout { id: slot; spacing: 6; Layout.alignment: Qt.AlignRight }
    }
    component Divider: Rectangle { Layout.fillWidth: true; height: 1; color: Theme.l }

    FolderDialog { id: folderDialog; title: "Choose your videos folder"; onAccepted: backend.videosRoot = selectedFolder }

    contentItem: RowLayout {
        spacing: 0
        Rectangle {
            Layout.fillHeight: true; Layout.preferredWidth: 190; color: Theme.bg; radius: 16
            Rectangle { anchors.right: parent.right; width: 16; height: parent.height; color: Theme.bg }
            Rectangle { anchors.right: parent.right; width: 1; height: parent.height; color: Theme.l }
            Column {
                anchors.fill: parent; anchors.margins: 14; spacing: 4
                Text { text: "Settings"; color: Theme.t; font.pixelSize: 18; font.weight: Font.DemiBold; font.family: Theme.sans; bottomPadding: 12; leftPadding: 6 }
                Repeater {
                    model: [["general", "General"], ["keys", "Keyboard"], ["about", "About"]]
                    Rectangle {
                        required property var modelData
                        width: parent.width; height: 38; radius: 8
                        color: pop.tab === modelData[0] ? Theme.r : "transparent"
                        Text { anchors.verticalCenter: parent.verticalCenter; x: 12; text: modelData[1]; color: pop.tab === modelData[0] ? Theme.t : Theme.s; font.pixelSize: 14; font.family: Theme.sans }
                        MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: { pop.tab = modelData[0]; pop.recording = ""; pop.notice = "" } }
                    }
                }
            }
        }

        ColumnLayout {
            Layout.fillWidth: true; Layout.fillHeight: true; Layout.margins: 24; spacing: 14

            // ---------------- General ----------------
            ColumnLayout {
                visible: pop.tab === "general"
                Layout.fillWidth: true; spacing: 16
                Text { text: "General"; color: Theme.t; font.pixelSize: 20; font.weight: Font.DemiBold; font.family: Theme.sans }
                Row2 {
                    title: "Videos folder"; hint: backend.videosRoot
                    Btn { text: "Change"; onClicked: folderDialog.open() }
                }
                Divider {}
                Row2 {
                    title: "Default note duration"; hint: "How long a drawn note shows on the video."
                    Repeater { model: ["1s", "3s", "5s", "Scene", "Video"]; Chip { required property string modelData; text: modelData; on: Prefs.get("noteSpan") === modelData; onClicked: Prefs.set("noteSpan", modelData) } }
                }
                Divider {}
                Row2 { title: "Play when a video opens"; Toggle { checked: Prefs.get("autoplay"); onToggled: (v) => Prefs.set("autoplay", v) } }
                Row2 { title: "Loop playback"; Toggle { checked: Prefs.get("loop"); onToggled: (v) => Prefs.set("loop", v) } }
                Row2 { title: "Show captions by default"; Toggle { checked: Prefs.get("captions"); onToggled: (v) => Prefs.set("captions", v) } }
                Divider {}
                Row2 {
                    title: "Jump size in the player"; hint: "How far the jump keys move."
                    Repeater { model: [1, 5, 10, 15]; Chip { required property int modelData; text: modelData + "s"; on: Prefs.get("seekStep") === modelData; onClicked: Prefs.set("seekStep", modelData) } }
                }
                Item { Layout.fillHeight: true }
            }

            // ---------------- Keyboard ----------------
            ColumnLayout {
                visible: pop.tab === "keys"
                Layout.fillWidth: true; Layout.fillHeight: true; spacing: 10
                RowLayout {
                    Text { text: "Keyboard"; color: Theme.t; font.pixelSize: 20; font.weight: Font.DemiBold; font.family: Theme.sans; Layout.fillWidth: true }
                    Btn { text: "Reset all"; onClicked: { Prefs.resetKeys(); pop.notice = "All shortcuts are back to their defaults." } }
                }
                Text {
                    Layout.fillWidth: true; wrapMode: Text.WordWrap; font.pixelSize: 13; font.family: Theme.sans
                    color: pop.recording ? Theme.c : (pop.notice ? Theme.t : Theme.s)
                    text: pop.recording ? "Press the new keys. Escape cancels." : (pop.notice || "Click a shortcut to record a new one.")
                }
                ListView {
                    id: keyList
                    Layout.fillWidth: true; Layout.fillHeight: true; clip: true; spacing: 2
                    boundsBehavior: Flickable.StopAtBounds
                    ScrollBar.vertical: ScrollBar {}
                    model: Prefs.defs
                    section.property: "scope"
                    section.delegate: Text { required property string section; text: section.toUpperCase(); color: Theme.c; font.pixelSize: 11; font.letterSpacing: 1.2; font.weight: Font.DemiBold; topPadding: 14; bottomPadding: 4 }
                    delegate: Rectangle {
                        id: kr
                        required property var modelData
                        readonly property bool rec: pop.recording === modelData.id
                        width: keyList.width - 10; height: 42; radius: 8; color: rec ? Qt.rgba(0.56, 0.71, 1, 0.12) : "transparent"
                        border.color: rec ? Theme.c : "transparent"
                        RowLayout {
                            anchors.fill: parent; anchors.leftMargin: 10; anchors.rightMargin: 10; spacing: 8
                            Text { text: kr.modelData.label; color: Theme.t; font.pixelSize: 14; font.family: Theme.sans; Layout.fillWidth: true; elide: Text.ElideRight }
                            Text { visible: Prefs.isCustom(kr.modelData.id); text: "Reset"; color: Theme.s; font.pixelSize: 12
                                   MouseArea { anchors.fill: parent; anchors.margins: -4; cursorShape: Qt.PointingHandCursor; onClicked: { Prefs.resetOne(kr.modelData.id); pop.notice = "" } } }
                            Text { visible: kr.rec; text: "Recording..."; color: Theme.c; font.pixelSize: 13 }
                            Row {
                                visible: !kr.rec; spacing: 4
                                Text { visible: Prefs.parts(Prefs.seq(kr.modelData.id)).length === 0; text: "Not set"; color: Theme.s; font.pixelSize: 12; anchors.verticalCenter: parent.verticalCenter }
                                Repeater { model: Prefs.parts(Prefs.seq(kr.modelData.id)); Key { required property string modelData; label: modelData } }
                            }
                            Text { visible: !kr.rec && Prefs.seq(kr.modelData.id) !== ""; text: "Clear"; color: Theme.s; font.pixelSize: 12
                                   MouseArea { anchors.fill: parent; anchors.margins: -4; cursorShape: Qt.PointingHandCursor; onClicked: { Prefs.unbind(kr.modelData.id); pop.notice = kr.modelData.label + " has no shortcut now." } } }
                        }
                        MouseArea { anchors.fill: parent; z: -1; cursorShape: Qt.PointingHandCursor; onClicked: { pop.notice = ""; pop.recording = kr.modelData.id; recorder.forceActiveFocus() } }
                    }
                }
            }

            // ---------------- About ----------------
            ColumnLayout {
                visible: pop.tab === "about"
                Layout.fillWidth: true; Layout.fillHeight: true; spacing: 14
                RowLayout {
                    spacing: 16
                    Image { source: "qrc:/swit/icons/swit.svg"; sourceSize.width: 72; sourceSize.height: 72; Layout.preferredWidth: 72; Layout.preferredHeight: 72 }
                    ColumnLayout {
                        spacing: 2
                        Text { text: "Swit"; color: Theme.t; font.pixelSize: 26; font.weight: Font.DemiBold; font.family: Theme.sans }
                        Text { text: "Version " + backend.version; color: Theme.c; font.pixelSize: 14; font.family: Theme.mono }
                        Text { text: "Video as code. Reviewed by you."; color: Theme.s; font.pixelSize: 13; font.family: Theme.sans }
                    }
                }
                Text { text: "CHANGELOG"; color: Theme.s; font.pixelSize: 11; font.letterSpacing: 1.1; topPadding: 6 }
                Rectangle {
                    Layout.fillWidth: true; Layout.fillHeight: true; radius: 10; color: Theme.bg; border.color: Theme.l; clip: true
                    Flickable {
                        anchors.fill: parent; anchors.margins: 14
                        contentHeight: cl.implicitHeight; boundsBehavior: Flickable.StopAtBounds
                        ScrollBar.vertical: ScrollBar {}
                        Text {
                            id: cl
                            width: parent.width - 14
                            text: backend.changelog().replace(/^# Changelog\s*/, "")
                            textFormat: Text.MarkdownText; wrapMode: Text.WordWrap
                            color: Theme.t; font.pixelSize: 13; font.family: Theme.sans; lineHeight: 1.3
                        }
                    }
                }
            }

            RowLayout {
                Layout.fillWidth: true
                Item { Layout.fillWidth: true }
                Btn { text: "Done"; primary: true; onClicked: pop.close() }
            }
        }
    }

    // Invisible item that captures the next key press while recording.
    Item {
        id: recorder
        focus: pop.recording !== ""
        Keys.onShortcutOverride: (e) => { if (pop.recording !== "") e.accepted = true }
        Keys.onPressed: (e) => {
            if (pop.recording === "") return
            e.accepted = true
            if (e.key === Qt.Key_Escape) { pop.recording = ""; return }
            var s = backend.keySequence(e.key, e.modifiers, e.text)
            if (s === "") return
            var other = Prefs.conflict(pop.recording, s)
            if (other) { pop.notice = s + " is already used by “" + other.label + "”. Pick another key."; return }
            Prefs.bind(pop.recording, s)
            pop.notice = "Saved."
            pop.recording = ""
        }
    }
}
