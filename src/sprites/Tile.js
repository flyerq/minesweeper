import Phaser from 'phaser';
import _ from 'lodash';
import { Icons, createRoundedRectAsset, RoundedRectStyles } from '../utils';
import config from '../config';
const DPR = window.devicePixelRatio || 1;
const styles = RoundedRectStyles;

// 颜色映射
const colors = {
  '1': '#34aabd',
  '2': '#94ba08',
  '3': '#58c439',
  '4': '#ae55bd',
  '5': '#ce2010',
  '6': '#18ac39',
  '7': '#8b59bd',
  '8': '#cc5d21',
  mine: '#555555',
  flag: '#ee0000',
  unknown: '#578000',
  exploded: '#444444',
  wrong: '#ff0000',
  disable: '#555555',
  flaggedMine: '#d87e04',
  tippingPoint: '#d9331a',
};

// 鼠标按键映射
const LEFT_BUTTON = 1;
const RIGHT_BUTTON = 2;

// 内容层字体样式
let contentStyle = {
  font: 'normal 32px Arial',
  fontSize: 32 * DPR,
  fill: '#555555',
  align: 'center',
  boundsAlignH: 'center',
  boundsAlignV: 'middle',
};

// 图像资源
let assets = {};

export default class Tile extends Phaser.Sprite {
  constructor ({game, board, x, y, assetKey}) {
    // 创建地基层(初始化时显示为封面层样式)
    super(game, x, y, assets[assetKey].cover);

    this.board = board;
    this.assetKey = assetKey;
    this.tilePivot = this.height / 2;
    this.fontContentStyle = {...contentStyle, fontSize: this.height * 0.6};
    this.iconContentStyle = {...this.fontContentStyle, fontWeight: 'normal', font: 'minesweeper'};

    // 方块当前类型值
    this.currentValue = 0;
    // 用于标记地雷方块是否已爆炸
    this.exploded = false;
    // 用于标记地雷方块是否为引爆点(导致游戏失败的地雷方块)
    this.tippingPoint = false;

    // 启用用户交互
    this.inputEnabled = true;
    this.input.useHandCursor = true;
    this.events.onInputOver.add(this.pointerOver, this);
    this.events.onInputOut.add(this.pointerOut, this);
    this.events.onInputDown.add(this.pointerDown, this);
    this.events.onInputUp.add(this.pointerUp, this);

    // 自定义事件
    // 方块被揭开
    this.onRevealed = new Phaser.Signal();
    // 方块被标记
    this.onMark = new Phaser.Signal();
    // 请求智能揭开周围的方块
    this.onRequestSmartReveal = new Phaser.Signal();

    // 方块绘制动画
    this.events.onAddedToGroup.add((tile, group) => {
      let delay = this.game.rnd.between(100, 600);
      this.game.add.tween(tile).from({alpha: 0}, 800, 'Expo.easeOut', true, delay);
    });
  }

  // 静态方法 - 生成方块所需的图像资源
  static generateTileAssets(width, height, style = 'tileDefault') {
    let assetKey = `${style}_${width}_${height}`;
    
    if (_.isUndefined(assets[assetKey])) {
      let tileStyle = {...styles[style]};
      let size = Math.max(width * 0.058, 1);
      Object.keys(tileStyle).forEach(key => {
        tileStyle[key].radius = size;
        if (key.endsWith('Down') || key === 'ground') {
          tileStyle[key].margin = {
            top: size + 1 * DPR,
            left: size + 1 * DPR,
            right: size + 1 * DPR,
            bottom: size + 1 * DPR
          };
        } else {
          tileStyle[key].thickness = size;
          tileStyle[key].margin = {
            top: size,
            left: size,
            right: size,
            bottom: size
          };
        }
      });

      let keyCover = `tile_${assetKey}_cover`;
      let keyCoverDown = `tile_${assetKey}_coverDown`;
      let keyGround = `tile_${assetKey}_ground`;
      let keyFlag = `tile_${assetKey}_flag`;
      let keyFlagDown = `tile_${assetKey}_flagDown`;
      let keyUnknown = `tile_${assetKey}_unknown`;
      let keyUnknownDown = `tile_${assetKey}_unknownDown`;
      assets[assetKey] = {
        cover: createRoundedRectAsset(game, keyCover, width, height, tileStyle.cover),
        coverDown: createRoundedRectAsset(game, keyCoverDown, width, height, tileStyle.coverDown),
        ground: createRoundedRectAsset(game, keyGround, width, height, tileStyle.ground),
        flag: createRoundedRectAsset(game, keyFlag, width, height, tileStyle.flag),
        flagDown: createRoundedRectAsset(game, keyFlagDown, width, height, tileStyle.flagDown),
        unknown: createRoundedRectAsset(game, keyUnknown, width, height, tileStyle.unknown),
        unknownDown: createRoundedRectAsset(game, keyUnknownDown, width, height, tileStyle.unknownDown),
      };
    }

    // 返回资源的索引键
    return assetKey;
  }

