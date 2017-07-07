/* globals __DEV__ */
import Phaser from 'phaser';
import Hammer from 'hammerjs';
import config from '../config';
import Board from '../sprites/Board';
import Timer from '../sprites/Timer';
import MineCounter from '../sprites/MineCounter';
import Button from '../sprites/Button';
import { Icons } from '../utils';
const DPR = window.devicePixelRatio || 1;
const clamp =  Phaser.Math.clamp;

// 游戏面板平移起始点坐标
let boardStartX = 0;
let boardStartY = 0;
// 游戏面板双指缩放初始缩放
let initScale = 1;
// 游戏面板变形对象
let transform = {};

export default class Game extends Phaser.State {
  init (gameProps = {...config}) {
    this.gameProps = gameProps;
    this.currentLevel = `${gameProps.boardWidth}_${gameProps.boardHeight}_${gameProps.mineTotal}`;
    
    // 限制最多两点触摸
    this.game.input.maxPointers = 2;

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

    // 游戏面板缩放功能
    // 鼠标滚轮缩放
    this.game.input.mouse.mouseWheelCallback = event => {
      let currentScale = this.board.group.scale.x;
      let scale = currentScale * (1 + this.game.input.mouse.wheelDelta * 0.1);
      scale = clamp(scale, 1, this.boardMaxScale);
      this.board.group.scale.set(scale);
      // 居中游戏面板
      this.board.alignToCenter();
    }

    // 创建触摸手势缩放与平移事件
    this.hammerManager = new Hammer.Manager(this.game.canvas);
    this.hammerManager.add(new Hammer.Pan({threshold: 0, pointers: 0}));
    this.hammerManager.add(new Hammer.Pinch({threshold: 0}))
      .recognizeWith(this.hammerManager.get('pan'));

    this.hammerManager.on("panstart panmove", this.handlePan.bind(this));
    this.hammerManager.on("pinchstart pinchmove", this.handlePinch.bind(this));
    this.hammerManager.on("hammer.input", (event) => {
      if(event.isFinal) {
        transform.translate = null;
        transform.scale = null;
      }
    });

    // 游戏结束时禁用与还原缩放
    this.board.onGameEnded.add(()=> {
      // 禁用缩放与平移
      this.game.input.mouse.mouseWheelCallback = null;
      this.hammerManager.destroy();

      // 还原缩放
      this.board.group.scale.set(1);
      this.board.alignToCenter();
    }, this);

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

    // 游戏面板有效范围矩形
    this.availRect = new Phaser.Rectangle(
      10 * DPR,
      78 * DPR,
      availWidth,
      this.game.height - 148 * DPR
    );

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

    // 设置游戏面板的最大缩放比例
    this.boardMaxScale = this.gameProps.boardMaxScale = Math.max(
      80 * DPR / this.gameProps.tileHeight, 2
    );

    this.board = new Board({
      game: this.game,
      cols: this.gameProps.boardWidth,
      rows: this.gameProps.boardHeight,
      mines: this.gameProps.mineTotal,
      tileWidth: this.gameProps.tileWidth,
      tileHeight: this.gameProps.tileHeight,
      boardMaxScale: this.boardMaxScale
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

  // 平移游戏面板事件处理器
  handlePan(event) {
    if(event.type == 'panstart') {
      boardStartX = this.board.group.x;
      boardStartY = this.board.group.y;
    }

    // 获取移动到的坐标
    let x = boardStartX + event.deltaX * DPR;
    let y = boardStartY + event.deltaY * DPR;

    // 限制游戏面板可移动的范围
    let availRect = this.availRect;
    let boardRect = this.board.group.getBounds();
    if (boardRect.width > availRect.width) {
      x = clamp(x, availRect.x + availRect.width - boardRect.width, availRect.x);
    } else {
      x = boardRect.x;
    }

    if (boardRect.height > availRect.height) {
      y = clamp(y, availRect.y + availRect.height - boardRect.height, availRect.y);
    } else {
      y = boardRect.y;
    }

    transform.translate = {x, y};
  }

  // 双指缩放游戏面板事件处理器
  handlePinch(event) {
    if(event.type == 'pinchstart') {
      initScale = this.board.group.scale.x;
    }

    transform.scale = clamp(initScale * event.scale, 1, this.boardMaxScale);
  }

  update () {
    // 更新游戏面板的平移与缩放
    if (transform.translate) {
      this.board.group.x = transform.translate.x;
      this.board.group.y = transform.translate.y;
    }

    if (transform.scale) {
      this.board.group.scale.set(transform.scale);
      // 居中游戏面板
      this.board.alignToCenter();
    }
  }
}