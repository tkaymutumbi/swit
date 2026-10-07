#include "backend.h"

#include <QClipboard>
#include <QKeySequence>
#include <QDesktopServices>
#include <QDir>
#include <QFile>
#include <QFileInfo>
#include <QGuiApplication>
#include <QJsonArray>
#include <QJsonDocument>
#include <QRandomGenerator>
#include <QStandardPaths>
#include <QUrl>

namespace {
QJsonObject readObject(const QString &path)
{
    QFile f(path);
    if (!f.open(QIODevice::ReadOnly)) return {};
    return QJsonDocument::fromJson(f.readAll()).object();
}

bool writeJson(const QString &path, const QJsonObject &obj)
{
    QFile f(path);
    if (!f.open(QIODevice::WriteOnly | QIODevice::Truncate)) return false;
    f.write(QJsonDocument(obj).toJson(QJsonDocument::Indented));
    return true;
}

QString registryPath()
{
    return QDir::homePath() + "/.config/swit/projects.json";
}

QString humanSize(qint64 b)
{
    if (b < 1024) return QString::number(b) + " B";
    if (b < 1024 * 1024) return QString::number(b / 1024) + " KB";
    return QString::number(b / 1048576.0, 'f', 1) + " MB";
}

QString humanTime(const QDateTime &t)
{
    const QDateTime now = QDateTime::currentDateTime();
    const qint64 s = t.secsTo(now);
    if (s < 60) return "just now";
    if (s < 3600) return QString::number(s / 60) + " min ago";
    if (t.date() == now.date()) return "Today " + t.toString("HH:mm");
    if (t.date().daysTo(now.date()) == 1) return "Yesterday";
    return t.toString("MMM d");
}
}

#ifndef SWIT_VERSION
#define SWIT_VERSION "0.0.0"
#endif

QString Backend::version() const { return QStringLiteral(SWIT_VERSION); }

Backend::Backend(QObject *parent) : QObject(parent), m_settings("Swit", "Swit")
{
    m_root = !qEnvironmentVariableIsEmpty("SWIT_VIDEOS") ? qEnvironmentVariable("SWIT_VIDEOS")
           : m_settings.value("videosRoot", QDir::homePath() + "/videos").toString();
    m_poll.setInterval(1500);
    connect(&m_poll, &QTimer::timeout, this, [this] { if (signature() != m_sig) refresh(); });
    m_poll.start();
    refresh();
}

void Backend::setVideosRoot(const QString &urlOrPath)
{
    const QString path = urlOrPath.startsWith("file:") ? QUrl(urlOrPath).toLocalFile() : urlOrPath;
    if (path.isEmpty() || path == m_root) return;
    m_root = path;
    m_settings.setValue("videosRoot", path);
    emit videosRootChanged();
    refresh();
}

QVariantList Backend::formats() const
{
    QFile f(":/swit/formats.json");
    if (!f.open(QIODevice::ReadOnly)) return {};
    return QJsonDocument::fromJson(f.readAll()).array().toVariantList();
}

void Backend::setFormat(const QString &id)
{
    if (m_dir.isEmpty()) return;
    for (const auto &v : formats()) {
        const QVariantMap f = v.toMap();
        if (f.value("id").toString() != id) continue;
        QJsonObject sb = readObject(m_dir + "/storyboard.json");
        sb["format"] = id;
        sb["width"] = f.value("width").toInt();
        sb["height"] = f.value("height").toInt();
        writeJson(m_dir + "/storyboard.json", sb);
        refresh();
        emit toast(QString("Format set to %1 %2").arg(f.value("name").toString(), f.value("ratio").toString()));
        return;
    }
}

// Claude's MCP server reads this file for defaults such as the format of new videos.
void Backend::writeSettingsMirror() const
{
    QDir().mkpath(QDir::homePath() + "/.config/swit");
    writeJson(QDir::homePath() + "/.config/swit/settings.json", QJsonObject::fromVariantMap(settings()));
}

QVariantMap Backend::settings() const
{
    QVariantMap out;
    m_settings.beginGroup("prefs");
    for (const auto &k : m_settings.childKeys()) out[k] = m_settings.value(k);
    m_settings.endGroup();
    return out;
}

void Backend::setSetting(const QString &key, const QVariant &value)
{
    m_settings.setValue("prefs/" + key, value);
    writeSettingsMirror();
}

QVariantMap Backend::bindings() const
{
    QVariantMap out;
    m_settings.beginGroup("keys");
    for (const auto &k : m_settings.childKeys()) out[QString(k).replace('|', '.')] = m_settings.value(k);
    m_settings.endGroup();
    return out;
}

