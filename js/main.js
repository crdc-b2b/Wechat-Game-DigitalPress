import Player from './player/index'
import Enemy from './npc/enemy'
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

    canvas.removeEventListener(
      'touchstart',
      this.touchHandler
    )

    this.bg = new BackGround(ctx)
    this.bar = bar

    this.newStart()


    this.player = new Player(ctx)
    this.gameinfo = new GameInfo()
    this.music = new Music()

    this.bindLoop = this.loop.bind(this)
    this.hasEventBind = false

    // 清除上一局的动画
    window.cancelAnimationFrame(this.aniId);

    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
  }

  newStart() {
    this[__.timer] = null
    this.icons = initIcons;
    this.arrPostion = this.genPositions();
    this.arrIcons = this.genIconNumbers();
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
      pos.y = rnd(TARGET_ICON_HEIGHT / 2, screenHeight - TARGET_ICON_HEIGHT - 50)
      console.log('[x,y] = ' + "[" + pos.x + "," + pos.y + "]")
      while (!this.checkPosOverlap(arrPosition, pos)) {
        pos.x = rnd(TARGET_ICON_WIDTH / 2, screenWidth - TARGET_ICON_WIDTH)
        pos.y = rnd(TARGET_ICON_HEIGHT / 2, screenHeight - TARGET_ICON_HEIGHT - 50)
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
    this.iconsStatus = 1
  }
  
  /**
   * 随着帧数变化的敌机生成逻辑
   * 帧数取模定义成生成的频率
   */
  enemyGenerate() {
    if (databus.frame % 30 === 0) {
      let enemy = databus.pool.getItemByClass('enemy', Enemy)
      enemy.init(6)
      databus.enemys.push(enemy)
    }
  }

  // 全局碰撞检测
  collisionDetection() {
    let that = this

    databus.bullets.forEach((bullet) => {
      for (let i = 0, il = databus.enemys.length; i < il; i++) {
        let enemy = databus.enemys[i]

        if (!enemy.isPlaying && enemy.isCollideWith(bullet)) {
          enemy.playAnimation()
          that.music.playExplosion()

          bullet.visible = false
          databus.score += 1

          break
        }
      }
    })

    for (let i = 0, il = databus.enemys.length; i < il; i++) {
      let enemy = databus.enemys[i]

      if (this.player.isCollideWith(enemy)) {
        databus.gameOver = true

        break
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

    databus.bullets
      .concat(databus.enemys)
      .forEach((item) => {
        item.drawToCanvas(ctx)
      })

    databus.numIcons.forEach( (item) => {
      item.drawToCanvas(ctx)
    })

    databus.bgIcons.forEach( (item) => {
      item.drawToCanvas(ctx)
    })

    this.player.drawToCanvas(ctx)

    databus.animations.forEach((ani) => {
      if (ani.isPlaying) {
        ani.aniRender(ctx)
      }
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

    databus.bullets
      .concat(databus.enemys)
      .forEach((item) => {
        item.update()
      })

    this.enemyGenerate()

    this.collisionDetection()

    if (databus.frame % 20 === 0) {
      this.player.shoot()
      this.music.playShoot()
    }

    if (this.bar.timeout && this.iconsStatus == 1) {
      this.bar.disable();

      databus.numIcons.forEach( (item) => {
        item.visible = true
      })
      databus.bgIcons.forEach( (item) => {
        item.visible = false
      })

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
