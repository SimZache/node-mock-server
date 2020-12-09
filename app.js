var express = require('express')
var app = express()
var fs = require('fs')
var url = require('url')
var bodyParser = require("body-parser");
var randomName = require("chinese-random-name");
var UUID = require('uuid')

app.use(express.static(__dirname + "/views", { index: "index.html" }));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));

var sparams = {
    "id": UUID.v1(),
    "name": randomName.generate()
}

// 写入json文件
function writeJson(params) {
    return new Promise((resolve, reject) => {
        // 先读取json文件
        fs.readFile('./mock/person.json', function (err, data) {
            if (err) {
                reject(err)
                return console.error(err);
            }
            // 将二进制的数据转换为字符串
            var person = data.toString();
            //将字符串转换为json对象
            person = JSON.parse(person);
            person.data.push(params);
            person.total = person.data.length;
            // 因为nodejs的写入文件只认识字符串或者二进制数，所以把json对象转换成字符串重新写入json文件中
            var str = JSON.stringify(person);
            fs.writeFile('./mock/person.json', str, function (err) {
                if (err) {
                    console.error(err);
                }
                resolve()
                console.log('----------新增成功-------------');
            })
        })
    })
}
// writeJson(sparams)


// 删除json文件中的选项
function deleteJson(id) {
    return new Promise((resolve, reject) => {
        fs.readFile('./mock/person.json', function (err, data) {
            if (err) {
                reject(err)
                return console.error(err);
            }
            var person = data.toString();
            person = JSON.parse(person);
            for (var i = 0; i < person.data.length; i++) {
                if (id == person.data[i].id) {
                    person.data.splice(i, 1);
                }
            }
            person.total = person.data.length;
            var str = JSON.stringify(person);
            // 把现有数据写进json
            fs.writeFile('./mock/person.json', str, function (err) {
                if (err) {
                    console.error(err);
                }
                resolve()
                console.log("----------删除成功------------");
            })
        })
    })
}
// deleteJson(5);
function changeJson(params) {
    let {id, ...rest} = params
    return new Promise((resolve, reject) => {
        fs.readFile('./mock/person.json', function (err, data) {
            if (err) {
                reject(err)
                console.error(err);
            }
            var person = data.toString();
            person = JSON.parse(person);
            var index = -1
            // 读取数据进行修改
            for (var i = 0; i < person.data.length; i++) {
                if (id == person.data[i].id) {
                    index = i
                    for (var key in person.data[i]) {
                        if (key == 'id') continue
                        if (person.data[i][key]) {
                            person.data[i][key] = key == 'name' ? randomName.generate() : rest[key];
                        }
                    }
                }
            }
            person.total = person.data.length;
            var str = JSON.stringify(person);
            fs.writeFile('./mock/person.json', str, function (err) {
                if (err) {
                    console.error(err);
                }
                resolve(person.data[index])
                console.log('----------修改成功----------', person, person.data[index]);
            })
        })
    })
}
// changeJson(3, params)


function pagination(page, count = 5) {
    return new Promise((resolve, reject) => {
        // page为页数从1开始，count为每页多少条数据
        fs.readFile('./mock/person.json', function (err, data) {
            if (err) {
                console.error(err);
                reject(err)
            }
            var person = data.toString();
            person = JSON.parse(person);
            var length = person.data.length;
            var pagePerson = person.data.slice(count * (page - 1), page * count);
            console.log('--------------查询成功----------');
            console.log(pagePerson);
            resolve(pagePerson)
        })
    })
}
// pagination(1, 5);

app.get('/', (req, res) => {
    console.log(url.parse(req.url), '333')
    res.status(200)
    res.json({ name: 22 })
})
app.get('/list', async (req, res) => {
    let querys = url.parse(req.url, true).query
    let page = querys.page
    let count = querys.count
    const data = await pagination(page, count)
    res.status(200).json(data)
})
app.post('/add', async (req, res) => {
    console.log(req.body)
    let data = {
        "id": UUID.v1(),
        "name": randomName.generate()
    }
    await writeJson(data)
    res.status(200).json({ code: 0, msg: '新增成功', })
})
app.post('/edit', async (req, res) => {
    console.log(req.body)
    let body = req.body
    let data = await changeJson(body)
    res.status(200).json({ code: 0, msg: '修改成功', ...data })
})
app.post('/delete', async (req, res) => {
    console.log(req.body)
    let id = req.body.id
    await deleteJson(id)
    res.status(200).json({ code: 0, msg: '删除成功'})
})
const server = app.listen('3000', function () {
    const host = server.address().address
    const port = server.address().port
    console.log('Listen at http://%s:%s', host, port)
})

