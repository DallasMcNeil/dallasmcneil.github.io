
const A4L_WIDTH = 297
const A4L_HEIGHT = 210
const A6L_WIDTH = 148.5
const A6L_HEIGHT = 105
const A7L_WIDTH = 105
const A7L_HEIGHT = 74.25
const A7P_WIDTH = 74.25
const A7P_HEIGHT = 105

function MMtoPDF(mm) { return (mm*72.0/25.4)}

// Draw a name with support for non-latin unicode characters in brackets
// e.g text = "Latin Name (LocalName)"
// x,y,w,h specifies box for text to be located in
// align specifies if text should be left aligned or centred within box
function DrawName(doc, text, align, x, y, w, h) {
    // Determine names
    const [, latinName, localName] = text.match(/(.+)\s*[(（](.+)[)）]/) || [null, text, null];

    var fontSize = h*2.2
    doc.saveGraphicsState();

    if (localName && settings.includeLocalNames) {
        // Need to handle special local name
        var localFont = DetermineFont(localName)
        console.log(`Local name ${localName} with font ${localFont}`)

        // Find lengths of all text componenets
        doc.setFont("NotoSans-Bold")
        doc.setFontSize(fontSize);
        var length1 = doc.getTextWidth(`${latinName} (`);
        var length3 = doc.getTextWidth(`)`);

        doc.setFont(localFont)
        var length2 = doc.getTextWidth(`${localName}`);
        
        // Padding required if text will be centred within box
        var xPadding = Math.max(0, (w - (length1 + length2 + length3)) / 2)
        if (align == "left") {
            xPadding = 0;
        }

        // Horizontal scaling required to fit within box
        var horizontalScale = Math.min(1, w / (length1 + length2 + length3));

        // Draw text components
        doc.setFont("NotoSans-Bold")
        doc.text(`${latinName} (`, x + xPadding, y, {
            align:"left",
            horizontalScale: horizontalScale,
        });
        doc.text(`)`, x + xPadding + ((length1 + length2) * horizontalScale), y, {
            align:"left",
            horizontalScale: horizontalScale,
        });
        
        doc.setFont(localFont)
        doc.text(`${localName}`, x + xPadding + (length1 * horizontalScale), y, {
            align:"left",
            horizontalScale: horizontalScale,
        });

    } else {
        // Just latin text to be drawn
        doc.setFont("NotoSans-Bold")
        doc.setFontSize(fontSize);
        var textWidth = doc.getTextWidth(latinName);
        var horizontalScale = Math.min(1, w / textWidth);
        if (horizontalScale == 1 && align == "center") {
            doc.text(latinName, (w/2) + x, y, {
                align:"center"
            });
        } else {
            doc.text(latinName, x, y, {
                align:"left",
                horizontalScale: horizontalScale,
            });
        }
    }
    doc.restoreGraphicsState();
}

// Draw a box with text in it
// x,y,w,h specifies box
// align specifies if text should be left aligned or centred within box
// fillColor is an optional fill color in box
// icon is an optional WCA event code that will be drawn in left of box
function DrawTextBox(doc, text, align, x, y, w, h, fillColor=[255,255,255], icon="") {
    doc.saveGraphicsState();

    // Draw box
    doc.setLineWidth(0.1);
    doc.setDrawColor(128,128,128);
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    doc.rect(x,y,w,h, "FD");

    // Determine spacing for text
    var fontSize = h * 2.2;
    var xPadding = h*0.1;
    var yPadding = h*0.78;
    var xPaddingIcon = xPadding;
    var yPaddingIcon = h*0.85;
    if (icon) {
        xPadding += h*1
    }

    // Draw the text
    doc.setFontSize(fontSize);
    var textWidth = doc.getTextWidth(text) + (xPadding*2);
    var horizontalScale = Math.min(1, w / textWidth);
    if (align == "left") {
        doc.text(text, x + xPadding, y + yPadding, {
            align:"left",
            horizontalScale: horizontalScale,
        });
    } else if (align == "center") {
        doc.text(text, x + (w/2), y + yPadding,  {
            align:"center",
            horizontalScale: horizontalScale,
        });
    }

    // Draw the icon
    if (icon != "") {
        doc.setFont("cubing-icons")
        doc.text(eventCharacters[icon], x + xPaddingIcon, y + yPaddingIcon, {
            align:"left",
            horizontalScale: 1,
        });
    }

    doc.restoreGraphicsState();
}