void Backend::setBinding(const QString &id, const QString &sequence)
{
    m_settings.setValue("keys/" + QString(id).replace('.', '|'), sequence);
}

void Backend::clearBinding(const QString &id)
{
    m_settings.remove("keys/" + QString(id).replace('.', '|'));
}

void Backend::resetBindings()
{
    m_settings.remove("keys");
}

// Turn a key event into the portable text a QML Shortcut understands.
QString Backend::keySequence(int key, int modifiers, const QString &text) const
{
    switch (key) {
    case Qt::Key_Shift: case Qt::Key_Control: case Qt::Key_Alt: case Qt::Key_Meta: case Qt::Key_AltGr: return {};
    default: break;
    }
    const bool printableSymbol = text.size() == 1 && text[0].isPrint() && !text[0].isLetterOrNumber() && !text[0].isSpace();
    if (printableSymbol) {
        const int mods = modifiers & ~Qt::ShiftModifier;
        const QString mod = QKeySequence(mods).toString(QKeySequence::PortableText);
        return mod + text;
    }
    return QKeySequence(modifiers | key).toString(QKeySequence::PortableText);
}

QString Backend::changelog() const
{
    QFile f(":/swit/CHANGELOG.md");
    return f.open(QIODevice::ReadOnly) ? QString::fromUtf8(f.readAll()) : QString();
}

QStringList Backend::registered() const
{
    QStringList dirs;
    const QJsonArray arr = readObject(registryPath()).value("projects").toArray();
    for (const auto &v : arr) dirs << v.toString();
    const auto subs = QDir(m_root).entryInfoList(QDir::Dirs | QDir::NoDotAndDotDot);
    for (const auto &fi : subs)
        if (QFile::exists(fi.absoluteFilePath() + "/storyboard.json") && !dirs.contains(fi.absoluteFilePath()))
            dirs << fi.absoluteFilePath();
    return dirs;
}

void Backend::saveRegistry(const QStringList &dirs) const
{
    QDir().mkpath(QFileInfo(registryPath()).absolutePath());
    QJsonArray arr;
    for (const auto &d : dirs) arr.append(d);
    writeJson(registryPath(), QJsonObject{{"projects", arr}});
}

QString Backend::signature() const
{
    QString sig;
    QStringList dirs = registered();
    if (!m_dir.isEmpty() && !dirs.contains(m_dir)) dirs << m_dir;
    for (const auto &d : dirs) {
        for (const char *n : {"storyboard.json", "comments.json", "video.mp4"})
            sig += QString::number(QFileInfo(d + "/" + n).lastModified().toMSecsSinceEpoch()) + ",";
        for (const auto &fi : QDir(d + "/scenes").entryInfoList({"*.js"}, QDir::Files, QDir::Name))
            sig += fi.fileName() + ":" + QString::number(fi.lastModified().toMSecsSinceEpoch()) + ",";
        for (const auto &fi : QDir(d + "/frames").entryInfoList(QDir::Files))
            sig += QString::number(fi.lastModified().toMSecsSinceEpoch()) + ",";
        sig += ";";
    }
    return sig;
}

