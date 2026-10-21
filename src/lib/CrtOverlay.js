// Optional CRT monitor simulation.
//
// A second canvas lies exactly on top of the game canvas. After every frame the
// game picture is copied into a WebGL texture and drawn again with a shader that
// adds screen curvature, scanlines, an RGB shadow mask and a few other effects.
//
// The overlay renders at the real screen resolution (not 320x200), so scanlines
// and the mask stay sharp. It ignores the mouse ("pointer-events: none"), so all
// clicks still reach the game canvas below.
//
// Inspired by CRTFilter by Aka (MIT): https://github.com/Ichiaka/CRTFilter

import Phaser from 'phaser';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../constants.js';

const VERTEX_SHADER = `
    attribute vec2 a_position;
    varying vec2 v_uv;

    void main() {
        // a_position covers the whole canvas from (-1, -1) to (1, 1).
        // Texture coordinates run from (0, 0) top left to (1, 1) bottom right.
        v_uv = vec2(a_position.x + 1.0, 1.0 - a_position.y) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;

const FRAGMENT_SHADER = `
    precision mediump float;

    varying vec2 v_uv;
    uniform sampler2D u_image;
    uniform vec2 u_sourceSize;   // 320 x 200
    uniform float u_time;        // seconds

    const float PI = 3.14159265;
    const float CURVATURE = 0.12;          // how strongly the tube is bent
    const float SCANLINE_STRENGTH = 0.45;  // 0 = no scanlines, 1 = black gaps
    const float MASK_STRENGTH = 0.25;      // darkening of the shadow mask
    const float COLOR_FRINGE = 0.35;       // red/blue shift in source pixels
    const float VIGNETTE_STRENGTH = 0.35;  // darker corners
    const float FLICKER_STRENGTH = 0.012;
    const float BRIGHTNESS = 1.35;         // makes up for scanlines and mask

    // Bends the picture like the glass of a tube. Points further away from the
    // centre are pushed outwards, so the edges of the picture become round and
    // black corners appear. The whole picture stays visible.
    vec2 curve(vec2 uv) {
        vec2 centered = uv - 0.5;
        float distanceSquared = dot(centered, centered);
        return 0.5 + centered * (1.0 + CURVATURE * distanceSquared);
    }

    vec3 sampleWithColorFringe(vec2 uv) {
        vec2 shift = vec2(COLOR_FRINGE / u_sourceSize.x, 0.0);
        float red = texture2D(u_image, uv + shift).r;
        float green = texture2D(u_image, uv).g;
        float blue = texture2D(u_image, uv - shift).b;
        return vec3(red, green, blue);
    }

    // Bright in the middle of every original pixel row, dark between the rows
    float scanline(vec2 uv) {
        float positionInRow = fract(uv.y * u_sourceSize.y);
        float profile = sin(positionInRow * PI);
        return mix(1.0 - SCANLINE_STRENGTH, 1.0, profile);
    }

    // Vertical red, green and blue stripes like an aperture grille
    vec3 shadowMask() {
        float column = mod(floor(gl_FragCoord.x), 3.0);
        vec3 mask = vec3(1.0 - MASK_STRENGTH);
        if (column < 1.0) {
            mask.r = 1.0;
        } else if (column < 2.0) {
            mask.g = 1.0;
        } else {
            mask.b = 1.0;
        }
        return mask;
    }

    float vignette(vec2 uv) {
        vec2 centered = uv - 0.5;
        return 1.0 - VIGNETTE_STRENGTH * dot(centered, centered) * 2.0;
    }

    void main() {
        vec2 uv = curve(v_uv);

        // Outside of the bent picture the tube is black
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
        }

        vec3 color = sampleWithColorFringe(uv);
        color *= scanline(uv);
        color *= shadowMask();
        color *= vignette(uv);
        color *= BRIGHTNESS;
        color *= 1.0 + FLICKER_STRENGTH * sin(u_time * 2.0 * PI * 30.0);

        gl_FragColor = vec4(color, 1.0);
    }
`;

export class CrtOverlay {
    constructor(game) {
        this.game = game;
        this.enabled = false;
        this.smoothing = false;

        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1';
        this.canvas.hidden = true;
        document.body.appendChild(this.canvas);

        this.gl = this.canvas.getContext('webgl');
        if (!this.gl) {
            console.warn('CRT effect not available: WebGL is not supported.');
            return;
        }
        this.setUpWebGL();

        game.events.on(Phaser.Core.Events.POST_RENDER, () => this.render());
    }

    isAvailable() {
        return this.gl !== null;
    }

    setEnabled(enabled) {
        this.enabled = enabled && this.isAvailable();
        this.canvas.hidden = !this.enabled;
    }

    // Sharp or smoothed original pixels, like the "Smooth pixels" setting
    setSmoothing(smoothing) {
        this.smoothing = smoothing;
        if (!this.isAvailable()) {
            return;
        }
        const gl = this.gl;
        const filter = smoothing ? gl.LINEAR : gl.NEAREST;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    }

    setUpWebGL() {
        const gl = this.gl;

        this.program = this.createProgram(VERTEX_SHADER, FRAGMENT_SHADER);
        gl.useProgram(this.program);

        // Two triangles that cover the whole canvas
        const corners = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, corners, gl.STATIC_DRAW);
        const positionLocation = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.setSmoothing(this.smoothing);

        this.timeLocation = gl.getUniformLocation(this.program, 'u_time');
        gl.uniform2f(gl.getUniformLocation(this.program, 'u_sourceSize'), SCREEN_WIDTH, SCREEN_HEIGHT);
    }

    createProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        const program = gl.createProgram();
        gl.attachShader(program, this.createShader(gl.VERTEX_SHADER, vertexSource));
        gl.attachShader(program, this.createShader(gl.FRAGMENT_SHADER, fragmentSource));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`CRT shader could not be linked: ${gl.getProgramInfoLog(program)}`);
        }
        return program;
    }

    createShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(`CRT shader could not be compiled: ${gl.getShaderInfoLog(shader)}`);
        }
        return shader;
    }

    // Keeps the overlay exactly on top of the game canvas, at full device resolution
    matchGameCanvas() {
        const bounds = this.game.canvas.getBoundingClientRect();
        const style = this.canvas.style;
        style.left = `${bounds.left}px`;
        style.top = `${bounds.top}px`;
        style.width = `${bounds.width}px`;
        style.height = `${bounds.height}px`;

        const width = Math.round(bounds.width * window.devicePixelRatio);
        const height = Math.round(bounds.height * window.devicePixelRatio);
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.gl.viewport(0, 0, width, height);
        }
    }

    render() {
        if (!this.enabled) {
            return;
        }
        const gl = this.gl;
        this.matchGameCanvas();

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.game.canvas);
        gl.uniform1f(this.timeLocation, performance.now() / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}