  // 切换突出显示状态
  toggleHighlight (highlight = true) {
    let state = 'cover';
    this.isFlagged() && (state = 'flag');
    this.isUnknown() && (state = 'unknown');
    highlight && (state += 'Down');

    let coverLayer = this.coverLayer || this;

    if (highlight) {
      // 突出显示
      coverLayer.loadTexture(assets[this.assetKey][state]);
    } else {
      // 取消突出显示
      coverLayer.loadTexture(assets[this.assetKey][state]);
    }
  }

  // 指针移入
  pointerOver () {
    this.isPointerEnter = true;
    this._lastDownButton = 0;
    this.touched = false;
  }

  // 指针移出
  pointerOut () {
    this.isPointerEnter = false;

    // 还原突出显示的方块
    if (!this.isRevealed() && this._lastDownButton !== 0) {
      this.toggleHighlight(false);
    }

    // 还原其周围突出显示的方块
    if (this.isRevealed() && this.isNumber() && (this._lastDownButton === RIGHT_BUTTON || this.touched)) {
      this.onRequestSmartReveal.dispatch(this, false);
    }

    this._lastDownButton = 0;
    this.touched = false;
  }

  // 按下
  pointerDown (tile, pointer) {
    // 如果方块尚未揭开则突出显示
    !this.isRevealed() && this.toggleHighlight();

    // 保存当前鼠标按键状态
    if (pointer.leftButton.isDown) {
      this._lastDownButton = LEFT_BUTTON;
    } else if (pointer.rightButton.isDown) {
      this._lastDownButton = RIGHT_BUTTON;

      // 如果右键在一个数字方块上按下，则请求突出显示其周围的方块
      if (this.isRevealed() && this.isNumber()) {
        this.onRequestSmartReveal.dispatch(this, true);
      }
    } else if (this.game.device.touch && this.isRevealed() && this.isNumber()) {
      // 触摸屏
      this.touched = true;
      this.onRequestSmartReveal.dispatch(this, true);
    }
  }

  // 释放
  pointerUp (tile, pointer) {
    this.toggleHighlight(false);

    // 如果指针已经移出，跳过
    if (!this.isPointerEnter) {
      return;
    }

    // 左键单击
    if (this._lastDownButton === LEFT_BUTTON) {
      this.reveal(true);

    // 右键单击
    } else if (this._lastDownButton === RIGHT_BUTTON) {
      if (this.isRevealed()) {
        // 如果右键单击一个数字方块，则请求智能打开其周围的方块
        this.isNumber() && this.onRequestSmartReveal.dispatch(this);
      } else {
        this.mark();
      }
    } else if (this.touched && this.isRevealed() && this.isNumber()) {
      // 触摸屏还原其周围突出显示的方块
      this.onRequestSmartReveal.dispatch(this, false);
    }

    this._lastDownButton = 0;
    this.touched = false;
  }

