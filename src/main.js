import 'pixi';
import 'p2';
import Phaser from 'phaser';

import BootState from './states/Boot';
import SplashState from './states/Splash';
import MenuState from './states/Menu';
import GameState from './states/Game';
import GameWinState from './states/GameWin';
import GameOverState from './states/GameOver';
import config from './config';

export default class Game extends Phaser.Game {
  constructor () {
    const width = Math.max(0/*280*/, document.documentElement.clientWidth);
    const height = Math.max(0/*280*/, document.documentElement.clientHeight);
    const gameConfig = {
      width: width * window.devicePixelRatio,
      height: height * window.devicePixelRatio,
      renderer: Phaser.CANVAS,
      parent: 'game',
    };
    super(gameConfig);

    // 添加场景
    this.state.add('Boot', BootState, false);
    this.state.add('Splash', SplashState, false);
    this.state.add('Menu', MenuState, false);
    this.state.add('Game', GameState, false);
    this.state.add('GameWin', GameWinState, false);
    this.state.add('GameOver', GameOverState, false);

    // 开始启动场景
    this.state.start('Boot');
  }
}

window.game = new Game();

// 禁用右键菜单
window.oncontextmenu = e => e.preventDefault();
