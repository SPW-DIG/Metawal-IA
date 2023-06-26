const fs = require("fs");
const {Image} = require('ImageScript');

const profileSvg$ = fs.promises.readFile('./uml_diagram_profile.svg').then(b => b.toString())

profileSvg$.then(profileSvg => {
    const image = new Image(1000, 700);
    Image.renderSVG(profileSvg).then(img => {
        return img.encode(1);
    }).then(encoded => {
        fs.promises.writeFile('./uml_diagram_profile.png', encoded);
    });
})