  // 揭开方块
  reveal (userReveal = false) {
    // 如果方块已经被揭开或标记过，直接跳过
    if (this.isRevealed() || this.isMarked()) {
      return;
    }

    if (!this.coverLayer) {
      // 设置底基层
      this.loadTexture(assets[this.assetKey].ground);

      // 创建数字方块内容层(如果不是空方块)
      if (!this.isEmpty()) {
        let style = {...this.fontContentStyle, fill: colors[this.currentValue]};
        this.contentLayer = this.game.make.text(this.tilePivot, this.tilePivot, this.currentValue, style);
        this.contentLayer.anchor.setTo(0.5, 0.42);
        this.addChild(this.contentLayer);
      }

      // 创建覆盖层
      this.coverLayer = this.game.make.sprite(0, 0, assets[this.assetKey].cover);
      this.addChild(this.coverLayer);
    }

    // 如果当前被揭开的是一个地雷方块，将其标记为引爆点，并使其着重显示
    if (this.isMine()) {
      this.tippingPoint = true;
      this.contentLayer.fill = colors.tippingPoint;
    }

    this.markLayer && this.markLayer.destroy();
    this.coverLayer.kill();
    this.onRevealed.dispatch(this, userReveal);
  }

  // 安置地雷
  setMine () {
    // 设置底基层
    let coverKey = this.key;
    this.loadTexture(assets[this.assetKey].ground);

    // 创建内容层
    let style = {...this.iconContentStyle, fill: colors.mine};
    this.contentLayer = this.game.make.text(this.tilePivot, this.tilePivot, Icons.mine, style);
    this.contentLayer.anchor.setTo(0.5, 0.42);
    this.addChild(this.contentLayer);

    // 创建覆盖层
    this.coverLayer = this.game.make.sprite(0, 0, coverKey);
    this.addChild(this.coverLayer);

    // 如果存在标标记层将其移动到顶层
    this.isMarked() && this.addChild(this.markLayer);

    // 覆盖层补间动画
    this.coverTween = this.game.add.tween(this.coverLayer);
    this.coverTween.onComplete.addOnce(() => this.coverLayer.kill(), this);
    this.coverTween.to({alpha: 0}, 400, 'Linear', false);

    // 爆炸特效层
    this.explosionLayer = this.game.add.sprite(0, 0, 'explosion');
    this.explosionLayer.anchor.setTo(0.5);
    this.explosionLayer.width = this.board.tileWidth * 2;
    this.explosionLayer.height = this.board.tileHeight * 2;
    this.explosionLayer.alignIn(this, Phaser.CENTER, this.board.initOffsetX, this.board.initOffsetY);
    this.explosionLayer.visible = false;
    this.explosionLayer.animations.add('explosion');
  }

  // 更新数字方块
  updateNumber () {
    this.currentValue += 1;
  }

  // 引爆地雷方块
  detonate () {
    // 如果方块已经被爆炸过了或者非地雷方块，直接跳过
    if (this.exploded || !this.isMine() || this.isFlagged()) {
      return;
    }

    this.isMarked() && this.markLayer.kill();
    this.coverLayer.kill();

    // 半秒后切换地雷为已爆炸状态
    let timer = this.game.time.create(true);
    timer.add(500, () => {
      this.contentLayer.fill = this.tippingPoint ? colors.tippingPoint : colors.exploded;
      this.contentLayer.setText(Icons.exploded, true)
    }, this);
    timer.start();

    // 播放爆炸动画
    this.exploded = true;
    this.explosionLayer.visible = true;
    let animation = this.explosionLayer.play('explosion', 48, false, true);
    Tile.soundExplosion.play();
    return new Promise(resolve => animation.onComplete.addOnce(resolve));
  }

  // 显示地雷方块
  showMine(onlyShow = false) {
    // 非地雷方块或已爆炸的方块，直接跳过
    if (!this.isMine() || this.exploded) {
      return;
    }

    this.isMarked() && this.markLayer.kill();
    this.coverLayer.alive = false;
    if (!onlyShow) {
      this.contentLayer.fill = colors.flaggedMine;
    }

    // 开始隐藏覆盖层补间动画
    this.coverTween.start();
    return new Promise(resolve => this.coverTween.onComplete.addOnce(resolve));
  }

