cmake_minimum_required(VERSION 3.21)
project(swit VERSION 0.2.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)

find_package(Qt6 6.5 REQUIRED COMPONENTS Quick QuickControls2 Multimedia)

qt_add_executable(swit main.cpp backend.cpp backend.h)

set_source_files_properties(Theme.qml Nav.qml PROPERTIES QT_QML_SINGLETON_TYPE TRUE)

qt_add_qml_module(swit
    URI Swit
    VERSION 1.0
    QML_FILES
        Main.qml Theme.qml Nav.qml
        Btn.qml Chip.qml FrameImage.qml TopBar.qml Composer.qml
        Home.qml Folder.qml Storyboard.qml Player.qml Review.qml
)

qt_add_resources(swit icons PREFIX "/swit" FILES icons/swit.svg)

target_link_libraries(swit PRIVATE Qt6::Quick Qt6::QuickControls2 Qt6::Multimedia)
