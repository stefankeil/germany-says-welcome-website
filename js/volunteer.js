var cats;
var items_by_cat = {};
function init() {
    var apisToLoad;
    NProgress.start();
    var loadCallback = function() {
        
        if (--apisToLoad == 0) {
            signin(true, userAuthed);
        }
    };
    $("#signInButton").text("Signing in ...");
    apisToLoad = 2;
    apiRoot = 'https://donate-backend.appspot.com/_ah/api';
    gapi.client.load('donate', 'v1', loadCallback, apiRoot);
    gapi.client.load('oauth2', 'v2', loadCallback);
}
function signin(mode, authorizeCallback) {
    gapi.auth.authorize({client_id:"760560844994-04u6qkvpf481an26cnhkaauaf2dvjfk0.apps.googleusercontent.com",
        scope: ["https://www.googleapis.com/auth/plus.login", "https://www.googleapis.com/auth/userinfo.email"], immediate: mode},
        authorizeCallback);
}
function userAuthed() {
    NProgress.set(0.5);
    var request =
    gapi.client.oauth2.userinfo.get().execute(function(resp) {
        if (!resp.code) {
            gapi.client.donate.user.create().execute(function(resp) {
                if (!resp.code) {
                    console.log(resp)
                    NProgress.set(1);
                    if (resp.is_admin || resp.is_volunteer) {
                        signedIn();
                    } else {
                        showUserNotVolunteerOrAdmin();
                    }
                    
                }
            });
        }
    });
}
function auth() {
    signin(false, userAuthed);
};
function deauth() {
    gapi.auth.setToken(null)
    $("#signInButton").show();
    $("#signInButton").text("Sign in");
    $("#signOutButton").hide();
};
function signedIn() {
    $("#signInButton").hide();
    $("#signOutButton").show();
    jumpToPage();
}
$(document).ready(function() {
    $(window).bind( 'hashchange', function(e) {
        jumpToPage()
    });
    $("#unanswered").on('click','#save',function(e) {
        $("#unanswered").html("");
        //
        var form = $(e.target).parent();
        NProgress.start();
        var question = form.find("#question")[0].value;
        var answer = form.find("#answer")[0].value;
        var language = form.find("#language")[0].value;
        var id = form.find("#id")[0].value;
        var answered = form.find("#answered")[0].checked;
        var category = form.find("#category")[0].value;
        gapi.client.donate.faqitem.update({"id":id,"question":question, "answer":answer, "answered":answered, "language":language, "category":category}).execute(function(resp) {
            NProgress.set(0.5);
            if (!resp.code) {
                showUnanswered();
            } else {
                console.log(resp);
                $('#errorModalText').text("Error: "+resp.message);
                $('#errorModalLabel').append("Error Code "+resp.code);
                $('#errorModal').modal();
            }

        });
    });
    $("#unanswered").on('click','#delete',function(e) {
        $("#unanswered").html("");
        //
        var form = $(e.target).parent();
        NProgress.start();
        var id = form.find("#id")[0].value;
        gapi.client.donate.faqitem.delete({"id":id}).execute(function(resp) {
            NProgress.set(0.5);
            if (!resp.code) {
                showUnanswered();
            } else {
                console.log(resp);
                $('#errorModalText').text("Error: "+resp.message);
                $('#errorModalLabel').append("Error Code "+resp.code);
                $('#errorModal').modal();
            }

        });
    });
    $("#unanswered").on('click','.cat',function(e) {
        var p = $(e.target).parent().parent().parent();
        p.find("#category").prop('value', e.target.id);
        p.find("#dropdownMenuTitle").text(e.target.textContent);
    });
});

function showHome() {
    $("#home").show();
    $("#questions").hide();
}

function jumpToPage() {
    var location = window.location.hash;

    if (location.match("^#home")) {
        $('nav').removeClass('fixed');
        $('nav li.active').removeClass('active');
        $('nav a#home_link').parent().addClass('active');
        showHome();
	}
    
    if (location.match("^#questions")) {
        $('nav').removeClass('fixed');
        $('nav li.active').removeClass('active');
        $('nav a#question_link').parent().addClass('active');
        showQuestions();
    }
    
    if (location.match("^#unanswered")) {
        $('nav-tabs').removeClass('fixed');
        $('nav-tabs li.active').removeClass('active');
        $('nav-tabs a#unanswered_link').parent().addClass('active');
        showUnanswered();
    }
    
    if (location.match("^#answered")) {
        $('nav-tabs').remove('fixed');
        $('nav-tabs li.active').removeClass('active');
        $('nav-tabs a#answered_link').parent().addClass('active');
        showAnswered();
    }

/*function loadSharing() {
    $("#home").hide();
    $("#sharing").show();
    $("#faq").hide();
    $("#map_container").hide();
}*/
   
}

function showHome() {
    $("#home").show();
    $("#questions").hide();
}

function showUnanswered() {
    if (NProgress.status == null) {
        NProgress.start();
    }
    $("#home").hide();
    $("#unanswered").show();
    gapi.client.donate.faqcat.list().execute(function(items){
        var predrophtml = '<div id="dropdown" class="dropdown"><button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenuTitle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">';
        var postdrophtml = '</button><ul class="dropdown-menu" aria-labelledby="dropdownMenu1">';
        cats = items.items;
        cats_by_id = {};
        items.items.forEach(function parseItems(item, index, all) {
            cats_by_id[item.id] = item;
        })
        items.items.forEach(function parseItems(item, index, all) {
            postdrophtml += '<li class="cat" id="'+item.id+'">'+item.name+'</li>';
        });
        postdrophtml += '</ul></div>';
        NProgress.set(0.75)
        gapi.client.donate.faqitem.list({"answered":false}).execute(function(items) {
            var html = "";
            if (items.items != undefined) {
                items.items.forEach(function parseItems(item, index, all) {
                    html += '<div class="jumbotron col-md-4"><form><div class="form-group"><label for="question">Question</label>';
                    html += '<input type="text" class="form-control" id="question" placeholder="Question" value="'+item.question+'"></div>';
                    html += '<div class="form-group"><label for="answer">Answer</label>';
                    html += '<input type="text" class="form-control" id="answer" placeholder="Answer" value="'+item.answer+'"></div>';
                    html += '<div class="form-group"><label for="language">Language-Code</label>';
                    html += '<input type="text" class="form-control" id="language" placeholder="Language-Code" value="'+item.language+'"></div>';
                    html += '<div class="checkbox"><label><input id="answered" type="checkbox"';
                    if(item.answered)
                        html += " checked";
                    html += '>Answered</label></div>';
                    html += '<input type="hidden" id="category" value="'+item.category+'"><input type="hidden" id="id" value="'+item.id+'">';
                    html += predrophtml;
                    if (item.category == undefined) {
                        html += 'Choose Category<span class="caret"></span>';
                    } else {
                        html += cats_by_id[item.category].name;
                    }
                    html += postdrophtml;
                    html += '<button class="btn btn-default" id="save">Save</button><button class="btn btn-default" id="delete">Delete</button></form></div>';
                });
            } else {
                html = "Couldn't load FAQ Items";
            }

            $("#unanswered").html(html);
            NProgress.done();
        });
    });
}

function showAnswered() {
    $("#unanswered").hide();
    $("#answered").show(); 
}

function showQuestions() {
    $("#home").hide();
    $("#questions").show();
    $("#unanswered").show();
    $("#answered").hide();
}

function showUserNotVolunteerOrAdmin() {
    $('#errorModalText').text("Only admins und volunteers are allowed to change things in this area.");
    $('#errorModalLabel').set("You are not allowed");
    $('#errorModal').modal();
}