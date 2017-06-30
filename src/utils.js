import Phaser from 'phaser';
import _ from 'lodash';
const DPR = window.devicePixelRatio || 1;

// 图标字体资源映射
export const Icons = {
  mine: '\ue99a',
  timer: '\ue99b',
  flag: '\ue99e',
  // flag: '\ue948',
  wrong: '\ue908',
  unknown: '\uf128',
  exploded: '\ue9a0',
  happy: '\ue9e0',
  cool: '\ue9ec',
  expert: '\ue9fa',
  wink: '\ue9e8',
  confused: '\ue9f6',
  menu: '\ue97c',
  close: '\ue5cd',
  replay: '\ue94c',
}


// 将传递的游戏对象数组中的所有对象的锚点设置为其中心点
export const centerGameObjects = (objects) => {
  objects.forEach(function (object) {
    object.anchor.setTo(0.5);
  })
}

// 异步延迟辅助函数
export const delay = async (game, delay) => {
  await new Promise(resolve => {
    let timer = game.time.create(true);
    timer.add(delay, resolve);
    timer.start();
  });
}

// Canvas绘制圆角矩形
export const drawRoundedRect = (ctx, x, y, w, h, r) => {
  r = w < 2 * r ? w / 2 : r;
  r = h < 2 * r ? h / 2 : r;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  return ctx;
}

// 增加（0-1区间的小数)或降低(-1-0区间的负小数)颜色的亮度
export const lightenDarkenColor = (color, percent) => {
  let f = parseInt(color.slice(1), 16);
  let t = percent < 0 ? 0 : 255;
  let p = percent < 0 ? percent * -1 : percent;
  let R = f >> 16;
  let G = f >> 8 & 0x00FF;
  let B = f & 0x0000FF;

  return "#" + (
    0x1000000 + (Math.round((t - R) * p) + R) *
    0x10000 + (Math.round((t - G) * p) + G) *
    0x100 + (Math.round((t - B) * p) + B)
  ).toString(16).slice(1);
}


// 圆角矩形的默认样式
const roundedRectDefaultStyle = {
  // 是否描边
  stroke: true,
  // 是否显示高光
  reflected: true,
  // 与图片容器的边界
  margin: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  // 填充的渐变色
  linearGradient: {
    topColor: '#16b3ec',
    bottomColor: '#0e89b6'
  },
  // 圆角半径
  // radius: 5,
  // 3d效果的厚度
  // thickness: 5,
  // 阴影
  // shadow: {
  //   x: 0,
  //   y: 5,
  //   blur: 5,
  //   color: '#999999',
  // },
}
// 创建并返回一个圆角矩形图像资源
export const createRoundedRectAsset = (game, key, w, h, style = {}) => {
  _.defaultsDeep(style, roundedRectDefaultStyle);
  let bmd = game.make.bitmapData(w, h);
  let defaultValue = h * 0.05;
  let radius = _.isUndefined(style.radius) ? defaultValue : style.radius;
  let thickness = _.isUndefined(style.thickness) ? defaultValue : style.thickness;
  style.reflected && (thickness += 1);
  let shadowX = !style.shadow || _.isUndefined(style.shadow.x) ? 0 : style.shadow.x;
  let shadowY = !style.shadow || _.isUndefined(style.shadow.y) ? defaultValue : style.shadow.y;
  let shadowBlur = !style.shadow || _.isUndefined(style.shadow.blur) ? defaultValue : style.shadow.blur;
  let shadowColor = !style.shadow || _.isUndefined(style.shadow.color) ? 'rgba(0,0,0,0.38)' : style.shadow.color;
  let rectX = shadowX < 0 ? style.margin.left + Math.abs(shadowX): style.margin.left;
  let rectY = shadowY < 0 ? style.margin.top + Math.abs(shadowY): style.margin.top;
  let rectWidth = w - Math.abs(shadowX) - style.margin.left - style.margin.right;
  let rectHeight = h - thickness - Math.abs(shadowY) - style.margin.top - style.margin.bottom;
  let lightenColor = lightenDarkenColor(style.linearGradient.bottomColor, 0.3);
  let darkenColor = lightenDarkenColor(style.linearGradient.bottomColor, -0.3);


  // 绘制收缩后的阴影
  bmd.context.shadowOffsetX = shadowX;
  bmd.context.shadowOffsetY = shadowY;
  bmd.context.shadowBlur = shadowBlur;
  bmd.context.shadowColor = shadowColor;
  bmd.context.fillStyle = darkenColor;
  drawRoundedRect(
    bmd.context,
    rectX + shadowBlur / 2,
    rectY + shadowBlur / 2,
    rectWidth - shadowBlur,
    rectHeight + thickness - shadowBlur,
    radius
  );
  bmd.context.fill();

  // 绘制圆角矩形的厚度
  bmd.context.shadowOffsetX = 0;
  bmd.context.shadowOffsetY = 0;
  bmd.context.shadowBlur = 0;
  bmd.context.fillStyle = darkenColor;
  drawRoundedRect(bmd.context, rectX, rectY, rectWidth, rectHeight + thickness, radius);
  bmd.context.fill();

  // 绘制圆角矩形底部的1像素高光
  if (style.reflected) {
    bmd.context.fillStyle = lightenColor;
    drawRoundedRect(bmd.context, rectX, rectY + 1, rectWidth, rectHeight, radius);
    bmd.context.fill();
  }

  // 绘制圆角矩形本体
  let grd = bmd.context.createLinearGradient(rectX, rectY, rectX, rectY + rectHeight);
  grd.addColorStop(0, style.linearGradient.topColor);
  grd.addColorStop(1, style.linearGradient.bottomColor);
  bmd.context.fillStyle = grd;
  drawRoundedRect(bmd.context, rectX, rectY, rectWidth, rectHeight, radius);
  bmd.context.fill();

  // 描边
  if (style.stroke) {
    let strokeHeight = style.reflected ? rectHeight : rectHeight + 2;
    bmd.context.lineWidth = 1;
    bmd.context.lineCap = "round";
    bmd.context.lineJoin = "round";
    bmd.context.strokeStyle = darkenColor;
    drawRoundedRect(bmd.context, rectX, rectY, rectWidth, rectHeight + 2, radius);
    bmd.context.stroke();
  }

  // 将此圆角矩形图像资源添加到缓存中并返回其资源引用
  game.cache.addBitmapData(key, bmd);
  return game.cache.getBitmapData(key);
}

