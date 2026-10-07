pragma Singleton
import QtQuick

QtObject {
    property string page: "home"
    property real reviewTime: 0
    property int storyScene: 0
    signal addFolderRequested()

    function go(p) { page = p }
    function open(dir, p) { backend.openProject(dir); page = p || "folder" }
    function home() { backend.closeProject(); page = "home" }
    function review(time) { reviewTime = time; page = "review" }
    function back() {
        if (page === "folder") home()
        else if (page !== "home") page = "folder"
    }
}
