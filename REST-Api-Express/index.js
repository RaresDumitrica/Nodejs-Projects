const express = require('express');
const app = express();
const PORT = 8080;

/* Middleware that converts express requests to JSON */
app.use(express.json());

app.listen(
    PORT,
    () => console.log(`It kinda works, I guess, on htpp://localhost:${PORT}`)
);

app.get('/shirt', (req, res) => {
    res.status(200).send({
        thirt: 'puma',
        size: 'medium',
    })
});

app.post('/shirt/:id', (req, res) => {
    const { id } = req.params;
    const { logo } = req.body;

    if(!logo) {
        res.status(418).send({ message: 'The request needs a logo! '});
    } else {
        res.send({
            thirt: `T-shirt with your ${logo} and ID of ${id}`,
        })
    }

});