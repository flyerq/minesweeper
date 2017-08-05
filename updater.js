const electron = require('electron');
const { BrowserWindow, dialog } = electron;
const path = require('path');
const url = require('url');
const { autoUpdater } = require('electron-updater');

// 应用实例
let app;

// 主窗体
let mainWindow;

// 自动更新界面窗体
let updaterWindow;

// 用户已确认更新标记
let updateApproved = false;

// 禁用自动下载更新
autoUpdater.autoDownload = false;

// 更新消息
const updaterMessages = {
  error: '更新时发生错误',
  errorTitle: '更新提示',
  errorUnknown: '发生未知错误',
  errorDownloading: '下载更新时出错，请稍后再试！',
  checking: '正在检查更新...',
  available: '发现新的版本可以更新，是否现在更新？',
  availableTitle: '更新提示',
  updateYes: '立即更新',
  updateNo: '暂不更新',
  downloaded: '更新已下载完成，即将退出游戏并安装更新',
  downloadedTitle: '更新提示',
  unavailable: '当前已是最新版本',
  unavailableTitle: '更新提示',
  okButton: '知道了',
  installButton: '立即安装',
};

// 初始化
const init = (theApp, theMainWindow) => {
  app = theApp;
  mainWindow = theMainWindow;

  // 检查更新
  autoUpdater.checkForUpdates();
};

// 显示更新进度条对话框
const showProgressDialog = () => {
  if (updaterWindow) {
    updaterWindow.show();
    return;
  }

  let pRect = mainWindow.getContentBounds();
  let w = parseInt(pRect.width * 0.618);
  let h = 80;

  // 创建自动更新界面窗体
  updaterWindow = new BrowserWindow({
    width: w,
    height: h,
    show: false,
    frame: false,
    resizable: false,
    closable: false,
    transparent: true,
    backgroundColor: '#00000000',
    defaultEncoding: 'UTF-8',
    webPreferences: {
      // 取消窗口后台运行后的网页动画与定时器节流功能
      backgroundThrottling: false
    }
  });

  // 加载应用主页面
  updaterWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'updater.html'),
    protocol: 'file:',
    slashes: true,
  }));

  // 窗口准备就绪
  updaterWindow.once('ready-to-show', () => {
    // 显示更新窗口
    updaterWindow.show();
  });

  // 禁止用户手动关闭更新窗口
  updaterWindow.on('close', (e) => {
    e.preventDefault();
  });

  // 主窗口已关闭事件处理
  updaterWindow.on('closed', () => {
    // 解除窗口引用
    updaterWindow = null;
  });
};

// 设置更新进度条对话框
const setProgressDialog = (percent) => {
  if (!updaterWindow || updaterWindow.isDestroyed()) {
    return;
  }

  percent = Math.round(percent);
  percent = Math.max(0, Math.min(100, percent));
  updaterWindow.webContents.send('progress', percent);
};

// 关闭更新进度条对话框
const closeProgressDialog = () => {
  // 关闭更新窗口
  updaterWindow && updaterWindow.destroy();
};

// 更新时发生错误
autoUpdater.on('error', (err, msg) => {
  // 如果用户未批准更新直接返回
  if (!updateApproved) {
    return;
  }

  // 关闭更新进度条对话框
  closeProgressDialog();
  // 显示错误消息框
  dialog.showMessageBox(mainWindow, {
    type: 'error',
    title: updaterMessages.errorTitle,
    message: err === null ? updaterMessages.errorUnknown : updaterMessages.errorDownloading,
  });
});

// // 正在检查更新
// autoUpdater.on('checking-for-update', () => {
// });

// 发现可用更新
autoUpdater.on('update-available', (info) => {
  let date = new Date(info.releaseDate).toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '');
  
  let detailText =
    `当前版本：${app.getVersion()}\n` +
    `最新版本：${info.version}\n` +
    `发布日期：${date}\n\n` +
    `${info.releaseNotes}`;

  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: updaterMessages.availableTitle,
    message: updaterMessages.available,
    detail: detailText,
    buttons: [updaterMessages.updateYes, updaterMessages.updateNo],
    cancelId: 1
  }, (buttonIndex) => {
    // 用户同意更新
    if (buttonIndex === 0) {
      updateApproved = true;

      // 显示更新进度条对话框并开始下载更新
      showProgressDialog();
      autoUpdater.downloadUpdate();
    }
  });
});

// 未发现可用更新
// autoUpdater.on('update-not-available', (info) => {
//   dialog.showMessageBox(mainWindow, {
//     type: 'info',
//     title: updaterMessages.unavailableTitle,
//     message: updaterMessages.unavailable,
//     buttons: [updaterMessages.okButton],
//   });
// });

// 更新下载进度
autoUpdater.on('download-progress', (progress) => {
  if (!updaterWindow || updaterWindow.isDestroyed() ||
      !mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  // 设置任务栏下载进度条
  mainWindow.setProgressBar(progress.percent / 100);
  updaterWindow.setProgressBar(progress.percent / 100);

  // 设置更新窗口进度条
  setProgressDialog(progress.percent);
});

// 更新下载完成
autoUpdater.on('update-downloaded', (info) => {
  // 关闭更新进度条对话框
  closeProgressDialog();

  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: updaterMessages.downloadedTitle,
    message: updaterMessages.downloaded,
    buttons: [updaterMessages.installButton],
  }, () => {
    setImmediate(() => {
      // 退出并安装更新
      autoUpdater.quitAndInstall();
    });
  });
});

module.exports.init = init;
module.exports.close = closeProgressDialog;
