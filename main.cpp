#include "backend.h"

#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QQuickStyle>
#include <QQuickWindow>
#include <QTimer>

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);
    QGuiApplication::setApplicationName("Swit");
    QGuiApplication::setOrganizationName("Swit");
    QQuickStyle::setStyle("Basic");

    Backend backend;
    QQmlApplicationEngine engine;
    engine.rootContext()->setContextProperty("backend", &backend);
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreationFailed, &app, [] { QCoreApplication::exit(-1); }, Qt::QueuedConnection);
    engine.loadFromModule("Swit", "Main");
    // Dev options: SWIT_SIZE="980x620" resizes the window, SWIT_SHOT=/path.png renders the window to a file and quits.
    if (auto *win = qobject_cast<QQuickWindow *>(engine.rootObjects().value(0))) {
        const QString size = backend.env("SWIT_SIZE");
        if (size.contains('x')) {
            win->setMinimumSize({0, 0});
            win->resize(size.section('x', 0, 0).toInt(), size.section('x', 1, 1).toInt());
        }
        const QString shot = backend.env("SWIT_SHOT");
        if (!shot.isEmpty())
            QTimer::singleShot(3500, &app, [win, shot, &app] { win->grabWindow().save(shot); app.quit(); });
    }
    return app.exec();
}
