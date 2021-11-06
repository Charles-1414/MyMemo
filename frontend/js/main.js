// Copyright (C) 2021 Charles All rights reserved.
// Author: @Charles-1414
// License: GNU General Public License v3.0

function lsGetItem(lsItemName, defaultValue = 0) {
    if (localStorage.getItem(lsItemName) == null || localStorage.getItem(lsItemName) == "undefined") {
        localStorage.setItem(lsItemName, defaultValue);
        return defaultValue;
    } else {
        return localStorage.getItem(lsItemName);
    }
}

class MemoClass {
    constructor() {
        this.questionId = 0;
        this.question = "";
        this.answer = "";
        this.questionStatus = 0;
        this.challengeStatus = 0;

        this.bookId = 0;
        this.bookName = "";

        this.fullQuestionList = [];
        this.questionListMap = null;
        this.bookList = [];
        this.selectedQuestionList = [];

        this.started = false;
        this.displayingAnswer = false;

        this.speaker = window.speechSynthesis;
    }
}

apdelay = [99999, 8, 5, 3];
class SettingsClass {
    constructor() {
        this.random = 0;
        this.swap = 0;
        this.showStatus = 1;
        this.mode = 0;

        this.autoPlay = 0;
        this.apinterval = -1;

        this.firstuse = 1;
    }
}

memo = new MemoClass();
memo.questionId = parseInt(lsGetItem("memo-question-id", 0));
memo.bookId = parseInt(lsGetItem("memo-book-id", 0));
memo.fullQuestionList = JSON.parse(lsGetItem("question-list", JSON.stringify([])));
memo.bookList = JSON.parse(lsGetItem("book-list", JSON.stringify([])));

settings = new SettingsClass();
settings.random = parseInt(lsGetItem("settings-random", 0));
settings.swap = parseInt(lsGetItem("settings-swap", 0));
settings.showStatus = parseInt(lsGetItem("settings-show-status", 1));
settings.mode = parseInt(lsGetItem("settings-mode", 0));
settings.autoPlay = parseInt(lsGetItem("settings-auto-play", 0));
settings.apinterval = -1;
settings.firstuse = parseInt(lsGetItem("first-use", 1));



function MapQuestionList() {
    memo.questionListMap = new Map();
    for (var i = 0; i < memo.questionList.length; i++) {
        memo.questionListMap.set(memo.questionList[i].questionId, {
            "question": memo.questionList[i].question,
            "answer": memo.questionList[i].answer,
            "status": memo.questionList[i].status
        });
    }
}

function UpdateSelectedQuestionList() {
    for (var i = 0; i < memo.bookList.length; i++) {
        if (memo.bookList[i].bookId == memo.bookId) {
            memo.bookName = memo.bookList[i].name;
            $("#book-name").html(memo.bookName);
            memo.selectedQuestionList = [];
            for (this.j = 0; j < memo.bookList[i].questions.length; j++) {
                questionId = memo.bookList[i].questions[j];
                questionData = memo.questionListMap.get(questionId);
                memo.selectedQuestionList.push({
                    "questionId": questionId,
                    "question": questionData.question,
                    "answer": questionData.answer,
                    "status": questionData.status
                });
            }
        }
    }
}

function GoToUser() {
    window.location.href = "/user"
}

function SessionExpired() {
    new Noty({
        theme: 'mint',
        text: 'Login session expired! Please login again!',
        type: 'error',
        layout: 'bottomRight',
        timeout: 3000
    }).show();
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    setTimeout(GoToUser, 3000);
}

function UpdateQuestionList(doasync = true) {
    $.ajax({
        url: "/api/book/questionList",
        method: 'POST',
        async: doasync,
        dataType: "json",
        data: {
            userId: localStorage.getItem("userId"),
            token: localStorage.getItem("token")
        },
        success: function (r) {
            memo.questionList = r;
            localStorage.setItem("question-list", JSON.stringify(memo.questionList));
            MapQuestionList();
        }
    });
}

