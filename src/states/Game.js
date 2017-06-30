/* globals __DEV__ */
import Phaser from 'phaser';
import config from '../config';
import Board from '../sprites/Board';
import Timer from '../sprites/Timer';
import MineCounter from '../sprites/MineCounter';
import Button from '../sprites/Button';
import { Icons } from '../utils';
const DPR = window.devicePixelRatio || 1;

export default class Game extends Phaser.State {
  init (gameProps = {...config}) {
    this.gameProps = gameProps;
    this.currentLevel = `${gameProps.boardWidth}_${gameProps.boardHeight}_${gameProps.mineTotal}`;

    // 载入客户端本地游戏数据
    this.gameData = this.loadGameData();
  }

  create () {
    // 初始话游戏
    this.initGame();
  }

  // 初始化游戏
  initGame () {
    // 初始话游戏面板
    this.initBoard();

    // 初始化游戏计时器与地雷计数器
    this.headerGroup = this.game.add.group();
    this.timer = new Timer(this.game, this.board, this.headerGroup);
    this.mineCounter = new MineCounter(this.game, this.board, this.headerGroup);

    // 菜单按钮
    let buttonProps = {
      game: this.game,
      x: this.game.width - 58 * DPR,
      y: this.game.height - 58 * DPR,
      width: 48 * DPR,
      height: 48 * DPR,
      icon: Icons.menu,
      text: '',
      style: 'circleAction'
    };
    let menuButton = new Button(buttonProps);
    menuButton.onClick.add(this.backMenu, this);

    // 布局UI
    this.mineCounter.alignTo(this.timer.text);
    this.headerGroup.x = this.game.world.centerX - this.headerGroup.centerX;
    this.headerGroup.y = 20 * DPR;

    // 游戏事件监听
    this.board.onGameWin.add(this.gameWin, this);
    this.board.onGameOver.add(this.gameOver, this);

    // 辅助功能：按住CTRL键偷看全部方块
    let ctrlKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ALT);
    ctrlKey.onDown.add(() => {
      this.board.peekAllTiles();
    });
    ctrlKey.onUp.add(() => {
      this.board.cancelPeekAllTiles();
    });
  }

  // 初始游戏面板
  initBoard () {
    let availWidth = this.game.width - 20 * DPR;
    let availHeight = this.game.height - 128 * DPR - config.timerIconSize;
    let aspectRatio = this.gameProps.boardWidth / this.gameProps.boardHeight;

    // 窄屏
    if (availHeight > availWidth && aspectRatio > 1) {
      let temp = this.gameProps.boardWidth;
      this.gameProps.boardWidth = this.gameProps.boardHeight;
      this.gameProps.boardHeight = temp;
      aspectRatio = this.gameProps.boardWidth / this.gameProps.boardHeight;
    }

    // 等比例铺满可用空间
    let width = availWidth;
    let height = width / aspectRatio;
    if ( height > availHeight ) {
      height = availHeight;
      width = height * aspectRatio;
    }
    this.gameProps.tileWidth = width / this.gameProps.boardWidth;
    this.gameProps.tileHeight = this.gameProps.tileWidth;

    this.board = new Board({
      game: this.game,
      cols: this.gameProps.boardWidth,
      rows: this.gameProps.boardHeight,
      mines: this.gameProps.mineTotal,
      tileWidth: this.gameProps.tileWidth,
      tileHeight: this.gameProps.tileHeight,
    });
  }

  // 游戏胜利
  gameWin () {
    // 设置并保存最佳用时
    this.gameData[this.currentLevel] = this.gameData[this.currentLevel] || {};
    if (!this.gameData[this.currentLevel].bestTime) {
      this.gameData[this.currentLevel].bestTime = this.timer.timeText;
      this.gameData[this.currentLevel].bestTimeValue = this.timer.time;
    } else if (this.timer.time < this.gameData[this.currentLevel].bestTimeValue) {
      this.gameData[this.currentLevel].bestTime = this.timer.timeText;
      this.gameData[this.currentLevel].bestTimeValue = this.timer.time;
    }
    this.saveGameData();

    // 切换到游戏胜利的场景
    this.game.state.start('GameWin', false, false, {
      gameProps: this.gameProps,
      currentTime: this.timer.timeText,
      bestTime: this.gameData[this.currentLevel].bestTime,
      isGameWin: true
    });
  }

  // 游戏失败
  gameOver () {
    // 设置并保存最佳用时
    let bestTime = '暂无记录';
    if (this.gameData[this.currentLevel] && this.gameData[this.currentLevel].bestTime) {
      bestTime = this.gameData[this.currentLevel].bestTime;
    }

    // 切换到游戏失败的场景
    this.game.state.start('GameOver', false, false, {
      gameProps: this.gameProps,
      currentTime: this.timer.timeText,
      bestTime: bestTime,
      isGameWin: false
    });
  }

  // 保存游戏数据到客户端本地
  saveGameData () {
    try {
      localStorage.setItem(config.localStorageName, JSON.stringify(this.gameData));
    } catch (err) {
      // 忽略写入错误
    }
  }

  // 读取客户端本地的游戏数据
  loadGameData () {
    try {
      const gameData = localStorage.getItem(config.localStorageName);
      if (gameData === null) {
        return {};
      }
      return JSON.parse(gameData);
    } catch (err) {
      return {};
    }
  }

  // 返回菜单
  backMenu () {
    this.game.state.start('Menu');
  }
}
