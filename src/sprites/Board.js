import Phaser from 'phaser';
import Tile from './Tile';
import { delay } from '../utils';

export default class Board {
  constructor ({ game, cols, rows, mines, tileWidth, tileHeight, boardMaxScale }) {
    this.game = game;
    this.group = game.add.group();

    // 游戏面板中方块的列数与行数
    this.cols = cols;
    this.rows = rows;

    // 游戏面板中地雷方块的数量
    this.mines = mines;

    // 方块的宽度与高度
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;

    // 游戏面板的最大缩放比例
    this.boardMaxScale = boardMaxScale;

    // 游戏面板初始化偏移坐标
    this.initOffsetX = 0;
    this.initOffsetY = 0;

    // 用于存放游戏面板中行与列的方块对象的二维数组
    this.board = [];
    // 地雷方块对象数组
    this.mineList = [];
    // 旗帜方块(被标记为地雷的方块)对象数组
    this.flaggedList = [];
    // 未知方块(被标记为问号的方块)对象数组
    this.unknownList = [];

    // 剩余的尚未揭开的非地雷方块计数器，作为判断游戏是否胜利的依据
    this.leftUnminedTileCounter = cols * rows - mines;

    // 用于标记游戏是否已经开始
    this.gameStarted = false;
    // 用于标记游戏是否已经结束
    this.gameEnded = false;
    // 用于标记游戏获胜
    this.victory = false;
    // 用于标记游戏失败
    this.defeat = false;

    // 自定义事件
    // 游戏面板中的旗帜方块(被标记为地雷方块)的数目发生变更
    this.onFlaggedChanged = new Phaser.Signal();

    // 游戏开始事件
    this.onGameStarted = new Phaser.Signal();

    // 游戏结束事件
    this.onGameEnded = new Phaser.Signal();
    this.onGameEnded.add(this.handleGameEnded, this);

    // 游戏胜利与失败事件
    this.onGameWin = new Phaser.Signal();
    this.onGameOver = new Phaser.Signal();

    // 触摸屏设备方块点击与长按事件
    if (this.game.device.touch) {
      // 点击
      this.game.input.onTap.add(pointer => {
        // 如果是鼠标事件直接跳过
        if (pointer.isMouse) {
          return;
        }

        let tile = this.getPointerTile(pointer);

        // 如果指针坐标下不存在方块直接跳过
        if (!tile) {
          return;
        }

        if (tile.isRevealed()) {
          // 如果点击一个数字方块，则请求智能打开其周围的方块
          tile.isNumber() && tile.onRequestSmartReveal.dispatch(tile);
        } else {
          tile.reveal(true);
        }
      }, this);

      // 长按
      this.game.input.holdRate = 800;
      this.game.input.onHold.add(pointer => {
        // 如果是鼠标事件直接跳过
        if (pointer.isMouse) {
          return;
        }
        
        let tile = this.getPointerTile(pointer);
        let downTile = this.getPointerTile(pointer.positionDown);

        // 如果指针坐标下不存在方块或指针已移出按下时的方块时，直接跳过
        if (!tile || tile !== downTile) {
          return;
        }

        // 标记未揭开的方块
        !tile.isRevealed() && tile.mark();
      }, this);
    }

    // let start = performance.now();
    this.init();
    // console.log(performance.now() - start);
  }

  // 初始化面板
  async init () {
    const { game, rows, cols, tileWidth, tileHeight, boardMaxScale } = this;
    
    // 生成方块所需的图像资源
    const assetKey = Tile.generateTileAssets(
      tileWidth * boardMaxScale,
      tileHeight * boardMaxScale
    );

    // 播放游戏初始化音效
    Board.soundInit.play();

    for (let y = 0; y < rows; ++y) {
      let row = [];
      for (var x = 0; x < cols; ++x) {
        let tile = new Tile({
          game,
          board: this,
          x: x * tileWidth,
          y: y * tileHeight,
          assetKey
        });
        tile.width = tileWidth;
        tile.height = tileHeight;
        tile.column = x;  // 方块在面板中的横向(所在列)索引
        tile.row = y;     // 方块在面板中的纵向(所在行)索引
        tile.onRevealed.add(this.handleTileRevealed, this);
        tile.onMark.add(this.handleTileMark, this);
        tile.onRequestSmartReveal.add(this.handleTileRequestSmartReveal, this);
        this.group.add(tile);
        row.push(tile);
      }
      this.board.push(row);
    }

    // 居中面板
    this.alignToCenter(game.world.centerX, game.world.centerY);
  }

  // 水平与垂直居中游戏面板
  alignToCenter () {
    this.group.alignIn(this.game.world, Phaser.CENTER);

    // 保存初始化偏移坐标信息
    if (this.group.scale.x === 1) {
      this.initOffsetX = this.group.x;
      this.initOffsetY = this.group.y;
    }
  }

