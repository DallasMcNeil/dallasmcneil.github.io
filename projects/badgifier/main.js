// Constants 

// Week day to text
const weekDaysMap = [
    "Sunday", 
    "Monday", 
    "Tuesday", 
    "Wednesday", 
    "Thursday", 
    "Friday", 
    "Saturday", 
]

// Event code to full name
const eventMap = {
    "222": "2x2x2",
    "333": "3x3x3",
    "333fm": "3x3x3 Fewest Moves",
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

// Award place to text
const placeMap = [
    "First Place awarded to:", 
    "Second Place awarded to:", 
    "Third Place awarded to:",  
]

// Format code to event result prefix text
const eventFormatMap = {
    "a":"Average time of:",
    "m":"Mean time of:",
    "1":"Best time of:",
    "2":"Best time of:",
    "3":"Best time of:",
}

// Special case text for certain events
const multiblindFormatText = "Best result:"
const fewestMovesFormatText = "Moves:"

// Various badge and certificate settings
// Important classes for templates

// For badges
// .wca-id (p): Competitor ID is inserted into element
// .wca-name (p): Competitor Name is inserted into element
// .wca-country (img): Competitor country flag is set as the source of the image
// .wca-schedule (table): Competitor schedule is built into table
// .wca-comp-id (p): Competitor competition ID is inserted into element

// For certificates
// .wca-border (img): Background/border image for the certificate, src is changed
// .wca-comp-name (p): Competition name is inserted into element
// .wca-event (p): Event name is inserted into element
// .wca-place (p): 'Place awarded to' text is inserted into element
// .wca-result-prefix (p): Prefix before result is inserted into element
// .wca-date (p): Date of the competition is inserted into element
// .wca-sig-name (p): Specified name of signer is inserted into element
// .wca-sig-role (p): Specified role of signer is inserted into element

// Note: 20.9818 is specifically used for page spacing when printing

var templates = [
    {
        name: "SCA Basic 3x3",
        description: "3 rows of 3 badges for printing on a landscape A4 page, no schedule",
        link: "./templates/SCA-standard.html",
        isCertificate: false,
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
        description: "Individual portrait badge and schedule for printing on a single landscape A6 page",
        link: "./templates/SCA-book.html",
        isCertificate: false,
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
        description: "2 rows of 2 columns of portrait badges and schedule for printing on a landscape A4 page",
        link: "./templates/SCA-book.html",
        isCertificate: false,
        pageWidth: 29.7,
        pageHeight: 20.9818,
        pageRows: 2,
        pageColumns: 2,
        badgeWidth: 29.7,
        badgeHeight: 20.9818,
        badgeScale: 0.5,
    },
    {
        name: "SCA Landscape Book",
        description: "Individual landscape badge and schedule for printing on a single landscape A6 page",
        link: "./templates/SCA-book-landscape.html",
        isCertificate: false,
        pageWidth: 29.7,
        pageHeight: 20.9818,
        pageRows: 1,
        pageColumns: 1,
        badgeWidth: 29.7,
        badgeHeight: 20.9818,
        badgeScale: 1.0,
    },
    {
        name: "SCA Landscape Book 2x2",
        description: "2 rows of 2 columns of landscape badges and schedule for printing on a landscape A4 page",
        link: "./templates/SCA-book-landscape.html",
        isCertificate: false,
        pageWidth: 29.7,
        pageHeight: 20.9818,
        pageRows: 2,
        pageColumns: 2,
        badgeWidth: 29.7,
        badgeHeight: 20.9818,
        badgeScale: 0.5,
    },
    {
        name: "SCA Certificate",
        description: "Landscape certificates for all events",
        link: "./templates/SCA-certificate.html",
        isCertificate: true,
        pageWidth: 29.7,
        pageHeight: 20.9818,
        pageRows: 1,
        pageColumns: 1,
        badgeWidth: 29.7,
        badgeHeight: 20.9818,
        badgeScale: 1.0,
    }
]

// Settings
var settings = {
    // General settings
    template: 0,
    marginPercentage: 0.03,
    // Badge settings
    includeStaffing: true,
    includeStations: true,
    hideStaffOnlyAssignments: false,
    // Certificate settings
    certOrganiser: "Name",
    certRole: "WCA DELEGATE",
    certBorderTint: "#006400",
    certTextColor: "#006400",
    certPageColor: "#dfefdf",
} 

// Data storage

// The core WCIF file with all competition information
var wcif = undefined
// All child activities by activityId 
var activities = {}
// Raw background image data for name badges
var backgroundImage = ""

// Utility functions

// Convert a hexadecimal number to rgb components
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
}

