import Phaser from 'phaser';
import config from '../config';
import Button from './Button';
import { Icons, creatAlphaRoundedRectAsset } from '../utils';
const DPR = window.devicePixelRatio || 1;

export default class Scoreboard {
  constructor (game, gameData) {
    this.game = game;
    this.gameData = gameData;
    
    // 尺寸自适应
    let w = Math.min(this.game.width - 20 * DPR, 900);
    let rowsHeight = this.game.height / 9;
    let h = rowsHeight * 7;
    if ( this.game.height > this.game.width) {
      w = this.game.width - 20 * DPR;
    }
    this.width = w;
    this.height = h;

    // 创建计分板
    this.scoreboard = this.game.add.sprite(
      this.game.world.centerX - w / 2,
      this.game.world.centerY - h / 2,
      creatAlphaRoundedRectAsset(this.game, 'scoreboard', w, h)
    );

    // 创建与布局UI元素
    let fontStyle = {...config.defaultTextStyle, fontSize: rowsHeight * 0.4, fill: '#ddd'};
    let iconStyle = {...fontStyle, fontSize: rowsHeight * 1.2, font: 'minesweeper', fill: '#0e89b6'};
    let icon = this.game.add.text(w / 2, rowsHeight * 1.25, this.gameData.isGameWin ? Icons.wink : Icons.confused, iconStyle);
    let timeLabel = this.game.add.text(40 * DPR, rowsHeight * 2.5, '游戏用时', fontStyle);
    let timeText = this.game.add.text(w - 40 * DPR, rowsHeight * 2.5, this.gameData.currentTime, fontStyle);
    let bestLabel = this.game.add.text(40 * DPR, rowsHeight * 3.5, '最佳记录', fontStyle);
    let bestText = this.game.add.text(w - 40 * DPR, rowsHeight * 3.5, this.gameData.bestTime, fontStyle);
    icon.setShadow(0, -3, 'rgba(0,0,0, 0.8)', 3);
    icon.anchor.setTo(0.5);
    timeLabel.anchor.setTo(0, 0.5);
    timeText.anchor.setTo(1, 0.5);
    bestLabel.anchor.setTo(0, 0.5);
    bestText.anchor.setTo(1, 0.5);
    this.scoreboard.addChild(icon);
    this.scoreboard.addChild(timeLabel);
    this.scoreboard.addChild(timeText);
    this.scoreboard.addChild(bestLabel);
    this.scoreboard.addChild(bestText);

    // 创建菜单按钮
    let buttonGroup = this.game.add.group();
    let buttonWidth = w * 0.3;
    let buttonHeight = buttonWidth * 0.37;
    let buttonProps = {
      game: this.game,
      group: buttonGroup,
      x: w / 2 - buttonWidth - 10 * DPR,
      y: h - buttonHeight - 40 * DPR,
      width: buttonWidth,
      height: buttonHeight,
      icon: Icons.replay,
      text: '再来一局',
      style: 'primaryMini'
    };

    // 再来一局按钮
    let replayButton = new Button(buttonProps);
    replayButton.onClick.add(this.replay, this);

    // 返回菜单按钮
    let menuButton = new Button({
      ...buttonProps,
      x: w / 2 + 10 * DPR,
      icon: Icons.menu,
      text: '返回菜单',
      style: 'actionMini'
    });
    menuButton.onClick.add(this.backMenu, this);

    // 关闭按钮
    let closeButton = new Button({
      ...buttonProps,
      x: w - 32 * DPR - 30 * DPR,
      y: 30 * DPR,
      width: 32 * DPR,
      height: 32 * DPR,
      icon: Icons.close,
      text: '',
      style: 'circleDanger'
    });
    closeButton.onClick.add(this.hide, this);

    this.scoreboard.addChild(replayButton.button);
    this.scoreboard.addChild(menuButton.button);
    this.scoreboard.addChild(closeButton.button);

    // 显示动画
    this.tweenShow = this.game.add.tween(this.scoreboard);
    this.tweenShow.from({y: -this.height, alpha: 0}, 600, 'Expo.easeInOut', true);

    // 隐藏动画
    this.tweenHide = this.game.add.tween(this.scoreboard);
    this.tweenHide.onComplete.addOnce(() => this.scoreboard.destroy(), this);
    this.tweenHide.to({y: -this.height, alpha: 0}, 400, 'Expo.easeOut', false);
  }

  // 隐藏计分板
  hide () {
    this.tweenHide.start();
  }

  // 再来一局
  replay () {
    this.game.state.start('Game', true, false, this.gameData.gameProps);
  }

  // 返回菜单
  backMenu () {
    this.game.state.start('Menu');
  }
}