function UpdateBookList(doasync = true) {
    $.ajax({
        url: "/api/book",
        method: 'POST',
        async: doasync,
        dataType: "json",
        data: {
            userId: localStorage.getItem("userId"),
            token: localStorage.getItem("token")
        },
        success: function (r) {
            memo.bookList = r;
            localStorage.setItem("book-list", JSON.stringify(memo.bookList));
            UpdateSelectedQuestionList();
        }
    });
}

function PageInit() {
    l = ["Practice", "Challenge", "Offline"];
    $("#mode").html(l[settings.mode]);

    if (localStorage.getItem("username") != null) {
        username = localStorage.getItem("username");
        if (username.length <= 16) {
            $("#navusername").html(username);
        } else {
            $("#navusername").html("Account");
        }
    }
    $.ajax({
        url: "/api/user/info",
        method: 'POST',
        async: true,
        dataType: "json",
        data: {
            userId: localStorage.getItem("userId"),
            token: localStorage.getItem("token")
        },
        success: function (r) {
            if (r.username.length <= 16) {
                $("#navusername").html(r.username);
            } else {
                $("#navusername").html("Account");
            }
            localStorage.setItem("username", r.username);
        },
        error: function (r) {
            $("#navusername").html("Sign in");
            localStorage.setItem("username", "");
        }
    });

    $.ajax({
        url: "/api/book/questionList",
        method: 'POST',
        async: true,
        dataType: "json",
        data: {
            userId: localStorage.getItem("userId"),
            token: localStorage.getItem("token")
        },
        success: function (r) {
            memo.questionList = r;
            localStorage.setItem("question-list", JSON.stringify(memo.questionList));
            MapQuestionList();
            $.ajax({
                url: "/api/book",
                method: 'POST',
                async: true,
                dataType: "json",
                data: {
                    userId: localStorage.getItem("userId"),
                    token: localStorage.getItem("token")
                },
                success: function (r) {
                    memo.bookList = r;
                    localStorage.setItem("book-list", JSON.stringify(memo.bookList));
                    UpdateSelectedQuestionList();
                    $("#book-name").html(memo.bookName);
                }
            });
        }
    });
}

function DisplayRandomQuestion() {
    if (!$("#start-from").is(":focus") && !memo.started && memo.selectedQuestionList.length != 0) {
        index = parseInt(Math.random() * memo.selectedQuestionList.length);
        memo.questionId = memo.selectedQuestionList[index].questionId;
        memo.question = memo.selectedQuestionList[index].question;
        memo.answer = memo.selectedQuestionList[index].answer;
        memo.questionStatus = memo.selectedQuestionList[index].status;

        $("#start-from").val(memo.question);
    }
}
setInterval(DisplayRandomQuestion, 3000);

function ShowQuestion() {
    if (settings.firstuse) {
        new Noty({
            theme: 'mint',
            text: 'Hint: Click question or double click answer to let your device speak it!',
            type: 'info',
            layout: 'bottomRight',
            timeout: 10000
        }).show();
        localStorage.setItem("first-use", 0);
        settings.firstuse = false;
    }
    if (settings.swap == 0 || settings.swap == 2 && settings.mode == 1) {
        $("#question").val(memo.question);
        $("#answer").val("");
    } else if (settings.swap == 1) {
        $("#question").val("");
        $("#answer").val(memo.answer);
    } else if (settings.swap == 2 && settings.mode != 1) {
        $("#question").val(memo.question);
        $("#answer").val(memo.answer);
    }
    if (settings.autoPlay != 0) {
        $(".ap-btn").show();
    }
    $(".memo-tag").html("Tag <i class='fa fa-star'></i>");
    $(".memo-delete").html("Delete <i class='fa fa-trash'></i>");
    if (memo.questionStatus == 2) {
        $(".memo-tag").html("Untag <i class='fa fa-star-o'></i>");
    } else if (memo.questionStatus == 3) {
        $(".memo-delete").html("Undelete <i class='fa fa-undo'></i>");
    }
    $("#home").hide();
    $("#memo").show();
    $(".control").hide();
    if (settings.mode == 0) {
        $("#practice-control").show();
        $("#statistics-btn").show();
        $("#edit-btn").show();
    } else if (settings.mode == 1) {
        $("#challenge-control").show();
        $("#statistics-btn").show();
        $("#edit-btn").hide();
    } else if (settings.mode == 2) {
        $("#offline-control").show();
        $("#statistics-btn").hide();
        $("#edit-btn").hide();
    }

    memo.displayingAnswer = 0;
    memo.started = true;

    if (settings.apinterval != -1 && settings.mode != 1) {
        memo.speaker.cancel();
        msg = undefined;
        if (settings.swap != 1 || settings.swap == 1 && memo.displayingAnswer) {
            msg = new SpeechSynthesisUtterance($("#question").val());
        } else {
            msg = new SpeechSynthesisUtterance($("#answer").val());
        }
        memo.speaker.speak(msg);
    }
    if (settings.apinterval == -1 || settings.mode == 1) {
        $(".ap-btn").hide();
    } else {
        $(".ap-btn").show();
    }

    $("#start-btn").html("Go <i class='fa fa-play'></i>");
}

