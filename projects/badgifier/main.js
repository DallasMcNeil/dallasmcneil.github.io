
var templates = [
    {
        name: "Landscape Book",
        description: "Individual landscape badges and schedule for printing on A6 pages",
        generationFunction: MakeA6LandscapeBadges,
        isCertificate: false,
        newcomersFirst: true,
        placeholderImage: "images/a7-placeholder.png",
        imageDescription: "Background images should be landscape A7 size (105mm x 74.25mm) or 1241px x 877px is recommended. The top 50mm (591px) is available for your competitions logo. The bottom 24.25mm (286px) is reserved for badge content and this part of your image should be very simple or blank. PNG or JPEG image formats are recommended.",
    },
    {
        name: "Landscape Book 2x2",
        description: "4 landscape badges and schedules for printing on A4 pages",
        generationFunction: MakeA4LandscapeBadges,
        isCertificate: false,
        newcomersFirst: true,
        placeholderImage: "images/a7-placeholder.png",
        imageDescription: "Background images should be landscape A7 size (105mm x 74.25mm) or 1241px x 877px is recommended. The top 50mm (591px) is available for your competitions logo. The bottom 24.25mm (286px) is reserved for badge content and this part of your image should be very simple or blank. PNG or JPEG image formats are recommended.",
    },
    {
        name: "Portrait Book",
        description: "Individual portrait badges and schedule for printing on A6 pages",
        generationFunction: MakeA6PortraitBadges,
        isCertificate: false,
        newcomersFirst: true,
        placeholderImage: "images/a7p-placeholder.png",
        imageDescription: "Background images should be portrait A7 size (74.25mm x 105mm) or 877px x 1241px is recommended. The top 64mm (756px) is available for your competitions logo. The bottom 41mm (485px) is reserved for badge content and this part of your image should be very simple or blank. PNG or JPEG image formats are recommended.",
    },
    {
        name: "Portrait Book 2x2",
        description: "4 portrait badges and schedules for printing on A4 pages",
        generationFunction: MakeA4PortraitBadges,
        isCertificate: false,
        newcomersFirst: true,
        placeholderImage: "images/a7p-placeholder.png",
        imageDescription: "Background images should be portrait A7 size (74.25mm x 105mm) or 877px x 1241px is recommended. The top 64mm (756px) is available for your competitions logo. The bottom 41mm (485px) is reserved for badge content and this part of your image should be very simple or blank. PNG or JPEG image formats are recommended.",
    },
    {
        name: "Participation Certificates",
        description: "Certificate for each competitor for individual A4 pages",
        generationFunction: MakeParticipationCertificates,
        isCertificate: false,
        newcomersFirst: false,
        placeholderImage: "images/participation-cert.png",
        imageDescription: "Background images should be portrait A4 size (210mm x 297mm) or 2480px x 3508px is recommended. The image should include your competition logo at the top, all organization logos, signatures and background/border elements. PNG or JPEG image formats are recommended.",
    },
    {
        name: "Podium Certificates",
        description: "Landscape certificates for all events",
        generationFunction: MakeCertificates,
        isCertificate: true,
        newcomersFirst: false,
    },
]

// Settings
var settings = {
    // General settings
    template: 0,
    // Badge settings
    includeTimes: true,
    includeStaffing: false,
    includeStations: false,
    includeStages: false,
    includeLocalName: false,
    includeCompetitorId: false,
    hideStaffOnlyAssignments: false,
    showWcaLiveQrCode: true,
    customScheduleColors: false,
    customScheduleColorsCode: "",
    colorFromStage: false,
    // Certificate settings
    certOrganiser: "Name",
    certRole: "WCA DELEGATE",
    certBackgroundTint: "#006400",
    certPageColor: "#dfefdf",
    certTextColor: "#005400",
    certThinMargins: false,
} 

