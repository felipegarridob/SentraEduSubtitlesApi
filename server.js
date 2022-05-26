const express = require('express');
const app = require('./app');
var port = process.env.PORT || 3525;


app.listen(port, () => {
    console.log(`Server running in http://localhost:${port}`);
});

/* app.get('/transformSrtToVtt', function (req, res) {

    console.log(req.body);
    res.status(200).send({
        message: 'Success!'
    });
});
 */


