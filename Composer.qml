import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

// Small popup to type a comment. Call ask(label), listen for accepted(text).
Popup {
    id: pop
    property string label: ""
    property bool showSpan: true
    property string span: "3s"
    readonly property var spanOptions: ["1s", "3s", "5s", "Scene", "Video"]
    signal accepted(string text)
    signal cancelled()
    modal: true
    anchors.centerIn: Overlay.overlay
    width: 420
    padding: 18
    closePolicy: Popup.CloseOnEscape
    function ask(l, withSpan) { label = l; showSpan = withSpan !== false; span = Prefs.get("noteSpan"); field.text = ""; open(); field.forceActiveFocus() }
    onClosed: if (!accepting) cancelled()
    property bool accepting: false
    background: Rectangle { radius: 14; color: Theme.p; border.color: Theme.l }
    Overlay.modal: Rectangle { color: "#aa000000" }
    contentItem: ColumnLayout {
        spacing: 12
        Text { text: pop.label; color: Theme.c; font.family: Theme.mono; font.pixelSize: 12 }
        TextArea {
            id: field
            Layout.fillWidth: true
            Layout.preferredHeight: 96
            wrapMode: TextArea.Wrap
            placeholderText: "What should change?"
            placeholderTextColor: Theme.s
            color: Theme.t
            font.family: Theme.sans
            font.pixelSize: 14
            background: Rectangle { radius: 10; color: Theme.bg; border.color: field.activeFocus ? Theme.c : Theme.l }
            Keys.onPressed: (e) => { if ((e.key === Qt.Key_Return || e.key === Qt.Key_Enter) && (e.modifiers & Qt.ControlModifier)) { e.accepted = true; save.clicked() } }
        }
        ColumnLayout {
            visible: pop.showSpan
            spacing: 6
            Text { text: "SHOW THIS NOTE FOR"; color: Theme.s; font.pixelSize: 11; font.letterSpacing: 1.1 }
            Row {
                spacing: 6
                Repeater {
                    model: pop.spanOptions
                    Chip { required property string modelData; text: modelData; on: pop.span === modelData; onClicked: pop.span = modelData }
                }
            }
        }
        RowLayout {
            Text { text: "Ctrl+Enter to save"; color: Theme.s; font.pixelSize: 12; font.family: Theme.sans }
            Item { Layout.fillWidth: true }
            Btn { text: "Cancel"; onClicked: pop.close() }
            Btn {
                id: save
                text: "Add comment"; primary: true; enabled: field.text.trim().length > 0
                onClicked: { pop.accepting = true; pop.accepted(field.text.trim()); pop.close(); pop.accepting = false }
            }
        }
    }
}
