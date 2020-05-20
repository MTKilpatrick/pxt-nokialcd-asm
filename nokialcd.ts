enum Plots {
    //% block="line"
    Line = 0,
    //% block="box"
    Box = 1,
    //% block="rectangle"
    Rect = 2
}
enum Scrolls {
    //% block="Up"
    Up = 0,
    //% block="Right"
    Right = 1,
    //% block="Down"
    Down = 2,
    //% block="Left"
    Left = 3
}
enum LCDDisplayModes {
    //% block="Normal"
    Normal = 0,
    //% block="Blank"
    Blank = 1,
    //% block="All on"
    AllOn = 2,
    //% block="Inverse"
    Inverse = 3
}

//% weight=100 color=#0fbc11
namespace nokialcd {

    const FILL_X = hex`fffefcf8f0e0c08000`
    const FILL_B = hex`0103070f1f3f7fffff`
    const TWOS = hex`0102040810204080`
    let bytearray: Buffer = initBuffer()
    let cursorx = 0
    let cursory = 0

    const LCD_CE: DigitalPin = DigitalPin.P12
    const LCD_RST: DigitalPin = DigitalPin.P8
    const LCD_DC: DigitalPin = DigitalPin.P16
    const LCD_CLK: DigitalPin = DigitalPin.P13
    const LCD_MOSI: DigitalPin = DigitalPin.P15
    const LCD_CMD  =    0
    const LCD_DAT  =    1
    let lcdDE: number = 0

    export class Cursor {
        private _x: number
        private _y: number
        private _char: number
        private _invert: boolean

        constructor() {
            this._x = 0
            this._y = 0
            this._invert = false
        }
        public getX(): number {
            return this._x
        }
        public getY(): number {
            return this._y
        }
        public getChar(): number {
            return this._char
        }
        public setChar(c: number) {
            return
        }
    }

    export function fill(b: number) {
        bytearray.fill(b)
        show()
    }
    
        //% shim=nokialcd::getBuffer
    function getBuffer() : Buffer {
        return pins.createBuffer(504)
    }

    //% shim=nokialcd::initBuffer
    function initBuffer(): Buffer {
        return pins.createBuffer(504)
    }
   
    //% shim=nokialcd::writeCharToBuf
    function writeCharToBuf(char: number, x: number, y: number) {
        return
    }

    //% block="show char %char at x% %y"
    //% blockId=nokialcd_show_char
    export function showChar(charNum: number) {
        if (cursorx > 11 ) {
            cursorx = 0
            cursory++
        }
        writeCharToBuf(charNum, cursorx, cursory)
        cursorx += 1
    }

    function writeSPIByte(b: number) : void {
        let buf = pins.createBuffer(1)
        buf[0] = b
        pins.digitalWritePin(LCD_CE, 0)
        nokiadriverasm.sendSPIBuffer(buf, DigitalPin.P15, DigitalPin.P13)
        pins.digitalWritePin(LCD_CE, 1)
        return
    }
    
    function setYAddr(y: number) : void {
        pins.digitalWritePin(LCD_DC,LCD_CMD)
        writeSPIByte(0x40 + y)
        pins.digitalWritePin(LCD_DC,LCD_DAT)
    }

    function setXAddr(x: number): void {
        pins.digitalWritePin(LCD_DC,LCD_CMD)
        writeSPIByte(0x80 + x)
        pins.digitalWritePin(LCD_DC,LCD_DAT)
    }


    function lcdDisplayMode(mode: number) : void {
        lcdDE = ((mode & 2) << 1) + (mode & 1)
        pins.digitalWritePin(LCD_DC,LCD_CMD)
        writeSPIByte(0x08 | lcdDE)
        pins.digitalWritePin(LCD_DC,LCD_DAT)
    }

    function writeFunctionSet(v: number, h: number) {
        pins.digitalWritePin(LCD_DC,LCD_CMD)
        writeSPIByte(0x20 | (v << 1) | (h & 1))
        pins.digitalWritePin(LCD_DC,LCD_DAT)
    }  
     
