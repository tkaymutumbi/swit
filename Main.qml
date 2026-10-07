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
    Shortcut { sequence: "Alt+Left"; onActivated: Nav.back() }
}