QVariantMap Backend::loadProject(const QString &dir, QVariantList *commentsOut) const
{
    const QJsonObject sb = readObject(dir + "/storyboard.json");
    if (sb.isEmpty()) return {};
    QVariantList scenes;
    double start = 0;
    int drawn = 0;
    QStringList frames;
    for (const auto &v : sb.value("scenes").toArray()) {
        QVariantMap s = v.toObject().toVariantMap();
        const QString frame = QString("frames/%1.png").arg(s.value("id").toString());
        const bool has = QFile::exists(dir + "/" + frame);
        s["hasFrame"] = has;
        s["frameUrl"] = has ? QUrl::fromLocalFile(dir + "/" + frame).toString() + "?" + QString::number(QFileInfo(dir + "/" + frame).lastModified().toMSecsSinceEpoch()) : QString();
        s["start"] = start;
        s["duration"] = s.value("duration").toDouble();
        s["approved"] = s.value("approved").toBool();
        start += s["duration"].toDouble();
        if (has) { drawn++; frames << s["frameUrl"].toString(); }
        scenes << s;
    }
    const QJsonArray cm = readObject(dir + "/comments.json").value("comments").toArray();
    int open = 0;
    QVariantList cl;
    for (const auto &c : cm) {
        cl << c.toObject().toVariantMap();
        if (c.toObject().value("status").toString() == "open") open++;
    }
    if (commentsOut) *commentsOut = cl;
    const bool hasVideo = QFile::exists(dir + "/video.mp4");
    QDateTime mod = QFileInfo(dir + "/storyboard.json").lastModified();
    if (hasVideo) mod = qMax(mod, QFileInfo(dir + "/video.mp4").lastModified());

    QVariantMap p;
    p["dir"] = dir;
    p["name"] = QFileInfo(dir).fileName();
    p["title"] = sb.value("title").toString(QFileInfo(dir).fileName());
    p["width"] = sb.value("width").toInt(1920);
    p["height"] = sb.value("height").toInt(1080);
    p["fps"] = sb.value("fps").toInt(30);
    {
        const int pw = p["width"].toInt(), ph = p["height"].toInt();
        QString fid = sb.value("format").toString(), fname, fratio;
        for (const auto &v : formats()) {
            const QVariantMap f = v.toMap();
            if (f.value("id").toString() == fid || (fid.isEmpty() && f.value("width").toInt() == pw && f.value("height").toInt() == ph)) {
                fid = f.value("id").toString(); fname = f.value("name").toString(); fratio = f.value("ratio").toString(); break;
            }
        }
        if (fname.isEmpty()) { fid = "custom"; fname = "Custom"; fratio = QString("%1:%2").arg(pw).arg(ph); }
        p["format"] = fid; p["formatName"] = fname; p["ratio"] = fratio;
        p["aspect"] = ph > 0 ? double(pw) / ph : 16.0 / 9.0;
    }
    p["scenes"] = scenes;
    p["sceneCount"] = scenes.size();
    p["drawn"] = drawn;
    p["total"] = start;
    p["frames"] = frames;
    p["hasVideo"] = hasVideo;
    p["videoUrl"] = hasVideo ? QUrl::fromLocalFile(dir + "/video.mp4").toString() : QString();
    p["openComments"] = open;
    p["resolvedComments"] = cm.size() - open;
    p["updated"] = humanTime(mod);
    p["updatedMs"] = mod.toMSecsSinceEpoch();
    return p;
}

void Backend::refresh()
{
    m_sig = signature();
    QVariantList list;
    for (const auto &d : registered()) {
        const QVariantMap p = loadProject(d, nullptr);
        if (!p.isEmpty()) list << p;
    }
    std::sort(list.begin(), list.end(), [](const QVariant &a, const QVariant &b) {
        return a.toMap().value("updatedMs").toLongLong() > b.toMap().value("updatedMs").toLongLong();
    });
    m_projects = list;
    emit projectsChanged();
    if (!m_dir.isEmpty()) {
        m_project = loadProject(m_dir, &m_comments);
        emit projectChanged();
    }
}

int Backend::openCommentTotal() const
{
    int n = 0;
    for (const auto &p : m_projects) n += p.toMap().value("openComments").toInt();
    return n;
}

void Backend::openProject(const QString &dir)
{
    m_dir = dir;
    m_project = loadProject(dir, &m_comments);
    emit projectChanged();
}

void Backend::closeProject()
{
    m_dir.clear();
    m_project.clear();
    m_comments.clear();
    emit projectChanged();
}

void Backend::addFolder(const QString &urlOrPath)
{
    const QString path = urlOrPath.startsWith("file:") ? QUrl(urlOrPath).toLocalFile() : urlOrPath;
    if (!QFile::exists(path + "/storyboard.json")) {
        emit toast("That folder has no storyboard.json, so it is not a Swit video.");
        return;
    }
    QStringList dirs = registered();
    if (!dirs.contains(path)) { dirs << path; saveRegistry(dirs); }
    refresh();
    emit toast("Added " + QFileInfo(path).fileName());
}

QVariantList Backend::files() const
{
    QVariantList out;
    if (m_dir.isEmpty()) return out;
    const auto entries = QDir(m_dir).entryInfoList(QDir::AllEntries | QDir::NoDotAndDotDot, QDir::DirsFirst | QDir::Name);
    for (const auto &fi : entries) {
        QVariantMap f;
        const QString n = fi.fileName();
        QString kind = "File";
        if (fi.isDir()) kind = (n == "scenes") ? QString("%1 JS files").arg(QDir(fi.filePath()).entryList({"*.js"}).size()) : QString("Folder");
        else if (n == "storyboard.json") kind = "Storyboard";
        else if (n == "video.mp4") kind = "Video";
        else if (n == "comments.json") kind = "Comments";
        else if (n.endsWith(".md")) kind = "Brief";
        f["name"] = fi.isDir() ? n + "/" : n;
        f["kind"] = kind;
        f["isDir"] = fi.isDir();
        f["size"] = fi.isDir() ? QString("—") : humanSize(fi.size());
        f["modified"] = humanTime(fi.lastModified());
        f["path"] = fi.filePath();
        out << f;
    }
    return out;
}

