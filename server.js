const express = require('express');
const SphericalMercator = require('@mapbox/sphericalmercator');
const pg = require('pg');
// const cors = require('cors');
const fs = require('node:fs/promises');
const path = require('node:path')
require('dotenv').config();

const db = new pg.Client({
    connectionString: process.env.dbstring
});

(async () => {
    await db.connect();
})();

const app = express();

/* app.use(cors({
    origin: 'http://127.0.0.1:5500'
})) */

app.use(express.static('public'));

const mercator = new SphericalMercator({
    size: 256,
    antimeridian: true
});

app.get('/tiles/:z/:x/:y.pbf', async (req, res) => {
    const { z, x, y } = req.params;
    const bbox = mercator.bbox(x, y, z, false);
    const SQL =
        `SELECT ST_AsMVT(q, 'buowl_habitat', 4096, 'geom')
        FROM (
          SELECT
              c."habitat_id",
              ST_AsMVTGeom(
                  geom,
                  ST_MakeEnvelope(${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]}, 4326),
                  4096,
                  256,
                  false
              ) as geom
          FROM buowl_habitat as c
            WHERE ST_Intersects(
                ST_MakeEnvelope(${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]}, 4326),
            c.geom
        )
        ) q
      `
    try {
        const tile = await db.query(SQL);
        res.setHeader('Content-type', 'application/x-protobuf');
        if (tile.rows[0].st_asmvt.length === 0) {
            res.status(204);
        }
        res.send(tile.rows[0].st_asmvt);
    } catch (e) {
        res.status(404).send({
            error: e.toString()
        });
    }
})

app.get('/raster-tiles/:z/:x/:y.png', async (req, res) => {
    const { z, x, y } = req.params;
    console.log(z, x, y);
    try {
        const tile = await fs.readFile(path.join(__dirname, `./natural-earth/${z}/${x}/${y}.png`));
        res.set('Content-Type', 'image/png')
        res.send(tile);
    } catch (e) {
        res.status(404).send({
            error: e.toString()
        })
    }
})

app.get('/test.jpg', async (req, res) => {
    try {
        const tile = await fs.readFile(path.join(__dirname, `./natural-earth/download.jpg`));
        res.set('Content-Type', 'image/jpg');
        res.send(tile)
    } catch (e) {
        res.status(404).send({
            error: e.toString()
        })
    }
})

app.listen(3000, () => {
    console.log('server on');
})
