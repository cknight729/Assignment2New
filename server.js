const express = require('express');
const app = express();

const CryptoJS = require("crypto-js");
const qs = require('querystring');

const fs = require('fs');
const user_data_file = (__dirname + '/user_data.json');
const user_data_content = fs.readFileSync(user_data_file, 'utf-8');

const data = JSON.parse(user_data_content);

const session = require('express-session'); 
const products = require(__dirname + '/product_data.json');

function isNonNegInt(q, returnErrors = false) {
    errors = []; //we assume no errors at first
    if (q == '') { 
        q = 0;
    }
    else {
        if (Number(q) != q) errors.push('That is not a number!'); //Checks if it is a number or not
        if (q < 0) errors.push('That is a negative value!'); //CHecks if it is a negative number or not
        if (parseInt(q) != q) errors.push('That is not an integer!'); //Checks if its an integer or not
    }
    return returnErrors ? errors : (errors.length == 0);
}

app.use(express.urlencoded({extended:true}));
app.use(session({secret: "MySecretKey", resave: true, saveUninitialized: true}));

// service to provide current product info (turns JS to JSON)
app.get('/product_data.js', function (request, response, next) {
    response.type('js')
    const prodstring = `const products = ${JSON.stringify(products)};`;
    response.send(prodstring);
});

//monitor all requests
app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path + ' with qs' + JSON.stringify(request.query));
    if (typeof request.session.cart == 'undefined') {request.session.cart = {}; }
    next();
});


app.get("/add_to_cart", function (request, response){
    let id = request.body.hid_id_rackets;
    request.session.cart[id] = request.body.racket_quan;
    console.log(request.session.cart[id]);
    id = request.body.hid_id_balls + 10;
    request.session.cart[id] = request.body.ball_quan;

    let par = "30" + request.session.cart[id];
    for (let i = 0; i < 10; i++) {
        if (request.session.cart[i] > 0){
            if (par == ""){
                par += i + "=" + request.session.cart[i];
            }
            par += "&" + i + "=" + request.session.cart[i];
        }
    }

    response.redirect('./cart.html?' + par);
});

app.get("/display_cart", function(request, response){
    for (let i = 0; i < 10; i++) {
        if (request.session.cart[i] > 0){
            
        }
    }
    response.redirect('./cart.html');
});

//Assignment 1 | IR 2,3,4
//code borrowed from Lab 12 info_server_Ex2a.js
app.post('/purchase', function (request, response) {
    console.log(request.body);
    let errors = {}; //we assume no errors
    let hasquantities = false;
    for (let i in products) {
        let qty = request.body[`quantity${i}`];

        if (qty > 0) {
            hasquantities = true;
        }

        if (isNonNegInt(qty, false) === false) {
            errors[`error_quantity${i}`] = isNonNegInt(qty, true).join(' ');
        }
        //checks and displays error message
        if (qty > products[i].quantity_available) {
            errors[`error_quantity${i}`] = `We only have ${products[i].quantity_available} of these. Please enter an amount we have in stock!`;
        }
    }

    if (hasquantities === false) {
        errors['noselectionserror'] = 'You did not select anything. Please select something to continue!'
    }

    const params = new URLSearchParams(request.body);
    console.log(params.toString());

    if (Object.entries(errors).length === 0) {

        for (let i in products) { //Assigntment 1 | IR 1
            products[i].quantity_available -= Number(request.body[`quantity${i}`]);
        }
        response.redirect('./cart.html?' + params.toString());
    }

    else {
        const errorsparams = new URLSearchParams(errors);
        response.redirect('./index.html?' + params.toString() + '&' + errorsparams.toString());
    }
});


let user_data = {};
//let user_data_file = (__dirname + '/user_data.json'); //potential delete


app.post('/login_form', function (request, response) {
    let login_errors = {};
    let user_found = false;
    let password_found = false;
    let username_input = request.body.email.toLowerCase();
    let password_input = request.body.password;

    //const encrypt_password = CryptoJS.AES.encrypt(password_input, "jade-key");
    //let password_data = encrypt_password.toString();

    for (let i = 0; i < data.userArray.length; i++){
        if(data.userArray[i].email == username_input){
            user_found = true;
            if(data.userArray[i].password == password_input){
                /* 
                users_reg_data.name = data.userArray[i].name;
                users_reg_data.email = data.userArray[i].email;
                data.userArray[i].num_login++;
                let cur_last_login = data.userArray[i].prev_login;
                data.userArray[i].prev_login = currentDate.slice(0,10);

                const updatedJson = JSON.stringify(data, null,2);
                fs.writeFileSync(user_data_file, updatedJson, 'utf-8');

                data.userArray[i].prev_login = cur_last_login;
                */

                password_found = true;
            }else{
                login_errors['password'] = 'Incorrect Password!';
            }
        }
    }

    if (!user_found){
        login_errors['password'] = 'User Not Found!';
    }

    if (password_found){
        response.redirect('./index.html?' + users_reg_data.name);
    } else{
        let pass_data = {};
        pass_data["errors_JSON"] = JSON.stringify(login_errors);
        response.redirect("./login.html?" + qs.stringify(pass_data));
    }

});

app.post('/register_form', function(request, response){
    let errors = {};
    user_data = {name: request.body.name, email: request.body.email.toLowerCase(), password: request.body.password, prev_login: 'Na', num_login: 0};
    let confirm_pass = request.body.confirm_password;


    let name_regex = /[a-zA-Z ]{2,30}/;
    let email_regex = /^[a-zA-Z0-9._]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;
    let password_regex = /[^ ]{10,16}/;
    let number_check = /.*[0-9].*/;
    let symbol_check = /.*[!@#$%^&*(),.?":{}|<>].*/

    for (let i = 0; i < data.userArray.length; i++){
        if (data.userArray[i].email == user_data.email){
            errors['email'] = 'Email is already in use!';
        }
    }

    //Assignment 2 | IR2
    if (!name_regex.test(user_data.name)){
        errors['name'] = 'Wrong name syntax!';
    }
    if (!email_regex.test(user_data.email)){
        errors['email'] = 'Wrong email syntax!';
    }    
    if (!password_regex.test(user_data.password)){
        errors['password'] = 'Password needs to be 10-16 characters long!';
    }
    if (!number_check.test(user_data.password)){
        errors['password'] = 'Password needs to include at least one number!';
    }
    if (!symbol_check.test(user_data.password)){
        errors['password'] = 'Password needs to inlcude at least one symbol!';
    }
    if (user_data.password != confirm_pass){
        errors['confirm_password'] = 'Passwords do not match!';
    }

    //if no errors make acc
    if (Object.entries(errors).length === 0){

        //encrpyts password 
        const encrypt_password = CryptoJS.AES.encrypt(user_data.password, "jade-key");
        user_data.password = encrypt_password.toString();
        //gets date
        const date = new Date();
        let currentDate = date.toJSON();
        user_data.prev_login = currentDate.slice(0,10);
        ++user_data.num_login;

        data.userArray.push(user_data);
        const updatedJson = JSON.stringify(data, null,2);

        fs.writeFileSync(user_data_file, updatedJson, 'utf-8');

        users_reg_data.name = user_data.name;
        users_reg_data.email = user_data.email;

        response.redirect('./invoice.html');
    } else{
        let pass_data = {};
        pass_data["errors_JSON"] = JSON.stringify(errors);
        response.redirect("./register.html?" + qs.stringify(pass_data));
    }

});

//rout all other GET requests to files in public
app.use(express.static(__dirname + '/public'));
//start server
app.listen(8080, () => console.log("listening on port 8080"));