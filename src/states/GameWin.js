import Phaser from 'phaser';
import Scoreboard from '../sprites/Scoreboard';
import { Icons, delay } from '../utils';
const DPR = window.devicePixelRatio || 1;

export default class GameWin extends Phaser.State {
  init (gameData) {
    this.gameData = gameData;
  }

  async create () {
    // 显示游戏胜利提示文字("You Win")
    let text = this.game.add.text(0, 0, 'You Win');
    let  {boardWidth, boardHeight, tileWidth, tileHeight} = this.gameData.gameProps;
    let fontSize = Math.min(boardWidth * tileWidth, boardHeight * tileHeight) * 0.18;
    text.font = 'Black Ops One';
    text.padding.set(30 * DPR, 30 * DPR);
    text.fontSize = fontSize;
    text.fill = '#f1c40f';
    text.smoothed = false;
    text.setShadow(10, 10, 'rgba(0,0,0,0.5)', 30);
    text.anchor.setTo(0.5);
    text.alignIn(this.game.world, Phaser.CENTER, 15 * DPR, 15 * DPR);

    // 播放UI动画与音效
    this.game.add.tween(text).from({rotation: -Math.PI * 2, alpha: 0}, 800, 'Power4', true);
    let soundWin = this.game.add.audio('soundWin');
    soundWin.play();
    await delay(this.game, 800);

    // 创建计分板
    let scoreboard = new Scoreboard(this.game, this.gameData);
  }
}