function DisplayAnswer() {
    if (memo.started && settings.mode != 1) {
        if (settings.swap == 0) {
            if (!memo.displayingAnswer) $("#answer").val(memo.answer);
            else $("#answer").val("");
        } else if (settings.swap == 1) {
            if (!memo.displayingAnswer) $("#question").val(memo.question);
            else $("#question").val("");
        }
        memo.displayingAnswer = 1 - memo.displayingAnswer;
    }
    if (!memo.started) {
        $("#book").fadeOut();
    }
}

function MemoMove(direction) {
    $("#statisticsQuestion").html("");
    $("#statisticsDetail").html("");
    if (settings.mode == 0) {
        moveType = 0;
        if (direction == "previous") {
            moveType = -1;
        } else if (direction == "next") {
            moveType = 1;
        }
        if (settings.random) {
            moveType = 0;
        }

        memo.displayingAnswer = 0;

        $.ajax({
            url: '/api/question/next',
            method: 'POST',
            async: true,
            dataType: "json",
            data: {
                questionId: memo.questionId,
                status: settings.showStatus,
                moveType: moveType,
                bookId: memo.bookId,
                userId: localStorage.getItem("userId"),
                token: localStorage.getItem("token")
            },
            success: function (r) {
                memo.question = r.question;
                memo.answer = r.answer;
                memo.questionStatus = r.status;
                memo.questionId = r.questionId;
                ShowQuestion();
            },
            error: function (r, textStatus, errorThrown) {
                if (r.status == 401) {
                    SessionExpired();
                } else {
                    memo.question = r.status + " " + errorThrown;
                    memo.answer = "Maybe change the settings?\nOr check your connection?";
                    ShowQuestion();
                }
            }
        });
    } else if (settings.mode == 2) {
        moveType = 0;
        if (direction == "previous") {
            moveType = -1;
        } else if (direction == "next") {
            moveType = 1;
        }
        if (settings.random) {
            moveType = 0;
        }

        memo.displayingAnswer = 0;

        requiredList = [];
        for (var i = 0; i < memo.selectedQuestionList.length; i++) {
            if (settings.showStatus == 1 && (memo.selectedQuestionList[i].status == 1 || memo.selectedQuestionList[i].status == 2)) {
                requiredList.push(memo.selectedQuestionList[i]);
            } else if (settings.showStatus == 2 && memo.selectedQuestionList[i].status == 2) {
                requiredList.push(memo.selectedQuestionList[i]);
            } else if (settings.showStatus == 3 && memo.selectedQuestionList[i].status == 3) {
                requiredList.push(memo.selectedQuestionList[i]);
            }
        }

        if (moveType == 0) {
            index = parseInt(Math.random() * requiredList.length);
            memo.questionId = requiredList[index].questionId;
            memo.question = requiredList[index].question;
            memo.answer = requiredList[index].answer;
            memo.questionStatus = requiredList[index].status;
        } else if (moveType == 1 || moveType == -1) {
            index = -1;
            for (var i = 0; i < requiredList.length; i++) {
                if (requiredList[i].questionId == memo.questionId) {
                    index = i;
                    break;
                }
            }
            if (index == -1) {
                memo.question = "";
                memo.answer = "Unknown error";
                ShowQuestion();
                return;
            }

            if (moveType == -1 && index > 0 || moveType == 1 && index < requiredList.length - 1) {
                index += moveType;
            } else if (moveType == -1 && index == 0) {
                index = requiredList.length - 1;
            } else if (moveType == 1 && index == requiredList.length - 1) {
                index = 0;
            }

            memo.questionId = requiredList[index].questionId;
            memo.question = requiredList[index].question;
            memo.answer = requiredList[index].answer;
            memo.questionStatus = requiredList[index].status;
        }

        ShowQuestion();
    }
}