  // 标记方块
  mark () {
    let markHideY = -160 * DPR / this.scale.x;
    let markHideSize = this.iconContentStyle.fontSize / this.scale.x;

    // 创建记号层
    if (!this.markLayer) {
      this.markLayer = this.game.make.text(this.tilePivot, this.tilePivot, '', this.iconContentStyle);
      this.markLayer.anchor.setTo(0.5, 0.42);
      this.markLayer.setShadow(0, 1, 'rgba(255,255,255,0.4)', 0);
      this.addChild(this.markLayer);
      this.markLayer.alive = false;

      // 记号层补间动画
      this.markInTween = this.game.make.tween(this.markLayer)
        .to({alpha: 1, y: this.tilePivot, fontSize: this.iconContentStyle.fontSize}, 300, 'Power3');
      this.markOutTween = this.game.add.tween(this.markLayer)
        .to({alpha: 0, y: markHideY, fontSize: markHideSize, rotation: Math.PI / 2}, 300, 'Power3');
    }

    // 如果正在运行补间动画，直接跳过
    if (this.markInTween.isRunning || this.markOutTween.isRunning) {
      return;
    }

    let coverLayer = this.coverLayer || this;
    this.markLayer.fontSize = markHideSize;
    this.markLayer.rotation = 0;
    this.markLayer.alpha = 0;
    this.markLayer.y = markHideY;
    if (!this.isMarked()) {
      this.markLayer.fill = colors.flag;
      this.markLayer.setText(Icons.flag, true);
      this.markLayer.alive = true;
      this.markInTween.start();
      coverLayer.loadTexture(assets[this.assetKey].flag);
    } else if (this.isFlagged()) {
      this.markLayer.fill = colors.unknown;
      this.markLayer.setText(Icons.unknown, true);
      this.markLayer.alive = true;
      this.markInTween.start();
      coverLayer.loadTexture(assets[this.assetKey].unknown);
    } else if (this.isUnknown()) {
      this.markLayer.fill = colors.disable;
      this.markLayer.alive = false;
      this.markLayer.alpha = 1;
      this.markLayer.y = this.tilePivot;
      this.markLayer.fontSize = this.iconContentStyle.fontSize;
      this.markOutTween.start();
      coverLayer.loadTexture(assets[this.assetKey].cover);
    }

    this.onMark.dispatch(this);
  }

  // 标记错误的旗帜方块
  markWrong () {
    // 非旗帜方块或地雷方块，直接跳过
    if (!this.isFlagged() || this.isMine()) {
      return;
    }

    // 创建错误标识层
    let style = {...this.iconContentStyle, fill: colors.wrong};
    this.wrongLayer = this.game.make.text(this.tilePivot, this.tilePivot, Icons.wrong, style);
    this.wrongLayer.anchor.setTo(0.5, 0.42);
    this.addChild(this.wrongLayer);
    this.markLayer.fill = colors.disable;
  }

  // 隐藏未知方块
  hideUnknown () {
    // 非未知方块，直接跳过
    if (!this.isUnknown()) {
      return;
    }

    this.markLayer.kill();
  }

  // 检查方块是否已经揭开
  isRevealed () {
    return this.coverLayer && !this.coverLayer.alive;
  }

  // 检查方块是否已被标记
  isMarked () {
    return this.markLayer && this.markLayer.alive;
  }

  // 检查方块是否已被标记为地雷
  isFlagged () {
    return this.markLayer &&
      this.markLayer.alive &&
      this.markLayer.text === Icons.flag;
  }

  // 检查方块是否已被标记为未知方块
  isUnknown () {
    return this.markLayer &&
      this.markLayer.alive &&
      this.markLayer.text === Icons.unknown;
  }

  // 检查是否为数字方块
  isNumber () {
    return this.currentValue > 0 && this.currentValue < 9;
  }

  // 检查是否是空方快
  isEmpty () {
    return this.currentValue === 0;
  }

  // 检查是否是地雷方块
  isMine () {
    return this.contentLayer && this.contentLayer.text === Icons.mine;
  }
}

Tile.assets = assets;

// 静态化音效资源
Tile.soundExplosion = null;