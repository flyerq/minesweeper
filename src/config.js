const DPR = window.devicePixelRatio || 1;
export default {
  gameBgColor: '#282c34',
  localStorageName: 'minesweeper',

  // 默认游戏面板属性
  tileWidth: 64,
  tileHeight: 64,
  boardWidth: 9,
  boardHeight: 9,
  mineTotal: 10,

  // 计时器与地雷计数器图标尺寸与颜色
  timerIconSize: Math.min(48 * DPR, 128),
  mineIconSize: Math.min(48 * DPR, 128),
  timerIconColor: '#0e89b6',
  mineIconColor: '#0e89b6',
  iconMargin: Math.min(16 * DPR, 40),

  // 默认文本样式
  defaultTextStyle: {
    font: 'normal 32px PingFang SC,Helvetica Neue,Helvetica,Microsoft Yahei,Arial,Hiragino Sans GB,sans-serif',
    fontSize: Math.min(32 * DPR, 80),
    fill: '#ffffff',
    boundsAlignV: 'middle',
  }
}
