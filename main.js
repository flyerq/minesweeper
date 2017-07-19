const electron = require('electron');
const { app, BrowserWindow } = electron;
const path = require('path');
const url = require('url');

// 主窗体
let mainWindow;

function createWindow () {
  // 屏幕工作区域尺寸
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;

  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width,
    height,
    show: false,
    title: '扫雷',
    maximizable: false,
    resizable: false,
    backgroundColor: '#282c34',
    defaultEncoding: 'UTF-8',
  });

  // 禁用菜单栏
  mainWindow.setMenu(null);
  // 最大化窗口
  mainWindow.maximize();
  // 显示窗口
  mainWindow.show();

  // 加载应用主页面
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true,
  }));

  // 调出开发者工具栏
  // mainWindow.webContents.openDevTools();

  // 主窗口已关闭事件处理
  mainWindow.on('closed', function () {
    // 解除窗口引用
    mainWindow = null;
  });
}

// Electron应用已准备就绪，其所有API此时已可调用
app.on('ready', createWindow);

// 当应用的所有窗口都已关闭时退出应用
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用被激活时，如果不存在主窗体时，创建主窗体
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});