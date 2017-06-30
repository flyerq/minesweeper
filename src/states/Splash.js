import Phaser from 'phaser';
import Tile from '../sprites/Tile';
import Board from '../sprites/Board';
import { delay, Icons, centerGameObjects } from '../utils';
import config from '../config';
const { tileWidth, tileHeight } = config;

export default class Splash extends Phaser.State {
  preload () {
    let rowsHeight = this.game.height / 6;
    let iconStyle = {fontSize: rowsHeight, font: 'minesweeper', fill: '#0e89b6'};
    this.progressText = this.game.add.text(game.world.centerX, game.world.centerY, '0%', config.defaultTextStyle);
    this.progressText.anchor.set(0.5);
    this.loading = this.game.add.text(0, 0, Icons.mine, iconStyle);
    this.loading.anchor.set(0.5);
    this.loading.setShadow(0, -3, 'rgba(0,0,0,0.5)', 3);
    this.loading.alignTo(this.progressText, Phaser.TOP_CENTER, 0, 10 * window.devicePixelRatio);
  
    this.load.onFileComplete.add(progress => {
      this.progressText.setText(progress + '%');
    });

    // 加载资源
    this.load.spritesheet('explosion', 'assets/images/explosion.png', 256, 256);
    this.load.audio('soundInit', 'assets/sounds/init.mp3');
    this.load.audio('soundReveal', 'assets/sounds/reveal.mp3');
    this.load.audio('soundMark', 'assets/sounds/mark.mp3');
    this.load.audio('soundEmpty', 'assets/sounds/empty.mp3');
    this.load.audio('soundWin', 'assets/sounds/win.mp3');
    this.load.audio('soundLose', 'assets/sounds/lose.mp3');
    this.load.audio('soundExplosion', 'assets/sounds/explosion.mp3');

    // 加载动态生成的方块图像资源
    // const tileSize = Math.max(this.game.width / 9, this.game.height / 9);
    // const tileAssets = Tile.generateTileAssets(tileSize, tileSize);
    // this.load.imageFromBitmapData(Tile.assets.cover, tileAssets.cover);
    // this.load.imageFromBitmapData(Tile.assets.coverDown, tileAssets.coverDown);
    // this.load.imageFromBitmapData(Tile.assets.ground, tileAssets.ground);
    // this.load.imageFromBitmapData(Tile.assets.flag, tileAssets.flag);
    // this.load.imageFromBitmapData(Tile.assets.flagDown, tileAssets.flagDown);
    // this.load.imageFromBitmapData(Tile.assets.flagDown, tileAssets.unknown);
    // this.load.imageFromBitmapData(Tile.assets.unknownDown, tileAssets.unknownDown);
  }

  async create () {
    // 初始化游戏音效静态资源
    // 游戏初始化音效
    Board.soundInit = Board.soundInit || this.game.add.audio('soundInit');
    // 揭开方块音效
    Board.soundReveal = Board.soundReveal || this.game.add.audio('soundReveal');
    // 标记方块音效
    Board.soundMark = Board.soundMark || this.game.add.audio('soundMark');
    // 揭开空方块音效
    Board.soundEmpty = Board.soundEmpty || this.game.add.audio('soundEmpty');

    // 爆炸音效
    if (!Tile.soundExplosion) {
      Tile.soundExplosion = this.game.add.audio('soundExplosion');
      Tile.soundExplosion.allowMultiple = true;
    }

    // 延迟半秒后切换至菜单场景
    await delay(this.game, 500);
    this.state.start('Menu', true, false, this.loading.y);
  }
}