// 创建并返回一个圆角矩形图像资源
export const creatAlphaRoundedRectAsset = (game, key, w, h, color = '#000000', radius = 5 * DPR, shadow = true) => {
  let bmd = game.make.bitmapData(w, h);
  let blur = 20 * DPR;
  let x = blur;
  let y = blur;
  let width = w - x * 2;
  let height = h - y * 2;

  // 绘制圆角矩形
  bmd.context.shadowOffsetX = 0;
  bmd.context.shadowOffsetY = 0;
  bmd.context.shadowBlur = 20 * DPR;
  bmd.context.shadowColor = 'rgba(0,0,0,0.8)';
  bmd.context.globalAlpha = 0.7;
  bmd.context.fillStyle = color;
  drawRoundedRect(bmd.context, x, y, width, height, radius);
  bmd.context.fill();

  // 将此图像资源添加到缓存中并返回其资源引用
  game.cache.addBitmapData(key, bmd);
  return game.cache.getBitmapData(key);
}

// 按钮样式映射
export const RoundedRectStyles = {
  action: {
    normal: {
      thickness: 5 * DPR,
      radius: 5 * DPR,
      shadow:{
        y: 5 * DPR,
        blur: 5 * DPR
      },
      linearGradient: {
        topColor: '#8fcf00',
        bottomColor: '#6b9c00'
      }
    },
    down: {
      thickness: 2 * DPR,
      shadow:{
        y: 2 * DPR
      },
      margin: {
        top: 3 * DPR,
        bottom: 3 * DPR
      },
      linearGradient: {
        topColor: '#6b9c00',
        bottomColor: '#6b9c00'
      }
    }
  },

  circleAction: {
    normal: {
      radius: 10000 * DPR,
      thickness: 0,
      stroke: false,
      reflected: false,
      shadow:{
        y: 0,
        blur: 0
      },
      linearGradient: {
        topColor: '#8fcf00',
        bottomColor: '#6b9c00'
      }
    },
    down: {
      radius: 10000 * DPR,
      thickness: 0,
      stroke: false,
      reflected: false,
      shadow:{
        y: 0,
        blur: 0,
      },
      linearGradient: {
        topColor: '#6b9c00',
        bottomColor: '#6b9c00'
      }
    }
  },

  actionMini: {
    normal: {
      thickness: 2 * DPR,
      radius: 5 * DPR,
      shadow:{
        y: 2 * DPR,
        blur: 0,
      },
      linearGradient: {
        topColor: '#8fcf00',
        bottomColor: '#6b9c00'
      }
    },
    down: {
      thickness: 1,
      radius: 5 * DPR,
      shadow:{
        y:  2 * DPR,
        blur: 0,
      },
      margin: {
        top: 1 * DPR,
        bottom: 1 * DPR
      },
      linearGradient: {
        topColor: '#6b9c00',
        bottomColor: '#6b9c00'
      }
    }
  },

  primary: {
    normal: {
      thickness: 5 * DPR,
      radius: 5 * DPR,
      shadow:{
        y: 5 * DPR,
        blur: 5 * DPR
      }
    },
    down: {
      thickness: 2 * DPR,
      shadow:{
        y: 2 * DPR
      },
      margin: {
        top: 3 * DPR,
        bottom: 3 * DPR
      },
      linearGradient: {
        topColor: '#0e89b6'
      }
    }
  },

  primaryMini: {
    normal: {
      thickness: 2 * DPR,
      radius: 5 * DPR,
      shadow:{
        y: 2 * DPR,
        blur: 0,
      }
    },
    down: {
      thickness: 1,
      radius: 5 * DPR,
      shadow:{
        y:  2 * DPR,
        blur: 0,
      },
      margin: {
        top: 1 * DPR,
        bottom: 1 * DPR
      },
      linearGradient: {
        topColor: '#0e89b6'
      }
    }
  },

  warning: {
    normal: {
      thickness: 5 * DPR,
      radius: 5 * DPR,
      shadow:{
        y: 5 * DPR,
        blur: 5 * DPR
      },
      linearGradient: {
        topColor: '#fa9915',
        bottomColor: '#d87e04'
      }
    },
    down: {
      thickness: 2 * DPR,
      shadow:{
        y: 2 * DPR
      },
      margin: {
        top: 3 * DPR,
        bottom: 3 * DPR
      },
      linearGradient: {
        topColor: '#d87e04',
        bottomColor: '#d87e04'
      }
    }
  },

  danger: {
    normal: {
      thickness: 5 * DPR,
      radius: 5 * DPR,
      shadow:{
        y: 5 * DPR,
        blur: 5 * DPR
      },
      linearGradient: {
        topColor: '#e8543f',
        bottomColor: '#d9331a'
      }
    },
    down: {
      thickness: 2 * DPR,
      shadow:{
        y: 2 * DPR
      },
      margin: {
        top: 3 * DPR,
        bottom: 3 * DPR
      },
      linearGradient: {
        topColor: '#d9331a',
        bottomColor: '#d9331a'
      }
    }
  },

  circleDanger: {
    normal: {
      radius: 10000 * DPR,
      thickness: 0,
      stroke: false,
      reflected: false,
      shadow:{
        y: 0,
        blur: 0
      },
      linearGradient: {
        topColor: '#e8543f',
        bottomColor: '#d9331a'
      }
    },
    down: {
      radius: 10000 * DPR,
      thickness: 0,
      stroke: false,
      reflected: false,
      shadow:{
        y: 0,
        blur: 0,
      },
      linearGradient: {
        topColor: '#d9331a',
        bottomColor: '#d9331a'
      }
    }
  },

  // 方块默认样式
  tileDefault: {
    cover: {
      thickness: 5 * DPR,
      radius: 5 * DPR,
      shadow:{
        x: 0,
        y: 0,
        blur: 0
      },
      margin: {
        top: 5 * DPR,
        left: 5 * DPR,
        right: 5 * DPR,
        bottom: 5 * DPR
      },
      linearGradient: {
        topColor: '#16b3ec',
        bottomColor: '#0e89b6'
      },
    },
    coverDown: {
      thickness: 0,
      reflected: false,
      stroke: false,
      radius: 5 * DPR,
      shadow:{
        x: 0,
        y: 0,
        blur: 0
      },
      margin: {
        top: 6 * DPR,
        left: 6 * DPR,
        right: 6 * DPR,
        bottom: 6 * DPR
      },
      linearGradient: {
        topColor: '#0e89b6',
        bottomColor: '#0e89b6'
      }
    },
    flag: {
      thickness: 5 * DPR,
      radius: 5 * DPR,
      shadow:{
        x: 0,
        y: 0,
        blur: 0
      },
      margin: {
        top: 5 * DPR,
        left: 5 * DPR,
        right: 5 * DPR,
        bottom: 5 * DPR
      },
      linearGradient: {
        topColor: '#fa9915',
        bottomColor: '#d87e04'
      },
    },
    flagDown: {
      thickness: 0,
      reflected: false,
      stroke: false,
      radius: 5 * DPR,
      shadow:{
        x: 0,
        y: 0,
        blur: 0
      },
      margin: {
        top: 6 * DPR,
        left: 6 * DPR,
        right: 6 * DPR,
        bottom: 6 * DPR
      },
      linearGradient: {
        topColor: '#d87e04',
        bottomColor: '#d87e04'
      }
    },
    unknown: {
      thickness: 5 * DPR,
      radius: 5 * DPR,
      shadow:{
        x: 0,
        y: 0,
        blur: 0
      },
      margin: {
        top: 5 * DPR,
        left: 5 * DPR,
        right: 5 * DPR,
        bottom: 5 * DPR
      },
      linearGradient: {
        topColor: '#8fcf00',
        bottomColor: '#6b9c00'
      },
    },
    unknownDown: {
      thickness: 0,
      reflected: false,
      stroke: false,
      radius: 5 * DPR,
      shadow:{
        x: 0,
        y: 0,
        blur: 0
      },
      margin: {
        top: 6 * DPR,
        left: 6 * DPR,
        right: 6 * DPR,
        bottom: 6 * DPR
      },
      linearGradient: {
        topColor: '#6b9c00',
        bottomColor: '#6b9c00'
      }
    },
    ground: {
      thickness: 0,
      reflected: false,
      stroke: false,
      radius: 5 * DPR,
      shadow:{
        x: 0,
        y: 0,
        blur: 0,
      },
      margin: {
        top: 6 * DPR,
        left: 6 * DPR,
        right: 6 * DPR,
        bottom: 6 * DPR
      },
      linearGradient: {
        topColor: '#eeeeee',
        bottomColor: '#eeeeee'
      }
    }
  },
}