// Set status text
const STATUS_MODE_INFO = 0;
const STATUS_MODE_WARN = 1;
const STATUS_MODE_ERROR = 2;
function SetStatus(text, mode) {
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

var activities;
var wcif;
function GetActivities() {
    // Reorganise activity information
    activities = {}
    for (var v=0; v<wcif.schedule.venues.length; v++) {
        var venue = wcif.schedule.venues[v];
        for (var r=0; r<venue.rooms.length; r++) {
            var room = venue.rooms[r];
            for (var a=0; a<room.activities.length; a++) {
                var activity = room.activities[a];

                // Room color is a mix between room color and white for visibility
                var roomColor = HexToRgb(room.color);
                roomColor[0] = (255 + roomColor[0]) / 2;
                roomColor[1] = (255 + roomColor[1]) / 2;
                roomColor[2] = (255 + roomColor[2]) / 2;

                activities[activity.id] = {
                    parentActivityCode: activity.activityCode,
                    activityCode: activity.activityCode,
                    roundStartTime: activity.startTime,
                    roundEndTime: activity.endTime,
                    timezone: venue.timezone,
                    roomName: room.name, 
                    roomColor: roomColor, 
                }

                for (var c=0; c<activity.childActivities.length; c++) {
                    var childActivity = activity.childActivities[c];

                    activities[childActivity.id] = {
                        parentActivityCode: activity.activityCode,
                        activityCode: childActivity.activityCode,
                        roundStartTime: activity.startTime,
                        roundEndTime: activity.endTime,
                        timezone: venue.timezone,
                        roomName: room.name, 
                        roomColor: roomColor, 
                    }
                }
            }
        }
    }
}

// Load images of all the countries referenced in the WCIF
function LoadCountryFlags() {
    var flags = {}

    for (var person in wcif.persons) {
        var code = wcif.persons[person].countryIso2.toLowerCase();
        if (flags[code] == undefined) {
            flags[code] = true;
            var flagElement = $(`<img style="display: none;" id='${code}-flag' src='${getCountryFlag(code)}'/>`)
            $("#hidden-images").append(flagElement);
            console.log(`Added flag: ${code}`)
        }
    }
}

// Load a WCIF file from the user
function ReadWCIF(input) {
    // Get file
    let file = input.files[0]; 
    let fileReader = new FileReader(); 
    fileReader.readAsText(file); 
    fileReader.onload = function() {
        // Check WCIF
        try {
            wcif = JSON.parse(fileReader.result);
            $("#wcifFileLabel").text(file.name);

            GetActivities();
            LoadCountryFlags();
        } catch {
            SetStatus("Invalid WCIF file provided: Couldn't parse JSON", STATUS_MODE_ERROR);
            return;
        }
        if (wcif == undefined) {
            SetStatus("Invalid WCIF file provided: Couldn't parse JSON", STATUS_MODE_ERROR);
            return;
        }

        SetStatus("Loaded WCIF file", STATUS_MODE_INFO);
    }; 
    fileReader.onerror = function() {
        SetStatus("Couldn't read WCIF file", STATUS_MODE_ERROR);
    }; 
}

function UseDemoWCIF() {
    wcif = demoWcif;
    $("#wcifFileLabel").text("SouthAustralianOpen2022.json");
    GetActivities();
    LoadCountryFlags();
}


// Read badge background image from user
var hasReadBadgeBackgroundImage = false;
function ReadBadgeBackgroundImage(input) {
    let file = input.files[0]; 
    let fileReader = new FileReader(); 
    fileReader.readAsDataURL(file); 
    fileReader.onload = function() {
        $("#badge-img").attr("src", fileReader.result);
        $("#badgeBackgroundImgLabel").text(file.name);

        hasReadBadgeBackgroundImage = true;
        SetStatus("Updated badge background image", STATUS_MODE_INFO);
    }; 
    fileReader.onerror = function() {
        SetStatus("Couldn't read image file", STATUS_MODE_ERROR);
    }; 
}

// Read certificate background image from user
function ReadCertBackgroundImage(input) {
    let file = input.files[0]; 
    let fileReader = new FileReader(); 
    fileReader.readAsDataURL(file); 
    fileReader.onload = function() {
        $("#certificate-img").attr("src", fileReader.result);
        $("#certBackgroundImgLabel").text(file.name);

        SetStatus("Updated certificate background image", STATUS_MODE_INFO);
    }; 
    fileReader.onerror = function() {
        SetStatus("Couldn't read image file", STATUS_MODE_ERROR);
    }; 

    $("#cert-background-tint-input").data().colorpicker.setValue("#FFFFFF")
    $("#cert-page-color-input").data().colorpicker.setValue("#FFFFFF")
    $("#cert-text-color-input").data().colorpicker.setValue("#000000")
}

// Read organization image from user
function ReadOrganizationImage(input) {
    let file = input.files[0]; 
    let fileReader = new FileReader(); 
    fileReader.readAsDataURL(file); 
    fileReader.onload = function() {
        organizationImage = fileReader.result;

        // Add organization image css to style badges
        $("#org-img").attr("src",organizationImage);
        $("#orgLogoLabel").text(file.name);

        SetStatus("Updated organization image", STATUS_MODE_INFO);
    }; 
    fileReader.onerror = function() {
        SetStatus("Couldn't read image file", STATUS_MODE_ERROR);
    }; 
}

// Template has been selected, chang settings and UI
function TemplateChanged(select) {
    settings.template = Number(select.value);
    $("#template-description").text(templates[settings.template].description);
    
    if (templates[settings.template].isCertificate) {
        $(".badge-only").hide();
        $(".certificate-only").show();
    } else {
        $(".badge-only").show();
        $(".certificate-only").hide();
        if (!hasReadBadgeBackgroundImage) {
            $("#badge-img").attr("src", templates[settings.template].placeholderImage);
            $("#badge-image-description").text(templates[settings.template].imageDescription);
        }
    }
}

// Template has been selected, chang settings and UI
function UseCustomColorChanged() {
    if (settings.customScheduleColors) {
        $("#customColors").show();
    } else {
        $("#customColors").hide();
    }
}

function GenerateDocument() {
    SetStatus("Generating PDF...", STATUS_MODE_INFO);
    settings.customScheduleColorsCode = $("#customColorsCode").val();
    setTimeout(() => {
        try {
            var error = !MakeDocument();
            if (!error) {
                // Allow document to be printed
                $("#print-button").prop("disabled", false);

                var blob = globalDoc.output('blob')
                var blob_url = URL.createObjectURL(blob);
                $("#document-preview").attr("src", blob_url)
                $("#document-preview").show();
                
                SetStatus("PDF ready!", STATUS_MODE_INFO);
            }
        } catch (e) {
            console.error(e)
            $("#print-button").prop("disabled", true);
            SetStatus("PDF failed to generate", STATUS_MODE_ERROR);
        }
    }, 100);
}

function PrintDocument() {
    globalDoc.save("Badges.pdf");
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

    $("#cert-background-tint-input").colorpicker({
        color: settings.certBackgroundTint
    });
    $("#cert-page-color-input").colorpicker({
        color: settings.certPageColor
    });
    $("#cert-text-color-input").colorpicker({
        color: settings.certTextColor
    });

    UseCustomColorChanged();
    $("#customColorsCode").val(`// Input variables
// event: string; the event code (e.g '333', 'pyra')
// group: number; the group number, 1 or higher. If no group, then null
// room: string; the name of the stage/room
// station: number; the station number, 1 or higher. If no station, then null
// row: number; the row number in the schedule for each day, 0 or higher
// Output variable
// color: string; a hex color to set the background of the schedule row (e.g #FFB0B0 for a light red)

// Example; alternating groups between red and green (for two different stages)
// with some events in a side room (blue)

if (event == "333mbf" || event == "444bf" || event == "555bf") {
    color = "#B0B0FF" // Side room events, blue
} else if (group % 2 == 0) {
    color = "#FFB0B0" // Even groups, red
} else {
    color = "#B0FFB0" // Odd groups, green
}`);

});