    function lcdExtendedFunctions(temp: number, bias: number, vop: number) {
        pins.digitalWritePin(LCD_DC,LCD_CMD)
        writeSPIByte(0x21)
        writeSPIByte(0x04 | (0x03 & temp))
        writeSPIByte(0x10 | (0x07 & bias))
        writeSPIByte(0x80 | (0x7f & vop))
        writeSPIByte(0x20)
        pins.digitalWritePin(LCD_DC,LCD_DAT)
    }

    
    function setSPI(frequency: number) : void {
        pins.digitalWritePin(LCD_CLK, 0)
        pins.digitalWritePin(LCD_MOSI, 0)
        pins.digitalWritePin(LCD_RST, 1)
        pins.digitalWritePin(LCD_CE,1)
        pins.digitalWritePin(LCD_DC, LCD_DAT)
        lcdDE = 0
        basic.pause(500)
        pins.digitalWritePin(LCD_RST,0)
        basic.pause(500)
        pins.digitalWritePin(LCD_RST,1)
        basic.pause(500)
        writeFunctionSet(0, 1)
        lcdExtendedFunctions(0, 3, 63)
        writeFunctionSet(0, 0)
        lcdDisplayMode(2)
        setXAddr(0)
        setYAddr(0)
        setState(true)
        clear()
    }



    //% block="reset LCD display"
    //% blockId=nokialcd_init
    export function init(): void {
        setSPI(4000000)
    }

    
    //% block="update LCD display"
    //% blocId=nokialcd_show
    export function show(): void {
        let mybuf: Buffer = getBuffer()
        pins.digitalWritePin(DigitalPin.P12, 0)
        nokiadriverasm.sendSPIBuffer(mybuf, DigitalPin.P15, DigitalPin.P13)
        pins.digitalWritePin(DigitalPin.P12, 1)
    }

    //% shim=TD_ID
    //% blockId="dir_conv" block="%dir"
    //% blockHidden=true
    export function dirs(dir: Scrolls): number {
        return (dir || 0)
    }

    //% shim=TD_ID
    //% blockId="displaymode_conv" block="%displaymode"
    //% blockHidden=true
    export function lcddm(displaymode: LCDDisplayModes): number {
        return (displaymode || 0)
    }

    //% shim=TD_ID
    //% blockId="plot_conv" block="%plot"
    //% blockHidden=true
    export function pl(plot: Plots): number {
        return (plot || 0)
    }

    //% blockId=nokialcd_pixel
    //% block="pixel at x %x y %y %state"
    //% state.shadow="toggleOnOff" state.defl=true
    //% inlineInputMode=inline
    //% shim=nokialcd::pixel
    export function pixel(x: number, y: number, state: boolean): void {
        return
    }

    //% shim=nokialcd::scrollRow
    //% block="scroll screen direction %direction=dir_conv || step %step"
    //% expandableArgumentMode="toggle"
    //% step.min=0 step.defl=1
    export function scrollRow(row: number, direction: number, step: number = 1): void {
        return
    }

    //% shim=nokialcd::scrollUpRow
    export function scrollUpRow() {
        return
    }
    //% shim=nokialcd::scrollDownRow
    export function scrollDownRow() {
        return
    }

    //% shim=nokialcd::scrollScreen
    //% block="scroll direction %direction=dir_conv || step %step"
    //% expandableArgumentMode="toggle"
    //% step.min=0 step.defl=1
    export function scrollScreen(direction: number, step: number = 1): void {
        return
    }

    //% blockId=nokialcd_display_row
    //% block="display row %row"
    export function displayRow(row: number): void {
    }

    //% shim=nokialcd::setState
    function setState(s: boolean) {
        return
    }

    //% shim=nokialcd::pLine
    function pLine(x0: number, y0: number, x1: number, y1: number): void {
        return
    }
    //% shim=nokialcd::pBox
    function pBox(x0: number, y0: number, x1: number, y1: number): void {
        return
    }
    //% shim=nokialcd::vLine
    function vLine(x: number, y0: number, y1: number): void {
        return
    }

    //% shim=nokialcd::hLine
    function hLine(x0: number, x1: number, y: number): void {
        return
    }

    //% blockId=nokialcd_plot
    //% block="draw %plot=plot_conv from x %x0 y %y0 to x %x1 y %y1 $state"
    //% state.shadow="toggleOnOff" state.defl=true
    //% inlineInputMode=inline
    export function plot(plot: Plots, x0: number, y0: number, x1: number, y1: number, state: boolean): void {
        setState(state)
        switch (plot) {
            case 0: { pLine(x0, y0, x1, y1); break }
            case 1: { pBox(x0, y0, x1, y1); break }
            case 2: {
                hLine(x0, x1, y0)
                hLine(x0, x1, y1)
                vLine(x0, y0, y1)
                vLine(x1, y0, y1)
                break
            }
            default: pLine(x0, y0, x1, y1)
        }
    }



    //% blockId=nokialcd_clear
    //% block="clear screen"
    //% shim=nokialcd::clear
    export function clear(): void {
        return
    }
}
nokialcd.init()