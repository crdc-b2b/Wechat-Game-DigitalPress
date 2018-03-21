import BackGround from './runtime/background'
import ProgressBar from './runtime/progressbar'
import GameInfo from './runtime/gameinfo'
import Music from './runtime/music'
import DataBus from './databus'
import {TARGET_ICON_WIDTH, TARGET_ICON_HEIGHT, MIN_ICON_NUM, MAX_ICON_NUM} from './player/numicon'

const screenWidth  = window.innerWidth
const screenHeight = window.innerHeight

let ctx = canvas.getContext('2d')
let databus = new DataBus()
let bar = new ProgressBar(ctx)
let iconStatus = 0 // 0 - number side
                     // 1 - number side expire, turn to background side
                     // 2 - background side expire, game failed
let initIcons = 4
let maxIcons = 9
let initInterval = 1500

/**
 * 游戏主函数
 */
function rnd(start, end){
  return Math.floor(Math.random() * (end - start) + start)
}

const __ = {
  timer: Symbol('timer'),
}

export default class Main {
  constructor() {
    // 维护当前requestAnimationFrame的id
    this.aniId = 0
    this.restart()
  }

  restart() {
    databus.reset()
    console.log('111')
    canvas.removeEventListener(
      'touchstart',
      this.touchHandler
    )

    canvas.removeEventListener(
        'touchstart',
        this.pressHandler
    )
    console.log('222')
    this.bg = new BackGround(ctx)
    this.bar = bar
    console.log('333')
    this.newStart()
    console.log('444')
    this.gameinfo = new GameInfo()
    this.music = new Music()
    console.log('555')
    this.bindLoop = this.loop.bind(this)
    this.hasEventBind = false
    console.log('666')
    // 清除上一局的动画
    window.cancelAnimationFrame(this.aniId);
    console.log('777')
    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
    console.log('888')
  }

  newStart() {
    this[__.timer] = null
    this.icons = initIcons;
    this.arrPostion = this.genPositions();
    this.arrIcons = this.genIconNumbers();
    this.arrNumbers = this.arrIcons.slice().sort(function(a,b) { return a - b })
    this.arrBgNums = this.genIconNumbers();
    databus.clearNumIcon()
    databus.clearBgIcon()
    databus.fetchNumIconFromPool(this.arrIcons, this.arrPostion)
    databus.fetchBgIconFromPool(this.arrBgNums, this.arrPostion)
    this.iconsStatus = 0
    this.interval = initInterval
    this[__.timer] = setInterval(
        this.iconNumTimerFunc.bind(this),
        this.interval
    )
  }

  genPositions() {
    let arrPosition = [];
    for (let i = 0; i < this.icons; i++) {
      let pos = {};
      pos.x = rnd(TARGET_ICON_WIDTH / 2, screenWidth - TARGET_ICON_WIDTH)
      pos.y = rnd(TARGET_ICON_HEIGHT / 2, screenHeight - TARGET_ICON_HEIGHT - 180)
      console.log('[x,y] = ' + "[" + pos.x + "," + pos.y + "]")
      while (!this.checkPosOverlap(arrPosition, pos)) {
        pos.x = rnd(TARGET_ICON_WIDTH / 2, screenWidth - TARGET_ICON_WIDTH)
        pos.y = rnd(TARGET_ICON_HEIGHT / 2, screenHeight - TARGET_ICON_HEIGHT - 180)
        console.log('[x,y] = ' + "[" + pos.x + "," + pos.y + "]")
      }
      console.log('  push!')
      arrPosition.push(pos)
    }
    return arrPosition;
  }

  checkPosOverlap(arrPos, posB) {
    for (let idx = 0; idx < arrPos.length; idx++) {
      let posA = arrPos[idx];
      let dis = (posA.x - posB.x) * (posA.x - posB.x) + (posA.y - posB.y) * (posA.y - posB.y)
      if (dis < TARGET_ICON_WIDTH * TARGET_ICON_WIDTH ) {
        return false
      }
    }
    return true
  }

  genIconNumbers() {
    let arrIcons = [];
    for (let i = 0; i < this.icons; i++) {
      let icon = rnd(MIN_ICON_NUM - 1, MAX_ICON_NUM  + 1);
      while (!this.checkIconNotConflict(arrIcons, icon) || icon < MIN_ICON_NUM || icon > MAX_ICON_NUM) {
        icon = rnd(MIN_ICON_NUM - 1, MAX_ICON_NUM  + 1);
      }
      arrIcons.push(icon);
    }
    return arrIcons;
  }

