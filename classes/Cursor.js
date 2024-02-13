export default class Cursor {
    constructor() {
        this.x = '-500px';
        this.y = '-500px';
        this.isHovered = false;
        this.isMouseDown = false;
    }

    /**
     * Set the cursor position
     * @param {*} x
     * @param {*} y 
     */
    move(x, y) {
        this.x += x;
        this.y += y;
    }

    /**
     * Reset the cursor position
     */
    reset() {
        this.x = '-500px';
        this.y = '-500px';
    }

    hover() {
        this.isHovered = true;
    }

    unHover() {
        this.isHovered = false;
    }

    mouseDown() {
        this.isMouseDown = true;
    }

    mouseUp() {
        this.isMouseDown = false;
    }

    handleMouseMove(event) {
        this.x = event.pageX + 'px';
        this.y = event.pageY + 'px';
    }
}