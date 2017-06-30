import Phaser from 'phaser';
import _ from 'lodash';
import { createRoundedRectAsset, lightenDarkenColor, RoundedRectStyles } from '../utils';
import config from '../config';
const DPR = window.devicePixelRatio || 1;
const styles = RoundedRectStyles;

// 鼠标按键映射
const LEFT_BUTTON = 1;
const RIGHT_BUTTON = 2;

// 默认属性
const defaultProps= {
  game: null,
  x: 0,
  y: 0,
  width: 300 * DPR,
  height: 80 * DPR,
  icon: '',
  text: '',
  style: 'primary',
  clickCallback: () => {},
}

// 图像资源映射
let assets = null;

export default class Button {
  constructor (props = {}) {
    _.defaultsDeep(props, defaultProps);
    this.game = props.game;
    this.group = props.group;
    this.x = props.x;
    this.y = props.y;
    this.width = props.width;
    this.height = props.height;
    this.text = props.text;
    this.icon =  props.icon;
    this.style = props.style;
    this.onClick = new Phaser.Signal();

    // 创建按钮图像资源
    assets = assets || {};
    this.style = _.isUndefined(styles[this.style]) ? 'primary' : this.style;
    this.key = `${this.style}_${this.width}_${this.height}`;
    if (_.isUndefined(assets[this.key])) {
      let style = styles[this.style] || {};
      let keyNormal = `button_${this.key}_normal`;
      let keyDown = `button_${this.key}_down`;
      assets[this.key] = {
        'normal': createRoundedRectAsset(this.game, keyNormal, this.width, this.height, style.normal),
        'down':createRoundedRectAsset(this.game, keyDown, this.width, this.height, style.down),
      }
    }

    // 创建按钮对象
    let fontSize = this.style.startsWith('circle') ? this.height * 0.6 : this.height * 0.375;
    let iconSize = this.style.startsWith('circle') ? this.height * 0.6 : fontSize * 1.4;
    let offsetX = this.style.startsWith('circle') ? this.width / 2 : (this.height - iconSize) / 2;
    let offsetY = this.height * 0.5;
    let iconY = this.style.startsWith('circle') ? this.height * 0.57 : offsetY;
    this.fontStyle = {...config.defaultTextStyle, fontSize, fontWeight: 'normal'};
    this.iconStyle = {...this.fontStyle, fontSize: iconSize, font: 'minesweeper'};
    this.button = this.game.add.sprite(this.x, this.y, assets[this.key].normal, 0, this.group);

    // 添加图标与文本
    this.icon = this.game.add.text(offsetX, iconY, this.icon, this.iconStyle, this.group);
    this.text = this.game.add.text(this.width - offsetX, offsetY, this.text, this.fontStyle, this.group);
    this.icon.anchor.setTo(this.style.startsWith('circle') ? 0.5 : 0, 0.5);
    this.text.anchor.setTo(this.style.startsWith('circle') ? 0.5 : 1, 0.5);
    this.button.addChild(this.icon);
    this.button.addChild(this.text);
    this.icon.setShadow(0, -1, 'rgba(0,0,0,0.35)', 1);
    this.text.setShadow(0, -1, 'rgba(0,0,0,0.35)', 1);

    // 激活交互事件
    this.button.inputEnabled = true;
    this.button.input.useHandCursor = true;
    this.button.events.onInputOver.add(this.pointerOver, this);
    this.button.events.onInputOut.add(this.pointerOut, this);
  }

  // 设置按钮的正常样式
  setNormalStyle () {
    this.button.loadTexture(assets[this.key].normal);
    this.icon.setStyle(this.iconStyle, true);
    this.text.setStyle(this.fontStyle, true);
    this.icon.setShadow(0, -1, 'rgba(0,0,0,0.35)', 1);
    this.text.setShadow(0, -1, 'rgba(0,0,0,0.35)', 1);
  }

  // 设置按钮的按下样式
  setDownStyle () {
    let color = lightenDarkenColor(styles[this.style].down.linearGradient.bottomColor, -0.5);
    this.button.loadTexture(assets[this.key].down);
    this.icon.setStyle({...this.iconStyle, fill: color}, true);
    this.text.setStyle({...this.fontStyle, fill: color}, true);
    this.icon.setShadow(0, 1, 'rgba(255,255,255,0.4)', 0);
    this.text.setShadow(0, 1, 'rgba(255,255,255,0.4)', 0);
  }

  // 指针移入
  pointerOver () {
    this.button.events.onInputDown.add(this.pointerDown, this);
    this.button.events.onInputUp.add(this.pointerUp, this);
  }

  // 指针移出
  pointerOut () {
    this.setNormalStyle();
    this.button.events.onInputDown.removeAll();
    this.button.events.onInputUp.removeAll();
  }

  // 按下
  pointerDown (button, pointer) {
    this.setDownStyle();

    // 保存当前鼠标按键状态
    if (pointer.leftButton.isDown) {
      this._lastDownButton = LEFT_BUTTON;
    } else if (pointer.rightButton.isDown) {
      this._lastDownButton = RIGHT_BUTTON;
    }
  }

  // 释放
  pointerUp () {
    this.setNormalStyle();

    // 左键单击
    if (this._lastDownButton === LEFT_BUTTON) {
      this.onClick.dispatch(true);

    // 右键单击
    } else if (this._lastDownButton === RIGHT_BUTTON) {
      this.onClick.dispatch(false);
    } else {
      this.onClick.dispatch(null);
    }

    this._lastDownButton = 0;
  }
}