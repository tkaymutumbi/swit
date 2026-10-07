pragma Singleton
import QtQuick

// User settings and keyboard bindings. Stored by the backend (QSettings).
QtObject {
    id: prefs
    property var be: null
    property var map: ({})      // binding overrides: action id -> sequence ("" means unbound)
    property var values: ({})   // saved settings
    property bool blocked: false            // true while a dialog is open
    property var acts: []
    property var lastFired: ({})

    readonly property var defaults: ({ noteSpan: "3s", autoplay: false, loop: false, captions: false, seekStep: 5 })

    // scope groups are shown in this order in Help and Settings
    readonly property var defs: [
        { id: "help.open", scope: "Everywhere", label: "Show this help", def: "?" },
        { id: "settings.open", scope: "Everywhere", label: "Open settings", def: "Ctrl+," },
        { id: "nav.back", scope: "Everywhere", label: "Go back", def: "Alt+Left" },
        { id: "nav.home", scope: "Everywhere", label: "Go to Home", def: "Alt+Home" },
        { id: "home.search", scope: "Home", label: "Search videos", def: "/" },
        { id: "home.openFolder", scope: "Home", label: "Open a video folder", def: "Ctrl+O" },
        { id: "story.prev", scope: "Storyboard", label: "Previous scene", def: "Up" },
        { id: "story.next", scope: "Storyboard", label: "Next scene", def: "Down" },
        { id: "story.approve", scope: "Storyboard", label: "Approve or unapprove scene", def: "A" },
        { id: "player.play", scope: "Player", label: "Play or pause", def: "Space" },
        { id: "player.back", scope: "Player", label: "Jump back", def: "Left" },
        { id: "player.forward", scope: "Player", label: "Jump forward", def: "Right" },
        { id: "player.inspector", scope: "Player", label: "Show or hide the inspector", def: "I" },
        { id: "player.timeline", scope: "Player", label: "Show or hide the timeline", def: "T" },
        { id: "player.captions", scope: "Player", label: "Show or hide captions", def: "C" },
        { id: "player.mute", scope: "Player", label: "Mute or unmute", def: "M" },
        { id: "player.loop", scope: "Player", label: "Loop on or off", def: "L" },
        { id: "player.speed", scope: "Player", label: "Change playback speed", def: "S" },
        { id: "player.fullscreen", scope: "Player", label: "Fullscreen", def: "F" },
        { id: "player.review", scope: "Player", label: "Review at this time", def: "R" },
        { id: "review.play", scope: "Review", label: "Play or pause", def: "Space" },
        { id: "review.back", scope: "Review", label: "Step back 1 second", def: "Left" },
        { id: "review.forward", scope: "Review", label: "Step forward 1 second", def: "Right" },
        { id: "review.pin", scope: "Review", label: "Pin tool", def: "P" },
        { id: "review.arrow", scope: "Review", label: "Arrow tool", def: "A" },
        { id: "review.box", scope: "Review", label: "Box tool", def: "B" },
        { id: "review.pen", scope: "Review", label: "Pen tool", def: "D" },
        { id: "review.note", scope: "Review", label: "Write a comment at this time", def: "N" }
    ]
    readonly property var scopes: ["Everywhere", "Home", "Storyboard", "Player", "Review"]

    function register(a) { acts.push(a) }
    function unregister(a) { var i = acts.indexOf(a); if (i >= 0) acts.splice(i, 1) }
    // Fire once even if both the Shortcut and the raw key path report the same press.
    function fire(a) {
        var now = Date.now(), last = lastFired[a.action] || 0
        if (now - last < 120) return
        lastFired[a.action] = now
        a.triggered()
    }
    // Raw key press from the window. Returns true when an action took it.
    function keyEvent(e) {
        if (blocked || !be) return false
        var s = be.keySequence(e.key, e.modifiers, e.text)
        if (s === "") return false
        var hit = false
        for (var i = 0; i < acts.length; i++) {
            var a = acts[i]
            if (a.active && a.sequence === s) { fire(a); hit = true }
        }
        return hit
    }

    function init(backend) { be = backend; reload() }
    function reload() { if (!be) return; map = be.bindings(); values = be.settings() }

    function seq(id) {
        var m = map[id]
        if (m !== undefined) return m
        for (var i = 0; i < defs.length; i++) if (defs[i].id === id) return defs[i].def
        return ""
    }
    function def(id) { for (var i = 0; i < defs.length; i++) if (defs[i].id === id) return defs[i]; return null }
    function isCustom(id) { return map[id] !== undefined }
    function bind(id, s) { if (be) { be.setBinding(id, s); reload() } }
    function unbind(id) { bind(id, "") }
    function resetOne(id) { if (be) { be.clearBinding(id); reload() } }
    function resetKeys() { if (be) { be.resetBindings(); reload() } }
    // Another action in the same scope (or Everywhere) already using this sequence, or null.
    function conflict(id, s) {
        if (!s) return null
        var me = def(id)
        for (var i = 0; i < defs.length; i++) {
            var d = defs[i]
            if (d.id === id || seq(d.id) !== s) continue
            if (d.scope === me.scope || d.scope === "Everywhere" || me.scope === "Everywhere") return d
        }
        return null
    }

    function get(key) {
        var v = values[key], d = defaults[key]
        if (v === undefined) return d
        if (typeof d === "boolean") return v === true || v === "true"
        if (typeof d === "number") return parseFloat(v)
        return v
    }
    function set(key, v) { if (be) { be.setSetting(key, v); reload() } }

    // "Ctrl+," -> ["Ctrl", ","], used to draw key caps
    function parts(s) {
        if (!s) return []
        var out = [], cur = ""
        for (var i = 0; i < s.length; i++) {
            if (s[i] === "+" && i > 0 && cur !== "") { out.push(cur); cur = "" } else cur += s[i]
        }
        if (cur !== "") out.push(cur)
        return out
    }
}