// Set status text
const STATUS_MODE_INFO = 0;
const STATUS_MODE_WARN = 1;
const STATUS_MODE_ERROR = 2;
function setStatus(text, mode) {
    $("#status").removeClass();
    $("#status").text(text);
    if (mode == STATUS_MODE_WARN) {
        $("#status").addClass("warn");
    } else if (mode == STATUS_MODE_ERROR) {
        $("#status").addClass("error");
    } else {
        $("#status").addClass("info");
    }
}

// Template has been selected, chang settings and UI
function templateChanged(select) {
    settings.template = Number(select.value);
    $("#template-description").text(templates[settings.template].description);

    if (templates[settings.template].isCertificate) {
        $(".badge-only").hide();
        $(".certificate-only").show();
    } else {
        $(".badge-only").show();
        $(".certificate-only").hide();
    }
}

// Load a WCIF file from the user
function readWCIF(input) {
    // Get file
    let file = input.files[0]; 
    let fileReader = new FileReader(); 
    fileReader.readAsText(file); 
    fileReader.onload = function() {
        // Check WCIF
        try {
            wcif = JSON.parse(fileReader.result);
        } catch {
            setStatus("Invalid WCIF file provided: Couldn't parse JSON", STATUS_MODE_ERROR);
            return;
        }
        if (wcif == undefined) {
            setStatus("Invalid WCIF file provided: Couldn't parse JSON", STATUS_MODE_ERROR);
            return;
        }

        // Reorganise activity information
        activities = {}
        for (var v=0; v<wcif.schedule.venues.length; v++) {
            var venue = wcif.schedule.venues[v];
            for (var r=0; r<venue.rooms.length; r++) {
                var room = venue.rooms[r];
                for (var a=0; a<room.activities.length; a++) {
                    var activity = room.activities[a];

                    activities[activity.id] = {
                        parentActivityCode: activity.activityCode,
                        activityCode: activity.activityCode,
                        roundStartTime: activity.startTime,
                        roundEndTime: activity.endTime,
                        timezone: venue.timezone,
                    }

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

        setStatus("Loaded WCIF file", STATUS_MODE_INFO);
    }; 
    fileReader.onerror = function() {
        setStatus("Couldn't read WCIF file", STATUS_MODE_ERROR);
    }; 
}

// Read background image from user
function readBackground(input) {
    let file = input.files[0]; 
    let fileReader = new FileReader(); 
    fileReader.readAsDataURL(file); 
    fileReader.onload = function() {
        backgroundImage = fileReader.result;

        // Add background image css to style badges
        $("#background-image-style").remove()
        var backgroundImageStyle = $(`<style id='background-image-style'>.background-image {background-image:url('${backgroundImage}');}</style>`)
        $("body").append(backgroundImageStyle);

        setStatus("Updated background image", STATUS_MODE_INFO);
    }; 
    fileReader.onerror = function() {
        setStatus("Couldn't read image file", STATUS_MODE_ERROR);
    }; 
}

// The main generation function
// Creates documents from settings and data
function generate() {
    if (wcif == undefined) {
        setStatus("Cannot generate document: WCIF not provided yet", STATUS_MODE_ERROR);
        return;
    }

    // Name badges should only be for accepted people and in alphabetical order
    var persons = wcif.persons.filter((a) => {
        if (a.registration != null) {
            if (a.registration.status == "accepted") {
                return true;
            }
        }
        return false;
    })

    persons.sort((a,b) => {
        if (a.wcaId == null && b.wcaId != null) {
            return -1
        }
        if (a.wcaId != null && b.wcaId == null) {
            return 1
        }
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    });

    // Load template html
    var template = templates[settings.template];
    $("#template").load(template.link, function() {

        // Don't show template in main document
        $("#template").hide(); 

        // If certificate, we want to color adjust the border/background image
        if (template.isCertificate) {
            if (backgroundImage != "") {
                $(".wca-border").attr('src', backgroundImage);
            }

            var backgroundTint = hexToRgb(settings.certBorderTint);

            $("#border-filter-values").attr('values', `${backgroundTint.r/255} 0 0 0 0 0 ${backgroundTint.g/255} 0 0 0 0 0 ${backgroundTint.b/255} 0 0 0 0 0 1 0`);
        }

        // Create document
        var doc = $("#print-document");
        doc.empty();
        doc.css("width",`${template.pageWidth}cm`);
    
        // Show a warning if anything is wrong
        var warning = "";
        
        if (!template.isCertificate)
        {
            // Name badges

            // Keep track of pages and badges
            var index = 0;
            var badgeIndex = 0;

            while (true) {
                // New page required
                if (badgeIndex >= (template.pageRows * template.pageColumns)) {
                    if (index >= persons.length) {
                        break;
                    }
                    badgeIndex=0;
                }
        
                // Create a new page
                if (badgeIndex == 0) {
                    var newPage = $(`<div class='print-page' style='width:${template.pageWidth}cm;height:${template.pageHeight}cm'></div>`)
                    newPage.css("transform",`scale(${1.0 - settings.marginPercentage})`)
                    doc.append(newPage)
                }
                
                // Create a badge
                var badge = $('#badge-template').children().first().clone();
                badge.css("width",`${template.badgeWidth}cm`);
                badge.css("height",`${template.badgeHeight}cm`);
                badge.css("transform",`scale(${template.badgeScale})`)
                badge.css("transform-origin",`0% 0%`)
                badge.removeAttr("id");

                // Edit the badge with details
                badge.show();
                if (index >= persons.length) {
                    badge.find(".wca-name").text(" ");
                    badge.find(".wca-id").text(" ");
                    badge.find(".wca-comp-id").text("-");
                    badge.find(".wca-country").attr("src", "");
                    badge.find(".wca-country").hide();
                } else {
                    badge.find(".wca-name").text(persons[index].name);
                    if (persons[index].wcaId == null) {
                        badge.find(".wca-id").html("<b style='color:#D00000'>NEWCOMER</b>");
                    } else {
                        badge.find(".wca-id").text(persons[index].wcaId);
                    }
                    badge.find(".wca-comp-id").text(`${persons[index].registrantId}`);
                    badge.find(".wca-country").attr("src", `https://flagcdn.com/h80/${persons[index].countryIso2.toLowerCase()}.png`);
                }
                var by = Math.floor(badgeIndex / template.pageColumns);
                var bx = badgeIndex % template.pageRows

                // Place bade
                badge.css("top", `${by * template.badgeHeight * template.badgeScale}cm`)
                badge.css("left", `${bx * template.badgeWidth * template.badgeScale}cm`)
        
                if (bx == 0) {
                    badge.css("border-left","none");
                }
                if (bx == template.pageColumns-1) {
                    badge.css("border-right","none");
                }
                if (by == 0) {
                    badge.css("border-top","none");
                }
                if (by == template.pageRows-1) {
                    badge.css("border-bottom","none");
                }

                // If a schedule table exists, create a personal schedule for each day
                // This object holds all assignment information per event, combining staffing and competing 
                var personalSchedule = {}
                if (index < persons.length && badge.find(".wca-schedule").length > 0) {
                    for (var a=0; a<persons[index].assignments.length; a++) {
                        // Check for activity information
                        var assignment = persons[index].assignments[a];
                        var activity = activities[assignment.activityId];
                        if (activities[assignment.activityId] == undefined) {
                            warning = `Missing activity: ${assignment.activityId}`;
                            continue;
                        }

                        var startTime = moment(activity.roundStartTime).tz(activity.timezone); 
                        var endTime = moment(activity.roundEndTime).tz(activity.timezone);
                        var day = startTime.day();

                        // Create daily information if it doesn't exist
                        if (personalSchedule[day] == undefined) {
                            personalSchedule[day] = {
                                day: day,
                                sortTime: startTime.unix(),
                                assignments: {},
                                sortedAssignments: [],
                            }
                        }

                        var codes = activity.activityCode.split('-')
                        var event = codes[0]
                        var group = codes[2]

                        // Create assignment for activity if it doesn't exist
                        if (personalSchedule[day].assignments[activity.parentActivityCode] == undefined) {
                            personalSchedule[day].assignments[activity.parentActivityCode] = {
                                timeText: `${startTime.format("HH[<sup>]mm[</sup>]")} - ${endTime.format("HH[<sup>]mm[</sup>]")}`,
                                sortTime: startTime.unix(),
                                eventCode: event,
                                eventText: eventMap[event],
                                competing: -1,
                                stationNumber: null,
                                judging: [],
                            };
                        }
                        
                        // Add information to assignment
                        if (assignment.assignmentCode == "competitor") {
                            personalSchedule[day].assignments[activity.parentActivityCode].competing = group.substr(1);
                            personalSchedule[day].assignments[activity.parentActivityCode].stationNumber = assignment.stationNumber;
                        } else if (assignment.assignmentCode == "staff-judge") {
                            personalSchedule[day].assignments[activity.parentActivityCode].judging.push(group.substr(1));
                        } else {
                            warning = `Unhandled assignment code: ${assignment.assignmentCode}`;
                        }
                    }

                    // Sort daily schedules by start time
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

                    // Sort assignments within day by time they start
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

                    // Add header to schedule table
                    var table = badge.find(".wca-schedule").first();
                    var tableContent = "<tbody>";
                    tableContent += "<tr><td>Time</td><td>Event</td><td>Group</td>"
                    if (settings.includeStations) {
                        tableContent += "<td>Station</td>";
                    }
                    if (settings.includeStaffing) {
                        tableContent += "<td>Staff</td>";
                    }
                    tableContent += "</tr>";

                    // For each daily schedule
                    for (var i=0; i<sortedSchedule.length; i++) {   
                        // Add day header
                        tableContent += `<tr><td colspan="5" class="wca-schedule-header">${ weekDaysMap[sortedSchedule[i].day]}</td></tr>`

                        // For each assignment within the day
                        for (var j=0; j<sortedSchedule[i].sortedAssignments.length; j++) {   
                            var assignment = sortedSchedule[i].sortedAssignments[j];

                            // If the competitor isn't competing, and we don't show staffing or don't want to show staff only roles in a round
                            // Then don't show this assignment   
                            if (assignment.competing == -1 && (!settings.includeStaffing || settings.hideStaffOnlyAssignments)) {
                                continue
                            }

                            // Determine staffing role text
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

                            // Determine text for assignment entry
                            var eventIcon = `<i class="cubing-icon icon event-${assignment.eventCode}"></i>`

                            var competingGroup = assignment.competing;
                            if (assignment.competing == -1 && settings.includeStaffing) {
                                competingGroup = "-";
                            }

                            // Add assignment to schedule
                            tableContent += `<tr><td>${assignment.timeText}</td><td>${eventIcon} ${assignment.eventText}</td><td>${competingGroup}</td>`
                            if (settings.includeStations) {
                                if (assignment.competing == -1) {
                                tableContent += `<td>-</td>`;
                                } else if (assignment.stationNumber == null) {
                                    tableContent += `<td>any</td>`;
                                } else {
                                    tableContent += `<td>${assignment.stationNumber}</td>`;
                                }
                            }
                            if (settings.includeStaffing) {
                                tableContent += `<td>${roleText}</td>`;
                            }
                            tableContent += "</tr>";
                        }
                    }
                    tableContent += "</tbody>";
                    table.append(tableContent);
                }

                // Finally add badge to page
                var page = doc.find(".print-page").last();
                page.append(badge);

                badgeIndex+=1;
                index+=1;
            }
        } else {
            // Generate certificate

            // Get date text
            var certDate = moment(wcif.schedule.startDate).add(wcif.schedule.numberOfDays-1, 'days')
            certDate = certDate.format("D MMMM Y")

            // For each event and a blank
            for (var e=0; e<wcif.events.length+1; e++) {

                // Get event specific text
                var eventText = "";
                var resultPrefixText = "";
                if (e != wcif.events.length) {
                    eventText = eventMap[wcif.events[e].id];
                    resultPrefixText = eventFormatMap[wcif.events[e].rounds[wcif.events[e].rounds.length - 1].format];
                    if (wcif.events[e].id == "333mbf") {
                        resultPrefixText = multiblindFormatText;
                    }
                    if (wcif.events[e].id == "333fm") {
                        resultPrefixText = fewestMovesFormatText;
                    }
                }

                // Create first, second and third certificates for events
                for (var p=2; p>=0; p--) {    
                    // Create page
                    var newPage = $(`<div class='print-page' style='width:${template.pageWidth}cm;height:${template.pageHeight}cm'></div>`)
                    newPage.css("transform",`scale(${1.0 - settings.marginPercentage})`)
                    doc.append(newPage)

                    // Determine place specific text
                    var placeText = "Awarded to:";
                    if (e != wcif.events.length) {
                        placeText = placeMap[p];
                    }

                    // Create certificate
                    var cert = $('#badge-template').children().first().clone();
                    cert.css("background-color", settings.certPageColor);
                    cert.css("width",`${template.badgeWidth}cm`);
                    cert.css("height",`${template.badgeHeight}cm`);
                    cert.css("top", `0cm`)
                    cert.css("left", `0cm`)
                    cert.removeAttr("id");
                    cert.show();

                    // Modify shown text
                    cert.find(".wca-comp-name").text(wcif.name);
                    cert.find(".wca-event").text(eventText);
                    cert.find(".wca-place").text(placeText);
                    cert.find(".wca-result-prefix").text(resultPrefixText);
                    cert.find(".wca-date").text(certDate);
                    cert.find(".wca-sig-name").text(settings.certOrganiser);
                    cert.find(".wca-sig-role").text(settings.certRole);

                    // Modify color of elements
                    cert.find(".wca-comp-name").css("color", settings.certTextColor);
                    cert.find(".wca-event").css("color", settings.certTextColor);
                    cert.find(".wca-place").css("color", settings.certTextColor);
                    cert.find(".wca-result-prefix").css("color", settings.certTextColor);
                    cert.find(".date").css("color", settings.certTextColor);
                    cert.find(".line-left").css("background-color", settings.certTextColor);
                    cert.find(".line-right").css("background-color", settings.certTextColor);
                    cert.find(".wca-sig-role").css("color", settings.certTextColor);
                    
                    // Add cert to page
                    var page = doc.find(".print-page").last();
                    page.append(cert);

                    // Only need one page for empty certificate
                    if (e == wcif.events.length) {
                        break;
                    }
                }
            }
        }

        // Allow document to be printed
        $("#print-button").prop("disabled", false);

        // Preview the document
        preview();
        $("#document-preview").css("height", $("#document-preview").innerWidth() * (template.pageHeight / template.pageWidth));
        
        // Shown any warnings flagged
        if (warning == "") {
            setStatus("Generated and displaying document preview", STATUS_MODE_INFO);
        } else {
            setStatus(warning, STATUS_MODE_WARN);
        }
    });
}

// Copy document to preview view
function preview() {
    var headHtml = ""
    headHtml += '<link rel="stylesheet" type="text/css" href="./style.css">';
    headHtml += '<link rel="stylesheet" type="text/css" href="./cubingIcons.css">';
    headHtml += '<link rel="stylesheet" type="text/css" href="./print.css">';

    var bodyHtml = ""
    bodyHtml += $("#badge-template-style").prop('outerHTML')
    if ($("#background-image-style").prop('outerHTML') != undefined) {
        bodyHtml += $("#background-image-style").prop('outerHTML');
    }
    if ($("#badge-svg-filter").prop('outerHTML') != undefined) {
        bodyHtml += $("#badge-svg-filter").prop('outerHTML');
    }

    $("#print-document").show();
    bodyHtml += $("#print-document").prop('outerHTML');
    $("#print-document").hide();

    bodyHtml += '<script src="./jquery.min.js"></script>';
    bodyHtml += '<script src="./document.js"></script>';
    bodyHtml += '<script>$(document).ready(function () { fixNameText() });</script>';

    $('#document-preview').contents().find('head').html(headHtml)
    $('#document-preview').contents().find('body').html(bodyHtml)
    $('#document-preview').show();
}

// Print generated preview
function print() {
    var printwin = window.open("");

    printwin.document.open();
    printwin.document.write('<html><head><link rel="stylesheet" type="text/css" href="./style.css">');
    printwin.document.write('<link rel="stylesheet" type="text/css" href="./cubingIcons.css">');
    printwin.document.write('<link rel="stylesheet" type="text/css" href="./print.css"></head><body>');
    printwin.document.write($("#badge-template-style").prop('outerHTML'));
    if ($("#background-image-style").prop('outerHTML') != undefined) {
        printwin.document.write($("#background-image-style").prop('outerHTML'));
    }    
    if ($("#badge-svg-filter").prop('outerHTML') != undefined) {
        printwin.document.write($("#badge-svg-filter").prop('outerHTML'));
    }
    $("#print-document").show();
    printwin.document.write($("#print-document").prop('outerHTML'));
    $("#print-document").hide();

    printwin.document.write('<script src="./jquery.min.js"></script>');
    printwin.document.write('<script src="./document.js"></script>');
    printwin.document.write(`<script>
    $(document).ready(function() {
        fixNameText();
        setTimeout(function() {
            window.print(); 
            window.stop(); 
            window.close(); 
        }, 500);
    });
    </script>`);
    printwin.document.write('</body></html>');
    printwin.document.close();
}

$(document).ready(function () {
    // Setup template dropdown
    var option = '';
    for (var i=0;i<templates.length;i++) {
        if (!templates[i].isCertificate) {
            option += '<option value="' + i + '">' + templates[i].name + '</option>';
        }
    }
    option += '<option disabled>──────────</option>'
    for (var i=0;i<templates.length;i++) {
        if (templates[i].isCertificate) {
            option += '<option value="' + i + '">' + templates[i].name + '</option>';
        }
    }
    $('#select-template').html(option);
    $('#select-template').val(String(settings.template));
    $("#template-description").text(templates[settings.template].description);

    $(".certificate-only").hide();

    $("#document-preview").hide();
    $("#print-document").hide();

    // Only tested to work on chromium web browsers
    if (navigator.userAgent.indexOf('Chrome') == -1) {
        alert("Printing has only been tested on Google Chrome and Microsoft Edge. I highly recommend you use either or your final printout may be incorrect")
    }
});
