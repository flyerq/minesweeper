import Phaser from 'phaser';
import config from '../config';
import { Icons } from '../utils';
const {
  timerIconSize,
  timerIconColor,
  defaultTextStyle,
  iconMargin,
} = config;

export default class Timer {
  constructor (game, board, group, key = 'timer') {
    this.game = game;
    this.board = board;

    // 耗时(秒)
    this.time = 0;
    // 耗时文本(分:秒)
    this.timeText = this.getTimeText();
    // 起始时间
    this.startTime = 0;

    // 创建定时器对象
    this.timer = game.time.create(true);
    this.timer.loop(1000, this.update, this);

    // 创建计时器图标
    let iconStyle = {font: `normal ${timerIconSize}px minesweeper`, fill: timerIconColor};
    this.icon = game.add.text(0, 0, Icons.timer, iconStyle, group);
    // 创建计时器图标文本
    this.text = game.add.text(0, 0, this.timeText, defaultTextStyle, group);

    this.text.alignTo(this.icon, Phaser.RIGHT_CENTER, iconMargin);
    this.icon.setShadow(0, -3, 'rgba(0,0,0,0.5)', 3);
    this.text.setShadow(0, -3, 'rgba(0,0,0,0.5)', 3);

    // 监听游戏开始与结束事件
    this.board.onGameStarted.add(this.start, this);
    this.board.onGameEnded.add(this.stop, this);
  }

  // 开始计时
  start () {
    this.startTime = Math.floor(Date.now() / 1000);
    this.timer.start();
  }

  // 停止计时
  stop () {
    this.timer.stop();
  }

  // 更新计时器
  update () {
    this.time = Math.floor(Date.now() / 1000 - this.startTime);
    this.timeText = this.getTimeText();
    this.text.setText(this.timeText, true);
  }

  // 获取指定长度的耗时文本，最小长度为5
  getTimeText(maxLength = 5) {
    // 最小长度为5(00:00)
    maxLength = maxLength < 5 ? 5 : maxLength;
    let seconds = this.time % 60;
    let minutes = Math.floor(this.time / 60);
    let secondsText = seconds.toString().padStart(2, '0');
    let minutesText = minutes.toString();
    let minutesLength = maxLength - 3;

    // 如果分钟超过指定长度时显示为指定长度的"9"
    // 否则原样显示，长度不足时以"0"填充
    if (minutesText.length > minutesLength) {
      minutesText = '9'.repeat(minutesLength);
    } else {
      minutesText = minutesText.padStart(minutesLength, '0');
    }

    return minutesText + ':' + secondsText;
  }

  // 将计时器UI对齐到指定显示对象
  alignTo (displayObject, pos = Phaser.RIGHT_CENTER) {
    this.icon.alignTo(displayObject, pos, iconMargin * 2);
    this.text.alignTo(this.icon, Phaser.RIGHT_CENTER, iconMargin);
  }
}