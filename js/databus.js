import Pool from './base/pool'
import NumIcon from './player/numicon'
import BgIcon from './player/bgicon'
import {MIN_ICON_NUM, MAX_ICON_NUM} from './player/numicon'

let instance

/**
 * 全局状态管理器
 */
export default class DataBus {
  constructor() {
    if ( instance )
      return instance

    instance = this

    this.pool = new Pool()
    this.produce_numIcon(MIN_ICON_NUM, MAX_ICON_NUM)
    this.produce_bgIcon(MIN_ICON_NUM, MAX_ICON_NUM)

    this.reset()
  }

  reset() {
    this.frame      = 0
    this.score      = 0
    this.bullets    = []
    this.enemys     = []
    this.animations = []
    this.gameOver   = false
    this.clearNumIcon()
    this.clearBgIcon()
  }

  produce_numIcon(from, to) {
    for (let idx = from; idx < to + 1; idx++) {
      let numIcon = new NumIcon(idx);
      this.pool.recover('numIcon', numIcon);
    }
  }

  produce_bgIcon(from, to) {
    for (let idx = from; idx < to + 1; idx++) {
      let bgIcon = new BgIcon(idx);
      this.pool.recover('bgIcon', bgIcon);
    }
  }

  clearNumIcon() {
    this.numIcons = []
  }

  clearBgIcon() {
    this.bgIcons = []
  }

  fetchNumIconFromPool(arrNumIcon, arrPosition) {
    for (let idx = 0; idx < arrNumIcon.length; idx++) {
      let numIcon = this.pool.fetchItemByNum('numIcon', arrNumIcon[idx])
      numIcon.init(arrPosition[idx].x, arrPosition[idx].y)
      this.numIcons.push(numIcon);
      console.log('number: ' + numIcon.number + " [x,y] = " + "[" + numIcon.targetX + "," + numIcon.targetY + "]")
    }
  }

  fetchBgIconFromPool(arrBgIcon, arrPosition) {
    for (let idx = 0; idx < arrBgIcon.length; idx++) {
      let bgIcon = this.pool.fetchItemByNum('bgIcon', arrBgIcon[idx])
      bgIcon.init(arrPosition[idx].x, arrPosition[idx].y)
      this.bgIcons.push(bgIcon);
      console.log('bg: ' + bgIcon.number + " [x,y] = " + "[" + bgIcon.targetX + "," + bgIcon.targetY + "]")
    }
  }
  
  /**
   * 回收敌人，进入对象池
   * 此后不进入帧循环
   */
  removeEnemey(enemy) {
    let temp = this.enemys.shift()

    temp.visible = false

    this.pool.recover('enemy', enemy)
  }

  /**
   * 回收子弹，进入对象池
   * 此后不进入帧循环
   */
  removeBullets(bullet) {
    let temp = this.bullets.shift()

    temp.visible = false

    this.pool.recover('bullet', bullet)
  }
}