  // 生成地雷方块
  generateMines (excludeTiles = []) {
    // 将二维数组转换为一维数组
    let tiles = this.board.reduce((acc, cur) => acc.concat(cur), []);
    // 移除需要排除的方块
    tiles = tiles.filter(tile => !excludeTiles.includes(tile));

    for (let i = this.mines; i > 0; --i) {
      // 在方块数组中随机取出一个方块设置为地雷，并将该方块从数组中移除，以防止重复
      let index = this.game.rnd.between(0, tiles.length - 1);
      this.mineList.push(tiles[index]);
      tiles[index].setMine();
      tiles.splice(index, 1);
    }

    // 生成编号方块
    this.generateNumbers();
  }

  // 生成编号方块
  generateNumbers () {
    for (let i = this.mineList.length - 1; i >= 0; --i) {
      let mineTile = this.mineList[i];
      let surroundingTiles = this.getSurroundingTiles(mineTile);

      for (let j = surroundingTiles.length - 1; j >= 0; --j) {
        let currentTile = surroundingTiles[j];

        // 跳过地雷方块
        if (currentTile.isMine()) {
          continue;
        }

        // 更新数字方块
        currentTile.updateNumber();
      }
    }
  }

  // 获取指定方块周围的方块列表
  getSurroundingTiles (tile, skipRevealed = false) {
    let tiles = [];

    for (let y = -1; y <= 1; ++y) {
      for (let x = -1; x <= 1; ++x) {
        // 跳过当前方块(中心方块)
        if (!x && !y) {
          continue;
        }

        let column = tile.column + x;
        let row = tile.row + y;

        // 跳过超出边界的方块
        if (row < 0 || row >= this.rows || column < 0 || column >= this.cols) {
          continue;
        }

        // 跳过已揭开的方块
        if (skipRevealed && this.board[row][column].isRevealed()) {
          continue;
        }

        tiles.push(this.board[row][column]);
      }
    }

    return tiles;
  }

  // 获取指定指针坐标下的方块，如果不存在者返回null
  getPointerTile (pointer) {
    // 超出游戏面板范围直接跳过
    if (
      pointer.x < this.group.left ||
      pointer.x > this.group.right ||
      pointer.y < this.group.top ||
      pointer.y > this.group.bottom
    ) {
      return null;
    }

    let scale = this.group.scale.x;
    let x = Math.floor((pointer.x - this.group.x) / (this.tileWidth * scale));
    let y = Math.floor((pointer.y - this.group.y) / (this.tileHeight * scale));

    return this.board[y][x];
  }

  // 方块被揭开的事件处理器
  handleTileRevealed (tile, userReveal) {
    // 递增当前已经揭开的方块的总数
    this.leftUnminedTileCounter -= 1;

    // 标记游戏已经开始
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.onGameStarted.dispatch();
    }

    // 首次揭开
    if (!this.mineList.length) {
      // 排除当前及周围的方块，避免首次触雷
      let excludeTiles = [tile, ...this.getSurroundingTiles(tile)];
      this.generateMines(excludeTiles);
    }

    // 如果揭开的是地雷方块，游戏失败
    if (tile.isMine()) {
      this.gameOver(tile);

    // 如果所有非地雷方块都被揭开时游戏胜利
    } else if (this.isGameWin()) {
      this.gameWin();

    // 如果揭开的是一个空方块，继续揭开其周围的方块，直到揭开所有相邻的数字方块
    } else if (tile.isEmpty()) {
      // 如果是用户手动揭开的空方块，播放空方块音效
      userReveal && Board.soundEmpty.play();

      this.revealSurroundingTiles(tile);
    }

