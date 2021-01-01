/* 引入模块 */
import path from "path"

/* 引用对象 */
import { app, BrowserWindow, ipcMain } from "electron"

/* 定义变量 */
// 对应用视窗的引用
let mainWindow: any = null

// 判断命令行参数是否含 `--debug`
// const debug = /--debug/.test(process.argv[2]);

// 创建视窗
const createWindow = function () {
    /* 创建应用窗口（并赋值给 mainWindow 变量） */
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true, // 应用 Node.js
            // preload: path.join(__dirname, 'preload.js'),
        },
    })

    /**
     * 载入 index.html 文件，此处 loadURL 分为两种情况：
     *  1.开发环境，指向 react 的开发环境地址
     *  2.生产环境，指向 react build 后的 index.html
     */
    const startUrl =
        process.env.NODE_ENV === "production"
            ? path.join(__dirname, "/public/index.html")
            : "http://localhost:3000/window.html"
    mainWindow.loadURL(startUrl)
    // mainWindow.loadURL("http://localhost:3000/");
    // mainWindow.loadURL(path.join('file://', __dirname, '/public/index.html'));

    /* 接收渲染进程信息 */
    ipcMain.on("min", function () {
        mainWindow.minimize()
    })
    ipcMain.on("max", function () {
        mainWindow.maximize()
    })

    /* 打开开发者工具 */
    mainWindow.webContents.openDevTools()
    // 如果命令行包含 `--debug` 参数则打开第三方开发者工具
    // if (debug) {
    //    require('devtron').install();
    // }

    /* 监听主窗口关闭事件 */
    mainWindow.on("closed", () => {
        // 当应用被关闭的时候，释放 mainWindow变量的引用
        mainWindow = null
    })
}

/* 调用主进程事件和方法 */

// 确保视窗只被实例化一次
// app.requestSingleInstanceLock();
// app.on('second-instance', () => {
//     if (mainWindow) {
//         if (mainWindow.isMinimized())
//             mainWindow.restore();
//         mainWindow.focus();
//     }
// });

/* app 主进程事件和方法 */

// 监听应用就绪事件
app.on("ready", () => {
    // 创建窗口并将index.html 载入应用视窗中
    createWindow()
})

// 监听所有视窗关闭事件
app.on("window-all-closed", () => {
    // 在 darwin(mac os) 上，除非用户用 Cmd + Q 确定地退出，否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== "darwin") {
        app.quit()
    }
})

// 监听应用激活事件
app.on("activate", () => {
    // 在macOS上，当单击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

/* 导入拆分文件 */
// 可以拆分成几个文件，然后用 require 导入。
