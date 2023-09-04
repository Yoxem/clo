var hb = require('harfbuzzjs/hbjs');
var fs = require('fs');

export function harfbuzzTest(inputString: string){
    WebAssembly.instantiate(fs.readFileSync(__dirname+"/../3rdparty/harfbuzzjs/hb.wasm"))
        .then(function (wsm) {

        hb = hb(wsm.instance);


        let fontdata = fs.readFileSync("/usr/share/fonts/truetype/freefont/FreeSerif.ttf");

        //hbjs(fontdata.instance);

        //console.log(a);

            var blob = hb.createBlob(fontdata); // Load the font data into something Harfbuzz can use
            var face = hb.createFace(blob, 0);  // Select the first font in the file (there's normally only one!)
            var font = hb.createFont(face);     // Create a Harfbuzz font object from the face
            var buffer = hb.createBuffer();     // Make a buffer to hold some text
            buffer.addText(inputString);              // Fill it with some stuff
            buffer.guessSegmentProperties();    // Set script, language and direction
            hb.shape(font, buffer);             // Shape the text, determining glyph IDs and positions
            var output : Array<{g : number,
                                ax : number,
                                dx : number,
                                dy : number}> = buffer.json();

            // Enumerate the glyphs
            console.log("id\tax\tdx\tdy");

            var xCursor = 0;
            var yCursor = 0;
            for (var glyph of output) {
                var glyphId = glyph.g;
                var xAdvance = glyph.ax;
                var xDisplacement = glyph.dx;
                var yDisplacement = glyph.dy;

                var svgPath = font.glyphToPath(glyphId);

                console.log(glyphId + "\t" + xAdvance + "\t" + xDisplacement + "\t" + yDisplacement);

                // You need to supply this bit
                //drawAGlyph(svgPath, xCursor + xDisplacement, yDisplacement);

                // xCursor += xAdvance;
            }

            // Release memory
            buffer.destroy();
            font.destroy();
            face.destroy();
            blob.destroy(); 
    });
}