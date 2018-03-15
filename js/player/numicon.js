/**
 * Created by Yiz56865 on 2018/3/15.
 */
import Sprite   from '../base/sprite'

const NUM_ICON_SRC = 'images/'
const NUM_ICON_WIDTH   = 225
const NUM_ICON_HEIGHT  = 225
export const TARGET_ICON_WIDTH = 80
export const TARGET_ICON_HEIGHT = 80
export const MIN_ICON_NUM = 1
export const MAX_ICON_NUM = 9

//let databus = new DataBus()

export default class NumIcon extends Sprite {
    constructor(num) {
        super(NUM_ICON_SRC + num + '.png', NUM_ICON_WIDTH, NUM_ICON_HEIGHT, 0, 0)
        this.number = num
    }

    init(targetX, targetY) {
        this.targetX = targetX
        this.targetY = targetY
        this.targetW = TARGET_ICON_WIDTH
        this.targetH = TARGET_ICON_HEIGHT
        this.visible = true
    }

    update() {
        /*
        this.y -= this[__.speed]
        // 超出屏幕外回收自身
        if ( this.y < -this.height )
            databus.removeBullets(this)
        */
    }

    drawToCanvas(ctx) {
        if ( !this.visible )
            return

        ctx.drawImage(
            this.img,
            this.x,
            this.y,
            this.width,
            this.height,
            this.targetX,
            this.targetY,
            this.targetW,
            this.targetH
        )
    }
}
