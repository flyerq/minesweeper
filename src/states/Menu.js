import Phaser from 'phaser';
import config from '../config';
import Button from '../sprites/Button';
import { Icons } from '../utils';
const DPR = window.devicePixelRatio || 1;

export default class Menu extends Phaser.State {
  init (y) {
    this.loadingY = y;
  }

  create () {
    let gametWidth = this.game.width;
    let gameHeight = this.game.height;
    let colsWidth = gametWidth - 20 * DPR;
    let rowsHeight = gameHeight / 6;
    let buttonHeight = rowsHeight - 20 * DPR;
    let buttonWidth = buttonHeight * 5;

    // 手机屏幕或窄屏幕尺寸自适应
    if ( gameHeight > gametWidth ) {
      buttonWidth = colsWidth;
      buttonHeight = Math.min(buttonWidth * 0.2, rowsHeight - 20 * DPR);
    }

    // 创建图标与标题文本
    let group = this.game.add.group();
    let fontStyle = {...config.defaultTextStyle, fontSize: rowsHeight * 0.4, font: 'Black Ops One', fill: '#bbb'};
    let iconStyle = {...this.fontStyle, fontSize: rowsHeight, font: 'minesweeper', fill: '#0e89b6'};
    let icon = this.game.add.text(game.world.centerX, game.world.centerY, Icons.mine, iconStyle, group);
    let text = this.game.add.text(game.world.centerX, game.world.centerY, 'MINESWEEPER', fontStyle, group);
    text.smoothed = false;
    icon.anchor.setTo(0.5);
    text.anchor.setTo(0.5);
    icon.setShadow(0, -3, 'rgba(0,0,0,0.5)', 3);
    text.setShadow(0, -3, 'rgba(0,0,0,0.5)', 3);

    // 创建菜单按钮
    let buttonProps = {
      game: this.game,
      group: group,
      x: 0,
      y: 0,
      width: buttonWidth,
      height: buttonHeight,
      icon: Icons.happy,
      text: '简单 9x9',
      style: 'action'
    }

    // 简单难度按钮
    let easyButton = new Button(buttonProps);
    easyButton.onClick.add(rightClick => {
      this.state.start('Game', true, false, {...config, boardWidth: 9, boardHeight: 9, mineTotal: 10});
    }, this);

    // 中等难度按钮
    let mediumButtom = new Button({
      ...buttonProps,
      icon: Icons.cool,
      text: '中等 16x16',
      style: 'warning'
    });
    mediumButtom.onClick.add(rightClick => {
      this.state.start('Game', true, false, {...config, boardWidth: 16, boardHeight: 16, mineTotal: 40});
    }, this);

    // 专家难度按钮
    let expertButton = new Button({
      ...buttonProps,
      icon: Icons.expert,
      text: '专家 30x16',
      style: 'danger'
    });
    expertButton.onClick.add(rightClick => {
      this.state.start('Game', true, false, {...config, boardWidth: 30, boardHeight: 16, mineTotal: 99});
    }, this);

    // 布局UI
    group.align(1, -1, colsWidth, rowsHeight, Phaser.CENTER);
    group.x = this.game.world.centerX - group.centerX;
    group.y = this.game.world.centerY - group.centerY;

    // UI动画
    let iconFromY = this.loadingY || - rowsHeight;
    this.game.add.tween(icon).from({y: iconFromY - group.y}, 1000, 'Expo.easeInOut', true);
    this.game.add.tween(text).from({x: -buttonWidth, alpha: 0}, 1000, 'Expo.easeInOut', true, 100);
    this.game.add.tween(easyButton.button).from({x: -buttonWidth, alpha: 0}, 1000, 'Expo.easeInOut', true, 200);
    this.game.add.tween(mediumButtom.button).from({x: -buttonWidth, alpha: 0}, 1000, 'Expo.easeInOut', true, 300);
    this.game.add.tween(expertButton.button).from({x: -buttonWidth, alpha: 0}, 1000, 'Expo.easeInOut', true, 400);
  }
}