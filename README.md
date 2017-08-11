<img src="./screenshot.jpg" alt="屏幕截图" width="100%" />

# Minesweeper - 扫雷

一款跨平台跨终端的扫雷游戏

## 项目说明

这款扫雷游戏是我对[Phaser][], [Electron][], [PWA][]等相关技术的一次实践与总结。此项目具有如下特点：

  * **跨平台** - 以Web前端技术（HTML5 + CSS + JavaScript）为核心，能运行在任何操作系统之上。

  * **响应式** - 游戏使用了响应式的布局模式 + 矢量图形资源 + 动态生成图形资源（Canvas）+ **DPI**自适应的方式实现了游戏分辨率的自适应，理论上能在任何容器尺寸（屏幕尺寸），分辨率，**DPI**上完美呈现。

  * **可缩放** - 游戏在响应式的基础之上同时还支持**DPI**自适应模式的用户缩放功能（使用鼠标滚轮或双指捏合缩放），进一步优化了在小尺寸屏幕设备上的操作体验。

  * **跨终端** - 游戏同时支持鼠标，触摸手势，手写笔多种交互模式，所以理论上能在任何桌面端，移动端，智能电视等设备上运行。

  * **多客户端** - 由于游戏具有上面列出的几种特性，所以游戏除了可以运行在浏览器端以外，还可以通过各种Web客户端技术（其实大多数还是基于浏览器）来创建多种客户端，例如，用[Electron][]或[NW.js][]创建桌面版客户端，用[Cordova][]或[React Native][]创建移动版客户端。此项目目前使用了[Electron][]技术来生成桌面版客户端。

  * **自动更新** - 浏览器端的自动更新自不必说，这是B/S架构的天然优势，与此同时[Electron][]桌面版客户端也实现了自动更新的功能。

  * **离线运行** - 桌面版客户端的离线运行能力自不必说，与此同时还使用了[PWA][]技术使游戏也能在浏览器环境下离线运行，当然，这是一项比较新的技术，目前为止只有部分较新版本的浏览器支持。

### 主要技术栈：

  - **Phaser** [(Game Engine)][Phaser]
  - **Canvas**
  - **Electron**
  - **Node.js**
  - **ES6 + ES7**
  - **Webpack**
  - **PWA** [(Progressive Web Apps)][PWA]

## 浏览器支持

  - **Internet Explorer** >= **9**
  - **Edge** >= **12**
  - **Chrome** >= **4**
  - **Firefox** >= **4**
  - **Safari** >= **4**
  - **Opera** >= **10.1**
  - **iOS Safari** >= **3.2**
  - **Android Browser** >= **3**
  - **Internet Explorer Mobile** >= **10**

## 相关链接

[网页版线上地址](https://app.flyerq.com/minesweeper/ "网页版扫雷")（推荐使用最新版的[Chrome][]浏览器访问）

[网页版备用地址](https://flyerq.github.io/minesweeper/ "网页版扫雷 - Github Pages")（部署在**Github Pages**上，国内用户访问速度可能会比较缓慢）

[Windows桌面版客户端安装包下载地址](https://app.flyerq.com/minesweeper/download/minesweeper-1.0.0-win-setup.exe "Windows客户端版扫雷")

[Windows桌面版客户端免安装版下载地址](https://app.flyerq.com/minesweeper/download/minesweeper-1.0.0-win.zip "Windows客户端版扫雷")（压缩包，无需安装，解压缩后运行**minesweeper.exe**即可）

[备用下载地址](https://github.com/flyerq/minesweeper/releases/latest "Github Releases下载地址")（**Github Releases**下载地址，国内用户会可能无法下载）

## 待办事项

  - [ ] 优化游戏面板缩放功能
  - [ ] 增加游戏操作教学UI
  - [ ] 增加游戏设置面板
  - [ ] 发布移动版客户端
  - [ ] 支持游戏尺寸动态响应式（Resizing Responsive）

## 已知问题

  - 部分旧版浏览器上存在游戏图形资源被部分裁切（显示不完整）问题，属于当前**Phaser**引擎**PIXI**模块渲染Web Font上的一个Bug。

  - 部分触摸设备在多点触摸操作时可能出现程序卡死，停止响应，尚未明确重现条件。



<!-- 相关链接 -->
[Phaser]: http://phaser.io/ "Phaser"
[Electron]: https://electron.atom.io/ "Electron"
[NW.js]: https://nwjs.io/ "NW.js"
[Cordova]: https://cordova.apache.org/ "Cordova"
[React Native]: http://facebook.github.io/react-native/ "React Native"
[PWA]: https://developers.google.com/web/progressive-web-apps/ "Progressive Web Apps"
[Chrome]: https://www.google.com/chrome "Chrome浏览器"