function AutoPlayer() {
    MemoMove("next");
}

function MemoStart() {
    $("#statisticsQuestion").html("");
    $("#statisticsDetail").html("");
    if (settings.mode == 0) { // Practice mode
        startquestion = $("#start-from").val();
        if (startquestion == "") {
            DisplayRandomQuestion();
            startquestion = memo.question;
        }

        // User decided a question to start from
        // Get its question id
        $.ajax({
            url: '/api/question/id',
            method: 'POST',
            async: true,
            dataType: "json",
            data: {
                question: startquestion,
                bookId: memo.bookId,
                userId: localStorage.getItem("userId"),
                token: localStorage.getItem("token")
            },
            success: function (r) {
                memo.questionId = r.questionId;

                // Question exist and get info of the question
                $.ajax({
                    url: '/api/question',
                    method: 'POST',
                    async: true,
                    dataType: "json",
                    data: {
                        questionId: memo.questionId,
                        userId: localStorage.getItem("userId"),
                        token: localStorage.getItem("token")
                    },
                    success: function (r) {
                        memo.questionId = r.questionId;
                        memo.question = r.question;
                        memo.answer = r.answer;
                        memo.questionStatus = r.status;

                        ShowQuestion();
                    },
                    error: function (r, textStatus, errorThrown) {
                        if (r.status == 401) {
                            SessionExpired();
                        } else {
                            memo.question = r.status + " " + errorThrown;
                            memo.answer = "Maybe change the settings?\nOr check your connection?";

                            ShowQuestion();
                        }
                    }
                });
            },

            // Question doesn't exist then start from default
            error: function (r, textStatus, errorThrown) {
                if (r.status == 404) {
                    $("#start-from").val("Not found!");
                    DisplayRandomQuestion();
                } else if (r.status == 401) {
                    SessionExpired();
                } else {
                    memo.question = r.status + " " + errorThrown;
                    memo.answer = "Maybe change the settings?\nOr check your connection?";

                    ShowQuestion();
                }
            }
        });
    } else if (settings.mode == 1) { // Challenge mode
        $.ajax({
            url: '/api/question/challenge/next',
            method: 'POST',
            async: true,
            dataType: "json",
            data: {
                bookId: memo.bookId,
                userId: localStorage.getItem("userId"),
                token: localStorage.getItem("token")
            },
            success: function (r) {
                memo.questionId = r.questionId;
                memo.question = r.question;
                memo.answer = r.answer;
                memo.questionStatus = r.status;

                if (memo.questionId == -1) {
                    $("#challenge-control").hide();
                } else {
                    $("#challenge-control").show();
                }

                ShowQuestion();
            },
            error: function (r) {
                if (r.status == 401) {
                    SessionExpired();
                }
            }
        });
    } else if (settings.mode == 2) { // Offline Mode
        if (memo.selectedQuestionList == []) {
            alert("Unable to start offline mode: No data in question list!");
            return;
        }

        if ($("#start-from").val() != "") {
            startquestion = $("#start-from").val();
            found = false;
            for (var i = 0; i < memo.selectedQuestionList.length; i++) {
                if (memo.selectedQuestionList[i].question == startquestion) {
                    memo.questionId = memo.selectedQuestionList[i].questionId;
                    memo.question = memo.selectedQuestionList[i].question;
                    memo.answer = memo.selectedQuestionList[i].answer;
                    memo.questionStatus = memo.selectedQuestionList[i].status;

                    found = true;
                }
            }
            if (!found) {
                $("#start-from").val("Not found!");
            }
        } else {
            index = parseInt(Math.random() * memo.selectedQuestionList.length);
            memo.questionId = memo.selectedQuestionList[index].questionId;
            memo.question = memo.selectedQuestionList[index].question;
            memo.answer = memo.selectedQuestionList[index].answer;
            memo.questionStatus = memo.selectedQuestionList[index].status;
        }

        ShowQuestion();
    }

    if (settings.mode != 1 && settings.autoPlay != 0) {
        settings.apinterval = setInterval(AutoPlayer, apdelay[settings.autoPlay] * 1000);
        $(".ap-btn").attr("onclick", "StopAutoPlayer()");
        $(".ap-btn").html('<i class="fa fa-pause-circle"></i> Pause');
        memo.speaker.cancel();
        msg = new SpeechSynthesisUtterance($("#question").val());
        memo.speaker.speak(msg);
    }
}

