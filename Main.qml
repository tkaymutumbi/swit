import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Dialogs

ApplicationWindow {
    id: win
    width: 1280
    height: 800
    minimumWidth: 980
    minimumHeight: 620
    visible: true
    title: "swit"
    color: Theme.bg
    font.family: Theme.sans

    // Dev option: SWIT_START="<project dir>|<page>[|seconds]" opens straight into a screen.
    Component.onCompleted: {
        Prefs.init(backend)
        var dlg = backend.env("SWIT_DIALOG")   // dev option: help | settings | keys | about
        if (dlg) Qt.callLater(function () { dlg === "help" ? Nav.helpRequested() : dlg === "format" ? Nav.formatRequested() : Nav.settingsRequested(dlg === "settings" ? "general" : dlg) })
        var s = backend.env("SWIT_START")
        if (!s) return
        var a = s.split("|")
        Nav.open(a[0], a[1])
        if (a[2]) Nav.reviewTime = parseFloat(a[2])
    }
    StackLayout {
        anchors.fill: parent
        currentIndex: ["home", "folder", "storyboard", "player", "review"].indexOf(Nav.page)
        Home {}
        Folder {}
        Storyboard {}
        Player {}
        Review {}
    }

    Rectangle {
        id: toast
        property string message
        function show(m) { message = m; opacity = 1; hide.restart() }
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.bottom
        anchors.bottomMargin: 28
        width: toastText.implicitWidth + 36
        height: 40
        radius: 20
        color: Theme.r
        border.color: Theme.l
        opacity: 0
        visible: opacity > 0
        Behavior on opacity { NumberAnimation { duration: 180 } }
        Text { id: toastText; anchors.centerIn: parent; text: toast.message; color: Theme.t; font.pixelSize: 13; font.family: Theme.sans }
        Timer { id: hide; interval: 2600; onTriggered: toast.opacity = 0 }
    }

    Connections {
        target: backend
        function onToast(m) { toast.show(m) }
    }
    Connections {
        target: Nav
        function onAddFolderRequested() { folderDialog.open() }
    }
    FolderDialog {
        id: folderDialog
        title: "Open a Swit video folder"
        onAccepted: backend.addFolder(selectedFolder)
    }
    HelpDialog { id: helpDialog }
    SettingsDialog { id: settingsDialog }
    Connections {
        target: Nav
        function onHelpRequested() { settingsDialog.close(); helpDialog.open() }
        function onSettingsRequested(tab) { helpDialog.close(); settingsDialog.openTab(tab) }
    }
    readonly property bool dialogOpen: helpDialog.opened || settingsDialog.opened
    onDialogOpenChanged: Prefs.blocked = dialogOpen

    // Catches raw key presses when no text field has focus (see Act.qml).
    Item {
        id: keyCatcher
        anchors.fill: parent
        focus: true
        Keys.onPressed: (e) => { if (Prefs.keyEvent(e)) e.accepted = true }
    }
    onActiveFocusItemChanged: if (!activeFocusItem) keyCatcher.forceActiveFocus()
    Shortcut { enabled: !win.dialogOpen; sequence: "F1"; onActivated: Nav.helpRequested() }
    Act { action: "help.open"; active: !win.dialogOpen; onTriggered: Nav.helpRequested() }
    Act { action: "settings.open"; active: !win.dialogOpen; onTriggered: Nav.settingsRequested("general") }
    Act { action: "nav.back"; active: !win.dialogOpen; onTriggered: Nav.back() }
    Act { action: "nav.home"; active: !win.dialogOpen; onTriggered: Nav.home() }
}
