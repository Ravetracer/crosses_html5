// A number in the side panel of the game, drawn with the digits from field.pcx
// (write_number in crosses.pas).

import Phaser from 'phaser';

const DIGIT_GAP = 2;

export class PanelNumber extends Phaser.GameObjects.Container {
    constructor(scene, { x, y }) {
        super(scene, x, y);
        scene.add.existing(this);
    }

    setValue(value) {
        this.removeAll(true);

        let x = 0;
        for (const digit of String(value)) {
            const image = this.scene.add.image(x, 0, 'field', `digit-${digit}`).setOrigin(0, 0);
            this.add(image);
            x += image.width + DIGIT_GAP;
        }
        return this;
    }
}