QString Backend::readText(const QString &relPath) const
{
    if (m_dir.isEmpty() || relPath.contains("..")) return {};
    QFile f(m_dir + "/" + relPath);
    return f.open(QIODevice::ReadOnly) ? QString::fromUtf8(f.readAll()) : QString();
}

QString Backend::fileUrl(const QString &relPath) const
{
    return QUrl::fromLocalFile(m_dir + "/" + relPath).toString();
}

QJsonArray Backend::readComments() const
{
    return readObject(m_dir + "/comments.json").value("comments").toArray();
}

bool Backend::writeComments(const QJsonArray &arr) const
{
    return writeJson(m_dir + "/comments.json", QJsonObject{{"comments", arr}});
}

QString Backend::addComment(const QVariantMap &comment)
{
    if (m_dir.isEmpty()) return {};
    QJsonObject c = QJsonObject::fromVariantMap(comment);
    const QString id = "c" + QString::number(QDateTime::currentMSecsSinceEpoch(), 36) + QString::number(QRandomGenerator::global()->bounded(1296), 36);
    c["id"] = id;
    c["status"] = "open";
    c["author"] = "you";
    c["createdAt"] = QDateTime::currentDateTimeUtc().toString(Qt::ISODate);
    QJsonArray arr = readComments();
    arr.append(c);
    if (!writeComments(arr)) { emit toast("Could not save the comment."); return {}; }
    refresh();
    return id;
}

void Backend::setCommentStatus(const QString &id, const QString &status)
{
    QJsonArray arr = readComments();
    for (int i = 0; i < arr.size(); ++i) {
        QJsonObject o = arr[i].toObject();
        if (o.value("id").toString() == id) { o["status"] = status; arr[i] = o; }
    }
    writeComments(arr);
    refresh();
}

void Backend::updateComment(const QString &id, const QVariantMap &fields)
{
    QJsonArray arr = readComments();
    const QJsonObject patch = QJsonObject::fromVariantMap(fields);
    for (int i = 0; i < arr.size(); ++i) {
        QJsonObject o = arr[i].toObject();
        if (o.value("id").toString() != id) continue;
        for (auto it = patch.begin(); it != patch.end(); ++it) o[it.key()] = it.value();
        arr[i] = o;
    }
    writeComments(arr);
    refresh();
}

void Backend::deleteComment(const QString &id)
{
    QJsonArray arr = readComments(), out;
    for (const auto &v : arr) if (v.toObject().value("id").toString() != id) out.append(v);
    writeComments(out);
    refresh();
}

void Backend::setSceneApproved(const QString &sceneId, bool approved)
{
    QJsonObject sb = readObject(m_dir + "/storyboard.json");
    QJsonArray scenes = sb.value("scenes").toArray();
    for (int i = 0; i < scenes.size(); ++i) {
        QJsonObject s = scenes[i].toObject();
        if (s.value("id").toString() == sceneId) { s["approved"] = approved; scenes[i] = s; }
    }
    sb["scenes"] = scenes;
    writeJson(m_dir + "/storyboard.json", sb);
    refresh();
}

void Backend::approveAll()
{
    QJsonObject sb = readObject(m_dir + "/storyboard.json");
    QJsonArray scenes = sb.value("scenes").toArray();
    for (int i = 0; i < scenes.size(); ++i) { QJsonObject s = scenes[i].toObject(); s["approved"] = true; scenes[i] = s; }
    sb["scenes"] = scenes;
    writeJson(m_dir + "/storyboard.json", sb);
    refresh();
}

QString Backend::fixPrompt() const
{
    return QString("Read the open Swit comments for %1 (swit_list_comments), fix them in the scene code, re-render, and resolve each one.").arg(m_dir);
}

QString Backend::buildPrompt() const
{
    return QString("The storyboard for %1 is approved in Swit. Render the remaining frames if needed, then build the video with swit_render_video.").arg(m_dir);
}

void Backend::copyText(const QString &text)
{
    QGuiApplication::clipboard()->setText(text);
    emit toast("Copied. Paste it to Claude.");
}

void Backend::openExternal(const QString &path)
{
    QDesktopServices::openUrl(QUrl::fromLocalFile(path));
}
