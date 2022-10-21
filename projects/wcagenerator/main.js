
var wcif = undefined
var activities = {}
var backgroundImage = ""

var weekDaysText = [
    "Sunday", 
    "Monday", 
    "Tuesday", 
    "Wednesday", 
    "Thursday", 
    "Friday", 
    "Saturday", 
]

var eventText = {
    "222": "2x2x2",
    "333": "3x3x3",
    "333fm": "Fewest Moves",
    "333ft": "3x3x3 With Feet",
    "333oh": "3x3x3 One-Handed",
    "333mbf": "3x3x3 Multi-Blind",
    "333bf": "3x3x3 Blindfolded",
    "444bf": "4x4x4 Blindfolded",
    "555bf": "5x5x5 Blindfolded",
    "444": "4x4x4",
    "555": "5x5x5",
    "666": "6x6x6",
    "777": "7x7x7",
    "sq1": "Square-1",
    "clock": "Clock",
    "minx": "Megaminx",
    "pyram": "Pyraminx",
    "skewb": "Skewb",
}

var badgeTemplates = [
    {
        name: "SCA Basic 3x3",
        description: "3 rows of 3 badges for printing on a landscape A4 page, no schedule",
        link: "./templates/SCA-standard.html",
        pageWidth: 29.7,
        pageHeight: 20.9818,
        pageRows: 3,
        pageColumns: 3,
        badgeWidth: 9.9,
        badgeHeight: 7,
        badgeScale: 1.0,
    },
    {
        name: "SCA Book",
        description: "Individual badge and schedule for printing on a single landscape A6 page",
        link: "./templates/SCA-book.html",
        pageWidth: 29.7,
        pageHeight: 20.9818,
        pageRows: 1,
        pageColumns: 1,
        badgeWidth: 29.7,
        badgeHeight: 20.9818,
        badgeScale: 1.0,
    },
    {
        name: "SCA Book 2x2",
        description: "2 rows of 2 columns of badges and schedule for printing on a landscape A4 page",
        link: "./templates/SCA-book.html",
        pageWidth: 29.7,
        pageHeight: 20.9818,
        pageRows: 2,
        pageColumns: 2,
        badgeWidth: 29.7,
        badgeHeight: 20.9818,
        badgeScale: 0.5,
    }
]

var settings = {
    template: 0,
    customTemplate: false,
    marginPercentage: 0.05,
} 

function fitText(nameElem, lines) {
    var height = nameElem.height();
    var maxHeight = parseInt(nameElem.css("font-size"), 10) * lines;
    while (maxHeight < height) {
        size = parseInt(nameElem.css("font-size"), 10);
        nameElem.css("font-size", size - 1);
        height = nameElem.height();

        var bottom = parseInt(nameElem.css("bottom"), 10);
        nameElem.css("bottom", bottom + 1);
    }
}

function readWCIF(input) {
    let file = input.files[0]; 
    let fileReader = new FileReader(); 
    fileReader.readAsText(file); 
    fileReader.onload = function() {
        wcif = JSON.parse(fileReader.result);
        if (wcif == undefined) {
            alert("Invalid WCIF file provided");
        }

        activities = {}
        for (var v=0; v<wcif.schedule.venues.length; v++) {
            var venue = wcif.schedule.venues[v];
            for (var r=0; r<venue.rooms.length; r++) {
                var room = venue.rooms[r];
                for (var a=0; a<room.activities.length; a++) {
                    var activity = room.activities[a];
                    for (var c=0; c<activity.childActivities.length; c++) {
                        var childActivity = activity.childActivities[c];

                        activities[childActivity.id] = {
                            parentActivityCode: activity.activityCode,
                            activityCode: childActivity.activityCode,
                            roundStartTime: activity.startTime,
                            roundEndTime: activity.endTime,
                            timezone: venue.timezone,
                        }
                    }
                }
            }
        }
        console.log(activities)
    }; 
    fileReader.onerror = function() {
        alert(fileReader.error);
    }; 
}

