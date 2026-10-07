#pragma once

#include <QDateTime>
#include <QJsonArray>
#include <QJsonObject>
#include <QObject>
#include <QTimer>
#include <QVariantList>
#include <QVariantMap>

// Reads Swit project folders (storyboard.json, comments.json, scenes/, frames/, video.mp4)
// and writes back review state (comments, approvals). Rendering is done by the MCP server.
class Backend : public QObject
{
    Q_OBJECT
    Q_PROPERTY(QString videosRoot READ videosRoot CONSTANT)
    Q_PROPERTY(QVariantList projects READ projects NOTIFY projectsChanged)
    Q_PROPERTY(QVariantMap project READ project NOTIFY projectChanged)
    Q_PROPERTY(QVariantList comments READ comments NOTIFY projectChanged)
    Q_PROPERTY(int openCommentTotal READ openCommentTotal NOTIFY projectsChanged)

public:
    explicit Backend(QObject *parent = nullptr);

    QString videosRoot() const { return m_root; }
    QVariantList projects() const { return m_projects; }
    QVariantMap project() const { return m_project; }
    QVariantList comments() const { return m_comments; }
    int openCommentTotal() const;

    Q_INVOKABLE void refresh();
    Q_INVOKABLE void openProject(const QString &dir);
    Q_INVOKABLE void closeProject();
    Q_INVOKABLE void addFolder(const QString &urlOrPath);
    Q_INVOKABLE QVariantList files() const;
    Q_INVOKABLE QString readText(const QString &relPath) const;
    Q_INVOKABLE QString addComment(const QVariantMap &comment);
    Q_INVOKABLE void setCommentStatus(const QString &id, const QString &status);
    Q_INVOKABLE void deleteComment(const QString &id);
    Q_INVOKABLE void updateComment(const QString &id, const QVariantMap &fields);
    Q_INVOKABLE void approveAll();
    Q_INVOKABLE void setSceneApproved(const QString &sceneId, bool approved);
    Q_INVOKABLE QString fixPrompt() const;
    Q_INVOKABLE QString buildPrompt() const;
    Q_INVOKABLE void copyText(const QString &text);
    Q_INVOKABLE void openExternal(const QString &path);
    Q_INVOKABLE QString env(const QString &name) const { return qEnvironmentVariable(name.toUtf8().constData()); }
    Q_INVOKABLE QString fileUrl(const QString &relPath) const;

signals:
    void projectsChanged();
    void projectChanged();
    void toast(const QString &message);

private:
    QVariantMap loadProject(const QString &dir, QVariantList *commentsOut) const;
    QStringList registered() const;
    void saveRegistry(const QStringList &dirs) const;
    QString signature() const;
    bool writeComments(const QJsonArray &arr) const;
    QJsonArray readComments() const;

    QString m_root;
    QString m_dir;
    QVariantList m_projects;
    QVariantMap m_project;
    QVariantList m_comments;
    QString m_sig;
    QTimer m_poll;
};
