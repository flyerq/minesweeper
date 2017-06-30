import Phaser from 'phaser';
import Scoreboard from '../sprites/Scoreboard';
import { Icons, delay } from '../utils';
const DPR = window.devicePixelRatio || 1;

export default class GameOver extends Phaser.State {
  init (gameData) {
    this.gameData = gameData;
  }

  preload () {}

  async create () {
    // 显示游戏失败提示文字("You Lose")
    let text = this.game.add.text(0, 0, 'You Lose');
    let  {boardWidth, boardHeight, tileWidth, tileHeight} = this.gameData.gameProps;
    let fontSize = Math.min(boardWidth * tileWidth, boardHeight * tileHeight) * 0.18;
    text.font = 'Black Ops One';
    text.padding.set(30 * DPR, 30 * DPR);
    text.fontSize = fontSize;
    text.fill = '#e74c3c';
    text.smoothed = false;
    text.setShadow(10, 10, 'rgba(0,0,0,0.5)', 30);
    text.anchor.setTo(0.5);
    text.alignIn(this.game.world, Phaser.CENTER, 15 * DPR, 15 * DPR);

    // 播放UI动画与音效
    this.game.add.tween(text).from({alpha: 0}, 1000, 'Linear', true);
    let soundLose = this.game.add.audio('soundLose');
    soundLose.play();
    await delay(this.game, 1000);

    // 创建计分板
    let scoreboard = new Scoreboard(this.game, this.gameData);
  }

  render () {
  }
}