function MemoGo() {
    $("#start-btn").html("Go <i class='fa fa-spinner fa-spin'></i>");
    setTimeout(MemoStart, 50);
}

function MemoTag() {
    if (memo.questionStatus == 2) memo.questionStatus = 1;
    else if (memo.questionStatus == 1 || memo.questionStatus == 3) memo.questionStatus = 2;

    $.ajax({
        url: '/api/question/status/update',
        method: 'POST',
        async: true,
        dataType: "json",
        data: {
            questions: JSON.stringify([memo.questionId]),
            status: memo.questionStatus,
            userId: localStorage.getItem("userId"),
            token: localStorage.getItem("token")
        },
        success: function (r) {
            if (memo.questionStatus != 2) $(".memo-tag").html("Tag <i class='fa fa-star'></i>");
            else $(".memo-tag").html("Untag <i class='fa fa-star-o'></i>");
        },
        error: function (r) {
            if (r.status == 401) {
                SessionExpired();
            }
        }
    });
}

function MemoDelete() {
    if (memo.questionStatus == 3) memo.questionStatus = 1;
    else if (memo.questionStatus == 1 || memo.questionStatus == 2) memo.questionStatus = 3;

    $.ajax({
        url: '/api/question/status/update',
        method: 'POST',
        async: true,
        dataType: "json",
        data: {
            questions: JSON.stringify([memo.questionId]),
            status: memo.questionStatus,
            userId: localStorage.getItem("userId"),
            token: localStorage.getItem("token")
        },
        success: function (r) {
            if (memo.questionStatus != 3) $(".memo-delete").html("Delete <i class='fa fa-trash'></i>");
            else $(".memo-delete").html("Undelete <i class='fa fa-undo'></i>");
        },
        error: function (r) {
            if (r.status == 401) {
                SessionExpired();
            }
        }
    });
}

function MemoChallenge(res) {
    if (memo.challengeStatus != 2 && res == "no") {
        memo.challengeStatus = 2;
        $("#answer").val(memo.answer);
        $("#challenge-msg").html("Try to memorize it!")
        $(".memo-challenge-yes").html("<i class='fa fa-arrow-circle-right'></i> Next");
        $(".memo-challenge-no").html("<i class='fa fa-arrow-circle-right'></i> Next");
        $.ajax({
            url: '/api/question/challenge/update',
            method: 'POST',
            async: true,
            dataType: "json",
            data: {
                questionId: memo.questionId,
                memorized: 0,
                getNext: 0,
                bookId: memo.bookId,
                userId: localStorage.getItem("userId"),
                token: localStorage.getItem("token")
            },
        });
        return;
    }

    if (memo.challengeStatus == 0 && res == "yes") {
        memo.challengeStatus = 1;
        $("#answer").val(memo.answer);
        $("#challenge-msg").html("Are you correct?");
    } else if (memo.challengeStatus == 1 && res == "yes") {
        $("#challenge-msg").html("Good job! <i class='fa fa-thumbs-up'></i>");

        $.ajax({
            url: '/api/question/challenge/update',
            method: 'POST',
            async: true,
            dataType: "json",
            data: {
                questionId: memo.questionId,
                memorized: 1,
                getNext: 1,
                bookId: memo.bookId,
                userId: localStorage.getItem("userId"),
                token: localStorage.getItem("token")
            },
            success: function (r) {
                memo.questionId = r.questionId;
                memo.question = r.question;
                memo.answer = r.answer;
                memo.questionStatus = r.status;

                memo.challengeStatus = 0;
                $("#challenge-msg").html("Do you remember it?");
                ShowQuestion();
            },
            error: function (r) {
                if (r.status == 401) {
                    SessionExpired();
                }
            }
        });
    } else if (memo.challengeStatus == 2) {
        $(".memo-challenge-yes").html("Yes <i class='fa fa-check'></i>");
        $(".memo-challenge-no").html("No <i class='fa fa-times'></i>");
        $.ajax({
            url: '/api/question/challenge/next',
            method: 'POST',
            async: true,
            dataType: "json",
            data: {
                bookId: memo.bookId,
                userId: localStorage.getItem("userId"),
                token: localStorage.getItem("token")
            },
            success: function (r) {
                memo.questionId = r.questionId;
                memo.question = r.question;
                memo.answer = r.answer;
                memo.questionStatus = r.status;

                if (memo.questionId == -1) {
                    $("#challenge-control").hide();
                } else {
                    $("#challenge-control").show();
                }

                memo.challengeStatus = 0;
                $("#challenge-msg").html("Do you remember it?");
                ShowQuestion();
            },
            error: function (r) {
                if (r.status == 401) {
                    SessionExpired();
                }
            }
        });
    }
}

