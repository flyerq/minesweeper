import Phaser from 'phaser';
import WebFont from 'webfontloader';
import config from '../config';

export default class Boot extends Phaser.State {
  init () {
    this.stage.backgroundColor = config.gameBgColor;
    this.fontsReady = false;
    this.fontsLoaded = this.fontsLoaded.bind(this);

    // 游戏缩放设置
    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.game.scale.pageAlignVertically = true;
    this.game.scale.pageAlignHorizontally = true;
    // this.game.scale.setMinMax(280, 280, 2560, 2560);
  }

  preload () {
    // 加载自定义字体文件
    WebFont.load({
      custom: {
        families: ['minesweeper', 'Black Ops One'],
        urls: ['assets/fonts/minesweeper.css', 'assets/fonts/Black Ops One.css'],
        testStrings: {
          'minesweeper': '\ue99a\ue99b\ue99c'
        }
      },
      active: this.fontsLoaded
    })

    let text = this.add.text(this.world.centerX, this.world.centerY, '加载中...', config.defaultTextStyle);
    text.anchor.setTo(0.5);
  }

  render () {
    if (this.fontsReady) {
      this.state.start('Splash');
    }
  }

  fontsLoaded () {
    this.fontsReady = true;
  }
}
