cmake_minimum_required(VERSION 3.21)
project(swit VERSION 0.3.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)

find_package(Qt6 6.5 REQUIRED COMPONENTS Gui GuiPrivate Quick QuickControls2 Multimedia)

qt_add_executable(swit main.cpp backend.cpp backend.h)

set_source_files_properties(Theme.qml Nav.qml Prefs.qml PROPERTIES QT_QML_SINGLETON_TYPE TRUE)

qt_policy(SET QTP0001 NEW)  # embed QML under :/qt/qml so the installed binary finds it

qt_add_qml_module(swit
    URI Swit
    VERSION 1.0
    QML_FILES
        Main.qml Theme.qml Nav.qml Prefs.qml
        Act.qml Btn.qml Chip.qml Glyph.qml Toggle.qml IconButton.qml Key.qml HelpDialog.qml SettingsDialog.qml FrameImage.qml TopBar.qml Composer.qml
        Home.qml Folder.qml Storyboard.qml Player.qml Review.qml
)

qt_add_resources(swit assets PREFIX "/swit" FILES icons/swit.svg CHANGELOG.md)
target_compile_definitions(swit PRIVATE SWIT_VERSION="${PROJECT_VERSION}")

target_link_libraries(swit PRIVATE Qt6::Quick Qt6::QuickControls2 Qt6::Multimedia Qt6::GuiPrivate)

install(TARGETS swit RUNTIME DESTINATION bin)
install(FILES icons/swit.svg DESTINATION share/icons/hicolor/scalable/apps)
install(FILES packaging/swit.desktop DESTINATION share/applications)