function Statistics() {
    if ($("#statisticsQuestion").text() == memo.question) {
        $('#statisticsModal').modal('toggle')
        return;
    }
    $.ajax({
        url: '/api/question/stat',
        method: 'POST',
        async: true,
        dataType: "json",
        data: {
            questionId: memo.questionId,
            userId: localStorage.getItem("userId"),
            token: localStorage.getItem("token")
        },
        success: function (r) {
            statistics = r.msg.replaceAll("\n", "<br>");

            $("#statisticsQuestion").html(memo.question);
            $("#statisticsDetail").html(statistics);

            $('#statisticsModal').modal('toggle')
        },
        error: function (r) {
            if (r.status == 401) {
                SessionExpired();
            }
        }
    });
}

function EditQuestionShow() {
    $("#edit-question").val(memo.question);
    $("#edit-answer").val(memo.answer);
    $("#editQuestionModal").modal('toggle');
}

function EditQuestion() {
    question = $("#edit-question").val();
    answer = $("#edit-answer").val();
    $.ajax({
        url: '/api/question/edit',
        method: 'POST',
        async: true,
        dataType: "json",
        data: {
            questionId: memo.questionId,
            question: question,
            answer: answer,
            userId: localStorage.getItem("userId"),
            token: localStorage.getItem("token")
        },
        success: function (r) {
            memo.question = question;
            memo.answer = answer;

            if (settings.swap == 0 || settings.swap == 2 && settings.mode == 1) {
                $("#question").val(memo.question);
                $("#answer").val("");
            } else if (settings.swap == 1) {
                $("#question").val("");
                $("#answer").val(memo.answer);
            } else if (settings.swap == 2 && settings.mode != 1) {
                $("#question").val(memo.question);
                $("#answer").val(memo.answer);
            }

            new Noty({
                theme: 'mint',
                text: 'Success! Question edited!',
                type: 'success',
                layout: 'bottomRight',
                timeout: 3000
            }).show();

            $("#editQuestionModal").modal('toggle');
        },
        error: function (r) {
            if (r.status == 401) {
                SessionExpired();
            }
        }
    });
}

function SpeakQuestion() {
    memo.speaker.cancel();
    msg = new SpeechSynthesisUtterance($("#question").val());
    memo.speaker.speak(msg);
}

function SpeakAnswer() {
    memo.speaker.cancel();
    msg = new SpeechSynthesisUtterance($("#answer").val());
    memo.speaker.speak(msg);
}

function StopAutoPlayer() {
    settings.apinterval = clearInterval(settings.apinterval); // this will make it undefined
    $(".ap-btn").attr("onclick", "ResumeAutoPlayer()");
    $(".ap-btn").html('<i class="fa fa-play-circle"></i> Resume');
}

