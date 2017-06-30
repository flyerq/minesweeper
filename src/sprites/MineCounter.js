import Phaser from 'phaser';
import config from '../config';
import { Icons } from '../utils';
const {
  mineIconSize,
  mineIconColor,
  defaultTextStyle,
  iconMargin,
} = config;

export default class MineCounter {
  constructor (game, board, group, key = 'mine') {
    this.game = game;
    this.board = board;

    // 剩余地雷计数器
    this.leftMineCounter = board.mines;

    // 创建剩余地雷计数器UI图标
    let iconStyle = {font: `normal ${mineIconSize}px minesweeper`, fill: mineIconColor};
    this.icon = game.add.text(0, 0, Icons.mine, iconStyle, group);
    // 创建剩余地雷计数器UI文本
    this.text = game.add.text(0, 0, this.leftMineCounter, config.defaultTextStyle, group);

    this.text.alignTo(this.icon, Phaser.RIGHT_CENTER, iconMargin);
    this.icon.setShadow(0, -3, 'rgba(0,0,0,0.5)', 3);
    this.text.setShadow(0, -3, 'rgba(0,0,0,0.5)', 3);


    // 监听游戏面板中的旗帜方块(被标记为地雷方块)的数目变更事件
    this.board.onFlaggedChanged.add(this.handleFlaggedChanged, this);
  }

  // 将计数器UI对齐到指定显示对象
  alignTo (displayObject, pos = Phaser.RIGHT_CENTER) {
    this.icon.alignTo(displayObject, pos, iconMargin * 2);
    this.text.alignTo(this.icon, Phaser.RIGHT_CENTER, iconMargin);
  }

  // 更新剩余地雷计数器UI
  update () {
    // 立即更新剩余地雷计数器UI文本
    this.text.setText(this.leftMineCounter, true);
  }

  // 游戏面板中的旗帜方块(被标记为地雷方块)的数目发生变更的事件处理器
  handleFlaggedChanged (count) {
    // 更新剩余地雷计数器
    this.leftMineCounter = this.board.mines - count;
    this.update();
  }
}