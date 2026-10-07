import QtQuick

// A keyboard action. Fires from a Shortcut and also from raw key events caught by the window,
// because some input methods (fcitx, ibus) forward key presses without shortcut matching.
Item {
    id: a
    property string action
    property bool active: true
    signal triggered()
    readonly property string sequence: Prefs.seq(action)
    visible: false
    Shortcut {
        enabled: a.active && !Prefs.blocked && a.sequence !== ""
        sequence: a.sequence
        onActivated: Prefs.fire(a)
    }
    Component.onCompleted: Prefs.register(a)
    Component.onDestruction: Prefs.unregister(a)
}