// Draws an entire A6 landscape name badge
function AddLandscapeNameBadge(doc, index, isA4 = false, tx = 0, ty = 0) {
    // ============================
    // Information about competitor
    // ============================

    var isBlank = index >= persons.length;
    var name = "";
    var wcaid = null;
    var compid = "-";
    var countryCode = "";
    var personalSchedule = {}

    if (!isBlank) {
        name = persons[index].name;
        wcaid = persons[index].wcaId;
        compid = persons[index].registrantId;
        countryCode = persons[index].countryIso2.toLowerCase();

        // If a schedule table exists, create a personal schedule for each day
        // This object holds all assignment information per event, combining staffing and competing 
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
                    timeText: `${startTime.format("HH[:]mm")} - ${endTime.format("HH[:]mm")}`,
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
    }
    // ============
    // Create badge
    // ============
    
    // Front name side
    {
        doc.saveGraphicsState();

        // Translate so we are in a landscape A7 space to layout name side
        if (isA4) {
            doc.setCurrentTransformationMatrix(new doc.Matrix(1, 0, 0, 1, MMtoPDF(tx), MMtoPDF(ty)));
            doc.setCurrentTransformationMatrix(new doc.Matrix(0, -1, 1, 0, 0, 0));
            doc.setCurrentTransformationMatrix(new doc.Matrix(1, 0, 0, 1, MMtoPDF(-A7L_WIDTH*2), MMtoPDF(-61.5)));
        } else {
            doc.setCurrentTransformationMatrix(new doc.Matrix(0,-1, 1, 0, 121.3, A6L_WIDTH*2));
        }
        
        // Add background
        var backgroundRatio = $("#background-img").height() / $("#background-img").width();
        doc.addImage($("#background-img")[0], "PNG", 0, 0, A7L_WIDTH, A7L_WIDTH * backgroundRatio, "background", "SLOW");

        // Place name, starting from bottom and adding extra lines on top for longer names
        DrawName(doc, name, "center", 5, 57, A7L_WIDTH - 10, 10)

        doc.setLineWidth(0.25);
        doc.setDrawColor(0,0,0);
        doc.line(20, 59, A7L_WIDTH - 20, 59);

        // Place WCA ID
        doc.setFont("NotoSans-Regular")
        doc.setFontSize(13);
        
        if (!isBlank) {
            if (wcaid == null) {
                doc.setTextColor(196,0,0);
                doc.text("NEWCOMER", A7L_WIDTH/2, 64, {
                    align:"center",
                });
            } else {
                doc.text(wcaid, A7L_WIDTH/2, 64, {
                    align:"center",
                });
            }
        }
        doc.setTextColor(0,0,0);

        // Add logos
        var wcaRatio = $("#wca-img").width() / $("#wca-img").height();
        doc.addImage($("#wca-img")[0], "PNG", 3, A7L_HEIGHT - 13, 10 * wcaRatio, 10, "wca", "SLOW");

        var orgRatio = $("#org-img").width() / $("#org-img").height();
        doc.addImage($("#org-img")[0], "PNG", A7L_WIDTH - (10 * orgRatio) - 3, A7L_HEIGHT - 13, 10 * orgRatio, 10, "org", "SLOW");

        // Add country flag
        if (!isBlank) {
            var flagRatio = $(`#${countryCode}-flag`).width() / $(`#${countryCode}-flag`).height();
            var flagWidth = flagRatio * 5;
            doc.addImage($(`#${countryCode}-flag`)[0], "PNG", (A7L_WIDTH - flagWidth) / 2, A7L_HEIGHT - 8, flagWidth, 5, `${countryCode}-flag`, "SLOW");

            doc.setLineWidth(0.1);
            doc.setDrawColor(0,0,0);
            doc.rect((A7L_WIDTH - flagWidth) / 2, A7L_HEIGHT - 8, flagWidth, 5);
        }

        doc.restoreGraphicsState();
    }

    // Schedule side
    {
        doc.saveGraphicsState();
        
        doc.setCurrentTransformationMatrix(new doc.Matrix(1, 0, 0, 1, MMtoPDF(tx), MMtoPDF(ty)));

        // Place name
        DrawName(doc, name, "left", 3, 7, A7P_WIDTH - 12, 4)
        
        // Place registration id
        doc.setFont("NotoSans-Regular")
        doc.setFontSize(5);
        doc.text(`${compid}`, A7P_WIDTH - 5, 5, {
            align:"center",
        });

        // Place schedule
        const TIME_COL = 18;
        const EVENT_COL = 25;
        const GROUP_COL = 6;
        const STATION_COL = 6;
        const STAFF_COL = 13;

        var startCol = 3;
        var tableWidth = TIME_COL + EVENT_COL + GROUP_COL + STATION_COL + STAFF_COL
        if (!settings.includeStations) {
            startCol += (STATION_COL / 2)
            tableWidth -= STATION_COL
        }
        if (!settings.includeStaffing) {
            startCol += (STAFF_COL / 2)
            tableWidth -= STAFF_COL
        }
            
        var row = 10;
        var column = startCol;
        var height = 2.5;
        if (!isBlank) {
            // Header
            DrawTextBox(doc, "Time", "left", column, row, TIME_COL, height);
            column+=TIME_COL;
            DrawTextBox(doc, "Event", "left", column, row, EVENT_COL, height);
            column+=EVENT_COL;
            DrawTextBox(doc, "Group", "left", column, row, GROUP_COL, height);
            column+=GROUP_COL;
            if (settings.includeStations) {
                DrawTextBox(doc, "Station", "left", column, row, STATION_COL, height);
                column+=STATION_COL;
            }
            if (settings.includeStaffing) {
                DrawTextBox(doc, "Staff Groups", "left", column, row, STAFF_COL, height);
                column+=STAFF_COL;
            }
            row += height;
            column = startCol;

            // For each daily schedule
            for (var i=0; i<sortedSchedule.length; i++) {   
                // Add day header
                height = 4;
                DrawTextBox(doc, weekDaysMap[sortedSchedule[i].day], "center", column, row, tableWidth, height);
                row += height;

                // For each assignment within the day
                var alternatingColors = 0;
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
                            roleText += "Judge:"
                        }
                        if (k == 0) {
                            roleText += ` ${assignment.judging[k]}`
                        } else {
                            roleText += `, ${assignment.judging[k]}`
                        }
                    }

                    var competingGroup = assignment.competing;
                    if (assignment.competing == -1 && settings.includeStaffing) {
                        competingGroup = "-";
                    }

                    // Add assignment to schedule
                    var stationText = "-"
                    if (assignment.competing == -1) {
                        stationText = `-`;
                    } else if (assignment.stationNumber == null) {
                        stationText = `any`;
                    } else {
                        stationText = `${assignment.stationNumber}`;
                    }
                    
                    var fillColor = [255,255,255]
                    if ((alternatingColors%2) == 0) {
                        fillColor = [220,220,220]
                    }
                    alternatingColors++
                    
                    var height = 3.5;
                    DrawTextBox(doc, assignment.timeText, "left",  column, row, TIME_COL, height, fillColor);
                    column += TIME_COL;
                    DrawTextBox(doc, assignment.eventText, "left",  column, row, EVENT_COL, height, fillColor, assignment.eventCode);
                    column += EVENT_COL;
                    DrawTextBox(doc, `${competingGroup}`, "left",  column, row, GROUP_COL, height, fillColor);
                    column += GROUP_COL;
                    if (settings.includeStations) {
                        DrawTextBox(doc, stationText, "left",  column, row, STATION_COL, height, fillColor);
                        column += STATION_COL;
                    }
                    if (settings.includeStaffing) {
                        DrawTextBox(doc, roleText, "left",  column, row, STAFF_COL, height, fillColor);
                        column += STAFF_COL;
                    }
                    row += height;
                    column = startCol;
                }
            }
        }

        // WCA Live QR code is assumed to be square
        // We don't draw it if the schedule extended down too far
        if (settings.showWcaLiveQrCode && row < A7P_HEIGHT - 20) {
            doc.addImage($("#wca-live-qrcode-img")[0], "PNG", A7P_WIDTH - 18, A7P_HEIGHT - 18, 15, 15, "wca-live-qrcode", "SLOW");
            doc.setFontSize(8);
            doc.setFont("NotoSans-Regular")
            var wcaLiveLines = doc.splitTextToSize("Live results and full schedule available on WCA Live -", A7P_WIDTH - 30);
            wcaLiveLines.push("Good luck and have fun!")
            for (var i=0; i<wcaLiveLines.length; i++) {
                doc.text(wcaLiveLines[i], A7P_WIDTH - 20, A7P_HEIGHT - 13.5 + (i*4), {
                    align:"right",
                });
            }    
        }

        doc.setLineWidth(0.25);
        doc.setDrawColor(128, 128, 128);
        doc.line(A6L_WIDTH / 2, 0, A6L_WIDTH / 2, A6L_HEIGHT);

        doc.restoreGraphicsState();
    }
}