  checkIconNotConflict(arrIcons, icon) {
    for (let i = 0; i < arrIcons.length; i++) {
      if (arrIcons[i] === icon) {
        return false
      }
    }
    return true;
  }

  iconNumTimerFunc() {
    databus.numIcons.forEach( (icon) => {
      icon.visible = false
    })
    databus.bgIcons.forEach( (icon) => {
      icon.visible = true;
    })

    clearInterval(this[__.timer])
    this.bar.enable()
    this.pressHandler = this.pressEventHandler.bind(this)
    canvas.addEventListener('touchstart', this.pressHandler)
    this.iconsStatus = 1
  }

  pressEventHandler(e) {
    e.preventDefault()
    if (this.iconsStatus != 1) {
      return
    }

    let x = e.touches[0].clientX
    let y = e.touches[0].clientY
    let pressed = - 1;
    for (let idx = 0; idx < this.arrPostion.length; idx++) {
      let x1 = this.arrPostion[idx].x;
      let y1 = this.arrPostion[idx].y;
      if ( x > x1 && (x < (x1 + TARGET_ICON_WIDTH)) ) {
        if ( y > y1  && (y < (y1 + TARGET_ICON_WIDTH)) ) {
          pressed = idx
          break;
        }
      }
    }

    if (pressed != -1) {
      let ic = this.arrIcons[pressed]
      if (ic === this.arrNumbers[0]) {
        databus.numIcons[pressed].visible = true;
        databus.bgIcons[pressed].visible = false;
        this.arrNumbers.shift()
        this.music.playShoot()

        if (this.arrNumbers.length == 0) {
          console.log('successful!')

          databus.score += 1
          this.iconsStatus = 2
          this.bar.disable();

          initIcons += 1
          if (initIcons > maxIcons) {
            initIcons = maxIcons
            initInterval -= 200
            if (initInterval < 500) {
              initInterval = 500
            }
          }
          let score = databus.score
          this.restart()
          databus.score = score
        }
      } else {
        console.log('failed!')

        this.music.playExplosion()
        initIcons = 4
        initInterval = 1500
        this.bar.disable();
        databus.numIcons.forEach( (item) => {
          item.visible = true
        })
        databus.bgIcons.forEach( (item) => {
          item.visible = false
        })
        this.iconsStatus = 5
        databus.gameOver = true
      }
    }
  }

  // 游戏结束后的触摸事件处理逻辑
  touchEventHandler(e) {
    e.preventDefault()

    let x = e.touches[0].clientX
    let y = e.touches[0].clientY

    let area = this.gameinfo.btnArea

    if (x >= area.startX
      && x <= area.endX
      && y >= area.startY
      && y <= area.endY)
      this.restart()
  }

  /**
   * canvas重绘函数
   * 每一帧重新绘制所有的需要展示的元素
   */
  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    this.bg.render(ctx)
    this.bar.render(ctx)

    databus.numIcons.forEach( (item) => {
      item.drawToCanvas(ctx)
    })

    databus.bgIcons.forEach( (item) => {
      item.drawToCanvas(ctx)
    })

    this.gameinfo.renderGameScore(ctx, databus.score)

    // 游戏结束停止帧循环
    if (databus.gameOver) {
      this.gameinfo.renderGameOver(ctx, databus.score)

      if (!this.hasEventBind) {
        this.hasEventBind = true
        this.touchHandler = this.touchEventHandler.bind(this)
        canvas.addEventListener('touchstart', this.touchHandler)
      }
    }
  }

  // 游戏逻辑更新主函数
  update() {
    if (databus.gameOver)
      return;

    this.bg.update()
    this.bar.update()

    if (this.bar.timeout && this.iconsStatus == 1) {
      this.bar.disable();

      databus.numIcons.forEach( (item) => {
        item.visible = true
      })
      databus.bgIcons.forEach( (item) => {
        item.visible = false
      })
      this.iconsStatus = 10
      databus.gameOver = true
    }
  }

  // 实现游戏帧循环
  loop() {
    databus.frame++

    this.update()
    this.render()

    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
  }
}
