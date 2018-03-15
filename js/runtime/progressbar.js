/**
 * Created by Yiz56865 on 2018/3/14.
 */

import Sprite from '../base/sprite'
import DataBus from '../databus'

const screenWidth  = window.innerWidth
const screenHeight = window.innerHeight

const BG_IMG_SRC   = 'images/greenbar.png'
const BG_WIDTH     = 274
const BG_HEIGHT    = 89

let databus = new DataBus()
/**
 * 游戏背景类
 * 提供update和render函数实现无限滚动的背景功能
 */
export default class ProgressBar extends Sprite {
    constructor(ctx) {

        super(BG_IMG_SRC, BG_WIDTH, BG_HEIGHT)
        this.render(ctx)
        this.disable();
    }

    enable() {
        this.elapse = 0
        this.timeout = false;
    }

    disable() {
        this.elapse = screenWidth - 20
        this.timeout = true;
    }

    update() {
        if (databus.frame % 20 === 0 && !this.timeout) {
            this.elapse += screenWidth / 10;
            if (this.elapse > screenWidth - 20) {
                this.elapse = screenWidth - 20;
                this.timeout = true;
            }
        }
     }

    /**
     * 背景图重绘函数
     * 绘制两张图片，两张图片大小和屏幕一致
     * 第一张漏出高度为top部分，其余的隐藏在屏幕上面
     * 第二张补全除了top高度之外的部分，其余的隐藏在屏幕下面
     */
    render(ctx) {
        ctx.drawImage(
            this.img,
            0,
            0,
            this.width,
            this.height,
            10,
            screenHeight - 30,
            screenWidth - 20 - this.elapse,
            20
        )
    }
}
