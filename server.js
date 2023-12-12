const express = require('express');
const SphericalMercator = require('@mapbox/sphericalmercator');
const pg = require('pg');
const cors = require('cors');
require('dotenv').config();

const db = new pg.Client({
    connectionString: process.env.dbstring
});

(async () => {
    await db.connect();
})();

const app = express();

app.use(cors({
    origin: 'http://127.0.0.1:5500'
}))

const mercator = new SphericalMercator({
    size: 256,
    antimeridian: true
});

app.get('/tiles/:z/:x/:y.pbf', async (req, res) => {
    const { z, x, y } = req.params;
    const bbox = mercator.bbox(x, y, z, false);
    const SQL = 
        `SELECT ST_AsMVT(q, 'denver_parcels', 4096, 'geom')
        FROM (
          SELECT
              c."PARCEL_LID",
              ST_AsMVTGeom(
                  geom,
                  ST_MakeEnvelope(${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]}, 4326),
                  4096,
                  256,
                  false
              ) as geom
          FROM denver_parcels as c
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

app.listen(3000, () => {
    console.log('server on');
})