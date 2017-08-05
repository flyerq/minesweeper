const electron = require('electron');
const { app, BrowserWindow, dialog, globalShortcut } = electron;
const path = require('path');
const url = require('url');
const updater = require('./updater');

// 主窗体
let mainWindow;

// 只允许单个实例运行
const makeSingleInstance = () => {
  if (process.mas) {
    return false;
  }

  return app.makeSingleInstance(() => {
    if (mainWindow) {
      mainWindow.isMinimized() && mainWindow.restore();
      // mainWindow.setAlwaysOnTop(true);
      // mainWindow.setAlwaysOnTop(false);
      mainWindow.focus();
    }
  });
};

const shouldQuit = makeSingleInstance();
if (shouldQuit) {
  app.quit();
  return;
}

// 创建主窗体
const createWindow = () => {
  // 屏幕工作区域尺寸
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;

  // 创建主窗体
  mainWindow = new BrowserWindow({
    width,
    height,
    show: false,
    title: '扫雷',
    maximizable: false,
    resizable: false,
    backgroundColor: '#282c34',
    defaultEncoding: 'UTF-8',
    webPreferences: {
      // 取消窗口后台运行后的网页动画与定时器节流功能
      backgroundThrottling: false
    }
  });

  // 禁用菜单栏
  mainWindow.setMenu(null);
  // 最大化窗口
  mainWindow.maximize();

  // 加载应用主页面
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true,
  }));

  // 窗口准备就绪
  mainWindow.once('ready-to-show', () => {
    // 显示窗口
    mainWindow.show();
  });

  // 主窗口关闭事件处理
  mainWindow.on('close', () => {
    // 退出更新程序
    updater.close();
  });

  // 主窗口已关闭事件处理
  mainWindow.on('closed', () => {
    // 解除窗口引用
    mainWindow = null;
  });

  // 按快捷键"Ctrl+Alt+Shift+F5"重新加载页面
  globalShortcut.register('CmdOrCtrl+Alt+Shift+F5', () => {
    mainWindow.isFocused() && mainWindow.reload();
  });

  // 按快捷键"Ctrl+Alt+Shift+F12"打开开发者工具窗口
  globalShortcut.register('CmdOrCtrl+Alt+Shift+F12', () => {
    mainWindow.isFocused() && mainWindow.webContents.openDevTools();
  });
};

// Electron应用已准备就绪，其所有API此时已可调用
app.on('ready', createWindow);

// 当应用的所有窗口都已关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用被激活时，如果不存在主窗体时，创建主窗体
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// 初始化自动更新模块
app.on('ready', () => {
  mainWindow.webContents.on('did-finish-load', () => {
    updater.init(app, mainWindow);
  });
});