// Draws an entire A6 landscape name badge
function AddCertificate(doc, eventIndex, place, dateText) {

    // Get event specific text
    var eventText = "";
    var resultPrefixText = "";
    if (eventIndex != wcif.events.length) {
        eventText = eventMap[wcif.events[eventIndex].id];
        resultPrefixText = eventFormatMap[wcif.events[eventIndex].rounds[wcif.events[eventIndex].rounds.length - 1].format];
        if (wcif.events[e].id == "333mbf") {
            resultPrefixText = multiblindFormatText;
        }
        if (wcif.events[e].id == "333fm") {
            resultPrefixText = fewestMovesFormatText;
        }
    }

    // Determine place specific text
    var placeText = "Awarded to:";
    if (eventIndex != wcif.events.length) {
        placeText = placeMap[place];
    }

    
    // // Create certificate
    // var cert = $('#badge-template').children().first().clone();
    // cert.css("background-color", settings.certPageColor);
    // cert.css("width",`${template.badgeWidth}cm`);
    // cert.css("height",`${template.badgeHeight}cm`);
    // cert.css("top", `0cm`)
    // cert.css("left", `0cm`)
    // cert.removeAttr("id");
    // cert.show();

    // // Modify shown text
    // cert.find(".wca-comp-name").text(wcif.name);
    // cert.find(".wca-event").text(eventText);
    // cert.find(".wca-place").text(placeText);
    // cert.find(".wca-result-prefix").text(resultPrefixText);
    // cert.find(".wca-date").text(certDate);
    // cert.find(".wca-sig-name").text(settings.certOrganiser);
    // cert.find(".wca-sig-role").text(settings.certRole);

    // // Modify color of elements
    // cert.find(".wca-comp-name").css("color", settings.certTextColor);
    // cert.find(".wca-event").css("color", settings.certTextColor);
    // cert.find(".wca-place").css("color", settings.certTextColor);
    // cert.find(".wca-result-prefix").css("color", settings.certTextColor);
    // cert.find(".date").css("color", settings.certTextColor);
    // cert.find(".line-left").css("background-color", settings.certTextColor);
    // cert.find(".line-right").css("background-color", settings.certTextColor);
    // cert.find(".wca-sig-role").css("color", settings.certTextColor);
    
    // // Add cert to page
    // var page = doc.find(".print-page").last();
    // page.append(cert);

    
    // ==================
    // Create certificate
    // ==================
    
    doc.saveGraphicsState();

    // Add background
    var backgroundRatio = $("#background-img").height() / $("#background-img").width();
    doc.addImage($("#background-img")[0], "PNG", 0, 0, A7L_WIDTH, A7L_WIDTH * backgroundRatio, "background", "SLOW");

    // Place name, starting from bottom and adding extra lines on top for longer names
    DrawName(doc, name, "center", 5, 57, A7L_WIDTH - 10, 10)

    doc.setLineWidth(0.25);
    doc.setDrawColor(0,0,0);
    doc.line(20, 59, A7L_WIDTH - 20, 59);

    // Place WCA ID
    doc.setFont("NotoSans-Regular")
    doc.setFontSize(13);
    
    if (persons[index].wcaId == null) {
        doc.setTextColor(196,0,0);
        doc.text("NEWCOMER", A7L_WIDTH/2, 64, {
            align:"center",
        });
    } else {
        doc.text(wcaid, A7L_WIDTH/2, 64, {
            align:"center",
        });
    }
    doc.setTextColor(0,0,0);

    // Add logos
    var wcaRatio = $("#wca-img").width() / $("#wca-img").height();
    doc.addImage($("#wca-img")[0], "PNG", 3, A7L_HEIGHT - 13, 10 * wcaRatio, 10, "wca", "SLOW");

    var orgRatio = $("#org-img").width() / $("#org-img").height();
    doc.addImage($("#org-img")[0], "PNG", A7L_WIDTH - (10 * orgRatio) - 3, A7L_HEIGHT - 13, 10 * orgRatio, 10, "org", "SLOW");

    // Add country flag
    var flagRatio = $(`#${countryCode}-flag`).width() / $(`#${countryCode}-flag`).height();
    var flagWidth = flagRatio * 5;
    doc.addImage($(`#${countryCode}-flag`)[0], "PNG", (A7L_WIDTH - flagWidth) / 2, A7L_HEIGHT - 8, flagWidth, 5, `${countryCode}-flag`, "SLOW");

    doc.setLineWidth(0.1);
    doc.setDrawColor(0,0,0);
    doc.rect((A7L_WIDTH - flagWidth) / 2, A7L_HEIGHT - 8, flagWidth, 5);

    doc.restoreGraphicsState();
}

