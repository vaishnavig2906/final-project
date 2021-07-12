const express = require('express')
const app = express()
const port = process.env.PORT || 8000

app.use(express.static(__dirname));

const Socket = require("websocket").server
const http = require("http")

const server = http.createServer((req, res) => {})

server.listen(process.env.PORT || 3000, function(){
	console.log("Express server on port %d in %s mode", this.address().port, app.settings.env);
});

const webSocket = new Socket({ httpServer: server })

let users = [] //store users from the sender.html

//whenever there is new connection request to the websocket server, request event is called
webSocket.on('request', (req) => {
    const connection = req.accept()

    connection.on('message', (message) => {
        const data = JSON.parse(message.utf8Data)

        const user = findUser(data.username)

        switch(data.type) {
            case "store_user":

                if (user != null) {
                    return
                }

                const newUser = {
                     conn: connection,
                     username: data.username
                }

                users.push(newUser)//newUser gets added to users array
                console.log(newUser.username)
                break
            case "store_offer":
                if (user == null)
                    return
                user.offer = data.offer //attach offer from user to data
                break
            
            case "store_candidate":
                if (user == null) {
                    return
                }
                if (user.candidates == null)
                    user.candidates = []
                
                user.candidates.push(data.candidate)
                break
            case "send_answer":
                if (user == null) {
                    return
                }

                sendData({
                    type: "answer",
                    answer: data.answer
                }, user.conn) //second parameter is the user whom the answer should be sent
                break
            case "send_candidate":
                if (user == null) {
                    return
                }

                sendData({
                    type: "candidate",
                    candidate: data.candidate
                }, user.conn)
                break
            case "join_call":
                if (user == null) {
                    return
                }

                sendData({
                    type: "offer",
                    offer: user.offer
                }, connection)
                
                user.candidates.forEach(candidate => {
                    sendData({
                        type: "candidate",
                        candidate: candidate
                    }, connection)
                })

                break
        }
    })

    //when the connection closes remove that username
    connection.on('close', (reason, description) => {
        users.forEach(user => {
            if (user.conn == connection) {
                users.splice(users.indexOf(user), 1)
                return
            }
        })
    })
})

//sends data to the connection
function sendData(data, conn) {
    conn.send(JSON.stringify(data))
}

//function to find username
function findUser(username) {
    for (let i = 0;i < users.length;i++) {
        if (users[i].username == username)
            return users[i]
    }
}

app.listen(port, () => {
    console.log(`app listening at port :${port}`)
})