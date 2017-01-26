"use strict";

function showLoginError(message) {
    $("#signin-error").empty().append($(""
        + "<div class=\"alert alert-warning alert-dismissible\" role=\"alert\">"
        + "    <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\"><span aria-hidden=\"true\">×</span></button>"
        + "    <strong>" + message + "</strong>"
        + "</div>"));
}

// curl -XPOST -i localhost:7777/login -d '{"email": "someuser@example.com", "password": "password"}' -H "Content-Type: application/json"
function signIn(email, password) {
    $.ajax({
        type: "POST",
        url: "api/login",
        data: JSON.stringify({ email: email, password: password }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            window.location = "/dashboard.html";
        },
        error: function (data) {
            showLoginError("Incorrect username or password");
        }
    });
}

function getEmail() {
    $.ajax({
        type: "GET",
        url: "api/email",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            $("#email").text(JSON.stringify(data.email));
        },
        error: function (data) {
            console.log("Could not get email");
        }
    });
}

$(function () {
    $('#sign-in-form').on("submit", function (e) {
        e.preventDefault();
        var email = $('#email').val();
        var password = $("#password").val();
        signIn(email, password);
        return false;
    });
});