function ResumeAutoPlayer() {
    settings.apinterval = setInterval(AutoPlayer, apdelay[settings.autoPlay] * 1000);
    $(".ap-btn").attr("onclick", "StopAutoPlayer()");
    $(".ap-btn").html('<i class="fa fa-pause-circle"></i> Pause');
}

function BackToHome() {
    memo.started = false;
    $("#memo").hide();
    $("#home").show();
    StopAutoPlayer();
}

function UpdateBookDisplay() {
    $(".book").remove();
    $("#book-list").append('<div class="book">\
        <p>Create Book: </p>\
        <div class="input-group mb-3 w-75">\
            <span class="input-group-text" id="basic-addon1">Name</span>\
            <input type="text" class="form-control" id="create-book-name" aria-describedby="basic-addon1">\
            <div class="input-group-append">\
                <button class="btn btn-outline-primary" type="button" onclick="CreateBook()">Create</button>\
            </div>\
        </div>\
        </div>');
    for (var i = 0; i < memo.bookList.length; i++) {
        book = memo.bookList[i];
        wcnt = "";
        if (book.bookId == 0) {
            wcnt = book.questions.length + ' questions';
        } else {
            wcnt = book.progress + ' memorized / ' + book.questions.length + ' questions';
        }
        btn = "";
        if (book.bookId != memo.bookId) {
            btn = '<button type="button" class="btn btn-primary " onclick="SelectBook(' + book.bookId + ')">Select</button>';
        } else {
            btn = '<button type="button" class="btn btn-secondary">Selected</button>'
        }
        bname = book.name;
        if (book.groupId != -1) {
            bname = "[Group] " + bname;
        }

        $("#book-list").append('<div class="book">\
        <p>' + bname + '</p>\
        <p>' + wcnt + '</p>\
        <button type="button" class="btn btn-primary " onclick="OpenBook(' + book.bookId + ')">Open</button>\
        ' + btn + '\
        <hr>\
        </div>');
    }
}

function ShowBook() {
    $("#book").fadeIn();
    UpdateBookDisplay();
}

function OpenBook(bookId) {
    window.location.href = '/book?bookId=' + bookId;
}

function SelectBook(bookId) {
    memo.bookId = bookId;
    localStorage.setItem("memo-book-id", memo.bookId);
    UpdateSelectedQuestionList();
    UpdateBookDisplay();
}

function CreateBook() {
    bookName = $("#create-book-name").val();

    if (bookName == "") {
        new Noty({
            theme: 'mint',
            text: 'Enter a book name!',
            type: 'warning',
            layout: 'topLeft',
            timeout: 3000
        }).show();
        return;
    }

    $.ajax({
        url: '/api/book/create',
        method: 'POST',
        async: true,
        dataType: "json",
        data: {
            name: bookName,
            userId: localStorage.getItem("userId"),
            token: localStorage.getItem("token")
        },
        success: function (r) {
            if (r.success == true) {
                UpdateBookList(false);
                UpdateBookDisplay();
                new Noty({
                    theme: 'mint',
                    text: 'Success!',
                    type: 'success',
                    layout: 'topLeft',
                    timeout: 3000
                }).show();
            } else {
                new Noty({
                    theme: 'mint',
                    text: r.msg,
                    type: 'error',
                    layout: 'topLeft',
                    timeout: 3000
                }).show();
            }
        },
        error: function (r) {
            if (r.status == 401) {
                alert("Login session expired! Please login again!");
                localStorage.removeItem("userId");
                localStorage.removeItem("token");
                window.location.href = "/user";
            }
        }
    });
}

function BackToHome() {
    window.location.href = '/';
}

function SignOut() {
    $.ajax({
        url: "/api/user/logout",
        method: 'POST',
        async: true,
        dataType: "json",
        data: {
            userId: localStorage.getItem("userId"),
            token: localStorage.getItem("token")
        }
    });
    localStorage.removeItem("userid");
    localStorage.removeItem("username");
    localStorage.removeItem("token");

    $("#navusername").html("Sign in");

    new Noty({
        theme: 'mint',
        text: 'Success! You are now signed out!',
        type: 'success',
        layout: 'bottomRight',
        timeout: 3000
    }).show();
}