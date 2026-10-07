import QtQuick

// A storyboard frame, or a hatched "not drawn yet" placeholder.
Rectangle {
    id: f
    property string source
    property string label
    property bool compact: false
    radius: 8
    color: img.status === Image.Ready ? "#000" : Theme.r
    border.width: img.status === Image.Ready ? 0 : 1
    border.color: Theme.l
    clip: true
    Image {
        id: img
        anchors.fill: parent
        source: f.source
        fillMode: Image.PreserveAspectCrop
        asynchronous: true
        smooth: true
    }
    Text {
        visible: img.status !== Image.Ready
        anchors.centerIn: parent
        width: parent.width - 16
        horizontalAlignment: Text.AlignHCenter
        wrapMode: Text.WordWrap
        text: f.compact ? "not drawn yet" : f.label + "\nnot drawn yet"
        color: Theme.s
        font.family: Theme.sans
        font.pixelSize: 12
    }
}