    // 如果是用户手动揭开的方块(非地雷和空方块)，播放揭开方块音效
    if (userReveal && !tile.isMine() && !tile.isEmpty()) {
      Board.soundReveal.play();
    }
  }

  // 方块被标记的事件处理器
  handleTileMark (tile) {
    // 标记游戏已经开始
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.onGameStarted.dispatch();
    }

    // 播放标记方块音效
    Board.soundMark.play();

    // 将当前被标记的方块添加到旗帜方块或未知方块列表中，或从列表中删除该方块
    if (tile.isFlagged()) {
      this.flaggedList.push(tile);
    } else if (tile.isUnknown()) {
      this.unknownList.push(tile);
    } else {
      this.flaggedList = this.flaggedList.filter(t => t !== tile);
      this.unknownList = this.unknownList.filter(t => t !== tile);
    }

    // 发布旗帜方块数目变更事件
    this.onFlaggedChanged.dispatch(this.flaggedList.length);
  }

  // 数字方块请求智能打开周围方块的事件处理器
  handleTileRequestSmartReveal (tile, highlight) {
    let unrevealedTiles = this.getSurroundingTiles(tile, true);

    // 切换周围未被标记的方块的突出显示状态
    unrevealedTiles.forEach(t => {
      !t.isMarked() && t.toggleHighlight(!!highlight);
    });

    // 如果为传递仅仅只切换突出显示的参数，即视为同时请求智能揭开其周围的方块
    // 否则直接跳过
    if (typeof highlight !== 'undefined') {
      return;
    }

    // 仅当周围被标记为地雷的方块个数与当前方块的编号相同时，才揭开其周围未标记的方块
    let flaggedTotal = unrevealedTiles.filter(t => t.isFlagged()).length;
    if (flaggedTotal === tile.currentValue) {
      unrevealedTiles.forEach(t => t.reveal(true));
    }
  }

  // 揭开指定空方块周围的所有方块，直到揭开所有相邻的数字方块
  revealSurroundingTiles (tile) {
    let surroundingTiles = this.getSurroundingTiles(tile);
    surroundingTiles.forEach(t => t.reveal());
  }

  // 引爆所有地雷方块
  async detonateAllMineTiles (tippingPointTile) {
    // 首先引爆引爆点地雷方块，然后依次引爆其它未标记的地雷方块
    await tippingPointTile.detonate();

    // 显示非引爆点和未标记的地雷方块
    await Promise.all(this.mineList.map(tile => {
      if (!tile.tippingPoint && !tile.isFlagged()) {
        return tile.showMine(true);
      }
    }));

    // 引爆其余非引爆点和未标记的地雷方块
    await this.rippleDetonateMineTiles(tippingPointTile);
  }

  // 以指定的中心点扩散冲击波的形式引爆所有未标记的地雷方块
  async rippleDetonateMineTiles (tippingPointTile, speed = 100) {
    let surroundingTiles = this.getSurroundingTiles(tippingPointTile);
    await Promise.all(surroundingTiles.map(tile => this.impactTile(tile, speed)));
  }

  // 冲击一个方块，如果是地雷方块就引爆，然后向四周蔓延冲击波
  async impactTile (tile, speed) {
    if (tile.isFlagged() || tile.impacted) {
      return;
    }

    tile.impacted = true;
    if (tile.isMine()) {
      tile.detonate();
    }

    await delay(this.game, speed);
    await this.rippleDetonateMineTiles(tile, speed);
  }

  // 显示所有地雷方块
  async showAllMineTiles () {
    await Promise.all(this.mineList.map(tile => tile.showMine()));
  }

  // 显示所有错误的旗帜方块
  showAllWrongTiles () {
    this.flaggedList.forEach(tile => tile.markWrong());
  }

  // 隐藏所有标记为未知的方块(问号方块)
  hideAllUnknownTiles () {
    this.unknownList.forEach(tile => tile.hideUnknown());
  }

  // 游戏结束事件处理器
  handleGameEnded () {
    // 标记游戏已经结束
    this.gameEnded = true;

    // 禁用方块的交互响应
    this.group.forEach(tile => tile.inputEnabled = false, this);

    // 如果是触摸屏设备禁用其触摸交互
    if (this.game.device.touch) {
      this.game.input.onTap.removeAll(this);
      this.game.input.onHold.removeAll(this);
    }

    // 隐藏所有未知方块
    // this.hideAllUnknownTiles();
  }

  // 游戏胜利处理
  async gameWin () {
    // 标记游戏获胜
    this.victory = true;

    // 发布游戏结束事件
    this.onGameEnded.dispatch(true);

    // 显示所有地雷方块
    await this.showAllMineTiles();

    // 发布游戏胜利事件
    this.onGameWin.dispatch();
  }

  // 游戏失败处理
  async gameOver (tippingPointTile) {
    // 标记游戏失败
    this.defeat = true;

    // 发布游戏结束事件
    this.onGameEnded.dispatch(false);

    // 引爆所有地雷方块，然后显示所有地雷方块和标记错误的旗帜方块
    await this.detonateAllMineTiles(tippingPointTile);
    await delay(this.game, 1000);
    this.showAllWrongTiles();
    await this.showAllMineTiles();

    // 发布游戏失败事件
    this.onGameOver.dispatch();
  }

  // 检查游戏是否已经开始
  isGameStart () {
    return this.gameStarted;
  }

  // 检查游戏是否已经结束
  isGameEnd () {
    return this.gameEnded;
  }

  // 检查游戏是否胜利
  isGameWin () {
    return this.leftUnminedTileCounter <= 0;
  }

  // 检查游戏是否失败
  isGameOver () {
    return this.defeat;
  }

  // 辅助方法：偷看全部地雷方块
  peekAllTiles () {
    this.group.forEach(tile => {
      if (tile.isMine()) {
        tile.coverLayer.alpha = 0.6;
      }
    }, this);
  }

  // 辅助方法：取消偷看全部地雷方块
  cancelPeekAllTiles () {
    this.group.forEach(tile => {
      if (tile.isMine()) {
        tile.coverLayer.alpha = 1;
      }
    }, this);
  }
}

// 静态化音效资源
// 游戏初始化音效
Board.soundInit = null;
// 揭开方块音效
Board.soundReveal = null;
// 标记方块音效
Board.soundMark = null;
// 揭开空方块音效
Board.soundEmpty = null;