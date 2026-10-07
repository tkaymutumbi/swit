#include "backend.h"

#ifndef SWIT_VERSION
#define SWIT_VERSION "0.0.0"
#endif

#include <QGuiApplication>
#include <QIcon>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QQuickStyle>
#include <QQuickWindow>
#include <QTimer>
#include <QtGui/qpa/qwindowsysteminterface.h>

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);
    QGuiApplication::setApplicationName("Swit");
    QGuiApplication::setApplicationVersion(QStringLiteral(SWIT_VERSION));
    QGuiApplication::setOrganizationName("Swit");
    QGuiApplication::setDesktopFileName("swit");
    QGuiApplication::setWindowIcon(QIcon(":/swit/icons/swit.svg"));
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
        // Dev option: SWIT_KEYS="i,t,Space" sends real key events (through the shortcut system) 0.6s apart after start.
        const QStringList keys = backend.env("SWIT_KEYS").split(',', Qt::SkipEmptyParts);
        win->requestActivate();
        for (int i = 0; i < keys.size(); ++i) {
            QString k = keys[i];
            const bool raw = k.startsWith('~');   // "~i": deliver straight to the window, skipping shortcut matching
            if (raw) k = k.mid(1);
            QTimer::singleShot(2500 + i * 600, &app, [win, k, raw] {
                int key = 0; QString text;
                if (k == "Space") { key = Qt::Key_Space; text = " "; }
                else if (k == "Left") key = Qt::Key_Left;
                else if (k == "Right") key = Qt::Key_Right;
                else if (k == "Up") key = Qt::Key_Up;
                else if (k == "Down") key = Qt::Key_Down;
                else if (k == "?") { key = Qt::Key_Question; text = "?"; }
                else if (k.size() == 1) { key = k[0].toUpper().unicode(); text = k.toLower(); }
                if (raw) {
                    QKeyEvent press(QEvent::KeyPress, key, Qt::NoModifier, text), release(QEvent::KeyRelease, key, Qt::NoModifier, text);
                    QCoreApplication::sendEvent(win, &press);
                    QCoreApplication::sendEvent(win, &release);
                    return;
                }
                QWindowSystemInterface::handleKeyEvent<QWindowSystemInterface::SynchronousDelivery>(win, QEvent::KeyPress, key, Qt::NoModifier, text);
                QWindowSystemInterface::handleKeyEvent<QWindowSystemInterface::SynchronousDelivery>(win, QEvent::KeyRelease, key, Qt::NoModifier, text);
            });
        }
        const QString shot = backend.env("SWIT_SHOT");
        if (!shot.isEmpty())
            QTimer::singleShot(3500 + keys.size() * 600, &app, [win, shot, &app] { win->grabWindow().save(shot); app.quit(); });
    }
    return app.exec();
}