function readBackground(input) {
    let file = input.files[0]; 
    let fileReader = new FileReader(); 
    fileReader.readAsDataURL(file); 
    fileReader.onload = function() {
        backgroundImage = fileReader.result;

        $("#background-image-style").remove()
        var backgroundImageStyle = $(`<style id='background-image-style'>.badge {background-image:url('${backgroundImage}');}</style>`)
        $("body").append(backgroundImageStyle);

    }; 
    fileReader.onerror = function() {
        alert(fileReader.error);
    }; 
}

function generate() {
    if (wcif == undefined) {
        console.log("Missing WCIF data")
        return;
    }

    var persons = wcif.persons.filter((a) => {
        if (a.registration != null) {
            if (a.registration.status == "accepted") {
                return true;
            }
        }
        return false;
    })

    persons.sort((a,b) => {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    });

    var template = badgeTemplates[settings.template];

    $("#template").load(template.link, function() {

        $("#template").hide(); 

        var doc = $("#print-document");
        doc.empty();
    
        doc.css("width",`${template.pageWidth}cm`);
    
        var index = 0;
        var pageIndex = 0;
        var badgeIndex = 0;
        
        while (true) {
            if (badgeIndex >= (template.pageRows * template.pageColumns)) {
                if (index >= persons.length) {
                    break;
                }
                pageIndex+=1;
                badgeIndex=0;
            }
    
            if (badgeIndex == 0) {
                var newPage = $(`<div class='print-page' style='width:${template.pageWidth}cm;height:${template.pageHeight}cm'></div>`)
                newPage.css("transform",`scale(${1.0 - settings.marginPercentage})`)
                doc.append(newPage)
            }
    
            var badge = $('#badge-template').children().first().clone();
            badge.css("width",`${template.badgeWidth}cm`);
            badge.css("height",`${template.badgeHeight}cm`);
            badge.css("transform",`scale(${template.badgeScale})`)
            badge.css("transform-origin",`0% 0%`)
            badge.removeAttr("id");
            badge.show();
            if (index >= persons.length) {
                badge.find(".wca-name").first().text(" ");
                badge.find(".wca-id").first().text(" ");
            } else {
                badge.find(".wca-name").first().text(persons[index].name);
                badge.find(".wca-id").first().text(persons[index].wcaId);
            }
            badge.css("top", `${(Math.floor(badgeIndex / template.pageColumns)) * template.badgeHeight * template.badgeScale}cm`)
            badge.css("left", `${(badgeIndex % template.pageRows) * template.badgeWidth * template.badgeScale}cm`)

            var page = doc.find(".print-page").last();
            page.append(badge);

            fitText(badge.find(".wca-name").first(), 2);
    
            var personalSchedule = {}
            if (index >= persons.length) {
            } else {
                for (var a=0; a<persons[index].assignments.length; a++) {
                    var assignment = persons[index].assignments[a];
                    var activity = activities[assignment.activityId];
                    if (activities[assignment.activityId] == undefined) {
                        console.warn(`MISSING ACTIVITY ${activityId}`);
                    } else {
                        var startTime = moment(activity.roundStartTime).tz(activity.timezone); 
                        var endTime = moment(activity.roundEndTime).tz(activity.timezone);

                        var day = startTime.day();
                        if (personalSchedule[day] == undefined) {
                            personalSchedule[day] = {
                                day: day,
                                sortTime: startTime.unix(),
                                assignments: {},
                                sortedAssignments: [],
                            }
                        }

                        //console.log(`${assignment.assignmentCode} in ${activity.activityCode}`)
                        var codes = activity.activityCode.split('-')
                        var event = codes[0]
                        var group = codes[2]

                        if (personalSchedule[day].assignments[activity.parentActivityCode] == undefined) {
                            personalSchedule[day].assignments[activity.parentActivityCode] = {
                                timeText: `${startTime.format("HH:mm")} - ${endTime.format("HH:mm")}`,
                                sortTime: startTime.unix(),
                                eventCode: event,
                                eventText: eventText[event],
                                competing: -1,
                                judging: [],
                            };
                        }
                        
                        if (assignment.assignmentCode == "competitor") {
                            personalSchedule[day].assignments[activity.parentActivityCode].competing = group.substr(1);
                        } else if (assignment.assignmentCode == "staff-judge") {
                            personalSchedule[day].assignments[activity.parentActivityCode].judging.push(group.substr(1));
                        } else {
                            console.warn(`MISSING ASSIGNMENT CODE ${assignment.assignmentCode}`);
                        }
                        
                    }
                }

                var sortedSchedule = []
                for (let value of Object.values(personalSchedule)) {
                    sortedSchedule.push(value);
                }

                sortedSchedule.sort((a,b) => {
                    if (a.sortTime < b.sortTime) {
                        return -1;
                    }
                    if (a.sortTime > b.sortTime) {
                        return 1;
                    }
                    return 0;
                });

                for (var i=0; i<sortedSchedule.length; i++) {   
                    for (let value of Object.values(sortedSchedule[i].assignments)) {
                        sortedSchedule[i].sortedAssignments.push(value);
                    }
                    
                    sortedSchedule[i].sortedAssignments.sort((a,b) => {
                        if (a.sortTime < b.sortTime) {
                            return -1;
                        }
                        if (a.sortTime > b.sortTime) {
                            return 1;
                        }
                        return a.eventCode > b.eventCode;
                    });
                }

                //console.log(personalSchedule)
                //console.log(sortedSchedule)

                var table = badge.find(".wca-schedule").first();
                var tableContent = "";
                tableContent += "<tr><td>Time</td><td>Event</td><td>Group</td><td>Roles</td></tr>";
                for (var i=0; i<sortedSchedule.length; i++) {   
                    tableContent += `<tr><td colspan="4" class="wca-schedule-header">${ weekDaysText[sortedSchedule[i].day]}</td></tr>`
                    for (var j=0; j<sortedSchedule[i].sortedAssignments.length; j++) {   
                        var assignment = sortedSchedule[i].sortedAssignments[j];

                        var roleText = "";
                        for (var k=0; k<assignment.judging.length; k++) {
                            if (k == 0) {
                                roleText += "Judging:"
                            }
                            if (k == 0) {
                                roleText += ` ${assignment.judging[k]}`
                            } else {
                                roleText += `, ${assignment.judging[k]}`
                            }
                        }

                        var eventIcon = `<i class="cubing-icon icon event-${assignment.eventCode}"></i>`

                        tableContent += `<tr><td>${assignment.timeText}</td><td>${eventIcon} ${assignment.eventText}</td><td>${assignment.competing}</td><td>${roleText}</td></tr>`;
                    }
                }
                table.append(tableContent);
            }

            badgeIndex+=1;
            index+=1;
        }

    });
}

function print() {
    var printwin = window.open("");

    printwin.document.open();
    printwin.document.write('<html><head><link rel="stylesheet" type="text/css" href="./style.css"></head><body>');
    printwin.document.write('<html><head><link rel="stylesheet" type="text/css" href="./cubingIcons.css"></head><body>');
    printwin.document.write('<html><head><link rel="stylesheet" type="text/css" href="./print.css"></head><body>');
    printwin.document.write($("#badge-template-style").prop('outerHTML'));
    if ($("#background-image-style").prop('outerHTML') != undefined) {
        printwin.document.write($("#background-image-style").prop('outerHTML'));
    }
    printwin.document.write($("#print-document").prop('outerHTML'));
    printwin.document.write('</body></html>');
    printwin.document.close();

    setTimeout(function() {
        printwin.print();
        printwin.stop();
        printwin.close();
    }, 1000);
}

// Set badge dropdown
var option = '';
for (var i=0;i<badgeTemplates.length;i++){
   option += '<option value="' + i + '">' + badgeTemplates[i].name + '</option>';
}
$('#select-template').html(option);
$('#select-template').val(String(settings.template));
$('#select-template').on('change', function() {
    settings.template = Number(this.value);
});

setTimeout(function() {
    
}, 1000);

