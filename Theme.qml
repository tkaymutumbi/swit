pragma Singleton
import QtQuick

QtObject {
    readonly property color bg: "#14171d"
    readonly property color p: "#1b1f27"
    readonly property color r: "#252a35"
    readonly property color l: "#2d3340"
    readonly property color t: "#e8ebf1"
    readonly property color s: "#98a2b3"
    readonly property color c: "#8fb4ff"
    readonly property color ci: "#0d1424"
    readonly property color ok: "#7bd88f"
    readonly property string sans: "IBM Plex Sans"
    readonly property string mono: "IBM Plex Mono"

    function fmt(sec) {
        var s = Math.max(0, Math.floor(sec))
        return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60)
    }
    function sceneAt(scenes, time) {
        for (var i = 0; i < scenes.length; i++)
            if (time < scenes[i].start + scenes[i].duration) return i
        return Math.max(0, scenes.length - 1)
    }
}