var persons;
function MakeDocument() {

    if (wcif == undefined) {
        SetStatus("Cannot generate document: WCIF not provided yet", STATUS_MODE_ERROR);
        return false;
    }

    //let regionNames = new Intl.DisplayNames(['en'], {type: 'region'});

    // Name badges should only be for accepted people and in alphabetical order
    persons = wcif.persons.filter((a) => {
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

    var template = templates[settings.template];
    template.generationFunction();

    return true;
}

var globalDoc;
function MakeA6LandscapeBadges() {
    // Name badges
    globalDoc = new jspdf.jsPDF({
        orientation: 'l',
        unit:'mm',
        format:'a6',
    });

    // Keep track of pages and badges
    var index = 0;
    while (true) {
        if (index >= (persons.length + 1)) {
            break;
        }

        // Create a new page
        if (index != 0) {
            globalDoc.addPage("a6", "l");
        }
        
        // Add badge
        AddLandscapeNameBadge(globalDoc, index, 0, 0);

        index+=1;
    }

    return true;
}


function MakeA4LandscapeBadges() {
    // Name badges
    globalDoc = new jspdf.jsPDF({
        orientation: 'l',
        unit:'mm',
        format:'a4',
    });

    // Keep track of pages and badges
    var index = 0;
    while (true) {
        if (index >= (persons.length + 1)) {
            globalDoc.saveGraphicsState();
            globalDoc.setLineWidth(0.25);
            globalDoc.setLineDash([1]);
            globalDoc.setDrawColor(128, 128, 128);
            globalDoc.line(A4L_WIDTH / 2, 0, A4L_WIDTH / 2, A4L_HEIGHT);
            globalDoc.line(0, A4L_HEIGHT / 2, A4L_WIDTH, A4L_HEIGHT / 2);
            globalDoc.restoreGraphicsState();
            break;
        }

        // Create a new page
        if (index != 0 && (index%4) == 0) {
            globalDoc.saveGraphicsState();
            globalDoc.setLineWidth(0.25);
            globalDoc.setLineDash([1]);
            globalDoc.setDrawColor(128, 128, 128);
            globalDoc.line(A4L_WIDTH / 2, 0, A4L_WIDTH / 2, A4L_HEIGHT);
            globalDoc.line(0, A4L_HEIGHT / 2, A4L_WIDTH, A4L_HEIGHT / 2);
            globalDoc.restoreGraphicsState();
            globalDoc.addPage("a4", "l");
        }
        
        globalDoc.saveGraphicsState();

        // Add badge
        // Translate badge to different spot
        AddLandscapeNameBadge(globalDoc, index, true, (index & 0x1) * A4L_WIDTH/2, (index & 0x2) * -A4L_HEIGHT/4);

        globalDoc.restoreGraphicsState();

        index+=1;
    }

    return true;
}

function MakeCertificates() {
    
    // Convert and tint background
    globalDoc = new jspdf.jsPDF({
        orientation: 'l',
        unit:'mm',
        format:'a4',
    });

    var backgroundData = doc.extractImageFromDataUrl(defaultCertBackground)
    console.log(backgroundData);

    // Generate certificate

    // // If certificate, we want to color adjust the border/background image
    // if (template.isCertificate) {
    //     if (backgroundImage != "") {
    //         $(".wca-border").attr('src', backgroundImage);
    //     }

    //     var backgroundTint = hexToRgb(settings.certBorderTint);

    //     $("#border-filter-values").attr('values', `${backgroundTint.r/255} 0 0 0 0 0 ${backgroundTint.g/255} 0 0 0 0 0 ${backgroundTint.b/255} 0 0 0 0 0 1 0`);
    // }

    // Get date text
    var certDate = moment(wcif.schedule.startDate).add(wcif.schedule.numberOfDays-1, 'days')
    certDate = certDate.format("D MMMM Y")

    // For each event and a blank
    for (var e=0; e<wcif.events.length+1; e++) {

        // Create first, second and third certificates for events
        for (var p=2; p>=0; p--) {    
            // Create a new page
            if (e != 0 || p != 0) {
                globalDoc.addPage("a4", "l");
            }

            AddCertificate(globalDoc, e, p, certDate);

            // Only need one page for empty certificate
            if (e == wcif.events.length) {
                break;
            }
        }
    }

    return true;
}