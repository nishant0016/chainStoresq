let express =require("express");
let app = express();
app.use(express.json());
app.use(function (req,res,next){
    res.header("Access-Control-Allow-Origin","*");
    res.header(
        "Access-Control-Allow-Methods",
        "GET,POST,OPTIONS,PUT,PATCH,DELETE,HEAD"
    );
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With,Content-Type,Accept"
    );
    next();
})
var port=process.env.PORT||2410;
app.listen(port,()=>console.log(`Node app listening on port ${port}!`));

const {Client}=require("pg");

const client=new Client({
    user:"postgres",
    password:"7037700!!4nN",
    database:"postgres",
    port:5432,
    host:"db.fnmbkbheapxlvopfeiic.supabase.co",

    ssl:{rejectUnauthorized:false},
});

client.connect(function(res,error){
    console.log("Connected!!!");
});

app.get("/shops",function(req,res){
    let sql="SELECT * FROM shops";
    client.query(sql,function(err,result){
        if (err) res.status(404).send(err);
        else res.send(result.rows);
    })
});
app.post("/shops", function(req, res) {
    let body = req.body;
    console.log("inside post");
    let arr = [body.name, body.rent];
    let sql = "INSERT INTO shops (name, rent) VALUES ($1, $2)";
    client.query(sql, arr, function(err, result) { 
        if (err) {
            console.log(err);
            res.status(404).send(err);
        } else {
            let sql1 = "SELECT * FROM shops WHERE name = $1";
            client.query(sql1, [body.name], function(err1, result1) {
                if (err1) {
                    console.log(err1);
                    res.status(404).send(err1);
                } else {
                    res.send(result1.rows);
                }
            });
        }
    });
});

app.get("/products",function(req,res){
    let sql="SELECT * FROM products";
    client.query(sql,function(err,result){
        if (err) res.status(404).send(err);
        else res.send(result.rows);
    })
});

app.get("/shopsList",function(req,res){
    let sql="SELECT * FROM shops";
    client.query(sql,function(err,result){
        if (err) res.status(404).send(err);
        else {
            let obj=result.rows;
            let list = obj.reduce((acc, curr) => {
                return acc.concat({ shopid: curr.shopid, name: curr.name });
            }, []);
            res.send(list);
        }
    })
})

app.get("/productsList",function(req,res){
    let sql="SELECT * FROM products";
    client.query(sql,function(err,result){
        if (err) res.status(404).send(err);
        else {
            let obj=result.rows;
            let list = obj.reduce((acc, curr) => {
                return acc.concat({ productid: curr.productid, productname: curr.productname });
            }, []);
            res.send(list);
        }
    })
});

app.get("/products/:id",function(req,res){
    let id=req.params.id;
    let params=[id]
    let sql="SELECT * FROM products WHERE productId=$1";
    client.query(sql,params,function(err,result){
        if (err){
            console.log(err);
            res.status(404).send(err);}
        else res.send(result.rows);
    })
});

app.post("/products", function(req, res) {
    let body = req.body;
    console.log("inside post");
    let arr = [body.productName,body.category,body.description];
    let sql = "INSERT INTO products (productName,category,description) VALUES ($1, $2,$3)";
    client.query(sql, arr, function(err, result) { 
        if (err) {
            console.log(err);
            res.status(404).send(err);
        } else {
           res.send("Succesfully inserted");
        }
    });
});

app.put("/products/:id",function(req,res){
    let body = req.body;
    let id= req.params.id;
    console.log("inside post");
    let arr = [body.productName,body.category,body.description,id];
    let sql = "UPDATE products SET productName=$1,category=$2,description=$3 WHERE productid=$4" ;
    client.query(sql, arr, function(err, result) { 
        if (err) {
            console.log(err);
            res.status(404).send(err);
        } else {
           res.send("Succesfully inserted");
        }
    });
})

app.get("/purchases",function (req,res){
    const shop = +req.query.shop;
    let product = req.query.product;
    const sort = req.query.sort;
    let sql="SELECT * FROM purchases";
    client.query(sql,function(err,result){
        if (err) res.status(404).send(err);
        else {
            let purchases=result.rows;
            if (shop) {
                purchases = purchases.filter((purchase) => purchase.shopid === shop);
            }
            if (product) {
                product=product.split(',');
                purchases = purchases.filter((purchase) => product.find(pd1=>pd1==purchase.productid));
            }
            
            if (sort) {
                const sortOptions = sort.split(",");
                sortOptions.forEach((option) => {
                    switch (option) {
                        case "QtyAsc":
                            purchases.sort((a, b) => a.quantity - b.quantity);
                            break;
                        case "QtyDesc":
                            purchases.sort((a, b) => b.quantity - a.quantity);
                            break;
                        case "ValueAsc":
                            purchases.sort((a, b) => a.price * a.quantity - b.price * b.quantity);
                            break;
                        case "ValueDesc":
                            purchases.sort((a, b) => b.price * b.quantity - a.price * a.quantity);
                            break;
                        default:
                            break;
                    }
                });
            }
            res.send(purchases);
        }
    })
})

app.get("/purchases/shops/:id", function(req, res) {
    const shopId = req.params.id;
    let sql = "SELECT * FROM purchases WHERE shopid = $1";
    client.query(sql, [shopId], function(err, result) {
        if (err) {
            console.log(err);
            res.status(404).send(err);
        } else {
            res.send(result.rows);
        }
    });
});

app.get("/purchases/products/:id", function(req, res) {
    const productId = req.params.id;
    let sql = "SELECT * FROM purchases WHERE productid = $1";
    client.query(sql, [productId], function(err, result) {
        if (err) {
            console.log(err);
            res.status(404).send(err);
        } else {
            res.send(result.rows);
        }
    });
});

app.get("/totalPurchase/shop/:id", function(req, res) {
    const shopId = req.params.id;
    let sql = "SELECT productid, SUM(quantity) AS total_purchase FROM purchases WHERE shopid = $1 GROUP BY productid";
    client.query(sql, [shopId], function(err, result) {
        if (err) {
            console.log(err);
            res.status(404).send(err);
        } else {
            const productWiseTotalPurchase = result.rows.reduce((acc, row) => {
                acc[row.productid] = row.total_purchase;
                return acc;
            }, {});
            res.send(productWiseTotalPurchase);
        }
    });
});

app.get("/totalPurchase/product/:id", function(req, res) {
    const productId = req.params.id;
    let sql = "SELECT shopid, SUM(quantity) AS total_purchase FROM purchases WHERE productid = $1 GROUP BY shopid";
    client.query(sql, [productId], function(err, result) {
        if (err) {
            console.log(err);
            res.status(404).send(err);
        } else {
            const shopWiseTotalPurchase = result.rows.reduce((acc, row) => {
                acc[row.shopid] = row.total_purchase;
                return acc;
            }, {});
            res.send(shopWiseTotalPurchase);
        }
    });
});

app.post("/purchases", function(req, res) {
    let body = req.body;
    let arr = [body.shopId, body.productid, body.quantity, body.price];
    let sql = "INSERT INTO purchases (shopid, productid, quantity, price) VALUES ($1, $2, $3, $4)";
    client.query(sql, arr, function(err, result) { 
        if (err) {
            console.log(err);
            res.status(404).send(err);
        } else {
            res.send("Successfully inserted");
        }
    });
});
